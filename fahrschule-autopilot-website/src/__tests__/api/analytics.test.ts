import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for ALL analytics API routes:
 * - GET /api/analytics (main dashboard)
 * - GET/POST /api/analytics/conversion
 * - GET /api/analytics/kpis
 * - GET /api/analytics/marketing
 * - GET/POST /api/analytics/nps
 * - GET /api/analytics/roi
 * - GET/POST /api/analytics/sales-funnel
 * - GET/POST /api/analytics/telefon
 * - GET/POST /api/analytics/theorie
 */

// ---------------------------------------------------------------------------
// Mock setup
// ---------------------------------------------------------------------------

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
      admin: { getUserById: vi.fn().mockResolvedValue({ data: { user: { email: "test@test.de" } } }) },
    },
    from: mockFrom,
  })),
}));

vi.mock("@/lib/analytics/anomalies", () => ({
  detectAnomalies: vi.fn(() => []),
  getISOWeek: vi.fn(() => 1),
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
    "single", "csv", "then",
  ].forEach((m) => {
    chain[m] = vi.fn((...args: unknown[]) => {
      // .then support for Promise.all usage in admin/metrics
      if (m === "then") {
        const resolve = args[0] as (v: unknown) => unknown;
        return Promise.resolve(resolve(result));
      }
      return terminal.includes(m) ? result : chain;
    });
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

// ---------------------------------------------------------------------------
// Analytics main: GET /api/analytics
// ---------------------------------------------------------------------------

describe("GET /api/analytics", () => {
  let GET: typeof import("@/app/api/analytics/route").GET;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/analytics/route");
    GET = mod.GET;
  });

  it("returns 400 when tenantId is missing", async () => {
    const res = await GET(makeRequest("/api/analytics"));
    expect(res.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    mockNoAuth();
    const res = await GET(makeRequest("/api/analytics", { tenantId: "t1" }));
    expect(res.status).toBe(401);
  });

  it("returns 403 when user has no access to tenant", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: null, error: null });
      }
      return chainMock({ data: [], error: null });
    });
    const res = await GET(makeRequest("/api/analytics", { tenantId: "t-other" }));
    expect(res.status).toBe(403);
  });

  it("returns analytics data with valid auth", async () => {
    mockAuth();
    const res = await GET(makeRequest("/api/analytics", { tenantId: "tenant-1", range: "6m" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.tenantId).toBe("tenant-1");
    expect(json.range).toBe("6m");
    expect(json).toHaveProperty("umsatzProMonat");
    expect(json).toHaveProperty("anmeldungenProMonat");
    expect(json).toHaveProperty("noShowsProWoche");
    expect(json).toHaveProperty("fahrstundenProWoche");
    expect(json).toHaveProperty("pruefungenProMonat");
    expect(json).toHaveProperty("schuelerPipeline");
    expect(json).toHaveProperty("anomalies");
  });

  it("respects 12m range parameter", async () => {
    mockAuth();
    const res = await GET(makeRequest("/api/analytics", { tenantId: "tenant-1", range: "12m" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.range).toBe("12m");
    // 12 months should produce 12 entries
    expect(json.umsatzProMonat.length).toBe(12);
  });
});

// ---------------------------------------------------------------------------
// Analytics conversion: GET/POST /api/analytics/conversion
// ---------------------------------------------------------------------------

describe("GET /api/analytics/conversion", () => {
  let GET: typeof import("@/app/api/analytics/conversion/route").GET;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.ADMIN_API_KEY = "test-admin-key";
    const mod = await import("@/app/api/analytics/conversion/route");
    GET = mod.GET;
  });

  it("returns 401 without admin key", async () => {
    const res = await GET(makeRequest("/api/analytics/conversion"));
    expect(res.status).toBe(401);
  });

  it("returns conversion data with valid admin key", async () => {
    mockFrom.mockReturnValue(chainMock({ data: [], error: null }));
    const res = await GET(makeRequest("/api/analytics/conversion", {}, {
      headers: { "x-admin-key": "test-admin-key" },
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("zeitraum30");
    expect(json).toHaveProperty("planStats");
    expect(json).toHaveProperty("funnel");
    expect(json).toHaveProperty("besucheProTag");
    expect(json).toHaveProperty("topQuellen");
  });
});

describe("POST /api/analytics/conversion", () => {
  let POST: typeof import("@/app/api/analytics/conversion/route").POST;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/analytics/conversion/route");
    POST = mod.POST;
  });

  it("tracks a demo visit successfully", async () => {
    mockFrom.mockReturnValue(chainMock({ data: {}, error: null }));
    const body = JSON.stringify({ plan: "pro", visitorId: "v-1", ctaClicked: true });
    const res = await POST(makeRequest("/api/analytics/conversion", {}, { method: "POST", body }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("returns 400 on invalid JSON", async () => {
    const res = await POST(makeRequest("/api/analytics/conversion", {}, { method: "POST", body: "not-json" }));
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Analytics KPIs: GET /api/analytics/kpis
// ---------------------------------------------------------------------------

describe("GET /api/analytics/kpis", () => {
  let GET: typeof import("@/app/api/analytics/kpis/route").GET;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/analytics/kpis/route");
    GET = mod.GET;
  });

  it("returns 400 when tenantId is missing", async () => {
    const res = await GET(makeRequest("/api/analytics/kpis"));
    expect(res.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    mockNoAuth();
    const res = await GET(makeRequest("/api/analytics/kpis", { tenantId: "t1" }));
    expect(res.status).toBe(401);
  });

  it("returns KPI data with valid auth", async () => {
    mockAuth();
    const res = await GET(makeRequest("/api/analytics/kpis", { tenantId: "tenant-1" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("durchlaufzeit");
    expect(json).toHaveProperty("dokumenteVollstaendig");
    expect(json).toHaveProperty("abbruch");
    expect(json).toHaveProperty("dokumenteProTyp");
    expect(json).toHaveProperty("statusVerteilung");
  });
});

// ---------------------------------------------------------------------------
// Analytics marketing: GET /api/analytics/marketing
// ---------------------------------------------------------------------------

describe("GET /api/analytics/marketing", () => {
  let GET: typeof import("@/app/api/analytics/marketing/route").GET;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.ADMIN_API_KEY = "test-admin-key";
    const mod = await import("@/app/api/analytics/marketing/route");
    GET = mod.GET;
  });

  it("returns 401 without admin key", async () => {
    const res = await GET(makeRequest("/api/analytics/marketing"));
    expect(res.status).toBe(401);
  });

  it("returns 401 with wrong admin key", async () => {
    const res = await GET(makeRequest("/api/analytics/marketing", {}, {
      headers: { "x-admin-key": "wrong-key" },
    }));
    expect(res.status).toBe(401);
  });

  it("returns marketing data with valid admin key", async () => {
    mockFrom.mockReturnValue(chainMock({ data: [], error: null }));
    const res = await GET(makeRequest("/api/analytics/marketing", {}, {
      headers: { "x-admin-key": "test-admin-key" },
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("traffic");
    expect(json).toHaveProperty("bewertungen");
    expect(json).toHaveProperty("empfehlungen");
    expect(json).toHaveProperty("sales");
  });
});

// ---------------------------------------------------------------------------
// Analytics NPS: GET/POST /api/analytics/nps
// ---------------------------------------------------------------------------

describe("GET /api/analytics/nps", () => {
  let GET: typeof import("@/app/api/analytics/nps/route").GET;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/analytics/nps/route");
    GET = mod.GET;
  });

  it("returns 400 when tenantId is missing", async () => {
    const res = await GET(makeRequest("/api/analytics/nps"));
    expect(res.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    mockNoAuth();
    const res = await GET(makeRequest("/api/analytics/nps", { tenantId: "t1" }));
    expect(res.status).toBe(401);
  });

  it("returns empty NPS data when no responses exist", async () => {
    mockAuth();
    const res = await GET(makeRequest("/api/analytics/nps", { tenantId: "tenant-1" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.npsScore).toBeNull();
    expect(json.total).toBe(0);
  });

  it("calculates NPS score correctly from responses", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "nps_responses") {
        return chainMock({
          data: [
            { score: 10, kommentar: "Super!", created_at: "2026-03-15T10:00:00Z" },
            { score: 9, kommentar: null, created_at: "2026-03-14T10:00:00Z" },
            { score: 5, kommentar: "Schlecht", created_at: "2026-03-13T10:00:00Z" },
          ],
          error: null,
        });
      }
      return chainMock({ data: [], error: null });
    });
    const res = await GET(makeRequest("/api/analytics/nps", { tenantId: "tenant-1" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    // 2 promoters, 0 passives, 1 detractor => NPS = (2/3 - 1/3)*100 = 33
    expect(json.npsScore).toBe(33);
    expect(json.total).toBe(3);
    expect(json.promoters).toBe(2);
    expect(json.detractors).toBe(1);
  });
});

describe("POST /api/analytics/nps", () => {
  let POST: typeof import("@/app/api/analytics/nps/route").POST;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/analytics/nps/route");
    POST = mod.POST;
  });

  it("returns 400 when tenantId or score is missing", async () => {
    const body = JSON.stringify({ tenantId: "t1" });
    const res = await POST(makeRequest("/api/analytics/nps", {}, { method: "POST", body }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when score is out of range", async () => {
    const body = JSON.stringify({ tenantId: "t1", score: 11 });
    const res = await POST(makeRequest("/api/analytics/nps", {}, { method: "POST", body }));
    expect(res.status).toBe(400);
  });

  it("creates NPS response with valid data", async () => {
    mockFrom.mockReturnValue(chainMock({ data: {}, error: null }));
    const body = JSON.stringify({ tenantId: "t1", score: 9, kommentar: "Toll!" });
    const res = await POST(makeRequest("/api/analytics/nps", {}, { method: "POST", body }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Analytics ROI: GET /api/analytics/roi
// ---------------------------------------------------------------------------

describe("GET /api/analytics/roi", () => {
  let GET: typeof import("@/app/api/analytics/roi/route").GET;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/analytics/roi/route");
    GET = mod.GET;
  });

  it("returns 400 when tenantId is missing", async () => {
    const res = await GET(makeRequest("/api/analytics/roi"));
    expect(res.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    mockNoAuth();
    const res = await GET(makeRequest("/api/analytics/roi", { tenantId: "t1" }));
    expect(res.status).toBe(401);
  });

  it("returns ROI data with valid auth", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "tenants") {
        return chainMock({ data: { plan: "pro" }, error: null });
      }
      return chainMock({ data: [], error: null });
    });
    const res = await GET(makeRequest("/api/analytics/roi", { tenantId: "tenant-1" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("planKosten");
    expect(json).toHaveProperty("noShow");
    expect(json).toHaveProperty("zeit");
    expect(json).toHaveProperty("zahlungen");
    expect(json).toHaveProperty("gesamt");
    expect(json.plan).toBe("pro");
    expect(json.planKosten).toBe(249);
  });
});

// ---------------------------------------------------------------------------
// Analytics sales-funnel: GET/POST /api/analytics/sales-funnel
// ---------------------------------------------------------------------------

describe("GET /api/analytics/sales-funnel", () => {
  let GET: typeof import("@/app/api/analytics/sales-funnel/route").GET;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.ADMIN_API_KEY = "test-admin-key";
    const mod = await import("@/app/api/analytics/sales-funnel/route");
    GET = mod.GET;
  });

  it("returns 401 without admin key", async () => {
    const res = await GET(makeRequest("/api/analytics/sales-funnel"));
    expect(res.status).toBe(401);
  });

  it("returns sales funnel data with valid admin key", async () => {
    mockFrom.mockReturnValue(chainMock({ data: [], error: null }));
    const res = await GET(makeRequest("/api/analytics/sales-funnel", {}, {
      headers: { "x-admin-key": "test-admin-key" },
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("funnel");
    expect(json).toHaveProperty("avgDaysToClose");
    expect(json).toHaveProperty("totalClosed");
    expect(json).toHaveProperty("totalLost");
    expect(json).toHaveProperty("weeklyVolume");
    expect(json).toHaveProperty("responseRate");
  });
});

describe("POST /api/analytics/sales-funnel", () => {
  let POST: typeof import("@/app/api/analytics/sales-funnel/route").POST;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/analytics/sales-funnel/route");
    POST = mod.POST;
  });

  it("returns 401 when not authenticated", async () => {
    mockNoAuth();
    const body = JSON.stringify({ leadId: "l1", stufe: "outreach" });
    const res = await POST(makeRequest("/api/analytics/sales-funnel", {}, { method: "POST", body }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when leadId or stufe is missing", async () => {
    mockAuth();
    const body = JSON.stringify({ leadId: "l1" });
    const res = await POST(makeRequest("/api/analytics/sales-funnel", {}, { method: "POST", body }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when stufe is invalid", async () => {
    mockAuth();
    const body = JSON.stringify({ leadId: "l1", stufe: "invalid_stage" });
    const res = await POST(makeRequest("/api/analytics/sales-funnel", {}, { method: "POST", body }));
    expect(res.status).toBe(400);
  });

  it("creates sales activity with valid data", async () => {
    mockAuth();
    mockFrom.mockReturnValue(chainMock({ data: {}, error: null }));
    const body = JSON.stringify({ leadId: "l1", stufe: "outreach", kanal: "email" });
    const res = await POST(makeRequest("/api/analytics/sales-funnel", {}, { method: "POST", body }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Analytics telefon: GET/POST /api/analytics/telefon
// ---------------------------------------------------------------------------

describe("GET /api/analytics/telefon", () => {
  let GET: typeof import("@/app/api/analytics/telefon/route").GET;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/analytics/telefon/route");
    GET = mod.GET;
  });

  it("returns 400 when tenantId is missing", async () => {
    const res = await GET(makeRequest("/api/analytics/telefon"));
    expect(res.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    mockNoAuth();
    const res = await GET(makeRequest("/api/analytics/telefon", { tenantId: "t1" }));
    expect(res.status).toBe(401);
  });

  it("returns telefon analytics with valid auth", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const selectWithCount = {
      ...chainMock({ data: [], error: null }),
      select: vi.fn(() => chainMock({ data: [], error: null, count: 0 } as unknown as { data: unknown; error: unknown })),
    };
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "anrufe") {
        return selectWithCount;
      }
      return chainMock({ data: [], error: null });
    });
    const res = await GET(makeRequest("/api/analytics/telefon", { tenantId: "tenant-1" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("tenantId");
    expect(json).toHaveProperty("anrufVolumen");
    expect(json).toHaveProperty("topIntents");
    expect(json).toHaveProperty("sentimentVerteilung");
  });
});

describe("POST /api/analytics/telefon", () => {
  let POST: typeof import("@/app/api/analytics/telefon/route").POST;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.RETELL_WEBHOOK_SECRET = "test-retell-secret";
    const mod = await import("@/app/api/analytics/telefon/route");
    POST = mod.POST;
  });

  it("returns 401 without service key", async () => {
    delete process.env.RETELL_WEBHOOK_SECRET;
    delete process.env.WEBHOOK_SECRET;
    const body = JSON.stringify({ tenantId: "t1", callId: "c1" });
    const res = await POST(makeRequest("/api/analytics/telefon", {}, { method: "POST", body }));
    // Without any secret configured, returns 500 (server config missing)
    expect([401, 500]).toContain(res.status);
  });

  it("creates call record with valid service key", async () => {
    mockFrom.mockReturnValue(chainMock({ data: { id: "anruf-1" }, error: null }));
    const body = JSON.stringify({
      tenantId: "t1",
      callId: "c1",
      duration: 120,
      intent: "anmeldung",
      sentiment: "positive",
    });
    const res = await POST(makeRequest("/api/analytics/telefon", {}, {
      method: "POST",
      body,
      headers: { "x-api-key": "test-retell-secret" },
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Analytics theorie: GET/POST /api/analytics/theorie
// ---------------------------------------------------------------------------

describe("GET /api/analytics/theorie", () => {
  let GET: typeof import("@/app/api/analytics/theorie/route").GET;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/analytics/theorie/route");
    GET = mod.GET;
  });

  it("returns 400 when tenantId is missing", async () => {
    const res = await GET(makeRequest("/api/analytics/theorie"));
    expect(res.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    mockNoAuth();
    const res = await GET(makeRequest("/api/analytics/theorie", { tenantId: "t1" }));
    expect(res.status).toBe(401);
  });

  it("returns theorie analytics with valid auth", async () => {
    mockAuth();
    const res = await GET(makeRequest("/api/analytics/theorie", { tenantId: "tenant-1" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("tenantId");
    expect(json).toHaveProperty("monat");
    expect(json).toHaveProperty("woche");
    expect(json).toHaveProperty("kategorieStats");
    expect(json).toHaveProperty("aktivitaetProTag");
  });
});

describe("POST /api/analytics/theorie", () => {
  let POST: typeof import("@/app/api/analytics/theorie/route").POST;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/analytics/theorie/route");
    POST = mod.POST;
  });

  it("returns 400 when tenantId or userId is missing", async () => {
    const body = JSON.stringify({ eventType: "question_answered" });
    const res = await POST(makeRequest("/api/analytics/theorie", {}, { method: "POST", body }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when no valid events are provided", async () => {
    const body = JSON.stringify({ tenantId: "t1", userId: "u1", eventType: "invalid_event" });
    const res = await POST(makeRequest("/api/analytics/theorie", {}, { method: "POST", body }));
    expect(res.status).toBe(400);
  });

  it("creates theorie event with valid single event", async () => {
    mockFrom.mockReturnValue(chainMock({ data: {}, error: null }));
    const body = JSON.stringify({
      tenantId: "t1",
      userId: "u1",
      eventType: "question_answered",
      kategorie: "gefahrenlehre",
      richtig: true,
    });
    const res = await POST(makeRequest("/api/analytics/theorie", {}, { method: "POST", body }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.count).toBe(1);
  });

  it("supports batch event submission", async () => {
    mockFrom.mockReturnValue(chainMock({ data: {}, error: null }));
    const body = JSON.stringify({
      tenantId: "t1",
      userId: "u1",
      events: [
        { eventType: "question_answered", richtig: true },
        { eventType: "quiz_completed" },
        { eventType: "invalid_type" }, // This one should be filtered out
      ],
    });
    const res = await POST(makeRequest("/api/analytics/theorie", {}, { method: "POST", body }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.count).toBe(2); // Only 2 valid events
  });

  it("rejects invalid kategorie values", async () => {
    mockFrom.mockReturnValue(chainMock({ data: {}, error: null }));
    const body = JSON.stringify({
      tenantId: "t1",
      userId: "u1",
      eventType: "question_answered",
      kategorie: "not_a_real_category",
    });
    const res = await POST(makeRequest("/api/analytics/theorie", {}, { method: "POST", body }));
    expect(res.status).toBe(400);
  });
});
