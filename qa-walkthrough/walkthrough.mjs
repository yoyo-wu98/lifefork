// LifeFork 端到端用户视角走查（桌面）
// 目的：以新用户身份完整体验 V0.8，记录耗时、文案、交互问题、截图证据。
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://127.0.0.1:3005";
const OUT = path.resolve(process.cwd(), "screenshots");
fs.mkdirSync(OUT, { recursive: true });

const log = [];
const note = (msg) => {
  const line = `[${new Date().toISOString().slice(11, 19)}] ${msg}`;
  log.push(line);
  console.log(line);
};
const shot = async (page, name) => {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false });
  note(`截图 ${name}.png`);
};

const ANSWERS = {
  currentChoice:
    "是否辞去现在的稳定工作，认真做自己的内容项目。我担心收入中断，也担心十年后还是没有真正开始。",
  recurringEmotion: "焦虑、不甘心、害怕失败。通常出现在深夜和周日的晚上。",
  pastNode: "毕业那年因为收入顾虑放弃了想做的内容方向，选择了一份稳定但不喜欢的工作。",
  hiddenSelf: "我其实很想被看见，也害怕长期普通。我很少告诉别人这件事。",
  futureSentence: "真正开始做内容，并建立稳定的内容收入，不再只靠工资。",
};

