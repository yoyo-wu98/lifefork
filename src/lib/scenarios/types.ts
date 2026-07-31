import type { ForkPath, LifeLane, LifeScale, SelfSkill } from "@/lib/types";

export type ScenarioOwner = "Life Scenario Lab Team";

export type ScenarioStatus = "draft" | "ready" | "validated";

export type ScenarioEntryMode = "map" | "timeline" | "chat" | "share";

export type ScenarioNodeSource = "history" | "current" | "fork" | "choice-set";

export type AtLeastTwo<T> = readonly [T, T, ...T[]];

export type CanonicalDemoPersona = {
  id: string;
  displayName: string;
  premise: string;
  ageRangeLabel: string;
  coreValues: readonly string[];
  corePressures: readonly string[];
  narrativeVoice: string;
  demoBoundaries: readonly string[];
};

export type ScenarioLifeStageId =
  | "birth"
  | "early-childhood"
  | "adolescence"
  | "university-or-early-adult"
  | "first-career-identity"
  | "relationship-pressure"
  | "major-fork"
  | "stabilization-or-leap"
  | "illness-or-aging"
  | "late-life-reflection"
  | "death";

export type ScenarioLifeStage = {
  id: ScenarioLifeStageId;
  label: string;
  ageRangeLabel: string;
  primaryNodeId: string;
  supportingNodeIds?: readonly string[];
  purpose: string;
  entryModes: readonly ScenarioEntryMode[];
};

export type ScenarioChoiceEntry =
  | {
      mode: "rendered-node";
      nodeId: string;
      requiredEntryModes?: readonly ScenarioEntryMode[];
    }
  | {
      mode: "lazy-node";
      templateId: string;
      scale: LifeScale;
      lane?: LifeLane;
      title: string;
      summary: string;
      requiredEntryModes?: readonly ScenarioEntryMode[];
    };

export type ScenarioChoiceRecurrence = {
  cadence: "yearly" | "monthly";
  startAge: number;
  endAge: number;
  minOptionsPerPeriod: number;
  materialization: "lazy";
  note: string;
};

export type ScenarioChoiceOption = {
  id: string;
  label: string;
  intent: string;
  summary: string;
  entry: ScenarioChoiceEntry;
  qaTags?: readonly string[];
};

export type ScenarioChoiceSet = {
  id: string;
  owner: ScenarioOwner;
  sourceNodeId: string;
  scale: LifeScale;
  timeAnchor: string;
  question: string;
  recurrence?: ScenarioChoiceRecurrence;
  options: AtLeastTwo<ScenarioChoiceOption>;
  qaTags?: readonly string[];
};

export type RepresentativePathStep = {
  order: number;
  nodeId: string;
  source: ScenarioNodeSource;
  scale: LifeScale;
  ageLabel: string;
  title: string;
  entryModes: readonly ScenarioEntryMode[];
  replayNote: string;
};

export type ScenarioReplayBranchId = "representative-complete" | "stable" | "leap" | "experiment" | "relationship";

export type ScenarioReplayBranch = {
  id: ScenarioReplayBranchId;
  label: string;
  description: string;
  pathNodeIds: readonly string[];
  relatedChoiceSetIds: readonly string[];
  requiredEntryModes: readonly ScenarioEntryMode[];
  qaFocus: readonly string[];
};

export type ScenarioChoiceSetQaChecklistItem = {
  id: string;
  choiceSetId: string;
  sourceNodeId: string;
  expectedMinimumOptions: number;
  selectableOptionIds: AtLeastTwo<string>;
  requiredChecks: readonly string[];
};

export type ScenarioBoundaryCase = {
  id: string;
  title: string;
  risk: string;
  expectedBehavior: string;
  sourceChoiceSetId?: string;
  sourceNodeId?: string;
};

export type ScenarioScaleCoverage = Record<LifeScale, string>;

export type ScenarioQaAcceptance = {
  visibleNodeBudget: number;
  renderedNodeCount: number;
  scaleCoverage: ScenarioScaleCoverage;
  requiredLifeStageIds: readonly ScenarioLifeStageId[];
  replayBranchIds: readonly ScenarioReplayBranchId[];
  representativePathNodeIds: readonly string[];
  requiredEntryModes: readonly ScenarioEntryMode[];
  boundaryCaseIds: readonly string[];
  choiceSetMinOptions: number;
};

export type FullLifeScenarioFixture = {
  id: string;
  version: string;
  title: string;
  owner: ScenarioOwner;
  status: ScenarioStatus;
  createdAt: string;
  description: string;
  canonicalPersona: CanonicalDemoPersona;
  lifeStages: readonly ScenarioLifeStage[];
  selfSkill: SelfSkill;
  renderedForks: readonly ForkPath[];
  choiceSets: readonly ScenarioChoiceSet[];
  representativePath: readonly RepresentativePathStep[];
  replayBranches: readonly ScenarioReplayBranch[];
  choiceSetQaChecklist: readonly ScenarioChoiceSetQaChecklistItem[];
  boundaryCases: readonly ScenarioBoundaryCase[];
  qaAcceptance: ScenarioQaAcceptance;
};
