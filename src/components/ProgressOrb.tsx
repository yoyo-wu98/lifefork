"use client";

/**
 * Progress bar showing Self Skill construction progress.
 *
 * Progress is purely cosmetic / UX — driven by step position,
 * not actual build progress. The real build happens in createSkill().
 */
export function ProgressOrb({ progress }: { progress: number }) {
  return (
    <div className="rounded-3xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-mist">
      <p className="mb-2">Self Skill 构建进度：{Math.round(progress)}%</p>
      <div className="h-2 w-full rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold via-blue to-violet transition-all duration-500"
          style={{ width: `${Math.round(progress)}%` }}
        />
      </div>
    </div>
  );
}
