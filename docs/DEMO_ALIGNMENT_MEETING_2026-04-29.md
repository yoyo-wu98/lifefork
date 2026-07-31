# LifeFork Demo Alignment Meeting — 2026-04-29

> Meeting owner: Product & Research Team
> Sprint principle: 演示版先追求体验完整跑通、可用、不崩溃。伦理、FAQ、传播包装后置。
> Current decision: Life Map、文案系统、样本案例和入口路径必须进入 V0.5 稳定演示版的管理节奏。

## 1. Current Progress

已确认：

- 主流程已具备从首页到 Self Skill、时间线、人生地图、对话、分享卡片的基本链路。
- `npm run lint` 和 `npm run build` 当前可通过。
- `http://localhost:3005` 已可作为演示预览地址。
- Life Map 已经有语义缩放、父子节点、连接线、当前路线、详情面板等基础能力。

当前判断：

- 产品已经不是“完全不可用”，但还没有达到“演示版体验完整跑通”的标准。
- 最大风险不在单个按钮，而在 Life Map 的结构理解、镜头可读性、内容一致性和样本覆盖不足。

## 2. Blocking Problems

### P0-1 Life Map 逻辑层级不清

复测现象：

- `现在 -> 晚年` 和 `现在 -> 3 年后` 在用户视角里容易被理解为同级节点。
- 代码数据中 `3 年后` 是 `稳定延续线` 的子节点，但视觉呈现没有稳定表达“3 年后包含在晚年人生线里”。
- `3 年` 当前被放在 `decade` 尺度，语义上不严谨，容易让地图的尺度系统失信。

管理结论：

- Life Map Team 不允许只修线条样式，必须重做“时间包含模型 + 可视容器规则 + 连线取点规则”的验收闭环。
- Self Skill & Simulation Engine Team 必须提供可验证的时间区间数据，不能只给 `scale` 和 `children`。

### P0-2 Life Map 视口与命中区域不稳定

复测现象：

- 主线卡片和父容器在全人生视角下会跑到视口边缘，用户看到的是空白、局部卡片或被裁切区域。
- 当前镜头容易锁在“现在”而不是“现在 + 主线选择区”。
- 父容器、子节点和卡片的点击命中容易不符合用户预期。

管理结论：

- 这属于演示阻塞，不是视觉小瑕疵。
- Life Map Team 和 UX / UI Team 共同负责，QA 必须用截图和交互录像验收。

### P0-3 文案没有统一 owner

当前文案散落在：

- `src/lib/copy.ts`
- `src/lib/selfSkill/forkTreeRules.ts`
- `src/lib/dialogueEngine.ts`
- `src/lib/ai/prompts/*`
- `src/components/*.tsx`
- `src/components/ForkPaths/*.tsx`

管理结论：

- 当前团队结构缺少“Content Systems / Narrative Architecture Team”。
- 必须新增该团队，负责文案结构、文案 ID、页面文案、节点叙事、分享卡模板、AI prompt 口径和未来多语言扩展。

### P0-4 演示样本不足

当前问题：

- 现有样本能展示一些分支，但不足以证明产品可以承载完整人生模拟。
- 用户提出“从出生到病死，每年每月都有两个以上选择分岔，并且都可选择体验”的样本要求。

管理结论：

- 必须新增 “Life Scenario Lab Team”。
- 需要把“完整人生样本”做成 fixture 和 QA 测试资产。
- 全量指数级展开会导致节点爆炸，因此产品上应采用“按尺度懒展开 + 选择集 + 代表路径回放”，不在单屏一次性渲染所有组合。

### P1-1 动态 MBTI 可以进入规划

当前判断：

- 分享卡和全流程可以加入 MBTI 元素，但不能做成固定标签贴纸。
- 应设计为动态类型画像：用户在不同人生线、时间尺度、压力状态下的类型倾向变化。

管理结论：

- Dynamic MBTI 进入 V0.6 设计任务，V0.5 只预留数据结构和分享卡展示槽位。

### P1-2 初始三选项需要重评

当前入口是：

- 未来的我
- 过去的我
- 另一条路上的我

当前问题：

- `selectedVersion` 对后续体验影响有限。
- 用户后续仍会进入同一套五问、同一套 Self Skill、同一套地图和聊天。

