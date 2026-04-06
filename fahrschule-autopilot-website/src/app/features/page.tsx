"use client";

import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import {
  Bell,
  Star,
  CreditCard,
  MessageCircle,
  Users,
  Repeat,
  BarChart3,
  Phone,
  PhoneCall,
  Clock,
  Globe,
  BookOpen,
  FileText,
  ClipboardList,
  Car,
  Shield,
  Mail,
  CalendarCheck,
  TrendingUp,
  CheckCircle2,
  X,
  Zap,
  Crown,
  ArrowRight,
  Sparkles,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

type PlanTier = "starter" | "pro" | "premium";

interface Feature {
  icon: typeof Bell;
  title: string;
  description: string;
  result: string;
  plans: PlanTier[];
  category: string;
}

const categories = [
  { id: "alle", label: "Alle Features" },
  { id: "automation", label: "Automation" },
  { id: "kommunikation", label: "Kommunikation" },
  { id: "ai", label: "AI / KI" },
  { id: "verwaltung", label: "Verwaltung & CRM" },
  { id: "marketing", label: "Marketing & SEO" },
  { id: "reporting", label: "Reporting & Analytics" },
];

const features: Feature[] = [
  // --- Automation ---
  {
    icon: Bell,
    title: "Termin-Erinnerungen",
    description:
      "Automatische WhatsApp-Erinnerungen 24h und 2h vor jeder Fahrstunde. Bei Absagen wird sofort der nächste Schüler von der Warteliste kontaktiert.",
    result: "25-40% weniger No-Shows",
    plans: ["starter", "pro", "premium"],
    category: "automation",
  },
  {
    icon: Star,
    title: "Google-Bewertungen Automation",
    description:
      "Nach jeder bestandenen Prüfung wird automatisch eine Bewertungsanfrage gesendet. 5 Sterne gehen direkt zu Google, weniger werden als internes Feedback erfasst.",
    result: "15-20 neue Bewertungen/Monat",
    plans: ["starter", "pro", "premium"],
    category: "automation",
  },
  {
    icon: CreditCard,
    title: "Zahlungserinnerungen",
    description:
      "3-Stufen-Mahnwesen: freundliche Erinnerung nach 3, 7 und 14 Tagen. Automatisch, ohne peinliche Anrufe. Eskalation nur wenn nötig.",
    result: "30-50% schnellere Zahlungen",
    plans: ["pro", "premium"],
    category: "automation",
  },
  {
    icon: Users,
    title: "Schüler-Onboarding",
    description:
      "Neue Schüler bekommen automatisch alle Infos, Verträge, Dokumente-Checkliste und nächste Schritte per WhatsApp. Kein manuelles Zusammensuchen.",
    result: "80% weniger Büroarbeit",
    plans: ["pro", "premium"],
    category: "automation",
  },
  {
    icon: Repeat,
    title: "Empfehlungssystem",
    description:
      "Nach bestandener Prüfung werden Schüler automatisch gebeten, Freunde zu empfehlen. Mit Tracking und optionalen Anreizen.",
    result: "2-5 Empfehlungen/Monat",
    plans: ["pro", "premium"],
    category: "automation",
  },
  {
    icon: ClipboardList,
    title: "Wartelisten-Management",
    description:
      "Bei Absagen wird automatisch der nächste Schüler von der Warteliste kontaktiert und der Platz angeboten. Kein Leerlauf, keine leeren Stunden.",
    result: "Keine leeren Fahrstunden",
    plans: ["pro", "premium"],
    category: "automation",
  },
  {
    icon: CalendarCheck,
    title: "Prüfungserinnerungen",
    description:
      "Automatische Erinnerungen 24h und 2h vor Theorie- und Praxisprüfungen per WhatsApp. Schüler kommen vorbereitet und pünktlich.",
    result: "Weniger verpasste Prüfungen",
    plans: ["starter", "pro", "premium"],
    category: "automation",
  },
  {
    icon: Shield,
    title: "DSGVO-Archivierung",
    description:
      "Automatische Anonymisierung und Löschung alter Daten nach konfigurierbarer Aufbewahrungsfrist. Audit-Log für Nachweispflicht.",
    result: "DSGVO-konform ohne Aufwand",
    plans: ["starter", "pro", "premium"],
    category: "automation",
  },

  // --- Kommunikation ---
  {
    icon: Mail,
    title: "E-Mail Automation",
    description:
      "Automatische E-Mails für Willkommensnachrichten, monatliche Reports, Anomalie-Warnungen und Follow-Ups. Professionelle HTML-Templates.",
    result: "Professionelle Kommunikation",
    plans: ["starter", "pro", "premium"],
    category: "kommunikation",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp-Integration",
    description:
      "Alle Automationen laufen über WhatsApp — den Kanal, den Ihre Schüler wirklich nutzen. Twilio Business API für zuverlässigen Versand.",
    result: "95%+ Öffnungsrate",
    plans: ["starter", "pro", "premium"],
    category: "kommunikation",
  },

  // --- AI / KI ---
  {
    icon: MessageCircle,
    title: "AI-Chatbot (5-sprachig)",
    description:
      "Beantwortet Fragen auf Ihrer Website rund um die Uhr: Preise, Ablauf, Anmeldung, Führerscheinklassen. In Deutsch, Türkisch, Arabisch, Russisch und Englisch.",
    result: "24/7 Erreichbarkeit",
    plans: ["pro", "premium"],
    category: "ai",
  },
  {
    icon: PhoneCall,
    title: "AI Telefon-Assistent (+149 EUR Addon)",
    description:
      "KI nimmt Anrufe an, beantwortet Fragen, erfasst Interessenten-Daten und leitet bei Bedarf an den Fahrlehrer weiter. Deutsche Stimme, natürliches Gespräch. Buchbar als Addon zu jedem Plan.",
    result: "Kein Anruf geht verloren",
    plans: ["starter", "pro", "premium"],
    category: "ai",
  },
  {
    icon: FileText,
    title: "KI-Blog-Erstellung",
    description:
      "Automatische wöchentliche Blog-Artikel über fahrschulrelevante Themen. SEO-optimiert mit automatischer Social-Media-Post-Generierung.",
    result: "Besseres Google-Ranking",
    plans: ["premium"],
    category: "ai",
  },
  {
    icon: TrendingUp,
    title: "Anomalie-Erkennung & Churn-Scoring",
    description:
      "KI erkennt Auffälligkeiten: No-Show-Spikes, überfällige Zahlungen, inaktive Schüler. Churn-Scoring bewertet Abwanderungsrisiko pro Kunde.",
    result: "Probleme frühzeitig erkennen",
    plans: ["pro", "premium"],
    category: "ai",
  },

  // --- Verwaltung & CRM ---
  {
    icon: Users,
    title: "Schüler-Verwaltung",
    description:
      "Komplette Schülerverwaltung mit Status-Pipeline (Anmeldung bis Bestanden), Dokumenten-Checkliste, Zahlungsstatus und Kommunikationslog.",
    result: "Alles an einem Ort",
    plans: ["starter", "pro", "premium"],
    category: "verwaltung",
  },
  {
    icon: Car,
    title: "Fahrzeugverwaltung",
    description:
      "Fahrzeuge mit Kennzeichen, TÜV-Terminen, Kilometerstand und Wartungsstatus verwalten. Automatische Erinnerungen bei fälligem TÜV.",
    result: "Kein TÜV-Termin vergessen",
    plans: ["premium"],
    category: "verwaltung",
  },
  {
    icon: FileText,
    title: "Digitale Verträge & E-Signatur",
    description:
      "Ausbildungsverträge digital erstellen und per Canvas-Signatur (Maus/Touch) unterschreiben lassen. PDF-Export für Ihre Unterlagen.",
    result: "Papierloses Büro",
    plans: ["premium"],
    category: "verwaltung",
  },
  {
    icon: CreditCard,
    title: "Online-Bezahlung (Stripe)",
    description:
      "Schüler können per Kreditkarte oder SEPA-Lastschrift direkt online bezahlen. Automatische Rechnungsstellung und Zahlungszuordnung.",
    result: "Schnellerer Zahlungseingang",
    plans: ["premium"],
    category: "verwaltung",
  },
  {
    icon: FileText,
    title: "DATEV & lexoffice Export",
    description:
      "Zahlungsdaten als CSV für DATEV oder lexoffice exportieren. Direkte Integration in Ihre Buchhaltung ohne Abtippen.",
    result: "Buchhaltung in Sekunden",
    plans: ["premium"],
    category: "verwaltung",
  },
  {
    icon: ClipboardList,
    title: "Online-Anmeldung",
    description:
      "Schüler melden sich direkt über Ihre Website an. Multi-Step-Formular mit Führerscheinklasse, Terminwünschen und DSGVO-Einwilligung.",
    result: "Anmeldungen rund um die Uhr",
    plans: ["pro", "premium"],
    category: "verwaltung",
  },
  {
    icon: Clock,
    title: "Öffentliche Warteliste",
    description:
      "Wenn alle Plätze belegt sind, können Interessenten sich auf die Warteliste setzen. Automatische Benachrichtigung wenn ein Platz frei wird.",
    result: "Kein Interessent geht verloren",
    plans: ["pro", "premium"],
    category: "verwaltung",
  },

  // --- Marketing & SEO ---
  {
    icon: Globe,
    title: "Professionelle Website mit SEO",
    description:
      "Komplett fertige Website mit Ihrer Marke, optimiert für Google. Stadt-spezifische Landingpages für lokales SEO in 8 deutschen Städten.",
    result: "Mehr Sichtbarkeit bei Google",
    plans: ["premium"],
    category: "marketing",
  },
  {
    icon: Sparkles,
    title: "Social Media Automation",
    description:
      "Automatische Generierung von Posts für Instagram, Facebook, LinkedIn und Google My Business. KI erstellt plattformgerechte Inhalte.",
    result: "Regelmäßige Social-Media-Präsenz",
    plans: ["premium"],
    category: "marketing",
  },

  // --- Reporting ---
  {
    icon: BarChart3,
    title: "Reporting & Dashboard",
    description:
      "Live-Dashboard mit KPIs: aktive Schüler, No-Show-Rate, Bestehensquote, Umsatz, Zahlungsstatus. Monatlicher Report per E-Mail.",
    result: "Volle Transparenz",
    plans: ["starter", "pro", "premium"],
    category: "reporting",
  },
  {
    icon: TrendingUp,
    title: "ROI-Berechnung",
    description:
      "Sehen Sie genau, wie viel Zeit und Geld Sie durch die Automationen sparen. Aufgeschlüsselt nach No-Show-Ersparnis, Zeitersparnis und Zahlungswiederherstellung.",
    result: "ROI schwarz auf weiß",
    plans: ["pro", "premium"],
    category: "reporting",
  },
  {
    icon: Phone,
    title: "Telefon-Analytics (mit AI Telefon Addon)",
    description:
      "Dashboard für alle AI-Telefon-Anrufe: Anzahl, Dauer, Intention, Sentiment, Lead-Conversion. Sehen Sie genau, was der Assistent leistet.",
    result: "Volle Kontrolle über KI-Anrufe",
    plans: ["starter", "pro", "premium"],
    category: "reporting",
  },
];

const planInfo: Record<PlanTier, { label: string; price: string; icon: typeof Zap }> = {
  starter: { label: "Starter", price: "99", icon: Zap },
  pro: { label: "Pro", price: "249", icon: TrendingUp },
  premium: { label: "Premium", price: "499", icon: Crown },
};

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  automation: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  kommunikation: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20" },
  ai: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
  verwaltung: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
  marketing: { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/20" },
  reporting: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function FeaturesPage() {
  const [activeCategory, setActiveCategory] = useState("alle");
  const [activePlan, setActivePlan] = useState<PlanTier | "alle">("alle");
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const filtered = features.filter((f) => {
    const catMatch = activeCategory === "alle" || f.category === activeCategory;
    const planMatch = activePlan === "alle" || f.plans.includes(activePlan);
    return catMatch && planMatch;
  });

  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" ref={ref}>
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="inline-block text-sm font-semibold text-accent bg-accent/10 rounded-full px-4 py-1.5 mb-4">
            Alle Features
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Alles was Ihre Fahrschule{" "}
            <span className="gradient-text">automatisiert.</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted">
            26 Features in 6 Kategorien. Filtern Sie nach Plan oder Kategorie
            um genau zu sehen, was in Ihrem Paket enthalten ist.
          </p>
        </motion.div>

        {/* Plan Filter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-wrap justify-center gap-3 mb-6"
        >
          <button
            onClick={() => setActivePlan("alle")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activePlan === "alle"
                ? "bg-primary text-white"
                : "bg-surface border border-border text-muted hover:text-foreground hover:border-primary/50"
            }`}
          >
            Alle Pläne
          </button>
          {(Object.entries(planInfo) as [PlanTier, typeof planInfo.starter][]).map(
            ([key, info]) => (
              <button
                key={key}
                onClick={() => setActivePlan(key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  activePlan === key
                    ? "bg-primary text-white"
                    : "bg-surface border border-border text-muted hover:text-foreground hover:border-primary/50"
                }`}
              >
                <info.icon className="h-3.5 w-3.5" />
                {info.label} ({info.price} EUR)
              </button>
            )
          )}
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-lg text-sm transition-all ${
                activeCategory === cat.id
                  ? "bg-surface-lighter text-foreground font-medium"
                  : "text-muted hover:text-foreground hover:bg-surface-light"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </motion.div>

        {/* Results count */}
        <p className="text-center text-sm text-muted mb-8">
          {filtered.length} {filtered.length === 1 ? "Feature" : "Features"} gefunden
        </p>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((feature, i) => {
            const colors = colorMap[feature.category];
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.5) }}
                className={`group rounded-2xl border ${colors.border} bg-surface p-6 hover:bg-surface-light transition-all duration-300`}
              >
                {/* Icon */}
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors.bg} mb-4 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className={`h-6 w-6 ${colors.text}`} />
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>

                {/* Description */}
                <p className="text-sm text-muted leading-relaxed mb-4">
                  {feature.description}
                </p>

                {/* Result */}
                <div className="flex items-center gap-2 text-sm font-medium text-accent mb-4">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {feature.result}
                </div>

                {/* Plan badges */}
                <div className="flex gap-1.5 flex-wrap">
                  {(["starter", "pro", "premium"] as PlanTier[]).map((plan) => {
                    const included = feature.plans.includes(plan);
                    return (
                      <span
                        key={plan}
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                          included
                            ? "bg-accent/10 text-accent"
                            : "bg-surface-lighter text-muted/50 line-through"
                        }`}
                      >
                        {included ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                        {planInfo[plan].label}
                      </span>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted text-lg">Keine Features in dieser Kombination.</p>
            <button
              onClick={() => {
                setActiveCategory("alle");
                setActivePlan("alle");
              }}
              className="mt-4 text-primary hover:underline text-sm"
            >
              Filter zurücksetzen
            </button>
          </div>
        )}

        {/* Plan Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-20"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">
            Pläne im <span className="gradient-text">Vergleich</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 text-muted font-medium w-1/2">Feature</th>
                  <th className="text-center py-4 px-4 font-semibold">
                    <div className="flex flex-col items-center gap-1">
                      <Zap className="h-4 w-4 text-blue-400" />
                      <span>Starter</span>
                      <span className="text-xs text-muted font-normal">99 EUR/Monat</span>
                    </div>
                  </th>
                  <th className="text-center py-4 px-4 font-semibold">
                    <div className="flex flex-col items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-accent" />
                      <span>Pro</span>
                      <span className="text-xs text-muted font-normal">249 EUR/Monat</span>
                    </div>
                  </th>
                  <th className="text-center py-4 px-4 font-semibold">
                    <div className="flex flex-col items-center gap-1">
                      <Crown className="h-4 w-4 text-yellow-400" />
                      <span>Premium</span>
                      <span className="text-xs text-muted font-normal">499 EUR/Monat</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature) => (
                  <tr
                    key={feature.title}
                    className="border-b border-border/50 hover:bg-surface-light/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-foreground">{feature.title}</td>
                    {(["starter", "pro", "premium"] as PlanTier[]).map((plan) => (
                      <td key={plan} className="text-center py-3 px-4">
                        {feature.plans.includes(plan) ? (
                          <CheckCircle2 className="h-5 w-5 text-accent mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-muted/30 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Bereit durchzustarten?
          </h2>
          <p className="text-muted mb-8 max-w-lg mx-auto">
            30 Tage kostenlos testen. Keine Einrichtungsgebühr. Monatlich kündbar.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://calendly.com/andrewarbohq/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white hover:bg-primary-dark transition-all hover:shadow-lg hover:shadow-primary/25"
            >
              Kostenlose Demo buchen
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href="/preise"
              className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
            >
              Preise ansehen
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
