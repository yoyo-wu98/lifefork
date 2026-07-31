import type {
  AnalysisMethodId,
  AnalysisMethodPreference,
  AnalysisPresetId,
  AnalysisSettings,
  BirthProfile,
} from "@/lib/types";

export const ANALYSIS_METHODS: Record<
  AnalysisMethodId,
  Omit<AnalysisMethodPreference, "enabled" | "weight">
> = {
  "user-evidence": {
    id: "user-evidence",
    label: "用户提供的事实与原文",
    category: "evidence",
    description: "根据回答、日记、聊天摘要和已确认的人生事件进行分析。",
    reliability: "higher",
  },
  "behavioral-pattern": {
    id: "behavioral-pattern",
    label: "行为与决策模式",
    category: "model",
    description: "识别多次出现的选择方式、资源限制、情绪和行动反馈。",
    reliability: "medium",
  },
  "population-statistics": {
    id: "population-statistics",
    label: "群体统计参考",
    category: "statistical",
    description: "使用公开研究中的群体规律提供基准，不直接推断个人必然结果。",
    reliability: "medium",
  },
  "ai-synthesis": {
    id: "ai-synthesis",
    label: "AI 综合分析",
    category: "model",
    description: "由服务器模型整合材料、提出假设并生成可比较的方案。",
    reliability: "experimental",
  },
  "mbti-stage": {
    id: "mbti-stage",
    label: "阶段性 MBTI 倾向",
    category: "psychometric",
    description: "按人生阶段估计四个偏好维度，用倾向和置信度表达。",
    reliability: "experimental",
  },
  bazi: {
    id: "bazi",
    label: "八字文化解读",
    category: "cultural",
    description: "按出生时间计算四柱、五行和十神，作为传统文化视角。",
    reliability: "cultural",
  },
  ziwei: {
    id: "ziwei",
    label: "紫微斗数文化解读",
    category: "cultural",
    description: "按出生信息生成宫位与主星数据，作为传统文化视角。",
    reliability: "cultural",
  },
};

export const ANALYSIS_PRESETS: Record<
  Exclude<AnalysisPresetId, "custom">,
  {
    label: string;
    description: string;
    weights: Record<AnalysisMethodId, number>;
  }
> = {
  "evidence-first": {
    label: "证据优先",
    description: "优先使用用户材料、行为模式和统计参考。适合重大现实选择。",
    weights: {
      "user-evidence": 35,
      "behavioral-pattern": 20,
      "population-statistics": 12,
      "ai-synthesis": 15,
      "mbti-stage": 13,
      bazi: 3,
      ziwei: 2,
    },
  },
  balanced: {
    label: "均衡探索",
    description: "兼顾现实证据、AI 分析、性格倾向和传统文化视角。",
    weights: {
      "user-evidence": 25,
      "behavioral-pattern": 15,
      "population-statistics": 10,
      "ai-synthesis": 20,
      "mbti-stage": 15,
      bazi: 8,
      ziwei: 7,
    },
  },
  "cultural-exploration": {
    label: "传统文化探索",
    description: "提高八字和紫微斗数权重，同时保留现实材料作为校验依据。",
    weights: {
      "user-evidence": 20,
      "behavioral-pattern": 12,
      "population-statistics": 8,
      "ai-synthesis": 15,
      "mbti-stage": 10,
      bazi: 18,
      ziwei: 17,
    },
  },
};

export const DEFAULT_BIRTH_PROFILE: BirthProfile = {
  calendar: "solar",
  date: "",
  time: "12:00",
  timeAccuracy: "unknown",
  timezone: "Asia/Shanghai",
  place: "",
  gender: "prefer-not-to-say",
  consentToProcess: false,
};

export function createAnalysisSettings(
  preset: Exclude<AnalysisPresetId, "custom"> = "evidence-first",
): AnalysisSettings {
  const presetConfig = ANALYSIS_PRESETS[preset];
  return {
    preset,
    methods: Object.values(ANALYSIS_METHODS).map((method) => ({
      ...method,
      enabled:
        method.category !== "cultural" || preset !== "evidence-first",
      weight: presetConfig.weights[method.id],
    })),
    birthProfile: { ...DEFAULT_BIRTH_PROFILE },
  };
}

export function applyAnalysisPreset(
  current: AnalysisSettings,
  preset: Exclude<AnalysisPresetId, "custom">,
): AnalysisSettings {
  const presetConfig = ANALYSIS_PRESETS[preset];
  return {
    ...current,
    preset,
    methods: current.methods.map((method) => ({
      ...method,
      weight: presetConfig.weights[method.id],
      enabled:
        method.category === "cultural"
          ? preset !== "evidence-first"
          : true,
    })),
  };
}

export function normalizeMethodWeights(
  methods: AnalysisMethodPreference[],
): Record<AnalysisMethodId, number> {
  const enabled = methods.filter((method) => method.enabled && method.weight > 0);
  const total = enabled.reduce((sum, method) => sum + method.weight, 0) || 1;

  return Object.keys(ANALYSIS_METHODS).reduce(
    (weights, methodId) => {
      const method = enabled.find((item) => item.id === methodId);
      weights[methodId as AnalysisMethodId] = method
        ? Math.round((method.weight / total) * 1000) / 10
        : 0;
      return weights;
    },
    {} as Record<AnalysisMethodId, number>,
  );
}

export function hasValidBirthInput(settings: AnalysisSettings): boolean {
  const birth = settings.birthProfile;
  if (!birth?.consentToProcess || !birth.date) return false;
  if (birth.timeAccuracy === "unknown") {
    return settings.methods.every(
      (method) => !method.enabled || !["bazi", "ziwei"].includes(method.id),
    );
  }
  return Boolean(birth.time);
}

export function methodNeedsBirthData(methodId: AnalysisMethodId): boolean {
  return methodId === "bazi" || methodId === "ziwei";
}
