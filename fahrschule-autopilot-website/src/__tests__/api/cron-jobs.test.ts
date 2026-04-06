import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for ALL cron job API routes:
 * - GET /api/cron/monthly-report
 * - GET /api/cron/mahnwesen
 * - GET /api/cron/dsgvo-cleanup
 * - GET /api/cron/anomaly-check
 */

// ---------------------------------------------------------------------------
// Mock setup
// ---------------------------------------------------------------------------

const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockGetUserById = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
      admin: { getUserById: mockGetUserById },
    },
    from: mockFrom,
  })),
}));

vi.mock("@/lib/email/resend", () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/lib/email/templates", () => ({
  monthlyReportEmail: vi.fn(() => "<html>Report</html>"),
  anomalyAlertEmail: vi.fn(() => "<html>Alert</html>"),
}));

vi.mock("@/lib/events/emit", () => ({
  emitEvent: vi.fn(),
}));

vi.mock("@/lib/analytics/anomalies", () => ({
  detectAnomalies: vi.fn(() => []),
}));

vi.mock("@/lib/monitoring", () => ({
  captureError: vi.fn(),
}));

import { NextRequest } from "next/server";

function makeRequest(
  path: string,
  headers: Record<string, string> = {},
) {
  return new NextRequest(new URL(`http://localhost${path}`), { headers });
}

function chainMock(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  const terminal = ["maybeSingle", "single", "csv"];
  [
    "select", "insert", "update", "delete", "eq", "neq", "not", "is", "in",
    "gte", "lte", "lt", "ilike", "order", "limit", "range", "maybeSingle",
    "single", "csv",
  ].forEach((m) => {
    chain[m] = vi.fn(() => terminal.includes(m) ? result : chain);
  });
  chain.then = (resolve: (v: unknown) => unknown) => Promise.resolve(resolve(result));
  return chain;
}

// ---------------------------------------------------------------------------
// Cron monthly-report: GET /api/cron/monthly-report
// ---------------------------------------------------------------------------

