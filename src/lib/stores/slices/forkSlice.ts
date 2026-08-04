"use client";

import { generateInitialInstanceMessage } from "@/lib/dialogueEngine";
import { saveChatMessages, saveSelectedFork, saveStep } from "@/lib/storage";
import type { ChatMessage } from "@/lib/types";
import { ROOT_FORK_ID, type ForkSlice, type LifeforkSlice } from "@/lib/stores/types";

const id = () => crypto.randomUUID();

export const createForkSlice: LifeforkSlice<ForkSlice> = (set, get) => ({
  selectedFork: null,
  previewForkId: ROOT_FORK_ID,

  setPreviewForkId: (previewForkId) => set({ previewForkId }),

  selectFork: (path) => {
    const { selfSkill, selectedFork, messages } = get();

    // Re-entering the same branch keeps the conversation instead of wiping it.
    if (selectedFork?.id === path.id) {
      set({ previewForkId: path.id, step: "chat" });
      saveStep("chat");
      return;
    }

    // Switching to a different branch with an active conversation asks first.
    if (selectedFork && selectedFork.id !== path.id && messages.length > 1) {
      get().requestConfirmation(
        {
          title: `切换到「${path.title}」？`,
          message: `当前与「${selectedFork.title}」的对话记录（${messages.length} 条）会被替换。聊天记录无法跨方案保留。`,
          confirmLabel: "切换方案",
          tone: "default",
        },
        () => {
          get().selectFork(path);
        },
      );
      return;
    }

    const opening: ChatMessage[] = [
      {
        id: id(),
        role: "instance",
        content: generateInitialInstanceMessage(path, selfSkill ?? undefined),
        createdAt: new Date().toISOString(),
        execution: {
          source: "local-fallback",
          used: false,
          provider: "local",
          model: "scenario-intro-rules",
          fallbackReason: "initial_scenario_intro",
          durationMs: 0,
        },
      },
    ];

    set({
      previewForkId: path.id,
      selectedFork: path,
      messages: opening,
      badge: "方案回复",
      step: "chat",
    });

    saveSelectedFork(path);
    saveChatMessages(opening);
    saveStep("chat");
  },
});
