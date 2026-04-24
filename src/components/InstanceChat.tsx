import { ChatMessage, ForkPath, SelfSkill } from "@/lib/types";
import { generateInstanceReply } from "@/lib/dialogueEngine";
import { containsCrisisSignal, safetyMessage } from "@/lib/safety";

export function InstanceChat({
  selfSkill,
  selectedFork,
  messages,
  setMessages,
  onVoiceFeedback,
  onNext,
  onBackToForks,
}: {
  selfSkill: SelfSkill;
  selectedFork: ForkPath;
  messages: ChatMessage[];
  setMessages: (msg: ChatMessage[]) => void;
  onVoiceFeedback: (note: string) => void;
  onNext: () => void;
  onBackToForks: () => void;
}) {
  const send = (content: string) => {
    if (!content.trim()) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content, createdAt: new Date().toISOString() };
    const reply: ChatMessage = {
      id: crypto.randomUUID(),
      role: "instance",
      content: containsCrisisSignal(content) ? safetyMessage : generateInstanceReply(content, selfSkill, selectedFork),
      createdAt: new Date().toISOString(),
    };
    setMessages([...messages, userMsg, reply]);
  };

  const tuneVoice = (note: string, label: string) => {
    onVoiceFeedback(note);
    const systemMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "system",
      content: `语气校准已记录：${label}。下一次回复会更靠近这个方向。`,
      createdAt: new Date().toISOString(),
    };
    setMessages([...messages, systemMsg]);
  };

  return (
    <section className="space-y-4 rounded-3xl border border-white/15 bg-white/5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl">你正在和「{selectedFork.futureSelfName}」对话</h3>
          <p className="mt-1 text-sm text-mist">这是一种基于当前材料生成的可能性模拟，请把它当作镜子和草稿。</p>
          <p className="mt-2 text-xs text-blue">
            当前语气：{selfSkill.voice.toneName} · 接近度 {selfSkill.voice.closenessScore}%
          </p>
        </div>
        <button className="rounded-full border border-gold/40 px-4 py-2 text-sm text-gold hover:bg-gold/10" onClick={onBackToForks}>
          回到岔路树
        </button>
      </div>
      <div className="space-y-3 rounded-2xl border border-white/10 bg-deep/60 p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
              msg.role === "user" ? "ml-auto bg-blue/25" : msg.role === "system" ? "mx-auto bg-white/10 text-xs text-mist" : "bg-gold/15"
            }`}
          >
            {msg.content}
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-white/10 bg-night/50 p-3">
        <p className="mb-2 text-xs text-mist">校准这个未来自我的语气</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <button onClick={() => tuneVoice("像我", "这句像我")} className="rounded-full border border-gold/40 px-3 py-1 text-gold">
            这句像我
          </button>
          <button onClick={() => tuneVoice("少一点AI味", "少一点 AI 味")} className="rounded-full border border-white/20 px-3 py-1">
            少一点 AI 味
          </button>
          <button onClick={() => tuneVoice("更口语", "更口语")} className="rounded-full border border-white/20 px-3 py-1">
            更口语
          </button>
          <button onClick={() => tuneVoice("更克制", "更克制")} className="rounded-full border border-white/20 px-3 py-1">
            更克制
          </button>
          <button onClick={() => tuneVoice("更锋利", "更锋利")} className="rounded-full border border-white/20 px-3 py-1">
            更锋利
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        {["你后悔吗？", "你失去了什么？", "你会提醒现在的我什么？", "这条路最难的地方是什么？", "我应该从哪一步开始？"].map((q) => (
          <button key={q} onClick={() => send(q)} className="rounded-full border border-white/20 px-3 py-1">
            {q}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input id="chat-input" className="flex-1 rounded-full border border-white/20 bg-deep/80 px-4 py-2" placeholder="问问这个版本的自己：你后悔吗？你失去了什么？你会提醒现在的我什么？" />
        <button
          className="rounded-full bg-gradient-to-r from-gold to-violet px-4"
          onClick={() => {
            const input = document.getElementById("chat-input") as HTMLInputElement | null;
            if (!input) return;
            send(input.value);
            input.value = "";
          }}
        >
          发送
        </button>
      </div>
      <div className="flex flex-wrap gap-3">
        <button className="rounded-full border border-white/30 px-5 py-2" onClick={onBackToForks}>
          换一条分支
        </button>
        <button className="rounded-full bg-gradient-to-r from-blue to-violet px-5 py-2" onClick={onNext}>
          生成我的分享卡片
        </button>
      </div>
    </section>
  );
}
