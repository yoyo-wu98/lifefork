import { isRecord, numberValue, stringArray, stringValue, type Schema } from "./common";
import type { BranchScenarioSuggestion, StageVoice } from "@/lib/types";

export interface LLMGeneratedSkill {
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
  voiceProfile: {
    toneName: string;
    traits: string[];
    signaturePhrases: string[];
    sentenceRhythm: string;
    punctuationStyle: string;
    emotionalGesture: string;
    sampleLine: string;
  };
  stageVoices: Array<Omit<StageVoice, "id">>;
  branchScenarios: BranchScenarioSuggestion[];
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

export const selfSkillResponseSchema: Schema<LLMGeneratedSkill> = {
  name: "selfSkillResponse",
  parse(value) {
    if (!isRecord(value)) return { success: false, error: "response must be an object" };

    const identity = isRecord(value.identity) ? value.identity : null;
    const semantic = isRecord(value.semantic) ? value.semantic : null;
    const decision = isRecord(value.decision) ? value.decision : null;
    if (!identity || !semantic || !decision) {
      return { success: false, error: "missing identity, semantic, or decision" };
    }

    return {
      success: true,
      data: {
        identity: {
          displayName: stringValue(identity.displayName),
          languageStyle: stringValue(identity.languageStyle),
          emotionalTone: stringValue(identity.emotionalTone),
          selfNarrative: stringValue(identity.selfNarrative),
          archetype: stringValue(identity.archetype),
        },
        semantic: {
          values: stringArray(semantic.values).slice(0, 6),
          fears: stringArray(semantic.fears).slice(0, 6),
          desires: stringArray(semantic.desires).slice(0, 6),
          recurringPatterns: stringArray(semantic.recurringPatterns).slice(0, 8),
          innerConflict: stringValue(semantic.innerConflict),
          lifeMotif: stringValue(semantic.lifeMotif),
        },
        decision: {
          riskPreference: stringValue(decision.riskPreference),
          workStyle: stringValue(decision.workStyle),
          conflictStyle: stringValue(decision.conflictStyle),
          changeTolerance: stringValue(decision.changeTolerance),
          attachmentPattern: stringValue(decision.attachmentPattern),
        },
        voiceProfile: (() => {
          const voice = isRecord(value.voiceProfile) ? value.voiceProfile : {};
          return {
            toneName: stringValue(voice.toneName),
            traits: stringArray(voice.traits).slice(0, 6),
            signaturePhrases: stringArray(voice.signaturePhrases).slice(0, 6),
            sentenceRhythm: stringValue(voice.sentenceRhythm),
            punctuationStyle: stringValue(voice.punctuationStyle),
            emotionalGesture: stringValue(voice.emotionalGesture),
            sampleLine: stringValue(voice.sampleLine).slice(0, 180),
          };
        })(),
        stageVoices: Array.isArray(value.stageVoices)
          ? value.stageVoices
              .filter(isRecord)
              .map((voice) => ({
                stage: (["past", "hidden", "present", "future", "fork"] as const).includes(
                  voice.stage as "past" | "hidden" | "present" | "future" | "fork",
                )
                  ? (voice.stage as "past" | "hidden" | "present" | "future" | "fork")
                  : "present",
                ageLabel: stringValue(voice.ageLabel),
                toneName: stringValue(voice.toneName),
                description: stringValue(voice.description).slice(0, 180),
                sampleLine: stringValue(voice.sampleLine).slice(0, 180),
                traits: stringArray(voice.traits).slice(0, 6),
              }))
              .filter((voice) => voice.toneName && voice.sampleLine)
              .slice(0, 5)
          : [],
        branchScenarios: Array.isArray(value.branchScenarios)
          ? value.branchScenarios
              .filter(isRecord)
              .map((branch) => ({
                lane: (["stability", "leap", "experiment", "relationship"] as const).includes(
                  branch.lane as BranchScenarioSuggestion["lane"],
                )
                  ? (branch.lane as BranchScenarioSuggestion["lane"])
                  : "experiment",
                title: stringValue(branch.title).slice(0, 100),
                subtitle: stringValue(branch.subtitle).slice(0, 140),
                summary: stringValue(branch.summary).slice(0, 360),
                gains: stringArray(branch.gains).slice(0, 5),
                costs: stringArray(branch.costs).slice(0, 5),
                futureSelfName: stringValue(branch.futureSelfName).slice(0, 80),
                futureSelfVoice: stringValue(branch.futureSelfVoice).slice(0, 180),
              }))
              .filter((branch) => branch.title && branch.summary)
              .filter(
                (branch, index, all) =>
                  all.findIndex((item) => item.lane === branch.lane) === index,
              )
              .slice(0, 4)
          : [],
        claims: Array.isArray(value.claims)
          ? value.claims
              .filter(isRecord)
              .map((claim) => ({
                text: stringValue(claim.text),
                confidence: Math.min(1, Math.max(0, numberValue(claim.confidence, 0.7))),
                evidenceQuote: stringValue(claim.evidenceQuote),
              }))
              .filter((claim) => claim.text)
              .slice(0, 6)
          : [],
        timelineNodes: Array.isArray(value.timelineNodes)
          ? value.timelineNodes
              .filter(isRecord)
              .map((node) => ({
                yearLabel: stringValue(node.yearLabel),
                title: stringValue(node.title),
                emotion: stringValue(node.emotion),
                pattern: stringValue(node.pattern),
              }))
              .filter((node) => node.title)
              .slice(0, 5)
          : [],
      },
    };
  },
};
