"use client";

import { authedRequest } from "@/shared/api/authed-client";

// 项目配置预设：管理员维护的系统级固定预设（平台设置 project:presets，JSON 数组）。
// 普通用户只读，套用时仅填充表单草稿；删除项目不影响预设。
export type ProjectPreset = {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  defaultModel: string;
  mcpDefaultMode: "inherit" | "custom";
  defaultMCPToolIDs: number[];
  defaultSkillIDs: number[];
  defaultKnowledgeBaseIDs: string[];
  createdAt: number;
};

type PresetsPayload = { presets?: ProjectPreset[] };

export async function loadProjectPresets(accessToken: string): Promise<ProjectPreset[]> {
  const data = await authedRequest<PresetsPayload | null>(
    "/api/v1/settings/project-presets",
    { accessToken },
    true,
  ).catch(() => null);
  return Array.isArray(data?.presets) ? data.presets : [];
}

// 仅管理员可写（走 /admin/settings；普通用户调用会得到 403）。
export async function saveProjectPresets(accessToken: string, presets: ProjectPreset[]): Promise<void> {
  await authedRequest(
    "/api/v1/admin/settings",
    {
      accessToken,
      method: "PATCH",
      body: JSON.stringify({
        items: [{ namespace: "project", key: "presets", value: JSON.stringify(presets) }],
      }),
    },
    true,
  );
}

export function newProjectPresetID(): string {
  return "prjp_" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}
