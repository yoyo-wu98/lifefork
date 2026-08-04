import type {
  AssetOutlook,
  AssetProjection,
  AssetTrend,
  ForkPath,
  LifeScale,
} from "@/lib/types";

export const ASSET_OUTLOOK_DISCLAIMER =
  "以下是情景模拟的范围示意，不是预测，也不是理财建议。数字以「当前每月可投资结余」为 1 个单位，仅用于比较方案之间的相对差异。";

export const ASSET_SIMULATION_TAG = "情景模拟 · 非预测";

export const ASSET_TREND_LABEL: Record<AssetTrend, string> = {
  rising: "总体上升",
  stable: "总体平稳",
  volatile: "先降后回升",
  declining: "总体下行",
};

const ASSET_SCALE_LABEL: Partial<Record<LifeScale, string>> = {
  life: "10 年",
  decade: "10 年",
  era: "3 年",
  year: "1 年",
  month: "1 年",
  week: "1 年",
  day: "1 年",
  hour: "1 年",
};

type SignalKey = "growth" | "stable" | "incomeRisk" | "cost";

const SIGNAL_PATTERNS: Array<{ key: SignalKey; regex: RegExp }> = [
  {
    key: "growth",
    regex: /复利|积累|信用|资源(?!不足)|技能|作品|客户|增长|升值|资产|储蓄|存款|变现|回报|盈利|收益|利息/,
  },
  { key: "stable", regex: /稳定|保障|固定收入|抗风险|结余|工资|薪资|底薪/ },
  {
    key: "incomeRisk",
    regex: /收入(不稳|下降|中断|仍有不确定|和生活压力)|现金流|负债|房贷|车贷|账单|断供|赤字|透支/,
  },
  { key: "cost", regex: /支出|成本|投入|消耗/ },
];

const SIGNAL_LABEL: Record<SignalKey, string> = {
  growth: "提到资源/积累/复利",
  stable: "提到收入与生活稳定",
  incomeRisk: "提到现金流或收入压力",
  cost: "提到支出与成本",
};

type LaneProfile = {
  label: string;
  growth: number;
  stability: number;
  floor: number;
  ceiling: number;
};

const LANE_PROFILE: Record<string, LaneProfile> = {
  stability: { label: "稳定线", growth: 0.38, stability: 0.92, floor: 0.82, ceiling: 0.28 },
  leap: { label: "转向线", growth: 0.95, stability: 0.42, floor: 0.5, ceiling: 0.9 },
  experiment: { label: "试验线", growth: 0.62, stability: 0.68, floor: 0.62, ceiling: 0.6 },
  relationship: { label: "关系线", growth: 0.5, stability: 0.74, floor: 0.66, ceiling: 0.48 },
  creation: { label: "创造线", growth: 0.85, stability: 0.5, floor: 0.55, ceiling: 0.8 },
  default: { label: "方案", growth: 0.72, stability: 0.6, floor: 0.62, ceiling: 0.6 },
};

/** 规模因子：长期容器节点的曲线更接近"全周期曲线" */
function scaleFactor(scale: LifeScale | undefined): number {
  switch (scale) {
    case "life":
    case "decade":
      return 1;
    case "era":
      return 0.72;
    case "year":
      return 0.52;
    case "month":
    case "week":
      return 0.34;
    default:
      return 0.24;
  }
}

