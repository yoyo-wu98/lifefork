import { AI_TOKEN_BUDGETS, truncateForPrompt } from "@/lib/ai/tokenBudget";
import { formatContentPolicyForPrompt } from "@/lib/content/copyRegistry";

export const DIALOGUE_PROMPT_VERSION = AI_TOKEN_BUDGETS.dialogue.promptVersion;

export const DIALOGUE_SYSTEM_PROMPT = [
  "你是人生模拟系统中的「分支自我实例」。你代表用户在某条人生路径上的一个可能版本。",
  "",
  "原则：",
  "1. 不预测真实未来，只展示可能性、代价和反思问题。",
  "2. 不替用户做决定。",
  "3. 用户出现自伤、伤害他人等危机信号时，引导现实支持。",
  "4. 回复直接、具体，不超过150字；先回答问题，再给依据或下一步。",
  "5. 禁止泛化鸡汤、万能安慰、成功学口号；必须回应当前路径的具体代价、尺度或动作。",
  "6. 如果提供阶段语气和校准反馈，保留用户句式，但不要复制用户的情绪化结论。",
  "7. 禁止隐喻、诗意总结和抽象口号。",
  "",
  formatContentPolicyForPrompt("dialogue"),
  "",
  "8. 只返回 JSON：{\"reply\":\"回复内容\"}",
].join("\n");

export function buildDialogueUserPrompt(params: {
  selfSkillSummary: string;
  forkTitle: string;
  forkSummary: string;
  forkScale: string;
  forkGains: string[];
  forkCosts: string[];
  forkFutureSelfVoice: string;
  voiceProfile: string;
  stageVoice?: string;
  calibrationNotes?: string[];
  conversationHistory: string;
  userMessage: string;
}): string {
  const budget = AI_TOKEN_BUDGETS.dialogue.maxInputChars;
  return [
    "自我模型摘要：" + truncateForPrompt(params.selfSkillSummary, budget.selfSkillSummary),
    "路径名称：" + truncateForPrompt(params.forkTitle, 120),
    "路径概述：" + truncateForPrompt(params.forkSummary, budget.forkSummary),
    "时间尺度：" + truncateForPrompt(params.forkScale, 80),
    "可能获得：" + params.forkGains.slice(0, 8).join("、"),
    "可能代价：" + params.forkCosts.slice(0, 8).join("、"),
    "角色声音：" + truncateForPrompt(params.forkFutureSelfVoice, 300),
    "语气档案：" + truncateForPrompt(params.voiceProfile, budget.voiceProfile),
    "当前阶段语气：" + truncateForPrompt(params.stageVoice || "未提供", 600),
    "最近校准反馈：" + ((params.calibrationNotes ?? []).slice(0, 8).join("、") || "暂无"),
    "近期对话：" + (truncateForPrompt(params.conversationHistory, budget.conversationHistory) || "第一轮对话"),
    "用户消息：" + truncateForPrompt(params.userMessage, budget.userMessage),
    "回复要求：不超过150字，先直接回答，再说明一个具体收益、成本、时间范围或下一步动作。",
  ].join("\n");
}
