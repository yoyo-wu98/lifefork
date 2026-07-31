# LifeFork V0.5 Demo Command Center

> Owner: Product & Research Team
> Date opened: 2026-04-29
> Sprint target: 演示版一次体验完整跑通。第一优先级是可用、不崩溃、用户能理解地图结构。
> Source meetings: `docs/DEMO_ALIGNMENT_MEETING_2026-04-29.md`, `docs/DEMO_ALIGNMENT_MEETING_2026-04-29_ROUND_2.md`, `docs/DEMO_ALIGNMENT_MEETING_2026-04-29_ROUND_3.md`, `docs/DEMO_ALIGNMENT_MEETING_2026-04-30_AI_CORE_VOICE.md`, `docs/DEMO_ALIGNMENT_MEETING_2026-04-30_FULL_TEAM_REVIEW.md`

## 1. Command Rules

本轮只处理会影响演示可用性的事项：

- Life Map 结构理解。
- 地图视口、镜头和点击稳定性。
- 文案归属和文案数据结构。
- 完整人生样本 fixture。
- 初始入口是否保留。
- AI fallback 和 prompt 输出可控。
- 对话发送、语气校准和移动端聊天可用。
- 状态恢复、demo sample 覆盖和 localStorage 坏数据修复。
- 动态 MBTI 只做模型规划和展示位规划。

暂缓：

- FAQ。
- 伦理章程扩展。
- 传播材料。
- 账号、付费、公开发布。
- 高级地图编辑器。

## 2. Decision Authority

| Area | Final decision owner | Can block release | Evidence required |
| --- | --- | --- | --- |
| Product priority | Product & Research | Yes | Requirement ID and user value |
| Life Map structure | Life Map Lead | Yes | Screenshot, route path, console result |
| Time containment model | Self Skill Lead | Yes | Schema brief and validation cases |
| Visual usability | UX Lead | Yes | Desktop and mobile screenshots |
| Copy ownership | Content Systems Lead | Yes | Copy registry brief and owner map |
| Full-life sample | Scenario Lab Lead | Yes | Fixture brief and replay path |
| AI fallback contract | AI Gateway Lead | Yes | API contract output and fallback cases |
| Dialogue reliability | Voice & Dialogue Lead | Yes | Browser-use chat send and calibration evidence |
| State recovery | Core App Lead | Yes | Recovery matrix and browser refresh evidence |
| Regression acceptance | QA Lead | Yes | Browser-use notes, screenshots, logs |

No task is `Accepted` without evidence. Verbal report is `Review` at most.

## 3. Sprint Board

### P0 Now

| ID | Team | Deliverable | Due |
| --- | --- | --- | --- |
| LF-MAP-002 | Life Map | Semantic containment design and implementation plan | 2026-04-30 12:00 |
| LF-MAP-003 | Life Map + UX | Viewport and camera containment plan | 2026-04-30 12:00 |
| LF-MAP-004 | Life Map + Self Skill | Cross-scale time hierarchy repair plan | 2026-04-30 12:00 |
| LF-SKILL-002 | Self Skill | Time containment contract brief | 2026-04-30 12:00 |
| LF-UI-002 | UX | Map visual grammar and responsive screenshot checklist | 2026-04-30 18:00 |
| LF-AI-002 | AI Gateway | API contract and fallback regression matrix | 2026-04-30 18:00 |
| LF-CORE-002 | Core App | State recovery and transition regression matrix | 2026-04-30 18:00 |
| LF-VOICE-002 | Voice & Dialogue | Dialogue send, calibration, and mobile layout acceptance | 2026-05-01 12:00 |
| LF-COPY-001 | Content Systems | Copy registry brief and ownership map | 2026-04-30 18:00 |
| LF-SCENARIO-001 | Scenario Lab | Full-life fixture brief | 2026-05-01 12:00 |
| LF-ONBOARD-001 | Product + UX + Core | Entry simplification decision record | 2026-05-01 12:00 |

### P1 Design Only

| ID | Team | Deliverable | Due |
| --- | --- | --- | --- |
| LF-MBTI-001 | Product + Content + Self Skill + UI | Dynamic MBTI schema brief | 2026-05-01 18:00 |

