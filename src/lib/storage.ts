import { migrateSelfSkill } from "@/lib/schema/migrations";
import { ANALYSIS_METHODS, createAnalysisSettings } from "@/lib/analysis/methodRegistry";
import type {
  AnalysisMethodPreference,
  AnalysisPresetId,
  AnalysisSettings,
  AppStep,
  ChatMessage,
  ForkPath,
  SelfSkill,
  SelfVersion,
  WeChatAnalysis,
} from "@/lib/types";
import type { Answers } from "@/lib/stores/types";

const KEY_SELF_SKILL = "lifefork.selfSkill";
const KEY_STEP = "lifefork.currentStep";
const KEY_FORK = "lifefork.selectedFork";
const KEY_CHAT = "lifefork.chatMessages";
const KEY_WECHAT_ANALYSIS = "lifefork.wechatAnalysis";
const KEY_LIFE_MAP_OFFSETS = "lifefork.lifeMapOffsets";
const KEY_ANALYSIS_SETTINGS = "lifefork.analysisSettings";
const KEY_ANSWERS = "lifefork.answers";
const KEY_EXTRA_TEXT = "lifefork.extraText";
const KEY_SELECTED_VERSION = "lifefork.selectedVersion";

const answerKeys: Array<keyof Answers> = [
  "currentChoice",
  "recurringEmotion",
  "pastNode",
  "hiddenSelf",
  "futureSentence",
];

const appSteps = new Set<AppStep>([
  "landing",
  "select-version",
  "questions",
  "wechat-import",
  "extra-text",
  "methods",
  "generating",
  "self-skill",
  "timeline",
  "forks",
  "chat",
  "share",
  "editor",
]);

const getStorage = (): Storage | null => {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
};

const safeParse = <T>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const read = (key: string): string | null => {
  try {
    return getStorage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
};

const write = (key: string, value: string) => {
  try {
    getStorage()?.setItem(key, value);
  } catch {
    // Storage can fail in private mode, quota errors, or blocked browser contexts.
  }
};

const remove = (key: string) => {
  try {
    getStorage()?.removeItem(key);
  } catch {
    // Ignore storage cleanup failures; app state should still remain usable.
  }
};

export const saveSelfSkill = (selfSkill: SelfSkill) => write(KEY_SELF_SKILL, JSON.stringify(selfSkill));
export const loadSelfSkill = (): SelfSkill | null => migrateSelfSkill(safeParse<unknown>(read(KEY_SELF_SKILL)));

export const saveAnswers = (answers: Answers) => write(KEY_ANSWERS, JSON.stringify(answers));
export const loadAnswers = (): Answers | null => {
  const stored = safeParse<Partial<Answers>>(read(KEY_ANSWERS));
  if (!stored) return null;
  return answerKeys.reduce<Answers>(
    (answers, key) => ({
      ...answers,
      [key]: typeof stored[key] === "string" ? stored[key] : "",
    }),
    {
      currentChoice: "",
      recurringEmotion: "",
      pastNode: "",
      hiddenSelf: "",
      futureSentence: "",
    },
  );
};

export const saveExtraText = (value: string) => {
  if (!value) {
    remove(KEY_EXTRA_TEXT);
    return;
  }
  write(KEY_EXTRA_TEXT, value);
};
export const loadExtraText = () => read(KEY_EXTRA_TEXT) ?? "";

export const saveSelectedVersion = (version: SelfVersion | null) => {
  if (!version) {
    remove(KEY_SELECTED_VERSION);
    return;
  }
  write(KEY_SELECTED_VERSION, version);
};
export const loadSelectedVersion = (): SelfVersion | null => {
  const value = read(KEY_SELECTED_VERSION);
  return value === "future" || value === "past" || value === "fork" ? value : null;
};

export const saveStep = (step: AppStep) => {
  if (step === "landing") {
    remove(KEY_STEP);
    return;
  }
  write(KEY_STEP, step);
};
export const loadStep = (): AppStep | null => {
  const step = read(KEY_STEP) as AppStep | null;
  return step && appSteps.has(step) ? step : null;
};

export const saveSelectedFork = (fork: ForkPath | null) => {
  if (!fork) {
    remove(KEY_FORK);
    return;
  }
  write(KEY_FORK, JSON.stringify(fork));
};
export const loadSelectedFork = (): ForkPath | null => safeParse<ForkPath>(read(KEY_FORK));

export const saveChatMessages = (messages: ChatMessage[]) => {
  if (!messages.length) {
    remove(KEY_CHAT);
    return;
  }
  write(KEY_CHAT, JSON.stringify(messages));
};
export const loadChatMessages = (): ChatMessage[] => safeParse<ChatMessage[]>(read(KEY_CHAT)) ?? [];

export const saveWeChatAnalysis = (analysis: WeChatAnalysis | null) => {
  if (!analysis) {
    remove(KEY_WECHAT_ANALYSIS);
    return;
  }
  write(KEY_WECHAT_ANALYSIS, JSON.stringify(analysis));
};
export const loadWeChatAnalysis = (): WeChatAnalysis | null => safeParse<WeChatAnalysis>(read(KEY_WECHAT_ANALYSIS));

export const saveAnalysisSettings = (settings: AnalysisSettings) =>
  write(KEY_ANALYSIS_SETTINGS, JSON.stringify(settings));

export const loadAnalysisSettings = (): AnalysisSettings => {
  const stored = safeParse<Partial<AnalysisSettings>>(read(KEY_ANALYSIS_SETTINGS));
  const fallback = createAnalysisSettings();
  const preset: AnalysisPresetId =
    stored?.preset === "balanced" ||
    stored?.preset === "cultural-exploration" ||
    stored?.preset === "custom"
      ? stored.preset
      : "evidence-first";
  const storedMethods = new Map(
    Array.isArray(stored?.methods)
      ? stored.methods.map((method) => [
          method.id,
          method as Partial<AnalysisMethodPreference>,
        ])
      : [],
  );

  return {
    preset,
    methods: fallback.methods.map((method) => {
      const saved = storedMethods.get(method.id);
      return {
        ...ANALYSIS_METHODS[method.id],
        enabled: typeof saved?.enabled === "boolean" ? saved.enabled : method.enabled,
        weight:
          typeof saved?.weight === "number"
            ? Math.max(0, Math.min(100, saved.weight))
            : method.weight,
      };
    }),
    birthProfile: stored?.birthProfile
      ? { ...fallback.birthProfile, ...stored.birthProfile }
      : fallback.birthProfile,
  };
};

export type StoredLifeMapOffsets = Record<string, { x: number; y: number }>;

export const saveLifeMapOffsets = (offsets: StoredLifeMapOffsets) => {
  if (!Object.keys(offsets).length) {
    remove(KEY_LIFE_MAP_OFFSETS);
    return;
  }
  write(KEY_LIFE_MAP_OFFSETS, JSON.stringify(offsets));
};

export const loadLifeMapOffsets = (): StoredLifeMapOffsets =>
  safeParse<StoredLifeMapOffsets>(read(KEY_LIFE_MAP_OFFSETS)) ?? {};

export const clearAll = () => {
  [
    KEY_SELF_SKILL,
    KEY_STEP,
    KEY_FORK,
    KEY_CHAT,
    KEY_WECHAT_ANALYSIS,
    KEY_LIFE_MAP_OFFSETS,
    KEY_ANALYSIS_SETTINGS,
    KEY_ANSWERS,
    KEY_EXTRA_TEXT,
    KEY_SELECTED_VERSION,
  ].forEach(remove);
};
