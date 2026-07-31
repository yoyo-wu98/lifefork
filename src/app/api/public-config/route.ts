import { NextResponse } from "next/server";
import { getRuntimeConfig } from "@/lib/server/runtimeConfigStore";

export async function GET() {
  const config = await getRuntimeConfig();
  return NextResponse.json(
    { success: true, data: config },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
