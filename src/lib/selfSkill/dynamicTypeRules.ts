import type {
  DynamicTypeBranchSignal,
  DynamicTypeCode,
  DynamicTypeDimension,
  DynamicTypeDimensionSignal,
  DynamicTypeForkShift,
  DynamicTypePole,
  DynamicTypeProfile,
  DynamicTypeStageTendency,
  DynamicTypeStressState,
  DynamicTypeTendency,
  Evidence,
  ForkPath,
  GenerateSelfSkillInput,
  LifeLane,
} from "@/lib/types";
import { collectSelfSkillText } from "@/lib/selfSkill/profileRules";

type DimensionConfig = {
  dimension: DynamicTypeDimension;
  left: DynamicTypePole;
  right: DynamicTypePole;
  leftSignals: string[];
  rightSignals: string[];
};

type BranchTypeConfig = {
  toType: DynamicTypeCode;
  driftLabel: string;
  contextNote: string;
  baseConfidence: number;
};

const PRODUCT_ROLE = {
  tendency: "dynamic-tendency",
  evidence: "evidence-backed",
  context: "context-sensitive",
} as const;

const LANGUAGE_BOUNDARIES = {
  deterministicPersonalityJudgment: false,
  clinicalFraming: false,
  typeRanking: false,
} as const;

const BASE_TYPE: DynamicTypeCode = "INFP";

const DIMENSION_CONFIGS: readonly DimensionConfig[] = [
  {
    dimension: "E_I",
    left: "E",
    right: "I",
    leftSignals: ["公开", "表达", "关系", "别人", "对话", "连接", "团队", "分享"],
    rightSignals: ["独处", "内心", "隐藏", "自己", "安静", "观察", "克制"],
  },
  {
    dimension: "S_N",
    left: "S",
    right: "N",
    leftSignals: ["现实", "稳定", "证据", "日程", "具体", "结构", "钱", "执行"],
    rightSignals: ["未来", "意义", "可能", "想象", "创作", "愿望", "方向", "人生"],
  },
  {
    dimension: "T_F",
    left: "T",
    right: "F",
    leftSignals: ["判断", "验证", "模型", "系统", "复盘", "选择", "策略", "风险"],
    rightSignals: ["情绪", "关系", "被理解", "亲密", "照顾", "害怕", "愿望", "温柔"],
  },
  {
    dimension: "J_P",
    left: "J",
    right: "P",
    leftSignals: ["计划", "秩序", "结构", "稳定", "边界", "持续", "完成"],
    rightSignals: ["探索", "试验", "变化", "可能", "开放", "尝试", "分岔"],
  },
];

