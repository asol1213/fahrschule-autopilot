import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock setup — vi.hoisted ensures variables exist before vi.mock hoisting
// ---------------------------------------------------------------------------

const { mockGetUser, mockFrom, mockEmitEvent, mockSchuelerDb } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
  mockEmitEvent: vi.fn(),
  mockSchuelerDb: {
    getByTenant: vi.fn(),
    getByStatus: vi.fn(),
    search: vi.fn(),
    create: vi.fn(),
    getById: vi.fn(),
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
  schuelerDb: mockSchuelerDb,
}));

vi.mock("@/lib/monitoring", () => ({
  captureError: vi.fn(),
}));

import { GET, POST, PATCH } from "@/app/api/crm/schueler/route";
import { NextRequest } from "next/server";

function makeRequest(method: string, params: Record<string, string> = {}, body?: object) {
  const url = new URL("http://localhost/api/crm/schueler");
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

function mockWrongTenant() {
  mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  mockFrom.mockImplementation((table: string) => {
    if (table === "tenant_users") {
      return chainMock({ data: null, error: null });
    }
    return chainMock({ data: [], error: null });
  });
}

describe("GET /api/crm/schueler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when tenantId is missing", async () => {
    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    mockNoAuth();
    const res = await GET(makeRequest("GET", { tenantId: "t-1" }));
    expect(res.status).toBe(401);
  });

  it("returns 403 when user does not belong to tenant", async () => {
    mockWrongTenant();
    const res = await GET(makeRequest("GET", { tenantId: "t-wrong" }));
    expect(res.status).toBe(403);
  });

  it("returns all schueler for tenant", async () => {
    mockAuth();
    const mockData = [{ id: "s-1", vorname: "Max", nachname: "Muster" }];
    mockSchuelerDb.getByTenant.mockResolvedValue(mockData);

    const res = await GET(makeRequest("GET", { tenantId: "tenant-1" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual(mockData);
    expect(json.total).toBe(1);
  });

  it("filters by status when status param is provided", async () => {
    mockAuth();
    mockSchuelerDb.getByStatus.mockResolvedValue([]);

    await GET(makeRequest("GET", { tenantId: "tenant-1", status: "aktiv" }));
    expect(mockSchuelerDb.getByStatus).toHaveBeenCalledWith("tenant-1", "aktiv");
  });

  it("searches when search param is provided", async () => {
    mockAuth();
    mockSchuelerDb.search.mockResolvedValue([]);

    await GET(makeRequest("GET", { tenantId: "tenant-1", search: "Max" }));
    expect(mockSchuelerDb.search).toHaveBeenCalledWith("tenant-1", "Max");
  });
});

describe("POST /api/crm/schueler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validBody = {
    tenantId: "tenant-1",
    vorname: "Max",
    nachname: "Muster",
    email: "max@test.de",
    telefon: "+4915112345678",
    geburtsdatum: "2000-01-15",
    fuehrerscheinklasse: "B",
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

  it("creates schueler with valid data", async () => {
    mockAuth();
    const created = { id: "s-1", ...validBody };
    mockSchuelerDb.create.mockResolvedValue(created);

    const res = await POST(makeRequest("POST", {}, validBody));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.id).toBe("s-1");
  });

  it("returns 500 when creation fails", async () => {
    mockAuth();
    mockSchuelerDb.create.mockResolvedValue(null);

    const res = await POST(makeRequest("POST", {}, validBody));
    expect(res.status).toBe(500);
  });
});

describe("PATCH /api/crm/schueler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when id is missing", async () => {
    mockAuth();
    const res = await PATCH(makeRequest("PATCH", {}, { tenantId: "tenant-1" }));
    expect(res.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    mockNoAuth();
    const res = await PATCH(makeRequest("PATCH", {}, { id: "s-1", tenantId: "tenant-1" }));
    expect(res.status).toBe(401);
  });

  it("returns 404 when schueler not found", async () => {
    mockAuth();
    mockSchuelerDb.getById.mockResolvedValue(null);

    const res = await PATCH(makeRequest("PATCH", {}, { id: "s-999", tenantId: "tenant-1" }));
    expect(res.status).toBe(404);
  });

  it("updates schueler successfully", async () => {
    mockAuth();
    const current = { id: "s-1", status: "angemeldet", tenantId: "tenant-1" };
    const updated = { ...current, vorname: "Updated" };
    mockSchuelerDb.getById.mockResolvedValue(current);
    mockSchuelerDb.update.mockResolvedValue(updated);

    const res = await PATCH(makeRequest("PATCH", {}, { id: "s-1", tenantId: "tenant-1", vorname: "Updated" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.vorname).toBe("Updated");
  });

  it("emits status change event when status changes", async () => {
    mockAuth();
    const current = { id: "s-1", status: "angemeldet", tenantId: "tenant-1" };
    const updated = { id: "s-1", status: "theorie", tenantId: "tenant-1", vorname: "Max", nachname: "Muster" };
    mockSchuelerDb.getById.mockResolvedValue(current);
    mockSchuelerDb.update.mockResolvedValue(updated);

    await PATCH(makeRequest("PATCH", {}, { id: "s-1", tenantId: "tenant-1", status: "theorie" }));
    expect(mockEmitEvent).toHaveBeenCalledWith("schueler.status_geaendert", "tenant-1", expect.objectContaining({
      schuelerId: "s-1",
      alterStatus: "angemeldet",
      neuerStatus: "theorie",
    }));
  });

  it("emits bestanden event when status changes to bestanden", async () => {
    mockAuth();
    const current = { id: "s-1", status: "praxis", tenantId: "tenant-1" };
    const updated = { id: "s-1", status: "bestanden", tenantId: "tenant-1", vorname: "Max", nachname: "Muster" };
    mockSchuelerDb.getById.mockResolvedValue(current);
    mockSchuelerDb.update.mockResolvedValue(updated);

    await PATCH(makeRequest("PATCH", {}, { id: "s-1", tenantId: "tenant-1", status: "bestanden" }));
    expect(mockEmitEvent).toHaveBeenCalledWith("schueler.bestanden", "tenant-1", expect.objectContaining({
      schuelerId: "s-1",
    }));
  });
});
