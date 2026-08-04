// 复现：点击导航“方案地图”后步骤跳回首页的问题
import { chromium } from "playwright";

const BASE = "http://127.0.0.1:3005";
const run = async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on("pageerror", (e) => console.log("PAGEERROR:", e.message.slice(0, 300)));
  page.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE:", m.text().slice(0, 200)); });

  await page.goto(BASE, { waitUntil: "networkidle" });
  // 捕获所有点击目标
  await page.evaluate(() => {
    window.__clicks = [];
    document.addEventListener("click", (e) => {
      const t = e.target.closest("button");
      window.__clicks.push(t ? t.textContent.trim().slice(0, 40) : e.target.tagName);
    }, true);
  });
  // 记录 localStorage 的 step 变化
  await page.getByRole("button", { name: "查看完整示例" }).click();
  await page.waitForTimeout(2000);
  const stepLabel = () => page.locator("nav span.text-\\[11px\\]").first().textContent();
  console.log("demo 后步骤:", await stepLabel());
  console.log("localStorage step:", await page.evaluate(() => localStorage.getItem("lifefork.currentStep")));

  const navBtn = page.getByRole("button", { name: "方案地图", exact: true });
  console.log("匹配的按钮数量:", await navBtn.count());
  for (let i = 0; i < (await navBtn.count()); i++) {
    console.log(`  [${i}]`, await navBtn.nth(i).textContent(), "| visible:", await navBtn.nth(i).isVisible());
  }
  await navBtn.first().click();
  await page.waitForTimeout(1000);
  console.log("点击后步骤:", await stepLabel());
  console.log("点击记录:", await page.evaluate(() => window.__clicks));
  console.log("localStorage step:", await page.evaluate(() => localStorage.getItem("lifefork.currentStep")));
  await browser.close();
};
run();
