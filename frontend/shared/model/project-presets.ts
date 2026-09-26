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

export const BUILTIN_PROJECT_PRESETS: BuiltinProjectPreset[] = [
  {
    id: "builtin_ecom_refactor",
    name: "电商图批量重构",
    description: "项目图片按参考图文案重新设计排版为 1:1 电商主图（gpt-image-2 服务端批量生成）",
    systemPrompt: "",
    defaultModel: "gpt-image-2",
    defaultMCPToolNames: [
      "list_projects",
      "list_project_images",
      "ingest_project_images",
      "run_image_batch",
      "wait_image_batch",
      "archive_results_to_project",
    ],
    defaultSkillTitles: ["Ecommerce Image Style Refactor"],
  },
  {
    id: "builtin_ecom_compliance",
    name: "电商图违禁词检查",
    description: "项目图片视觉逐张读字，比对平台禁用医疗功效词，定向修复（glm-5.3-flash 视觉）",
    systemPrompt: "",
    defaultModel: "glm-5.3-flash",
    defaultMCPToolNames: [
      "list_projects",
      "list_project_images",
      "ingest_project_images",
      "run_vision_batch",
      "wait_vision_batch",
      "run_image_batch",
      "wait_image_batch",
      "archive_results_to_project",
    ],
    defaultSkillTitles: ["Ecommerce Image Compliance Fix"],
  },
];

export function isBuiltinPresetID(id: string): boolean {
  return id.startsWith("builtin_");
}

export function newProjectPresetID(): string {
  return "prjp_" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}
