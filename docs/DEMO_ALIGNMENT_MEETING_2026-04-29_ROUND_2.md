# LifeFork Demo Alignment Meeting Round 2 — 2026-04-29

> Meeting owner: Product & Research Team
> Scope: 复测当前效果，吸收其他团队最新 brief，重新分发 V0.5 可用性工作。
> Method: `npm` 静态检查 + production build + restarted `localhost:3005` + Codex Desktop browser-use visual verification.

## 1. Evidence Collected

### 1.1 Command Checks

通过：

- `npm run qa:scenarios`
- `npm run content:audit`
- `npm run lint`
- `npm run build`

关键输出：

- Scenario fixture validation passed.
- Rendered app nodes: 38.
- Rendered fork nodes: 33.
- Choice sets: 7.
- Content registry audit passed.
- Browser console errors: 0 for normal map path and demo fixture path.

### 1.2 Latest Team Briefs Read

已读取：

- `docs/SCENARIO_FIXTURE_BRIEF.md`
- `src/lib/scenarios/types.ts`
- `scripts/validate-scenarios.cjs`
- `src/lib/content/types.ts`
- `src/lib/content/copyRegistry.ts`
- `scripts/audit-content-registry.mjs`

结论：

- Scenario Lab 已经交付完整人生 fixture 的类型、样本、代表路径和静态校验。
- Content Systems 已经交付 registry 类型、关键 copy entry、prompt output policy 和 audit 脚本。
- 两个新增团队都已经从“需要组建”推进到“有可验收资产”。

## 2. Product Effect Recheck

### 2.1 Normal Life Map

当前效果：

- 默认全人生视角能同时看到“现在”和四条主线。
- 页面没有横向撑爆。
- Semantic Zoom 控制更简洁。
- 点击“稳定延续线”后，当前读取变成“走稳定线的你”。
- `3 年后` 和 `10 年后` 出现在稳定线容器内。
- 点击 `3 年后` 后，当前读取变成“3 年后稳定线上的你”。
- 当前读取路线包含“稳定延续线”和“3 年后”。

判断：

- 普通地图主流程已从 Red 进入 Yellow/Green 边界。
- 核心逻辑理解已经明显改善，可以作为内部演示路径。

仍有问题：

- 选择稳定线后，其他主线残影仍可见，容易干扰“我正在看稳定线内部”的理解。
- 背景节点的透明度和点击屏蔽需要进一步收敛。

### 2.2 Full-Life Demo Fixture

当前效果：

- 导航中的“演示样本”按钮可加载完整人生 fixture。
- 加载后节点数为 38，符合 visible node budget。
- DOM 中能看到晚年、86 岁、最后一段可分享的话等代表路径内容。
- Toast 显示“演示样本已加载”。
- Browser console error 为 0。

阻塞问题：

- 完整人生样本加载后，默认镜头把关键节点推到左侧，卡片被裁切。
- 点击“重置镜头”后仍然裁切。
- 这说明是 full-life fixture 与 Life Map camera/fit rule 的集成问题，不是临时 pan offset。

判断：

- Scenario data layer 可进入 Review。
- Full-life demo visual integration 仍是 P0 Blocked。
- 目前不能把“演示样本”作为对外演示首屏入口。

### 2.3 Content Systems

当前效果：

- `content:audit` 已通过。
- `CopyEntry` 包含 `surface`、`intent`、`tone`、`riskLevel`、`owner`、`version`。
- Share card 和 Life Map narrative 已有 registry 入口。

判断：

- Content Systems 已从组织空缺变成有基础资产。
- 下一步重点是补“主流程所有文案 owner map”和“Top 20 copy fixes”。

## 3. Updated Status

| Workstream | Previous status | Round 2 status | Decision |
| --- | --- | --- | --- |
| LF-MAP-002 Semantic containment | Ready | Review | 普通稳定线可读性通过，仍需降低非当前分支干扰 |
| LF-MAP-003 Viewport and camera containment | Ready | In Progress | 普通地图改善，full-life fixture camera 仍阻塞 |
| LF-SKILL-002 Time containment contract | Ready | Review | 数据模型已支持 fixture 校验，需补正式 schema brief |
| LF-COPY-001 Copy registry | Ready | Review | audit 通过，需补 owner map 和 copy fix list |
| LF-SCENARIO-001 Full-life fixture | Ready | Review / Blocked by map | fixture 静态校验通过，视觉集成被 Life Map 阻塞 |
| LF-MBTI-001 Dynamic MBTI | Draft | Draft | 未进入本轮实现，保持 schema planning |
| LF-ONBOARD-001 Entry simplification | Ready | Review | 演示样本按钮可用，但加载后默认镜头不合格 |

## 4. New Work Distribution

### 4.1 Life Map / Visualization Team

Priority: P0
Requirement IDs: `LF-MAP-002`, `LF-MAP-003`

Immediate tasks:

