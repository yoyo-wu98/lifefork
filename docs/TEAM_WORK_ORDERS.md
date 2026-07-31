# LifeFork V0.5 Stability Work Orders

> Owner: Product & Research Team
> Last updated: 2026-05-12
> Purpose: 先让产品可用、不崩溃、主流程闭环。FAQ、伦理扩展、传播材料、长期研究后置。

## 1. Current Stability Check

2026-04-29 已完成一次真实浏览器复测，使用 `http://127.0.0.1:3005` 作为新 origin，避免清理已有 `localhost` 存档。

通过：

- `npm run lint`
- `npm run build`
- 首页进入
- 选择未来的我
- 五问输入
- 跳过微信导入
- 补充文本
- 生成 Self Skill
- 打开时间线
- 打开人生地图
- 选择人生分支节点
- 进入分支自我对话
- 发送消息并收到回复
- 语气校准
- 生成分享卡片
- 刷新后恢复到分享卡片
- 浏览器 console error：0

已修：

- `/api/generate-self-skill` 不再接受缺失五问字段的空请求；错误请求返回 400，不生成空 Self Skill，不浪费模型调用。

当前判断：

- V0.5 主流程可用。
- 产品已达到“能从空白用户走到分享卡片并刷新恢复”的最低可演示标准。
- 接下来所有团队只接稳定性、主流程、崩溃、数据恢复、地图可交互相关任务。

## 2. Requirement Source of Truth

需求优先级以以下顺序为准：

1. `docs/V0_5_DEMO_COMMAND_CENTER.md`：当前演示版调度、RACI、每日汇报和 demo gate。
2. 本文件：当前 V0.5 稳定性工作分发。
3. `docs/DEMO_ALIGNMENT_MEETING_2026-04-29.md`：本轮对齐会议结论。
4. `docs/INTERNAL_DEVELOPMENT_MANAGEMENT.md`：团队 ownership、工程拆分、开发流程、QA 计划。
5. `docs/LIFEFORK_FINAL_REQUIREMENTS_AND_DESIGN.md`：产品目标、非目标、roadmap、总体验验收。
6. `docs/LIFEFORK_AUDIT_REPORT.md`：当前可用性复测记录和风险。

若文档冲突：

- 当前 sprint 只接受可用性和稳定性需求。
- 任何不能改善主流程可用性、崩溃率、恢复能力或演示可靠性的工作默认后置。
- 伦理、FAQ、传播、长期研究、复杂编辑器、付费和账号系统全部后置。

## 3. Requirement ID System

需求 ID 格式：

```text
LF-<AREA>-<NUMBER>
```

Area:

| Area | Scope |
| --- | --- |
| `PRD` | 产品需求、用户研究、文案边界 |
| `UI` | 视觉、交互、动效、组件 |
| `MAP` | 人生地图、布局、缩放、节点编辑 |
| `CORE` | Store、状态机、schema、storage |
| `SKILL` | Self Skill、本地规则、evidence、timeline |
| `AI` | API、prompt、schema validation、fallback |
| `VOICE` | 语气学习、阶段语气、对话体验 |
| `DATA` | 微信/文本导入、脱敏、摘要 |
| `SAFE` | 安全、隐私、伦理、分享字段 |
| `QA` | 测试、验收、发布检查 |
| `OPS` | 运行、CI、预览、发布 runbook |
| `EDITOR` | 后台编辑台、全局配置、CMS 迁移 |

状态：

| Status | Meaning |
| --- | --- |
| `Draft` | 需求尚未满足 Definition of Ready |
| `Ready` | 可进入开发 |
| `In Progress` | Owner 已接手 |
| `Blocked` | 有明确阻塞 |
| `Review` | 等待产品、代码或 QA 复核 |
| `Accepted` | 已通过验收 |
| `Deferred` | 保留但不进当前版本 |

## 4. Definition of Ready

需求进入开发前必须具备：

- 用户问题：这解决谁的什么问题。
- 用户价值：为什么现在做。
- 非目标：本轮明确不做什么。
- Owner：唯一主责团队。
- Dependencies：被依赖团队或前置任务。
- Acceptance：可验证结果，不只描述实现。
- Risk：隐私、安全、数据、性能或体验风险。
- Test path：QA 或人工验收路径。

## 5. Definition of Done

需求完成必须满足：

- 代码或文档实现已完成。
- 对应文档已更新。
- `npm run lint` 和 `npm run build` 通过，或明确说明未运行原因。
- 关键用户路径完成手工或自动验证。
- Product & Research 复核用户价值和文案边界。
- QA 复核验收标准。
- 若涉及 API、storage、fallback、地图、聊天或分享，必须补充失败路径验证。

## 6. Active V0.5 Work Orders

### LF-EDITOR-001: Local Editor Console and Deployable Config

Owner: Editor Console / Internal Ops Team
Status: Implementation Complete / QA Required
Dependencies: Core App Team, Content Systems Team, QA / Release / DevOps Team

Scope:

- 提供本地后台编辑台，允许编辑管理首页、导航、免责声明、分享箴言和功能开关。
- 使用 `localStorage.lifefork.editorConfig` 保存配置。
- 让功能开关影响真实流程：微信导入开关影响五问后的下一步，AI API 开关影响生成和聊天是否请求 API。
- 提供配置复制、下载、导入、恢复默认。
- 保持无 Self Skill 状态下也能进入后台。

Acceptance:

- 生产预览中点击 `后台编辑` 可进入配置页面。
- 修改首页标题并保存后，回到主页立即生效。
- 刷新后后台配置仍保留。
- 关闭微信导入后，五问完成直接进入额外文本。
- 默认 `local-fallback` 下生成和聊天不请求 API route。
- 导入非法 JSON 显示错误，不导致白屏。
- `npm run lint` 与 `npm run build` 通过。

MVP follow-up:

- 新增独立 `/admin` route。
- 增加登录、角色权限、审计日志。
- 增加配置版本历史、发布、预览和回滚。

### LF-QA-001: Main Flow Regression Matrix

Owner: QA / Release / DevOps Team
Status: Review
Dependencies: All Teams

Scope:

- 把真实浏览器主流程固化成回归矩阵。
- 每次合并前至少验证：新用户完整路径、返回用户恢复、no API fallback、地图节点进入、聊天、分享卡片。
- 记录浏览器 console error、server error、卡住步骤。
- 对 Life Map 增加 hierarchy regression：验证不同时间粒度是否按 parent-child containment 展示。

Acceptance:

- `npm run lint`、`npm run build` 通过。
- 空 origin 新用户路径可从首页走到分享卡片。
- 刷新后可恢复到当前步骤。
- 浏览器 console error 为 0。
- `90 天` 选中状态下，`第 1 周` 和 `第 3 周` 必须处于 `90 天` 容器内。
- `10 年后` 不得作为 `90 天` 的内部 child 出现。
- 932px、1280px、1440px 三档截图不得出现 parent-child 被铺成同级卡片的情况。

