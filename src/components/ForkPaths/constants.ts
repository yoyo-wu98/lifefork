import type { LifeLane, LifeScale, LifeStateVector } from "@/lib/types";
import type { FocusMode } from "./types";

// ── Node IDs ──────────────────────────────────────────────────────────

export const ROOT_NODE_ID = "lifefork-life-root";
export const HISTORY_BIRTH_ID = "lifefork-history-birth";
export const HISTORY_EARLY_ID = "lifefork-history-early";
export const HISTORY_PAST_ID = "lifefork-history-past";
export const HISTORY_HIDDEN_ID = "lifefork-history-hidden";

// ── Layout dimensions ─────────────────────────────────────────────────

export const ROOT_FRAME = { width: 244, height: 124 };
export const PAD_X = 34;
export const PAD_Y = 34;
export const VIEWPORT_HEIGHT = 680;
export const CANVAS_WIDTH = 3400;
export const CANVAS_HEIGHT = 2300;
export const MAP_CENTER = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
export const TIMELINE_Y = MAP_CENTER.y;
export const HISTORY_GAP_X = 360;
export const HISTORY_LANE_Y = [-64, 66, -76, 42];

// ── Scale definitions ─────────────────────────────────────────────────

export const scaleOrder: LifeScale[] = ["life", "decade", "era", "year", "month", "week", "day", "hour"];

export const scaleMeta: Record<LifeScale, { label: string; hint: string }> = {
  life: { label: "全人生", hint: "先看几条可能的人生主线" },
  decade: { label: "十年", hint: "看长期代价和身份变化" },
  era: { label: "阶段", hint: "看 90 天、一季、几年这种转折区" },
  year: { label: "一年", hint: "看现实策略和身份重组" },
  month: { label: "一月", hint: "看节奏、能量和反馈" },
  week: { label: "一周", hint: "看实验如何落地" },
  day: { label: "一天", hint: "看具体事件和情绪触发" },
  hour: { label: "一小时", hint: "看最小动作和内心独白" },
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

// ── Frame dimensions by scale ─────────────────────────────────────────

export const frameByScale: Record<LifeScale, { width: number; height: number; padding: number; label: string }> = {
  life: { width: 430, height: 184, padding: 58, label: "Life Frame" },
  decade: { width: 360, height: 154, padding: 48, label: "Decade Frame" },
  era: { width: 320, height: 140, padding: 42, label: "Era Frame" },
  year: { width: 278, height: 124, padding: 34, label: "Year Frame" },
  month: { width: 236, height: 108, padding: 28, label: "Month Frame" },
  week: { width: 198, height: 94, padding: 22, label: "Week Frame" },
  day: { width: 168, height: 82, padding: 18, label: "Day Frame" },
  hour: { width: 138, height: 70, padding: 14, label: "Hour Frame" },
};

export const scaleFrameByScale: Record<LifeScale, { width: number; height: number; padding: number }> = {
  life: { width: 2680, height: 1380, padding: 90 },
  decade: { width: 2100, height: 1120, padding: 76 },
  era: { width: 1650, height: 900, padding: 64 },
  year: { width: 1250, height: 690, padding: 54 },
  month: { width: 900, height: 500, padding: 44 },
  week: { width: 650, height: 360, padding: 36 },
  day: { width: 450, height: 250, padding: 28 },
  hour: { width: 260, height: 150, padding: 22 },
};

export const nestedAreaByScale: Record<LifeScale, { width: number; height: number; insetX: number }> = {
  life: { width: 1420, height: 980, insetX: 230 },
  decade: { width: 1040, height: 760, insetX: 190 },
  era: { width: 880, height: 620, insetX: 170 },
  year: { width: 700, height: 500, insetX: 145 },
  month: { width: 540, height: 380, insetX: 122 },
  week: { width: 410, height: 300, insetX: 96 },
  day: { width: 300, height: 220, insetX: 74 },
  hour: { width: 220, height: 150, insetX: 54 },
};

// ── Lane configuration ────────────────────────────────────────────────

export const laneOffsetY: Record<LifeLane, number> = {
  stability: -340,
  leap: -150,
  experiment: 80,
  relationship: 285,
  creation: 445,
};

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
  single: "单框",
  "parent-self": "父子同屏",
  "self-children": "子框同屏",
};
