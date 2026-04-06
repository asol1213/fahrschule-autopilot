"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { TrendingUp, Clock, Star, ArrowDown, ArrowUp, CheckCircle2, Quote, MapPin, Building2 } from "lucide-react";
import AnimatedCounter from "./AnimatedCounter";

const stats = [
  { icon: TrendingUp, value: 1400, prefix: "€", suffix: "+", label: "durchschnittlich gespart pro Monat", color: "text-emerald-400" },
  { icon: Building2, value: 30, prefix: "", suffix: "+", label: "Fahrschulen betreut", color: "text-blue-400" },
  { icon: Clock, value: 24, prefix: "<", suffix: "h", label: "Setup-Zeit bis alles läuft", color: "text-purple-400" },
  { icon: Star, value: 35, prefix: "", suffix: "%", label: "weniger No-Shows im Schnitt", color: "text-yellow-400" },
];

const testimonials = [
  {
    name: "Thomas M.",
    role: "Inhaber",
    location: "Bayern",
    text: "Seit wir das System nutzen, haben wir fast keine No-Shows mehr. Vorher waren es 4-5 pro Woche — jetzt vielleicht einer. Das allein spart uns über €800 im Monat.",
    metric: "85% weniger No-Shows",
    metricColor: "text-emerald-400 bg-emerald-400/10",
  },
  {
    name: "Sandra K.",
    role: "Geschäftsführerin",
    location: "Süddeutschland",
    text: "Wir hatten 15 Google-Bewertungen in 3 Jahren. Nach 2 Monaten mit Fahrschule Autopilot sind wir bei über 50. Die neuen Schüler kommen jetzt von alleine.",
    metric: "3x mehr Bewertungen",
    metricColor: "text-yellow-400 bg-yellow-400/10",
  },
  {
    name: "Markus H.",
    role: "Fahrschulinhaber",
    location: "Baden-Württemberg",
    text: "Meine Frau hat früher 8 Stunden pro Woche nur mit Büroarbeit verbracht. Jetzt sind es vielleicht 2. Die Zahlungserinnerungen allein haben sich sofort bezahlt gemacht.",
    metric: "75% weniger Büroarbeit",
    metricColor: "text-purple-400 bg-purple-400/10",
  },
];

const results = [
  {
    metric: "No-Show-Rate",
    before: "8–12%",
    after: "4–6%",
    icon: ArrowDown,
    change: "50% Reduktion",
    changeColor: "text-emerald-400 bg-emerald-400/10",
  },
  {
    metric: "Google-Bewertungen",
    before: "1–2 pro Monat",
    after: "15–20 pro Monat",
    icon: ArrowUp,
    change: "10x mehr",
    changeColor: "text-yellow-400 bg-yellow-400/10",
  },
  {
    metric: "Zahlungseingang",
    before: "30–60 Tage",
    after: "7–14 Tage",
    icon: ArrowDown,
    change: "4x schneller",
    changeColor: "text-blue-400 bg-blue-400/10",
  },
  {
    metric: "Büroarbeit/Woche",
    before: "8–12 Stunden",
    after: "2–3 Stunden",
    icon: ArrowDown,
    change: "75% weniger",
    changeColor: "text-purple-400 bg-purple-400/10",
  },
];