### LF-UI-001: First-Run Usability Cleanup

Owner: UX / UI / Motion Team
Status: Ready / Covered by LF-UI-002 Evidence
Dependencies: QA Team, Core App Team

Scope:

- 优先处理首次使用时会让用户卡住的地方：按钮禁用原因、步骤跳转、表单可填性、生成中反馈。
- 检查桌面和窄屏下导航、地图详情面板、聊天输入、分享卡片按钮是否遮挡。
- 不做新视觉风格，不加新页面。

Acceptance:

- 用户不读 README 也能完成五问到分享卡片。
- 所有继续按钮在可点/不可点状态上原因明确。
- 375px 宽度下核心操作不被遮挡。

### LF-UI-002: Map Visual Grammar and Responsive Evidence

Owner: UX / UI / Motion Team
Status: Review / Visual Evidence Gap
Dependencies: Life Map Team, QA Team

Scope:

- 定义 Life Map visual grammar：life branch card、life container、phase container、checkpoint、local child、background context、selected node、ancestor route。
- 提供 1440px、1280px、390px 和 in-app selected evidence。
- 移除 demo 中的 debug-looking labels。
- 确认 focus lock、right hint、reset camera、route bar 的位置关系。

Evidence:

- `docs/ux-evidence/lifefork-map-visual-grammar.md`
- `docs/ux-evidence/lifefork-map-1440-selected.png`
- `docs/ux-evidence/lifefork-map-1280-selected.png`
- `docs/ux-evidence/lifefork-map-390-selected.png`
- `docs/ux-evidence/lifefork-map-inapp-selected.png`

Round 5 review note:

- Visual grammar brief 已交付，桌面和移动截图文件存在。
- `lifefork-map-inapp-selected.png` 仍有左侧裁切，不能作为 Accepted evidence。
- 390px 截图证明首屏控件可见，但还需要一张包含详情面板和操作按钮的移动截图。

Acceptance:

- in-app selected state 不裁切关键卡片。
- 390px 下地图、详情面板、进入对话/分享操作均可访问。
- Route bar、reset camera、focus lock 不遮挡节点选择。

### LF-MAP-001: Life Map Interaction Stabilization

Owner: Life Map / Visualization Team
Status: In Progress
Dependencies: UX / UI / Motion Team, Self Skill & Simulation Engine Team, QA Team

Scope:

- 稳定父子包含、当前尺度卡片、父框退底、节点选择、进入对话。
- 拆分地图组件和模型层时保持交互行为一致。
- 明确 focus mode、pan、zoom、drag 的验收路径。
- 先保证用户能选中节点并进入对话，再处理高级编辑和复杂动效。

Acceptance:

- 通过 8 个地图验收场景。
- `ForkPath.parentId` 与 `children` 结构一致。
- 节点数量小于 120 时无明显卡顿。
- 地图交互无浏览器 console error。
- 至少一条未来分支可从地图进入聊天。

### LF-CORE-001: Store Split and Schema Migration Prep

Owner: Core App / State Team
Status: Implementation Complete / QA Required
Dependencies: Self Skill Team, QA Team

Scope:

- 拆分 store slices，降低 `lifeforkStore.ts` 复杂度。
- 增加 schema version、migration placeholder、storage repair 边界。
- destructive action 保留确认逻辑。
- 当前优先修恢复、持久化、坏数据不白屏；暂缓纯重构。

Acceptance:

- 旧 localStorage 数据读取失败不会白屏。
- store action 有清晰边界清单。
- 清空、导出、恢复进度路径保持可用。
- 刷新页面后恢复到 Self Skill、地图、聊天、分享任一主要步骤。

Round 4 review note:

- `src/lib/stores/lifeforkStore.ts` 已经变成 compose store，状态已拆到 `src/lib/stores/slices/`。
- `src/lib/storage.ts` 已有 safe read/write/remove 和 Self Skill migration 入口。
- 下一步重点转向验证坏数据、旧状态、刷新恢复、demo sample 覆盖是否稳定。

Team brief intake — 2026-04-30:

- Core App Team 报告已完成 store split、schema modules、storage guard、timeline destructive confirmation、chat system message persistence。
- 复核确认：`lifeforkStore.ts` 为 21 行，最大 slice 为 `selfSkillSlice.ts` 134 行。
- `npm run lint`、`npm run build`、`npx tsc --noEmit` 当前均通过。
- 状态推进到 Implementation Complete；仍需 `LF-CORE-002` 提供 browser recovery evidence 后才能 Accepted。

### LF-CORE-002: State Recovery and Transition Regression

Owner: Core App / State Team
Status: In Progress / QA Evidence Required
Dependencies: QA Team, Life Map Team, Voice & Dialogue Team

Scope:

- 建立状态转移矩阵：landing -> questions -> Self Skill -> map -> chat -> share。
- 建立 demo sample 状态矩阵：demo sample -> map -> node -> chat -> share。
- 建立恢复矩阵：Self Skill、map、chat、share 四个主步骤刷新后都可继续。
- 建立坏数据恢复矩阵：corrupt Self Skill、stale selected fork、invalid step、missing chat messages、storage unavailable。
- 明确跨团队 state contract：
  - `selectedFork` 负责聊天入口。
  - `previewForkId` 负责地图焦点。
  - route chips 必须从当前 tree 派生，不能信任旧 persisted fork object。

Acceptance:

- 任一主步骤刷新后不白屏。
- 旧 `selectedFork` 找不到时能回退到当前 tree 中的可用节点。
- 加载 `演示样本` 不混入旧用户聊天、旧 selected fork 或旧 step。
- 清空、加载 demo、重新开始均保持确认逻辑。
- Browser console error 为 0。

Team brief intake — 2026-04-30:

- Core 已交付实现基础；下一步由 QA 验证刷新恢复、坏数据恢复和 demo sample isolation。
- 必须补 browser-use evidence：Self Skill、Life Map、Chat、Share 四个步骤刷新后可继续。
- 必须补 corrupt localStorage case：bad JSON、invalid step、stale selected fork。

### LF-SKILL-001: Local Generator Reliability

Owner: Self Skill & Simulation Engine Team
Status: Ready
Dependencies: Product & Research Team, AI Gateway Team

Scope:

- 确保无 API、API 超时、API 返回坏 JSON 时，本地生成仍能产出完整 Self Skill、时间线、地图、聊天入口。
- 固定最小输入 fixture 和典型输入 fixture。
- 暂缓大拆分，除非直接降低崩溃风险。

Acceptance:

- 本地生成耗时低于 200ms。
- fork tree parent-child 一致性测试通过。
- Self Skill 必须包含 `identity`、`voice`、`timeline`、`forks`、`evidence`、`claims`。

