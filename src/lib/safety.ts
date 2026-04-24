const crisisKeywords = ["自杀", "不想活", "死了算了", "伤害自己", "杀人", "报复", "毁掉", "活不下去", "割腕", "跳楼"];

export function containsCrisisSignal(text: string): boolean {
  const source = text.toLowerCase();
  return crisisKeywords.some((keyword) => source.includes(keyword));
}

export const safetyMessage =
  "我不能把这当作普通的人生模拟来回答。你现在描述的是一个需要现实支持的状态。请立刻联系身边可信任的人，或联系当地紧急服务/心理危机支持资源。如果你愿意，我可以先帮你把此刻的感受整理成一段可以发给朋友、家人或专业人士的话。";
