"use client";

import { useEffect } from "react";
import { useLifeforkStore } from "@/lib/stores/lifeforkStore";
import { AppNav } from "@/components/AppNav";
import { BadgeToast } from "@/components/BadgeToast";
import { ExtraTextStep } from "@/components/ExtraTextStep";
import { ForkPaths } from "@/components/ForkPaths";
import { GeneratingScreen } from "@/components/GeneratingScreen";
import { InstanceChat } from "@/components/InstanceChat";
import { Landing } from "@/components/Landing";
import { ProgressOrb } from "@/components/ProgressOrb";
import { QuestionFlow } from "@/components/QuestionFlow";
import { SelfSkillPanel } from "@/components/SelfSkillPanel";
import { ShareCard } from "@/components/ShareCard";
import { TimelineView } from "@/components/TimelineView";
import { VersionSelector } from "@/components/VersionSelector";
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

  // ── Hydrate on mount ─────────────────────────────────────────────
  useEffect(() => {
    hydrateFromStorage();
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
    "select-version": 10,
    questions: 30,
    "wechat-import": 40,
    "extra-text": 45,
    generating: 60,
    "self-skill": 75,
    timeline: 82,
    forks: 90,
    chat: 96,
    share: 100,
  };
  const progress = progressMap[step] ?? 0;

  // ── Render ───────────────────────────────────────────────────────
  return (
    <main className="mx-auto min-h-screen max-w-6xl space-y-6 p-6 md:p-10">
      <AppNav />
      <ProgressOrb progress={progress} />

      {step === "landing" && <Landing />}
      {step === "select-version" && <VersionSelector />}
      {step === "questions" && <QuestionFlow />}
      {step === "wechat-import" && <WeChatImportStep />}
      {step === "extra-text" && <ExtraTextStep />}
      {step === "generating" && <GeneratingScreen />}
      {step === "self-skill" && selfSkill && <SelfSkillPanel />}
      {step === "timeline" && selfSkill && <TimelineView />}
      {step === "forks" && selfSkill && <ForkPaths />}
      {step === "chat" && selfSkill && selectedFork && <InstanceChat />}
      {step === "share" && selfSkill && selectedFork && <ShareCard />}

      <BadgeToast />
    </main>
  );
}
