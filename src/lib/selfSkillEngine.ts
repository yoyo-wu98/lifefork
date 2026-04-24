import { GenerateSelfSkillInput, SelfSkill, TimelineNode, ForkPath } from "@/lib/types";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const valueKeywords: Record<string, string[]> = {
  自由: ["自由", "离开", "逃", "换城市", "辞职", "不想被困住", "不想被安排", "空间"],
  创造: ["创作", "作品", "写作", "摄影", "音乐", "设计", "表达", "做东西", "项目"],
  安全感: ["稳定", "安全", "钱", "家庭", "房子", "确定", "风险"],
  亲密: ["关系", "分手", "亲密", "朋友", "家人", "被理解", "孤独", "陪伴"],
  成长: ["学习", "读博", "成长", "能力", "变强", "提升", "专业"],
  被看见: ["成功", "证明", "赢", "被看见", "价值", "意义", "不甘心"],
  探索: ["旅行", "世界", "未知", "冒险", "新生活", "新城市", "尝试"],
};

const motifs = [
  "不断逃离被定义，又不断寻找一个能安放自己的地方。",
  "在安全与自由之间反复折返，试图找到一种不背叛自己的生活。",
  "你像一条迟迟不肯汇入固定河道的河流，一边害怕漂泊，一边害怕停下。",
  "你的人生不是缺少方向，而是一直在等待一个足够诚实的开始。",
];

const desirePool = ["被自己承认", "更自由地表达", "稳定又不失热情", "被真正理解", "在现实里试出方向"];

function collectText(input: GenerateSelfSkillInput) {
  return [
    input.currentChoice,
    input.recurringEmotion,
    input.pastNode,
    input.hiddenSelf,
    input.futureSentence,
    input.extraText ?? "",
  ].join(" ");
}

function detectValues(text: string): string[] {
  const found = Object.entries(valueKeywords)
    .filter(([, keys]) => keys.some((k) => text.includes(k)))
    .map(([value]) => value);
  return found.length ? found : ["自由", "意义", "连接"];
}

function detectFears(text: string): string[] {
  const fears = new Set<string>();
  if (/(稳定|安全|工作|公司)/.test(text)) fears.add("害怕被稳定磨平");
  if (/(失败|创业|辞职|转型)/.test(text)) fears.add("害怕投入后仍然失败");
  if (/(关系|分手|亲密)/.test(text)) fears.add("害怕在亲密里失去自己");
  if (/(普通|平庸|没意义)/.test(text)) fears.add("害怕过完没有被自己承认的一生");
  if (!fears.size) {
    ["害怕浪费人生", "害怕被误解", "害怕选择错误"].forEach((f) => fears.add(f));
  }
  return [...fears];
}

function detectArchetype(values: string[]): string {
  if (values.includes("创造") && values.includes("自由")) return "延迟爆发型创作者";
  if (values.includes("自由") && values.includes("安全感")) return "自由边界探索者";
  if (values.includes("亲密") && values.includes("自由")) return "关系中的远行者";
  if (values.includes("成长") && values.includes("被看见")) return "现实主义梦想家";
  return "深海建造者";
}

function buildPatterns(values: string[]): string[] {
  const base = [
    "你渴望稳定带来的安全感，但又害怕它慢慢吞掉你的自由。",
    "你不是没有行动力，而是常常需要先确认这件事值得你付出。",
    "你对人生的要求不只是“过得还行”，而是希望它在某种意义上被自己承认。",
    "你习惯把很多真实愿望延后，直到它们以焦虑或疲惫的形式回来。",
    "你在关系中渴望被理解，但当期待过重时，又会想要后退。",
  ];

  if (values.includes("探索")) {
    base.unshift("你会被新的可能性点燃，但也会为未知付出情绪成本。");
  }

  return base.slice(0, 4);
}

function buildTimeline(input: GenerateSelfSkillInput): TimelineNode[] {
  return [
    {
      id: uid(),
      yearLabel: "过去",
      title: input.pastNode || "一个尚未被重新理解的节点",
      emotion: "复杂、迟疑、仍有回声",
      pattern: "这里可能藏着你后来很多选择的原型",
    },
    {
      id: uid(),
      yearLabel: "暗线",
      title: input.hiddenSelf || "一个没有被充分表达的自己",
      emotion: "压抑、等待、想被看见",
      pattern: "你把某部分自己藏了起来，但它仍在影响你的选择",
    },
    {
      id: uid(),
      yearLabel: "现在",
      title: input.currentChoice || "当前人生岔路",
      emotion: input.recurringEmotion || "混乱",
      pattern: "你正在安全与变化之间寻找新的平衡",
    },
    {
      id: uid(),
      yearLabel: "未来",
      title: input.futureSentence || "未来的我想对现在说的话",
      emotion: "温柔、清醒、带着提醒",
      pattern: "你期待未来的自己证明：今天的犹豫并不是白费",
    },
  ];
}