### LF-AI-001: AI Disabled and Schema Guard

Owner: AI Gateway & Prompt Team
Status: Implementation Complete / Contract Gap
Dependencies: Core App Team, QA Team

Scope:

- `DEEPSEEK_API_KEY` 缺失时返回 `AI_DISABLED`，不发起外部请求。
- API route 输入和 LLM 输出增加 schema validation。
- API response 暴露 `meta.llmUsed` 和 `meta.fallbackReason`。
- 错误请求必须 400，不允许生成空档案或调用模型。

Acceptance:

- 删除 `.env.local` 后生成和聊天仍可完成。
- LLM 返回非 JSON 时前端 fallback。
- `/api/generate-self-skill` 缺少五问字段时返回 400。
- API route 不因坏请求、坏 JSON、provider error 返回未捕获异常。

Round 4 review note:

- `src/lib/ai/` 已拆出 prompts、providers、schemas、tokenBudget。
- `/api/chat` 和 `/api/generate-self-skill` 的无效请求已返回 400，并带 `meta.llmUsed: false` 与 `fallbackReason: invalid_request`。
- `npm run content:audit`、`npm run lint`、`npm run build` 均通过。
- 下一步需要把 AI disabled、provider error、non-JSON、schema validation failed 做成可重复验收，而不是依赖人工观察。

Team brief intake — 2026-04-30:

- AI Gateway Team 报告已完成 request validation、LLM response schema validation、versioned prompts、tokenBudget、AI disabled fallback。
- 复核确认：`src/lib/ai/prompts/`、`src/lib/ai/schemas/`、`src/lib/ai/providers/` 和 `src/lib/ai/tokenBudget.ts` 已存在。
- `npm run lint`、`npm run build`、`npx tsc --noEmit` 当前均通过。
- Contract gap：当前 invalid request 和 route_error response 的 `meta` 仍缺 `promptVersion`，与“每次 API 返回 promptVersion”的目标不完全一致。
- 状态推进到 Implementation Complete / Contract Gap；修齐 meta contract 并补 fallback regression 后才能 Accepted。

### LF-AI-002: API Contract and Fallback Regression

Owner: AI Gateway & Prompt Team
Status: In Progress / Contract Gap
Dependencies: Core App Team, QA Team, Content Systems Team

Scope:

- 建立 API contract regression matrix：
  - invalid request。
  - AI disabled。
  - provider error。
  - non-JSON provider response。
  - schema validation failure。
- 为 Self Skill、chat、WeChat analysis 三条 API 统一 meta contract：
  - `meta.llmUsed`。
  - `meta.fallbackReason`。
  - `promptVersion`。
- 建立 prompt output fixture：
  - Self Skill JSON。
  - chat reply under 150 Chinese characters。
  - WeChat summary JSON。
- 所有 demo 验收必须证明没有 live model 也能完整跑通。

Acceptance:

- QA 能用一个命令或明确 checklist 验证三条 API 的坏输入和 fallback 行为。
- 无 API key、provider error、bad JSON 都不会阻断主流程。
- Content Systems prompt policy 仍被注入 prompt builders。
- API 失败不破坏 localStorage。

Team brief intake — 2026-04-30:

- invalid request guard 已实测：`POST /api/chat {}` 与 `POST /api/generate-self-skill {}` 均返回 400。
- 仍需新增可重复 regression：AI disabled、provider error、non-JSON、schema validation failed。
- 仍需统一 invalid/error meta 的 `promptVersion`。

### LF-VOICE-001: Dialogue Calibration Continuity

Owner: Voice & Dialogue Team
Status: Implementation Complete / QA Required
Dependencies: AI Gateway Team, Product & Research Team

Scope:

- 校准反馈进入 `SelfSkill.voice.calibrationNotes`。
- 下一轮回复体现“更口语 / 更克制 / 更锋利”等反馈。
- 本地 fallback 和 API fallback 回复都不能卡住聊天输入。

Acceptance:

- 用户点击校准后，下一轮回复有可感知变化。
- 回复长度适配聊天界面，不挤压移动端布局。
- 连续发送 3 条消息后页面不卡死、输入框可继续使用。

Round 4 review note:

- `VoiceProfile`、`StageVoice[]`、quick questions、voice calibration controls 已存在。
- `sendMessage` 已把 `voiceProfile`、`stageVoice`、`calibrationNotes`、fork context 和 recent history 传给 `/api/chat`。
- 本地 fallback 可在 API 不可用时继续回复。
- 风险集中在连续快速发送、校准后下一轮是否明显变化、移动端长回复布局和聊天状态持久化。

Team brief intake — 2026-04-30:

- Voice & Dialogue Team 报告已完成微信摘要进入 voice extraction、stageVoice API 传参、本地危机拦截、prompt 强化、校准 notes 持久写入。
- 复核确认：`chatSlice.ts` 已传 `stageVoice`、`calibrationNotes`，`chat route` 已接收并传入 prompt，`dialogueEngine.ts` 有 safety intercept。
- `npm run lint`、`npm run build`、`npx tsc --noEmit` 当前均通过。
- 状态推进到 Implementation Complete；仍需 `LF-VOICE-002` 的 browser-use 对话连续性和移动端证据。

### LF-VOICE-002: Dialogue Send Reliability and Calibration QA

Owner: Voice & Dialogue Team
Status: In Progress / Browser QA Required
Dependencies: Core App / State Team, AI Gateway & Prompt Team, QA Team, Content Systems Team

Scope:

- 定义聊天发送可靠性：
  - 一次只允许一个 message in flight，或定义明确队列。
  - 快速点击 quick questions 不丢消息。
  - API 失败后输入框仍可继续使用。
- 定义语气校准验收：
  - 点击 `更口语` 后，下一轮回复有更口语的可感知变化。
  - 点击 `更克制` 后，下一轮回复明显降低夸张表达。
  - calibration notes 在回地图、再进聊天后仍生效。
- 定义移动端布局验收：
  - 390px 宽度下消息不横向溢出。
  - 长回复不遮挡输入区和分享入口。
  - voice calibration buttons 自动换行且可点击。

Acceptance:

- 用户可在同一 fork 连续发送 3 条消息、校准语气、返回地图、再进入聊天并继续。
- 危机关键词仍触发 safety intercept。
- 对话回复遵守 Content Systems 输出边界。
- Browser console error 为 0。

Team brief intake — 2026-04-30:

- 语气和 prompt 链路已接通。
- 下一步重点是用户体验证据：连续三条消息、quick questions 快速点击、校准后下一轮变化、390px 移动端布局。

### LF-DATA-001: WeChat Import Does Not Block Onboarding

Owner: WeChat / Data Ingestion Team
Status: Ready
Dependencies: Self Skill Team, QA Team

Scope:

- 跳过微信导入必须稳定可用。
- 粘贴少量聊天文本后，本地分析必须可返回摘要。
- 大文件能力后置；V0.5 只要求不阻断主流程。

