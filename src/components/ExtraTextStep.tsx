"use client";

import { useLifeforkStore } from "@/lib/stores/lifeforkStore";
import { disclaimer } from "@/lib/copy";
import { AI_TOKEN_BUDGETS } from "@/lib/ai/tokenBudget";

/**
 * Optional free-text input step.
 * Users can paste diary entries, memos, chat snippets, or skip entirely.
 */
export function ExtraTextStep() {
  const extraText = useLifeforkStore((s) => s.extraText);
  const setExtraText = useLifeforkStore((s) => s.setExtraText);
  const setStep = useLifeforkStore((s) => s.setStep);
  const editorConfig = useLifeforkStore((s) => s.editorConfig);
  const runtimeConfig = useLifeforkStore((s) => s.runtimeConfig);
  const limit = AI_TOKEN_BUDGETS.selfSkill.maxInputChars.extraText;
  const backStep =
    editorConfig.features.wechatImport && runtimeConfig.features.wechatImport
      ? "wechat-import"
      : "questions";

  return (
    <section className="space-y-5 rounded-lg border border-night/10 bg-[oklch(0.99_0.004_92)] p-5 shadow-sm">
      <div>
        <p className="text-sm font-medium text-blue">补充材料</p>
        <h3 className="mt-1 text-2xl font-semibold text-ink">补充一段真实材料</h3>
        <p className="mt-2 max-w-[68ch] text-sm leading-6 text-mist">
          可以粘贴日记、备忘录或聊天片段。系统会用它补充你的表达方式和反复出现的主题；这一步可以跳过。
        </p>
      </div>
      <textarea
        placeholder="例如：我正在考虑辞职做自己的项目。主要顾虑是收入不稳定，也担心半年后发现方向不适合。"
        className="min-h-44 w-full resize-y rounded-lg border border-night/10 bg-deep/70 p-4 text-base leading-6 outline-none focus:border-blue focus:bg-[oklch(0.995_0.003_92)]"
        value={extraText}
        maxLength={limit}
        onChange={(e) => setExtraText(e.target.value)}
      />
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-mist">
        <span>内容会自动保存在当前浏览器。</span>
        <span>{extraText.length} / {limit} 字</span>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setStep(backStep)}
          className="rounded-lg border border-night/15 px-5 py-2 text-sm text-ink hover:bg-deep"
        >
          上一步
        </button>
        <button
          type="button"
          onClick={() => {
            if (extraText.trim()) {
              // Keep what the user wrote — generation can still use it next time.
              // Only the step advances; content stays in the browser.
            }
            setStep("methods");
          }}
          className="rounded-lg border border-night/15 px-5 py-2 text-sm text-ink hover:bg-deep"
        >
          跳过此步
        </button>
        <button
          type="button"
          onClick={() => setStep("methods")}
          className="rounded-lg bg-night px-5 py-2 text-sm font-medium text-deep shadow-quiet"
        >
          下一步：选择分析方法
        </button>
      </div>
      <p className="max-w-[72ch] text-xs leading-6 text-mist">{disclaimer}</p>
    </section>
  );
}
