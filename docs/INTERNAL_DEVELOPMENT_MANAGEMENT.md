# LifeFork / 人生岔路 - 内部开发管理与模块化演进文档

> 文档版本：Engineering Management Spec v1.3
> 当前项目阶段：V0.8 Release Candidate -> 受邀 Public Beta -> 开放 Public Beta
> 最后更新：2026-07-31
> 适用对象：产品、设计、前端、AI、数据、安全、QA、发布负责人
> 核心目标：把 LifeFork 作为可部署、可运营、可验证、可持续迭代的多人公开测试产品管理。

## 0. 文档优先级

当前实施和发布以以下材料为准：

1. `docs/PUBLIC_BETA_PRODUCT_SPEC.md`：产品范围和交互。
2. `docs/ANALYSIS_METHODS_AND_PROVENANCE.md`：方法、权重、来源和限制。
3. `docs/PUBLIC_BETA_TECHNICAL_REPORT.md`：当前技术实现和风险。
4. `docs/DEPLOYMENT_RUNBOOK.md`：生产部署与运行。
5. `docs/PUBLIC_BETA_TEAM_EXECUTION_PLAN.md`：当前任务分配、接口和验收。
6. 本文：长期模块 ownership、开发流程和 roadmap。

本文第 14 节为 V0.8 当前权威基线。第 7 节与第 12 节保留早期路线记录，不能作为当前版本状态。

---

## 1. 管理摘要

LifeFork 当前已经具备完整 Public Beta 候选链路：

1. 匿名访客进入公开测试版。
2. 回答五个核心问题。
3. 可选导入微信文本并在浏览器本地生成摘要。
4. 可选补充个人文字。
5. 选择分析方法、偏好和权重。
6. 服务器 AI 与本地规则生成 `SelfSkill`。
7. 查看结论、依据、参考度和限制。
8. 查看并编辑时间线。
9. 打开多时间尺度人生地图。
10. 查看每个分支的来源、收益、成本、假设和未知因素。
11. 进入阶段自我对话并校准语气。
12. 生成分享结果和导出 JSON。
13. 管理员通过 `/admin` 统一控制服务和功能。

当前最大工程问题：

1. 人生地图仍是最高风险模块，需要持续验证父子包含、缩放、拖动、连线和内存。
2. 会话限流仍保存在进程或 Worker isolate 内存中，只适合当前公测流量；运行配置在 Sites 使用 D1，在 Docker 使用 JSON 文件。
3. 自动化 E2E、视觉回归和地图模型单元测试尚未形成完整套件。
4. 正式隐私政策、AI 供应商数据协议和线上可观测性需要在开放公测前完成。
5. 语气学习目前达到阶段画像和对话校准，尚未形成长期版本学习。

V0.8 已完成的架构修正：

1. 人生地图使用 `stableScene`，同一节点只有一个场景实体。
2. 地图拆为规范化、稳定场景、动态可见容器、相机、节点、连线和编排层。
3. 状态管理拆为输入、生成、导航、地图、聊天和 UI slices。
4. 远程 AI 使用服务端硬开关、超时、schema 校验和本地降级。
5. OpenAI 与 DeepSeek 实际提供商和模型进入报告元数据。
6. 七类分析方法进入统一注册表，用户可以选择预设和权重。
7. 八字和紫微斗数只在服务端本地计算，必须获得用户同意。
8. 公开访客使用签名匿名会话，API 按会话限流。
9. 全局管理迁移到受服务端认证保护的 `/admin`。
10. Docker 加入健康检查、持久化配置、非 root 用户和资源上限。
11. OpenNext Cloudflare 构建、Sites 项目、D1 配置表和托管 Secret 已形成第二套生产运行路径。
12. Cloudflare 构建通过隔离环境变量避免将本机 `.env.local` 密钥写入产物。

可部署口径：

- 构建：`npm run build`。
- Cloudflare 构建：`npm run build:cloudflare`。
- 本地生产预览：`npm run start:3005`。
- 容器部署：`docker compose build && docker compose up -d`。
- Sites 部署：保存精确 Git commit 对应的 OpenNext 产物，再部署该版本。
- 无 AI key 或 AI 失败时保持本地闭环。
- 个人数据默认位于浏览器 localStorage。
- 全局配置在 Sites 写入 D1，在 Docker 写入 `data/runtime-config.json`。
- 生产演示使用 standalone 构建，避免开发 watcher 长时间占用资源。

---

## 2. 项目定位与工程原则

### 2.1 产品定位

LifeFork 是一个面向活人的自我认知与人生分支模拟系统。它通过有限输入生成可编辑、可解释、可对话的 `SelfSkill`，再用人生地图呈现不同时间尺度下的节点、分支、代价和可能性。

产品关键词：

- 自我模拟
- 语义时间缩放
- 人生分支
- 证据链接
- 语气学习
- 隐私优先
- 可编辑自我模型

### 2.2 非目标

产品和工程实现不得暗示以下能力：

- 确定预测未来。
- 心理诊断或医疗建议。
- 替用户做决定。
- 自动抓取微信或第三方私密数据。
- 上传意识、复刻人格、数字永生。
- 制造情感依赖。

### 2.3 工程原则

1. **本地可用优先**
   核心体验必须在无 API key、无后端数据库时可运行。

2. **AI 增强而非 AI 依赖**
   API 调用失败时，产品必须 fallback 到本地规则引擎，并保持流程闭环。

3. **证据优先**
   所有关于用户的关键判断应尽量链接到 `Evidence`。无法链接证据的判断必须降低 confidence 或标记为 generated。

4. **模型可编辑**
   用户必须能修正时间线、语气、节点、画像；修正结果应进入后续生成链路。

5. **地图逻辑先于视觉特效**
   人生地图的父子包含、时间尺度、连接线、节点可见性必须准确。视觉表现不得破坏结构理解。

6. **性能预算前置**
   地图交互不得依赖无上限 DOM、无节制动画或高频 React 状态写入。

7. **隐私边界显式化**
   任何外发给服务端或模型供应商的数据必须在代码和文案中可追踪。

---

## 3. 当前系统架构

> 第 3.1 至 3.3 节记录模块分层。V0.8 的服务器、方法和管理扩展以第 14 节为完整合同。

### 3.1 分层架构

```text
User Interaction
  ↓
React Components
  ↓
Zustand Store
  ↓
Local Engines / API Routes
  ↓
SelfSkill / ForkPath / Timeline / Dialogue State
  ↓
localStorage
```

当前项目同时存在两条生成路径：

```text
Local-first path:
User input
  -> lifeforkStore.createSkill()
  -> generateSelfSkill()
  -> SelfSkill
  -> localStorage

AI-enhanced path:
User input
  -> lifeforkStore.createSkill()
  -> POST /api/generate-self-skill
  -> DeepSeek or compatible LLM
  -> merge with local SelfSkill
  -> localStorage
```

聊天路径：

```text
User message
  -> lifeforkStore.sendMessage()
  -> POST /api/chat
  -> LLM reply
  -> fallback generateInstanceReply()
  -> messages persisted
```

微信导入路径：

```text
Raw WeChat text or file
  -> WeChatImportStep
  -> analyzeWeChatExport()
  -> WeChatAnalysis
  -> suggestedSelfSkillText
  -> createSkill()
```

后台编辑路径：

```text
Administrator opens /admin
  -> signed admin login
  -> POST /api/admin/session
  -> edit and validate RuntimeConfig
  -> GET or PUT /api/admin/config
  -> D1 lifefork_runtime_config on Sites
  -> data/runtime-config.json on Docker
  -> API routes enforce service and AI switches
  -> /api/public-config exposes only safe public flags
```

