"use client";

import { useMemo, useState } from "react";
import { BrainCircuit, LoaderCircle } from "lucide-react";
import { useLifeforkStore } from "@/lib/stores/lifeforkStore";
import { disclaimer } from "@/lib/copy";
import { containsCrisisSignal, safetyMessage } from "@/lib/safety";
import type { WeChatAIAnalysis } from "@/lib/types";
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
  const runtimeConfig = useLifeforkStore((s) => s.runtimeConfig);
  const editorConfig = useLifeforkStore((s) => s.editorConfig);
  const requestConfirmation = useLifeforkStore((s) => s.requestConfirmation);

  const [fileName, setFileName] = useState("");
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiError, setAiError] = useState("");
  const hasLargeInput = wechatRaw.length >= WECHAT_MAX_SOURCE_CHARS;
  const hasCrisisSignal = useMemo(() => containsCrisisSignal(wechatRaw), [wechatRaw]);
  const characterLabel = useMemo(() => wechatRaw.length.toLocaleString("zh-CN"), [wechatRaw.length]);

  const analyze = (sourceName = fileName || "粘贴的微信记录") => {
    if (!wechatRaw.trim()) return;
    setWechatAnalysis(analyzeWeChatExport(wechatRaw, sourceName));
  };

  const canUseServerAi =
    runtimeConfig.features.ai &&
    runtimeConfig.service.aiConfigured &&
    editorConfig.features.aiApi &&
    editorConfig.global.aiMode === "api-enhanced";

  const analyzeWithServerAi = async () => {
    if (!wechatAnalysis || !canUseServerAi || isAiAnalyzing || hasCrisisSignal) return;
    setIsAiAnalyzing(true);
    setAiError("");
    const startedAt = Date.now();
    try {
      const localSummary = [
        wechatAnalysis.summary,
        `高频主题：${wechatAnalysis.recurringTopics.join("、") || "未识别"}`,
        `情绪线索：${wechatAnalysis.emotionalSignals.join("、") || "未识别"}`,
        `自我模型线索：${wechatAnalysis.selfSkillSignals.join(" ")}`,
      ].join("\n");
      const response = await fetch("/api/wechat-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ localSummary }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) {
        throw new Error(body.error ?? "服务器分析失败");
      }
      const used = body.meta?.llmUsed === true;
      const data = body.data;
      const aiAnalysis: WeChatAIAnalysis = {
        recurringTopics: Array.isArray(data.recurringTopics) ? data.recurringTopics : [],
        emotionalSignals: Array.isArray(data.emotionalSignals) ? data.emotionalSignals : [],
        keyThemes: Array.isArray(data.keyThemes) ? data.keyThemes : [],
        relationshipDynamics: data.relationshipDynamics ?? "",
        selfSkillSignals: Array.isArray(data.selfSkillSignals) ? data.selfSkillSignals : [],
        suggestedSelfSkillText: data.suggestedSelfSkillText ?? "",
        execution: {
          used,
          provider:
            used && (body.meta?.provider === "openai" || body.meta?.provider === "deepseek")
              ? body.meta.provider
              : "local",
          model: used ? body.meta?.model ?? "unknown" : "local-rules",
          fallbackReason: used ? undefined : body.meta?.fallbackReason,
          promptVersion: body.meta?.promptVersion,
          durationMs: Date.now() - startedAt,
          tokenUsage: body.usage,
        },
      };
      setWechatAnalysis({
        ...wechatAnalysis,
        recurringTopics: Array.from(
          new Set([...wechatAnalysis.recurringTopics, ...aiAnalysis.recurringTopics]),
        ).slice(0, 8),
        emotionalSignals: Array.from(
          new Set([...wechatAnalysis.emotionalSignals, ...aiAnalysis.emotionalSignals]),
        ).slice(0, 8),
        selfSkillSignals: Array.from(
          new Set([...wechatAnalysis.selfSkillSignals, ...aiAnalysis.selfSkillSignals]),
        ).slice(0, 10),
        suggestedSelfSkillText:
          aiAnalysis.suggestedSelfSkillText || wechatAnalysis.suggestedSelfSkillText,
        aiAnalysis,
      });
      if (!used) {
        setAiError("服务器模型本轮未成功响应，已保留本地分析结果。");
      }
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "服务器分析失败，已保留本地结果。");
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      requestConfirmation(
        {
          title: "文件超过 5 MB",
          message: "请导出较小的时间范围，或把聊天记录拆成多个文件分批分析。",
          confirmLabel: "关闭提示",
          dismissOnly: true,
        },
        () => undefined,
      );
      return;
    }
    setFileName(file.name);
    const text = await file.text();
    const boundedText = text.slice(0, WECHAT_MAX_SOURCE_CHARS);
    setWechatRaw(boundedText);
    setWechatAnalysis(analyzeWeChatExport(boundedText, file.name));
  };

  const skip = () => {
    setStep("extra-text");
  };
  const next = () => {
    setWechatRaw("");
    setStep("extra-text");
  };
  const back = () => {
    setStep("questions");
  };

  return (
    <section className="space-y-5 rounded-lg border border-night/10 bg-[oklch(0.99_0.004_92)] p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue">可选：让分析更准</p>
          <h3 className="mt-1 text-2xl font-semibold text-ink">导入微信聊天记录</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-mist">
            粘贴或上传已经导出的聊天文本。系统会在当前浏览器中提取高频主题、情绪线索和关键片段。离开此步骤后会清除原文，只保留脱敏后的本地分析结果。
            <strong className="text-ink">不知道从哪里导出？直接点「跳过」即可，这一步不是必须的。</strong>
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={back} className="rounded-lg border border-night/15 px-5 py-2 text-sm text-ink hover:bg-deep">
            上一步
          </button>
          <button type="button" onClick={skip} className="rounded-lg border border-night/15 px-5 py-2 text-sm text-ink hover:bg-deep">
            跳过此步
          </button>
        </div>
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
            className="min-h-56 w-full resize-y rounded-lg border border-night/10 bg-deep/70 p-4 text-base leading-6 outline-none focus:border-blue focus:bg-[oklch(0.995_0.003_92)]"
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
          {hasCrisisSignal && (
            <div className="rounded-lg border border-red-300/50 bg-red-50 p-3 text-xs leading-5 text-red-700">
              <p>{safetyMessage}</p>
              <p className="mt-2 font-medium">
                这段材料不会发送给服务器 AI。你仍可做本地分析，或删除相关内容后继续。
              </p>
            </div>
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
              {wechatAnalysis.aiAnalysis && (
                <div className="border-t border-night/10 pt-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-medium text-ink">服务器 AI 补充</p>
                    <span className="rounded-full border border-blue/20 bg-blue/5 px-2 py-1 text-[11px] text-blue">
                      {wechatAnalysis.aiAnalysis.execution.used
                        ? `${wechatAnalysis.aiAnalysis.execution.provider} / ${wechatAnalysis.aiAnalysis.execution.model}`
                        : "本地备用结果"}
                    </span>
                  </div>
                  {wechatAnalysis.aiAnalysis.keyThemes.length > 0 && (
                    <p className="mt-2 text-xs leading-5 text-mist">
                      关键主题：{wechatAnalysis.aiAnalysis.keyThemes.join("、")}
                    </p>
                  )}
                  {wechatAnalysis.aiAnalysis.relationshipDynamics && (
                    <p className="mt-2 text-xs leading-5 text-mist">
                      互动特征：{wechatAnalysis.aiAnalysis.relationshipDynamics}
                    </p>
                  )}
                </div>
              )}
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
          跳过此步，继续下一步
        </button>
        <button
          disabled={!wechatAnalysis}
          onClick={next}
          className="rounded-lg bg-night px-5 py-2 text-sm font-medium text-deep shadow-quiet disabled:cursor-not-allowed disabled:opacity-40"
        >
          {wechatAnalysis ? "把分析结果加入个人分析" : "先点上方「本地分析这段聊天」"}
        </button>
        {wechatAnalysis && canUseServerAi && (
          <button
            type="button"
            disabled={isAiAnalyzing || hasCrisisSignal}
            onClick={analyzeWithServerAi}
            className="inline-flex items-center gap-2 rounded-lg border border-blue/25 bg-blue/5 px-5 py-2 text-sm font-medium text-blue disabled:opacity-50"
          >
            {isAiAnalyzing ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <BrainCircuit className="size-4" aria-hidden="true" />
            )}
            {wechatAnalysis.aiAnalysis ? "重新做 AI 深度分析" : "使用服务器 AI 深度分析"}
          </button>
        )}
      </div>
      {wechatAnalysis && canUseServerAi && (
        <p className="text-xs leading-5 text-mist">
          服务器只接收上方的本地统计摘要、主题和情绪标签；聊天原文与关键片段留在此页面内存中，刷新或离开后清除。
        </p>
      )}
      {aiError && (
        <p className="rounded-lg border border-gold/25 bg-gold/5 p-3 text-xs leading-5 text-ink">
          {aiError}
        </p>
      )}
      <p className="max-w-[72ch] text-xs leading-6 text-mist">{disclaimer}</p>
    </section>
  );
}
