import {
  APP_NAV_COPY,
  DISCLAIMER_COPY,
  FUTURE_SELF_LINES_COPY,
  LANDING_PAGE_COPY,
} from "@/lib/content/copyRegistry";

const KEY_EDITOR_CONFIG = "lifefork.editorConfig";
export const EDITOR_CONFIG_VERSION = "v0.8-public-beta";

const LEGACY_HEADLINE = ["你一直在变化。", "像一条正在分岔的河流。"] as const;
const LEGACY_LANDING_BODY =
  "LifeFork 会先用五个问题整理你的记忆、选择、恐惧、愿望和语言，生成一个可以对话的 Self Skill。之后，你仍然可以在时间线里见到过去的你，在人生地图里进入未来自我和那些没有选择的人生。";
const LEGACY_DISCLAIMER =
  "LifeFork 不预测命运，不替你做决定。它把你提供的信息整理成可对话的镜子和草稿。V0 原型不会上传数据，内容仅保存在浏览器 localStorage；请勿把它当作心理治疗或医疗建议。";
const LEGACY_FUTURE_LINES = new Set([
  "不要把安全感误认为活着，也不要把冲动误认为自由。",
  "你走得慢一点，也许只是终于不想再走错别人的路。",
  "有些人生来自一次次诚实的试验。",
  "你最需要的也许是一场不会背叛自己的实验。",
  "你以为自己在寻找方向，其实你在寻找一种可以承认自己的生活。",
  "真正困住你的，可能是那种“选择只能有两种”的错觉。",
  "如果不能立刻改变人生，就先改变你验证人生的方式。",
]);

export interface EditorConfig {
  version: string;
  updatedAt: string;
  landing: {
    brandKicker: string;
    headline: [string, string];
    body: string;
    primaryAction: string;
    secondaryAction: string;
  };
  global: {
    disclaimer: string;
    deploymentMode: "local-preview" | "static-hosted" | "server-hosted";
    aiMode: "local-fallback" | "api-enhanced";
    editorNotes: string;
  };
  nav: {
    home: string;
    selfSkill: string;
    timeline: string;
    lifeMap: string;
    currentDialogue: string;
    shareCard: string;
    demoScenario: string;
    editor: string;
    reset: string;
  };
  share: {
    futureSelfLines: string[];
  };
  features: {
    demoScenario: boolean;
    wechatImport: boolean;
    aiApi: boolean;
    editorConsole: boolean;
  };
}

export function createDefaultEditorConfig(): EditorConfig {
  const landing = LANDING_PAGE_COPY.value;
  const navActions = APP_NAV_COPY.value.actions;

  return {
    version: EDITOR_CONFIG_VERSION,
    updatedAt: new Date().toISOString(),
    landing: {
      brandKicker: landing.brandKicker,
      headline: [
        landing.headline[0] ?? "用 5 个问题分析你现在的选择。",
        landing.headline[1] ?? "比较不同方案，再决定下一步。",
      ],
      body: landing.body,
      primaryAction: landing.primaryAction,
      secondaryAction: landing.secondaryAction,
    },
    global: {
      disclaimer: DISCLAIMER_COPY.value,
      deploymentMode: "server-hosted",
      aiMode: "api-enhanced",
      editorNotes: "公开测试版使用服务端 AI 网关。个人分析保存在浏览器，API 密钥仅存在于服务器。",
    },
    nav: {
      home: navActions.home,
      selfSkill: navActions.selfSkill,
      timeline: navActions.timeline,
      lifeMap: navActions.lifeMap,
      currentDialogue: navActions.currentDialogue,
      shareCard: navActions.shareCard,
      demoScenario: navActions.demoScenario,
      editor: "本地编辑台",
      reset: navActions.reset,
    },
    share: {
      futureSelfLines: [...FUTURE_SELF_LINES_COPY.value],
    },
    features: {
      demoScenario: true,
      wechatImport: true,
      aiApi: true,
      editorConsole: false,
    },
  };
}

const getStorage = (): Storage | null => {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
};