## 4. RACI

| Requirement | Responsible | Accountable | Consulted | Informed |
| --- | --- | --- | --- | --- |
| LF-MAP-002 | Life Map Lead | Product & Research | Self Skill, UX, QA | All |
| LF-MAP-003 | Life Map Lead, UX Lead | Product & Research | QA | All |
| LF-MAP-004 | Life Map Lead + Self Skill Lead | Product & Research | Scenario Lab, UX, QA | All |
| LF-SKILL-002 | Self Skill Lead | Product & Research | Life Map, Scenario Lab | AI, QA |
| LF-UI-002 | UX Lead | Product & Research | Life Map, QA | All |
| LF-AI-002 | AI Gateway Lead | Product & Research | Core, Content Systems, QA | All |
| LF-CORE-002 | Core App Lead | Product & Research | Life Map, Voice, QA | All |
| LF-VOICE-002 | Voice & Dialogue Lead | Product & Research | Core, AI, Content Systems, QA | All |
| LF-COPY-001 | Content Systems Lead | Product & Research | AI, UX, QA | All |
| LF-SCENARIO-001 | Scenario Lab Lead | Product & Research | Self Skill, Life Map, QA | All |
| LF-MBTI-001 | Product + Content Systems | Product & Research | Self Skill, UI | All |
| LF-ONBOARD-001 | Product + UX + Core | Product & Research | QA | All |

## 5. Team Work Packages

### 5.1 Life Map / Visualization Team

Immediate assignment:

1. Define the map hierarchy rule as semantic zoom:
   - `现在` is the root.
   - `现在 -> 晚年` is a life-level container.
   - `现在 -> 3 年后` is a checkpoint inside that life container.
   - `90 天` is a phase-level container.
   - `第 1 周` and `第 3 周` are child nodes inside `90 天`.
   - `10 年后` is not a child of `90 天`.
   - Year, month, week, day, hour nodes must render inside the nearest valid parent container.
2. Produce a connector rule:
   - Root-to-life lines connect root card to life container/card.
   - Container-to-child lines connect from container boundary or container label.
   - Child-to-child lines connect card boundaries.
   - A line must never be used to compensate for an illegal flat hierarchy.
3. Produce a camera rule:
   - Default life view includes root and top-level life branches.
   - Selecting a life branch shows that branch plus its immediate children.
   - Selecting `90 天` shows the `90 天` container plus direct child weeks.
   - Focus lock cannot center on empty canvas.
4. Produce a hit-test rule:
   - Visible card click selects that node.
   - Container label click selects that container node.
   - Hidden or clipped nodes cannot intercept clicks.

Required evidence:

- 1440px screenshot before and after selecting stable branch.
- Screenshot showing `稳定延续线` contains `3 年后` and `10 年后`.
- Screenshot showing `90 天` contains `第 1 周` and `第 3 周`.
- Screenshot showing `10 年后` does not appear inside the `90 天` container.
- Route bar showing the path after selecting `3 年后`.
- Route bar showing the path after selecting `第 1 周`.
- Browser console error count.

### 5.2 Self Skill & Simulation Engine Team

Immediate assignment:

1. Define `ForkPath` containment extensions.
2. Fix scale semantics:
   - `3 年` should not be labeled as pure decade.
   - A node may have `durationMonths: 36` and a display scale chosen separately.
3. Add validation cases:
   - Child start and end fall inside parent start and end.
   - `parentId` matches the actual nested tree.
   - `orderIndex` is stable.
   - `第 1 周` cannot attach directly to a life-level container.
   - `10 年后` cannot be accepted as a child of `90 天`.
4. Provide one stable fixture tree to Life Map Team.
5. Provide hierarchy violation output that QA can assert against.

Required evidence:

- Schema brief.
- Three valid examples.
- Three invalid examples.
- Validation output expected by QA.
- Example route: `现在 -> 试验线 -> 90 天 -> 第 1 周`.

### 5.3 UX / UI / Motion Team

Immediate assignment:

