"use client";

import { create } from "zustand";
import type {
  AppStep,
  SelfSkill,
  SelfVersion,
  ChatMessage,
  ForkPath,
  WeChatAnalysis,
} from "@/lib/types";
import { buildLifeSimulationMap } from "@/lib/selfSkillEngine";
import { generateInitialInstanceMessage } from "@/lib/dialogueEngine";
import { containsCrisisSignal, safetyMessage } from "@/lib/safety";
import {
  clearAll as clearStorage,
  loadChatMessages,
  loadSelectedFork,
  loadSelfSkill,
  loadStep,
  loadWeChatAnalysis,
  saveChatMessages,
  saveSelectedFork,
  saveSelfSkill,
  saveStep,
  saveWeChatAnalysis,
} from "@/lib/storage";
import { proverbs } from "@/lib/copy";

// ── Types ───────────────────────────────────────────────────────────

interface Answers {
  currentChoice: string;
  recurringEmotion: string;
  pastNode: string;
  hiddenSelf: string;
  futureSentence: string;
}

const INITIAL_ANSWERS: Answers = {
  currentChoice: "",
  recurringEmotion: "",
  pastNode: "",
  hiddenSelf: "",
  futureSentence: "",
};

export interface LifeforkState {
  // Navigation
  step: AppStep;
  setStep: (step: AppStep) => void;

  // User input
  selectedVersion: SelfVersion | null;
  answers: Answers;
  extraText: string;
  wechatRaw: string;
  wechatAnalysis: WeChatAnalysis | null;

  // Generated data
  selfSkill: SelfSkill | null;
  selectedFork: ForkPath | null;
  previewForkId: string;
  messages: ChatMessage[];

  // UI state
  badge: string | null;
  proverb: string;
  isGenerating: boolean;

  // Actions — setters
  setSelectedVersion: (v: SelfVersion | null) => void;
  setAnswer: (key: keyof Answers, value: string) => void;
  setExtraText: (v: string) => void;
  setWechatRaw: (v: string) => void;
  setWechatAnalysis: (a: WeChatAnalysis | null) => void;
  setPreviewForkId: (id: string) => void;
  setBadge: (b: string | null) => void;
  setProverb: (p: string) => void;
  setMessages: (msgs: ChatMessage[]) => void;

  // Actions — flows
  createSkill: () => Promise<void>;
  selectFork: (path: ForkPath) => void;
  sendMessage: (content: string) => Promise<void>;
  tuneVoice: (note: string) => void;
  startNewExperience: () => void;
  resetExperience: () => void;

  // Actions — persistence
  hydrateFromStorage: () => void;
}

// ── Helpers ─────────────────────────────────────────────────────────

function flattenForks(paths: ForkPath[]): ForkPath[] {
  return paths.flatMap((p) => [p, ...flattenForks(p.children ?? [])]);
}

function refreshLegacyForkTree(skill: SelfSkill): SelfSkill {
  const hasLegacy = flattenForks(skill.forks).some(
    (p) => !p.scale || !p.timeSpan || p.id.startsWith("node-"),
  );
  if (skill.version === "v0.3" && !hasLegacy) return skill;
  return {
    ...skill,
    version: "v0.3",
    forks: buildLifeSimulationMap(skill.questions.currentChoice),
  };
}

