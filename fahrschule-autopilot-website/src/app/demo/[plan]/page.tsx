import { notFound } from "next/navigation";
import { demos } from "@/data/demos";
import DemoPage from "@/components/demo/DemoPage";
import DemoTracker from "@/components/demo/DemoTracker";
import type { Metadata } from "next";

type Params = Promise<{ plan: string }>;

export async function generateStaticParams() {
  return [{ plan: "starter" }, { plan: "pro" }, { plan: "premium" }];
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { plan } = await params;
  const config = demos[plan];
  if (!config) return {};
  return {
    title: `${config.fahrschulName} — ${config.plan}-Paket Demo | Fahrschule Autopilot`,
    description: `Demo: So sieht das ${config.plan}-Paket (${config.preis}/Monat) für ${config.fahrschulName} in ${config.stadt} aus.`,
  };
}

export default async function DemoPageRoute({ params }: { params: Params }) {
  const { plan } = await params;
  const config = demos[plan];
  if (!config) notFound();
  return (
    <>
      <DemoTracker plan={plan} />
      <DemoPage config={config} />
    </>
  );
}