1. Define visual grammar:
   - Life branch card.
   - Life container after selection.
   - Phase container after drill-down.
   - Checkpoint node.
   - Local child node.
   - Background context node.
   - Current selected node.
   - Ancestor route.
2. Define responsive containment:
   - Desktop 1440px.
   - Desktop 1280px.
   - Mobile 390px.
3. Define overlay placement:
   - Focus lock.
   - Right hint.
   - Reset camera.
   - Current route bar.
4. Remove or reduce debug-looking labels if they confuse demo users.
5. Define visual difference between active children and background context so users do not read them as the same hierarchy level.

Required evidence:

- Three viewport screenshots.
- Annotation of what changed after selection.
- List of text that should remain visible in demo mode.

### 5.4 Content Systems / Narrative Architecture Team

Immediate assignment:

1. Create copy ownership map:
   - Landing.
   - Version selector or entry page.
   - Five questions.
   - WeChat import.
   - Self Skill panel.
   - Timeline.
   - Life Map.
   - Chat.
   - Share card.
2. Define `CopyEntry`.
3. Define naming convention:
   - `surface.intent.variant`.
   - Example: `lifeMap.hint.leftHistory.v1`.
4. Audit current messy copy:
   - Mark keep.
   - Mark rewrite.
   - Mark remove.
   - Mark needs product decision.

Required evidence:

- Copy registry brief.
- Owner table.
- Top 20 copy fixes with surfaces and reasons.

### 5.5 Life Scenario Lab Team

Immediate assignment:

1. Define the canonical demo persona.
2. Define life stages:
   - Birth.
   - Early childhood.
   - Adolescence.
   - University or early adult stage.
   - First career identity.
   - Relationship pressure.
   - Major fork.
   - Stabilization or leap.
   - Illness or aging.
   - Late-life reflection.
   - Death.
3. Define choice sets:
   - Every year has at least two choice options.
   - Every month in the focused demo window has at least two choice options.
4. Define replay:
   - One representative complete path.
   - One stable branch.
   - One leap branch.
   - One experiment branch.
   - One relationship branch.

Required evidence:

- Fixture brief.
- Visible node budget.
- Replay path from birth to death.
- QA checklist for all selectable choice sets.

Implementation status — 2026-04-30:

- Canonical persona: `fullLifeDemoPersona`.
- Life stages: `fullLifeDemoStages` covers all 11 required stages.
- Choice sets: `choice-yearly-default` and `choice-monthly-default` enforce two options per year/month window; authored choice sets cover 18, 24, 36, 53, and 86.
- Replay: `fullLifeDemoReplayBranches` covers representative complete, stable, leap, experiment, and relationship branches.
- QA evidence: `npm run qa:scenarios` validates the visible node budget, branch coverage, life stage coverage, and choice set checklist.

### 5.6 Dynamic MBTI Working Group

Status: Implemented as V0.5 reserved slot. Evidence: `docs/DYNAMIC_MBTI_SCHEMA_BRIEF.md`.

Immediate assignment:

1. Define the product role of MBTI:
   - Dynamic tendency.
   - Evidence-backed.
   - Context-sensitive.
2. Define `DynamicTypeProfile`.
3. Define share card slot:
   - Current type tendency.
   - Type drift on selected branch.
   - Confidence and evidence hint.
4. Define language boundaries:
   - No deterministic personality judgment.
   - No clinical framing.
   - No ranking of types.

Required evidence:

- Schema brief.
- One example for share card.
- One example for Life Map branch detail.

### 5.7 Onboarding / Entry Team

Immediate assignment:

Decision:

- V0.5 removes the three-option entry.
- Start goes directly to five questions.
- Default `selectedVersion` is future.
- Copy explains the user can still meet past selves on Timeline and fork selves on Life Map later.

Deferred V0.6 option:

- Restore the entry only if each option changes the post-generation landing surface.
- Future opens Life Map.
- Past opens Timeline.
- Fork opens Life Map focused on alternative branch.

Required evidence:

- Decision record: `LF-ONBOARD-001` in `docs/TEAM_WORK_ORDERS.md`.
- Updated user journey: README and internal development management docs.
- QA path for selected decision: `QA-ENTRY-001`.

