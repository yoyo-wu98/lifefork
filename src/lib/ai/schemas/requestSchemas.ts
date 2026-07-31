import { ANALYSIS_METHODS, createAnalysisSettings } from "@/lib/analysis/methodRegistry";
import type {
  AnalysisMethodId,
  AnalysisPresetId,
  AnalysisSettings,
  BirthProfile,
  SelfVersion,
} from "@/lib/types";
import { AI_TOKEN_BUDGETS, truncateForPrompt } from "@/lib/ai/tokenBudget";
import { requireRecord, stringArray, stringValue, type SchemaResult } from "./common";

const SELF_VERSIONS = new Set<SelfVersion>(["future", "past", "fork"]);

function selectedVersion(value: unknown): SchemaResult<SelfVersion> {
  if (typeof value === "string" && SELF_VERSIONS.has(value as SelfVersion)) {
    return { success: true, data: value as SelfVersion };
  }
  return { success: false, error: "selectedVersion must be future, past, or fork" };
}

function requiredString(record: Record<string, unknown>, key: string): SchemaResult<string> {
  const value = stringValue(record[key]).trim();
  if (!value) return { success: false, error: `${key} is required` };
  return { success: true, data: value };
}

export interface GenerateSelfSkillRequest {
  selectedVersion: SelfVersion;
  currentChoice: string;
  recurringEmotion: string;
  pastNode: string;
  hiddenSelf: string;
  futureSentence: string;
  extraText?: string;
  wechatSummary?: string;
  analysisSettings?: AnalysisSettings;
  enableAi: boolean;
}

function parseAnalysisSettings(value: unknown): AnalysisSettings | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  const fallback = createAnalysisSettings();
  const presetValues = new Set<AnalysisPresetId>([
    "evidence-first",
    "balanced",
    "cultural-exploration",
    "custom",
  ]);
  const preset = presetValues.has(record.preset as AnalysisPresetId)
    ? (record.preset as AnalysisPresetId)
    : fallback.preset;
  const incomingMethods = Array.isArray(record.methods)
    ? new Map(
        record.methods
          .filter((method): method is Record<string, unknown> => Boolean(method && typeof method === "object"))
          .map((method) => [method.id, method]),
      )
    : new Map<unknown, Record<string, unknown>>();
  const methods = fallback.methods.map((method) => {
    const incoming = incomingMethods.get(method.id);
    return {
      ...ANALYSIS_METHODS[method.id],
      enabled: typeof incoming?.enabled === "boolean" ? incoming.enabled : method.enabled,
      weight:
        typeof incoming?.weight === "number" && Number.isFinite(incoming.weight)
          ? Math.max(0, Math.min(100, incoming.weight))
          : method.weight,
    };
  });

  let birthProfile: BirthProfile | undefined;
  if (record.birthProfile && typeof record.birthProfile === "object" && !Array.isArray(record.birthProfile)) {
    const birth = record.birthProfile as Record<string, unknown>;
    const calendar = birth.calendar === "lunar" ? "lunar" : "solar";
    const timeAccuracyValues = new Set<BirthProfile["timeAccuracy"]>([
      "exact",
      "within-two-hours",
      "unknown",
    ]);
    const genderValues = new Set<BirthProfile["gender"]>([
      "female",
      "male",
      "other",
      "prefer-not-to-say",
    ]);
    birthProfile = {
      calendar,
      date: truncateForPrompt(stringValue(birth.date), 16),
      time: truncateForPrompt(stringValue(birth.time, "12:00"), 8),
      timeAccuracy: timeAccuracyValues.has(birth.timeAccuracy as BirthProfile["timeAccuracy"])
        ? (birth.timeAccuracy as BirthProfile["timeAccuracy"])
        : "unknown",
      timezone: truncateForPrompt(stringValue(birth.timezone, "Asia/Shanghai"), 64),
      place: truncateForPrompt(stringValue(birth.place), 120),
      gender: genderValues.has(birth.gender as BirthProfile["gender"])
        ? (birth.gender as BirthProfile["gender"])
        : "prefer-not-to-say",
      consentToProcess: birth.consentToProcess === true,
    };
  }

  const validIds = new Set<AnalysisMethodId>(Object.keys(ANALYSIS_METHODS) as AnalysisMethodId[]);
  return {
    preset,
    methods: methods.filter((method) => validIds.has(method.id)),
    birthProfile,
  };
}

