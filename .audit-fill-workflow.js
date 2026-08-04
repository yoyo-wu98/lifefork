export const meta = {
  name: 'lifefork-ux-audit-fill',
  description: 'Re-run the 7 LifeFork UX audit surfaces that were interrupted (map/report/persistence/mobile/copy/fallback/admin)',
  phases: [
    { title: 'Audit', detail: '7 parallel surface audits' },
  ],
}

const FINDINGS_SCHEMA = {
  type: 'object',
  required: ['surface', 'findings'],
  properties: {
    surface: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['title', 'severity', 'file', 'detail', 'fix'],
        properties: {
          title: { type: 'string', description: 'short label of the UX problem' },
          severity: { type: 'string', enum: ['blocker', 'major', 'minor', 'polish'] },
          file: { type: 'string', description: 'repo-relative file path, with :line when known' },
          detail: { type: 'string', description: 'what a real user experiences, concretely' },
          fix: { type: 'string', description: 'concrete code-level fix proposal' },
        },
      },
    },
    strengths: { type: 'array', items: { type: 'string' } },
  },
}

const COMMON = `你在审计 /Users/yoyow/Downloads/lifefork 这个项目（LifeFork，中文人生树状图/人生方案模拟网页，Next.js 16 + React 19 + zustand + tailwind）。这是要作为公开网页分发给普通用户使用的产品。你的任务是从真实用户视角找出交互体验问题，不是找代码风格问题。真实用户 = 不懂技术的中文用户，用手机或笔记本浏览器打开，想把人生决策输入进去看可视化的分支树。
要求：
- 必须实际 Read 相关源码文件（读完整文件，不要只 grep），逐行推演用户操作时会发生什么。
- 每个 finding 要具体到文件和行为：用户做了什么 → 看到什么 → 为什么糟糕 → 怎么改。
- 严重级别：blocker=用户会卡死/数据丢失/看不懂无法继续；major=明显挫败或误导；minor=可感知的粗糙；polish=细节打磨。
- 也报告做得好的地方（strengths），避免修改时破坏。
- 不要泛泛而谈"建议增加测试"之类，只报告具体可修的体验问题。
- 读完文件、想清楚之后，尽快调用 StructuredOutput 工具返回结果，不要无限深挖。
返回结构化 JSON。`

phase('Audit')

