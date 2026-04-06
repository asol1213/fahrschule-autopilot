import { describe, it, expect } from "vitest";
import { rateLimit } from "@/lib/api-auth";

describe("Rate Limiter", () => {
  it("allows requests within limit", () => {
    const limiter = rateLimit("test-allow", 5, 60000);
    expect(limiter("192.168.1.1")).toBe(false); // not limited
    expect(limiter("192.168.1.1")).toBe(false);
    expect(limiter("192.168.1.1")).toBe(false);
  });

  it("blocks requests exceeding limit", () => {
    const limiter = rateLimit("test-block", 3, 60000);
    expect(limiter("10.0.0.1")).toBe(false);
    expect(limiter("10.0.0.1")).toBe(false);
    expect(limiter("10.0.0.1")).toBe(false);
    expect(limiter("10.0.0.1")).toBe(true); // blocked
    expect(limiter("10.0.0.1")).toBe(true); // still blocked
  });

  it("isolates rate limits by IP", () => {
    const limiter = rateLimit("test-ip", 2, 60000);
    expect(limiter("1.1.1.1")).toBe(false);
    expect(limiter("1.1.1.1")).toBe(false);
    expect(limiter("1.1.1.1")).toBe(true); // blocked

    // Different IP should still be allowed
    expect(limiter("2.2.2.2")).toBe(false);
    expect(limiter("2.2.2.2")).toBe(false);
  });

  it("isolates rate limits by namespace", () => {
    const limiterA = rateLimit("ns-a", 2, 60000);
    const limiterB = rateLimit("ns-b", 2, 60000);

    expect(limiterA("3.3.3.3")).toBe(false);
    expect(limiterA("3.3.3.3")).toBe(false);
    expect(limiterA("3.3.3.3")).toBe(true); // blocked in ns-a

    // Same IP, different namespace
    expect(limiterB("3.3.3.3")).toBe(false); // not blocked in ns-b
  });

  it("resets after window expires", async () => {
    const limiter = rateLimit("test-expire", 1, 100); // 100ms window
    expect(limiter("4.4.4.4")).toBe(false);
    expect(limiter("4.4.4.4")).toBe(true); // blocked

    await new Promise((r) => setTimeout(r, 150)); // wait for window to expire
    expect(limiter("4.4.4.4")).toBe(false); // allowed again
  });
});
