# Life Scenario Lab Fixture Brief

Owner: Life Scenario Lab Team
Status: Ready for V0.5 integration review
Fixture: `src/lib/scenarios/fullLifeDemoFixture.ts`
Types: `src/lib/scenarios/types.ts`

## 1. Scope Review

Life Scenario Lab 的 V0.5 职责已经进入团队任务单，但此前代码层缺少可复用测试资产。本次补齐的范围是：

- 建立 scenario fixture 类型契约。
- 提供一个从出生到死亡的完整人生 demo fixture。
- 用 choice set 表达每年、每月两个以上分岔，避免把指数级路径一次性铺到 Life Map。
- 为 Life Map、Self Skill、QA 提供稳定的代表路径、边界案例和验收数据。

现有代码基础可复用：

- `SelfSkill.forks` 已能驱动 Life Map。
- `ForkPath.scale`、`timeSpan.range`、`mapRole` 已支持语义缩放和父子时间包含。
- 选择任意 `ForkPath` 后可以进入对话。
- 分享卡依赖 `SelfSkill` 与当前选中节点，fixture 已提供可进入分享的代表节点。

当前缺口：

- lazy choice option 已能从详情面板进入临时对话节点，尚未持久化写回地图树。
- QA 截图自动化尚未覆盖完整代表路径。

## 2. Module Plan

### 2.1 Scenario Types

File: `src/lib/scenarios/types.ts`

职责：

- 定义 `FullLifeScenarioFixture`。
- 定义 `ScenarioChoiceSet` 和至少两个选项的 tuple 约束。
- 定义代表路径、边界案例、可进入模式和 QA 验收数据。

关键设计：

- `ScenarioChoiceEntry` 支持 `rendered-node` 与 `lazy-node`。
- `lazy-node` 记录 template id、scale、lane、title、summary，供后续 UI materializer 使用。
- `ScenarioQaAcceptance` 把 visible node budget、scale coverage、entry modes 固化为可检查数据。

### 2.2 Full-Life Demo Fixture

File: `src/lib/scenarios/fullLifeDemoFixture.ts`

职责：

- 导出 `fullLifeDemoSelfSkill`。
- 导出 `fullLifeDemoForks`。
- 导出 `fullLifeDemoChoiceSets`。
- 导出 `fullLifeRepresentativePath`。
- 导出 `fullLifeDemoBoundaryCases`。
- 导出 `validateFullLifeDemoFixture()`。

代表路径：

1. 出生。
2. 童年十年。
3. 7 岁公开表达。
4. 上台前 1 小时。
5. 18 岁离开城市。
6. 24 岁独居房间试验。
7. 36 岁照护复盘周。
8. 53 岁经验传递。
9. 86 岁最后一段可分享的话。

### 2.3 QA Usage

QA 可运行最小静态检查：

```bash
npm run qa:scenarios
```

底层检查入口：

```ts
import { validateFullLifeDemoFixture } from "@/lib/scenarios/fullLifeDemoFixture";

const result = validateFullLifeDemoFixture();
if (!result.valid) throw new Error(result.failures.join("\n"));
```

UI 接入：

- 首页“查看示例体验”和导航“演示样本”会加载 `fullLifeDemoSelfSkill`。
- 加载后默认进入 Life Map，并聚焦完整人生样本根节点。
- 依次选择代表路径节点。
- 对 `demo-hour-before-presentation` 和 `demo-hour-last-message` 进入 chat。
- 在 `demo-month-first-apartment`、`demo-month-age-53-mentor`、`demo-hour-last-message` 验证 share。

## 3. Acceptance Matrix

| Acceptance | Current fixture data |
| --- | --- |
| 完整人生 demo fixture 可跑通 | `fullLifeDemoSelfSkill` + `fullLifeRepresentativePath` |
| 每个尺度至少一个可进入节点 | `qaAcceptance.scaleCoverage` 覆盖 life/decade/era/year/month/week/day/hour |
| 任意 choice set 至少 2 个选项 | `ScenarioChoiceSet.options` 类型约束 + `validateFullLifeDemoFixture()` |
| 可见节点控制在 120 个以内 | `renderedNodeCount` 小于 `visibleNodeBudget` |
| 代表路径可从出生回放到死亡 | 代表路径从 `lifefork-history-birth` 到 `demo-hour-last-message` |
| 能进入对话和分享 | 代表路径声明 `chat`、`share` entry modes |

## 4. Boundary Cases

- `boundary-choice-set-minimum-options`：任何 choice set 少于 2 个选项都应失败。
- `boundary-visible-node-budget`：高频年/月选择保持 lazy，不扩张可见节点。
- `boundary-death-node-chat-share`：死亡终点仍然要能进入对话和分享。
- `boundary-all-scale-coverage`：所有 LifeScale 都要有测试节点。

## 5. Next Development Steps

1. QA Team 把 `npm run qa:scenarios` 加入 V0.5 回归。
2. Life Map Team 将 lazy choice option 持久化写回当前地图树。
3. QA Team 增加代表路径浏览器截图脚本。
4. Content Systems Team 复核所有节点文案的 owner、tone、intent。
5. QA Team 使用浏览器截图验收 375px、768px、1440px 三档视口。

## 6. Round 2 Integration Note — 2026-04-29

Browser-use 复测结论：

- `npm run qa:scenarios` 通过，fixture 数据层进入 Review。
- 导航里的 `演示样本` 按钮可以加载 `fullLifeDemoSelfSkill`。
- 加载后 DOM 中可见 38 个节点和 86 岁晚年代表路径内容。
- 当前阻塞在 Life Map camera/fit：默认镜头和重置镜头都会裁切左侧关键卡片。

