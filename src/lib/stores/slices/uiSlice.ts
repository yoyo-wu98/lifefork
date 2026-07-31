"use client";

import { proverbs } from "@/lib/copy";
import {
  loadEditorConfig,
  parseEditorConfigJson,
  resetEditorConfig as resetStoredEditorConfig,
  saveEditorConfig as saveStoredEditorConfig,
} from "@/lib/editorConfig";
import type { LifeforkSlice, UiSlice } from "@/lib/stores/types";
import { createDefaultRuntimeConfig } from "@/lib/runtimeConfig";

const initialEditorConfig = loadEditorConfig();

export const createUiSlice: LifeforkSlice<UiSlice> = (set) => ({
  badge: null,
  proverb: initialEditorConfig.share.futureSelfLines[0] ?? proverbs[0],
  editorConfig: initialEditorConfig,
  runtimeConfig: createDefaultRuntimeConfig(),
  setBadge: (badge) => set({ badge }),
  setProverb: (proverb) => set({ proverb }),
  saveEditorConfig: (config) => {
    const saved = saveStoredEditorConfig(config);
    set({
      editorConfig: saved,
      proverb: saved.share.futureSelfLines[0] ?? proverbs[0],
      badge: "后台配置已保存",
    });
  },
  resetEditorConfig: () => {
    const defaults = resetStoredEditorConfig();
    set({
      editorConfig: defaults,
      proverb: defaults.share.futureSelfLines[0] ?? proverbs[0],
      badge: "后台配置已恢复默认",
    });
  },
  importEditorConfig: (json) => {
    const parsed = parseEditorConfigJson(json);
    const saved = saveStoredEditorConfig(parsed);
    set({
      editorConfig: saved,
      proverb: saved.share.futureSelfLines[0] ?? proverbs[0],
      badge: "后台配置已导入",
    });
  },
  setRuntimeConfig: (runtimeConfig) => set({ runtimeConfig }),
});