管理结论：

- 如果 V0.5 不能让这三个入口显著改变后续体验，就应移除该选择，默认进入五问。
- 如果保留，必须把它改成“入口镜头模式”：未来入口默认打开 Life Map；过去入口默认打开 Timeline；另一条路入口默认高亮 forked path。

## 3. Team Dispatch

### 3.1 Life Map / Visualization Team

Owner: Life Map Lead
Priority: P0
Requirement IDs: `LF-MAP-002`, `LF-MAP-003`

Must deliver:

- 明确 `现在 -> 晚年` 是 life container，`现在 -> 3 年后` 是其内部 checkpoint。
- 子节点必须在父容器内可见，连线必须接到父容器或父标签的正确边界。
- 全人生默认镜头必须同时看见“现在”和至少 3 条主线卡片。
- 地图不能造成页面横向溢出。
- 点击父线、点击子节点、进入对话都必须稳定。

Acceptance:

- 1440px 宽桌面截图中，Life Map 外框不超出屏幕。
- 全人生视角可读到四条主线，而不是空白画布。
- 点击“稳定延续线”后，`3 年后` 和 `10 年后` 在该父线内部浮现。
- `现在 -> 晚年 -> 3 年后 -> 第 1 年 -> 第 3 个月 -> 23:40` 路径可逐级进入。
- Browser console error 为 0。

Dependencies:

- Self Skill Team 提供时间区间模型。
- UX Team 提供镜头和容器视觉规则。
- QA Team 提供截图验收。

### 3.2 Self Skill & Simulation Engine Team

Owner: Simulation Lead
Priority: P0
Requirement IDs: `LF-SKILL-002`

Must deliver:

- 扩展 `ForkPath` 的语义模型，增加明确的时间区间和包含规则。
- 修正 `3 年` 被归入 `decade` 的语义问题。
- 输出每个节点的 `durationMonths`、`timeRange`、`containmentRole`、`orderIndex`。
- 生成树必须通过 parent-child consistency 和 time containment validation。

Acceptance:

- 子节点时间区间必须落在父节点时间区间内。
- 每条 life path 至少有 `life -> year/era -> month/week/day/hour` 的可演示钻取链。
- 不允许只有视觉层知道父子关系，数据层必须能验证。

Dependencies:

- Life Map Team 使用该模型渲染。
- Scenario Lab Team 使用该模型生成样本。

### 3.3 UX / UI / Motion Team

Owner: UX Lead
Priority: P0
Requirement IDs: `LF-UI-002`

Must deliver:

- Life Map 的视口、导航、Semantic Zoom、当前路线、详情面板在桌面和窄屏下不遮挡。
- 主线卡片、父容器、子节点有明确视觉语法。
- 全人生视角不显示巨大空白。
- 当前读取、当前尺度、读取框等调试信息可读但不压迫核心体验。

Acceptance:

- 1440px、1280px、390px 三档截图通过。
- “框超出屏幕”的截图问题消失。
- 卡片文字不溢出，不互相压住。

Dependencies:

- Life Map Team 提供真实交互状态。
- QA Team 提供截图矩阵。

### 3.4 Content Systems / Narrative Architecture Team

Status: New team required
Owner: Content Systems Lead
Priority: P0
Requirement IDs: `LF-COPY-001`

Why this team is required:

- 当前没有团队对“页面文案、节点叙事、AI 输出口径、分享卡模板、文案数据结构”统一负责。
- Product & Research 只能定义文案边界，不能长期管理全部文案资产。

Must own:

- 文案 registry。
- 页面文案 ID。
- Life Map 节点叙事模板。
- 分享卡模板。
- AI prompt 输出风格。
- MBTI / dynamic type 标签文案。

Proposed data model:

```text
CopyEntry
  id
  surface
  intent
  shortText
  longText
  variables
  tone
  riskLevel
  owner
  version
```

Acceptance:

- V0.5 主流程所有关键文案有 owner。
- 新增文案必须带 surface 和 intent。
- Life Map 节点不再散落成不可管理的硬编码叙事。

Dependencies:

- Product & Research 提供文案边界和反模式。
- AI Team 使用统一 prompt copy。
- UI Team 使用 registry 输出页面文案。