Scenario Lab 下一步补充：

- 明确 full-life fixture 首屏期望构图。
- 标注加载后必须可见的节点。
- 标注允许离屏的代表路径节点。
- 给 Life Map Team 提供 fixture camera acceptance notes。

## 7. Round 3 Hierarchy Note — 2026-04-29

新增阻塞：

- Life Map 当前问题已升级为 cross-scale time hierarchy failure。
- Scenario fixture 不能只证明节点数量和选择数量正确，还必须证明每个代表节点的父容器正确。

Scenario Lab 下一步补充：

- 为代表路径补充 expected hierarchy，例如 `现在 -> 试验线 -> 90 天 -> 第 1 周`。
- 为每个尺度标注 allowed visible nodes：
  - `全人生`: life containers and major branches.
  - `十年`: decade / era checkpoints.
  - `阶段`: active phase container and direct child nodes.
  - `一周` / `一天` / `一小时`: local parent container and direct children.
- 标注 illegal visual states，例如 `10 年后` 不能作为 `90 天` 容器内 child 出现。
- 把 hierarchy expectations 提供给 QA，用于 browser-use 截图验收。

## 8. Life Scenario Lab 5.5 Evidence — 2026-04-30

### 8.1 Canonical Demo Persona

Canonical persona: `林安` (`persona-lin-an`)

Premise:

- 从敏感表达者成长为可传递经验的创作者。
- 人生主线长期在表达、亲密关系和现实责任之间校准。
- 年龄范围：出生到 86 岁。

Core values:

- 表达。
- 关系真实。
- 可承载的自由。
- 经验传递。

Core pressures:

- 安全感。
- 离家距离。
- 照护责任。
- 身体和衰老。
- 作品是否能被别人使用。

Demo boundaries:

- 演示样本不能包装成用户命运预测。
- 死亡节点要克制呈现。
- 照护责任不能归咎给单个用户。
- 高频年/月分岔通过 choice set 表达。

Source: `fullLifeDemoPersona`

### 8.2 Life Stages

| Stage | Fixture node |
| --- | --- |
| Birth | `lifefork-history-birth` |
| Early childhood | `demo-decade-childhood` |
| Adolescence | `demo-decade-adolescence` |
| University or early adult stage | `demo-age-18-leave-city` |
| First career identity | `demo-era-age-23-27` |
| Relationship pressure | `demo-era-age-34-38` |
| Major fork | `demo-year-age-18` |
| Stabilization or leap | `demo-age-18-leave-city`, `demo-age-18-stay-close` |
| Illness or aging | `demo-decade-final` |
| Late-life reflection | `demo-year-age-86` |
| Death | `demo-hour-last-message` |

Source: `fullLifeDemoStages`

### 8.3 Choice Sets

Every year:

- `choice-yearly-default`
- Cadence: yearly.
- Coverage: age 7 through age 86.
- Minimum options per period: 2.
- Options: `choice-yearly-keep-structure`, `choice-yearly-test-direction`.

Every month in focused demo window:

- `choice-monthly-default`
- Cadence: monthly.
- Coverage: age 18 through age 70.
- Minimum options per period: 2.
- Options: `choice-monthly-recover`, `choice-monthly-commit`.

Selectable authored choice sets:

| Choice set | Source node | Options |
| --- | --- | --- |
| `choice-age-18-city` | `demo-year-age-18` | `choice-age-18-leave-city`, `choice-age-18-stay-close` |
| `choice-age-24-work-creation` | `demo-year-age-24` | `choice-age-24-room`, `choice-age-24-public-portfolio` |
| `choice-age-36-care-boundary` | `demo-year-age-36` | `choice-age-36-shared-calendar`, `choice-age-36-boundary-talk` |
| `choice-age-53-transfer` | `demo-year-age-53` | `choice-age-53-mentor`, `choice-age-53-open-method` |
| `choice-age-86-legacy` | `demo-year-age-86` | `choice-age-86-recording`, `choice-age-86-quiet-archive` |

Source: `fullLifeDemoChoiceSets`

### 8.4 Replay Branches

| Branch | Purpose | Key path |
| --- | --- | --- |
| `representative-complete` | Birth-to-death complete path | `lifefork-history-birth` -> `demo-hour-last-message` |
| `stable` | Relationship continuity and structure | `demo-age-18-stay-close` -> `demo-month-care-season` -> `demo-hour-last-message` |
| `leap` | New city and identity leap | `demo-age-18-leave-city` -> `demo-year-age-24` -> `demo-hour-last-message` |
| `experiment` | Reversible experiment path | `demo-hour-before-presentation` -> `demo-month-first-apartment` -> `demo-month-age-53-mentor` |
| `relationship` | Relationship pressure and care boundary | `demo-era-age-34-38` -> `demo-week-care-review` -> `demo-hour-last-message` |

Source: `fullLifeDemoReplayBranches`

### 8.5 Visible Node Budget

Budget:

- Max visible app nodes: 120.
- Current rendered app nodes: 38.
- Current rendered fixture fork nodes: 33.
- Current choice sets: 7.

Check:

```bash
npm run qa:scenarios
```

### 8.6 QA Checklist for Selectable Choice Sets

Source: `fullLifeChoiceSetQaChecklist`

Required checks:

- Every checklist item maps to an existing choice set.
- Every checklist item names at least two selectable options.
- Every named option exists in its choice set.
- Rendered-node options open their target nodes.
- Lazy-node options open a temporary chat-capable node.
- Yearly and monthly recurrent choices do not increase the default rendered node count.
- The representative complete path starts at birth and ends at `demo-hour-last-message`.
