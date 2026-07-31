"use client";

import { useRef } from "react";
import { LoaderCircle, Send, SlidersHorizontal } from "lucide-react";
import { useLifeforkStore } from "@/lib/stores/lifeforkStore";
import type { ChatMessage } from "@/lib/types";

const QUICK_QUESTIONS = [
  "这个方案最值得注意什么？",
  "这个方案的主要成本是什么？",
  "我还需要确认什么？",
  "这个方案最难执行的部分是什么？",
  "第一步做什么？",
] as const;

const VOICE_OPTIONS = [
  { note: "像我", label: "这句像我" },
  { note: "少一点AI味", label: "少一点 AI 味" },
  { note: "更口语", label: "更口语" },
  { note: "更克制", label: "更克制" },
  { note: "更直接", label: "更直接" },
] as const;

function executionLabel(execution: ChatMessage["execution"]): string {
  if (!execution) return "来源未记录";
  if (execution.source === "safety-intercept") return "安全规则已拦截";
  if (execution.source === "server-ai") {
    const duration = execution.durationMs
      ? ` · ${(execution.durationMs / 1000).toFixed(1)} 秒`
      : "";
    return `服务器 AI · ${execution.provider} / ${execution.model}${duration}`;
  }
  if (execution.fallbackReason === "initial_scenario_intro") {
    return "方案说明 · 本地生成";
  }
  return "本地规则回复 · 服务器 AI 未参与";
}

/**
 * Instance Chat — talk to a future/past/forked self.
 * Supports quick questions, free-text input, voice calibration,
 * and LLM-powered dialogue via /api/chat.
 */
