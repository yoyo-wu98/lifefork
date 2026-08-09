"use client";

import { useMemo, useState } from "react";
import {
  fullLifeDemoFixture,
  getFullLifeDemoChoiceSetsForNode,
  resolveFullLifeDemoChoiceOptionPath,
} from "@/lib/scenarios/fullLifeDemoFixture";
import { useLifeforkStore } from "@/lib/stores/lifeforkStore";
import type { ForkPath, SelfSkill } from "@/lib/types";
import { ROOT_NODE_ID, scaleMeta } from "./constants";
import { AssetChartShell, CompareAssetChart, INCOME_TIERS } from "./AssetChart";
import { CurrentRouteBar } from "./CurrentRouteBar";
import { LifeMapCanvas } from "./LifeMapCanvas";
import { NodeDetailPanel } from "./NodeDetailPanel";
import {
  flattenForks,
  normalizeForkHierarchy,
} from "./model/normalizeForkTree";
import { createCurrentPath, createHistoryPaths, getAncestry } from "./utils";

export function ForkPaths() {
  const selfSkill = useLifeforkStore((state) => state.selfSkill) as SelfSkill;
  const activePathId = useLifeforkStore((state) => state.previewForkId);
  const onPreviewId = useLifeforkStore((state) => state.setPreviewForkId);
  const onSelect = useLifeforkStore((state) => state.selectFork);

  const historyPaths = useMemo(() => createHistoryPaths(selfSkill), [selfSkill]);
  const futureRoots = useMemo(
    () => normalizeForkHierarchy(selfSkill.forks),
    [selfSkill.forks],
  );
  const currentPath = useMemo(
    () => ({ ...createCurrentPath(selfSkill), children: futureRoots }),
    [futureRoots, selfSkill],
  );
  const allFuturePaths = useMemo(() => flattenForks(futureRoots), [futureRoots]);
  const allPaths = useMemo(
    () => [...historyPaths, currentPath, ...allFuturePaths],
    [allFuturePaths, currentPath, historyPaths],
  );
  const activePath =
    allPaths.find((path) => path.id === activePathId) ?? currentPath;
  const lineage = useMemo(() => {
    if (activePath.id.startsWith("lifefork-history")) {
      const activeIndex = historyPaths.findIndex((path) => path.id === activePath.id);
      return activeIndex >= 0
        ? historyPaths.slice(0, activeIndex + 1)
        : [activePath];
    }
    if (activePath.id === ROOT_NODE_ID) return [...historyPaths, currentPath];

    const futureLineage = getAncestry(activePath, [currentPath, ...allFuturePaths]);
    return [...historyPaths, ...futureLineage];
  }, [activePath, allFuturePaths, currentPath, historyPaths]);
  const scenarioChoiceSets =
    selfSkill.id === fullLifeDemoFixture.selfSkill.id
      ? getFullLifeDemoChoiceSetsForNode(activePath.id)
      : [];
  const [compareIncome, setCompareIncome] = useState<number>(INCOME_TIERS[0]);
  const assetComparePaths = useMemo(
    () => futureRoots.filter((path) => path.assetOutlook),
    [futureRoots],
  );
  const previewPath = (path: ForkPath) => {
    onPreviewId(path.id);
  };

  return (
    <section className="space-y-5">
      <header className="grid gap-4 border-b border-night/10 pb-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="text-sm font-medium text-blue">方案对比</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink">方案地图</h1>
          <p className="mt-3 max-w-[72ch] text-sm leading-7 text-mist">
            左侧是过去经历，中间是当前问题，右侧是备选方案。点击节点查看详情；切换时间尺度可以查看长期方案和更具体的行动。
          </p>
        </div>
        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-night/10 bg-night/10 text-xs">
          <div className="bg-[var(--lf-paper-raised)] px-3 py-2">
            <span className="block text-mist">当前节点</span>
            <span className="mt-1 block max-w-44 truncate text-ink">{activePath.title}</span>
          </div>
          <div className="bg-[var(--lf-paper-raised)] px-3 py-2">
            <span className="block text-mist">节点尺度</span>
            <span className="mt-1 block text-ink">
              {activePath.id === ROOT_NODE_ID
                ? "现在"
                : scaleMeta[activePath.scale ?? "life"].label}
            </span>
          </div>
          <div className="bg-[var(--lf-paper-raised)] px-3 py-2">
            <span className="block text-mist">当前显示</span>
            <span className="mt-1 block text-ink">当前尺度的重点节点</span>
          </div>
        </div>
      </header>

      <LifeMapCanvas
        currentPath={currentPath}
        historyPaths={historyPaths}
        futureRoots={futureRoots}
        activeId={activePath.id}
        onPreview={previewPath}
      />

      <CurrentRouteBar lineage={lineage} onPreviewNode={previewPath} />

      <NodeDetailPanel
        path={activePath}
        onSelect={onSelect}
        choiceSets={scenarioChoiceSets}
        onSelectChoice={(choiceSet, option) => {
          const choicePath = resolveFullLifeDemoChoiceOptionPath(
            choiceSet,
            option,
            activePath,
          );
          if (choicePath) onSelect(choicePath);
        }}
      />

      {assetComparePaths.length >= 2 && (
        <details className="group border-y border-night/10 py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
            <div>
              <p className="text-base font-semibold text-ink">比较各方案的结余累积示意</p>
              <p className="mt-1 text-xs leading-5 text-mist">
                高级情景图，默认使用相对单位，不参与方案推荐排序。
              </p>
            </div>
            <span className="rounded-full border border-night/10 px-3 py-1 text-xs text-mist group-open:text-blue">
              展开对比
            </span>
          </summary>
          <div className="mt-4 border-t border-night/10 pt-4">
            <AssetChartShell
              title="各方案结余累积趋势 · 基准情形"
              subtitle="把指针移到图上查看同一年份的相对差异。单个方案的乐观与保守区间可在节点详情中查看。"
              monthlyIncome={compareIncome}
              onIncomeChange={setCompareIncome}
            >
              <CompareAssetChart paths={assetComparePaths} monthlyIncome={compareIncome} />
            </AssetChartShell>
          </div>
        </details>
      )}
    </section>
  );
}
