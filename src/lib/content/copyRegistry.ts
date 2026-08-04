import type { ContentAuditIssue, CopyEntry, DynamicTypeContentCopy, LifeMapNarrativeTemplate, PromptOutputPolicy, ShareCardTemplate } from "@/lib/content/types";

export const CONTENT_SYSTEM_OWNER = "content-systems-narrative-architecture" as const;
export const CONTENT_SYSTEM_VERSION = "v0.7";

export function defineCopy<TValue>(entry: CopyEntry<TValue>): CopyEntry<TValue> {
  return entry;
}

export const CANONICAL_TERMS_COPY = defineCopy({
  id: "global.terms.canonical.v1",
  surface: "global",
  intent: "set-expectation",
  tone: "clear",
  riskLevel: "low",
  owner: CONTENT_SYSTEM_OWNER,
  version: CONTENT_SYSTEM_VERSION,
  value: {
    productName: "LifeFork",
    productNameZh: "人生岔路",
    selfSkill: "Self Skill",
    lifeMap: "人生地图",
    futureSelf: "未来自我",
    possibilitySimulation: "可能性模拟",
    dialogueDraft: "模拟对话",
    currentChoice: "当前选择",
    innerConflict: "核心冲突",
    evidence: "证据",
    reversibleExperiment: "可逆实验",
  },
});

export const APP_METADATA_COPY = defineCopy({
  id: "global.metadata.app.v1",
  surface: "page",
  intent: "set-expectation",
  tone: "clear",
  riskLevel: "low",
  owner: CONTENT_SYSTEM_OWNER,
  version: CONTENT_SYSTEM_VERSION,
  value: {
    title: "LifeFork / 人生岔路",
    description: "分析当前选择，比较不同方案及其长期影响。",
  },
});

export const LANDING_PAGE_COPY = defineCopy({
  id: "landing.setExpectation.hero.v1",
  surface: "page",
  intent: "set-expectation",
  tone: "clear",
  riskLevel: "medium",
  owner: CONTENT_SYSTEM_OWNER,
  version: CONTENT_SYSTEM_VERSION,
  value: {
    brandKicker: "LifeFork / 人生岔路",
    headline: ["整理你现在的问题。", "比较方案、依据、成本和下一步。"],
    body: "回答 5 个关于你当前选择的问题，LifeFork 会整理出你的处境、几条可选路线，以及每条路线的收益、成本和下一步。你可以继续和每条路线里的「模拟的你」对话。每条结论都注明依据来自你的回答、公开统计还是 AI 推测。",
    primaryAction: "开始分析",
    secondaryAction: "查看完整示例",
  },
});

export const APP_NAV_COPY = defineCopy({
  id: "navigation.action.global.v1",
  surface: "navigation",
  intent: "action-label",
  tone: "clear",
  riskLevel: "low",
  owner: CONTENT_SYSTEM_OWNER,
  version: CONTENT_SYSTEM_VERSION,
  value: {
    stepLabels: {
      landing: "首页",
      "select-version": "五问访谈",
      questions: "五问访谈",
      "wechat-import": "微信导入",
      "extra-text": "补充材料",
      methods: "分析设置",
      generating: "生成中",
      "self-skill": "个人分析",
      timeline: "时间线",
      forks: "方案地图",
      chat: "方案对话",
      share: "结果卡片",
      editor: "本地编辑台",
    },
    actions: {
      home: "回到主页",
      currentPosition: "当前位置",
      selfSkill: "个人分析",
      timeline: "时间线",
      lifeMap: "方案地图",
      currentDialogue: "方案对话",
      shareCard: "结果卡片",
      demoScenario: "完整示例",
      reset: "清空全部数据",
    },
  },
});

export const DISCLAIMER_COPY = defineCopy({
  id: "global.disclosure.privacySafety.v1",
  surface: "global",
  intent: "risk-disclosure",
  tone: "careful",
  riskLevel: "high",
  owner: CONTENT_SYSTEM_OWNER,
  version: CONTENT_SYSTEM_VERSION,
  value:
    "LifeFork 根据你输入的内容生成分析和情景模拟，结果可能不准确，请自行核对。不要把它作为医疗、心理诊断或重大决策的唯一依据。",
});

export const GENERATION_LINES_COPY = defineCopy({
  id: "loading.guideProgress.selfSkillGeneration.v1",
  surface: "loading",
  intent: "guide-progress",
  tone: "restrained",
  riskLevel: "medium",
  owner: CONTENT_SYSTEM_OWNER,
  version: CONTENT_SYSTEM_VERSION,
  value: [
    "正在整理你的回答……",
    "正在识别主要目标和顾虑……",
    "正在生成个人分析……",
    "正在生成时间线和备选方案……",
    "正在准备方案模拟对话……",
  ],
});

