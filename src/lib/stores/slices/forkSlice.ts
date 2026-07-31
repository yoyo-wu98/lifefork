"use client";

import { generateInitialInstanceMessage } from "@/lib/dialogueEngine";
import { saveChatMessages, saveSelectedFork } from "@/lib/storage";
import type { ChatMessage } from "@/lib/types";
import { ROOT_FORK_ID, type ForkSlice, type LifeforkSlice } from "@/lib/stores/types";

const id = () => crypto.randomUUID();

export const createForkSlice: LifeforkSlice<ForkSlice> = (set, get) => ({
  selectedFork: null,
  previewForkId: ROOT_FORK_ID,

  setPreviewForkId: (previewForkId) => set({ previewForkId }),

  selectFork: (path) => {
    const { selfSkill } = get();
    const messages: ChatMessage[] = [
      {
        id: id(),
        role: "instance",
        content: generateInitialInstanceMessage(path, selfSkill ?? undefined),
        createdAt: new Date().toISOString(),
      },
    ];

    set({
      previewForkId: path.id,
      selectedFork: path,
      messages,
      badge: "方案回复",
      step: "chat",
    });

    saveSelectedFork(path);
    saveChatMessages(messages);
  },
});
