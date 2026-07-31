import { isRecord, numberValue, stringArray, stringValue, type Schema } from "./common";

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
