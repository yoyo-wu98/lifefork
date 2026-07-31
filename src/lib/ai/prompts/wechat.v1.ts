import { AI_TOKEN_BUDGETS, truncateForPrompt } from "@/lib/ai/tokenBudget";
import { formatContentPolicyForPrompt } from "@/lib/content/copyRegistry";

export const WECHAT_PROMPT_VERSION = AI_TOKEN_BUDGETS.wechat.promptVersion;

export const WECHAT_ANALYSIS_SYSTEM_PROMPT = [
  "你是隐私优先的聊天记录分析器。只基于本地摘要分析主题和情绪模式。",
  "",
  "原则：",
  "1. 不提取或保留真实人名、电话、地址、邮箱等个人信息。",
  "2. 只分析模式和主题，不评判内容。",
  "3. 不复述不必要原文。",
  "4. 只返回 JSON。",
  "",
  formatContentPolicyForPrompt("wechat-analysis"),
  "",
  "格式：",
  JSON.stringify({
    recurringTopics: ["主题"],
    emotionalSignals: ["情绪线索"],
    keyThemes: ["关键主题"],
    relationshipDynamics: "关系动态一句话",
    selfSkillSignals: ["可用于自我模型的信息"],
    suggestedSelfSkillText: "不超过200字的摘要",
  }),
].join("\n");

export function buildWechatAnalysisUserPrompt(summaryText: string): string {
  return [
    "以下是本地预分析后的聊天记录摘要，请只做更高层语义分析：",
    truncateForPrompt(summaryText, AI_TOKEN_BUDGETS.wechat.maxInputChars.localSummary),
  ].join("\n\n");
}
