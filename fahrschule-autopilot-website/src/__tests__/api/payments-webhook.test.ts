import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for POST /api/payments/webhook (Stripe webhook handler).
 *
 * We extract and test the validation/control-flow logic without hitting
 * a real Stripe SDK or Supabase. The route itself calls `getStripe()`,
 * `createClient()`, and `emitEvent()`, so we mock those at the module level.
 */

// ---------------------------------------------------------------------------
// Mock setup
// ---------------------------------------------------------------------------

const mockConstructEvent = vi.fn();
const mockSupabaseFrom = vi.fn();
const mockEmitEvent = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: mockSupabaseFrom,
  })),
}));

vi.mock("@/lib/events/emit", () => ({
  emitEvent: (...args: unknown[]) => mockEmitEvent(...args),
}));

vi.mock("stripe", () => {
  return {
    default: class StripeMock {
      webhooks = { constructEvent: mockConstructEvent };
    },
  };
});

// Import the route handler AFTER mocks are set up
import { POST } from "@/app/api/payments/webhook/route";
import { NextRequest } from "next/server";

function makeRequest(body: string, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/payments/webhook", {
    method: "POST",
    body,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
  });
}

// Chain builder for Supabase mock
function chainableMock(finalResult: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  const methods = ["select", "eq", "neq", "maybeSingle", "single", "update", "insert", "limit"];
  for (const m of methods) {
    chain[m] = vi.fn(() => (m === "maybeSingle" || m === "single" ? finalResult : chain));
  }
  return chain;
}

describe("POST /api/payments/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset env
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  it("returns 400 when stripe-signature header is missing", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_fake";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_fake";

    const res = await POST(makeRequest("{}"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Signatur/i);
  });

  it("returns 500 when STRIPE_WEBHOOK_SECRET is not configured", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_fake";
    // STRIPE_WEBHOOK_SECRET intentionally not set

    const res = await POST(
      makeRequest("{}", { "stripe-signature": "t=123,v1=abc" })
    );
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/Secret|konfiguriert/i);
  });

  it("returns 401 when Stripe signature validation fails", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_fake";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";

    mockConstructEvent.mockImplementation(() => {
      throw new Error("Signature verification failed");
    });

    const res = await POST(
      makeRequest("{}", { "stripe-signature": "t=123,v1=invalid" })
    );
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/Signatur/i);
  });

  it("skips update when payment is already bezahlt (idempotency)", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_fake";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";

    // Stripe constructEvent returns a valid checkout.session.completed event
    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_123",
          amount_total: 5500,
          metadata: {
            zahlungId: "z-001",
            tenantId: "t-001",
            schuelerId: "s-001",
          },
        },
      },
    });

    // First call: fetch the zahlung for amount verification
    const fetchChain = chainableMock({ data: { id: "z-001", betrag: 55 }, error: null });
    // Second call: update returns null (already bezahlt, .neq("status","bezahlt") matched nothing)
    const updateChain = chainableMock({ data: null, error: null });

    let callCount = 0;
    mockSupabaseFrom.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? fetchChain : updateChain;
    });

    const res = await POST(
      makeRequest("{}", { "stripe-signature": "t=123,v1=valid" })
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.received).toBe(true);
    // emitEvent should NOT be called when payment was already bezahlt
    expect(mockEmitEvent).not.toHaveBeenCalled();
  });

  it("processes checkout.session.completed and emits event", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_fake";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";

    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_456",
          amount_total: 5500,
          metadata: {
            zahlungId: "z-002",
            tenantId: "t-002",
            schuelerId: "s-002",
          },
        },
      },
    });

    const fetchChain = chainableMock({ data: { id: "z-002", betrag: 55 }, error: null });
    const updateChain = chainableMock({ data: { id: "z-002", betrag: 55 }, error: null });

    let callCount = 0;
    mockSupabaseFrom.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? fetchChain : updateChain;
    });

    const res = await POST(
      makeRequest("{}", { "stripe-signature": "t=123,v1=valid" })
    );

    expect(res.status).toBe(200);
    expect(mockEmitEvent).toHaveBeenCalledWith(
      "zahlung.bezahlt",
      "t-002",
      expect.objectContaining({
        zahlungId: "z-002",
        schuelerId: "s-002",
        betrag: 55,
      })
    );
  });

  it("returns 400 when metadata is missing from session", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_fake";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";

    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_no_meta",
          amount_total: 1000,
          metadata: {}, // no zahlungId or tenantId
        },
      },
    });

    const res = await POST(
      makeRequest("{}", { "stripe-signature": "t=123,v1=valid" })
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Metadata/i);
  });
});
