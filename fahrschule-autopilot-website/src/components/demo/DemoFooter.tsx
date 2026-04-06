"use client";

import { Mail, Phone, MapPin, ExternalLink } from "lucide-react";
import type { DemoConfig } from "@/data/demos";

const planColors = {
  starter: { text: "text-blue-400", accent: "from-blue-400 to-blue-600" },
  pro: { text: "text-green-400", accent: "from-green-400 to-green-600" },
  premium: { text: "text-purple-400", accent: "from-purple-400 to-purple-600" },
};

const footerLinks = [
  { label: "Anmeldung", href: "#anmeldung" },
  { label: "Theorie-Trainer", href: "#theorie" },
  { label: "Features", href: "#features" },
  { label: "Preise", href: "#preise" },
];

export default function DemoFooter({ config }: { config: DemoConfig }) {
  const colors = planColors[config.slug];

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Branding */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground">
              {config.fahrschulName}
            </h3>
            <p className="text-sm text-muted">
              Powered by{" "}
              <span className={`font-semibold bg-gradient-to-r ${colors.accent} bg-clip-text text-transparent`}>
                Fahrschule Autopilot
              </span>
            </p>
            <p className="text-xs text-muted/70">
              Automatisierte Fahrschulverwaltung der nächsten Generation.
            </p>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Kontakt</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2.5">
                <Mail className={`h-4 w-4 shrink-0 ${colors.text}`} />
                <span className="text-sm text-muted">{config.email}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className={`h-4 w-4 shrink-0 ${colors.text}`} />
                <span className="text-sm text-muted">{config.telefon}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className={`h-4 w-4 shrink-0 mt-0.5 ${colors.text}`} />
                <span className="text-sm text-muted">{config.adresse}</span>
              </li>
            </ul>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Navigation</h4>
            <ul className="space-y-2.5">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-muted hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">
              Interessiert?
            </h4>
            <p className="text-sm text-muted">
              Erfahren Sie, wie Fahrschule Autopilot auch Ihre Fahrschule automatisieren kann.
            </p>
            <a
              href="https://calendly.com/andrewarbohq/30min"
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r ${colors.accent} hover:opacity-90 transition-opacity`}
            >
              Jetzt Demo buchen
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} {config.fahrschulName}. Alle Rechte vorbehalten.
          </p>
          <p className="text-xs text-muted/70">
            Automatisiert mit{" "}
            <span className={`font-medium bg-gradient-to-r ${colors.accent} bg-clip-text text-transparent`}>
              Fahrschule Autopilot
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
