"use client";

import {
  BarChart3,
  BrainCircuit,
  CalendarRange,
  Cpu,
  Database,
  Fingerprint,
  Info,
  Orbit,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import {
  ANALYSIS_METHODS,
  ANALYSIS_PRESETS,
  applyAnalysisPreset,
  normalizeMethodWeights,
} from "@/lib/analysis/methodRegistry";
import { useLifeforkStore } from "@/lib/stores/lifeforkStore";
import type {
  AnalysisMethodId,
  AnalysisMethodPreference,
  AnalysisPresetId,
  BirthProfile,
} from "@/lib/types";

const METHOD_ICONS = {
  "user-evidence": Database,
  "behavioral-pattern": BrainCircuit,
  "population-statistics": BarChart3,
  "ai-synthesis": Cpu,
  "mbti-stage": Fingerprint,
  bazi: CalendarRange,
  ziwei: Orbit,
} as const;

const RELIABILITY_LABELS = {
  higher: "证据强度较高",
  medium: "需要结合个人情况",
  experimental: "实验功能",
  cultural: "传统文化视角",
} as const;

const PRESET_IDS: Array<Exclude<AnalysisPresetId, "custom">> = [
  "evidence-first",
  "balanced",
  "cultural-exploration",
];

function updateMethod(
  methods: AnalysisMethodPreference[],
  id: AnalysisMethodId,
  patch: Partial<AnalysisMethodPreference>,
): AnalysisMethodPreference[] {
  return methods.map((method) => (method.id === id ? { ...method, ...patch } : method));
}

export function AnalysisMethodStep() {
  const settings = useLifeforkStore((state) => state.analysisSettings);
  const setSettings = useLifeforkStore((state) => state.setAnalysisSettings);
  const setStep = useLifeforkStore((state) => state.setStep);
  const createSkill = useLifeforkStore((state) => state.createSkill);
  const runtimeConfig = useLifeforkStore((state) => state.runtimeConfig);
  const normalizedWeights = normalizeMethodWeights(settings.methods);
  const culturalEnabled = runtimeConfig.features.culturalMethods && settings.methods.some(
    (method) => method.enabled && (method.id === "bazi" || method.id === "ziwei"),
  );
  const ziweiEnabled = settings.methods.some(
    (method) => method.enabled && method.id === "ziwei",
  );
  const birth = settings.birthProfile;
  const birthReady =
    !culturalEnabled ||
    Boolean(
      birth?.consentToProcess &&
        birth.date &&
        birth.time &&
        birth.timeAccuracy !== "unknown" &&
        (!ziweiEnabled || birth.gender === "female" || birth.gender === "male"),
    );

  const birthBlockers: string[] = [];
  if (culturalEnabled) {
    if (!birth?.date) birthBlockers.push("请填写出生日期");
    if (!birth?.time) birthBlockers.push("请填写出生时间");
    if (birth?.timeAccuracy === "unknown") {
      birthBlockers.push("「不知道」时辰无法排八字/紫微，请改选「误差在两小时内」，或关闭这两项方法");
    }
    if (ziweiEnabled && birth?.gender !== "female" && birth?.gender !== "male") {
      birthBlockers.push("紫微斗数排盘需要选择「女」或「男」性别规则，或关闭紫微斗数");
    }
    if (!birth?.consentToProcess) birthBlockers.push("请勾选出生信息处理同意");
  }

  const setBirth = <K extends keyof BirthProfile>(key: K, value: BirthProfile[K]) => {
    setSettings({
      ...settings,
      birthProfile: {
        ...(birth ?? {
          calendar: "solar",
          date: "",
          time: "12:00",
          timeAccuracy: "unknown",
          timezone: "Asia/Shanghai",
          place: "",
          gender: "prefer-not-to-say",
          consentToProcess: false,
        }),
        [key]: value,
      },
    });
  };

  return (
    <section className="space-y-6">
      <header className="border-b border-night/10 pb-5">
        <p className="text-sm font-medium text-blue">分析设置</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">选择这次分析使用哪些方法</h1>
        <p className="mt-3 max-w-[72ch] text-sm leading-7 text-mist">
          每条结论都会显示使用的方法、你的权重、模型置信度、原始证据和限制条件。权重只影响报告排序和分支比较，不会把任何方法变成确定预测。
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <section aria-labelledby="preset-heading">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-blue" aria-hidden="true" />
              <h2 id="preset-heading" className="text-lg font-semibold text-ink">
                快速设置
              </h2>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              {PRESET_IDS.filter(
                (presetId) =>
                  runtimeConfig.features.culturalMethods ||
                  presetId !== "cultural-exploration",
              ).map((presetId) => {
                const preset = ANALYSIS_PRESETS[presetId];
                const active = settings.preset === presetId;
                return (
                  <button
                    key={presetId}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSettings(applyAnalysisPreset(settings, presetId))}
                    className={`rounded-lg border p-4 text-left transition-colors ${
                      active
                        ? "border-blue bg-blue/8"
                        : "border-night/10 bg-[oklch(0.99_0.004_92)] hover:border-blue/40"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-ink">{preset.label}</span>
                    <span className="mt-2 block text-xs leading-5 text-mist">
                      {preset.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="divide-y divide-night/10 border-y border-night/10" aria-label="分析方法">
            {settings.methods.map((method) => {
              const Icon = METHOD_ICONS[method.id];
              const methodAvailable =
                runtimeConfig.features.culturalMethods ||
                (method.id !== "bazi" && method.id !== "ziwei");
              return (
                <article
                  key={method.id}
                  className={`grid gap-4 py-5 md:grid-cols-[1fr_220px] ${
                    methodAvailable ? "" : "opacity-50"
                  }`}
                >
                  <div className="flex gap-3">
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-night text-deep">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-ink">{method.label}</h3>
                        <span className="rounded-full border border-night/10 px-2 py-0.5 text-[11px] text-mist">
                          {RELIABILITY_LABELS[method.reliability]}
                        </span>
                      </div>
                      <p className="mt-1 max-w-[64ch] text-xs leading-5 text-mist">
                        {method.description}
                      </p>
                      {!methodAvailable && (
                        <p className="mt-1 text-xs font-medium text-mist">
                          当前测试环境已关闭这项方法。
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={method.enabled}
                      disabled={!methodAvailable}
                      aria-label={`${method.enabled ? "关闭" : "启用"}${method.label}`}
                      onClick={() =>
                        setSettings({
                          ...settings,
                          preset: "custom",
                          methods: updateMethod(settings.methods, method.id, {
                            enabled: !method.enabled,
                            weight:
                              !method.enabled && method.weight === 0
                                ? ANALYSIS_PRESETS.balanced.weights[method.id]
                                : method.weight,
                          }),
                        })
                      }
                      className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors ${
                        method.enabled
                          ? "border-blue bg-blue"
                          : "border-night/20 bg-night/5"
                      }`}
                    >
                      <span
                        className={`absolute top-1 size-5 rounded-full bg-[oklch(0.99_0.004_92)] shadow-sm transition-transform ${
                          method.enabled ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <label className="min-w-0 flex-1">
                      <span className="flex items-center justify-between text-[11px] text-mist">
                        <span>权重</span>
                        <span>{normalizedWeights[method.id]}%</span>
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        step="1"
                        disabled={!method.enabled || !methodAvailable}
                        value={method.weight}
                        onChange={(event) =>
                          setSettings({
                            ...settings,
                            preset: "custom",
                            methods: updateMethod(settings.methods, method.id, {
                              weight: Number(event.target.value),
                            }),
                          })
                        }
                        className="mt-2 w-full accent-[oklch(0.53_0.12_245)] disabled:opacity-30"
                      />
                    </label>
                  </div>
                </article>
              );
            })}
          </section>

          {culturalEnabled && (
            <section className="rounded-lg border border-gold/30 bg-gold/5 p-5" aria-labelledby="birth-heading">
              <div className="flex items-start gap-3">
                <CalendarRange className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden="true" />
                <div>
                  <h2 id="birth-heading" className="text-lg font-semibold text-ink">
                    出生信息
                  </h2>
                  <p className="mt-1 max-w-[68ch] text-xs leading-5 text-mist">
                    八字和紫微斗数需要出生日期与时辰。信息保存在当前浏览器，并发送到
                    LifeFork 服务器完成规则排盘；服务器不会把出生字段转发给 AI 提供商。
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="space-y-2 text-xs font-medium text-ink">
                  <span>历法</span>
                  <select
                    value={birth?.calendar ?? "solar"}
                    onChange={(event) => setBirth("calendar", event.target.value as BirthProfile["calendar"])}
                    className="w-full rounded-lg border border-night/10 bg-[oklch(0.99_0.004_92)] px-3 py-2.5 text-sm"
                  >
                    <option value="solar">公历</option>
                    <option value="lunar">农历</option>
                  </select>
                </label>
                <label className="space-y-2 text-xs font-medium text-ink">
                  <span>出生日期</span>
                  <input
                    type="date"
                    value={birth?.date ?? ""}
                    onChange={(event) => setBirth("date", event.target.value)}
                    className="w-full rounded-lg border border-night/10 bg-[oklch(0.99_0.004_92)] px-3 py-2.5 text-sm"
                  />
                </label>
                <label className="space-y-2 text-xs font-medium text-ink">
                  <span>出生时间</span>
                  <input
                    type="time"
                    value={birth?.time ?? "12:00"}
                    onChange={(event) => setBirth("time", event.target.value)}
                    className="w-full rounded-lg border border-night/10 bg-[oklch(0.99_0.004_92)] px-3 py-2.5 text-sm"
                  />
                </label>
                <label className="space-y-2 text-xs font-medium text-ink">
                  <span>时间准确度</span>
                  <select
                    value={birth?.timeAccuracy ?? "unknown"}
                    onChange={(event) =>
                      setBirth("timeAccuracy", event.target.value as BirthProfile["timeAccuracy"])
                    }
                    className="w-full rounded-lg border border-night/10 bg-[oklch(0.99_0.004_92)] px-3 py-2.5 text-sm"
                  >
                    <option value="exact">准确到小时</option>
                    <option value="within-two-hours">误差在两小时内</option>
                    <option value="unknown">不知道</option>
                  </select>
                </label>
                <label className="space-y-2 text-xs font-medium text-ink">
                  <span>排盘性别规则</span>
                  <select
                    value={birth?.gender ?? "prefer-not-to-say"}
                    onChange={(event) => setBirth("gender", event.target.value as BirthProfile["gender"])}
                    className="w-full rounded-lg border border-night/10 bg-[oklch(0.99_0.004_92)] px-3 py-2.5 text-sm"
                  >
                    <option value="prefer-not-to-say">暂不提供</option>
                    <option value="female">女</option>
                    <option value="male">男</option>
                    <option value="other">其他</option>
                  </select>
                </label>
                <label className="space-y-2 text-xs font-medium text-ink">
                  <span>时区</span>
                  <select
                    value={birth?.timezone ?? "Asia/Shanghai"}
                    onChange={(event) => setBirth("timezone", event.target.value)}
                    className="w-full rounded-lg border border-night/10 bg-[oklch(0.99_0.004_92)] px-3 py-2.5 text-sm"
                  >
                    <option value="Asia/Shanghai">中国标准时间</option>
                    <option value="Asia/Hong_Kong">香港时间</option>
                    <option value="Asia/Taipei">台北时间</option>
                    <option value="Asia/Singapore">新加坡时间</option>
                    <option value="Europe/London">伦敦时间</option>
                    <option value="America/New_York">纽约时间</option>
                    <option value="America/Los_Angeles">洛杉矶时间</option>
                  </select>
                </label>
                <label className="space-y-2 text-xs font-medium text-ink sm:col-span-2 lg:col-span-3">
                  <span>出生地点（可选）</span>
                  <input
                    value={birth?.place ?? ""}
                    onChange={(event) => setBirth("place", event.target.value)}
                    placeholder="例如：上海市"
                    className="w-full rounded-lg border border-night/10 bg-[oklch(0.99_0.004_92)] px-3 py-2.5 text-sm"
                  />
                </label>
              </div>

              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg border border-night/10 bg-[oklch(0.99_0.004_92)] p-4">
                <input
                  type="checkbox"
                  checked={birth?.consentToProcess ?? false}
                  onChange={(event) => setBirth("consentToProcess", event.target.checked)}
                  className="mt-0.5 size-4 accent-[oklch(0.53_0.12_245)]"
                />
                <span className="text-xs leading-5 text-mist">
                  我同意 LifeFork 使用上述出生信息生成八字或紫微斗数排盘。我知道这些内容属于传统文化解读，不能证明个人未来。
                </span>
              </label>

              {!birthReady && birthBlockers.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs font-medium text-red-700" role="alert">
                  {birthBlockers.map((blocker) => (
                    <li key={blocker}>• {blocker}</li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>

        <aside className="h-fit space-y-4 rounded-lg border border-night/10 bg-[oklch(0.99_0.004_92)] p-5 lg:sticky lg:top-24">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-blue" aria-hidden="true" />
            <h2 className="text-base font-semibold text-ink">输出会明确区分</h2>
          </div>
          <ul className="space-y-3 text-xs leading-5 text-mist">
            <li><strong className="text-ink">事实：</strong>来自用户确认的回答和材料。</li>
            <li><strong className="text-ink">统计参考：</strong>来自群体研究，不能直接当作个人概率。</li>
            <li><strong className="text-ink">模型推断：</strong>由规则或 AI 生成，需要用户核对。</li>
            <li><strong className="text-ink">性格倾向：</strong>按阶段表达，允许变化和修正。</li>
            <li><strong className="text-ink">文化解读：</strong>八字、紫微斗数单独展示，默认低权重。</li>
          </ul>
          <div className="flex gap-2 border-t border-night/10 pt-4 text-xs leading-5 text-mist">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>分支分数表示当前材料下的目标匹配程度，不表示成功率。</p>
          </div>
        </aside>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-night/10 pt-5">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStep("extra-text")}
            className="rounded-lg border border-night/15 px-5 py-2.5 text-sm text-ink hover:bg-deep"
          >
            返回补充材料
          </button>
          <button
            type="button"
            onClick={() => setStep("questions")}
            className="rounded-lg border border-night/15 px-5 py-2.5 text-sm text-ink hover:bg-deep"
          >
            回到问卷修改答案
          </button>
        </div>
        <button
          type="button"
          disabled={!birthReady}
          onClick={createSkill}
          className="rounded-lg bg-night px-6 py-2.5 text-sm font-medium text-deep disabled:cursor-not-allowed disabled:opacity-40"
        >
          生成完整分析
        </button>
      </footer>
    </section>
  );
}
