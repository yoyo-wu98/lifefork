"use client";

import type { StateCreator } from "zustand";
import type { EditorConfig } from "@/lib/editorConfig";
import type { PublicRuntimeConfig } from "@/lib/runtimeConfig";
import type {
  AnalysisSettings,
  AppStep,
  ChatMessage,
  ForkPath,
  SelfSkill,
  SelfVersion,
  TimelineNode,
  WeChatAnalysis,
} from "@/lib/types";

export interface Answers {
  currentChoice: string;
  recurringEmotion: string;
  pastNode: string;
  hiddenSelf: string;
  futureSentence: string;
}

export const INITIAL_ANSWERS: Answers = {
  currentChoice: "",
  recurringEmotion: "",
  pastNode: "",
  hiddenSelf: "",
  futureSentence: "",
};

export const ROOT_FORK_ID = "lifefork-life-root";

export interface NavigationSlice {
  step: AppStep;
  setStep: (step: AppStep) => void;
  hydrateFromStorage: () => void;
  startNewExperience: () => void;
  loadDemoScenario: () => Promise<void>;
  resetExperience: () => void;
}

export interface InputSlice {
  selectedVersion: SelfVersion | null;
  answers: Answers;
  extraText: string;
  wechatRaw: string;
  wechatAnalysis: WeChatAnalysis | null;
  analysisSettings: AnalysisSettings;
  setSelectedVersion: (v: SelfVersion | null) => void;
  setAnswer: (key: keyof Answers, value: string) => void;
  setExtraText: (v: string) => void;
  setWechatRaw: (v: string) => void;
  setWechatAnalysis: (a: WeChatAnalysis | null) => void;
  setAnalysisSettings: (settings: AnalysisSettings) => void;
}

export interface SelfSkillSlice {
  selfSkill: SelfSkill | null;
  isGenerating: boolean;
  createSkill: () => Promise<void>;
  tuneVoice: (note: string) => void;
  setTimelineNodes: (nodes: TimelineNode[]) => void;
  deleteTimelineNode: (nodeId: string) => void;
}

export interface ForkSlice {
  selectedFork: ForkPath | null;
  previewForkId: string;
  setPreviewForkId: (id: string) => void;
  selectFork: (path: ForkPath) => void;
}

export interface ChatSlice {
  messages: ChatMessage[];
  setMessages: (msgs: ChatMessage[]) => void;
  sendMessage: (content: string) => Promise<void>;
}

export interface UiSlice {
  badge: string | null;
  proverb: string;
  editorConfig: EditorConfig;
  runtimeConfig: PublicRuntimeConfig;
  setBadge: (b: string | null) => void;
  setProverb: (p: string) => void;
  saveEditorConfig: (config: EditorConfig) => void;
  resetEditorConfig: () => void;
  importEditorConfig: (json: string) => void;
  setRuntimeConfig: (config: PublicRuntimeConfig) => void;
}

export interface LifeforkState
  extends NavigationSlice,
    InputSlice,
    SelfSkillSlice,
    ForkSlice,
    ChatSlice,
    UiSlice {}

export type LifeforkSlice<T> = StateCreator<LifeforkState, [], [], T>;
