"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play, Shield, Star, Clock } from "lucide-react";
import AnimatedCounter from "./AnimatedCounter";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden hero-gradient">
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 grid-pattern opacity-40" aria-hidden="true" />

      {/* Animated orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" aria-hidden="true" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl animate-pulse delay-1000" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary-light mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            Speziell für deutsche Fahrschulen entwickelt
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
          >
            Keine Schüler, kein Geld
            <br />
            und keine Bewertungen
            <br />
            <span className="gradient-text">mehr verlieren.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto max-w-2xl text-lg sm:text-xl text-muted leading-relaxed mb-10"
          >
            Fahrschule Autopilot automatisiert Erinnerungen, Bewertungen, Zahlungen
            und mehr — im Hintergrund, ohne dass Sie etwas tun müssen.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <a
              href="https://calendly.com/andrewarbohq/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-white hover:bg-primary-dark transition-all hover:shadow-xl hover:shadow-primary/25 hover:scale-105"
            >
              Kostenlose Demo buchen
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#so-funktionierts"
              className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-4 text-base font-medium text-muted hover:text-foreground hover:border-muted transition-all"
            >
              <Play className="h-4 w-4" />
              So funktioniert&apos;s
            </a>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-sm text-muted"
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" />
              <span>Setup in unter 24 Stunden</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-accent" />
              <span>DSGVO-konform</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-accent" />
              <span>Keine neue Software nötig</span>
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
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 sm:gap-0 sm:divide-x divide-border">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold gradient-text">
                    <AnimatedCounter target={1400} prefix="€" suffix="+" />
                  </div>
                  <div className="text-sm text-muted mt-1">
                    durchschnittlich gespart / Monat
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold gradient-text">
                    <AnimatedCounter target={27} suffix="h" />
                  </div>
                  <div className="text-sm text-muted mt-1">
                    Zeit gespart / Monat
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold gradient-text">
                    <AnimatedCounter target={35} suffix="%" />
                  </div>
                  <div className="text-sm text-muted mt-1">
                    weniger No-Shows
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold gradient-text">
                    <AnimatedCounter target={20} prefix="15–" />
                  </div>
                  <div className="text-sm text-muted mt-1">
                    neue Bewertungen / Monat
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