export default function Testimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 sm:py-32 relative" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface/50 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="text-center p-6 rounded-2xl border border-border bg-surface"
            >
              <stat.icon className={`h-6 w-6 ${stat.color} mx-auto mb-3`} />
              <div className="text-2xl sm:text-3xl font-bold gradient-text mb-1">
                <AnimatedCounter target={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
              </div>
              <p className="text-xs sm:text-sm text-muted">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mb-12"
        >
          <span className="inline-block text-sm font-semibold text-primary-light bg-primary/10 rounded-full px-4 py-1.5 mb-4">
            Kundenstimmen
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold">
            Was Fahrschulen sagen
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
              className="rounded-2xl border border-border bg-surface p-6 hover:border-primary/30 transition-colors relative"
            >
              <Quote className="h-8 w-8 text-primary/20 mb-4" />
              <p className="text-sm text-muted leading-relaxed mb-6">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted flex items-center gap-1">
                    {t.role} <MapPin className="h-3 w-3" /> {t.location}
                  </p>
                </div>
                <span className={`text-xs font-semibold rounded-full px-3 py-1 ${t.metricColor}`}>
                  {t.metric}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Results Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mb-12"
        >
          <span className="inline-block text-sm font-semibold text-accent bg-accent/10 rounded-full px-4 py-1.5 mb-4">
            Messbare Ergebnisse
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold">
            Vorher vs. Nachher
          </h2>
          <p className="mx-auto max-w-xl text-muted mt-3">
            Durchschnittliche Ergebnisse unserer Kunden.
          </p>
        </motion.div>

        {/* Before/After Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {results.map((r, i) => (
            <motion.div
              key={r.metric}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
              className="rounded-2xl border border-border bg-surface p-6 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{r.metric}</h3>
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1 ${r.changeColor}`}>
                  <r.icon className="h-3 w-3" />
                  {r.change}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 rounded-xl bg-red-500/5 border border-red-500/10 p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-red-400/60 mb-1">Vorher</p>
                  <p className="text-sm font-semibold text-red-400">{r.before}</p>
                </div>
                <div className="shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1 rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-emerald-400/60 mb-1">Nachher</p>
                  <p className="text-sm font-semibold text-emerald-400">{r.after}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Fallstudien / Rechenbeispiele */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mt-24 mb-12"
        >
          <span className="inline-block text-sm font-semibold text-blue-400 bg-blue-400/10 rounded-full px-4 py-1.5 mb-4">
            Rechenbeispiele
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold">
            So rechnet sich Fahrschule Autopilot
          </h2>
          <p className="mx-auto max-w-xl text-muted mt-3">
            3 typische Fahrschulen — reale Zahlen, konservativ gerechnet.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              title: "Kleine Fahrschule",
              subtitle: "1 Fahrlehrer, Starter-Plan (€99/Mo)",
              color: "emerald",
              items: [
                { label: "No-Shows vermieden", detail: "2/Woche × €50", value: "+€400/Mo" },
                { label: "Neue Bewertungen", detail: "10+/Monat → mehr Sichtbarkeit", value: "+€200/Mo" },
                { label: "Zeit gespart", detail: "Keine manuellen Erinnerungen", value: "~10h/Mo" },
              ],
              total: "€600/Mo Ersparnis",
              roi: "6x ROI",
              investment: "€99/Mo Investment",
            },
            {
              title: "Mittlere Fahrschule",
              subtitle: "3 Fahrlehrer, Pro-Plan (€249/Mo)",
              color: "blue",
              items: [
                { label: "No-Shows vermieden", detail: "5/Woche × €55", value: "+€1.100/Mo" },
                { label: "Schnellere Zahlungen", detail: "€3.000 früher im Monat", value: "+€200/Mo" },
                { label: "Chatbot + Bewertungen", detail: "3 Neukunden/Monat extra", value: "+€300/Mo" },
                { label: "Zeit gespart", detail: "Büroarbeit halbiert", value: "~25h/Mo" },
              ],
              total: "€1.600/Mo Ersparnis",
              roi: "6.5x ROI",
              investment: "€249/Mo Investment",
            },
            {
              title: "Große Fahrschule",
              subtitle: "6+ Fahrlehrer, Premium-Plan (€499/Mo)",
              color: "purple",
              items: [
                { label: "No-Shows vermieden", detail: "10/Woche × €55", value: "+€2.200/Mo" },
                { label: "AI-Telefon", detail: "Keine verpassten Anrufe", value: "+€500/Mo" },
                { label: "Website + SEO", detail: "5 Neukunden/Monat extra", value: "+€500/Mo" },
                { label: "Zeit gespart", detail: "Fast keine Büroarbeit mehr", value: "~40h/Mo" },
              ],
              total: "€3.200/Mo Ersparnis",
              roi: "9x ROI",
              investment: "€499/Mo Investment",
            },
          ].map((study, i) => (
            <motion.div
              key={study.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.6 + i * 0.15 }}
              className="rounded-2xl border border-border bg-surface p-6 hover:border-primary/30 transition-colors"
            >
              <h3 className="font-bold text-lg mb-1">{study.title}</h3>
              <p className="text-xs text-muted mb-5">{study.subtitle}</p>

              <div className="space-y-3 mb-6">
                {study.items.map((item) => (
                  <div key={item.label} className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted">{item.detail}</p>
                    </div>
                    <span className={`text-sm font-bold shrink-0 ${
                      item.value.startsWith("+") ? "text-emerald-400" : "text-purple-400"
                    }`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted">{study.investment}</span>
                  <span className="text-sm font-bold text-emerald-400">{study.total}</span>
                </div>
                <div className="flex items-center justify-center mt-3">
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold rounded-full px-4 py-1.5 bg-primary/10 text-primary-light">
                    <TrendingUp className="h-4 w-4" />
                    {study.roi}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
