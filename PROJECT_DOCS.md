# LifeFork / 人生岔路 — 项目技术文档

> 版本: v0.4 (LLM-integrated)  
> 最后更新: 2026-04-28  
> 文档用途: 分 team 构建与开发参考

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

## 1. 项目概述

### 1.1 产品定位

LifeFork 是一个**自我认知引擎与分支人生模拟器**。用户通过 5 个核心问题 + 可选材料输入，生成一个结构化 **Self Skill**（自我模型），然后与不同人生路径上的"自己"对话。

**不是**：数字永生、AI 伴侣、MBTI 测试、心理治疗  
**而是**：可对话的自我镜像、可能性模拟器、人生反思工具

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
| 框架 | Next.js 16.2.4 (App Router, Turbopack) |
| 语言 | TypeScript 5.7 |
| UI | React 19 + Tailwind CSS 3.4 + Framer Motion 11 |
| 状态管理 | Zustand 5 |
| AI | DeepSeek Chat API (`deepseek-chat`) |
| 存储（当前） | 浏览器 localStorage |
| 存储（计划） | PostgreSQL + pgvector |

---

## 2. 系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                            │
│                                                                      │
│  ┌──────────────────────┐    ┌────────────────────────────────────┐ │
│  │   zustand Store       │    │  UI Components (14 files)          │ │
│  │   lifeforkStore.ts    │◄───│  Landing / VersionSelector /       │ │
│  │   (single source of   │    │  QuestionFlow / WeChatImport /     │ │
│  │    truth, ~300 lines) │    │  ExtraText / Generating /          │ │
│  └──────────┬───────────┘    │  SelfSkillPanel / TimelineView /    │ │
│             │                │  ForkPaths (1319 lines) /           │ │
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
│  │  safety.ts            │    └────────────────────────────────────┘ │
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
│  │                    DeepSeek API Client                            │ │
│  │                    chatCompletion() / chatCompletionJSON()        │ │
│  └────────────────────────────────┬─────────────────────────────────┘ │
│                                   │                                    │
└───────────────────────────────────┼────────────────────────────────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   DeepSeek API       │
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
         │                 3. POST /api/generate-self-skill
         │                    ├─ Success → merge LLM + local
         │                    └─ Fail → fallback to local engine
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
    │                                     │  POST /api/chat
    └────┬────┘                           │  LLM dialogue
         ▼                                ▼
     ShareCard                      Voice calibration
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
│   │   ├── VersionSelector.tsx         # Past/Future/Fork selector
│   │   ├── QuestionFlow.tsx            # 5-question interview
│   │   ├── WeChatImportStep.tsx        # Chat log import + local analysis
│   │   ├── ExtraTextStep.tsx           # Optional free-text input
│   │   ├── GeneratingScreen.tsx        # Loading animation
│   │   ├── SelfSkillPanel.tsx          # Full self-skill visualization
│   │   ├── TimelineView.tsx            # Editable timeline
│   │   ├── InstanceChat.tsx            # Fork self chat interface
│   │   ├── ShareCard.tsx               # Result card + export
│   │   ├── ProgressOrb.tsx             # Progress bar
│   │   ├── BadgeToast.tsx              # Achievement toast
│   │   └── ForkPaths/                  # Semantic zoom life map (modular, 7 files)
│   │       ├── index.tsx               # Main component (690 lines)
│   │       ├── constants.ts            # Configuration (127 lines)
│   │       ├── types.ts                # Layout types (55 lines)
│   │       ├── utils.ts                # Pure utilities (254 lines)
│   │       ├── layoutEngine.ts         # Layout computation (228 lines)
│   │       ├── connectorPath.ts        # SVG connector path (37 lines)
│   │       └── StateBar.tsx            # State vector bar (20 lines)
│   │
│   └── lib/
│       ├── types.ts                    # Complete type system (202 lines)
│       ├── copy.ts                     # UI copy constants
│       ├── storage.ts                  # localStorage CRUD
│       ├── safety.ts                   # Crisis detection + safe response
│       │
│       ├── selfSkillEngine.ts          # Self Skill generation (local fallback)
│       ├── dialogueEngine.ts           # Dialogue engine (local fallback)
│       ├── voiceEngine.ts              # Voice/tone extraction + calibration
│       ├── wechatEngine.ts             # WeChat log parser + local analysis
│       │
│       ├── ai/
│       │   ├── client.ts              # DeepSeek API client
│       │   └── prompts.ts             # All LLM prompt templates
│       │
│       └── stores/
│           └── lifeforkStore.ts        # Zustand global state (~300 lines)
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
| **ForkPaths/index.tsx** | UI | Store (selfSkill) | Interactive SVG canvas | types, constants, utils, layoutEngine, connectorPath, StateBar |
| **ForkPaths/constants.ts** | UI | — | Scale/frame/lane configs | types |
| **ForkPaths/types.ts** | UI | — | Layout types (LayoutNode, etc.) | @/lib/types |
| **ForkPaths/utils.ts** | UI | Store data | Derived paths, bounds calcs | constants, types |
| **ForkPaths/layoutEngine.ts** | UI | Path tree | Layout nodes/links/frames | constants, utils |
| **ForkPaths/connectorPath.ts** | UI | Two LayoutBounds | SVG path string | types, utils |
| **ForkPaths/StateBar.tsx** | UI | Label + value | Progress bar element | — |
| **InstanceChat.tsx** | UI | Store | Chat UI | types, API |
| **SelfSkillPanel.tsx** | UI | Store (selfSkill) | Profile display | types |
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

