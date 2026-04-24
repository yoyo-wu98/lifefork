import { disclaimer } from "@/lib/copy";

export function ExtraTextStep({ value, onChange, onSkip, onNext }: { value: string; onChange: (v: string) => void; onSkip: () => void; onNext: () => void }) {
  return (
    <section className="space-y-4 rounded-3xl border border-white/15 bg-white/5 p-6">
      <h3 className="text-2xl">给我一段更像你的文字</h3>
      <p className="text-sm text-mist">你可以粘贴一段日记、聊天记录、备忘录、朋友圈草稿，或者什么都不填。</p>
      <textarea
        placeholder="例如：我最近总觉得自己好像被困住了，不是真的不喜欢现在的生活，而是感觉我的另一部分一直没有被使用……"
        className="min-h-40 w-full rounded-2xl border border-white/15 bg-deep/60 p-4"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="flex gap-3">
        <button onClick={onSkip} className="rounded-full border border-white/20 px-5 py-2">
          跳过
        </button>
        <button onClick={onNext} className="rounded-full bg-gradient-to-r from-blue to-violet px-5 py-2">
          继续生成
        </button>
      </div>
      <p className="text-xs text-mist">{disclaimer}</p>
    </section>
  );
}
