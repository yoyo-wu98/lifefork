"use client";

import { useLifeforkStore } from "@/lib/stores/lifeforkStore";
import { disclaimer } from "@/lib/copy";

/**
 * Optional free-text input step.
 * Users can paste diary entries, memos, chat snippets, or skip entirely.
 */
export function ExtraTextStep() {
  const extraText = useLifeforkStore((s) => s.extraText);
  const setExtraText = useLifeforkStore((s) => s.setExtraText);
  const createSkill = useLifeforkStore((s) => s.createSkill);

  return (
    <section className="space-y-4 rounded-3xl border border-white/15 bg-white/5 p-6">
      <h3 className="text-2xl">给我一段更像你的文字</h3>
      <p className="text-sm text-mist">
        你可以粘贴一段日记、聊天记录、备忘录、朋友圈草稿，或者什么都不填。
      </p>
      <textarea
        placeholder="例如：我最近总觉得自己好像被困住了。我也说不清是否讨厌现在的生活，只是感觉身体里有另一部分一直没有被使用……"
        className="min-h-40 w-full rounded-2xl border border-white/15 bg-deep/60 p-4"
        value={extraText}
        onChange={(e) => setExtraText(e.target.value)}
      />
      <div className="flex gap-3">
        <button onClick={createSkill} className="rounded-full border border-white/20 px-5 py-2">
          跳过
        </button>
        <button onClick={createSkill} className="rounded-full bg-gradient-to-r from-blue to-violet px-5 py-2">
          继续生成
        </button>
      </div>
      <p className="text-xs text-mist">{disclaimer}</p>
    </section>
  );
}
