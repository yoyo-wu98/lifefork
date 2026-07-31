"use client";

import { useMemo, useState } from "react";
import { useLifeforkStore } from "@/lib/stores/lifeforkStore";
import { disclaimer } from "@/lib/copy";
import { containsCrisisSignal, safetyMessage } from "@/lib/safety";
import {
  analyzeWeChatExport,
  WECHAT_MAX_LINES,
  WECHAT_MAX_SOURCE_CHARS,
} from "@/lib/wechatEngine";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

/**
 * WeChat chat log import step.
 * Supports file upload (.txt/.csv/.json/.html/.md) and paste.
 * Analysis runs locally — no chat data leaves the browser.
 */
export function WeChatImportStep() {
  const wechatRaw = useLifeforkStore((s) => s.wechatRaw);
  const setWechatRaw = useLifeforkStore((s) => s.setWechatRaw);
  const wechatAnalysis = useLifeforkStore((s) => s.wechatAnalysis);
  const setWechatAnalysis = useLifeforkStore((s) => s.setWechatAnalysis);
  const setStep = useLifeforkStore((s) => s.setStep);

  const [fileName, setFileName] = useState("");
  const hasLargeInput = wechatRaw.length >= WECHAT_MAX_SOURCE_CHARS;
  const characterLabel = useMemo(() => wechatRaw.length.toLocaleString("zh-CN"), [wechatRaw.length]);

  const analyze = (sourceName = fileName || "粘贴的微信记录") => {
    if (!wechatRaw.trim()) return;
    setWechatAnalysis(analyzeWeChatExport(wechatRaw, sourceName));
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      alert("文件超过 5 MB。请先导出较小的时间范围，或分批分析。");
      return;
    }
    setFileName(file.name);
    const text = await file.text();
    const boundedText = text.slice(0, WECHAT_MAX_SOURCE_CHARS);
    setWechatRaw(boundedText);
    setWechatAnalysis(analyzeWeChatExport(boundedText, file.name));
  };

  const skip = () => setStep("extra-text");
  const next = () => setStep("extra-text");

  return (
    <section className="space-y-5 rounded-lg border border-night/10 bg-[oklch(0.99_0.004_92)] p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue">微信记录本地分析</p>
          <h3 className="mt-1 text-2xl font-semibold text-ink">导入微信聊天记录</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-mist">
            粘贴或上传已经导出的聊天文本。系统会在当前浏览器中提取高频主题、情绪线索和关键片段。完整原文不会写入个人分析。
          </p>
        </div>
        <button type="button" onClick={skip} className="rounded-lg border border-night/15 px-5 py-2 text-sm text-ink hover:bg-deep">
          跳过微信导入
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          <label className="block rounded-lg border border-night/10 bg-deep/70 p-4">
            <span className="mb-3 block text-sm text-mist">上传 .txt / .csv / .json / .html 文本文件</span>
            <input
              type="file"
              accept=".txt,.csv,.json,.html,.htm,.md"
              className="block w-full text-sm text-mist file:mr-4 file:rounded-lg file:border-0 file:bg-blue/10 file:px-4 file:py-2 file:text-blue"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
          </label>
          <textarea
            className="min-h-56 w-full resize-y rounded-lg border border-night/10 bg-deep/70 p-4 text-sm leading-6 outline-none focus:border-blue focus:bg-[oklch(0.995_0.003_92)]"
            placeholder={`也可以直接粘贴聊天记录。例如：
[2026-04-24 21:10:03] 我：我最近总觉得被困住了
[2026-04-24 21:11:20] 朋友：你也许没有讨厌工作，只是太想做自己的东西了？`}
            value={wechatRaw}
            onChange={(event) => {
              setWechatRaw(event.target.value.slice(0, WECHAT_MAX_SOURCE_CHARS));
              setWechatAnalysis(null);
            }}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              disabled={!wechatRaw.trim()}
              onClick={() => analyze()}
              className="rounded-lg bg-night px-5 py-2 text-sm font-medium text-deep shadow-quiet disabled:cursor-not-allowed disabled:opacity-40"
            >
              本地分析这段聊天
            </button>
            <span className="text-xs text-mist">已读取 {characterLabel} 个字符</span>
          </div>
          {hasLargeInput && (
            <p className="rounded-lg border border-gold/20 bg-gold/10 p-3 text-xs leading-5 text-gold">
              已达到当前上限。系统只保留前 {WECHAT_MAX_SOURCE_CHARS.toLocaleString("zh-CN")} 个字符，并分析前 {WECHAT_MAX_LINES.toLocaleString("zh-CN")} 行。
            </p>
          )}
          {containsCrisisSignal(wechatRaw) && (
            <p className="rounded-lg border border-red-300/50 bg-red-50 p-3 text-xs leading-5 text-red-700">
              {safetyMessage}
            </p>
          )}
        </div>

        <aside className="space-y-3 rounded-lg border border-night/10 bg-deep/70 p-4">
          <p className="text-sm font-medium text-ink">分析预览</p>
          {wechatAnalysis ? (
            <>
              <p className="text-sm leading-6 text-mist">{wechatAnalysis.summary}</p>
              <div>
                <p className="mb-2 text-xs text-blue">高频主题</p>
                <div className="flex flex-wrap gap-2">
                  {wechatAnalysis.recurringTopics.map((topic) => (
                    <span key={topic} className="rounded-full bg-blue/15 px-3 py-1 text-xs text-blue">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs text-violet">情绪线索</p>
                <div className="flex flex-wrap gap-2">
                  {wechatAnalysis.emotionalSignals.map((signal) => (
                    <span key={signal} className="rounded-full bg-violet/15 px-3 py-1 text-xs text-violet">
                      {signal}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-mist">关键片段</p>
                {wechatAnalysis.keyMoments.slice(0, 3).map((moment) => (
                  <p key={moment.id} className="rounded-lg border border-night/10 bg-[oklch(0.99_0.004_92)] p-3 text-xs leading-5 text-mist">
                    {moment.timeLabel ? `${moment.timeLabel} · ` : ""}
                    {moment.speaker}：{moment.content}
                  </p>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm leading-6 text-mist">
              还没有分析结果。导入后会显示高频主题、情绪线索和最多 3 个关键片段。
            </p>
          )}
        </aside>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={skip} className="rounded-lg border border-night/15 px-5 py-2 text-sm text-ink hover:bg-deep">
          不使用聊天记录
        </button>
        <button
          disabled={!wechatAnalysis}
          onClick={next}
          className="rounded-lg bg-night px-5 py-2 text-sm font-medium text-deep shadow-quiet disabled:cursor-not-allowed disabled:opacity-40"
        >
          把分析结果加入个人分析
        </button>
      </div>
      <p className="max-w-[72ch] text-xs leading-6 text-mist">{disclaimer}</p>
    </section>
  );
}
