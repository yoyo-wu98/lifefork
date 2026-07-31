import type { ContentAttribution } from "@/lib/content/types";

export type SelfVersion = "future" | "past" | "fork";

export type AppStep =
  | "landing"
  | "select-version"
  | "questions"
  | "wechat-import"
  | "extra-text"
  | "methods"
  | "generating"
  | "self-skill"
  | "timeline"
  | "forks"
  | "chat"
  | "share"
  | "editor";

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
  methodContributions?: MethodContribution[];
}

export type AnalysisMethodId =
  | "user-evidence"
  | "behavioral-pattern"
  | "population-statistics"
  | "ai-synthesis"
  | "mbti-stage"
  | "bazi"
  | "ziwei";

export type AnalysisMethodCategory =
  | "evidence"
  | "statistical"
  | "model"
  | "psychometric"
  | "cultural";

export type AnalysisReliabilityLevel = "higher" | "medium" | "experimental" | "cultural";

export type AnalysisPresetId =
  | "evidence-first"
  | "balanced"
  | "cultural-exploration"
  | "custom";

export interface AnalysisMethodPreference {
  id: AnalysisMethodId;
  label: string;
  category: AnalysisMethodCategory;
  description: string;
  enabled: boolean;
  weight: number;
  reliability: AnalysisReliabilityLevel;
}

export interface BirthProfile {
  calendar: "solar" | "lunar";
  date: string;
  time: string;
  timeAccuracy: "exact" | "within-two-hours" | "unknown";
  timezone: string;
  place?: string;
  gender: "female" | "male" | "other" | "prefer-not-to-say";
  consentToProcess: boolean;
}

export interface AnalysisSettings {
  preset: AnalysisPresetId;
  methods: AnalysisMethodPreference[];
  birthProfile?: BirthProfile;
}

export interface MethodContribution {
  methodId: AnalysisMethodId;
  methodLabel: string;
  category: AnalysisMethodCategory;
  userWeight: number;
  confidence: number;
  contribution: number;
  evidenceIds: string[];
  rationale: string;
  limitation: string;
}

export interface IntegratedInsight {
  id: string;
  title: string;
  summary: string;
  kind: "observation" | "scenario" | "cultural-reading";
  confidence: number;
  evidenceIds: string[];
  methodContributions: MethodContribution[];
  userCanDisagree: true;
}

export interface AnalysisReference {
  id: string;
  title: string;
  url: string;
  note: string;
}

export interface MethodAnalysisResult {
  methodId: AnalysisMethodId;
  label: string;
  category: AnalysisMethodCategory;
  status: "complete" | "limited" | "disabled" | "missing-input";
  summary: string;
  details: string[];
  confidence: number;
  inputQuality: number;
  limitation: string;
  calculatedData?: Record<string, string | number | string[]>;
  references?: AnalysisReference[];
}

export interface StagePersonalityAssessment {
  id: string;
  stageLabel: string;
  ageRange: string;
  type: DynamicTypeCode;
  confidence: number;
  source: "observed" | "retrospective" | "scenario";
  description: string;
  changeDrivers: string[];
  methodContributions: MethodContribution[];
}

export interface BranchMethodExplanation {
  branchId: string;
  branchTitle: string;
  score: number;
  summary: string;
  methodContributions: MethodContribution[];
  assumptions: string[];
  unknowns: string[];
}

export interface AIExecutionMeta {
  used: boolean;
  provider: "openai" | "deepseek" | "local";
  model: string;
  fallbackReason?: string;
}

export interface IntegratedAnalysis {
  schemaVersion: "integrated-analysis.v1";
  generatedAt: string;
  preset: AnalysisPresetId;
  dataCompleteness: number;
  modelExecution: AIExecutionMeta;
  normalizedWeights: Record<AnalysisMethodId, number>;
  insights: IntegratedInsight[];
  stagePersonality: StagePersonalityAssessment[];
  methodResults: MethodAnalysisResult[];
  branchExplanations: BranchMethodExplanation[];
  limitations: string[];
}

export type DynamicTypeCode =
  | "ISTJ"
  | "ISFJ"
  | "INFJ"
  | "INTJ"
  | "ISTP"
  | "ISFP"
  | "INFP"
  | "INTP"
  | "ESTP"
  | "ESFP"
  | "ENFP"
  | "ENTP"
  | "ESTJ"
  | "ESFJ"
  | "ENFJ"
  | "ENTJ";

