/**
 * CRM Lead-Erstellung aus Telefonanruf — Shared Logic
 *
 * Wird direkt aufgerufen von:
 * - fonio Webhook (call_analyzed → isNewLead)
 * - API Route /api/crm/lead-from-call (HTTP Wrapper)
 */

import { createClient } from "@/lib/supabase/server";
import { normalizeGermanPhone, phoneSearchSuffix } from "@/lib/telefon/phone-utils";

export interface LeadFromCallPayload {
  tenantId: string;
  callId?: string;
  callerName?: string;
  callerPhone?: string;
  callerEmail?: string;
  licenseClass?: string;
  preferredTime?: string;
  urgency?: string;
  summary?: string;
  intent?: string;
  sentiment?: string;
}

export interface LeadFromCallResult {
  success: boolean;
  schuelerId: string;
  isNew: boolean;
  message: string;
}

export function splitName(fullName: string): { vorname: string; nachname: string } {
  if (!fullName || !fullName.trim()) {
    return { vorname: "Unbekannt", nachname: "" };
  }
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { vorname: parts[0], nachname: "" };
  }
  const nachname = parts.pop() || "";
  const vorname = parts.join(" ");
  return { vorname, nachname };
}

export function normalizeLicenseClass(raw?: string): string {
  if (!raw) return "B";
  const upper = raw.toUpperCase().trim();
  const valid = ["B", "A", "A1", "A2", "AM", "BE", "B96", "BF17"];
  if (valid.includes(upper)) return upper;
  if (upper === "BF 17" || upper === "B17") return "BF17";
  if (upper === "B 96") return "B96";
  return "B";
}

export async function createLeadFromCall(body: LeadFromCallPayload): Promise<LeadFromCallResult> {
  if (!body.tenantId) {
    throw new Error("tenantId required");
  }
  if (!body.callerName && !body.callerPhone) {
    throw new Error("Mindestens Name oder Telefonnummer erforderlich");
  }

  const supabase = await createClient();
  const { vorname, nachname } = splitName(body.callerName || "");
  const fuehrerscheinklasse = normalizeLicenseClass(body.licenseClass);
  const normalizedPhone = normalizeGermanPhone(body.callerPhone);

  // 1. Duplikat-Check: Gibt es schon einen Schüler mit dieser Nummer?
  let existingSchueler = null;
  if (normalizedPhone) {
    const suffix = phoneSearchSuffix(body.callerPhone);
    const { data: existing } = await supabase
      .from("schueler")
      .select("id, vorname, nachname, status")
      .eq("tenant_id", body.tenantId)
      .ilike("telefon", `%${suffix}%`)
      .limit(1)
      .maybeSingle();

    existingSchueler = existing;
  }

  // Auch nach E-Mail suchen
  if (!existingSchueler && body.callerEmail) {
    const { data: existing } = await supabase
      .from("schueler")
      .select("id, vorname, nachname, status")
      .eq("tenant_id", body.tenantId)
      .eq("email", body.callerEmail)
      .maybeSingle();

    existingSchueler = existing;
  }

  let schuelerId: string;
  let isNew = false;

  if (existingSchueler) {
    schuelerId = existingSchueler.id;
    console.log(
      `[CRM] Bestehender Schüler gefunden: ${existingSchueler.vorname} ${existingSchueler.nachname} (${schuelerId})`
    );
  } else {
    // 2. Neuen Schüler anlegen
    const { data: newSchueler, error: insertError } = await supabase
      .from("schueler")
      .insert({
        tenant_id: body.tenantId,
        vorname,
        nachname,
        email: body.callerEmail || "",
        telefon: normalizedPhone || body.callerPhone || "",
        geburtsdatum: "2000-01-01",
        fuehrerscheinklasse,
        status: "dokumente_ausstehend",
        notizen: [
          `Quelle: Telefon-Assistent (${new Date().toLocaleDateString("de-DE")})`,
          body.summary ? `Zusammenfassung: ${body.summary}` : null,
          body.preferredTime ? `Bevorzugte Zeit: ${body.preferredTime}` : null,
          body.urgency && body.urgency !== "mittel" ? `Dringlichkeit: ${body.urgency}` : null,
          body.callId ? `Call-ID: ${body.callId}` : null,
        ]
          .filter(Boolean)
          .join("\n"),
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[CRM] Schüler-Erstellung fehlgeschlagen:", insertError);
      throw new Error(insertError.message);
    }

    schuelerId = newSchueler.id;
    isNew = true;
    console.log(`[CRM] Neuer Schüler erstellt: ${vorname} ${nachname} (${schuelerId})`);
  }

  // 3. Kommunikations-Eintrag (immer, auch bei bestehendem Schüler)
  await supabase.from("kommunikation").insert({
    tenant_id: body.tenantId,
    schueler_id: schuelerId,
    kanal: "telefon",
    richtung: "eingehend",
    betreff: `Anruf: ${body.intent || "Sonstiges"}`,
    inhalt: [
      `Intent: ${body.intent || "unbekannt"}`,
      `Stimmung: ${body.sentiment || "unbekannt"}`,
      body.summary ? `\nZusammenfassung:\n${body.summary}` : "",
      `\nCall-ID: ${body.callId || "N/A"}`,
    ].join("\n"),
  });

  // 4. Anrufe-Tabelle verknüpfen
  if (body.callId) {
    await supabase
      .from("anrufe")
      .update({ anrufer_name: `${vorname} ${nachname}`.trim() })
      .eq("call_id", body.callId)
      .eq("tenant_id", body.tenantId);
  }

  return {
    success: true,
    schuelerId,
    isNew,
    message: isNew
      ? `Neuer Schüler "${vorname} ${nachname}" erstellt`
      : `Bestehender Schüler verknüpft (${schuelerId})`,
  };
}
