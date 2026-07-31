# LifeFork Full Team Review — 2026-04-30

## 1. Review Purpose

This review consolidates the latest briefs from Life Map, UX / UI / Motion, Content Systems, Dynamic MBTI, Self Skill, Life Scenario Lab, AI Gateway, Core App, and Voice & Dialogue.

Priority remains unchanged:

- A complete V0.5 demo run.
- No crash.
- Readable Life Map hierarchy.
- Stable fallback when AI is unavailable.
- Recoverable app state.
- Dialogue and share flows remain usable.

## 2. Verification Rerun

Commands passed on 2026-04-30:

- `npm run qa:scenarios`
- `npm run content:audit`
- `npm run lint`
- `npx tsc --noEmit --pretty false`
- `npm run build`

Preview runtime:

- `http://localhost:3006/` initially had no active server.
- `npm run dev -- -p 3006` started but hit repeated `EMFILE: too many open files, watch`.
- `npm run start -- -p 3006` after build is stable and returns 200.

API guard checks against `http://localhost:3006/`:

- `POST /api/chat {}` returns 400.
- `POST /api/generate-self-skill {}` returns 400.
- `POST /api/wechat-analyze {}` returns 400.
- All three return `meta.llmUsed=false` and `fallbackReason=invalid_request`.

Browser-use checks against `http://localhost:3006/`:

- Default Life Map opens with console error count 0.
- Selecting `试验线` works, route updates, dynamic type detail is visible.
- Selecting `90 天` works, route updates to `现在 -> 试验线 -> 90 天`, console error count 0.
- Selecting `第 1 周` works, route updates to include the week node, console error count 0.
- Screenshot capture for the `90 天` state timed out in the in-app browser, so final visual evidence still needs a stable screenshot pass.

## 3. Current Team Status

| Team / Workstream | Status | Evidence | Remaining gate |
| --- | --- | --- | --- |
| Life Map / Visualization | Review / Visual Evidence Gap | DOM interaction works for `试验线 -> 90 天 -> 第 1 周`; console 0 | 90 天 and 第 1 周 screenshots; left-edge clipping review |
| UX / UI / Motion | Review / Visual Evidence Gap | `docs/ux-evidence/*`, visual grammar brief | in-app selected screenshot still shows left clipping |
| Self Skill / Simulation | Implementation Complete / Map Handoff Ready | `SELF_SKILL_CONTAINMENT_SCHEMA.md`, `qa:scenarios`, type/build gates | none for data contract; still supports Life Map QA |
| Life Scenario Lab | Implementation Complete / Map Integration Pending | 38 app nodes, 33 fixture nodes, 7 choice sets, 11 life stages, 5 replay branches | full-life fixture first-viewport visual acceptance |
| Content Systems | Review / Next Implementation Pass | `COPY_REGISTRY_BRIEF.md`, `content:audit` | move remaining component-local strings into registry |
| Dynamic MBTI | Implemented / Reserved Slot Accepted | `DYNAMIC_MBTI_SCHEMA_BRIEF.md`, visible Life Map detail slot | keep as V0.5 slot; no additional P0 scope |
| AI Gateway & Prompt | Implementation Complete / Contract Gap | API validation and fallback structure exist | invalid/error meta still lacks `promptVersion` |
| Core App / State | Implementation Complete / QA Required | store split, storage guard, migration, build/type pass | browser recovery matrix |
| Voice & Dialogue | Implementation Complete / Browser QA Required | stageVoice and calibration chain wired | consecutive send, calibration effect, mobile chat proof |
| QA / Release / DevOps | In Progress / Gate Owner | command reruns and browser-use notes | full acceptance packet still incomplete |

## 4. Review Findings

### 4.1 Life Map

What improved:

- The root / life branch / phase / week hierarchy is now represented in data and interaction.
- `90 天` can be selected as the active phase.
- `第 1 周` and `第 3 周` are exposed as enterable children when `90 天` is active.
- The detail panel now shows dynamic type readout.

Remaining issue:

- Existing UX evidence `lifefork-map-inapp-selected.png` still shows left-side clipping in the full-life sample selected state.
- The 90-day state screenshot could not be captured in the current browser-use run due screenshot timeout.
- DOM still includes background context nodes; QA must verify visually that these do not read as active siblings.

Decision:

- Life Map moves out of root-cause redesign and into visual acceptance.
- Public demo approval still waits for final 90-day and full-life fixture screenshots.

### 4.2 UX / UI / Motion

What improved:

- The visual grammar is documented.
- Desktop 1440 / 1280 / 390 evidence files exist.
- Debug labels such as `FOCUS LOCK`, raw zoom percentage, and raw X/Y are removed from the described demo surface.

Remaining issue:

- The in-app evidence image still has important content clipped at the left edge.
- Mobile evidence shows the map is usable, but only the first viewport is proven; detail panel and lower controls need one more pass.

