"use client";

/**
 * Progress bar showing Self Skill construction progress.
 *
 * Progress is purely cosmetic / UX — driven by step position,
 * not actual build progress. The real build happens in createSkill().
 */
export function ProgressOrb({ progress }: { progress: number }) {
  return (
    <div className="rounded-lg border border-night/10 bg-[oklch(0.99_0.004_92)] px-4 py-3 text-sm text-mist">
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="text-xs text-mist">整体进度</p>
        <p className="text-xs font-medium text-ink">{Math.round(progress)}%</p>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-night/10">
        <div
          className="h-full rounded-full bg-night transition-all duration-500"
          style={{ width: `${Math.round(progress)}%` }}
        />
      </div>
    </div>
  );
}
