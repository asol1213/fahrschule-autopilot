import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/api-auth";

const checkLimit = rateLimit("progress-theorie", 30, 60_000);

/* ------------------------------------------------------------------ */
/*  Types mirroring client-side FullProgress                           */
/* ------------------------------------------------------------------ */
interface QuestionRecord {
  correct: number;
  wrong: number;
  lastAnswered: number;
  lastCorrect: boolean;
  bookmarked: boolean;
}

interface ProgressPayload {
  questions: Record<string, QuestionRecord>;
  xp: number;
  bestStreak: number;
  totalCorrect: number;
  totalWrong: number;
  dailyGoal: number;
  dailyDone: number;
  dailyDate: string;
  examsPassed: number;
  examsFailed: number;
}

/* ------------------------------------------------------------------ */
/*  GET — load progress for the authenticated user                     */
/* ------------------------------------------------------------------ */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("theorie_progress")
      .select("xp, best_streak, total_correct, total_wrong, exams_passed, exams_failed, daily_goal, daily_done, daily_date, questions")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ progress: null });

    const progress: ProgressPayload = {
      questions: (data.questions as Record<string, QuestionRecord>) ?? {},
      xp: data.xp ?? 0,
      bestStreak: data.best_streak ?? 0,
      totalCorrect: data.total_correct ?? 0,
      totalWrong: data.total_wrong ?? 0,
      dailyGoal: data.daily_goal ?? 20,
      dailyDone: data.daily_done ?? 0,
      dailyDate: data.daily_date ?? new Date().toISOString().split("T")[0],
      examsPassed: data.exams_passed ?? 0,
      examsFailed: data.exams_failed ?? 0,
    };

    return NextResponse.json({ progress });
  } catch (err) {
    if (err instanceof Error && err.message.includes("nicht konfiguriert")) {
      return NextResponse.json({ progress: null }); // Supabase not set up yet
    }
    console.error("[theorie-progress GET]", err);
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  POST — upsert progress for the authenticated user                  */
/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (checkLimit(ip)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }
  try {
    const contentLength = parseInt(req.headers.get("content-length") || "0", 10);
    if (contentLength > 512_000) {
      return NextResponse.json({ error: "Payload zu groß" }, { status: 413 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }

    const body: ProgressPayload = await req.json();

    // Basic validation
    if (typeof body.xp !== "number" || body.xp < 0) {
      return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
    }

    const { error } = await supabase.from("theorie_progress").upsert(
      {
        user_id: user.id,
        xp: Math.floor(body.xp),
        best_streak: Math.floor(body.bestStreak ?? 0),
        total_correct: Math.floor(body.totalCorrect ?? 0),
        total_wrong: Math.floor(body.totalWrong ?? 0),
        exams_passed: Math.floor(body.examsPassed ?? 0),
        exams_failed: Math.floor(body.examsFailed ?? 0),
        daily_goal: Math.floor(body.dailyGoal ?? 20),
        daily_done: Math.floor(body.dailyDone ?? 0),
        daily_date: body.dailyDate ?? new Date().toISOString().split("T")[0],
        questions: body.questions ?? {},
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message.includes("nicht konfiguriert")) {
      return NextResponse.json({ ok: true }); // Silently succeed if not configured
    }
    console.error("[theorie-progress POST]", err);
    return NextResponse.json({ error: "Fehler beim Speichern" }, { status: 500 });
  }
}
