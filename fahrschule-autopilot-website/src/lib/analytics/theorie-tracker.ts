/**
 * Theorie-Trainer Analytics Tracker (Client-side)
 *
 * Sendet Events an /api/analytics/theorie POST.
 * Benutzt eine anonyme User-ID (Cookie) und versucht tenantId
 * aus dem URL-Path oder localStorage zu lesen.
 *
 * Batch-basiert: Sammelt Events und sendet sie als Array alle 10 Sekunden
 * oder beim Page-Unload, um HTTP-Requests zu minimieren.
 */

type TheorieEvent = {
  eventType: "question_answered" | "quiz_completed" | "session_started" | "ai_tutor_used";
  kategorie?: string;
  richtig?: boolean;
  fehlerpunkte?: number;
  dauer?: number;
};

let eventQueue: TheorieEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let initialized = false;

function getUserId(): string {
  if (typeof window === "undefined") return "server";
  let id = getCookie("_fa_theorie_uid");
  if (!id) {
    id = "th_" + Math.random().toString(36).slice(2, 12);
    setCookie("_fa_theorie_uid", id, 365);
  }
  return id;
}

function getTenantId(): string {
  if (typeof window === "undefined") return "unknown";
  // Try URL path: /tenant-slug/theorie
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  if (pathParts.length >= 2 && pathParts[1] === "theorie") {
    return pathParts[0];
  }
  // Try localStorage (set during login)
  const stored = localStorage.getItem("tenantId");
  if (stored) return stored;
  // Default: demo tenant
  return "demo-premium";
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

function setCookie(name: string, value: string, days: number) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value};expires=${expires};path=/;SameSite=Lax`;
}

function flush() {
  if (eventQueue.length === 0) return;

  const events = [...eventQueue];
  const userId = getUserId();
  const tenantId = getTenantId();
  const payload = JSON.stringify({ tenantId, userId, events });

  // Use sendBeacon for page-unload reliability — single batch request
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    const blob = new Blob([payload], { type: "application/json" });
    const sent = navigator.sendBeacon("/api/analytics/theorie", blob);
    if (sent) {
      eventQueue = [];
    }
    // If sendBeacon returns false (queue full), events stay for next flush
  } else {
    // Optimistically clear queue, restore on failure
    eventQueue = [];
    fetch("/api/analytics/theorie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // Restore events to queue for retry on next flush
      eventQueue.unshift(...events);
    });
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flush();
    flushTimer = null;
  }, 10_000); // Flush every 10 seconds
}

function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  window.addEventListener("beforeunload", flush);
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
}

/**
 * Track a theorie event. Call from TheorieApp.
 */
export function trackTheorieEvent(event: TheorieEvent) {
  init();
  eventQueue.push(event);
  scheduleFlush();
}

/**
 * Convenience: Track that a question was answered.
 */
export function trackQuestionAnswered(kategorie: string, richtig: boolean) {
  trackTheorieEvent({ eventType: "question_answered", kategorie, richtig });
}

/**
 * Convenience: Track that a quiz/exam was completed.
 */
export function trackQuizCompleted(fehlerpunkte: number, dauer: number) {
  trackTheorieEvent({ eventType: "quiz_completed", fehlerpunkte, dauer });
}

/**
 * Convenience: Track that the AI tutor was used.
 */
export function trackAITutorUsed(kategorie?: string) {
  trackTheorieEvent({ eventType: "ai_tutor_used", kategorie });
}

/**
 * Convenience: Track session start.
 */
export function trackSessionStarted() {
  trackTheorieEvent({ eventType: "session_started" });
}
