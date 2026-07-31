# LifeFork / 人生岔路 - 项目技术参考

> 版本: v0.8 Public Beta Release Candidate
> 最后更新: 2026-07-31
> 文档用途: 代码结构、数据模型和接口参考
>
> 当前发布架构、风险和运行结论以 `docs/PUBLIC_BETA_TECHNICAL_REPORT.md` 为准。本文保留较细的类型和模块说明，遇到旧版 local editor 或 V0.6 表述时，以 V0.8 文档覆盖。

---

## 目录

1. [项目概述](#1-项目概述)
2. [系统架构](#2-系统架构)
3. [模块划分与职责](#3-模块划分与职责)
4. [数据模型](#4-数据模型)
5. [API 文档](#5-api-文档)
6. [状态管理](#6-状态管理)
7. [AI 集成](#7-ai-集成)
8. [UI 组件树](#8-ui-组件树)
9. [安全与伦理](#9-安全与伦理)
10. [开发指南](#10-开发指南)
11. [部署指南](#11-部署指南)
12. [未来路线图](#12-未来路线图)

---

## 配套文档

- [最终需求与设计规划](docs/LIFEFORK_FINAL_REQUIREMENTS_AND_DESIGN.md)
- [V0.8 公开测试产品规范](docs/PUBLIC_BETA_PRODUCT_SPEC.md)
- [分析方法、权重与来源规范](docs/ANALYSIS_METHODS_AND_PROVENANCE.md)
- [V0.8 技术审计与重构报告](docs/PUBLIC_BETA_TECHNICAL_REPORT.md)
- [人生地图交互规范](docs/LIFE_MAP_INTERACTION_SPEC.md)
- [部署与运维手册](docs/DEPLOYMENT_RUNBOOK.md)
- [Public Beta 团队执行计划](docs/PUBLIC_BETA_TEAM_EXECUTION_PLAN.md)
- [用户研究与产品需求简报](docs/USER_RESEARCH.md)
- [伦理章程](docs/ETHICAL_CHARTER.md)
- [团队工作分发与需求管理](docs/TEAM_WORK_ORDERS.md)
- [演示版对齐会议纪要 2026-04-29](docs/DEMO_ALIGNMENT_MEETING_2026-04-29.md)
- [演示版第二轮对齐会议纪要 2026-04-29](docs/DEMO_ALIGNMENT_MEETING_2026-04-29_ROUND_2.md)
- [演示版第三轮对齐会议纪要 2026-04-29](docs/DEMO_ALIGNMENT_MEETING_2026-04-29_ROUND_3.md)
- [AI / Core / Voice 管理复核 2026-04-30](docs/DEMO_ALIGNMENT_MEETING_2026-04-30_AI_CORE_VOICE.md)
- [全团队巡检与需求安排 2026-04-30](docs/DEMO_ALIGNMENT_MEETING_2026-04-30_FULL_TEAM_REVIEW.md)
- [V0.5 演示版指挥中心](docs/V0_5_DEMO_COMMAND_CENTER.md)
- [当前代码与功能巡检报告](docs/LIFEFORK_AUDIT_REPORT.md)
- [内部开发管理与模块化演进文档](docs/INTERNAL_DEVELOPMENT_MANAGEMENT.md)

本文件聚焦技术结构。团队拆分、模块 ownership、roadmap、QA、发布规范以内部开发管理文档为准。

---

## 1. 项目概述

### 1.1 产品定位

LifeFork 是一个**自我认知引擎与分支人生模拟器**。用户通过 5 个核心问题 + 可选材料输入，生成一个结构化 **Self Skill**（自我模型），然后与不同人生路径上的“自己”对话。

产品边界：LifeFork 提供可解释、可编辑、可删除的可能性模拟。阶段 MBTI、八字和紫微斗数均标明方法、参考度和限制，不用于诊断或确定预测。

### 1.2 核心概念

| 概念 | 定义 |
|------|------|
| **Self Skill** | 用户的结构化自我模型（JSON），包含身份、价值观、记忆、决策模式、时间线 |
| **Instance** | Self Skill 在某个时间/分支上的运行实例（如"35 岁的我"） |
| **ForkPath** | 一条人生岔路（如"激进转向" / "稳定延续" / "试验渐变"） |
| **LifeScale** | 时间尺度（全人生 → 十年 → 阶段 → 年 → 月 → 周 → 天 → 小时） |
| **Evidence** | 每条 AI 判断对应的用户原文证据 |
| **Voice Profile** | 从用户语言中提取的语气特征（用于 AI 对话时模仿用户风格） |

### 1.3 技术栈

| 层 | 技术 |
|----|------|
| 框架 | Next.js 16.2.12 App Router；支持 OpenNext Cloudflare 与 standalone 两种生产输出 |
| 语言 | TypeScript 5.7 |
| UI | React 19 + Tailwind CSS 3.4 + Framer Motion 11 |
| 状态管理 | Zustand 5 |
| AI | 本地 fallback；服务器可选 OpenAI Responses API 或 DeepSeek |
| 存储（当前） | 浏览器 localStorage |
| 存储（计划） | PostgreSQL + pgvector |
| 后台运营（当前） | `/admin` + 服务端认证；Sites 使用 D1，Docker 使用 `runtime-config.json` |
| 后台运营（计划） | IdP + RBAC + 共享配置服务 + 审计日志 |

### 1.4 V0.8 当前运行合同

```text
Browser
  -> localStorage personal Self Skill
  -> signed anonymous session
  -> guarded Next.js APIs
       -> local rules
       -> OpenAI or DeepSeek
       -> Bazi and Zi Wei local calculators

Admin
  -> /admin
  -> signed admin session
  -> D1 on Sites / runtime-config.json on Docker
```

公开多人能力当前表示多位匿名访客可同时访问。每位访客的个人分析留在自己的浏览器。服务端统一持有 AI key、执行限流并提供全局开关。

---

## 2. 系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                            │
│                                                                      │
│  ┌──────────────────────┐    ┌────────────────────────────────────┐ │
│  │   zustand Store       │    │  UI Components                     │ │
│  │   lifeforkStore.ts    │◄───│  Landing / QuestionFlow /          │ │
│  │   + slices/*          │    │  WeChatImport / ExtraText /        │ │
│  │                      │     │  Generating / EditorConsole /      │ │
│  └──────────┬───────────┘    │  SelfSkillPanel / TimelineView /    │ │
│             │                │  ForkPaths modules /                │ │
│             │                │  InstanceChat / ShareCard /         │ │
│             │                │  AppNav / ProgressOrb / BadgeToast  │ │
│             │                └────────────────────────────────────┘ │
│             │                                                       │
│  ┌──────────┴───────────┐    ┌────────────────────────────────────┐ │
│  │  Engines (lib/)       │    │  Storage (lib/storage.ts)           │ │
│  │  selfSkillEngine.ts   │    │  localStorage CRUD wrapper          │ │
│  │  dialogueEngine.ts    │    │  Keys: lifefork.selfSkill /         │ │
│  │  voiceEngine.ts       │    │  .currentStep / .selectedFork /     │ │
│  │  wechatEngine.ts      │    │  .chatMessages / .wechatAnalysis    │ │
│  │  safety.ts            │    │  + editorConfig local settings      │ │
│  │  editorConfig.ts      │    └────────────────────────────────────┘ │
│  └──────────────────────┘                                          │
│                                                                      │
│  fetch() ────────────────────────────────────────────────────►      │
└──────────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP (JSON)
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      SERVER (Next.js API Routes)                      │
│                                                                       │
│  ┌─────────────────────┐  ┌──────────────────┐  ┌─────────────────┐ │
│  │ /api/generate-      │  │ /api/chat         │  │ /api/wechat-    │ │
│  │ self-skill          │  │ POST              │  │ analyze         │ │
│  │ POST                │  │ Dialogue with     │  │ POST            │ │
│  │ Generate SelfSkill  │  │ fork instance     │  │ Deep WeChat     │ │
│  │ from 5 answers      │  │                   │  │ analysis        │ │
│  └─────────┬───────────┘  └────────┬──────────┘  └────────┬────────┘ │
│            │                       │                       │          │
│  ┌─────────┴───────────────────────┴───────────────────────┴────────┐ │
│  │                    lib/ai/client.ts                               │ │
│  │                    Optional DeepSeek API Client                   │ │
│  │                    chatCompletion() / chatCompletionJSON()        │ │
│  └────────────────────────────────┬─────────────────────────────────┘ │
│                                   │                                    │
└───────────────────────────────────┼────────────────────────────────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Optional DeepSeek API│
                         │   api.deepseek.com   │
                         │   Model: deepseek-chat│
                         └─────────────────────┘
```

### 2.2 数据流

```
User Input (5 questions + extra text + WeChat)
       │
       ▼
  ┌─────────────────────┐
  │  page.tsx            │  Dispatches createSkill() action
  │  (thin router,       │
  │   ~80 lines)         │
  └──────┬──────────────┘
         │
         ▼
  ┌─────────────────────┐
  │  lifeforkStore.ts    │  createSkill() action:
  │  (zustand)           │  1. Crisis check (safety.ts)
  └──────┬──────────────┘  2. Set step → "generating"
         │                 3. Read public runtime config and user method preferences
         │                    ├─ local fallback → local engine
         │                    └─ server AI enabled → POST /api/generate-self-skill
         │                 4. Save to localStorage
         │                 5. Set step → "self-skill"
         ▼
  ┌─────────────────────┐
  │  SelfSkill (JSON)    │  Complete structured self-model
  │                      │  ├─ identity / semantic / decision
  │                      │  ├─ voice / stageVoices
  │                      │  ├─ timeline[]
  │                      │  ├─ claims[] + evidence[]
  │                      │  └─ forks[] (generated client-side)
  └──────┬──────────────┘
         │
    ┌────┴────┐
    ▼         ▼
 Timeline   ForkPaths  →  selectFork()  →  InstanceChat
 Editor     (Map)                         ├─ sendMessage()
    │                                     │  optional POST /api/chat
    └────┬────┘                           │  LLM dialogue
         ▼                                ▼
     ShareCard                      Voice calibration

Administration flow:
/admin → signed admin session → /api/admin/config
  → D1 lifefork_runtime_config on Sites
  → data/runtime-config.json on Docker
  → /api/public-config exposes only public feature flags
  → API routes enforce server-side status and AI switches

Personal presentation preferences remain in localStorage through EditorConsole.
```

---

## 3. 模块划分与职责

### 3.1 目录结构总览

```
lifefork/
├── .env.local                          # API keys (git-ignored)
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts                  # Custom colors: night/deep/ink/mist/gold/blue/violet
├── next.config.ts
├── eslint.config.mjs
├── postcss.config.mjs
├── PROJECT_DOCS.md                     # ← 本文档
├── README.md                           # 面向用户/开发者的说明
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout, metadata
│   │   ├── page.tsx                    # Main page — step router (~80 lines)
│   │   ├── globals.css                 # Tailwind + dark theme
│   │   └── api/
│   │       ├── generate-self-skill/
│   │       │   └── route.ts            # POST — LLM SelfSkill generation
│   │       ├── chat/
│   │       │   └── route.ts            # POST — LLM fork dialogue
│   │       └── wechat-analyze/
│   │           └── route.ts            # POST — LLM WeChat analysis
│   │
│   ├── components/
│   │   ├── AppNav.tsx                  # Global navigation bar
│   │   ├── Landing.tsx                 # Immersive landing page
│   │   ├── VersionSelector.tsx         # Legacy selector, not mounted in V0.8
│   │   ├── QuestionFlow.tsx            # 5-question interview
│   │   ├── WeChatImportStep.tsx        # Chat log import + local analysis
│   │   ├── ExtraTextStep.tsx           # Optional free-text input
│   │   ├── GeneratingScreen.tsx        # Loading animation
│   │   ├── SelfSkillPanel.tsx          # Full self-skill visualization
│   │   ├── TimelineView.tsx            # Editable timeline
│   │   ├── InstanceChat.tsx            # Fork self chat interface
│   │   ├── ShareCard.tsx               # Result card + export
│   │   ├── EditorConsole.tsx           # Personal local presentation settings
│   │   ├── RuntimeConfigSync.tsx       # Public server configuration sync
│   │   ├── ProgressOrb.tsx             # Progress bar
│   │   ├── BadgeToast.tsx              # Achievement toast
│   │   └── ForkPaths/                  # Semantic zoom life map modules
│   │       ├── index.tsx               # Store adapter and composition
│   │       ├── LifeMapCanvas.tsx       # Camera and interaction orchestration
│   │       ├── LifeMapNode.tsx         # Card/container morph
│   │       ├── LifeMapLinks.tsx        # Current SVG links
│   │       ├── NodeDetailPanel.tsx     # Selected node panel
│   │       ├── ScaleSidebar.tsx        # Semantic zoom controls
│   │       ├── CurrentRouteBar.tsx     # Current path chips
│   │       ├── constants.ts            # Scale, camera and lane configuration
│   │       ├── types.ts                # Focus mode contract
│   │       ├── utils.ts                # Store data to paths
│   │       ├── StateBar.tsx            # State vector bar (20 lines)
│   │       └── model/
│   │           ├── stableScene.ts      # Stable world coordinates
│   │           ├── visibility.ts       # Semantic visibility and containers
│   │           ├── camera.ts           # Fit, center, zoom functions
│   │           └── normalizeForkTree.ts
│   │
│   └── lib/
│       ├── types.ts                    # Complete type system (202 lines)
│       ├── copy.ts                     # UI copy constants
│       ├── editorConfig.ts             # Personal local presentation config
│       ├── runtimeConfig.ts            # Public runtime config contract
│       ├── storage.ts                  # localStorage CRUD
│       ├── safety.ts                   # Crisis detection + safe response
│       │
│       ├── selfSkillEngine.ts          # Self Skill generation (local fallback)
│       ├── dialogueEngine.ts           # Dialogue engine (local fallback)
│       ├── voiceEngine.ts              # Voice/tone extraction + calibration
│       ├── wechatEngine.ts             # WeChat log parser + local analysis
│       │
│       ├── ai/
│       │   ├── client.ts              # Optional API client with fallback meta
│       │   ├── providers/              # OpenAI and DeepSeek adapters
│       │   ├── prompts.ts             # Prompt barrel
│       │   ├── prompts/               # Versioned prompt modules
│       │   ├── schemas/               # Request/response schemas
│       │   └── tokenBudget.ts         # Token budgets
│       ├── analysis/                   # Method registry, weights and calculators
│       ├── server/                     # Sessions, rate limits and runtime config
│       │
│       └── stores/
│           ├── lifeforkStore.ts        # Slice composer
│           ├── types.ts                # Store contract
│           └── slices/                 # navigation/input/selfSkill/fork/chat/ui
```

### 3.2 模块职责矩阵

| 模块 | Team | 输入 | 输出 | 依赖 |
|------|------|------|------|------|
| **types.ts** | All | — | TypeScript types | — |
| **lifeforkStore.ts** | Core | User actions | Global state | types, storage, engines |
| **page.tsx** | Core | Store state | Step-based UI routing | All components |
| **ai/client.ts** | AI | Prompt messages | LLM response text | .env.local |
| **ai/prompts.ts** | AI | User input data | Formatted prompt strings | — |
| **API routes** | AI/Backend | HTTP requests | JSON responses | ai/client, ai/prompts |
| **selfSkillEngine.ts** | AI | User answers + text | SelfSkill object (fallback) | voiceEngine, types |
| **dialogueEngine.ts** | AI | Message + context | Reply string (fallback) | voiceEngine, types |
| **voiceEngine.ts** | AI | User text | VoiceProfile, StageVoice[] | types |
| **wechatEngine.ts** | AI | Raw WeChat text | WeChatAnalysis | types |
| **safety.ts** | All | Text | Boolean + safe message | — |
| **storage.ts** | Core | Data objects | localStorage read/write | — |
| **editorConfig.ts** | Core/UI | Personal display JSON | Normalized local preferences | content registry, localStorage |
| **runtimeConfig.ts** | Core/Ops | Public config response | Normalized public feature flags | API routes |
| **server/runtimeConfigStore.ts** | Backend/Ops | Admin runtime config | Persistent server controls | filesystem, admin routes |
| **ForkPaths/index.tsx** | UI | Store (`SelfSkill`) | Map composition and detail panel | utils, stable map modules |
| **ForkPaths/LifeMapCanvas.tsx** | UI | Current/history/future paths | Camera, gestures and semantic scale | stableScene, visibility, camera |
| **ForkPaths/LifeMapNode.tsx** | UI | Stable node and visible container | Card/container morph | constants |
| **ForkPaths/LifeMapLinks.tsx** | UI | Scene and visibility | Visible SVG relations | stableScene, visibility |
| **ForkPaths/constants.ts** | UI | — | Scale, zoom and lane configs | types |
| **ForkPaths/types.ts** | UI | — | Focus mode contract | — |
| **ForkPaths/utils.ts** | UI | Store data | Current/history paths and lineage | content registry, types |
| **ForkPaths/model/stableScene.ts** | UI model | Normalized path tree | Stable coordinates and links | types |
| **ForkPaths/model/visibility.ts** | UI model | Scene, active node and scale | Visible nodes, containers and links | stableScene |
| **ForkPaths/model/camera.ts** | UI model | Bounds and viewport | Pure camera state | constants |
| **ForkPaths/StateBar.tsx** | UI | Label + value | Progress bar element | — |
| **InstanceChat.tsx** | UI | Store | Chat UI | types, API |
| **SelfSkillPanel.tsx** | UI | Store (selfSkill) | Profile display | types |
| **EditorConsole.tsx** | UI | Local editor preferences | Personal copy/display settings | store, editorConfig |
| **app/admin/page.tsx** | Ops/UI | Authenticated runtime config | Global service and feature controls | admin APIs |
| **Other components** | UI | Store | Step-specific UI | types |

---

## 4. 数据模型

### 4.1 SelfSkill（核心对象）

```typescript
interface SelfSkill {
  id: string;
  version: string;           // "v0.4-llm"
  createdAt: string;         // ISO 8601
  selectedVersion: "future" | "past" | "fork";

  // Raw input
  questions: {
    currentChoice: string;   // 现在最纠结的选择
    recurringEmotion: string; // 最近反复的情绪
    pastNode: string;        // 最想重新理解的节点
    hiddenSelf: string;      // 不像别人的一面
    futureSentence: string;  // 十年后的自己想说的话
  };
  extraText?: string;
  wechatAnalysis?: WeChatAnalysis;

  // AI-generated
  identity: IdentityProfile;
  voice: VoiceProfile;
  stageVoices: StageVoice[];
  semantic: SemanticProfile;
  decision: DecisionModel;

  // Structured data
  timeline: TimelineNode[];
  evidence: Evidence[];
  claims: Claim[];
  forks: ForkPath[];         // Generated client-side
}
```

### 4.2 ForkPath（人生分支节点）

```typescript
interface ForkPath {
  id: string;
  parentId?: string;
  depth?: number;
  nodeType?: "life-node" | "life-map" | "direction" | "strategy" | "consequence" | "ending";

  // Scale & lane
  scale?: LifeScale;          // "life" | "decade" | "era" | "year" | "month" | "week" | "day" | "hour"
  lane?: LifeLane;            // "stability" | "leap" | "experiment" | "relationship" | "creation"
  timeSpan?: LifeTimeSpan;    // { startLabel, endLabel?, durationLabel }

  // Content
  title: string;
  subtitle: string;
  summary: string;
  gains: string[];
  costs: string[];

  // Voice
  futureSelfName: string;
  futureSelfVoice: string;

  // Simulation
  stateVector?: LifeStateVector;  // 7-dim state
  consequences?: Consequence[];
  mergeInto?: string;             // ID of merging node
  zoomHint?: string;

  // Tree
  children?: ForkPath[];
}
```

### 4.3 LifeStateVector（7 维状态向量）

```typescript
interface LifeStateVector {
  autonomy: number;      // 自主感 (0-100)
  stability: number;     // 稳定性 (0-100)
  intimacy: number;      // 亲密关系 (0-100)
  creation: number;      // 创造表达 (0-100)
  energy: number;        // 能量 (0-100)
  regret: number;        // 遗憾 (0-100, higher = more regret)
  uncertainty: number;   // 不确定 (0-100, higher = more uncertain)
}
```

### 4.4 Evidence & Claim（证据链）

```typescript
interface Evidence {
  id: string;
  source: "question" | "extra_text" | "wechat" | "generated";
  quote: string;
}

interface Claim {
  id: string;
  text: string;         // 关于用户的判断
  confidence: number;   // 0.0 - 1.0
  evidenceIds: string[];
}
```

### 4.5 VoiceProfile（语气档案）

```typescript
interface VoiceProfile {
  toneName: string;           // "克制式自省" | "自嘲式清醒" | ...
  closenessScore: number;     // 0-100, how close to user's actual voice
  traits: string[];
  signaturePhrases: string[];
  sentenceRhythm: string;
  punctuationStyle: string;
  emotionalGesture: string;
  sampleLine: string;
  calibrationNotes: string[]; // User feedback: "更口语", "更克制", etc.
}
```

---

## 5. API 文档

### 5.1 POST /api/generate-self-skill

**用途**: 从用户 5 个核心回答 + 可选材料生成 Self Skill

**Request**:
```typescript
POST /api/generate-self-skill
Content-Type: application/json

{
  selectedVersion: "future" | "past" | "fork",
  currentChoice: string,
  recurringEmotion: string,
  pastNode: string,
  hiddenSelf: string,
  futureSentence: string,
  extraText?: string,
  wechatSummary?: string
}
```

**Response (200)**:
```typescript
{
  success: true,
  data: {
    id: string,
    version: "v0.4-llm",
    identity: { ... },
    semantic: { ... },
    decision: { ... },
    voice: { ... },
    stageVoices: [ ... ],
    timeline: [ ... ],
    evidence: [ ... ],
    claims: [ ... ]
    // Note: forks are NOT included — generated client-side
  },
  meta: {
    llmUsed: boolean,
    rawResponse: string  // First 500 chars of LLM output
  }
}
```

**Response (500)**:
```typescript
{
  success: false,
  error: string
}
```

**Fallback**: If the LLM call fails or returns unparseable JSON, the client-side `selfSkillEngine.generateSelfSkill()` is used as fallback.

### 5.2 POST /api/chat

**用途**: 与某个分支自我实例对话

**Request**:
```typescript
POST /api/chat
Content-Type: application/json

{
  selfSkillSummary: string,
  forkTitle: string,
  forkSummary: string,
  forkScale: string,
  forkGains: string[],
  forkCosts: string[],
  forkFutureSelfVoice: string,
  voiceProfile: string,       // JSON.stringify(VoiceProfile)
  conversationHistory: string, // Formatted message history
  userMessage: string
}
```

**Response (200)**:
```typescript
{
  success: true,
  data: {
    reply: string,            // The fork self's response
    safetyIntercept: boolean  // true if crisis keyword detected
  },
  usage?: {
    promptTokens: number,
    completionTokens: number,
    totalTokens: number
  }
}
```

### 5.3 POST /api/wechat-analyze

**用途**: 对微信聊天记录做深度语义分析（在本地规则引擎预处理之后）

**Request**:
```typescript
POST /api/wechat-analyze
Content-Type: application/json

{
  localSummary: string  // Output from wechatEngine.analyzeWeChatExport()
}
```

**Response (200)**:
```typescript
{
  success: true,
  data: {
    recurringTopics: string[],
    emotionalSignals: string[],
    keyThemes: string[],
    relationshipDynamics: string,
    selfSkillSignals: string[],
    suggestedSelfSkillText: string
  }
}
```

---

## 6. 状态管理

### 6.1 Zustand Store 设计

状态通过 `useLifeforkStore()` hook 访问。当前 `src/lib/stores/lifeforkStore.ts` 是 compose store，实际 action 和状态切片拆在 `src/lib/stores/slices/` 下：

- `navigationSlice.ts`
- `inputSlice.ts`
- `selfSkillSlice.ts`
- `forkSlice.ts`
- `chatSlice.ts`
- `uiSlice.ts`

```typescript
// 读取
const step = useLifeforkStore(s => s.step);
const selfSkill = useLifeforkStore(s => s.selfSkill);

// 写入
const setStep = useLifeforkStore(s => s.setStep);
setStep("questions");

// 复杂操作
const createSkill = useLifeforkStore(s => s.createSkill);
await createSkill();
```

### 6.2 Store 数据结构

| 字段 | 类型 | 说明 |
|------|------|------|
| `step` | `AppStep` | 当前步骤 (12 states) |
| `selectedVersion` | `SelfVersion \| null` | 生成入口版本；V0.5 新用户默认 `future` |
| `answers` | `Answers` | 5 个问题的回答 |
| `extraText` | `string` | 额外文本输入 |
| `wechatRaw` | `string` | 微信聊天原始文本 |
| `wechatAnalysis` | `WeChatAnalysis \| null` | 微信分析结果 |
| `selfSkill` | `SelfSkill \| null` | 生成的自我模型 |
| `selectedFork` | `ForkPath \| null` | 当前选中的分支 |
| `previewForkId` | `string` | ForkPaths 预览 ID |
| `messages` | `ChatMessage[]` | 对话消息 |
| `badge` | `string \| null` | 成就弹窗 |
| `proverb` | `string` | 分享箴言 |
| `editorConfig` | `EditorConfig` | 后台编辑配置 |
| `isGenerating` | `boolean` | 生成中状态 |

### 6.3 持久化

6 个 localStorage key 自动同步：

- `lifefork.selfSkill`
- `lifefork.currentStep`
- `lifefork.selectedFork`
- `lifefork.chatMessages`
- `lifefork.wechatAnalysis`
- `lifefork.editorConfig`

刷新页面后通过 `hydrateFromStorage()` 恢复。

用户体验数据由 `storage.ts` 管理；个人展示偏好由 `editorConfig.ts` 管理。`清空重来` 保留个人展示偏好，`EditorConsole` 的“恢复默认”只重置当前浏览器。全局运行配置必须在 `/admin` 中修改。

### 6.4 本地偏好与服务器运行配置

`EditorConfig` 仅保存当前浏览器的个人展示偏好，例如首页文案、导航标签和分享箴言。它不能开启服务器 AI、改变维护状态或影响其他访客。

个人偏好写入链路：

```text
EditorConsole
  -> saveEditorConfig()
  -> uiSlice
  -> localStorage.lifefork.editorConfig
  -> Landing / AppNav / QuestionFlow / GeneratingScreen / ShareCard
```

全局运营配置写入链路：

```text
/admin
  -> POST /api/admin/session
  -> GET or PUT /api/admin/config
  -> D1 lifefork_runtime_config on Sites
  -> data/runtime-config.json on Docker
  -> guarded API routes
  -> /api/public-config safe projection
```

---

## 7. AI 集成

### 7.1 双引擎策略

每个 AI 能力都有 **本地 fallback + 可选服务器 AI 增强** 的双引擎。浏览器读取 `/api/public-config` 判断公开能力，API Route 会再次读取服务端运行配置执行硬校验。客户端无法自行开启服务器 AI。

| 功能 | LLM 引擎 | 本地回退 |
|------|----------|----------|
| Self Skill 生成 | `POST /api/generate-self-skill` → OpenAI / DeepSeek | `selfSkillEngine.generateSelfSkill()` |
| 分支对话 | `POST /api/chat` → OpenAI / DeepSeek | `dialogueEngine.generateInstanceReply()` |
| 微信分析 | `POST /api/wechat-analyze` → OpenAI / DeepSeek | `wechatEngine.analyzeWeChatExport()` |

调用控制点：

- `RuntimeConfigSync`：读取公开状态并写入客户端 store。
- `selfSkillSlice.createSkill()`：根据公开 AI 状态选择请求或本地生成。
- `chatSlice.sendMessage()`：根据公开 AI 状态选择请求或本地回复。
- `apiGuard`：服务端执行签名匿名会话、限流、维护状态和功能开关检查。
- API provider 失败时响应附带 `fallbackReason`，前端保持完整本地闭环。
- `GeneratingScreen`：把当前模式显示给用户，避免误以为一定调用云端模型。

### 7.2 LLM 配置

```
Provider: DeepSeek
Model: deepseek-chat
Base URL: https://api.deepseek.com
Temperature: 0.3 (structured), 0.7 (dialogue)
Max Tokens: 3000 (self-skill), 600 (chat), 1500 (wechat)
```

API Key 存储在 `.env.local`，**仅服务端可访问**，永不暴露给客户端。

`DEEPSEEK_API_KEY` 缺失时，`ai/client.ts` 返回 `meta.llmUsed=false` 与 `fallbackReason="ai_disabled"`，route 层继续返回可用的本地结果或本地对话回复。

### 7.3 Prompt 架构

```
SELF_SKILL_SYSTEM_PROMPT
  └─ 角色定义 + JSON Schema + 原则约束
  └─ 输入: buildSelfSkillUserPrompt(userAnswers, extraText, wechatSummary)
  └─ 输出: JSON → LLMGeneratedSkill → mergeWithDefaults() → SelfSkill

DIALOGUE_SYSTEM_PROMPT
  └─ 分支自我角色 + 对话约束 + 安全边界
  └─ 输入: buildDialogueUserPrompt({selfSkill, fork, voice, history, message})
  └─ 输出: 自由文本回复（≤150字）

WECHAT_ANALYSIS_SYSTEM_PROMPT
  └─ 隐私优先分析器
  └─ 输入: buildWechatAnalysisUserPrompt(localSummary)
  └─ 输出: JSON → structured analysis
```

### 7.4 未来 RAG 架构（Phase 2）

```
User text → Chunking → Embedding (bge-m3)
                                ↓
                          Vector Store (pgvector)
                                ↓
User question → Embedding → Similarity Search → Top-K evidence
                                ↓
                     LLM Prompt (with evidence context)
                                ↓
                     Response with cited sources
```

---

## 8. UI 组件树

### 8.1 步骤路由（page.tsx）

```
page.tsx
├── AppNav (always visible)
├── ProgressOrb (always visible)
│
├── [step === "landing"]         → Landing
├── [step === "questions"]       → QuestionFlow
├── [step === "wechat-import"]   → WeChatImportStep
├── [step === "extra-text"]      → ExtraTextStep
├── [step === "generating"]      → GeneratingScreen
├── [step === "self-skill"]      → SelfSkillPanel
├── [step === "timeline"]        → TimelineView
├── [step === "forks"]           → ForkPaths
├── [step === "chat"]            → InstanceChat
├── [step === "share"]           → ShareCard
├── [step === "editor"]          → EditorConsole
│
└── BadgeToast (auto-dismiss)
```

### 8.2 组件依赖图

```
page.tsx ──► useLifeforkStore()
    │
    ├── Landing ──► startNewExperience()
    ├── QuestionFlow ──► setAnswer(), setStep()
    ├── WeChatImportStep ──► setWechatRaw(), setWechatAnalysis()
    ├── ExtraTextStep ──► setExtraText(), createSkill()
    ├── GeneratingScreen ──► (reads isGenerating)
    ├── SelfSkillPanel ──► (reads selfSkill)
    ├── TimelineView ──► (reads/writes selfSkill.timeline)
    ├── ForkPaths ──► previewForkId, selectFork()
    ├── InstanceChat ──► sendMessage(), tuneVoice()
    ├── ShareCard ──► (reads selfSkill, selectedFork, proverb)
    ├── EditorConsole ──► saveEditorConfig(), importEditorConfig(), resetEditorConfig()
    ├── AppNav ──► setStep(), resetExperience(), loadDemoScenario()
    ├── ProgressOrb ──► (receives progress as prop)
    └── BadgeToast ──► (reads badge)
```

---

## 9. 安全与伦理

### 9.1 四条铁律

1. **模拟不是预言** — 所有 Instance 回复标注为可能性模拟
2. **AI 不替用户做决定** — 只展示路径和代价
3. **不制造情感依赖** — 禁用"永远陪伴""只有我懂你"等语言
4. **所有记忆可审计/可编辑/可删除** — 用户始终控制数据

### 9.2 危机检测

`safety.ts` 的 `containsCrisisSignal()` 在以下位置调用：
- `createSkill()` 启动前
- `sendMessage()` 发送消息前
- `WeChatImportStep` 展示聊天内容时

触发后立即停止模拟，显示安全消息引导现实支持。

### 9.3 隐私保护

- 微信聊天原文**不写入** Self Skill，仅保留脱敏摘要
- 邮箱/手机号/链接在 wechatEngine 中自动脱敏
- API Key 仅服务端可见
- 所有数据存储在浏览器 localStorage（用户可控）

---

## 10. 开发指南

### 10.1 环境准备

```bash
# 安装依赖
npm install

# 可选配置 API Key：在 .env.local 中加入
# DEEPSEEK_API_KEY=<server-only-key>
# 默认 local-fallback 无需 API key

# 启动开发服务器
npm run dev

# 构建和生产预览
npm run build
npm run start:3005
```

### 10.2 开发工作流

```
1. 修改代码
2. npm run lint    # ESLint 检查
3. npm run build   # 构建验证
4. npm run start:3005 或 npm run preview:3005  # 生产预览手动测试
```

### 10.3 添加新步骤

1. 在 `types.ts` 的 `AppStep` 中新增步骤名
2. 创建新组件在 `src/components/`
3. 在 `page.tsx` 中添加条件渲染
4. 在 `content/copyRegistry.ts` 与 `AppNav.tsx` 的标签映射中添加标签

### 10.4 添加新 API 能力

1. 在 `ai/prompts.ts` 中添加 System Prompt 和 User Prompt 构建函数
2. 在 `api/` 下创建新 Route Handler
3. 在对应 store slice 中添加 action
4. 在 `runtimeConfig` 中定义服务端功能开关，并决定是否需要向 `/api/public-config` 暴露只读状态
5. Route Handler 必须执行签名会话、限流、输入边界、服务状态与 AI 开关检查
6. API 失败、超时或禁用时必须回到本地 fallback，并在响应元数据中说明原因

### 10.5 ForkPaths 当前模块结构

```text
components/ForkPaths/
├── index.tsx
├── LifeMapCanvas.tsx
├── LifeMapNode.tsx
├── LifeMapLinks.tsx
├── NodeDetailPanel.tsx
├── ScaleSidebar.tsx
├── CurrentRouteBar.tsx
├── constants.ts
├── types.ts
├── utils.ts
├── StateBar.tsx
└── model/
    ├── stableScene.ts
    ├── visibility.ts
    ├── camera.ts
    └── normalizeForkTree.ts
```

旧 `layoutEngine`、旧 `MapLinks`、旧 bounds 和 connector 已删除，防止两套地图实现继续并存。当前依赖方向：

```text
index
  -> LifeMapCanvas
       -> stableScene
       -> visibility
       -> camera
       -> LifeMapNode
       -> LifeMapLinks
  -> CurrentRouteBar
  -> NodeDetailPanel
```

结构和交互不变量见 `docs/LIFE_MAP_INTERACTION_SPEC.md`。

---

## 11. 部署指南

### 11.1 当前推荐：Sites / Cloudflare

```bash
npm run build:cloudflare
```

OpenNext 产物由 `scripts/prepare-sites-opennext.mjs` 整理到 `dist/`，Sites 使用 `.openai/hosting.json` 中的既有项目 ID、Worker 环境变量和 D1 绑定完成发布。运行时全局配置写入 D1 表 `lifefork_runtime_config`，AI 密钥只通过托管平台 Secret 注入。

### 11.2 备选部署：单实例 Docker

```bash
cp .env.example .env
docker compose config
docker compose build
docker compose up -d
curl -fsS http://127.0.0.1:3005/api/health
```

### 11.3 本地生产预览

```bash
npm run build
npm run start:3005
```

standalone 引导脚本将运行配置固定到项目根目录的 `data/runtime-config.json`。完整的 Sites、Docker、HTTPS、备份和回滚步骤见 `docs/DEPLOYMENT_RUNBOOK.md`。

---

## 12. 未来路线图

### Phase 0：V0.8 Release Candidate（已完成）

- [x] 服务器持有 OpenAI / DeepSeek API key，浏览器不接触密钥
- [x] 匿名签名会话、按会话限流、输入边界、超时与本地降级
- [x] 七类分析方法、用户权重、输出来源和限制
- [x] 八字、紫微斗数和阶段 MBTI 的可选分析
- [x] `/admin` 全局运行配置、服务状态和功能开关
- [x] 微信文本本地解析与可选服务器增强
- [x] 语义缩放人生地图的稳定场景、可见性、相机和焦点模式
- [x] standalone 生产运行、Docker 配置、健康检查和运维文档

### Phase 1：受邀 Public Beta（下一阶段，2-4 周）

- [ ] 为生成、聊天、微信分析和地图模型建立自动化测试
- [ ] 接入错误追踪、结构化日志、供应商延迟与降级指标
- [ ] 发布隐私政策、用户协议、AI 供应商数据说明和删除说明
- [ ] 对 20-50 位受邀用户执行任务型可用性测试
- [ ] 建立提示词、方法权重和分享内容的版本审计记录
- [ ] 完成触控真机、低性能设备和弱网回归

### Phase 2：开放 Public Beta（4-8 周）

- [ ] 将限流、运行配置和审计日志迁移到共享基础设施
- [ ] 接入正式身份系统、RBAC 和用户数据删除/导出请求
- [ ] 引入 PostgreSQL，支持加密的 Self Skill 多版本存储
- [ ] 建立 evidence-first RAG，保持结论到证据的可追溯关系
- [ ] 增加内容审核、异常成本熔断、预算告警和发布回滚
- [ ] 根据公测数据决定微信导入、语音输入和分享图片的优先级

### Phase 3：V1（开放公测稳定后）

- [ ] 长期阶段语气学习与版本差异解释
- [ ] 人生地图编辑、情景比较和行动实验复盘
- [ ] 多语言、无障碍和 PWA
- [ ] 订阅与团队/咨询辅助场景，前提是完成伦理和合规评审
- [ ] 公开方法评估集、模型卡和产品质量报告

---

## 附录 A: 术语表

| 术语 | 英文 | 定义 |
|------|------|------|
| Self Skill | — | 用户的结构化自我模型 |
| Instance | — | Self Skill 在某个时间/分支的运行实例 |
| ForkPath | — | 一条人生岔路/分支路径 |
| LifeScale | — | 时间尺度 (life→hour) |
| LifeLane | — | 人生路线类型 (stability/leap/experiment/relationship/creation) |
| LifeStateVector | — | 7 维状态向量 |
| Evidence | — | 支持每条判断的原文证据 |
| Voice Profile | — | 从用户语言提取的语气特征 |
| Stage Voice | — | 特定人生阶段的语气模型 |
| Semantic Zoom | — | 基于语义的缩放（不同尺度显示不同内容） |

## 附录 B: 联系人

| 角色 | 负责模块 |
|------|----------|
| Core Team | types, store, page.tsx, storage |
| AI Team | ai/client, ai/prompts, API routes, engines |
| UI Team | All components under src/components/ |
| Design | globals.css, tailwind.config.ts, visual design |
| DevOps | Deployment, CI/CD, environment config |
