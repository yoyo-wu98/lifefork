# LifeFork AI / Core / Voice Management Review — 2026-04-30

## 1. Meeting Purpose

This review covers three teams that directly affect V0.5 demo usability:

- AI Gateway & Prompt Team
- Voice & Dialogue Team
- Core App / State Team

Priority remains: one complete demo run, no crash, recoverable state, readable dialogue, controlled AI fallback.

## 2. Evidence Checked

Commands passed:

- `npm run qa:scenarios`
- `npm run content:audit`
- `npm run lint`
- `npm run build`

Local API guard checks:

- `POST /api/chat` with `{}` returns `400`.
- `POST /api/generate-self-skill` with `{}` returns `400`.
- Both invalid responses include `meta.llmUsed: false` and `fallbackReason: invalid_request`.

Code structure checked:

- AI files are now split under `src/lib/ai/` into prompts, providers, schemas, and token budgets.
- Store files are now split under `src/lib/stores/slices/`.
- Dialogue flow sends `voiceProfile`, `stageVoice`, `calibrationNotes`, fork context, and recent history to `/api/chat`.
- Local dialogue fallback and safety intercept exist.

## 3. Current Status

### 3.1 AI Gateway & Prompt Team

Status: Review / QA Required

Accepted evidence:

- Request schema guard is present for chat and Self Skill generation.
- Invalid requests return 400 instead of generating empty profiles.
- Prompt versions and token budgets are centralized.
- Content Systems policy is injected into prompt builders.

Remaining risks:

- No dedicated regression command exists for API contract cases.
- `AI_DISABLED`, provider error, non-JSON, schema-validation fallback still need explicit automated coverage.
- Prompt output quality is still judged manually; there is no small golden-case prompt regression set.

Immediate assignment:

1. Create an API contract regression matrix for:
   - invalid request.
   - AI disabled.
   - provider error.
   - non-JSON provider response.
   - schema validation failure.
2. Produce prompt output fixtures for:
   - Self Skill JSON.
   - dialogue reply under 150 Chinese characters.
   - WeChat summary JSON.
3. Ensure every API response exposes:
   - `meta.llmUsed`.
   - `meta.fallbackReason`.
   - `promptVersion`.

Acceptance:

- QA can run one command or checklist and prove the app never needs a live model to finish the demo.
- No API path returns an uncaught exception for bad input.
- Prompt output policy remains aligned with Content Systems.

### 3.2 Voice & Dialogue Team

Status: In Progress / P0 Demo Reliability

Accepted evidence:

- `VoiceProfile` and `StageVoice[]` exist.
- Dialogue uses fork scale, stage voice, user voice, calibration notes, and recent history.
- Instance Chat exposes quick questions and voice calibration controls.
- Local fallback can answer without the LLM.

Remaining risks:

- Consecutive sends and quick-question taps need explicit race-condition QA.
- There is no visible pending state for chat send reliability.
- Calibration is stored, but the next-turn perceived change still needs browser-use evidence.
- Mobile message length and button wrapping need screenshot proof.

Immediate assignment:

1. Define dialogue-send reliability:
   - one message in flight at a time or an intentional queue.
   - no lost messages after rapid quick-question taps.
   - input remains usable after API failure.
2. Define calibration acceptance:
   - click `更口语`, send one new message, verify language shift.
   - click `更克制`, send one new message, verify language shift.
   - calibration notes persist after returning to map and re-entering chat.
3. Define layout acceptance:
   - 390px mobile chat screenshot.
   - long reply does not overflow the message container.
   - share-card navigation remains visible.

Acceptance:

- User can enter any selected fork, send three messages, calibrate voice, return to map, re-enter chat, and continue without refresh.
- Crisis/safety intercept still prevents simulation-style replies.
- Dialogue stays under the demo copy boundary.

### 3.3 Core App / State Team

Status: Review / QA Required

Accepted evidence:

- Store has already been split into slices.
- Storage access is wrapped in safe read/write/remove helpers.
- Self Skill loading passes through migration.
- Destructive reset/new/demo actions ask for confirmation.
- Demo scenario loading writes the demo skill, clears chat, and sets step to `forks`.

Remaining risks:

- Documentation still partially describes an older monolithic store state.
- No dedicated state recovery regression command exists.
- Corrupt localStorage, stale selected fork, stale step, and partial chat recovery need browser-use proof.
- Core must coordinate with Life Map hierarchy repair so selected fork, preview fork, and route chips do not drift.

Immediate assignment:

