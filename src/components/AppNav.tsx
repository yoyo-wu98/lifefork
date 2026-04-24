import { AppStep } from "@/lib/types";

interface AppNavProps {
  step: AppStep;
  hasSelfSkill: boolean;
  hasSelectedFork: boolean;
  onHome: () => void;
  onSelfSkill: () => void;
  onTimeline: () => void;
  onForks: () => void;
  onChat: () => void;
  onShare: () => void;
  onReset: () => void;
}

const stepLabels: Record<AppStep, string> = {
  landing: "入口",
  "select-version": "选择版本",
  questions: "五问访谈",
  "wechat-import": "微信导入",
  "extra-text": "补充材料",
  generating: "生成中",
  "self-skill": "Self Skill",
  timeline: "时间线",
  forks: "岔路树",
  chat: "未来对话",
  share: "分享卡片",
};

export function AppNav({ step, hasSelfSkill, hasSelectedFork, onHome, onSelfSkill, onTimeline, onForks, onChat, onShare, onReset }: AppNavProps) {
  return (
    <nav className="sticky top-4 z-20 rounded-3xl border border-white/15 bg-night/75 p-3 shadow-glow backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button className="rounded-full border border-white/20 px-4 py-2 text-sm text-ink hover:border-blue hover:text-blue" onClick={onHome}>
          回到主页
        </button>
        <div className="flex flex-wrap items-center gap-2 text-xs text-mist">
          <span className="rounded-full bg-white/10 px-3 py-2">当前位置：{stepLabels[step]}</span>
          {hasSelfSkill && (
            <>
              <button className="rounded-full border border-white/15 px-3 py-2 hover:border-gold hover:text-gold" onClick={onSelfSkill}>
                自我画像
              </button>
              <button className="rounded-full border border-white/15 px-3 py-2 hover:border-blue hover:text-blue" onClick={onTimeline}>
                时间线
              </button>
              <button className="rounded-full border border-gold/40 px-3 py-2 text-gold hover:bg-gold/10" onClick={onForks}>
                岔路树
              </button>
            </>
          )}
          {hasSelectedFork && (
            <>
              <button className="rounded-full border border-white/15 px-3 py-2 hover:border-violet hover:text-violet" onClick={onChat}>
                当前对话
              </button>
              <button className="rounded-full border border-white/15 px-3 py-2 hover:border-blue hover:text-blue" onClick={onShare}>
                分享卡片
              </button>
            </>
          )}
          <button className="rounded-full border border-red-300/30 px-3 py-2 text-red-100/80 hover:border-red-300 hover:text-red-100" onClick={onReset}>
            清空重来
          </button>
        </div>
      </div>
    </nav>
  );
}
