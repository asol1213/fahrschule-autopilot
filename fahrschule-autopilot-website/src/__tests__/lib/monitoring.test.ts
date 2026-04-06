import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  metrics: { distribution: vi.fn() },
}));

// Mock the dynamic import of supabase/server used in getHealthStatus
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import * as Sentry from "@sentry/nextjs";
import { captureError, trackMetric, trackEvent, getHealthStatus } from "@/lib/monitoring";

describe("monitoring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("captureError()", () => {
    it("calls Sentry.captureException with Error object", () => {
      const err = new Error("Test error");
      captureError(err);

      expect(Sentry.captureException).toHaveBeenCalledWith(err, {
        extra: undefined,
      });
    });

    it("wraps non-Error values in Error", () => {
      captureError("string error");

      const call = vi.mocked(Sentry.captureException).mock.calls[0];
      expect(call[0]).toBeInstanceOf(Error);
      expect((call[0] as Error).message).toBe("string error");
    });

    it("passes context as extra data to Sentry", () => {
      const err = new Error("contextual");
      const context = {
        component: "Dashboard",
        action: "loadData",
        tenantId: "t1",
      };
      captureError(err, context);

      expect(Sentry.captureException).toHaveBeenCalledWith(err, {
        extra: { ...context },
      });
    });

    it("logs to console.error with timestamp", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const err = new Error("logged error");
      captureError(err, { component: "TestComp" });

      expect(consoleSpy).toHaveBeenCalledWith(
        "[ERROR] TestComp:",
        expect.objectContaining({
          message: "logged error",
          component: "TestComp",
          timestamp: expect.any(String),
        })
      );
      consoleSpy.mockRestore();
    });

    it("uses 'unknown' when no component is provided", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      captureError(new Error("no context"));

      expect(consoleSpy).toHaveBeenCalledWith(
        "[ERROR] unknown:",
        expect.objectContaining({ message: "no context" })
      );
      consoleSpy.mockRestore();
    });
  });

  describe("trackMetric()", () => {
    it("sends metric to Sentry distribution", () => {
      trackMetric("api.latency", 150);

      expect(Sentry.metrics.distribution).toHaveBeenCalledWith(
        "api.latency",
        150,
        { attributes: undefined }
      );
    });

    it("passes tags as attributes", () => {
      trackMetric("db.query_time", 42, { table: "schueler", op: "select" });

      expect(Sentry.metrics.distribution).toHaveBeenCalledWith(
        "db.query_time",
        42,
        { attributes: { table: "schueler", op: "select" } }
      );
    });

    it("logs to console in development mode", () => {
      const origEnv = process.env.NODE_ENV;
      vi.stubEnv("NODE_ENV", "development");
      const consoleSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});

      trackMetric("test.metric", 99, { env: "dev" });

      expect(consoleSpy).toHaveBeenCalledWith(
        "[METRIC] test.metric: 99",
        { env: "dev" }
      );

      consoleSpy.mockRestore();
      vi.unstubAllEnvs();
    });
  });

  describe("trackEvent()", () => {
    it("sends event to Sentry as info message", () => {
      trackEvent("user.signup", { plan: "pro" });

      expect(Sentry.captureMessage).toHaveBeenCalledWith("user.signup", {
        level: "info",
        extra: { plan: "pro" },
      });
    });

    it("handles events without extra data", () => {
      trackEvent("page.view");

      expect(Sentry.captureMessage).toHaveBeenCalledWith("page.view", {
        level: "info",
        extra: undefined,
      });
    });

    it("logs to console in development mode", () => {
      const origEnv = process.env.NODE_ENV;
      vi.stubEnv("NODE_ENV", "development");
      const consoleSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});

      trackEvent("test.event", { key: "value" });

      expect(consoleSpy).toHaveBeenCalledWith("[EVENT] test.event", {
        key: "value",
      });

      consoleSpy.mockRestore();
      vi.unstubAllEnvs();
    });
  });

  describe("getHealthStatus()", () => {
    it("returns proper structure with status, checks, timestamp, version", async () => {
      // Mock supabase to return success
      const { createClient } = await import("@/lib/supabase/server");
      vi.mocked(createClient).mockResolvedValue({
        from: () => ({
          select: () => ({ error: null }),
        }),
      } as never);

      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-key";
      process.env.ANTHROPIC_API_KEY = "test-anthropic-key";

      const result = await getHealthStatus();

      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("checks");
      expect(result).toHaveProperty("timestamp");
      expect(result).toHaveProperty("version", "2.0.0");
      expect(["ok", "degraded", "down"]).toContain(result.status);
      expect(new Date(result.timestamp).getTime()).not.toBeNaN();
    });

    it("reports 'ok' when all checks pass", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      vi.mocked(createClient).mockResolvedValue({
        from: () => ({
          select: () => ({ error: null }),
        }),
      } as never);

      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-key";
      process.env.ANTHROPIC_API_KEY = "test-key";

      const result = await getHealthStatus();
      expect(result.status).toBe("ok");
      expect(result.checks.api).toBe(true);
      expect(result.checks.env_supabase).toBe(true);
      expect(result.checks.anthropic).toBe(true);
    });

    it("reports 'degraded' when one check fails", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      vi.mocked(createClient).mockResolvedValue({
        from: () => ({
          select: () => ({ error: null }),
        }),
      } as never);

      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-key";
      delete process.env.ANTHROPIC_API_KEY;

      const result = await getHealthStatus();
      expect(result.status).toBe("degraded");
      expect(result.checks.anthropic).toBe(false);
    });

    it("reports 'down' when multiple checks fail", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      vi.mocked(createClient).mockRejectedValue(new Error("DB down"));

      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      const result = await getHealthStatus();
      expect(result.status).toBe("down");
    });

    it("sets database check to false when supabase query fails", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      vi.mocked(createClient).mockResolvedValue({
        from: () => ({
          select: () => ({ error: { message: "connection refused" } }),
        }),
      } as never);

      const result = await getHealthStatus();
      expect(result.checks.database).toBe(false);
    });
  });
});
