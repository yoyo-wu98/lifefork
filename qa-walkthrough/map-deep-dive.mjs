// 人生地图深度交互走查：使用完整示例（免 AI），验证尺度、焦点、节点详情、对话入口
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://127.0.0.1:3005";
const OUT = path.resolve(process.cwd(), "screenshots");
fs.mkdirSync(OUT, { recursive: true });
const log = [];
const note = (m) => { const l = `[${new Date().toISOString().slice(11,19)}] ${m}`; log.push(l); console.log(l); };
const shot = async (page, name) => { await page.screenshot({ path: path.join(OUT, `${name}.png`) }); note(`截图 ${name}.png`); };
const currentStep = async (page) =>
  (await page.locator("nav button span.block.text-\\[11px\\]").first().textContent().catch(() => "?"))?.trim();

const run = async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "zh-CN" });
  const page = await context.newPage();
  page.on("console", (msg) => { if (msg.type() === "error") note(`console.error: ${msg.text().slice(0,200)}`); });
  page.on("pageerror", (err) => note(`pageerror: ${err.message.slice(0,200)}`));
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    window.__clicks = [];
    document.addEventListener("click", (e) => {
      const t = e.target.closest("button");
      window.__clicks.push(t ? t.textContent.trim().slice(0, 40) : e.target.tagName);
    }, true);
  });

  await page.getByRole("button", { name: "查看完整示例" }).click();
  await page.waitForTimeout(500);
  const confirm = page.getByRole("button", { name: /确认|继续|替换/ });
  if (await confirm.count()) { await confirm.first().click(); }
  await page.waitForTimeout(1500);
  note(`加载示例后步骤: ${await currentStep(page)}`);

  // 确保在方案地图
  const mapNav = page.getByRole("button", { name: "方案地图", exact: true });
  if (await mapNav.count()) { await mapNav.first().click(); await page.waitForTimeout(800); }
  note(`当前步骤: ${await currentStep(page)}`);
  await shot(page, "30-demo-map-top");

  // 尺度按钮盘点（打印所有地图工具栏按钮的可访问名称）
  const toolbarBtns = await page.getByRole("button").all();
  const names = [];
  for (const b of toolbarBtns) {
    const n = (await b.textContent())?.trim();
    if (["全人生","十年","阶段","一年","一月","一周","一天","一小时"].includes(n || "")) names.push(n);
  }
  note(`尺度按钮: ${names.join(", ") || "未找到"}`);

  // 地图节点按钮盘点
  const mapArea = page.locator("main");
  const allBtnTexts = (await mapArea.locator("button").allTextContents()).map(t => t.trim()).filter(Boolean);
  note(`main 内全部按钮 (${allBtnTexts.length}): ${allBtnTexts.slice(0, 40).join(" | ")}`);

  // 点击未来分支节点（地图内，排除导航）
  const futureNode = page.locator("button").filter({ hasText: "完整人生示例" }).first();
  if (await futureNode.count()) {
    await futureNode.click();
    await page.waitForTimeout(700);
    note(`点击根节点后步骤: ${await currentStep(page)}`);
    await shot(page, "31-root-node-selected");
  }

  // 切换到十年尺度
  const tenYear = page.getByRole("button", { name: "十年", exact: true });
  if (await tenYear.count()) {
    await tenYear.first().click();
    await page.waitForTimeout(1000);
    await shot(page, "32-scale-decade");
    note(`十年尺度后步骤: ${await currentStep(page)}`);
  }
  const year = page.getByRole("button", { name: "一年", exact: true });
  if (await year.count()) {
    await year.first().click();
    await page.waitForTimeout(1000);
    await shot(page, "33-scale-year");
  }
  const week = page.getByRole("button", { name: "一周", exact: true });
  if (await week.count()) {
    await week.first().click();
    await page.waitForTimeout(1000);
    await shot(page, "34-scale-week");
  }

  // 双击焦点循环
  const visibleNode = page.locator("button").filter({ hasText: /当前问题|岁|周|月|示例/ }).last();
  if (await visibleNode.count()) {
    await visibleNode.dblclick();
    await page.waitForTimeout(700);
    await shot(page, "35-focus-a");
    await visibleNode.dblclick();
    await page.waitForTimeout(700);
    await shot(page, "36-focus-b");
  }

  // 详情面板与对话入口
  const chatBtn = page.getByRole("button", { name: /和这个方案的模拟版本对话/ });
  note(`对话入口存在: ${await chatBtn.count()}`);
  if (await chatBtn.count()) {
    await chatBtn.first().click();
    await page.waitForTimeout(1000);
    note(`进入对话后步骤: ${await currentStep(page)}`);
    await shot(page, "37-chat");
    // 发送消息
    const input = page.locator("textarea").last();
    await input.fill("这个方案第一个月我应该先做什么？");
    const t0 = Date.now();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(6000);
    note(`对话回复观察窗口: ${Date.now() - t0}ms`);
    await shot(page, "38-chat-reply");
    // 语气校准按钮
    const tuneBtns = await page.getByRole("button").allTextContents();
    const tunes = tuneBtns.map(t=>t.trim()).filter(t => /更口语|更克制|更直接|更锋利|像我/.test(t));
    note(`语气校准按钮: ${tunes.join(", ") || "未找到"}`);
  }

  note("完成");
  note(`点击序列: ${JSON.stringify(await page.evaluate(() => window.__clicks))}`);
  note(`最终 localStorage step: ${await page.evaluate(() => localStorage.getItem("lifefork.currentStep"))}`);
  await browser.close();
  fs.writeFileSync(path.join(OUT, "map-log.txt"), log.join("\n"));
};
run().catch((e) => { console.error(e); fs.writeFileSync(path.join(OUT, "map-log.txt"), log.join("\n") + `\nFATAL: ${e.message}`); process.exit(1); });
