import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    set: vi.fn(),
  })),
}));

vi.mock("@/lib/onboarding", () => ({
  onboardNewCustomer: vi.fn(async () => ({ success: true, tenantId: "t-new", checklist: [] })),
}));

vi.mock("@/lib/social", () => ({
  generateSocialPosts: vi.fn(async () => ({ instagram: "Post", facebook: "Post" })),
}));

vi.mock("@/lib/api-auth", async () => {
  const actual = await vi.importActual("@/lib/api-auth");
  return {
    ...actual,
    rateLimit: () => () => false,
    getClientIp: () => "127.0.0.1",
    safeCompare: (a: string, b: string) => a === b,
    requireAuth: vi.fn(async () => ({ userId: "u1", tenantId: "t1", role: "inhaber" })),
    isAuthed: (r: unknown) => !(r instanceof NextResponse),
    requireServiceKey: vi.fn(() => null),
    isServiceKeyError: (r: unknown) => r !== null,
  };
});

vi.mock("@/lib/telefon/phone-utils", () => ({
  phoneSearchSuffix: vi.fn(() => "1234567"),
}));

vi.mock("@/lib/crm/lead-from-call", () => ({
  createLeadFromCall: vi.fn(async () => ({ message: "Lead erstellt" })),
}));

import { POST as switchTenantPOST } from "@/app/api/switch-tenant/route";
import { GET as testimonialsGET, POST as testimonialsPOST } from "@/app/api/testimonials/route";
import { POST as socialPOST } from "@/app/api/social/route";
import { POST as gmbPOST } from "@/app/api/gmb/route";
import { POST as onboardingPOST } from "@/app/api/onboarding/route";
import { GET as meineDatenGET } from "@/app/api/schueler/meine-daten/route";
import { GET as retellGET, POST as retellPOST } from "@/app/api/retell/route";
import { GET as retellAgentsGET, POST as retellAgentsPOST } from "@/app/api/retell/agents/route";
import { GET as theorieGET, POST as theoriePOST } from "@/app/api/progress/theorie/route";
import { NextRequest } from "next/server";