function monthsFromLabel(durationLabel: string | undefined): number | null {
  if (!durationLabel) return null;
  const years = durationLabel.match(/(\d+)\s*年/);
  if (years) return Number(years[1]) * 12;
  if (/一整条人生|一生|晚年/.test(durationLabel)) return 120;
  const months = durationLabel.match(/(\d+)\s*个月/);
  if (months) return Number(months[1]);
  const days = durationLabel.match(/(\d+)\s*天/);
  if (days) return Math.max(1, Math.round(Number(days[1]) / 30));
  return null;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * 基于 fork 文本信号 + 状态向量 + lane 的启发式资产情景生成器。
 * 纯本地、确定性（同一输入永远得到同一曲线），不依赖 AI。
 * 数字刻意保持保守：单位是"每月可投资结余"，10 年基准约为 1.5x–4x 累计本金，
 * 以避免给用户造成"承诺收益"的错觉。
 */
export function buildAssetOutlook(path: ForkPath): AssetOutlook {
  const corpus = [path.title, path.subtitle, path.summary, ...path.gains, ...path.costs].join("。");
  const hits = new Set<SignalKey>();
  for (const { key, regex } of SIGNAL_PATTERNS) {
    if (regex.test(corpus)) hits.add(key);
  }

  const lane = LANE_PROFILE[path.lane ?? ""] ?? LANE_PROFILE.default;
  const vector = path.stateVector;

  let growth = lane.growth;
  let stability = lane.stability;
  let floorFactor = lane.floor;
  let ceilingFactor = lane.ceiling;

  // 文本信号调节
  if (hits.has("growth")) growth += 0.22;
  if (hits.has("stable")) {
    stability += 0.06;
    growth += 0.05;
  }
  if (hits.has("incomeRisk")) {
    stability -= 0.18;
    growth -= 0.14;
    floorFactor -= 0.12;
  }
  if (hits.has("cost") && !hits.has("growth")) growth -= 0.05;

  // 状态向量调节（0-100 → 0-1）
  if (vector) {
    growth += (vector.stability - 50) / 250;
    stability = stability * 0.75 + (1 - vector.uncertainty / 100) * 0.25;
  }

  growth = clamp(growth, 0.3, 1.35);
  stability = clamp(stability, 0.2, 0.97);
  floorFactor = clamp(floorFactor, 0.35, 0.9);
  ceilingFactor = clamp(ceilingFactor, 0.2, 1.1);

  const factor = scaleFactor(path.scale);
  const durationMonths = monthsFromLabel(path.timeSpan?.durationLabel) ?? path.durationMonths ?? null;
  const horizonYears =
    path.scale === "life" || path.scale === "decade"
      ? 10
      : durationMonths && durationMonths >= 36
        ? 10
        : durationMonths && durationMonths >= 12
          ? 5
          : 3;

  // 转向线特征：第一年下探后回升；其余方案总体平滑上行
  const dipStrength =
    path.lane === "leap" ? clamp(1 - stability, 0.2, 0.55) : 0;

  const baseAt = (t: number): number => {
    // 保守累积：t 年累积月数 ≈ t + g/24·t²，g≈0.5~4.8 → 10 年基准 ≈ 1.2x–3x 累计本金
    const g = clamp(growth * factor, 0.1, 1.2) * 4;
    const compounding = t + (g / 24) * t * t;
    // 下探最深约 6–15 个月结余（第 1 年谷底），随后被增长抵消（先降后回升）
    const dip = dipStrength * Math.exp(-(t * t) / 0.72) * 20;
    return Math.max(0.1, compounding - dip);
  };

  const years = Array.from({ length: horizonYears }, (_, index) => index + 1);
  const points: AssetProjection[] = years.map((year) => {
    const base = baseAt(year);
    // 区间随时间张开：越远的年份不确定性越大
    const spread = 1 + year * 0.06;
    const floorRange = floorFactor * (1 - stability * 0.4) * spread * 0.5;
    const ceilRange = ceilingFactor * (0.6 + (1 - stability)) * spread * 0.32;
    const conservative = Math.max(0, base * (1 - floorRange));
    const optimistic = base * (1 + ceilRange);
    const slope = round1(baseAt(Math.min(year + 1, horizonYears + 1)) - baseAt(year));
    return {
      yearLabel: `${year} 年`,
      years: year,
      conservative: round1(conservative),
      base: round1(base),
      optimistic: round1(optimistic),
      slope,
    };
  });

  const firstBase = points[0]?.base ?? 0;
  const lastBase = points[points.length - 1]?.base ?? 0;
  const avgSlope = points.length
    ? points.reduce((sum, point) => sum + point.slope, 0) / points.length
    : 0;
  const trend: AssetTrend =
    dipStrength > 0.2 && lastBase > firstBase
      ? "volatile"
      : avgSlope > 0.35
        ? "rising"
        : avgSlope > -0.05
          ? "stable"
          : "declining";

  const signals = [...hits].map((key) => SIGNAL_LABEL[key]);
  if (signals.length === 0) signals.push("未提到明显财务信号，按方案类型估算");

  return {
    horizonYears,
    points,
    trend,
    trendLabel: ASSET_TREND_LABEL[trend],
    signals,
    generatedBy: "heuristic",
    disclaimer: ASSET_OUTLOOK_DISCLAIMER,
  };
}

function visit(path: ForkPath): ForkPath {
  return {
    ...path,
    assetOutlook: path.assetOutlook ?? buildAssetOutlook(path),
    children: path.children?.map(visit),
  };
}

/** 为整棵 fork 树补齐资产情景（已存在的节点保持原值，AI 结果优先） */
export function attachAssetOutlooks(forks: ForkPath[]): ForkPath[] {
  return forks.map(visit);
}

export function assetHorizonLabel(scale: LifeScale | undefined): string {
  return ASSET_SCALE_LABEL[scale ?? "life"] ?? "10 年";
}