## 6. QA Acceptance Matrix

| Test ID | Scenario | Owner | Required result |
| --- | --- | --- | --- |
| QA-MAP-001 | Open Life Map at 1440px | QA + Life Map | No horizontal page overflow |
| QA-MAP-002 | Default life view | QA + Life Map | Root and top-level branches visible |
| QA-MAP-003 | Select stable branch | QA + Life Map | `3 年后` and `10 年后` appear inside stable container |
| QA-MAP-004 | Select 3-year checkpoint | QA + Life Map | Route bar includes stable line and 3-year node |
| QA-MAP-005 | Drill to month/hour | QA + Life Map | Descendant nodes remain inside valid parent context |
| QA-MAP-006 | Reset camera | QA + Life Map | Camera returns to readable default, no blank center |
| QA-MAP-007 | Select `90 天` phase | QA + Life Map + Self Skill | `第 1 周` and `第 3 周` render inside `90 天`; `10 年后` does not |
| QA-MAP-008 | Select `第 1 周` | QA + Life Map | Route is `现在 -> 试验线 -> 90 天 -> 第 1 周`; parent container remains visible |
| QA-MAP-009 | Cross-scale screenshot matrix | QA + Life Map | 932px, 1280px, 1440px screenshots show no flat parent-child display |
| QA-AI-001 | API invalid request contract | QA + AI | Chat and Self Skill invalid requests return 400 with `llmUsed=false` |
| QA-AI-002 | AI fallback contract | QA + AI + Core | AI disabled/provider failure/non-JSON still lets demo finish through local fallback |
| QA-CORE-001 | Refresh recovery | QA + Core | Self Skill, map, chat, share refresh into usable state |
| QA-CORE-002 | Demo sample isolation | QA + Core | Loading `演示样本` clears old chat, old selected fork, and old step |
| QA-VOICE-001 | Dialogue send reliability | QA + Voice | Three consecutive messages do not lose input or freeze chat |
| QA-VOICE-002 | Voice calibration continuity | QA + Voice | Calibration affects next reply and survives map -> chat return |
| QA-ENTRY-001 | New user start | QA + Product | Clicking `开始五问` opens the five questions directly, no three-option cards appear, generated Self Skill records `selectedVersion="future"` |
| QA-COPY-001 | Copy audit | QA + Content | No unmanaged critical copy in main flow |
| QA-SCENARIO-001 | Full-life fixture replay | QA + Scenario Lab | Birth-to-death representative path completes |
| QA-MBTI-001 | Dynamic MBTI sample | QA + Product | Type text is contextual and non-deterministic |

## 7. Daily Report Template

Each team posts once per day:

```markdown
Team:
Requirement ID:
Status: Draft / Ready / In Progress / Blocked / Review / Accepted
Yesterday:
Today:
Blocked by:
Needs from:
Evidence:
Risk to demo:
```

## 8. Integration Meeting Agenda

### 2026-04-30 Checkpoint

1. Life Map shows containment plan.
2. Self Skill shows time containment contract.
3. UX shows screenshot checklist.
4. Content Systems shows copy owner map.
5. Product decides whether initial three-option entry stays in V0.5.

### 2026-05-01 Checkpoint

1. Scenario Lab shows full-life fixture brief.
2. Dynamic MBTI group shows schema brief.
3. QA shows browser-use acceptance notes.
4. Product decides whether demo is green, yellow, or red.

## 9. Demo Gate

Demo can proceed only if all are true:

- New user can complete the main flow without reading docs.
- Life Map is understandable at first glance.
- Stable line containment is clear.
- Map frame does not exceed viewport.
- One branch can enter chat and share card.
- Full-life fixture has a documented plan even if not fully implemented.
- Copy owner exists for every critical surface.
- Browser console has no error during the demo path.

## 10. Round 2 Status Update — 2026-04-29

### Evidence

Commands passed:

- `npm run qa:scenarios`
- `npm run content:audit`
- `npm run lint`
- `npm run build`

Browser-use checks:

- Normal Life Map default view: improved.
- Stable line selected: containment readable.
- 3-year checkpoint selected: route and detail panel update.
- Full-life demo fixture loaded: data present, console error 0.
- Full-life demo fixture reset camera: still visually clipped.

