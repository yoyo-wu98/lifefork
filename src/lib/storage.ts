import { AppStep, ChatMessage, ForkPath, SelfSkill, WeChatAnalysis } from "@/lib/types";

const KEY_SELF_SKILL = "lifefork.selfSkill";
const KEY_STEP = "lifefork.currentStep";
const KEY_FORK = "lifefork.selectedFork";
const KEY_CHAT = "lifefork.chatMessages";
const KEY_WECHAT_ANALYSIS = "lifefork.wechatAnalysis";

const safeParse = <T>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const saveSelfSkill = (selfSkill: SelfSkill) => localStorage.setItem(KEY_SELF_SKILL, JSON.stringify(selfSkill));
export const loadSelfSkill = (): SelfSkill | null => safeParse<SelfSkill>(localStorage.getItem(KEY_SELF_SKILL));

export const saveStep = (step: AppStep) => {
  if (step === "landing") {
    localStorage.removeItem(KEY_STEP);
    return;
  }
  localStorage.setItem(KEY_STEP, step);
};
export const loadStep = (): AppStep | null => localStorage.getItem(KEY_STEP) as AppStep | null;

export const saveSelectedFork = (fork: ForkPath | null) => {
  if (!fork) {
    localStorage.removeItem(KEY_FORK);
    return;
  }
  localStorage.setItem(KEY_FORK, JSON.stringify(fork));
};
export const loadSelectedFork = (): ForkPath | null => safeParse<ForkPath>(localStorage.getItem(KEY_FORK));

export const saveChatMessages = (messages: ChatMessage[]) => {
  if (!messages.length) {
    localStorage.removeItem(KEY_CHAT);
    return;
  }
  localStorage.setItem(KEY_CHAT, JSON.stringify(messages));
};
export const loadChatMessages = (): ChatMessage[] => safeParse<ChatMessage[]>(localStorage.getItem(KEY_CHAT)) ?? [];

export const saveWeChatAnalysis = (analysis: WeChatAnalysis | null) => {
  if (!analysis) {
    localStorage.removeItem(KEY_WECHAT_ANALYSIS);
    return;
  }
  localStorage.setItem(KEY_WECHAT_ANALYSIS, JSON.stringify(analysis));
};
export const loadWeChatAnalysis = (): WeChatAnalysis | null => safeParse<WeChatAnalysis>(localStorage.getItem(KEY_WECHAT_ANALYSIS));

export const clearAll = () => {
  [KEY_SELF_SKILL, KEY_STEP, KEY_FORK, KEY_CHAT, KEY_WECHAT_ANALYSIS].forEach((key) => localStorage.removeItem(key));
};
