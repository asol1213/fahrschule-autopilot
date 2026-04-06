"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X } from "lucide-react";

export default function StickyCTA() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 500);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (dismissed) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 backdrop-blur-lg shadow-lg shadow-black/20"
        >
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-4">
            <p className="hidden sm:block text-sm text-muted">
              <span className="font-semibold text-foreground">€1.400+/Monat durchschnittlich gespart</span>
              {" "}— Setup in unter 24 Stunden. Kein Risiko, 30-Tage Geld-zurück.
            </p>
            <div className="flex items-center gap-3 ml-auto">
              <a
                href="https://calendly.com/andrewarbohq/30min"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-all hover:shadow-lg hover:shadow-primary/25"
              >
                Kostenlose Demo
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </a>
              <button
                onClick={() => setDismissed(true)}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-lighter transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
