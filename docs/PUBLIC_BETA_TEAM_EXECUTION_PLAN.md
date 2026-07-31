# LifeFork V0.8 Public Beta 团队执行计划

> 文档状态：当前工作分配
> 计划版本：Execution Plan v1.0
> 更新日期：2026-07-31
> 发布目标：受控 Public Beta

## 1. 执行原则

1. 每个任务使用 `LF-<AREA>-<NUMBER>` 标识。
2. 每个 PR 只解决一个可验证主题。
3. 数据类型和 API schema 先变更，消费方随后接入。
4. 人生地图、AI 输出、隐私和分享字段属于高风险模块。
5. 高风险 PR 需要模块 owner 和 QA 双重批准。
6. 所有任务必须提供命令结果和人工冒烟证据。
7. 发布分支禁止混入实验代码和密钥。

## 2. 跨团队合同

| 合同 | Owner | 消费方 | 变更门禁 |
| --- | --- | --- | --- |
| `src/lib/types.ts` | Core | 全部产品模块 | Core + 相关消费方 |
| `src/lib/ai/schemas/*` | AI Gateway | API、Store、报告 | AI + Core + QA |
| `src/lib/runtimeConfig.ts` | Ops Platform | 前台、API、Admin | Ops + Frontend |
| `src/lib/schema/*` | Core | Storage、地图、报告 | Core + QA |
| `src/components/ForkPaths/model/*` | Life Map | 地图 UI | Map + QA |
| `src/lib/content/*` | Content | 全部 UI | Content + Product |
| `RuntimeConfig` persistence | Ops Platform | Admin、API、前台 | D1 与 JSON 行为一致 |
| OpenNext deployment artifact | Ops Platform | Sites、QA | 精确对应已推送 commit |
| localStorage key contract | Core | Store、恢复、导出 | Core + QA |

## 3. 发布关键路径

```text
Core contracts
  -> AI and method provenance
  -> Report and map UI
  -> Safety and privacy review
  -> Automated and browser QA
  -> OpenNext / Sites and Docker verification
  -> Release and monitoring
```

## 4. 团队任务包

### 4.1 Product & Research Team

**任务 ID：LF-PRODUCT-080**
**优先级：P0**

**目标和原因**

冻结 Public Beta 的用户任务、结果结构、默认方法和成功指标，避免开发继续扩大范围。

**团队范围**

- 首次体验。
- 分析报告信息架构。
- 方法权重语言。
- 可用性研究。
- 发布指标。

**拥有文档**

- `docs/PUBLIC_BETA_PRODUCT_SPEC.md`
- `docs/USER_RESEARCH.md`
- `PRODUCT.md`

**非目标**

- 编写 AI prompt。
- 修改地图坐标。
- 决定生产密钥。

**所需输入**

- 当前完整体验录像。
- 10 名目标用户。
- 方法与来源规范。
- 发布错误和降级数据。

**执行任务**

1. 验证首次用户 10 分钟闭环。
2. 验证用户能区分权重、参考度和概率。
3. 收集最难理解的五处文案。
4. 冻结 evidence-first 作为默认预设。
5. 定义激活、完成、分支进入和 7 日返回指标。

**验收标准**

- 8/10 用户无需指导完成。
- 8/10 用户能指出一条结论的来源。
- 7/10 用户能解释第三条路。
- 所有 P0 文案有最终中文。

**验证**

- 执行 `docs/USER_RESEARCH.md` 的测试脚本。
- 提交匿名观察记录。

**报告格式**

```text
Team:
Requirement IDs:
Participants:
Completion rate:
Top issues:
Decisions:
Open risks:
Paste-back status:
```

**回传摘要**

`LF-PRODUCT-080 | done/in-progress/blocked | 完成率 | P0 问题数 | 需要决策`

### 4.2 UX / UI Team

**任务 ID：LF-UX-080**
**优先级：P0**

**目标和原因**

让首次用户快速理解输入、报告、地图和来源说明，保证桌面和移动端可用。

**团队范围**

- 前台页面。
- 报告层级。
- 方法设置。
- 空、错、加载和禁用状态。
- 响应式与可访问性。

**拥有文件**

