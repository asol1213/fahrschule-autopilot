import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { rateLimit, getClientIp } from "@/lib/api-auth";

const checkLimit = rateLimit("switch-tenant", 30, 60_000);

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  const { tenantId } = await req.json();
  if (!tenantId) {
    return NextResponse.json({ error: "tenantId required" }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set("active_tenant_id", tenantId, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  return NextResponse.json({ ok: true });
}
