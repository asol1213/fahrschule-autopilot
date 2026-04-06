import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

/**
 * Tests for tenant isolation patterns in api-auth.ts.
 *
 * These test the pure functions (isAuthed, safeCompare, getClientIp) directly,
 * and the auth flow (requireAuth) via mocked Supabase.
 */

// ---------------------------------------------------------------------------
// Mock Supabase
// ---------------------------------------------------------------------------

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

import { requireAuth, isAuthed, safeCompare, getClientIp } from "@/lib/api-auth";

// Helper to build a chainable Supabase query mock
function chainQuery(finalResult: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  const methods = ["select", "eq", "limit", "maybeSingle", "single"];
  for (const m of methods) {
    chain[m] = vi.fn(() => (m === "maybeSingle" || m === "single" ? finalResult : chain));
  }
  return chain;
}

describe("isAuthed type guard", () => {
  it("returns true for an AuthResult object", () => {
    const result = { userId: "u1", tenantId: "t1", role: "admin" };
    expect(isAuthed(result)).toBe(true);
  });

  it("returns false for a NextResponse", () => {
    const result = NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    expect(isAuthed(result)).toBe(false);
  });
});

describe("requireAuth without tenantId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const result = await requireAuth();
    expect(result).toBeInstanceOf(NextResponse);
    if (result instanceof NextResponse) {
      expect(result.status).toBe(401);
    }
  });

  it("returns first tenant when no specific tenantId is requested", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
    });
    mockFrom.mockReturnValue(
      chainQuery({ data: { tenant_id: "tenant-abc", role: "inhaber" }, error: null })
    );

    const result = await requireAuth();
    expect(isAuthed(result)).toBe(true);
    if (isAuthed(result)) {
      expect(result.tenantId).toBe("tenant-abc");
      expect(result.userId).toBe("user-123");
      expect(result.role).toBe("inhaber");
    }
  });

  it("returns 403 when user has no tenant association", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-orphan" } },
    });
    mockFrom.mockReturnValue(
      chainQuery({ data: null, error: null })
    );

    const result = await requireAuth();
    expect(result).toBeInstanceOf(NextResponse);
    if (result instanceof NextResponse) {
      expect(result.status).toBe(403);
    }
  });
});

describe("requireAuth with tenantId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates access to the specified tenant", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-456" } },
    });
    mockFrom.mockReturnValue(
      chainQuery({ data: { tenant_id: "tenant-xyz", role: "fahrlehrer" }, error: null })
    );

    const result = await requireAuth("tenant-xyz");
    expect(isAuthed(result)).toBe(true);
    if (isAuthed(result)) {
      expect(result.tenantId).toBe("tenant-xyz");
      expect(result.role).toBe("fahrlehrer");
    }
  });

  it("returns 403 when user does not belong to the requested tenant", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-456" } },
    });
    mockFrom.mockReturnValue(
      chainQuery({ data: null, error: null })
    );

    const result = await requireAuth("tenant-not-mine");
    expect(result).toBeInstanceOf(NextResponse);
    if (result instanceof NextResponse) {
      expect(result.status).toBe(403);
    }
  });
});

// ---------------------------------------------------------------------------
// safeCompare
// ---------------------------------------------------------------------------

describe("safeCompare", () => {
  it("returns true for identical strings", () => {
    expect(safeCompare("secret-key-123", "secret-key-123")).toBe(true);
  });

  it("returns false for different strings of same length", () => {
    expect(safeCompare("secret-key-123", "secret-key-456")).toBe(false);
  });

  it("returns false for different length strings", () => {
    expect(safeCompare("short", "a-much-longer-string")).toBe(false);
  });

  it("returns false for empty vs non-empty", () => {
    expect(safeCompare("", "something")).toBe(false);
  });

  it("returns true for two empty strings", () => {
    expect(safeCompare("", "")).toBe(true);
  });

  it("handles unicode strings", () => {
    expect(safeCompare("Fahrschule", "Fahrschule")).toBe(true);
  });

  it("is consistent across multiple calls (no timing variance in result)", () => {
    // We cannot truly measure timing safety in a unit test,
    // but we verify the function always returns the correct boolean.
    for (let i = 0; i < 100; i++) {
      expect(safeCompare("test-secret", "test-secret")).toBe(true);
      expect(safeCompare("test-secret", "wrong-secrt")).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// getClientIp
// ---------------------------------------------------------------------------

describe("getClientIp", () => {
  function makeReq(headers: Record<string, string> = {}): NextRequest {
    return new NextRequest("http://localhost/api/test", { headers });
  }

  it("prefers x-real-ip header (Vercel default)", () => {
    const req = makeReq({
      "x-real-ip": "1.2.3.4",
      "x-forwarded-for": "5.6.7.8, 9.10.11.12",
    });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("falls back to x-forwarded-for first entry", () => {
    const req = makeReq({
      "x-forwarded-for": "10.0.0.1, 10.0.0.2, 10.0.0.3",
    });
    expect(getClientIp(req)).toBe("10.0.0.1");
  });

  it("trims whitespace from x-forwarded-for entries", () => {
    const req = makeReq({
      "x-forwarded-for": "  10.0.0.1  , 10.0.0.2",
    });
    expect(getClientIp(req)).toBe("10.0.0.1");
  });

  it("returns 'unknown' when no IP headers are present", () => {
    const req = makeReq({});
    expect(getClientIp(req)).toBe("unknown");
  });

  it("handles IPv6 in x-real-ip", () => {
    const req = makeReq({ "x-real-ip": "::1" });
    expect(getClientIp(req)).toBe("::1");
  });

  it("handles single x-forwarded-for entry (no comma)", () => {
    const req = makeReq({ "x-forwarded-for": "192.168.1.1" });
    expect(getClientIp(req)).toBe("192.168.1.1");
  });
});
