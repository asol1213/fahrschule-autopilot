import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/api-auth";

const checkLimit = rateLimit("auth-student", 10, 60_000);

/**
 * Student Registration API
 * POST /api/auth/student — Register a new student with invite code
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  try {
    const contentLength = parseInt(req.headers.get("content-length") || "0", 10);
    if (contentLength > 4_096) {
      return NextResponse.json({ error: "Anfrage zu groß." }, { status: 413 });
    }

    const body = await req.json();
    const { email, password, name, inviteCode } = body as {
      email?: string;
      password?: string;
      name?: string;
      inviteCode?: string;
    };

    // Validation
    if (!email || !password || !inviteCode) {
      return NextResponse.json(
        { error: "E-Mail, Passwort und Einladungscode sind erforderlich." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Passwort muss mindestens 8 Zeichen lang sein." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Validate invite code
    const { data: invite, error: inviteErr } = await supabase
      .from("student_invites")
      .select("id, tenant_id, max_uses, used_count, expires_at")
      .eq("code", inviteCode.trim().toUpperCase())
      .maybeSingle();

    if (inviteErr || !invite) {
      return NextResponse.json(
        { error: "Ungültiger Einladungscode." },
        { status: 400 }
      );
    }

    if (invite.used_count >= invite.max_uses) {
      return NextResponse.json(
        { error: "Einladungscode wurde bereits zu oft verwendet." },
        { status: 400 }
      );
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Einladungscode ist abgelaufen." },
        { status: 400 }
      );
    }

    // Create auth user
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: "student",
          name: name?.trim() || "",
        },
      },
    });

    if (authErr || !authData.user) {
      if (authErr?.message?.includes("already registered")) {
        return NextResponse.json(
          { error: "Diese E-Mail ist bereits registriert. Bitte melde dich an." },
          { status: 409 }
        );
      }
      console.error("[student-register]", authErr);
      return NextResponse.json(
        { error: "Registrierung fehlgeschlagen. Bitte versuche es erneut." },
        { status: 500 }
      );
    }

    // Create student record
    const { error: studentErr } = await supabase.from("students").insert({
      user_id: authData.user.id,
      tenant_id: invite.tenant_id,
      name: name?.trim() || "",
      invite_id: invite.id,
    });

    if (studentErr) {
      console.error("[student-register] student insert:", studentErr);
      // Auth user was created — don't leave them stranded, just log the error
    }

    // Increment invite usage
    await supabase
      .from("student_invites")
      .update({ used_count: invite.used_count + 1 })
      .eq("id", invite.id);

    return NextResponse.json({
      ok: true,
      message: "Registrierung erfolgreich! Du kannst dich jetzt anmelden.",
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes("nicht konfiguriert")) {
      return NextResponse.json(
        { error: "Supabase ist nicht konfiguriert." },
        { status: 503 }
      );
    }
    console.error("[student-register]", err);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten." },
      { status: 500 }
    );
  }
}