`EditorConsole` 仅管理当前浏览器的个人展示偏好，不拥有全局运营权限。

### 3.2 当前文件结构与职责

```text
src/
  app/
    page.tsx
    admin/page.tsx
    api/
      chat/route.ts
      generate-self-skill/route.ts
      wechat-analyze/route.ts
      health/route.ts
      public-config/route.ts
      admin/
        session/route.ts
        config/route.ts
  components/
    AppNav.tsx
    Landing.tsx
    VersionSelector.tsx   # legacy, V0.5 不挂载
    QuestionFlow.tsx
    WeChatImportStep.tsx
    ExtraTextStep.tsx
    GeneratingScreen.tsx
    SelfSkillPanel.tsx
    TimelineView.tsx
    InstanceChat.tsx
    ShareCard.tsx
    EditorConsole.tsx
    RuntimeConfigSync.tsx
    ForkPaths/
      index.tsx
      LifeMapCanvas.tsx
      LifeMapNode.tsx
      LifeMapLinks.tsx
      NodeDetailPanel.tsx
      ScaleSidebar.tsx
      CurrentRouteBar.tsx
      constants.ts
      types.ts
      utils.ts
      StateBar.tsx
      model/
        stableScene.ts
        visibility.ts
        camera.ts
        normalizeForkTree.ts
  lib/
    types.ts
    stores/lifeforkStore.ts
    selfSkillEngine.ts
    dialogueEngine.ts
    voiceEngine.ts
    wechatEngine.ts
    safety.ts
    storage.ts
    copy.ts
    editorConfig.ts
    runtimeConfig.ts
    ai/
      client.ts
      prompts.ts
      providers/
      schemas/
      tokenBudget.ts
    analysis/
    content/
    schema/
    selfSkill/
    server/
      publicSession.ts
      adminAuth.ts
      rateLimit.ts
      runtimeConfigStore.ts
      apiGuard.ts
```

后台运营模块：

```text
src/app/admin/page.tsx
  - 服务端认证
  - 服务状态
  - AI 提供商和模型
  - 功能开关
  - 保存状态和错误反馈

src/lib/server/runtimeConfigStore.ts
  - RuntimeConfig schema
  - defaults and normalization
  - D1 persistence on Sites
  - atomic filesystem persistence on Docker
  - safe public projection

scripts/start-standalone.mjs
  - production bootstrap
  - absolute data/runtime-config.json path
  - rebuild-safe persistence

scripts/build-cloudflare.mjs
  - secret-isolated OpenNext build
  - Cloudflare runtime adapter

scripts/prepare-sites-opennext.mjs
  - package OpenNext worker and static assets into dist
```

### 3.3 高复杂度文件

| 文件 | 当前行数 | 风险 | 处理策略 |
|---|---:|---|---|
| `src/lib/selfSkillEngine.ts` | legacy facade | 兼容旧入口，真实规则已逐步迁移到 `src/lib/selfSkill/*` | 最终降为 re-export 或删除 |
| `src/components/ForkPaths/LifeMapCanvas.tsx` | 中高 | 相机、手势和焦点编排集中 | 拆 hooks，补模型与视觉回归 |
| `src/lib/stores/lifeforkStore.ts` | 低 | 已变成 slice composer | 继续维护 slice contracts |
| `src/app/api/generate-self-skill/route.ts` | 中 | 仍承担 route orchestration | 拆 service，补 route tests |
| `src/app/admin/page.tsx` | 中 | V0.8 单页运营台 | 接入 IdP/RBAC 后拆分 settings panels |

---

## 4. 核心数据模型与模块耦合

### 4.1 `SelfSkill`

`SelfSkill` 是产品核心模型。任何模块扩展都必须优先评估是否影响该对象。

核心字段：

```ts
interface SelfSkill {
  id: string;
  version: string;
  createdAt: string;
  selectedVersion: SelfVersion;
  questions: FiveQuestionAnswers;
  extraText?: string;
  wechatAnalysis?: WeChatAnalysis;
  identity: IdentityProfile;
  voice: VoiceProfile;
  stageVoices: StageVoice[];
  semantic: SemanticProfile;
  decision: DecisionModel;
  timeline: TimelineNode[];
  evidence: Evidence[];
  claims: Claim[];
  forks: ForkPath[];
}
```

### 4.2 `ForkPath`

`ForkPath` 是人生地图的节点、聊天实例的上下文、分享卡片的来源。

关键约束：

1. `id` 必须稳定，不得用渲染顺序生成。
2. `parentId` 必须和 `children` 一致。
3. `scale` 表示语义尺度，不等于视觉尺寸。
4. 子节点必须逻辑上落在父节点时间段内部。
5. `stateVector` 只表达模拟状态，不表达事实判断。
6. `futureSelfVoice` 应由 `VoiceProfile` 和 `StageVoice` 共同影响。

### 4.3 耦合矩阵

| 模块 | 读取 | 写入 | 强耦合对象 | 风险 |
|---|---|---|---|---|
| `lifeforkStore` | 所有 slice | composed state | `LifeforkState` | 中 |
| `SelfSkillPanel` | `SelfSkill` | step | identity、semantic、claims | 低 |
| `TimelineView` | timeline | timeline | `TimelineNode` | 中，直接写 store |
| `ForkPaths` | forks、previewForkId | previewForkId、selectedFork | `ForkPath`、layout | 高 |
| `InstanceChat` | messages、voice、fork | messages、voice calibration | `ChatMessage`、`VoiceProfile` | 中 |
| `WeChatImportStep` | raw text | `WeChatAnalysis` | `WeChatAnalysis` | 中，未来大文本会升级 |
| `EditorConsole` | `EditorConfig` | `EditorConfig` | 当前浏览器的个人展示偏好 | 低，不具备运营权限 |
| `/admin` | `RuntimeConfig` | `RuntimeConfig` | 全局服务状态、AI 提供商、功能开关和公告 | 高，必须服务端认证 |
| API routes | request body | response JSON | partial `SelfSkill` | 中，缺 schema validation |
| `storage` | localStorage | localStorage | serialized objects | 高，缺 migration |

### 4.4 `EditorConfig` 与 `RuntimeConfig`

`EditorConfig` 保留为当前浏览器的个人展示偏好。它可以调整本地文案预览、导航标签和分享句，不拥有全局运营权限，也不会影响其他访问者。

当前字段：

```ts
interface EditorConfig {
  version: string;
  updatedAt: string;
  landing: {
    brandKicker: string;
    headline: [string, string];
    body: string;
    primaryAction: string;
    secondaryAction: string;
  };
  global: {
    disclaimer: string;
    deploymentMode: "local-preview" | "static-hosted" | "server-hosted";
    aiMode: "local-fallback" | "api-enhanced";
    editorNotes: string;
  };
  nav: Record<string, string>;
  share: {
    futureSelfLines: string[];
  };
  features: {
    demoScenario: boolean;
    wechatImport: boolean;
    aiApi: boolean;
    editorConsole: boolean;
  };
}
```

当前应用范围：

- `Landing`：读取首页品牌、标题、正文、按钮、免责声明。
- `AppNav`：读取导航标签、演示样本开关、后台入口开关。
- `QuestionFlow`：读取微信导入开关，决定五问后进入微信导入或额外文本。
- `GeneratingScreen`：读取本地体验偏好；服务端是否启用 AI 以 `RuntimeConfig` 和 `/api/public-config` 为准。
- `ShareCard`：读取免责声明，并通过 `decisionBrief` 生成与当前方案一致的决策摘要。
- `selfSkillSlice.createSkill()`：同时读取公开运行配置，决定是否请求 `/api/generate-self-skill`。
- `chatSlice.sendMessage()`：同时读取公开运行配置，决定是否请求 `/api/chat`。

