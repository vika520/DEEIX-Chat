"use client";

import { getUserSettings, patchUserSettings } from "@/shared/api/user-settings";

// 项目配置预设：独立于项目实体，存在用户设置里随账号云同步。
// 删除项目不影响预设；同名保存视为更新。
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

export const PROJECT_PRESETS_SETTINGS_KEY = "project.presets.v1";

export async function loadProjectPresets(accessToken: string): Promise<ProjectPreset[]> {
  const settings = (await getUserSettings(accessToken).catch(() => ({}))) as Record<string, unknown>;
  const raw = settings[PROJECT_PRESETS_SETTINGS_KEY];
  if (!raw) return [];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? (parsed as ProjectPreset[]) : [];
  } catch {
    return [];
  }
}

export async function saveProjectPresets(accessToken: string, presets: ProjectPreset[]): Promise<void> {
  const body = { [PROJECT_PRESETS_SETTINGS_KEY]: JSON.stringify(presets) } as Parameters<
    typeof patchUserSettings
  >[1];
  await patchUserSettings(accessToken, body);
}

export function newProjectPresetID(): string {
  return "prjp_" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}
