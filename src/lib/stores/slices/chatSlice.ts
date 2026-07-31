"use client";

import { generateInstanceReply } from "@/lib/dialogueEngine";
import { saveChatMessages } from "@/lib/storage";
import { selectStageVoiceForFork } from "@/lib/voiceEngine";
import type { ChatMessage } from "@/lib/types";
import type { ChatSlice, LifeforkSlice } from "@/lib/stores/types";

const id = () => crypto.randomUUID();

export const createChatSlice: LifeforkSlice<ChatSlice> = (set, get) => ({
  messages: [],

  setMessages: (messages) => {
    set({ messages });
    saveChatMessages(messages);
  },

  sendMessage: async (content) => {
    if (!content.trim()) return;

    const { selfSkill, selectedFork, messages, editorConfig, runtimeConfig } = get();
    if (!selfSkill || !selectedFork) return;

    const userMsg: ChatMessage = {
      id: id(),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };

    let replyContent: string;

    const shouldUseAi =
      runtimeConfig.features.ai &&
      editorConfig.features.aiApi &&
      editorConfig.global.aiMode === "api-enhanced";

    if (!shouldUseAi) {
      replyContent = generateInstanceReply(content, selfSkill, selectedFork);
    } else {
      try {
        const history = messages
          .map((message) => `${message.role === "user" ? "现在的我" : "分支自我"}: ${message.content}`)
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
            stageVoice: JSON.stringify(selectStageVoiceForFork(selfSkill.stageVoices, selectedFork)),
            calibrationNotes: selfSkill.voice.calibrationNotes,
            conversationHistory: history,
            userMessage: content,
          }),
        });

        const json = res.ok ? await res.json() : null;
        replyContent = json?.success ? json.data.reply : generateInstanceReply(content, selfSkill, selectedFork);
      } catch {
        replyContent = generateInstanceReply(content, selfSkill, selectedFork);
      }
    }

    const nextMessages = [
      ...messages,
      userMsg,
      {
        id: id(),
        role: "instance" as const,
        content: replyContent,
        createdAt: new Date().toISOString(),
      },
    ];

    set({ messages: nextMessages });
    saveChatMessages(nextMessages);
  },
});