全局运营模型为 `RuntimeConfig`：

```text
/admin
  -> signed HttpOnly admin session
  -> /api/admin/config
  -> D1 on Sites / atomic JSON on Docker
  -> /api/public-config safe projection
  -> API route enforcement
```

后续迁移目标：

```text
single administrator password
  -> external IdP
  -> role-based access control
  -> immutable audit log
  -> approval workflow for high-risk changes
```

### 4.5 依赖方向规则

允许：

```text
components -> store -> engines/storage/api
components -> pure view utilities
api routes -> ai client/prompts
engines -> types/copy/safety/voice/wechat
```

禁止：

```text
engines -> components
storage -> components
ai client -> client components
ForkPaths model -> Zustand store
types -> runtime implementation
```

---

## 5. 用户交互流程

### 5.1 主状态机

```text
landing
  <-> editor
  -> questions
  -> wechat-import
  -> extra-text
  -> generating
  -> self-skill
  -> timeline
  -> forks
  -> chat
  -> share
```

编辑后台流程：

```text
landing / any foreground step
  -> AppNav 后台编辑
  -> EditorConsole
  -> edit draft
  -> 保存全局配置
  -> 前台组件即时读取更新后的 editorConfig
  -> 可复制/下载配置 JSON
  -> 可导入配置 JSON
```

### 5.2 新用户完整路径

| 步骤 | 用户行为 | 组件 | Store action | 产物 |
|---|---|---|---|---|
| 1 | 点击开始 | `Landing` | `startNewExperience` | step=`questions`, selectedVersion=`future` |
| 2 | 回答五问 | `QuestionFlow` | `setAnswer` | answers |
| 3 | 导入微信或跳过 | `WeChatImportStep` | `setWechatRaw`、`setWechatAnalysis` | `WeChatAnalysis` |
| 4 | 粘贴额外文本或跳过 | `ExtraTextStep` | `setExtraText`、`createSkill` | input bundle |
| 5 | 选择分析预设，可选展开高级权重 | `AnalysisMethodStep` | `setAnalysisSettings` | `AnalysisSettings` |
| 6 | 等待生成 | `GeneratingScreen` | `createSkill` | `SelfSkill` |
| 7 | 查看决策摘要和详细画像 | `SelfSkillPanel`、`DecisionBriefPanel` | `setStep` | `DecisionBrief` |
| 8 | 编辑时间线 | `TimelineView` | store timeline actions | updated timeline |
| 9 | 打开地图 | `ForkPaths` | `setPreviewForkId`、`selectFork` | selected fork |
| 10 | 对话 | `InstanceChat` | `sendMessage`、`tuneVoice` | messages、voice |
| 11 | 分享/导出 | `ShareCard` | `resetExperience` | decision summary、JSON、copy text |

### 5.3 返回用户路径

返回用户通过 `hydrateFromStorage()` 恢复：

- `lifefork.selfSkill`
- `lifefork.currentStep`
- `lifefork.selectedFork`
- `lifefork.chatMessages`
- `lifefork.wechatAnalysis`
- `lifefork.editorConfig`

后续必须加入 schema migration：

```text
load raw JSON
  -> detect schemaVersion
  -> migrate to current version
  -> validate required fields
  -> repair fork parent-child consistency
  -> hydrate store
```

---

## 6. 模块级开发管理

### 6.1 Product & Research Team

职责：

- 定义用户问题、核心体验、文案边界。
- 维护需求文档和用户研究记录。
- 明确每个 roadmap 的用户价值。
- 负责竞品对照和可用性测试脚本。

负责文件：

- `docs/LIFEFORK_FINAL_REQUIREMENTS_AND_DESIGN.md`
- `README.md` 的产品说明部分
- `docs/USER_RESEARCH.md`
- `docs/ETHICAL_CHARTER.md`

关键交付：

- 每个版本的 Product Requirement Brief。
- 用户旅程图。
- 验收标准。
- 反模式清单，例如过度命运化、过度治疗化、过度陪伴化。

协作接口：

- 向 AI Team 提供输出语气规范。
- 向 UI Team 提供交互优先级。
- 向 QA Team 提供可用性测试任务。

### 6.2 UX / UI / Motion Team

职责：

- 设计沉浸式但可理解的界面。
- 维护视觉系统、信息层级、动效规范。
- 优化地图、时间线、聊天、分享卡片的可用性。

负责文件：

- `src/app/globals.css`
- `tailwind.config.ts`
- `src/components/*.tsx`
- `src/components/ForkPaths/*.tsx`

当前重点：

1. 人生地图的语义缩放。
2. 父框退成半透明底图的可读性。
3. 当前尺度节点必须是可读卡片。
4. 选中节点、父子同屏、子框同屏的镜头行为。
5. 分享卡片截图观感。

验收标准：

- 当前尺度文字可读。
- 上层框不抢视觉焦点。
- 子节点在父框内部关系清楚。
- 拖动和缩放反馈一致。
- 移动端布局不遮挡核心操作。

### 6.3 Core App / State Team

职责：

- 管理状态机、持久化、hydration、schema migration。
- 降低 store 复杂度。
- 定义模块间事件和 action。

负责文件：

- `src/app/page.tsx`
- `src/lib/stores/lifeforkStore.ts`
- `src/lib/storage.ts`
- `src/lib/types.ts`

当前拆分状态：

```text
src/lib/stores/
  lifeforkStore.ts          # compose store
  slices/navigationSlice.ts
  slices/inputSlice.ts
  slices/selfSkillSlice.ts
  slices/forkSlice.ts
  slices/chatSlice.ts
  slices/uiSlice.ts
```

新增模块：

```text
src/lib/schema/
  versions.ts
  migrations.ts
  validateSelfSkill.ts
  repairForkTree.ts
```

验收标准：

- store 单文件小于 180 行。
- 每个 slice 有明确输入输出。
- localStorage 读取失败不会白屏。
- 旧版本 `SelfSkill` 可迁移。
- 所有 destructive action 都有确认。

Round 4 管理要求：

- Core App Team 当前重点从拆分 store 转为恢复矩阵和状态契约验收。
- V0.5 必须证明刷新、坏数据、demo sample 覆盖、map/chat/share 往返都不会白屏或混入旧状态。

### 6.4 Self Skill & Simulation Engine Team

职责：

- 维护本地 fallback 生成引擎。
- 管理人格画像、证据、时间线、分支树生成规则。
- 让本地模型在无 API 情况下仍有可演示价值。

负责文件：

- `src/lib/selfSkillEngine.ts`
- 未来拆分后的 `src/lib/selfSkill/*`

拆分目标：

```text
src/lib/selfSkill/
  localGenerator.ts
  profileRules.ts
  evidenceBuilder.ts
  timelineRules.ts
  forkTreeRules.ts
  stateVectorRules.ts
  archetypeRules.ts
  fixtures.ts
```

模块职责：

| 子模块 | 职责 |
|---|---|
| `profileRules` | values、fears、desires、innerConflict、archetype |
| `evidenceBuilder` | 从五问、额外文本、微信摘要构建 evidence |
| `timelineRules` | 生成和修复时间线 |
| `forkTreeRules` | 生成多层人生地图树 |
| `stateVectorRules` | 生成 autonomy、stability 等状态变量 |
| `localGenerator` | 组装完整 `SelfSkill` |

验收标准：

- 每个生成规则可单测。
- `ForkPath.parentId` 与 `children` 一致。
- 每条核心 claim 至少有一个 evidence 或标记 generated。
- 本地生成耗时低于 200ms。
- 不使用随机结果破坏快照测试；需要随机时必须可注入 seed。

### 6.5 Life Map / Visualization Team

职责：