Acceptance:

- 跳过微信导入可进入补充材料页。
- 粘贴文本后“本地分析这段聊天”可用。
- 分析失败时用户仍可继续生成。

### LF-OPS-001: Stable Preview Runtime

Owner: QA / Release / DevOps Team
Status: In Progress / Runtime Decision Required
Dependencies: Core App Team

Scope:

- `npm run start:3005` 作为演示默认命令。
- 检查端口占用、重复进程、server error。
- 不允许 dev server watcher 风暴影响演示。

Acceptance:

- 3005 端口只有一个服务进程。
- 连续刷新 10 次无 server crash。
- 演示前无需清理代码或重装依赖。

Round 5 review note:

- `http://localhost:3006/` 初始未响应，本轮已重新启动。
- `npm run dev -- -p 3006` 会触发大量 `EMFILE: too many open files, watch`，不适合最终演示取证。
- `npm run start -- -p 3006` 在 `npm run build` 后稳定返回 200。
- QA / DevOps Team 需要把 V0.5 演示命令固定为 production preview，或修复 dev watcher 文件句柄问题。

### LF-MAP-002: Semantic Containment Refactor

Owner: Life Map / Visualization Team
Status: Review / Visual Evidence Gap
Dependencies: Self Skill & Simulation Engine Team, UX / UI / Motion Team, QA Team

Scope:

- 修正 `现在 -> 晚年` 与 `现在 -> 3 年后` 的视觉层级。
- `现在 -> 晚年` 必须表现为 life container；`3 年后`、`10 年后` 等 checkpoint 必须在该容器内部浮现。
- 连线必须从父容器或父标签的正确边界接到子节点，不允许让父子关系看起来像同级横向分支。
- 先保证结构可理解，再处理高级动画。

Acceptance:

- 全人生视角下，用户能看懂多条人生主线是从“现在”生长出去的。
- 点击稳定线后，`3 年后` 和 `10 年后` 清楚处于稳定线内部。
- `现在 -> 晚年 -> 3 年后 -> 第 1 年 -> 第 3 个月 -> 23:40` 可逐级进入。
- Browser console error 为 0。

Round 2 note:

- 普通稳定线 containment 已经接近验收。
- 剩余问题是选中稳定线后仍有其他主线残影，Life Map Team 需要降低非当前分支干扰并保证隐藏节点不拦截点击。

Round 2.1 visual regression note:

- 用户在 browser diff 中标记 `底图 · 全人生 · 试验线：用可逆实验慢慢改写人生 · 子节点 2`，截图显示从左侧父节点到 `90 天`、再到 `第 1 周` 的曲线存在明显断裂。
- 该问题按 P0 处理，因为 demo 体验会被用户理解为人生地图逻辑断掉。
- Life Map Team 必须检查 edge anchor 计算、父子层级归属、viewport 裁切、z-index/overflow 和 SVG/path clipping；验收时每条可见线段必须从父锚点连续连接到子锚点。

Round 2.2 root-cause update:

- 用户复核后确认，根因已经升级为时间层级错误：`90 天` 与 `第 1 周` 这类不同时间粒度节点被放进同一平面层级。
- `90 天` 应当表现为 phase container，`第 1 周` / `第 3 周` 应当作为该 phase 内的 child nodes 出现。
- `10 年后` 这类 life/decade checkpoint 不能漂浮在 `90 天` 容器内部；如果需要保留上下文，只能作为 breadcrumb、上层底图或低干扰背景，不得参与当前层级布局。
- Life Map Team 的任务升级为 cross-scale containment hierarchy：先修层级和包含关系，再修连线连续性。

Round 5 review note:

- Browser-use 已验证 `试验线 -> 90 天 -> 第 1 周` 可点击进入，route 和详情面板更新，console error count 为 0。
- DOM 显示 `90 天` active 时 `第 1 周` 和 `第 3 周` 是可进入子节点。
- `第 1 周` 选中后的 route 显示为 `现在的生活点 -> 试验线 -> 90 天 -> 你只做最小可见动作`；建议 Life Map Team 复核 route label 是否应保留 `第 1 周` 前缀。
- 当前仍缺 90 天状态稳定截图；本轮 in-app browser screenshot 在该状态下超时。

### LF-MAP-003: Viewport and Camera Containment

Owner: Life Map / Visualization Team
Status: Review / Visual Evidence Gap
Dependencies: UX / UI / Motion Team, QA Team

Scope:

- 修复人生地图外框、卡片、提示条超出屏幕的问题。
- 全人生默认镜头必须包含“现在”和至少 3 条主线卡片。
- 避免 focus lock 锁在空白区域。
- 保证地图 canvas 只在地图 viewport 内裁切，不撑开整个页面。

Acceptance:

- 1440px、1280px、390px 三档截图无横向页面溢出。
- 地图外框不超出浏览器可视宽度。
- 当前路线条、重置镜头按钮、右上提示不互相遮挡。
- QA 使用 browser-use 截图留档。

Round 2 note:

- 普通地图默认视角明显改善。
- 完整人生 demo fixture 加载后默认镜头仍裁切左侧关键节点，重置镜头后仍未恢复；该问题继续阻塞 `演示样本` 作为对外演示入口。

Round 2.1 visual regression note:

- 当前 `十年` 尺度下，选中 `第 1 周：你只做最小可见动作` 后，地图区域顶部出现连线被裁切或锚点错位的现象。
- QA 截图分辨率为 932x999，标记点约在 `(313, 277)`；Life Map Team 需要把该尺寸加入 browser-use 回归矩阵。
- 修复不能只移动卡片位置；必须证明 line layer、node layer、viewport mask 在所有尺度下使用同一坐标系。

Round 2.2 root-cause update:

- Viewport 验收要加入 hierarchy correctness：当前容器内部只能出现当前层级允许的子节点。
- 缩放和重置镜头必须保持同一个语义焦点，例如进入 `90 天` 后，镜头应聚焦 `90 天` 容器和它的周级子节点，而不是混入十年级 checkpoint。
- QA 截图必须同时检查“看得见”和“层级对”，不能只检查是否无溢出。

Round 5 review note:

- UX evidence 已提供 1440、1280、390 和 in-app selected screenshots。
- `docs/ux-evidence/lifefork-map-inapp-selected.png` 仍显示左侧关键内容被裁切，full-life selected state 不能进入 Accepted。
- 1440 evidence 改善明显，但左侧历史/root 区域仍显拥挤；QA 需要一张修复后的 in-app selected screenshot。

### LF-MAP-004: Cross-Scale Time Hierarchy Repair

Owner: Life Map / Visualization Team
Status: Review / Screenshot Pending
Dependencies: Self Skill & Simulation Engine Team, Life Scenario Lab Team, Product & Research Team, QA Team

Problem:

