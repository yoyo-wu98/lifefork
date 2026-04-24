export type SelfVersion = "future" | "past" | "fork";

export type AppStep =
  | "landing"
  | "select-version"
  | "questions"
  | "extra-text"
  | "generating"
  | "self-skill"
  | "timeline"
  | "forks"
  | "chat"
  | "share";

export interface Evidence {
  id: string;
  source: "question" | "extra_text" | "generated";
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
  editable?: boolean;
}

export interface ForkPath {
  id: string;
  title: string;
  subtitle: string;
  summary: string;
  gains: string[];
  costs: string[];
  futureSelfName: string;
  futureSelfVoice: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "instance" | "system";
  content: string;
  createdAt: string;
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
  identity: IdentityProfile;
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
}
