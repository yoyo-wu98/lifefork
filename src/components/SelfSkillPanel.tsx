import { SelfSkill } from "@/lib/types";

export function SelfSkillPanel({ selfSkill, onNext }: { selfSkill: SelfSkill; onNext: () => void }) {
  return (
    <section className="space-y-5 rounded-3xl border border-white/15 bg-white/5 p-6">
      <h3 className="text-2xl">你的 Self Skill 已被唤醒。</h3>
      <p className="text-lg text-gold">主线人格：{selfSkill.identity.archetype}</p>
      <p className="text-mist">{selfSkill.identity.selfNarrative}</p>
      <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-gold/20 bg-gold/10 p-4">
          <p className="text-sm text-gold">语言指纹</p>
          <p className="mt-2 text-xl">{selfSkill.voice.toneName}</p>
          <p className="mt-2 text-xs text-mist">接近度：{selfSkill.voice.closenessScore}%</p>
          <div className="mt-3 h-2 rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-gold to-violet" style={{ width: `${selfSkill.voice.closenessScore}%` }} />
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-night/50 p-4 text-sm">
          <p className="text-blue">它正在学习你的说法方式</p>
          <p className="mt-2 text-mist">{selfSkill.voice.sentenceRhythm}</p>
          <p className="mt-1 text-mist">{selfSkill.voice.punctuationStyle}</p>
          <p className="mt-1 text-mist">表达动作：{selfSkill.voice.emotionalGesture}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {selfSkill.voice.signaturePhrases.map((phrase) => (
              <span key={phrase} className="rounded-full bg-white/10 px-3 py-1 text-xs text-gold">{phrase}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="mb-3 text-sm text-blue">不同人生阶段的说话风格</p>
        <div className="grid gap-3 md:grid-cols-2">
          {selfSkill.stageVoices.map((voice) => (
            <article key={voice.id} className="rounded-2xl border border-white/10 bg-deep/50 p-3 text-sm">
              <p className="text-gold">{voice.ageLabel} · {voice.toneName}</p>
              <p className="mt-2 text-xs leading-5 text-mist">{voice.description}</p>
              <p className="mt-2 text-xs text-blue">“{voice.sampleLine}”</p>
            </article>
          ))}
        </div>
      </div>
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
      {selfSkill.wechatAnalysis && (
        <div className="space-y-3 rounded-2xl border border-blue/20 bg-blue/10 p-4 text-sm">
          <p className="text-blue">微信聊天记录线索</p>
          <p className="leading-6 text-mist">{selfSkill.wechatAnalysis.summary}</p>
          <div className="flex flex-wrap gap-2">
            {selfSkill.wechatAnalysis.recurringTopics.map((topic) => (
              <span key={topic} className="rounded-full bg-white/10 px-3 py-1 text-xs text-blue">{topic}</span>
            ))}
            {selfSkill.wechatAnalysis.emotionalSignals.map((signal) => (
              <span key={signal} className="rounded-full bg-white/10 px-3 py-1 text-xs text-violet">{signal}</span>
            ))}
          </div>
          <p className="text-xs text-mist">原始聊天文本不进入 Self Skill，只保留本地分析摘要与脱敏短片段。</p>
        </div>
      )}
      <div className="space-y-2 rounded-2xl border border-white/10 p-4 text-sm">
        <p>证据来源</p>
        {selfSkill.evidence.slice(0, 4).map((item) => (
          <p key={item.id} className="text-mist">{item.quote}</p>
        ))}
      </div>
      <button onClick={onNext} className="rounded-full bg-gradient-to-r from-gold to-blue px-6 py-3">
        打开时间河流
      </button>
    </section>
  );
}