export const FUTURE_SELF_LINES_COPY = defineCopy({
  id: "shareCard.summarize.futureSelfLines.v1",
  surface: "share-card",
  intent: "summarize-result",
  tone: "clear",
  riskLevel: "medium",
  owner: CONTENT_SYSTEM_OWNER,
  version: CONTENT_SYSTEM_VERSION,
  value: [
    "先确认你要解决的问题，再比较方案。",
    "把大决定拆成一个可以在 7 天内完成的测试。",
    "同时记录收益、成本和你愿意承担的最坏结果。",
    "信息不足时，先做低成本验证，再决定是否继续。",
    "稳定和改变可以分阶段处理。",
    "如果一个选择反复出现，给它一个明确的验证期限。",
    "每周根据新证据更新一次判断。",
  ],
});

export const SHARE_CARD_TEMPLATE_COPY = defineCopy<ShareCardTemplate>({
  id: "shareCard.summarize.resultTemplate.v1",
  surface: "share-card",
  intent: "summarize-result",
  tone: "clear",
  riskLevel: "medium",
  owner: CONTENT_SYSTEM_OWNER,
  version: CONTENT_SYSTEM_VERSION,
  value: {
    brandKicker: "LIFEFORK / 人生岔路",
    labels: {
      archetype: "当前决策特征",
      scale: "时间范围",
      innerConflict: "核心冲突",
      currentChoice: "当前选择",
      dynamicType: "沟通和决策倾向（实验功能）",
      currentTypeTendency: "当前倾向",
      typeDrift: "选择该方案后的变化",
      confidence: "参考度",
      evidenceHint: "判断依据",
    },
    clipboardLabels: {
      intro: "我的 LifeFork 分析结果：",
      archetype: "当前决策特征",
      innerConflict: "核心冲突",
      currentChoice: "当前选择",
      timePoint: "当前时间点",
      futureSelfLine: "行动建议",
      currentTypeTendency: "当前倾向",
      typeDrift: "选择方案后的变化",
      confidence: "参考度",
      evidenceHint: "判断依据",
    },
    actions: {
      copyResult: "复制结果",
      exportJson: "导出完整数据（JSON）",
      refreshFutureSelfLine: "换一条行动建议",
      backToMap: "回到方案地图",
      restart: "重新开始",
    },
    footerBrand: "LifeFork",
    footerLine: "根据你的输入生成，请核对后使用。",
    exportFileName: "lifefork-self-skill.json",
  },
});

export const LIFE_SIMULATION_ROOT_NARRATIVE_COPY = defineCopy<Record<"stability" | "leap" | "experiment" | "relationship", LifeMapNarrativeTemplate>>({
  id: "lifeMap.simulate.rootNarratives.v1",
  surface: "life-map",
  intent: "simulate-life-path",
  tone: "clear",
  riskLevel: "medium",
  owner: CONTENT_SYSTEM_OWNER,
  version: CONTENT_SYSTEM_VERSION,
  value: {
    stability: {
      title: "方案 A：维持现状",
      subtitle: "保留当前工作、关系和生活安排。",
      summary: (choice) => `针对「${choice}」，这个方案暂时不做重大调整。短期风险较低，你可以继续积累资源；需要注意的是，原有问题可能继续存在。`,
      gains: ["收入和生活节奏更稳定", "关系压力相对较低", "有更多时间收集信息"],
      costs: ["问题可能长期拖延", "改变成本会逐步增加", "对当前状态的不满可能继续累积"],
      futureSelfName: "维持现状后的你",
      futureSelfVoice: "谨慎，重视风险和长期稳定",
      zoomHint: "查看 3 年和 10 年后的长期影响。",
    },
    leap: {
      title: "方案 B：立即转向",
      subtitle: "现在就做较大的工作、城市或关系调整。",
      summary: (choice) => `针对「${choice}」，这个方案立即执行主要变化。你会更快获得真实反馈，同时需要承担收入、关系和适应成本。`,
      gains: ["更快验证新方向", "自主感可能提升", "减少长期拖延"],
      costs: ["短期收入和生活压力上升", "关系需要重新协调", "失败成本更集中"],
      futureSelfName: "立即转向后的你",
      futureSelfVoice: "直接，重点说明结果和代价",
    },
    experiment: {
      title: "方案 C：先做 90 天试验",
      subtitle: "保留现状，同时用小规模行动验证新方向。",
      summary: (choice) => `针对「${choice}」，这个方案先设定一个 90 天测试，包括明确目标、投入上限和复盘日期。测试结果用于决定下一步。`,
      gains: ["重大风险较低", "可以获得真实数据", "允许根据结果调整方向"],
      costs: ["需要同时处理原有事务和试验", "反馈速度低于立即转向", "需要持续记录和复盘"],
      futureSelfName: "完成 90 天试验后的你",
      futureSelfVoice: "具体，重点说明测试结果和下一步",
    },
    relationship: {
      title: "方案 D：先处理关系和现实条件",
      subtitle: "先和相关的人确认支持、限制和可调整条件。",
      summary: (choice) => `针对「${choice}」，这个方案先处理会影响决定的关系和现实条件，例如家庭责任、合作方式、收入底线和时间安排。`,
      gains: ["减少信息不对称", "明确可获得的支持", "降低后续冲突"],
      costs: ["需要进行困难沟通", "部分条件可能无法协调", "决策时间可能延长"],
      futureSelfName: "完成关键沟通后的你",
      futureSelfVoice: "清楚说明边界、责任和可协商条件",
    },
  },
});

