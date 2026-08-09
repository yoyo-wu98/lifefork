"use client";

import { useRef, useState } from "react";
import { buildDecisionBrief } from "@/lib/decisionBrief";
import { useLifeforkStore } from "@/lib/stores/lifeforkStore";
import { disclaimer } from "@/lib/copy";
import { SHARE_CARD_TEMPLATE_COPY } from "@/lib/content/shareCardTemplates";

export function ShareCard() {
  const selfSkill = useLifeforkStore((state) => state.selfSkill);
  const selectedFork = useLifeforkStore((state) => state.selectedFork);
  const setStep = useLifeforkStore((state) => state.setStep);
  const resetExperience = useLifeforkStore((state) => state.resetExperience);
  const editorConfig = useLifeforkStore((state) => state.editorConfig);
  const setBadge = useLifeforkStore((state) => state.setBadge);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExportingImage, setIsExportingImage] = useState(false);

  if (!selfSkill || !selectedFork) return null;

  const shareCopy = SHARE_CARD_TEMPLATE_COPY.value;
  const brief = buildDecisionBrief(selfSkill, selectedFork);
  const whyItems = brief.continueSignals.length
    ? brief.continueSignals
    : [brief.candidateReason];
  const unknownItems = brief.unknowns.length
    ? brief.unknowns.slice(0, 2)
    : brief.stopSignals.slice(0, 2);

  const copyResult = async () => {
    const content = [
      "LifeFork 决策摘要",
      `当前问题：${brief.question}`,
      `选择查看的方案：${selectedFork.title}`,
      `为什么值得验证：${whyItems.join("；")}`,
      `需要先确认：${unknownItems.join("；")}`,
      "未来 14 天：",
      ...brief.nextSteps.map((step, index) => `${index + 1}. ${step}`),
      `分析来源：${brief.sourceLabel}`,
      "说明：这是基于当前材料生成的情景分析，不是确定预测。",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(content);
      setBadge("决策摘要已复制，内容包含你的问题原文，分享前请确认");
    } catch {
      setBadge("复制失败，请检查浏览器剪贴板权限");
    }
  };

  const exportImage = async () => {
    const node = cardRef.current;
    if (!node || isExportingImage) return;
    setIsExportingImage(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#faf7f0",
      });
      const link = document.createElement("a");
      link.download = "lifefork-决策摘要.png";
      link.href = dataUrl;
      link.click();
      setBadge("决策摘要图片已保存，可在下载列表中查看");
    } catch {
      setBadge("图片生成失败，可以使用「复制文字版」");
    } finally {
      setIsExportingImage(false);
    }
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(selfSkill, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = shareCopy.exportFileName;
    link.click();
    URL.revokeObjectURL(url);
    setBadge("个人分析数据已导出，可在下载列表中查看");
  };

  return (
    <section className="space-y-5">
      <header className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium text-blue">本次体验已完成</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">你的决策摘要</h1>
        <p className="mt-3 text-sm leading-6 text-mist">
          这里保留行动、依据和未知项。图片和文字版都不会包含微信聊天原文。
        </p>
      </header>

      <div
        ref={cardRef}
        className="mx-auto max-w-[560px] overflow-hidden rounded-lg border border-night/10 bg-[oklch(0.99_0.004_92)] shadow-glow"
      >
        <div className="border-b border-night/10 bg-deep/70 px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-medium text-blue">LifeFork / 决策摘要</p>
            <p className="text-[11px] text-mist">{brief.sourceLabel}</p>
          </div>
          <h2 className="mt-4 text-2xl font-semibold leading-8 text-ink">
            {selectedFork.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-mist">{brief.question}</p>
        </div>

        <div className="px-6 py-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-blue">为什么值得验证</p>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-ink">
                {whyItems.slice(0, 2).map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium text-gold">需要先确认</p>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-ink">
                {unknownItems.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 border-y border-night/10 py-5">
            <p className="text-xs font-medium text-blue">未来 14 天</p>
            <ol className="mt-3 space-y-3 text-sm leading-6 text-ink">
              {brief.nextSteps.map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="font-semibold text-blue">{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <p className="mt-5 text-base font-medium leading-7 text-ink">
            {brief.personalizedLine}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-night/10 px-6 py-4 text-[11px] text-mist">
          <span>{brief.evidenceCount} 条用户材料参与整理</span>
          <span>情景分析 · 非确定预测</span>
        </div>
      </div>

      <div className="mx-auto grid max-w-2xl grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:justify-center">
        <button
          type="button"
          onClick={exportImage}
          disabled={isExportingImage}
          className="col-span-2 rounded-lg bg-night px-4 py-2.5 text-sm font-medium text-deep shadow-quiet disabled:opacity-50 sm:col-span-1"
        >
          {isExportingImage ? "正在生成图片…" : "保存决策摘要图片"}
        </button>
        <button
          type="button"
          onClick={copyResult}
          className="rounded-lg border border-night/15 px-4 py-2 text-sm text-ink hover:bg-deep"
        >
          复制文字版
        </button>
        <button
          type="button"
          onClick={exportJson}
          className="rounded-lg border border-night/15 px-4 py-2 text-sm text-ink hover:bg-deep"
          title="供备份或导入，普通用户可忽略"
        >
          {shareCopy.actions.exportJson}
        </button>
        <button
          type="button"
          onClick={() => setStep("forks")}
          className="rounded-lg border border-blue/30 px-4 py-2 text-sm text-blue hover:bg-blue/10"
        >
          {shareCopy.actions.backToMap}
        </button>
        <button
          type="button"
          onClick={resetExperience}
          className="rounded-lg border border-night/15 px-4 py-2 text-sm text-mist hover:bg-deep hover:text-ink"
        >
          {shareCopy.actions.restart}
        </button>
      </div>
      <p className="mx-auto max-w-2xl text-center text-xs leading-6 text-mist">
        {editorConfig.global.disclaimer || disclaimer}
      </p>
    </section>
  );
}
