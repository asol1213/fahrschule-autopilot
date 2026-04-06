import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeCompare } from "@/lib/api-auth";

/**
 * DSGVO-konforme Archivierung alter Anrufe.
 *
 * POST: Manuell oder von n8n — archiviert Anrufe eines bestimmten Tenants.
 * GET:  Vercel Cron — iteriert alle aktiven Tenants und archiviert automatisch.
 * DELETE: Art. 17 — Einzelnen Anruf auf Wunsch löschen.
 *
 * Authentifizierung: CRON_SECRET (fail-closed — ohne Secret kein Zugriff)
 */

function verifyCronAuth(req: NextRequest): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  // Fail-closed: Ohne CRON_SECRET kein Zugriff
  if (!cronSecret) {
    console.error("[DSGVO] CRON_SECRET nicht konfiguriert — Zugriff verweigert");
    return NextResponse.json({ error: "Server not configured for DSGVO operations" }, { status: 503 });
  }

  if (!safeCompare(authHeader ?? "", `Bearer ${cronSecret}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null; // Auth OK
}

async function archiveTenantCalls(
  tenantId: string,
  tageBehalten: number
): Promise<{ archiviert: number; error?: string }> {
  const supabase = await createClient();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - tageBehalten);
  const cutoffStr = cutoffDate.toISOString();

  // 1. Alte Anrufe finden
  const { data: alteAnrufe, error: selectError } = await supabase
    .from("anrufe")
    .select("*")
    .eq("tenant_id", tenantId)
    .lt("created_at", cutoffStr)
    .eq("archiviert", false);

  if (selectError) {
    return { archiviert: 0, error: selectError.message };
  }

  if (!alteAnrufe || alteAnrufe.length === 0) {
    return { archiviert: 0 };
  }

  // 2. Anonymisierte Kopien in Archiv schreiben
  const archivEintraege = alteAnrufe.map((a) => ({
    tenant_id: a.tenant_id,
    original_id: a.id,
    call_id: a.call_id,
    dauer_sekunden: a.dauer_sekunden,
    intent: a.intent,
    sentiment: a.sentiment,
    fuehrerscheinklasse: a.fuehrerscheinklasse,
    is_new_lead: a.is_new_lead,
    monat: (a.created_at as string).substring(0, 7),
  }));

  const { error: archivError } = await supabase
    .from("anrufe_archiv")
    .insert(archivEintraege);

  if (archivError) {
    return { archiviert: 0, error: `Archiv-Fehler: ${archivError.message}` };
  }

  // 3. Originale löschen
  const ids = alteAnrufe.map((a) => a.id);
  const { error: deleteError } = await supabase
    .from("anrufe")
    .delete()
    .in("id", ids);

  if (deleteError) {
    return { archiviert: 0, error: `Lösch-Fehler: ${deleteError.message}` };
  }

  // 4. DSGVO Audit-Log
  await supabase.from("dsgvo_audit_log").insert({
    tenant_id: tenantId,
    aktion: "archivierung",
    betroffene_anrufe: alteAnrufe.length,
    details: { tage_behalten: tageBehalten, cutoff_date: cutoffStr, anruf_ids: ids },
    ausgefuehrt_von: "api",
  }).then(({ error }) => {
    if (error) console.error("[DSGVO] Audit-Log Fehler:", error);
  });

  console.log(`[DSGVO] ${alteAnrufe.length} Anrufe archiviert für Tenant ${tenantId}`);
  return { archiviert: alteAnrufe.length };
}

// --- POST: Archivierung für einen bestimmten Tenant ---

export async function POST(req: NextRequest) {
  try {
    const authError = verifyCronAuth(req);
    if (authError) return authError;

    const body = await req.json().catch(() => ({}));
    const tageBehalten = body.tage || 90;
    const tenantId = body.tenantId;

    // tenantId ist Pflicht — verhindert versehentliche Cross-Tenant-Archivierung
    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId ist erforderlich" },
        { status: 400 }
      );
    }

    const result = await archiveTenantCalls(tenantId, tageBehalten);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      archiviert: result.archiviert,
      tageBehalten,
      message: result.archiviert > 0
        ? `${result.archiviert} Anrufe erfolgreich archiviert und Personendaten gelöscht.`
        : `Keine Anrufe älter als ${tageBehalten} Tage gefunden.`,
    });
  } catch (error) {
    console.error("[DSGVO] Archivierungs-Fehler:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// --- GET: Vercel Cron — archiviert für ALLE aktiven Tenants ---

export async function GET(req: NextRequest) {
  try {
    const authError = verifyCronAuth(req);
    if (authError) return authError;

    const supabase = await createClient();

    // Alle aktiven Tenants laden
    const { data: tenants, error: tenantError } = await supabase
      .from("tenants")
      .select("id")
      .eq("is_active", true);

    if (tenantError || !tenants) {
      return NextResponse.json({ error: "Tenants konnten nicht geladen werden" }, { status: 500 });
    }

    const tageBehalten = 90;
    let gesamtArchiviert = 0;
    const ergebnisse: Array<{ tenantId: string; archiviert: number; error?: string }> = [];

    for (const tenant of tenants) {
      const result = await archiveTenantCalls(tenant.id, tageBehalten);
      gesamtArchiviert += result.archiviert;
      ergebnisse.push({ tenantId: tenant.id, ...result });
    }

    console.log(`[DSGVO/Cron] Gesamt: ${gesamtArchiviert} Anrufe archiviert über ${tenants.length} Tenants`);

    return NextResponse.json({
      success: true,
      tenants: tenants.length,
      gesamtArchiviert,
      tageBehalten,
      ergebnisse,
    });
  } catch (error) {
    console.error("[DSGVO/Cron] Fehler:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// --- DELETE: Art. 17 — Einzelnen Anruf auf Wunsch löschen ---

export async function DELETE(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  const anrufId = req.nextUrl.searchParams.get("anrufId");
  const tenantId = req.nextUrl.searchParams.get("tenantId");

  if (!anrufId || !tenantId) {
    return NextResponse.json({ error: "anrufId und tenantId erforderlich" }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    // 1. Anruf finden
    const { data: anruf } = await supabase
      .from("anrufe")
      .select("*")
      .eq("id", anrufId)
      .eq("tenant_id", tenantId)
      .single();

    if (!anruf) {
      return NextResponse.json({ error: "Anruf nicht gefunden" }, { status: 404 });
    }

    // 2. Anonymisierte Kopie in Archiv
    await supabase.from("anrufe_archiv").insert({
      tenant_id: anruf.tenant_id,
      original_id: anruf.id,
      call_id: anruf.call_id,
      dauer_sekunden: anruf.dauer_sekunden,
      intent: anruf.intent,
      sentiment: anruf.sentiment,
      fuehrerscheinklasse: anruf.fuehrerscheinklasse,
      is_new_lead: anruf.is_new_lead,
      monat: (anruf.created_at as string).substring(0, 7),
    });

    // 3. Original löschen
    await supabase
      .from("anrufe")
      .delete()
      .eq("id", anrufId)
      .eq("tenant_id", tenantId);

    // 4. DSGVO Audit-Log
    await supabase.from("dsgvo_audit_log").insert({
      tenant_id: tenantId,
      aktion: "einzelloeschung",
      betroffene_anrufe: 1,
      details: { anruf_id: anrufId, call_id: anruf.call_id },
      ausgefuehrt_von: "api",
    }).then(({ error }) => {
      if (error) console.error("[DSGVO] Audit-Log Fehler:", error);
    });

    console.log(`[DSGVO] Anruf ${anrufId} auf Wunsch gelöscht (Art. 17)`);

    return NextResponse.json({
      success: true,
      message: `Anruf ${anrufId} wurde DSGVO-konform gelöscht. Anonymisierte Statistikdaten bleiben erhalten.`,
    });
  } catch (error) {
    console.error("[DSGVO] Einzellöschung Fehler:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