- 当前 Life Map 会把 `全人生`、`十年`、`阶段`、`一年`、`一周` 等不同尺度节点同时放进同一个视觉平面。
- 这会让 `90 天` 和 `第 1 周` 看起来像并列节点，也会让 `10 年后` 混入 `90 天` 的局部容器。
- 结果是用户无法判断谁包含谁、谁是同级、谁是路径上下文。

Required behavior:

- `全人生` 视角：只展示人生主线和关键 life containers，不直接暴露周、天、小时级节点。
- `十年` 视角：展示 decade / era / major checkpoint，不把 week/day/hour 节点当同级卡片铺开。
- `阶段` 视角：展示当前 phase container，例如 `90 天`，并在容器内部展示其 week-level child nodes。
- `一周` / `一天` / `一小时` 视角：只展示当前 parent container 内部的同尺度节点和直接子节点。
- 上层路径可以作为 breadcrumb、低透明底图或 route chips 出现，但不能参与当前层级的主布局和主连线。

Implementation direction:

- Layout engine must group nodes by `semanticParentId` / `containerId` before positioning.
- Edge renderer must draw container-to-child relationships only after parent container bounds are resolved.
- Hidden or background context nodes must not intercept clicks.
- Scale switch must be semantic zoom: changing scale changes visible hierarchy and camera distance together.

Acceptance:

- 进入 `90 天` 后，`第 1 周` 和 `第 3 周` 必须在 `90 天` 容器内。
- `10 年后` 不得作为 `90 天` 容器内部节点出现。
- 选择 `第 1 周` 后，当前路径必须表达为 `现在 -> 试验线 -> 90 天 -> 第 1 周`。
- 在 932px、1280px、1440px 宽度下，所有可见主线 edge 连续，且每条线连接的两个节点层级合法。
- Browser console error 为 0。

Round 5 review note:

- Data and DOM path are now aligned with the semantic hierarchy.
- Remaining gate is visual: `90 天` selected and `第 1 周` selected screenshots must show containment and route without clipping.
- No further data-model redesign is requested unless QA finds a visual regression that points back to data hierarchy.

### LF-SKILL-002: Time Containment Contract

Owner: Self Skill & Simulation Engine Team
Status: Implementation Complete / Map Handoff Ready
Dependencies: Life Map / Visualization Team, Life Scenario Lab Team

Scope:

- 扩展 `ForkPath` 的时间语义，不能只依赖 `scale` 和 `children`。
- 为节点补齐 `durationMonths`、`timeRange`、`containmentRole`、`orderIndex` 等字段设计。
- 修正 `3 年` 被归到 `decade` 的语义问题。
- 提供 parent-child consistency 和 time containment validation。

Acceptance:

- 子节点时间区间必须落在父节点时间区间内。
- 每条主线至少有一条可钻取链：life -> year/era -> month/week/day/hour。
- Life Map Team 可直接根据数据判断父子包含，而不是靠 UI 猜。

Round 2 note:

- Scenario fixture 静态校验已通过，说明 time containment 和 representative path 已有可测资产。
- 仍需提交正式 schema brief，作为 Life Map camera 和 QA 的共同契约。

Round 2.2 root-cause update:

- Self Skill Team 必须把 `timeScale`、`timeRange`、`semanticParentId`、`containerId`、`displayScale`、`containmentRole` 做成 Life Map 可消费的强契约。
- Validation 需要阻止非法层级：例如 week node 不能直接挂在 life container 下，decade checkpoint 不能被 phase container 当作内部 child。
- Scenario fixture 通过静态校验不等于视觉语义通过；下一版 validation 要能输出 hierarchy violations，供 QA 和 Life Map 同时使用。

Round 5 review note:

- `docs/SELF_SKILL_CONTAINMENT_SCHEMA.md` 已交付。
- `validateForkHierarchy`、`lifeMapTeamFixture`、valid/invalid examples、expected hierarchy violations 已落地。
- `npm run qa:scenarios`、`npm run lint`、`npx tsc --noEmit --pretty false`、`npm run build` 均通过。
- Self Skill containment contract 可作为 Life Map V0.5 handoff 基线。

### LF-COPY-001: Content Systems Team and Copy Registry

Owner: Content Systems / Narrative Architecture Team
Status: Review / Next Implementation Pass
Dependencies: Product & Research Team, UX / UI / Motion Team, AI Gateway & Prompt Team

Scope:

- 新增 Content Systems / Narrative Architecture Team。
- 建立统一文案 owner 和文案 registry 设计。
- 管理页面文案、Life Map 节点叙事、分享卡模板、AI prompt 输出口径、动态 MBTI 文案。
- Product & Research 继续定义文案边界和反模式，但不再承担全部文案资产管理。

Implemented:

- Evidence artifact: `docs/COPY_REGISTRY_BRIEF.md`.
- 新增 `src/lib/content/types.ts`、`copyRegistry.ts`、`lifeMapNarratives.ts`、`shareCardTemplates.ts`。
- `contentRegistry` 已覆盖 metadata、入口页、导航、disclaimer、生成中、分享卡、Life Map root narrative、Life Map dialogue hints、动态类型文案、Product & Research boundary、AI output policy。
- `ForkPath.content` 已作为节点叙事 owner attribution 字段接入，Life Map 生成和历史节点创建会自动补齐 owner/version。
- `src/lib/ai/prompts/*` 已注入 Content Systems 统一输出口径。
- 新增 `npm run content:audit`，用于检查 registry metadata、prompt policy 接入、分享卡模板接入、Life Map attribution 接入和旧文案残留。

Acceptance:

- V0.5 主流程关键文案有 owner。
- 新增文案必须带 `surface`、`intent`、`tone`、`riskLevel`、`owner`、`version`。
- Life Map 节点叙事不再无归属地散落。
- `npm run content:audit` 通过。
- `docs/COPY_REGISTRY_BRIEF.md` 包含 CopyEntry contract、naming convention、owner table、Top 20 copy fixes。

Round 2 note:

- `npm run content:audit` 已通过。
- 下一步必须交付主流程 copy owner map 和 Top 20 copy fixes，尤其复核完整人生 fixture 中疾病、衰老、死亡、最后留言相关文案。

Round 5 review note:

- `docs/COPY_REGISTRY_BRIEF.md` 已交付，并包含 CopyEntry contract、命名规范、owner map、Top 20 copy fixes。
- `npm run content:audit` 通过。
- Brief 仍列出未迁移的 component-local strings：Five questions、WeChat import、Self Skill panel、Timeline、Chat UI labels、Life Map panel labels。
- 下一轮目标是迁移高风险本地文案，而不是继续扩展 registry 设计。

### LF-SCENARIO-001: Full-Life Demo Fixture

Owner: Life Scenario Lab Team
Status: Implementation Complete / Map Integration Pending
Dependencies: Self Skill & Simulation Engine Team, Life Map / Visualization Team, QA Team

