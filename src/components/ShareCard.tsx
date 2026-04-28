"use client";

import { useLifeforkStore } from "@/lib/stores/lifeforkStore";
import { disclaimer, proverbs } from "@/lib/copy";

/**
 * Share card — the final step.
 * Shows a summarized result card with copy/export/restart actions.
 */
export function ShareCard() {
  const selfSkill = useLifeforkStore((s) => s.selfSkill);
  const selectedFork = useLifeforkStore((s) => s.selectedFork);
  const proverb = useLifeforkStore((s) => s.proverb);
  const setProverb = useLifeforkStore((s) => s.setProverb);
  const setStep = useLifeforkStore((s) => s.setStep);
  const resetExperience = useLifeforkStore((s) => s.resetExperience);

  if (!selfSkill || !selectedFork) return null;

  const copyResult = async () => {
    const content = [
      `我的 LifeFork 结果：`,
      `主线人格：${selfSkill.identity.archetype}`,
      `核心冲突：${selfSkill.semantic.innerConflict}`,
      `当前选择：${selfSkill.questions.currentChoice}`,
      `当前时间点：${selectedFork.title}`,
      `未来自我箴言：${proverb}`,
    ].join("\n");
    await navigator.clipboard.writeText(content);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(selfSkill, null, 2)], {
      type: "application/json",
    });
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
        <p className="mt-2 text-mist">
          当前选择：{selfSkill.questions.currentChoice}
        </p>
        <p className="mt-2 text-mist">当前时间点：{selectedFork.title}</p>
        <p className="mt-3 text-gold">未来自我箴言：{proverb}</p>
        <p className="mt-4 text-xs text-mist">
          命运不需要被预测，LifeFork 只负责召唤可能性。
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <button onClick={copyResult} className="rounded-full border border-white/20 px-4 py-2">
          复制结果
        </button>
        <button onClick={exportJson} className="rounded-full border border-white/20 px-4 py-2">
          导出 Self Skill JSON
        </button>
        <button
          onClick={() => setProverb(proverbs[Math.floor(Math.random() * proverbs.length)])}
          className="rounded-full border border-gold/40 px-4 py-2"
        >
          再给我一句未来自我的话
        </button>
        <button
          onClick={() => setStep("forks")}
          className="rounded-full border border-blue/40 px-4 py-2 text-blue"
        >
          回到人生地图
        </button>
        <button
          onClick={resetExperience}
          className="rounded-full bg-gradient-to-r from-blue to-violet px-4 py-2"
        >
          重新开始
        </button>
      </div>
      <p className="text-center text-xs text-mist">{disclaimer}</p>
    </section>
  );
}
