#!/usr/bin/env node

const { containsCrisisSignal } = await import("../src/lib/safety.ts");

const baseUrl = (
  process.argv.find((argument) => argument.startsWith("--base-url="))?.split("=")[1] ??
  process.env.LIFEFORK_QA_BASE_URL ??
  "http://localhost:3005"
).replace(/\/$/, "");

const checks = [];

function check(id, passed, detail, critical = true) {
  checks.push({ id, passed: Boolean(passed), detail, critical });
}

function createClient() {
  let cookie = "";
  return async (path, options = {}) => {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "content-type": "application/json" } : {}),
        ...(cookie ? { cookie } : {}),
        ...(options.headers ?? {}),
      },
    });
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) cookie = setCookie.split(";", 1)[0];
    const body = await response.json().catch(() => null);
    return { response, body, cookie };
  };
}

const postJson = (client, path, body, headers) =>
  client(path, {
    method: "POST",
    body: JSON.stringify(body),
    headers,
  });

async function run() {
  const clientA = createClient();
  const clientB = createClient();

  const health = await clientA("/api/health");
  check("health.online", health.response.status === 200 && health.body?.status === "ok", `HTTP ${health.response.status}`);
  check(
    "health.session-secret",
    health.body?.services?.sessionSecret === "configured",
    `sessionSecret=${health.body?.services?.sessionSecret ?? "unknown"}`,
  );

  const config = await clientA("/api/public-config");
  check(
    "public-config.shape",
    config.response.status === 200 &&
      typeof config.body?.data?.features?.ai === "boolean" &&
      typeof config.body?.data?.privacyNotice === "string",
    `HTTP ${config.response.status}`,
  );
  check(
    "public-config.no-store",
    config.response.headers.get("cache-control")?.includes("no-store"),
    `cache-control=${config.response.headers.get("cache-control")}`,
  );

  const sessionA = await postJson(clientA, "/api/generate-self-skill", {
    selectedVersion: "future",
  });
  const sessionB = await postJson(clientB, "/api/generate-self-skill", {
    selectedVersion: "future",
  });
  check(
    "multiuser.session-isolation",
    Boolean(sessionA.cookie && sessionB.cookie && sessionA.cookie !== sessionB.cookie),
    "two anonymous clients received different signed session cookies",
  );
  check(
    "session.cookie-security",
    /HttpOnly/i.test(sessionA.response.headers.get("set-cookie") ?? "") &&
      /SameSite=Lax/i.test(sessionA.response.headers.get("set-cookie") ?? ""),
    "anonymous session cookie is HttpOnly and SameSite=Lax",
  );

  const unauthorizedConfig = await clientB("/api/admin/config");
  check("admin.config-protected", unauthorizedConfig.response.status === 401, `HTTP ${unauthorizedConfig.response.status}`);

  const configuredAdminPassword = process.env.LIFEFORK_ADMIN_PASSWORD;
  if (configuredAdminPassword) {
    const adminClient = createClient();
    const validLogin = await postJson(
      adminClient,
      "/api/admin/session",
      { password: configuredAdminPassword },
      { origin: baseUrl },
    );
    const editableConfig = await adminClient("/api/admin/config");
    const savedConfig = await adminClient("/api/admin/config", {
      method: "PUT",
      body: JSON.stringify(editableConfig.body?.data ?? {}),
      headers: { origin: baseUrl },
    });
    const logout = await adminClient("/api/admin/session", {
      method: "DELETE",
      headers: { origin: baseUrl },
    });
    const afterLogout = await adminClient("/api/admin/config");
    check(
      "admin.authenticated-flow",
      validLogin.response.status === 200 &&
        validLogin.body?.success === true &&
        editableConfig.response.status === 200 &&
        editableConfig.body?.success === true &&
        typeof editableConfig.body?.data?.features?.ai === "boolean" &&
        savedConfig.response.status === 200 &&
        savedConfig.body?.success === true &&
        logout.response.status === 200 &&
        afterLogout.response.status === 401,
      `login=${validLogin.response.status}, config=${editableConfig.response.status}, save=${savedConfig.response.status}, logout=${logout.response.status}, after=${afterLogout.response.status}`,
    );
  } else {
    check(
      "admin.authenticated-flow",
      false,
      "LIFEFORK_ADMIN_PASSWORD is unavailable to the acceptance runner",
    );
  }

  const crossOrigin = await postJson(
    createClient(),
    "/api/admin/session",
    { password: "invalid-qa-password" },
    { origin: "https://example.invalid" },
  );
  check("admin.same-origin", crossOrigin.response.status === 403, `HTTP ${crossOrigin.response.status}`);

  const invalidSkill = sessionA;
  check("request.validation", invalidSkill.response.status === 400, `HTTP ${invalidSkill.response.status}`);
  check(
    "request.security-headers",
    invalidSkill.response.headers.get("x-content-type-options") === "nosniff" &&
      invalidSkill.response.headers.get("cache-control")?.includes("no-store"),
    "API response uses nosniff and no-store",
  );

  check(
    "safety.benign-language",
    !containsCrisisSignal("我不想立刻毁掉旧生活，只想先做一个小实验"),
    "benign decision language is not intercepted",
  );
  const crisisSamples = ["我不想活了", "我想伤害自己", "我想报复他", "我准备跳楼"];
  check(
    "safety.high-risk-language",
    crisisSamples.every((sample) => containsCrisisSignal(sample)),
    `${crisisSamples.length} high-risk phrases intercepted`,
  );

  const safetyChat = await postJson(clientA, "/api/chat", {
    selfSkillSummary: "测试",
    forkTitle: "测试",
    forkSummary: "测试",
    forkScale: "当前",
    forkGains: [],
    forkCosts: [],
    forkFutureSelfVoice: "",
    voiceProfile: "",
    stageVoice: "",
    calibrationNotes: [],
    conversationHistory: "",
    userMessage: "我不想活了",
  });
  check(
    "safety.server-intercept",
    safetyChat.response.status === 200 &&
      safetyChat.body?.data?.safetyIntercept === true &&
      safetyChat.body?.meta?.llmUsed === false,
    `HTTP ${safetyChat.response.status}, llmUsed=${safetyChat.body?.meta?.llmUsed}`,
  );

  const loginClient = createClient();
  const loginStatuses = [];
  for (let index = 0; index < 6; index += 1) {
    const result = await postJson(
      loginClient,
      "/api/admin/session",
      { password: `invalid-${index}` },
      { origin: baseUrl },
    );
    loginStatuses.push(result.response.status);
  }
  const firstRateLimit = loginStatuses.indexOf(429);
  check(
    "admin.login-rate-limit",
    firstRateLimit >= 0 &&
      loginStatuses.slice(0, firstRateLimit).every((status) => status === 401) &&
      loginStatuses.slice(firstRateLimit).every((status) => status === 429),
    `statuses=${loginStatuses.join(",")}`,
  );

  const criticalFailures = checks.filter((item) => item.critical && !item.passed);
  const warnings = checks.filter((item) => !item.critical && !item.passed);
  const passed = checks.filter((item) => item.passed).length;
  const score = Math.round((passed / checks.length) * 100);

  console.log(`LifeFork product acceptance: ${score}/100 (${passed}/${checks.length})`);
  checks.forEach((item) => {
    const marker = item.passed ? "PASS" : item.critical ? "FAIL" : "WARN";
    console.log(`${marker.padEnd(4)} ${item.id.padEnd(30)} ${item.detail}`);
  });
  console.log(`Summary: ${criticalFailures.length} critical failure(s), ${warnings.length} warning(s).`);
  if (criticalFailures.length) process.exitCode = 1;
}

run().catch((error) => {
  console.error(`Product acceptance could not run against ${baseUrl}:`, error);
  process.exitCode = 1;
});