function makeRequest(method: string, url: string, body?: object, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost${url}`, {
    method,
    ...(body ? { body: JSON.stringify(body), headers: { "content-type": "application/json", ...headers } } : { headers }),
  });
}

function chainMock(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  ["select", "insert", "update", "upsert", "delete", "eq", "neq", "is", "ilike", "in", "gte", "lte", "not", "order", "limit", "range", "maybeSingle", "single", "csv", "count"].forEach(m => {
    chain[m] = vi.fn(() => ["maybeSingle", "single", "csv", "count"].includes(m) ? result : chain);
  });
  return chain;
}

// ---------------------------------------------------------------------------
// Switch Tenant
// ---------------------------------------------------------------------------
describe("POST /api/switch-tenant", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 without tenantId", async () => {
    const res = await switchTenantPOST(makeRequest("POST", "/api/switch-tenant", {}));
    expect(res.status).toBe(400);
  });

  it("sets cookie and returns ok", async () => {
    const res = await switchTenantPOST(makeRequest("POST", "/api/switch-tenant", { tenantId: "t-1" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Testimonials
// ---------------------------------------------------------------------------
describe("GET /api/testimonials", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns testimonials from DB", async () => {
    mockFrom.mockReturnValue(chainMock({
      data: [{ id: "1", name: "Max", text: "Super!", sterne: 5 }],
      error: null,
    }));
    const res = await testimonialsGET(makeRequest("GET", "/api/testimonials"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.length).toBeGreaterThan(0);
  });

  it("returns fallback testimonials when DB empty", async () => {
    mockFrom.mockReturnValue(chainMock({ data: [], error: null }));
    const res = await testimonialsGET(makeRequest("GET", "/api/testimonials"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.length).toBeGreaterThan(0);
  });
});

describe("POST /api/testimonials", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when name missing", async () => {
    const res = await testimonialsPOST(makeRequest("POST", "/api/testimonials", { text: "Hi", sterne: 5 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when sterne out of range", async () => {
    const res = await testimonialsPOST(makeRequest("POST", "/api/testimonials", { name: "Max", text: "Hi", sterne: 6 }));
    expect(res.status).toBe(400);
  });

  it("returns 201 on valid submission", async () => {
    mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
    const res = await testimonialsPOST(makeRequest("POST", "/api/testimonials", {
      name: "Max M.",
      stadt: "Stuttgart",
      text: "Toll!",
      sterne: 5,
    }));
    expect(res.status).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// Social
// ---------------------------------------------------------------------------
describe("POST /api/social", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_API_KEY = "admin-key";
  });

  it("returns 400 without title/excerpt", async () => {
    const res = await socialPOST(makeRequest("POST", "/api/social", {}, { "x-admin-key": "admin-key" }));
    expect(res.status).toBe(400);
  });

  it("generates social posts successfully", async () => {
    const res = await socialPOST(makeRequest("POST", "/api/social", {
      title: "Test Post",
      excerpt: "An excerpt",
      slug: "test-post",
    }, { "x-admin-key": "admin-key" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// GMB
// ---------------------------------------------------------------------------
describe("POST /api/gmb", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_API_KEY = "admin-key";
    delete process.env.ANTHROPIC_API_KEY;
  });

  it("returns 400 without type", async () => {
    const res = await gmbPOST(makeRequest("POST", "/api/gmb", {}, { "x-admin-key": "admin-key" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid type", async () => {
    const res = await gmbPOST(makeRequest("POST", "/api/gmb", { type: "invalid" }, { "x-admin-key": "admin-key" }));
    expect(res.status).toBe(400);
  });

  it("generates review link", async () => {
    const res = await gmbPOST(makeRequest("POST", "/api/gmb", {
      type: "review_link",
      placeId: "ChIJN1t_tDeuEmsR",
    }, { "x-admin-key": "admin-key" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.reviewUrl).toContain("google.com");
  });

  it("returns 400 for review_link without placeId", async () => {
    const res = await gmbPOST(makeRequest("POST", "/api/gmb", { type: "review_link" }, { "x-admin-key": "admin-key" }));
    expect(res.status).toBe(400);
  });

  it("returns fallback template for post without AI", async () => {
    const res = await gmbPOST(makeRequest("POST", "/api/gmb", {
      type: "post",
      fahrschulName: "Testschule",
      stadt: "Berlin",
    }, { "x-admin-key": "admin-key" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.text).toContain("Testschule");
  });
});

// ---------------------------------------------------------------------------
// Onboarding
// ---------------------------------------------------------------------------
describe("POST /api/onboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.ONBOARDING_API_KEY;
  });

  it("returns 401 without API key", async () => {
    const res = await onboardingPOST(makeRequest("POST", "/api/onboarding", {}));
    expect(res.status).toBe(401);
  });

  it("returns 400 when required fields missing", async () => {
    process.env.ONBOARDING_API_KEY = "key1";
    const res = await onboardingPOST(makeRequest("POST", "/api/onboarding", { fahrschulName: "Test" }, { authorization: "Bearer key1" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid plan", async () => {
    process.env.ONBOARDING_API_KEY = "key1";
    const res = await onboardingPOST(makeRequest("POST", "/api/onboarding", {
      fahrschulName: "Test", inhaber: "Max", stadt: "Berlin", adresse: "Str 1", telefon: "123", email: "a@b.com", plan: "enterprise",
    }, { authorization: "Bearer key1" }));
    expect(res.status).toBe(400);
  });

  it("onboards successfully with valid data", async () => {
    process.env.ONBOARDING_API_KEY = "key1";
    const res = await onboardingPOST(makeRequest("POST", "/api/onboarding", {
      fahrschulName: "Test Fahrschule",
      inhaber: "Max Mustermann",
      stadt: "Stuttgart",
      adresse: "Hauptstr. 1",
      telefon: "0711 123456",
      email: "info@test.de",
      plan: "pro",
    }, { authorization: "Bearer key1" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Schueler Meine Daten
// ---------------------------------------------------------------------------
describe("GET /api/schueler/meine-daten", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "not authed" } });
    const res = await meineDatenGET(makeRequest("GET", "/api/schueler/meine-daten"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when no student record found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1", email: "a@b.com" } }, error: null });
    mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
    const res = await meineDatenGET(makeRequest("GET", "/api/schueler/meine-daten"));
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Retell (fonio) webhook health
// ---------------------------------------------------------------------------
describe("GET /api/retell", () => {
  it("returns health status", async () => {
    const res = await retellGET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("ok");
    expect(json.service).toContain("fonio");
  });
});

describe("POST /api/retell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.FONIO_WEBHOOK_SECRET;
  });

  it("returns 500 when FONIO_WEBHOOK_SECRET not configured", async () => {
    const req = new NextRequest("http://localhost/api/retell", {
      method: "POST",
      body: JSON.stringify({ call_id: "c-1" }),
      headers: { "content-type": "application/json" },
    });
    const res = await retellPOST(req);
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// Retell Agents
// ---------------------------------------------------------------------------
describe("GET /api/retell/agents", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 without tenantId", async () => {
    const res = await retellAgentsGET(makeRequest("GET", "/api/retell/agents"));
    expect(res.status).toBe(400);
  });

  it("returns configured:false when no agent found", async () => {
    mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
    const res = await retellAgentsGET(makeRequest("GET", "/api/retell/agents?tenantId=t1"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.configured).toBe(false);
  });

  it("returns agent when configured", async () => {
    mockFrom.mockReturnValue(chainMock({
      data: { id: "ra-1", agent_id: "ag-1", agent_name: "Test", phone_number: "+49123", voice_provider: "fonio", voice_id: "v1", language: "de-DE", max_duration_seconds: 300, is_active: true, prompt_version: 1, custom_prompt_overrides: null, updated_at: "2026-01-01" },
      error: null,
    }));
    const res = await retellAgentsGET(makeRequest("GET", "/api/retell/agents?tenantId=t1"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.configured).toBe(true);
    expect(json.agent.agentId).toBe("ag-1");
  });
});

describe("POST /api/retell/agents", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 without tenantId and agentId", async () => {
    const res = await retellAgentsPOST(makeRequest("POST", "/api/retell/agents", {}));
    expect(res.status).toBe(400);
  });

  it("upserts agent successfully", async () => {
    mockFrom.mockReturnValue(chainMock({
      data: { id: "ra-1", tenant_id: "t1", agent_id: "ag-new" },
      error: null,
    }));

    const res = await retellAgentsPOST(makeRequest("POST", "/api/retell/agents", {
      tenantId: "t1",
      agentId: "ag-new",
      agentName: "Test Agent",
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Theorie Progress
// ---------------------------------------------------------------------------
describe("GET /api/progress/theorie", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "not authed" } });
    const res = await theorieGET(makeRequest("GET", "/api/progress/theorie"));
    expect(res.status).toBe(401);
  });

  it("returns null progress when no data found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
    const res = await theorieGET(makeRequest("GET", "/api/progress/theorie"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.progress).toBeNull();
  });

  it("returns progress data", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockFrom.mockReturnValue(chainMock({
      data: {
        xp: 150, best_streak: 5, total_correct: 50, total_wrong: 10,
        exams_passed: 2, exams_failed: 1, daily_goal: 20, daily_done: 15,
        daily_date: "2026-04-01", questions: {},
      },
      error: null,
    }));

    const res = await theorieGET(makeRequest("GET", "/api/progress/theorie"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.progress.xp).toBe(150);
    expect(json.progress.bestStreak).toBe(5);
  });
});

describe("POST /api/progress/theorie", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "not authed" } });
    const res = await theoriePOST(makeRequest("POST", "/api/progress/theorie", { xp: 10 }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid xp", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    const res = await theoriePOST(makeRequest("POST", "/api/progress/theorie", { xp: -5 }));
    expect(res.status).toBe(400);
  });

  it("upserts progress successfully", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockFrom.mockReturnValue(chainMock({ data: null, error: null }));

    const res = await theoriePOST(makeRequest("POST", "/api/progress/theorie", {
      xp: 200, bestStreak: 10, totalCorrect: 80, totalWrong: 20,
      dailyGoal: 20, dailyDone: 15, dailyDate: "2026-04-01",
      examsPassed: 3, examsFailed: 1, questions: {},
    }));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  it("returns 413 for oversized payload", async () => {
    const req = new NextRequest("http://localhost/api/progress/theorie", {
      method: "POST",
      body: JSON.stringify({ xp: 10 }),
      headers: { "content-type": "application/json", "content-length": "600000" },
    });
    const res = await theoriePOST(req);
    expect(res.status).toBe(413);
  });
});
