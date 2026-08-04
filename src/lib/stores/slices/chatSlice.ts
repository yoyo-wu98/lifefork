"use client";

import { generateInstanceReply } from "@/lib/dialogueEngine";
import { containsCrisisSignal, safetyMessage } from "@/lib/safety";
import { saveChatMessages } from "@/lib/storage";
import { selectStageVoiceForFork } from "@/lib/voiceEngine";
import type { ChatMessage } from "@/lib/types";
import type { ChatSlice, LifeforkSlice } from "@/lib/stores/types";

const id = () => crypto.randomUUID();
const CHAT_TIMEOUT_MS = 45_000;

export const createChatSlice: LifeforkSlice<ChatSlice> = (set, get) => ({
  messages: [],
  isChatResponding: false,
  chatRateLimitedUntil: null,

  setMessages: (messages) => {
    set({ messages });
    saveChatMessages(messages);
  },

  sendMessage: async (content) => {
    if (!content.trim()) return;

    const {
      selfSkill,
      selectedFork,
      messages,
      editorConfig,
      runtimeConfig,
      isChatResponding,
    } = get();
    if (!selfSkill || !selectedFork) return;
    if (isChatResponding) return;

    const forkIdAtSend = selectedFork.id;
    set({ isChatResponding: true });

    const userMsg: ChatMessage = {
      id: id(),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };

    // Optimistic: show the user's message immediately, persist it,
    // so a slow server reply never swallows their words.
    const optimisticMessages = [...messages, userMsg];
    set({ messages: optimisticMessages });
    saveChatMessages(optimisticMessages);

    let replyContent: string;
    let execution: NonNullable<ChatMessage["execution"]>;
    const startedAt = Date.now();

    const shouldUseAi =
      runtimeConfig.features.ai &&
      editorConfig.features.aiApi &&
      editorConfig.global.aiMode === "api-enhanced";

    try {
      if (containsCrisisSignal(content)) {
        replyContent = safetyMessage;
        execution = {
          source: "safety-intercept",
          used: false,
          provider: "local",
          model: "safety-rules",
          fallbackReason: "safety_intercept",
          durationMs: Date.now() - startedAt,
        };
      } else if (!shouldUseAi) {
        replyContent = generateInstanceReply(content, selfSkill, selectedFork);
        execution = {
          source: "local-fallback",
          used: false,
          provider: "local",
          model: "local-dialogue-rules",
          fallbackReason: "ai_disabled_by_user_or_runtime",
          durationMs: Date.now() - startedAt,
        };
      } else {
        try {
          const history = messages
            .filter(
              (message) =>
                message.role !== "system" &&
                message.execution?.source !== "safety-intercept" &&
                !containsCrisisSignal(message.content),
            )
            .map(
              (message) =>
                `${message.role === "user" ? "现在的我" : "分支自我"}: ${message.content}`,
            )
            .join("\n")
            .slice(-2000);

          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: AbortSignal.timeout(CHAT_TIMEOUT_MS),
            body: JSON.stringify({
              selfSkillSummary: selfSkill.identity.selfNarrative,
              forkTitle: selectedFork.title,
              forkSummary: selectedFork.summary,
              forkScale: selectedFork.timeSpan?.durationLabel ?? selectedFork.scale ?? "life",
              forkGains: selectedFork.gains,
              forkCosts: selectedFork.costs,
              forkFutureSelfVoice: selectedFork.futureSelfVoice,
              voiceProfile: JSON.stringify(selfSkill.voice),
              stageVoice: JSON.stringify(
                selectStageVoiceForFork(selfSkill.stageVoices, selectedFork),
              ),
              calibrationNotes: selfSkill.voice.calibrationNotes,
              conversationHistory: history,
              userMessage: content,
            }),
          });

          let json: any = null;
          try {
            json = await res.json();
          } catch {
            json = null;
          }

          if (res.ok && json?.success) {
            replyContent = json.data.reply;
            const used = json.meta?.llmUsed === true;
            execution = {
              source: json.data.safetyIntercept
                ? "safety-intercept"
                : used
                  ? "server-ai"
                  : "local-fallback",
              used,
              provider:
                used && (json.meta?.provider === "openai" || json.meta?.provider === "deepseek")
                  ? json.meta.provider
                  : "local",
              model: used ? json.meta?.model ?? "unknown" : "local-dialogue-rules",
              fallbackReason: json.meta?.fallbackReason,
              promptVersion: json.meta?.promptVersion,
              durationMs: Date.now() - startedAt,
              tokenUsage: json.usage,
            };
          } else if (res.status === 429) {
            const retryAfter =
              typeof json?.retryAfterSeconds === "number"
                ? json.retryAfterSeconds
                : Math.max(1, Math.ceil(((json?.meta?.resetAt ?? 0) - Date.now()) / 1000));
            set({ chatRateLimitedUntil: Date.now() + retryAfter * 1000 });
            replyContent = generateInstanceReply(content, selfSkill, selectedFork);
            execution = {
              source: "local-fallback",
              used: false,
              provider: "local",
              model: "local-dialogue-rules",
              fallbackReason: "rate_limited",
              durationMs: Date.now() - startedAt,
            };
          } else {
            replyContent = generateInstanceReply(content, selfSkill, selectedFork);
            execution = {
              source: "local-fallback",
              used: false,
              provider: "local",
              model: "local-dialogue-rules",
              fallbackReason: `api_http_${res.status}`,
              durationMs: Date.now() - startedAt,
            };
          }
        } catch (err) {
          const isTimeout = err instanceof DOMException && err.name === "TimeoutError";
          replyContent = generateInstanceReply(content, selfSkill, selectedFork);
          execution = {
            source: "local-fallback",
            used: false,
            provider: "local",
            model: "local-dialogue-rules",
            fallbackReason: isTimeout ? "api_timeout" : "api_request_failed",
            durationMs: Date.now() - startedAt,
          };
        }
      }

      // If the user switched branches while we waited, don't clobber the
      // new branch's messages with the old branch's conversation.
      if (get().selectedFork?.id !== forkIdAtSend) {
        return;
      }

      const nextMessages = [
        ...get().messages,
        {
          id: id(),
          role: "instance" as const,
          content: replyContent,
          createdAt: new Date().toISOString(),
          execution,
        },
      ];

      set({ messages: nextMessages });
      saveChatMessages(nextMessages);
    } finally {
      set({ isChatResponding: false });
    }
  },
});
