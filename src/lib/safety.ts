const crisisKeywords = [
  "自杀",
  "不想活",
  "活不下去",
  "死了算了",
  "伤害自己",
  "我要报复",
  "我想报复",
  "毁掉他",
  "毁掉她",
  "毁掉他们",
  "割腕",
  "服毒",
  "烧炭",
];

// High-precision phrases: kept as substring matches.
const HIGH_PRECISION = [
  "我想杀人",
  "我要杀人",
  "想自杀",
  "要自杀",
  "去自杀",
  "想死",
  "一了百了",
  "轻生",
];

const HIGH_RISK_PATTERNS: RegExp[] = [
  // First-person suicidal ideation: "我不想活了" / "我不想再活下去"
  /我?不想.{0,4}活/,
  /我?不想.{0,4}继续.{0,4}(人生|日子|生活)/,
  /活着没(有)?意思/,
  /不想(再)?(继续)?活下去/,
  /想(要)?(去)?死/,
  /想.{0,6}(自杀|轻生)/,
  /我?要去?(自杀|轻生)/,
  /活(得)?(太|很)?没意思/,
  // Self-harm with method/location: "跳桥" "跳楼" "跳河" — but not "跳楼价/股价跳楼"
  /跳(楼|桥|河|湖|海|轨)/,
  /上(吊|吊死)/,
  /烧炭(自杀|轻生|了|去死)?/,
  // Revenge/violence intent with first-person or explicit target
  /我?要(杀|砍|捅|弄死|炸|毒死)/,
  /我?想(杀|砍|捅|弄死|炸|毒死)/,
  /(杀|弄死|干掉)(了|掉)?(我|自己)/,
  // "毁掉自己" only when self-destructive intent is clear
  /毁(了|掉|灭)?自己(的)?(人生|命|生活|前途)?$/,
  /想(要)?毁(了|掉|灭)(我|自己|他|她|他们)/,
  /我?要(报|复)(仇)?/,
];

export function containsCrisisSignal(text: string): boolean {
  const source = text.toLowerCase();
  if (HIGH_PRECISION.some((phrase) => source.includes(phrase))) return true;
  return HIGH_RISK_PATTERNS.some((pattern) => pattern.test(source));
}

export const safetyMessage =
  "你写下的这些内容让我担心你现在的安全。请立刻联系身边可信任的人，或拨打心理援助热线 400-161-9995（24 小时）；紧急情况请拨打 120 或 110。如果你愿意，我可以先帮你把此刻的感受整理成一段可以发给朋友、家人或专业人士的话。";
