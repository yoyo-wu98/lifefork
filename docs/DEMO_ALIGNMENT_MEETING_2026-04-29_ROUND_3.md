# LifeFork Demo Alignment Meeting Round 3 — 2026-04-29

## 1. Meeting Purpose

This round reclassifies the Life Map issue from line rendering to time hierarchy failure.

The previous diagnosis focused on disconnected edges. User review clarified the deeper problem: `90 天` and `第 1 周` are different semantic levels, but the current map can display them as if they belong to one flat layer. This makes containment unreadable.

## 2. Browser Evidence

Source: in-app browser at `http://127.0.0.1:3005/`

Observed state:

- Current read: `90 天实验后的你`
- Scale: `阶段`
- Focus: `90 天：你把人生问题改成一个实验周期`
- Visible child candidates: `第 1 周`, `第 3 周`
- Console errors: 0

User-marked prior state:

- Target: `底图 · 全人生 · 试验线：用可逆实验慢慢改写人生 · 子节点 2`
- State: `十年` scale, `第 1 周：你只做最小可见动作` selected
- Symptom: route edge appears disconnected.

New root cause:

- The map can mix life-level, decade-level, phase-level, and week-level nodes in one apparent layer.
- The line breaks because the layout is trying to connect nodes that should not be co-equal in the active view.
- The product problem is containment failure: users cannot reliably tell parent, child, sibling, and background context apart.

## 3. Severity

Status: P0 demo blocker.

Reason:

- LifeFork's demo promise depends on users reading the map as a nested life structure.
- If `90 天` and `第 1 周` look like sibling cards, the user cannot trust the map's causal or temporal meaning.
- A visually continuous line would not be enough if the hierarchy remains wrong.

## 4. Updated Workstreams

### 4.1 Life Map / Visualization Team

Requirement IDs: `LF-MAP-002`, `LF-MAP-003`, `LF-MAP-004`

Owner task:

1. Implement semantic zoom rules:
   - `全人生`: show life containers and major branches only.
   - `十年`: show decade / era checkpoints only.
   - `阶段`: show active phase container and its direct child nodes.
   - `一周` / `一天` / `一小时`: show local parent container and direct children only.
2. Render containment before edges:
   - Resolve container bounds.
   - Place child nodes inside the parent container.
   - Draw edges using parent and child anchors after layout.
3. Separate background context from active layout:
   - Breadcrumbs and low-opacity route context are allowed.
   - Background nodes must not look like active siblings.
   - Hidden/background nodes must not intercept clicks.

Acceptance:

- `第 1 周` appears inside `90 天`, never as a sibling of `90 天`.
- `10 年后` does not appear as a child of `90 天`.
- Selecting `第 1 周` preserves the visible route `现在 -> 试验线 -> 90 天 -> 第 1 周`.
- Edges are continuous only after hierarchy correctness is satisfied.

### 4.2 Self Skill / Simulation Engine Team

Requirement ID: `LF-SKILL-002`

Owner task:

1. Deliver a strict time containment contract:
   - `timeScale`
   - `timeRange`
   - `semanticParentId`
   - `containerId`
   - `containmentRole`
   - `displayScale`
   - `orderIndex`
2. Add validation rules:
   - week nodes cannot directly attach to life containers.
   - day/hour nodes cannot appear without a local parent.
   - decade checkpoints cannot be children of phase containers.
3. Expose hierarchy violations in QA output.

Acceptance:

- Validation fails if `第 1 周` lacks a `90 天`-level parent.
- Validation fails if `10 年后` is treated as a child of `90 天`.
- Life Map can render hierarchy without guessing from labels.

### 4.3 Life Scenario Lab Team

Requirement ID: `LF-SCENARIO-001`

Owner task:

1. Annotate the full-life fixture with expected hierarchy:
   - route chain.
   - visible node set by scale.
   - parent container for each child node.
2. Add the experiment branch as a reference case:
   - `现在 -> 试验线 -> 90 天 -> 第 1 周`
   - `现在 -> 试验线 -> 90 天 -> 第 3 周`
3. Document which nodes may appear as background context only.

Acceptance:

- Fixture review includes both visual hierarchy expectations and node counts.
- Scenario QA can say which nodes are illegal in the current viewport.

### 4.4 QA / Release / DevOps Team

Requirement ID: `LF-QA-001`

Owner task:

1. Add screenshot regression cases:
   - 932px width, `阶段`, `90 天` selected.
   - 932px width, `第 1 周` selected.
   - 1280px width, same two states.
   - 1440px width, same two states.
2. Add hierarchy assertions:
   - `第 1 周` is inside `90 天`.
   - `第 3 周` is inside `90 天`.
   - `10 年后` is not inside `90 天`.
3. Keep command gate:
   - `npm run qa:scenarios`
   - `npm run content:audit`
   - `npm run lint`
   - `npm run build`

Acceptance:

- Any flat display of parent and child as sibling cards is a failed demo gate.
- Console error count must remain 0, and hierarchy screenshots are also required.

### 4.5 Product & Research Team

Owner task:

1. Define user-facing hierarchy rule:
   - Users should always understand what they are inside.
   - Users should always understand what they can enter next.
   - Users should never need to infer containment from line direction alone.
2. Keep public demo blocked until hierarchy passes.
3. Keep MBTI and share-card improvements behind P0 map usability.

Acceptance:

- Product sign-off requires screenshots that show hierarchy and route text.

## 5. Decision Log

1. `LF-MAP-004` is added as the explicit cross-scale hierarchy repair requirement.
2. `LF-MAP-002` is reopened because semantic containment remains incomplete.
3. `LF-SKILL-002` is reopened because data-level hierarchy contract must prevent illegal visual states.
4. Public demo gate remains Yellow/Red.
5. Next review must start from hierarchy correctness before line continuity.

## 6. Next Review Checklist

```markdown
Team:
Requirement ID:
Current status:
Evidence:
Screenshot:
Hierarchy rule proven:
Remaining blocker:
Decision requested:
```

Meeting owner will not accept "line fixed" as sufficient evidence unless the parent-child hierarchy is also correct.
