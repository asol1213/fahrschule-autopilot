import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { requireAuth, isAuthed, rateLimit, getClientIp } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";

const checkLimit = rateLimit("crm-dokumente-download", 60, 60_000);

function getServiceSupabase() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * GET /api/crm/dokumente/download?dokumentId=...
 * Returns a signed URL for downloading a private document
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  try {
    const auth = await requireAuth();
    if (!isAuthed(auth)) return auth;

    const dokumentId = req.nextUrl.searchParams.get("dokumentId");
    if (!dokumentId) {
      return NextResponse.json({ error: "dokumentId erforderlich" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: dokument } = await supabase
      .from("dokumente")
      .select("id, tenant_id, datei_url")
      .eq("id", dokumentId)
      .eq("tenant_id", auth.tenantId)
      .single();

    if (!dokument || !dokument.datei_url) {
      return NextResponse.json({ error: "Dokument nicht gefunden" }, { status: 404 });
    }

    const serviceSupabase = getServiceSupabase();
    const { data, error } = await serviceSupabase.storage
      .from("dokumente")
      .createSignedUrl(dokument.datei_url, 60 * 5); // 5 min gültig

    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: "Download-URL konnte nicht erstellt werden" }, { status: 500 });
    }

    return NextResponse.json({ url: data.signedUrl });
  } catch (err) {
    console.error("Download route error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Fehler" },
      { status: 500 }
    );
  }
}
