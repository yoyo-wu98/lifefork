import { AppStep, ChatMessage, ForkPath, SelfSkill } from "@/lib/types";

const KEY_SELF_SKILL = "lifefork.selfSkill";
const KEY_STEP = "lifefork.currentStep";
const KEY_FORK = "lifefork.selectedFork";
const KEY_CHAT = "lifefork.chatMessages";

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

export const saveStep = (step: AppStep) => localStorage.setItem(KEY_STEP, step);
export const loadStep = (): AppStep | null => localStorage.getItem(KEY_STEP) as AppStep | null;

export const saveSelectedFork = (fork: ForkPath) => localStorage.setItem(KEY_FORK, JSON.stringify(fork));
export const loadSelectedFork = (): ForkPath | null => safeParse<ForkPath>(localStorage.getItem(KEY_FORK));

export const saveChatMessages = (messages: ChatMessage[]) => localStorage.setItem(KEY_CHAT, JSON.stringify(messages));
export const loadChatMessages = (): ChatMessage[] => safeParse<ChatMessage[]>(localStorage.getItem(KEY_CHAT)) ?? [];

export const clearAll = () => {
  [KEY_SELF_SKILL, KEY_STEP, KEY_FORK, KEY_CHAT].forEach((key) => localStorage.removeItem(key));
};
