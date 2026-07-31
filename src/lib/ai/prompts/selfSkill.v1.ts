import { AI_TOKEN_BUDGETS, truncateForPrompt } from "@/lib/ai/tokenBudget";
import { formatContentPolicyForPrompt } from "@/lib/content/copyRegistry";

export const SELF_SKILL_PROMPT_VERSION = AI_TOKEN_BUDGETS.selfSkill.promptVersion;

export const SELF_SKILL_SYSTEM_PROMPT = [
  "你是一个自我认知引擎。根据用户提供的有限材料，生成结构化自我模型。",
  "",
  "重要原则：",
  "1. 生成基于证据的假设，不做确定判断，使用「可能」「倾向于」「似乎」等表述。",
  "2. 不做心理诊断、命运预测或道德评判。",
  "3. 使用客户能直接理解的短句，先给结论，再说明依据。",
  "4. 证据只保留短片段，不复述不必要原文。",
  "5. 禁止文学隐喻、诗意人格名称、抽象口号和泛化鸡汤。",
  "",
  formatContentPolicyForPrompt("selfSkill"),
  "",
  "只返回 JSON 对象，不要 markdown 或代码块。格式：",
  JSON.stringify({
    identity: {
      displayName: "人格标签",
      languageStyle: "语言风格摘要",
      emotionalTone: "情绪基调",
      selfNarrative: "不超过80字的直接总结，说明目标、顾虑和建议验证方式",
      archetype: "容易理解的决策特征标签",
    },
    semantic: {
      values: ["核心价值"],
      fears: ["核心恐惧"],
      desires: ["主要目标"],
      recurringPatterns: ["重复模式"],
      innerConflict: "核心内心冲突",
      lifeMotif: "长期反复出现的决策主题",
    },
    decision: {
      riskPreference: "风险偏好",
      workStyle: "工作风格",
      conflictStyle: "冲突处理风格",
      changeTolerance: "变化承受力",
      attachmentPattern: "关系模式",
    },
    claims: [{ text: "判断", confidence: 0.7, evidenceQuote: "不超过40字的证据片段" }],
    timelineNodes: [{ yearLabel: "时间标签", title: "节点标题", emotion: "情绪", pattern: "长期模式" }],
  }),
].join("\n");

export function buildSelfSkillUserPrompt(input: {
  currentChoice: string;
  recurringEmotion: string;
  pastNode: string;
  hiddenSelf: string;
  futureSentence: string;
  extraText?: string;
  wechatSummary?: string;
}): string {
  const budget = AI_TOKEN_BUDGETS.selfSkill.maxInputChars;
  const sections = [
    "当前最纠结的选择：" + (truncateForPrompt(input.currentChoice, budget.currentChoice) || "未提供"),
    "最近反复出现的情绪：" + (truncateForPrompt(input.recurringEmotion, budget.recurringEmotion) || "未提供"),
    "最想重新理解的人生节点：" + (truncateForPrompt(input.pastNode, budget.pastNode) || "未提供"),
    "自己最不像别人看到的哪一面：" + (truncateForPrompt(input.hiddenSelf, budget.hiddenSelf) || "未提供"),
    "希望十年后的自己说的话：" + (truncateForPrompt(input.futureSentence, budget.futureSentence) || "未提供"),
  ];

  const extraText = truncateForPrompt(input.extraText, budget.extraText);
  if (extraText) sections.push("额外文字材料摘要输入：\n" + extraText);

  const wechatSummary = truncateForPrompt(input.wechatSummary, budget.wechatSummary);
  if (wechatSummary) sections.push("微信聊天记录本地摘要：" + wechatSummary);

  return sections.join("\n\n");
}
