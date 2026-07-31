import { NextRequest, NextResponse } from "next/server";
import { chatCompletionJSON } from "@/lib/ai/client";
import {
  SELF_SKILL_PROMPT_VERSION,
  SELF_SKILL_SYSTEM_PROMPT,
  buildSelfSkillUserPrompt,
} from "@/lib/ai/prompts";
import { AI_TOKEN_BUDGETS } from "@/lib/ai/tokenBudget";
import {
  parseGenerateSelfSkillRequest,
  readJsonRequest,
} from "@/lib/ai/schemas/requestSchemas";
import {
  selfSkillResponseSchema,
  type LLMGeneratedSkill,
} from "@/lib/ai/schemas/selfSkillResponse";
import { calculateCulturalMethods } from "@/lib/analysis/culturalCalculators.server";
import { serverEnvironmentEnabled } from "@/lib/server/environment";
import { createAnalysisSettings } from "@/lib/analysis/methodRegistry";
import { guardPublicApi, finalizePublicApiResponse } from "@/lib/server/apiGuard";
import { getRuntimeConfig } from "@/lib/server/runtimeConfigStore";
import type {
  Evidence,
  Claim,
  MethodAnalysisResult,
  TimelineNode,
} from "@/lib/types";
import { buildStageVoices, buildVoiceProfile } from "@/lib/voiceEngine";

function uid() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function mergeWithDefaults(
  llm: LLMGeneratedSkill | null,
  input: {
    selectedVersion: "future" | "past" | "fork";
    currentChoice: string;
    recurringEmotion: string;
    pastNode: string;
    hiddenSelf: string;
    futureSentence: string;
    extraText?: string;
  },
): {
  identity: LLMGeneratedSkill["identity"];
  semantic: LLMGeneratedSkill["semantic"];
  decision: LLMGeneratedSkill["decision"];
  claims: LLMGeneratedSkill["claims"];
  timelineNodes: LLMGeneratedSkill["timelineNodes"];
} {
  const defaults = {
    identity: {
      displayName: "当前的你",
      languageStyle: "表达直接，判断相对谨慎",
      emotionalTone: input.recurringEmotion || "复杂、谨慎",
      selfNarrative: "你希望保留自主权，同时也需要稳定的生活基础。当前更适合通过小规模行动补充信息。",
      archetype: "谨慎规划型",
    },
    semantic: {
      values: ["自由", "意义", "连接"],
      fears: ["担心浪费时间", "担心别人不理解", "担心选错"],
      desires: ["拥有更多自主权", "能持续表达和创作", "保持稳定的生活基础"],
      recurringPatterns: [
        "你同时重视稳定和自主权，因此重大选择通常需要较长时间比较。",
        "你会先确认投入是否值得，再开始行动。",
        "你希望工作和生活符合长期目标，不满足于短期维持。",
        "你容易推迟真正想做的事，压力随后会表现为焦虑或疲惫。",
      ],
      innerConflict: "自由 vs 安全感",
      lifeMotif: "你经常在安全感和改变之间权衡，需要用实际行动补充判断依据。",
    },
    decision: {
      riskPreference: "谨慎试探型",
      workStyle: "结构迭代型",
      conflictStyle: "延迟处理型",
      changeTolerance: "中等，需证据",
      attachmentPattern: "渴望连接但保留边界",
    },
    claims: [
      {
        text: "你当前主要在比较自主权和安全感两类需求。",
        confidence: 0.78,
        evidenceQuote: `来自你的回答："${input.currentChoice?.slice(0, 48) ?? ""}"`,
      },
      {
        text: "目前信息不足以支持一次性做出最终决定，更适合先设定一个有期限的验证方案。",
        confidence: 0.84,
        evidenceQuote: input.extraText
          ? `来自你粘贴的文字："${input.extraText.slice(0, 48)}"`
          : "系统推断：你希望把当前问题拆成可以执行和检查的方案。",
      },
    ],
    timelineNodes: [
      {
        yearLabel: "过去",
        title: input.pastNode || "一段影响当前选择的经历",
        emotion: "复杂、犹豫",
        pattern: "这段经历可能影响你现在对风险和选择的判断",
      },
      {
        yearLabel: "现在",
        title: input.currentChoice || "当前选择",
        emotion: input.recurringEmotion || "混乱",
        pattern: "你正在比较维持现状和做出改变的收益与风险",
      },
      {
        yearLabel: "未来",
        title: input.futureSentence || "你希望这个选择带来的长期结果",
        emotion: "明确、谨慎",
        pattern: "这个结果可以作为比较不同方案的长期目标",
      },
    ],
  };

  if (!llm) return defaults;

  return {
    identity: { ...defaults.identity, ...llm.identity },
    semantic: { ...defaults.semantic, ...llm.semantic },
    decision: { ...defaults.decision, ...llm.decision },
    claims: llm.claims?.length
      ? llm.claims.map((c) => ({
          text: c.text,
          confidence: Math.min(1, Math.max(0, c.confidence ?? 0.7)),
          evidenceQuote: c.evidenceQuote ?? "",
        }))
      : defaults.claims,
    timelineNodes: llm.timelineNodes?.length ? llm.timelineNodes : defaults.timelineNodes,
  };
}