- 负责人生模拟地图的结构、布局、交互和性能。
- 维护语义缩放与地图操作规范。

负责文件：

- `src/components/ForkPaths/index.tsx`
- `src/components/ForkPaths/LifeMapCanvas.tsx`
- `src/components/ForkPaths/LifeMapNode.tsx`
- `src/components/ForkPaths/LifeMapLinks.tsx`
- `src/components/ForkPaths/NodeDetailPanel.tsx`
- `src/components/ForkPaths/ScaleSidebar.tsx`
- `src/components/ForkPaths/CurrentRouteBar.tsx`
- `src/components/ForkPaths/constants.ts`
- `src/components/ForkPaths/types.ts`
- `src/components/ForkPaths/utils.ts`
- `src/components/ForkPaths/StateBar.tsx`
- `src/components/ForkPaths/model/stableScene.ts`
- `src/components/ForkPaths/model/visibility.ts`
- `src/components/ForkPaths/model/camera.ts`
- `src/components/ForkPaths/model/normalizeForkTree.ts`

当前设计规则：

1. 人生从左到右展开。
2. 当前生活点默认在镜头中心。
3. 出生、早年、过去节点、暗线从左侧汇入现在。
4. 未来分支从现在向右生长。
5. 大尺度节点在当前尺度下表现为可读卡片。
6. 上一层父框在进入下一层尺度时变为半透明底图。
7. 下层子节点必须在父框内部浮现。
8. 父子关系高亮时，其他连线虚化。
9. 双击节点在三种 focus mode 间切换：单框、父子同屏、子框同屏。
10. 拖动节点时，其后代保持相对位置，祖先容器自适应。

拆分计划：

```text
src/components/ForkPaths/
  index.tsx                 # compose only
  ScaleSidebar.tsx
  LifeMapCanvas.tsx
  LifeMapLinks.tsx
  LifeMapNode.tsx
  NodeDetailPanel.tsx
  CurrentRouteBar.tsx
  hooks/
    useSemanticCamera.ts
    useNodeDrag.ts
    useFocusMode.ts
  model/
    normalizeForkTree.ts
    stableScene.ts
    visibility.ts
    camera.ts
```

当前生产结构已经包含 `LifeMapCanvas`、`LifeMapNode`、`LifeMapLinks`、`stableScene`、`visibility` 和 `camera`。`hooks/` 是下一步对交互编排的提取目标，不得再引入第二套 layout 或 connector。

性能预算：

- 默认节点数量：小于 120。
- V0.5 最大渲染节点：小于 300。
- 单次 wheel/pointer move 不允许触发全树重建超过 1 次。
- 拖动时相机和节点不得使用 1s 级 transition。
- 地图初始加载低于 500ms。
- 生产预览不出现浏览器 console error。

验收场景：

1. 全人生尺度：多条主线是小卡片，不是巨大容器。
2. 十年尺度：当前十年卡片文字可读，上层全人生框退到底层。
3. 阶段尺度：90 天、一季、几年节点能在父框内部出现。
4. 一年/月/周/天/小时尺度：子节点不跑到父框外。
5. 双击同一节点三次：单框 → 父子同屏 → 子框同屏 → 单框。
6. 拖动父节点：全部后代同步移动。
7. focus lock 不停在空白区域。
8. 缩放方向与触控反馈一致。

### 6.6 Voice & Dialogue Team

职责：

- 学习用户说话方式。
- 管理不同人生阶段的语气迁移。
- 管理本地 dialogue fallback 和 API prompt 对齐。

负责文件：

- `src/lib/voiceEngine.ts`
- `src/lib/dialogueEngine.ts`
- `src/components/InstanceChat.tsx`
- `src/lib/ai/prompts.ts` 的 dialogue 部分

长期目标：

1. 从五问、额外文本、微信摘要提取语言特征。
2. 维护 `VoiceProfile`。
3. 维护 `StageVoice[]`。
4. 在每个 `ForkPath` 实例中应用对应阶段语气。
5. 支持用户反馈：“像我”、“少一点 AI 味”、“更口语”、“更克制”、“更锋利”。
6. 将校准反馈持续写入 `SelfSkill.voice.calibrationNotes`。

验收标准：

- 不同阶段回复有可感知差异。
- 回复避免泛化鸡汤。
- 回复长度符合界面可读性。
- 用户反馈后 closenessScore 有变化，且后续回复反映该变化。
- 危机关键词触发后不继续人生模拟。

Round 4 管理要求：

- Voice & Dialogue Team 必须补充连续发送、quick question 快速点击、校准后下一轮变化、390px 移动端聊天布局的 browser-use 证据。
- 语气校准必须通过 Core persistence 保持在 map -> chat 往返后仍生效。

### 6.7 WeChat / Data Ingestion Team

职责：

- 维护微信聊天记录导入、解析、脱敏和摘要。
- 为 Self Skill 提供可控的信号，而非直接保存全部原文。

负责文件：

- `src/components/WeChatImportStep.tsx`
- `src/lib/wechatEngine.ts`
- `src/app/api/wechat-analyze/route.ts`

当前 V0 输入：

- 粘贴文本。
- 上传 `.txt`、`.csv`、`.json`、`.html`、`.md`。

V0 限制：

- 只分析前 8000 行。
- 基于规则词典提取主题和情绪。
- 基础脱敏手机号、邮箱、链接。

Roadmap：

1. 分块解析。
2. 摘要树。
3. 说话人归一。
4. PII 检测增强。
5. 用户可选择保留原文、只保留摘要、全部删除。
6. 增量导入和去重。
7. 本地 worker 处理大文件，避免主线程阻塞。

验收标准：

- 10MB 文本导入不会卡死 UI。
- PII 默认不展示在分享卡片。
- 微信原文默认不进入 API prompt。
- 用户能明确看到“本地分析”和“外发摘要”的差异。

### 6.8 AI Gateway & Prompt Team

职责：

- 管理 API route、LLM client、prompt、JSON schema、fallback。
- 控制 token 预算和错误行为。

负责文件：

- `src/app/api/generate-self-skill/route.ts`
- `src/app/api/chat/route.ts`
- `src/app/api/wechat-analyze/route.ts`
- `src/lib/ai/client.ts`
- `src/lib/ai/prompts.ts`

必须补齐：

1. `DEEPSEEK_API_KEY` 缺失时直接返回 AI disabled，不发起 `Bearer undefined` 请求。
2. 所有 API route 增加 request schema validation。
3. 所有 LLM JSON response 增加 schema validation。
4. prompt 版本化。
5. token budget 显式化。
6. 每次 API 调用返回 `meta.llmUsed`、`meta.fallbackReason`。

未来目录：

```text
src/lib/ai/
  client.ts
  providers/
    deepseek.ts
    openai.ts
    local.ts
  prompts/
    selfSkill.v1.ts
    dialogue.v1.ts
    wechat.v1.ts
  schemas/
    selfSkillResponse.ts
    chatResponse.ts
    wechatResponse.ts
```

验收标准：

- 无 API key 时主流程无报错。
- LLM 返回非 JSON 时前端仍可用。
- prompt 不携带不必要原文。
- API 失败不破坏 localStorage。

Round 4 管理要求：

- AI Gateway Team 当前重点从目录拆分转为 API contract regression。
- `AI_DISABLED`、provider error、non-JSON、schema validation failed 都必须有可重复验收。
- 每条 API 都必须稳定返回 `meta.llmUsed`、`meta.fallbackReason` 和 `promptVersion`。

### 6.9 Safety / Privacy / Ethics Team

职责：

- 管理危机拦截、隐私边界、免责声明、数据删除、外发确认。

负责文件：

