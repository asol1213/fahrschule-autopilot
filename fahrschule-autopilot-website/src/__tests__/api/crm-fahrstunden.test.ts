import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetUser, mockFrom, mockEmitEvent, mockFahrstundenDb, mockZahlungenDb } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
  mockEmitEvent: vi.fn(),
  mockFahrstundenDb: {
    getByTenant: vi.fn(),
    getBySchueler: vi.fn(),
    getByDate: vi.fn(),
    getByDateRange: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  mockZahlungenDb: {
    create: vi.fn(),
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
  DEFAULT_PREISE: { normal: 55, sonderfahrt_ueberlandfahrt: 65, sonderfahrt_autobahnfahrt: 65, sonderfahrt_nachtfahrt: 65 },
  FAHRSTUNDEN_LABELS: { normal: "Normale Fahrstunde", sonderfahrt_ueberlandfahrt: "Sonderfahrt Ueberlandfahrt" },
}));

vi.mock("@/lib/db/store", () => ({
  fahrstundenDb: mockFahrstundenDb,
  zahlungenDb: mockZahlungenDb,
}));

vi.mock("@/lib/monitoring", () => ({
  captureError: vi.fn(),
}));

import { GET, POST, PATCH } from "@/app/api/crm/fahrstunden/route";
import { NextRequest } from "next/server";

function makeRequest(method: string, params: Record<string, string> = {}, body?: object) {
  const url = new URL("http://localhost/api/crm/fahrstunden");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url, {
    method,
    ...(body ? { body: JSON.stringify(body), headers: { "content-type": "application/json" } } : {}),
  });
}