Decision:

- UX is in Review, not Accepted.
- The next pass must prove in-app selected state and 390px detail continuation.

### 4.3 Self Skill / Simulation

What improved:

- `ForkPath` containment fields exist.
- Hierarchy validation exists.
- `3 年后` is modeled as `era` / 36 months.
- `experiment-10y` is not a child of `experiment-90d`.
- Stable expected violation codes exist for QA.

Decision:

- Data contract is accepted for Life Map handoff.
- Self Skill remains consulted for any visual hierarchy bug discovered by QA.

### 4.4 Scenario Lab

What improved:

- Canonical persona, life stages, replay branches, yearly/monthly choice sets, and QA checklist exist.
- `qa:scenarios` validates the fixture.

Remaining issue:

- Data validity is proven, but full-life visual framing is still pending.

Decision:

- Scenario Lab implementation is complete.
- Acceptance depends on Life Map / UX visual integration.

### 4.5 Content Systems

What improved:

- Copy registry contract, owner map, naming convention, Top 20 copy fixes, and audit enforcement exist.
- `content:audit` passes.

Remaining issue:

- The brief itself lists several component-local copy gaps: five questions, WeChat import, Self Skill panel, timeline, chat UI labels, Life Map panel labels.

Decision:

- Content Systems stays in Review.
- Next pass should migrate the highest-risk local strings first.

### 4.6 Dynamic MBTI

What improved:

- Schema, generation rules, branch signal, Share Card slot, Life Map detail slot, and copy boundary exist.
- Browser DOM confirms dynamic type appears in Life Map detail for the selected experiment branch.

Decision:

- Accepted as a V0.5 reserved slot.
- Keep language as contextual tendency with evidence and confidence.

### 4.7 AI / Core / Voice

What improved:

- AI request validation and fallback paths exist.
- Store split and storage guards exist.
- Voice calibration and stage voice are wired into chat.

Remaining issues:

- API invalid/error `meta` lacks `promptVersion`.
- Core recovery needs browser proof.
- Voice needs browser proof for rapid sends, calibration effect, and mobile layout.

Decision:

- Implementation is largely complete.
- QA evidence is still required before Accepted status.

## 5. Updated Gate

Overall V0.5 demo gate: Yellow.

Green:

- Command gate.
- Self Skill containment data contract.
- Scenario fixture static validation.
- Content audit.
- Dynamic MBTI reserved slot.
- Basic Life Map interaction and console error count.

Yellow:

- Life Map visual evidence still incomplete.
- UX in-app selected state still shows clipping.
- Core and Voice need browser QA evidence.
- AI fallback contract needs `promptVersion` consistency.

Red:

- Public demo cannot be called complete until 90-day visual containment and full-life fixture framing are proven.
- Production preview should use `next start`; `next dev` on 3006 currently triggers watcher EMFILE risk.

## 6. Next Assignments

1. Life Map Team:
   - Capture final `90 天` selected screenshot.
   - Capture `第 1 周` selected route screenshot.
   - Prove `10 年后` is background/sibling context, not a child of `90 天`.
   - Fix any remaining left-edge clipping in full-life sample.

2. UX / UI / Motion Team:
   - Re-capture `lifefork-map-inapp-selected.png` after left clipping is fixed.
   - Add one mobile screenshot that includes detail panel and action buttons.
   - Confirm route bar and reset button do not compete with node selection.

3. Self Skill / Simulation Team:
   - Freeze containment schema for V0.5.
   - Support Life Map QA if visual hierarchy exposes any data mismatch.

4. Scenario Lab Team:
   - Provide expected first viewport for full-life fixture in concrete node IDs.
   - Mark which nodes may be background-only in the first viewport.

5. Content Systems Team:
   - Migrate Top 20 high-risk copy entries into registry.
   - Prioritize Life Map controls, chat calibration labels, Self Skill panel, and WeChat import.

6. Dynamic MBTI Working Group:
   - Keep V0.5 scope limited to display slot and evidence language.
   - Add QA checklist item verifying no deterministic personality wording appears.

7. AI Gateway & Prompt Team:
   - Add `promptVersion` to invalid request and route error meta.
   - Produce regression matrix for AI disabled, provider error, non-JSON, and schema failure.

8. Core App / State Team:
   - Produce browser recovery proof for Self Skill, Life Map, Chat, and Share.
   - Prove demo sample isolation clears old selected fork and old chat.

9. Voice & Dialogue Team:
   - Produce browser proof for three consecutive sends.
   - Prove calibration changes the next reply.
   - Capture 390px chat layout with long reply and calibration controls.

10. QA / Release / DevOps Team:
    - Run acceptance on `npm run start -- -p 3006` or the agreed production preview command.
    - Avoid `next dev` for final demo evidence until EMFILE is resolved.
    - Own the final evidence packet and status promotion to Accepted.
