#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { unlink } from "node:fs/promises";

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(server.address().port));
  });
}

function providerPayload(instructions) {
  if (instructions.includes("自我认知引擎")) {
    return {
      identity: {
        displayName: "测试型规划者",
        languageStyle: "短句，先给结论",
        emotionalTone: "谨慎",
        selfNarrative: "你希望先验证方案，再决定是否扩大投入。",
        archetype: "谨慎规划型",
      },
      semantic: {
        values: ["自主权"],
        fears: ["信息不足"],
        desires: ["获得真实反馈"],
        recurringPatterns: ["先收集信息再行动"],
        innerConflict: "变化 vs 稳定",
        lifeMotif: "在投入前确认风险和收益",
      },
      decision: {
        riskPreference: "谨慎试验型",
        workStyle: "结构化",
        conflictStyle: "先整理再沟通",
        changeTolerance: "中等",
        attachmentPattern: "保留边界",
      },
      voiceProfile: {
        toneName: "直接说明型",
        traits: ["短句"],
        signaturePhrases: ["先试一下"],
        sentenceRhythm: "短句为主",
        punctuationStyle: "标点克制",
        emotionalGesture: "先结论后顾虑",
        sampleLine: "先试一下，再根据结果决定。",
      },
      stageVoices: [
        {
          stage: "present",
          ageLabel: "现在的你",
          toneName: "直接说明型",
          description: "先给结论",
          sampleLine: "先试一下，再决定。",
          traits: ["直接"],
        },
      ],
      claims: [
        {
          text: "你倾向先测试再投入",
          confidence: 0.7,
          evidenceQuote: "先试一下",
        },
      ],
      timelineNodes: [
        {
          yearLabel: "现在",
          title: "设计测试",
          emotion: "谨慎",
          pattern: "先收集结果",
        },
      ],
      branchScenarios: [
        {
          lane: "experiment",
          title: "先做测试",
          subtitle: "控制投入",
          summary: "用一周完成一次测试。",
          gains: ["获得反馈"],
          costs: ["占用时间"],
          futureSelfName: "测试后的你",
          futureSelfVoice: "直接复盘结果",
        },
      ],
    };
  }

  if (instructions.includes("聊天记录分析器")) {
    return {
      recurringTopics: ["选择"],
      emotionalSignals: ["谨慎"],
      keyThemes: ["先验证"],
      relationshipDynamics: "双方都在补充决策信息。",
      selfSkillSignals: ["重视证据"],
      suggestedSelfSkillText: "用户重视证据，并倾向先验证再决定。",
    };
  }

  return { reply: "先完成一个两小时测试，再根据结果决定下一步。" };
}

async function waitForServer(url, child, logs) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`LifeFork test server exited early.\n${logs.join("").slice(-2000)}`);
    }
    try {
      const response = await fetch(`${url}/api/health`);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for LifeFork test server.\n${logs.join("").slice(-2000)}`);
}

async function post(url, path, body) {
  const response = await fetch(`${url}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

const capturedRequests = [];
const mockProvider = createServer(async (request, response) => {
  let body = "";
  for await (const chunk of request) body += chunk;
  const parsed = JSON.parse(body);
  capturedRequests.push({ url: request.url, headers: request.headers, body: parsed });
  const payload = providerPayload(parsed.instructions ?? "");
  const content = JSON.stringify(payload);
  const output = capturedRequests.length === 1
    ? [{ type: "message", content: [{ type: "output_text", text: content }] }]
    : undefined;
  response.writeHead(200, { "content-type": "application/json" });
  response.end(
    JSON.stringify({
      id: `resp_qa_${capturedRequests.length}`,
      ...(output ? { output } : { output_text: content }),
      usage: { input_tokens: 120, output_tokens: 40, total_tokens: 160 },
    }),
  );
});

let app;
let configPath = "";
try {
  const providerPort = await listen(mockProvider);
  const portProbe = createServer();
  const appPort = await listen(portProbe);
  await new Promise((resolve) => portProbe.close(resolve));
  const baseUrl = `http://127.0.0.1:${appPort}`;
  configPath = `/tmp/lifefork-provider-qa-${process.pid}.json`;
  const logs = [];
  app = spawn(process.execPath, ["scripts/start-standalone.mjs"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(appPort),
      HOSTNAME: "127.0.0.1",
      LIFEFORK_AI_ENABLED: "true",
      LIFEFORK_AI_PROVIDER: "openai",
      LIFEFORK_COOKIE_SECURE: "false",
      LIFEFORK_SESSION_SECRET: "qa-session-secret-with-more-than-32-characters",
      LIFEFORK_CONFIG_PATH: configPath,
      OPENAI_API_KEY: "qa-provider-contract-key",
      OPENAI_BASE_URL: `http://127.0.0.1:${providerPort}`,
      OPENAI_MODEL: "gpt-5.6-terra",
      OPENAI_REASONING_EFFORT: "low",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  app.stdout.on("data", (chunk) => logs.push(String(chunk)));
  app.stderr.on("data", (chunk) => logs.push(String(chunk)));
  await waitForServer(baseUrl, app, logs);

  const chat = await post(baseUrl, "/api/chat", {
    selfSkillSummary: "先试一下，再决定。",
    forkTitle: "测试方案",
    forkSummary: "用两个小时完成测试。",
    forkScale: "一周",
    forkGains: ["获得信息"],
    forkCosts: ["占用时间"],
    forkFutureSelfVoice: "直接",
    voiceProfile: "短句",
    stageVoice: "现在",
    calibrationNotes: [],
    conversationHistory: "",
    userMessage: "第一步做什么？",
  });
  const wechat = await post(baseUrl, "/api/wechat-analyze", {
    localSummary: "主题是选择，用户希望先验证再决定。",
  });

  const firstRequest = capturedRequests[0];
  const checks = [
    ["OpenAI route returns AI reply", chat.status === 200 && chat.body?.meta?.llmUsed === true],
    ["Nested Responses output is parsed", chat.body?.data?.reply?.includes("两小时")],
    ["output_text is parsed", wechat.status === 200 && wechat.body?.meta?.llmUsed === true],
    ["Responses endpoint is used", capturedRequests.every((item) => item.url === "/v1/responses")],
    ["Model is forwarded", capturedRequests.every((item) => item.body.model === "gpt-5.6-terra")],
    ["Provider storage is disabled", capturedRequests.every((item) => item.body.store === false)],
    ["Low verbosity is requested", capturedRequests.every((item) => item.body.text?.verbosity === "low")],
    ["Safety identifier is forwarded", capturedRequests.every((item) => Boolean(item.body.safety_identifier))],
    ["Bearer auth is forwarded", firstRequest?.headers?.authorization === "Bearer qa-provider-contract-key"],
  ];
  checks.forEach(([label, passed]) => console.log(`${passed ? "PASS" : "FAIL"} ${label}`));
  if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
} finally {
  if (app && app.exitCode === null) {
    app.kill("SIGTERM");
    await new Promise((resolve) => {
      app.once("exit", resolve);
      setTimeout(resolve, 2_000);
    });
  }
  await new Promise((resolve) => mockProvider.close(resolve));
  if (configPath) await unlink(configPath).catch(() => undefined);
}
