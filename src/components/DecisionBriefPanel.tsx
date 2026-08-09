"use client";

import { ArrowRight, CircleAlert, ClipboardCheck, Target } from "lucide-react";
import { buildDecisionBrief } from "@/lib/decisionBrief";
import type { AppStep, SelfSkill } from "@/lib/types";

function confidenceLabel(confidence?: number): string {
  return confidence === undefined ? "" : `参考度 ${Math.round(confidence * 100)}%`;
}

export function DecisionBriefPanel({
  selfSkill,
  onNavigate,
}: {
  selfSkill: SelfSkill;
  onNavigate: (step: AppStep) => void;
}) {
  const brief = buildDecisionBrief(selfSkill);

  return (
    <section className="border-y border-night/10 py-6" aria-labelledby="decision-brief-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Target className="size-5 text-blue" aria-hidden="true" />
            <h2 id="decision-brief-heading" className="text-xl font-semibold text-ink">
              先看这次决策的重点
            </h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-mist">
            根据你提供的 {brief.evidenceCount} 条材料整理。下方内容可以继续校对和修改。
          </p>
        </div>
        <span className="rounded-full border border-night/10 px-3 py-1 text-xs text-mist">
          {brief.sourceLabel}
        </span>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1.05fr_0.95fr_1fr]">
        <div>
          <p className="text-xs font-medium text-blue">当前问题</p>
          <p className="mt-2 text-base font-semibold leading-7 text-ink">{brief.question}</p>
          <p className="mt-3 text-sm leading-6 text-mist">
            核心冲突：{brief.coreConflict}
          </p>
          <div className="mt-4 space-y-3">
            {brief.strongestSignals.map((signal) => (
              <div key={signal.text} className="border-t border-night/10 pt-3">
                <p className="text-sm leading-6 text-ink">{signal.text}</p>
                {signal.confidence !== undefined && (
                  <p className="mt-1 text-xs text-mist">{confidenceLabel(signal.confidence)}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-night/10 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <div className="flex items-center gap-2">
            <CircleAlert className="size-4 text-gold" aria-hidden="true" />
            <p className="text-xs font-medium text-gold">建议先验证的方案</p>
          </div>
          <h3 className="mt-2 text-lg font-semibold text-ink">
            {brief.candidate?.title ?? "先建立一个小规模验证"}
          </h3>
          <p className="mt-2 text-sm leading-6 text-mist">{brief.candidateReason}</p>
          <p className="mt-4 text-xs font-medium text-ink">目前仍然未知</p>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-mist">
            {brief.unknowns.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>

        <div className="border-t border-night/10 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="size-4 text-blue" aria-hidden="true" />
            <p className="text-xs font-medium text-blue">未来 14 天</p>
          </div>
          <ol className="mt-3 space-y-3 text-sm leading-6 text-ink">
            {brief.nextSteps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue/10 text-xs font-semibold text-blue">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 border-t border-night/10 pt-5">
        <button
          type="button"
          onClick={() => onNavigate("timeline")}
          className="rounded-lg border border-night/15 px-4 py-2 text-sm text-ink hover:bg-deep"
        >
          先校对时间线
        </button>
        <button
          type="button"
          onClick={() => onNavigate("forks")}
          className="inline-flex items-center gap-2 rounded-lg bg-night px-4 py-2 text-sm font-medium text-deep"
        >
          比较完整方案
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
