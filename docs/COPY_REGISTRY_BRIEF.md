# LifeFork Copy Registry Brief

> Owner: Content Systems / Narrative Architecture Team
> Status: Review
> Date: 2026-04-30
> Scope: Landing, entry/version selector, five questions, WeChat import, Self Skill panel, timeline, Life Map, chat, share card.

## 1. CopyEntry Contract

All new product copy must be represented as a `CopyEntry<TValue>` or as `ForkPath.content` attribution when the copy is generated as Life Map node narrative.

```ts
interface CopyEntry<TValue> {
  id: string;
  surface: ContentSurface;
  intent: ContentIntent;
  tone: ContentTone;
  riskLevel: ContentRiskLevel;
  owner: ContentOwner;
  version: string;
  value: TValue;
  notes?: string;
}
```

Required metadata:

| Field | Meaning | Example |
| --- | --- | --- |
| `id` | Stable copy id used by registry, audit, and QA | `lifeMap.hint.leftHistory.v1` |
| `surface` | Product surface where the copy appears | `life-map` |
| `intent` | Job the copy performs | `dialogue-guidance` |
| `tone` | Editorial style | `careful` |
| `riskLevel` | Safety / privacy / decision-risk tier | `medium` |
| `owner` | Final owner for wording and consistency | `content-systems-narrative-architecture` |
| `version` | Registry release version | `v0.5` |
| `value` | String, list, template object, or policy object | `{ title, body, actions }` |

## 2. Naming Convention

Copy IDs use:

```text
surface.intent.variant.vN
```

Rules:

- `surface`: camelCase product surface, for example `landing`, `versionSelector`, `fiveQuestions`, `wechatImport`, `selfSkillPanel`, `timeline`, `lifeMap`, `chat`, `shareCard`, `aiOutput`.
- `intent`: short camelCase intent, for example `setExpectation`, `question`, `action`, `hint`, `disclosure`, `summarize`, `promptStyle`.
- `variant`: stable camelCase name for this specific copy group, for example `hero`, `leftHistory`, `privacyLocal`, `futureOption`.
- `vN`: major copy version suffix, for example `v1`.

Examples:

| Good ID | Use |
| --- | --- |
| `lifeMap.hint.leftHistory.v1` | Life Map left-history guidance |
| `wechatImport.disclosure.localAnalysis.v1` | Local-only privacy disclosure |
| `chat.action.generateShareCard.v1` | Chat-to-share navigation CTA |
| `aiOutput.promptStyle.dialoguePolicy.v1` | AI dialogue output policy |

Current audit enforcement:

- `npm run content:audit` checks `*_COPY` IDs against `surface.intent.variant.vN`.
- The same audit checks required metadata and verifies prompt / Share Card / Life Map integration.

## 3. Ownership Map

| Surface | Primary owner | Partner reviewers | Source files | Registry status | Immediate decision |
| --- | --- | --- | --- | --- | --- |
| Landing / entry | Content Systems | Product, UI | `src/components/Landing.tsx`, `src/lib/content/copyRegistry.ts` | Registered: `landing.setExpectation.hero.v1` | V0.5 CTA opens five questions directly |
| Version selector / entry | Content Systems | Product, Research, UI | `src/components/VersionSelector.tsx` | Deferred | V0.5 removes this surface; revisit only if V0.6 entry modes change landing surface |
| Five questions | Content Systems | Product, Research, AI | `src/components/QuestionFlow.tsx`, `src/lib/ai/prompts/selfSkill.v1.ts` | Needs registry entry | Keep core questions, review tags and progress line |
| WeChat import | Content Systems | Data, Privacy/Safety, Product | `src/components/WeChatImportStep.tsx`, `src/lib/wechatEngine.ts` | Needs registry entry | Keep privacy boundary, rewrite developer-facing token copy |
| Self Skill panel | Content Systems | Self Skill, Product, Safety | `src/components/SelfSkillPanel.tsx` | Needs registry entry | Rewrite mystical / anthropomorphic language |
| Timeline | Content Systems | Product, Self Skill, UI | `src/components/TimelineView.tsx` | Needs registry entry | Keep timeline concept, soften certainty labels |
| Life Map | Content Systems | Life Map, Self Skill, Product | `src/lib/content/lifeMapNarratives.ts`, `src/lib/selfSkill/forkTreeRules.ts`, `src/components/ForkPaths/*` | Partially registered | Move panel labels and map controls into registry |
| Chat | Content Systems | Voice, AI, Safety | `src/components/InstanceChat.tsx`, `src/lib/dialogueEngine.ts`, `src/lib/ai/prompts/dialogue.v1.ts` | Partially registered through output policy | Register quick questions, calibration, empty state |
| Share card | Content Systems | Product, UI, Safety | `src/components/ShareCard.tsx`, `src/lib/content/shareCardTemplates.ts` | Registered: `shareCard.summarize.resultTemplate.v1` | Keep, review viral tone before external sharing |

## 4. Current Registry Brief

Current registry entries cover:

