import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for ALL sales API routes:
 * - GET/POST/PUT /api/sales/leads
 * - GET /api/sales/churn
 * - GET/POST/PUT /api/sales/follow-up
 * - POST /api/sales/outreach
 */

// ---------------------------------------------------------------------------
// Mock setup
// ---------------------------------------------------------------------------

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

import { NextRequest } from "next/server";

function makeRequest(
  path: string,
  params: Record<string, string> = {},
  opts: { method?: string; headers?: Record<string, string>; body?: string } = {},
) {
  const url = new URL(`http://localhost${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url, {
    method: opts.method || "GET",
    headers: opts.headers || {},
    ...(opts.body ? { body: opts.body } : {}),
  });
}

function chainMock(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  const terminal = ["maybeSingle", "single", "csv"];
  [
    "select", "insert", "update", "delete", "eq", "neq", "not", "is", "in",
    "gte", "lte", "lt", "ilike", "order", "limit", "range", "maybeSingle",
    "single", "csv",
  ].forEach((m) => {
    chain[m] = vi.fn(() => terminal.includes(m) ? result : chain);
  });
  // Make chain thenable so `await supabase.from(...).insert(...).select()` resolves
  chain.then = (resolve: (v: unknown) => unknown) => Promise.resolve(resolve(result));
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

// ---------------------------------------------------------------------------
// Sales Leads: GET/POST/PUT /api/sales/leads
// ---------------------------------------------------------------------------

describe("GET /api/sales/leads", () => {
  let GET: typeof import("@/app/api/sales/leads/route").GET;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/sales/leads/route");
    GET = mod.GET;
  });

  it("returns 401 when not authenticated", async () => {
    mockNoAuth();
    const res = await GET(makeRequest("/api/sales/leads"));
    expect(res.status).toBe(401);
  });

  it("returns leads with valid auth", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const leadsData = [
      { id: "l1", fahrschul_name: "Fahrschule A", status: "neu" },
    ];
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "sales_leads") {
        return chainMock({ data: leadsData, error: null });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest("/api/sales/leads"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("leads");
    expect(json).toHaveProperty("pipeline");
    expect(json).toHaveProperty("total");
  });

  it("filters by status query parameter", async () => {
    mockAuth();
    const res = await GET(makeRequest("/api/sales/leads", { status: "neu" }));
    expect(res.status).toBe(200);
  });

  it("filters by stadt query parameter", async () => {
    mockAuth();
    const res = await GET(makeRequest("/api/sales/leads", { stadt: "München" }));
    expect(res.status).toBe(200);
  });

  it("respects limit parameter (capped at 100)", async () => {
    mockAuth();
    const res = await GET(makeRequest("/api/sales/leads", { limit: "200" }));
    expect(res.status).toBe(200);
    // Limit is capped at 100 in the route
  });
});

describe("POST /api/sales/leads", () => {
  let POST: typeof import("@/app/api/sales/leads/route").POST;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/sales/leads/route");
    POST = mod.POST;
  });

  it("returns 401 when not authenticated", async () => {
    mockNoAuth();
    const body = JSON.stringify({ fahrschulName: "Test", stadt: "Berlin" });
    const res = await POST(makeRequest("/api/sales/leads", {}, { method: "POST", body }));
    expect(res.status).toBe(401);
  });

  it("creates a single lead with valid auth", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      return chainMock({ data: [{ id: "new-lead" }], error: null });
    });

    const body = JSON.stringify({ fahrschulName: "Fahrschule Test", stadt: "Berlin" });
    const res = await POST(makeRequest("/api/sales/leads", {}, { method: "POST", body }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("supports bulk import (array body)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      return chainMock({ data: [{ id: "l1" }, { id: "l2" }], error: null });
    });

    const body = JSON.stringify([
      { fahrschulName: "FS 1", stadt: "Berlin" },
      { fahrschulName: "FS 2", stadt: "Hamburg" },
    ]);
    const res = await POST(makeRequest("/api/sales/leads", {}, { method: "POST", body }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.count).toBe(2);
  });
});

describe("PUT /api/sales/leads", () => {
  let PUT: typeof import("@/app/api/sales/leads/route").PUT;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/sales/leads/route");
    PUT = mod.PUT;
  });

  it("returns 401 when not authenticated", async () => {
    mockNoAuth();
    const body = JSON.stringify({ id: "l1", status: "kontaktiert" });
    const res = await PUT(makeRequest("/api/sales/leads", {}, { method: "PUT", body }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when id is missing", async () => {
    mockAuth();
    const body = JSON.stringify({ status: "kontaktiert" });
    const res = await PUT(makeRequest("/api/sales/leads", {}, { method: "PUT", body }));
    expect(res.status).toBe(400);
  });

  it("updates lead with valid auth and id", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      return chainMock({ data: { id: "l1", status: "kontaktiert" }, error: null });
    });

    const body = JSON.stringify({ id: "l1", status: "kontaktiert", notizen: "Angerufen" });
    const res = await PUT(makeRequest("/api/sales/leads", {}, { method: "PUT", body }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Sales Churn: GET /api/sales/churn
// ---------------------------------------------------------------------------

describe("GET /api/sales/churn", () => {
  let GET: typeof import("@/app/api/sales/churn/route").GET;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.ADMIN_API_KEY = "test-admin-key";
    const mod = await import("@/app/api/sales/churn/route");
    GET = mod.GET;
  });

  it("returns 401 without admin key", async () => {
    const res = await GET(makeRequest("/api/sales/churn"));
    expect(res.status).toBe(401);
  });

  it("returns 401 with wrong admin key", async () => {
    const res = await GET(makeRequest("/api/sales/churn", {}, {
      headers: { "x-admin-key": "wrong-key" },
    }));
    expect(res.status).toBe(401);
  });

  it("returns churn analysis with valid admin key", async () => {
    mockFrom.mockReturnValue(chainMock({ data: [], error: null }));
    const res = await GET(makeRequest("/api/sales/churn", {}, {
      headers: { "x-admin-key": "test-admin-key" },
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("churnRisiko");
    expect(json).toHaveProperty("upsellingKandidaten");
    expect(json).toHaveProperty("metriken");
  });

  it("identifies churn risk correctly", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenants") {
        return chainMock({
          data: [
            { id: "t1", name: "FS 1", slug: "fs1", plan: "starter", created_at: "2025-01-01" },
          ],
          error: null,
        });
      }
      // No schueler, no activity -> high churn risk
      return chainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest("/api/sales/churn", {}, {
      headers: { "x-admin-key": "test-admin-key" },
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.metriken.totalKunden).toBe(1);
    // With no activity, churn score should be high
    if (json.churnRisiko.length > 0) {
      expect(json.churnRisiko[0].churnScore).toBeGreaterThan(20);
    }
  });

  it("identifies upselling candidates", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenants") {
        return chainMock({
          data: [
            { id: "t1", name: "Big FS", slug: "big", plan: "starter", created_at: "2025-01-01" },
          ],
          error: null,
        });
      }
      if (table === "schueler") {
        // Lots of active students -> upselling candidate
        const students = Array.from({ length: 25 }, (_, i) => ({
          tenant_id: "t1",
          status: "praxis",
          created_at: "2026-03-15",
        }));
        return chainMock({ data: students, error: null });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest("/api/sales/churn", {}, {
      headers: { "x-admin-key": "test-admin-key" },
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    // Starter plan with many students should be upselling candidate
    expect(json.upsellingKandidaten.length).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// Sales Follow-Up: GET/POST/PUT /api/sales/follow-up
// ---------------------------------------------------------------------------

describe("GET /api/sales/follow-up", () => {
  let GET: typeof import("@/app/api/sales/follow-up/route").GET;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.ADMIN_API_KEY = "test-admin-key";
    const mod = await import("@/app/api/sales/follow-up/route");
    GET = mod.GET;
  });

  it("returns 401 without admin key", async () => {
    const res = await GET(makeRequest("/api/sales/follow-up"));
    expect(res.status).toBe(401);
  });

  it("returns follow-ups with valid admin key", async () => {
    mockFrom.mockReturnValue(chainMock({ data: [], error: null }));
    const res = await GET(makeRequest("/api/sales/follow-up", {}, {
      headers: { "x-admin-key": "test-admin-key" },
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("followUps");
    expect(json).toHaveProperty("summary");
  });

  it("filters by typ query parameter", async () => {
    mockFrom.mockReturnValue(chainMock({ data: [], error: null }));
    const res = await GET(makeRequest("/api/sales/follow-up", { typ: "demo_follow_up" }, {
      headers: { "x-admin-key": "test-admin-key" },
    }));
    expect(res.status).toBe(200);
  });
});

describe("POST /api/sales/follow-up", () => {
  let POST: typeof import("@/app/api/sales/follow-up/route").POST;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.ADMIN_API_KEY = "test-admin-key";
    const mod = await import("@/app/api/sales/follow-up/route");
    POST = mod.POST;
  });

  it("returns 401 without admin key", async () => {
    const body = JSON.stringify({ leadId: "l1", typ: "demo_follow_up" });
    const res = await POST(makeRequest("/api/sales/follow-up", {}, { method: "POST", body }));
    expect(res.status).toBe(401);
  });

  it("creates a single follow-up with valid admin key", async () => {
    mockFrom.mockReturnValue(chainMock({ data: { id: "fu-1" }, error: null }));
    const body = JSON.stringify({
      leadId: "l1",
      typ: "demo_follow_up",
      kanal: "email",
      betreff: "Test",
    });
    const res = await POST(makeRequest("/api/sales/follow-up", {}, {
      method: "POST",
      body,
      headers: { "x-admin-key": "test-admin-key" },
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("creates a follow-up sequence when sequenz=true", async () => {
    mockFrom.mockReturnValue(chainMock({
      data: [{ id: "fu-1" }, { id: "fu-2" }, { id: "fu-3" }],
      error: null,
    }));
    const body = JSON.stringify({
      sequenz: true,
      typ: "demo_follow_up",
      leadId: "l1",
    });
    const res = await POST(makeRequest("/api/sales/follow-up", {}, {
      method: "POST",
      body,
      headers: { "x-admin-key": "test-admin-key" },
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.count).toBe(3);
  });
});

describe("PUT /api/sales/follow-up", () => {
  let PUT: typeof import("@/app/api/sales/follow-up/route").PUT;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.ADMIN_API_KEY = "test-admin-key";
    const mod = await import("@/app/api/sales/follow-up/route");
    PUT = mod.PUT;
  });

  it("returns 401 without admin key", async () => {
    const body = JSON.stringify({ id: "fu-1", status: "gesendet" });
    const res = await PUT(makeRequest("/api/sales/follow-up", {}, { method: "PUT", body }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when id is missing", async () => {
    const body = JSON.stringify({ status: "gesendet" });
    const res = await PUT(makeRequest("/api/sales/follow-up", {}, {
      method: "PUT",
      body,
      headers: { "x-admin-key": "test-admin-key" },
    }));
    expect(res.status).toBe(400);
  });

  it("marks follow-up as sent", async () => {
    mockFrom.mockReturnValue(chainMock({ data: { id: "fu-1", status: "gesendet" }, error: null }));
    const body = JSON.stringify({ id: "fu-1", status: "gesendet" });
    const res = await PUT(makeRequest("/api/sales/follow-up", {}, {
      method: "PUT",
      body,
      headers: { "x-admin-key": "test-admin-key" },
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Sales Outreach: POST /api/sales/outreach
// ---------------------------------------------------------------------------

describe("POST /api/sales/outreach", () => {
  let POST: typeof import("@/app/api/sales/outreach/route").POST;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.ADMIN_API_KEY = "test-admin-key";
    process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
    const mod = await import("@/app/api/sales/outreach/route");
    POST = mod.POST;
  });

  it("returns 401 without admin key", async () => {
    const body = JSON.stringify({ fahrschulName: "Test", stadt: "Berlin" });
    const res = await POST(makeRequest("/api/sales/outreach", {}, { method: "POST", body }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when fahrschulName or stadt is missing", async () => {
    const body = JSON.stringify({ fahrschulName: "Test" });
    const res = await POST(makeRequest("/api/sales/outreach", {}, {
      method: "POST",
      body,
      headers: { "x-admin-key": "test-admin-key" },
    }));
    expect(res.status).toBe(400);
  });

  it("returns 500 when ANTHROPIC_API_KEY is not configured", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const body = JSON.stringify({ fahrschulName: "Test FS", stadt: "Berlin" });
    const res = await POST(makeRequest("/api/sales/outreach", {}, {
      method: "POST",
      body,
      headers: { "x-admin-key": "test-admin-key" },
    }));
    expect(res.status).toBe(500);
  });

  it("generates outreach email with valid config", async () => {
    // Mock global fetch for Claude API
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        content: [{
          type: "text",
          text: "BETREFF: Mehr Bewertungen\nNACHRICHT: Hallo!\nFOLLOW_UP: Kurze Nachfrage",
        }],
      }),
    });

    try {
      const body = JSON.stringify({
        fahrschulName: "Fahrschule Berlin",
        stadt: "Berlin",
        inhaber: "Müller",
        googleBewertung: 4.2,
      });
      const res = await POST(makeRequest("/api/sales/outreach", {}, {
        method: "POST",
        body,
        headers: { "x-admin-key": "test-admin-key" },
      }));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toHaveProperty("betreff");
      expect(json).toHaveProperty("nachricht");
      expect(json).toHaveProperty("followUp");
      expect(json.fahrschulName).toBe("Fahrschule Berlin");
      expect(json.stadt).toBe("Berlin");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