### Current Gate Status

Overall: Yellow.

Green:

- Scenario fixture static validation.
- Content registry audit.
- Normal map route selection.
- Browser console error count.

Yellow:

- Stable branch still shows unrelated branch residue.
- Normal map can be used for internal demo with explanation.

Red:

- Full-life demo fixture default camera is clipped.
- Reset camera does not repair full-life fixture view.
- Full-life fixture cannot be used as the first public demo path yet.
- Line continuity still fails in the experiment branch: user-marked browser diff shows the curve from the parent area to `90 天` / `第 1 周` visually breaks inside the map viewport.
- Root cause is cross-scale hierarchy failure: `90 天` phase, `第 1 周` child node, and `10 年后` checkpoint can appear in one flat visual layer.

### Updated Team Priorities

1. Life Map Team: repair cross-scale hierarchy rendering before tuning line continuity.
2. Self Skill Team: deliver a strict time containment data contract that prevents illegal parent-child mixes.
3. Scenario Lab Team: define expected first viewport composition and expected hierarchy for the full-life fixture.
4. QA Team: add hierarchy assertions and browser-use screenshot checks to the V0.5 acceptance pass.
5. Content Systems Team: keep copy owner map and Top 20 copy fixes moving without blocking P0 map repair.
6. Product & Research Team: keep `演示样本` as internal QA/demo asset until hierarchy, camera, and edge continuity pass.

### Next Acceptance Evidence Required

- Screenshot: normal map default view.
- Screenshot: stable branch selected, unrelated branches suppressed.
- Screenshot: 3-year checkpoint selected, route visible.
- Screenshot: experiment branch at `阶段` scale, `90 天` selected, `第 1 周` and `第 3 周` visibly inside the `90 天` container.
- Screenshot: experiment branch with `第 1 周` selected, route visible as `现在 -> 试验线 -> 90 天 -> 第 1 周`.
- Screenshot: no `10 年后` checkpoint rendered as a child inside the `90 天` container.
- Screenshot: full-life fixture immediately after loading, no clipping.
- Screenshot: full-life fixture after reset camera, no clipping.
- Console error count for both normal map and fixture map.

## 11. Round 3 Escalation — 2026-04-29

Trigger:

- User review clarified that the visible broken line is a symptom of a deeper model/display issue.

Decision:

- Public demo remains blocked until cross-scale hierarchy passes.
- `LF-MAP-004` is added as a P0 requirement.
- `LF-MAP-002` and `LF-SKILL-002` are reopened because the current state does not reliably distinguish container, child, sibling, and background context.

Required owner response:

- Life Map Team must submit the rendering rule: which node scales can appear together in each semantic zoom.
- Self Skill Team must submit the schema rule: which time scales can legally contain which child scales.
- Scenario Lab Team must annotate the fixture route with expected hierarchy and expected node count.
- QA Team must reject any screenshot where a child-scale node is laid out as a sibling of its parent container.

## 12. Round 4 AI / Core / Voice Review — 2026-04-30

Evidence:

- `npm run qa:scenarios` passed.
- `npm run content:audit` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `POST /api/chat` with invalid body returns 400 and `meta.llmUsed=false`.
- `POST /api/generate-self-skill` with invalid body returns 400 and `meta.llmUsed=false`.

Current status:

- AI Gateway is in Review / QA Required. Structure and schema guard exist; fallback regression still needs a repeatable matrix.
- Core App is in Review / QA Required. Store split and storage guards exist; recovery and demo isolation still need browser-use proof.
- Voice & Dialogue is In Progress / P0. Dialogue and calibration controls exist; send race, next-turn calibration, and mobile chat layout need proof.

Updated priorities:

1. AI Gateway Team: deliver `LF-AI-002` API contract and fallback regression matrix.
2. Core App Team: deliver `LF-CORE-002` state recovery and transition regression matrix.
3. Voice & Dialogue Team: deliver `LF-VOICE-002` dialogue send reliability and calibration QA.
4. QA Team: add `QA-AI-001/002`, `QA-CORE-001/002`, `QA-VOICE-001/002` to the V0.5 acceptance packet.

