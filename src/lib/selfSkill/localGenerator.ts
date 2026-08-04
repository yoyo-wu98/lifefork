import type { GenerateSelfSkillInput, SelfSkill } from "@/lib/types";
import { attachAssetOutlooks } from "@/lib/analysis/assetProjection";
import { buildStageVoices, buildVoiceProfile } from "@/lib/voiceEngine";
import { buildClaims, buildEvidence, validateClaimEvidence } from "@/lib/selfSkill/evidenceBuilder";
import { buildDynamicTypeProfile } from "@/lib/selfSkill/dynamicTypeRules";
import { buildLifeSimulationMap } from "@/lib/selfSkill/forkTreeRules";
import { buildProfileRules } from "@/lib/selfSkill/profileRules";
import { buildTimeline } from "@/lib/selfSkill/timelineRules";

export interface GenerateSelfSkillOptions {
  now?: Date | string;
  seed?: string;
}

export function createIdFactory(seed: string): () => string {
  let counter = 0;
  const prefix = [...seed].reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 2166136261).toString(16);
  return () => `local-${prefix}-${(++counter).toString(36)}`;
}

export function generateSelfSkill(input: GenerateSelfSkillInput, options: GenerateSelfSkillOptions = {}): SelfSkill {
  const profile = buildProfileRules(input);
  const nextId = createIdFactory(options.seed ?? profile.text);
  const voice = buildVoiceProfile(input);
  const stageVoices = buildStageVoices(input, voice);
  const evidence = buildEvidence(input, nextId);
  const claims = validateClaimEvidence(buildClaims(input, profile.values, evidence, nextId), evidence);
  const forks = attachAssetOutlooks(buildLifeSimulationMap(input.currentChoice, evidence.map((item) => item.id)));
  const dynamicTypeProfile = buildDynamicTypeProfile(input, evidence, forks);
  const createdAt = options.now ? new Date(options.now).toISOString() : new Date().toISOString();

  return {
    id: nextId(),
    version: "v0.5",
    createdAt,
    selectedVersion: input.selectedVersion,
    analysisSettings: input.analysisSettings,
    questions: {
      currentChoice: input.currentChoice,
      recurringEmotion: input.recurringEmotion,
      pastNode: input.pastNode,
      hiddenSelf: input.hiddenSelf,
      futureSentence: input.futureSentence,
    },
    extraText: input.extraText,
    wechatAnalysis: input.wechatAnalysis,
    identity: {
      displayName: "当前的你",
      languageStyle: input.wechatAnalysis
        ? "对话表达较多，经常通过重复说明重点"
        : input.extraText
          ? "叙述较完整，会解释原因和感受"
          : "表达简洁，通常直接说明问题",
      emotionalTone: input.recurringEmotion || "复杂但清醒",
      selfNarrative: profile.lifeMotif,
      archetype: profile.archetype,
    },
    voice,
    stageVoices,
    semantic: {
      values: profile.values,
      fears: profile.fears,
      desires: profile.desires,
      recurringPatterns: profile.recurringPatterns,
      innerConflict: profile.innerConflict,
      lifeMotif: profile.lifeMotif,
    },
    decision: {
      riskPreference: /害怕|稳定|安全/.test(profile.text) ? "谨慎试探型" : "机会驱动型",
      workStyle: /项目|作品|创作/.test(profile.text) ? "项目冲刺型" : "结构迭代型",
      conflictStyle: /关系|分手|亲密/.test(profile.text) ? "先退后谈型" : "延迟处理型",
      changeTolerance: /换|辞|转/.test(profile.text) ? "中高，需缓冲" : "中等，需证据",
      attachmentPattern: /被理解|孤独/.test(profile.text) ? "渴望连接但保留边界" : "独立自持型",
    },
    timeline: buildTimeline(input, stageVoices, nextId),
    evidence,
    claims,
    dynamicTypeProfile,
    forks,
  };
}
