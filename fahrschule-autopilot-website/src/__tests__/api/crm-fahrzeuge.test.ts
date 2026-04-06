import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetUser, mockFrom, mockFahrzeugeDb } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
  mockFahrzeugeDb: {
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
  fahrzeugeDb: mockFahrzeugeDb,
}));

import { GET, POST, PATCH } from "@/app/api/crm/fahrzeuge/route";
import { NextRequest } from "next/server";

function makeRequest(method: string, params: Record<string, string> = {}, body?: object) {
  const url = new URL("http://localhost/api/crm/fahrzeuge");
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

describe("GET /api/crm/fahrzeuge", () => {
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

  it("returns fahrzeuge list", async () => {
    mockAuth();
    const mockData = [{ id: "fz-1", kennzeichen: "M-AB 1234" }];
    mockFahrzeugeDb.getByTenant.mockResolvedValue(mockData);

    const res = await GET(makeRequest("GET", { tenantId: "tenant-1" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual(mockData);
  });
});

describe("POST /api/crm/fahrzeuge", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  const validBody = {
    tenantId: "tenant-1",
    kennzeichen: "M-AB 1234",
    marke: "VW",
    modell: "Golf",
    baujahr: 2022,
    tuevBis: "2026-06-30",
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

  it("creates fahrzeug with valid data", async () => {
    mockAuth();
    mockFahrzeugeDb.create.mockResolvedValue({ id: "fz-1", ...validBody });

    const res = await POST(makeRequest("POST", {}, validBody));
    expect(res.status).toBe(201);
  });

  it("defaults fuehrerscheinklasse to B", async () => {
    mockAuth();
    mockFahrzeugeDb.create.mockResolvedValue({ id: "fz-1" });

    await POST(makeRequest("POST", {}, validBody));
    expect(mockFahrzeugeDb.create).toHaveBeenCalledWith(
      expect.objectContaining({ fuehrerscheinklasse: "B" })
    );
  });
});

describe("PATCH /api/crm/fahrzeuge", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns 400 when id is missing", async () => {
    mockAuth();
    const res = await PATCH(makeRequest("PATCH", {}, { tenantId: "tenant-1" }));
    expect(res.status).toBe(400);
  });

  it("validates kennzeichen format", async () => {
    mockAuth();
    const res = await PATCH(makeRequest("PATCH", {}, { id: "fz-1", tenantId: "tenant-1", kennzeichen: "invalid" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Kennzeichen/);
  });

  it("validates baujahr range", async () => {
    mockAuth();
    const res = await PATCH(makeRequest("PATCH", {}, { id: "fz-1", tenantId: "tenant-1", baujahr: 1900 }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Baujahr/);
  });

  it("validates kilometerstand is not negative", async () => {
    mockAuth();
    const res = await PATCH(makeRequest("PATCH", {}, { id: "fz-1", tenantId: "tenant-1", kilometerstand: -100 }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Kilometerstand/);
  });

  it("returns 404 when fahrzeug not found", async () => {
    mockAuth();
    mockFahrzeugeDb.getById.mockResolvedValue(null);

    const res = await PATCH(makeRequest("PATCH", {}, { id: "fz-999", tenantId: "tenant-1" }));
    expect(res.status).toBe(404);
  });

  it("updates fahrzeug successfully", async () => {
    mockAuth();
    mockFahrzeugeDb.getById.mockResolvedValue({ id: "fz-1", tenantId: "tenant-1" });
    mockFahrzeugeDb.update.mockResolvedValue({ id: "fz-1", marke: "BMW" });

    const res = await PATCH(makeRequest("PATCH", {}, { id: "fz-1", tenantId: "tenant-1", marke: "BMW" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.marke).toBe("BMW");
  });
});
