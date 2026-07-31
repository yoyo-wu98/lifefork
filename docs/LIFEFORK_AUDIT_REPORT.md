# LifeFork / 人生岔路 — 当前代码与功能巡检报告

> 巡检日期：2026-04-28
> 巡检范围：本地仓库、模块结构、构建结果、主要功能链路、浏览器冒烟验证
> 当前运行端口：http://localhost:3005
>
> **历史审计说明**：本文记录 V0.5 至 V0.6 的修复过程。V0.8 当前结论、服务器 AI、多人匿名会话、方法来源、后台运营和部署风险，以 `docs/PUBLIC_BETA_TECHNICAL_REPORT.md` 为准。

## 0.1 2026-05-12 可部署性与后台编辑台复核

复核目标：

- 确认 V0.5 能以生产构建运行。
- 确认无 API key 时使用本地 fallback。
- 确认后台编辑台已接入前台关键页面。
- 降低本地运行内存风险。

命令结果：

- `npm run lint`：通过。
- `npm run build`：通过。

本轮新增/确认：

- 新增 `src/lib/editorConfig.ts`，定义 `EditorConfig`、默认配置、localStorage 读写、导入解析和恢复默认。
- 新增 `src/components/EditorConsole.tsx`，提供首页文案、免责声明、导航标签、分享箴言、功能开关、部署模式、AI 模式的本地编辑窗口。
- `AppNav` 接入后台入口，空状态也可进入。
- `Landing`、`GeneratingScreen`、`ShareCard` 接入后台配置。
- `QuestionFlow` 会根据后台微信导入开关决定下一步。
- `selfSkillSlice.createSkill()` 与 `chatSlice.sendMessage()` 会根据 `features.aiApi` 和 `global.aiMode` 决定是否请求 API。
- 默认配置为 `local-fallback`，不会在无 API 需求时发起模型请求。

当前可部署口径：

- 推荐验证命令：`npm run lint`、`npm run build`、`npm run start:3005`。
- 推荐演示命令：`npm run preview:3005`。
- 避免同时保留多个 `next dev` 或 `next start` 进程。
- 后台配置保存在 `localStorage.lifefork.editorConfig`。

剩余风险：

- 人生地图仍是最高风险模块，需要独立交互规格、结构测试和浏览器回归。
- 后台编辑台当前没有身份认证、服务端存储、审计日志，公开部署前必须迁移到 `/admin` 后台。
- 微信大文本导入仍需要 Web Worker、分块摘要和更强脱敏。

## 0. 2026-04-29 可用性复测

目标：先确认产品可用、不崩溃、主流程闭环；FAQ、伦理扩展、传播材料后置。

复测环境：

- URL: `http://127.0.0.1:3005`
- 目的：使用不同 origin，避免清理已有 `localhost` 存档。
- 命令：`npm run lint`、`npm run build`、`npm run start:3005`

结果：

- ESLint 通过。
- Next production build 通过。
- 首页可加载。
- 新用户可完成：开始五问 -> 跳过微信 -> 补充文本 -> 生成 Self Skill。
- 可继续完成：Self Skill -> 时间线 -> 人生地图 -> 选择分支 -> 进入对话 -> 发送消息 -> 语气校准 -> 分享卡片。
- 刷新后可恢复到分享卡片。
- 浏览器 console error：0。
- 分享卡片桌面视图无明显遮挡。

本轮修复：

- `/api/generate-self-skill` 现在会拒绝缺少 `selectedVersion` 或五问字段的坏请求，返回 400，不再生成空 Self Skill 或浪费模型调用。

当前判断：

- V0.5 已达到最低可演示标准：从空白用户到分享卡片可跑通，刷新可恢复。
- 后续团队工作以 `docs/TEAM_WORK_ORDERS.md` 的稳定性工作单为准，优先修主流程卡点、崩溃、地图可交互、fallback 和恢复能力。

## 1. 结论

当前项目已经从单页 V0 原型升级为更模块化的 Next.js 应用：

- `page.tsx` 已降为步骤路由壳，业务状态迁移到 Zustand store。
- `ForkPaths` 已从单文件拆成独立模块目录。
- 新增了 `/api/generate-self-skill`、`/api/chat`、`/api/wechat-analyze` 三个 API route。
- 新增了 `ai/client.ts` 与 `ai/prompts.ts`，可以接入 DeepSeek。
- 本地 fallback 引擎仍保留，API 失败时主要流程可继续。
- `npm run lint` 通过。
- `npm run build` 通过。
- 浏览器打开 `http://localhost:3005/` 无控制台 error。

本轮已修复三个部署前问题：

1. 在 `next.config.ts` 中显式设置 `turbopack.root`，消除 Next.js 多 lockfile workspace root 警告。
2. 在 `.gitignore` 中加入 `.DS_Store` 与 `tsconfig.tsbuildinfo`。
3. 修复分享页“重新开始”在用户确认前先清空 localStorage 的问题。
4. 修复人生地图切换到“阶段”等尺度时，当前尺度后代节点被隐藏成 `opacity: 0` 的问题。

