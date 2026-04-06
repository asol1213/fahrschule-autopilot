import { describe, it, expect } from "vitest";
import crypto from "crypto";

// Test the HMAC verification logic directly (extracted from webhooks/events/route.ts)
function verifyWebhookSignature(payload: string, signature: string, secret: string | undefined): boolean {
  if (!secret) return true;
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

describe("Webhook HMAC Signature Verification", () => {
  const SECRET = "test-webhook-secret-32chars!!!!";
  const payload = JSON.stringify({ type: "anmeldung.neu", tenantId: "test-123", data: { vorname: "Max" } });

  it("accepts valid signature", () => {
    const sig = createSignature(payload, SECRET);
    expect(verifyWebhookSignature(payload, sig, SECRET)).toBe(true);
  });

  it("rejects invalid signature", () => {
    expect(verifyWebhookSignature(payload, "sha256=invalid", SECRET)).toBe(false);
  });

  it("rejects empty signature", () => {
    expect(verifyWebhookSignature(payload, "", SECRET)).toBe(false);
  });

  it("rejects tampered payload", () => {
    const sig = createSignature(payload, SECRET);
    const tampered = JSON.stringify({ type: "zahlung.eingang", tenantId: "hacked", data: {} });
    expect(verifyWebhookSignature(tampered, sig, SECRET)).toBe(false);
  });

  it("rejects wrong secret", () => {
    const sig = createSignature(payload, "wrong-secret-12345678901234567");
    expect(verifyWebhookSignature(payload, sig, SECRET)).toBe(false);
  });

  it("skips verification when no secret configured (dev mode)", () => {
    expect(verifyWebhookSignature(payload, "", undefined)).toBe(true);
    expect(verifyWebhookSignature(payload, "anything", undefined)).toBe(true);
  });

  it("signature is deterministic for same payload and secret", () => {
    const sig1 = createSignature(payload, SECRET);
    const sig2 = createSignature(payload, SECRET);
    expect(sig1).toBe(sig2);
  });

  it("different payloads produce different signatures", () => {
    const sig1 = createSignature('{"a":1}', SECRET);
    const sig2 = createSignature('{"a":2}', SECRET);
    expect(sig1).not.toBe(sig2);
  });
});