export async function POST(request: NextRequest) {
  const { guard, blocked } = guardPublicApi(request, {
    bucket: "generate-self-skill",
    limit: 6,
  });
  if (blocked) return blocked;

  const respond = (body: unknown, status = 200) =>
    finalizePublicApiResponse(NextResponse.json(body, { status }), guard);

  try {
    const runtimeConfig = await getRuntimeConfig();
    if (runtimeConfig.status === "maintenance") {
      return respond(
        { success: false, error: "服务正在维护，请稍后再试。" },
        503,
      );
    }

    const json = await readJsonRequest(request);
    if (!json.success) {
      return respond(
        {
          success: false,
          error: json.error,
          meta: {
            llmUsed: false,
            fallbackReason: "invalid_request",
            promptVersion: SELF_SKILL_PROMPT_VERSION,
          },
        },
        400,
      );
    }

    const parsed = parseGenerateSelfSkillRequest(json.data);
    if (!parsed.success) {
      return respond(
        {
          success: false,
          error: parsed.error,
          meta: {
            llmUsed: false,
            fallbackReason: "invalid_request",
            promptVersion: SELF_SKILL_PROMPT_VERSION,
          },
        },
        400,
      );
    }

    const {
      selectedVersion,
      currentChoice,
      recurringEmotion,
      pastNode,
      hiddenSelf,
      futureSentence,
      extraText,
      wechatSummary,
      analysisSettings: requestedAnalysisSettings,
      enableAi,
    } = parsed.data;
    const analysisSettings = requestedAnalysisSettings ?? createAnalysisSettings();

    const userPrompt = buildSelfSkillUserPrompt({
      currentChoice,
      recurringEmotion,
      pastNode,
      hiddenSelf,
      futureSentence,
      extraText,
      wechatSummary,
    });

    const { data: llmSkill, raw, meta, usage } = await chatCompletionJSON<LLMGeneratedSkill>(
      [
        { role: "system", content: SELF_SKILL_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      {
        temperature: 0.3,
        maxTokens: AI_TOKEN_BUDGETS.selfSkill.maxOutputTokens,
        reasoningEffort: "medium",
        safetyIdentifier: guard.session.safetyIdentifier,
        enabled:
          enableAi &&
          runtimeConfig.features.ai &&
          runtimeConfig.service.aiConfigured,
      },
      selfSkillResponseSchema,
    );

    const merged = mergeWithDefaults(llmSkill, {
      selectedVersion,
      currentChoice,
      recurringEmotion,
      pastNode,
      hiddenSelf,
      futureSentence,
      extraText,
    });

    const voiceInput = {
      selectedVersion: selectedVersion as "future" | "past" | "fork",
      currentChoice,
      recurringEmotion,
      pastNode,
      hiddenSelf,
      futureSentence,
      extraText: [extraText, wechatSummary].filter(Boolean).join("\n"),
      voiceCalibration: [] as string[],
    };
    const voice = buildVoiceProfile(voiceInput);
    const stageVoices = buildStageVoices(voiceInput, voice);

    const evidence: Evidence[] = [
      {
        id: uid(),
        source: "question" as const,
        quote: `来自你的回答：「${currentChoice.slice(0, 80)}」`,
      },
      {
        id: uid(),
        source: "question" as const,
        quote: `来自你的回答：「${hiddenSelf.slice(0, 80)}」`,
      },
    ];

    if (extraText) {
      evidence.push({
        id: uid(),
        source: "extra_text" as const,
        quote: `来自你粘贴的文字：「${extraText.slice(0, 80)}」`,
      });
    }

    const claims: Claim[] = merged.claims.map((c) => ({
      id: uid(),
      text: c.text,
      confidence: c.confidence,
      evidenceIds: evidence.slice(0, 2).map((e) => e.id),
    }));

    const timeline: TimelineNode[] = merged.timelineNodes.map((node, i) => ({
      id: uid(),
      yearLabel: node.yearLabel,
      title: node.title,
      emotion: node.emotion,
      pattern: node.pattern,
      voice: stageVoices[i] ?? stageVoices[2], // fallback to present voice
    }));

    const selfSkillCore = {
      id: uid(),
      version: "v0.5-llm",
      createdAt: new Date().toISOString(),
      selectedVersion: selectedVersion as "future" | "past" | "fork",
      questions: { currentChoice, recurringEmotion, pastNode, hiddenSelf, futureSentence },
      extraText,
      identity: merged.identity,
      voice,
      stageVoices,
      semantic: merged.semantic,
      decision: merged.decision,
      timeline,
      evidence,
      claims,
      analysisSettings,
    };

    const enabledCulturalMethods = new Set(
      runtimeConfig.features.culturalMethods
        ? analysisSettings.methods
            .filter(
              (method) =>
                method.enabled &&
                (method.id === "bazi" || method.id === "ziwei"),
            )
            .map((method) => method.id)
        : [],
    );
    const culturalResults: MethodAnalysisResult[] = enabledCulturalMethods.size
      ? calculateCulturalMethods(analysisSettings.birthProfile).filter((result) =>
          enabledCulturalMethods.has(result.methodId),
        )
      : [];

    return respond({
      success: true,
      data: selfSkillCore,
      culturalResults,
      meta: {
        ...meta,
        llmUsed: !!llmSkill,
        fallbackReason: llmSkill ? undefined : meta.fallbackReason ?? "local_defaults",
        promptVersion: SELF_SKILL_PROMPT_VERSION,
        ...(serverEnvironmentEnabled("LIFEFORK_AI_DEBUG")
          ? { rawResponse: raw.slice(0, 300) }
          : {}),
      },
      usage,
    });
  } catch (error) {
    console.error("generate-self-skill error:", error);
    return respond(
      {
        success: false,
        error: "Failed to generate self skill",
        meta: {
          llmUsed: false,
          fallbackReason: "route_error",
          promptVersion: SELF_SKILL_PROMPT_VERSION,
        },
      },
      500,
    );
  }
}
