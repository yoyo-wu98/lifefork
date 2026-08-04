// 走查 2：对话体验 + 移动端 + 管理后台
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://127.0.0.1:3005";
const OUT = path.resolve(process.cwd(), "screenshots");
fs.mkdirSync(OUT, { recursive: true });
const log = [];
const note = (m) => { const l = `[${new Date().toISOString().slice(11,19)}] ${m}`; log.push(l); console.log(l); };
const shot = async (page, name) => { await page.screenshot({ path: path.join(OUT, `${name}.png`) }); note(`截图 ${name}.png`); };

const run = async () => {
  const browser = await chromium.launch();

  // ── A. 对话体验（demo 子节点）────────────────────────────
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    page.on("pageerror", (e) => note(`pageerror: ${e.message.slice(0, 200)}`));
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "查看完整示例" }).click();
    await page.waitForTimeout(3000);
    // 先选择根节点（全人生分支），再切到十年尺度
    const rootNode = page.locator("button").filter({ hasText: "完整人生示例：从出生到晚年" });
    await rootNode.first().click();
    await page.waitForTimeout(800);
    await page.getByRole("button", { name: "十年", exact: true }).click();
    await page.waitForTimeout(1600);
    await shot(page, "39-before-decade-click");
    const decadeNode = page.locator("button").filter({ hasText: "20-30 岁" });
    note(`十年节点存在: ${await decadeNode.count()}`);
    if (await decadeNode.count()) {
      await decadeNode.first().click();
      await page.waitForTimeout(800);
      await shot(page, "40-decade-node-detail");
      const chatBtn = page.getByRole("button", { name: /聊聊/ });
      note(`对话入口存在: ${await chatBtn.count()}`);
      if (await chatBtn.count()) {
        await chatBtn.first().click();
        await page.waitForTimeout(1000);
        await shot(page, "41-chat-initial");
        // 盘点聊天页元素
        const btns = (await page.locator("main button").allTextContents()).map(t=>t.trim()).filter(Boolean);
        note(`聊天页按钮: ${btns.join(" | ")}`);
        const input = page.locator("input[type='text'], input:not([type])").last();
        await input.fill("如果我同时处理个人项目和关系，第一个月应该先做什么？");
        const t0 = Date.now();
        await page.keyboard.press("Enter");
        // 等待新回复出现（instance 消息）
        await page.waitForTimeout(9000);
        note(`对话响应观察窗口: ${Date.now() - t0}ms`);
        await shot(page, "42-chat-reply");
        // 语气校准
        const calBtn = page.getByRole("button", { name: /更直接|更口语|更克制/ });
        note(`语气校准按钮: ${await calBtn.count()}`);
        if (await calBtn.count()) {
          await calBtn.first().click();
          await page.waitForTimeout(500);
          await input.fill("再具体一点。");
          await page.keyboard.press("Enter");
          await page.waitForTimeout(8000);
          await shot(page, "43-chat-calibrated");
        }
        // 刷新恢复
        await page.reload({ waitUntil: "networkidle" });
        await page.waitForTimeout(1000);
        await shot(page, "44-chat-after-reload");
        note(`刷新后文本域数量: ${await page.locator("textarea").count()}`);
      }
    }
    await context.close();
  }

  // ── B. 移动端 390px ─────────────────────────────────────
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.goto(BASE, { waitUntil: "networkidle" });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    note(`移动端首页横向溢出: ${overflow}`);
    await shot(page, "50-mobile-landing");
    await page.getByRole("button", { name: "开始分析" }).click();
    await page.waitForSelector('[data-testid="question-currentChoice"]');
    await shot(page, "51-mobile-question");
    // 直接加载 demo：先回首页
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("button", { name: "查看完整示例" }).click();
    await page.waitForTimeout(1800);
    await shot(page, "52-mobile-map");
    const overflow2 = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    note(`移动端地图页横向溢出: ${overflow2}`);
    await context.close();
  }

  // ── C. 管理后台 ─────────────────────────────────────────
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
    await shot(page, "60-admin-login");
    const wrongInput = page.locator("input[type='password']");
    if (await wrongInput.count()) {
      await wrongInput.fill("wrong-password-123");
      await page.getByRole("button", { name: /登录|进入/ }).click();
      await page.waitForTimeout(1200);
      await shot(page, "61-admin-wrong-password");
      const bodyText = await page.locator("main, body").first().innerText();
      note(`错误密码反馈包含: ${bodyText.slice(0, 300).replace(/\n/g, " | ")}`);
    }
    await context.close();
  }

  // ── D. API 边界（无 cookie / 错误负载 / 危机拦截）─────────
  {
    const context = await browser.newContext();
    const req = await context.request;
    const r1 = await req.post(`${BASE}/api/chat`, { data: { messages: [{ role: "user", content: "你好" }] } });
    note(`无会话 /api/chat: ${r1.status()}`);
    const r2 = await req.post(`${BASE}/api/generate-self-skill`, { data: { bad: true } });
    note(`错误负载 /api/generate-self-skill: ${r2.status()}`);
    const r3 = await req.get(`${BASE}/api/public-config`);
    note(`/api/public-config: ${r3.status()} cache-control: ${r3.headers()["cache-control"]}`);
    const r4 = await req.get(`${BASE}/api/admin/config`);
    note(`未登录 /api/admin/config: ${r4.status()}`);
    await context.close();
  }

  await browser.close();
  fs.writeFileSync(path.join(OUT, "walkthrough2-log.txt"), log.join("\n"));
};
run().catch((e) => { console.error(e); fs.writeFileSync(path.join(OUT, "walkthrough2-log.txt"), log.join("\n") + `\nFATAL: ${e.message}`); process.exit(1); });
