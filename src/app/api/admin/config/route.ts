import { NextRequest, NextResponse } from "next/server";
import {
  isAdminRequest,
  isSameOriginRequest,
} from "@/lib/server/adminAuth";
import {
  getRuntimeConfig,
  updateRuntimeConfig,
} from "@/lib/server/runtimeConfigStore";

function unauthorized() {
  return NextResponse.json(
    { success: false, error: "需要管理员登录。" },
    { status: 401, headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  return NextResponse.json(
    { success: true, data: await getRuntimeConfig() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { success: false, error: "请求来源无效。" },
      { status: 403 },
    );
  }

  try {
    const raw = await request.text();
    if (raw.length > 20_000) {
      return NextResponse.json(
        { success: false, error: "配置内容过大。" },
        { status: 413 },
      );
    }
    const updated = await updateRuntimeConfig(JSON.parse(raw));
    return NextResponse.json(
      { success: true, data: updated },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "配置保存失败。",
      },
      { status: 400 },
    );
  }
}
