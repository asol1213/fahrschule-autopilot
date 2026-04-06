import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetUser, mockFrom, mockEmitEvent, mockDokumenteDb, mockSchuelerDb } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
  mockEmitEvent: vi.fn(),
  mockDokumenteDb: {
    getBySchueler: vi.fn(),
    getFehlende: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  mockSchuelerDb: {
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
  dokumenteDb: mockDokumenteDb,
  schuelerDb: mockSchuelerDb,
}));

import { GET, POST, PATCH } from "@/app/api/crm/dokumente/route";
import { NextRequest } from "next/server";

function makeRequest(method: string, params: Record<string, string> = {}, body?: object) {
  const url = new URL("http://localhost/api/crm/dokumente");
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

describe("GET /api/crm/dokumente", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns 401 when not authenticated", async () => {
    mockNoAuth();
    const res = await GET(makeRequest("GET", { tenantId: "t-1", schuelerId: "s-1" }));
    expect(res.status).toBe(401);
  });

  it("returns dokumente by schuelerId", async () => {
    mockAuth();
    mockDokumenteDb.getBySchueler.mockResolvedValue([{ id: "d-1", typ: "sehtest" }]);

    const res = await GET(makeRequest("GET", { tenantId: "tenant-1", schuelerId: "s-1" }));
    expect(res.status).toBe(200);
  });

  it("returns fehlende dokumente when fehlend=true", async () => {
    mockAuth();
    mockDokumenteDb.getFehlende.mockResolvedValue([]);

    const res = await GET(makeRequest("GET", { tenantId: "tenant-1", fehlend: "true" }));
    expect(res.status).toBe(200);
    expect(mockDokumenteDb.getFehlende).toHaveBeenCalledWith("tenant-1");
  });

  it("returns 400 when neither schuelerId nor fehlend param provided", async () => {
    mockAuth();
    const res = await GET(makeRequest("GET", { tenantId: "tenant-1" }));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/crm/dokumente", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  const validBody = {
    tenantId: "tenant-1",
    schuelerId: "s-1",
    typ: "sehtest",
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

  it("creates dokument with valid data", async () => {
    mockAuth();
    mockDokumenteDb.create.mockResolvedValue({ id: "d-1", ...validBody });

    const res = await POST(makeRequest("POST", {}, validBody));
    expect(res.status).toBe(201);
  });

  it("defaults vorhanden to false", async () => {
    mockAuth();
    mockDokumenteDb.create.mockResolvedValue({ id: "d-1" });

    await POST(makeRequest("POST", {}, validBody));
    expect(mockDokumenteDb.create).toHaveBeenCalledWith(
      expect.objectContaining({ vorhanden: false })
    );
  });
});

describe("PATCH /api/crm/dokumente", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns 400 when id is missing", async () => {
    mockAuth();
    const res = await PATCH(makeRequest("PATCH", {}, { tenantId: "tenant-1" }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when dokument not found", async () => {
    mockAuth();
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      return chainMock({ data: null, error: null });
    });

    const res = await PATCH(makeRequest("PATCH", {}, { id: "d-999", tenantId: "tenant-1" }));
    expect(res.status).toBe(404);
  });

  it("updates dokument successfully", async () => {
    mockAuth();
    const updated = { id: "d-1", vorhanden: true, schuelerId: "s-1", tenantId: "tenant-1" };

    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "dokumente") {
        return chainMock({ data: { id: "d-1", tenant_id: "tenant-1" }, error: null });
      }
      return chainMock({ data: [], error: null });
    });
    mockDokumenteDb.update.mockResolvedValue(updated);
    // Mock that not all docs are present yet
    mockDokumenteDb.getBySchueler.mockResolvedValue([
      { typ: "sehtest", vorhanden: true },
    ]);

    const res = await PATCH(makeRequest("PATCH", {}, { id: "d-1", tenantId: "tenant-1", vorhanden: true }));
    expect(res.status).toBe(200);
  });

  it("auto-transitions schueler to theorie when all docs are present", async () => {
    mockAuth();
    const updated = { id: "d-1", vorhanden: true, schuelerId: "s-1", tenantId: "tenant-1" };

    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "dokumente") {
        return chainMock({ data: { id: "d-1", tenant_id: "tenant-1" }, error: null });
      }
      return chainMock({ data: [], error: null });
    });
    mockDokumenteDb.update.mockResolvedValue(updated);

    // All required docs present
    mockDokumenteDb.getBySchueler.mockResolvedValue([
      { typ: "sehtest", vorhanden: true },
      { typ: "erste_hilfe", vorhanden: true },
      { typ: "passfoto", vorhanden: true },
      { typ: "ausweis", vorhanden: true },
      { typ: "fuehrerschein_antrag", vorhanden: true },
    ]);

    mockSchuelerDb.getById.mockResolvedValue({ id: "s-1", status: "angemeldet" });

    await PATCH(makeRequest("PATCH", {}, { id: "d-1", tenantId: "tenant-1", vorhanden: true }));

    expect(mockSchuelerDb.update).toHaveBeenCalledWith("s-1", { status: "theorie" }, "tenant-1");
    expect(mockEmitEvent).toHaveBeenCalledWith("schueler.status_geaendert", "tenant-1", expect.objectContaining({
      neuerStatus: "theorie",
    }));
  });
});
