"use client";

import type { ForkPath } from "@/lib/types";
import { DYNAMIC_TYPE_PROFILE_COPY } from "@/lib/content/copyRegistry";
import type { ScenarioChoiceOption, ScenarioChoiceSet } from "@/lib/scenarios/types";
import { useLifeforkStore } from "@/lib/stores/lifeforkStore";
import { ROOT_NODE_ID, scaleMeta, stateLabels } from "./constants";
import { StateBar } from "./StateBar";

const formatConfidence = (confidence: number) => `${Math.round(confidence * 100)}%`;

type NodeDetailPanelProps = {
  path: ForkPath;
  nextScaleLabel?: string;
  onNextScale?: () => void;
  onSelect: (path: ForkPath) => void;
  choiceSets?: readonly ScenarioChoiceSet[];
  onSelectChoice?: (choiceSet: ScenarioChoiceSet, option: ScenarioChoiceOption) => void;
};

export function NodeDetailPanel({ path, nextScaleLabel, onNextScale, onSelect, choiceSets = [], onSelectChoice }: NodeDetailPanelProps) {
  const dynamicTypeLabels = DYNAMIC_TYPE_PROFILE_COPY.value.branchDetailLabels;
  const dynamicType = path.dynamicType;
  const branchExplanation = useLifeforkStore((state) =>
    state.selfSkill?.integratedAnalysis?.branchExplanations.find(
      (item) => item.branchId === path.id,
    ),
  );

  return (
    <article className="rounded-lg border border-night/10 bg-[oklch(0.99_0.004_92)] p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gold">
            {path.timeSpan?.durationLabel ?? scaleMeta[path.scale ?? "life"].label} · 当前节点
          </p>
          <h4 className="mt-2 text-2xl font-semibold text-ink">{path.title}</h4>
          <p className="mt-1 text-sm leading-6 text-mist">{path.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {nextScaleLabel && onNextScale && (
            <button type="button" onClick={onNextScale} className="rounded-lg border border-blue/30 px-5 py-3 text-sm text-blue hover:bg-blue/10">
              放大到{nextScaleLabel}
            </button>
          )}
          {path.id === ROOT_NODE_ID ? (
            <button type="button" disabled className="rounded-lg border border-night/10 px-5 py-3 text-sm text-mist opacity-70">
              请先选择一个方案
            </button>
          ) : (
            <button type="button" aria-label={`和${path.futureSelfName}聊聊：${path.title}`} onClick={() => onSelect(path)} className="rounded-lg bg-night px-5 py-3 text-sm font-medium text-deep shadow-quiet">
              和这个方案的模拟版本对话
            </button>
          )}
        </div>
      </div>
      <p className="my-5 max-w-[78ch] text-sm leading-7 text-mist">{path.summary}</p>

      {choiceSets.length > 0 && (
        <div className="mb-5 space-y-3 rounded-lg border border-gold/20 bg-gold/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-medium text-gold">可选方案</p>
            <p className="text-xs text-mist">{choiceSets.length} 组</p>
          </div>
          {choiceSets.map((choiceSet) => (
            <div key={choiceSet.id} className="space-y-3 border-t border-night/10 pt-3 first:border-t-0 first:pt-0">
              <div>
                <p className="text-sm leading-6 text-ink">{choiceSet.question}</p>
                <p className="mt-1 text-xs text-mist">
                  {choiceSet.timeAnchor} · {scaleMeta[choiceSet.scale].label}
                  {choiceSet.recurrence ? ` · ${choiceSet.recurrence.cadence === "yearly" ? "每年重复出现" : "每月重复出现"}` : ""}
                </p>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {choiceSet.options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onSelectChoice?.(choiceSet, option)}
                    className="min-h-24 rounded-lg border border-night/10 bg-[oklch(0.99_0.004_92)] p-3 text-left hover:border-gold/40 hover:bg-gold/10"
                  >
                    <span className="block text-sm text-ink">{option.label}</span>
                    <span className="mt-2 block text-xs leading-5 text-mist">{option.summary}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {dynamicType && (
        <div className="mb-5 rounded-lg border border-night/10 bg-deep/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-medium text-blue">{dynamicTypeLabels.title}</p>
            <p className="text-xs text-mist">
              {dynamicTypeLabels.confidence} {formatConfidence(dynamicType.confidence)}
            </p>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-xs text-mist">{dynamicTypeLabels.currentTypeTendency}</p>
              <p className="mt-1 text-sm text-ink">{dynamicType.currentTypeTendency} 倾向</p>
            </div>
            <div>
              <p className="text-xs text-mist">{dynamicTypeLabels.typeDrift}</p>
              <p className="mt-1 text-sm text-ink">
                {dynamicType.typeDrift.fromType}
                {" -> "}
                {dynamicType.typeDrift.toType} · {dynamicType.typeDrift.driftLabel}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-5 text-mist">
            {dynamicTypeLabels.evidenceHint}：{dynamicType.evidenceHint}
          </p>
          <p className="mt-2 text-xs leading-5 text-mist">
            {dynamicTypeLabels.contextNote}：{dynamicType.contextNote}
          </p>
        </div>
      )}

      {branchExplanation && (
        <details className="mb-5 border-y border-night/10 py-4">
          <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink">这个分支是怎么生成的</p>
              <p className="mt-1 text-xs text-mist">
                目标匹配参考分 {branchExplanation.score}/100。该分数用于方案比较，不代表成功率。
              </p>
            </div>
            <span className="rounded-full border border-blue/20 bg-blue/5 px-3 py-1 text-xs text-blue">
              查看方法来源
            </span>
          </summary>
          <div className="mt-4 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-3">
              {branchExplanation.methodContributions.map((method) => (
                <div key={`${path.id}-${method.methodId}`} className="border-l-2 border-blue/20 pl-3">
                  <p className="text-xs font-medium text-ink">
                    {method.methodLabel} · 用户权重 {Math.round(method.userWeight)}% ·
                    参考度 {formatConfidence(method.confidence)}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-mist">{method.rationale}</p>
                  <p className="mt-1 text-xs leading-5 text-mist/80">限制：{method.limitation}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div>
                <p className="text-xs font-medium text-ink">当前假设</p>
                <ul className="mt-2 space-y-1 text-xs leading-5 text-mist">
                  {branchExplanation.assumptions.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-ink">仍然未知</p>
                <ul className="mt-2 space-y-1 text-xs leading-5 text-mist">
                  {branchExplanation.unknowns.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </details>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-blue/20 bg-blue/10 p-4">
            <p className="text-xs font-medium text-blue">预期收益</p>
            <ul className="mt-3 space-y-2 text-sm text-mist">
              {path.gains.map((gain) => (
                <li key={gain}>+ {gain}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-violet/20 bg-violet/10 p-4">
            <p className="text-xs font-medium text-violet">需要承担的成本</p>
            <ul className="mt-3 space-y-2 text-sm text-mist">
              {path.costs.map((cost) => (
                <li key={cost}>- {cost}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-lg border border-night/10 bg-deep/70 p-4">
          <p className="mb-3 text-xs font-medium text-gold">状态变化（0-100）</p>
          <div className="grid gap-3">
            {path.stateVector ? (
              stateLabels.map(([key, label]) => <StateBar key={key} label={label} value={path.stateVector?.[key] ?? 0} warm={key === "regret" || key === "uncertainty"} />)
            ) : (
              <p className="text-sm text-mist">这个节点暂时没有可比较的状态数据。</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {path.consequences?.slice(0, 4).map((item) => (
          <span key={item.label} className="rounded-lg border border-night/10 bg-deep/60 px-3 py-1 text-mist">
            {item.label} {Object.values(item.delta)[0] && Object.values(item.delta)[0]! > 0 ? "+" : ""}
            {Object.values(item.delta)[0]}
          </span>
        ))}
        {path.mergeInto && <span className="rounded-lg border border-gold/30 bg-gold/10 px-3 py-1 text-gold">后续可能与另一方案合并</span>}
      </div>
      <p className="mt-4 text-xs text-mist">模拟对话语气：{path.futureSelfVoice}</p>
    </article>
  );
}