- `src/components/*.tsx`
- `src/app/globals.css`
- `DESIGN.md`

**不拥有**

- 地图场景坐标算法。
- AI 输出 schema。
- 服务端认证。

**接口**

- 只消费 `SelfSkill`、`IntegratedAnalysis` 和 `PublicRuntimeConfig`。
- 不在组件中推导新的业务结论。

**执行任务**

1. 报告首屏显示当前特征、核心冲突、材料完整度和下一步。
2. 所有方法以名称、权重、参考度和限制显示。
3. 文化方法使用独立区域。
4. 补齐键盘焦点、disabled、error 和 loading。
5. 完成 390、768、1280、1440 视口检查。
6. 执行直接文案审计。

**验收标准**

- 正文最小 14px。
- 当前地图尺度节点最小可见文字 12px。
- 无卡片嵌套。
- 无文本溢出和遮挡。
- `prefers-reduced-motion` 可完整操作。

**验证**

```bash
npm run lint
npm run content:audit
```

加浏览器截图：

- 首页桌面和移动。
- 方法页。
- 报告。
- 地图。
- 管理后台。

**报告格式**

同 4.1，增加 `Screenshots` 和 `Accessibility checks`。

**回传摘要**

`LF-UX-080 | status | 视口完成数 | a11y 阻塞数 | 截图目录`

### 4.3 Core App & State Team

**任务 ID：LF-CORE-080**
**优先级：P0**

**目标和原因**

保证步骤恢复、旧数据迁移和模块合同稳定。

**团队范围**

- 类型。
- Zustand slices。
- Storage。
- Schema migration。
- 步骤依赖。

**拥有文件**

- `src/lib/types.ts`
- `src/lib/stores/*`
- `src/lib/storage.ts`
- `src/lib/schema/*`

**不拥有**

- 组件样式。
- AI 供应商实现。
- 地图视觉坐标。

**执行任务**

1. 为当前 Self Skill 和 localStorage 增加明确 schema version。
2. 建立旧存档迁移 fixture。
3. 把步骤依赖写成声明表。
4. 处理 quota exceeded 和损坏 JSON。
5. 提供清除、导入和导出合同。

**验收标准**

- 任意损坏步骤不能恢复到空白页。
- 旧版存档迁移后通过 `validateSelfSkill`。
- localStorage 写入失败有用户提示。
- slice 之间不循环依赖。

**验证**

```bash
npm run typecheck
npm run qa:scenarios
```

**报告格式**

同 4.1，增加 `Schema changes`、`Migration fixtures`、`Consumer impact`。

**回传摘要**

`LF-CORE-080 | status | schema version | fixtures passed | migration risk`

### 4.4 Self Skill & Methods Team

**任务 ID：LF-SKILL-080**
**优先级：P0**

**目标和原因**

让每条核心判断可追溯、可修改，并保证不同分析方法边界清楚。

**团队范围**

- 本地生成。
- 方法注册。
- 权重。
- 综合 insight。
- 阶段 MBTI。
- 文化计算。

**拥有文件**

- `src/lib/selfSkill/*`
- `src/lib/analysis/*`
- `docs/ANALYSIS_METHODS_AND_PROVENANCE.md`

**接口**

- 输入：`GenerateSelfSkillInput`。
- 输出：`SelfSkill` 和 `IntegratedAnalysis`。
- 不直接访问 UI 或 localStorage。

**执行任务**

1. 为每个方法建立输入、输出和限制 fixture。
2. 为 insight 增加用户确认状态。
3. 为 MBTI 增加四维连续倾向。
4. 记录文化算法版本和出生时刻精度。
5. 群体统计必须注册样本、年份和适用范围。

**验收标准**

- 每条主要 insight 至少有一个贡献方法。
- 用户事实方法必须链接 evidence。
- 文化结果不会提高现实方案成功概率。
- 任何权重组合归一化为 100%。

**验证**

```bash
npm run typecheck
npm run qa:scenarios
```

**报告格式**

同 4.1，增加 `Method fixtures`、`Weight cases`、`Cultural boundaries`。

**回传摘要**

`LF-SKILL-080 | status | method fixtures | provenance coverage | open assumptions`

