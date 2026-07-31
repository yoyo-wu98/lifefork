"use client";

import { useState } from "react";
import { AI_TOKEN_BUDGETS } from "@/lib/ai/tokenBudget";
import { useLifeforkStore } from "@/lib/stores/lifeforkStore";

const prompts = [
  {
    key: "currentChoice" as const,
    short: "当前问题",
    q: "你现在最纠结的一个选择是什么？",
    help: "写清楚你正在比较的选项。可以补充截止时间和最担心的结果。",
    tags: ["要不要辞职", "要不要读博", "要不要换城市", "要不要结束一段关系", "要不要开始创业"],
  },
  {
    key: "recurringEmotion" as const,
    short: "反复情绪",
    q: "你最近反复出现的情绪是什么？",
    help: "写下情绪，也可以补充它通常在什么时刻出现。",
    tags: ["焦虑", "疲惫", "兴奋", "缺乏动力", "不甘心", "孤独", "混乱"],
  },
  {
    key: "pastNode" as const,
    short: "重要经历",
    q: "哪段经历最影响你现在的选择？",
    help: "写下发生了什么，以及这段经历对你现在的判断有什么影响。",
    tags: ["毕业那年", "第一次失败", "一段关系结束", "一次离开", "一次没有执行的选择"],
  },
  {
    key: "hiddenSelf" as const,
    short: "隐藏特征",
    q: "别人通常看不到你的哪一面？",
    help: "例如竞争心、敏感、疲惫、想改变，或者你很少公开表达的目标。",
    tags: ["我其实很敏感", "我其实很想赢", "我其实害怕长期没有变化", "我其实不想总是承担责任", "我其实一直想离开当前环境"],
  },
  {
    key: "futureSentence" as const,
    short: "期望结果",
    q: "十年后，你希望这个选择带来什么具体结果？",
    help: "尽量写成可以判断是否实现的结果。",
    tags: ["做过认真尝试", "工作更有自主权", "关系更稳定", "经济更安全", "没有长期拖延"],
  },
] as const;

export function QuestionFlow() {
  const answers = useLifeforkStore((state) => state.answers);
  const setAnswer = useLifeforkStore((state) => state.setAnswer);
  const setStep = useLifeforkStore((state) => state.setStep);
  const editorConfig = useLifeforkStore((state) => state.editorConfig);
  const runtimeConfig = useLifeforkStore((state) => state.runtimeConfig);
  const [activeIndex, setActiveIndex] = useState(() => {
    const index = prompts.findIndex((prompt) => !answers[prompt.key].trim());
    return index >= 0 ? index : prompts.length - 1;
  });
  const activePrompt = prompts[activeIndex];
  const currentAnswer = answers[activePrompt.key];
  const currentLimit = AI_TOKEN_BUDGETS.selfSkill.maxInputChars[activePrompt.key];
  const answeredCount = prompts.filter((prompt) => answers[prompt.key].trim()).length;
  const complete = answeredCount === prompts.length;
  const progress = Math.round((answeredCount / prompts.length) * 100);

  const appendTag = (tag: string) => {
    const current = answers[activePrompt.key].trim();
    if (current.includes(tag)) return;
    setAnswer(
      activePrompt.key,
      (current ? `${current}，${tag}` : tag).slice(0, currentLimit),
    );
  };

  const continueFlow = () => {
    if (!currentAnswer.trim()) return;
    if (activeIndex < prompts.length - 1) {
      setActiveIndex((index) => index + 1);
      return;
    }
    if (!complete) {
      const missing = prompts.findIndex((prompt) => !answers[prompt.key].trim());
      setActiveIndex(Math.max(0, missing));
      return;
    }
    setStep(
      editorConfig.features.wechatImport && runtimeConfig.features.wechatImport
        ? "wechat-import"
        : "extra-text",
    );
  };

  return (
    <section className="grid gap-6 py-4 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="min-w-0">
        <div className="sticky top-28">
          <p className="text-sm font-medium text-blue">个人分析问卷</p>
          <h1 className="mt-2 text-2xl font-semibold text-ink">回答 5 个问题</h1>
          <p className="mt-3 text-sm leading-6 text-mist">
            系统会根据回答生成个人分析、时间线和备选方案。
          </p>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-night/10">
            <div
              className="h-full rounded-full bg-blue transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-mist">已记录 {answeredCount} / {prompts.length}</p>

          <nav className="mt-5 flex gap-2 overflow-x-auto pb-2 lg:grid lg:overflow-visible" aria-label="五问进度">
            {prompts.map((prompt, index) => {
              const answered = Boolean(answers[prompt.key].trim());
              const active = index === activeIndex;
              return (
                <button
                  key={prompt.key}
                  type="button"
                  className={`flex shrink-0 items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm lg:w-full ${
                    active
                      ? "border-blue/35 bg-blue/10 text-ink"
                      : "border-transparent text-mist hover:border-night/10 hover:bg-[var(--lf-paper-raised)]"
                  }`}
                  onClick={() => setActiveIndex(index)}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                      answered ? "bg-night text-deep" : "border border-night/15"
                    }`}
                  >
                    {answered ? "✓" : index + 1}
                  </span>
                  <span>{prompt.short}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="min-w-0 border-t border-night/10 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between gap-4 text-xs text-mist">
            <span>问题 {activeIndex + 1} / {prompts.length}</span>
            <span>{currentAnswer.length} / {currentLimit} 字</span>
          </div>
          <h2 className="mt-4 text-3xl font-semibold leading-tight text-ink">
            {activePrompt.q}
          </h2>
          <p className="mt-3 max-w-[62ch] text-sm leading-7 text-mist">
            {activePrompt.help}
          </p>

          <textarea
            autoFocus
            data-testid={`question-${activePrompt.key}`}
            className="mt-6 min-h-52 w-full resize-y rounded-lg border border-night/15 bg-[var(--lf-paper-raised)] p-5 text-base leading-8 text-ink outline-none focus:border-blue"
            value={currentAnswer}
            maxLength={currentLimit}
            placeholder="直接写答案，越具体越好……"
            onChange={(event) => setAnswer(activePrompt.key, event.target.value)}
          />
          <p className="mt-2 text-xs text-mist">回答会自动保存在当前浏览器。</p>

          <div className="mt-4">
            <p className="text-xs text-mist">可以直接选择一个示例，再继续补充</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {activePrompt.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="rounded-lg border border-night/10 bg-[var(--lf-paper-raised)] px-3 py-2 text-xs text-mist hover:border-blue/35 hover:bg-blue/10 hover:text-blue"
                  onClick={() => appendTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-night/10 pt-5">
            <button
              type="button"
              className="rounded-lg border border-night/10 px-4 py-2 text-sm text-mist hover:bg-[var(--lf-paper-raised)] hover:text-ink disabled:cursor-not-allowed disabled:opacity-35"
              disabled={activeIndex === 0}
              onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}
            >
              上一个问题
            </button>
            <div className="text-right">
              {!currentAnswer.trim() && (
                <p className="mb-2 text-xs text-mist">填写当前问题后可以继续</p>
              )}
              <button
                type="button"
                disabled={!currentAnswer.trim()}
                className="rounded-lg bg-night px-5 py-3 text-sm font-medium text-deep disabled:cursor-not-allowed disabled:opacity-35"
                onClick={continueFlow}
              >
                {activeIndex === prompts.length - 1
                  ? complete
                    ? "下一步：补充分析材料"
                    : "检查未回答的问题"
                  : "保存并继续"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
