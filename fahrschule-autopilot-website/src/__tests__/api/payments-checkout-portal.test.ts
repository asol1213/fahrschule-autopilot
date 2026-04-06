import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFrom = vi.fn();
const mockGetUser = vi.fn();
const mockCustomersCreate = vi.fn();
const mockCheckoutCreate = vi.fn();
const mockPortalCreate = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

vi.mock("stripe", () => ({
  default: class StripeMock {
    customers = { create: mockCustomersCreate };
    checkout = { sessions: { create: mockCheckoutCreate } };
    billingPortal = { sessions: { create: mockPortalCreate } };
  },
}));

vi.mock("@/lib/api-auth", async () => {
  const actual = await vi.importActual("@/lib/api-auth");
  return {
    ...actual,
    rateLimit: () => () => false,
    getClientIp: () => "127.0.0.1",
    requireAuth: vi.fn(async () => ({ userId: "u1", tenantId: "t1", role: "inhaber" })),
    isAuthed: (r: unknown) => !(r instanceof NextResponse),
  };
});

vi.mock("@/lib/api-errors", () => ({
  apiError: (code: string, msg: string) => {
    const statusMap: Record<string, number> = {
      RATE_LIMITED: 429, VALIDATION_ERROR: 400, NOT_FOUND: 404,
    };
    return NextResponse.json({ error: msg, code }, { status: statusMap[code] || 400 });
  },
  serverError: (err: unknown) => {
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  },
}));

import { POST as checkoutPOST } from "@/app/api/payments/checkout/route";
import { POST as portalPOST } from "@/app/api/payments/portal/route";
import { NextRequest } from "next/server";

function makeRequest(url: string, body?: object) {
  return new NextRequest(`http://localhost${url}`, {
    method: "POST",
    body: JSON.stringify(body || {}),
    headers: { "content-type": "application/json" },
  });
}

function chainMock(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  ["select", "insert", "update", "delete", "eq", "neq", "is", "in", "gte", "lte", "not", "order", "limit", "range", "maybeSingle", "single", "csv", "count"].forEach(m => {
    chain[m] = vi.fn(() => ["maybeSingle", "single", "csv", "count"].includes(m) ? result : chain);
  });
  return chain;
}

