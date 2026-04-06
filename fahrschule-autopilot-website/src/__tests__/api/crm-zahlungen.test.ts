import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetUser, mockFrom, mockEmitEvent, mockZahlungenDb } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
  mockEmitEvent: vi.fn(),
  mockZahlungenDb: {
    getByTenant: vi.fn(),
    getBySchueler: vi.fn(),
    getOffene: vi.fn(),
    summe: vi.fn(),
    create: vi.fn(),
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
  zahlungenDb: mockZahlungenDb,
}));

vi.mock("@/lib/monitoring", () => ({
  captureError: vi.fn(),
}));

import { GET, POST, PATCH } from "@/app/api/crm/zahlungen/route";
import { NextRequest } from "next/server";

function makeRequest(method: string, params: Record<string, string> = {}, body?: object) {
  const url = new URL("http://localhost/api/crm/zahlungen");
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

describe("GET /api/crm/zahlungen", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns 401 when not authenticated", async () => {
    mockNoAuth();
    const res = await GET(makeRequest("GET", { tenantId: "t-1" }));
    expect(res.status).toBe(401);
  });

  it("returns zahlungen by schuelerId", async () => {
    mockAuth();
    mockZahlungenDb.getBySchueler.mockResolvedValue([{ id: "z-1", betrag: 55 }]);

    const res = await GET(makeRequest("GET", { tenantId: "tenant-1", schuelerId: "s-1" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(1);
  });

  it("returns offene zahlungen when status=offen", async () => {
    mockAuth();
    mockZahlungenDb.getOffene.mockResolvedValue([]);

    const res = await GET(makeRequest("GET", { tenantId: "tenant-1", status: "offen" }));
    expect(res.status).toBe(200);
    expect(mockZahlungenDb.getOffene).toHaveBeenCalledWith("tenant-1");
  });

  it("returns all zahlungen with summaries for tenant", async () => {
    mockAuth();
    mockZahlungenDb.getByTenant.mockResolvedValue([{ id: "z-1", betrag: 55 }]);
    mockZahlungenDb.summe.mockResolvedValue(55);

    const res = await GET(makeRequest("GET", { tenantId: "tenant-1" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toBeDefined();
    expect(json.summeOffen).toBeDefined();
  });
});

describe("POST /api/crm/zahlungen", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  const validBody = {
    tenantId: "tenant-1",
    schuelerId: "s-1",
    betrag: 55,
    beschreibung: "Fahrstunde",
    faelligAm: "2026-04-01",
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

  it("creates zahlung with valid data", async () => {
    mockAuth();
    mockZahlungenDb.create.mockResolvedValue({ id: "z-1", ...validBody });

    const res = await POST(makeRequest("POST", {}, validBody));
    expect(res.status).toBe(201);
  });

  it("defaults status to offen", async () => {
    mockAuth();
    mockZahlungenDb.create.mockResolvedValue({ id: "z-1" });

    await POST(makeRequest("POST", {}, validBody));
    expect(mockZahlungenDb.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: "offen" })
    );
  });
});

describe("PATCH /api/crm/zahlungen", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns 400 when id is missing", async () => {
    mockAuth();
    const res = await PATCH(makeRequest("PATCH", {}, { tenantId: "tenant-1" }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when zahlung not found", async () => {
    mockAuth();
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      return chainMock({ data: null, error: null });
    });

    const res = await PATCH(makeRequest("PATCH", {}, { id: "z-999", tenantId: "tenant-1" }));
    expect(res.status).toBe(404);
  });

  it("emits zahlung.bezahlt event when status changes to bezahlt", async () => {
    mockAuth();
    const current = { status: "offen", schueler_id: "s-1", tenant_id: "tenant-1", betrag: 55 };
    const updated = { id: "z-1", status: "bezahlt", schuelerId: "s-1", tenantId: "tenant-1", betrag: 55 };

    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "zahlungen") {
        return chainMock({ data: current, error: null });
      }
      return chainMock({ data: [], error: null });
    });
    mockZahlungenDb.update.mockResolvedValue(updated);

    await PATCH(makeRequest("PATCH", {}, { id: "z-1", tenantId: "tenant-1", status: "bezahlt" }));
    expect(mockEmitEvent).toHaveBeenCalledWith("zahlung.bezahlt", "tenant-1", expect.objectContaining({
      zahlungId: "z-1",
      betrag: 55,
    }));
  });

  it("emits zahlung.ueberfaellig event when status changes to ueberfaellig", async () => {
    mockAuth();
    const current = { status: "offen", schueler_id: "s-1", tenant_id: "tenant-1", betrag: 55 };
    const updated = { id: "z-1", status: "ueberfaellig" };

    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "zahlungen") {
        return chainMock({ data: current, error: null });
      }
      return chainMock({ data: [], error: null });
    });
    mockZahlungenDb.update.mockResolvedValue(updated);

    await PATCH(makeRequest("PATCH", {}, { id: "z-1", tenantId: "tenant-1", status: "ueberfaellig" }));
    expect(mockEmitEvent).toHaveBeenCalledWith("zahlung.ueberfaellig", "tenant-1", expect.any(Object));
  });
});
