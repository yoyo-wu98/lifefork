"use client";

import { createAnalysisSettings } from "@/lib/analysis/methodRegistry";
import { saveAnalysisSettings, saveWeChatAnalysis } from "@/lib/storage";
import { INITIAL_ANSWERS, type InputSlice, type LifeforkSlice } from "@/lib/stores/types";

export const createInputSlice: LifeforkSlice<InputSlice> = (set) => ({
  selectedVersion: "future",
  answers: { ...INITIAL_ANSWERS },
  extraText: "",
  wechatRaw: "",
  wechatAnalysis: null,
  analysisSettings: createAnalysisSettings(),

  setSelectedVersion: (v) => set({ selectedVersion: v }),
  setAnswer: (key, value) => set((state) => ({ answers: { ...state.answers, [key]: value } })),
  setExtraText: (v) => set({ extraText: v }),
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
