"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Bell,
  Star,
  BarChart3,
  CreditCard,
  MessageCircle,
  Users,
  Repeat,
  FileText,
  Phone,
  Globe,
  BookOpen,
  Database,
  PenTool,
  Lock,
  ArrowRight,
  Crown,
  CheckCircle2,
} from "lucide-react";
import type { DemoConfig } from "@/data/demos";
import { allFeatures } from "@/data/demos";

const iconMap: Record<string, React.ElementType> = {
  Bell,
  Star,
  BarChart3,
  CreditCard,
  MessageCircle,
  Users,
  Repeat,
  FileText,
  Phone,
  Globe,
  BookOpen,
  Database,
  PenTool,
};

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: "bg-blue-500/10", text: "text-blue-400", border: "hover:border-blue-500/30" },
  yellow: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "hover:border-yellow-500/30" },
  green: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "hover:border-emerald-500/30" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-400", border: "hover:border-purple-500/30" },
  cyan: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "hover:border-cyan-500/30" },
  pink: { bg: "bg-pink-500/10", text: "text-pink-400", border: "hover:border-pink-500/30" },
  orange: { bg: "bg-orange-500/10", text: "text-orange-400", border: "hover:border-orange-500/30" },
};

const minPlanLabel: Record<string, string> = {
  starter: "Starter",
  pro: "Pro",
  premium: "Premium",
};

export default function DemoFeatures({ config }: { config: DemoConfig }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features" className="py-24 sm:py-32 relative" ref={ref}>
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface/50 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-sm font-semibold text-accent bg-accent/10 rounded-full px-4 py-1.5 mb-4">
            Ihre Funktionen
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Alles im{" "}
            <span className="gradient-text">{config.plan}-Paket</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted">
            Sehen Sie, welche Automationen f&uuml;r{" "}
            {config.fahrschulName} aktiv sind &mdash; und was mit einem Upgrade m&ouml;glich w&auml;re.
          </p>
        </motion.div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {allFeatures.map((feature, i) => {
            const isActive = config.features[feature.id] === true;
            const Icon = iconMap[feature.icon] ?? Bell;
            const colors = colorMap[feature.color] ?? colorMap.blue;

            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className={`relative overflow-hidden rounded-2xl border border-border bg-surface/50 p-5 transition-all duration-300 ${
                  isActive
                    ? `group ${colors.border} hover:bg-surface-light hover:scale-[1.02]`
                    : "opacity-50 grayscale"
                }`}
              >
                {/* Icon */}
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors.bg} mb-4 ${
                    isActive ? "group-hover:scale-110 transition-transform" : ""
                  }`}
                >
                  <Icon className={`h-6 w-6 ${colors.text}`} />
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold mb-2">{feature.name}</h3>

                {/* Description */}
                <p className="text-sm text-muted leading-relaxed mb-4">
                  {feature.desc}
                </p>

                {/* Result checkmark (active only) */}
                {isActive && (
                  <div className="flex items-center gap-2 text-sm font-medium text-accent">
                    <CheckCircle2 className="h-4 w-4" />
                    Aktiv
                  </div>
                )}

                {/* Locked overlay */}
                {!isActive && (
                  <div className="absolute inset-0 rounded-2xl bg-background/70 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2">
                    <Lock className="h-6 w-6 text-muted" />
                    <p className="text-sm text-muted font-medium">
                      Verf&uuml;gbar ab {minPlanLabel[feature.minPlan]}-Paket
                    </p>
                    <a
                      href="#preise"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline mt-1"
                    >
                      <Crown className="h-3 w-3" />
                      Upgrade
                      <ArrowRight className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
