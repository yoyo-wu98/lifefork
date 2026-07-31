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
  const editorConfig = useLifeforkStore((s) => s.editorConfig);
  const runtimeConfig = useLifeforkStore((s) => s.runtimeConfig);

  return (
    <section className="mx-auto max-w-2xl space-y-6 rounded-lg border border-night/10 bg-[oklch(0.99_0.004_92)] p-6 text-center shadow-sm">
      <div
        className={`mx-auto h-2 w-32 overflow-hidden rounded-full bg-night/10 ${
          isGenerating ? "animate-pulse" : ""
        }`}
      >
        <span className="block h-full w-2/3 rounded-full bg-night" />
      </div>
      <h3 className="text-2xl font-semibold text-ink">
        {isGenerating ? "正在生成个人分析..." : "个人分析已生成"}
      </h3>
      <ul className="space-y-2 text-sm leading-6 text-mist">
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
        <p className="mt-4 text-xs leading-5 text-blue">
          {editorConfig.features.aiApi && runtimeConfig.features.ai
            ? "正在使用服务器 AI 和本地规则分析回答…"
            : "正在使用本地规则生成结果…"}
        </p>
      )}
    </section>
  );
}