### 4.5 Life Map Team

**任务 ID：LF-MAP-080**
**优先级：P0**

**目标和原因**

稳定父子包含、连接线、语义缩放和焦点镜头。该模块是 Public Beta 最高风险项。

**团队范围**

- 规范化树。
- 稳定场景。
- 可见性。
- 相机。
- Bounds。
- 节点和连线。
- 鼠标与触控交互。

**拥有文件**

- `src/components/ForkPaths/*`
- `src/components/ForkPaths/model/*`
- `docs/SELF_SKILL_CONTAINMENT_SCHEMA.md`

**不拥有**

- 分支文案生成。
- Self Skill 权重。
- 全局 store schema。

**固定合同**

1. 一个节点一个实体。
2. 父时间范围包含子时间范围。
3. 直接子节点位于展开父容器内部。
4. 连接线父右到子左。
5. 展开父容器线从内部左侧开始。
6. 缩放不重排拓扑。
7. 镜头聚焦不允许空白。
8. 非关系线在聚焦时虚化。

**执行任务**

1. 建立 26、80、120 节点 fixture。
2. 为 stableScene、visibility、camera、bounds 写单元测试。
3. 建立桌面和移动截图基线。
4. 真机验证触控缩放方向和拖动。
5. 记录交互前后内存。

**验收标准**

- 所有可见子节点位于父容器 bounds。
- 同层大框不重叠。
- 当前尺度文字可读。
- 双击三种焦点模式可预测。
- 10 分钟连续操作内存无持续增长。

**验证**

```bash
npm run qa:scenarios
npm run build
```

加 Playwright 或浏览器手工路径。

**报告格式**

同 4.1，增加 `Fixture size`、`Containment failures`、`Camera cases`、`Memory samples`。

**回传摘要**

`LF-MAP-080 | status | fixtures | containment | camera | memory delta`

### 4.6 Voice & Dialogue Team

**任务 ID：LF-VOICE-080**
**优先级：P1**

**目标和原因**

让阶段实例逐步接近用户表达，同时避免无证据冒充和情感依赖。

**团队范围**

- Voice Profile。
- Stage Voice。
- 对话 prompt。
- 本地回复。
- 用户校准。

**拥有文件**

- `src/lib/voiceEngine.ts`
- `src/lib/dialogueEngine.ts`
- `src/lib/ai/prompts/dialogue.v1.ts`
- `src/components/InstanceChat.tsx`

**执行任务**

1. 建立语气版本和证据样本。
2. 每个阶段至少使用一个对应阶段材料。
3. 用户可标记像、不像、过度模仿。
4. 禁止“只有我懂你”等依赖表达。
5. 建立 30 条回归对话集。

**验收标准**

- 回复明确标记模拟。
- 不生成确定未来。
- 阶段语气差异可解释。
- 危机输入立即退出模拟。

**验证**

```bash
npm run content:audit
npm run typecheck
```

**报告格式**

同 4.1，增加 `Dialogue fixtures`、`Voice agreement`、`Safety failures`。

**回传摘要**

`LF-VOICE-080 | status | dialogue cases | agreement | safety failures`

### 4.7 Data Ingestion Team

**任务 ID：LF-DATA-080**
**优先级：P1**

**目标和原因**

让大文本导入稳定、可解释，并降低第三方隐私风险。

**团队范围**

- 微信解析。
- 文件限制。
- 本地脱敏。
- 摘要。
- 导入状态。

**拥有文件**

- `src/lib/wechatEngine.ts`
- `src/components/WeChatImportStep.tsx`
- `src/lib/ai/prompts/wechat.v1.ts`

**执行任务**

1. 把大文本解析迁移 Web Worker。
2. 增加人名、电话、邮箱和账号脱敏预览。
3. 让用户选择是否启用服务器深度分析。
4. 建立 1 MB、3 MB、5 MB fixture。
5. 明确第三方内容授权提示。

**验收标准**

- 5 MB 文件不会冻结 UI。
- 原文不写入 localStorage。
- 摘要长度有硬上限。
- AI 关闭时仍可完成。

**验证**

```bash
npm run typecheck
npm run build
```

