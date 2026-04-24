import { ChatMessage, ForkPath, SelfSkill } from "@/lib/types";
import { generateInstanceReply } from "@/lib/dialogueEngine";
import { containsCrisisSignal, safetyMessage } from "@/lib/safety";

export function InstanceChat({
  selfSkill,
  selectedFork,
  messages,
  setMessages,
  onNext,
}: {
  selfSkill: SelfSkill;
  selectedFork: ForkPath;
  messages: ChatMessage[];
  setMessages: (msg: ChatMessage[]) => void;
  onNext: () => void;
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

  return (
    <section className="space-y-4 rounded-3xl border border-white/15 bg-white/5 p-6">
      <h3 className="text-2xl">你正在和「{selectedFork.futureSelfName}」对话</h3>
      <p className="text-sm text-mist">这不是预言，而是一种基于你当前材料生成的可能性模拟。</p>
      <div className="space-y-3 rounded-2xl border border-white/10 bg-deep/60 p-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${msg.role === "user" ? "ml-auto bg-blue/25" : "bg-gold/15"}`}>
            {msg.content}
          </div>
        ))}
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
      <button className="rounded-full border border-white/30 px-5 py-2" onClick={onNext}>
        生成我的分享卡片
      </button>
    </section>
  );
}
