"use client";

import { createAnalysisSettings } from "@/lib/analysis/methodRegistry";
import {
  saveAnalysisSettings,
  saveAnswers,
  saveExtraText,
  saveSelectedVersion,
  saveWeChatAnalysis,
} from "@/lib/storage";
import { INITIAL_ANSWERS, type InputSlice, type LifeforkSlice } from "@/lib/stores/types";

export const createInputSlice: LifeforkSlice<InputSlice> = (set) => ({
  selectedVersion: "future",
  answers: { ...INITIAL_ANSWERS },
  extraText: "",
  wechatRaw: "",
  wechatAnalysis: null,
  analysisSettings: createAnalysisSettings(),

  setSelectedVersion: (selectedVersion) => {
    set({ selectedVersion });
    saveSelectedVersion(selectedVersion);
  },
  setAnswer: (key, value) =>
    set((state) => {
      const answers = { ...state.answers, [key]: value };
      saveAnswers(answers);
      return { answers };
    }),
  setExtraText: (extraText) => {
    set({ extraText });
    saveExtraText(extraText);
  },
  setWechatRaw: (v) => set({ wechatRaw: v }),
  setWechatAnalysis: (analysis) => {
    set({ wechatAnalysis: analysis });
    saveWeChatAnalysis(analysis);
  },
  setAnalysisSettings: (analysisSettings) => {
    set({ analysisSettings });
    saveAnalysisSettings(analysisSettings);
  },
});
