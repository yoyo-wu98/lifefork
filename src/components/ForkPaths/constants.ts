import type { LifeLane, LifeScale, LifeStateVector } from "@/lib/types";
import type { FocusMode } from "./types";

// ── Node IDs ──────────────────────────────────────────────────────────

export const ROOT_NODE_ID = "lifefork-life-root";
export const HISTORY_BIRTH_ID = "lifefork-history-birth";
export const HISTORY_EARLY_ID = "lifefork-history-early";
export const HISTORY_PAST_ID = "lifefork-history-past";
export const HISTORY_HIDDEN_ID = "lifefork-history-hidden";

// ── Scale definitions ─────────────────────────────────────────────────

export const scaleOrder: LifeScale[] = ["life", "decade", "era", "year", "month", "week", "day", "hour"];

export const scaleMeta: Record<LifeScale, { label: string; hint: string }> = {
  life: { label: "全人生", hint: "比较几种长期方案" },
  decade: { label: "十年", hint: "比较长期收益、成本和生活变化" },
  era: { label: "阶段", hint: "查看 90 天到几年的阶段计划" },
  year: { label: "一年", hint: "查看年度目标和现实条件" },
  month: { label: "一月", hint: "查看本月任务、精力和结果" },
  week: { label: "一周", hint: "查看每周执行情况" },
  day: { label: "一天", hint: "查看具体事件和当天反应" },
  hour: { label: "一小时", hint: "查看最小行动和即时反馈" },
};

// ── Camera zoom ───────────────────────────────────────────────────────

export const cameraZoom: Record<LifeScale, number> = {
  life: 0.54,
  decade: 0.68,
  era: 0.86,
  year: 1,
  month: 1.14,
  week: 1.32,
  day: 1.54,
  hour: 1.82,
};

export const MIN_CAMERA_ZOOM = 0.22;
export const MAX_CAMERA_ZOOM = 2.65;

export const laneMeta: Record<LifeLane, { label: string; color: string; bg: string }> = {
  stability: { label: "稳定线", color: "#8FB7FF", bg: "bg-blue/10" },
  leap: { label: "转向线", color: "#D6A85C", bg: "bg-gold/10" },
  experiment: { label: "试验线", color: "#B18CFF", bg: "bg-violet/10" },
  relationship: { label: "关系线", color: "#F2A6C8", bg: "bg-pink-300/10" },
  creation: { label: "创造线", color: "#9BE7C7", bg: "bg-emerald-300/10" },
};

// ── State vector display ──────────────────────────────────────────────

export const stateLabels: Array<[keyof LifeStateVector, string]> = [
  ["autonomy", "自主"],
  ["stability", "稳定"],
  ["intimacy", "关系"],
  ["creation", "创造"],
  ["energy", "能量"],
  ["regret", "遗憾"],
  ["uncertainty", "不确定"],
];

// ── Focus mode labels ─────────────────────────────────────────────────

export const focusModeLabel: Record<FocusMode, string> = {
  single: "只看这一个",
  "parent-self": "和上一层对比",
  "self-children": "展开看下一步",
};
