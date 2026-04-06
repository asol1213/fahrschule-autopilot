import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetAllPosts = vi.fn(() => [
  { title: "Test Post", slug: "test-post", excerpt: "Excerpt", category: "pruefungstipps", content: "Content body", publishedAt: "2026-01-01", tags: [] },
]);
const mockGetPostsByCategory = vi.fn((): Record<string, unknown>[] => []);
const mockAddPost = vi.fn();
const mockGetPostBySlug = vi.fn();

vi.mock("@/lib/blog", () => ({
  getAllPosts: (...args: unknown[]) => mockGetAllPosts(...(args as [])),
  getPostsByCategory: (...args: unknown[]) => mockGetPostsByCategory(...(args as [])),
  addPost: (...args: unknown[]) => mockAddPost(...(args as [])),
  getPostBySlug: (...args: unknown[]) => mockGetPostBySlug(...(args as [])),
}));

vi.mock("@/lib/social", () => ({
  generateSocialPosts: vi.fn(async () => ({ instagram: "Post", facebook: "Post" })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: vi.fn() },
    from: vi.fn(),
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

vi.mock("fs", () => ({
  readFileSync: vi.fn(() => JSON.stringify([
    { slug: "test-post", title: "Test Post", content: "Content", publishedAt: "2026-01-01" },
  ])),
  writeFileSync: vi.fn(),
}));

import { GET as blogGET, POST as blogPOST } from "@/app/api/blog/route";
import { GET as cronGET, POST as cronPOST } from "@/app/api/blog/cron/route";
import { POST as updatePOST } from "@/app/api/blog/update/route";
import { NextRequest } from "next/server";

function makeRequest(method: string, url: string, body?: object, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost${url}`, {
    method,
    ...(body ? { body: JSON.stringify(body), headers: { "content-type": "application/json", ...headers } } : { headers }),
  });
}

// ---------------------------------------------------------------------------
// GET /api/blog
// ---------------------------------------------------------------------------
describe("GET /api/blog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns all posts", async () => {
    const res = await blogGET(makeRequest("GET", "/api/blog"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toBeDefined();
    expect(json.total).toBeGreaterThanOrEqual(0);
  });

  it("filters by category", async () => {
    mockGetPostsByCategory.mockReturnValue([
      { title: "Test", slug: "test", excerpt: "e", category: "pruefungstipps", content: "c" },
    ]);
    const res = await blogGET(makeRequest("GET", "/api/blog?category=pruefungstipps"));
    expect(res.status).toBe(200);
    expect(mockGetPostsByCategory).toHaveBeenCalledWith("pruefungstipps");
  });

  it("strips content from list response", async () => {
    const res = await blogGET(makeRequest("GET", "/api/blog"));
    const json = await res.json();
    // The content key should be removed
    for (const post of json.data) {
      expect(post.content).toBeUndefined();
    }
  });
});

// ---------------------------------------------------------------------------
// POST /api/blog
// ---------------------------------------------------------------------------
describe("POST /api/blog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.ONBOARDING_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
  });

  it("returns 401 without auth", async () => {
    const res = await blogPOST(makeRequest("POST", "/api/blog", { topic: "test" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 without topic", async () => {
    process.env.ONBOARDING_API_KEY = "key1";
    const res = await blogPOST(makeRequest("POST", "/api/blog", {}, { authorization: "Bearer key1" }));
    expect(res.status).toBe(400);
  });

  it("returns 503 when ANTHROPIC_API_KEY not set", async () => {
    process.env.ONBOARDING_API_KEY = "key1";
    const res = await blogPOST(makeRequest("POST", "/api/blog", { topic: "Test" }, { authorization: "Bearer key1" }));
    expect(res.status).toBe(503);
  });
});

// ---------------------------------------------------------------------------
// GET/POST /api/blog/cron
// ---------------------------------------------------------------------------
describe("GET /api/blog/cron", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CRON_SECRET;
    delete process.env.ANTHROPIC_API_KEY;
  });

  it("returns 401 without auth", async () => {
    const res = await cronGET(makeRequest("GET", "/api/blog/cron"));
    expect(res.status).toBe(401);
  });

  it("returns 503 when ANTHROPIC_API_KEY not configured", async () => {
    process.env.CRON_SECRET = "cron-key";
    const res = await cronGET(makeRequest("GET", "/api/blog/cron", undefined, { authorization: "Bearer cron-key" }));
    expect(res.status).toBe(503);
  });
});

describe("POST /api/blog/cron", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CRON_SECRET;
  });

  it("returns 401 without auth", async () => {
    const res = await cronPOST(makeRequest("POST", "/api/blog/cron", {}));
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// POST /api/blog/update
// ---------------------------------------------------------------------------
describe("POST /api/blog/update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.ONBOARDING_API_KEY;
    delete process.env.CRON_SECRET;
  });

  it("returns 401 without auth", async () => {
    const res = await updatePOST(makeRequest("POST", "/api/blog/update", { mode: "check" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 without mode", async () => {
    process.env.ONBOARDING_API_KEY = "key1";
    const res = await updatePOST(makeRequest("POST", "/api/blog/update", {}, { authorization: "Bearer key1" }));
    expect(res.status).toBe(400);
  });

  it("handles check mode", async () => {
    process.env.ONBOARDING_API_KEY = "key1";
    mockGetAllPosts.mockReturnValue([
      { title: "Old Post 2024", slug: "old", excerpt: "e", category: "pruefungstipps", content: "Content about 2024 rules", publishedAt: "2024-06-01", tags: [] },
    ]);
    const res = await updatePOST(makeRequest("POST", "/api/blog/update", { mode: "check" }, { authorization: "Bearer key1" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.totalArticles).toBeDefined();
    expect(json.results).toBeDefined();
  });

  it("returns 400 for update mode without slug", async () => {
    process.env.ONBOARDING_API_KEY = "key1";
    const res = await updatePOST(makeRequest("POST", "/api/blog/update", { mode: "update" }, { authorization: "Bearer key1" }));
    expect(res.status).toBe(400);
  });

  it("returns 404 for update mode with unknown slug", async () => {
    process.env.ONBOARDING_API_KEY = "key1";
    mockGetPostBySlug.mockReturnValue(null);
    const res = await updatePOST(makeRequest("POST", "/api/blog/update", { mode: "update", slug: "nonexistent" }, { authorization: "Bearer key1" }));
    expect(res.status).toBe(404);
  });
});
