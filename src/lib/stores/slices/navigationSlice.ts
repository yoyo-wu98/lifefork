"use client";

import { proverbs } from "@/lib/copy";
import { flattenForks } from "@/lib/schema/repairForkTree";
import {
  clearAll as clearStorage,
  loadAnalysisSettings,
  loadChatMessages,
  loadSelectedFork,
  loadSelfSkill,
  loadStep,
  loadWeChatAnalysis,
  saveChatMessages,
  saveSelectedFork,
  saveSelfSkill,
  saveStep,
} from "@/lib/storage";
import { INITIAL_ANSWERS, ROOT_FORK_ID, type LifeforkSlice, type NavigationSlice } from "@/lib/stores/types";
import type { AppStep, ForkPath, SelfSkill } from "@/lib/types";

function confirmDestructive(message: string): boolean {
  return typeof window === "undefined" ? false : window.confirm(message);
}

function firstConfiguredLine(state: { editorConfig?: { share?: { futureSelfLines?: string[] } } }): string {
  return state.editorConfig?.share?.futureSelfLines?.[0] ?? proverbs[0];
}

const stepsWithoutSkill = new Set<AppStep>([
  "landing",
  "questions",
  "wechat-import",
  "extra-text",
  "methods",
  "editor",
]);

function resolveRestoredStep(
  storedStep: AppStep | null,
  selfSkill: SelfSkill | null,
  selectedFork: ForkPath | null,
): AppStep {
  const requested = storedStep === "select-version" ? "questions" : (storedStep ?? "landing");

  if (!selfSkill) {
    if (requested === "generating") return "questions";
    return stepsWithoutSkill.has(requested) ? requested : "landing";
  }

  if (requested === "generating") return "self-skill";
  if ((requested === "chat" || requested === "share") && !selectedFork) return "forks";
  return requested;
}

export const createNavigationSlice: LifeforkSlice<NavigationSlice> = (set, get) => ({
  step: "landing",

  setStep: (step) => {
    set({ step });
    saveStep(step);
  },

  hydrateFromStorage: () => {
    const loadedStep = loadStep();
    const loadedSkill = loadSelfSkill();
    const loadedFork = loadSelectedFork();
    const loadedMessages = loadChatMessages();
    const loadedWechatAnalysis = loadWeChatAnalysis();
    const loadedAnalysisSettings = loadAnalysisSettings();

    let selectedFork: ForkPath | null = null;
    if (loadedFork && loadedSkill) {
      selectedFork = flattenForks(loadedSkill.forks).find((path) => path.id === loadedFork.id) ?? null;
    }

    const restoredStep = resolveRestoredStep(loadedStep, loadedSkill, selectedFork);
    const restoredMessages = selectedFork ? loadedMessages : [];

    set({
      step: restoredStep,
      selectedVersion: loadedSkill?.selectedVersion ?? "future",
      selfSkill: loadedSkill,
      wechatAnalysis: loadedWechatAnalysis,
      analysisSettings: loadedSkill?.analysisSettings ?? loadedAnalysisSettings,
      selectedFork,
      previewForkId: selectedFork?.id ?? ROOT_FORK_ID,
      messages: restoredMessages,
    });

    saveStep(restoredStep);
    if (!selectedFork) {
      saveSelectedFork(null);
      saveChatMessages([]);
    }
  },

  startNewExperience: () => {
    const state = get();
    const { selfSkill, selectedFork, messages, wechatAnalysis } = state;
    const hasProgress = Boolean(selfSkill || selectedFork || messages.length || wechatAnalysis);

    if (hasProgress && !confirmDestructive("开始新体验会覆盖浏览器里当前保存的 LifeFork 进度，要继续吗？")) return;

    clearStorage();
    set({
      step: "questions",
      selectedVersion: "future",
      answers: { ...INITIAL_ANSWERS },
      wechatRaw: "",
      wechatAnalysis: null,
      extraText: "",
      analysisSettings: loadAnalysisSettings(),
      selfSkill: null,
      selectedFork: null,
      previewForkId: ROOT_FORK_ID,
      messages: [],
      proverb: firstConfiguredLine(state),
      badge: "问卷已开始",
    });
    saveStep("questions");
  },

  loadDemoScenario: async () => {
    const state = get();
    const { selfSkill, selectedFork, messages, wechatAnalysis } = state;
    const hasProgress = Boolean(selfSkill || selectedFork || messages.length || wechatAnalysis);

    if (hasProgress && !confirmDestructive("加载完整示例会覆盖浏览器里当前保存的 LifeFork 进度，要继续吗？")) return;

    const { fullLifeDemoSelfSkill } = await import("@/lib/scenarios/fullLifeDemoFixture");
    const demoSkill = structuredClone(fullLifeDemoSelfSkill);

    clearStorage();
    set({
      step: "forks",
      selectedVersion: demoSkill.selectedVersion,
      answers: { ...demoSkill.questions },
      wechatRaw: "",
      wechatAnalysis: null,
      extraText: demoSkill.extraText ?? "",
      analysisSettings: demoSkill.analysisSettings ?? loadAnalysisSettings(),
      selfSkill: demoSkill,
      selectedFork: null,
      previewForkId: ROOT_FORK_ID,
      messages: [],
      proverb: firstConfiguredLine(state),
      badge: "完整示例已加载",
    });

    saveSelfSkill(demoSkill);
    saveSelectedFork(null);
    saveChatMessages([]);
    saveStep("forks");
  },

  resetExperience: () => {
    if (!confirmDestructive("这会清空浏览器里保存的 LifeFork 数据，要继续吗？")) return;

    clearStorage();
    const state = get();
    set({
      step: "landing",
      selectedVersion: "future",
      answers: { ...INITIAL_ANSWERS },
      wechatRaw: "",
      wechatAnalysis: null,
      extraText: "",
      analysisSettings: loadAnalysisSettings(),
      selfSkill: null,
      selectedFork: null,
      previewForkId: ROOT_FORK_ID,
      messages: [],
      proverb: firstConfiguredLine(state),
      badge: null,
    });
  },
});