Demo gate:

- Public demo remains blocked if chat can lose messages, state cannot recover after refresh, or an API failure can interrupt the main flow.

## 13. Team Brief Intake — 2026-04-30

Source:

- Core App / State Team latest brief.
- Voice & Dialogue Team latest brief.
- AI Gateway & Prompt Team latest brief.

Verification rerun:

- `npm run qa:scenarios` passed.
- `npm run content:audit` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npx tsc --noEmit` passed.
- `POST /api/chat {}` returns 400 with `llmUsed=false`.
- `POST /api/generate-self-skill {}` returns 400 with `llmUsed=false`.

Status updates:

- `LF-CORE-001`: Implementation Complete / QA Required.
- `LF-CORE-002`: In Progress / QA Evidence Required.
- `LF-AI-001`: Implementation Complete / Contract Gap.
- `LF-AI-002`: In Progress / Contract Gap.
- `LF-VOICE-001`: Implementation Complete / QA Required.
- `LF-VOICE-002`: In Progress / Browser QA Required.

Remaining blockers:

1. AI Gateway: invalid request and route error meta still need `promptVersion` if the project keeps the “every API meta has promptVersion” contract.
2. Core App: needs browser-use recovery evidence for refresh, corrupt localStorage, stale selected fork, and demo sample isolation.
3. Voice & Dialogue: needs browser-use evidence for three consecutive messages, quick question rapid taps, calibration next-turn effect, and 390px layout.

Management decision:

- The three teams have moved from implementation risk to evidence risk.
- QA owns the next gate; Product should not accept these tracks without the specific browser and API evidence above.

## 14. Full Team Review — 2026-04-30

Evidence rerun:

- `npm run qa:scenarios` passed.
- `npm run content:audit` passed.
- `npm run lint` passed.
- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed.
- Production preview `npm run start -- -p 3006` returns 200.
- `POST /api/chat {}`, `POST /api/generate-self-skill {}`, and `POST /api/wechat-analyze {}` return 400 with `llmUsed=false`.

Browser-use findings:

- Default Life Map opens with console error count 0.
- Selecting `试验线`, `90 天`, and `第 1 周` works.
- `90 天` DOM state exposes `第 1 周` and `第 3 周` as enterable child nodes.
- `第 1 周` route includes current root, `试验线`, `90 天`, and the week node.
- Dynamic type detail is visible in Life Map detail panel.
- Screenshot capture for the 90-day state timed out, so visual acceptance remains pending.

Updated status summary:

- `LF-MAP-002`: Review / Visual Evidence Gap.
- `LF-MAP-003`: Review / Visual Evidence Gap.
- `LF-MAP-004`: Review / Screenshot Pending.
- `LF-UI-002`: Review / Visual Evidence Gap.
- `LF-SKILL-002`: Implementation Complete / Map Handoff Ready.
- `LF-COPY-001`: Review / Next Implementation Pass.
- `LF-SCENARIO-001`: Implementation Complete / Map Integration Pending.
- `LF-MBTI-001`: Implemented / V0.5 Reserved Slot Accepted.
- `LF-AI-002`: In Progress / Contract Gap.
- `LF-CORE-002`: In Progress / QA Evidence Required.
- `LF-VOICE-002`: In Progress / Browser QA Required.
- `LF-OPS-001`: In Progress / Runtime Decision Required.

Updated demo gate:

- Overall remains Yellow.
- The root data/model problems are largely resolved.
- The current blocker is evidence quality: final visual screenshots, runtime command choice, Core recovery proof, Voice browser proof, and AI meta contract consistency.

Next required evidence:

1. 90-day selected screenshot showing `第 1 周` and `第 3 周` inside the phase container.
2. Week-one selected screenshot showing route and no connector break.
3. Re-captured in-app selected full-life screenshot without left-edge clipping.
4. Core recovery matrix screenshots.
5. Voice rapid-send and calibration screenshots.
6. AI fallback matrix output including `promptVersion`.
7. Runtime note confirming final demo uses production preview or a fixed dev watcher.
