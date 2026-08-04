"use client";

import { Server, ShieldCheck, Users } from "lucide-react";
import { useLifeforkStore } from "@/lib/stores/lifeforkStore";
import { disclaimer } from "@/lib/copy";

const previewNodes = [
  {
    phase: "经历",
    title: "影响当前选择的重要经历",
    detail: "发生了什么，以及它如何影响现在",
  },
  {
    phase: "现在",
    title: "当前状态和决策模式",
    detail: "主要目标、顾虑、资源和限制条件",
  },
  {
    phase: "方案",
    title: "多条可以比较的行动方案",
    detail: "预期收益、成本、长期影响和下一步",
  },
] as const;

export function Landing() {
  const startNewExperience = useLifeforkStore((state) => state.startNewExperience);
  const loadDemoScenario = useLifeforkStore((state) => state.loadDemoScenario);
  const editorConfig = useLifeforkStore((state) => state.editorConfig);
  const runtimeConfig = useLifeforkStore((state) => state.runtimeConfig);
  const landingCopy = editorConfig.landing;

  return (
    <section className="py-5 md:py-9">
      <div className="max-w-4xl">
        <p className="text-sm font-medium text-blue">{landingCopy.brandKicker}</p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight text-ink md:text-5xl">
          LifeFork / 人生岔路
        </h1>
        <p className="mt-5 text-2xl font-medium leading-snug text-ink md:text-3xl">
          {landingCopy.headline[0]}
          <br />
          {landingCopy.headline[1]}
        </p>
        <p className="mt-5 max-w-[68ch] text-base leading-8 text-mist">
          {landingCopy.body}
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded-lg bg-night px-5 py-3 text-sm font-medium text-deep shadow-quiet hover:bg-ink"
            onClick={startNewExperience}
            disabled={runtimeConfig.status === "maintenance"}
          >
            {landingCopy.primaryAction}
          </button>
          {editorConfig.features.demoScenario && runtimeConfig.features.demoScenario && (
            <button
              type="button"
              className="rounded-lg border border-night/15 bg-[var(--lf-paper-raised)] px-5 py-3 text-sm font-medium text-ink hover:border-blue/30 hover:bg-blue/10"
              onClick={loadDemoScenario}
            >
              {landingCopy.secondaryAction}
            </button>
          )}
          <span className="text-xs text-mist">
            约 8 分钟 · 无需账号 · {runtimeConfig.betaLabel}
          </span>
        </div>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-mist">
          <span className="inline-flex items-center gap-2">
            <Users className="size-4 text-blue" aria-hidden="true" />
            每位访客使用独立匿名会话
          </span>
          <span className="inline-flex items-center gap-2">
            <Server className="size-4 text-blue" aria-hidden="true" />
            你的回答不会被用于训练，仅用于本次分析
          </span>
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="size-4 text-blue" aria-hidden="true" />
            个人分析保存在当前浏览器
          </span>
        </div>
      </div>

      <div className="mt-10 overflow-hidden rounded-lg border border-[var(--lf-map-line)] bg-[var(--lf-map)] px-5 py-6 text-[var(--lf-map-text)] md:px-8 md:py-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[var(--lf-blue-soft)]">完成后你会得到</p>
            <p className="mt-1 text-sm text-[var(--lf-map-muted)]">个人分析、时间线、方案对比和模拟对话</p>
          </div>
          <span className="rounded-lg border border-[var(--lf-map-line)] px-3 py-2 text-xs text-[var(--lf-map-muted)]">
            浏览器保存
          </span>
        </div>

        <div className="relative mt-8 grid gap-7 md:grid-cols-3 md:gap-10">
          <span className="absolute left-[12%] right-[12%] top-[34px] hidden h-px bg-[var(--lf-map-line)] md:block" />
          {previewNodes.map((node, index) => (
            <article key={node.phase} className="relative z-10 min-w-0">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs ${
                    index === 1
                      ? "border-[var(--lf-gold)] bg-[var(--lf-gold)] text-[var(--lf-map)]"
                      : "border-[var(--lf-blue-soft)] bg-[var(--lf-map)] text-[var(--lf-blue-soft)]"
                  }`}
                >
                  {index + 1}
                </span>
                <span className="text-xs text-[var(--lf-map-muted)]">{node.phase}</span>
              </div>
              <h2 className="mt-4 text-base font-semibold">{node.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--lf-map-muted)]">{node.detail}</p>
            </article>
          ))}
        </div>
      </div>

      <p className="mt-5 max-w-[78ch] text-xs leading-6 text-mist">
        {runtimeConfig.privacyNotice} {editorConfig.global.disclaimer || disclaimer}
      </p>
    </section>
  );
}