function chainMock(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  ["select", "insert", "update", "delete", "eq", "neq", "is", "in", "gte", "lte", "order", "limit", "range", "maybeSingle", "single", "csv"].forEach(m => {
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

describe("GET /api/crm/fahrstunden", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns 401 when not authenticated", async () => {
    mockNoAuth();
    const res = await GET(makeRequest("GET", { tenantId: "t-1" }));
    expect(res.status).toBe(401);
  });

  it("returns all fahrstunden for tenant", async () => {
    mockAuth();
    mockFahrstundenDb.getByTenant.mockResolvedValue([{ id: "fs-1" }]);

    const res = await GET(makeRequest("GET", { tenantId: "tenant-1" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(1);
  });

  it("filters by schuelerId when provided", async () => {
    mockAuth();
    mockFahrstundenDb.getBySchueler.mockResolvedValue([]);

    await GET(makeRequest("GET", { tenantId: "tenant-1", schuelerId: "s-1" }));
    expect(mockFahrstundenDb.getBySchueler).toHaveBeenCalledWith("s-1", "tenant-1");
  });

  it("filters by datum when provided", async () => {
    mockAuth();
    mockFahrstundenDb.getByDate.mockResolvedValue([]);

    await GET(makeRequest("GET", { tenantId: "tenant-1", datum: "2026-01-15" }));
    expect(mockFahrstundenDb.getByDate).toHaveBeenCalledWith("tenant-1", "2026-01-15");
  });

  it("filters by date range when von and bis provided", async () => {
    mockAuth();
    mockFahrstundenDb.getByDateRange.mockResolvedValue([]);

    await GET(makeRequest("GET", { tenantId: "tenant-1", von: "2026-01-01", bis: "2026-01-31" }));
    expect(mockFahrstundenDb.getByDateRange).toHaveBeenCalledWith("tenant-1", "2026-01-01", "2026-01-31");
  });
});

describe("POST /api/crm/fahrstunden", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  const validBody = {
    tenantId: "tenant-1",
    schuelerId: "s-1",
    datum: "2026-03-15",
    uhrzeit: "10:00",
    dauer: 45,
  };

  it("returns 401 when not authenticated", async () => {
    mockNoAuth();
    const res = await POST(makeRequest("POST", {}, validBody));
    expect(res.status).toBe(401);
  });

  it("returns 400 when required fields are missing", async () => {
    mockAuth();
    const res = await POST(makeRequest("POST", {}, { tenantId: "tenant-1" }));
    expect(res.status).toBe(400);
  });

  it("creates fahrstunde and emits event", async () => {
    mockAuth();
    const created = { id: "fs-1", ...validBody };
    mockFahrstundenDb.create.mockResolvedValue(created);

    const res = await POST(makeRequest("POST", {}, validBody));
    expect(res.status).toBe(201);
    expect(mockEmitEvent).toHaveBeenCalledWith("fahrstunde.geplant", "tenant-1", expect.objectContaining({
      fahrstundeId: "fs-1",
      schuelerId: "s-1",
    }));
  });

  it("defaults typ to normal and status to geplant", async () => {
    mockAuth();
    mockFahrstundenDb.create.mockResolvedValue({ id: "fs-1" });

    await POST(makeRequest("POST", {}, validBody));
    expect(mockFahrstundenDb.create).toHaveBeenCalledWith(
      expect.objectContaining({ typ: "normal", status: "geplant" })
    );
  });
});

describe("PATCH /api/crm/fahrstunden", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns 400 when id is missing", async () => {
    mockAuth();
    const res = await PATCH(makeRequest("PATCH", {}, { tenantId: "tenant-1" }));
    expect(res.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    mockNoAuth();
    const res = await PATCH(makeRequest("PATCH", {}, { id: "fs-1", tenantId: "tenant-1" }));
    expect(res.status).toBe(401);
  });

  it("returns 404 when fahrstunde not found", async () => {
    mockAuth();
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      return chainMock({ data: null, error: null });
    });

    const res = await PATCH(makeRequest("PATCH", {}, { id: "fs-999", tenantId: "tenant-1" }));
    expect(res.status).toBe(404);
  });

  it("creates invoice when status changes to abgeschlossen", async () => {
    mockAuth();
    const current = { status: "geplant", typ: "normal", schueler_id: "s-1", tenant_id: "tenant-1", dauer: 45 };
    const updated = { id: "fs-1", status: "abgeschlossen", typ: "normal", schuelerId: "s-1", tenantId: "tenant-1", dauer: 45, datum: "2026-03-15", bewertung: 4 };

    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "fahrstunden") {
        return chainMock({ data: current, error: null });
      }
      return chainMock({ data: [], error: null });
    });
    mockFahrstundenDb.update.mockResolvedValue(updated);
    mockZahlungenDb.create.mockResolvedValue({ id: "z-1" });

    await PATCH(makeRequest("PATCH", {}, { id: "fs-1", tenantId: "tenant-1", status: "abgeschlossen" }));

    expect(mockZahlungenDb.create).toHaveBeenCalled();
    expect(mockEmitEvent).toHaveBeenCalledWith("zahlung.erstellt", "tenant-1", expect.any(Object));
    expect(mockEmitEvent).toHaveBeenCalledWith("fahrstunde.abgeschlossen", "tenant-1", expect.any(Object));
  });

  it("emits no_show event when status changes to no_show", async () => {
    mockAuth();
    const current = { status: "geplant", typ: "normal", schueler_id: "s-1", tenant_id: "tenant-1", dauer: 45 };
    const updated = { id: "fs-1", status: "no_show", tenantId: "tenant-1", schuelerId: "s-1", datum: "2026-03-15" };

    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "fahrstunden") {
        return chainMock({ data: current, error: null });
      }
      return chainMock({ data: [], error: null });
    });
    mockFahrstundenDb.update.mockResolvedValue(updated);

    await PATCH(makeRequest("PATCH", {}, { id: "fs-1", tenantId: "tenant-1", status: "no_show" }));
    expect(mockEmitEvent).toHaveBeenCalledWith("fahrstunde.no_show", "tenant-1", expect.any(Object));
  });
});
