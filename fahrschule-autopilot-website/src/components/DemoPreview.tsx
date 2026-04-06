"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Smartphone, Bell, Star, CreditCard } from "lucide-react";

const messages = [
  {
    time: "09:00",
    sender: "Autopilot",
    text: "Hallo Max! Erinnerung: Morgen um 14:00 Uhr hast du deine Fahrstunde mit Herrn Müller. Bitte 5 Min vorher da sein. Musst du absagen? Antworte mit ABSAGE.",
    type: "reminder" as const,
  },
  {
    time: "09:01",
    sender: "Max",
    text: "Danke, bin da!",
    type: "reply" as const,
  },
  {
    time: "14:45",
    sender: "Autopilot",
    text: "Super gemacht heute, Max! Du hast deine praktische Prüfung bestanden! Wir würden uns riesig über eine Google-Bewertung freuen: g.page/r/fahrschule-mueller",
    type: "review" as const,
  },
  {
    time: "15:02",
    sender: "Autopilot",
    text: "Noch ein Tipp: Dein Freund sucht auch einen Führerschein? Empfiehl uns weiter und erhalte 10% Rabatt auf deinen BF17-Kurs!",
    type: "referral" as const,
  },
];

const iconMap = {
  reminder: Bell,
  reply: null,
  review: Star,
  referral: CreditCard,
};

export default function DemoPreview() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 sm:py-32 relative overflow-hidden" ref={ref}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Text side */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block text-sm font-semibold text-primary-light bg-primary/10 rounded-full px-4 py-1.5 mb-4">
              Live-Vorschau
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              So sieht es aus, wenn{" "}
              <span className="gradient-text">Autopilot läuft</span>
            </h2>
            <p className="text-muted leading-relaxed mb-8">
              Ihre Schüler bekommen automatisch die richtigen Nachrichten zur richtigen Zeit.
              Erinnerungen, Bewertungsanfragen, Empfehlungen — alles im Hintergrund, alles über WhatsApp.
            </p>

            <div className="space-y-4">
              {[
                { icon: Bell, text: "24h + 2h vor jeder Stunde automatisch erinnern" },
                { icon: Star, text: "Nach bestandener Prüfung → Google-Bewertung anfragen" },
                { icon: CreditCard, text: "Offene Rechnungen freundlich nachfassen" },
              ].map((item, i) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.3, delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    <item.icon className="h-4 w-4 text-accent" />
                  </div>
                  <span className="text-sm text-muted">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Phone mockup side */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center"
          >
            <div className="relative">
              {/* Phone frame */}
              <div className="w-[320px] rounded-[2.5rem] border-4 border-surface-lighter bg-surface-light p-2 shadow-2xl shadow-black/40">
                {/* Notch */}
                <div className="mx-auto mb-2 h-6 w-28 rounded-full bg-surface-lighter" />

                {/* Screen */}
                <div className="rounded-[1.8rem] bg-background overflow-hidden">
                  {/* WhatsApp header */}
                  <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                      <Smartphone className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">Fahrschule Müller</p>
                      <p className="text-white/60 text-[10px]">Autopilot aktiv</p>
                    </div>
                  </div>

                  {/* Chat messages */}
                  <div className="p-3 space-y-2.5 min-h-[360px] bg-[#0B141A]">
                    {messages.map((msg, i) => {
                      const isReply = msg.type === "reply";
                      const Icon = iconMap[msg.type];
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={isInView ? { opacity: 1, y: 0 } : {}}
                          transition={{ duration: 0.3, delay: 0.5 + i * 0.2 }}
                          className={`flex ${isReply ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-lg px-3 py-2 ${
                              isReply
                                ? "bg-[#005C4B] text-white"
                                : "bg-[#1F2C34] text-white"
                            }`}
                          >
                            {!isReply && Icon && (
                              <div className="flex items-center gap-1.5 mb-1">
                                <Icon className="h-3 w-3 text-emerald-400" />
                                <span className="text-[10px] font-semibold text-emerald-400">
                                  {msg.sender}
                                </span>
                              </div>
                            )}
                            <p className="text-[11px] leading-relaxed">{msg.text}</p>
                            <p className="text-[9px] text-white/40 text-right mt-1">
                              {msg.time}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Glow behind phone */}
              <div className="absolute -inset-10 -z-10 bg-primary/5 rounded-full blur-3xl" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
