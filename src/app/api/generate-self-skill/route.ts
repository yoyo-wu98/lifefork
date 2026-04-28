import { NextRequest, NextResponse } from "next/server";
import { chatCompletionJSON } from "@/lib/ai/client";
import {
  SELF_SKILL_SYSTEM_PROMPT,
  buildSelfSkillUserPrompt,
} from "@/lib/ai/prompts";
import type { SelfSkill, Evidence, Claim, TimelineNode, StageVoice } from "@/lib/types";
import { buildStageVoices, buildVoiceProfile } from "@/lib/voiceEngine";

interface LLMGeneratedSkill {
  identity: {
    displayName: string;
    languageStyle: string;
    emotionalTone: string;
    selfNarrative: string;
    archetype: string;
  };
  semantic: {
    values: string[];
    fears: string[];
    desires: string[];
    recurringPatterns: string[];
    innerConflict: string;
    lifeMotif: string;
  };
  decision: {
    riskPreference: string;
    workStyle: string;
    conflictStyle: string;
    changeTolerance: string;
    attachmentPattern: string;
  };
  claims: Array<{
    text: string;
    confidence: number;
    evidenceQuote: string;
  }>;
  timelineNodes: Array<{
    yearLabel: string;
    title: string;
    emotion: string;
    pattern: string;
  }>;
}

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
      displayName: "正在分岔的你",
      languageStyle: "简洁直接，带一点克制",
      emotionalTone: input.recurringEmotion || "复杂但清醒",
      selfNarrative: "你像一条迟迟不肯汇入固定河道的河流，一边害怕漂泊，一边害怕停下。",
      archetype: "深海建造者",
    },
    semantic: {
      values: ["自由", "意义", "连接"],
      fears: ["害怕浪费人生", "害怕被误解", "害怕选择错误"],
      desires: ["被自己承认", "更自由地表达", "稳定又不失热情"],
      recurringPatterns: [
        "你渴望稳定带来的安全感，但又害怕它慢慢吞掉你的自由。",
        "你常常需要先确认一件事值得付出，行动力才会真正启动。",
        "你对人生的要求超过'过得还行'，还想在某种意义上被自己承认。",
        "你习惯把很多真实愿望延后，直到它们以焦虑或疲惫的形式回来。",
      ],
      innerConflict: "自由 vs 安全感",
      lifeMotif: "不断逃离被定义，又不断寻找一个能安放自己的地方。",
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
        text: "你目前的核心冲突更接近内在愿望与外部安全感的拉扯。",
        confidence: 0.78,
        evidenceQuote: `来自你的回答："${input.currentChoice?.slice(0, 48) ?? ""}"`,
      },
      {
        text: "你现在更需要一个不会背叛自己的试验结构，先别急着定终局。",
        confidence: 0.84,
        evidenceQuote: input.extraText
          ? `来自你粘贴的文字："${input.extraText.slice(0, 48)}"`
          : "系统推断：你正在尝试把犹豫转化为可行动的路径。",
      },
    ],
    timelineNodes: [
      {
        yearLabel: "过去",
        title: input.pastNode || "一个尚未被重新理解的节点",
        emotion: "复杂、迟疑、仍有回声",
        pattern: "这里可能藏着你后来很多选择的原型",
      },
      {
        yearLabel: "现在",
        title: input.currentChoice || "当前选择",
        emotion: input.recurringEmotion || "混乱",
        pattern: "你正在安全与变化之间寻找新的平衡",
      },
      {
        yearLabel: "未来",
        title: input.futureSentence || "未来的我想对现在说的话",
        emotion: "温柔、清醒、带着提醒",
        pattern: "你期待未来的自己证明：今天的犹豫没有白费",
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
  try {
    const body = await request.json();
    const {
      selectedVersion = "future",
      currentChoice = "",
      recurringEmotion = "",
      pastNode = "",
      hiddenSelf = "",
      futureSentence = "",
      extraText,
      wechatSummary,
    } = body;

    // Call DeepSeek for structured self-skill generation
    const userPrompt = buildSelfSkillUserPrompt({
      currentChoice,
      recurringEmotion,
      pastNode,
      hiddenSelf,
      futureSentence,
      extraText,
      wechatSummary,
    });

    const { data: llmSkill, raw } = await chatCompletionJSON<LLMGeneratedSkill>(
      [
        { role: "system", content: SELF_SKILL_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.3, maxTokens: 3000 },
    );

    // Merge LLM output with safe defaults
    const merged = mergeWithDefaults(llmSkill, {
      selectedVersion,
      currentChoice,
      recurringEmotion,
      pastNode,
      hiddenSelf,
      futureSentence,
      extraText,
    });

    // Build voice profile from user text
    const voiceInput = {
      selectedVersion: selectedVersion as "future" | "past" | "fork",
      currentChoice,
      recurringEmotion,
      pastNode,
      hiddenSelf,
      futureSentence,
      extraText,
      voiceCalibration: [] as string[],
    };
    const voice = buildVoiceProfile(voiceInput);
    const stageVoices = buildStageVoices(voiceInput, voice);

    // Assemble evidence
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

    // Assemble claims with evidence links
    const claims: Claim[] = merged.claims.map((c) => ({
      id: uid(),
      text: c.text,
      confidence: c.confidence,
      evidenceIds: evidence.slice(0, 2).map((e) => e.id),
    }));

    // Assemble timeline
    const timeline: TimelineNode[] = merged.timelineNodes.map((node, i) => ({
      id: uid(),
      yearLabel: node.yearLabel,
      title: node.title,
      emotion: node.emotion,
      pattern: node.pattern,
      voice: stageVoices[i] ?? stageVoices[2], // fallback to present voice
    }));

    // Build the complete SelfSkill (forks are generated client-side still)
    const selfSkillCore = {
      id: uid(),
      version: "v0.4-llm",
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
    };

    return NextResponse.json({
      success: true,
      data: selfSkillCore,
      meta: { llmUsed: !!llmSkill, rawResponse: raw.slice(0, 500) },
    });
  } catch (error) {
    console.error("generate-self-skill error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
