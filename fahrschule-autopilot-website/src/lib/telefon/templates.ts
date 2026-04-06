/**
 * Follow-Up Nachrichtenvorlagen für den Telefon-Assistenten (Agent 2)
 *
 * Verwendet von:
 * - n8n Workflow (WhatsApp Follow-Up)
 * - API Route /api/crm/follow-up
 * - Dashboard: Manuelle Follow-Up Nachrichten
 *
 * Alle Templates sind in Deutsch und verwenden die "Sie"-Form.
 * Platzhalter: {name}, {fahrschulName}, {website}, {calendlyUrl}, {fahrlehrerName}
 */

export interface FollowUpTemplate {
  id: string;
  name: string;
  intent: string;
  kanal: "whatsapp" | "email" | "sms";
  betreff?: string; // Nur für E-Mail
  nachricht: string;
  tags: string[];
}

export const FOLLOW_UP_TEMPLATES: FollowUpTemplate[] = [
  // ============================================================
  // WhatsApp Templates
  // ============================================================
  {
    id: "whatsapp_anmeldung",
    name: "Anmeldung — Willkommen",
    intent: "anmeldung",
    kanal: "whatsapp",
    nachricht: `Hallo{name}, vielen Dank für Ihren Anruf! 🚗

Sie können sich direkt online anmelden — das dauert nur 3 Minuten:
{website}/anmeldung

Folgende Unterlagen benötigen Sie:
✅ Sehtest (Optiker, ca. 7€)
✅ Erste-Hilfe-Kurs (1 Tag, ca. 40-60€)
✅ Biometrisches Passfoto
✅ Personalausweis

Bei Fragen sind wir jederzeit erreichbar!

Ihr Team von {fahrschulName}`,
    tags: ["anmeldung", "willkommen", "onboarding"],
  },

  {
    id: "whatsapp_termin",
    name: "Termin — Bestätigung",
    intent: "termin",
    kanal: "whatsapp",
    nachricht: `Hallo{name}, danke für Ihren Anruf! 📅

{fahrlehrerName} meldet sich innerhalb von 24 Stunden bei Ihnen, um einen Termin zu vereinbaren.

Oder buchen Sie direkt online:
{calendlyUrl}

Ihr Team von {fahrschulName}`,
    tags: ["termin", "beratung", "buchung"],
  },

  {
    id: "whatsapp_preisanfrage",
    name: "Preisanfrage — Infos nachsenden",
    intent: "preisanfrage",
    kanal: "whatsapp",
    nachricht: `Hallo{name}, danke für Ihr Interesse! 💰

Hier nochmal unsere Preise im Überblick:
📋 Grundgebühr: ab 350€
🚗 Fahrstunde (45 Min): ab 55€
🛣️ Sonderfahrt: ab 65€
📝 TÜV-Gebühren: ca. 140€

Die meisten Schüler rechnen mit 2.800-3.500€ gesamt.

Haben Sie Fragen? Rufen Sie uns an oder buchen Sie einen Beratungstermin:
{calendlyUrl}

Ihr Team von {fahrschulName}`,
    tags: ["preise", "kosten", "information"],
  },

  {
    id: "whatsapp_beschwerde",
    name: "Beschwerde — Feedback bestätigen",
    intent: "beschwerde",
    kanal: "whatsapp",
    nachricht: `Hallo{name}, vielen Dank für Ihr Feedback.

Wir nehmen Ihr Anliegen sehr ernst und ein Mitarbeiter wird sich persönlich bei Ihnen melden.

Ihr Team von {fahrschulName}`,
    tags: ["beschwerde", "feedback", "eskalation"],
  },

  {
    id: "whatsapp_information",
    name: "Information — Allgemeine Infos",
    intent: "information",
    kanal: "whatsapp",
    nachricht: `Hallo{name}, vielen Dank für Ihren Anruf bei {fahrschulName}! 🚗

Auf unserer Website finden Sie alle wichtigen Infos:
{website}

Für eine persönliche Beratung:
{calendlyUrl}

Wir freuen uns auf Sie!

Ihr Team von {fahrschulName}`,
    tags: ["information", "allgemein"],
  },

  {
    id: "whatsapp_bf17",
    name: "BF17 — Begleitetes Fahren Infos",
    intent: "information",
    kanal: "whatsapp",
    nachricht: `Hallo{name}, danke für Ihr Interesse an BF17! 🚗

Begleitetes Fahren ab 17 — die wichtigsten Infos:
✅ Ab 17 Jahren mit Begleitperson
✅ Begleitperson: mind. 30 Jahre, 5 Jahre Führerschein, max. 1 Punkt
✅ Mit 18 fällt die Begleitpflicht automatisch weg
✅ Früh anfangen = günstigere Versicherung!

Beratungstermin buchen:
{calendlyUrl}

Ihr Team von {fahrschulName}`,
    tags: ["bf17", "jugendlich", "begleitetes-fahren"],
  },

  // ============================================================
  // E-Mail Templates
  // ============================================================
  {
    id: "email_anmeldung",
    name: "Anmeldung — Willkommens-E-Mail",
    intent: "anmeldung",
    kanal: "email",
    betreff: "Willkommen bei {fahrschulName} — Ihre Anmeldung",
    nachricht: `Hallo{name},

vielen Dank für Ihren Anruf und Ihr Interesse an {fahrschulName}!

Hier sind Ihre nächsten Schritte:

1. Online anmelden: {website}/anmeldung (dauert nur 3 Minuten)
2. Unterlagen besorgen:
   - Sehtest (beim Optiker, ca. 7€)
   - Erste-Hilfe-Kurs (1 Tag, ca. 40-60€)
   - Biometrisches Passfoto
   - Personalausweis (Kopie)
3. Beratungstermin buchen: {calendlyUrl}

Tipp: Auf unserer Website gibt es einen kostenlosen Theorie-Trainer mit über 2.300 Prüfungsfragen!

Bei Fragen erreichen Sie uns jederzeit telefonisch oder per E-Mail.

Mit freundlichen Grüßen
Ihr Team von {fahrschulName}`,
    tags: ["anmeldung", "willkommen", "email"],
  },

  {
    id: "email_termin",
    name: "Termin — Beratungstermin Erinnerung",
    intent: "termin",
    kanal: "email",
    betreff: "Beratungstermin bei {fahrschulName}",
    nachricht: `Hallo{name},

vielen Dank für Ihren Anruf!

{fahrlehrerName} wird sich innerhalb von 24 Stunden bei Ihnen melden, um einen Beratungstermin zu vereinbaren.

Alternativ können Sie auch direkt online buchen:
{calendlyUrl}

Wir freuen uns auf Sie!

Mit freundlichen Grüßen
Ihr Team von {fahrschulName}`,
    tags: ["termin", "beratung", "email"],
  },

  // ============================================================
  // SMS Templates (kurz!)
  // ============================================================
  {
    id: "sms_anmeldung",
    name: "Anmeldung — SMS Link",
    intent: "anmeldung",
    kanal: "sms",
    nachricht: `Danke für Ihren Anruf! Hier anmelden: {website}/anmeldung — Ihr Team von {fahrschulName}`,
    tags: ["anmeldung", "sms", "kurz"],
  },

  {
    id: "sms_termin",
    name: "Termin — SMS Buchungslink",
    intent: "termin",
    kanal: "sms",
    nachricht: `Beratungstermin buchen: {calendlyUrl} — Wir melden uns auch innerhalb 24h. {fahrschulName}`,
    tags: ["termin", "sms", "kurz"],
  },
];

