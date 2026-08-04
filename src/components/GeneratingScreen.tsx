"use client";

import { useEffect, useState } from "react";
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
  const analysisSettings = useLifeforkStore((s) => s.analysisSettings);
  const createSkill = useLifeforkStore((s) => s.createSkill);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const aiMethodEnabled = analysisSettings.methods.some(
    (method) =>
      method.id === "ai-synthesis" && method.enabled && method.weight > 0,
  );
  const aiActive =
    editorConfig.features.aiApi && runtimeConfig.features.ai && aiMethodEnabled;

  useEffect(() => {
    if (!isGenerating) {
      setElapsedSeconds(0);
      return;
    }
    const started = Date.now();
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - started) / 1000));
    }, 500);
    return () => clearInterval(timer);
  }, [isGenerating]);

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
        <div className="mt-4 space-y-2 text-xs leading-5">
          <p className="text-blue">
            {aiActive
              ? "正在使用服务器 AI 和本地规则分析回答…"
              : "正在使用本地规则生成结果…"}
          </p>
          <p className="text-mist">
            {aiActive
              ? elapsedSeconds > 25
                ? `AI 响应比平时慢（已等待 ${elapsedSeconds} 秒）。最多再等约 35 秒会自动改用本地分析。`
                : `通常需要 10–25 秒，已等待 ${elapsedSeconds} 秒。请保持页面打开。`
              : "通常几秒内完成，请保持页面打开。"}
          </p>
          {aiActive && elapsedSeconds > 20 && (
            <button
              type="button"
              onClick={() => {
                // Let the in-flight request finish or time out in the background;
                // if the user is impatient, restart with AI disabled locally.
                useLifeforkStore.setState((state) => ({
                  editorConfig: {
                    ...state.editorConfig,
                    features: { ...state.editorConfig.features, aiApi: false },
                  },
                }));
                void createSkill();
              }}
              className="mt-2 rounded-lg border border-night/15 px-4 py-2 text-xs text-ink hover:bg-deep"
            >
              改用快速本地分析
            </button>
          )}
        </div>
      )}
    </section>
  );
}
