"use client";

import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Database,
  Fingerprint,
  Info,
  MessageSquareText,
  Settings2,
} from "lucide-react";
import { DecisionBriefPanel } from "@/components/DecisionBriefPanel";
import { ANALYSIS_METHODS } from "@/lib/analysis/methodRegistry";
import { useLifeforkStore } from "@/lib/stores/lifeforkStore";
import type {
  AnalysisMethodCategory,
  MethodAnalysisResult,
  MethodContribution,
} from "@/lib/types";

const CATEGORY_LABELS: Record<AnalysisMethodCategory, string> = {
  evidence: "用户材料",
  statistical: "统计参考",
  model: "模型整理",
  psychometric: "阶段性格",
  cultural: "文化解读",
};

const STATUS_LABELS: Record<MethodAnalysisResult["status"], string> = {
  complete: "已完成",
  limited: "信息有限",
  disabled: "未启用",
  "missing-input": "缺少信息",
};

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function contributionLabel(item: MethodContribution) {
  return `${item.methodLabel} ${Math.round(item.userWeight)}% · 参考度 ${percent(item.confidence)}`;
}

export function SelfSkillPanel() {
  const selfSkill = useLifeforkStore((state) => state.selfSkill);
  const setStep = useLifeforkStore((state) => state.setStep);
  const lastGenerationSource = useLifeforkStore((state) => state.lastGenerationSource);
  const createSkill = useLifeforkStore((state) => state.createSkill);
  const editorConfig = useLifeforkStore((state) => state.editorConfig);
  const runtimeConfig = useLifeforkStore((state) => state.runtimeConfig);

  if (!selfSkill) return null;

  const analysis = selfSkill.integratedAnalysis;
  const topMethods = analysis
    ? Object.entries(analysis.normalizedWeights)
        .filter(([, weight]) => weight > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    : [];
  const references = analysis
    ? analysis.methodResults
        .flatMap((result) => result.references ?? [])
        .filter(
          (reference, index, all) =>
            all.findIndex((item) => item.id === reference.id) === index,
        )
    : [];

  return (
    <section className="mx-auto w-full max-w-6xl space-y-8">
      {lastGenerationSource === "local" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gold/25 bg-gold/5 px-5 py-4">
          <div>
            <p className="text-sm font-medium text-ink">本次结果由本地快速分析生成</p>
            <p className="mt-1 text-xs leading-5 text-mist">
              服务器 AI 未参与。结论基于规则模板，参考度有限。
            </p>
          </div>
          {runtimeConfig.features.ai && editorConfig.features.aiApi && (
            <button
              type="button"
              onClick={() => void createSkill()}
              className="rounded-lg bg-night px-4 py-2 text-sm font-medium text-deep"
            >
              重试 AI 分析
            </button>
          )}
        </div>
      )}
      <header className="border-b border-night/10 pb-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-blue">个人分析报告</p>
            <h1 className="mt-2 text-3xl font-semibold text-ink">
              你当前的主要特征：{selfSkill.identity.archetype}
            </h1>
            <p className="mt-3 text-base leading-7 text-mist">
              {selfSkill.identity.selfNarrative}
            </p>
          </div>
          {analysis && (
            <div className="min-w-56 border-l border-night/10 pl-5">
              <p className="text-xs text-mist">当前材料完整度</p>
              <p className="mt-1 text-3xl font-semibold text-ink">
                {analysis.dataCompleteness}%
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-night/10">
                <div
                  className="h-full rounded-full bg-blue"
                  style={{ width: `${analysis.dataCompleteness}%` }}
                />
              </div>
              <p className="mt-2 text-xs leading-5 text-mist">
                材料越完整，结论越容易核对。该数值不代表预测准确率。
              </p>
              {analysis.modelExecution && (
                <div
                  className={`mt-3 rounded-lg border p-3 text-xs leading-5 ${
                    analysis.modelExecution.used
                      ? "border-blue/20 bg-blue/5 text-blue"
                      : "border-gold/25 bg-gold/5 text-ink"
                  }`}
                >
                  <p className="font-medium">
                    {analysis.modelExecution.used
                      ? "服务器 AI 已参与本次分析"
                      : "本次结果由本地规则生成"}
                  </p>
                  <p className="mt-1 opacity-80">
                    {analysis.modelExecution.used
                      ? `${analysis.modelExecution.provider} / ${analysis.modelExecution.model}`
                      : "服务器模型未参与，结论参考度已相应降低。"}
                    {analysis.modelExecution.durationMs
                      ? ` · ${(analysis.modelExecution.durationMs / 1000).toFixed(1)} 秒`
                      : ""}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <DecisionBriefPanel selfSkill={selfSkill} onNavigate={setStep} />

      {analysis && (
        <section aria-labelledby="insights-heading">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-blue" aria-hidden="true" />
                <h2 id="insights-heading" className="text-xl font-semibold text-ink">
                  主要判断与来源
                </h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-mist">
                展开每一条，可以查看方法权重、依据和限制。
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep("methods")}
              className="inline-flex items-center gap-2 rounded-lg border border-night/15 px-4 py-2 text-sm text-ink hover:bg-deep"
            >
              <Settings2 className="size-4" aria-hidden="true" />
              调整分析方法
            </button>
          </div>

          <div className="mt-4 border-t border-night/10">
            {analysis.insights.map((insight) => (
              <details key={insight.id} className="group border-b border-night/10 py-5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-ink">{insight.title}</h3>
                      <span className="rounded-full border border-night/10 px-2 py-0.5 text-[11px] text-mist">
                        参考度 {percent(insight.confidence)}
                      </span>
                      {insight.kind === "cultural-reading" && (
                        <span className="rounded-full border border-gold/30 bg-gold/5 px-2 py-0.5 text-[11px] text-gold">
                          文化解读
                        </span>
                      )}
                    </div>
                    <p className="mt-2 max-w-4xl text-sm leading-7 text-mist">
                      {insight.summary}
                    </p>
                  </div>
                  <ChevronDown
                    className="mt-1 size-5 shrink-0 text-mist transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>

                <div className="mt-5 grid gap-5 border-t border-night/10 pt-5 lg:grid-cols-[1fr_0.9fr]">
                  <div>
                    <p className="text-xs font-semibold text-ink">本条使用的方法</p>
                    <div className="mt-3 space-y-4">
                      {insight.methodContributions.map((contribution) => (
                        <div key={`${insight.id}-${contribution.methodId}`}>
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span className="font-medium text-ink">
                              {contributionLabel(contribution)}
                            </span>
                            <span className="text-mist">
                              综合贡献 {contribution.contribution.toFixed(1)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs leading-5 text-mist">
                            {contribution.rationale}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-mist/80">
                            限制：{contribution.limitation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink">对应材料</p>
                    <div className="mt-3 space-y-2">
                      {insight.evidenceIds.length ? (
                        insight.evidenceIds.map((evidenceId) => {
                          const evidence = selfSkill.evidence.find(
                            (item) => item.id === evidenceId,
                          );
                          return evidence ? (
                            <blockquote
                              key={evidence.id}
                              className="border-l border-night/15 pl-3 text-xs leading-5 text-mist"
                            >
                              {evidence.quote}
                            </blockquote>
                          ) : null;
                        })
                      ) : (
                        <p className="text-xs leading-5 text-mist">
                          这条内容没有直接用户证据，阅读时请降低参考权重。
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {analysis && (
        <section aria-labelledby="methods-heading">
          <div className="flex items-center gap-2">
            <Database className="size-5 text-blue" aria-hidden="true" />
            <h2 id="methods-heading" className="text-xl font-semibold text-ink">
              本次分析方法
            </h2>
          </div>
          <div className="mt-4 overflow-x-auto border-y border-night/10">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-night/10 text-xs text-mist">
                  <th className="py-3 pr-4 font-medium">方法</th>
                  <th className="px-4 py-3 font-medium">类型</th>
                  <th className="px-4 py-3 font-medium">用户权重</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="py-3 pl-4 font-medium">本次结果</th>
                </tr>
              </thead>
              <tbody>
                {analysis.methodResults.map((result) => (
                  <tr key={result.methodId} className="border-b border-night/10 last:border-0">
                    <td className="py-4 pr-4 font-medium text-ink">{result.label}</td>
                    <td className="px-4 py-4 text-mist">
                      {CATEGORY_LABELS[result.category]}
                    </td>
                    <td className="px-4 py-4 text-mist">
                      {Math.round(analysis.normalizedWeights[result.methodId])}%
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-night/10 px-2 py-1 text-xs text-mist">
                        {STATUS_LABELS[result.status]}
                      </span>
                    </td>
                    <td className="max-w-xl py-4 pl-4 leading-6 text-mist">
                      <p>{result.summary}</p>
                      {(result.details.length > 0 || result.status !== "disabled") && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-blue">
                            查看明细和限制
                          </summary>
                          <ul className="mt-2 space-y-1 text-xs leading-5 text-mist">
                            {result.details.slice(0, 6).map((detail) => (
                              <li key={detail}>• {detail}</li>
                            ))}
                          </ul>
                          <p className="mt-2 text-xs leading-5 text-mist/80">
                            限制：{result.limitation}
                          </p>
                        </details>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {topMethods.map(([methodId, weight]) => (
              <span
                key={methodId}
                className="rounded-full border border-night/10 px-3 py-1 text-xs text-mist"
              >
                {ANALYSIS_METHODS[methodId as keyof typeof ANALYSIS_METHODS].label}{" "}
                {Math.round(weight)}%
              </span>
            ))}
          </div>
          {references.length > 0 && (
            <div className="mt-5 border-t border-night/10 pt-4">
              <p className="text-xs font-semibold text-ink">方法与数据说明</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {references.map((reference) => (
                  <a
                    key={reference.id}
                    href={reference.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-night/10 bg-deep/40 p-3 text-xs leading-5 text-mist hover:border-blue/25 hover:text-blue"
                  >
                    <span className="block font-medium text-ink">{reference.title}</span>
                    <span className="mt-1 block">{reference.note}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {analysis?.stagePersonality.length ? (
        <section aria-labelledby="personality-heading">
          <div className="flex items-center gap-2">
            <Fingerprint className="size-5 text-blue" aria-hidden="true" />
            <h2 id="personality-heading" className="text-xl font-semibold text-ink">
              各阶段的性格倾向
            </h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-mist">
            这些类型用于描述特定阶段下的偏好。压力、角色、关系和环境变化后，结果也可能变化。
          </p>
          <div className="mt-4 grid border-y border-night/10 md:grid-cols-2">
            {analysis.stagePersonality.map((stage, index) => (
              <article
                key={stage.id}
                className={`py-5 ${
                  index % 2 === 0 ? "md:border-r md:pr-5" : "md:pl-5"
                } ${index < analysis.stagePersonality.length - 2 ? "border-b border-night/10" : ""}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-mist">{stage.stageLabel}</p>
                    <h3 className="mt-1 text-2xl font-semibold text-ink">{stage.type}</h3>
                  </div>
                  <span className="text-xs text-mist">参考度 {percent(stage.confidence)}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-mist">{stage.description}</p>
                <p className="mt-2 text-xs leading-5 text-mist">
                  可能变化因素：{stage.changeDrivers.filter(Boolean).join("、")}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="voice-heading">
        <div className="flex items-center gap-2">
          <MessageSquareText className="size-5 text-blue" aria-hidden="true" />
          <h2 id="voice-heading" className="text-xl font-semibold text-ink">
            表达方式与阶段语气
          </h2>
        </div>
        <div className="mt-4 grid gap-6 border-y border-night/10 py-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold text-ink">{selfSkill.voice.toneName}</p>
            <p className="mt-2 text-sm leading-6 text-mist">
              {selfSkill.voice.sentenceRhythm}；{selfSkill.voice.punctuationStyle}。
            </p>
            <p className="mt-2 text-xs text-mist">
              当前语气建模完成度 {selfSkill.voice.closenessScore}%。该数值根据文本样本和校准记录计算，不代表客观相似率。
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {selfSkill.stageVoices.slice(0, 4).map((voice) => (
              <article key={voice.id} className="border-l border-night/15 pl-4">
                <p className="text-sm font-medium text-ink">
                  {voice.ageLabel} · {voice.toneName}
                </p>
                <p className="mt-1 text-xs leading-5 text-mist">{voice.description}</p>
                <p className="mt-2 text-xs leading-5 text-blue">
                  示例：“{voice.sampleLine}”
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="evidence-heading">
        <h2 id="evidence-heading" className="text-xl font-semibold text-ink">
          本次使用的用户材料
        </h2>
        <div className="mt-4 grid gap-4 border-y border-night/10 py-5 md:grid-cols-2">
          {selfSkill.evidence.slice(0, 6).map((item) => (
            <blockquote key={item.id} className="rounded-lg border border-night/10 bg-deep/40 p-4 text-sm leading-6 text-mist">
              {item.quote}
            </blockquote>
          ))}
        </div>
      </section>

      {analysis && (
        <section className="border-y border-night/10 py-5" aria-labelledby="limits-heading">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 size-5 shrink-0 text-blue" aria-hidden="true" />
            <div>
              <h2 id="limits-heading" className="font-semibold text-ink">
                使用限制
              </h2>
              <ul className="mt-2 space-y-1 text-xs leading-5 text-mist">
                {analysis.limitations.map((limitation) => (
                  <li key={limitation}>• {limitation}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <button
          type="button"
          onClick={() => setStep("methods")}
          className="inline-flex items-center gap-2 rounded-lg border border-night/15 px-5 py-3 text-sm text-ink hover:bg-deep"
        >
          <Settings2 className="size-4" aria-hidden="true" />
          修改方法和权重
        </button>
        <button
          type="button"
          onClick={() => setStep("timeline")}
          className="inline-flex items-center gap-2 rounded-lg bg-night px-5 py-3 text-sm font-medium text-deep shadow-quiet"
        >
          查看时间线
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </footer>
    </section>
  );
}
