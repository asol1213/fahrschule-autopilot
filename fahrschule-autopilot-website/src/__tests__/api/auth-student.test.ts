import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetUser = vi.fn();
const mockSignUp = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser, signUp: mockSignUp },
    from: mockFrom,
  })),
}));

vi.mock("@/lib/api-auth", async () => {
  const actual = await vi.importActual("@/lib/api-auth");
  return {
    ...actual,
    rateLimit: () => () => false,
    getClientIp: () => "127.0.0.1",
  };
});

import { POST } from "@/app/api/auth/student/route";
import { NextRequest } from "next/server";

function makeRequest(body?: object, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/auth/student", {
    method: "POST",
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

const VALID_REGISTRATION = {
  email: "student@example.com",
  password: "securepass123",
  name: "Max Mustermann",
  inviteCode: "ABC123",
};

describe("POST /api/auth/student", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when email is missing", async () => {
    const res = await POST(makeRequest({ password: "12345678", inviteCode: "ABC" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/E-Mail/);
  });

  it("returns 400 when password is missing", async () => {
    const res = await POST(makeRequest({ email: "a@b.com", inviteCode: "ABC" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when inviteCode is missing", async () => {
    const res = await POST(makeRequest({ email: "a@b.com", password: "12345678" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when password is too short", async () => {
    const res = await POST(makeRequest({ email: "a@b.com", password: "short", inviteCode: "ABC" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/8 Zeichen/);
  });

  it("returns 400 for invalid invite code", async () => {
    mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
    const res = await POST(makeRequest(VALID_REGISTRATION));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Einladungscode/i);
  });

  it("returns 400 when invite code is exhausted", async () => {
    mockFrom.mockReturnValue(chainMock({
      data: { id: "inv-1", tenant_id: "t-1", max_uses: 5, used_count: 5, expires_at: null },
      error: null,
    }));
    const res = await POST(makeRequest(VALID_REGISTRATION));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/zu oft verwendet/);
  });

  it("returns 400 when invite code is expired", async () => {
    mockFrom.mockReturnValue(chainMock({
      data: { id: "inv-1", tenant_id: "t-1", max_uses: 100, used_count: 0, expires_at: "2020-01-01T00:00:00Z" },
      error: null,
    }));
    const res = await POST(makeRequest(VALID_REGISTRATION));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/abgelaufen/);
  });

  it("returns 409 when email is already registered", async () => {
    // First call: invite lookup succeeds
    const inviteChain = chainMock({
      data: { id: "inv-1", tenant_id: "t-1", max_uses: 100, used_count: 0, expires_at: null },
      error: null,
    });
    mockFrom.mockReturnValue(inviteChain);

    mockSignUp.mockResolvedValue({
      data: { user: null },
      error: { message: "User already registered" },
    });

    const res = await POST(makeRequest(VALID_REGISTRATION));
    expect(res.status).toBe(409);
  });

  it("registers successfully with valid data", async () => {
    // invite lookup
    const inviteChain = chainMock({
      data: { id: "inv-1", tenant_id: "t-1", max_uses: 100, used_count: 0, expires_at: null },
      error: null,
    });

    // student insert + invite update
    const insertChain = chainMock({ data: null, error: null });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? inviteChain : insertChain;
    });

    mockSignUp.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const res = await POST(makeRequest(VALID_REGISTRATION));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  it("returns 413 when content-length exceeds limit", async () => {
    const req = new NextRequest("http://localhost/api/auth/student", {
      method: "POST",
      body: JSON.stringify(VALID_REGISTRATION),
      headers: {
        "content-type": "application/json",
        "content-length": "5000",
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(413);
  });
});