1. Produce state transition matrix:
   - landing -> questions -> Self Skill -> map -> chat -> share.
   - demo sample -> map -> node -> chat -> share.
   - map -> chat -> map -> same selected node.
2. Produce storage recovery matrix:
   - corrupt Self Skill.
   - stale selected fork.
   - invalid step.
   - missing chat messages.
   - storage unavailable.
3. Define cross-team state contract:
   - `selectedFork` owns chat entry.
   - `previewForkId` owns map focus.
   - route chips must derive from current tree, not stale persisted fork objects.

Acceptance:

- Refresh at Self Skill, map, chat, and share restores to a usable state.
- Corrupt storage falls back to a usable entry state.
- Loading demo sample never leaves old user data mixed into the demo state.

## 4. New Work Orders

| ID | Team | Status | Deliverable |
| --- | --- | --- | --- |
| LF-AI-002 | AI Gateway & Prompt | New / P0 | API contract and fallback regression matrix |
| LF-VOICE-002 | Voice & Dialogue | New / P0 | Dialogue send, calibration, and mobile layout acceptance |
| LF-CORE-002 | Core App / State | New / P0 | State recovery and transition regression matrix |

## 5. Cross-Team Dependencies

- AI Gateway provides `meta` and fallback behavior to Core.
- Core provides stable selected fork and chat state to Voice.
- Voice provides calibration notes and dialogue history back through Core persistence.
- Content Systems owns output language boundaries for AI and Voice.
- QA owns the single evidence packet before any status becomes Accepted.

## 6. Next Review Checklist

```markdown
Team:
Requirement ID:
Status:
Evidence:
Command output:
Browser screenshot:
Remaining risk:
Decision requested:
```

No team should report Accepted without command output plus browser evidence where user experience is involved.

## 7. Latest Team Brief Intake

Date: 2026-04-30

Input received:

- Core App / State Team completion brief.
- Voice & Dialogue Team review and execution brief.
- AI Gateway & Prompt Team review and execution brief.

### 7.1 Verification Rerun

Commands:

- `npm run qa:scenarios` passed.
- `npm run content:audit` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npx tsc --noEmit` passed.

API guard:

- `POST /api/chat` with `{}` returned 400.
- `POST /api/generate-self-skill` with `{}` returned 400.
- Both responses include `meta.llmUsed=false` and `fallbackReason=invalid_request`.

Structure checks:

- `src/lib/stores/lifeforkStore.ts` is 21 lines.
- Store slices exist under `src/lib/stores/slices/`.
- Schema modules exist under `src/lib/schema/`.
- AI prompts, schemas, providers, and token budget exist under `src/lib/ai/`.
- `chatSlice` passes `stageVoice` and `calibrationNotes` into `/api/chat`.
- `dialogueEngine` has a safety intercept.

### 7.2 Status Decisions

| Requirement | Previous status | New status | Reason |
| --- | --- | --- | --- |
| LF-CORE-001 | Review / QA Required | Implementation Complete / QA Required | Store split and storage guard are implemented |
| LF-CORE-002 | New / P0 | In Progress / QA Evidence Required | Recovery matrix still needs browser proof |
| LF-AI-001 | Review / QA Required | Implementation Complete / Contract Gap | API guard and schema work exist |
| LF-AI-002 | New / P0 | In Progress / Contract Gap | Fallback matrix and meta contract still need closure |
| LF-VOICE-001 | In Progress / P0 | Implementation Complete / QA Required | Voice and dialogue chain is wired |
| LF-VOICE-002 | New / P0 | In Progress / Browser QA Required | Send reliability and mobile evidence still missing |

### 7.3 Remaining Gaps

AI Gateway:

- invalid request and route error responses currently do not include `promptVersion`.
- AI disabled/provider error/non-JSON/schema-failure need a repeatable regression matrix.

Core App:

- refresh recovery needs browser-use evidence at Self Skill, Life Map, Chat, and Share.
- corrupt localStorage and stale selected fork recovery need proof.
- demo sample isolation needs proof that old chat and selected fork do not leak in.

Voice & Dialogue:

- rapid quick-question taps need evidence.
- three consecutive messages need evidence.
- calibration next-turn effect needs evidence.
- 390px mobile chat layout needs screenshot proof.

### 7.4 Management Decision

The three teams are no longer blocked at the implementation-structure level. They remain blocked at the evidence level.

Next gate belongs to QA:

- produce API contract evidence.
- produce browser recovery evidence.
- produce chat reliability and calibration evidence.
- attach screenshots or command outputs before requesting Accepted status.