- `src/lib/safety.ts`
- `src/lib/copy.ts`
- `README.md` 隐私说明
- 未来新增 `docs/PRIVACY_MODEL.md`
- 未来新增 `docs/SAFETY_POLICY.md`

安全规则：

1. 危机关键词触发后停止人生模拟。
2. 不做心理诊断。
3. 不提供自伤或伤害他人指导。
4. 不把“未来自我”说成真实预言。
5. 分享卡片默认隐藏原文、人名、细节。
6. 清空数据必须确认。
7. 外发 API 的数据类型必须有 UI 文案说明。

验收标准：

- `自杀`、`不想活`、`伤害自己`、`杀人`、`报复` 等关键词在生成和聊天链路均触发安全回复。
- 危机回复不包含诊断语言。
- 用户能导出和删除 Self Skill。

### 6.10 QA / Release / DevOps Team

职责：

- 维护验证命令、运行规范、性能预算、发布流程。

负责文件：

- `package.json`
- `next.config.ts`
- CI 配置文件（未来新增）
- `docs/INTERNAL_DEVELOPMENT_MANAGEMENT.md`
- `src/lib/editorConfig.ts` 的部署配置字段

运行规范：

```bash
npm install
npm run lint
npm run build
npm run preview:3005
```

开发规范：

```bash
npm run dev:3005
```

注意：

- 交互试用优先生产预览 `preview:3005`。
- 默认使用 Turbopack dev；Webpack 仅保留为兼容问题定位入口。
- Next root 必须锁定项目目录，避免扫描用户 home。
- 不允许多个 3003/3004/3005 dev server 同时挂着。

验收标准：

- `npm run lint` 通过。
- `npm run build` 通过。
- `http://localhost:3005` 可访问。
- 浏览器 console 无 error。
- 服务端无 `EMFILE`、watcher restart 风暴。

### 6.11 Content Systems / Narrative Architecture Team

状态：已建立 owner，V0.5 起进入 Review。

职责：

- 管理页面文案、地图节点叙事、结果摘要标签、AI 输出口径和动态类型文案。
- 建立文案 registry、文案 ID、surface、intent、tone、riskLevel、version。
- 把 Product & Research 的文案边界转成可维护的数据结构。
- 和 AI Team 对齐 prompt 输出语气，和 UI Team 对齐页面文案调用。

负责文件：

- `src/lib/content/copyRegistry.ts`
- `src/lib/content/types.ts`
- `src/lib/content/lifeMapNarratives.ts`
- `src/lib/content/shareCardTemplates.ts`
- `src/lib/editorConfig.ts`
- `src/components/EditorConsole.tsx`
- `src/lib/copy.ts`
- `src/lib/ai/prompts/*` 的输出口径
- `src/lib/selfSkill/forkTreeRules.ts` 中的节点叙事
- `scripts/audit-content-registry.mjs`

当前落地：

- Evidence artifact：`docs/COPY_REGISTRY_BRIEF.md`。
- `contentRegistry` 已作为主入口，覆盖页面文案、导航、加载文案、分享卡模板、Life Map root narrative、AI output policy、动态类型文案和 Product & Research boundary。
- `ForkPath.content` 已接入节点叙事 attribution，字段包含 `surface`、`intent`、`tone`、`riskLevel`、`owner`、`version`。
- AI prompt 已统一注入 Content Systems 输出口径，避免 Self Skill、聊天、微信摘要使用不同概念边界。
- 新增 `npm run content:audit`，作为新增文案和主流程接入的轻量检查。

验收标准：

- 主流程关键文案都有 owner。
- 新文案必须带 `surface`、`intent`、`tone`、`riskLevel`、`owner`、`version`。
- 分享卡、Life Map、AI 回复使用统一文案口径。
- 不再出现同一概念在不同页面随意换词。
- `npm run content:audit`、`npm run lint`、`npx tsc --noEmit` 通过。

### 6.12 Editor Console / Internal Ops Team

状态：V0.5 新增，当前为 localStorage 管理台。

职责：

- 提供编辑可用的全局配置窗口。
- 允许非工程人员修改首页、导航、免责声明和功能开关。
- 提供配置导出、下载、导入、恢复默认。
- 为未来 CMS/API 后台提供字段模型和交互原型。

负责文件：

- `src/components/EditorConsole.tsx`
- `src/lib/editorConfig.ts`
- `src/lib/stores/slices/uiSlice.ts`
- `src/lib/stores/types.ts`
- `src/components/AppNav.tsx`
- `src/components/Landing.tsx`
- `src/components/ShareCard.tsx`
- `src/components/GeneratingScreen.tsx`

当前能力：

- 编辑首页品牌、两行标题、正文、主按钮、副按钮。
- 编辑全局免责声明。
- 编辑导航标签。
- 查看结果页动态生成规则；通用随机建议已停用。
- 设置部署模式：`local-preview`、`static-hosted`、`server-hosted`。
- 设置 AI 模式：`local-fallback`、`api-enhanced`。
- 开关演示样本、微信导入、AI API、后台编辑。
- 微信导入开关会影响五问后的实际流程。
- AI API 开关会影响生成和聊天是否请求 API route。
- 复制和下载配置 JSON。
- 导入配置 JSON。
- 恢复默认配置。

V0.5 限制：

- 没有身份认证。
- 没有服务端持久化。
- 多设备不会同步。
- localStorage 清理后配置丢失。

MVP 前必须补齐：

- `/admin` 独立 route。
- 登录和角色权限。
- 配置版本历史。
- 配置发布/回滚。
- 字段级校验。
- 审计日志。

验收标准：

- 不需要 Self Skill 也能进入后台编辑。
- 保存后刷新页面仍保留后台配置。
- 首页、导航、分享卡片能读取更新后的配置。
- 导入非法 JSON 不导致白屏。
- 关闭后台编辑开关后入口隐藏，但现有 step 不崩溃。

### 6.13 Life Scenario Lab Team

状态：已建立 owner，V0.5 起纳入 Scenario Lab 管理。

Owner：Scenario Lab Lead

职责：

- 设计可演示、可测试、可回放的完整人生样本。
- 管理 scenario fixture、choice set、代表路径、边界案例和 QA 验收数据。
- 为 Life Map、Self Skill、QA 提供稳定测试资产。

负责文件：

- `src/lib/scenarios/fullLifeDemoFixture.ts`
- `src/lib/scenarios/types.ts`
- `docs/SCENARIO_FIXTURE_BRIEF.md`

设计原则：

- “每年每月两个以上分岔”用 choice set 表达，不一次性指数级展开到画布。
- 地图只渲染当前尺度和当前路径附近节点。
- 代表路径必须能从出生回放到死亡，并能进入对话和分享。

验收标准：

- 一个完整人生 demo fixture 可跑通。
- 每个尺度至少有一个可进入节点。
- 任意 choice set 至少 2 个选项。
- 可见节点控制在 120 个以内。

---

## 7. 历史 Roadmap（V0.5 至早期 MVP 设想）

### 7.1 V0.5 — 稳定可演示版

目标：修复当前原型最大稳定性风险，让产品可以连续演示 30 分钟不崩、不乱、不丢数据。

周期：1-2 周。

#### 7.1.1 Runtime Safety

Owner：QA / DevOps Team
Dependencies：Core App Team

任务：

- 保持 `dev` 使用 webpack + disabled source maps。
- `preview:3005` 作为默认试用命令。
- 显式检查并记录端口占用。
- 文档中加入进程清理 runbook。

验收：

- 生产预览启动不产生 watcher 日志。
- 3005 只有一个服务进程。
- 连续刷新 20 次无内存异常。

#### 7.1.2 Life Map Interaction Stabilization

Owner：Life Map Team
Dependencies：UX Team、Self Skill Team

