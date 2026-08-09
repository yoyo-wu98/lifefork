export const AI_TOKEN_BUDGETS = {
  selfSkill: {
    promptVersion: "selfSkill.v2",
    maxInputChars: {
      currentChoice: 600,
      recurringEmotion: 300,
      pastNode: 600,
      hiddenSelf: 600,
      futureSentence: 300,
      extraText: 1600,
      wechatSummary: 800,
    },
    maxOutputTokens: 3000,
  },
  dialogue: {
    promptVersion: "dialogue.v6",
    maxInputChars: {
      selfSkillSummary: 500,
      forkSummary: 700,
      voiceProfile: 700,
      stageVoice: 600,
      conversationHistory: 1600,
      userMessage: 600,
    },
    maxOutputTokens: 500,
  },
  wechat: {
    promptVersion: "wechat.v1",
    maxInputChars: {
      localSummary: 2500,
    },
    maxOutputTokens: 1500,
  },
} as const;

export type PromptVersion =
  (typeof AI_TOKEN_BUDGETS)[keyof typeof AI_TOKEN_BUDGETS]["promptVersion"];

export function truncateForPrompt(value: string | undefined, maxChars: number): string {
  return (value ?? "").slice(0, maxChars);
}
