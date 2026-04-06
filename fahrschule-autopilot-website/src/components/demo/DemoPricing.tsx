"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Check, Crown, ChevronRight } from "lucide-react";

interface DemoPricingProps {
  currentPlan: "starter" | "pro" | "premium";
}

const plans = [
  {
    id: "starter" as const,
    name: "Starter",
    price: 99,
    savings: "~800",
    color: {
      border: "border-blue-500/50",
      glow: "shadow-blue-500/20",
      badge: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      button: "bg-blue-600 hover:bg-blue-500",
      text: "text-blue-400",
    },
    features: [
      "Termin-Erinnerungen",
      "Google-Bewertungen",
      "Basis-Reporting",
      "WhatsApp-Integration",
      "E-Mail Support",
    ],
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: 249,
    savings: "~1.500",
    color: {
      border: "border-green-500/50",
      glow: "shadow-green-500/20",
      badge: "bg-green-500/10 text-green-400 border-green-500/30",
      button: "bg-green-600 hover:bg-green-500",
      text: "text-green-400",
    },
    features: [
      "Alles aus Starter",
      "Zahlungserinnerungen",
      "AI-Chatbot",
      "Schüler-Onboarding",
      "Empfehlungssystem",
      "Warteliste-Management",
      "Weekly Reports",
      "Priority Support",
    ],
  },
  {
    id: "premium" as const,
    name: "Premium",
    price: 499,
    savings: "~2.500",
    color: {
      border: "border-purple-500/50",
      glow: "shadow-purple-500/20",
      badge: "bg-purple-500/10 text-purple-400 border-purple-500/30",
      button: "bg-purple-600 hover:bg-purple-500",
      text: "text-purple-400",
    },
    features: [
      "Alles aus Pro",
      "AI Telefon-Assistent",
      "Website + SEO",
      "Blog-Erstellung",
      "Online-Terminbuchung",
      "CRM & Datenbank",
      "Dedizierter Ansprechpartner",
      "24/7 Support",
    ],
  },
];

const planOrder = ["starter", "pro", "premium"] as const;

export default function DemoPricing({ currentPlan }: DemoPricingProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const currentIndex = planOrder.indexOf(currentPlan);

  return (
    <section id="preise" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Unsere Pakete
          </h2>
          <p className="mt-3 text-muted text-lg max-w-2xl mx-auto">
            Wählen Sie das passende Paket für Ihre Fahrschule
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan, index) => {
            const isCurrent = plan.id === currentPlan;
            const planIndex = planOrder.indexOf(plan.id);
            const isUpgrade = planIndex > currentIndex;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className={`relative rounded-2xl p-6 sm:p-8 transition-all duration-300 ${
                  isCurrent
                    ? `border-2 ${plan.color.border} bg-surface-light scale-[1.02] shadow-xl ${plan.color.glow}`
                    : "border border-border bg-surface hover:border-border/80"
                }`}
              >
                {/* Current plan badge */}
                {isCurrent && (
                  <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-semibold border ${plan.color.badge}`}>
                    <Crown className="h-3.5 w-3.5" />
                    Ihr aktuelles Paket
                  </div>
                )}

                {/* Upgrade/Downgrade label */}
                {!isCurrent && (
                  <div className="mb-4">
                    <span className="text-xs font-medium text-muted">
                      {isUpgrade ? "Upgrade" : "Downgrade"}
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className={isCurrent ? "mt-3" : ""}>
                  <h3 className={`text-xl font-bold ${isCurrent ? plan.color.text : "text-foreground"}`}>
                    {plan.name}
                  </h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-foreground">
                      €{plan.price}
                    </span>
                    <span className="text-sm text-muted">/Monat</span>
                  </div>
                  <div className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${plan.color.badge}`}>
                    Spart ca. €{plan.savings}/Monat
                  </div>
                </div>

                {/* Features */}
                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className={`h-4 w-4 mt-0.5 shrink-0 ${isCurrent ? plan.color.text : "text-accent"}`} />
                      <span className="text-sm text-foreground/80">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="mt-8">
                  {isCurrent ? (
                    <div className={`w-full py-3 rounded-xl text-center text-sm font-semibold border ${plan.color.border} ${plan.color.text} bg-transparent`}>
                      Aktuelles Paket
                    </div>
                  ) : isUpgrade ? (
                    <a
                      href="#preise"
                      className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold text-white transition-colors ${plan.color.button}`}
                    >
                      Auf {plan.name} upgraden
                      <ChevronRight className="h-4 w-4" />
                    </a>
                  ) : (
                    <a
                      href="#preise"
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold text-muted border border-border hover:border-border/80 transition-colors"
                    >
                      Zu {plan.name} wechseln
                    </a>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
