import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for GET /api/admin/metrics
 * Internal business dashboard — protected via ADMIN_API_KEY.
 */

// ---------------------------------------------------------------------------
// Mock setup
// ---------------------------------------------------------------------------

const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: mockFrom,
  })),
}));

import { GET } from "@/app/api/admin/metrics/route";
import { NextRequest } from "next/server";

function makeRequest(
  params: Record<string, string> = {},
  headers: Record<string, string> = {},
) {
  const url = new URL("http://localhost/api/admin/metrics");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url, { headers });
}

function chainMock(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  const terminal = ["maybeSingle", "single", "csv"];
  [
    "select", "insert", "update", "delete", "eq", "neq", "not", "is", "in",
    "gte", "lte", "ilike", "order", "limit", "range", "maybeSingle", "single",
    "csv", "then",
  ].forEach((m) => {
    chain[m] = vi.fn((...args: unknown[]) => {
      if (m === "then") {
        const resolve = args[0] as (v: unknown) => unknown;
        return Promise.resolve(resolve(result));
      }
      return terminal.includes(m) ? result : chain;
    });
  });
  return chain;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/admin/metrics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_API_KEY = "test-admin-key";
  });

  it("returns 401 without admin key", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 401 with wrong admin key", async () => {
    const res = await GET(makeRequest({}, { "x-admin-key": "wrong-key" }));
    expect(res.status).toBe(401);
  });

  it("returns 401 when ADMIN_API_KEY env var is not set", async () => {
    delete process.env.ADMIN_API_KEY;
    const res = await GET(makeRequest({}, { "x-admin-key": "any-key" }));
    expect(res.status).toBe(401);
  });

  it("returns metrics with valid admin key", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenants") {
        return chainMock({
          data: [
            { id: "t1", slug: "fs1", name: "Fahrschule 1", plan: "pro", created_at: "2026-01-15" },
            { id: "t2", slug: "fs2", name: "Fahrschule 2", plan: "starter", created_at: "2026-02-10" },
          ],
          error: null,
        });
      }
      if (table === "schueler") {
        return chainMock({
          data: [
            { tenant_id: "t1", status: "praxis", created_at: "2026-01-20" },
            { tenant_id: "t1", status: "theorie", created_at: "2026-02-01" },
            { tenant_id: "t2", status: "angemeldet", created_at: "2026-03-01" },
          ],
          error: null,
        });
      }
      if (table === "zahlungen") {
        return chainMock({
          data: [
            { tenant_id: "t1", betrag: 500, status: "bezahlt" },
            { tenant_id: "t1", betrag: 200, status: "offen" },
          ],
          error: null,
        });
      }
      if (table === "sales_leads") {
        return chainMock({
          data: [
            { id: "l1", status: "gewonnen", created_at: "2026-03-01" },
            { id: "l2", status: "kontaktiert", created_at: "2026-03-15" },
          ],
          error: null,
        });
      }
      if (table === "follow_ups") {
        return chainMock({ data: [{ id: "fu1", status: "gesendet" }], error: null });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest({}, { "x-admin-key": "test-admin-key" }));
    expect(res.status).toBe(200);
    const json = await res.json();

    // MRR: pro(249) + starter(99) = 348
    expect(json.mrr).toBe(348);
    expect(json.arr).toBe(348 * 12);
    expect(json.totalKunden).toBe(2);
    expect(json.totalSchueler).toBe(3);
    expect(json.totalUmsatz).toBe(500); // Only bezahlt
    expect(json.kundenProPlan.pro).toBe(1);
    expect(json.kundenProPlan.starter).toBe(1);
    expect(json).toHaveProperty("avgSchuelerProKunde");
    expect(json).toHaveProperty("estimatedLTV");
    expect(json).toHaveProperty("cac");
    expect(json).toHaveProperty("kundenProMonat");
    expect(json).toHaveProperty("topKunden");
    expect(json).toHaveProperty("generatedAt");
  });

  it("calculates LTV correctly", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenants") {
        return chainMock({
          data: [{ id: "t1", slug: "fs1", name: "FS", plan: "premium", created_at: "2026-01-01" }],
          error: null,
        });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest({}, { "x-admin-key": "test-admin-key" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    // Premium = 349/month, LTV = 349 * 12 = 4188
    expect(json.estimatedLTV).toBe(4188);
    expect(json.avgPlanPrice).toBe(349);
  });

  it("handles empty data gracefully", async () => {
    mockFrom.mockReturnValue(chainMock({ data: [], error: null }));
    const res = await GET(makeRequest({}, { "x-admin-key": "test-admin-key" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.mrr).toBe(0);
    expect(json.totalKunden).toBe(0);
    expect(json.avgSchuelerProKunde).toBe(0);
  });

  it("returns top customers sorted by schueler count", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenants") {
        return chainMock({
          data: [
            { id: "t1", slug: "a", name: "Small", plan: "starter", created_at: "2026-01-01" },
            { id: "t2", slug: "b", name: "Big", plan: "pro", created_at: "2026-01-01" },
          ],
          error: null,
        });
      }
      if (table === "schueler") {
        return chainMock({
          data: [
            { tenant_id: "t2", status: "praxis", created_at: "2026-01-01" },
            { tenant_id: "t2", status: "theorie", created_at: "2026-01-01" },
            { tenant_id: "t2", status: "praxis", created_at: "2026-01-01" },
            { tenant_id: "t1", status: "angemeldet", created_at: "2026-01-01" },
          ],
          error: null,
        });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest({}, { "x-admin-key": "test-admin-key" }));
    const json = await res.json();
    expect(json.topKunden[0].name).toBe("Big");
    expect(json.topKunden[0].schueler).toBe(3);
  });
});