任务：

- 修正父子包含关系。
- 当前尺度节点显示为可读卡片。
- 上层父框半透明退底。
- 下层节点必须在父框内部。
- zoom/pan/drag 行为一致。
- focus lock 不停空白区域。

验收：

- 完成 8 个地图验收场景。
- 交互时无 console error。
- 节点数量小于 120 时不卡顿。

#### 7.1.3 Store Split Preparation

Owner：Core App Team

任务：

- 为 store action 写出边界清单。
- 把纯 helper 移出 store。
- 增加 schema version 常量。
- 加入 migration placeholder。

验收：

- `lifeforkStore.ts` 降到 300 行以下。
- 旧数据加载不白屏。

#### 7.1.4 AI Disabled Guard

Owner：AI Gateway Team

任务：

- `DEEPSEEK_API_KEY` 缺失时返回 `success:false`、`error:"AI_DISABLED"`。
- 前端静默 fallback。
- README 标明 API 模式。

验收：

- 删除 `.env.local` 后生成和聊天仍完整可用。
- 服务端不请求外部 API。

#### 7.1.5 Editor Console Deployability

Owner：Editor Console / Internal Ops Team
Dependencies：Core App Team、Content Systems Team、QA / DevOps Team

任务：

- 新增 `EditorConfig`。
- 新增 `EditorConsole`。
- 接入 `Landing`、`AppNav`、`ShareCard`、`GeneratingScreen`。
- 支持配置保存、导出、导入、恢复默认。
- 文档说明 V0.5 localStorage 限制和 MVP CMS 迁移路径。

验收：

- 生产预览里导航能进入后台编辑。
- 修改首页标题并保存后，回到主页立即生效。
- 刷新页面后配置仍存在。
- 下载的 JSON 可再次导入。
- `npm run lint` 和 `npm run build` 通过。

### 7.2 V0.6 — 模块化和可测试版

目标：让多人可以并行开发，并建立可回归验证。

周期：2-3 周。

#### 7.2.1 Split Self Skill Engine

Owner：Self Skill Team

任务：

- 拆 `selfSkillEngine.ts`。
- 为 profile/timeline/fork/evidence 增加单测。
- 建立固定 fixtures。

验收：

- 单文件小于 300 行。
- 规则输出有快照测试。
- fork tree parent-child 一致性测试通过。

#### 7.2.2 Split ForkPaths

Owner：Life Map Team

任务：

- 拆出 `useSemanticCamera`。
- 拆出 `useNodeDrag`。
- 保持现有 `LifeMapNode`、`LifeMapLinks`、`NodeDetailPanel` 的职责边界。
- `index.tsx` 只负责 compose。

验收：

- `ForkPaths/index.tsx` 小于 250 行。
- hook 可独立测试纯计算部分。
- `LIFE_MAP_INTERACTION_SPEC.md` 中 LM-01 至 LM-10 全部通过。

#### 7.2.3 Add Test Harness

Owner：QA Team

任务：

- 引入 Playwright 或等价 E2E。
- 增加核心 happy path。
- 增加地图交互 smoke test。
- 增加 safety test。

验收：

- CI 可运行 `lint`、`build`、基础 E2E。
- 关键流程失败会阻止 PR 合并。

### 7.3 V0.7 — 语气学习和数据导入增强版

目标：强化“像用户本人”和“可持续学习”的核心差异化。

周期：3-4 周。

#### 7.3.1 Voice Profile v2

Owner：Voice & Dialogue Team

任务：

- 统计句长、停顿、常用开头、否定方式。
- 支持阶段语气差异。
- 让每个 `ForkPath` 匹配 stage voice。
- 语气校准反馈进入下一轮生成。

验收：

- 对同一问题，不同阶段回复差异明显。
- 用户点击“更口语/更克制/更锋利”后，下一轮回复体现变化。

#### 7.3.2 WeChat Chunking v1

Owner：WeChat Team

任务：

- 文件解析放到 Web Worker。
- 10MB 文本分块处理。
- 生成摘要树。
- PII 检测和脱敏增强。

验收：

- 10MB 文件导入 UI 不冻结。
- 原文可删除，只保留摘要。
- selfSkillSignals 可追溯到脱敏片段。

### 7.4 V0.8 — 人生地图编辑器

目标：用户可以主动编辑人生分支，而不是只读取系统生成的节点。

周期：3-5 周。

任务：

- 新增节点。
- 删除节点。
- 重命名节点。
- 修改时间尺度。
- 修改父节点。
- 合流节点。
- 锁定重要节点。
- 保存布局。

Owner：Life Map Team、Core App Team、UX Team

验收：

- 用户新增节点后进入对话。
- 修改父节点后连接线和容器正确重算。
- 删除节点有确认，并可撤销。
- 布局存入 localStorage。

### 7.5 MVP 1.0 — 可公开测试版

目标：面向小范围用户发布，可收集真实反馈。

周期：6-8 周。

范围：

- 用户完整 onboarding。
- 本地 fallback。
- 可选 AI API。
- Self Skill export/import。
- schema migration。
- 稳定人生地图。
- 语气学习 v2。
- 微信导入 v1。
- 基础隐私面板。
- E2E 覆盖主流程。

验收：

- 20 名用户完成完整体验。
- 10 分钟内获得第一条有效洞察。
- 70% 用户能理解人生地图结构。
- 50% 用户进入分支自我对话。
- 0 个 P0 数据丢失问题。
- 0 个已知卡死问题。

---

## 8. 开发流程

### 8.1 分支策略

```text
main
  └── codex/<task-name>
```

要求：

- 每个 PR 聚焦一个模块或一个明确问题。
- 地图模块和 selfSkill engine 不应在同一 PR 大改。
- 文档和代码同时变更时，PR 描述必须说明行为变化。

### 8.2 PR 模板

每个 PR 必须包含：

```markdown
## Summary
- 改了什么
- 为什么改

## Scope
- 涉及模块
- 不涉及模块

## Verification
- npm run lint
- npm run build
- 浏览器验证项

## Risk
- 可能影响的用户流程
- fallback 行为

## Screenshots / Notes
- UI 变化截图或说明
```

### 8.3 Code Review Checklist

通用：

- 类型是否准确。
- 是否破坏 local fallback。
- 是否引入不必要全局状态。
- 是否增加隐私外发。
- 是否有安全边界。
- 是否更新文档。

地图模块：

- 父子关系是否正确。
- 子节点是否在父框内部。
- 当前尺度文字是否可读。
- 连线是否从左右边缘或标签锚点出发。
- focus mode 是否可恢复。
- pan/zoom/drag 是否跟手。

AI 模块：

- prompt 是否带入过长原文。
- API key 缺失是否 fallback。
- JSON parse 失败是否 fallback。
- 输出是否避免绝对预测。

数据导入：

- 是否脱敏。
- 是否限制文件大小。
- 是否阻塞主线程。
- 是否明确外发边界。

### 8.4 Definition of Done

一个任务完成必须满足：

1. 代码实现完成。
2. `npm run lint` 通过。
3. `npm run build` 通过。
4. 相关文档更新。
5. 关键路径人工或自动验证。
6. 不留下无用运行进程。
7. 不引入 console error。
8. 不引入隐私边界不明的数据传输。

### 8.5 需求管理与工作分发

当前版本工作单、需求 ID、状态流转、跨团队依赖和汇报节奏统一维护在：

- `docs/TEAM_WORK_ORDERS.md`

执行要求：

- 每个 PR 必须关联至少一个 `LF-<AREA>-<NUMBER>` 需求 ID。
- 没有满足 Definition of Ready 的需求不得进入开发。
- 涉及隐私、安全、AI 输出、分享字段的需求必须经过 Safety / Privacy / Ethics Team 复核。
- Product & Research Team 每周更新 active work orders，QA Team 每周更新验收状态。
- scope 变更必须同步到需求文档，不能只写在 PR 描述或聊天记录里。

