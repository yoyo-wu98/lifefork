# Dynamic MBTI Schema Brief

Status: V0.5 implemented as a reserved product slot
Owner: Product + Content Systems + Self Skill + UI
Requirement: `LF-MBTI-001`

## Product Role

MBTI in LifeFork only serves as a contextual type tendency layer:

- Dynamic tendency: the displayed type is a current tendency, not a fixed identity.
- Evidence-backed: every type readout carries `evidenceIds`, an `evidenceHint`, and a confidence value.
- Context-sensitive: the tendency can drift by Life Map branch, life stage, time scale, and stress state.

## Language Boundaries

- No deterministic personality judgment.
- No clinical framing, diagnosis, or therapy claim.
- No ranking of types.

## Schema Brief

`SelfSkill.dynamicTypeProfile?: DynamicTypeProfile`

```ts
type DynamicTypeProfile = {
  schemaVersion: "dynamic-type-profile.v0_5";
  productRole: {
    tendency: "dynamic-tendency";
    evidence: "evidence-backed";
    context: "context-sensitive";
  };
  languageBoundaries: {
    deterministicPersonalityJudgment: false;
    clinicalFraming: false;
    typeRanking: false;
  };
  baseTendency: DynamicTypeTendency;
  currentTendency: DynamicTypeTendency;
  dimensions: Record<"E_I" | "S_N" | "T_F" | "J_P", DynamicTypeDimensionSignal>;
  stageTypes: DynamicTypeStageTendency[];
  forkTypeShifts: DynamicTypeForkShift[];
  evidenceIds: string[];
  summary: string;
};
```

`ForkPath.dynamicType?: DynamicTypeBranchSignal`

```ts
type DynamicTypeBranchSignal = {
  currentTypeTendency: DynamicTypeCode;
  typeDrift: {
    fromType: DynamicTypeCode;
    toType: DynamicTypeCode;
    driftLabel: string;
    confidence: number;
    evidenceIds: string[];
    evidenceHint: string;
    contextNote: string;
  };
  confidence: number;
  evidenceIds: string[];
  evidenceHint: string;
  contextNote: string;
};
```

## Share Card Example

```text
动态类型倾向
当前类型倾向：INTP 倾向
这条人生线上的类型漂移：INFP -> INTP · 从价值确认转向假设验证
置信度：64%
证据提示：连接 3 条 Self Skill 证据，并结合该分支的时间尺度与状态变量。
```

This slot appears between the top identity/scale summary and the core conflict block.

## Life Map Branch Detail Example

Branch: `experiment-90d`

```text
动态类型读数
当前类型倾向：INTP 倾向
分支漂移：INFP -> INTP · 从价值确认转向假设验证
置信度：64%
证据提示：连接 3 条 Self Skill 证据，并结合该分支的时间尺度与状态变量。
分支语境：试验线放大 N/T/P 信号：把愿望拆成可验证样本。
```

## Implementation Map

- Core schema: `src/lib/types.ts`
- Generation rules: `src/lib/selfSkill/dynamicTypeRules.ts`
- Self Skill export: `src/lib/selfSkill/localGenerator.ts`
- Fork branch signals: `src/lib/selfSkill/forkTreeRules.ts`
- Stored data repair: `src/lib/schema/repairForkTree.ts`
- Share card slot: `src/components/ShareCard.tsx`
- Life Map branch detail: `src/components/ForkPaths/NodeDetailPanel.tsx`
- Centralized copy: `src/lib/content/copyRegistry.ts`