export function InstanceChat() {
  const selfSkill = useLifeforkStore((s) => s.selfSkill);
  const selectedFork = useLifeforkStore((s) => s.selectedFork);
  const messages = useLifeforkStore((s) => s.messages);
  const isChatResponding = useLifeforkStore((s) => s.isChatResponding);
  const sendMessage = useLifeforkStore((s) => s.sendMessage);
  const setMessages = useLifeforkStore((s) => s.setMessages);
  const tuneVoice = useLifeforkStore((s) => s.tuneVoice);
  const setStep = useLifeforkStore((s) => s.setStep);
  const inputRef = useRef<HTMLInputElement>(null);
  const voiceNoteRef = useRef<HTMLInputElement>(null);

  if (!selfSkill || !selectedFork) return null;

  const handleSend = () => {
    const input = inputRef.current;
    if (!input) return;
    const content = input.value.trim();
    if (!content) return;
    void sendMessage(content);
    input.value = "";
  };

  const handleVoiceFeedback = (note: string, label: string) => {
    tuneVoice(note);
    const currentMessages = useLifeforkStore.getState().messages;
    const systemMsg = {
      id: crypto.randomUUID(),
      role: "system" as const,
      content: `语气校准已记录：${label}。下一次回复会更靠近这个方向。`,
      createdAt: new Date().toISOString(),
    };
    setMessages([...currentMessages, systemMsg]);
  };

  const submitCustomVoiceNote = () => {
    const note = voiceNoteRef.current?.value.trim();
    if (!note) return;
    handleVoiceFeedback(note.slice(0, 80), note.slice(0, 80));
    if (voiceNoteRef.current) voiceNoteRef.current.value = "";
  };

  return (
    <section className="space-y-4 rounded-lg border border-night/10 bg-[oklch(0.99_0.004_92)] p-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl font-semibold text-ink">
            「{selectedFork.futureSelfName}」的模拟对话
          </h3>
          <p className="mt-2 max-w-[68ch] text-sm leading-6 text-mist">
            回复基于你的回答和当前方案生成，用于帮助你检查收益、成本和下一步。它不代表真实未来。
          </p>
          <p className="mt-2 text-xs text-blue">
            当前语气：{selfSkill.voice.toneName} · 建模完成度{" "}
            {selfSkill.voice.closenessScore}%
          </p>
          <p className="mt-1 text-xs leading-5 text-mist">
            完成度根据语气样本和校准记录计算，不代表客观相似率。
          </p>
        </div>
        <button
          type="button"
          className="rounded-lg border border-night/15 px-4 py-2 text-sm text-ink hover:bg-deep"
          onClick={() => setStep("forks")}
        >
          回到方案地图
        </button>
      </div>

      {/* Messages */}
      <div className="max-h-[50vh] space-y-3 overflow-y-auto rounded-lg border border-night/10 bg-deep/70 p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[85%] rounded-lg px-4 py-3 text-sm leading-6 ${
              msg.role === "user"
                ? "ml-auto bg-night text-deep"
                : msg.role === "system"
                  ? "mx-auto border border-night/10 bg-[oklch(0.99_0.004_92)] text-xs text-mist"
                  : "border border-gold/20 bg-gold/10 text-ink"
            }`}
          >
            <p>{msg.content}</p>
            {msg.role === "instance" && (
              <p className="mt-2 border-t border-current/10 pt-2 text-[11px] leading-4 opacity-70">
                {executionLabel(msg.execution)}
              </p>
            )}
          </div>
        ))}
        {messages.length === 0 && (
          <p className="text-center text-xs text-mist">
            选择下面的问题，或直接输入你想确认的内容。
          </p>
        )}
        {isChatResponding && (
          <div className="flex max-w-[85%] items-center gap-2 rounded-lg border border-gold/20 bg-gold/10 px-4 py-3 text-xs text-mist">
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            正在结合当前方案和语气档案生成回复...
          </div>
        )}
      </div>

      {/* Voice calibration */}
      <div className="rounded-lg border border-night/10 bg-[oklch(0.99_0.004_92)] p-3">
        <p className="mb-2 flex items-center gap-2 text-xs text-mist">
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          调整模拟回复的表达方式
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          {VOICE_OPTIONS.map(({ note, label }) => (
            <button
              type="button"
              key={note}
              disabled={isChatResponding}
              onClick={() => handleVoiceFeedback(note, label)}
              className={`rounded-lg border px-3 py-1 ${
                note === "像我"
                  ? "border-gold/30 bg-gold/10 text-gold"
                  : "border-night/10 text-mist hover:bg-deep hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            ref={voiceNoteRef}
            disabled={isChatResponding}
            maxLength={80}
            className="min-w-0 flex-1 rounded-lg border border-night/10 bg-deep/70 px-3 py-2 text-xs outline-none focus:border-blue"
            placeholder="补充要求，例如：少用长句，先给数字，再解释"
            onKeyDown={(event) => {
              if (event.key === "Enter") submitCustomVoiceNote();
            }}
          />
          <button
            type="button"
            disabled={isChatResponding}
            onClick={submitCustomVoiceNote}
            className="rounded-lg border border-night/15 px-3 py-2 text-xs text-ink disabled:opacity-40"
          >
            记录要求
          </button>
        </div>
      </div>

      {/* Quick questions */}
      <div className="flex flex-wrap gap-2 text-xs">
        {QUICK_QUESTIONS.map((q) => (
          <button
            type="button"
            key={q}
            disabled={isChatResponding}
            onClick={() => sendMessage(q)}
            className="rounded-lg border border-night/10 bg-deep/60 px-3 py-1 text-mist hover:border-blue/30 hover:bg-blue/10 hover:text-blue"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          disabled={isChatResponding}
          maxLength={600}
          className="min-w-0 flex-1 rounded-lg border border-night/10 bg-deep/70 px-4 py-2 text-sm outline-none focus:border-blue focus:bg-[oklch(0.995_0.003_92)]"
          placeholder="例如：这个方案最大的成本是什么？我应该先验证什么？"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
        />
        <button
          type="button"
          disabled={isChatResponding}
          title="发送"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-night text-deep shadow-quiet disabled:opacity-40"
          onClick={handleSend}
        >
          {isChatResponding ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="size-4" aria-hidden="true" />
          )}
          <span className="sr-only">发送</span>
        </button>
      </div>

      {/* Navigation */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-lg border border-night/15 px-5 py-2 text-sm text-ink hover:bg-deep"
          onClick={() => setStep("forks")}
        >
          选择其他方案
        </button>
        <button
          type="button"
          className="rounded-lg bg-night px-5 py-2 text-sm font-medium text-deep shadow-quiet"
          onClick={() => setStep("share")}
        >
          查看结果卡片
        </button>
      </div>
    </section>
  );
}
