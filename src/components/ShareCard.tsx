import { disclaimer, proverbs } from "@/lib/copy";
import { clearAll } from "@/lib/storage";
import { ForkPath, SelfSkill } from "@/lib/types";

export function ShareCard({
  selfSkill,
  selectedFork,
  proverb,
  setProverb,
  onBackToForks,
  onRestart,
}: {
  selfSkill: SelfSkill;
  selectedFork: ForkPath;
  proverb: string;
  setProverb: (x: string) => void;
  onBackToForks: () => void;
  onRestart: () => void;
}) {
  const pathLabel = "当前人生节点";

  const copyResult = async () => {
    const content = `我的 LifeFork 结果：\n主线人格：${selfSkill.identity.archetype}\n核心冲突：${selfSkill.semantic.innerConflict}\n当前岔路：${selfSkill.questions.currentChoice}\n${pathLabel}：${selectedFork.title}\n未来自我箴言：${proverb}`;
    await navigator.clipboard.writeText(content);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(selfSkill, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lifefork-self-skill.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-4">
      <div className="mx-auto max-w-xl rounded-3xl border border-white/20 bg-gradient-to-br from-deep to-night p-8 text-center shadow-glow">
        <p className="text-blue">LifeFork / 人生岔路</p>
        <p className="mt-3">主线人格：{selfSkill.identity.archetype}</p>
        <p className="mt-2 text-mist">核心冲突：{selfSkill.semantic.innerConflict}</p>
        <p className="mt-2 text-mist">当前岔路：{selfSkill.questions.currentChoice}</p>
        <p className="mt-2 text-mist">{pathLabel}：{selectedFork.title}</p>
        <p className="mt-3 text-gold">未来自我箴言：{proverb}</p>
        <p className="mt-4 text-xs text-mist">预测交给命运，LifeFork 负责召唤可能性。</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <button onClick={copyResult} className="rounded-full border border-white/20 px-4 py-2">复制结果</button>
        <button onClick={exportJson} className="rounded-full border border-white/20 px-4 py-2">导出 Self Skill JSON</button>
        <button onClick={() => setProverb(proverbs[Math.floor(Math.random() * proverbs.length)])} className="rounded-full border border-gold/40 px-4 py-2">再给我一句未来自我的话</button>
        <button onClick={onBackToForks} className="rounded-full border border-blue/40 px-4 py-2 text-blue">回到岔路树</button>
        <button
          onClick={() => {
            clearAll();
            onRestart();
          }}
          className="rounded-full bg-gradient-to-r from-blue to-violet px-4 py-2"
        >
          重新开始
        </button>
      </div>
      <p className="text-center text-xs text-mist">{disclaimer}</p>
    </section>
  );
}