1. Fix full-life fixture camera fit:
   - Loading `fullLifeDemoSelfSkill` must show the root container and representative path entry area without left clipping.
   - `Reset camera` must return to the same readable state.
2. Suppress non-active branch interference:
   - When stable branch is selected, unrelated life branches should fade below demo-visible threshold or become hidden.
   - Hidden/faded branches must not intercept clicks.
3. Add a fixture-specific camera acceptance case:
   - `complete-life-root` with 38 nodes.
   - Late-life branch visible through route, not through accidental crop.

Required evidence:

- Screenshot after loading demo sample.
- Screenshot after reset camera.
- Screenshot after selecting stable branch.
- Console error count.

### 4.2 Scenario Lab Team

Priority: P0
Requirement ID: `LF-SCENARIO-001`

Status:

- Static fixture validation is accepted for Review.
- Visual integration is blocked by Life Map camera.

Immediate tasks:

1. Keep `renderedNodeCount` under 120.
2. Provide expected first viewport composition for the fixture:
   - Which card must be centered.
   - Which child nodes must be visible.
   - Which representative path nodes are allowed to be offscreen.
3. Add fixture visual notes to `docs/SCENARIO_FIXTURE_BRIEF.md`.

Required evidence:

- Updated brief with expected camera behavior.
- `npm run qa:scenarios` remains passing.

### 4.3 Content Systems / Narrative Architecture Team

Priority: P0
Requirement ID: `LF-COPY-001`

Status:

- Registry and audit are working.

Immediate tasks:

1. Produce copy owner map for the main flow.
2. Produce Top 20 copy fixes:
   - Current text.
   - Replacement text.
   - Surface.
   - Intent.
   - Risk level.
3. Review full-life fixture copy:
   - Especially death / illness / last message nodes.
   - Avoid over-fatalistic or over-therapeutic wording.

Required evidence:

- `npm run content:audit` remains passing.
- Copy owner map attached to command center or a dedicated brief.

### 4.4 QA / Release / DevOps Team

Priority: P0
Requirement IDs: `LF-QA-001`, `LF-OPS-001`

Immediate tasks:

1. Add these commands to every V0.5 acceptance pass:
   - `npm run qa:scenarios`
   - `npm run content:audit`
   - `npm run lint`
   - `npm run build`
2. Add browser-use manual check:
   - Normal map default view.
   - Stable line selected.
   - 3-year checkpoint selected.
   - Demo sample loaded.
   - Demo sample reset camera.
3. Record screenshots for each check.

Required evidence:

- Command output.
- Browser screenshots.
- Console error count.

### 4.5 Product & Research Team

Priority: P0

Immediate decisions:

1. Mark normal map path as internal-demo ready after Life Map removes branch interference.
2. Keep demo sample as internal QA asset until Life Map fixes camera fit.
3. Keep `演示样本` nav button, but do not use it as first public demo path yet.
4. Keep dynamic MBTI in planning only.

## 5. Meeting Decisions

1. V0.5 demo status remains Yellow, not Green.
2. Normal Life Map is close to acceptable.
3. Full-life demo fixture data is valid, but visual integration blocks external demo use.
4. Content Systems and Scenario Lab are now active teams with verifiable outputs.
5. Next acceptance gate is not more docs. It is screenshots proving:
   - stable line containment without unrelated branch noise;
   - full-life fixture default camera without clipping;
   - reset camera restores readable fixture view.

## 6. Next Checkpoint

Next alignment check should ask each team for:

```markdown
Team:
Requirement ID:
Status:
Evidence:
Screenshot or command output:
Remaining blocker:
Decision requested:
```

Meeting owner will accept only evidence-backed status changes.

## 7. Addendum: User-Marked Line Break Regression

Source: browser diff comment on `http://127.0.0.1:3005/`

Selected target:

- `底图 · 全人生 · 试验线：用可逆实验慢慢改写人生 · 子节点 2`
- Viewport: 932x999
- Marker position: approximately `(313, 277)`
- State: `十年` scale, `第 1 周：你只做最小可见动作` selected

Finding:

- The visible route from the left parent area toward `90 天` and then toward `第 1 周` is not continuous.
- The break appears near the map viewport boundary / card edge area, so this must be investigated as a coordinate-system and clipping problem, not only drawing polish.
- This is promoted to P0 because a disconnected line undermines the core demo promise that the life map is readable as a causal and semantic structure.

Assigned action:

- Life Map Team owns the fix under `LF-MAP-002` and `LF-MAP-003`.
- QA Team must add this exact browser state to screenshot regression.
- Product & Research Team should block public demo approval until this case passes.

Acceptance:

- In `十年` scale, selecting `第 1 周` must show an unbroken route from the current parent branch through `90 天` into `第 1 周`.
- The route must remain continuous after reset camera.
- The same state must pass at 932px, 1280px, and 1440px wide viewports.
