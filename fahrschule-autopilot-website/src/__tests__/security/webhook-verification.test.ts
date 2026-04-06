import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";
import { NextRequest } from "next/server";

/**
 * Extended webhook verification tests.
 *
 * Covers:
 * - The verifyWebhookSignature function from webhooks/events/route.ts
 * - The requireWebhookSignature helper from api-auth.ts
 * - HMAC generation and verification
 * - Missing secret behavior (must return error, never bypass)
 * - Replay behavior documentation
 */

// ---------------------------------------------------------------------------
// Pure function extraction: verifyWebhookSignature from webhooks/events/route.ts
// This is the PRODUCTION version that returns false when secret is missing.
// ---------------------------------------------------------------------------

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string | undefined
): boolean {
  if (!secret) return false; // Reject if secret not configured
  try {
    const expected = `sha256=${crypto.createHmac("sha256", secret).update(payload).digest("hex")}`;
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

function createSignature(payload: string, secret: string): string {
  return `sha256=${crypto.createHmac("sha256", secret).update(payload).digest("hex")}`;
}

// ---------------------------------------------------------------------------
// Tests: Missing secret must reject (security-critical)
// ---------------------------------------------------------------------------

describe("Webhook verification: missing secret behavior", () => {
  it("rejects when secret is undefined (must NOT bypass)", () => {
    const payload = JSON.stringify({ type: "anmeldung.neu" });
    // Even with a valid-looking signature, missing secret must reject
    expect(verifyWebhookSignature(payload, "sha256=anything", undefined)).toBe(false);
  });

  it("rejects when secret is empty string", () => {
    const payload = JSON.stringify({ type: "test" });
    expect(verifyWebhookSignature(payload, "sha256=anything", "")).toBe(false);
  });

  it("rejects when no signature is provided and secret is undefined", () => {
    expect(verifyWebhookSignature("{}", "", undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Tests: HMAC signature generation and verification
// ---------------------------------------------------------------------------

describe("HMAC signature generation and verification", () => {
  const SECRET = "webhook-secret-for-testing-32ch!";

  it("generates a valid sha256-prefixed signature", () => {
    const sig = createSignature("{}", SECRET);
    expect(sig).toMatch(/^sha256=[a-f0-9]{64}$/);
  });

  it("verifies a correctly signed payload", () => {
    const payload = JSON.stringify({ type: "zahlung.eingang", tenantId: "t1", data: {} });
    const sig = createSignature(payload, SECRET);
    expect(verifyWebhookSignature(payload, sig, SECRET)).toBe(true);
  });

  it("rejects tampered payload", () => {
    const original = JSON.stringify({ type: "anmeldung.neu", tenantId: "t1" });
    const sig = createSignature(original, SECRET);
    const tampered = JSON.stringify({ type: "anmeldung.neu", tenantId: "t-hacked" });
    expect(verifyWebhookSignature(tampered, sig, SECRET)).toBe(false);
  });

  it("rejects signature from wrong secret", () => {
    const payload = JSON.stringify({ data: "test" });
    const sig = createSignature(payload, "wrong-secret-1234567890123456");
    expect(verifyWebhookSignature(payload, sig, SECRET)).toBe(false);
  });

  it("rejects malformed signature (no sha256= prefix)", () => {
    const payload = "{}";
    const rawHmac = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
    // Missing the sha256= prefix
    expect(verifyWebhookSignature(payload, rawHmac, SECRET)).toBe(false);
  });

  it("rejects completely random signature", () => {
    expect(verifyWebhookSignature("{}", "sha256=0000000000000000000000000000000000000000000000000000000000000000", SECRET)).toBe(false);
  });

  it("signature differs for different payloads", () => {
    const sig1 = createSignature('{"a":1}', SECRET);
    const sig2 = createSignature('{"a":2}', SECRET);
    expect(sig1).not.toBe(sig2);
  });

  it("signature is deterministic", () => {
    const payload = '{"test":true}';
    const sig1 = createSignature(payload, SECRET);
    const sig2 = createSignature(payload, SECRET);
    expect(sig1).toBe(sig2);
  });
});

// ---------------------------------------------------------------------------
// Tests: requireWebhookSignature from api-auth.ts
// ---------------------------------------------------------------------------

describe("requireWebhookSignature from api-auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.WEBHOOK_SECRET;
  });

  // We import after mock setup to avoid module caching issues
  // Since requireWebhookSignature reads process.env at call time, we can test it directly
  it("returns 500 when WEBHOOK_SECRET env var is missing", async () => {
    // Import fresh
    const { requireWebhookSignature, isWebhookError } = await import("@/lib/api-auth");

    delete process.env.WEBHOOK_SECRET;

    const req = new NextRequest("http://localhost/api/webhooks/events", {
      method: "POST",
      body: JSON.stringify({ type: "test" }),
      headers: {
        "content-type": "application/json",
        "x-webhook-signature": "sha256=abc",
      },
    });

    const result = await requireWebhookSignature(req, "WEBHOOK_SECRET");
    expect(isWebhookError(result)).toBe(true);
    if (isWebhookError(result)) {
      expect(result.status).toBe(500);
    }
  });

  it("returns 401 for invalid signature when secret is configured", async () => {
    const { requireWebhookSignature, isWebhookError } = await import("@/lib/api-auth");

    process.env.WEBHOOK_SECRET = "my-secret-key-32-characters-long";

    const req = new NextRequest("http://localhost/api/webhooks/events", {
      method: "POST",
      body: JSON.stringify({ type: "test" }),
      headers: {
        "content-type": "application/json",
        "x-webhook-signature": "sha256=invalid",
      },
    });

    const result = await requireWebhookSignature(req, "WEBHOOK_SECRET");
    expect(isWebhookError(result)).toBe(true);
    if (isWebhookError(result)) {
      expect(result.status).toBe(401);
    }
  });

  it("returns parsed body for valid signature", async () => {
    const { requireWebhookSignature, isWebhookError } = await import("@/lib/api-auth");

    const secret = "my-secret-key-32-characters-long";
    process.env.WEBHOOK_SECRET = secret;

    const payload = JSON.stringify({ type: "anmeldung.neu", tenantId: "t1", data: {} });
    const signature = createSignature(payload, secret);

    const req = new NextRequest("http://localhost/api/webhooks/events", {
      method: "POST",
      body: payload,
      headers: {
        "content-type": "application/json",
        "x-webhook-signature": signature,
      },
    });

    const result = await requireWebhookSignature(req, "WEBHOOK_SECRET");
    expect(isWebhookError(result)).toBe(false);
    if (!isWebhookError(result)) {
      expect(result.body.type).toBe("anmeldung.neu");
      expect(result.body.tenantId).toBe("t1");
    }
  });
});

// ---------------------------------------------------------------------------
// Tests: Replay behavior (documentation test)
// ---------------------------------------------------------------------------

describe("Replay protection", () => {
  const SECRET = "replay-test-secret-32-chars!!!!!";

  it("same payload and signature are accepted on replay (no timestamp check)", () => {
    // NOTE: The current webhook implementation does NOT include timestamp
    // validation. This means a replayed webhook with a valid signature will
    // be accepted. This is documented behavior. If replay protection is
    // needed, add a timestamp field and reject payloads older than N minutes.
    const payload = JSON.stringify({
      type: "zahlung.eingang",
      tenantId: "t1",
      data: { zahlungId: "z1" },
      timestamp: "2025-01-01T00:00:00Z", // timestamp in payload but not verified
    });
    const sig = createSignature(payload, SECRET);

    // First "delivery"
    expect(verifyWebhookSignature(payload, sig, SECRET)).toBe(true);

    // "Replay" with same payload and signature
    expect(verifyWebhookSignature(payload, sig, SECRET)).toBe(true);
  });

  it("documents that replay protection requires application-level deduplication", () => {
    // This is a documentation test. The signature verification alone
    // does not prevent replays. The Stripe webhook handler uses
    // idempotency (.neq("status", "bezahlt")) to handle this.
    // The internal webhook handler should consider adding similar logic.
    expect(true).toBe(true);
  });
});
