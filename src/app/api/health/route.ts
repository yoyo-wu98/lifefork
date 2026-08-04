import { NextResponse } from "next/server";
import { getRuntimeConfig } from "@/lib/server/runtimeConfigStore";
import { isSessionSecretConfigured } from "@/lib/server/publicSession";
import { sessionSecretIsEphemeral } from "@/lib/server/adminAuth";
import { readServerEnvironment } from "@/lib/server/environment";

export async function GET() {
  const config = await getRuntimeConfig();
  const healthy = config.status === "online";
  return NextResponse.json(
    {
      status: healthy ? "ok" : "maintenance",
      version: readServerEnvironment("LIFEFORK_VERSION") ?? "0.8.0",
      timestamp: new Date().toISOString(),
      services: {
        web: "ok",
        ai: config.features.ai
          ? config.service.aiConfigured
            ? "configured"
            : "fallback-only"
          : "disabled",
        sessionSecret: isSessionSecretConfigured()
          ? "configured"
          : sessionSecretIsEphemeral()
            ? "ephemeral-production-fallback"
            : "development-fallback",
      },
    },
    {
      status: healthy ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
