"use client";

import { useRef } from "react";
import { useLifeforkStore } from "@/lib/stores/lifeforkStore";

const QUICK_QUESTIONS = [
  "你后悔吗？",
  "你失去了什么？",
  "你会提醒现在的我什么？",
  "这条路最难的地方是什么？",
  "我应该从哪一步开始？",
] as const;

const VOICE_OPTIONS = [
  { note: "像我", label: "这句像我" },
  { note: "少一点AI味", label: "少一点 AI 味" },
  { note: "更口语", label: "更口语" },
  { note: "更克制", label: "更克制" },
  { note: "更锋利", label: "更锋利" },
] as const;

/**
 * Instance Chat — talk to a future/past/forked self.
 * Supports quick questions, free-text input, voice calibration,
 * and LLM-powered dialogue via /api/chat.
 */
export function InstanceChat() {
  const selfSkill = useLifeforkStore((s) => s.selfSkill);
  const selectedFork = useLifeforkStore((s) => s.selectedFork);
  const messages = useLifeforkStore((s) => s.messages);
  const sendMessage = useLifeforkStore((s) => s.sendMessage);
  const tuneVoice = useLifeforkStore((s) => s.tuneVoice);
  const setStep = useLifeforkStore((s) => s.setStep);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!selfSkill || !selectedFork) return null;

  const handleSend = () => {
    const input = inputRef.current;
    if (!input) return;
    sendMessage(input.value);
    input.value = "";
  };

  const handleVoiceFeedback = (note: string, label: string) => {
    tuneVoice(note);
    const storeSet = useLifeforkStore.setState;
    const systemMsg = {
      id: crypto.randomUUID(),
      role: "system" as const,
      content: `语气校准已记录：${label}。下一次回复会更靠近这个方向。`,
      createdAt: new Date().toISOString(),
    };
    storeSet({ messages: [...messages, systemMsg] });
  };

  return (
    <section className="space-y-4 rounded-3xl border border-white/15 bg-white/5 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl">
            你正在和「{selectedFork.futureSelfName}」对话
          </h3>
          <p className="mt-1 text-sm text-mist">
            这是一种基于当前材料生成的可能性模拟，请把它当作镜子和草稿。
          </p>
          <p className="mt-2 text-xs text-blue">
            当前语气：{selfSkill.voice.toneName} · 接近度{" "}
            {selfSkill.voice.closenessScore}%
          </p>
        </div>
        <button
          className="rounded-full border border-gold/40 px-4 py-2 text-sm text-gold hover:bg-gold/10"
          onClick={() => setStep("forks")}
        >
          回到人生地图
        </button>
      </div>

      {/* Messages */}
      <div className="max-h-[50vh] space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-deep/60 p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
              msg.role === "user"
                ? "ml-auto bg-blue/25"
                : msg.role === "system"
                  ? "mx-auto bg-white/10 text-xs text-mist"
                  : "bg-gold/15"
            }`}
          >
            {msg.content}
          </div>
        ))}
        {messages.length === 0 && (
          <p className="text-center text-xs text-mist">
            开始和这个版本的自己对话吧。
          </p>
        )}
      </div>

      {/* Voice calibration */}
      <div className="rounded-2xl border border-white/10 bg-night/50 p-3">
        <p className="mb-2 text-xs text-mist">校准这个未来自我的语气</p>
        <div className="flex flex-wrap gap-2 text-xs">
          {VOICE_OPTIONS.map(({ note, label }) => (
            <button
              key={note}
              onClick={() => handleVoiceFeedback(note, label)}
              className={`rounded-full border px-3 py-1 ${
                note === "像我"
                  ? "border-gold/40 text-gold"
                  : "border-white/20"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick questions */}
      <div className="flex flex-wrap gap-2 text-xs">
        {QUICK_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => sendMessage(q)}
            className="rounded-full border border-white/20 px-3 py-1"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          className="flex-1 rounded-full border border-white/20 bg-deep/80 px-4 py-2"
          placeholder="问问这个版本的自己：你后悔吗？你失去了什么？你会提醒现在的我什么？"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
        />
        <button
          className="rounded-full bg-gradient-to-r from-gold to-violet px-4"
          onClick={handleSend}
        >
          发送
        </button>
      </div>

      {/* Navigation */}
      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-full border border-white/30 px-5 py-2"
          onClick={() => setStep("forks")}
        >
          换一个时间点
        </button>
        <button
          className="rounded-full bg-gradient-to-r from-blue to-violet px-5 py-2"
          onClick={() => setStep("share")}
        >
          生成我的分享卡片
        </button>
      </div>
    </section>
  );
}
