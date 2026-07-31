export type ContentOwner = "content-systems-narrative-architecture";

export type ContentSurface =
  | "global"
  | "landing"
  | "version-selector"
  | "five-questions"
  | "wechat-import"
  | "self-skill-panel"
  | "timeline"
  | "page"
  | "navigation"
  | "loading"
  | "life-map"
  | "chat"
  | "share-card"
  | "ai-output"
  | "dynamic-event"
  | "dynamic-type"
  | "safety";

export type ContentIntent =
  | "set-expectation"
  | "guide-progress"
  | "frame-choice"
  | "simulate-life-path"
  | "summarize-result"
  | "prompt-output-style"
  | "risk-disclosure"
  | "action-label"
  | "dynamic-type-label"
  | "dialogue-guidance";

export type ContentTone = "clear" | "restrained" | "reflective" | "warm" | "direct" | "narrative" | "careful";

export type ContentRiskLevel = "low" | "medium" | "high";

export interface ContentAttribution {
  id: string;
  surface: ContentSurface;
  intent: ContentIntent;
  tone: ContentTone;
  riskLevel: ContentRiskLevel;
  owner: ContentOwner;
  version: string;
}

export interface CopyEntry<TValue> extends ContentAttribution {
  value: TValue;
  notes?: string;
}

export interface LifeMapNarrativeTemplate {
  title: string;
  subtitle: string;
  summary: (choice: string) => string;
  gains: string[];
  costs: string[];
  futureSelfName: string;
  futureSelfVoice: string;
  zoomHint?: string;
}

export interface ShareCardTemplate {
  brandKicker: string;
  labels: {
    archetype: string;
    scale: string;
    innerConflict: string;
    currentChoice: string;
    dynamicType: string;
    currentTypeTendency: string;
    typeDrift: string;
    confidence: string;
    evidenceHint: string;
  };
  clipboardLabels: {
    intro: string;
    archetype: string;
    innerConflict: string;
    currentChoice: string;
    timePoint: string;
    futureSelfLine: string;
    currentTypeTendency: string;
    typeDrift: string;
    confidence: string;
    evidenceHint: string;
  };
  actions: {
    copyResult: string;
    exportJson: string;
    refreshFutureSelfLine: string;
    backToMap: string;
    restart: string;
  };
  footerBrand: string;
  footerLine: string;
  exportFileName: string;
}

export interface DynamicTypeContentCopy {
  productRole: {
    tendency: string;
    evidence: string;
    context: string;
  };
  languageBoundaries: {
    deterministicPersonalityJudgment: string;
    clinicalFraming: string;
    typeRanking: string;
  };
  branchDetailLabels: {
    title: string;
    currentTypeTendency: string;
    typeDrift: string;
    confidence: string;
    evidenceHint: string;
    contextNote: string;
  };
}

export interface PromptOutputPolicy {
  principles: string[];
  canonicalTerms: Record<string, string>;
  avoid: string[];
  highRiskBoundary: string;
}

export interface ContentAuditIssue {
  id: string;
  message: string;
  severity: "error" | "warning";
}
