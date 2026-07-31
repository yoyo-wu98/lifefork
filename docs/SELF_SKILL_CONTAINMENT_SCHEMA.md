# Self Skill Containment Schema Brief

Owner: Self Skill & Simulation Engine Team
Status: implemented for LF-MAP-004 handoff

## Schema Contract

`ForkPath.scale` remains the semantic time scale used by existing Life Map code. `ForkPath.displayScale` is the visual scale Life Map may choose independently. A 3-year node should use:

```ts
{
  scale: "era",
  displayScale: "era",
  durationMonths: 36,
  timeSpan: {
    durationLabel: "3 年",
    durationMonths: 36,
    range: { startDay: 0, endDay: 1095, granularity: "era" }
  }
}
```

Containment fields:

- `durationMonths`: normalized duration for fast UI/layout checks.
- `displayScale`: visual presentation scale, separate from raw duration.
- `containmentRole`: `root | container | checkpoint | period | event`.
- `orderIndex`: stable sibling order assigned by `normalizeForkTree`.
- `timeSpan.range`: canonical numeric containment range in days.

Validation entrypoint: `validateForkHierarchy(paths)` from `src/lib/selfSkill/containmentValidation.ts`.

Stable Life Map fixture: `lifeMapTeamFixture` from `src/lib/selfSkill/containmentFixtures.ts`.

## Valid Examples

1. `3 年后` is an era node, not a decade node: `durationMonths: 36`, `scale: "era"`, `displayScale: "era"`.
2. `第 1 周` is nested under `90 天`; child range `0..7` falls inside parent range `0..90`.
3. `10 年后` is a sibling checkpoint under the life container, not a child of `90 天`.

## Invalid Examples

1. `第 1 周` directly under a life-level parent returns `illegal-scale-attachment`.
2. A nested node whose declared `parentId` does not match its actual parent returns `parent-id-mismatch`.
3. `10 年后` under `90 天` returns `time-range-outside-parent`; if its sibling index is changed, it also returns `unstable-order-index`.

## QA Expected Output

`qaExpectedHierarchyViolations` intentionally returns stable codes:

```json
[
  { "code": "parent-id-mismatch", "pathId": "invalid-week-direct" },
  { "code": "illegal-scale-attachment", "pathId": "invalid-week-direct" },
  { "code": "unstable-order-index", "pathId": "invalid-10y-under-90d" },
  { "code": "time-range-outside-parent", "pathId": "invalid-10y-under-90d" }
]
```

Example route for Life Map:

```text
现在 -> 试验线 -> 90 天 -> 第 1 周
```
