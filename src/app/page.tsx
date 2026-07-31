"use client";

import { useEffect, useState } from "react";
import { useLifeforkStore } from "@/lib/stores/lifeforkStore";
import { AppNav } from "@/components/AppNav";
import { AnalysisMethodStep } from "@/components/AnalysisMethodStep";
import { BadgeToast } from "@/components/BadgeToast";
import { EditorConsole } from "@/components/EditorConsole";
import { ExtraTextStep } from "@/components/ExtraTextStep";
import { ForkPaths } from "@/components/ForkPaths";
import { GeneratingScreen } from "@/components/GeneratingScreen";
import { InstanceChat } from "@/components/InstanceChat";
import { Landing } from "@/components/Landing";
import { ProgressOrb } from "@/components/ProgressOrb";
import { QuestionFlow } from "@/components/QuestionFlow";
import { RuntimeConfigSync } from "@/components/RuntimeConfigSync";
import { SelfSkillPanel } from "@/components/SelfSkillPanel";
import { ShareCard } from "@/components/ShareCard";
import { TimelineView } from "@/components/TimelineView";
import { WeChatImportStep } from "@/components/WeChatImportStep";

/**
 * Lifefork root page.
 *
 * Responsibilities:
 * 1. Hydrate store from localStorage on mount
 * 2. Map step → component (route-like rendering)
 * 3. Auto-dismiss badges
 *
 * All business logic lives in useLifeforkStore.
 */
export default function HomePage() {
  // ── Store ────────────────────────────────────────────────────────
  const step = useLifeforkStore((s) => s.step);
  const setStep = useLifeforkStore((s) => s.setStep);
  const selfSkill = useLifeforkStore((s) => s.selfSkill);
  const selectedFork = useLifeforkStore((s) => s.selectedFork);
  const badge = useLifeforkStore((s) => s.badge);
  const setBadge = useLifeforkStore((s) => s.setBadge);
  const hydrateFromStorage = useLifeforkStore((s) => s.hydrateFromStorage);
  const runtimeConfig = useLifeforkStore((s) => s.runtimeConfig);
  const [hasHydrated, setHasHydrated] = useState(false);

  // ── Hydrate on mount ─────────────────────────────────────────────
  useEffect(() => {
    hydrateFromStorage();
    setHasHydrated(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-dismiss badges ──────────────────────────────────────────
  useEffect(() => {
    if (!badge) return;
    const timer = setTimeout(() => setBadge(null), 2400);
    return () => clearTimeout(timer);
  }, [badge, setBadge]);

  // ── Progress (derived) ───────────────────────────────────────────
  const progressMap: Record<string, number> = {
    landing: 0,
    questions: 30,
    "wechat-import": 40,
    "extra-text": 45,
    methods: 52,
    generating: 60,
    "self-skill": 75,
    timeline: 82,
    forks: 90,
    chat: 96,
    share: 100,
    editor: 100,
  };
  const progress = progressMap[step] ?? 0;
  const missingSkill = ["self-skill", "timeline", "forks", "chat", "share"].includes(step) && !selfSkill;
  const missingFork = ["chat", "share"].includes(step) && !selectedFork;

  // ── Render ───────────────────────────────────────────────────────
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1360px] flex-col gap-5 overflow-x-hidden px-4 pb-14 pt-4 sm:px-6 md:px-8">
      <RuntimeConfigSync />
      <AppNav />
      {(runtimeConfig.announcement || runtimeConfig.status === "maintenance") && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            runtimeConfig.status === "maintenance"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-blue/20 bg-blue/5 text-ink"
          }`}
          role="status"
        >
          {runtimeConfig.status === "maintenance"
            ? "服务正在维护。你仍可查看浏览器中已有的结果，新的 AI 分析暂时不可用。"
            : runtimeConfig.announcement}
        </div>
      )}
      {hasHydrated && step !== "landing" && step !== "editor" && (
        <ProgressOrb progress={progress} />
      )}

      {!hasHydrated && (
        <section className="min-h-[420px] animate-pulse rounded-lg border border-night/10 bg-[oklch(0.99_0.004_92)]" aria-label="正在恢复本地进度" />
      )}

      {hasHydrated && (missingSkill || missingFork) && (
        <section className="mx-auto my-12 max-w-xl rounded-lg border border-gold/25 bg-[oklch(0.99_0.004_92)] p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-gold">本地进度需要重新定位</p>
          <h1 className="mt-2 text-2xl font-semibold text-ink">这个页面缺少所需的数据</h1>
          <p className="mt-3 text-sm leading-6 text-mist">
            可能是旧版本存档或浏览器清理造成的。已有数据不会继续被错误读取。
          </p>
          <button
            type="button"
            className="mt-5 rounded-lg bg-night px-5 py-3 text-sm font-medium text-deep"
            onClick={() => setStep(selfSkill ? "forks" : "landing")}
          >
            {selfSkill ? "回到方案地图" : "回到主页"}
          </button>
        </section>
      )}

      {hasHydrated && !missingSkill && !missingFork && (
        <>
          {step === "landing" && <Landing />}
          {step === "questions" && <QuestionFlow />}
          {step === "wechat-import" && <WeChatImportStep />}
          {step === "extra-text" && <ExtraTextStep />}
          {step === "methods" && <AnalysisMethodStep />}
          {step === "generating" && <GeneratingScreen />}
          {step === "self-skill" && selfSkill && <SelfSkillPanel />}
          {step === "timeline" && selfSkill && <TimelineView />}
          {step === "forks" && selfSkill && <ForkPaths />}
          {step === "chat" && selfSkill && selectedFork && <InstanceChat />}
          {step === "share" && selfSkill && selectedFork && <ShareCard />}
          {step === "editor" && <EditorConsole />}
        </>
      )}

      <BadgeToast />
    </main>
  );
}
