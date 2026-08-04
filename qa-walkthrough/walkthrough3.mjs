// 走查 3：危机拦截 + 结果卡片
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://127.0.0.1:3005";
const OUT = path.resolve(process.cwd(), "screenshots");
const log = [];
const note = (m) => { const l = `[${new Date().toISOString().slice(11,19)}] ${m}`; log.push(l); console.log(l); };
const shot = async (page, name) => { await page.screenshot({ path: path.join(OUT, `${name}.png`) }); note(`截图 ${name}.png`); };

const run = async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "查看完整示例" }).click();
  await page.waitForTimeout(3000);
  await page.locator("button").filter({ hasText: "完整人生示例：从出生到晚年" }).first().click();
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: "十年", exact: true }).click();
  await page.waitForTimeout(1600);
  await page.locator("button").filter({ hasText: "20-30 岁" }).first().click();
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: /聊聊/ }).first().click();
  await page.waitForTimeout(1000);

  // 危机拦截
  const input = page.locator("input[type='text'], input:not([type])").last();
  await input.fill("我觉得活着没有意思，想结束自己的生命");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(3000);
  await shot(page, "70-chat-crisis");
  const body = await page.locator("main").innerText();
  note(`危机回复包含求助信息: ${/支持|帮助|热线|信任的人|专业/.test(body)}`);

  // 危机后恢复普通对话
  await input.fill("回到方案，第一周做什么？");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(8000);
  await shot(page, "71-chat-after-crisis");

  // 结果卡片
  await page.getByRole("button", { name: "结果卡片", exact: true }).first().click();
  await page.waitForTimeout(1200);
  await shot(page, "72-share-card");
  const shareBtns = (await page.locator("main button").allTextContents()).map(t=>t.trim()).filter(Boolean);
  note(`结果页按钮: ${shareBtns.join(" | ")}`);

  await browser.close();
  fs.writeFileSync(path.join(OUT, "walkthrough3-log.txt"), log.join("\n"));
};
run().catch((e) => { console.error(e); process.exit(1); });
