/**
 * Kunden-Onboarding Utilities
 *
 * Technischer Onboarding-Flow:
 * 1. Tenant-Config erstellen
 * 2. Branding konfigurieren
 * 3. Webhooks einrichten
 * 4. Retell.ai Agent konfigurieren (Premium)
 * 5. QA-Check durchführen
 */

import {
  type TenantConfig,
  type PlanTier,
  createTenantConfig,
  registerTenant,
  PLAN_FEATURES,
} from "./tenant";

interface OnboardingInput {
  // Pflichtfelder
  fahrschulName: string;
  inhaber: string;
  stadt: string;
  adresse: string;
  telefon: string;
  email: string;
  plan: PlanTier;

  // Optional
  customDomain?: string;
  fuehrerscheinklassen?: string[];
  logoUrl?: string;
  primaryColor?: string;
  whatsappNumber?: string;
  oeffnungszeiten?: TenantConfig["oeffnungszeiten"];
  preise?: TenantConfig["preise"];
}

interface OnboardingResult {
  success: boolean;
  tenant?: TenantConfig;
  checklist: { step: string; status: "done" | "pending" | "error"; detail?: string }[];
  errors: string[];
}

/**
 * Slug aus Fahrschulname generieren
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Eindeutige ID generieren
 */
function generateId(): string {
  return `tenant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Vollständiges Kunden-Onboarding durchführen
 */
export async function onboardNewCustomer(
  input: OnboardingInput
): Promise<OnboardingResult> {
  const checklist: OnboardingResult["checklist"] = [];
  const errors: string[] = [];

  // 1. Tenant Config erstellen
  try {
    const slug = generateSlug(input.fahrschulName);
    const id = generateId();

    const branding = input.primaryColor
      ? {
          primaryColor: input.primaryColor,
          primaryColorLight: adjustColor(input.primaryColor, 20),
          primaryColorDark: adjustColor(input.primaryColor, -20),
          accentColor: "#10b981",
          logoUrl: input.logoUrl,
        }
      : undefined;

    const tenant = createTenantConfig({
      id,
      slug,
      fahrschulName: input.fahrschulName,
      inhaber: input.inhaber,
      stadt: input.stadt,
      adresse: input.adresse,
      telefon: input.telefon,
      email: input.email,
      plan: input.plan,
      customDomain: input.customDomain,
      fuehrerscheinklassen: input.fuehrerscheinklassen,
      branding,
      oeffnungszeiten: input.oeffnungszeiten,
      preise: input.preise,
      integrations: {
        whatsappNumber: input.whatsappNumber,
      },
    });

    // Supabase + lokaler Cache
    await registerTenant(tenant);
    checklist.push({ step: "Tenant-Config erstellt", status: "done", detail: `Slug: ${slug}` });

    // 2. Feature-Flags setzen
    checklist.push({
      step: "Features konfiguriert",
      status: "done",
      detail: `Plan: ${input.plan}, ${Object.values(PLAN_FEATURES[input.plan]).filter(Boolean).length} Features aktiv`,
    });

    // 3. Webhooks prüfen
    if (tenant.integrations.webhookAnmeldungUrl) {
      checklist.push({ step: "Anmeldungs-Webhook", status: "done" });
    } else {
      checklist.push({ step: "Anmeldungs-Webhook", status: "pending", detail: "Muss noch konfiguriert werden" });
    }

    // 4. WhatsApp prüfen
    if (tenant.integrations.whatsappNumber) {
      checklist.push({ step: "WhatsApp verbunden", status: "done" });
    } else {
      checklist.push({ step: "WhatsApp verbunden", status: "pending", detail: "WhatsApp Business Nummer fehlt" });
    }

    // 5. fonio.ai (nur Premium)
    if (input.plan === "premium") {
      if (tenant.integrations.retellAgentId) {
        checklist.push({ step: "AI Telefon-Assistent", status: "done" });
      } else {
        checklist.push({ step: "AI Telefon-Assistent", status: "pending", detail: "fonio.ai Agent muss konfiguriert werden" });
      }
    }

    // 6. Custom Domain
    if (input.customDomain) {
      checklist.push({ step: "Custom Domain", status: "pending", detail: `${input.customDomain} — DNS + Vercel Setup nötig` });
    }

    // 7. Google Analytics (Premium)
    if (input.plan === "premium") {
      checklist.push({ step: "Google Analytics", status: "pending", detail: "GA4 Property muss eingerichtet werden" });
    }

    return { success: true, tenant, checklist, errors };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unbekannter Fehler";
    errors.push(errorMsg);
    checklist.push({ step: "Tenant-Config erstellt", status: "error", detail: errorMsg });
    return { success: false, checklist, errors };
  }
}

/**
 * Farbe aufhellen/abdunkeln
 */
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/**
 * QA-Checklist für neuen Kunden generieren
 */
export function generateQAChecklist(tenant: TenantConfig): string[] {
  const checks: string[] = [
    `[ ] Website aufrufen: /${tenant.slug}`,
    `[ ] Fahrschulname korrekt: "${tenant.fahrschulName}"`,
    `[ ] Kontaktdaten prüfen: ${tenant.telefon}, ${tenant.email}`,
    `[ ] Branding/Farben korrekt`,
  ];

  if (tenant.features.anmeldung) {
    checks.push(`[ ] Anmeldeformular testen`);
    checks.push(`[ ] Webhook-Weiterleitung prüfen`);
  }

  if (tenant.features.theorie) {
    checks.push(`[ ] Theorie-Trainer aufrufen`);
    checks.push(`[ ] AI-Tutor testen`);
  }

  if (tenant.features.telefon) {
    checks.push(`[ ] AI Telefon-Assistent testen`);
    checks.push(`[ ] fonio.ai Agent konfiguriert`);
  }

  if (tenant.features.chatbot) {
    checks.push(`[ ] AI-Chatbot auf Website testen`);
  }

  if (tenant.customDomain) {
    checks.push(`[ ] Custom Domain erreichbar: ${tenant.customDomain}`);
    checks.push(`[ ] SSL-Zertifikat aktiv`);
  }

  checks.push(`[ ] Mobile Ansicht prüfen`);
  checks.push(`[ ] Dark Mode prüfen`);
  checks.push(`[ ] Lighthouse Score > 90`);

  return checks;
}
