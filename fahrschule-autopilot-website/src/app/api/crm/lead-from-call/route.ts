import { NextRequest, NextResponse } from "next/server";
import { createLeadFromCall } from "@/lib/crm/lead-from-call";
import { safeCompare } from "@/lib/api-auth";

/**
 * POST /api/crm/lead-from-call
 *
 * Agent 2 → Agent 5 Bridge: Erstellt automatisch einen Schüler-Eintrag
 * aus einem analysierten Telefonanruf.
 *
 * Auth: RETELL_WEBHOOK_SECRET oder WEBHOOK_SECRET (timing-safe)
 */
export async function POST(req: NextRequest) {
  try {
    const webhookSecret = process.env.RETELL_WEBHOOK_SECRET ?? process.env.WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ error: "Server: Webhook secret not configured" }, { status: 500 });
    }
    const apiKey = req.headers.get("X-API-Key") ?? req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
    if (!safeCompare(apiKey, webhookSecret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const result = await createLeadFromCall(body);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("required") || message.includes("erforderlich") ? 400 : 500;

    console.error("[CRM] Lead-from-call Fehler:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