## 2. 静态验证

### 2.1 命令结果

```bash
npm run lint
npm run build
```

结果：

- ESLint：通过。
- TypeScript：通过。
- Next.js production build：通过。
- 生成路由：
  - `/`
  - `/_not-found`
  - `/api/chat`
  - `/api/generate-self-skill`
  - `/api/wechat-analyze`

### 2.2 构建警告

此前存在：

```text
Next.js inferred your workspace root, but it may not be correct.
Detected additional lockfiles:
  * /Users/yoyow/Downloads/lifefork/package-lock.json
```

已通过 `next.config.ts` 修复：

```ts
turbopack: {
  root: path.resolve(__dirname),
}
```

## 3. 模块化检查

### 3.1 当前结构

核心目录：

```text
src/
  app/
    page.tsx
    api/
      chat/route.ts
      generate-self-skill/route.ts
      wechat-analyze/route.ts
  components/
    AppNav.tsx
    Landing.tsx
    VersionSelector.tsx  # legacy, V0.5 不挂载
    QuestionFlow.tsx
    WeChatImportStep.tsx
    ExtraTextStep.tsx
    GeneratingScreen.tsx
    SelfSkillPanel.tsx
    TimelineView.tsx
    InstanceChat.tsx
    ShareCard.tsx
    ForkPaths/
      index.tsx
      constants.ts
      types.ts
      utils.ts
      layoutEngine.ts
      connectorPath.ts
      StateBar.tsx
  lib/
    stores/lifeforkStore.ts
    ai/client.ts
    ai/prompts.ts
    types.ts
    selfSkillEngine.ts
    dialogueEngine.ts
    voiceEngine.ts
    wechatEngine.ts
    safety.ts
    storage.ts
    copy.ts
```

### 3.2 模块化评价

| 模块 | 状态 | 评价 |
|---|---:|---|
| `page.tsx` | 良好 | 只负责 hydration、进度映射和 step 渲染，职责清晰。 |
| `lifeforkStore.ts` | 可用但偏大 | 统一管理流程状态、持久化、API 调用、fallback。后续可拆成 slices。 |
| `ForkPaths/` | 明显改善 | 已拆出 layout、constants、utils、connector、state bar。`index.tsx` 仍偏重。 |
| `selfSkillEngine.ts` | 偏大 | 1364 行，承担本地生成、人生分支构造、模板逻辑。后续建议拆 `profileEngine`、`forkTreeEngine`、`timelineEngine`。 |
| `voiceEngine.ts` | 良好 | 语气提取和阶段语气建模独立，方向正确。 |
| `wechatEngine.ts` | 良好 | 本地解析、脱敏、主题识别集中处理。 |
| `ai/client.ts` | 可用 | server-only 意图明确，已具备 API key 缺失与 provider error fallback。 |
| API routes | 可用 | 功能闭环成立，错误时前端有 fallback。 |

## 4. 功能确认

### 4.1 已确认功能

| 功能 | 状态 | 说明 |
|---|---:|---|
| 首页与全局导航 | 通过 | 浏览器可加载，导航项可见。 |
| localStorage 恢复 | 通过 | 刷新后恢复到当前人生地图步骤。 |
| 五问访谈 | 静态检查通过 | 输入结构接入 store。 |
| 微信导入 | 静态检查通过 | 支持粘贴和文本文件上传，本地规则分析。 |
| Self Skill 生成 | 静态检查通过 | 先尝试 API，失败 fallback 到本地规则引擎。 |
| 时间线 | 静态检查通过 | 支持可编辑节点。 |
| 人生地图 | 部分浏览器验证通过 | 可切换尺度，无控制台错误；阶段节点可见性问题已修。 |
| 未来自我对话 | 静态检查通过 | API 优先，本地模板 fallback。 |
| 语气校准 | 静态检查通过 | 支持“像我 / 少一点 AI 味 / 更口语 / 更克制 / 更锋利”。 |
| 分享卡片 | 静态检查通过 | 支持复制、导出 JSON、随机箴言、回到地图、重开。 |
| 安全机制 | 静态检查通过 | 生成与聊天链路均有危机关键词拦截。 |

### 4.2 浏览器验证记录

浏览器环境：

- URL: `http://localhost:3005/`
- 页面标题：`LifeFork / 人生岔路`
- 控制台 error：无。

已验证：

- 人生地图页面可加载。
- 尺度按钮“阶段”可切换。
- 切换后 `当前尺度：阶段` 出现。
- 之前隐藏的 `90 天` 阶段节点从 `opacity: 0` 修复为 `opacity: 0.86`。

注意：

