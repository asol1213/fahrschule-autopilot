"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Phone, Settings, Rocket } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Phone,
    title: "Kostenloses Gespräch",
    description:
      "In 10 Minuten zeigen wir Ihnen live, wie das System funktioniert. Kein Verkaufsgespräch — nur eine Demo mit Ihren echten Zahlen.",
  },
  {
    number: "02",
    icon: Settings,
    title: "Wir richten alles ein",
    description:
      "Innerhalb von 24 Stunden ist alles konfiguriert. WhatsApp, Bewertungen, Zahlungen — alles verbunden und getestet. Sie müssen nichts tun.",
  },
  {
    number: "03",
    icon: Rocket,
    title: "Es läuft. Automatisch.",
    description:
      "Ab jetzt laufen alle Automationen im Hintergrund. Sie sehen die Ergebnisse in Ihrem monatlichen Report. Mehr Geld, weniger Arbeit.",
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="so-funktionierts" className="py-24 sm:py-32 relative" ref={ref}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <span className="inline-block text-sm font-semibold text-primary-light bg-primary/10 rounded-full px-4 py-1.5 mb-4">
            3 einfache Schritte
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            So funktioniert&apos;s
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted">
            Von null auf Autopilot in unter 24 Stunden. Kein Technik-Wissen nötig.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[60%] h-px bg-gradient-to-r from-transparent via-border to-transparent hidden lg:block" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.2 }}
                className="relative text-center"
              >
                {/* Number badge */}
                <div className="relative inline-flex mb-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-surface border border-border glow-blue">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                  <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                    {step.number}
                  </span>
                </div>

                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted leading-relaxed max-w-sm mx-auto">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
