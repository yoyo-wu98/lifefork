"use client";

import { generationLines } from "@/lib/copy";
import { useLifeforkStore } from "@/lib/stores/lifeforkStore";

/**
 * Loading / generation screen.
 * Shows animated progress lines while Self Skill is being built.
 * The store's `isGenerating` flag controls visibility; actual generation
 * happens in `createSkill()` which calls the LLM API.
 */
export function GeneratingScreen() {
  const isGenerating = useLifeforkStore((s) => s.isGenerating);

  return (
    <section className="space-y-4 rounded-3xl border border-white/15 bg-white/5 p-8 text-center">
      <div
        className={`mx-auto h-16 w-16 rounded-full bg-gradient-to-r from-gold via-blue to-violet ${
          isGenerating ? "animate-pulse" : ""
        }`}
      />
      <h3 className="text-2xl">
        {isGenerating ? "正在召唤你的 Self Skill..." : "Self Skill 已生成"}
      </h3>
      <ul className="space-y-2 text-mist">
        {generationLines.map((line, idx) => (
          <li
            key={line}
            className="animate-[pulse_2s_ease-in-out_infinite]"
            style={{ animationDelay: `${idx * 180}ms` }}
          >
            {line}
          </li>
        ))}
      </ul>
      {isGenerating && (
        <p className="mt-4 text-xs text-blue">正在连接 DeepSeek AI 进行深度语义分析…</p>
      )}
    </section>
  );
}
