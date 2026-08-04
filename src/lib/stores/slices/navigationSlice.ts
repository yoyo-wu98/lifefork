"use client";

import { proverbs } from "@/lib/copy";
import { flattenForks } from "@/lib/schema/repairForkTree";
import {
  clearAll as clearStorage,
  loadAnswers,
  loadAnalysisSettings,
  loadChatMessages,
  loadExtraText,
  loadSelectedFork,
  loadSelectedVersion,
  loadSelfSkill,
  loadStep,
  loadWeChatAnalysis,
  saveChatMessages,
  saveAnswers,
  saveExtraText,
  saveSelectedFork,
  saveSelectedVersion,
  saveSelfSkill,
  saveStep,
} from "@/lib/storage";
import { INITIAL_ANSWERS, ROOT_FORK_ID, type LifeforkSlice, type NavigationSlice } from "@/lib/stores/types";
import type { AppStep, ForkPath, SelfSkill } from "@/lib/types";

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
  hasCompleteAnswers: boolean,
): AppStep {
  const requested = storedStep === "select-version" ? "questions" : (storedStep ?? "landing");

  if (!selfSkill) {
    if (requested === "generating") return hasCompleteAnswers ? "methods" : "questions";
    if (
      (requested === "wechat-import" || requested === "extra-text" || requested === "methods") &&
      !hasCompleteAnswers
    ) {
      return "questions";
    }
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
    const loadedAnswers = loadedSkill?.questions ?? loadAnswers() ?? { ...INITIAL_ANSWERS };
    const loadedExtraText = loadedSkill?.extraText ?? loadExtraText();
    const hasCompleteAnswers = Object.values(loadedAnswers).every((answer) => answer.trim());

    let selectedFork: ForkPath | null = null;
    if (loadedFork && loadedSkill) {
      selectedFork = flattenForks(loadedSkill.forks).find((path) => path.id === loadedFork.id) ?? null;
    }

    const restoredStep = resolveRestoredStep(
      loadedStep,
      loadedSkill,
      selectedFork,
      hasCompleteAnswers,
    );
    const restoredMessages = selectedFork ? loadedMessages : [];

    set({
      step: restoredStep,
      selectedVersion: loadedSkill?.selectedVersion ?? loadSelectedVersion() ?? "future",
      answers: loadedAnswers,
      extraText: loadedExtraText,
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
    const { selfSkill, selectedFork, messages, wechatAnalysis, answers, extraText, wechatRaw } = state;
    const hasProgress = Boolean(
      selfSkill ||
        selectedFork ||
        messages.length ||
        wechatAnalysis ||
        extraText.trim() ||
        wechatRaw.trim() ||
        Object.values(answers).some((answer) => answer.trim()),
    );

    const start = () => {
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
    };

    if (hasProgress) {
      get().requestConfirmation(
        {
          title: "开始新的分析？",
          message: "当前浏览器里的问卷、个人分析、方案和对话会被清除。已导出的备份文件不会受影响。",
          confirmLabel: "清除并开始",
          tone: "danger",
        },
        start,
      );
      return;
    }

    start();
  },

  loadDemoScenario: async () => {
    const state = get();
    const { selfSkill, selectedFork, messages, wechatAnalysis, answers, extraText, wechatRaw } = state;
    const hasProgress = Boolean(
      selfSkill ||
        selectedFork ||
        messages.length ||
        wechatAnalysis ||
        extraText.trim() ||
        wechatRaw.trim() ||
        Object.values(answers).some((answer) => answer.trim()),
    );

    const load = async () => {
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
      saveAnswers(demoSkill.questions);
      saveExtraText(demoSkill.extraText ?? "");
      saveSelectedVersion(demoSkill.selectedVersion);
      saveSelectedFork(null);
      saveChatMessages([]);
      saveStep("forks");
    };

    if (hasProgress) {
      get().requestConfirmation(
        {
          title: "打开完整示例？",
          message: "当前浏览器里的进度会被示例数据替换。你可以先在结果页导出备份文件，再继续。",
          confirmLabel: "替换为示例",
          tone: "danger",
        },
        () => void load(),
      );
      return;
    }

    await load();
  },

  resetExperience: () => {
    const state = get();
    const hasProgress = Boolean(
      state.selfSkill ||
        state.selectedFork ||
        state.messages.length ||
        state.wechatAnalysis ||
        state.extraText.trim() ||
        state.wechatRaw.trim() ||
        Object.values(state.answers).some((answer) => answer.trim()),
    );
    if (!hasProgress) {
      set({ badge: "当前没有可清空的本地数据" });
      return;
    }
    const reset = () => {
      clearStorage();
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
    };

    get().requestConfirmation(
      {
        title: "清空本地数据？",
        message: "将删除当前浏览器中的问卷、导入摘要、个人分析、方案、地图布局和对话记录。此操作无法撤销。",
        confirmLabel: "确认清空",
        tone: "danger",
      },
      reset,
    );
  },
});
