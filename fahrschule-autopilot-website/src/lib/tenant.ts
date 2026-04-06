/**
 * Multi-Tenant Configuration System
 *
 * Jede Fahrschule bekommt eine eigene Config mit Branding, Features und Kontaktdaten.
 * Kunden-Websites werden über subdomain oder slug identifiziert.
 */

export type PlanTier = "starter" | "pro" | "premium";

export interface TenantConfig {
  // Identifikation
  id: string;
  slug: string; // URL-slug: z.B. "fahrschule-mueller"
  customDomain?: string; // z.B. "fahrschule-mueller.de"

  // Fahrschul-Daten
  fahrschulName: string;
  inhaber: string;
  stadt: string;
  adresse: string;
  telefon: string;
  email: string;
  website?: string;

  // Öffnungszeiten
  oeffnungszeiten?: {
    montag?: string;
    dienstag?: string;
    mittwoch?: string;
    donnerstag?: string;
    freitag?: string;
    samstag?: string;
    sonntag?: string;
  };

  // Führerscheinklassen
  fuehrerscheinklassen: string[];

  // Preise (optional, für Website-Anzeige)
  preise?: {
    grundgebuehr?: number;
    fahrstunde?: number;
    sonderfahrt?: number;
    pruefungTh?: number;
    pruefungPr?: number;
  };

  // Branding
  branding: {
    primaryColor: string;      // Hex: "#2563eb"
    primaryColorLight: string;
    primaryColorDark: string;
    accentColor: string;
    logoUrl?: string;
    faviconUrl?: string;
  };

  // Plan & Features
  plan: PlanTier;
  features: Record<string, boolean>;

  // Integrations
  integrations: {
    webhookAnmeldungUrl?: string;
    webhookRetellUrl?: string;
    retellAgentId?: string;
    googleAnalyticsId?: string;
    googleSearchConsoleId?: string;
    whatsappNumber?: string;
    calendlyUrl?: string;
  };

  // SEO
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };

  // Status
  isActive: boolean;
  isDemo: boolean;
  createdAt: string;
}

/**
 * Feature-Matrix nach Plan
 */
export const PLAN_FEATURES: Record<PlanTier, Record<string, boolean>> = {
  starter: {
    erinnerungen: true,
    bewertungen: true,
    reporting: true,
    zahlungen: false,
    chatbot: false,
    onboarding: false,
    empfehlungen: false,
    anmeldung: false,
    telefon: false,
    website: false,
    theorie: false,
    crm: false,
    blog: false,
  },
  pro: {
    erinnerungen: true,
    bewertungen: true,
    reporting: true,
    zahlungen: true,
    chatbot: true,
    onboarding: true,
    empfehlungen: true,
    anmeldung: true,
    telefon: false,
    website: false,
    theorie: false,
    crm: false,
    blog: false,
  },
  premium: {
    erinnerungen: true,
    bewertungen: true,
    reporting: true,
    zahlungen: true,
    chatbot: true,
    onboarding: true,
    empfehlungen: true,
    anmeldung: true,
    telefon: true,
    website: true,
    theorie: true,
    crm: true,
    blog: true,
  },
};

/**
 * Default Branding pro Plan
 */
const DEFAULT_BRANDING: Record<PlanTier, TenantConfig["branding"]> = {
  starter: {
    primaryColor: "#3b82f6",
    primaryColorLight: "#60a5fa",
    primaryColorDark: "#2563eb",
    accentColor: "#10b981",
  },
  pro: {
    primaryColor: "#16a34a",
    primaryColorLight: "#22c55e",
    primaryColorDark: "#15803d",
    accentColor: "#3b82f6",
  },
  premium: {
    primaryColor: "#7c3aed",
    primaryColorLight: "#8b5cf6",
    primaryColorDark: "#6d28d9",
    accentColor: "#10b981",
  },
};

/**
 * Erstellt eine neue Tenant-Config mit Defaults
 */
export function createTenantConfig(
  partial: Partial<TenantConfig> & Pick<TenantConfig, "id" | "slug" | "fahrschulName" | "inhaber" | "stadt" | "adresse" | "telefon" | "email" | "plan">
): TenantConfig {
  const plan = partial.plan;
  return {
    ...partial,
    customDomain: partial.customDomain,
    website: partial.website,
    fuehrerscheinklassen: partial.fuehrerscheinklassen || ["B", "B96", "BE", "A", "A2", "A1", "AM"],
    branding: partial.branding || DEFAULT_BRANDING[plan],
    features: partial.features || PLAN_FEATURES[plan],
    integrations: partial.integrations || {},
    isActive: partial.isActive ?? true,
    isDemo: partial.isDemo ?? false,
    createdAt: partial.createdAt || new Date().toISOString(),
  };
}

/**
 * Tenant-Registry: Alle konfigurierten Fahrschulen
 * In Production: Supabase/Postgres. Hier: statische Config.
 */
