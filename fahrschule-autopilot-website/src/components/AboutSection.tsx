"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
import { ArrowRight, Mail } from "lucide-react";

export default function AboutSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="ueber-mich" className="py-24 sm:py-32 relative" ref={ref}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Photo side */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="flex justify-center lg:justify-end"
          >
            <div className="relative">
              <div className="w-[340px] sm:w-[460px] rounded-2xl overflow-hidden border-2 border-border shadow-2xl shadow-black/30">
                <Image
                  src="/andrew-portrait.jpeg"
                  alt="Andrew Arbo — Gründer von Fahrschule Autopilot"
                  width={1880}
                  height={1408}
                  quality={100}
                  unoptimized
                  className="w-full h-auto"
                  priority
                />
              </div>
              {/* Decorative elements */}
              <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-2xl bg-primary/10 border border-primary/20 -z-10" />
              <div className="absolute -top-4 -left-4 w-20 h-20 rounded-2xl bg-accent/10 border border-accent/20 -z-10" />
            </div>
          </motion.div>

          {/* Text side */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <span className="inline-block text-sm font-semibold text-primary-light bg-primary/10 rounded-full px-4 py-1.5 mb-4">
              Ihr Ansprechpartner
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-2">
              Andrew Arbo
            </h2>
            <p className="text-muted text-lg mb-6">
              Gründer, Fahrschule Autopilot
            </p>

            <div className="space-y-4 text-muted leading-relaxed mb-8">
              <p>
                Ich habe Fahrschule Autopilot gegründet, weil ich gesehen habe, wie viel Zeit
                und Geld Fahrschulen durch manuelle Prozesse verlieren — und wie einfach sich
                das mit intelligenter Automation lösen lässt.
              </p>
              <p>
                Mein Hintergrund liegt in AI und Software-Automation. Ich baue jedes System
                persönlich für Sie auf und bin Ihr direkter Ansprechpartner — kein Callcenter,
                kein Ticket-System. Sie rufen an, ich gehe ran.
              </p>
              <p className="font-medium text-foreground">
                Mein Versprechen: Wenn Sie nach 30 Tagen keine messbaren Ergebnisse sehen,
                bekommen Sie Ihr Geld zurück. Ohne Wenn und Aber.
              </p>
            </div>

            {/* CTA */}
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="https://calendly.com/andrewarbohq/30min"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark transition-all hover:shadow-lg hover:shadow-primary/25"
              >
                Persönliches Gespräch buchen
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="mailto:andrew@fahrschulautopilot.de"
                className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm text-muted hover:text-foreground hover:border-muted transition-all"
              >
                <Mail className="h-4 w-4" />
                E-Mail
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
