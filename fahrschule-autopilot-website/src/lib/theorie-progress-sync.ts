/**
 * Theorie-Trainer: server-side progress sync helper
 *
 * Strategy:
 * - On load: fetch from server, merge with localStorage (highest XP wins per question)
 * - On change: debounced POST to server (3s after last change)
 * - Merge is additive: we never decrease counts, only advance timestamps
 */

const LOCAL_KEY = "theorie-progress-v2";
const SYNC_DEBOUNCE_MS = 3_000;

interface QuestionRecord {
  correct: number;
  wrong: number;
  lastAnswered: number;
  lastCorrect: boolean;
  bookmarked: boolean;
}

export interface FullProgress {
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
/*  Merge two progress records — additive, never lose data            */
/* ------------------------------------------------------------------ */
export function mergeProgress(local: FullProgress, remote: FullProgress): FullProgress {
  const today = new Date().toISOString().split("T")[0];

  // Merge per-question records: keep max correct/wrong, most recent lastAnswered
  const mergedQuestions: Record<string, QuestionRecord> = { ...remote.questions };
  for (const [id, localRec] of Object.entries(local.questions)) {
    const remoteRec = mergedQuestions[id];
    if (!remoteRec) {
      mergedQuestions[id] = localRec;
    } else {
      mergedQuestions[id] = {
        correct: Math.max(localRec.correct, remoteRec.correct),
        wrong: Math.max(localRec.wrong, remoteRec.wrong),
        lastAnswered: Math.max(localRec.lastAnswered, remoteRec.lastAnswered),
        lastCorrect:
          localRec.lastAnswered >= remoteRec.lastAnswered
            ? localRec.lastCorrect
            : remoteRec.lastCorrect,
        bookmarked: localRec.bookmarked || remoteRec.bookmarked,
      };
    }
  }

  const merged: FullProgress = {
    questions: mergedQuestions,
    xp: Math.max(local.xp, remote.xp),
    bestStreak: Math.max(local.bestStreak, remote.bestStreak),
    totalCorrect: Math.max(local.totalCorrect, remote.totalCorrect),
    totalWrong: Math.max(local.totalWrong, remote.totalWrong),
    examsPassed: Math.max(local.examsPassed, remote.examsPassed),
    examsFailed: Math.max(local.examsFailed, remote.examsFailed),
    dailyGoal: local.dailyGoal, // always use local preference
    // Reset daily counters if stale
    dailyDate: today,
    dailyDone:
      local.dailyDate === today && remote.dailyDate === today
        ? Math.max(local.dailyDone, remote.dailyDone)
        : local.dailyDate === today
        ? local.dailyDone
        : remote.dailyDate === today
        ? remote.dailyDone
        : 0,
  };

  return merged;
}

/* ------------------------------------------------------------------ */
/*  Load progress from server and merge with localStorage             */
/* ------------------------------------------------------------------ */
export async function loadAndMergeProgress(
  defaultProgress: FullProgress
): Promise<FullProgress> {
  // Read local first
  let local = defaultProgress;
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<FullProgress>;
      const today = new Date().toISOString().split("T")[0];
      if (parsed.dailyDate !== today) {
        parsed.dailyDone = 0;
        parsed.dailyDate = today;
      }
      local = { ...defaultProgress, ...parsed };
    }
  } catch {
    // ignore corrupt localStorage
  }

  // Try to fetch from server
  try {
    const res = await fetch("/api/progress/theorie", { credentials: "include" });
    if (!res.ok) return local; // Not logged in or error — use local

    const data = await res.json();
    if (!data.progress) return local; // No server data yet

    const merged = mergeProgress(local, data.progress as FullProgress);
    // Persist merged back to localStorage immediately
    localStorage.setItem(LOCAL_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    // Network error or Supabase not configured — fall back to local
    return local;
  }
}

/* ------------------------------------------------------------------ */
/*  Debounced sync to server                                          */
/* ------------------------------------------------------------------ */
let syncTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleSyncToServer(progress: FullProgress): void {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncTimer = null;
    fetch("/api/progress/theorie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(progress),
      credentials: "include",
    }).catch(() => {
      // Silent failure — localStorage is the source of truth for offline users
    });
  }, SYNC_DEBOUNCE_MS);
}

/** Flush any pending sync immediately (call on page unload / beforeunload) */
export function flushSyncToServer(progress: FullProgress): void {
  if (syncTimer) {
    clearTimeout(syncTimer);
    syncTimer = null;
  }
  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      "/api/progress/theorie",
      new Blob([JSON.stringify(progress)], { type: "application/json" })
    );
  }
}
