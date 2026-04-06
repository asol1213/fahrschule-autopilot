"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Phone,
  PhoneCall,
  Clock,
  MessageSquare,
  UserCheck,
  ArrowRight,
  Sparkles,
  Volume2,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    icon: PhoneCall,
    title: "24/7 erreichbar",
    desc: "Kein Anruf geht mehr verloren — auch um 22 Uhr oder am Wochenende.",
  },
  {
    icon: MessageSquare,
    title: "Beantwortet Fragen",
    desc: "Preise, Öffnungszeiten, Anmeldung, Führerscheinklassen — sofort.",
  },
  {
    icon: Clock,
    title: "Bucht Termine",
    desc: "Nimmt Daten auf und leitet sie direkt an den zuständigen Fahrlehrer weiter.",
  },
  {
    icon: UserCheck,
    title: "Transfer an Mensch",
    desc: "Versteht die AI etwas nicht? Sofortige Weiterleitung an einen Kollegen.",
  },
];

const conversationSteps = [
  { speaker: "ai", text: "Guten Tag, Fahrschule Müller, mein Name ist Marie. Wie kann ich Ihnen helfen?" },
  { speaker: "caller", text: "Hallo, ich würde gerne den Führerschein Klasse B machen. Was kostet das bei Ihnen?" },
  { speaker: "ai", text: "Sehr gerne! Die Grundgebühr liegt bei 350€, eine Fahrstunde bei 55€. Insgesamt rechnen die meisten mit 2.800 bis 3.500€." },
  { speaker: "caller", text: "Okay, und wie melde ich mich an?" },
  { speaker: "ai", text: "Sie können sich direkt online anmelden — dauert nur 3 Minuten. Oder ich nehme Ihre Daten jetzt auf. Haben Sie schon einen Sehtest und Erste-Hilfe-Kurs?" },
  { speaker: "caller", text: "Sehtest ja, Erste-Hilfe mache ich nächste Woche." },
  { speaker: "ai", text: "Perfekt! Darf ich Ihren Namen und Ihre Nummer notieren? Dann meldet sich Herr Schneider bei Ihnen für einen Beratungstermin." },
  { speaker: "caller", text: "Ja klar, Max Weber, 0176 12345678." },
  { speaker: "ai", text: "Danke, Herr Weber! Sie hören innerhalb von 24 Stunden von uns. Kann ich sonst noch helfen?" },
];

export default function PhoneAssistantSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} id="telefon-assistent" className="py-20 sm:py-28 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/5 px-4 py-1.5 text-xs font-medium text-purple-400 mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            NEU — AI Telefon-Assistent
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Ihr Telefon wird{" "}
            <span className="bg-gradient-to-r from-purple-400 to-primary bg-clip-text text-transparent">
              intelligent
            </span>
          </h2>
          <p className="text-muted text-base sm:text-lg max-w-2xl mx-auto">
            Eine AI-Stimme, die wie ein echter Mitarbeiter klingt — beantwortet
            Fragen, bucht Termine und leitet weiter, wenn sie nicht weiterkommt.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          {/* Left: Features */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="space-y-4 mb-8">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                  className="flex gap-4 p-4 rounded-xl border border-border bg-surface/50 hover:bg-surface-light transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                    <feature.icon className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-0.5">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-muted leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "24/7", label: "Erreichbar" },
                { value: "<1s", label: "Antwortzeit" },
                { value: "~€0.50", label: "Pro Anruf" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="text-center p-3 rounded-xl border border-border bg-surface/50"
                >
                  <div className="text-lg font-bold text-purple-400">
                    {stat.value}
                  </div>
                  <div className="text-[10px] text-muted mt-0.5">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: Conversation mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="rounded-2xl border border-purple-500/20 bg-surface overflow-hidden shadow-2xl shadow-purple-500/5">
              {/* Phone header */}
              <div className="bg-gradient-to-r from-purple-500/20 to-primary/20 px-5 py-3 flex items-center justify-between border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Phone className="h-4 w-4 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">AI-Assistent</div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-[10px] text-green-400">
                        Aktiver Anruf · 01:24
                      </span>
                    </div>
                  </div>
                </div>
                <Volume2 className="h-4 w-4 text-muted" />
              </div>

              {/* Conversation */}
              <div className="px-4 py-5 space-y-3 max-h-[380px] overflow-y-auto">
                {conversationSteps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.3, delay: 0.5 + i * 0.15 }}
                    className={`flex ${step.speaker === "caller" ? "justify-end" : ""}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        step.speaker === "ai"
                          ? "bg-purple-500/10 border border-purple-500/20 text-foreground rounded-bl-md"
                          : "bg-surface-lighter border border-border text-muted rounded-br-md"
                      }`}
                    >
                      {step.speaker === "ai" && (
                        <span className="text-[10px] text-purple-400 font-medium block mb-0.5">
                          AI-Assistent
                        </span>
                      )}
                      {step.text}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-border bg-surface-light/50">
                <div className="flex items-center justify-center gap-3">
                  {[
                    "Preise beantwortet ✓",
                    "Kontakt erfasst ✓",
                    "Termin eingeleitet ✓",
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] text-accent flex items-center gap-1"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {tag.replace(" ✓", "")}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center mt-14"
        >
          <p className="text-sm text-muted mb-4">
            Als Addon buchbar (+€149/Monat zu jedem Plan)
          </p>
          <a
            href="https://calendly.com/andrewarbohq/30min"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-primary px-6 py-3 text-sm font-semibold text-white hover:shadow-lg hover:shadow-purple-500/25 transition-all"
          >
            Demo-Anruf anhören
            <ArrowRight className="h-4 w-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
