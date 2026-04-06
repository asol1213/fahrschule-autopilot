import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

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

vi.mock("@/lib/api-auth", async () => {
  const actual = await vi.importActual("@/lib/api-auth");
  return {
    ...actual,
    rateLimit: () => () => false,
    getClientIp: () => "127.0.0.1",
    safeCompare: (a: string, b: string) => a === b,
  };
});

import { POST as webhookEventsPOST } from "@/app/api/webhooks/events/route";
import { POST as dsgvoPOST, GET as dsgvoGET, DELETE as dsgvoDELETE } from "@/app/api/dsgvo/anrufe-archivieren/route";
import { NextRequest } from "next/server";

function chainMock(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = { data: result.data, error: result.error };
  const methods = ["select", "insert", "update", "delete", "eq", "neq", "is", "in", "lt", "gte", "lte", "not", "order", "limit", "range", "maybeSingle", "single", "csv", "count"];
  methods.forEach(m => {
    chain[m] = vi.fn(() => ["maybeSingle", "single", "csv", "count"].includes(m) ? result : chain);
  });
  // Make chain thenable so `await supabase.from(...).select(...)...` resolves to result
  chain.then = vi.fn((resolve: (v: unknown) => unknown) => Promise.resolve(resolve(result)));
  return chain;
}

function makeSignedWebhookRequest(body: object, secret: string): NextRequest {
  const rawBody = JSON.stringify(body);
  const signature = `sha256=${crypto.createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  return new NextRequest("http://localhost/api/webhooks/events", {
    method: "POST",
    body: rawBody,
    headers: {
      "content-type": "application/json",
      "X-Webhook-Signature": signature,
    },
  });
}

function makeRequest(method: string, url: string, body?: object | string, headers: Record<string, string> = {}) {
  const isString = typeof body === "string";
  return new NextRequest(`http://localhost${url}`, {
    method,
    ...(body ? {
      body: isString ? body : JSON.stringify(body),
      headers: { "content-type": "application/json", ...headers },
    } : { headers }),
  });
}

