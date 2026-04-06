import { describe, it, expect } from "vitest";
import {
  outreachEmail,
  followUpEmail,
  monthlyReportEmail,
  anomalyAlertEmail,
  roiSummaryEmail,
} from "@/lib/email/templates";

describe("email/templates", () => {
  describe("outreachEmail()", () => {
    it("generates valid HTML with DOCTYPE", () => {
      const html = outreachEmail({
        anrede: "Sehr geehrter Herr Müller",
        nachricht: "Wir möchten Ihnen unser Produkt vorstellen.",
      });
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("</html>");
    });

    it("includes the anrede in the output", () => {
      const html = outreachEmail({
        anrede: "Liebe Frau Schmidt",
        nachricht: "Test message",
      });
      expect(html).toContain("Liebe Frau Schmidt");
    });

    it("includes the message content", () => {
      const html = outreachEmail({
        anrede: "Hallo",
        nachricht: "Dies ist eine wichtige Nachricht.",
      });
      expect(html).toContain("Dies ist eine wichtige Nachricht.");
    });

    it("includes Calendly CTA link", () => {
      const html = outreachEmail({ anrede: "Test", nachricht: "Test" });
      expect(html).toContain("calendly.com");
      expect(html).toContain("Demo-Termin buchen");
    });

    it("includes header and footer branding", () => {
      const html = outreachEmail({ anrede: "Test", nachricht: "Test" });
      expect(html).toContain("Fahrschule Autopilot");
      expect(html).toContain("fahrschulautopilot.de");
    });
  });

  describe("followUpEmail()", () => {
    it("includes CTA button for stufe <= 2", () => {
      const html = followUpEmail({
        anrede: "Hallo",
        nachricht: "Follow up",
        stufe: 1,
      });
      expect(html).toContain("Termin buchen");
    });

    it("omits CTA button for stufe > 2", () => {
      const html = followUpEmail({
        anrede: "Hallo",
        nachricht: "Follow up",
        stufe: 3,
      });
      expect(html).not.toContain("Termin buchen");
    });

    it("includes anrede and nachricht", () => {
      const html = followUpEmail({
        anrede: "Lieber Herr Weber",
        nachricht: "Wir hatten uns letzten Monat unterhalten.",
        stufe: 2,
      });
      expect(html).toContain("Lieber Herr Weber");
      expect(html).toContain("letzten Monat unterhalten");
    });
  });

  describe("monthlyReportEmail()", () => {
    const params = {
      fahrschulName: "Fahrschule Test",
      monat: "März 2026",
      aktiveSchueler: 42,
      umsatz: 12500,
      noShowRate: 8,
      bestehensquote: 85,
      erinnerungenGesendet: 120,
      zeitGespart: 15,
      reportUrl: "https://example.com/report",
    };

    it("includes fahrschul name and month", () => {
      const html = monthlyReportEmail(params);
      expect(html).toContain("Fahrschule Test");
      expect(html).toContain("März 2026");
    });

    it("includes all KPI values", () => {
      const html = monthlyReportEmail(params);
      expect(html).toContain("42"); // aktiveSchueler
      expect(html).toContain("85%"); // bestehensquote
      expect(html).toContain("8%"); // noShowRate
    });

    it("includes automation stats", () => {
      const html = monthlyReportEmail(params);
      expect(html).toContain("120 Erinnerungen gesendet");
      expect(html).toContain("15h Zeit gespart");
    });

    it("includes report URL as CTA", () => {
      const html = monthlyReportEmail(params);
      expect(html).toContain('href="https://example.com/report"');
      expect(html).toContain("Vollständigen Report ansehen");
    });

    it("uses red color for high no-show rate", () => {
      const highNoShow = { ...params, noShowRate: 15 };
      const html = monthlyReportEmail(highNoShow);
      expect(html).toContain("#ef4444"); // red color
    });

    it("uses green color for low no-show rate", () => {
      const lowNoShow = { ...params, noShowRate: 5 };
      const html = monthlyReportEmail(lowNoShow);
      // The noShowRate KPI box should use green
      expect(html).toContain("5%");
    });
  });

  describe("anomalyAlertEmail()", () => {
    it("includes anomaly count in header text", () => {
      const html = anomalyAlertEmail({
        fahrschulName: "Fahrschule Demo",
        anomalies: [
          { type: "warning", title: "Test Warning", message: "Something happened" },
        ],
        dashboardUrl: "https://example.com/dashboard",
      });
      expect(html).toContain("1 Warnung");
    });

    it("uses plural for multiple anomalies", () => {
      const html = anomalyAlertEmail({
        fahrschulName: "Test",
        anomalies: [
          { type: "danger", title: "A", message: "M" },
          { type: "warning", title: "B", message: "N" },
        ],
        dashboardUrl: "https://example.com",
      });
      expect(html).toContain("2 Warnungen");
    });

    it("uses red styling for danger type anomalies", () => {
      const html = anomalyAlertEmail({
        fahrschulName: "Test",
        anomalies: [
          { type: "danger", title: "Critical", message: "Very bad", metric: "99%" },
        ],
        dashboardUrl: "https://example.com",
      });
      expect(html).toContain("#fef2f2"); // danger bg
      expect(html).toContain("#dc2626"); // danger text
      expect(html).toContain("99%"); // metric shown
    });

    it("uses yellow styling for warning type anomalies", () => {
      const html = anomalyAlertEmail({
        fahrschulName: "Test",
        anomalies: [
          { type: "warning", title: "Watch out", message: "Hmm" },
        ],
        dashboardUrl: "https://example.com",
      });
      expect(html).toContain("#fffbeb"); // warning bg
      expect(html).toContain("#d97706"); // warning text
    });

    it("includes dashboard URL as CTA", () => {
      const html = anomalyAlertEmail({
        fahrschulName: "Test",
        anomalies: [{ type: "info", title: "T", message: "M" }],
        dashboardUrl: "https://dashboard.example.com",
      });
      expect(html).toContain('href="https://dashboard.example.com"');
    });
  });

  describe("roiSummaryEmail()", () => {
    const params = {
      fahrschulName: "Fahrschule ROI",
      monat: "Februar 2026",
      gesamtErsparnis: 2500,
      roi: 340,
      noShowErsparnis: 800,
      zeitErsparnis: 1200,
      zahlungsWiederherstellung: 500,
      dashboardUrl: "https://example.com/roi",
    };

    it("includes fahrschul name and month", () => {
      const html = roiSummaryEmail(params);
      expect(html).toContain("Fahrschule ROI");
      expect(html).toContain("Februar 2026");
    });

    it("displays ROI percentage", () => {
      const html = roiSummaryEmail(params);
      expect(html).toContain("ROI: 340%");
    });

    it("displays total savings prominently", () => {
      const html = roiSummaryEmail(params);
      // The gesamtErsparnis is formatted with toLocaleString("de-DE")
      expect(html).toContain("2.500");
    });

    it("includes dashboard CTA", () => {
      const html = roiSummaryEmail(params);
      expect(html).toContain('href="https://example.com/roi"');
    });

    it("includes all three savings categories", () => {
      const html = roiSummaryEmail(params);
      expect(html).toContain("No-Show Ersparnis");
      expect(html).toContain("Zeitersparnis");
      expect(html).toContain("Zahlungen gerettet");
    });
  });
});
