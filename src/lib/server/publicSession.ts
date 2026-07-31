import "server-only";

import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import {
  readServerEnvironment,
  serverEnvironmentEnabled,
} from "@/lib/server/environment";

const COOKIE_NAME = "lifefork_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function sessionSecret(): string {
  return (
    readServerEnvironment("LIFEFORK_SESSION_SECRET") ||
    "lifefork-local-preview-change-this-secret-before-public-deployment"
  );
}

function sign(sessionId: string): string {
  return createHmac("sha256", sessionSecret()).update(sessionId).digest("base64url");
}

function verify(value: string): string | null {
  const separatorIndex = value.lastIndexOf(".");
  if (separatorIndex < 1) return null;
  const sessionId = value.slice(0, separatorIndex);
  const incomingSignature = value.slice(separatorIndex + 1);
  const expectedSignature = sign(sessionId);
  if (incomingSignature.length !== expectedSignature.length) return null;

  const valid = timingSafeEqual(
    Buffer.from(incomingSignature),
    Buffer.from(expectedSignature),
  );
  return valid ? sessionId : null;
}

export interface PublicSession {
  id: string;
  safetyIdentifier: string;
  isNew: boolean;
}

export function readOrCreatePublicSession(request: NextRequest): PublicSession {
  const existing = request.cookies.get(COOKIE_NAME)?.value;
  const verified = existing ? verify(existing) : null;
  const id = verified ?? randomUUID();

  return {
    id,
    safetyIdentifier: createHash("sha256").update(id).digest("hex").slice(0, 32),
    isNew: !verified,
  };
}

export function attachPublicSessionCookie(
  response: NextResponse,
  session: PublicSession,
): NextResponse {
  if (!session.isNew) return response;
  response.cookies.set({
    name: COOKIE_NAME,
    value: `${session.id}.${sign(session.id)}`,
    httpOnly: true,
    sameSite: "lax",
    secure:
      serverEnvironmentEnabled("LIFEFORK_COOKIE_SECURE") ||
      Boolean(readServerEnvironment("VERCEL_ENV")),
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}

export function isSessionSecretConfigured(): boolean {
  return Boolean(readServerEnvironment("LIFEFORK_SESSION_SECRET"));
}
