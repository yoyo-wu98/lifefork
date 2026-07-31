# LifeFork / 人生岔路

> 整理当前问题，比较方案、依据、成本和下一步。

LifeFork 是一个面向活人的自我分析与人生方案模拟网页。用户通过五个问题、可选文本和微信记录摘要建立 `Self Skill`，随后查看个人报告、阶段时间线、人生方案地图和分支自我对话。

V0.8 面向公开测试：

- 所有人可直接访问，无需注册。
- 每个浏览器保存自己的个人分析，访客之间互不读取数据。
- AI 密钥仅保存在服务器。
- AI 失败或关闭后，完整流程会自动使用本地规则。
- 管理员通过受保护的 `/admin` 页面管理全局公告、维护状态和功能开关。
- 每条结论和人生分支显示分析方法、用户权重、参考度、依据、假设和限制。

当前部署：[LifeFork Public Beta](https://lifefork-public-beta.poremansovir.chatgpt.site)

## 当前能力

完整用户流程：

1. 回答五个核心问题。
2. 可选导入微信文本，在浏览器本地提取主题和情绪线索。
3. 可选补充日记、备忘录或聊天片段。
4. 选择分析方法、开关和权重。
5. 生成个人分析报告。
6. 查看并修改人生时间线。
7. 在人生方案地图中切换全人生、十年、阶段、一年、一月、一周、一天和一小时尺度。
8. 查看每条分支的收益、成本、状态变化、生成依据和未知因素。
9. 与该分支下的模拟版本对话，并持续校准说话方式。
10. 生成结果卡片或导出完整 `Self Skill` JSON。

分析方法：

- 用户提供的事实与原文
- 行为与决策模式
- 群体统计参考
- 服务器 AI 综合分析
- 各人生阶段的 MBTI 倾向
- 八字文化解读
- 紫微斗数文化解读，包含生肖与星座字段

默认使用“证据优先”。八字和紫微斗数需要用户主动启用并同意处理出生信息。文化方法保持低参考度，并独立标注为传统文化解读。

## 本地运行

要求：

- Node.js 22
- npm 10+

安装与开发：

```bash
npm install
npm run dev:3005
```

生产预览：

```bash
npm run build
npm run start:3005
```

打开 [http://localhost:3005](http://localhost:3005)。

不要同时运行多个开发或生产进程。地图验收优先使用生产预览，避免开发文件监听器占用额外内存。

## 环境变量

复制示例：

```bash
cp .env.example .env.local
```

公开测试至少配置：

```bash
LIFEFORK_AI_ENABLED=true
LIFEFORK_AI_PROVIDER=openai
LIFEFORK_SESSION_SECRET=<strong-random-secret>
LIFEFORK_ADMIN_PASSWORD=<strong-admin-password>
OPENAI_API_KEY=<server-only-key>
```

也可以选择 DeepSeek：

```bash
LIFEFORK_AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=<server-only-key>
```

支持的模型网关：

- OpenAI Responses API，默认 `store: false`
- DeepSeek Chat Completions

前端不会获得任何模型 API 密钥。服务端对生成、聊天、微信摘要和管理员登录分别限流。

## 管理后台

地址：

```text
/admin
```

需要服务端配置 `LIFEFORK_ADMIN_PASSWORD`。登录后可以管理：

- 正常开放或维护模式
- 服务器 AI 开关
- 微信记录导入开关
- 八字与紫微斗数开关
- 完整示例开关
- 公开测试版本标签
- 全站公告
- 隐私提示
- 新用户默认分析方案

本地与 Docker 配置写入：

```text
data/runtime-config.json
```

Docker 部署使用持久化卷 `/app/data`。Sites / Cloudflare 部署使用 D1 表 `lifefork_runtime_config`。两种运行目标使用同一套管理页面与 API。

## 数据边界

浏览器保存：

- `lifefork.selfSkill`
- `lifefork.currentStep`
- `lifefork.selectedFork`
- `lifefork.chatMessages`
- `lifefork.answers`
- `lifefork.extraText`
- `lifefork.selectedVersion`
- `lifefork.wechatAnalysis`
- `lifefork.analysisSettings`

微信原文只存在于导入页面的内存中。离开页面、刷新页面或选择不使用聊天记录后会清除原文；浏览器只保留用户确认加入的脱敏摘要。

服务器处理：

- 生成个人分析所需的五问、补充材料和脱敏微信摘要
- 分支对话上下文
- 用户明确同意后的出生信息规则排盘

微信原文在浏览器中有界处理，最多保留 600,000 个字符并分析前 8,000 行。服务器只收到用于个人分析的短摘要。出生字段只发送到 LifeFork 服务器执行规则排盘，不会转发给 AI 提供商。

用户可以在界面中清空浏览器数据。管理员配置与用户数据分开存储。

## 解释规则

LifeFork 对每条输出使用以下结构：

```text
结论
  -> 使用的方法
  -> 用户设置的权重
  -> 本次参考度
  -> 对应用户材料或技术来源
  -> 方法限制
  -> 用户可否修正
```

分支分数表示当前材料下的目标匹配程度，不能解释为成功率。MBTI 只描述特定人生阶段的偏好。八字、紫微斗数、生肖和星座属于文化解释内容。

## 生产部署

项目支持两种生产目标。

### Sites / Cloudflare

```bash
npm run build:cloudflare
```

该构建使用 OpenNext，将现有 Next.js App Router、Route Handlers 和管理后台转换为 Cloudflare Worker：

- D1 持久化全局运行配置
- 托管环境变量保存 AI key、会话密钥和管理密码
- 前端个人分析继续保存在各自浏览器
- `/api/health`、匿名会话、限流和本地降级继续生效

`.openai/hosting.json` 只保存项目标识和逻辑资源绑定，不保存运行密钥。

### 单实例 Docker

Docker Compose：

```bash
cp .env.example .env
# 填写生产密钥与密码
docker compose up -d --build
docker compose ps
```

默认映射到主机端口 `3005`。容器包含：

- 1 GB 内存上限
- Node 768 MB 堆上限
- 1.5 CPU 上限
- `/api/health` 健康检查
- `/app/data` 持久化配置卷
- `no-new-privileges` 安全选项

正式公网部署必须使用 HTTPS，并设置：

```bash
LIFEFORK_COOKIE_SECURE=true
```

完整步骤见 [部署运行手册](docs/DEPLOYMENT_RUNBOOK.md)。

## 质量检查

```bash
npm run check
npm run build
npm run qa:product -- --base-url=http://localhost:3005
npm run qa:ai:providers
npm run build:cloudflare
npm audit --omit=dev
```

`npm run check` 包含：

- TypeScript 类型检查
- ESLint
- 文案注册表审计
- 人生场景 fixture 校验

`qa:product` 会验证匿名会话隔离、安全 Cookie、管理后台登录、配置读取与保存、退出、同源保护、限流、输入校验和危机拦截。它需要先启动生产预览，并从 `.env.local` 读取测试环境的管理员密码。

配置好服务器 AI 并启动生产预览后，可以执行真实模型验收：

```bash
npm run qa:ai -- --require-live-ai
```

该命令会实际测试 Self Skill、阶段语气、顶层人生方案、微信摘要、方案对话、危机拦截、PII 脱敏、来源元数据和本地降级。`qa:ai:providers` 使用本地模拟服务验证 OpenAI Responses 协议，不消耗模型额度。完整结果和发布门槛见 [AI 核心功能验收与体验评估报告](docs/AI_CORE_ACCEPTANCE_REPORT.md)。

## 项目结构

```text
src/
  app/
    page.tsx
    admin/page.tsx
    api/
  components/
    AnalysisMethodStep.tsx
    SelfSkillPanel.tsx
    ForkPaths/
  lib/
    analysis/
    ai/
    selfSkill/
    server/
    stores/
```

关键边界：

- `src/lib/analysis/`：方法注册、权重、文化排盘和综合报告
- `src/lib/ai/`：模型网关、提示词、预算和请求校验
- `src/lib/server/`：匿名会话、限流、后台认证和全局配置
- `src/lib/selfSkill/`：本地分析、时间线、分支树和阶段性格
- `src/components/ForkPaths/`：稳定场景、相机、可见性、节点和连线

## 文档

- [公开测试产品需求与交互规范](docs/PUBLIC_BETA_PRODUCT_SPEC.md)
- [AI 核心功能验收与体验评估报告](docs/AI_CORE_ACCEPTANCE_REPORT.md)
- [端到端用户体验与发布验收报告](docs/END_TO_END_USER_AUDIT_2026-07-31.md)
- [分析方法、权重与来源规范](docs/ANALYSIS_METHODS_AND_PROVENANCE.md)
- [V0.8 技术审计与重构报告](docs/PUBLIC_BETA_TECHNICAL_REPORT.md)
- [人生地图交互规范](docs/LIFE_MAP_INTERACTION_SPEC.md)
- [部署运行手册](docs/DEPLOYMENT_RUNBOOK.md)
- [内部开发管理与团队拆分](docs/INTERNAL_DEVELOPMENT_MANAGEMENT.md)
- [Public Beta 团队执行计划](docs/PUBLIC_BETA_TEAM_EXECUTION_PLAN.md)
- [项目技术参考](PROJECT_DOCS.md)
- [伦理章程](docs/ETHICAL_CHARTER.md)

## 重要限制

- 当前公开测试采用匿名浏览器隔离，没有跨设备账号同步。
- 服务器限流使用单进程内存；多实例部署需要 Redis 或网关限流。
- 群体统计模块当前只提供研究基准，尚未接入行业、地区和年龄分层数据库。
- AI 生成内容可能出现错误，需要用户核对。
- LifeFork 不提供医疗、心理诊断、法律或财务结论。

## License

当前仓库未声明开源许可证。未经版权所有者明确授权，默认保留全部权利。