// ---------------------------------------------------------------------------
// POST /api/payments/checkout
// ---------------------------------------------------------------------------
describe("POST /api/payments/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = "sk_test_fake";
  });

  it("returns 400 when required fields missing", async () => {
    const res = await checkoutPOST(makeRequest("/api/payments/checkout", { zahlungId: "z1" }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when zahlung not found", async () => {
    mockFrom.mockReturnValue(chainMock({ data: null, error: { message: "not found" } }));

    const res = await checkoutPOST(makeRequest("/api/payments/checkout", {
      zahlungId: "z-404",
      tenantId: "t1",
      successUrl: "http://localhost/success",
      cancelUrl: "http://localhost/cancel",
    }));
    expect(res.status).toBe(404);
  });

  it("returns 400 when zahlung already paid", async () => {
    // zahlung lookup
    const zahlungChain = chainMock({
      data: { id: "z-1", betrag: 55, beschreibung: "Test", status: "bezahlt", schueler_id: "s-1", stripe_session_id: null },
      error: null,
    });
    mockFrom.mockReturnValue(zahlungChain);

    const res = await checkoutPOST(makeRequest("/api/payments/checkout", {
      zahlungId: "z-1",
      tenantId: "t1",
      successUrl: "http://localhost/success",
      cancelUrl: "http://localhost/cancel",
    }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when zahlung is storniert", async () => {
    mockFrom.mockReturnValue(chainMock({
      data: { id: "z-1", betrag: 55, beschreibung: "Test", status: "storniert", schueler_id: "s-1", stripe_session_id: null },
      error: null,
    }));

    const res = await checkoutPOST(makeRequest("/api/payments/checkout", {
      zahlungId: "z-1",
      tenantId: "t1",
      successUrl: "http://localhost/success",
      cancelUrl: "http://localhost/cancel",
    }));
    expect(res.status).toBe(400);
  });

  it("creates checkout session successfully", async () => {
    // zahlung lookup -> schueler lookup -> update zahlung
    const zahlungChain = chainMock({
      data: { id: "z-1", betrag: 55, beschreibung: "Grundgebühr", status: "offen", schueler_id: "s-1", stripe_session_id: null },
      error: null,
    });
    const schuelerChain = chainMock({
      data: { id: "s-1", vorname: "Max", nachname: "M", email: "m@x.de", stripe_customer_id: "cus_existing" },
      error: null,
    });
    const updateChain = chainMock({ data: null, error: null });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return zahlungChain;
      if (callCount === 2) return schuelerChain;
      return updateChain;
    });

    mockCheckoutCreate.mockResolvedValue({ url: "https://checkout.stripe.com/session", id: "cs_1" });

    const res = await checkoutPOST(makeRequest("/api/payments/checkout", {
      zahlungId: "z-1",
      tenantId: "t1",
      successUrl: "http://localhost/success",
      cancelUrl: "http://localhost/cancel",
    }));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.checkoutUrl).toBe("https://checkout.stripe.com/session");
    expect(json.data.sessionId).toBe("cs_1");
  });

  it("creates Stripe customer when none exists", async () => {
    const zahlungChain = chainMock({
      data: { id: "z-1", betrag: 55, beschreibung: "Test", status: "offen", schueler_id: "s-1", stripe_session_id: null },
      error: null,
    });
    const schuelerChain = chainMock({
      data: { id: "s-1", vorname: "Max", nachname: "M", email: "m@x.de", stripe_customer_id: null },
      error: null,
    });
    const updateChain = chainMock({ data: null, error: null });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return zahlungChain;
      if (callCount === 2) return schuelerChain;
      return updateChain;
    });

    mockCustomersCreate.mockResolvedValue({ id: "cus_new_1" });
    mockCheckoutCreate.mockResolvedValue({ url: "https://checkout.stripe.com/x", id: "cs_2" });

    const res = await checkoutPOST(makeRequest("/api/payments/checkout", {
      zahlungId: "z-1",
      tenantId: "t1",
      successUrl: "http://localhost/success",
      cancelUrl: "http://localhost/cancel",
    }));

    expect(res.status).toBe(200);
    expect(mockCustomersCreate).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// POST /api/payments/portal
// ---------------------------------------------------------------------------
describe("POST /api/payments/portal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = "sk_test_fake";
  });

  it("returns 400 when tenantId missing", async () => {
    const res = await portalPOST(makeRequest("/api/payments/portal", { returnUrl: "http://localhost" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when returnUrl missing", async () => {
    const res = await portalPOST(makeRequest("/api/payments/portal", { tenantId: "t1" }));
    expect(res.status).toBe(400);
  });

  it("returns 401 when user not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = await portalPOST(makeRequest("/api/payments/portal", { tenantId: "t1", returnUrl: "http://localhost" }));
    expect(res.status).toBe(401);
  });

  it("returns 404 when schueler not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1", email: "a@b.com" } }, error: null });
    mockFrom.mockReturnValue(chainMock({ data: null, error: null }));

    const res = await portalPOST(makeRequest("/api/payments/portal", { tenantId: "t1", returnUrl: "http://localhost" }));
    expect(res.status).toBe(404);
  });

  it("creates portal session with existing customer", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1", email: "a@b.com" } }, error: null });
    mockFrom.mockReturnValue(chainMock({
      data: { id: "s-1", stripe_customer_id: "cus_existing", email: "a@b.com", vorname: "Max", nachname: "M" },
      error: null,
    }));
    mockPortalCreate.mockResolvedValue({ url: "https://billing.stripe.com/portal" });

    const res = await portalPOST(makeRequest("/api/payments/portal", { tenantId: "t1", returnUrl: "http://localhost" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.portalUrl).toBe("https://billing.stripe.com/portal");
  });
});
