import "server-only";

import { NextRequest, NextResponse } from "next/server";
import {
  attachPublicSessionCookie,
  readOrCreatePublicSession,
  type PublicSession,
} from "@/lib/server/publicSession";
import { consumeRateLimit } from "@/lib/server/rateLimit";

export interface PublicApiGuard {
  session: PublicSession;
  remaining: number;
  resetAt: number;
}

export function guardPublicApi(
  request: NextRequest,
  {
    bucket,
    limit,
    windowMs = 10 * 60 * 1000,
  }: {
    bucket: string;
    limit: number;
    windowMs?: number;
  },
): { guard: PublicApiGuard; blocked?: NextResponse } {
  const session = readOrCreatePublicSession(request);
  const rate = consumeRateLimit({
    sessionId: session.id,
    bucket,
    limit,
    windowMs,
  });
  const guard: PublicApiGuard = {
    session,
    remaining: rate.remaining,
    resetAt: rate.resetAt,
  };

  if (rate.allowed) return { guard };

  const blocked = NextResponse.json(
    {
      success: false,
      error: "当前会话请求过于频繁，请稍后再试。",
      retryAfterSeconds: rate.retryAfterSeconds,
    },
    { status: 429 },
  );
  blocked.headers.set("Retry-After", String(rate.retryAfterSeconds));
  blocked.headers.set("X-RateLimit-Remaining", "0");
  blocked.headers.set("X-RateLimit-Reset", String(rate.resetAt));

  return { guard, blocked: attachPublicSessionCookie(blocked, session) };
}

export function finalizePublicApiResponse(
  response: NextResponse,
  guard: PublicApiGuard,
): NextResponse {
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-RateLimit-Remaining", String(guard.remaining));
  response.headers.set("X-RateLimit-Reset", String(guard.resetAt));
  response.headers.set("X-Content-Type-Options", "nosniff");
  return attachPublicSessionCookie(response, guard.session);
}
