import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================
// Phone Utils
// ============================================================
import {
  normalizeGermanPhone,
  phonesMatch,
  phoneSearchSuffix,
} from "@/lib/telefon/phone-utils";

describe("phone-utils", () => {
  describe("normalizeGermanPhone()", () => {
    it("normalizes +49 format to national", () => {
      expect(normalizeGermanPhone("+49 176 12345678")).toBe("017612345678");
    });

    it("normalizes 0049 format to national", () => {
      expect(normalizeGermanPhone("0049 176 12345678")).toBe("017612345678");
    });

    it("keeps national format with leading 0", () => {
      expect(normalizeGermanPhone("0176 12345678")).toBe("017612345678");
    });

    it("adds leading 0 when missing for numbers >= 10 digits", () => {
      expect(normalizeGermanPhone("17612345678")).toBe("017612345678");
    });

    it("strips spaces, dashes, slashes, parentheses", () => {
      expect(normalizeGermanPhone("0176/123-456 78")).toBe("017612345678");
      expect(normalizeGermanPhone("(0176) 12345678")).toBe("017612345678");
    });

    it("returns empty string for null/undefined/empty", () => {
      expect(normalizeGermanPhone(null)).toBe("");
      expect(normalizeGermanPhone(undefined)).toBe("");
      expect(normalizeGermanPhone("")).toBe("");
    });

    it("handles +49 with no spaces", () => {
      expect(normalizeGermanPhone("+4917612345678")).toBe("017612345678");
    });
  });

  describe("phonesMatch()", () => {
    it("matches identical normalized numbers", () => {
      expect(phonesMatch("017612345678", "017612345678")).toBe(true);
    });

    it("matches +49 vs national format", () => {
      expect(phonesMatch("+49 176 12345678", "0176 12345678")).toBe(true);
    });

    it("matches by last 9 digits suffix", () => {
      expect(phonesMatch("017612345678", "004917612345678")).toBe(true);
    });

    it("returns false for null/empty inputs", () => {
      expect(phonesMatch(null, "017612345678")).toBe(false);
      expect(phonesMatch("017612345678", null)).toBe(false);
      expect(phonesMatch(null, null)).toBe(false);
    });

    it("returns false for different numbers", () => {
      expect(phonesMatch("017612345678", "017698765432")).toBe(false);
    });
  });

  describe("phoneSearchSuffix()", () => {
    it("returns last 9 digits for long numbers", () => {
      expect(phoneSearchSuffix("017612345678")).toBe("612345678");
    });

    it("returns full normalized number if shorter than 9 digits", () => {
      expect(phoneSearchSuffix("12345")).toBe("12345");
    });

    it("returns empty string for null/undefined", () => {
      expect(phoneSearchSuffix(null)).toBe("");
      expect(phoneSearchSuffix(undefined)).toBe("");
    });
  });
});

// ============================================================
// Telefon Templates
// ============================================================
import {
  FOLLOW_UP_TEMPLATES,
  OWNER_NOTIFICATION_TEMPLATES,
  getTemplate,
  renderTemplate,
  getOwnerNotificationTemplate,
} from "@/lib/telefon/templates";

