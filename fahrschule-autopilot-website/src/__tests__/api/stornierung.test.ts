import { describe, it, expect } from "vitest";

/**
 * Tests for the stornierung (cancellation) business logic.
 *
 * The actual route handler depends on Supabase and requireAuth, which makes
 * it hard to test end-to-end without those services. Instead, we extract
 * and test the pure business logic: the 24h rule, fee calculation, and
 * input validation via the StornierungSchema.
 */

import { StornierungSchema } from "@/lib/validation";

// ---------------------------------------------------------------------------
// Extracted business logic (mirrors route.ts calculations)
// ---------------------------------------------------------------------------

/**
 * Calculate hours remaining until a lesson.
 * This is the core of the 24h cancellation rule.
 */
function hoursUntilLesson(datum: string, uhrzeit: string, now: Date = new Date()): number {
  const lessonDateTime = new Date(`${datum}T${uhrzeit}`);
  return (lessonDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
}

/**
 * Determine whether a cancellation is "late" (< 24h before the lesson).
 */
function isLateCancel(datum: string, uhrzeit: string, now: Date = new Date()): boolean {
  return hoursUntilLesson(datum, uhrzeit, now) < 24;
}

/**
 * The late cancellation fee as defined in the route.
 * 50% of a standard lesson price, hardcoded at 27.50.
 */
const STORNO_GEBUEHR = 27.50;

/**
 * Calculate the due date for a cancellation fee (7 days from now).
 */
function stornoFaelligAm(now: Date = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
}

// ---------------------------------------------------------------------------
// Tests: Input validation
// ---------------------------------------------------------------------------

describe("Stornierung input validation", () => {
  it("rejects missing fahrstundeId", () => {
    const result = StornierungSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects empty string fahrstundeId", () => {
    const result = StornierungSchema.safeParse({ fahrstundeId: "" });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID fahrstundeId", () => {
    const result = StornierungSchema.safeParse({ fahrstundeId: "abc-123" });
    expect(result.success).toBe(false);
  });

  it("accepts valid UUID fahrstundeId", () => {
    const result = StornierungSchema.safeParse({
      fahrstundeId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Tests: 24h rule calculation
// ---------------------------------------------------------------------------

describe("24h cancellation rule", () => {
  it("flags cancellation < 24h before lesson as late", () => {
    // Lesson at 2025-06-15 10:00, cancelling at 2025-06-14 14:00 (20h before)
    const now = new Date("2025-06-14T14:00:00");
    expect(isLateCancel("2025-06-15", "10:00:00", now)).toBe(true);
  });

  it("allows cancellation >= 24h before lesson", () => {
    // Lesson at 2025-06-15 10:00, cancelling at 2025-06-14 09:00 (25h before)
    const now = new Date("2025-06-14T09:00:00");
    expect(isLateCancel("2025-06-15", "10:00:00", now)).toBe(false);
  });

  it("exactly 24h before is NOT a late cancel", () => {
    // Lesson at 2025-06-15 10:00, cancelling at 2025-06-14 10:00 (exactly 24h)
    const now = new Date("2025-06-14T10:00:00");
    // 24h - 24h = 0, which is NOT < 24
    expect(isLateCancel("2025-06-15", "10:00:00", now)).toBe(false);
  });

  it("cancellation after lesson time is a late cancel", () => {
    // Lesson in the past
    const now = new Date("2025-06-15T12:00:00");
    expect(isLateCancel("2025-06-15", "10:00:00", now)).toBe(true);
  });

  it("calculates hours correctly across midnight", () => {
    // Lesson tomorrow at 08:00, cancelling today at 22:00 (10h before)
    const now = new Date("2025-06-14T22:00:00");
    const hours = hoursUntilLesson("2025-06-15", "08:00:00", now);
    expect(hours).toBe(10);
  });

  it("handles 23:59 edge case (1 minute before the 24h mark)", () => {
    // Lesson at 10:00 tomorrow, cancelling at 10:01 today (23h59m)
    const now = new Date("2025-06-14T10:01:00");
    expect(isLateCancel("2025-06-15", "10:00:00", now)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Tests: Cancellation fee
// ---------------------------------------------------------------------------

describe("Stornierungsgebuehr", () => {
  it("late cancel fee is 27.50 EUR", () => {
    expect(STORNO_GEBUEHR).toBe(27.50);
  });

  it("no fee when cancel is on time", () => {
    const now = new Date("2025-06-14T08:00:00");
    const lateCancel = isLateCancel("2025-06-15", "10:00:00", now);
    const fee = lateCancel ? STORNO_GEBUEHR : 0;
    expect(fee).toBe(0);
  });

  it("applies fee when cancel is late", () => {
    const now = new Date("2025-06-15T08:00:00");
    const lateCancel = isLateCancel("2025-06-15", "10:00:00", now);
    const fee = lateCancel ? STORNO_GEBUEHR : 0;
    expect(fee).toBe(27.50);
  });
});

// ---------------------------------------------------------------------------
// Tests: Due date calculation
// ---------------------------------------------------------------------------

describe("Storno fee due date", () => {
  it("due date is 7 days from now", () => {
    const now = new Date("2025-06-15T12:00:00Z");
    const faellig = stornoFaelligAm(now);
    expect(faellig).toBe("2025-06-22");
  });

  it("handles month boundary", () => {
    const now = new Date("2025-06-28T12:00:00Z");
    const faellig = stornoFaelligAm(now);
    expect(faellig).toBe("2025-07-05");
  });

  it("handles year boundary", () => {
    const now = new Date("2025-12-28T12:00:00Z");
    const faellig = stornoFaelligAm(now);
    expect(faellig).toBe("2026-01-04");
  });
});