---

## 9. QA 与测试计划

### 9.1 自动化测试层级

```text
Unit tests
  - engines
  - safety
  - storage migration
  - fork tree normalization

Component tests
  - QuestionFlow
  - TimelineView
  - InstanceChat
  - LifeMapNode / LifeMapLinks

E2E tests
  - happy path
  - no API fallback path
  - map interaction smoke
  - crisis safety path
```

### 9.2 必测用户路径

1. 新用户完整生成。
2. 跳过微信和额外文本。
3. 导入微信文本后生成。
4. API key 缺失 fallback。
5. 聊天 API 失败 fallback。
6. 危机关键词触发。
7. 时间线编辑后进入地图。
8. 人生地图选择节点后进入聊天。
9. 分享卡片复制和 JSON 导出。
10. 清空本地数据。

### 9.3 性能测试

重点指标：

- 初次加载时间。
- 生成 Self Skill 时间。
- 地图切换尺度帧率。
- wheel/pinch 响应。
- 大文本导入耗时。
- localStorage 写入大小。

预算：

| 指标 | V0.8 目标 |
|---|---:|
| 首页可交互 | < 2s |
| Self Skill 本地生成 | < 200ms |
| 地图首次渲染 | < 500ms |
| 地图节点数量 | < 120 |
| 单个 `SelfSkill` localStorage 大小 | < 1MB |
| 微信导入 UI 冻结 | 0 |

---

## 10. 风险登记表

| 风险 | 等级 | 影响 | 当前缓解 | 后续动作 |
|---|---:|---|---|---|
| dev server watcher 过载 | P0 | 卡死机器 | 使用 webpack dev；生产预览优先；锁 root | CI 和 README 固化 |
| 人生地图结构错误 | P0 | 核心体验失败 | stableScene + visibility + camera 单一实现 | 增加 E2E 和结构测试 |
| AI key 缺失导致 500 | P1 | 日志噪音，fallback 不透明 | 前端 catch fallback | API guard |
| 微信文本过大卡 UI | P1 | 浏览器冻结 | V0 截断前 8000 行 | Web Worker 分块 |
| localStorage schema 漂移 | P1 | 旧用户数据坏掉 | `refreshLegacyForkTree` 临时修复 | migration system |
| 语气不像用户 | P1 | 核心差异化不足 | voiceEngine v1 | Voice v2 |
| 分享泄露隐私 | P1 | 用户信任风险 | 默认隐藏原文 | 分享字段白名单 |
| 过度心理化表达 | P1 | 安全与伦理风险 | safety 文案 | 审核 prompt 和 copy |

---

## 11. 文档体系

当前文档：

- `README.md`：项目入口、运行方式、V0 功能。
- `PROJECT_DOCS.md`：技术结构和模块说明。
- `docs/LIFEFORK_FINAL_REQUIREMENTS_AND_DESIGN.md`：最终产品需求和设计规划。
- `docs/USER_RESEARCH.md`：用户研究、PRB、旅程图、竞品对照、可用性测试脚本。
- `docs/ETHICAL_CHARTER.md`：伦理原则、文案红线、敏感场景、数据规则、发布门槛。
- `docs/TEAM_WORK_ORDERS.md`：团队工作分发、需求 ID、状态流转、跨团队依赖和汇报节奏。
- `docs/LIFEFORK_AUDIT_REPORT.md`：当前代码与功能巡检报告。
- `docs/INTERNAL_DEVELOPMENT_MANAGEMENT.md`：内部研发管理、模块拆分、roadmap 和协作规范。

建议新增：

- `docs/PRIVACY_MODEL.md`
- `docs/SAFETY_POLICY.md`
- `docs/LIFE_MAP_INTERACTION_SPEC.md`
- `docs/VOICE_MODEL_SPEC.md`
- `docs/WECHAT_IMPORT_SPEC.md`
- `docs/TEST_PLAN.md`
- `docs/RELEASE_RUNBOOK.md`

---

## 12. 历史执行清单

### 12.1 立即执行

- [x] 保持 3005 使用生产预览。
- [x] 修 `DEEPSEEK_API_KEY` 缺失 guard。
- [x] 后台编辑台接入前台文案、功能开关、AI/local fallback 控制。
- [x] 维护 `LIFE_MAP_INTERACTION_SPEC.md`，作为地图不变量和回归场景的当前契约。
- [ ] 为地图建立父子关系结构测试。
- [ ] 拆 `ForkPaths/index.tsx` 的 camera hook。
- [ ] 拆 `selfSkillEngine.ts` 的 fork tree 部分。

### 12.2 本周执行

- [ ] store slice 拆分设计。
- [ ] schema migration v0。
- [ ] WeChat Web Worker 技术方案。
- [ ] Voice Profile v2 设计。
- [ ] E2E happy path。

### 12.3 本月执行

- [ ] 人生地图编辑器 v0。
- [ ] 多版本 Self Skill。
- [ ] 导入/导出 Self Skill。
- [ ] 隐私面板。
- [ ] 内测反馈面板。

---

## 13. 历史阶段结论

LifeFork 当前已经具备产品原型的完整闭环，但工程上仍处于“关键模块可用、协作边界不足”的阶段。下一步不应继续堆功能，应优先完成三件事：

1. 稳定人生地图的结构语义和交互行为。
2. 拆分高复杂度模块，建立团队边界。
3. 建立隐私、安全、测试和运行规范。

该阶段工作已经进入 V0.8。当前判断、团队任务和发布门禁见第 14 节。

---

## 14. V0.8 Public Beta 当前权威基线

### 14.1 架构分层

```text
Presentation
  Landing / Questions / WeChat / Methods / Report / Timeline / Map / Chat / Share / Admin
        |
Application State
  Zustand slices + explicit step dependencies + RuntimeConfigSync
        |
Domain
  Self Skill rules / method registry / integrated analysis / voice / fork tree
        |
Server Application
  public session / rate limit / API guards / AI gateway / cultural calculators / admin config
        |
Infrastructure
  localStorage / D1 / runtime-config.json / provider APIs / OpenNext / Sites / Docker / reverse proxy
```

依赖方向：

1. Presentation 可以依赖 Application State 和 Domain 类型。
2. Application State 可以编排 Domain 与 API。
3. Domain 禁止依赖 React、Zustand、localStorage 和 API route。
4. API route 负责边界校验和调用，不承载复杂规则。
5. 提供商实现只能通过 AI gateway 暴露。
6. 人生地图模型禁止读取全局 store。

### 14.2 当前模块合同

| 模块 | Owner | 输入 | 输出 | 允许依赖 | 禁止依赖 |
| --- | --- | --- | --- | --- | --- |
| Input Flow | UX + Core | 用户主动输入 | `GenerateSelfSkillInput` | Copy、Store | AI provider |
| WeChat Parser | Data | 有界文本 | `WeChatAnalysis` | 纯工具 | localStorage、UI |
| Method Registry | Self Skill | preset、weights | normalized methods | Types | React |
| Cultural Calculators | Self Skill + Safety | 出生信息、同意 | `MethodAnalysisResult[]` | server-only 库 | AI provider |
| Local Generator | Self Skill | bounded input | `SelfSkill` | domain rules | API、UI |
| Integrated Analysis | Self Skill | skill、methods、model meta | `IntegratedAnalysis` | method registry | UI |
| AI Gateway | AI | prompt、schema、session ID | validated result + meta | provider adapters | components |
| Runtime Config | Ops | admin mutation | `PublicRuntimeConfig` | server fs | personal data |
| Public Session | Ops + Safety | signed cookie | session + safety ID | crypto | user profile |
| Store | Core | UI actions、API result | application state | Domain、Storage | provider SDK |
| Life Map Model | Map | fork tree、viewport、focus | scene、visibility、camera | pure geometry | Store、AI |
| Life Map View | Map + UX | scene props | interactive DOM/SVG | model | domain mutation |
| Report | UX + Self Skill | `SelfSkill` | readable provenance report | Content | new conclusions |
| Admin | Ops | authenticated config | global runtime behavior | admin APIs | personal data |

