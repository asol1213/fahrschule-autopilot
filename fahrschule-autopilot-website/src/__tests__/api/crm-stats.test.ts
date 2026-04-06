import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetUser, mockFrom } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

import { GET } from "@/app/api/crm/stats/route";
import { NextRequest } from "next/server";

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/crm/stats");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url, { method: "GET" });
}

function chainMock(result: { data: unknown; error: unknown; count?: number }) {
  const chain: Record<string, unknown> = {};
  ["select", "insert", "update", "delete", "eq", "neq", "is", "in", "gte", "lte", "not", "order", "limit", "range", "maybeSingle", "single", "csv", "head"].forEach(m => {
    chain[m] = vi.fn(() => {
      if (["maybeSingle", "single", "csv"].includes(m)) return result;
      return chain;
    });
  });
  chain.then = (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) => Promise.resolve(result).then(resolve, reject);
  return chain;
}

function mockAuth(userId = "user-1", tenantId = "tenant-1", role = "inhaber") {
  mockGetUser.mockResolvedValue({ data: { user: { id: userId } } });
}

function mockNoAuth() {
  mockGetUser.mockResolvedValue({ data: { user: null } });
}

describe("GET /api/crm/stats", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns 400 when tenantId is missing", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    mockNoAuth();
    const res = await GET(makeRequest({ tenantId: "t-1" }));
    expect(res.status).toBe(401);
  });

  it("returns aggregated stats for valid tenant", async () => {
    mockAuth();
    // Mock all the parallel supabase calls
    let callCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "schueler") {
        callCount++;
        if (callCount <= 1) {
          // count query
          return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ is: vi.fn().mockResolvedValue({ count: 25 }) }) }) };
        }
        // status query
        return chainMock({ data: [{ status: "angemeldet" }, { status: "theorie" }, { status: "theorie" }], error: null });
      }
      if (table === "zahlungen") {
        return chainMock({ data: [{ betrag: 55 }, { betrag: 110 }], error: null });
      }
      if (table === "fahrstunden") {
        return chainMock({ data: [{ id: "fs-1" }], error: null });
      }
      if (table === "pruefungen") {
        return chainMock({ data: [{ ergebnis: "bestanden" }, { ergebnis: "nicht_bestanden" }], error: null });
      }
      if (table === "dokumente") {
        return chainMock({ data: [{ id: "d-1" }], error: null });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest({ tenantId: "tenant-1" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.bestehensquote).toBeDefined();
    expect(json.offeneZahlungen).toBeDefined();
  });

  it("handles empty data gracefully", async () => {
    mockAuth();
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "schueler") {
        return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ is: vi.fn().mockResolvedValue({ count: 0, data: [] }) }) }) };
      }
      return chainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest({ tenantId: "tenant-1" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.totalSchueler).toBe(0);
    expect(json.bestehensquote).toBe(0);
  });
});