export function parseGenerateSelfSkillRequest(value: unknown): SchemaResult<GenerateSelfSkillRequest> {
  const record = requireRecord(value, "generate-self-skill request");
  if (!record.success) return record;

  const version = selectedVersion(record.data.selectedVersion);
  if (!version.success) return version;

  const currentChoice = requiredString(record.data, "currentChoice");
  if (!currentChoice.success) return currentChoice;

  const recurringEmotion = requiredString(record.data, "recurringEmotion");
  if (!recurringEmotion.success) return recurringEmotion;

  const pastNode = requiredString(record.data, "pastNode");
  if (!pastNode.success) return pastNode;

  const hiddenSelf = requiredString(record.data, "hiddenSelf");
  if (!hiddenSelf.success) return hiddenSelf;

  const futureSentence = requiredString(record.data, "futureSentence");
  if (!futureSentence.success) return futureSentence;

  const budget = AI_TOKEN_BUDGETS.selfSkill.maxInputChars;
  return {
    success: true,
    data: {
      selectedVersion: version.data,
      currentChoice: truncateForPrompt(currentChoice.data, budget.currentChoice),
      recurringEmotion: truncateForPrompt(recurringEmotion.data, budget.recurringEmotion),
      pastNode: truncateForPrompt(pastNode.data, budget.pastNode),
      hiddenSelf: truncateForPrompt(hiddenSelf.data, budget.hiddenSelf),
      futureSentence: truncateForPrompt(futureSentence.data, budget.futureSentence),
      extraText: truncateForPrompt(stringValue(record.data.extraText), budget.extraText) || undefined,
      wechatSummary: truncateForPrompt(stringValue(record.data.wechatSummary), budget.wechatSummary) || undefined,
      analysisSettings: parseAnalysisSettings(record.data.analysisSettings),
      enableAi: record.data.enableAi !== false,
    },
  };
}

export interface ChatRequest {
  selfSkillSummary: string;
  forkTitle: string;
  forkSummary: string;
  forkScale: string;
  forkGains: string[];
  forkCosts: string[];
  forkFutureSelfVoice: string;
  voiceProfile: string;
  stageVoice: string;
  calibrationNotes: string[];
  conversationHistory: string;
  userMessage: string;
}

export function parseChatRequest(value: unknown): SchemaResult<ChatRequest> {
  const record = requireRecord(value, "chat request");
  if (!record.success) return record;

  const budget = AI_TOKEN_BUDGETS.dialogue.maxInputChars;
  const userMessage = truncateForPrompt(stringValue(record.data.userMessage), budget.userMessage);
  if (!userMessage.trim()) {
    return { success: false, error: "userMessage is required" };
  }

  return {
    success: true,
    data: {
      selfSkillSummary: truncateForPrompt(stringValue(record.data.selfSkillSummary), budget.selfSkillSummary),
      forkTitle: truncateForPrompt(stringValue(record.data.forkTitle), 120),
      forkSummary: truncateForPrompt(stringValue(record.data.forkSummary), budget.forkSummary),
      forkScale: truncateForPrompt(stringValue(record.data.forkScale, "当前"), 80),
      forkGains: stringArray(record.data.forkGains).slice(0, 8),
      forkCosts: stringArray(record.data.forkCosts).slice(0, 8),
      forkFutureSelfVoice: truncateForPrompt(stringValue(record.data.forkFutureSelfVoice), 300),
      voiceProfile: truncateForPrompt(stringValue(record.data.voiceProfile), budget.voiceProfile),
      stageVoice: truncateForPrompt(stringValue(record.data.stageVoice), budget.stageVoice),
      calibrationNotes: stringArray(record.data.calibrationNotes).slice(0, 8),
      conversationHistory: truncateForPrompt(stringValue(record.data.conversationHistory), budget.conversationHistory),
      userMessage,
    },
  };
}

export interface WechatAnalyzeRequest {
  localSummary: string;
}

export function parseWechatAnalyzeRequest(value: unknown): SchemaResult<WechatAnalyzeRequest> {
  const record = requireRecord(value, "wechat-analyze request");
  if (!record.success) return record;

  const localSummary = truncateForPrompt(
    stringValue(record.data.localSummary),
    AI_TOKEN_BUDGETS.wechat.maxInputChars.localSummary,
  );
  if (!localSummary.trim()) return { success: false, error: "localSummary is required" };
  return { success: true, data: { localSummary } };
}

export async function readJsonRequest(
  request: Request,
  maxChars = 1_000_000,
): Promise<SchemaResult<unknown>> {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > maxChars * 4) {
    return { success: false, error: "Request body is too large" };
  }
  try {
    const text = await request.text();
    if (text.length > maxChars) {
      return { success: false, error: "Request body is too large" };
    }
    return { success: true, data: JSON.parse(text) };
  } catch {
    return { success: false, error: "Request body must be valid JSON" };
  }
}
