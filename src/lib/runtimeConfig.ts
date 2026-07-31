import type { AnalysisPresetId } from "@/lib/types";

export interface PublicRuntimeConfig {
  version: "public-runtime.v1";
  updatedAt: string;
  status: "online" | "maintenance";
  betaLabel: string;
  announcement: string;
  privacyNotice: string;
  features: {
    ai: boolean;
    wechatImport: boolean;
    culturalMethods: boolean;
    demoScenario: boolean;
  };
  defaults: {
    analysisPreset: Exclude<AnalysisPresetId, "custom">;
  };
  service: {
    aiConfigured: boolean;
    provider: "openai" | "deepseek" | "none";
  };
}

export type EditableRuntimeConfig = Omit<PublicRuntimeConfig, "service">;

export function createDefaultRuntimeConfig(): PublicRuntimeConfig {
  return {
    version: "public-runtime.v1",
    updatedAt: "",
    status: "online",
    betaLabel: "公开测试版",
    announcement: "",
    privacyNotice:
      "个人分析保存在当前浏览器。启用服务器 AI 时，生成所需内容会发送到服务器处理。",
    features: {
      ai: true,
      wechatImport: true,
      culturalMethods: true,
      demoScenario: true,
    },
    defaults: {
      analysisPreset: "evidence-first",
    },
    service: {
      aiConfigured: false,
      provider: "none",
    },
  };
}
