import type { GenerateSelfSkillInput } from "@/lib/types";
import { detectArchetype } from "@/lib/selfSkill/archetypeRules";
import { desirePool, lifeMotifs, valueKeywords } from "@/lib/selfSkill/fixtures";

export function collectSelfSkillText(input: GenerateSelfSkillInput) {
  return [
    input.currentChoice,
    input.recurringEmotion,
    input.pastNode,
    input.hiddenSelf,
    input.futureSentence,
    input.extraText ?? "",
    input.wechatAnalysis?.suggestedSelfSkillText ?? "",
    input.wechatAnalysis?.topKeywords.join(" ") ?? "",
  ].join(" ");
}

export function detectValues(text: string): string[] {
  const found = Object.entries(valueKeywords)
    .filter(([, keys]) => keys.some((keyword) => text.includes(keyword)))
    .map(([value]) => value);
  return found.length ? found : ["自由", "意义", "连接"];
}

export function detectFears(text: string): string[] {
  const fears = new Set<string>();
  if (/(稳定|安全|工作|公司)/.test(text)) fears.add("担心稳定生活限制长期发展");
  if (/(失败|创业|辞职|转型)/.test(text)) fears.add("担心转向后仍然失败");
  if (/(关系|分手|亲密)/.test(text)) fears.add("担心亲密关系影响个人边界");
  if (/(普通|平庸|没意义)/.test(text)) fears.add("担心长期做自己不认可的事情");
  if (!fears.size) {
    ["担心浪费时间", "担心别人不理解", "担心选错"].forEach((fear) => fears.add(fear));
  }
  return [...fears];
}

export function buildPatterns(values: string[]): string[] {
  const base = [
    "你同时重视稳定和自主权，因此重大选择通常需要较长时间比较。",
    "你会先确认投入是否值得，再开始行动。",
    "你希望工作和生活符合自己的长期目标，不满足于短期维持。",
    "你容易推迟真正想做的事，压力随后会表现为焦虑或疲惫。",
    "你希望关系中有理解和支持，也需要保留个人边界。",
  ];

  if (values.includes("探索")) {
    base.unshift("你愿意探索新方向，同时会认真评估未知风险。");
  }

  return base.slice(0, 4);
}

export function selectLifeMotif(seed: string): string {
  const hash = [...seed].reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 17);
  return lifeMotifs[hash % lifeMotifs.length];
}

export function buildProfileRules(input: GenerateSelfSkillInput) {
  const text = collectSelfSkillText(input);
  const values = detectValues(text);
  const fears = detectFears(text);
  const recurringPatterns = buildPatterns(values);
  const archetype = detectArchetype(values);
  const lifeMotif = selectLifeMotif(text);

  return {
    text,
    values,
    fears,
    desires: desirePool.slice(0, 3),
    recurringPatterns,
    archetype,
    lifeMotif,
    innerConflict: `${values[0] ?? "自由"} vs ${values.includes("安全感") ? "安全感" : values[1] ?? "确定性"}`,
  };
}
