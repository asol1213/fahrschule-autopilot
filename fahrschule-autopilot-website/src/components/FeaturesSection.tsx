"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Bell,
  Star,
  CreditCard,
  MessageCircle,
  Users,
  BarChart3,
  Repeat,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    icon: Bell,
    title: "Termin-Erinnerungen",
    description:
      "Automatische WhatsApp-Erinnerungen 24h und 2h vor jeder Fahrstunde. Bei Absagen wird sofort der nächste Schüler von der Warteliste kontaktiert.",
    result: "25–40% weniger No-Shows",
    color: "blue",
  },
  {
    icon: Star,
    title: "Google-Bewertungen",
    description:
      "Nach jeder bestandenen Prüfung wird automatisch eine freundliche Bewertungsanfrage gesendet. 5 Sterne → Google. Weniger → internes Feedback.",
    result: "15–20 neue Bewertungen/Monat",
    color: "yellow",
  },
  {
    icon: CreditCard,
    title: "Zahlungserinnerungen",
    description:
      "Automatische, freundliche Zahlungserinnerungen nach 3, 7 und 14 Tagen. Eskalation nur wenn nötig. Ohne peinliche Anrufe.",
    result: "30–50% schnellere Zahlungen",
    color: "green",
  },
  {
    icon: MessageCircle,
    title: "AI-Chatbot",
    description:
      "Beantwortet häufige Fragen auf Ihrer Website rund um die Uhr: Preise, Ablauf, Anmeldung, Führerscheinklassen. Leitet warme Leads direkt weiter.",
    result: "24/7 Erreichbarkeit",
    color: "purple",
  },
  {
    icon: Users,
    title: "Schüler-Onboarding",
    description:
      "Neue Schüler bekommen automatisch alle Infos, Verträge und nächste Schritte per WhatsApp. Kein manuelles Zusammensuchen mehr.",
    result: "80% weniger Büroarbeit",
    color: "cyan",
  },
  {
    icon: Repeat,
    title: "Empfehlungssystem",
    description:
      "Nach bestandener Prüfung werden Schüler automatisch gebeten, Freunde zu empfehlen. Mit Tracking und optionalen Anreizen.",
    result: "2–5 Empfehlungen/Monat",
    color: "pink",
  },
  {
    icon: BarChart3,
    title: "Reporting & Dashboard",
    description:
      "Übersicht über alle Automationen: Wie viele No-Shows verhindert, Bewertungen generiert, Zahlungen eingegangen. Jeden Monat als Report.",
    result: "Volle Transparenz",
    color: "orange",
  },
];

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: "bg-blue-500/10", text: "text-blue-400", border: "hover:border-blue-500/30" },
  yellow: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "hover:border-yellow-500/30" },
  green: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "hover:border-emerald-500/30" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-400", border: "hover:border-purple-500/30" },
  cyan: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "hover:border-cyan-500/30" },
  pink: { bg: "bg-pink-500/10", text: "text-pink-400", border: "hover:border-pink-500/30" },
  orange: { bg: "bg-orange-500/10", text: "text-orange-400", border: "hover:border-orange-500/30" },
};

export default function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features" className="py-24 sm:py-32 relative" ref={ref}>
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface/50 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-sm font-semibold text-accent bg-accent/10 rounded-full px-4 py-1.5 mb-4">
            Die Lösung
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            7 Automationen.{" "}
            <span className="gradient-text">Ein System.</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted">
            Alles läuft im Hintergrund. Sie müssen nichts ändern, nichts installieren,
            nichts lernen. Wir bauen es um Ihre bestehende Software herum.
          </p>
        </motion.div>

        {/* Feature Cards — Top 6 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.slice(0, 6).map((feature, i) => {
            const colors = colorMap[feature.color];
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className={`group rounded-2xl border border-border bg-surface p-6 ${colors.border} hover:bg-surface-light transition-all duration-300`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors.bg} mb-4 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className={`h-6 w-6 ${colors.text}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted leading-relaxed mb-4">
                  {feature.description}
                </p>
                <div className="flex items-center gap-2 text-sm font-medium text-accent">
                  <CheckCircle2 className="h-4 w-4" />
                  {feature.result}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* 7th Feature — Full width */}
        {(() => {
          const feature = features[6];
          const colors = colorMap[feature.color];
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.5 }}
              className={`mt-6 mx-auto max-w-2xl group rounded-2xl border border-border bg-surface p-6 ${colors.border} hover:bg-surface-light transition-all duration-300`}
            >
              <div className="flex items-start gap-5">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${colors.bg} group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className={`h-6 w-6 ${colors.text}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted leading-relaxed mb-3">
                    {feature.description}
                  </p>
                  <div className="flex items-center gap-2 text-sm font-medium text-accent">
                    <CheckCircle2 className="h-4 w-4" />
                    {feature.result}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })()}

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center text-sm text-muted mt-10"
        >
          Alle Automationen funktionieren mit Ihrer bestehenden Software — AUTOVIO, Fahrschulcockpit, ClickClickDrive oder Excel.
        </motion.p>
      </div>
    </section>
  );
}
