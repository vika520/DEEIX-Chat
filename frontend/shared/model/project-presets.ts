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


// ---------------------------------------------------------------------------
// 系统内置预设：随应用代码固定，任何设置写入/清库都不影响。
// 工具与技能以"名称"声明，套用时由对话框按当前加载的清单解析成 ID。
// ---------------------------------------------------------------------------
export type BuiltinProjectPreset = {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  defaultModel: string;
  defaultMCPToolNames: string[];
  defaultSkillTitles: string[];
};

const ALL_PROJECT_MCP_TOOL_NAMES = [
  "list_recent_images",
  "run_image_batch",
  "wait_image_batch",
  "list_projects",
  "list_project_images",
  "ingest_project_images",
  "archive_results_to_project",
  "run_vision_batch",
  "wait_vision_batch",
  "get_current_project",
];

export const BUILTIN_PROJECT_PRESETS: BuiltinProjectPreset[] = [
  {
    id: "builtin_ecom_refactor",
    name: "电商图批量重构",
    description: "根据预设的 skill 对本项目图片进行批量电商主图重构设计。",
    systemPrompt: "根据预设的skill对本项目的图片进行批量重构设计",
    defaultModel: "glm-5.3-flash",
    defaultMCPToolNames: [...ALL_PROJECT_MCP_TOOL_NAMES],
    defaultSkillTitles: ["Ecommerce Image Style Refactor"],
  },
  {
    id: "builtin_ecom_compliance",
    name: "电商图违禁词检查",
    description: "根据预设的 skill 对本项目图片逐张检查医疗功效词并定向修复。",
    systemPrompt: "根据预设的skill对本项目的图片进行违禁词检查并修改",
    defaultModel: "glm-5.3-flash",
    defaultMCPToolNames: [...ALL_PROJECT_MCP_TOOL_NAMES],
    defaultSkillTitles: ["Ecommerce Image Compliance Fix"],
  },
];

export function isBuiltinPresetID(id: string): boolean {
  return id.startsWith("builtin_");
}

export function newProjectPresetID(): string {
  return "prjp_" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}
