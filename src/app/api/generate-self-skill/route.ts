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
  BranchScenarioSuggestion,
  Evidence,
  Claim,
  MethodAnalysisResult,
  StageVoice,
  TimelineNode,
} from "@/lib/types";
import { buildStageVoices, buildVoiceProfile } from "@/lib/voiceEngine";

function uid() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function usefulString(value: string | undefined, fallback: string): string {
  return value?.trim() || fallback;
}

function usefulArray(values: string[] | undefined, fallback: string[]): string[] {
  const cleaned = values?.map((value) => value.trim()).filter(Boolean) ?? [];
  return cleaned.length ? cleaned : fallback;
}

function completeBranchScenarios(
  candidates: BranchScenarioSuggestion[],
  currentChoice: string,
): BranchScenarioSuggestion[] {
  const choice = currentChoice.trim().slice(0, 80) || "当前问题";
  const defaults: Record<BranchScenarioSuggestion["lane"], Omit<BranchScenarioSuggestion, "lane">> = {
    stability: {
      generatedBy: "local",
      title: "维持当前安排，继续收集信息",
      subtitle: "先保留稳定来源，再设定复查日期。",
      summary: `围绕“${choice}”，暂时维持主要安排，同时记录成本、收益和变化信号。`,
      gains: ["保留基本稳定", "获得更多观察时间"],
      costs: ["改变速度较慢", "原有压力可能继续存在"],
      futureSelfName: "继续观察后的你",
      futureSelfVoice: "平静复盘这段时间新增了哪些信息",
    },
    leap: {
      generatedBy: "local",
      title: "直接执行主要变化",
      subtitle: "集中资源验证最想走的方向。",
      summary: `针对“${choice}”，选择更快的变化，并提前定义资源底线和退出条件。`,
      gains: ["更快获得真实反馈", "行动与目标更一致"],
      costs: ["短期不确定性上升", "需要承担更高资源压力"],
      futureSelfName: "完成转向后的你",
      futureSelfVoice: "直接说明实际收益、损失和意外结果",
    },
    experiment: {
      generatedBy: "local",
      title: "用 90 天完成一次验证",
      subtitle: "把大问题拆成有期限的现实试验。",
      summary: `为“${choice}”设置 90 天目标、投入上限、观察指标和复盘日期。`,
      gains: ["降低一次性决策风险", "获得可比较的数据"],
      costs: ["短期需要额外投入", "结果可能推翻原有想象"],
      futureSelfName: "90 天后的你",
      futureSelfVoice: "根据执行记录说明哪些假设成立",
    },
    relationship: {
      generatedBy: "local",
      title: "先完成关键沟通与支持安排",
      subtitle: "把相关人的需求、边界和资源放进方案。",
      summary: `围绕“${choice}”，先与关键关系人明确担忧、支持条件和不能接受的代价。`,
      gains: ["减少信息差", "提前确认可获得的支持"],
      costs: ["需要进行困难沟通", "他人的反馈可能改变原计划"],
      futureSelfName: "完成关键沟通后的你",
      futureSelfVoice: "清楚说明边界、支持和仍未解决的问题",
    },
  };
  const byLane = new Map<BranchScenarioSuggestion["lane"], BranchScenarioSuggestion>();
  candidates.forEach((candidate) => {
    if (!byLane.has(candidate.lane)) {
      byLane.set(candidate.lane, { ...candidate, generatedBy: "ai" });
    }
  });
  return (["stability", "leap", "experiment", "relationship"] as const).map(
    (lane) => byLane.get(lane) ?? { lane, ...defaults[lane] },
  );
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
  voiceProfile: LLMGeneratedSkill["voiceProfile"] | null;
  stageVoices: LLMGeneratedSkill["stageVoices"];
  branchScenarios: BranchScenarioSuggestion[];
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

  if (!llm) {
    return {
      ...defaults,
      voiceProfile: null,
      stageVoices: [],
      branchScenarios: [],
    };
  }

  return {
    identity: {
      displayName: usefulString(llm.identity.displayName, defaults.identity.displayName),
      languageStyle: usefulString(llm.identity.languageStyle, defaults.identity.languageStyle),
      emotionalTone: usefulString(llm.identity.emotionalTone, defaults.identity.emotionalTone),
      selfNarrative: usefulString(llm.identity.selfNarrative, defaults.identity.selfNarrative),
      archetype: usefulString(llm.identity.archetype, defaults.identity.archetype),
    },
    semantic: {
      values: usefulArray(llm.semantic.values, defaults.semantic.values),
      fears: usefulArray(llm.semantic.fears, defaults.semantic.fears),
      desires: usefulArray(llm.semantic.desires, defaults.semantic.desires),
      recurringPatterns: usefulArray(
        llm.semantic.recurringPatterns,
        defaults.semantic.recurringPatterns,
      ),
      innerConflict: usefulString(
        llm.semantic.innerConflict,
        defaults.semantic.innerConflict,
      ),
      lifeMotif: usefulString(llm.semantic.lifeMotif, defaults.semantic.lifeMotif),
    },
    decision: {
      riskPreference: usefulString(
        llm.decision.riskPreference,
        defaults.decision.riskPreference,
      ),
      workStyle: usefulString(llm.decision.workStyle, defaults.decision.workStyle),
      conflictStyle: usefulString(
        llm.decision.conflictStyle,
        defaults.decision.conflictStyle,
      ),
      changeTolerance: usefulString(
        llm.decision.changeTolerance,
        defaults.decision.changeTolerance,
      ),
      attachmentPattern: usefulString(
        llm.decision.attachmentPattern,
        defaults.decision.attachmentPattern,
      ),
    },
    claims: llm.claims?.length
      ? llm.claims.map((c) => ({
          text: c.text,
          confidence: Math.min(1, Math.max(0, c.confidence ?? 0.7)),
          evidenceQuote: c.evidenceQuote ?? "",
        }))
      : defaults.claims,
    timelineNodes: llm.timelineNodes?.length ? llm.timelineNodes : defaults.timelineNodes,
    voiceProfile: llm.voiceProfile,
    stageVoices: llm.stageVoices,
    branchScenarios: completeBranchScenarios(llm.branchScenarios, input.currentChoice),
  };
}

