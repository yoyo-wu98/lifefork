interface ProgressOrbProps {
  progress: number;
}

export function ProgressOrb({ progress }: ProgressOrbProps) {
  return (
    <div className="rounded-3xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-mist">
      <p className="mb-2">Self Skill 构建进度：{progress}%</p>
      <div className="h-2 w-full rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold via-blue to-violet transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
