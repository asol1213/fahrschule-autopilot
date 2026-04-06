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

import { GET, POST, DELETE } from "@/app/api/crm/dsgvo/route";
import { NextRequest } from "next/server";

let requestCounter = 0;
function makeRequest(method: string, params: Record<string, string> = {}, body?: object) {
  requestCounter++;
  const url = new URL("http://localhost/api/crm/dsgvo");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url, {
    method,
    ...(body
      ? { body: JSON.stringify(body), headers: { "content-type": "application/json", "x-real-ip": `10.0.0.${requestCounter}` } }
      : { headers: { "x-real-ip": `10.0.0.${requestCounter}` } }),
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

describe("GET /api/crm/dsgvo (Auskunftsersuchen)", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns 400 when schuelerId is missing", async () => {
    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    mockNoAuth();
    const res = await GET(makeRequest("GET", { schuelerId: "s-1" }));
    expect(res.status).toBe(401);
  });

  it("exports all student data for DSGVO request", async () => {
    mockAuth();
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "schueler") {
        return chainMock({ data: { id: "s-1", vorname: "Max", nachname: "Muster" }, error: null });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest("GET", { schuelerId: "s-1" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.hinweis).toMatch(/DSGVO/);
    expect(json.schueler).toBeDefined();
    expect(json.fahrstunden).toBeDefined();
    expect(json.zahlungen).toBeDefined();
    expect(json.dokumente).toBeDefined();
    expect(json.pruefungen).toBeDefined();
    expect(json.kommunikation).toBeDefined();
  });
});

describe("DELETE /api/crm/dsgvo (DSGVO Loeschung)", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns 401 when not authenticated", async () => {
    mockNoAuth();
    const res = await DELETE(makeRequest("DELETE", {}, { schuelerId: "s-1", confirm: true }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when schuelerId or confirm is missing", async () => {
    mockAuth();
    const res = await DELETE(makeRequest("DELETE", {}, { schuelerId: "s-1" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when confirm is not true", async () => {
    mockAuth();
    const res = await DELETE(makeRequest("DELETE", {}, { confirm: true }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when student not found", async () => {
    mockAuth();
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "schueler") {
        return chainMock({ data: null, error: null });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await DELETE(makeRequest("DELETE", {}, { schuelerId: "s-999", confirm: true }));
    expect(res.status).toBe(404);
  });

  it("deletes student and emits DSGVO event", async () => {
    mockAuth();
    let callCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "schueler") {
        callCount++;
        if (callCount <= 1) {
          // First: get schueler data
          return chainMock({ data: { tenant_id: "tenant-1", vorname: "Max", nachname: "Muster" }, error: null });
        }
        // Second: delete
        return chainMock({ data: null, error: null });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await DELETE(makeRequest("DELETE", {}, { schuelerId: "s-1", confirm: true }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.message).toMatch(/DSGVO-konform/);
    expect(mockEmitEvent).toHaveBeenCalledWith("schueler.dsgvo_loeschung", "tenant-1", expect.objectContaining({
      schuelerId: "s-1",
    }));
  });
});

describe("POST /api/crm/dsgvo (Loeschung planen)", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns 401 when not authenticated", async () => {
    mockNoAuth();
    const res = await POST(makeRequest("POST", {}, { schuelerId: "s-1" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when schuelerId is missing", async () => {
    mockAuth();
    const res = await POST(makeRequest("POST", {}, {}));
    expect(res.status).toBe(400);
  });

  it("schedules deletion successfully", async () => {
    mockAuth();
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "schueler") {
        return chainMock({
          data: { id: "s-1", vorname: "Max", nachname: "Muster", loeschung_geplant_am: "2029-04-01" },
          error: null,
        });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await POST(makeRequest("POST", {}, { schuelerId: "s-1" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.message).toMatch(/Löschung/);
  });

  it("returns 404 when student not found", async () => {
    mockAuth();
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "schueler") {
        return chainMock({ data: null, error: { message: "Not found" } });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await POST(makeRequest("POST", {}, { schuelerId: "s-999" }));
    expect(res.status).toBe(404);
  });
});