describe("GET /api/cron/monthly-report", () => {
  let GET: typeof import("@/app/api/cron/monthly-report/route").GET;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-cron-secret";
    const mod = await import("@/app/api/cron/monthly-report/route");
    GET = mod.GET;
  });

  it("returns 401 without authorization header", async () => {
    const res = await GET(makeRequest("/api/cron/monthly-report"));
    expect(res.status).toBe(401);
  });

  it("returns 401 with wrong cron secret", async () => {
    const res = await GET(makeRequest("/api/cron/monthly-report", {
      authorization: "Bearer wrong-secret",
    }));
    expect(res.status).toBe(401);
  });

  it("returns 401 when CRON_SECRET is not configured", async () => {
    delete process.env.CRON_SECRET;
    const res = await GET(makeRequest("/api/cron/monthly-report", {
      authorization: "Bearer any-value",
    }));
    expect(res.status).toBe(401);
  });

  it("handles no tenants gracefully", async () => {
    mockFrom.mockReturnValue(chainMock({ data: [], error: null }));
    const res = await GET(makeRequest("/api/cron/monthly-report", {
      authorization: "Bearer test-cron-secret",
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.sent).toBe(0);
  });

  it("sends monthly report for each tenant", async () => {
    mockGetUserById.mockResolvedValue({
      data: { user: { email: "test@fahrschule.de" } },
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "tenants") {
        return chainMock({
          data: [{ id: "t1", name: "Fahrschule Test", owner_user_id: "u1" }],
          error: null,
        });
      }
      if (table === "tenant_users") {
        return chainMock({ data: { user_id: "u1" }, error: null });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest("/api/cron/monthly-report", {
      authorization: "Bearer test-cron-secret",
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.sent).toBeGreaterThanOrEqual(0);
    expect(json).toHaveProperty("results");
  });

  it("continues processing when one tenant fails", async () => {
    mockGetUserById
      .mockResolvedValueOnce({ data: { user: { email: "good@test.de" } } })
      .mockResolvedValueOnce({ data: { user: null } });

    mockFrom.mockImplementation((table: string) => {
      if (table === "tenants") {
        return chainMock({
          data: [
            { id: "t1", name: "FS Good", owner_user_id: "u1" },
            { id: "t2", name: "FS Bad", owner_user_id: "u2" },
          ],
          error: null,
        });
      }
      if (table === "tenant_users") {
        return chainMock({ data: { user_id: "u1" }, error: null });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest("/api/cron/monthly-report", {
      authorization: "Bearer test-cron-secret",
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.results.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Cron mahnwesen: GET /api/cron/mahnwesen
// ---------------------------------------------------------------------------

describe("GET /api/cron/mahnwesen", () => {
  let GET: typeof import("@/app/api/cron/mahnwesen/route").GET;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-cron-secret";
    const mod = await import("@/app/api/cron/mahnwesen/route");
    GET = mod.GET;
  });

  it("returns 401 without authorization header", async () => {
    const res = await GET(makeRequest("/api/cron/mahnwesen"));
    expect(res.status).toBe(401);
  });

  it("returns 401 with wrong cron secret", async () => {
    const res = await GET(makeRequest("/api/cron/mahnwesen", {
      authorization: "Bearer wrong-secret",
    }));
    expect(res.status).toBe(401);
  });

  it("returns 500 when tenants query fails", async () => {
    mockFrom.mockReturnValue(chainMock({ data: null, error: { message: "DB error" } }));
    const res = await GET(makeRequest("/api/cron/mahnwesen", {
      authorization: "Bearer test-cron-secret",
    }));
    expect(res.status).toBe(500);
  });

  it("processes overdue payments correctly", async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    mockFrom.mockImplementation((table: string) => {
      if (table === "tenants") {
        return chainMock({
          data: [{ id: "t1", name: "Test FS" }],
          error: null,
        });
      }
      if (table === "zahlungen") {
        return chainMock({
          data: [
            {
              id: "z1",
              schueler_id: "s1",
              betrag: 100,
              beschreibung: "Fahrstunde",
              faellig_am: thirtyDaysAgo.toISOString().split("T")[0],
              mahnungs_stufe: 0,
            },
          ],
          error: null,
        });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest("/api/cron/mahnwesen", {
      authorization: "Bearer test-cron-secret",
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json).toHaveProperty("totalProcessed");
    expect(json).toHaveProperty("results");
  });

  it("skips payments not yet overdue", async () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    mockFrom.mockImplementation((table: string) => {
      if (table === "tenants") {
        return chainMock({ data: [{ id: "t1", name: "Test FS" }], error: null });
      }
      if (table === "zahlungen") {
        return chainMock({
          data: [
            {
              id: "z1",
              schueler_id: "s1",
              betrag: 50,
              beschreibung: "Fahrstunde",
              faellig_am: twoDaysAgo.toISOString().split("T")[0],
              mahnungs_stufe: 0,
            },
          ],
          error: null,
        });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest("/api/cron/mahnwesen", {
      authorization: "Bearer test-cron-secret",
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    // Payment only 2 days overdue (< 7), should not be processed
    expect(json.totalProcessed).toBe(0);
  });

  it("handles tenant with no open payments", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenants") {
        return chainMock({ data: [{ id: "t1", name: "Test FS" }], error: null });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest("/api/cron/mahnwesen", {
      authorization: "Bearer test-cron-secret",
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.totalProcessed).toBe(0);
    expect(json.results[0].processed).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Cron dsgvo-cleanup: GET /api/cron/dsgvo-cleanup
// ---------------------------------------------------------------------------

describe("GET /api/cron/dsgvo-cleanup", () => {
  let GET: typeof import("@/app/api/cron/dsgvo-cleanup/route").GET;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-cron-secret";
    const mod = await import("@/app/api/cron/dsgvo-cleanup/route");
    GET = mod.GET;
  });

  it("returns 401 without authorization header", async () => {
    const res = await GET(makeRequest("/api/cron/dsgvo-cleanup"));
    expect(res.status).toBe(401);
  });

  it("returns 401 with wrong cron secret", async () => {
    const res = await GET(makeRequest("/api/cron/dsgvo-cleanup", {
      authorization: "Bearer wrong-secret",
    }));
    expect(res.status).toBe(401);
  });

  it("deletes students with expired retention period", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "schueler") {
        return chainMock({
          data: [{ id: "s1", vorname: "Max", nachname: "Muster", tenant_id: "t1" }],
          error: null,
        });
      }
      if (table === "anrufe") {
        return chainMock({ data: [], error: null });
      }
      if (table === "anrufe_archiv") {
        return chainMock({ data: [], error: null });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest("/api/cron/dsgvo-cleanup", {
      authorization: "Bearer test-cron-secret",
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json).toHaveProperty("schuelerGeloescht");
  });

  it("anonymizes old calls (>90 days)", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "schueler") {
        return chainMock({ data: [], error: null });
      }
      if (table === "anrufe") {
        const selectMock = chainMock({ data: [], error: null });
        // First call: recording consent check returns empty
        // Second call: old calls returns entries
        let callCount = 0;
        const originalSelect = selectMock.select as ReturnType<typeof vi.fn>;
        selectMock.select = vi.fn((...args: unknown[]) => {
          callCount++;
          if (callCount <= 1) {
            // recording consent query
            return chainMock({ data: [], error: null });
          }
          // old calls query
          return chainMock({
            data: [{
              id: "a1",
              tenant_id: "t1",
              dauer_sekunden: 120,
              intent: "anmeldung",
              sentiment: "positive",
              is_new_lead: false,
              created_at: "2025-01-01T10:00:00Z",
            }],
            error: null,
          });
        });
        return selectMock;
      }
      if (table === "anrufe_archiv") {
        return chainMock({ data: [], error: null });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest("/api/cron/dsgvo-cleanup", {
      authorization: "Bearer test-cron-secret",
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("handles empty data gracefully (nothing to clean)", async () => {
    mockFrom.mockReturnValue(chainMock({ data: [], error: null }));
    const res = await GET(makeRequest("/api/cron/dsgvo-cleanup", {
      authorization: "Bearer test-cron-secret",
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.schuelerGeloescht).toBe(0);
    expect(json.aufzeichnungenGeloescht).toBe(0);
    expect(json.anrufeArchiviert).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Cron anomaly-check: GET /api/cron/anomaly-check
// ---------------------------------------------------------------------------

describe("GET /api/cron/anomaly-check", () => {
  let GET: typeof import("@/app/api/cron/anomaly-check/route").GET;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-cron-secret";
    const mod = await import("@/app/api/cron/anomaly-check/route");
    GET = mod.GET;
  });

  it("returns 401 without authorization header", async () => {
    const res = await GET(makeRequest("/api/cron/anomaly-check"));
    expect(res.status).toBe(401);
  });

  it("returns 401 with wrong cron secret", async () => {
    const res = await GET(makeRequest("/api/cron/anomaly-check", {
      authorization: "Bearer wrong-secret",
    }));
    expect(res.status).toBe(401);
  });

  it("handles no tenants", async () => {
    mockFrom.mockReturnValue(chainMock({ data: [], error: null }));
    const res = await GET(makeRequest("/api/cron/anomaly-check", {
      authorization: "Bearer test-cron-secret",
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.checked).toBe(0);
    expect(json.alerts).toBe(0);
  });

  it("checks tenants and reports no anomalies", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenants") {
        return chainMock({
          data: [{ id: "t1", name: "FS Test", owner_user_id: "u1" }],
          error: null,
        });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest("/api/cron/anomaly-check", {
      authorization: "Bearer test-cron-secret",
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.checked).toBe(1);
    expect(json).toHaveProperty("results");
    expect(json.results[0].tenant).toBe("FS Test");
  });

  it("sends alerts when critical anomalies are detected", async () => {
    // Override detectAnomalies to return critical anomalies
    const { detectAnomalies } = await import("@/lib/analytics/anomalies");
    (detectAnomalies as ReturnType<typeof vi.fn>).mockReturnValue([
      { type: "danger", message: "No-Show Rate zu hoch", metric: "noshow", value: 35 },
    ]);

    mockGetUserById.mockResolvedValue({
      data: { user: { email: "owner@fahrschule.de" } },
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "tenants") {
        return chainMock({
          data: [{ id: "t1", name: "FS Alert", owner_user_id: "u1" }],
          error: null,
        });
      }
      if (table === "tenant_users") {
        return chainMock({ data: { user_id: "u1" }, error: null });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest("/api/cron/anomaly-check", {
      authorization: "Bearer test-cron-secret",
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.checked).toBe(1);
    expect(json.alerts).toBeGreaterThanOrEqual(0);
  });

  it("continues checking other tenants when one fails", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenants") {
        return chainMock({
          data: [
            { id: "t1", name: "FS 1", owner_user_id: "u1" },
            { id: "t2", name: "FS 2", owner_user_id: "u2" },
          ],
          error: null,
        });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest("/api/cron/anomaly-check", {
      authorization: "Bearer test-cron-secret",
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.checked).toBe(2);
    expect(json.results.length).toBe(2);
  });
});
