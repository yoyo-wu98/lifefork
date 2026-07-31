import { NextRequest, NextResponse } from "next/server";
import {
  adminPasswordConfigured,
  attachAdminCookie,
  clearAdminCookie,
  isAdminRequest,
  isSameOriginRequest,
  verifyAdminPassword,
} from "@/lib/server/adminAuth";
import { finalizePublicApiResponse, guardPublicApi } from "@/lib/server/apiGuard";

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      success: true,
      authenticated: isAdminRequest(request),
      configured: adminPasswordConfigured(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  const { guard, blocked } = guardPublicApi(request, {
    bucket: "admin-login",
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (blocked) return blocked;

  if (!isSameOriginRequest(request)) {
    return finalizePublicApiResponse(
      NextResponse.json(
        { success: false, error: "请求来源无效。" },
        { status: 403 },
      ),
      guard,
    );
  }

  if (!adminPasswordConfigured()) {
    return finalizePublicApiResponse(
      NextResponse.json(
        {
          success: false,
          error: "服务器尚未配置 LIFEFORK_ADMIN_PASSWORD。",
        },
        { status: 503 },
      ),
      guard,
    );
  }

  let password = "";
  try {
    const body = (await request.json()) as { password?: unknown };
    password = typeof body.password === "string" ? body.password.slice(0, 256) : "";
  } catch {
    password = "";
  }

  if (!verifyAdminPassword(password)) {
    return finalizePublicApiResponse(
      NextResponse.json(
        { success: false, error: "密码不正确。" },
        { status: 401 },
      ),
      guard,
    );
  }

  return finalizePublicApiResponse(
    attachAdminCookie(NextResponse.json({ success: true })),
    guard,
  );
}

export async function DELETE(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { success: false, error: "请求来源无效。" },
      { status: 403 },
    );
  }
  return clearAdminCookie(NextResponse.json({ success: true }));
}
