"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { AlertTriangle, PhoneOff, Star, CreditCard, Clock, MessageSquareOff } from "lucide-react";

const topProblems = [
  {
    icon: PhoneOff,
    title: "3–5 No-Shows pro Woche",
    description: "Schüler erscheinen nicht oder sagen kurzfristig ab. Das kostet Sie €600–1.400 jeden Monat — Geld, das einfach verschwindet.",
    cost: "€600–1.400/Monat Verlust",
    stat: "€1.400",
    statLabel: "maximaler Verlust/Monat",
  },
  {
    icon: Star,
    title: "Kaum Google-Bewertungen",
    description: "Zufriedene Schüler vergessen zu bewerten. Neue Interessenten wählen die Konkurrenz mit mehr Sternen — und Sie verlieren Neukunden, ohne es zu merken.",
    cost: "5–10 verlorene Neukunden/Monat",
    stat: "12",
    statLabel: "Bewertungen statt 80+",
  },
  {
    icon: CreditCard,
    title: "Offene Rechnungen",
    description: "Schüler zahlen verspätet oder gar nicht. Sie verbringen Stunden mit Nachfassen und peinlichen Erinnerungs-Anrufen.",
    cost: "€500–2.000 ausstehend",
    stat: "€2.000",
    statLabel: "durchschnittlich ausstehend",
  },
];

const otherProblems = [
  {
    icon: Clock,
    title: "Stunden im Büro statt im Auto",
    description: "WhatsApp, Anrufe, Terminplanung — alles manuell. 5–10h/Woche für Verwaltung.",
    cost: "5–10h/Woche verschwendet",
  },
  {
    icon: MessageSquareOff,
    title: "Keine Nachbetreuung",
    description: "Nach der Prüfung verlieren Sie den Kontakt. Keine Empfehlungen, keine Weiterempfehlung.",
    cost: "Hunderte verpasste Empfehlungen",
  },
  {
    icon: AlertTriangle,
    title: "Führerscheinreform-Krise",
    description: "Bis zu 70% weniger Anmeldungen. Jeder einzelne Schüler zählt jetzt doppelt.",
    cost: "Existenzbedrohend",
  },
];

export default function ProblemSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="problem" className="py-24 sm:py-32 relative" ref={ref}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-sm font-semibold text-red-400 bg-red-400/10 rounded-full px-4 py-1.5 mb-4">
            Das Problem
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Kennen Sie das?
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted">
            Deutsche Fahrschulen verlieren jeden Monat tausende Euro durch vermeidbare Probleme.
            Die meisten wissen nicht einmal, wie viel.
          </p>
        </motion.div>

        {/* Top 3 — Featured Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {topProblems.map((problem, i) => (
            <motion.div
              key={problem.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="group relative rounded-2xl border border-red-500/20 bg-gradient-to-b from-red-500/[0.06] to-surface p-6 hover:border-red-500/40 transition-all duration-300"
            >
              {/* Stat highlight */}
              <div className="absolute top-5 right-5 text-right">
                <div className="text-2xl font-bold text-red-400">{problem.stat}</div>
                <div className="text-[11px] text-red-400/60">{problem.statLabel}</div>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 mb-4 group-hover:bg-red-500/20 transition-colors">
                <problem.icon className="h-6 w-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{problem.title}</h3>
              <p className="text-sm text-muted leading-relaxed mb-4">
                {problem.description}
              </p>
              <div className="inline-flex items-center gap-1.5 text-sm font-medium text-red-400 bg-red-400/10 rounded-full px-3 py-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                {problem.cost}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Other 3 — Smaller Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {otherProblems.map((problem, i) => (
            <motion.div
              key={problem.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
              className="group rounded-xl border border-border bg-surface p-5 hover:border-red-500/20 hover:bg-surface-light transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                  <problem.icon className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-1">{problem.title}</h3>
                  <p className="text-xs text-muted leading-relaxed">{problem.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