- 由于地图节点处在 transform canvas 内，Playwright 对绝对定位 + transform 的节点点击不一定等价于真实鼠标点击。浏览器里视觉交互还需要人工继续验收，尤其是双击焦点模式、拖拽和滚轮缩放。

## 5. 发现的问题与建议

### P1：AI API 与隐私文案需要统一

当前 README/界面中多处强调“本地优先”和“聊天记录不上传”。实际实现是：

- 微信原始记录：当前 UI 只做本地规则分析。
- Self Skill 生成：会把五问、额外文本、微信摘要发送到 `/api/generate-self-skill`，如果配置 DeepSeek key，会继续发送给 DeepSeek。
- 对话：会把 Self Skill 摘要、路径信息、语气 profile、最近对话发送到 `/api/chat`，如果配置 DeepSeek key，会继续发送给 DeepSeek。
- `/api/wechat-analyze` 存在，但当前前端未调用。

建议文案统一为：

> 默认原型可本地 fallback；启用 AI API 后，摘要和对话上下文会发送到服务端与模型供应商。微信原文默认不上传。

### 已修复：`DEEPSEEK_API_KEY` 缺少显式 guard

当前 `src/lib/ai/client.ts` 已在缺少 key 时返回：

```ts
fallbackReason: "ai_disabled"
```

同时会在 provider error、请求失败、非 JSON、schema validation 失败时返回 fallback meta。前端主流程会继续使用本地生成或本地对话。

2026-04-29 追加修复：

- `/api/generate-self-skill` 缺少 `selectedVersion` 或五问字段时返回 400。
- `/api/chat` 缺少 `userMessage` 时返回 400。
- `/api/wechat-analyze` 缺少 `localSummary` 时返回 400。

### P1：人生地图仍缺少专门 E2E 测试

人生地图是最复杂模块，当前只有人工/浏览器冒烟。建议增加测试场景：

- 全人生 -> 十年 -> 阶段 -> 年 -> 月 -> 周 -> 天 -> 小时。
- 单框 / 父子同屏 / 子框同屏双击循环。
- 拖动父框时，所有后代保持相对位置。
- 大框之间无明显重叠。
- 当前尺度内的子节点必须可见、可选。

### P2：`ForkPaths/index.tsx` 仍偏重

虽然已拆模块，但 `index.tsx` 仍有 690 行，包含：

- state 派生
- camera 计算
- gesture/wheel/pointer 事件
- link 渲染
- node 渲染
- detail panel

建议继续拆：

```text
ForkPaths/
  CameraViewport.tsx
  ScaleSidebar.tsx
  MapCanvas.tsx
  MapNode.tsx
  MapLinks.tsx
  NodeDetailPanel.tsx
  useSemanticCamera.ts
  useNodeDrag.ts
```

### P2：`selfSkillEngine.ts` 仍偏大

建议拆成：

```text
selfSkill/
  profileRules.ts
  timelineRules.ts
  forkTreeRules.ts
  evidenceBuilder.ts
  localGenerator.ts
```

### P2：WeChat 大文本策略仍是 V0 级别

当前本地分析只取前 8000 行、规则词典识别。真实产品需要：

- 分块。
- 摘要树。
- 说话人归一。
- PII 脱敏。
- 证据引用。
- 用户可选择是否保留原文。
- 增量导入与去重。

### P2：状态持久化没有 schema migration

当前通过 `refreshLegacyForkTree` 处理部分旧数据，但长期需要：

```ts
SelfSkillSchemaVersion
migrations: v0.3 -> v0.4 -> v0.5
```

### P3：仓库清洁度

当前存在未跟踪目录：

- `.claude/`
- `PROJECT_DOCS.md`
- `docs/`

已将 `.DS_Store` 和 `tsconfig.tsbuildinfo` 加入 `.gitignore`。是否提交 `.claude/` 需要单独决定，通常不建议提交工具工作区。

## 6. 当前质量判断

### 可演示性

可以作为本地产品原型继续演示。

### 可部署性

构建层面可部署。V0.5 本地预览口径已满足：

- `npm run lint` 通过。
- `npm run build` 通过。
- 无 API key 时有本地 fallback。
- 生产预览优先使用 `npm run start:3005` 或 `npm run preview:3005`。

部署前仍建议补齐：

- 人生地图人工验收和自动化回归。
- `.claude/` 是否进入 git 的决策。
- 后台编辑台从 localStorage 迁移到带权限的 `/admin`。

### 架构成熟度

从 V0 原型进入 V0.4 架构状态：

- 已具备状态中心、模块边界、API 抽象、本地 fallback。
- 最大技术风险集中在人生地图交互复杂度和 AI/隐私边界。

## 7. 建议下一步

1. 固定当前产品需求文档，避免边做边变。
2. 给人生地图写交互规格，不再只靠视觉反馈调整。
3. 拆 `ForkPaths/index.tsx`。
4. 做一次完整人工验收并截图记录。
5. 再提交当前稳定版本。
