import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Schüler-Login | Fahrschule Autopilot",
  description:
    "Melden Sie sich im Schüler-Portal an.",
  robots: { index: false, follow: false },
};

export default function SchuelerLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
