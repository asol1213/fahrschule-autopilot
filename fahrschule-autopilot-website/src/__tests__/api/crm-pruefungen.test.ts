import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetUser, mockFrom, mockEmitEvent, mockPruefungenDb, mockSchuelerDb } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
  mockEmitEvent: vi.fn(),
  mockPruefungenDb: {
    getByTenant: vi.fn(),
    getBySchueler: vi.fn(),
    bestehensquote: vi.fn(),
    create: vi.fn(),
  },
  mockSchuelerDb: {
    update: vi.fn(),
  },
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

vi.mock("@/lib/db/store", () => ({
  pruefungenDb: mockPruefungenDb,
  schuelerDb: mockSchuelerDb,
}));

import { GET, POST, PATCH } from "@/app/api/crm/pruefungen/route";
import { NextRequest } from "next/server";

function makeRequest(method: string, params: Record<string, string> = {}, body?: object) {
  const url = new URL("http://localhost/api/crm/pruefungen");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url, {
    method,
    ...(body ? { body: JSON.stringify(body), headers: { "content-type": "application/json" } } : {}),
  });
}

function chainMock(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  ["select", "insert", "update", "delete", "eq", "neq", "is", "in", "gte", "lte", "not", "order", "limit", "range", "maybeSingle", "single", "csv"].forEach(m => {
    chain[m] = vi.fn(() => ["maybeSingle", "single", "csv"].includes(m) ? result : chain);
  });
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

describe("GET /api/crm/pruefungen", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns 401 when not authenticated", async () => {
    mockNoAuth();
    const res = await GET(makeRequest("GET", { tenantId: "t-1" }));
    expect(res.status).toBe(401);
  });

  it("returns pruefungen by schuelerId", async () => {
    mockAuth();
    mockPruefungenDb.getBySchueler.mockResolvedValue([{ id: "p-1" }]);

    const res = await GET(makeRequest("GET", { tenantId: "tenant-1", schuelerId: "s-1" }));
    expect(res.status).toBe(200);
  });

  it("returns pruefungen with bestehensquote for tenant", async () => {
    mockAuth();
    mockPruefungenDb.getByTenant.mockResolvedValue([{ id: "p-1" }]);
    mockPruefungenDb.bestehensquote.mockResolvedValue(85);

    const res = await GET(makeRequest("GET", { tenantId: "tenant-1" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.bestehensquote).toBe(85);
  });
});

describe("POST /api/crm/pruefungen", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  const validBody = {
    tenantId: "tenant-1",
    schuelerId: "s-1",
    typ: "theorie",
    datum: "2026-04-15",
  };

  it("returns 400 when required fields are missing", async () => {
    mockAuth();
    const res = await POST(makeRequest("POST", {}, { tenantId: "tenant-1" }));
    expect(res.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    mockNoAuth();
    const res = await POST(makeRequest("POST", {}, validBody));
    expect(res.status).toBe(401);
  });

  it("creates pruefung and emits event", async () => {
    mockAuth();
    mockPruefungenDb.create.mockResolvedValue({ id: "p-1", ...validBody });

    const res = await POST(makeRequest("POST", {}, validBody));
    expect(res.status).toBe(201);
    expect(mockEmitEvent).toHaveBeenCalledWith("pruefung.geplant", "tenant-1", expect.objectContaining({
      pruefungId: "p-1",
      typ: "theorie",
    }));
  });
});

describe("PATCH /api/crm/pruefungen", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns 400 when id is missing", async () => {
    mockAuth();
    const res = await PATCH(makeRequest("PATCH", {}, { tenantId: "tenant-1" }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when pruefung not found", async () => {
    mockAuth();
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      return chainMock({ data: null, error: null });
    });

    const res = await PATCH(makeRequest("PATCH", {}, { id: "p-999", tenantId: "tenant-1" }));
    expect(res.status).toBe(404);
  });

  it("emits pruefung.bestanden event when result is bestanden", async () => {
    mockAuth();
    const current = { ergebnis: null, schueler_id: "s-1", tenant_id: "tenant-1", typ: "theorie" };
    const updated = { id: "p-1", ergebnis: "bestanden" };

    // Need two supabase calls: one for select (current), one for update
    let callCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "pruefungen") {
        callCount++;
        if (callCount <= 1) {
          return chainMock({ data: current, error: null });
        }
        return chainMock({ data: updated, error: null });
      }
      return chainMock({ data: [], error: null });
    });

    await PATCH(makeRequest("PATCH", {}, { id: "p-1", tenantId: "tenant-1", ergebnis: "bestanden" }));
    expect(mockEmitEvent).toHaveBeenCalledWith("pruefung.bestanden", "tenant-1", expect.objectContaining({
      pruefungId: "p-1",
    }));
  });

  it("auto-updates schueler status when praxis pruefung bestanden", async () => {
    mockAuth();
    const current = { ergebnis: null, schueler_id: "s-1", tenant_id: "tenant-1", typ: "praxis" };
    const updated = { id: "p-1", ergebnis: "bestanden" };

    let callCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "pruefungen") {
        callCount++;
        if (callCount <= 1) {
          return chainMock({ data: current, error: null });
        }
        return chainMock({ data: updated, error: null });
      }
      return chainMock({ data: [], error: null });
    });

    await PATCH(makeRequest("PATCH", {}, { id: "p-1", tenantId: "tenant-1", ergebnis: "bestanden" }));
    expect(mockSchuelerDb.update).toHaveBeenCalledWith("s-1", { status: "bestanden" }, "tenant-1");
    expect(mockEmitEvent).toHaveBeenCalledWith("schueler.bestanden", "tenant-1", expect.any(Object));
  });

  it("emits pruefung.nicht_bestanden event", async () => {
    mockAuth();
    const current = { ergebnis: null, schueler_id: "s-1", tenant_id: "tenant-1", typ: "theorie" };
    const updated = { id: "p-1", ergebnis: "nicht_bestanden" };

    let callCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "pruefungen") {
        callCount++;
        if (callCount <= 1) return chainMock({ data: current, error: null });
        return chainMock({ data: updated, error: null });
      }
      return chainMock({ data: [], error: null });
    });

    await PATCH(makeRequest("PATCH", {}, { id: "p-1", tenantId: "tenant-1", ergebnis: "nicht_bestanden" }));
    expect(mockEmitEvent).toHaveBeenCalledWith("pruefung.nicht_bestanden", "tenant-1", expect.any(Object));
  });
});
