import type { ForkContainmentRole, ForkPath, LifeMapRole, LifeScale, LifeTimeRange } from "@/lib/types";

export const DAY = 1;
export const WEEK = 7 * DAY;
export const MONTH = 30 * DAY;
export const YEAR = 365 * DAY;

export function timeRange(startDay: number, endDay: number, granularity: LifeScale): LifeTimeRange {
  return { startDay, endDay, granularity };
}

export function containsTimeRange(parent?: LifeTimeRange, child?: LifeTimeRange) {
  if (!parent || !child) return false;
  return child.startDay >= parent.startDay && child.endDay <= parent.endDay;
}

export function scaleForTimeRange(range?: LifeTimeRange): LifeScale | undefined {
  return range?.granularity;
}

export function mapRoleForPath(path: ForkPath): LifeMapRole {
  if (path.mapRole) return path.mapRole;
  if (path.scale === "life") return "life-container";
  if (path.scale === "hour") return "event";
  if (path.children?.length) return "period";
  return "checkpoint";
}

export function containmentRoleForPath(path: ForkPath): ForkContainmentRole {
  if (path.containmentRole) return path.containmentRole;
  if (!path.parentId) return "root";
  if (path.mapRole === "life-container" || path.children?.length) return "container";
  if (path.mapRole === "checkpoint") return "checkpoint";
  if (path.mapRole === "event" || path.scale === "day" || path.scale === "hour") return "event";
  return "period";
}

export function durationMonthsForRange(range?: LifeTimeRange) {
  if (!range) return undefined;
  return Number(((range.endDay - range.startDay) / MONTH).toFixed(2));
}

export function hasVerifiableTimeRange(path: ForkPath) {
  const range = path.timeSpan?.range;
  return Boolean(
    range &&
      Number.isFinite(range.startDay) &&
      Number.isFinite(range.endDay) &&
      range.endDay > range.startDay &&
      range.granularity,
  );
}