// ---------------------------------------------------------------------------
// POST /api/webhooks/events
// ---------------------------------------------------------------------------
describe("POST /api/webhooks/events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.WEBHOOK_SECRET;
  });

  it("returns 401 without valid signature", async () => {
    process.env.WEBHOOK_SECRET = "test-secret";
    const req = makeRequest("POST", "/api/webhooks/events", { type: "test" });
    const res = await webhookEventsPOST(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 when WEBHOOK_SECRET not configured", async () => {
    const req = makeRequest("POST", "/api/webhooks/events", { type: "test" }, { "X-Webhook-Signature": "sha256=abc" });
    const res = await webhookEventsPOST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when type is missing", async () => {
    process.env.WEBHOOK_SECRET = "test-secret";
    // Tenant lookup
    mockFrom.mockReturnValue(chainMock({ data: { id: "t-1" }, error: null }));
    const req = makeSignedWebhookRequest({ tenantId: "t-1" }, "test-secret");
    const res = await webhookEventsPOST(req);
    expect(res.status).toBe(400);
  });

  it("returns 403 for invalid tenantId", async () => {
    process.env.WEBHOOK_SECRET = "test-secret";
    mockFrom.mockReturnValue(chainMock({ data: null, error: null }));

    const req = makeSignedWebhookRequest({ type: "anmeldung.neu", tenantId: "invalid" }, "test-secret");
    const res = await webhookEventsPOST(req);
    expect(res.status).toBe(403);
  });

  it("handles anmeldung.neu event", async () => {
    process.env.WEBHOOK_SECRET = "test-secret";

    // tenant lookup, then schueler insert, then dokumente insert
    const tenantChain = chainMock({ data: { id: "t-1" }, error: null });
    const insertChain = chainMock({ data: { id: "s-new" }, error: null });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? tenantChain : insertChain;
    });

    const req = makeSignedWebhookRequest({
      type: "anmeldung.neu",
      tenantId: "t-1",
      data: {
        vorname: "Max",
        nachname: "Mustermann",
        email: "max@example.com",
        telefon: "0171 1234567",
        geburtsdatum: "2000-01-01",
        fuehrerscheinklasse: "B",
      },
    }, "test-secret");

    const res = await webhookEventsPOST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.schuelerId).toBe("s-new");
  });

  it("handles anruf.beendet event", async () => {
    process.env.WEBHOOK_SECRET = "test-secret";

    const tenantChain = chainMock({ data: { id: "t-1" }, error: null });
    const insertChain = chainMock({ data: null, error: null });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? tenantChain : insertChain;
    });

    const req = makeSignedWebhookRequest({
      type: "anruf.beendet",
      tenantId: "t-1",
      data: { schuelerId: "s-1", dauer: 120, zusammenfassung: "Terminanfrage" },
    }, "test-secret");

    const res = await webhookEventsPOST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toMatch(/protokolliert/);
  });

  it("handles whatsapp.empfangen event", async () => {
    process.env.WEBHOOK_SECRET = "test-secret";

    const tenantChain = chainMock({ data: { id: "t-1" }, error: null });
    const insertChain = chainMock({ data: null, error: null });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? tenantChain : insertChain;
    });

    const req = makeSignedWebhookRequest({
      type: "whatsapp.empfangen",
      tenantId: "t-1",
      data: { schuelerId: "s-1", nachricht: "Hallo, wann ist mein Termin?" },
    }, "test-secret");

    const res = await webhookEventsPOST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toMatch(/WhatsApp/);
  });

  it("handles zahlung.eingang event", async () => {
    process.env.WEBHOOK_SECRET = "test-secret";

    const tenantChain = chainMock({ data: { id: "t-1" }, error: null });
    const updateChain = chainMock({ data: null, error: null });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? tenantChain : updateChain;
    });

    const req = makeSignedWebhookRequest({
      type: "zahlung.eingang",
      tenantId: "t-1",
      data: { zahlungId: "z-1" },
    }, "test-secret");

    const res = await webhookEventsPOST(req);
    expect(res.status).toBe(200);
  });

  it("returns 400 for unknown event type", async () => {
    process.env.WEBHOOK_SECRET = "test-secret";
    mockFrom.mockReturnValue(chainMock({ data: { id: "t-1" }, error: null }));

    const req = makeSignedWebhookRequest({
      type: "unknown.event",
      tenantId: "t-1",
      data: {},
    }, "test-secret");

    const res = await webhookEventsPOST(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// DSGVO Anrufe Archivieren
// ---------------------------------------------------------------------------
describe("POST /api/dsgvo/anrufe-archivieren", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CRON_SECRET;
  });

  it("returns 503 without CRON_SECRET", async () => {
    const res = await dsgvoPOST(makeRequest("POST", "/api/dsgvo/anrufe-archivieren", { tenantId: "t-1" }));
    expect(res.status).toBe(503);
  });

  it("returns 401 with wrong secret", async () => {
    process.env.CRON_SECRET = "correct-secret";
    const res = await dsgvoPOST(makeRequest("POST", "/api/dsgvo/anrufe-archivieren", { tenantId: "t-1" }, { authorization: "Bearer wrong" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 without tenantId", async () => {
    process.env.CRON_SECRET = "secret";
    const res = await dsgvoPOST(makeRequest("POST", "/api/dsgvo/anrufe-archivieren", {}, { authorization: "Bearer secret" }));
    expect(res.status).toBe(400);
  });

  it("archives old calls successfully", async () => {
    process.env.CRON_SECRET = "secret";

    // select old calls -> archive insert -> delete originals -> audit log
    const selectChain = chainMock({
      data: [{ id: "a-1", tenant_id: "t-1", call_id: "c-1", created_at: "2025-01-01T00:00:00Z", dauer_sekunden: 60, intent: "anmeldung", sentiment: "positive", fuehrerscheinklasse: "B", is_new_lead: true, archiviert: false }],
      error: null,
    });
    const insertChain = chainMock({ data: null, error: null });
    const deleteChain = chainMock({ data: null, error: null });
    const auditChain = chainMock({ data: null, error: null });
    // Add then() for audit log chain
    auditChain.then = vi.fn((cb: (arg: { error: unknown }) => void) => { cb({ error: null }); return auditChain; });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return selectChain;
      if (callCount === 2) return insertChain;
      if (callCount === 3) return deleteChain;
      return auditChain;
    });

    const res = await dsgvoPOST(makeRequest("POST", "/api/dsgvo/anrufe-archivieren", { tenantId: "t-1" }, { authorization: "Bearer secret" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.archiviert).toBe(1);
  });

  it("handles no old calls found", async () => {
    process.env.CRON_SECRET = "secret";
    mockFrom.mockReturnValue(chainMock({ data: [], error: null }));

    const res = await dsgvoPOST(makeRequest("POST", "/api/dsgvo/anrufe-archivieren", { tenantId: "t-1", tage: 90 }, { authorization: "Bearer secret" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.archiviert).toBe(0);
  });
});

describe("GET /api/dsgvo/anrufe-archivieren (cron)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CRON_SECRET;
  });

  it("returns 503 without CRON_SECRET", async () => {
    const res = await dsgvoGET(makeRequest("GET", "/api/dsgvo/anrufe-archivieren"));
    expect(res.status).toBe(503);
  });

  it("processes all tenants", async () => {
    process.env.CRON_SECRET = "secret";

    // tenants query -> per-tenant archive calls
    const tenantsChain = chainMock({ data: [{ id: "t-1" }, { id: "t-2" }], error: null });
    // archive queries return no old calls
    const emptyChain = chainMock({ data: [], error: null });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? tenantsChain : emptyChain;
    });

    const res = await dsgvoGET(makeRequest("GET", "/api/dsgvo/anrufe-archivieren", undefined, { authorization: "Bearer secret" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.tenants).toBe(2);
  });
});

describe("DELETE /api/dsgvo/anrufe-archivieren", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CRON_SECRET;
  });

  it("returns 503 without CRON_SECRET", async () => {
    const res = await dsgvoDELETE(makeRequest("DELETE", "/api/dsgvo/anrufe-archivieren?anrufId=a-1&tenantId=t-1"));
    expect(res.status).toBe(503);
  });

  it("returns 400 without anrufId", async () => {
    process.env.CRON_SECRET = "secret";
    const res = await dsgvoDELETE(makeRequest("DELETE", "/api/dsgvo/anrufe-archivieren?tenantId=t-1", undefined, { authorization: "Bearer secret" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 without tenantId", async () => {
    process.env.CRON_SECRET = "secret";
    const res = await dsgvoDELETE(makeRequest("DELETE", "/api/dsgvo/anrufe-archivieren?anrufId=a-1", undefined, { authorization: "Bearer secret" }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when anruf not found", async () => {
    process.env.CRON_SECRET = "secret";
    mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
    const res = await dsgvoDELETE(makeRequest("DELETE", "/api/dsgvo/anrufe-archivieren?anrufId=a-404&tenantId=t-1", undefined, { authorization: "Bearer secret" }));
    expect(res.status).toBe(404);
  });

  it("deletes single call (Art. 17)", async () => {
    process.env.CRON_SECRET = "secret";

    const selectChain = chainMock({
      data: { id: "a-1", tenant_id: "t-1", call_id: "c-1", created_at: "2025-06-01T00:00:00Z", dauer_sekunden: 30, intent: "termin", sentiment: "positive", fuehrerscheinklasse: "B", is_new_lead: false },
      error: null,
    });
    const insertChain = chainMock({ data: null, error: null });
    const deleteChain = chainMock({ data: null, error: null });
    const auditChain = chainMock({ data: null, error: null });
    auditChain.then = vi.fn((cb: (arg: { error: unknown }) => void) => { cb({ error: null }); return auditChain; });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return selectChain;
      if (callCount === 2) return insertChain;
      if (callCount === 3) return deleteChain;
      return auditChain;
    });

    const res = await dsgvoDELETE(makeRequest("DELETE", "/api/dsgvo/anrufe-archivieren?anrufId=a-1&tenantId=t-1", undefined, { authorization: "Bearer secret" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.message).toMatch(/DSGVO-konform/);
  });
});
