import type { ForkPath, IntegratedInsight, SelfSkill } from "@/lib/types";

export interface DecisionSignal {
  text: string;
  confidence?: number;
}

export interface DecisionBrief {
  question: string;
  coreConflict: string;
  candidate?: ForkPath;
  candidateReason: string;
  strongestSignals: DecisionSignal[];
  unknowns: string[];
  nextSteps: string[];
  continueSignals: string[];
  stopSignals: string[];
  sourceLabel: string;
  evidenceCount: number;
  personalizedLine: string;
}

function unique(items: Array<string | undefined>, limit: number): string[] {
  return Array.from(
    new Set(items.map((item) => item?.trim()).filter((item): item is string => Boolean(item))),
  ).slice(0, limit);
}

function flattenForks(paths: ForkPath[]): ForkPath[] {
  return paths.flatMap((path) => [path, ...flattenForks(path.children ?? [])]);
}

function insightSignals(insights: IntegratedInsight[]): DecisionSignal[] {
  return [...insights]
    .filter((insight) => insight.kind !== "cultural-reading")
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3)
    .map((insight) => ({ text: insight.summary, confidence: insight.confidence }));
}

function concisePathTitle(title: string): string {
  return title.replace(/^路径\s*[A-ZＡ-Ｚ]\s*[：:、]?\s*/u, "").trim();
}

export function buildDecisionBrief(
  selfSkill: SelfSkill,
  selectedFork?: ForkPath | null,
): DecisionBrief {
  const allForks = flattenForks(selfSkill.forks);
  const candidate =
    (selectedFork && allForks.find((path) => path.id === selectedFork.id)) ||
    allForks.find((path) => path.lane === "experiment") ||
    allForks[0];
  const analysis = selfSkill.integratedAnalysis;
  const branchExplanation = candidate
    ? analysis?.branchExplanations.find((item) => item.branchId === candidate.id)
    : undefined;

  const strongestSignals = analysis?.insights.length
    ? insightSignals(analysis.insights)
    : selfSkill.claims.slice(0, 3).map((claim) => ({
        text: claim.text,
        confidence: claim.confidence,
      }));

  if (!strongestSignals.length) {
    strongestSignals.push(
      ...selfSkill.semantic.recurringPatterns.slice(0, 3).map((text) => ({ text })),
    );
  }

  const unknowns = unique(
    [
      ...(branchExplanation?.unknowns ?? []),
      ...(candidate?.costs ?? []).map((cost) => `这项成本在现实中会有多大：${cost}`),
    ],
    3,
  );
  if (!unknowns.length) {
    unknowns.push("实际投入后，你的精力、反馈和现实成本会怎样变化");
  }
  const primaryUnknown = unknowns[0];
  const pathTitle = candidate ? concisePathTitle(candidate.title) : "一个可撤回的小规模方案";
  const continueSignals = unique(candidate?.gains ?? [], 2);
  const stopSignals = unique(candidate?.costs ?? [], 2);

  const topMethods = analysis
    ? Object.entries(analysis.normalizedWeights)
        .filter(([, weight]) => weight > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([methodId]) =>
          analysis.methodResults.find((result) => result.methodId === methodId)?.label,
        )
        .filter((label): label is string => Boolean(label))
    : [];
  const modelLabel = analysis?.modelExecution.used
    ? `${analysis.modelExecution.provider} / ${analysis.modelExecution.model}`
    : "本地规则";
  const sourceLabel = unique(["用户材料", ...topMethods, modelLabel], 4).join(" + ");

  return {
    question: selfSkill.questions.currentChoice,
    coreConflict: selfSkill.semantic.innerConflict,
    candidate,
    candidateReason:
      branchExplanation?.summary ||
      candidate?.summary ||
      "先缩小问题范围，再用可记录的行动获得真实信息。",
    strongestSignals,
    unknowns,
    nextSteps: [
      `把未来 14 天只用于验证一个问题：${primaryUnknown}`,
      `为「${pathTitle}」设定投入上限，并每天记录时间、情绪、反馈和实际成本。`,
      "第 14 天按记录复盘，明确选择继续、调整或停止，并写下依据。",
    ],
    continueSignals,
    stopSignals,
    sourceLabel,
    evidenceCount: selfSkill.evidence.filter((item) => item.source !== "generated").length,
    personalizedLine: `先用 14 天验证「${pathTitle}」。重点观察：${primaryUnknown}。`,
  };
}