Scope:

- 新增 Life Scenario Lab Team。
- 创建一个从出生到死亡的高质量演示样本。
- 每年和每月都有至少两个选择集。
- 所有选择都可进入体验，但不要求一次性全量展开所有指数级组合。
- 使用 lazy expansion、choice set、representative path replay 控制性能和可读性。

Acceptance:

- Fixture 可在 120 个可见节点以内演示完整人生。
- 每个尺度至少有一个可进入节点。
- 任意选择集至少 2 个选项。
- 从出生到死亡的代表路径可完整回放、进入对话、生成分享卡片。

Round 2 note:

- `npm run qa:scenarios` 已通过：38 个 app nodes、33 个 fork nodes、7 个 choice sets。
- 数据层进入 Review；视觉集成被 `LF-MAP-003` 阻塞。
- Scenario Lab 需要补充 fixture 首屏期望构图，明确加载后哪些节点必须可见、哪些代表路径节点允许离屏。

Round 3 note:

- Canonical persona 已定义为 `fullLifeDemoPersona`。
- 11 个 life stages 已定义为 `fullLifeDemoStages`。
- 5 条 replay branch 已定义为 `fullLifeDemoReplayBranches`：representative complete、stable、leap、experiment、relationship。
- 所有 selectable choice sets 已进入 `fullLifeChoiceSetQaChecklist`。
- `npm run qa:scenarios` 会验证 stage coverage、branch coverage、choice set QA checklist 和 visible node budget。

Round 5 review note:

- `npm run qa:scenarios` 当前输出：38 app nodes、33 fixture fork nodes、7 choice sets、11 life stages、5 replay branches、7 QA checklist items。
- Scenario Lab 数据实现完成。
- Acceptance 仍依赖 Life Map / UX 完成 full-life fixture 首屏和 selected state visual framing。

### LF-MBTI-001: Dynamic MBTI Model Planning

Owner: Product & Research Team, Content Systems Team, Self Skill & Simulation Engine Team, UX / UI / Motion Team
Status: Implemented / V0.5 Reserved Slot Accepted
Dependencies: LF-COPY-001, LF-SKILL-002

Scope:

- 设计动态 MBTI，不做静态人格标签。
- 类型倾向应随人生线、时间阶段、压力状态变化。
- 分享卡片展示“当前类型倾向”和“这条人生线上的类型漂移”。

Acceptance:

- 输出 `DynamicTypeProfile` schema brief。
- 分享卡有展示槽位设计。
- 文案避免把 MBTI 说成命运判断。

Evidence: `docs/DYNAMIC_MBTI_SCHEMA_BRIEF.md`

Round 5 review note:

- `DynamicTypeProfile`、branch dynamic type signal、Share Card slot、Life Map detail slot 已落地。
- Browser-use DOM 复核确认 Life Map detail panel 会显示 `动态类型读数`、`当前类型倾向`、`分支漂移`、`置信度` 和 `证据提示`。
- V0.5 不扩大 MBTI 交互范围；只保留为 evidence-backed contextual tendency。

### LF-ONBOARD-001: Entry Simplification Decision

Owner: Product & Research Team, UX / UI / Motion Team, Core App / State Team
Status: Accepted for V0.5 implementation
Dependencies: QA Team

Scope:

- 重评“未来的我 / 过去的我 / 另一条路上的我”入口选择。
- 如果该选择不能显著改变后续体验，V0.5 移除该步骤，默认进入五问。
- 如果保留，必须变成入口镜头模式：未来默认地图、过去默认时间线、另一条路默认 fork path。

Recommendation:

- V0.5 移除该步骤，减少首次体验摩擦。
- V0.6 再恢复为可影响体验路径的入口镜头模式。

Decision record:

- Decision: V0.5 removes the three-option entry.
- Rationale: `selectedVersion` currently does not change the generated surface enough to justify an extra pre-question choice.
- Implementation: `Landing.startNewExperience()` routes directly to `questions`; the store default and reset path set `selectedVersion` to `future`; legacy persisted `select-version` resumes at `questions`.
- Copy evidence: landing copy states the user starts with five questions and can still meet past selves on Timeline and fork selves on Life Map.

Updated user journey:

1. Landing.
2. Five questions with default `selectedVersion=future`.
3. Optional WeChat import.
4. Optional extra text.
5. Self Skill generation.
6. Self Skill panel.
7. Timeline for past self review.
8. Life Map for future and fork selves.
9. Branch chat and share card.

QA path:

1. Clear localStorage or click `清空重来`.
2. Click `开始五问`.
3. Confirm the page shows `五问访谈` and no future/past/fork option cards.
4. Complete five answers, skip or complete optional inputs, generate Self Skill.
5. Confirm generated Self Skill has `selectedVersion: "future"`.
6. Open Timeline and Life Map to verify past and fork selves remain reachable after generation.

Acceptance:

- 新用户少一步进入核心输入。
- 不再出现“选了但后续无差别”的体验落差。

Round 2 note:

- 导航中的 `演示样本` 按钮可加载 full-life fixture。
- 由于 fixture 默认镜头仍裁切，`演示样本` 暂时只作为内部 QA/demo asset，不作为公开演示首屏路径。

## 7. Current Sprint Assignment — 2026-05-12

目标：把 V0.5 收敛到“可部署、可演示、可验收”的状态。当前 Sprint 只处理会影响可用性、稳定性、性能、地图核心理解、后台编辑可用性的工作。

### 7.1 Critical Path

```text
Release Runtime
  -> Main Flow Regression
  -> Life Map Containment
  -> State Recovery
  -> Editor Config QA
  -> Demo Gate
```

阻塞关系：

- `LF-MAP-*` 阻塞公开演示，因为人生地图是当前核心体验。
- `LF-QA-001` 阻塞 Accepted 状态，因为所有实现都需要 browser evidence。
- `LF-CORE-002` 阻塞稳定发布，因为刷新恢复和坏数据恢复不稳定会直接破坏演示。
- `LF-EDITOR-001` 阻塞“编辑可用”口径，因为后台开关必须真实影响前台流程。

### 7.2 P0 Assignments

#### P0-A: Production Preview Gate

Owner: QA / Release / DevOps Team
Requirement IDs: `LF-OPS-001`, `LF-QA-001`
Write scope:

- `package.json`
- `next.config.ts`
- `docs/LIFEFORK_AUDIT_REPORT.md`
- future: `docs/RELEASE_RUNBOOK.md`

Tasks:

- 固定演示命令为 `npm run build` + `npm run start:3005` 或 `npm run preview:3005`。
- 每轮验收前检查 3005 端口只有一个服务进程。
- 记录 `lint`、`build`、`content:audit`、生产预览 HTTP 200。
- 建立 browser evidence checklist：landing、五问、微信跳过、生成、地图、聊天、分享、后台编辑。
- 建立内存/进程检查 checklist，避免 dev watcher 再次卡死机器。

