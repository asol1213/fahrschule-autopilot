export const KLASSEN = [
  { value: "B", title: "B", desc: "PKW bis 3.500 kg" },
  { value: "B96", title: "B96", desc: "PKW + Anh\u00e4nger bis 4.250 kg" },
  { value: "BE", title: "BE", desc: "PKW + schwerer Anh\u00e4nger" },
  { value: "A", title: "A", desc: "Motorrad unbeschr\u00e4nkt" },
  { value: "A2", title: "A2", desc: "Motorrad bis 35 kW" },
  { value: "A1", title: "A1", desc: "Motorrad bis 125 ccm" },
  { value: "AM", title: "AM", desc: "Roller / Moped bis 45 km/h" },
  { value: "Mofa", title: "Mofa", desc: "bis 25 km/h" },
  { value: "L", title: "L", desc: "Land- / Forstwirtschaft" },
] as const;

export const VORBESITZ_OPTIONS = ["Keine", "B", "A", "A1", "A2", "AM"] as const;

export const TAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa"] as const;

export const UHRZEITEN = [
  { value: "morgens", label: "Morgens", sub: "8 - 12 Uhr" },
  { value: "mittags", label: "Mittags", sub: "12 - 16 Uhr" },
  { value: "abends", label: "Abends", sub: "16 - 20 Uhr" },
  { value: "flexibel", label: "Flexibel", sub: "Egal wann" },
] as const;

export const WIE_ERFAHREN = [
  "Google-Suche",
  "Social Media",
  "Empfehlung",
  "Werbung",
  "Sonstiges",
] as const;

export const SPRACHEN = [
  "Deutsch",
  "Englisch",
  "T\u00fcrkisch",
  "Arabisch",
  "Russisch",
] as const;

export const inputClass =
  "w-full rounded-xl border border-border bg-surface-light px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors";

export const selectClass =
  "w-full rounded-xl border border-border bg-surface-light px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors appearance-none cursor-pointer";
