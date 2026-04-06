import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: vi.fn() },
    from: mockFrom,
  })),
}));

vi.mock("@/lib/monitoring", () => ({
  getHealthStatus: vi.fn(async () => ({
    status: "ok",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  })),
}));

vi.mock("@/lib/blog", () => ({
  getAllPosts: vi.fn(() => [
    { title: "Post 1", slug: "post-1", excerpt: "Excerpt 1", category: "pruefungstipps", content: "content" },
  ]),
}));

vi.mock("@/lib/api-auth", async () => {
  const actual = await vi.importActual("@/lib/api-auth");
  return {
    ...actual,
    rateLimit: () => () => false,
    getClientIp: () => "127.0.0.1",
    safeCompare: (a: string, b: string) => a === b,
    requireAuth: vi.fn(async () => ({ userId: "u1", tenantId: "t1", role: "inhaber" })),
    isAuthed: (r: unknown) => !(r instanceof Response) && !(r && typeof r === "object" && "status" in r && typeof (r as { json?: unknown }).json === "function"),
  };
});

import { POST as anmeldungPOST, OPTIONS as anmeldungOPTIONS } from "@/app/api/anmeldung/route";
import { POST as wartelistePOST, GET as wartelisteGET } from "@/app/api/warteliste/route";
import { POST as newsletterPOST } from "@/app/api/newsletter/route";
import { POST as newsletterGeneratePOST } from "@/app/api/newsletter/generate/route";
import { GET as healthGET } from "@/app/api/health/route";
import { NextRequest } from "next/server";

function makeRequest(method: string, url: string, body?: object, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost${url}`, {
    method,
    ...(body ? { body: JSON.stringify(body), headers: { "content-type": "application/json", ...headers } } : { headers }),
  });
}

function chainMock(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  ["select", "insert", "update", "delete", "eq", "neq", "is", "in", "gte", "lte", "order", "limit", "range", "maybeSingle", "single", "csv", "count"].forEach(m => {
    chain[m] = vi.fn(() => ["maybeSingle", "single", "csv", "count"].includes(m) ? result : chain);
  });
  return chain;
}

const VALID_ANMELDUNG = {
  vorname: "Max",
  nachname: "Mustermann",
  geburtsdatum: "2000-01-01",
  email: "max@example.com",
  telefon: "0171 1234567",
  plz: "70173",
  ort: "Stuttgart",
  fuehrerscheinklasse: "B",
  dsgvo: true,
  kontaktEinwilligung: true,
};

// ---------------------------------------------------------------------------
// Anmeldung
// ---------------------------------------------------------------------------
describe("POST /api/anmeldung", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 on valid submission", async () => {
    const res = await anmeldungPOST(makeRequest("POST", "/api/anmeldung", VALID_ANMELDUNG));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await anmeldungPOST(makeRequest("POST", "/api/anmeldung", { vorname: "Max" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.missingFields).toBeDefined();
    expect(json.missingFields.length).toBeGreaterThan(0);
  });

  it("returns 400 for invalid email", async () => {
    const res = await anmeldungPOST(makeRequest("POST", "/api/anmeldung", {
      ...VALID_ANMELDUNG,
      email: "not-an-email",
    }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.message).toMatch(/E-Mail/);
  });

  it("returns 400 for invalid PLZ", async () => {
    const res = await anmeldungPOST(makeRequest("POST", "/api/anmeldung", {
      ...VALID_ANMELDUNG,
      plz: "123",
    }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.message).toMatch(/Postleitzahl/);
  });

  it("sets CORS headers on successful response", async () => {
    const res = await anmeldungPOST(makeRequest("POST", "/api/anmeldung", VALID_ANMELDUNG));
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeDefined();
    expect(res.headers.get("Access-Control-Allow-Methods")).toContain("POST");
  });

  it("returns 500 on invalid JSON body", async () => {
    const req = new NextRequest("http://localhost/api/anmeldung", {
      method: "POST",
      body: "not json",
      headers: { "content-type": "application/json" },
    });
    const res = await anmeldungPOST(req);
    expect(res.status).toBe(500);
  });
});

describe("OPTIONS /api/anmeldung", () => {
  it("returns 204 with CORS headers", async () => {
    const res = await anmeldungOPTIONS(makeRequest("OPTIONS", "/api/anmeldung"));
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Methods")).toContain("POST");
  });
});

// ---------------------------------------------------------------------------
// Warteliste
// ---------------------------------------------------------------------------
describe("POST /api/warteliste", () => {
  beforeEach(() => vi.clearAllMocks());

  const VALID_WARTELISTE = {
    vorname: "Max",
    nachname: "Mustermann",
    email: "max@example.com",
    telefon: "0171 1234567",
    fuehrerscheinklasse: "B",
    tenantId: "t-1",
    dsgvo: true,
  };

  it("returns 200 on valid submission", async () => {
    mockFrom.mockReturnValue(chainMock({ data: { id: "w-1" }, error: null }));
    const res = await wartelistePOST(makeRequest("POST", "/api/warteliste", VALID_WARTELISTE));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("returns 400 when required fields missing", async () => {
    const res = await wartelistePOST(makeRequest("POST", "/api/warteliste", { vorname: "Max" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.missingFields.length).toBeGreaterThan(0);
  });

  it("returns 400 for invalid email", async () => {
    const res = await wartelistePOST(makeRequest("POST", "/api/warteliste", {
      ...VALID_WARTELISTE,
      email: "invalid",
    }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.message).toMatch(/E-Mail/);
  });

  it("returns 400 when DSGVO not accepted", async () => {
    const res = await wartelistePOST(makeRequest("POST", "/api/warteliste", {
      ...VALID_WARTELISTE,
      dsgvo: false,
    }));
    expect(res.status).toBe(400);
  });

  it("returns 500 on supabase insert error", async () => {
    mockFrom.mockReturnValue(chainMock({ data: null, error: { message: "DB error" } }));
    const res = await wartelistePOST(makeRequest("POST", "/api/warteliste", VALID_WARTELISTE));
    expect(res.status).toBe(500);
  });
});

describe("GET /api/warteliste", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 without tenantId", async () => {
    const res = await wartelisteGET(makeRequest("GET", "/api/warteliste"));
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Newsletter
// ---------------------------------------------------------------------------
describe("POST /api/newsletter", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns success on valid JSON email", async () => {
    const res = await newsletterPOST(makeRequest("POST", "/api/newsletter", { email: "test@example.com" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("returns 400 for missing email", async () => {
    const res = await newsletterPOST(makeRequest("POST", "/api/newsletter", { email: "" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for email without @", async () => {
    const res = await newsletterPOST(makeRequest("POST", "/api/newsletter", { email: "nope" }));
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Newsletter Generate
// ---------------------------------------------------------------------------
describe("POST /api/newsletter/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.ONBOARDING_API_KEY;
    delete process.env.CRON_SECRET;
    delete process.env.ANTHROPIC_API_KEY;
  });

  it("returns 401 without valid API key", async () => {
    const res = await newsletterGeneratePOST(makeRequest("POST", "/api/newsletter/generate", {}));
    expect(res.status).toBe(401);
  });

  it("returns fallback newsletter when no ANTHROPIC_API_KEY", async () => {
    process.env.ONBOARDING_API_KEY = "test-key";
    const res = await newsletterGeneratePOST(
      makeRequest("POST", "/api/newsletter/generate", {}, { authorization: "Bearer test-key" })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.subject).toBeDefined();
    expect(json.data.sections.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------
describe("GET /api/health", () => {
  it("returns 200 with health status", async () => {
    const res = await healthGET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("ok");
  });
});
