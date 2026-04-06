import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Fahrschule Autopilot",
  description:
    "Melden Sie sich in Ihrem Fahrschule Autopilot Dashboard an.",
  robots: { index: false, follow: false },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
