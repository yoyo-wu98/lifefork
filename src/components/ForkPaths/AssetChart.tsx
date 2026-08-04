"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { AssetProjection, ForkPath } from "@/lib/types";
import { laneMeta } from "./constants";

export const INCOME_TIERS = [4000, 10000, 20000] as const;
export const INCOME_TIER_LABELS = ["约 4 千", "约 1 万", "约 2 万"] as const;

type Mode = "optimistic" | "base" | "conservative";

const MODE_LABEL: Record<Mode, string> = {
  optimistic: "乐观",
  base: "基准",
  conservative: "保守",
};

const fmt = (value: number) => {
  if (!Number.isFinite(value)) return "—";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 10000) return `${sign}${(abs / 10000).toFixed(abs >= 100000 ? 0 : 1)} 万`;
  return `${sign}${abs >= 100 ? Math.round(abs) : value % 1 ? value.toFixed(1) : value}`;
};

export function formatWan(value: number): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1) return `${sign}${abs.toFixed(abs >= 100 ? 0 : 1)} 万`;
  return `${sign}${Math.round(abs * 10000)}`;
}

const CHART_W = 640;
const CHART_H = 250;
const PAD = { top: 26, right: 18, bottom: 34, left: 52 };
const INNER_W = CHART_W - PAD.left - PAD.right;
const INNER_H = CHART_H - PAD.top - PAD.bottom;

export function AssetChartShell({
  title,
  subtitle,
  monthlyIncome,
  onIncomeChange,
  children,
  footer,
}: {
  title: string;
  subtitle?: ReactNode;
  monthlyIncome: number;
  onIncomeChange: (value: number) => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">{title}</p>
          {subtitle && <p className="mt-1 text-xs leading-5 text-mist">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-mist">每月可投资结余假设</span>
          {INCOME_TIERS.map((tier, index) => (
            <button
              key={tier}
              type="button"
              onClick={() => onIncomeChange(tier)}
              aria-pressed={monthlyIncome === tier}
              className={`rounded-full border px-3 py-1.5 ${
                monthlyIncome === tier
                  ? "border-blue/40 bg-blue/10 text-blue"
                  : "border-night/10 text-mist hover:bg-night/5"
              }`}
            >
              {INCOME_TIER_LABELS[index]}元/月
            </button>
          ))}
        </div>
      </div>
      {children}
      {footer}
      <p className="text-[11px] leading-5 text-mist/80">
        情景模拟范围示意，不是预测，也不是理财建议。区间基于这个方案的文字描述与状态评估生成，越远的年份范围越宽。
      </p>
    </div>
  );
}

function useGeometry(points: AssetProjection[]) {
  return useMemo(() => {
    const maxValue = Math.max(1, ...points.map((point) => point.optimistic));
    const minValue = Math.min(0, ...points.map((point) => point.conservative));
    const span = maxValue - minValue || 1;
    const x = (index: number) =>
      PAD.left + (points.length <= 1 ? INNER_W / 2 : (index / (points.length - 1)) * INNER_W);
    const y = (value: number) =>
      PAD.top + INNER_H - ((value - minValue) / span) * INNER_H;
    return { maxValue, minValue, x, y };
  }, [points]);
}

function bandPath(points: AssetProjection[], geo: ReturnType<typeof useGeometry>): string {
  const top = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${geo.x(index).toFixed(1)},${geo.y(point.optimistic).toFixed(1)}`)
    .join(" ");
  const bottom = [...points]
    .reverse()
    .map((point) => {
      const index = points.indexOf(point);
      return `L${geo.x(index).toFixed(1)},${geo.y(point.conservative).toFixed(1)}`;
    })
    .join(" ");
  return `${top} ${bottom} Z`;
}

function linePath(points: AssetProjection[], geo: ReturnType<typeof useGeometry>, mode: Mode): string {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"}${geo.x(index).toFixed(1)},${geo.y(point[mode]).toFixed(1)}`)
    .join(" ");
}

