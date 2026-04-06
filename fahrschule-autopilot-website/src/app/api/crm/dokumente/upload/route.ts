import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { requireAuth, isAuthed, rateLimit, getClientIp } from "@/lib/api-auth";

const checkLimit = rateLimit("crm-dokumente-upload", 60, 60_000);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const ALLOWED_EXTENSIONS = new Set(["pdf", "jpg", "jpeg", "png", "webp"]);

const BUCKET_NAME = "dokumente";

function getServiceSupabase() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureBucket(serviceClient: any) {
  const { data } = await serviceClient.storage.getBucket(BUCKET_NAME);
  if (!data) {
    await serviceClient.storage.createBucket(BUCKET_NAME, {
      public: false,
      fileSizeLimit: MAX_FILE_SIZE,
      allowedMimeTypes: [...ALLOWED_TYPES],
    });
  }
}

/**
 * POST /api/crm/dokumente/upload
 * Upload a document file to Supabase Storage
 * Expects multipart form data: file, dokumentId
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  try {
    const auth = await requireAuth();
    if (!isAuthed(auth)) return auth;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const dokumentId = formData.get("dokumentId") as string | null;

    if (!file || !dokumentId) {
      return NextResponse.json(
        { error: "file und dokumentId erforderlich" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Datei zu groß (max. 10 MB)" },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Dateityp nicht erlaubt. Erlaubt: PDF, JPG, PNG, WebP" },
        { status: 400 }
      );
    }

    // Validate extension
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: "Dateiendung nicht erlaubt" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get document to verify it exists and belongs to user's tenant
    const { data: dokument } = await supabase
      .from("dokumente")
      .select("id, tenant_id, schueler_id, typ")
      .eq("id", dokumentId)
      .eq("tenant_id", auth.tenantId)
      .single();

    if (!dokument) {
      return NextResponse.json({ error: "Dokument nicht gefunden" }, { status: 404 });
    }

    // Use service role client for storage (bypasses RLS)
    const serviceSupabase = getServiceSupabase();
    await ensureBucket(serviceSupabase);

    const safeExt = ext || "pdf";
    const filePath = `${dokument.tenant_id}/${dokument.schueler_id}/${dokument.typ}.${safeExt}`;

    const { error: uploadError } = await serviceSupabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: `Storage-Upload fehlgeschlagen: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Store the file path (not a public URL — bucket is private)
    await supabase
      .from("dokumente")
      .update({
        vorhanden: true,
        dateiname: file.name,
        datei_url: filePath,
        upload_datum: new Date().toISOString(),
      })
      .eq("id", dokumentId);

    return NextResponse.json({
      success: true,
      dateiUrl: filePath,
      dateiname: file.name,
    });
  } catch (err) {
    console.error("Upload route error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload fehlgeschlagen" },
      { status: 500 }
    );
  }
}