describe("telefon/templates", () => {
  describe("FOLLOW_UP_TEMPLATES", () => {
    it("has templates for all 3 channels", () => {
      const channels = new Set(FOLLOW_UP_TEMPLATES.map((t) => t.kanal));
      expect(channels).toContain("whatsapp");
      expect(channels).toContain("email");
      expect(channels).toContain("sms");
    });

    it("all templates have required fields", () => {
      for (const t of FOLLOW_UP_TEMPLATES) {
        expect(t.id).toBeTruthy();
        expect(t.name).toBeTruthy();
        expect(t.intent).toBeTruthy();
        expect(t.kanal).toBeTruthy();
        expect(t.nachricht).toBeTruthy();
        expect(t.tags.length).toBeGreaterThan(0);
      }
    });

    it("email templates have betreff field", () => {
      const emailTemplates = FOLLOW_UP_TEMPLATES.filter(
        (t) => t.kanal === "email"
      );
      for (const t of emailTemplates) {
        expect(t.betreff).toBeTruthy();
      }
    });

    it("all template IDs are unique", () => {
      const ids = FOLLOW_UP_TEMPLATES.map((t) => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("getTemplate()", () => {
    it("finds template by intent and channel", () => {
      const result = getTemplate("anmeldung", "whatsapp");
      expect(result).not.toBeNull();
      expect(result!.intent).toBe("anmeldung");
      expect(result!.kanal).toBe("whatsapp");
    });

    it("defaults to whatsapp channel", () => {
      const result = getTemplate("anmeldung");
      expect(result?.kanal).toBe("whatsapp");
    });

    it("falls back to information template for unknown intent", () => {
      const result = getTemplate("unknown-intent", "whatsapp");
      expect(result).not.toBeNull();
      expect(result!.intent).toBe("information");
    });

    it("returns null when no template matches at all", () => {
      // SMS has no "information" fallback? Let's verify:
      const result = getTemplate("beschwerde", "sms");
      // There's no sms_beschwerde and no sms_information template
      expect(result).toBeNull();
    });
  });

  describe("renderTemplate()", () => {
    it("replaces placeholders with values", () => {
      const result = renderTemplate("Hallo{name}, willkommen bei {fahrschulName}!", {
        name: " Max",
        fahrschulName: "Fahrschule Test",
      });
      expect(result).toBe("Hallo Max, willkommen bei Fahrschule Test!");
    });

    it("removes empty name placeholder gracefully", () => {
      const result = renderTemplate("Hallo{name}, test", { name: "" });
      // The regex replaces "Hallo ," with "Hallo,"
      expect(result).toBe("Hallo, test");
    });

    it("handles multiple occurrences of same placeholder", () => {
      const result = renderTemplate("{name} und {name}", { name: "Max" });
      expect(result).toBe("Max und Max");
    });
  });

  describe("getOwnerNotificationTemplate()", () => {
    it("returns beschwerde template for beschwerde intent", () => {
      const result = getOwnerNotificationTemplate("beschwerde", "neutral", "mittel");
      expect(result).toBe(OWNER_NOTIFICATION_TEMPLATES.beschwerde);
    });

    it("returns negative_stimmung template for negative sentiment", () => {
      const result = getOwnerNotificationTemplate("information", "negative", "mittel");
      expect(result).toBe(OWNER_NOTIFICATION_TEMPLATES.negative_stimmung);
    });

    it("returns hohe_dringlichkeit template for high urgency", () => {
      const result = getOwnerNotificationTemplate("information", "neutral", "hoch");
      expect(result).toBe(OWNER_NOTIFICATION_TEMPLATES.hohe_dringlichkeit);
    });

    it("returns neuer_lead template as default", () => {
      const result = getOwnerNotificationTemplate("anmeldung", "positive", "mittel");
      expect(result).toBe(OWNER_NOTIFICATION_TEMPLATES.neuer_lead);
    });

    it("prioritizes beschwerde over negative sentiment", () => {
      const result = getOwnerNotificationTemplate("beschwerde", "negative", "hoch");
      expect(result).toBe(OWNER_NOTIFICATION_TEMPLATES.beschwerde);
    });
  });
});

// ============================================================
// Tenant
// ============================================================
import {
  createTenantConfig,
  getTenantBySlug,
  getTenantByDomain,
  getAllTenants,
  getTenantCssVars,
  getDemoTenantForPlan,
  PLAN_FEATURES,
} from "@/lib/tenant";

describe("tenant", () => {
  describe("createTenantConfig()", () => {
    it("creates config with required fields and defaults", () => {
      const config = createTenantConfig({
        id: "t1",
        slug: "test-fahrschule",
        fahrschulName: "Test Fahrschule",
        inhaber: "Max Test",
        stadt: "Berlin",
        adresse: "Teststr. 1",
        telefon: "+49 30 123456",
        email: "info@test.de",
        plan: "starter",
      });

      expect(config.id).toBe("t1");
      expect(config.slug).toBe("test-fahrschule");
      expect(config.isActive).toBe(true);
      expect(config.isDemo).toBe(false);
      expect(config.fuehrerscheinklassen).toContain("B");
      expect(config.branding.primaryColor).toBeTruthy();
    });

    it("uses plan-specific default branding", () => {
      const starter = createTenantConfig({
        id: "t1", slug: "s", fahrschulName: "F", inhaber: "I",
        stadt: "S", adresse: "A", telefon: "T", email: "E", plan: "starter",
      });
      const premium = createTenantConfig({
        id: "t2", slug: "p", fahrschulName: "F", inhaber: "I",
        stadt: "S", adresse: "A", telefon: "T", email: "E", plan: "premium",
      });

      expect(starter.branding.primaryColor).not.toBe(premium.branding.primaryColor);
    });

    it("uses plan-specific features as defaults", () => {
      const config = createTenantConfig({
        id: "t1", slug: "s", fahrschulName: "F", inhaber: "I",
        stadt: "S", adresse: "A", telefon: "T", email: "E", plan: "pro",
      });

      expect(config.features).toEqual(PLAN_FEATURES.pro);
    });
  });

  describe("PLAN_FEATURES", () => {
    it("starter has fewer features than pro", () => {
      const starterCount = Object.values(PLAN_FEATURES.starter).filter(Boolean).length;
      const proCount = Object.values(PLAN_FEATURES.pro).filter(Boolean).length;
      expect(proCount).toBeGreaterThan(starterCount);
    });

    it("premium has all features enabled", () => {
      const premiumAll = Object.values(PLAN_FEATURES.premium).every(Boolean);
      expect(premiumAll).toBe(true);
    });
  });

  describe("getTenantBySlug()", () => {
    it("returns demo tenant by slug", () => {
      const tenant = getTenantBySlug("fahrschule-mueller");
      expect(tenant).not.toBeNull();
      expect(tenant!.fahrschulName).toContain("Müller");
    });

    it("returns null for unknown slug", () => {
      expect(getTenantBySlug("nonexistent")).toBeNull();
    });
  });

  describe("getTenantByDomain()", () => {
    it("returns null when no tenant has matching domain", () => {
      expect(getTenantByDomain("unknown.de")).toBeNull();
    });
  });

  describe("getAllTenants()", () => {
    it("returns only active tenants", () => {
      const all = getAllTenants();
      expect(all.length).toBeGreaterThan(0);
      for (const t of all) {
        expect(t.isActive).toBe(true);
      }
    });
  });

  describe("getTenantCssVars()", () => {
    it("returns CSS custom properties from branding", () => {
      const tenant = getTenantBySlug("fahrschule-mueller")!;
      const vars = getTenantCssVars(tenant);

      expect(vars["--tenant-primary"]).toBe(tenant.branding.primaryColor);
      expect(vars["--tenant-primary-light"]).toBe(tenant.branding.primaryColorLight);
      expect(vars["--tenant-primary-dark"]).toBe(tenant.branding.primaryColorDark);
      expect(vars["--tenant-accent"]).toBe(tenant.branding.accentColor);
    });
  });

  describe("getDemoTenantForPlan()", () => {
    it("returns starter demo tenant", () => {
      const t = getDemoTenantForPlan("starter");
      expect(t).not.toBeNull();
      expect(t!.plan).toBe("starter");
      expect(t!.isDemo).toBe(true);
    });

    it("returns pro demo tenant", () => {
      const t = getDemoTenantForPlan("pro");
      expect(t).not.toBeNull();
      expect(t!.plan).toBe("pro");
    });

    it("returns premium demo tenant", () => {
      const t = getDemoTenantForPlan("premium");
      expect(t).not.toBeNull();
      expect(t!.plan).toBe("premium");
    });

    it("returns null for invalid plan", () => {
      expect(getDemoTenantForPlan("enterprise")).toBeNull();
    });
  });
});

// ============================================================
// lead-from-call (pure functions only)
// ============================================================
import { splitName, normalizeLicenseClass } from "@/lib/crm/lead-from-call";

describe("lead-from-call utilities", () => {
  describe("splitName()", () => {
    it("splits 'Max Müller' into vorname and nachname", () => {
      expect(splitName("Max Müller")).toEqual({
        vorname: "Max",
        nachname: "Müller",
      });
    });

    it("handles single name", () => {
      expect(splitName("Max")).toEqual({ vorname: "Max", nachname: "" });
    });

    it("handles multi-part first names", () => {
      expect(splitName("Hans Peter Müller")).toEqual({
        vorname: "Hans Peter",
        nachname: "Müller",
      });
    });

    it("returns defaults for empty input", () => {
      expect(splitName("")).toEqual({ vorname: "Unbekannt", nachname: "" });
    });

    it("trims whitespace", () => {
      expect(splitName("  Max  Müller  ")).toEqual({
        vorname: "Max",
        nachname: "Müller",
      });
    });
  });

  describe("normalizeLicenseClass()", () => {
    it("defaults to B when empty", () => {
      expect(normalizeLicenseClass()).toBe("B");
      expect(normalizeLicenseClass("")).toBe("B");
      expect(normalizeLicenseClass(undefined)).toBe("B");
    });

    it("normalizes valid classes to uppercase", () => {
      expect(normalizeLicenseClass("b")).toBe("B");
      expect(normalizeLicenseClass("a1")).toBe("A1");
      expect(normalizeLicenseClass("am")).toBe("AM");
      expect(normalizeLicenseClass("be")).toBe("BE");
    });

    it("normalizes BF 17 variants", () => {
      expect(normalizeLicenseClass("BF 17")).toBe("BF17");
      expect(normalizeLicenseClass("B17")).toBe("BF17");
      expect(normalizeLicenseClass("bf17")).toBe("BF17");
    });

    it("normalizes B 96 variant", () => {
      expect(normalizeLicenseClass("B 96")).toBe("B96");
      expect(normalizeLicenseClass("b96")).toBe("B96");
    });

    it("returns B for unknown class", () => {
      expect(normalizeLicenseClass("C")).toBe("B");
      expect(normalizeLicenseClass("invalid")).toBe("B");
    });
  });
});

// ============================================================
// Onboarding (pure functions)
// ============================================================
import { generateQAChecklist } from "@/lib/onboarding";

describe("onboarding", () => {
  describe("generateQAChecklist()", () => {
    it("includes basic checks for all tenants", () => {
      const tenant = getTenantBySlug("fahrschule-mueller")!;
      const checklist = generateQAChecklist(tenant);

      expect(checklist.some((c) => c.includes(tenant.slug))).toBe(true);
      expect(checklist.some((c) => c.includes(tenant.fahrschulName))).toBe(true);
      expect(checklist.some((c) => c.includes("Branding"))).toBe(true);
      expect(checklist.some((c) => c.includes("Mobile"))).toBe(true);
      expect(checklist.some((c) => c.includes("Lighthouse"))).toBe(true);
    });

    it("includes feature-specific checks for premium tenant", () => {
      const tenant = getTenantBySlug("fahrschule-weber")!;
      const checklist = generateQAChecklist(tenant);

      expect(checklist.some((c) => c.includes("Anmeldeformular"))).toBe(true);
      expect(checklist.some((c) => c.includes("Theorie-Trainer"))).toBe(true);
      expect(checklist.some((c) => c.includes("Telefon-Assistent"))).toBe(true);
      expect(checklist.some((c) => c.includes("Chatbot"))).toBe(true);
    });

    it("excludes premium-only checks for starter tenant", () => {
      const tenant = getTenantBySlug("fahrschule-mueller")!;
      const checklist = generateQAChecklist(tenant);

      expect(checklist.some((c) => c.includes("Theorie-Trainer"))).toBe(false);
      expect(checklist.some((c) => c.includes("Telefon-Assistent"))).toBe(false);
    });
  });
});

// ============================================================
// Theorie Progress Sync (pure merge function)
// ============================================================
import { mergeProgress, type FullProgress } from "@/lib/theorie-progress-sync";

describe("theorie-progress-sync", () => {
  const today = new Date().toISOString().split("T")[0];

  function makeProgress(overrides: Partial<FullProgress> = {}): FullProgress {
    return {
      questions: {},
      xp: 0,
      bestStreak: 0,
      totalCorrect: 0,
      totalWrong: 0,
      dailyGoal: 20,
      dailyDone: 0,
      dailyDate: today,
      examsPassed: 0,
      examsFailed: 0,
      ...overrides,
    };
  }

  describe("mergeProgress()", () => {
    it("takes max of scalar fields", () => {
      const local = makeProgress({ xp: 100, bestStreak: 5, totalCorrect: 50 });
      const remote = makeProgress({ xp: 80, bestStreak: 7, totalCorrect: 40 });

      const merged = mergeProgress(local, remote);
      expect(merged.xp).toBe(100);
      expect(merged.bestStreak).toBe(7);
      expect(merged.totalCorrect).toBe(50);
    });

    it("merges questions by keeping max correct/wrong counts", () => {
      const local = makeProgress({
        questions: {
          q1: { correct: 3, wrong: 1, lastAnswered: 100, lastCorrect: true, bookmarked: false },
        },
      });
      const remote = makeProgress({
        questions: {
          q1: { correct: 2, wrong: 2, lastAnswered: 200, lastCorrect: false, bookmarked: true },
        },
      });

      const merged = mergeProgress(local, remote);
      expect(merged.questions.q1.correct).toBe(3);
      expect(merged.questions.q1.wrong).toBe(2);
      expect(merged.questions.q1.lastAnswered).toBe(200);
      expect(merged.questions.q1.lastCorrect).toBe(false); // remote is more recent
      expect(merged.questions.q1.bookmarked).toBe(true); // OR of both
    });

    it("preserves questions only in local", () => {
      const local = makeProgress({
        questions: {
          q1: { correct: 1, wrong: 0, lastAnswered: 100, lastCorrect: true, bookmarked: false },
        },
      });
      const remote = makeProgress({ questions: {} });

      const merged = mergeProgress(local, remote);
      expect(merged.questions.q1).toBeDefined();
      expect(merged.questions.q1.correct).toBe(1);
    });

    it("preserves questions only in remote", () => {
      const local = makeProgress({ questions: {} });
      const remote = makeProgress({
        questions: {
          q2: { correct: 5, wrong: 1, lastAnswered: 300, lastCorrect: true, bookmarked: false },
        },
      });

      const merged = mergeProgress(local, remote);
      expect(merged.questions.q2).toBeDefined();
    });

    it("uses local dailyGoal preference", () => {
      const local = makeProgress({ dailyGoal: 30 });
      const remote = makeProgress({ dailyGoal: 20 });

      const merged = mergeProgress(local, remote);
      expect(merged.dailyGoal).toBe(30);
    });

    it("resets dailyDone when both dates are stale", () => {
      const local = makeProgress({ dailyDate: "2025-01-01", dailyDone: 15 });
      const remote = makeProgress({ dailyDate: "2025-01-01", dailyDone: 10 });

      const merged = mergeProgress(local, remote);
      expect(merged.dailyDone).toBe(0);
      expect(merged.dailyDate).toBe(today);
    });

    it("keeps local dailyDone when only local is current", () => {
      const local = makeProgress({ dailyDate: today, dailyDone: 12 });
      const remote = makeProgress({ dailyDate: "2025-01-01", dailyDone: 20 });

      const merged = mergeProgress(local, remote);
      expect(merged.dailyDone).toBe(12);
    });

    it("keeps remote dailyDone when only remote is current", () => {
      const local = makeProgress({ dailyDate: "2025-01-01", dailyDone: 5 });
      const remote = makeProgress({ dailyDate: today, dailyDone: 18 });

      const merged = mergeProgress(local, remote);
      expect(merged.dailyDone).toBe(18);
    });

    it("takes max dailyDone when both are current", () => {
      const local = makeProgress({ dailyDate: today, dailyDone: 10 });
      const remote = makeProgress({ dailyDate: today, dailyDone: 15 });

      const merged = mergeProgress(local, remote);
      expect(merged.dailyDone).toBe(15);
    });
  });
});