export function SingleAssetChart({
  path,
  monthlyIncome,
  color,
}: {
  path: ForkPath;
  monthlyIncome: number;
  color: string;
}) {
  const outlook = path.assetOutlook!;
  const [mode, setMode] = useState<Mode>("base");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const geo = useGeometry(outlook.points);

  const activePoint = hoverIndex !== null ? outlook.points[hoverIndex] : null;
  const tickValues = [geo.maxValue, geo.maxValue / 2, Math.max(0, geo.minValue)];
  const fmtAxis = (unitValue: number) => formatWan((unitValue * monthlyIncome * 12) / 10000);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {(["optimistic", "base", "conservative"] as Mode[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMode(item)}
            aria-pressed={mode === item}
            className={`rounded-full border px-3 py-1.5 ${
              mode === item
                ? "border-blue/40 bg-blue/10 text-blue"
                : "border-night/10 text-mist hover:bg-night/5"
            }`}
          >
            {MODE_LABEL[item]}线
          </button>
        ))}
        <span className="ml-auto text-mist">趋势：{outlook.trendLabel}</span>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          className="block w-full"
          role="img"
          aria-label={`${path.title} 的资产情景模拟图`}
          onPointerLeave={() => setHoverIndex(null)}
        >
          {/* 网格与纵轴刻度 */}
          {tickValues.map((value) => (
            <g key={value}>
              <line
                x1={PAD.left}
                x2={CHART_W - PAD.right}
                y1={geo.y(value)}
                y2={geo.y(value)}
                stroke="currentColor"
                className="text-night/10"
                strokeDasharray="3 4"
              />
              <text x={PAD.left - 6} y={geo.y(value) + 4} textAnchor="end" className="fill-mist text-[10px]">
                {fmtAxis(value)}
              </text>
            </g>
          ))}
          {/* 区间带 */}
          <path d={bandPath(outlook.points, geo)} fill={color} opacity={0.14} />
          {/* 乐观/保守虚线 */}
          <path d={linePath(outlook.points, geo, "optimistic")} fill="none" stroke={color} strokeWidth={1.4} strokeDasharray="4 4" opacity={0.7} />
          <path d={linePath(outlook.points, geo, "conservative")} fill="none" stroke={color} strokeWidth={1.4} strokeDasharray="4 4" opacity={0.7} />
          {/* 选中模式主线 */}
          <path d={linePath(outlook.points, geo, mode)} fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
          {/* 横轴年份：超过 6 个时隔一个标注 */}
          {outlook.points.map((point, index) =>
            outlook.points.length <= 6 || index % 2 === 0 ? (
              <text
                key={point.yearLabel}
                x={geo.x(index)}
                y={CHART_H - 10}
                textAnchor="middle"
                className="fill-mist text-[10px]"
              >
                {point.yearLabel}
              </text>
            ) : null,
          )}
          {/* hover 十字线 + 节点 */}
          {activePoint && hoverIndex !== null && (
            <g>
              <line
                x1={geo.x(hoverIndex)}
                x2={geo.x(hoverIndex)}
                y1={PAD.top}
                y2={CHART_H - PAD.bottom}
                stroke={color}
                strokeWidth={1}
                opacity={0.5}
              />
              <circle cx={geo.x(hoverIndex)} cy={geo.y(activePoint[mode])} r={4.5} fill={color} />
            </g>
          )}
          {/* 交互热区 */}
          {outlook.points.map((point, index) => (
            <rect
              key={`hit-${point.yearLabel}`}
              x={geo.x(index) - INNER_W / outlook.points.length / 2}
              y={PAD.top}
              width={INNER_W / Math.max(1, outlook.points.length - 1)}
              height={INNER_H}
              fill="transparent"
              onPointerEnter={() => setHoverIndex(index)}
              onPointerDown={() => setHoverIndex(index)}
            />
          ))}
        </svg>

        {activePoint && (
          <div className="pointer-events-none absolute left-2 top-2 rounded-lg border border-night/10 bg-[var(--lf-paper-raised)] px-3 py-2 text-xs shadow-sm">
            <p className="font-medium text-ink">{activePoint.yearLabel}后 · {MODE_LABEL[mode]}</p>
            <p className="mt-1 text-mist">
              约 {formatWan((activePoint[mode] * monthlyIncome * 12) / 10000)} 元
              <span className="text-mist/70">
                （区间 {formatWan((activePoint.conservative * monthlyIncome * 12) / 10000)} ~ {formatWan((activePoint.optimistic * monthlyIncome * 12) / 10000)}）
              </span>
            </p>
            <p className="mt-1 text-mist/80">
              之后月度趋势：{activePoint.slope >= 0 ? "+" : ""}
              {fmt(activePoint.slope * monthlyIncome)} 元/月
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function CompareAssetChart({
  paths,
  monthlyIncome,
}: {
  paths: ForkPath[];
  monthlyIncome: number;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const horizon = Math.max(...paths.map((path) => path.assetOutlook?.horizonYears ?? 0), 1);
  const years = Array.from({ length: horizon }, (_, index) => index + 1);
  const allPoints = paths.flatMap((path) => path.assetOutlook?.points ?? []);
  const geo = useGeometry(allPoints.filter((point) => point.years <= horizon));

  const series = paths.map((path) => {
    const points = path.assetOutlook?.points ?? [];
    const color = path.lane ? laneMeta[path.lane].color : "#8FB7FF";
    const byYear = new Map(points.map((point) => [point.years, point]));
    return { path, color, byYear };
  });

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
        {series.map(({ path, color }) => (
          <span key={path.id} className="inline-flex items-center gap-1.5 text-mist">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
            {path.title}
          </span>
        ))}
      </div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          className="block w-full"
          role="img"
          aria-label="各方案资产情景对比图"
          onPointerLeave={() => setHoverIndex(null)}
        >
          {[geo.maxValue, geo.maxValue / 2, Math.max(0, geo.minValue)].map((value) => (
            <g key={value}>
              <line
                x1={PAD.left}
                x2={CHART_W - PAD.right}
                y1={geo.y(value)}
                y2={geo.y(value)}
                stroke="currentColor"
                className="text-night/10"
                strokeDasharray="3 4"
              />
              <text x={PAD.left - 6} y={geo.y(value) + 4} textAnchor="end" className="fill-mist text-[10px]">
                {formatWan((value * monthlyIncome * 12) / 10000)}
              </text>
            </g>
          ))}
          {series.map(({ path, color, byYear }) => {
            const segments: string[] = [];
            let current: string[] = [];
            years.forEach((year, index) => {
              const point = byYear.get(year);
              if (!point) {
                if (current.length > 1) segments.push(current.join(" "));
                current = [];
                return;
              }
              current.push(`${current.length === 0 ? "M" : "L"}${geo.x(index).toFixed(1)},${geo.y(point.base).toFixed(1)}`);
            });
            if (current.length > 1) segments.push(current.join(" "));
            return segments.map((d, segmentIndex) => (
              <path
                key={`${path.id}-${segmentIndex}`}
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={2.2}
                strokeLinecap="round"
              />
            ));
          })}
          {years.map((year, index) => {
            // 宽坐标轴上隔一个标注一个年份，避免手机上挤在一起
            const showLabel = years.length <= 6 || index % 2 === 0;
            return showLabel ? (
              <text
                key={year}
                x={geo.x(index)}
                y={CHART_H - 10}
                textAnchor="middle"
                className="fill-mist text-[10px]"
              >
                {year} 年
              </text>
            ) : null;
          })}
          {hoverIndex !== null && (
            <line
              x1={geo.x(hoverIndex)}
              x2={geo.x(hoverIndex)}
              y1={PAD.top}
              y2={CHART_H - PAD.bottom}
              stroke="currentColor"
              className="text-night/20"
              strokeWidth={1}
            />
          )}
          {years.map((year, index) => (
            <rect
              key={`hit-${year}`}
              x={geo.x(index) - INNER_W / years.length / 2}
              y={PAD.top}
              width={INNER_W / Math.max(1, years.length - 1)}
              height={INNER_H}
              fill="transparent"
              onPointerEnter={() => setHoverIndex(index)}
              onPointerDown={() => setHoverIndex(index)}
            />
          ))}
        </svg>
        {hoverIndex !== null && (
          <div className="pointer-events-none absolute left-2 top-2 space-y-1 rounded-lg border border-night/10 bg-[var(--lf-paper-raised)] px-3 py-2 text-xs shadow-sm">
            <p className="font-medium text-ink">{years[hoverIndex]} 年后 · 基准</p>
            {series.map(({ path, color, byYear }) => {
              const point = byYear.get(years[hoverIndex]);
              if (!point) return null;
              return (
                <p key={path.id} className="text-mist">
                  <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: color }} />
                  约 {formatWan((point.base * monthlyIncome * 12) / 10000)} 元（{formatWan((point.conservative * monthlyIncome * 12) / 10000)} ~ {formatWan((point.optimistic * monthlyIncome * 12) / 10000)}）
                </p>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