**报告格式**

同 4.1，增加 `File sizes`、`Main-thread blocking`、`PII findings`。

**回传摘要**

`LF-DATA-080 | status | max file | blocking time | PII cases`

### 4.8 AI Gateway Team

**任务 ID：LF-AI-080**
**优先级：P0**

**目标和原因**

稳定服务器 AI、控制成本、记录实际模型并保证本地降级。

**团队范围**

- 提供商适配。
- Prompt。
- Schema。
- 超时和重试。
- 模型执行元数据。
- 成本。

**拥有文件**

- `src/lib/ai/*`
- 三个公开 AI API 路由中的模型调用部分。

**接口**

- 所有调用通过 `src/lib/ai/client.ts`。
- 组件禁止直接调用供应商。
- 响应必须通过 zod schema。

**执行任务**

1. 建立 OpenAI 和 DeepSeek 合同测试。
2. 建立提示词版本回归集。
3. 记录 token、延迟和估算成本。
4. 明确可重试错误和不可重试错误。
5. 增加并发上限。

**验收标准**

- 密钥不出现在浏览器 bundle。
- 超时后回退本地。
- 每次输出记录 provider 和 model。
- 结构无效时不进入业务对象。
- OpenAI 请求保持 `store:false`。

**验证**

```bash
npm run typecheck
npm run build
npm audit --omit=dev
```

**报告格式**

同 4.1，增加 `Provider cases`、`P95 latency`、`Fallback rate`、`Cost estimate`。

**回传摘要**

`LF-AI-080 | status | providers | P95 | fallback | cost`

### 4.9 Safety, Privacy & Ethics Team

**任务 ID：LF-SAFE-080**
**优先级：P0**

**目标和原因**

建立公开服务的数据、危机、文化方法和输出边界。

**团队范围**

- 隐私字段。
- 同意。
- 危机响应。
- 分享白名单。
- 方法声明。
- 供应商数据政策。

**拥有文档和文件**

- `docs/ETHICAL_CHARTER.md`
- `docs/ANALYSIS_METHODS_AND_PROVENANCE.md`
- `src/lib/safety.ts`
- 安全提示和隐私文案。

**执行任务**

1. 列出每个 API 外发字段。
2. 复核微信第三方内容和出生信息同意。
3. 建立 40 条危机与边界测试。
4. 审核分享和导出字段。
5. 完成正式隐私政策和测试版条款。

**验收标准**

- 危机输入不继续人生模拟。
- 文化结果明确为传统文化视角。
- 分享不含原文和出生信息。
- 用户可以清除本地数据。
- 数据外发说明与代码一致。

**验证**

```bash
npm run content:audit
rg -n "API_KEY|SECRET|PASSWORD|ghp_|sk-" src docs README.md
```

**报告格式**

同 4.1，增加 `Data inventory`、`Consent checks`、`Crisis cases`、`Policy gaps`。

**回传摘要**

`LF-SAFE-080 | status | data gaps | crisis pass | policy blockers`

### 4.10 Ops Platform & Admin Team

**任务 ID：LF-OPS-080**
**优先级：P0**

**目标和原因**

提供可部署、可观察、可维护和可回滚的 Public Beta。

**团队范围**

- Sites / Cloudflare Worker。
- OpenNext 构建和版本产物。
- D1 运行配置。
- Docker。
- Runtime config。
- Admin auth。
- Health。
- Rate limit。
- Reverse proxy。
- Monitoring。

**拥有文件**

- `Dockerfile`
- `docker-compose.yml`
- `.openai/hosting.json`
- `open-next.config.ts`
- `wrangler.jsonc`
- `drizzle/*`
- `scripts/build-cloudflare.mjs`
- `scripts/prepare-sites-opennext.mjs`
- `src/app/admin/*`
- `src/app/api/admin/*`
- `src/lib/server/*`
- `docs/DEPLOYMENT_RUNBOOK.md`

**执行任务**

