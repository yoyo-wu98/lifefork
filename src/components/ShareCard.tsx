"use client";

import { useLifeforkStore } from "@/lib/stores/lifeforkStore";
import { disclaimer, proverbs } from "@/lib/copy";
import { SHARE_CARD_TEMPLATE_COPY, buildShareCardClipboardText } from "@/lib/content/shareCardTemplates";

const formatConfidence = (confidence: number) => `${Math.round(confidence * 100)}%`;

/**
 * Share card — the final step.
 * Shows a summarized result card with copy/export/restart actions.
 */
export function ShareCard() {
  const selfSkill = useLifeforkStore((s) => s.selfSkill);
  const selectedFork = useLifeforkStore((s) => s.selectedFork);
  const proverb = useLifeforkStore((s) => s.proverb);
  const setProverb = useLifeforkStore((s) => s.setProverb);
  const setStep = useLifeforkStore((s) => s.setStep);
  const resetExperience = useLifeforkStore((s) => s.resetExperience);
  const editorConfig = useLifeforkStore((s) => s.editorConfig);
  const setBadge = useLifeforkStore((s) => s.setBadge);

  if (!selfSkill || !selectedFork) return null;

  const shareCopy = SHARE_CARD_TEMPLATE_COPY.value;
  const branchDynamicType = selectedFork.dynamicType;
  const profileDynamicType = selfSkill.dynamicTypeProfile;
  const dynamicTypeSlot = branchDynamicType
    ? {
        currentTypeTendency: branchDynamicType.currentTypeTendency,
        typeDrift: `${branchDynamicType.typeDrift.fromType} -> ${branchDynamicType.typeDrift.toType} · ${branchDynamicType.typeDrift.driftLabel}`,
        confidence: formatConfidence(branchDynamicType.confidence),
        evidenceHint: branchDynamicType.evidenceHint,
      }
    : profileDynamicType
      ? {
          currentTypeTendency: profileDynamicType.currentTendency.type,
          typeDrift: profileDynamicType.forkTypeShifts[0]
            ? `${profileDynamicType.forkTypeShifts[0].fromType} -> ${profileDynamicType.forkTypeShifts[0].toType} · ${profileDynamicType.forkTypeShifts[0].driftLabel}`
            : "选择方案后显示变化",
          confidence: formatConfidence(profileDynamicType.currentTendency.confidence),
          evidenceHint: profileDynamicType.currentTendency.evidenceHint,
        }
      : null;

  const copyResult = async () => {
    const content = buildShareCardClipboardText({
      archetype: selfSkill.identity.archetype,
      innerConflict: selfSkill.semantic.innerConflict,
      currentChoice: selfSkill.questions.currentChoice,
      timePoint: selectedFork.title,
      futureSelfLine: proverb,
      dynamicType: dynamicTypeSlot ?? undefined,
    });
    try {
      await navigator.clipboard.writeText(content);
      setBadge("结果已复制");
    } catch {
      setBadge("复制失败，请检查浏览器剪贴板权限");
    }
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(selfSkill, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = shareCopy.exportFileName;
    a.click();
    URL.revokeObjectURL(url);
    setBadge("Self Skill JSON 已导出");
  };

  return (
    <section className="space-y-5">
      <div className="mx-auto max-w-[440px] overflow-hidden rounded-lg border border-night/10 bg-[oklch(0.99_0.004_92)] shadow-glow">
        <div className="border-b border-night/10 bg-deep/70 px-6 py-5">
          <p className="text-xs font-medium text-blue">{shareCopy.brandKicker}</p>
          <h3 className="mt-4 text-2xl font-semibold leading-8 text-ink">{selectedFork.futureSelfName}</h3>
          <p className="mt-2 text-sm leading-6 text-mist">{selectedFork.title}</p>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="rounded-lg border border-blue/20 bg-blue/10 p-3">
              <p className="text-[11px] text-blue">{shareCopy.labels.archetype}</p>
              <p className="mt-2 text-sm leading-5 text-ink">{selfSkill.identity.archetype}</p>
            </div>
            <div className="rounded-lg border border-gold/20 bg-gold/10 p-3">
              <p className="text-[11px] text-gold">{shareCopy.labels.scale}</p>
              <p className="mt-2 text-sm leading-5 text-ink">{selectedFork.timeSpan?.durationLabel ?? "当前时间点"}</p>
            </div>
          </div>

          {dynamicTypeSlot && (
            <div className="rounded-lg border border-night/10 bg-deep/60 p-4 text-left">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-blue">{shareCopy.labels.dynamicType}</p>
                <p className="text-xs text-mist">
                  {shareCopy.labels.confidence} {dynamicTypeSlot.confidence}
                </p>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] text-mist">{shareCopy.labels.currentTypeTendency}</p>
                  <p className="mt-1 text-sm leading-5 text-ink">{dynamicTypeSlot.currentTypeTendency} 倾向</p>
                </div>
                <div>
                  <p className="text-[11px] text-mist">{shareCopy.labels.typeDrift}</p>
                  <p className="mt-1 text-sm leading-5 text-ink">{dynamicTypeSlot.typeDrift}</p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-5 text-mist">
                {shareCopy.labels.evidenceHint}：{dynamicTypeSlot.evidenceHint}
              </p>
            </div>
          )}

          <div>
            <p className="text-xs text-mist">{shareCopy.labels.innerConflict}</p>
            <p className="mt-2 text-sm leading-6 text-ink">{selfSkill.semantic.innerConflict}</p>
          </div>

          <div>
            <p className="text-xs text-mist">{shareCopy.labels.currentChoice}</p>
            <p className="mt-2 text-sm leading-6 text-mist">{selfSkill.questions.currentChoice}</p>
          </div>

          <blockquote className="rounded-lg border border-gold/20 bg-gold/10 p-4 text-left text-lg leading-8 text-gold">
            {proverb}
          </blockquote>
        </div>

        <div className="flex items-center justify-between border-t border-night/10 px-6 py-4 text-xs text-mist">
          <span>{shareCopy.footerBrand}</span>
          <span>{shareCopy.footerLine}</span>
        </div>
      </div>
      <div className="mx-auto grid max-w-2xl grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:justify-center">
        <button type="button" onClick={copyResult} className="rounded-lg border border-night/15 px-4 py-2 text-sm text-ink hover:bg-deep">
          {shareCopy.actions.copyResult}
        </button>
        <button type="button" onClick={exportJson} className="rounded-lg border border-night/15 px-4 py-2 text-sm text-ink hover:bg-deep">
          {shareCopy.actions.exportJson}
        </button>
        <button
          type="button"
          onClick={() => {
            const lines = editorConfig.share.futureSelfLines.length ? editorConfig.share.futureSelfLines : proverbs;
            setProverb(lines[Math.floor(Math.random() * lines.length)]);
          }}
          className="rounded-lg border border-gold/30 px-4 py-2 text-sm text-gold hover:bg-gold/10"
        >
          {shareCopy.actions.refreshFutureSelfLine}
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
          className="col-span-2 rounded-lg bg-night px-4 py-2 text-sm font-medium text-deep shadow-quiet sm:col-span-1"
        >
          {shareCopy.actions.restart}
        </button>
      </div>
      <p className="mx-auto max-w-2xl text-center text-xs leading-6 text-mist">{editorConfig.global.disclaimer || disclaimer}</p>
    </section>
  );
}