所有状态集中在 `src/lib/stores/lifeforkStore.ts`，通过 `useLifeforkStore()` hook 访问。

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
| `selectedVersion` | `SelfVersion \| null` | 选择的自我版本 |
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
| `isGenerating` | `boolean` | 生成中状态 |

### 6.3 持久化

5 个 localStorage key 自动同步：
- `lifefork.selfSkill`
- `lifefork.currentStep`
- `lifefork.selectedFork`
- `lifefork.chatMessages`
- `lifefork.wechatAnalysis`

刷新页面后通过 `hydrateFromStorage()` 恢复。

---

## 7. AI 集成

### 7.1 双引擎策略

每个 AI 能力都有 **LLM 优先 + 本地回退** 的双引擎：

| 功能 | LLM 引擎 | 本地回退 |
|------|----------|----------|
| Self Skill 生成 | `POST /api/generate-self-skill` → DeepSeek | `selfSkillEngine.generateSelfSkill()` |
| 分支对话 | `POST /api/chat` → DeepSeek | `dialogueEngine.generateInstanceReply()` |
| 微信分析 | `POST /api/wechat-analyze` → DeepSeek | `wechatEngine.analyzeWeChatExport()` |

### 7.2 LLM 配置

```
Provider: DeepSeek
Model: deepseek-chat
Base URL: https://api.deepseek.com
Temperature: 0.3 (structured), 0.7 (dialogue)
Max Tokens: 3000 (self-skill), 600 (chat), 1500 (wechat)
```

API Key 存储在 `.env.local`，**仅服务端可访问**，永不暴露给客户端。

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
├── [step === "select-version"]  → VersionSelector
├── [step === "questions"]       → QuestionFlow
├── [step === "wechat-import"]   → WeChatImportStep
├── [step === "extra-text"]      → ExtraTextStep
├── [step === "generating"]      → GeneratingScreen
├── [step === "self-skill"]      → SelfSkillPanel
├── [step === "timeline"]        → TimelineView
├── [step === "forks"]           → ForkPaths
├── [step === "chat"]            → InstanceChat
├── [step === "share"]           → ShareCard
│
└── BadgeToast (auto-dismiss)
```

### 8.2 组件依赖图

```
page.tsx ──► useLifeforkStore()
    │
    ├── Landing ──► startNewExperience()
    ├── VersionSelector ──► setSelectedVersion(), setStep()
    ├── QuestionFlow ──► setAnswer(), setStep()
    ├── WeChatImportStep ──► setWechatRaw(), setWechatAnalysis()
    ├── ExtraTextStep ──► setExtraText(), createSkill()
    ├── GeneratingScreen ──► (reads isGenerating)
    ├── SelfSkillPanel ──► (reads selfSkill)
    ├── TimelineView ──► (reads/writes selfSkill.timeline)
    ├── ForkPaths ──► previewForkId, selectFork()
    ├── InstanceChat ──► sendMessage(), tuneVoice()
    ├── ShareCard ──► (reads selfSkill, selectedFork, proverb)
    ├── AppNav ──► setStep(), resetExperience()
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