const BRANCH_TYPE_BY_LANE: Record<LifeLane, BranchTypeConfig> = {
  stability: {
    toType: "ISFJ",
    driftLabel: "从开放探索转向秩序维护",
    contextNote: "维持现状时，你会更重视具体安排、固定节奏和稳定性。",
    baseConfidence: 0.62,
  },
  leap: {
    toType: "ENFP",
    driftLabel: "从内部思考转向实际测试",
    contextNote: "立即转向时，你会更主动接触外部反馈，并快速调整计划。",
    baseConfidence: 0.6,
  },
  experiment: {
    toType: "INTP",
    driftLabel: "从关注个人感受转向比较测试结果",
    contextNote: "采用试验方案时，你会更重视假设、测试结果和调整空间。",
    baseConfidence: 0.64,
  },
  relationship: {
    toType: "ENFJ",
    driftLabel: "从自我整理转向关系协商",
    contextNote: "先处理关系时，你会更重视沟通、他人需求和共同安排。",
    baseConfidence: 0.61,
  },
  creation: {
    toType: "ENFP",
    driftLabel: "从私下构思转向公开表达",
    contextNote: "推进创作时，你会更重视公开表达、反馈和持续输出。",
    baseConfidence: 0.6,
  },
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function countSignals(text: string, signals: readonly string[]): number {
  return signals.reduce((count, signal) => count + (text.includes(signal) ? 1 : 0), 0);
}

function formatEvidenceHint(evidence: readonly Evidence[]): string {
  if (!evidence.length) return "等待更多用户材料校准。";
  const primary = evidence[0]?.quote.replace(/^来自你的回答：/, "") ?? "当前材料";
  return `基于 ${evidence.length} 条材料，优先参考 ${primary}`;
}

function typeCodeFromDimensions(dimensions: Record<DynamicTypeDimension, DynamicTypeDimensionSignal>): DynamicTypeCode {
  return `${dimensions.E_I.tendency}${dimensions.S_N.tendency}${dimensions.T_F.tendency}${dimensions.J_P.tendency}` as DynamicTypeCode;
}

function buildDimensionSignal(config: DimensionConfig, text: string, evidenceIds: string[], evidenceHint: string): DynamicTypeDimensionSignal {
  const rawScore = countSignals(text, config.leftSignals) - countSignals(text, config.rightSignals);
  const balance = clamp(rawScore / 3, -1, 1);
  const tendency = balance >= 0 ? config.left : config.right;

  return {
    dimension: config.dimension,
    tendency,
    balance,
    confidence: clamp(0.54 + Math.abs(balance) * 0.18 + evidenceIds.length * 0.02, 0.54, 0.82),
    evidenceIds,
    evidenceHint,
  };
}

function buildDimensions(text: string, evidenceIds: string[], evidenceHint: string): Record<DynamicTypeDimension, DynamicTypeDimensionSignal> {
  const entries = DIMENSION_CONFIGS.map((config) => [config.dimension, buildDimensionSignal(config, text, evidenceIds, evidenceHint)] as const);
  return Object.fromEntries(entries) as Record<DynamicTypeDimension, DynamicTypeDimensionSignal>;
}

function stressStateForPath(path: Pick<ForkPath, "stateVector">): DynamicTypeStressState {
  const vector = path.stateVector;
  if (!vector) return "adaptive";
  if (vector.uncertainty >= 70 || vector.regret >= 70 || vector.energy <= 35) return "strained";
  if (vector.stability >= 70 && vector.uncertainty <= 40) return "settled";
  return "adaptive";
}

function buildTendency(params: {
  type: DynamicTypeCode;
  label: string;
  confidence: number;
  evidenceIds: string[];
  evidenceHint: string;
  contextNote: string;
  branch?: Pick<ForkPath, "id" | "title" | "scale" | "timeSpan" | "stateVector">;
}): DynamicTypeTendency {
  return {
    type: params.type,
    label: params.label,
    confidence: params.confidence,
    evidenceIds: params.evidenceIds,
    evidenceHint: params.evidenceHint,
    context: {
      branchId: params.branch?.id,
      branchTitle: params.branch?.title,
      lifeScale: params.branch?.scale,
      timeLabel: params.branch?.timeSpan?.durationLabel,
      stressState: params.branch ? stressStateForPath(params.branch) : "adaptive",
      note: params.contextNote,
    },
  };
}

export function buildDynamicTypeBranchSignal(
  path: Pick<ForkPath, "id" | "title" | "lane" | "scale" | "timeSpan" | "stateVector">,
  evidenceIds: string[] = [],
  fromType: DynamicTypeCode = BASE_TYPE,
): DynamicTypeBranchSignal {
  const config = BRANCH_TYPE_BY_LANE[path.lane ?? "experiment"];
  const stressState = stressStateForPath(path);
  const confidence = clamp(config.baseConfidence + (stressState === "settled" ? 0.04 : 0) - (stressState === "strained" ? 0.05 : 0), 0.52, 0.76);
  const evidenceHint = evidenceIds.length
    ? `参考 ${evidenceIds.length} 条个人材料，并结合该方案的时间范围和状态变化。`
    : "目前只参考方案条件和状态变化，需要更多个人材料确认。";
  const typeDrift: DynamicTypeForkShift = {
    id: `dynamic-type-shift-${path.id}`,
    branchId: path.id,
    branchTitle: path.title,
    lane: path.lane,
    scale: path.scale,
    fromType,
    toType: config.toType,
    driftLabel: config.driftLabel,
    confidence,
    evidenceIds,
    evidenceHint,
    contextNote: config.contextNote,
  };

  return {
    currentTypeTendency: config.toType,
    typeDrift,
    confidence,
    evidenceIds,
    evidenceHint,
    contextNote: config.contextNote,
  };
}

function collectForks(paths: readonly ForkPath[]): ForkPath[] {
  return paths.flatMap((path) => [path, ...collectForks(path.children ?? [])]);
}

function buildStageTypes(currentType: DynamicTypeCode, evidenceIds: string[], evidenceHint: string): DynamicTypeStageTendency[] {
  return [
    {
      id: "dynamic-type-stage-past",
      label: "过去节点倾向",
      type: "ISFP",
      confidence: 0.58,
      evidenceIds,
      evidenceHint,
      context: {
        stressState: "adaptive",
        note: "过去节点更重视情绪记忆、关系回应和个人感受。",
      },
    },
    {
      id: "dynamic-type-stage-present",
      label: "当前材料倾向",
      type: currentType,
      confidence: 0.66,
      evidenceIds,
      evidenceHint,
      context: {
        stressState: "adaptive",
        note: "当前倾向来自五问、补充材料和导入摘要的综合读数。",
      },
    },
    {
      id: "dynamic-type-stage-future",
      label: "长期方案倾向",
      type: "INFJ",
      confidence: 0.57,
      evidenceIds,
      evidenceHint,
      context: {
        stressState: "settled",
        note: "长期方案更重视持续影响、整体协调和经验积累。",
      },
    },
  ];
}

export function buildDynamicTypeProfile(input: GenerateSelfSkillInput, evidence: readonly Evidence[], forks: readonly ForkPath[]): DynamicTypeProfile {
  const text = collectSelfSkillText(input);
  const evidenceIds = evidence.map((item) => item.id);
  const evidenceHint = formatEvidenceHint(evidence);
  const dimensions = buildDimensions(text, evidenceIds, evidenceHint);
  const currentType = typeCodeFromDimensions(dimensions);
  const forkTypeShifts = collectForks(forks)
    .filter((path) => path.lane)
    .slice(0, 8)
    .map((path) =>
      path.dynamicType?.typeDrift.evidenceIds.length ? path.dynamicType.typeDrift : buildDynamicTypeBranchSignal(path, evidenceIds, currentType).typeDrift,
    );

  return {
    schemaVersion: "dynamic-type-profile.v0_5",
    productRole: PRODUCT_ROLE,
    languageBoundaries: LANGUAGE_BOUNDARIES,
    baseTendency: buildTendency({
      type: BASE_TYPE,
      label: `${BASE_TYPE} 基础倾向`,
      confidence: 0.55,
      evidenceIds,
      evidenceHint,
      contextNote: "基础倾向只作为对比基线，用来观察分支和阶段变化。",
    }),
    currentTendency: buildTendency({
      type: currentType,
      label: `${currentType} 当前倾向`,
      confidence: clamp(0.58 + evidenceIds.length * 0.03, 0.58, 0.72),
      evidenceIds,
      evidenceHint,
      contextNote: "当前倾向描述这批材料里的偏向，会随分支、压力和时间尺度调整。",
    }),
    dimensions,
    stageTypes: buildStageTypes(currentType, evidenceIds, evidenceHint),
    forkTypeShifts,
    evidenceIds,
    summary: `当前材料更接近 ${currentType} 倾向；该读数只描述这组证据里的互动偏向，分支、压力和时间尺度会改变结果。`,
  };
}