const SURFACES = [
  {
    key: 'lifemap',
    prompt: `${COMMON}
审计面：人生方案地图（核心可视化，产品灵魂）。
读这些文件：src/components/ForkPaths/index.tsx, LifeMapCanvas.tsx, LifeMapNode.tsx, LifeMapLinks.tsx, ScaleSidebar.tsx, NodeDetailPanel.tsx, CurrentRouteBar.tsx, StateBar.tsx, constants.ts, utils.ts, model/camera.ts, model/stableScene.ts, model/visibility.ts, model/normalizeForkTree.ts。
重点检查：首次进入地图时用户是否知道能拖拽/缩放/点击/双击（有无操作引导）；缩放和平移手感（滚轮方向、触摸板、手机双指、惯性、边界回弹）；节点文字在各尺度是否可读、是否重叠；点击节点后详情面板的信息层级；当前位置感（我在哪、怎么回去）；焦点模式循环是否可发现；尺度切换（全人生↔小时）是否晕；移动端小屏地图可用性；色彩语义（分支状态色）是否自明；空状态和节点很少时的观感。`,
  },
  {
    key: 'report',
    prompt: `${COMMON}
审计面：个人报告（SelfSkillPanel）、时间线（TimelineView）、结果卡片（ShareCard）。
读这些文件：src/components/SelfSkillPanel.tsx, src/components/TimelineView.tsx, src/components/ShareCard.tsx, src/lib/content/shareCardTemplates.ts, src/components/BadgeToast.tsx。
重点检查：报告的第一屏是否给出"值得截图"的核心结论；证据链展示是否可展开可追溯但默认不淹没；时间线编辑的交互（增删改节点、日期校验、保存反馈）；分享卡片美观度和导出格式（图片还是文本？能否直接发朋友圈）；导出 JSON 对普通用户的意义和引导；这些页面之间的导航连贯性。`,
  },
  {
    key: 'persistence',
    prompt: `${COMMON}
审计面：数据持久化与状态恢复。
读这些文件：src/lib/storage.ts, src/lib/stores/lifeforkStore.ts, src/lib/stores/slices/ 下所有 slice, src/lib/schema/migrations.ts, src/lib/schema/validateSelfSkill.ts, src/lib/schema/repairForkTree.ts。
重点检查：localStorage 写入时机和防抖（会不会丢最后一次输入）；配额超限（QuotaExceededError）时用户看到什么；隐私模式/Safari ITP 下的行为；多标签页同时打开的冲突；数据结构升级迁移是否安全；清空数据的确认与不可逆提示；导入他人 JSON 的校验与错误提示。`,
  },
  {
    key: 'mobile-a11y',
    prompt: `${COMMON}
审计面：移动端适配、无障碍、视觉系统。
读这些文件：src/app/globals.css, tailwind.config.ts, src/app/layout.tsx, src/components/AppNav.tsx, 并抽查 Landing.tsx、QuestionFlow.tsx、ForkPaths/index.tsx、InstanceChat.tsx 中的响应式 className 和触摸事件处理。
重点检查：390px 视口下每个主要页面的布局（有没有横向溢出、按钮太小、文字太挤）；触摸目标尺寸 44px；键盘弹出时输入框是否被遮挡；深色/浅色模式；字体加载与中文字体栈；focus-visible 键盘导航；对比度；prefers-reduced-motion；safe-area-inset（刘海屏）；页面标题和 meta（分享到微信时的预览）。`,
  },
  {
    key: 'copy',
    prompt: `${COMMON}
审计面：全站文案与内容质量。
读这些文件：src/lib/content/copyRegistry.ts, src/lib/copy.ts, src/lib/content/lifeMapNarratives.ts, src/lib/safety.ts, 抽查组件中的硬编码文案。
重点检查：文案语气是否一致（是"工具感"还是"陪伴感"）；术语是否统一（Self Skill / 自我画像 / 个人分析 混用？）；英文术语对中文用户的负担；错误提示是否说人话并给出下一步；危机干预文案是否温和专业且给出真实求助渠道（中国大陆的热线）；免责声明的位置和语气；八字/紫微文案是否恰当标注为文化解读而非预测。`,
  },
  {
    key: 'fallback',
    prompt: `${COMMON}
审计面：本地降级模式质量（AI 关闭/失败时的完整体验）。
读这些文件：src/lib/selfSkill/localGenerator.ts, src/lib/selfSkill/profileRules.ts, archetypeRules.ts, forkTreeRules.ts, timelineRules.ts, src/lib/selfSkillEngine.ts, src/lib/wechatEngine.ts, src/lib/analysis/integratedAnalysis.ts。
重点检查：本地生成的报告读起来是否像模板套话（用户第一反应"这就是算命App糊弄我"）；本地分支方案与用户输入的关联度；降级发生时用户是否被清楚告知且能重试 AI；本地对话回复的质量下限；规则生成的内容会不会出现自相矛盾或不通顺的拼接句。`,
  },
  {
    key: 'admin-ops',
    prompt: `${COMMON}
审计面：管理端与运维分发。
读这些文件：src/app/admin/page.tsx, src/app/api/admin/config/route.ts, src/app/api/admin/session/route.ts, src/lib/server/adminAuth.ts, src/lib/server/runtimeConfigStore.ts, scripts/start-standalone.mjs, Dockerfile, docker-compose.yml, docs/DEPLOYMENT_RUNBOOK.md。
重点检查：站长（部署者）从拿到代码到上线的路径是否顺畅；admin 页面表单体验（保存反馈、危险操作确认、并发编辑覆盖）；runtime-config 持久化在容器重启后是否保留；公告发布后用户端多久生效；健康检查端点信息量；日志里会不会泄漏用户输入或密钥。`,
  },
]

const results = await parallel(SURFACES.map(s => () =>
  agent(s.prompt, { label: `audit:${s.key}`, phase: 'Audit', schema: FINDINGS_SCHEMA })
))

return { audits: results.filter(Boolean) }
