"use client";

import { APP_NAV_COPY } from "@/lib/copy";
import { useLifeforkStore } from "@/lib/stores/lifeforkStore";
import type { AppStep } from "@/lib/types";

export function AppNav() {
  const step = useLifeforkStore((state) => state.step);
  const setStep = useLifeforkStore((state) => state.setStep);
  const selfSkill = useLifeforkStore((state) => state.selfSkill);
  const selectedFork = useLifeforkStore((state) => state.selectedFork);
  const editorConfig = useLifeforkStore((state) => state.editorConfig);
  const runtimeConfig = useLifeforkStore((state) => state.runtimeConfig);
  const loadDemoScenario = useLifeforkStore((state) => state.loadDemoScenario);
  const resetExperience = useLifeforkStore((state) => state.resetExperience);
  const stepLabels = APP_NAV_COPY.value.stepLabels;

  const primarySteps: Array<{ step: AppStep; label: string; available: boolean }> = [
    { step: "self-skill", label: editorConfig.nav.selfSkill, available: Boolean(selfSkill) },
    { step: "timeline", label: editorConfig.nav.timeline, available: Boolean(selfSkill) },
    { step: "forks", label: editorConfig.nav.lifeMap, available: Boolean(selfSkill) },
    { step: "chat", label: editorConfig.nav.currentDialogue, available: Boolean(selectedFork) },
    { step: "share", label: editorConfig.nav.shareCard, available: Boolean(selectedFork) },
  ];

  const stepClass = (target: AppStep) =>
    `shrink-0 rounded-lg px-3 py-2 text-sm ${
      step === target
        ? "bg-night text-deep"
        : "text-mist hover:bg-night/5 hover:text-ink"
    }`;

  return (
    <nav className="sticky top-3 z-50 rounded-lg border border-night/10 bg-[var(--lf-paper-raised)] px-2 py-2 shadow-quiet">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          className="shrink-0 rounded-lg px-3 py-2 text-left hover:bg-night/5"
          onClick={() => setStep("landing")}
        >
          <span className="block text-sm font-semibold leading-none text-ink">LifeFork</span>
          <span className="mt-1 block text-[11px] leading-none text-mist">
            {stepLabels[step] ?? step}
          </span>
        </button>

        <div className="h-7 w-px shrink-0 bg-night/10" />

        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          <button
            type="button"
            className={stepClass("landing")}
            aria-current={step === "landing" ? "page" : undefined}
            onClick={() => setStep("landing")}
          >
            {editorConfig.nav.home}
          </button>
          {primarySteps
            .filter((item) => item.available)
            .map((item) => (
              <button
                key={item.step}
                type="button"
                className={stepClass(item.step)}
                aria-current={step === item.step ? "page" : undefined}
                onClick={() => setStep(item.step)}
              >
                {item.label}
              </button>
            ))}
        </div>

        <div className="hidden h-7 w-px shrink-0 bg-night/10 md:block" />

        <div className="flex shrink-0 items-center gap-1">
          {editorConfig.features.demoScenario && runtimeConfig.features.demoScenario && (
            <button
              type="button"
              className="hidden rounded-lg px-3 py-2 text-sm text-gold hover:bg-gold/10 sm:block"
              onClick={loadDemoScenario}
            >
              {editorConfig.nav.demoScenario}
            </button>
          )}
          {editorConfig.features.editorConsole && (
            <button
              type="button"
              className={stepClass("editor")}
              aria-current={step === "editor" ? "page" : undefined}
              onClick={() => setStep("editor")}
            >
              {editorConfig.nav.editor}
            </button>
          )}
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-sm text-mist hover:bg-red-50 hover:text-red-700"
            onClick={resetExperience}
            title="清空当前浏览器里的问卷、分析、方案和对话"
          >
            {editorConfig.nav.reset}
          </button>
        </div>
      </div>
    </nav>
  );
}
