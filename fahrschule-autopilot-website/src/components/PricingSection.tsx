"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Check, Zap, Crown, ArrowRight, TrendingUp, Clock, Phone } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "99",
    description: "Für Fahrschulen die sofort Ergebnisse sehen wollen.",
    popular: false,
    savings: "~€800",
    savingsLabel: "Ersparnis/Monat",
    timeSaved: "~10h",
    timeSavedLabel: "Zeit gespart/Monat",
    features: [
      "Automatische Termin-Erinnerungen",
      "Google-Bewertungen Automation",
      "Basis-Reporting (monatlich)",
      "WhatsApp-Integration",
      "E-Mail Support",
    ],
    cta: "Starter wählen",
  },
  {
    name: "Pro",
    price: "249",
    description: "Das Komplettpaket. Alles automatisiert.",
    popular: true,
    savings: "~€1.500",
    savingsLabel: "Ersparnis/Monat",
    timeSaved: "~25h",
    timeSavedLabel: "Zeit gespart/Monat",
    features: [
      "Alles aus Starter",
      "Zahlungserinnerungen",
      "AI-Chatbot für Ihre Website",
      "Schüler-Onboarding Automation",
      "Empfehlungssystem",
      "Wartelisten-Management",
      "Wöchentliches Reporting",
      "Priority Support",
    ],
    cta: "Pro wählen",
  },
  {
    name: "Premium",
    price: "499",
    description: "Für Fahrschulen die den vollen Vorsprung wollen.",
    popular: false,
    savings: "~€2.200",
    savingsLabel: "Ersparnis/Monat",
    timeSaved: "~35h",
    timeSavedLabel: "Zeit gespart/Monat",
    features: [
      "Alles aus Pro",
      "AI Telefon-Assistent (24/7)",
      "Professionelle Website mit SEO",
      "CRM & Schüler-Datenbank",
      "KI-Blog-Erstellung",
      "Terminbuchung online",
      "Dedizierter Ansprechpartner",
      "24/7 Support",
    ],
    cta: "Premium wählen",
  },
];

export default function PricingSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="preise" className="py-24 sm:py-32 relative" ref={ref}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-sm font-semibold text-primary-light bg-primary/10 rounded-full px-4 py-1.5 mb-4">
            Transparente Preise
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Investition die sich{" "}
            <span className="gradient-text">ab Tag 1</span> rechnet
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted">
            Keine Einrichtungsgebühr. Keine Vertragsbindung. Monatlich kündbar.
            Sie zahlen nur, solange Sie Ergebnisse sehen.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mx-auto max-w-5xl">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className={`relative rounded-2xl p-8 transition-all duration-300 ${
                plan.popular
                  ? "border-2 border-primary bg-surface glow-blue scale-[1.02] lg:scale-105"
                  : "border border-border bg-surface hover:border-muted"
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-primary/25">
                    <Crown className="h-3.5 w-3.5" />
                    Am beliebtesten
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                <p className="text-sm text-muted">{plan.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">€{plan.price}</span>
                  <span className="text-muted">/Monat</span>
                </div>
              </div>

              {/* Savings & Time */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-3 text-center">
                  <TrendingUp className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-emerald-400">{plan.savings}</p>
                  <p className="text-[10px] text-emerald-400/60 uppercase tracking-wider">{plan.savingsLabel}</p>
                </div>
                <div className="rounded-xl bg-purple-500/5 border border-purple-500/10 p-3 text-center">
                  <Clock className="h-4 w-4 text-purple-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-purple-400">{plan.timeSaved}</p>
                  <p className="text-[10px] text-purple-400/60 uppercase tracking-wider">{plan.timeSavedLabel}</p>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check
                      className={`h-5 w-5 shrink-0 ${
                        plan.popular ? "text-primary" : "text-accent"
                      }`}
                    />
                    <span className="text-muted">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href="https://calendly.com/andrewarbohq/30min" target="_blank" rel="noopener noreferrer"
                className={`group flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold transition-all ${
                  plan.popular
                    ? "bg-primary text-white hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/25"
                    : "border border-border text-foreground hover:bg-surface-light hover:border-muted"
                }`}
              >
                {plan.cta}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </motion.div>
          ))}
        </div>

        {/* Addon: AI-Telefon Assistent */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mx-auto max-w-5xl mt-10"
        >
          <div className="relative rounded-2xl border border-primary/30 bg-surface p-6 sm:p-8 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                <Phone className="h-7 w-7 text-primary-light" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold">AI-Telefon Assistent</h3>
                  <span className="text-xs font-medium text-accent bg-accent/10 rounded-full px-3 py-1">Addon</span>
                </div>
                <p className="text-sm text-muted mb-3">
                  Zu jedem Paket hinzubuchbar. Ihr eigener KI-Assistent der 24/7 Anrufe beantwortet, Termine bucht und FAQ bearbeitet.
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
                  <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-accent" />24/7 Anrufannahme auf Deutsch</span>
                  <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-accent" />Terminbuchung im Gespräch</span>
                  <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-accent" />DSGVO-konform</span>
                  <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-accent" />Kostenlose Einrichtung</span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-2xl font-bold">+€149</span>
                  <span className="text-sm text-muted">/Monat</span>
                </div>
                <p className="text-xs text-emerald-400 mb-3">Spart ~€500–1.000/Mo Personalkosten</p>
                <a
                  href="https://calendly.com/andrewarbohq/30min"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 rounded-full border border-primary/40 px-5 py-2 text-sm font-semibold text-primary-light hover:bg-primary/10 transition-all"
                >
                  Addon anfragen
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Guarantee */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mt-12"
        >
          <div className="inline-flex items-center gap-2 text-sm text-muted">
            <Zap className="h-4 w-4 text-accent" />
            Kein Risiko — wenn Sie nach 30 Tagen keine Ergebnisse sehen, bekommen Sie Ihr Geld zurück.
          </div>
        </motion.div>
      </div>
    </section>
  );
}