const run = async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "zh-CN" });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));

  // ── 1. 首页 ─────────────────────────────────────────────
  let t0 = Date.now();
  await page.goto(BASE, { waitUntil: "networkidle" });
  note(`首页加载 ${Date.now() - t0}ms`);
  await shot(page, "01-landing-desktop");
  const h1 = await page.locator("h1").first().textContent();
  note(`首页 H1: ${h1}`);
  // 检查是否有横向滚动
  const hasHScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  note(`首页横向溢出: ${hasHScroll}`);

  // ── 2. 开始分析 → 五问 ──────────────────────────────────
  await page.getByRole("button", { name: "开始分析" }).click();
  await page.waitForSelector('[data-testid="question-currentChoice"]');
  await shot(page, "02-question-1");

  // 中途刷新恢复测试：先答两问，刷新，看是否恢复
  await page.fill('[data-testid="question-currentChoice"]', ANSWERS.currentChoice);
  await page.getByRole("button", { name: "保存并继续" }).click();
  await page.fill('[data-testid="question-recurringEmotion"]', ANSWERS.recurringEmotion);
  await page.reload({ waitUntil: "networkidle" });
  const restored = await page.locator("textarea").inputValue();
  const restoredId = await page.locator("textarea").getAttribute("data-testid");
  note(`刷新后当前文本域: ${restoredId}，内容长度: ${restored.length}（预期恢复到第一个未答问题）`);
  // 恢复后逐题补齐：只填写当前渲染的题目
  for (let i = 0; i < 8; i++) {
    const ta = page.locator("textarea[data-testid^='question-']");
    if (!(await ta.count())) break;
    const testId = await ta.getAttribute("data-testid");
    const key = testId.replace("question-", "");
    const val = await ta.inputValue();
    if (!val.trim() && ANSWERS[key]) await ta.fill(ANSWERS[key]);
    const nextBtn = page.getByRole("button", { name: /保存并继续|下一步：补充分析材料|检查未回答的问题/ });
    await nextBtn.click();
    await page.waitForTimeout(350);
  }
  await shot(page, "03-questions-done");

  // ── 3. 微信导入（跳过）─────────────────────────────────
  const skipWechat = page.getByRole("button", { name: "跳过微信导入" });
  if (await skipWechat.count()) {
    await shot(page, "04-wechat-step");
    await skipWechat.click();
  }

  // ── 4. 补充材料 ─────────────────────────────────────────
  const extraTa = page.locator("textarea").first();
  await extraTa.fill(
    "当前工作尚可，但创作和表达长期没有得到使用。我希望能先设计一个验证计划，而不是直接离职。"
  );
  await shot(page, "05-extra-text");
  await page.getByRole("button", { name: "下一步：选择分析方法" }).click();

  // ── 5. 分析方法 ─────────────────────────────────────────
  await page.waitForSelector("text=选择这次分析使用哪些方法");
  await shot(page, "06-methods");
  const genBtn = page.getByRole("button", { name: "生成完整分析" });
  const genDisabled = await genBtn.isDisabled();
  note(`生成按钮初始禁用: ${genDisabled}`);
  // 向下滚动查看完整设置区
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await shot(page, "07-methods-bottom");

  // ── 6. 生成（真实 AI）──────────────────────────────────
  t0 = Date.now();
  await genBtn.click();
  await shot(page, "08-generating");
  // 等待 SelfSkill 面板出现
  await page.waitForSelector("text=Self Skill", { timeout: 90000 }).catch(() => note("⚠ 等待 SelfSkill 超时"));
  await page.waitForTimeout(1500);
  const genMs = Date.now() - t0;
  note(`生成耗时: ${genMs}ms`);
  await shot(page, "09-self-skill-top");

  // 滚动浏览 SelfSkill 面板
  await page.evaluate(() => window.scrollTo(0, 1200));
  await shot(page, "10-self-skill-mid");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await shot(page, "11-self-skill-bottom");

  // ── 7. 时间线 ───────────────────────────────────────────
  const timelineBtn = page.getByRole("button", { name: "查看时间线" });
  if (await timelineBtn.count()) {
    await timelineBtn.click();
  } else {
    await page.getByRole("button", { name: /时间线/ }).first().click();
  }
  await page.waitForTimeout(600);
  await shot(page, "12-timeline");
  const contBtn = page.getByRole("button", { name: "继续查看方案地图" });
  if (await contBtn.count()) await contBtn.click();
  await page.waitForTimeout(1200);

  // ── 8. 人生地图 ─────────────────────────────────────────
  await shot(page, "13-map-overview");
  // 地图上的按钮/控件盘点
  const mapButtons = await page.locator("main button").allTextContents();
  note(`地图页面按钮数量: ${mapButtons.length}`);
  // 点击一个未来分支节点
  const nodeButtons = page.locator("main button").filter({ hasText: /试验|稳定|转向|支持|方案/ });
  if (await nodeButtons.count()) {
    await nodeButtons.first().click();
    await page.waitForTimeout(800);
    await shot(page, "14-map-node-selected");
  }
  // 双击焦点模式
  if (await nodeButtons.count()) {
    await nodeButtons.first().dblclick();
    await page.waitForTimeout(700);
    await shot(page, "15-map-focus-1");
    await nodeButtons.first().dblclick();
    await page.waitForTimeout(700);
    await shot(page, "16-map-focus-2");
  }
  // 尺度切换按钮
  const scaleBtns = page.getByRole("button", { name: /^(全人生|十年|阶段|一年|一月|一周|一天|一小时)$/ });
  const scaleCount = await scaleBtns.count();
  note(`尺度按钮数量: ${scaleCount}`);
  if (scaleCount > 1) {
    await scaleBtns.nth(1).click();
    await page.waitForTimeout(900);
    await shot(page, "17-map-scale-2");
    if (scaleCount > 4) {
      await scaleBtns.nth(4).click();
      await page.waitForTimeout(900);
      await shot(page, "18-map-scale-5");
    }
  }

  // ── 9. 进入对话 ─────────────────────────────────────────
  const chatEntry = page.getByRole("button", { name: /对话|聊/ });
  const chatEntryCount = await chatEntry.count();
  note(`对话入口按钮数量: ${chatEntryCount}`);
  if (chatEntryCount) {
    await chatEntry.first().click();
    await page.waitForTimeout(800);
    await shot(page, "19-chat-initial");
    // 发送消息（真实 AI）
    const chatInput = page.locator("textarea, input[type='text']").last();
    await chatInput.fill("如果我先做三个月试验，第一周应该具体做什么？");
    t0 = Date.now();
    await page.keyboard.press("Enter");
    // 等待回复出现
    await page.waitForTimeout(4000);
    await page.waitForFunction(
      () => document.body.innerText.length > 0,
      { timeout: 30000 }
    ).catch(() => {});
    note(`对话首条回复等待 ~${Date.now() - t0}ms（含固定等待）`);
    await shot(page, "20-chat-reply");
  }

  // ── 10. 分享/导出 ───────────────────────────────────────
  const shareNav = page.getByRole("button", { name: /分享|结果/ });
  if (await shareNav.count()) {
    await shareNav.first().click();
    await page.waitForTimeout(600);
    await shot(page, "21-share");
  }

  // ── 11. localStorage 数据审计 ───────────────────────────
  const storageKeys = await page.evaluate(() =>
    Object.keys(localStorage).map((k) => `${k}: ${(localStorage.getItem(k) || "").length} chars`)
  );
  note(`localStorage 键:\n  ${storageKeys.join("\n  ")}`);

  // ── 12. 完整示例 ────────────────────────────────────────
  const demoBtn = page.getByRole("button", { name: "查看完整示例" });
  if (await demoBtn.count()) {
    await demoBtn.first().click();
    await page.waitForTimeout(400);
    // 可能有确认对话框
    const confirmBtn = page.getByRole("button", { name: /确认|继续|替换/ });
    if (await confirmBtn.count()) await confirmBtn.first().click();
    await page.waitForTimeout(1500);
    await shot(page, "22-demo-scenario-map");
  }

  // ── 汇总 ────────────────────────────────────────────────
  note(`浏览器 console 错误: ${consoleErrors.length} 个`);
  consoleErrors.slice(0, 10).forEach((e) => note(`  console.error: ${e.slice(0, 200)}`));

  await browser.close();
  fs.writeFileSync(path.join(OUT, "walkthrough-log.txt"), log.join("\n"));
};

run().catch((err) => {
  console.error(err);
  fs.writeFileSync(path.join(OUT, "walkthrough-log.txt"), log.join("\n") + `\nFATAL: ${err.message}`);
  process.exit(1);
});
