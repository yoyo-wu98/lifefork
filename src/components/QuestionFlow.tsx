const prompts = [
  {
    key: "currentChoice",
    q: "你现在最纠结的一个选择是什么？",
    tags: ["要不要辞职", "要不要读博", "要不要换城市", "要不要结束一段关系", "要不要开始创业"],
  },
  {
    key: "recurringEmotion",
    q: "你最近反复出现的情绪是什么？",
    tags: ["焦虑", "疲惫", "兴奋", "空心", "不甘心", "孤独", "混乱"],
  },
  {
    key: "pastNode",
    q: "你人生中最想重新理解的一个节点是什么？",
    tags: ["毕业那年", "第一次失败", "一段关系结束", "一次离开", "一次没有说出口的选择"],
  },
  {
    key: "hiddenSelf",
    q: "你觉得自己最不像别人看到的哪一面？",
    tags: ["我其实很敏感", "我其实很想赢", "我其实很害怕普通", "我其实不想总是懂事", "我其实一直想逃"],
  },
  {
    key: "futureSentence",
    q: "如果十年后的你回头看今天，你最希望 TA 说什么？",
    tags: ["你没有浪费人生", "你终于开始了", "你可以慢一点", "不要背叛自己", "先试试看"],
  },
] as const;

type Answers = Record<(typeof prompts)[number]["key"], string>;

export function QuestionFlow({ answers, setAnswer, onNext }: { answers: Answers; setAnswer: (k: keyof Answers, v: string) => void; onNext: () => void }) {
  const progress = Math.min(100, Math.round((Object.values(answers).filter(Boolean).length / prompts.length) * 100));
  const done = Object.values(answers).every(Boolean);
  return (
    <section className="space-y-6">
      <p className="text-sm text-blue">正在构建你的 Self Skill：{progress}%</p>
      {prompts.map((item) => (
        <div key={item.key} className="rounded-3xl border border-white/15 bg-white/5 p-5">
          <p className="mb-3">{item.q}</p>
          <textarea
            className="min-h-20 w-full rounded-2xl border border-white/15 bg-deep/60 p-3"
            value={answers[item.key]}
            onChange={(e) => setAnswer(item.key, e.target.value)}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setAnswer(item.key, answers[item.key] ? `${answers[item.key]} ${tag}` : tag)}
                className="rounded-full border border-white/15 px-3 py-1 text-xs text-mist hover:border-blue"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button disabled={!done} onClick={onNext} className="rounded-full bg-gradient-to-r from-gold to-blue px-6 py-3 disabled:opacity-40">
        继续，给我一段更像你的文字
      </button>
    </section>
  );
}
