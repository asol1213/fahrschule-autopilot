"use client";

import { motion } from "framer-motion";
import { ArrowRight, Phone, Clock, TrendingDown, Star, Zap } from "lucide-react";
import type { DemoConfig } from "@/data/demos";

const planColors: Record<string, { bg: string; text: string; border: string; shadow: string; badge: string }> = {
  starter: {
    bg: "bg-blue-500",
    text: "text-blue-400",
    border: "border-blue-500/30",
    shadow: "hover:shadow-blue-500/25",
    badge: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  },
  pro: {
    bg: "bg-emerald-500",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    shadow: "hover:shadow-emerald-500/25",
    badge: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  },
  premium: {
    bg: "bg-purple-500",
    text: "text-purple-400",
    border: "border-purple-500/30",
    shadow: "hover:shadow-purple-500/25",
    badge: "bg-purple-500/10 border-purple-500/20 text-purple-400",
  },
};

export default function DemoHero({ config }: { config: DemoConfig }) {
  const colors = planColors[config.slug] ?? planColors.starter;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden hero-gradient">
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 grid-pattern opacity-40" />

      {/* Animated orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="text-center">
          {/* Plan Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium mb-8 ${colors.badge}`}
          >
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors.bg} opacity-75`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${colors.bg}`} />
            </span>
            {config.plan}-Paket &mdash; {config.preis}/Monat
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
          >
            Willkommen bei
            <br />
            <span className="gradient-text">{config.fahrschulName}</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto max-w-2xl text-lg sm:text-xl text-muted leading-relaxed mb-10"
          >
            Ihre Fahrschule in {config.stadt} &mdash; automatisiert mit Fahrschule Autopilot
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <a
              href="#kontakt"
              className={`group inline-flex items-center gap-2 rounded-full ${colors.bg} px-8 py-4 text-base font-semibold text-white transition-all hover:shadow-xl ${colors.shadow} hover:scale-105`}
            >
              Jetzt Fahrstunde buchen
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#kontakt"
              className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-4 text-base font-medium text-muted hover:text-foreground hover:border-muted transition-all"
            >
              <Phone className="h-4 w-4" />
              Kontakt aufnehmen
            </a>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-sm text-muted"
          >
            <div className="flex items-center gap-2">
              <Zap className={`h-4 w-4 ${colors.text}`} />
              <span>{config.ersparnis}/Monat gespart</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className={`h-4 w-4 ${colors.text}`} />
              <span>{config.zeitErsparnis}/Monat Zeitersparnis</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className={`h-4 w-4 ${colors.text}`} />
              <span>Setup in 24h</span>
            </div>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-20 mx-auto max-w-3xl"
          >
            <div className="glass rounded-2xl p-6 sm:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-0 sm:divide-x divide-border">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <TrendingDown className={`h-5 w-5 ${colors.text}`} />
                    <span className="text-2xl sm:text-3xl font-bold gradient-text">35%</span>
                  </div>
                  <div className="text-sm text-muted">Weniger No-Shows</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Star className={`h-5 w-5 ${colors.text}`} />
                    <span className="text-2xl sm:text-3xl font-bold gradient-text">15–20/Mo</span>
                  </div>
                  <div className="text-sm text-muted">Neue Bewertungen</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Zap className={`h-5 w-5 ${colors.text}`} />
                    <span className="text-2xl sm:text-3xl font-bold gradient-text">30–50%</span>
                  </div>
                  <div className="text-sm text-muted">Schnellere Zahlung</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