1. 使用精确 Git commit 构建、保存并部署 Sites 版本。
2. 验证 D1 schema、全局配置持久化和 `/admin` 刷新一致性。
3. 完成 Docker HTTPS 备选部署。
4. 配置真实会话密钥、管理凭据和 AI Secret。
5. 接入请求 ID、错误、延迟和内存指标。
6. 设置 AI 成本告警。
7. 演练维护和回滚。
8. 扩大流量前迁移共享限流。

**验收标准**

- `/api/health` 被平台持续检查。
- Cloudflare 构建产物不包含 `.env.local` Secret。
- Sites 保存版本、Git commit 和部署记录可以互相追溯。
- D1 与 Docker JSON 使用同一 `RuntimeConfig` schema。
- 容器内存上限生效。
- 管理配置持久化。
- 日志没有用户原文和密钥。
- 15 分钟内可回滚。

**验证**

```bash
npm run build:cloudflare
docker compose config
docker compose build
docker compose up -d
curl -fsS http://127.0.0.1:3005/api/health
docker stats --no-stream
```

**报告格式**

同 4.1，增加 `Environment`、`Health`、`Resource sample`、`Rollback time`。

**回传摘要**

`LF-OPS-080 | status | health | RSS | rollback | blockers`

### 4.11 QA & Release Team

**任务 ID：LF-QA-080**
**优先级：P0**

**目标和原因**

建立可重复的发布证据，阻止地图、状态恢复、安全和 AI 降级回归。

**团队范围**

- Unit。
- Component。
- E2E。
- Visual regression。
- Performance smoke。
- Release sign-off。

**拥有文件**

- `scripts/*`
- 后续 `tests/*`
- 发布检查报告。

**执行任务**

1. 增加 Playwright 核心流程。
2. 增加地图模型单元测试。
3. 增加 API 合同测试。
4. 增加移动端截图回归。
5. 建立生产依赖审计门禁。
6. 记录空闲与交互后内存。

**验收标准**

- 所有 P0 路径自动或人工通过。
- 无 console error。
- 无空白步骤。
- AI 失败可降级。
- 地图 containment fixture 全通过。
- 生产依赖漏洞为 0。

**验证**

```bash
npm run check
npm audit --omit=dev
npm run build
```

**报告格式**

同 4.1，增加 `Automated results`、`Manual paths`、`Visual diffs`、`Release decision`。

**回传摘要**

`LF-QA-080 | status | automated | manual | blockers | release decision`

## 5. Roadmap

### R0：发布候选稳定化

时间：当前至 1 周
目标：完成当前代码、文档、浏览器回归、Sites 部署、Docker 配置验证和 GitHub PR。

退出条件：

- 所有静态门禁通过。
- 生产依赖漏洞为 0。
- 核心流程和管理后台通过。
- 地图无 P0 结构错误。
- 有可执行部署手册。
- Sites 版本对应精确 Git commit，生产 URL 可完成核心流程。

### R1：受邀 Public Beta

时间：2 至 4 周
目标：20 至 100 名受邀用户。

重点：

- 可用性。
- AI 延迟和成本。
- 方法来源理解。
- 地图错误。
- 危机和隐私反馈。

退出条件：

- 完成率达到 70%。
- P0 安全事件为 0。
- AI P95 低于 30 秒。
- 地图阻塞率低于 3%。

### R2：开放 Public Beta

时间：1 至 2 个月
目标：可承受公开访问。

必须完成：

- Redis 限流。
- 正式隐私政策。
- 管理身份服务。
- E2E 和视觉回归。
- 成本仪表盘。
- 错误和告警。

### R3：账户与多设备

时间：2 至 4 个月
目标：选择性账号、加密同步和多版本 Self Skill。

必须单独评审：

- 数据库。
- 数据导出和删除。
- 加密。
- 账户恢复。
- 个人数据地域。

### R4：长期人生模型

时间：4 至 8 个月
目标：版本化语气、长期节点、行动实验和动态路径。

重点：

- 每阶段语气证据。
- 时间线版本差异。
- 用户行动反馈。
- 模型校准。
- 分支生成质量。

## 6. 发布会议输入

每个团队在发布会议前提交一行：

```text
Team | Requirement IDs | Release status | Evidence link | Open risk | Owner decision needed
```

任何 P0 阻塞未关闭时，版本保持 Release Candidate。
