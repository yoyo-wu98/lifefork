import { SelfSkill } from "@/lib/types";

export function SelfSkillPanel({ selfSkill, onNext }: { selfSkill: SelfSkill; onNext: () => void }) {
  return (
    <section className="space-y-5 rounded-3xl border border-white/15 bg-white/5 p-6">
      <h3 className="text-2xl">你的 Self Skill 已被唤醒。</h3>
      <p className="text-lg text-gold">主线人格：{selfSkill.identity.archetype}</p>
      <p className="text-mist">{selfSkill.identity.selfNarrative}</p>
      <div>
        <p className="mb-2">核心价值</p>
        <div className="flex flex-wrap gap-2">{selfSkill.semantic.values.map((v) => <span key={v} className="rounded-full bg-blue/20 px-3 py-1 text-sm">{v}</span>)}</div>
      </div>
      <div>
        <p className="mb-2">核心恐惧</p>
        <div className="flex flex-wrap gap-2">{selfSkill.semantic.fears.map((v) => <span key={v} className="rounded-full bg-violet/20 px-3 py-1 text-sm">{v}</span>)}</div>
      </div>
      <ul className="space-y-2 text-sm text-mist">
        {selfSkill.semantic.recurringPatterns.map((pattern) => (
          <li key={pattern}>• {pattern}</li>
        ))}
      </ul>
      <div className="space-y-2 rounded-2xl border border-white/10 p-4 text-sm">
        <p>证据来源</p>
        {selfSkill.evidence.slice(0, 3).map((item) => (
          <p key={item.id} className="text-mist">{item.quote}</p>
        ))}
      </div>
      <button onClick={onNext} className="rounded-full bg-gradient-to-r from-gold to-blue px-6 py-3">
        打开时间河流
      </button>
    </section>
  );
}
