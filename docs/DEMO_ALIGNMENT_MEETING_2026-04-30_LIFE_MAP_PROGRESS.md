# Life Map Progress Report — 2026-04-30

Owner: Life Map / Visualization Team
Related requirements: LF-MAP-002, LF-MAP-003, LF-MAP-004, LF-SKILL-002
Preview target: `http://localhost:3006/`

## 1. Executive Summary

This meeting moved the Life Map work from visual line repair to a semantic zoom and containment contract.

The core rule is now:

- `现在` is the root.
- `现在 -> 晚年` is a life-level container.
- `现在 -> 3 年后` is a checkpoint inside that life container.
- `90 天` is a phase-level container.
- `第 1 周` and `第 3 周` are child nodes inside `90 天`.
- `10 年后` is a life-container checkpoint sibling, not a child of `90 天`.

The code now prioritizes valid hierarchy before connector continuity. Lines are no longer treated as a way to compensate for illegal flat hierarchy.

## 2. Implemented Changes

### 2.1 Data and Time Containment

Implemented / confirmed in:

- `src/lib/types.ts`
- `src/lib/selfSkill/timeRangeRules.ts`
- `src/lib/selfSkill/forkTreeRules.ts`
- `src/lib/selfSkill/containmentValidation.ts`
- `src/lib/selfSkill/containmentFixtures.ts`
- `src/lib/schema/repairForkTree.ts`

Current data contract:

- `ForkPath.timeSpan.range` is the numeric containment source of truth.
- `ForkPath.mapRole` distinguishes `life-container`, `checkpoint`, `period`, and `event`.
- `ForkPath.displayScale`, `durationMonths`, `containmentRole`, and stable `orderIndex` support semantic zoom and QA validation.
- `stability-3y` is modeled as `scale: "era"` with a 3-year range, not as a decade-scale node.
- `stability-10y` is a direct child of `life-stability`.
- `experiment-90d` contains `experiment-week-1` and `experiment-miss`.
- `experiment-10y` is a direct child of `life-experiment`, not a child of `experiment-90d`.

### 2.2 Layout and Semantic Zoom

Implemented / confirmed in:

- `src/components/ForkPaths/index.tsx`
- `src/components/ForkPaths/layoutEngine.ts`
- `src/components/ForkPaths/model/bounds.ts`
- `src/components/ForkPaths/model/normalizeForkTree.ts`

Current behavior:

- Default life view frames `root + top-level life branches`.
- Selecting a life branch frames that branch and its immediate children.
- Selecting `90 天` frames the `90 天` container and its direct child week nodes.
- Focus lock uses concrete node/container bounds and no longer intentionally centers empty canvas.
- Non-root focus no longer brings unrelated sibling checkpoints into the active child set.

Important refinement from this meeting:

- `visibleContainerChildIds` now derives from the current focus node's direct children, with root as the only overview exception.
- This prevents `10 年后` from continuing to behave like a child candidate while `90 天` is selected.

### 2.3 Connector Rules

Implemented / confirmed in:

- `src/components/ForkPaths/MapLinks.tsx`
- `src/components/ForkPaths/connectorPath.ts`

Current connector contract:

- Root-to-life lines connect from the root card to the life branch card or container target.
- Container-to-child lines use the container boundary or container label as the source anchor.
- Child-to-child lines connect card boundaries.
- Connectors are drawn from actual hierarchy links only; they do not invent visual hierarchy.

### 2.4 Hit Testing

Implemented / confirmed in:

- `src/components/ForkPaths/index.tsx`

Current hit-test contract:

- Visible card click selects that node.
- Container label click selects that container node.
- Hidden nodes have `aria-hidden=true` and `tabIndex=-1`.
- Deep hidden or low-opacity background nodes use `pointer-events: none`, so clipped/background content cannot intercept clicks.

### 2.5 Visual Cleanup

Implemented / confirmed in:

- `src/components/ForkPaths/index.tsx`
- `src/components/ForkPaths/layoutEngine.ts`
- `src/components/ForkPaths/ScaleSidebar.tsx`
- `src/components/ForkPaths/MapLinks.tsx`

Changes:

- Life overview changed to a compact product view.
- Top-level life branches render as readable 2x2 cards.
- The semantic scale control is now a compact horizontal control.
- Grid, connector, and overlay contrast were reduced.
- Narrow life overview uses a lower readable zoom so root and top-level branches stay in frame.
- Node transitions were reduced from 1s-class motion to 620ms, with drag using short/non-layout transitions.

## 3. Evidence Collected

Browser-use evidence already captured:

- `/private/tmp/lifefork-map-evidence/01-root-default-before-stable-1440.png`
  - Default life view before selecting stable branch.
  - Shows root and top-level life branches.
- `/private/tmp/lifefork-map-evidence/02-stable-selected-contains-3y-10y-1440.png`
  - Stable branch selected.
  - Shows `稳定延续线` with `3 年后` and `10 年后` as contained/immediate children.
- `/private/tmp/lifefork-map-evidence/03-route-after-selecting-3y-1440.png`
  - Route bar after selecting `3 年后`.
  - Confirms route includes `现在 -> 稳定延续线 -> 3 年后`.

Programmatic QA evidence:

```text
npm run qa:scenarios
Scenario fixture validation passed.
Rendered app nodes: 38
Rendered fork nodes: 33
Choice sets: 7
Life stages: 11
Replay branches: 5
Choice set QA checklist items: 7
```

Build and type gates:

```text
npm run lint
npx tsc --noEmit --pretty false
npm run build
```

All passed on 2026-04-30.

## 4. Remaining Evidence Gap

The remaining screenshots requested but not yet captured are:

- `90 天` selected, showing `第 1 周` and `第 3 周` inside the `90 天` container.
- `90 天` selected, showing `10 年后` does not appear inside the `90 天` container.
- Route bar after selecting `第 1 周`.
- Final browser console error count after these two states.

Reason not captured yet:

- Codex Desktop browser-use temporarily returned `No active Codex browser pane available`.
- External Chrome / downloaded Playwright browser fallback was explicitly rejected and was not used for final evidence.

Current status:

- Code and data rules for these cases are implemented.
- Programmatic validation passes.
- Visual screenshots should be captured once browser-use can bind to the active in-app browser pane again.

## 5. Current Acceptance Status

| Acceptance Item | Status | Evidence |
| --- | --- | --- |
| `现在` is root | Done | Data model and default screenshot |
| Life branches visible in default life view | Done | `01-root-default-before-stable-1440.png` |
| `稳定延续线` contains `3 年后` and `10 年后` | Done | `02-stable-selected-contains-3y-10y-1440.png` |
| Route after selecting `3 年后` | Done | `03-route-after-selecting-3y-1440.png` |
| `90 天` contains `第 1 周` and `第 3 周` | Code done, screenshot pending | Data validation passed; browser-use screenshot pending |
| `10 年后` not inside `90 天` | Code done, screenshot pending | Data validation passed; browser-use screenshot pending |
| Hidden/clipped nodes do not intercept clicks | Done | `pointer-events` and `aria-hidden` rules in `ForkPaths/index.tsx` |
| Console error count | Partial | Earlier browser-use checks were 0; final 90-day state pending |

## 6. Next Action

When Codex Desktop browser-use can bind to the in-app browser pane again:

1. Open `http://localhost:3006/`.
2. Select `试验线`.
3. Select `90 天`.
4. Capture 1440px screenshot for `90 天` container.
5. Select `第 1 周`.
6. Capture route bar screenshot.
7. Read browser console error count.

No further data-model redesign is expected for LF-MAP-004 unless QA finds a visual regression in those pending screenshots.