Acceptance:

- `npm run lint` 通过。
- `npm run build` 通过。
- `npm run content:audit` 通过。
- `curl -I http://localhost:3005/` 返回 200。
- 验收结束后无 3005 残留进程。
- 文档中记录本轮 verification date、commands、result、known issues。

PR boundary:

- 只改运行、验证、文档和必要脚本。
- 不改 Life Map 逻辑。
- 不改 Self Skill 生成规则。

#### P0-B: Life Map Containment Repair

Owner: Life Map / Visualization Team
Requirement IDs: `LF-MAP-001`, `LF-MAP-002`, `LF-MAP-003`, `LF-MAP-004`
Write scope:

- `src/components/ForkPaths/index.tsx`
- `src/components/ForkPaths/MapLinks.tsx`
- `src/components/ForkPaths/NodeDetailPanel.tsx`
- `src/components/ForkPaths/ScaleSidebar.tsx`
- `src/components/ForkPaths/CurrentRouteBar.tsx`
- `src/components/ForkPaths/layoutEngine.ts`
- `src/components/ForkPaths/connectorPath.ts`
- `src/components/ForkPaths/model/*`

Tasks:

- 修复父子包含：子节点必须始终在父容器内部。
- 修复当前尺度文本可读性：当前尺度卡片文字必须在默认 zoom 下可见。
- 修复连线：父子关系线从父容器内部左侧或标签锚点出发，连接到子节点左右边缘。
- 高亮父子路径时，非当前路径连线和节点虚化。
- 修复 focus lock 空白问题。
- 修复 zoom/pan/drag 反馈：触控缩放方向、鼠标拖动方向、相机移动必须一致。
- 把 932px、1280px、1440px 三档加入视觉回归。

Acceptance:

- 全人生尺度显示主线小卡片，不显示周/天/小时细节。
- 进入 `90 天` 后，`第 1 周` 和 `第 3 周` 位于 `90 天` 容器内部。
- `10 年后` 不出现在 `90 天` 容器内部。
- 选择 `第 1 周` 后，当前路径表达为 `现在 -> 试验线 -> 90 天 -> 第 1 周`。
- 选中父节点时，父节点和直接子节点同屏可见。
- Browser console error 为 0。
- 节点数小于 120 时无明显卡顿。

PR boundary:

- 只改地图组件、地图布局、地图可视化模型。
- 需要 Self Skill 数据字段变更时，先开独立 `LF-SKILL-*` PR。
- 不改聊天、AI route、后台编辑。

#### P0-C: State Recovery and Bad Data Guard

Owner: Core App / State Team
Requirement IDs: `LF-CORE-002`
Write scope:

- `src/lib/stores/slices/*`
- `src/lib/stores/types.ts`
- `src/lib/storage.ts`
- `src/lib/schema/*`
- `src/app/page.tsx`

Tasks:

- 建立状态恢复矩阵：self-skill、timeline、forks、chat、share、editor。
- 修复 stale selected fork：旧 fork 不存在时回退到当前树可用节点。
- 修复 invalid step：未知 step 回到 landing 或 questions。
- 修复坏 JSON：localStorage 坏数据不白屏。
- 明确 `clearAll()` 的边界：清用户体验数据，保留 `editorConfig`。
- 给 demo scenario 加隔离：加载演示样本不得混入旧聊天、旧 fork、旧 step。

Acceptance:

- 任一主步骤刷新后可继续。
- 坏 `lifefork.selfSkill` 不白屏。
- 坏 `lifefork.selectedFork` 自动回退。
- `清空重来` 不清后台编辑配置。
- `恢复默认后台配置` 只影响 `lifefork.editorConfig`。
- Browser console error 为 0。

PR boundary:

- 只改 store、storage、schema、root step rendering。
- 不改地图视觉。
- 不改文案 registry。

#### P0-D: Editor Console QA and Admin Migration Brief

Owner: Editor Console / Internal Ops Team
Requirement IDs: `LF-EDITOR-001`
Write scope:

- `src/components/EditorConsole.tsx`
- `src/lib/editorConfig.ts`
- `src/lib/stores/slices/uiSlice.ts`
- `src/components/AppNav.tsx`
- `src/components/Landing.tsx`
- `src/components/QuestionFlow.tsx`
- `src/components/GeneratingScreen.tsx`
- `src/components/ShareCard.tsx`
- docs for admin migration

Tasks:

- 验证首页、导航、分享箴言、免责声明可被后台配置修改。
- 验证微信导入开关影响五问后的下一步。
- 验证 AI API 开关影响生成和聊天是否请求 API。
- 验证导入非法 JSON 不白屏。
- 写 `/admin` 迁移 brief：路由、权限、配置版本、审计日志、发布/回滚。

Acceptance:

- 后台入口在无 Self Skill 状态可进入。
- 保存配置后前台立即生效。
- 刷新后配置仍存在。
- 下载配置 JSON 可重新导入。
- 关闭后台入口后导航隐藏入口，现有 editor step 不崩溃。

PR boundary:

- 当前 Sprint 不做真实登录。
- 当前 Sprint 不做服务端 CMS。
- 当前 Sprint 不引入数据库。

### 7.3 P1 Assignments

#### P1-A: AI Contract Regression

Owner: AI Gateway & Prompt Team
Requirement IDs: `LF-AI-002`
Write scope:

- `src/app/api/chat/route.ts`
- `src/app/api/generate-self-skill/route.ts`
- `src/app/api/wechat-analyze/route.ts`
- `src/lib/ai/*`
- `scripts/*`

Tasks:

- 统一所有 API response meta：`llmUsed`、`fallbackReason`、`promptVersion`。
- 增加 invalid request、AI disabled、provider error、non-JSON、schema validation failed 的可重复验证。
- 保证无 API key 时不会发起外部请求。

Acceptance:

- 三条 API 坏请求返回 400，并带 meta。
- AI disabled 场景不调用 provider。
- non-JSON 和 schema failed 均 fallback。
- 前端主流程不受 API 失败影响。

#### P1-B: Voice Calibration Reliability

Owner: Voice & Dialogue Team
Requirement IDs: `LF-VOICE-002`
Write scope:

- `src/components/InstanceChat.tsx`
- `src/lib/dialogueEngine.ts`
- `src/lib/voiceEngine.ts`
- `src/lib/stores/slices/chatSlice.ts`

Tasks:

- 快捷问题连续点击不丢消息。
- API 失败后输入框继续可用。
- 语气校准后下一轮回复体现变化。
- 390px 下消息不横向溢出。

Acceptance:

- 同一 fork 连续发送 3 条消息成功。
- 校准后返回地图再进聊天，校准仍生效。
- 危机关键词仍触发 safety intercept。
- Browser console error 为 0。

