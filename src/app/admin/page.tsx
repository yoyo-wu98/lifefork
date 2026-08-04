"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  Check,
  LogOut,
  Save,
  ShieldCheck,
} from "lucide-react";
import type { PublicRuntimeConfig } from "@/lib/runtimeConfig";

interface SessionState {
  authenticated: boolean;
  configured: boolean;
}

const FEATURE_LABELS: Record<keyof PublicRuntimeConfig["features"], string> = {
  ai: "服务器 AI",
  wechatImport: "微信记录导入",
  culturalMethods: "八字与紫微斗数",
  demoScenario: "完整示例",
};

export default function AdminPage() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [password, setPassword] = useState("");
  const [config, setConfig] = useState<PublicRuntimeConfig | null>(null);
  const [message, setMessage] = useState("");
  const [configError, setConfigError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadConfig = async () => {
    setConfigError("");
    try {
      const response = await fetch("/api/admin/config", { cache: "no-store" });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success) {
        throw new Error(body?.error ?? `读取配置失败（HTTP ${response.status}）`);
      }
      setConfig(body.data);
      return true;
    } catch (error) {
      setConfigError(error instanceof Error ? error.message : "读取配置失败，请重试。");
      return false;
    }
  };

  useEffect(() => {
    fetch("/api/admin/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((body) => {
        const next = {
          authenticated: body.authenticated === true,
          configured: body.configured === true,
        };
        setSession(next);
        if (next.authenticated) void loadConfig();
      })
      .catch(() => {
        setSession({ authenticated: false, configured: false });
        setMessage("无法连接管理服务，请检查服务器状态后重试。");
      });
  }, []);

  const login = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success) {
        setMessage(body?.error ?? `登录失败（HTTP ${response.status}）。`);
        return;
      }
      setPassword("");
      setSession({ authenticated: true, configured: true });
      await loadConfig();
    } catch {
      setMessage("登录请求失败，请检查网络连接后重试。");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/session", { method: "DELETE" });
      if (!response.ok) throw new Error();
      setSession((current) => ({
        authenticated: false,
        configured: current?.configured ?? true,
      }));
      setConfig(null);
    } catch {
      setMessage("退出失败，请检查网络后重试。");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!config) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success) {
        setMessage(body?.error ?? `配置保存失败（HTTP ${response.status}）。`);
        return;
      }
      setConfig(body.data);
      setMessage("全局配置已保存。约 1 分钟内前台自动生效（已打开页面的用户下次切回时也会刷新）。");
    } catch {
      setMessage("配置保存失败，请检查网络连接后重试。");
    } finally {
      setBusy(false);
    }
  };

  if (!session) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl items-center px-5">
        <p className="text-sm text-mist">正在检查管理员会话...</p>
      </main>
    );
  }

  if (!session.authenticated) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-5 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-mist hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden="true" />
          返回 LifeFork
        </Link>
        <div className="mt-10 border-y border-night/10 py-8">
          <ShieldCheck className="size-7 text-blue" aria-hidden="true" />
          <h1 className="mt-4 text-3xl font-semibold text-ink">LifeFork 全局管理</h1>
          <p className="mt-3 text-sm leading-6 text-mist">
            在这里管理公开测试状态、服务器功能开关、公告和默认分析方法。
          </p>
          {!session.configured ? (
            <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">
              服务器尚未设置 <code>LIFEFORK_ADMIN_PASSWORD</code>。完成配置并重启服务后才能登录。
            </p>
          ) : (
            <form className="mt-7 space-y-4" onSubmit={login}>
              <label className="block text-sm font-medium text-ink">
                管理员密码
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-night/15 bg-[var(--lf-paper-raised)] px-4 py-3"
                />
              </label>
              {message && <p className="text-sm text-red-700" role="alert">{message}</p>}
              <button
                type="submit"
                disabled={busy || !password}
                className="rounded-lg bg-night px-5 py-3 text-sm font-medium text-deep disabled:opacity-40"
              >
                {busy ? "正在登录..." : "登录管理后台"}
              </button>
            </form>
          )}
        </div>
      </main>
    );
  }

  if (!config) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-start justify-center gap-4 px-5">
        {configError ? (
          <>
            <p className="text-sm leading-6 text-red-700" role="alert">{configError}</p>
            <button
              type="button"
              className="rounded-lg bg-night px-4 py-2 text-sm font-medium text-deep"
              onClick={() => void loadConfig()}
            >
              重新读取配置
            </button>
          </>
        ) : (
          <p className="text-sm text-mist">正在读取全局配置...</p>
        )}
      </main>
    );
  }

  const updatedAtLabel = config.updatedAt
    ? new Date(config.updatedAt).toLocaleString("zh-CN")
    : "尚未保存，正在使用服务器默认配置";

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-8">
      <header className="flex flex-wrap items-start justify-between gap-5 border-b border-night/10 pb-6">
        <div>
          <p className="text-sm font-medium text-blue">管理员后台</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">公开测试全局设置</h1>
          <p className="mt-2 text-sm text-mist">
            最后更新：{updatedAtLabel}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-night/15 px-4 py-2.5 text-sm text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            查看前台
          </Link>
          <button
            type="button"
            onClick={logout}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg border border-night/15 px-4 py-2.5 text-sm text-mist"
          >
            <LogOut className="size-4" aria-hidden="true" />
            退出
          </button>
        </div>
      </header>

      <section className="grid gap-6 border-b border-night/10 py-7 md:grid-cols-[220px_1fr]">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="size-5 text-blue" aria-hidden="true" />
            <h2 className="font-semibold text-ink">服务状态</h2>
          </div>
          <p className="mt-2 text-xs leading-5 text-mist">维护模式会停止新的分析请求。</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["online", "maintenance"] as const).map((status) => (
            <button
              key={status}
              type="button"
              aria-pressed={config.status === status}
              onClick={() => setConfig({ ...config, status })}
              className={`rounded-lg border p-4 text-left ${
                config.status === status
                  ? "border-blue bg-blue/5"
                  : "border-night/10"
              }`}
            >
              <span className="block text-sm font-semibold text-ink">
                {status === "online" ? "正常开放" : "维护模式"}
              </span>
              <span className="mt-1 block text-xs text-mist">
                {status === "online" ? "允许新分析和对话" : "仅允许查看已有结果"}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-6 border-b border-night/10 py-7 md:grid-cols-[220px_1fr]">
        <div>
          <h2 className="font-semibold text-ink">功能开关</h2>
          <p className="mt-2 text-xs leading-5 text-mist">
            前台按钮和服务端接口会同时执行这些设置。
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(FEATURE_LABELS) as Array<keyof typeof FEATURE_LABELS>).map(
            (key) => (
              <label
                key={key}
                className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-night/10 px-4 py-3"
              >
                <span>
                  <span className="block text-sm font-medium text-ink">
                    {FEATURE_LABELS[key]}
                  </span>
                  {key === "ai" && (
                    <span className="mt-1 block text-xs text-mist">
                      {config.service.aiConfigured
                        ? `已配置 ${config.service.provider}`
                        : "未配置密钥，将使用本地规则"}
                    </span>
                  )}
                </span>
                <input
                  type="checkbox"
                  checked={config.features[key]}
                  onChange={(event) =>
                    setConfig({
                      ...config,
                      features: {
                        ...config.features,
                        [key]: event.target.checked,
                      },
                    })
                  }
                  className="size-4 accent-[oklch(0.53_0.12_245)]"
                />
              </label>
            ),
          )}
        </div>
      </section>

      <section className="grid gap-6 border-b border-night/10 py-7 md:grid-cols-[220px_1fr]">
        <div>
          <h2 className="font-semibold text-ink">前台信息</h2>
          <p className="mt-2 text-xs leading-5 text-mist">
            用于测试版本标记、公告和隐私提示。
          </p>
        </div>
        <div className="space-y-4">
          <label className="block text-sm font-medium text-ink">
            版本标签
            <input
              value={config.betaLabel}
              maxLength={40}
              onChange={(event) => setConfig({ ...config, betaLabel: event.target.value })}
              className="mt-2 w-full rounded-lg border border-night/15 bg-[var(--lf-paper-raised)] px-4 py-3"
            />
          </label>
          <label className="block text-sm font-medium text-ink">
            全站公告
            <textarea
              value={config.announcement}
              maxLength={500}
              rows={3}
              onChange={(event) => setConfig({ ...config, announcement: event.target.value })}
              className="mt-2 w-full resize-y rounded-lg border border-night/15 bg-[var(--lf-paper-raised)] px-4 py-3"
            />
          </label>
          <label className="block text-sm font-medium text-ink">
            隐私提示
            <textarea
              value={config.privacyNotice}
              maxLength={800}
              rows={4}
              onChange={(event) => setConfig({ ...config, privacyNotice: event.target.value })}
              className="mt-2 w-full resize-y rounded-lg border border-night/15 bg-[var(--lf-paper-raised)] px-4 py-3"
            />
          </label>
          <label className="block text-sm font-medium text-ink">
            新用户默认分析方案
            <select
              value={config.defaults.analysisPreset}
              onChange={(event) =>
                setConfig({
                  ...config,
                  defaults: {
                    analysisPreset: event.target
                      .value as PublicRuntimeConfig["defaults"]["analysisPreset"],
                  },
                })
              }
              className="mt-2 w-full rounded-lg border border-night/15 bg-[var(--lf-paper-raised)] px-4 py-3"
            >
              <option value="evidence-first">证据优先</option>
              <option value="balanced">综合分析</option>
              <option value="cultural-exploration">文化探索</option>
            </select>
          </label>
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-4 py-7">
        <div className="min-h-6 text-sm text-mist" aria-live="polite">
          {message && (
            <span className="inline-flex items-center gap-2">
              {message.startsWith("全局") && <Check className="size-4 text-blue" aria-hidden="true" />}
              {message}
            </span>
          )}
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={save}
          className="inline-flex items-center gap-2 rounded-lg bg-night px-5 py-3 text-sm font-medium text-deep disabled:opacity-40"
        >
          <Save className="size-4" aria-hidden="true" />
          {busy ? "正在保存..." : "保存全局配置"}
        </button>
      </footer>
    </main>
  );
}