export const LIFE_MAP_DIALOGUE_COPY = defineCopy({
  id: "lifeMap.hint.dialogue.v1",
  surface: "life-map",
  intent: "dialogue-guidance",
  tone: "careful",
  riskLevel: "medium",
  owner: CONTENT_SYSTEM_OWNER,
  version: CONTENT_SYSTEM_VERSION,
  value: {
    pathHints: {
      stability: "确认维持现状的期限，并记录问题是否在改善。",
      leap: "执行前列出资金、时间、关系和失败后的退出方案。",
      relationship: "明确哪些条件需要沟通，哪些责任需要重新分配。",
      experiment: "把目标改写成一次有期限、有指标的小规模测试。",
      creation: "先完成一个可以交付和获得反馈的最小成果。",
      default: "把当前问题拆成一个可以实际验证的动作。",
    },
    stageHints: {
      longHorizon: "比较这个方案在收入、关系、健康和自主性上的长期影响。",
      shortHorizon: "先确定今天可以完成的一个动作，并写下完成标准。",
      relationship: "区分个人责任、共同责任和无法控制的外部条件。",
      leap: "确认资源底线、退出条件和出现问题后的处理方案。",
      default: "先获得一个可观察的结果，再更新判断。",
    },
  },
});

export const DYNAMIC_EVENT_TYPE_COPY = defineCopy({
  id: "dynamicEvent.typeLabel.coreTypes.v1",
  surface: "dynamic-event",
  intent: "dynamic-type-label",
  tone: "clear",
  riskLevel: "low",
  owner: CONTENT_SYSTEM_OWNER,
  version: CONTENT_SYSTEM_VERSION,
  value: {
    milestone: "关键节点",
    signal: "信号",
    cost: "代价",
    support: "支持",
    experiment: "实验",
    risk: "风险",
  },
});

export const DYNAMIC_TYPE_PROFILE_COPY = defineCopy<DynamicTypeContentCopy>({
  id: "dynamicType.profile.boundary.v1",
  surface: "dynamic-type",
  intent: "dynamic-type-label",
  tone: "careful",
  riskLevel: "high",
  owner: CONTENT_SYSTEM_OWNER,
  version: CONTENT_SYSTEM_VERSION,
  value: {
    productRole: {
      tendency: "MBTI 在 LifeFork 里只表示动态倾向。",
      evidence: "类型读数必须能回到用户材料、状态变量或分支语境。",
      context: "同一个人在不同方案、阶段和压力状态下，类型倾向可能变化。",
    },
    languageBoundaries: {
      deterministicPersonalityJudgment: "避免把类型写成人格定论。",
      clinicalFraming: "避免医学、心理诊断或治疗暗示。",
      typeRanking: "避免暗示某个类型更高级、更成熟或更值得追求。",
    },
    branchDetailLabels: {
      title: "沟通和决策倾向（实验功能）",
      currentTypeTendency: "当前倾向",
      typeDrift: "选择方案后的变化",
      confidence: "参考度",
      evidenceHint: "判断依据",
      contextNote: "方案条件",
    },
  },
});

