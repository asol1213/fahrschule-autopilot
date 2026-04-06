"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Shield, Award, Headphones, Zap } from "lucide-react";

const badges = [
  { icon: Shield, text: "DSGVO-konform" },
  { icon: Award, text: "Made in Germany" },
  { icon: Headphones, text: "Persönlicher Support" },
  { icon: Zap, text: "Setup in unter 24h" },
];

export default function SocialProof() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section className="py-12 border-y border-border bg-surface/50" ref={ref}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5 }}
        >
          {/* Trust text */}
          <p className="text-center text-sm text-muted mb-6">
            Entwickelt für den deutschen Markt — funktioniert mit jeder Fahrschulsoftware
          </p>

          {/* Compatible with */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mb-8">
            {["AUTOVIO", "Fahrschulcockpit", "ClickClickDrive", "Excel / Manuell"].map(
              (name, i) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                  className="text-sm font-medium text-muted/60 hover:text-muted transition-colors"
                >
                  {name}
                </motion.div>
              )
            )}
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {badges.map((badge, i) => (
              <motion.div
                key={badge.text}
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.3, delay: 0.3 + i * 0.1 }}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs text-muted"
              >
                <badge.icon className="h-3.5 w-3.5 text-accent" />
                {badge.text}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
