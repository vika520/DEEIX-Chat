package upload

import (
	"archive/zip"
	"bytes"
	"context"
	"errors"
	"io"
	"strconv"
	"strings"
	"time"
)

// 批量打包限制：最多 200 个文件、总体积 512 MiB。
const (
	bulkArchiveMaxFiles      = 200
	bulkArchiveMaxTotalBytes = 512 << 20
)

var (
	ErrBulkArchiveTooManyFiles = errors.New("bulk archive: too many files (max 200)")
	ErrBulkArchiveTooLarge     = errors.New("bulk archive: total size exceeds limit")
	// ErrBulkArchiveFileUnavailable 选中文件不存在或不可读（可能已被删除）。
	ErrBulkArchiveFileUnavailable = errors.New("bulk archive: one or more selected files no longer exist")
)

// BulkArchiveFiles 将选中的文件打包为 ZIP（存储模式，不做二次压缩）。
func (s *Service) BulkArchiveFiles(ctx context.Context, userID uint, fileIDs []string) ([]byte, string, error) {
	if len(fileIDs) == 0 || len(fileIDs) > bulkArchiveMaxFiles {
		return nil, "", s.errInvalidFileReference()
	}
	seen := make(map[string]struct{}, len(fileIDs))
	nameUsed := make(map[string]int, len(fileIDs))
	total := int64(0)
	buf := bytes.NewBuffer(nil)
	zw := zip.NewWriter(buf)
	for _, rawID := range fileIDs {
		fileID := strings.TrimSpace(rawID)
		if fileID == "" {
			continue
		}
		if _, dup := seen[fileID]; dup {
			continue
		}
		seen[fileID] = struct{}{}
		result, err := s.OpenFileContent(ctx, userID, fileID)
		if err != nil {
			return nil, "", ErrBulkArchiveFileUnavailable
		}
		total += result.SizeBytes
		if total > bulkArchiveMaxTotalBytes {
			_ = result.Reader.Close()
			return nil, "", ErrBulkArchiveTooLarge
		}
		name := strings.TrimSpace(result.File.FileName)
		if name == "" {
			name = fileID
		}
		name = strings.ReplaceAll(strings.ReplaceAll(name, "/", "_"), "\\", "_")
		if n := nameUsed[name]; n > 0 {
			base, ext := name, ""
			if i := strings.LastIndex(name, "."); i >= 0 {
				base, ext = name[:i], name[i:]
			}
			name = base + "-" + strconv.Itoa(n+1) + ext
		}
		nameUsed[name]++
		header := &zip.FileHeader{Name: name, Method: zip.Store, Modified: result.ModTime}
		writer, err := zw.CreateHeader(header)
		if err != nil {
			_ = result.Reader.Close()
			return nil, "", err
		}
		if _, err := io.Copy(writer, result.Reader); err != nil {
			_ = result.Reader.Close()
			return nil, "", err
		}
		_ = result.Reader.Close()
	}
	if len(seen) == 0 {
		return nil, "", s.errInvalidFileReference()
	}
	if err := zw.Close(); err != nil {
		return nil, "", err
	}
	return buf.Bytes(), "deeix-files-" + time.Now().Format("20060102-150405") + ".zip", nil
}
