import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetUser, mockFrom, mockKommunikationDb } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
  mockKommunikationDb: {
    getBySchueler: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

vi.mock("@/lib/db/store", () => ({
  kommunikationDb: mockKommunikationDb,
}));

import { GET, POST } from "@/app/api/crm/kommunikation/route";
import { NextRequest } from "next/server";

function makeRequest(method: string, params: Record<string, string> = {}, body?: object) {
  const url = new URL("http://localhost/api/crm/kommunikation");
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

describe("GET /api/crm/kommunikation", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns 400 when tenantId is missing", async () => {
    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    mockNoAuth();
    const res = await GET(makeRequest("GET", { tenantId: "t-1", schuelerId: "s-1" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when schuelerId is missing", async () => {
    mockAuth();
    const res = await GET(makeRequest("GET", { tenantId: "tenant-1" }));
    expect(res.status).toBe(400);
  });

  it("returns kommunikation for schueler", async () => {
    mockAuth();
    mockKommunikationDb.getBySchueler.mockResolvedValue([{ id: "k-1", kanal: "whatsapp" }]);

    const res = await GET(makeRequest("GET", { tenantId: "tenant-1", schuelerId: "s-1" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(1);
  });
});

describe("POST /api/crm/kommunikation", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  const validBody = {
    tenantId: "tenant-1",
    schuelerId: "s-1",
    kanal: "whatsapp",
    richtung: "ausgehend",
    inhalt: "Hallo, Ihre Fahrstunde ist morgen um 10 Uhr.",
  };

  it("returns 400 when required fields are missing", async () => {
    mockAuth();
    const res = await POST(makeRequest("POST", {}, { tenantId: "tenant-1" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.missing).toBeDefined();
  });

  it("returns 401 when not authenticated", async () => {
    mockNoAuth();
    const res = await POST(makeRequest("POST", {}, validBody));
    expect(res.status).toBe(401);
  });

  it("creates kommunikation with valid data", async () => {
    mockAuth();
    mockKommunikationDb.create.mockResolvedValue({ id: "k-1", ...validBody });

    const res = await POST(makeRequest("POST", {}, validBody));
    expect(res.status).toBe(201);
  });

  it("returns 500 when creation fails", async () => {
    mockAuth();
    mockKommunikationDb.create.mockResolvedValue(null);

    const res = await POST(makeRequest("POST", {}, validBody));
    expect(res.status).toBe(500);
  });

  it("auto-sets datum when not provided", async () => {
    mockAuth();
    mockKommunikationDb.create.mockResolvedValue({ id: "k-1" });

    await POST(makeRequest("POST", {}, validBody));
    expect(mockKommunikationDb.create).toHaveBeenCalledWith(
      expect.objectContaining({ datum: expect.any(String) })
    );
  });
});