const tenantRegistry: Map<string, TenantConfig> = new Map();

// Demo-Tenants (3 Demo-Fahrschulen)
const DEMO_TENANTS: TenantConfig[] = [
  createTenantConfig({
    id: "demo-starter",
    slug: "fahrschule-mueller",
    fahrschulName: "Fahrschule Müller",
    inhaber: "Thomas Müller",
    stadt: "Musterstadt",
    adresse: "Hauptstraße 42, 90402 Musterstadt",
    telefon: "+49 911 123 4567",
    email: "info@fahrschule-mueller.de",
    plan: "starter",
    isDemo: true,
    oeffnungszeiten: {
      montag: "08:00 - 18:00",
      dienstag: "08:00 - 18:00",
      mittwoch: "08:00 - 18:00",
      donnerstag: "08:00 - 18:00",
      freitag: "08:00 - 16:00",
      samstag: "09:00 - 13:00",
    },
  }),
  createTenantConfig({
    id: "demo-pro",
    slug: "fahrschule-schmidt",
    fahrschulName: "Fahrschule Schmidt",
    inhaber: "Michael Schmidt",
    stadt: "München",
    adresse: "Leopoldstraße 88, 80802 München",
    telefon: "+49 89 987 6543",
    email: "info@fahrschule-schmidt.de",
    plan: "pro",
    isDemo: true,
    oeffnungszeiten: {
      montag: "07:00 - 19:00",
      dienstag: "07:00 - 19:00",
      mittwoch: "07:00 - 19:00",
      donnerstag: "07:00 - 19:00",
      freitag: "07:00 - 17:00",
      samstag: "08:00 - 14:00",
    },
    preise: {
      grundgebuehr: 350,
      fahrstunde: 65,
      sonderfahrt: 75,
      pruefungTh: 80,
      pruefungPr: 180,
    },
  }),
  createTenantConfig({
    id: "demo-premium",
    slug: "fahrschule-weber",
    fahrschulName: "Fahrschule Weber",
    inhaber: "Andreas Weber",
    stadt: "Stuttgart",
    adresse: "Königstraße 15, 70173 Stuttgart",
    telefon: "+49 711 456 7890",
    email: "info@fahrschule-weber.de",
    plan: "premium",
    isDemo: true,
    oeffnungszeiten: {
      montag: "07:00 - 20:00",
      dienstag: "07:00 - 20:00",
      mittwoch: "07:00 - 20:00",
      donnerstag: "07:00 - 20:00",
      freitag: "07:00 - 18:00",
      samstag: "08:00 - 15:00",
    },
    preise: {
      grundgebuehr: 400,
      fahrstunde: 70,
      sonderfahrt: 80,
      pruefungTh: 90,
      pruefungPr: 200,
    },
    integrations: {
      whatsappNumber: "+49 711 456 7890",
      calendlyUrl: "https://calendly.com/fahrschule-weber/beratung",
    },
  }),
];

// Initialize registry
DEMO_TENANTS.forEach((t) => tenantRegistry.set(t.slug, t));

/**
 * Tenant abrufen per Slug
 */
export function getTenantBySlug(slug: string): TenantConfig | null {
  return tenantRegistry.get(slug) || null;
}

/**
 * Tenant abrufen per Custom Domain
 */
export function getTenantByDomain(domain: string): TenantConfig | null {
  for (const tenant of tenantRegistry.values()) {
    if (tenant.customDomain === domain) return tenant;
  }
  return null;
}

/**
 * Alle aktiven Tenants abrufen
 */
export function getAllTenants(): TenantConfig[] {
  return Array.from(tenantRegistry.values()).filter((t) => t.isActive);
}

/**
 * Neuen Tenant registrieren — schreibt nur in lokalen Cache.
 * Für Supabase-Persistenz: siehe tenant-server.ts
 */
export function registerTenant(config: TenantConfig): void {
  tenantRegistry.set(config.slug, config);
}

/**
 * Tenant-spezifische CSS Custom Properties generieren
 */
export function getTenantCssVars(tenant: TenantConfig): Record<string, string> {
  return {
    "--tenant-primary": tenant.branding.primaryColor,
    "--tenant-primary-light": tenant.branding.primaryColorLight,
    "--tenant-primary-dark": tenant.branding.primaryColorDark,
    "--tenant-accent": tenant.branding.accentColor,
  };
}

/**
 * Slug-zu-Demo-Plan Mapping (für Rückwärtskompatibilität mit /demo/[plan])
 */
export function getDemoTenantForPlan(plan: string): TenantConfig | null {
  const mapping: Record<string, string> = {
    starter: "fahrschule-mueller",
    pro: "fahrschule-schmidt",
    premium: "fahrschule-weber",
  };
  const slug = mapping[plan];
  return slug ? getTenantBySlug(slug) : null;
}
