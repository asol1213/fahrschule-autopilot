import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, isAuthed } from "@/lib/api-auth";

/**
 * GET /api/retell/agents?tenantId=xxx
 * Gibt den fonio.ai Agent für einen Tenant zurück
 *
 * POST /api/retell/agents
 * Erstellt/Aktualisiert ein Agent-Mapping (Agent-ID → Tenant)
 *
 * Multi-Tenant Mapping: Jede Fahrschule hat ihren eigenen fonio Agent
 * mit eigener Telefonnummer, eigenem Prompt und eigenen Preisen.
 */

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get("tenantId");
  if (!tenantId) {
    return NextResponse.json({ error: "tenantId required" }, { status: 400 });
  }

  const auth = await requireAuth(tenantId);
  if (!isAuthed(auth)) return auth;

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("retell_agents")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({
        configured: false,
        message: "Kein fonio.ai Agent für diesen Tenant konfiguriert. Bitte in den Einstellungen einrichten.",
      });
    }

    return NextResponse.json({
      configured: true,
      agent: {
        id: data.id,
        agentId: data.agent_id,
        agentName: data.agent_name,
        phoneNumber: data.phone_number,
        voiceProvider: data.voice_provider,
        voiceId: data.voice_id,
        language: data.language,
        maxDurationSeconds: data.max_duration_seconds,
        isActive: data.is_active,
        promptVersion: data.prompt_version,
        customOverrides: data.custom_prompt_overrides,
        updatedAt: data.updated_at,
      },
    });
  } catch (err) {
    console.error("[fonio Agents] GET Fehler:", err);
    return NextResponse.json({ error: "Datenbankverbindung fehlgeschlagen" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.tenantId || !body.agentId) {
      return NextResponse.json(
        { error: "tenantId und agentId erforderlich" },
        { status: 400 }
      );
    }

    const auth = await requireAuth(body.tenantId);
    if (!isAuthed(auth)) return auth;

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("retell_agents")
      .upsert(
        {
          tenant_id: body.tenantId,
          agent_id: body.agentId,
          agent_name: body.agentName || "Fahrschul-Assistent",
          phone_number: body.phoneNumber || null,
          voice_provider: body.voiceProvider || "fonio",
          voice_id: body.voiceId || null,
          language: body.language || "de-DE",
          max_duration_seconds: body.maxDurationSeconds || 300,
          is_active: body.isActive ?? true,
          prompt_version: body.promptVersion || 1,
          custom_prompt_overrides: body.customOverrides || null,
          metadata: body.metadata || null,
        },
        { onConflict: "tenant_id,agent_id" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      agent: data,
      message: `fonio Agent "${body.agentId}" für Tenant "${body.tenantId}" konfiguriert.`,
    });
  } catch (error) {
    console.error("[fonio Agents] Fehler:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