function buildForks(currentChoice: string): ForkPath[] {
  return [
    {
      id: "path-a",
      title: "路径 A：留在熟悉的河道",
      subtitle: "先稳住，再观察。",
      summary: `你选择暂时维持现有结构，不做激烈改变。围绕「${currentChoice || "当前选择"}」先恢复能量，再等待更清晰的窗口。`,
      gains: ["短期安全感提升", "生活结构稳定", "能量恢复更可控"],
      costs: ["长期压抑感可能累积", "行动惯性增强", "对真实愿望继续延后"],
      futureSelfName: "一年后的你",
      futureSelfVoice: "平静、谨慎、带一点未完成",
    },
    {
      id: "path-b",
      title: "路径 B：直接推开那扇门",
      subtitle: "高风险，高一致性。",
      summary: "你做出更大转向，短期会经历不确定、压力和身份重组，但自我一致性与自由感会提升。",
      gains: ["自由感增强", "自我一致性提高", "快速获得真实反馈"],
      costs: ["财务与关系压力上升", "短期混乱明显", "需要更强心理韧性"],
      futureSelfName: "两年后的你",
      futureSelfVoice: "锋利、诚实、带着燃烧后的清醒",
    },
    {
      id: "path-c",
      title: "路径 C：用 90 天试验一条新路",
      subtitle: "不是逃离，也不是忍耐，而是验证。",
      summary:
        "你暂时保留现有结构，但给真实愿望一个可被现实检验的出口。你用 90 天做一个小型项目、一次申请、一次谈话或一次作品试验。",
      gains: ["风险被拆小", "愿望被认真对待", "你会获得更真实的信息"],
      costs: ["需要持续自律", "短期会更忙", "可能发现自己其实没有那么想要"],
      futureSelfName: "90 天后的你",
      futureSelfVoice: "清醒、温柔、带一点终于开始行动后的平静",
    },
  ];
}

export function generateSelfSkill(input: GenerateSelfSkillInput): SelfSkill {
  const text = collectText(input);
  const values = detectValues(text);
  const fears = detectFears(text);
  const recurringPatterns = buildPatterns(values);
  const archetype = detectArchetype(values);
  const lifeMotif = motifs[Math.floor(Math.random() * motifs.length)];

  const evidence = [
    { id: uid(), source: "question" as const, quote: `来自你的回答：「${input.currentChoice.slice(0, 48)}」` },
    { id: uid(), source: "question" as const, quote: `来自你的回答：「${input.hiddenSelf.slice(0, 48)}」` },
    {
      id: uid(),
      source: input.extraText ? ("extra_text" as const) : ("generated" as const),
      quote: input.extraText
        ? `来自你粘贴的文字：「${input.extraText.slice(0, 48)}」`
        : "系统推断：你正在尝试把犹豫转化为可行动的路径。",
    },
  ];

  const claims = [
    {
      id: uid(),
      text: `你目前的核心冲突更接近 ${values[0]} 与 ${values[1] ?? "安全感"} 之间的拉扯。`,
      confidence: 0.78,
      evidenceIds: evidence.slice(0, 2).map((e) => e.id),
    },
    {
      id: uid(),
      text: "你需要的不是立刻定终局，而是一个不会背叛自己的试验结构。",
      confidence: 0.84,
      evidenceIds: evidence.map((e) => e.id),
    },
  ];

  return {
    id: uid(),
    version: "v0",
    createdAt: new Date().toISOString(),
    selectedVersion: input.selectedVersion,
    questions: {
      currentChoice: input.currentChoice,
      recurringEmotion: input.recurringEmotion,
      pastNode: input.pastNode,
      hiddenSelf: input.hiddenSelf,
      futureSentence: input.futureSentence,
    },
    extraText: input.extraText,
    identity: {
      displayName: "正在分岔的你",
      languageStyle: input.extraText ? "叙事型、带自省和隐喻" : "简洁直接，带一点克制",
      emotionalTone: input.recurringEmotion || "复杂但清醒",
      selfNarrative: lifeMotif,
      archetype,
    },
    semantic: {
      values,
      fears,
      desires: desirePool.slice(0, 3),
      recurringPatterns,
      innerConflict: `${values[0] ?? "自由"} vs ${values.includes("安全感") ? "安全感" : values[1] ?? "确定性"}`,
      lifeMotif,
    },
    decision: {
      riskPreference: /害怕|稳定|安全/.test(text) ? "谨慎试探型" : "机会驱动型",
      workStyle: /项目|作品|创作/.test(text) ? "项目冲刺型" : "结构迭代型",
      conflictStyle: /关系|分手|亲密/.test(text) ? "先退后谈型" : "延迟处理型",
      changeTolerance: /换|辞|转/.test(text) ? "中高，需缓冲" : "中等，需证据",
      attachmentPattern: /被理解|孤独/.test(text) ? "渴望连接但保留边界" : "独立自持型",
    },
    timeline: buildTimeline(input),
    evidence,
    claims,
    forks: buildForks(input.currentChoice),
  };
}