async function fetchSelfSkillFromAPI(input: {
  selectedVersion: SelfVersion;
  currentChoice: string;
  recurringEmotion: string;
  pastNode: string;
  hiddenSelf: string;
  futureSentence: string;
  extraText?: string;
  wechatSummary?: string;
}): Promise<Partial<SelfSkill> | null> {
  try {
    const res = await fetch("/api/generate-self-skill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch {
    return null; // Fall back to local engine
  }
}

// ── Store ───────────────────────────────────────────────────────────

export const useLifeforkStore = create<LifeforkState>()((set, get) => ({
  // ── Initial state ────────────────────────────────────────────────
  step: "landing",
  selectedVersion: null,
  answers: { ...INITIAL_ANSWERS },
  extraText: "",
  wechatRaw: "",
  wechatAnalysis: null,
  selfSkill: null,
  selectedFork: null,
  previewForkId: "lifefork-life-root",
  messages: [],
  badge: null,
  proverb: proverbs[0],
  isGenerating: false,

  // ── Simple setters ────────────────────────────────────────────────
  setStep: (step) => {
    set({ step });
    saveStep(step);
  },

  setSelectedVersion: (v) => set({ selectedVersion: v }),

  setAnswer: (key, value) =>
    set((s) => ({ answers: { ...s.answers, [key]: value } })),

  setExtraText: (v) => set({ extraText: v }),

  setWechatRaw: (v) => set({ wechatRaw: v }),

  setWechatAnalysis: (a) => {
    set({ wechatAnalysis: a });
    saveWeChatAnalysis(a);
  },

  setPreviewForkId: (id) => set({ previewForkId: id }),

  setBadge: (b) => set({ badge: b }),

  setProverb: (p) => set({ proverb: p }),

  setMessages: (msgs) => {
    set({ messages: msgs });
    saveChatMessages(msgs);
  },

  // ── Flow: Create Self Skill ──────────────────────────────────────
  createSkill: async () => {
    const { selectedVersion, answers, extraText, wechatAnalysis } = get();

    // Crisis check
    const merged = `${Object.values(answers).join(" ")} ${extraText}`;
    if (containsCrisisSignal(merged)) {
      alert(safetyMessage);
      return;
    }

    set({ isGenerating: true, step: "generating" });

    const version = selectedVersion ?? "future";

    // Try LLM API first, fall back to local engine
    const llmSkillCore = await fetchSelfSkillFromAPI({
      selectedVersion: version,
      ...answers,
      extraText: extraText || undefined,
      wechatSummary: wechatAnalysis?.suggestedSelfSkillText,
    });

    // Dynamically import local engine for fallback
    const { generateSelfSkill } = await import("@/lib/selfSkillEngine");
    const localSkill = generateSelfSkill({
      selectedVersion: version,
      ...answers,
      extraText,
      wechatAnalysis: wechatAnalysis ?? undefined,
    });

    // Merge: LLM enriches the local skill
    const skill: SelfSkill = llmSkillCore
      ? {
          ...localSkill,
          ...llmSkillCore,
          version: "v0.4-llm",
          forks: localSkill.forks,
          wechatAnalysis: wechatAnalysis ?? undefined,
          questions: localSkill.questions,
          evidence: llmSkillCore.evidence ?? localSkill.evidence,
          claims: llmSkillCore.claims ?? localSkill.claims,
        }
      : localSkill;

    // Small delay for UX
    await new Promise((r) => setTimeout(r, 800));

    set({
      selfSkill: skill,
      selectedFork: null,
      messages: [],
      previewForkId: "lifefork-life-root",
      badge: llmSkillCore ? "AI 深度理解完成" : "时间线解锁",
      isGenerating: false,
      step: "self-skill",
    });

    saveSelfSkill(skill);
  },

  // ── Flow: Select a Fork ──────────────────────────────────────────
  selectFork: (path) => {
    const { selfSkill } = get();

    set({
      previewForkId: path.id,
      selectedFork: path,
      messages: [
        {
          id: crypto.randomUUID(),
          role: "instance",
          content: generateInitialInstanceMessage(path, selfSkill ?? undefined),
          createdAt: new Date().toISOString(),
        },
      ],
      badge: "未来来信",
      step: "chat",
    });

    saveSelectedFork(path);
  },

  // ── Flow: Send a message in chat ─────────────────────────────────
  sendMessage: async (content) => {
    if (!content.trim()) return;
    const { selfSkill, selectedFork, messages } = get();
    if (!selfSkill || !selectedFork) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };

    // Try LLM API first
    let replyContent: string;
    let safetyIntercept = false;

    try {
      const history = messages
        .map((m) => `${m.role === "user" ? "现在的我" : "分支自我"}: ${m.content}`)
        .join("\n")
        .slice(-2000);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selfSkillSummary: selfSkill.identity.selfNarrative,
          forkTitle: selectedFork.title,
          forkSummary: selectedFork.summary,
          forkScale: selectedFork.timeSpan?.durationLabel ?? selectedFork.scale ?? "life",
          forkGains: selectedFork.gains,
          forkCosts: selectedFork.costs,
          forkFutureSelfVoice: selectedFork.futureSelfVoice,
          voiceProfile: JSON.stringify(selfSkill.voice),
          conversationHistory: history,
          userMessage: content,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          replyContent = json.data.reply;
          safetyIntercept = json.data.safetyIntercept ?? false;
        } else {
          // Fallback to local
          const { generateInstanceReply } = await import("@/lib/dialogueEngine");
          replyContent = generateInstanceReply(content, selfSkill, selectedFork);
        }
      } else {
        const { generateInstanceReply } = await import("@/lib/dialogueEngine");
        replyContent = generateInstanceReply(content, selfSkill, selectedFork);
      }
    } catch {
      const { generateInstanceReply } = await import("@/lib/dialogueEngine");
      replyContent = generateInstanceReply(content, selfSkill, selectedFork);
    }

    const reply: ChatMessage = {
      id: crypto.randomUUID(),
      role: "instance",
      content: replyContent,
      createdAt: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg, reply];
    set({ messages: newMessages });
    saveChatMessages(newMessages);
  },

  // ── Flow: Tune voice ─────────────────────────────────────────────
  tuneVoice: (note) => {
    const { selfSkill } = get();
    if (!selfSkill) return;

    const nextNotes =
      note === "像我"
        ? selfSkill.voice.calibrationNotes
        : Array.from(new Set([...selfSkill.voice.calibrationNotes, note]));

    const updated: SelfSkill = {
      ...selfSkill,
      voice: {
        ...selfSkill.voice,
        calibrationNotes: nextNotes,
        closenessScore: Math.min(
          96,
          selfSkill.voice.closenessScore + (note === "像我" ? 3 : 5),
        ),
      },
    };

    set({
      selfSkill: updated,
      badge:
        note === "像我" ? "语气更接近了" : `语气校准：${note}`,
    });
    saveSelfSkill(updated);
  },

  // ── Flow: New experience ─────────────────────────────────────────
  startNewExperience: () => {
    const { selfSkill } = get();
    if (selfSkill && !window.confirm("开始新体验会覆盖浏览器里当前保存的 LifeFork 进度，要继续吗？")) return;

    clearStorage();
    set({
      step: "select-version",
      selectedVersion: null,
      answers: { ...INITIAL_ANSWERS },
      wechatRaw: "",
      wechatAnalysis: null,
      extraText: "",
      selfSkill: null,
      selectedFork: null,
      previewForkId: "lifefork-life-root",
      messages: [],
      proverb: proverbs[0],
    });
  },

  // ── Flow: Full reset ─────────────────────────────────────────────
  resetExperience: () => {
    if (!window.confirm("这会清空浏览器里保存的 LifeFork 数据，要继续吗？")) return;

    clearStorage();
    set({
      step: "landing",
      selectedVersion: null,
      answers: { ...INITIAL_ANSWERS },
      wechatRaw: "",
      wechatAnalysis: null,
      extraText: "",
      selfSkill: null,
      selectedFork: null,
      previewForkId: "lifefork-life-root",
      messages: [],
    });
  },

  // ── Hydrate from localStorage on app load ────────────────────────
  hydrateFromStorage: () => {
    const loadedStep = loadStep();
    const loadedSkill = loadSelfSkill();
    const loadedFork = loadSelectedFork();
    const loadedMsgs = loadChatMessages();
    const loadedWechatAnalysis = loadWeChatAnalysis();

    const refreshedSkill = loadedSkill
      ? refreshLegacyForkTree(loadedSkill)
      : null;

    let fork = loadedFork;
    if (loadedFork && refreshedSkill) {
      const refreshed = flattenForks(refreshedSkill.forks).find(
        (p) => p.id === loadedFork.id,
      );
      fork = refreshed ?? refreshedSkill.forks[2] ?? refreshedSkill.forks[0] ?? loadedFork;
    }

    set({
      step: loadedStep ?? "landing",
      selfSkill: refreshedSkill,
      wechatAnalysis: loadedWechatAnalysis,
      selectedFork: fork,
      previewForkId: fork?.id ?? "lifefork-life-root",
      messages: loadedMsgs.length ? loadedMsgs : [],
    });
  },
}));
