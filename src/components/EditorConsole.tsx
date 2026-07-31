"use client";

import { useMemo, useState } from "react";
import { EDITOR_CONFIG_VERSION, type EditorConfig } from "@/lib/editorConfig";
import { useLifeforkStore } from "@/lib/stores/lifeforkStore";

const deploymentChecks = [
  "npm run lint 通过",
  "npm run build 通过",
  "npm run preview:3005 可启动生产预览",
  "无 API key 时仍可使用本地 fallback",
  "后台配置可导出、导入、恢复默认",
  "结果卡片不展示用户原文",
] as const;

function Field({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-medium text-blue">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-28 w-full rounded-lg border border-night/10 bg-deep/70 p-3 text-sm leading-6 text-ink outline-none focus:border-blue"
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-lg border border-night/10 bg-deep/70 px-4 py-2 text-sm text-ink outline-none focus:border-blue"
        />
      )}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`rounded-lg border px-4 py-2 text-sm ${
        checked ? "border-gold/30 bg-gold/10 text-gold" : "border-night/10 bg-deep/60 text-mist hover:bg-deep"
      }`}
    >
      {label}：{checked ? "开" : "关"}
    </button>
  );
}

export function EditorConsole() {
  const editorConfig = useLifeforkStore((state) => state.editorConfig);
  const saveEditorConfig = useLifeforkStore((state) => state.saveEditorConfig);
  const resetEditorConfig = useLifeforkStore((state) => state.resetEditorConfig);
  const importEditorConfig = useLifeforkStore((state) => state.importEditorConfig);
  const setStep = useLifeforkStore((state) => state.setStep);
  const [draft, setDraft] = useState<EditorConfig>(editorConfig);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const serializedDraft = useMemo(() => JSON.stringify(draft, null, 2), [draft]);

  const setLanding = <K extends keyof EditorConfig["landing"]>(key: K, value: EditorConfig["landing"][K]) => {
    setDraft((current) => ({ ...current, landing: { ...current.landing, [key]: value } }));
  };

  const setGlobal = <K extends keyof EditorConfig["global"]>(key: K, value: EditorConfig["global"][K]) => {
    setDraft((current) => ({ ...current, global: { ...current.global, [key]: value } }));
  };

  const setNav = <K extends keyof EditorConfig["nav"]>(key: K, value: EditorConfig["nav"][K]) => {
    setDraft((current) => ({ ...current, nav: { ...current.nav, [key]: value } }));
  };

  const setFeature = <K extends keyof EditorConfig["features"]>(key: K, value: EditorConfig["features"][K]) => {
    setDraft((current) => ({ ...current, features: { ...current.features, [key]: value } }));
  };

  const exportConfig = async () => {
    try {
      await navigator.clipboard.writeText(serializedDraft);
      setStatus("配置 JSON 已复制");
    } catch {
      setStatus("浏览器没有允许复制，请使用下载配置");
    }
  };

  const downloadConfig = () => {
    const blob = new Blob([serializedDraft], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "lifefork-editor-config.json";
    link.click();
    URL.revokeObjectURL(url);
    setStatus("配置文件已下载");
  };

  const applyImport = () => {
    try {
      importEditorConfig(importText);
      setDraft(useLifeforkStore.getState().editorConfig);
      setImportError(null);
      setImportText("");
      setStatus("配置已导入并应用");
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "无法解析配置 JSON");
      setStatus(null);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-night/10 bg-[oklch(0.99_0.004_92)] p-5 shadow-glow">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue">全局配置</p>
            <h2 className="mt-2 text-3xl font-semibold text-ink">本地编辑台</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-mist">
              这里管理全局页面文案、免责声明、行动建议、导航标签和部署开关。V0.7 暂用浏览器 localStorage
              持久化，适合本地预览和静态部署演示；接入后端后应迁移为带权限的 CMS/API。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setStep("landing")} className="rounded-lg border border-night/15 px-4 py-2 text-sm text-ink hover:bg-deep">
              回到前台
            </button>
            <button
              type="button"
              onClick={() => {
                saveEditorConfig(draft);
                setStatus("全局配置已保存在当前浏览器");
              }}
              className="rounded-lg bg-night px-4 py-2 text-sm font-medium text-deep shadow-quiet"
            >
              保存全局配置
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-night/10 pt-4 text-xs">
          <span className="text-mist">当前配置只作用于此浏览器，不含账号、权限和跨设备同步。</span>
          {status && <span className="font-medium text-blue" role="status">{status}</span>}
        </div>

        <div className="mt-5 grid gap-3 text-xs text-mist md:grid-cols-3">
          <div className="rounded-lg border border-night/10 bg-deep/70 p-4">
            <p className="font-medium text-blue">配置版本</p>
            <p className="mt-2 text-ink">{draft.version || EDITOR_CONFIG_VERSION}</p>
          </div>
          <div className="rounded-lg border border-night/10 bg-deep/70 p-4">
            <p className="font-medium text-blue">部署模式</p>
            <p className="mt-2 text-ink">{draft.global.deploymentMode}</p>
          </div>
          <div className="rounded-lg border border-night/10 bg-deep/70 p-4">
            <p className="font-medium text-blue">AI 模式</p>
            <p className="mt-2 text-ink">{draft.global.aiMode}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <article className="rounded-lg border border-night/10 bg-[oklch(0.99_0.004_92)] p-5 shadow-sm">
            <h3 className="text-xl font-semibold text-ink">首页文案</h3>
            <div className="mt-5 grid gap-4">
              <Field label="品牌标识" value={draft.landing.brandKicker} onChange={(value) => setLanding("brandKicker", value)} />
              <Field
                label="主标题第一行"
                value={draft.landing.headline[0]}
                onChange={(value) => setLanding("headline", [value, draft.landing.headline[1]])}
              />
              <Field
                label="主标题第二行"
                value={draft.landing.headline[1]}
                onChange={(value) => setLanding("headline", [draft.landing.headline[0], value])}
              />
              <Field label="正文说明" value={draft.landing.body} onChange={(value) => setLanding("body", value)} multiline />
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="主按钮" value={draft.landing.primaryAction} onChange={(value) => setLanding("primaryAction", value)} />
                <Field label="副按钮" value={draft.landing.secondaryAction} onChange={(value) => setLanding("secondaryAction", value)} />
              </div>
            </div>
          </article>

          <article className="rounded-lg border border-night/10 bg-[oklch(0.99_0.004_92)] p-5 shadow-sm">
            <h3 className="text-xl font-semibold text-ink">全局风险文案</h3>
            <div className="mt-5 grid gap-4">
              <Field label="免责声明" value={draft.global.disclaimer} onChange={(value) => setGlobal("disclaimer", value)} multiline />
              <Field label="编辑备注" value={draft.global.editorNotes} onChange={(value) => setGlobal("editorNotes", value)} multiline />
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-medium text-blue">部署模式</span>
                  <select
                    value={draft.global.deploymentMode}
                    onChange={(event) => setGlobal("deploymentMode", event.target.value as EditorConfig["global"]["deploymentMode"])}
                    className="w-full rounded-lg border border-night/10 bg-deep/70 px-4 py-2 text-sm text-ink outline-none focus:border-blue"
                  >
                    <option value="local-preview">local-preview</option>
                    <option value="static-hosted">static-hosted</option>
                    <option value="server-hosted">server-hosted</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-medium text-blue">AI 模式</span>
                  <select
                    value={draft.global.aiMode}
                    onChange={(event) => setGlobal("aiMode", event.target.value as EditorConfig["global"]["aiMode"])}
                    className="w-full rounded-lg border border-night/10 bg-deep/70 px-4 py-2 text-sm text-ink outline-none focus:border-blue"
                  >
                    <option value="local-fallback">local-fallback</option>
                    <option value="api-enhanced">api-enhanced</option>
                  </select>
                </label>
              </div>
            </div>
          </article>

          <article className="rounded-lg border border-night/10 bg-[oklch(0.99_0.004_92)] p-5 shadow-sm">
            <h3 className="text-xl font-semibold text-ink">导航标签</h3>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="主页" value={draft.nav.home} onChange={(value) => setNav("home", value)} />
              <Field label="个人分析" value={draft.nav.selfSkill} onChange={(value) => setNav("selfSkill", value)} />
              <Field label="时间线" value={draft.nav.timeline} onChange={(value) => setNav("timeline", value)} />
              <Field label="方案地图" value={draft.nav.lifeMap} onChange={(value) => setNav("lifeMap", value)} />
              <Field label="方案对话" value={draft.nav.currentDialogue} onChange={(value) => setNav("currentDialogue", value)} />
              <Field label="结果卡片" value={draft.nav.shareCard} onChange={(value) => setNav("shareCard", value)} />
              <Field label="完整示例" value={draft.nav.demoScenario} onChange={(value) => setNav("demoScenario", value)} />
              <Field label="本地编辑入口" value={draft.nav.editor} onChange={(value) => setNav("editor", value)} />
              <Field label="清空重来" value={draft.nav.reset} onChange={(value) => setNav("reset", value)} />
            </div>
          </article>
        </div>

        <div className="space-y-6">
          <article className="rounded-lg border border-night/10 bg-[oklch(0.99_0.004_92)] p-5 shadow-sm">
            <h3 className="text-xl font-semibold text-ink">功能开关</h3>
            <div className="mt-5 flex flex-wrap gap-3">
              <Toggle label="完整示例" checked={draft.features.demoScenario} onChange={(value) => setFeature("demoScenario", value)} />
              <Toggle label="微信导入" checked={draft.features.wechatImport} onChange={(value) => setFeature("wechatImport", value)} />
              <Toggle label="AI API" checked={draft.features.aiApi} onChange={(value) => setFeature("aiApi", value)} />
              <Toggle label="本地编辑台" checked={draft.features.editorConsole} onChange={(value) => setFeature("editorConsole", value)} />
            </div>
          </article>

          <article className="rounded-lg border border-night/10 bg-[oklch(0.99_0.004_92)] p-5 shadow-sm">
            <h3 className="text-xl font-semibold text-ink">行动建议</h3>
            <p className="mt-2 text-xs text-mist">每行一条。结果卡片会随机显示其中一条。</p>
            <textarea
              value={draft.share.futureSelfLines.join("\n")}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  share: {
                    ...current.share,
                    futureSelfLines: event.target.value
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean),
                  },
                }))
              }
              className="mt-4 min-h-52 w-full rounded-lg border border-night/10 bg-deep/70 p-3 text-sm leading-6 text-ink outline-none focus:border-blue"
            />
          </article>

          <article className="rounded-lg border border-night/10 bg-[oklch(0.99_0.004_92)] p-5 shadow-sm">
            <h3 className="text-xl font-semibold text-ink">部署检查</h3>
            <ul className="mt-4 space-y-2 text-sm text-mist">
              {deploymentChecks.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={exportConfig} className="rounded-lg border border-night/15 px-4 py-2 text-sm text-ink hover:bg-deep">
                复制配置 JSON
              </button>
              <button type="button" onClick={downloadConfig} className="rounded-lg border border-blue/30 px-4 py-2 text-sm text-blue hover:bg-blue/10">
                下载配置
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!window.confirm("恢复默认后台配置？")) return;
                  resetEditorConfig();
                  setDraft(useLifeforkStore.getState().editorConfig);
                }}
                className="rounded-lg border border-red-300/50 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
              >
                恢复默认
              </button>
            </div>
          </article>

          <article className="rounded-lg border border-night/10 bg-[oklch(0.99_0.004_92)] p-5 shadow-sm">
            <h3 className="text-xl font-semibold text-ink">导入配置</h3>
            <textarea
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              placeholder="粘贴 lifefork-editor-config.json 内容"
              className="mt-4 min-h-36 w-full rounded-lg border border-night/10 bg-deep/70 p-3 text-sm leading-6 text-ink outline-none focus:border-blue"
            />
            {importError && <p className="mt-2 text-xs text-red-700">{importError}</p>}
            <button type="button" onClick={applyImport} className="mt-4 rounded-lg border border-gold/30 px-4 py-2 text-sm text-gold hover:bg-gold/10">
              导入并应用
            </button>
          </article>
        </div>
      </div>
    </section>
  );
}
