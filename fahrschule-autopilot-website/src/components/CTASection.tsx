"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Calendar, MessageCircle } from "lucide-react";

export default function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="demo" className="py-24 sm:py-32 relative overflow-hidden" ref={ref}>
      {/* Background effects */}
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            Bereit, keine Schüler
            <br />
            <span className="gradient-text">mehr zu verlieren?</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted mb-10">
            In 10 Minuten zeigen wir Ihnen mit Ihren eigenen Zahlen,
            wie viel Sie jeden Monat sparen. Kein Verkaufsgespräch — nur Fakten.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <a
              href="https://calendly.com/andrewarbohq/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 rounded-full bg-primary px-8 py-4 text-base font-semibold text-white hover:bg-primary-dark transition-all hover:shadow-xl hover:shadow-primary/25 hover:scale-105"
            >
              <Calendar className="h-5 w-5" />
              Kostenlose Demo buchen
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="https://wa.me/491714774026?text=Hallo%2C%20ich%20interessiere%20mich%20f%C3%BCr%20Fahrschule%20Autopilot."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-4 text-base font-medium text-muted hover:text-foreground hover:border-muted transition-all"
            >
              <MessageCircle className="h-5 w-5" />
              Per WhatsApp schreiben
            </a>
          </div>

          <p className="text-sm text-muted">
            Kein Spam, kein Druck, keine Verpflichtung. Nur ein ehrliches Gespräch.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
