import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetUser, mockFrom, mockFahrlehrerDb } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
  mockFahrlehrerDb: {
    getByTenant: vi.fn(),
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

vi.mock("@/lib/db/store", () => ({
  fahrlehrerDb: mockFahrlehrerDb,
}));

import { GET, POST, PATCH } from "@/app/api/crm/fahrlehrer/route";
import { NextRequest } from "next/server";

function makeRequest(method: string, params: Record<string, string> = {}, body?: object) {
  const url = new URL("http://localhost/api/crm/fahrlehrer");
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

describe("GET /api/crm/fahrlehrer", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns 400 when tenantId is missing", async () => {
    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    mockNoAuth();
    const res = await GET(makeRequest("GET", { tenantId: "t-1" }));
    expect(res.status).toBe(401);
  });

  it("returns 403 for wrong tenant", async () => {
    mockWrongTenant();
    const res = await GET(makeRequest("GET", { tenantId: "t-wrong" }));
    expect(res.status).toBe(403);
  });

  it("returns fahrlehrer list for valid tenant", async () => {
    mockAuth();
    const mockData = [{ id: "fl-1", vorname: "Hans", nachname: "Schmidt" }];
    mockFahrlehrerDb.getByTenant.mockResolvedValue(mockData);

    const res = await GET(makeRequest("GET", { tenantId: "tenant-1" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual(mockData);
  });
});

describe("POST /api/crm/fahrlehrer", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  const validBody = {
    tenantId: "tenant-1",
    vorname: "Hans",
    nachname: "Schmidt",
    telefon: "+4915112345678",
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
    const json = await res.json();
    expect(json.missing).toBeDefined();
  });

  it("creates fahrlehrer with valid data", async () => {
    mockAuth();
    const created = { id: "fl-1", ...validBody, aktiv: true };
    mockFahrlehrerDb.create.mockResolvedValue(created);

    const res = await POST(makeRequest("POST", {}, validBody));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.id).toBe("fl-1");
  });

  it("returns 500 when creation fails", async () => {
    mockAuth();
    mockFahrlehrerDb.create.mockResolvedValue(null);

    const res = await POST(makeRequest("POST", {}, validBody));
    expect(res.status).toBe(500);
  });

  it("defaults fuehrerscheinklassen to ['B'] when not provided", async () => {
    mockAuth();
    mockFahrlehrerDb.create.mockResolvedValue({ id: "fl-1", ...validBody });

    await POST(makeRequest("POST", {}, validBody));
    expect(mockFahrlehrerDb.create).toHaveBeenCalledWith(
      expect.objectContaining({ fuehrerscheinklassen: ["B"] })
    );
  });
});

describe("PATCH /api/crm/fahrlehrer", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns 400 when id is missing", async () => {
    mockAuth();
    const res = await PATCH(makeRequest("PATCH", {}, { tenantId: "tenant-1" }));
    expect(res.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    mockNoAuth();
    const res = await PATCH(makeRequest("PATCH", {}, { id: "fl-1", tenantId: "tenant-1" }));
    expect(res.status).toBe(401);
  });

  it("returns 404 when fahrlehrer not found", async () => {
    mockAuth();
    mockFahrlehrerDb.getById.mockResolvedValue(null);

    const res = await PATCH(makeRequest("PATCH", {}, { id: "fl-999", tenantId: "tenant-1" }));
    expect(res.status).toBe(404);
  });

  it("updates fahrlehrer successfully", async () => {
    mockAuth();
    mockFahrlehrerDb.getById.mockResolvedValue({ id: "fl-1", tenantId: "tenant-1" });
    mockFahrlehrerDb.update.mockResolvedValue({ id: "fl-1", vorname: "Updated" });

    const res = await PATCH(makeRequest("PATCH", {}, { id: "fl-1", tenantId: "tenant-1", vorname: "Updated" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.vorname).toBe("Updated");
  });
});