// ============================================================
// Inhaber-Benachrichtigungen
// ============================================================

export const OWNER_NOTIFICATION_TEMPLATES = {
  beschwerde: {
    betreff: "⚠️ Beschwerde-Anruf",
    nachricht: `⚠️ ACHTUNG: Beschwerde-Anruf eingegangen!

📱 Anrufer: {callerName} ({callerPhone})
😊 Stimmung: {sentiment}
🎯 Intent: {intent}
📝 Zusammenfassung: {summary}

Bitte zeitnah zurückrufen!`,
  },

  negative_stimmung: {
    betreff: "😟 Negativer Anruf",
    nachricht: `😟 Anruf mit negativer Stimmung:

📱 Anrufer: {callerName} ({callerPhone})
🎯 Intent: {intent}
📝 Zusammenfassung: {summary}

Ggf. persönlich nachfassen.`,
  },

  hohe_dringlichkeit: {
    betreff: "🔴 Dringender Anruf",
    nachricht: `🔴 Dringender Anruf eingegangen!

📱 Anrufer: {callerName} ({callerPhone})
🎯 Intent: {intent}
📝 Zusammenfassung: {summary}

Bitte umgehend zurückrufen!`,
  },

  neuer_lead: {
    betreff: "✅ Neuer Lead",
    nachricht: `✅ Neuer Lead vom Telefon-Assistenten:

📱 {callerName} ({callerPhone})
🎯 Intent: {intent}
🚗 Klasse: {licenseClass}
📅 Bevorzugte Zeit: {preferredTime}

Lead wurde automatisch im CRM angelegt.`,
  },
};

// ============================================================
// Helpers
// ============================================================

/**
 * Findet das passende Template basierend auf Intent und Kanal
 */
export function getTemplate(
  intent: string,
  kanal: "whatsapp" | "email" | "sms" = "whatsapp"
): FollowUpTemplate | null {
  return (
    FOLLOW_UP_TEMPLATES.find(
      (t) => t.intent === intent && t.kanal === kanal
    ) ||
    FOLLOW_UP_TEMPLATES.find(
      (t) => t.intent === "information" && t.kanal === kanal
    ) ||
    null
  );
}

/**
 * Ersetzt Platzhalter in einer Nachricht
 */
export function renderTemplate(
  template: string,
  vars: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{${key}}`, value || "");
  }
  // Name-Platzhalter: wenn leer, kein Leerzeichen
  result = result.replace(/Hallo\s*,/, "Hallo,");
  return result;
}

/**
 * Wählt das richtige Owner-Notification-Template
 */
export function getOwnerNotificationTemplate(
  intent: string,
  sentiment: string,
  urgency: string
): { betreff: string; nachricht: string } {
  if (intent === "beschwerde") return OWNER_NOTIFICATION_TEMPLATES.beschwerde;
  if (sentiment === "negative") return OWNER_NOTIFICATION_TEMPLATES.negative_stimmung;
  if (urgency === "hoch") return OWNER_NOTIFICATION_TEMPLATES.hohe_dringlichkeit;
  return OWNER_NOTIFICATION_TEMPLATES.neuer_lead;
}
