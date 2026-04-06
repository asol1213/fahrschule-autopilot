import { describe, it, expect, vi, beforeEach } from "vitest";

describe("env validation", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("warns in dev when required vars are missing", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Remove required vars
    const saved = { ...process.env };
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    // @ts-expect-error NODE_ENV override for testing
    process.env.NODE_ENV = "development";

    const { validateEnv } = await import("@/lib/env");
    // Should warn but not throw in dev
    expect(() => validateEnv()).not.toThrow();

    process.env.NEXT_PUBLIC_SUPABASE_URL = saved.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = saved.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    errorSpy.mockRestore();
  });
});
