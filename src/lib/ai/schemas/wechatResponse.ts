import { isRecord, stringArray, stringValue, type Schema } from "./common";

export interface WechatLLMAnalysis {
  recurringTopics: string[];
  emotionalSignals: string[];
  keyThemes: string[];
  relationshipDynamics: string;
  selfSkillSignals: string[];
  suggestedSelfSkillText: string;
}

export const wechatResponseSchema: Schema<WechatLLMAnalysis> = {
  name: "wechatResponse",
  parse(value) {
    if (!isRecord(value)) return { success: false, error: "response must be an object" };
    return {
      success: true,
      data: {
        recurringTopics: stringArray(value.recurringTopics).slice(0, 8),
        emotionalSignals: stringArray(value.emotionalSignals).slice(0, 8),
        keyThemes: stringArray(value.keyThemes).slice(0, 6),
        relationshipDynamics: stringValue(value.relationshipDynamics).slice(0, 300),
        selfSkillSignals: stringArray(value.selfSkillSignals).slice(0, 8),
        suggestedSelfSkillText: stringValue(value.suggestedSelfSkillText).slice(0, 220),
      },
    };
  },
};
