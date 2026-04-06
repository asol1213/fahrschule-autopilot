import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetUser, mockFrom } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

import { GET, POST, PATCH } from "@/app/api/crm/vertrag/route";
import { NextRequest } from "next/server";

function makeRequest(method: string, params: Record<string, string> = {}, body?: object) {
  const url = new URL("http://localhost/api/crm/vertrag");
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
  // Make chain thenable (Supabase query builders are PromiseLike)
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

describe("GET /api/crm/vertrag", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns 401 when not authenticated", async () => {
    mockNoAuth();
    const res = await GET(makeRequest("GET", { tenantId: "t-1" }));
    expect(res.status).toBe(401);
  });

  it("returns vertraege for tenant", async () => {
    mockAuth();
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "vertraege") {
        return chainMock({ data: [{ id: "v-1", status: "entwurf" }], error: null });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest("GET", { tenantId: "tenant-1" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toBeDefined();
  });

  it("returns vertraege filtered by schuelerId", async () => {
    mockAuth();
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "vertraege") {
        return chainMock({ data: [{ id: "v-1" }], error: null });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest("GET", { tenantId: "tenant-1", schuelerId: "s-1" }));
    expect(res.status).toBe(200);
  });
});

describe("POST /api/crm/vertrag", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  const validBody = {
    tenantId: "tenant-1",
    schuelerId: "s-1",
    vertragstyp: "erstausbildung",
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

  it("creates vertrag with valid data", async () => {
    mockAuth();
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "vertraege") {
        return chainMock({ data: { id: "v-1", status: "entwurf" }, error: null });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await POST(makeRequest("POST", {}, validBody));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.status).toBe("entwurf");
  });

  it("returns 500 when insert fails", async () => {
    mockAuth();
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "vertraege") {
        return chainMock({ data: null, error: { message: "DB error" } });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await POST(makeRequest("POST", {}, validBody));
    expect(res.status).toBe(500);
  });
});

describe("PATCH /api/crm/vertrag", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns 400 when id is missing", async () => {
    mockAuth();
    const res = await PATCH(makeRequest("PATCH", {}, { tenantId: "tenant-1" }));
    expect(res.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    mockNoAuth();
    const res = await PATCH(makeRequest("PATCH", {}, { id: "v-1", tenantId: "tenant-1" }));
    expect(res.status).toBe(401);
  });

  it("updates vertrag status", async () => {
    mockAuth();
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "vertraege") {
        return chainMock({ data: { id: "v-1", status: "aktiv" }, error: null });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await PATCH(makeRequest("PATCH", {}, { id: "v-1", tenantId: "tenant-1", status: "aktiv" }));
    expect(res.status).toBe(200);
  });

  it("sets unterschrieben status when unterschriftUrl is provided", async () => {
    mockAuth();
    const updateMock = vi.fn();
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "vertraege") {
        const chain = chainMock({ data: { id: "v-1", status: "unterschrieben" }, error: null });
        chain.update = updateMock;
        updateMock.mockReturnValue(chain);
        return chain;
      }
      return chainMock({ data: [], error: null });
    });

    const res = await PATCH(makeRequest("PATCH", {}, {
      id: "v-1",
      tenantId: "tenant-1",
      unterschriftUrl: "https://example.com/sig.png",
    }));
    expect(res.status).toBe(200);
  });

  it("returns 404 when vertrag not found", async () => {
    mockAuth();
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "vertraege") {
        return chainMock({ data: null, error: null });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await PATCH(makeRequest("PATCH", {}, { id: "v-999", tenantId: "tenant-1", status: "aktiv" }));
    expect(res.status).toBe(404);
  });
});
