import { NextRequest, NextResponse } from "next/server";
import { onboardNewCustomer } from "@/lib/onboarding";
import { safeCompare, rateLimit, getClientIp } from "@/lib/api-auth";
import type { PlanTier } from "@/lib/tenant";

const checkLimit = rateLimit("onboarding", 30, 60_000);

/**
 * POST /api/onboarding
 * Neuen Kunden onboarden — erstellt Tenant-Config und gibt Checklist zurück
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  try {
    // Auth check (timing-safe API-Key)
    const authHeader = req.headers.get("authorization") ?? "";
    const apiKey = process.env.ONBOARDING_API_KEY;
    if (!apiKey || !safeCompare(authHeader, `Bearer ${apiKey}`)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validierung
    const required = ["fahrschulName", "inhaber", "stadt", "adresse", "telefon", "email", "plan"];
    const missing = required.filter((f) => !body[f]);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: "Pflichtfelder fehlen", missing },
        { status: 400 }
      );
    }

    const validPlans: PlanTier[] = ["starter", "pro", "premium"];
    if (!validPlans.includes(body.plan)) {
      return NextResponse.json(
        { error: "Ungültiger Plan. Erlaubt: starter, pro, premium" },
        { status: 400 }
      );
    }

    const result = await onboardNewCustomer(body);

    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Onboarding fehlgeschlagen" },
      { status: 500 }
    );
  }
}
