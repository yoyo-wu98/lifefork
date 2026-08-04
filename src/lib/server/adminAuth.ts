import "server-only";

import {
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  readServerEnvironment,
  serverEnvironmentEnabled,
} from "@/lib/server/environment";

const ADMIN_COOKIE = "lifefork_admin";
const COOKIE_MAX_AGE = 8 * 60 * 60;
const LOCAL_DEV_SECRET = "lifefork-local-development-secret-change-before-deploy";

function isProductionRuntime() {
  return process.env.NODE_ENV === "production";
}

// Production instances without a configured secret get a random per-process
// secret instead of the public hardcoded one, so the admin token cannot be
// forged offline. Admins simply log in again after a restart.
const ephemeralSecret = randomBytes(32).toString("hex");

function signingSecret() {
  const configured = readServerEnvironment("LIFEFORK_SESSION_SECRET");
  if (configured) return configured;
  return isProductionRuntime() ? ephemeralSecret : LOCAL_DEV_SECRET;
}

export function sessionSecretIsEphemeral() {
  return !readServerEnvironment("LIFEFORK_SESSION_SECRET") && isProductionRuntime();
}

function expectedAdminToken() {
  return createHmac("sha256", signingSecret())
    .update("lifefork-admin:v1")
    .digest("hex");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function adminPasswordConfigured() {
  return Boolean(readServerEnvironment("LIFEFORK_ADMIN_PASSWORD"));
}

export function verifyAdminPassword(password: string) {
  const expected = readServerEnvironment("LIFEFORK_ADMIN_PASSWORD");
  return Boolean(expected && safeEqual(password, expected));
}

export function isAdminRequest(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  return Boolean(token && safeEqual(token, expectedAdminToken()));
}

export function isSameOriginRequest(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return process.env.NODE_ENV !== "production";
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export function attachAdminCookie(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_COOKIE,
    value: expectedAdminToken(),
    httpOnly: true,
    sameSite: "strict",
    secure:
      serverEnvironmentEnabled("LIFEFORK_COOKIE_SECURE") ||
      Boolean(readServerEnvironment("VERCEL_ENV")),
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return response;
}

export function clearAdminCookie(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "strict",
    secure:
      serverEnvironmentEnabled("LIFEFORK_COOKIE_SECURE") ||
      Boolean(readServerEnvironment("VERCEL_ENV")),
    path: "/",
    maxAge: 0,
  });
  return response;
}