interface EvidenceCandidate {
  evidence: Evidence;
  raw: string;
}

function normalizeEvidenceText(value: string): string {
  return value
    .replace(/来自(?:你的回答|你粘贴的文字|微信摘要)|证据|原文|系统推断/gu, "")
    .replace(/[^\p{L}\p{N}]/gu, "")
    .toLowerCase();
}

function bigrams(value: string): Set<string> {
  const normalized = normalizeEvidenceText(value);
  if (normalized.length < 2) return new Set(normalized ? [normalized] : []);
  return new Set(Array.from({ length: normalized.length - 1 }, (_, index) => normalized.slice(index, index + 2)));
}

function overlapScore(query: string, source: string): number {
  const normalizedQuery = normalizeEvidenceText(query);
  const normalizedSource = normalizeEvidenceText(source);
  if (!normalizedQuery || !normalizedSource) return 0;
  if (normalizedSource.includes(normalizedQuery) || normalizedQuery.includes(normalizedSource)) return 1;
  const queryPairs = bigrams(normalizedQuery);
  const sourcePairs = bigrams(normalizedSource);
  if (!queryPairs.size) return 0;
  let matches = 0;
  queryPairs.forEach((pair) => {
    if (sourcePairs.has(pair)) matches += 1;
  });
  return matches / queryPairs.size;
}

function evidenceForClaim(
  claim: LLMGeneratedSkill["claims"][number],
  candidates: EvidenceCandidate[],
): Evidence[] {
  const ranked = candidates
    .map((candidate) => ({
      evidence: candidate.evidence,
      score:
        overlapScore(claim.evidenceQuote, candidate.raw) * 0.75 +
        overlapScore(claim.text, candidate.raw) * 0.25,
    }))
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (!best || best.score < 0.14) return [];
  return ranked
    .filter((item, index) => index === 0 || (item.score >= 0.3 && best.score - item.score <= 0.12))
    .slice(0, 2)
    .map((item) => item.evidence);
}