#### P1-C: WeChat Import Stability

Owner: WeChat / Data Ingestion Team
Requirement IDs: `LF-DATA-001`
Write scope:

- `src/components/WeChatImportStep.tsx`
- `src/lib/wechatEngine.ts`
- `src/app/api/wechat-analyze/route.ts`
- future docs: `docs/WECHAT_IMPORT_SPEC.md`

Tasks:

- 保证跳过微信导入稳定。
- 少量文本导入可返回摘要。
- 对超大文本加体积提示和截断说明。
- 输出 Web Worker 分块方案，不在当前 Sprint 强做。

Acceptance:

- 跳过微信导入可进入额外文本页。
- 粘贴文本后本地分析可用。
- 大文本不会冻结 UI。
- 分享卡不展示原始聊天。

#### P1-D: High-Risk Copy Migration

Owner: Content Systems / Narrative Architecture Team
Requirement IDs: `LF-COPY-001`
Write scope:

- `src/lib/content/*`
- `src/lib/copy.ts`
- high-risk component-local strings
- `docs/COPY_REGISTRY_BRIEF.md`

Tasks:

- 迁移危机、安全、免责声明、分享卡、地图节点高风险文案。
- 保留普通 UI label 的本地字符串，避免当前 Sprint 过度改动。
- 为每条高风险文案标注 owner、surface、intent、tone、riskLevel、version。

Acceptance:

- `npm run content:audit` 通过。
- 高风险文案没有多处冲突版本。
- AI prompt 和页面显示使用同一风险口径。

### 7.4 P2 Assignments

#### P2-A: Product Usability Test

Owner: Product & Research Team
Requirement IDs: `LF-PRD-001`
Write scope:

- `docs/USER_RESEARCH.md`
- `docs/LIFEFORK_FINAL_REQUIREMENTS_AND_DESIGN.md`
- `docs/LIFEFORK_AUDIT_REPORT.md`

Tasks:

- 组织 3 名内部试用者，记录首次完成时间、卡住步骤、地图理解情况。
- 汇总“第一条有效洞察”出现在哪一步。
- 复核所有“人生模拟”文案是否保持边界。

Acceptance:

- 至少 3 份试用记录。
- 每份记录包含完成路径、阻塞点、主观理解、隐私疑问。
- 输出 Top 10 product fixes。

#### P2-B: Full-Life Fixture Visual Handoff

Owner: Life Scenario Lab Team
Requirement IDs: `LF-SCENARIO-001`
Write scope:

- `src/lib/scenarios/fullLifeDemoFixture.ts`
- `docs/SCENARIO_FIXTURE_BRIEF.md`
- `docs/ux-evidence/*`

Tasks:

- 给完整人生 demo 定义首屏期望构图。
- 标注哪些节点必须首屏可见，哪些节点允许离屏。
- 给 Life Map Team 提供 selected state 期望截图清单。

Acceptance:

- full-life demo 首屏期望构图明确。
- 至少 5 条 representative path 的可见性规则明确。
- QA 可据此判断截图是否合格。

### 7.5 PR Slicing Rules

每个 PR 必须遵守：

- 一个 PR 只归属一个主 requirement ID。
- P0 地图 PR 不混入 AI、聊天、后台编辑。
- P0 Core PR 不重写视觉。
- P0 Editor PR 不引入数据库或真实认证。
- 文档与代码可同 PR，但文档必须只描述本 PR 的行为变化。
- 每个 PR 必须写 `Verification`：至少包含 `npm run lint`、`npm run build`；文案或内容 PR 还要包含 `npm run content:audit`。
- UI PR 必须有截图或明确说明无法截图原因。

### 7.6 Daily Handoff Format

每个团队每日交付一段，不超过 12 行：

```markdown
## Team

Requirement IDs:

Done:

Blocked:

Risk:

Next 24h:

Verification:
```

## 8. Cross-Team Dependency Board

| Dependency | Provider | Receiver | Due before |
| --- | --- | --- | --- |
| 新用户主流程脚本 | QA | All Teams | Every merge |
| 地图验收场景 | QA, Product | Life Map, UI | LF-MAP-001 implementation |
| 375px 窄屏截图 | UI | QA, Product | LF-UI-001 review |
| `SelfSkill` schema version | Core App | Self Skill, AI, QA | LF-CORE-001 merge |
| minimum usable SelfSkill contract | Self Skill | AI, Core, QA | LF-SKILL-001 review |
| fallback metadata contract | AI Gateway | Core App, QA | LF-AI-001 review |
| preview runtime check | OPS | QA, Product | V0.5 release gate |
| time containment contract | Self Skill | Life Map, Scenario Lab, QA | LF-MAP-002 implementation |
| copy registry contract | Content Systems | UI, AI, Product, QA | LF-COPY-001 review |
| full-life fixture brief | Scenario Lab | Life Map, Self Skill, QA | LF-SCENARIO-001 review |
| dynamic MBTI schema brief | Product, Content Systems, Self Skill | UI, Share Card, QA | LF-MBTI-001 design |

## 9. Cadence and Rituals

Weekly:

- Monday scope review: 只确认本周会影响可用性和稳定性的 Ready 需求。
- Wednesday integration check: 各团队汇报 blocked / crash / broken path / changed scope。
- Friday acceptance review: QA 和 Product 对 Review 状态任务做真实浏览器验收。

Per PR:

- PR 必须标注 requirement ID。
- PR 描述必须写清 scope 和 non-scope。
- 涉及 UI 的 PR 必须附截图或明确说明人工验证方式。
- 涉及 API、storage、地图、聊天、分享卡片的 PR 必须写明 fallback 行为。

Per version:

- Product & Research 更新主流程验收记录。
- QA 更新 regression matrix 和失败截图。
- Release owner 更新 release notes 和 known issues。

## 10. Change Control

需求变更必须走以下路径：

1. 在对应文档中补充变更原因。
2. 标注影响范围：用户路径、数据模型、AI 输出、UI、测试、发布。
3. Product & Research 判断是否改变用户价值或非目标。
4. Owner 判断是否影响当前 sprint。
5. QA 判断是否增加验收项。

禁止：

- 在实现过程中静默扩大 scope。
- 为了展示效果绕过失败状态、loading 状态或 fallback。
- 把未验收的任务标记为 Accepted。
- 将重大产品定位变更只写在 PR 描述里，不更新需求文档。

## 11. Reporting Template

各团队每次汇报使用：

```markdown
## Team

## Requirement IDs

## Done

## In Progress

## Blocked

## Risk

## Needs from other teams

## Verification evidence
```

Product & Research 每周汇总：

- 主流程是否更稳。
- 哪些需求被接受。
- 哪些需求被推迟及原因。
- 哪些步骤仍会卡住或让用户迷路。
- 下一周最重要的 3 个崩溃/不可用风险。