### 14.3 用户主流程合同

```text
landing
  -> questions
  -> wechat-import optional
  -> extra-text optional
  -> methods
  -> generating
  -> self-skill
  -> timeline
  -> forks
  -> chat
  -> share
```

每个步骤必须定义：

- 进入依赖。
- 空状态。
- 返回路径。
- 保存行为。
- 失败降级。
- 隐私说明。
- 下一步。

任何步骤依赖缺失时，状态恢复必须返回最近可用步骤。

### 14.4 分析来源合同

支持的方法：

1. `user-evidence`
2. `behavioral-pattern`
3. `population-statistics`
4. `ai-synthesis`
5. `mbti-stage`
6. `bazi`
7. `ziwei`

每条主要 insight 必须包含：

- 结论。
- 贡献方法。
- 归一化权重。
- 参考度。
- evidence IDs。
- 限制。

每个分支节点必须包含：

- 来源说明。
- 方法贡献。
- 参考评分。
- 假设。
- 未知因素。
- 用户可执行的验证动作。

文化方法不能：

- 覆盖用户事实。
- 提高统计概率。
- 触发确定性命运结论。
- 在用户未同意时执行。

### 14.5 多人公开服务合同

当前多人含义：

- 多位访客可以同时访问同一服务。
- 每位访客使用独立匿名签名会话。
- 每位访客个人数据保存在自己的浏览器。
- AI 密钥统一由服务器持有。
- API 请求按匿名会话限流。

当前多人不包含：

- 账号。
- 云端个人资料。
- 用户之间协作。
- 管理员多角色。
- 多实例共享限流。

### 14.6 管理后台合同

`/admin` 必须提供：

- 服务状态。
- AI 开关。
- 微信导入开关。
- 文化方法开关。
- 演示入口开关。
- 默认分析预设。
- 前台测试标签。
- 公告。
- 隐私提示。
- AI 提供商配置状态。

安全要求：

- 管理密码只在服务端。
- 管理 Cookie 为 HttpOnly 和 SameSite Strict。
- 修改请求校验来源。
- 配置写入原子化。
- 不显示密钥。
- 公开导航不显示管理入口。

### 14.7 当前团队和 ownership

| 团队 | 当前 P0 | 主要目录 | 合同审阅 |
| --- | --- | --- | --- |
| Product & Research | 可用性与指标 | `PRODUCT.md`, product docs | 所有用户语义 |
| UX / UI | 主流程、报告、响应式 | `src/components`, `globals.css` | Component props |
| Core App & State | schema、迁移、恢复 | `src/lib/stores`, `storage`, `schema` | `types.ts` |
| Self Skill & Methods | 规则、来源、权重 | `src/lib/selfSkill`, `analysis` | `IntegratedAnalysis` |
| Life Map | 拓扑、布局、相机、交互 | `ForkPaths` | Scene contract |
| Voice & Dialogue | 阶段语气、校准 | `voiceEngine`, dialogue | VoiceProfile |
| Data Ingestion | 微信解析与脱敏 | `wechatEngine`, import UI | WeChatAnalysis |
| AI Gateway | 提供商、prompt、schema | `src/lib/ai`, AI APIs | provider response |
| Safety & Privacy | 同意、危机、分享 | safety and policy docs | data inventory |
| Ops Platform | Admin、运行、部署 | `src/lib/server`, admin, OpenNext, Sites, D1, Docker | RuntimeConfig |
| QA & Release | 门禁和证据 | `scripts`, future tests | release gate |

每个团队的可复制执行任务、非目标、验收命令和回传格式见：

- `docs/PUBLIC_BETA_TEAM_EXECUTION_PLAN.md`

### 14.8 当前 Roadmap

#### RC 稳定化

范围：

- 完成代码和文档。
- 静态门禁。
- 浏览器全流程。
- 地图回归。
- OpenNext / Sites 和 Docker 配置验证。
- GitHub PR。

退出条件：

- 无 P0 功能阻塞。
- 生产依赖漏洞为 0。
- 管理、AI、本地降级和文化方法可用。
- 生产预览内存稳定。

#### 受邀 Public Beta

范围：

- 20 至 100 名用户。
- 可用性和来源理解。
- AI 成本、延迟和降级。
- 地图错误和内存。

退出条件：

- 主流程完成率达到 70%。
- P0 安全事件为 0。
- 地图阻塞率低于 3%。
- AI P95 低于 30 秒。

#### 开放 Public Beta

发布前必须完成：

- Redis 限流。
- 正式隐私政策和条款。
- 管理身份服务。
- Playwright E2E。
- 地图视觉回归。
- 线上指标和告警。
- AI 成本硬预算。

#### 账户与长期模型

后续范围：

- 可选账号。
- 加密同步。
- Self Skill 版本。
- 阶段语气版本。
- 行动实验。
- 长期反馈校准。

该阶段需要单独的数据保护影响评估。

### 14.9 Definition of Ready

任务进入开发前必须具备：

1. Requirement ID。
2. 用户问题。
3. 范围和非目标。
4. Owner。
5. 输入与输出合同。
6. 依赖模块。
7. 验收标准。
8. 验证命令或冒烟路径。
9. 隐私和安全影响。
10. 回滚方式。

### 14.10 Definition of Done

任务完成必须满足：

1. 代码和类型完成。
2. 相关文档更新。
3. `npm run check` 通过。
4. 生产依赖审计通过。
5. `npm run build` 通过。
6. 相关浏览器路径通过。
7. 高风险模块提供截图或 fixture。
8. 无 console error。
9. 无密钥和个人原文进入日志或 Git。
10. PR 说明影响、验证、风险和回滚。

### 14.11 发布门禁

```bash
npm ci
npm run check
npm audit --omit=dev
npm run build
docker compose config
```

人工门禁：

- 五问到分享完整流程。
- AI 成功和降级。
- 文化方法同意和关闭。
- 时间线编辑。
- 地图缩放、拖动、双击焦点和父子包含。
- 对话安全切换。
- 管理配置和维护模式。
- 桌面与移动。
- 空闲和交互后内存。

### 14.12 当前风险登记

| 风险 | 等级 | 当前控制 | 下一步 |
| --- | --- | --- | --- |
| 地图结构回归 | P0 | stableScene、可见性和相机拆分 | 单元与视觉回归 |
| 单实例限流 | P1 | 进程内有界 Map | Redis |
| 运行配置单实例 | P1 | JSON + 持久卷 | 共享配置服务 |
| AI 成本 | P1 | 限流、开关、模型配置 | 成本账本与硬预算 |
| 个人数据丢失 | P1 | JSON 导出 | 账户和加密同步 |
| 微信第三方隐私 | P1 | 主动导入、原文不持久化 | 脱敏预览和正式同意 |
| 文化结果误读 | P1 | 低参考度、独立分类 | 可用性测试 |
| 阶段 MBTI 标签化 | P1 | 倾向和限制 | 四维连续分数 |
| 自动化覆盖不足 | P1 | 静态和场景校验 | Unit + Playwright |
| 管理单密码 | P1 | HttpOnly、签名、同源 | IdP + RBAC |