- Global terms: `global.terms.canonical.v1`
- App metadata: `global.metadata.app.v1`
- Landing hero: `landing.setExpectation.hero.v1`
- Navigation: `navigation.action.global.v1`
- Privacy/safety disclaimer: `global.disclosure.privacySafety.v1`
- Loading lines: `loading.guideProgress.selfSkillGeneration.v1`
- Share card future-self lines: `shareCard.summarize.futureSelfLines.v1`
- Share card template: `shareCard.summarize.resultTemplate.v1`
- Life Map root narratives: `lifeMap.simulate.rootNarratives.v1`
- Life Map dialogue hints: `lifeMap.hint.dialogue.v1`
- Dynamic event labels: `dynamicEvent.typeLabel.coreTypes.v1`
- Product / Research boundaries: `global.boundary.productResearch.v1`
- AI output policy: `aiOutput.promptStyle.policy.v1`

Current gaps:

- Five questions, WeChat import, Self Skill panel, timeline, chat UI labels, Life Map panel labels, and map control hints still contain component-local strings.
- Life Map deep node narratives are owner-attributed via `ForkPath.content`, but many full strings still live inside `forkTreeRules.ts`.
- Product-sensitive labels such as `主线人格`, `未来的我`, `另一条路上的我`, and quick questions need Product & Research sign-off.

## 5. Top 20 Copy Fixes

| # | Surface | Current copy | Mark | Target ID | Reason |
| ---: | --- | --- | --- | --- | --- |
| 1 | Landing | `你一直在变化。像一条正在分岔的河流。` | Keep | `landing.setExpectation.hero.v1` | Strong brand signal, low safety risk, already registered |
| 2 | Landing | `开始五问` | Keep | `landing.action.startExperience.v1` | Matches V0.5 decision to remove the three-option pre-question entry |
| 3 | Landing | Past and fork selves later copy | Keep | `landing.setExpectation.hero.v1` | Makes clear the removed entry does not remove later Timeline or Life Map access |
| 4 | Version selector | `你今天想见哪个版本的自己？` | Defer | `versionSelector.frame.question.v1` | V0.5 surface removed; V0.6 can restore only with meaningful entry modes |
| 5 | Version selector | `继续进入这条时间线` | Defer | `versionSelector.action.continue.v1` | V0.5 surface removed |
| 6 | Five questions | `正在构建你的 Self Skill：{progress}%` | Rewrite | `fiveQuestions.progress.selfSkill.v1` | During answering, product is collecting material; generation has not started |
| 7 | Five questions | `你现在最纠结的一个选择是什么？` | Keep | `fiveQuestions.question.currentChoice.v1` | Clear and central to the flow |
| 8 | Five questions | `如果十年后的你回头看今天，你最希望 TA 说什么？` | Rewrite | `fiveQuestions.question.futureSentence.v1` | Replace `TA` with canonical `未来自我`; avoid mixed pronoun style |
| 9 | Five questions | Tags such as `我其实很害怕普通` | Needs product decision | `fiveQuestions.tag.hiddenSelf.v1` | High emotional charge; useful, but should be checked against research boundaries |
| 10 | WeChat import | `Local WeChat Lens` | Rewrite | `wechatImport.kicker.localLens.v1` | Mixed English/Chinese in a privacy-sensitive surface |
| 11 | WeChat import | Local-only privacy paragraph | Keep | `wechatImport.disclosure.localAnalysis.v1` | Clear privacy boundary and strong user trust signal |
| 12 | WeChat import | `未来接入真实 AI 时应使用分块、摘要树和证据索引，避免一次性消耗大量 token。` | Rewrite | `wechatImport.warning.largeInput.v1` | Developer jargon leaks into user-facing warning |
| 13 | WeChat import | `我会先生成一个隐私友好的摘要...` | Rewrite | `wechatImport.empty.preview.v1` | Product voice should say what LifeFork does, with less assistant-persona language |
| 14 | Self Skill panel | `你的 Self Skill 已被唤醒。` | Rewrite | `selfSkillPanel.heading.ready.v1` | Mystical framing increases overclaim risk |
| 15 | Self Skill panel | `主线人格` | Needs product decision | `selfSkillPanel.label.archetype.v1` | Could sound diagnostic; decide between `主线人格`, `自我原型`, or `叙事原型` |
| 16 | Self Skill panel | `它正在学习你的说法方式` | Rewrite | `selfSkillPanel.hint.voiceProfile.v1` | Anthropomorphic wording; should frame as language-profile estimate |
| 17 | Timeline | `这很准 ✓` | Rewrite | `timeline.action.confirmNode.v1` | Too absolute for generated interpretation; soften to user confirmation |
| 18 | Timeline | `打开时间河流` | Rewrite | `timeline.action.openLifeMap.v1` | Inconsistent with canonical `人生地图` and `时间线` |
| 19 | Life Map | `左侧来路 · 右侧未来 · 子节点进入父框` | Remove | `lifeMap.hint.canvasModel.v1` | Exposes implementation model; replace with task guidance or omit |
| 20 | Chat | `少一点 AI 味` | Needs product decision | `chat.calibration.lessAi.v1` | Useful user language, but may weaken product trust if shown as official copy |

## 6. Next Implementation Pass

1. Add registry entries for Version selector and Five questions.
2. Add registry entries for WeChat import and Self Skill panel, with Safety review on privacy and archetype labels.
3. Add registry entries for Timeline and Chat UI labels.
4. Move Life Map panel/control labels from `ForkPaths/*` into `copyRegistry.ts` or a dedicated `lifeMapNarratives.ts` export.
5. Extend `npm run content:audit` to fail on component-local copies for surfaces once each surface is fully migrated.
