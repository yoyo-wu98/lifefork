"use client";

import { containsCrisisSignal, safetyMessage } from "@/lib/safety";
import { buildIntegratedAnalysis } from "@/lib/analysis/integratedAnalysis";
import { saveSelfSkill, saveStep } from "@/lib/storage";
import type {
  AnalysisSettings,
  BranchScenarioSuggestion,
  ForkPath,
  MethodAnalysisResult,
  SelfSkill,
  SelfVersion,
} from "@/lib/types";
import { CURRENT_LLM_SELF_SKILL_VERSION } from "@/lib/schema/versions";
import { ROOT_FORK_ID, type LifeforkSlice, type SelfSkillSlice } from "@/lib/stores/types";

interface SelfSkillApiResult {
  data: Partial<SelfSkill> & {
    branchScenarios?: BranchScenarioSuggestion[];
  };
  culturalResults: MethodAnalysisResult[];
  meta: {
    llmUsed?: boolean;
    provider?: string;
    model?: string;
    fallbackReason?: string;
    promptVersion?: string;
    durationMs?: number;
  };
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

function mergeBranchScenarios(
  forks: ForkPath[],
  scenarios: BranchScenarioSuggestion[] | undefined,
): ForkPath[] {
  if (!scenarios?.length) return forks;
  const byLane = new Map(scenarios.map((scenario) => [scenario.lane, scenario]));
  return forks.map((fork) => {
    const scenario = fork.lane ? byLane.get(fork.lane as BranchScenarioSuggestion["lane"]) : undefined;
    if (!scenario) return fork;
    return {
      ...fork,
      title: scenario.title || fork.title,
      subtitle: scenario.subtitle || fork.subtitle,
      summary: scenario.summary || fork.summary,
      gains: scenario.gains.length ? scenario.gains : fork.gains,
      costs: scenario.costs.length ? scenario.costs : fork.costs,
      futureSelfName: scenario.futureSelfName || fork.futureSelfName,
      futureSelfVoice: scenario.futureSelfVoice || fork.futureSelfVoice,
      aiPersonalized: scenario.generatedBy === "ai",
    };
  });
}

async function fetchSelfSkillFromAPI(input: {
  selectedVersion: SelfVersion;
  currentChoice: string;
  recurringEmotion: string;
  pastNode: string;
  hiddenSelf: string;
  futureSentence: string;
  extraText?: string;
  wechatSummary?: string;
  analysisSettings: AnalysisSettings;
  enableAi: boolean;
}): Promise<SelfSkillApiResult | null> {
  try {
    const res = await fetch("/api/generate-self-skill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success
      ? {
          data: json.data,
          culturalResults: Array.isArray(json.culturalResults)
            ? json.culturalResults
            : [],
          meta: json.meta ?? {},
          usage: json.usage,
        }
      : null;
  } catch {
    return null;
  }
}

export const createSelfSkillSlice: LifeforkSlice<SelfSkillSlice> = (set, get) => ({
  selfSkill: null,
  isGenerating: false,

  createSkill: async () => {
    const {
      selectedVersion,
      answers,
      extraText,
      wechatAnalysis,
      editorConfig,
      analysisSettings,
      runtimeConfig,
    } = get();
    const merged = `${Object.values(answers).join(" ")} ${extraText}`;

    if (containsCrisisSignal(merged)) {
      get().requestConfirmation(
        {
          title: "这需要现实中的支持",
          message: safetyMessage,
          confirmLabel: "关闭提示",
          tone: "danger",
          dismissOnly: true,
        },
        () => undefined,
      );
      return;
    }

    set({ isGenerating: true, step: "generating" });

    const version = selectedVersion ?? "future";
    const effectiveAnalysisSettings = runtimeConfig.features.culturalMethods
      ? analysisSettings
      : {
          ...analysisSettings,
          methods: analysisSettings.methods.map((method) =>
            method.id === "bazi" || method.id === "ziwei"
              ? { ...method, enabled: false, weight: 0 }
              : method,
          ),
        };
    const shouldUseAi =
      runtimeConfig.features.ai &&
      editorConfig.features.aiApi &&
      editorConfig.global.aiMode === "api-enhanced" &&
      effectiveAnalysisSettings.methods.some(
        (method) =>
          method.id === "ai-synthesis" && method.enabled && method.weight > 0,
      );
    const shouldUseCulturalApi = effectiveAnalysisSettings.methods.some(
      (method) =>
        method.enabled &&
        method.weight > 0 &&
        (method.id === "bazi" || method.id === "ziwei"),
    );
    const apiResult = shouldUseAi || shouldUseCulturalApi
      ? await fetchSelfSkillFromAPI({
          selectedVersion: version,
          ...answers,
          extraText: extraText || undefined,
          wechatSummary: wechatAnalysis?.suggestedSelfSkillText,
          analysisSettings: effectiveAnalysisSettings,
          enableAi: shouldUseAi,
        })
      : null;
    const llmSkillCore = apiResult?.data ?? null;

    const { generateSelfSkill } = await import("@/lib/selfSkillEngine");
    const localSkill = generateSelfSkill({
      selectedVersion: version,
      ...answers,
      extraText,
      wechatAnalysis: wechatAnalysis ?? undefined,
      analysisSettings: effectiveAnalysisSettings,
    });

    const branchScenarios = llmSkillCore?.branchScenarios;
    const llmSkillData = llmSkillCore
      ? Object.fromEntries(
          Object.entries(llmSkillCore).filter(([key]) => key !== "branchScenarios"),
        ) as Partial<SelfSkill>
      : null;
    const skillBase: SelfSkill = llmSkillData
      ? {
          ...localSkill,
          ...llmSkillData,
          version: CURRENT_LLM_SELF_SKILL_VERSION,
          forks: mergeBranchScenarios(localSkill.forks, branchScenarios),
          wechatAnalysis: wechatAnalysis ?? undefined,
          questions: localSkill.questions,
          evidence: llmSkillData.evidence ?? localSkill.evidence,
          claims: llmSkillData.claims ?? localSkill.claims,
          analysisSettings: effectiveAnalysisSettings,
        }
      : { ...localSkill, analysisSettings: effectiveAnalysisSettings };
    const skill: SelfSkill = {
      ...skillBase,
      integratedAnalysis: buildIntegratedAnalysis({
        skill: skillBase,
        settings: effectiveAnalysisSettings,
        culturalResults: apiResult?.culturalResults ?? [],
        modelExecution: {
          used: apiResult?.meta.llmUsed === true,
          provider:
            apiResult?.meta.provider === "openai" ||
            apiResult?.meta.provider === "deepseek"
              ? apiResult.meta.provider
              : "local",
          model: apiResult?.meta.model ?? "local-rules",
          fallbackReason: apiResult?.meta.fallbackReason,
          promptVersion: apiResult?.meta.promptVersion,
          durationMs: apiResult?.meta.durationMs,
          tokenUsage: apiResult?.usage,
        },
      }),
    };

    await new Promise((resolve) => setTimeout(resolve, 800));

    set({
      selfSkill: skill,
      selectedFork: null,
      messages: [],
      previewForkId: ROOT_FORK_ID,
      badge: apiResult?.meta.llmUsed
        ? "AI 与多方法分析已完成"
        : shouldUseCulturalApi
          ? "个人分析与文化排盘已完成"
          : "个人分析已生成",
      isGenerating: false,
      step: "self-skill",
    });

    saveSelfSkill(skill);
    saveStep("self-skill");
  },

  tuneVoice: (note) => {
    const { selfSkill } = get();
    if (!selfSkill) return;

    const calibrationNotes = Array.from(new Set([...selfSkill.voice.calibrationNotes, note]));

    const updated: SelfSkill = {
      ...selfSkill,
      voice: {
        ...selfSkill.voice,
        calibrationNotes,
        closenessScore: Math.min(96, selfSkill.voice.closenessScore + (note === "像我" ? 3 : 5)),
      },
    };

    set({ selfSkill: updated, badge: note === "像我" ? "语气更接近了" : `语气校准：${note}` });
    saveSelfSkill(updated);
  },

  setTimelineNodes: (timeline) => {
    const { selfSkill } = get();
    if (!selfSkill) return;

    const updated = { ...selfSkill, timeline };
    set({ selfSkill: updated });
    saveSelfSkill(updated);
  },

  deleteTimelineNode: (nodeId) => {
    const { selfSkill } = get();
    if (!selfSkill) return;
    const node = selfSkill.timeline.find((item) => item.id === nodeId);
    get().requestConfirmation(
      {
        title: "删除这个时间线节点？",
        message: `将删除「${node?.title ?? "未命名节点"}」。个人分析和方案地图会立即更新，已经生成的方案不会自动重算。`,
        confirmLabel: "删除节点",
        tone: "danger",
      },
      () => {
        const currentSkill = get().selfSkill;
        if (!currentSkill) return;
        const updated = {
          ...currentSkill,
          timeline: currentSkill.timeline.filter((item) => item.id !== nodeId),
        };
        set({ selfSkill: updated, badge: "时间线已更新" });
        saveSelfSkill(updated);
      },
    );
  },
});
