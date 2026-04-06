import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetUser, mockFrom, mockEmitEvent } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
  mockEmitEvent: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

vi.mock("@/lib/events/emit", () => ({
  emitEvent: (...args: unknown[]) => mockEmitEvent(...args),
}));

import { POST } from "@/app/api/crm/mahnwesen/route";
import { NextRequest } from "next/server";

function makeRequest(body?: object, headers: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/crm/mahnwesen");
  return new NextRequest(url, {
    method: "POST",
    ...(body ? { body: JSON.stringify(body), headers: { "content-type": "application/json", ...headers } } : {}),
  });
}

function chainMock(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  ["select", "insert", "update", "delete", "eq", "neq", "is", "in", "gte", "lte", "order", "limit", "range", "maybeSingle", "single", "csv"].forEach(m => {
    chain[m] = vi.fn(() => ["maybeSingle", "single", "csv"].includes(m) ? result : chain);
  });
  chain.then = (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) => Promise.resolve(result).then(resolve, reject);
  return chain;
}

function mockAuth(userId = "user-1", tenantId = "tenant-1", role = "inhaber") {
  mockGetUser.mockResolvedValue({ data: { user: { id: userId } } });
  mockFrom.mockImplementation((table: string) => {
    if (table === "tenant_users") {
      return chainMock({ data: { tenant_id: tenantId, role }, error: null });
    }
    return chainMock({ data: [], error: null });
  });
}

function mockNoAuth() {
  mockGetUser.mockResolvedValue({ data: { user: null } });
}

describe("POST /api/crm/mahnwesen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CRON_SECRET;
  });

  it("returns 400 when tenantId is missing", async () => {
    mockAuth();
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 401 when not authenticated (no session, no cron secret)", async () => {
    mockNoAuth();
    const res = await POST(makeRequest({ tenantId: "tenant-1" }));
    expect(res.status).toBe(401);
  });

  it("allows access with valid CRON_SECRET", async () => {
    process.env.CRON_SECRET = "test-cron-secret";
    mockNoAuth();
    mockFrom.mockImplementation((table: string) => {
      if (table === "zahlungen") {
        return chainMock({ data: [], error: null });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await POST(makeRequest(
      { tenantId: "tenant-1" },
      { Authorization: "Bearer test-cron-secret" }
    ));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.processed).toBe(0);
  });

  it("returns no mahnungen when no open payments", async () => {
    mockAuth();
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "zahlungen") {
        return chainMock({ data: [], error: null });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await POST(makeRequest({ tenantId: "tenant-1" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.processed).toBe(0);
  });

  it("processes overdue payments with stage escalation", async () => {
    mockAuth();

    // Payment overdue by 8 days (should get stufe 1)
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
    const faelligAm = eightDaysAgo.toISOString().split("T")[0];

    const updateChain = chainMock({ data: null, error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "zahlungen") {
        // First call returns overdue payments, subsequent calls are updates
        return chainMock({
          data: [{ id: "z-1", schueler_id: "s-1", betrag: 55, beschreibung: "Test", faellig_am: faelligAm, mahnungs_stufe: 0, status: "offen" }],
          error: null,
        });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await POST(makeRequest({ tenantId: "tenant-1" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.processed).toBe(1);
    expect(mockEmitEvent).toHaveBeenCalledWith("zahlung.mahnung", "tenant-1", expect.objectContaining({
      stufe: 1,
      aktion: "freundliche_erinnerung",
    }));
  });

  it("skips payments not yet 7 days overdue", async () => {
    mockAuth();

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const faelligAm = threeDaysAgo.toISOString().split("T")[0];

    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "zahlungen") {
        return chainMock({
          data: [{ id: "z-1", schueler_id: "s-1", betrag: 55, beschreibung: "Test", faellig_am: faelligAm, mahnungs_stufe: 0, status: "offen" }],
          error: null,
        });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await POST(makeRequest({ tenantId: "tenant-1" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.processed).toBe(0);
  });

  it("escalates to stufe 2 (mahnung) after 14 days", async () => {
    mockAuth();

    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    const faelligAm = fifteenDaysAgo.toISOString().split("T")[0];

    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "zahlungen") {
        return chainMock({
          data: [{ id: "z-1", schueler_id: "s-1", betrag: 55, beschreibung: "Test", faellig_am: faelligAm, mahnungs_stufe: 1, status: "offen" }],
          error: null,
        });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await POST(makeRequest({ tenantId: "tenant-1" }));
    const json = await res.json();
    expect(json.processed).toBe(1);
    expect(mockEmitEvent).toHaveBeenCalledWith("zahlung.mahnung", "tenant-1", expect.objectContaining({
      stufe: 2,
      aktion: "mahnung",
    }));
  });

  it("escalates to stufe 3 (letzte_warnung) after 21 days", async () => {
    mockAuth();

    const twentyTwoDaysAgo = new Date();
    twentyTwoDaysAgo.setDate(twentyTwoDaysAgo.getDate() - 22);
    const faelligAm = twentyTwoDaysAgo.toISOString().split("T")[0];

    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "zahlungen") {
        return chainMock({
          data: [{ id: "z-1", schueler_id: "s-1", betrag: 55, beschreibung: "Test", faellig_am: faelligAm, mahnungs_stufe: 2, status: "ueberfaellig" }],
          error: null,
        });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await POST(makeRequest({ tenantId: "tenant-1" }));
    const json = await res.json();
    expect(json.processed).toBe(1);
    expect(mockEmitEvent).toHaveBeenCalledWith("zahlung.mahnung", "tenant-1", expect.objectContaining({
      stufe: 3,
      aktion: "letzte_warnung",
    }));
  });
});