export const PRODUCT_RESEARCH_BOUNDARY_COPY = defineCopy({
  id: "global.boundary.productResearch.v1",
  surface: "global",
  intent: "set-expectation",
  tone: "careful",
  riskLevel: "high",
  owner: CONTENT_SYSTEM_OWNER,
  version: CONTENT_SYSTEM_VERSION,
  value: {
    evidence: "只把用户提供材料转成可追溯假设，保留不确定性。",
    decision: "呈现路径、代价、证据和可逆实验，不替用户做人生决定。",
    safety: "危机、自伤、伤害他人等信号必须转向现实支持和紧急资源。",
    privacy: "聊天记录和额外材料只做必要摘要，不保留不必要原文或个人信息。",
    consistency: "同一概念统一使用 LifeFork、Self Skill、人生地图、未来自我、当前选择、核心冲突。",
  },
});

export const AI_OUTPUT_POLICY_COPY = defineCopy<PromptOutputPolicy>({
  id: "aiOutput.promptStyle.policy.v1",
  surface: "ai-output",
  intent: "prompt-output-style",
  tone: "careful",
  riskLevel: "high",
  owner: CONTENT_SYSTEM_OWNER,
  version: CONTENT_SYSTEM_VERSION,
  value: {
    principles: [
      "基于证据表达为假设，使用「可能」「倾向于」「似乎」等不确定措辞。",
      "不做心理诊断、命运预测、道德评判、成功保证或单一路径劝导。",
      "明确说明结果是基于有限输入生成的情景模拟。",
      "优先说明具体收益、成本、时间范围、证据和下一步行动。",
      "使用客户能直接理解的短句，避免隐喻、文学化表达、鸡汤和神秘化表达。",
    ],
    canonicalTerms: CANONICAL_TERMS_COPY.value,
    avoid: ["命运判决", "一定会成功", "你必须", "医学或心理诊断", "泛化鸡汤", "文学隐喻", "抽象口号"],
    highRiskBoundary: PRODUCT_RESEARCH_BOUNDARY_COPY.value.safety,
  },
});

export const contentRegistry = [
  CANONICAL_TERMS_COPY,
  APP_METADATA_COPY,
  LANDING_PAGE_COPY,
  APP_NAV_COPY,
  DISCLAIMER_COPY,
  GENERATION_LINES_COPY,
  FUTURE_SELF_LINES_COPY,
  SHARE_CARD_TEMPLATE_COPY,
  LIFE_SIMULATION_ROOT_NARRATIVE_COPY,
  LIFE_MAP_DIALOGUE_COPY,
  DYNAMIC_EVENT_TYPE_COPY,
  DYNAMIC_TYPE_PROFILE_COPY,
  PRODUCT_RESEARCH_BOUNDARY_COPY,
  AI_OUTPUT_POLICY_COPY,
] as const;

const requiredCopyFields = ["id", "surface", "intent", "tone", "riskLevel", "owner", "version"] as const;

export function auditContentRegistry(entries: readonly CopyEntry<unknown>[] = contentRegistry): ContentAuditIssue[] {
  const issues: ContentAuditIssue[] = [];
  const seen = new Set<string>();

  entries.forEach((entry, index) => {
    requiredCopyFields.forEach((field) => {
      if (!entry[field]) {
        issues.push({
          id: entry.id || `contentRegistry[${index}]`,
          severity: "error",
          message: `Missing required content metadata field: ${field}`,
        });
      }
    });

    if (entry.owner !== CONTENT_SYSTEM_OWNER) {
      issues.push({
        id: entry.id,
        severity: "error",
        message: `Unexpected content owner: ${entry.owner}`,
      });
    }

    if (seen.has(entry.id)) {
      issues.push({
        id: entry.id,
        severity: "error",
        message: "Duplicate content id",
      });
    }

    seen.add(entry.id);
  });

  return issues;
}

export function formatContentPolicyForPrompt(context: string): string {
  const policy = AI_OUTPUT_POLICY_COPY.value;
  const terms = policy.canonicalTerms;

  return [
    `Content Systems owner=${AI_OUTPUT_POLICY_COPY.owner}; version=${AI_OUTPUT_POLICY_COPY.version}; context=${context}`,
    "统一输出口径：",
    ...policy.principles.map((principle, index) => `${index + 1}. ${principle}`),
    `固定称呼：${terms.productName} / ${terms.selfSkill} / ${terms.lifeMap} / ${terms.futureSelf} / ${terms.currentChoice} / ${terms.innerConflict} / ${terms.possibilitySimulation}`,
    `避免表达：${policy.avoid.join("、")}`,
    `高风险边界：${policy.highRiskBoundary}`,
  ].join("\n");
}
