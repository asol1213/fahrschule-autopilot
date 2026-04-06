"use client";

import { useEffect, useRef } from "react";

/**
 * DemoTracker — Unsichtbare Komponente die Demo-Besuche trackt.
 * Wird in die Demo-Seite eingebunden.
 * Sendet: Plan, Visitor-ID (Cookie), Referrer, UTM-Parameter, Verweildauer
 */
export default function DemoTracker({ plan }: { plan: string }) {
  const startTime = useRef(0);
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    startTime.current = Date.now();

    // Visitor ID aus Cookie oder erzeugen
    let visitorId = getCookie("_fa_vid");
    if (!visitorId) {
      visitorId = "v_" + Math.random().toString(36).slice(2, 12);
      setCookie("_fa_vid", visitorId, 365);
    }

    // UTM-Parameter aus URL
    const params = new URLSearchParams(window.location.search);

    // Track bei Seitenaufruf
    fetch("/api/analytics/conversion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan,
        visitorId,
        referrer: document.referrer || null,
        utmSource: params.get("utm_source"),
        utmMedium: params.get("utm_medium"),
        utmCampaign: params.get("utm_campaign"),
      }),
    }).catch(() => {});

    // Track Verweildauer bei Verlassen
    const handleBeforeUnload = () => {
      const duration = Math.round((Date.now() - startTime.current) / 1000);
      const blob = new Blob([JSON.stringify({
        plan,
        visitorId,
        duration,
        ctaClicked: document.querySelector("[data-cta-clicked]") !== null,
      })], { type: "application/json" });
      navigator.sendBeacon("/api/analytics/conversion", blob);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [plan]);

  return null; // Unsichtbare Komponente
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value};expires=${expires};path=/;SameSite=Lax`;
}