# 配置 API Key
cp .env.example .env.local
# 编辑 .env.local: DEEPSEEK_API_KEY=sk-xxx

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
npm run start
```

### 10.2 开发工作流

```
1. 修改代码
2. npm run lint    # ESLint 检查
3. npm run build   # 构建验证
4. npm run dev     # 手动测试
```

### 10.3 添加新步骤

1. 在 `types.ts` 的 `AppStep` 中新增步骤名
2. 创建新组件在 `src/components/`
3. 在 `page.tsx` 中添加条件渲染
4. 在 `AppNav.tsx` 的 `stepLabels` 中添加标签

### 10.4 添加新 API 能力

1. 在 `ai/prompts.ts` 中添加 System Prompt 和 User Prompt 构建函数
2. 在 `api/` 下创建新 Route Handler
3. 在 `lifeforkStore.ts` 中添加对应的 action（LLM 优先 + 本地回退）

### 10.5 ForkPaths 模块结构（已完成拆分 ✅）

ForkPaths 已从单一 1321 行文件拆分为 7 个模块文件：

```
components/ForkPaths/
├── index.tsx          # 主组件（690 行）— store 读取、state、effects、JSX
├── constants.ts       # 所有常量（127 行）— scale/frame/lane 配置
├── types.ts           # 布局类型（55 行）— LayoutNode, LayoutBounds 等
├── utils.ts           # 纯工具函数（254 行）— bounds, forks, markers
├── layoutEngine.ts    # 布局引擎（228 行）— buildMapLayout + helpers
├── connectorPath.ts   # SVG 连接线（37 行）— connectorPath()
└── StateBar.tsx       # 状态条组件（20 行）
```

**依赖图**：
```
constants ← types
    ├── utils ← constants + types
    ├── layoutEngine ← constants + types + utils
    ├── connectorPath ← types + utils
    ├── StateBar (独立)
    └── index.tsx ← 以上全部 + zustand store

---

## 11. 部署指南

### 11.1 Vercel / Netlify（推荐）

```bash
# 环境变量
DEEPSEEK_API_KEY=sk-xxx
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat

# 构建命令
npm run build

# 输出目录
.next/
```

### 11.2 Docker

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
```

### 11.3 自托管

```bash
npm run build
npm run start -- -p 3000
```

---

## 12. 未来路线图

### Phase 1: LLM Integration ✅ (v0.4 — 当前版本)
- [x] DeepSeek API 接入
- [x] Self Skill 生成 LLM 化
- [x] 分支对话 LLM 化
- [x] 微信分析 LLM 增强
- [x] zustand 状态管理重构
- [x] 组件解耦 (prop drilling → store)

### Phase 2: Backend & Data (v0.5)
- [ ] PostgreSQL + pgvector 数据库
- [ ] 用户认证 (NextAuth.js / Clerk)
- [ ] RAG 证据检索系统
- [ ] ForkPath 动态生成 (LLM 根据用户具体情况生成)
- [ ] Self Skill 版本历史
- [ ] 数据导出/导入/备份

### Phase 3: UX Polish (v0.6)
- [ ] 语音输入 (Web Speech API / Whisper)
- [x] ForkPaths 模块化拆分
- [ ] 移动端适配
- [ ] PWA 支持
- [ ] 分享卡片导出为图片
- [ ] 多语言支持 (i18n)

### Phase 4: Product Launch (v1.0)
- [ ] 测试覆盖 (Vitest + Playwright)
- [ ] 错误监控 (Sentry)
- [ ] 性能优化
- [ ] a11y 改进
- [ ] 付费墙 / Pro 功能
- [ ] Product Hunt / 小红书发布

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
