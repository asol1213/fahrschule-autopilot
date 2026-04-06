import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetUser, mockFrom, mockCreateLeadFromCall } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
  mockCreateLeadFromCall: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

vi.mock("@/lib/events/emit", () => ({
  emitEvent: vi.fn(),
}));

vi.mock("@/lib/monitoring", () => ({
  captureError: vi.fn(),
}));

vi.mock("jspdf", () => ({
  default: class MockJsPDF {
    internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 } };
    setFillColor() { return this; }
    rect() { return this; }
    setTextColor() { return this; }
    setFontSize() { return this; }
    setFont() { return this; }
    text() { return this; }
    setDrawColor() { return this; }
    setLineWidth() { return this; }
    line() { return this; }
    addPage() { return this; }
    output() { return new ArrayBuffer(100); }
  },
}));

vi.mock("@/lib/crm/lead-from-call", () => ({
  createLeadFromCall: (...args: unknown[]) => mockCreateLeadFromCall(...args),
}));

import { NextRequest, NextResponse } from "next/server";

function makeRequest(path: string, method: string, params: Record<string, string> = {}, body?: object, headers: Record<string, string> = {}) {
  const url = new URL(`http://localhost${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url, {
    method,
    ...(body ? { body: JSON.stringify(body), headers: { "content-type": "application/json", ...headers } } : { headers }),
  });
}

function chainMock(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  ["select", "insert", "update", "delete", "eq", "neq", "is", "in", "gte", "lte", "not", "order", "limit", "range", "maybeSingle", "single", "csv"].forEach(m => {
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

// ─── Pruefungsreife Tests ───
describe("GET /api/crm/pruefungsreife", () => {
  let GET: (req: NextRequest) => Promise<NextResponse>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/crm/pruefungsreife/route");
    GET = mod.GET;
  });

  it("returns 400 when schuelerId or tenantId is missing", async () => {
    const res = await GET(makeRequest("/api/crm/pruefungsreife", "GET", { tenantId: "t-1" }));
    expect(res.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    mockNoAuth();
    const res = await GET(makeRequest("/api/crm/pruefungsreife", "GET", { tenantId: "t-1", schuelerId: "s-1" }));
    expect(res.status).toBe(401);
  });

  it("returns 404 when student not found", async () => {
    mockAuth();
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      return chainMock({ data: null, error: null });
    });

    const res = await GET(makeRequest("/api/crm/pruefungsreife", "GET", { tenantId: "tenant-1", schuelerId: "s-999" }));
    expect(res.status).toBe(404);
  });

  it("returns pruefungsreife assessment", async () => {
    mockAuth();
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "schueler") {
        return chainMock({ data: { id: "s-1", vorname: "Max", nachname: "Muster" }, error: null });
      }
      if (table === "fahrstunden") {
        return chainMock({ data: [], error: null });
      }
      if (table === "dokumente") {
        return chainMock({ data: [], error: null });
      }
      if (table === "pruefungen") {
        return chainMock({ data: [], error: null });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest("/api/crm/pruefungsreife", "GET", { tenantId: "tenant-1", schuelerId: "s-1" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.schuelerId).toBe("s-1");
    expect(json.pruefungsreif).toBe(false);
    expect(json.score).toBeDefined();
    expect(json.details).toBeDefined();
    expect(json.empfehlung).toBeDefined();
  });
});

// ─── Calendar Sync Tests ───
describe("GET /api/crm/calendar-sync", () => {
  let GET: (req: NextRequest) => Promise<NextResponse | Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/crm/calendar-sync/route");
    GET = mod.GET;
  });

  it("returns 400 when tenantId is missing", async () => {
    const res = await GET(makeRequest("/api/crm/calendar-sync", "GET"));
    const response = res instanceof NextResponse ? res : new NextResponse(null, { status: (res as Response).status });
    expect(response.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    mockNoAuth();
    const res = await GET(makeRequest("/api/crm/calendar-sync", "GET", { tenantId: "t-1" }));
    const response = res instanceof NextResponse ? res : new NextResponse(null, { status: (res as Response).status });
    expect(response.status).toBe(401);
  });

  it("returns JSON format by default when format not ical", async () => {
    mockAuth();
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "fahrstunden") {
        return chainMock({ data: [], error: null });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest("/api/crm/calendar-sync", "GET", { tenantId: "tenant-1", format: "json" }));
    expect(res.status).toBe(200);
  });

  it("returns iCal format when format=ical", async () => {
    mockAuth();
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "fahrstunden") {
        return chainMock({
          data: [{
            id: "fs-1",
            datum: "2026-03-15",
            uhrzeit: "10:00",
            dauer: 45,
            typ: "normal",
            schueler: { vorname: "Max", nachname: "Muster", telefon: "+491234" },
            fahrlehrer: { vorname: "Hans", nachname: "Schmidt" },
          }],
          error: null,
        });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest("/api/crm/calendar-sync", "GET", { tenantId: "tenant-1", format: "ical" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toMatch(/text\/calendar/);

    const body = await res.text();
    expect(body).toContain("BEGIN:VCALENDAR");
    expect(body).toContain("BEGIN:VEVENT");
    expect(body).toContain("END:VCALENDAR");
  });
});

// ─── Calendar Sync POST Tests ───
describe("POST /api/crm/calendar-sync", () => {
  let POST: (req: NextRequest) => Promise<NextResponse>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/crm/calendar-sync/route");
    POST = mod.POST;
  });

  it("returns 400 when tenantId is missing", async () => {
    mockAuth();
    const res = await POST(makeRequest("/api/crm/calendar-sync", "POST", {}, {}));
    expect(res.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    mockNoAuth();
    const res = await POST(makeRequest("/api/crm/calendar-sync", "POST", {}, { tenantId: "t-1" }));
    expect(res.status).toBe(401);
  });

  it("configures calendar sync successfully", async () => {
    mockAuth();
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "tenants") {
        return chainMock({ data: null, error: null });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await POST(makeRequest("/api/crm/calendar-sync", "POST", {}, { tenantId: "tenant-1" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.icalUrl).toBeDefined();
  });
});

// ─── Ausbildungsnachweis Tests ───
describe("GET /api/crm/ausbildungsnachweis", () => {
  let GET: (req: NextRequest) => Promise<NextResponse>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/crm/ausbildungsnachweis/route");
    GET = mod.GET;
  });

  it("returns 400 when schuelerId or tenantId is missing", async () => {
    const res = await GET(makeRequest("/api/crm/ausbildungsnachweis", "GET", { tenantId: "t-1" }));
    expect(res.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    mockNoAuth();
    const res = await GET(makeRequest("/api/crm/ausbildungsnachweis", "GET", { tenantId: "t-1", schuelerId: "s-1" }));
    expect(res.status).toBe(401);
  });

  it("returns 404 when student not found", async () => {
    mockAuth();
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      return chainMock({ data: null, error: null });
    });

    const res = await GET(makeRequest("/api/crm/ausbildungsnachweis", "GET", { tenantId: "tenant-1", schuelerId: "s-999" }));
    expect(res.status).toBe(404);
  });

  it("generates PDF for valid student", async () => {
    mockAuth();
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "schueler") {
        return chainMock({
          data: { id: "s-1", vorname: "Max", nachname: "Muster", geburtsdatum: "2000-01-15", fuehrerscheinklasse: "B", status: "praxis", created_at: "2026-01-01" },
          error: null,
        });
      }
      if (table === "tenants") {
        return chainMock({ data: { name: "Testfahrschule" }, error: null });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest("/api/crm/ausbildungsnachweis", "GET", { tenantId: "tenant-1", schuelerId: "s-1" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toMatch(/Ausbildungsnachweis/);
  });
});

// ─── Pruefungserinnerungen Tests ───
describe("GET /api/crm/pruefungserinnerungen", () => {
  let GET: (req: NextRequest) => Promise<NextResponse>;

  beforeEach(async () => {
    vi.clearAllMocks();
    delete process.env.CRON_SECRET;
    delete process.env.WEBHOOK_PRUEFUNGSERINNERUNG_URL;
    const mod = await import("@/app/api/crm/pruefungserinnerungen/route");
    GET = mod.GET;
  });

  it("returns 401 when no valid cron secret", async () => {
    process.env.CRON_SECRET = "my-secret";
    const res = await GET(makeRequest("/api/crm/pruefungserinnerungen", "GET", {}, undefined, { authorization: "Bearer wrong" }));
    expect(res.status).toBe(401);
  });

  it("returns 401 when CRON_SECRET is not configured", async () => {
    const res = await GET(makeRequest("/api/crm/pruefungserinnerungen", "GET", {}, undefined, { authorization: "Bearer something" }));
    expect(res.status).toBe(401);
  });

  it("returns 200 with valid cron secret and no upcoming exams", async () => {
    process.env.CRON_SECRET = "my-secret";
    mockFrom.mockImplementation((table: string) => {
      if (table === "pruefungen") {
        return chainMock({ data: [], error: null });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest("/api/crm/pruefungserinnerungen", "GET", {}, undefined, { authorization: "Bearer my-secret" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.sent).toBe(0);
  });
});

// ─── Rechnungen Tests ───
describe("GET /api/crm/rechnungen", () => {
  let GET: (req: NextRequest) => Promise<NextResponse>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/crm/rechnungen/route");
    GET = mod.GET;
  });

  it("returns 400 when tenantId is missing", async () => {
    const res = await GET(makeRequest("/api/crm/rechnungen", "GET"));
    expect(res.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    mockNoAuth();
    const res = await GET(makeRequest("/api/crm/rechnungen", "GET", { tenantId: "t-1" }));
    expect(res.status).toBe(401);
  });

  it("returns revenue report with period aggregation", async () => {
    mockAuth();
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "zahlungen") {
        return chainMock({
          data: [
            { betrag: 55, status: "bezahlt", faellig_am: "2026-01-15", bezahlt_am: "2026-01-20", created_at: "2026-01-10" },
            { betrag: 110, status: "offen", faellig_am: "2026-02-15", bezahlt_am: null, created_at: "2026-02-10" },
          ],
          error: null,
        });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest("/api/crm/rechnungen", "GET", { tenantId: "tenant-1" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.zusammenfassung).toBeDefined();
    expect(json.zusammenfassung.umsatzGesamt).toBe(165);
    expect(json.zusammenfassung.bezahlt).toBe(55);
    expect(json.zusammenfassung.offen).toBe(110);
    expect(json.perioden).toBeDefined();
  });

  it("supports quartal aggregation", async () => {
    mockAuth();
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "zahlungen") {
        return chainMock({ data: [], error: null });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest("/api/crm/rechnungen", "GET", { tenantId: "tenant-1", zeitraum: "quartal" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.zeitraum).toBe("quartal");
  });
});

// ─── Lead from Call Tests ───
describe("POST /api/crm/lead-from-call", () => {
  let POST: (req: NextRequest) => Promise<NextResponse>;

  beforeEach(async () => {
    vi.clearAllMocks();
    delete process.env.RETELL_WEBHOOK_SECRET;
    delete process.env.WEBHOOK_SECRET;
    const mod = await import("@/app/api/crm/lead-from-call/route");
    POST = mod.POST;
  });

  it("returns 500 when webhook secret is not configured", async () => {
    const res = await POST(makeRequest("/api/crm/lead-from-call", "POST", {}, { test: true }));
    expect(res.status).toBe(500);
  });

  it("returns 401 when API key does not match", async () => {
    process.env.RETELL_WEBHOOK_SECRET = "correct-secret";
    const res = await POST(makeRequest("/api/crm/lead-from-call", "POST", {}, { test: true }, { "X-API-Key": "wrong-secret" }));
    expect(res.status).toBe(401);
  });

  it("creates lead with valid auth and data", async () => {
    process.env.RETELL_WEBHOOK_SECRET = "correct-secret";
    const result = { success: true, schuelerId: "s-1" };
    mockCreateLeadFromCall.mockResolvedValue(result);

    const res = await POST(makeRequest("/api/crm/lead-from-call", "POST", {}, {
      vorname: "Max",
      nachname: "Muster",
      telefon: "+491234",
      tenantId: "tenant-1",
    }, { "X-API-Key": "correct-secret" }));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("returns 400 when createLeadFromCall throws validation error", async () => {
    process.env.RETELL_WEBHOOK_SECRET = "correct-secret";
    mockCreateLeadFromCall.mockRejectedValue(new Error("tenantId is required"));

    const res = await POST(makeRequest("/api/crm/lead-from-call", "POST", {}, {}, { "X-API-Key": "correct-secret" }));
    expect(res.status).toBe(400);
  });
});

// ─── Stornierung Tests ───
describe("POST /api/crm/stornierung", () => {
  let POST: (req: NextRequest) => Promise<NextResponse>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/crm/stornierung/route");
    POST = mod.POST;
  });

  it("returns 400 when fahrstundeId is missing", async () => {
    mockAuth();
    const res = await POST(makeRequest("/api/crm/stornierung", "POST", {}, {}));
    expect(res.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    mockNoAuth();
    const res = await POST(makeRequest("/api/crm/stornierung", "POST", {}, { fahrstundeId: "fs-1" }));
    expect(res.status).toBe(401);
  });

  it("returns 404 when fahrstunde not found", async () => {
    mockAuth();
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "fahrstunden") {
        return chainMock({ data: null, error: null });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await POST(makeRequest("/api/crm/stornierung", "POST", {}, { fahrstundeId: "fs-999" }));
    expect(res.status).toBe(404);
  });

  it("rejects cancellation of non-geplant fahrstunde", async () => {
    mockAuth();
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "fahrstunden") {
        return chainMock({
          data: { id: "fs-1", status: "abgeschlossen", datum: "2026-03-20", uhrzeit: "10:00", schueler_id: "s-1", tenant_id: "tenant-1" },
          error: null,
        });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await POST(makeRequest("/api/crm/stornierung", "POST", {}, { fahrstundeId: "fs-1" }));
    expect(res.status).toBe(400);
  });

  it("cancels lesson successfully without late fee when > 24h", async () => {
    mockAuth();
    // Lesson in the future (> 24h from now)
    const futureDatum = new Date();
    futureDatum.setDate(futureDatum.getDate() + 3);
    const datumStr = futureDatum.toISOString().split("T")[0];

    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_users") {
        return chainMock({ data: { tenant_id: "tenant-1", role: "inhaber" }, error: null });
      }
      if (table === "fahrstunden") {
        return chainMock({
          data: { id: "fs-1", status: "geplant", datum: datumStr, uhrzeit: "10:00", schueler_id: "s-1", tenant_id: "tenant-1", fahrlehrer_id: "fl-1" },
          error: null,
        });
      }
      return chainMock({ data: [], error: null });
    });

    const res = await POST(makeRequest("/api/crm/stornierung", "POST", {}, { fahrstundeId: "fs-1" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.lateCancel).toBe(false);
    expect(json.stornogebuehr).toBe(0);
  });
});
