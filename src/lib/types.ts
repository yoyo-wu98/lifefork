export type SelfVersion = "future" | "past" | "fork";

export type AppStep =
  | "landing"
  | "select-version"
  | "questions"
  | "wechat-import"
  | "extra-text"
  | "generating"
  | "self-skill"
  | "timeline"
  | "forks"
  | "chat"
  | "share";

export interface Evidence {
  id: string;
  source: "question" | "extra_text" | "wechat" | "generated";
  quote: string;
}

export interface Claim {
  id: string;
  text: string;
  confidence: number;
  evidenceIds: string[];
}

export interface IdentityProfile {
  displayName: string;
  languageStyle: string;
  emotionalTone: string;
  selfNarrative: string;
  archetype: string;
}

export interface SemanticProfile {
  values: string[];
  fears: string[];
  desires: string[];
  recurringPatterns: string[];
  innerConflict: string;
  lifeMotif: string;
}

export interface DecisionModel {
  riskPreference: string;
  workStyle: string;
  conflictStyle: string;
  changeTolerance: string;
  attachmentPattern: string;
}

export interface TimelineNode {
  id: string;
  yearLabel: string;
  title: string;
  emotion: string;
  pattern: string;
  voice?: StageVoice;
  editable?: boolean;
}

export interface ForkPath {
  id: string;
  parentId?: string;
  depth?: number;
  nodeType?: "life-node" | "direction" | "strategy" | "consequence" | "ending";
  title: string;
  subtitle: string;
  summary: string;
  gains: string[];
  costs: string[];
  futureSelfName: string;
  futureSelfVoice: string;
  children?: ForkPath[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "instance" | "system";
  content: string;
  createdAt: string;
}

export interface VoiceProfile {
  toneName: string;
  closenessScore: number;
  traits: string[];
  signaturePhrases: string[];
  sentenceRhythm: string;
  punctuationStyle: string;
  emotionalGesture: string;
  sampleLine: string;
  calibrationNotes: string[];
}

export interface StageVoice {
  id: string;
  stage: "past" | "hidden" | "present" | "future" | "fork";
  ageLabel: string;
  toneName: string;
  description: string;
  sampleLine: string;
  traits: string[];
}

export interface WeChatMessageSample {
  id: string;
  timeLabel?: string;
  speaker: string;
  content: string;
}

export interface WeChatAnalysis {
  id: string;
  createdAt: string;
  sourceName: string;
  rawLength: number;
  parsedMessageCount: number;
  participantCount: number;
  participants: string[];
  dateRange?: string;
  topKeywords: string[];
  recurringTopics: string[];
  emotionalSignals: string[];
  keyMoments: WeChatMessageSample[];
  privacyNotes: string[];
  summary: string;
  selfSkillSignals: string[];
  suggestedSelfSkillText: string;
}

export interface SelfSkill {
  id: string;
  version: string;
  createdAt: string;
  selectedVersion: SelfVersion;
  questions: {
    currentChoice: string;
    recurringEmotion: string;
    pastNode: string;
    hiddenSelf: string;
    futureSentence: string;
  };
  extraText?: string;
  wechatAnalysis?: WeChatAnalysis;
  identity: IdentityProfile;
  voice: VoiceProfile;
  stageVoices: StageVoice[];
  semantic: SemanticProfile;
  decision: DecisionModel;
  timeline: TimelineNode[];
  evidence: Evidence[];
  claims: Claim[];
  forks: ForkPath[];
}

export interface GenerateSelfSkillInput {
  selectedVersion: SelfVersion;
  currentChoice: string;
  recurringEmotion: string;
  pastNode: string;
  hiddenSelf: string;
  futureSentence: string;
  extraText?: string;
  wechatAnalysis?: WeChatAnalysis;
  voiceCalibration?: string[];
}
