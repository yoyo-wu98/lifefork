import { useMemo, useState } from "react";
import { disclaimer } from "@/lib/copy";
import { containsCrisisSignal, safetyMessage } from "@/lib/safety";
import { analyzeWeChatExport } from "@/lib/wechatEngine";
import { WeChatAnalysis } from "@/lib/types";

interface WeChatImportStepProps {
  rawValue: string;
  analysis: WeChatAnalysis | null;
  onRawChange: (value: string) => void;
  onAnalysisChange: (analysis: WeChatAnalysis | null) => void;
  onSkip: () => void;
  onNext: () => void;
}

export function WeChatImportStep({ rawValue, analysis, onRawChange, onAnalysisChange, onSkip, onNext }: WeChatImportStepProps) {
  const [fileName, setFileName] = useState("");
  const hasLargeInput = rawValue.length > 120_000;
  const characterLabel = useMemo(() => rawValue.length.toLocaleString("zh-CN"), [rawValue.length]);

  const analyze = (sourceName = fileName || "粘贴的微信记录") => {
    if (!rawValue.trim()) return;
    onAnalysisChange(analyzeWeChatExport(rawValue, sourceName));
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    onRawChange(text);
    onAnalysisChange(analyzeWeChatExport(text, file.name));
  };

  return (
    <section className="space-y-5 rounded-3xl border border-white/15 bg-white/5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm tracking-[0.2em] text-blue">Local WeChat Lens</p>
          <h3 className="mt-2 text-2xl">导入微信聊天记录</h3>
          <p className="mt-2 max-w-2xl text-sm text-mist">
            粘贴或上传你已经导出的聊天文本。V0 只在浏览器本地做规则分析：提取主题、情绪线索、关键节点和短证据片段，不上传服务器，也不把完整原文写入 Self Skill。
          </p>
        </div>
        <button onClick={onSkip} className="rounded-full border border-white/20 px-5 py-2 text-sm">
          跳过微信导入
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          <label className="block rounded-2xl border border-white/15 bg-deep/60 p-4">
            <span className="mb-3 block text-sm text-mist">上传 .txt / .csv / .json / .html 文本文件</span>
            <input
              type="file"
              accept=".txt,.csv,.json,.html,.htm,.md"
              className="block w-full text-sm text-mist file:mr-4 file:rounded-full file:border-0 file:bg-blue/20 file:px-4 file:py-2 file:text-blue"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
          </label>
          <textarea
            className="min-h-56 w-full rounded-2xl border border-white/15 bg-deep/60 p-4 text-sm"
            placeholder="也可以直接粘贴聊天记录。例如：
[2026-04-24 21:10:03] 我：我最近总觉得被困住了
[2026-04-24 21:11:20] 朋友：你也许没有讨厌工作，只是太想做自己的东西了？"
            value={rawValue}
            onChange={(event) => {
              onRawChange(event.target.value);
              onAnalysisChange(null);
            }}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button disabled={!rawValue.trim()} onClick={() => analyze()} className="rounded-full bg-gradient-to-r from-gold to-violet px-5 py-2 text-night disabled:opacity-40">
              本地分析这段聊天
            </button>
            <span className="text-xs text-mist">已读取 {characterLabel} 个字符</span>
          </div>
          {hasLargeInput && <p className="rounded-2xl border border-gold/30 bg-gold/10 p-3 text-xs text-gold">文本很大。V0 会优先抽取前 8000 行做本地预分析；未来接入真实 AI 时应使用分块、摘要树和证据索引，避免一次性消耗大量 token。</p>}
          {containsCrisisSignal(rawValue) && <p className="rounded-2xl border border-red-300/30 bg-red-500/10 p-3 text-xs text-red-100">{safetyMessage}</p>}
        </div>

        <aside className="space-y-3 rounded-2xl border border-white/10 bg-night/60 p-4">
          <p className="text-sm text-gold">分析预览</p>
          {analysis ? (
            <>
              <p className="text-sm leading-6 text-mist">{analysis.summary}</p>
              <div>
                <p className="mb-2 text-xs text-blue">高频主题</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.recurringTopics.map((topic) => (
                    <span key={topic} className="rounded-full bg-blue/15 px-3 py-1 text-xs text-blue">{topic}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs text-violet">情绪线索</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.emotionalSignals.map((signal) => (
                    <span key={signal} className="rounded-full bg-violet/15 px-3 py-1 text-xs text-violet">{signal}</span>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-mist">关键片段</p>
                {analysis.keyMoments.slice(0, 3).map((moment) => (
                  <p key={moment.id} className="rounded-xl bg-white/5 p-3 text-xs text-mist">
                    {moment.timeLabel ? `${moment.timeLabel} · ` : ""}
                    {moment.speaker}：{moment.content}
                  </p>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm leading-6 text-mist">还没有分析结果。导入聊天后，我会先生成一个隐私友好的摘要，再把它作为 Self Skill 的辅助证据。</p>
          )}
        </aside>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={onSkip} className="rounded-full border border-white/20 px-5 py-2">
          不使用聊天记录
        </button>
        <button disabled={!analysis} onClick={onNext} className="rounded-full bg-gradient-to-r from-blue to-violet px-5 py-2 disabled:opacity-40">
          把这些线索加入 Self Skill
        </button>
      </div>
      <p className="text-xs text-mist">{disclaimer}</p>
    </section>
  );
}