### 3.5 Life Scenario Lab Team

Status: New team required
Owner: Scenario Lab Lead
Priority: P0
Requirement IDs: `LF-SCENARIO-001`

Must deliver:

- 一个高质量、细颗粒度、可反复测试的完整人生 demo fixture。
- 覆盖出生、早年、青春期、大学、工作、关系、转向、稳定、疾病、衰老、死亡等阶段。
- 每年和每月都有至少两个选择集。
- 所有选择都可进入体验，但不要求同屏全量渲染所有指数级组合。

Required approach:

- 使用 choice set 表示每个时间单位的两个以上选择。
- 使用 lazy expansion 控制地图渲染规模。
- 使用 representative path replay 展示“全人生跑通”。
- QA 使用 fixture 验证选择、进入、回退、分享、恢复。

Acceptance:

- Fixture 可在 120 个可见节点以内演示完整人生。
- 每个尺度至少有一个可进入节点。
- 任意选择集至少 2 个选项。
- 从出生到死亡的代表路径可完整回放。

Dependencies:

- Self Skill Team 提供 schema。
- Life Map Team 支持 lazy expansion。
- QA Team 建立 fixture regression。

### 3.6 Dynamic MBTI Working Group

Owner: Product + Content Systems + Self Skill + UI
Priority: P1
Requirement IDs: `LF-MBTI-001`

Decision:

- 不做静态 MBTI 标签。
- 做动态类型画像：人在不同选择线、压力状态、人生阶段下的类型倾向变化。

Proposed model:

```text
DynamicTypeProfile
  baseType
  currentType
  confidence
  dimensions
    E_I
    S_N
    T_F
    J_P
  stageTypes[]
  forkTypeShifts[]
  evidenceIds[]
```

Share card direction:

- 展示“当前类型倾向”。
- 展示“在这条人生线上的类型漂移”。
- 用证据解释，不把 MBTI 当成命运标签。

Acceptance:

- 分享卡能显示一条动态类型变化。
- 类型文案不制造确定性判断。
- 数据结构能被导出到 Self Skill JSON。

### 3.7 Onboarding / Entry Team

Owner: Product + UX + Core App
Priority: P0
Requirement IDs: `LF-ONBOARD-001`

Decision:

- 当前“三个版本的自己”入口对后续体验影响不足。
- V0.5 必须选择一个方向：移除，或让它真的改变后续路径。

Option A: Remove for demo

- 首页按钮直接进入五问。
- 默认 selectedVersion 为 `future`。
- 减少首次体验摩擦。

Option B: Make it meaningful

- 未来入口：生成后默认打开 Life Map。
- 过去入口：生成后默认打开 Timeline，并高亮过去节点。
- 另一条路入口：生成后默认打开 Life Map，并高亮替代分支。

Recommendation:

- V0.5 采用 Option A。
- V0.6 再恢复为“入口镜头模式”。

Acceptance:

- 新用户少一步即可开始输入。
- 不再出现“选了但后面没差别”的体验落差。

## 4. Sprint Priority

### This sprint must finish

1. `LF-MAP-002`: Life Map semantic containment.
2. `LF-MAP-003`: Life Map viewport and camera containment.
3. `LF-COPY-001`: Content Systems Team setup and copy registry design.
4. `LF-SCENARIO-001`: Full-life demo fixture brief.
5. `LF-ONBOARD-001`: Entry simplification decision.

### This sprint may design but not build

1. `LF-MBTI-001`: Dynamic MBTI model.
2. Advanced map editor.
3. Public FAQ.
4. Full ethical charter expansion.

## 5. Reporting Cadence

Daily async update:

```markdown
Team:
Requirement ID:
Yesterday:
Today:
Blocked:
Needs:
Evidence:
```

Wednesday integration check:

- Life Map Team presents screenshots and current failure list.
- Self Skill Team presents schema contract.
- Content Systems Team presents copy ownership map.
- Scenario Lab Team presents fixture outline.
- QA presents browser-use verification notes.

Friday acceptance review:

- Product & Research decides whether demo can be shown.
- QA must show screenshots and console results.
- Any task without evidence stays `Review`, not `Accepted`.