export type DynamicTypeDimension = "E_I" | "S_N" | "T_F" | "J_P";
export type DynamicTypePole = "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P";
export type DynamicTypeStressState = "settled" | "adaptive" | "strained";

export interface DynamicTypeProductRole {
  tendency: "dynamic-tendency";
  evidence: "evidence-backed";
  context: "context-sensitive";
}

export interface DynamicTypeLanguageBoundaries {
  deterministicPersonalityJudgment: false;
  clinicalFraming: false;
  typeRanking: false;
}

export interface DynamicTypeContext {
  branchId?: string;
  branchTitle?: string;
  lifeScale?: LifeScale;
  timeLabel?: string;
  stressState?: DynamicTypeStressState;
  note: string;
}

export interface DynamicTypeDimensionSignal {
  dimension: DynamicTypeDimension;
  tendency: DynamicTypePole;
  balance: number;
  confidence: number;
  evidenceIds: string[];
  evidenceHint: string;
}

export interface DynamicTypeTendency {
  type: DynamicTypeCode;
  label: string;
  confidence: number;
  evidenceIds: string[];
  evidenceHint: string;
  context: DynamicTypeContext;
}

export interface DynamicTypeForkShift {
  id: string;
  branchId: string;
  branchTitle: string;
  lane?: LifeLane;
  scale?: LifeScale;
  fromType: DynamicTypeCode;
  toType: DynamicTypeCode;
  driftLabel: string;
  confidence: number;
  evidenceIds: string[];
  evidenceHint: string;
  contextNote: string;
}

export interface DynamicTypeStageTendency {
  id: string;
  label: string;
  type: DynamicTypeCode;
  confidence: number;
  evidenceIds: string[];
  evidenceHint: string;
  context: DynamicTypeContext;
}

export interface DynamicTypeBranchSignal {
  currentTypeTendency: DynamicTypeCode;
  typeDrift: DynamicTypeForkShift;
  confidence: number;
  evidenceIds: string[];
  evidenceHint: string;
  contextNote: string;
}

export interface DynamicTypeProfile {
  schemaVersion: "dynamic-type-profile.v0_5";
  productRole: DynamicTypeProductRole;
  languageBoundaries: DynamicTypeLanguageBoundaries;
  baseTendency: DynamicTypeTendency;
  currentTendency: DynamicTypeTendency;
  dimensions: Record<DynamicTypeDimension, DynamicTypeDimensionSignal>;
  stageTypes: DynamicTypeStageTendency[];
  forkTypeShifts: DynamicTypeForkShift[];
  evidenceIds: string[];
  summary: string;
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

export type LifeScale = "life" | "decade" | "era" | "year" | "month" | "week" | "day" | "hour";

export type LifeLane = "stability" | "leap" | "experiment" | "relationship" | "creation";

export interface LifeTimeSpan {
  startLabel: string;
  endLabel?: string;
  durationLabel: string;
  durationMonths?: number;
  range?: LifeTimeRange;
}

export interface LifeTimeRange {
  startDay: number;
  endDay: number;
  granularity: LifeScale;
}

export type LifeMapRole = "current" | "life-container" | "checkpoint" | "period" | "event";
export type ForkContainmentRole = "root" | "container" | "checkpoint" | "period" | "event";

export interface LifeStateVector {
  autonomy: number;
  stability: number;
  intimacy: number;
  creation: number;
  energy: number;
  regret: number;
  uncertainty: number;
}

export interface Consequence {
  label: string;
  delta: Partial<LifeStateVector>;
}

export interface ForkPath {
  id: string;
  content?: ContentAttribution;
  parentId?: string;
  depth?: number;
  nodeType?: "life-node" | "life-map" | "direction" | "strategy" | "consequence" | "ending";
  mapRole?: LifeMapRole;
  containmentRole?: ForkContainmentRole;
  scale?: LifeScale;
  displayScale?: LifeScale;
  durationMonths?: number;
  orderIndex?: number;
  lane?: LifeLane;
  timeSpan?: LifeTimeSpan;
  stateVector?: LifeStateVector;
  consequences?: Consequence[];
  dynamicType?: DynamicTypeBranchSignal;
  mergeInto?: string;
  zoomHint?: string;
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
  dynamicTypeProfile?: DynamicTypeProfile;
  analysisSettings?: AnalysisSettings;
  integratedAnalysis?: IntegratedAnalysis;
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
  analysisSettings?: AnalysisSettings;
}