const normalizeEditorConfig = (value: Partial<EditorConfig> | null | undefined): EditorConfig => {
  const defaults = createDefaultEditorConfig();
  if (!value || typeof value !== "object") return defaults;
  const migrateToPublicBeta = value.version !== EDITOR_CONFIG_VERSION;
  const storedHeadline = value.landing?.headline;
  const useDefaultHeadline =
    !storedHeadline ||
    (storedHeadline[0] === LEGACY_HEADLINE[0] &&
      storedHeadline[1] === LEGACY_HEADLINE[1]);
  const storedFutureLines = value.share?.futureSelfLines;
  const useDefaultFutureLines =
    !storedFutureLines?.length ||
    storedFutureLines.every((line) => LEGACY_FUTURE_LINES.has(line));

  return {
    ...defaults,
    ...value,
    version: EDITOR_CONFIG_VERSION,
    updatedAt: value.updatedAt ?? defaults.updatedAt,
    landing: {
      ...defaults.landing,
      ...(value.landing ?? {}),
      headline: useDefaultHeadline
        ? defaults.landing.headline
        : [
            storedHeadline[0] ?? defaults.landing.headline[0],
            storedHeadline[1] ?? defaults.landing.headline[1],
          ],
      body:
        value.landing?.body === LEGACY_LANDING_BODY
          ? defaults.landing.body
          : value.landing?.body ?? defaults.landing.body,
      primaryAction:
        value.landing?.primaryAction === "开始五问" ||
        value.landing?.primaryAction === "开始见未来的我"
          ? defaults.landing.primaryAction
          : value.landing?.primaryAction ?? defaults.landing.primaryAction,
      secondaryAction:
        value.landing?.secondaryAction === "查看示例体验" ||
        value.landing?.secondaryAction === "查看示例"
          ? defaults.landing.secondaryAction
          : value.landing?.secondaryAction ?? defaults.landing.secondaryAction,
    },
    global: {
      ...defaults.global,
      ...(migrateToPublicBeta ? {} : value.global ?? {}),
      disclaimer:
        migrateToPublicBeta || value.global?.disclaimer === LEGACY_DISCLAIMER
          ? defaults.global.disclaimer
          : value.global?.disclaimer ?? defaults.global.disclaimer,
    },
    nav: {
      ...defaults.nav,
      ...(value.nav ?? {}),
      selfSkill:
        value.nav?.selfSkill === "自我画像"
          ? defaults.nav.selfSkill
          : value.nav?.selfSkill ?? defaults.nav.selfSkill,
      currentDialogue:
        value.nav?.currentDialogue === "当前对话"
          ? defaults.nav.currentDialogue
          : value.nav?.currentDialogue ?? defaults.nav.currentDialogue,
      lifeMap:
        value.nav?.lifeMap === "人生地图"
          ? defaults.nav.lifeMap
          : value.nav?.lifeMap ?? defaults.nav.lifeMap,
      shareCard:
        value.nav?.shareCard === "分享卡片"
          ? defaults.nav.shareCard
          : value.nav?.shareCard ?? defaults.nav.shareCard,
      demoScenario:
        value.nav?.demoScenario === "演示样本"
          ? defaults.nav.demoScenario
          : value.nav?.demoScenario ?? defaults.nav.demoScenario,
      editor:
        value.nav?.editor && value.nav.editor !== "后台编辑"
          ? value.nav.editor
          : defaults.nav.editor,
    },
    share: {
      ...defaults.share,
      ...(value.share ?? {}),
      futureSelfLines: useDefaultFutureLines
        ? defaults.share.futureSelfLines
        : storedFutureLines ?? defaults.share.futureSelfLines,
    },
    features: migrateToPublicBeta
      ? defaults.features
      : { ...defaults.features, ...(value.features ?? {}) },
  };
};

export function loadEditorConfig(): EditorConfig {
  try {
    const raw = getStorage()?.getItem(KEY_EDITOR_CONFIG);
    if (!raw) return createDefaultEditorConfig();
    return normalizeEditorConfig(JSON.parse(raw) as Partial<EditorConfig>);
  } catch {
    return createDefaultEditorConfig();
  }
}

export function saveEditorConfig(config: EditorConfig): EditorConfig {
  const normalized = normalizeEditorConfig({
    ...config,
    version: EDITOR_CONFIG_VERSION,
    updatedAt: new Date().toISOString(),
  });

  try {
    getStorage()?.setItem(KEY_EDITOR_CONFIG, JSON.stringify(normalized));
  } catch {
    // Keep UI usable if localStorage is blocked or quota-limited.
  }

  return normalized;
}

export function resetEditorConfig(): EditorConfig {
  const defaults = createDefaultEditorConfig();
  try {
    getStorage()?.removeItem(KEY_EDITOR_CONFIG);
  } catch {
    // Ignore reset failures. The returned default config still updates runtime state.
  }
  return defaults;
}

export function parseEditorConfigJson(text: string): EditorConfig {
  return normalizeEditorConfig(JSON.parse(text) as Partial<EditorConfig>);
}