function stageForTimelineNode(
  node: LLMGeneratedSkill["timelineNodes"][number],
  index: number,
  total: number,
): StageVoice["stage"] {
  const label = `${node.yearLabel} ${node.title}`;
  if (/(未来|以后|十年后|年后)/.test(label)) return "future";
  if (/(暗线|隐藏|没说出口)/.test(label)) return "hidden";
  if (/(现在|当前|此刻)/.test(label)) return "present";
  if (/(过去|曾经|毕业|小时候|当年)/.test(label)) return "past";
  if (index === 0) return "past";
  if (index === total - 1) return "future";
  return "present";
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

    const llmStartedAt = Date.now();
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
    const localVoice = buildVoiceProfile(voiceInput);
    const allVoiceText = [
      currentChoice,
      recurringEmotion,
      pastNode,
      hiddenSelf,
      futureSentence,
      extraText,
      wechatSummary,
    ]
      .filter(Boolean)
      .join(" ");
    const validSignaturePhrases =
      merged.voiceProfile?.signaturePhrases.filter(
        (phrase) => phrase.length >= 2 && allVoiceText.includes(phrase),
      ) ?? [];
    const voice = merged.voiceProfile
      ? {
          ...localVoice,
          toneName: usefulString(merged.voiceProfile.toneName, localVoice.toneName),
          traits: usefulArray(merged.voiceProfile.traits, localVoice.traits),
          signaturePhrases: usefulArray(
            validSignaturePhrases,
            localVoice.signaturePhrases,
          ),
          sentenceRhythm: usefulString(
            merged.voiceProfile.sentenceRhythm,
            localVoice.sentenceRhythm,
          ),
          punctuationStyle: usefulString(
            merged.voiceProfile.punctuationStyle,
            localVoice.punctuationStyle,
          ),
          emotionalGesture: usefulString(
            merged.voiceProfile.emotionalGesture,
            localVoice.emotionalGesture,
          ),
          sampleLine: usefulString(
            merged.voiceProfile.sampleLine,
            localVoice.sampleLine,
          ),
        }
      : localVoice;
    const localStageVoices = buildStageVoices(voiceInput, voice);
    const llmStageByType = new Map(
      merged.stageVoices.map((stageVoice) => [stageVoice.stage, stageVoice]),
    );
    const stageVoices: StageVoice[] = localStageVoices.map((fallback) => {
      const candidate = llmStageByType.get(fallback.stage);
      if (!candidate) return fallback;
      return {
        id: fallback.id,
        stage: fallback.stage,
        ageLabel: usefulString(candidate.ageLabel, fallback.ageLabel),
        toneName: usefulString(candidate.toneName, fallback.toneName),
        description: usefulString(candidate.description, fallback.description),
        sampleLine: usefulString(candidate.sampleLine, fallback.sampleLine),
        traits: usefulArray(candidate.traits, fallback.traits),
      };
    });

    const sourceInputs: Array<{
      source: Evidence["source"];
      label: string;
      raw: string | undefined;
    }> = [
      { source: "question", label: "当前选择", raw: currentChoice },
      { source: "question", label: "反复情绪", raw: recurringEmotion },
      { source: "question", label: "过去节点", raw: pastNode },
      { source: "question", label: "隐藏特征", raw: hiddenSelf },
      { source: "question", label: "未来期待", raw: futureSentence },
      { source: "extra_text", label: "补充文字", raw: extraText },
      { source: "wechat", label: "微信本地摘要", raw: wechatSummary },
    ];
    const evidenceCandidates: EvidenceCandidate[] = sourceInputs
      .filter((item): item is typeof item & { raw: string } => Boolean(item.raw?.trim()))
      .map((item) => ({
        raw: item.raw,
        evidence: {
          id: uid(),
          source: item.source,
          quote: `${item.label}：「${item.raw.slice(0, 100)}」`,
        },
      }));
    const evidence: Evidence[] = evidenceCandidates.map((item) => item.evidence);

    const claims: Claim[] = merged.claims.map((claim) => {
      const matchedEvidence = evidenceForClaim(claim, evidenceCandidates);
      if (!matchedEvidence.length) {
        const generatedEvidence: Evidence = {
          id: uid(),
          source: "generated",
          quote: "模型推断：未找到可直接对应的原文，请用户核对这条判断。",
        };
        evidence.push(generatedEvidence);
        return {
          id: uid(),
          text: claim.text,
          confidence: Math.min(claim.confidence, 0.55),
          evidenceIds: [generatedEvidence.id],
        };
      }
      return {
        id: uid(),
        text: claim.text,
        confidence: claim.confidence,
        evidenceIds: matchedEvidence.map((item) => item.id),
      };
    });

    const timeline: TimelineNode[] = merged.timelineNodes.map((node, i, nodes) => ({
      id: uid(),
      yearLabel: node.yearLabel,
      title: node.title,
      emotion: node.emotion,
      pattern: node.pattern,
      voice:
        stageVoices.find(
          (stageVoice) =>
            stageVoice.stage === stageForTimelineNode(node, i, nodes.length),
        ) ?? stageVoices.find((stageVoice) => stageVoice.stage === "present"),
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
      branchScenarios: merged.branchScenarios,
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
        durationMs: Date.now() - llmStartedAt,
        tokenUsage: usage,
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
