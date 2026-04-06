/**
 * E-Mail-Templates für Agent 7
 * Alle Templates in HTML mit Inline-CSS für maximale E-Mail-Client-Kompatibilität.
 */

const HEADER = `
<div style="background:#1a1a2e;padding:24px 32px;border-radius:12px 12px 0 0;">
  <h2 style="color:#fff;margin:0;font-family:-apple-system,sans-serif;font-size:20px;">
    ⚡ Fahrschule Autopilot
  </h2>
</div>`;

const FOOTER = `
<div style="padding:20px 32px;border-top:1px solid #e5e7eb;color:#999;font-size:12px;font-family:-apple-system,sans-serif;">
  <p>Fahrschule Autopilot — AI-Automation für deutsche Fahrschulen</p>
  <p>fahrschulautopilot.de | andrew@fahrschulautopilot.de</p>
</div>`;

function wrap(content: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:20px;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
${HEADER}
<div style="padding:32px;">
${content}
</div>
${FOOTER}
</div>
</body></html>`;
}

/**
 * Cold-Outreach E-Mail
 */
export function outreachEmail(params: {
  anrede: string;
  nachricht: string;
}): string {
  return wrap(`
    <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 16px;">
      ${params.anrede},
    </p>
    <div style="color:#333;font-size:15px;line-height:1.6;white-space:pre-line;">
      ${params.nachricht}
    </div>
    <div style="margin-top:24px;">
      <a href="https://calendly.com/andrewarbohq/30min"
         style="display:inline-block;background:#3b82f6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
        Demo-Termin buchen
      </a>
    </div>
    <p style="color:#333;font-size:15px;line-height:1.6;margin-top:24px;">
      Grüße,<br><strong>Andrew</strong><br>Fahrschule Autopilot
    </p>
  `);
}

/**
 * Follow-Up E-Mail
 */
export function followUpEmail(params: {
  anrede: string;
  nachricht: string;
  stufe: number;
}): string {
  return wrap(`
    <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 16px;">
      ${params.anrede},
    </p>
    <div style="color:#333;font-size:15px;line-height:1.6;white-space:pre-line;">
      ${params.nachricht}
    </div>
    ${params.stufe <= 2 ? `
    <div style="margin-top:24px;">
      <a href="https://calendly.com/andrewarbohq/30min"
         style="display:inline-block;background:#3b82f6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
        Termin buchen
      </a>
    </div>` : ""}
    <p style="color:#333;font-size:15px;line-height:1.6;margin-top:24px;">
      Grüße,<br><strong>Andrew</strong>
    </p>
  `);
}

/**
 * Monatlicher Report E-Mail
 */
export function monthlyReportEmail(params: {
  fahrschulName: string;
  monat: string;
  aktiveSchueler: number;
  umsatz: number;
  noShowRate: number;
  bestehensquote: number;
  erinnerungenGesendet: number;
  zeitGespart: number;
  reportUrl: string;
}): string {
  return wrap(`
    <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 8px;">
      Hallo,
    </p>
    <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 24px;">
      hier ist Ihr monatlicher Autopilot-Report für <strong>${params.fahrschulName}</strong> (${params.monat}).
    </p>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;">
      ${kpiBox("Aktive Schüler", String(params.aktiveSchueler), "#3b82f6")}
      ${kpiBox("Umsatz (bezahlt)", `€${params.umsatz.toLocaleString("de-DE")}`, "#22c55e")}
      ${kpiBox("No-Show Rate", `${params.noShowRate}%`, params.noShowRate > 10 ? "#ef4444" : "#22c55e")}
      ${kpiBox("Bestehensquote", `${params.bestehensquote}%`, "#8b5cf6")}
    </div>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;color:#166534;font-size:14px;font-weight:600;">Autopilot Automationen diesen Monat:</p>
      <p style="margin:8px 0 0;color:#166534;font-size:14px;">
        ${params.erinnerungenGesendet} Erinnerungen gesendet • ${params.zeitGespart}h Zeit gespart
      </p>
    </div>

    <div style="text-align:center;">
      <a href="${params.reportUrl}"
         style="display:inline-block;background:#3b82f6;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
        Vollständigen Report ansehen
      </a>
    </div>
  `);
}

/**
 * Anomalie-Alert E-Mail
 */
export function anomalyAlertEmail(params: {
  fahrschulName: string;
  anomalies: Array<{ type: string; title: string; message: string; metric?: string }>;
  dashboardUrl: string;
}): string {
  const cards = params.anomalies
    .map((a) => {
      const bg = a.type === "danger" ? "#fef2f2" : "#fffbeb";
      const border = a.type === "danger" ? "#fecaca" : "#fed7aa";
      const color = a.type === "danger" ? "#dc2626" : "#d97706";
      return `<div style="background:${bg};border:1px solid ${border};border-radius:8px;padding:16px;margin-bottom:12px;">
        <p style="margin:0;font-size:14px;font-weight:600;color:${color};">${a.title}${a.metric ? ` — ${a.metric}` : ""}</p>
        <p style="margin:8px 0 0;font-size:13px;color:#333;line-height:1.5;">${a.message}</p>
      </div>`;
    })
    .join("");

  return wrap(`
    <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 8px;">
      Hallo,
    </p>
    <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Autopilot hat <strong>${params.anomalies.length} ${params.anomalies.length === 1 ? "Warnung" : "Warnungen"}</strong> f&uuml;r <strong>${params.fahrschulName}</strong> erkannt:
    </p>
    ${cards}
    <div style="text-align:center;margin-top:24px;">
      <a href="${params.dashboardUrl}"
         style="display:inline-block;background:#3b82f6;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
        Dashboard &ouml;ffnen
      </a>
    </div>
  `);
}

/**
 * ROI-Summary E-Mail (monatlich)
 */
export function roiSummaryEmail(params: {
  fahrschulName: string;
  monat: string;
  gesamtErsparnis: number;
  roi: number;
  noShowErsparnis: number;
  zeitErsparnis: number;
  zahlungsWiederherstellung: number;
  dashboardUrl: string;
}): string {
  return wrap(`
    <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Ihr ROI-Report f&uuml;r <strong>${params.fahrschulName}</strong> (${params.monat}):
    </p>
    <div style="text-align:center;margin-bottom:24px;">
      <p style="font-size:40px;font-weight:700;color:#22c55e;margin:0;">&euro;${params.gesamtErsparnis.toLocaleString("de-DE")}</p>
      <p style="color:#666;font-size:14px;margin:4px 0 0;">Gesamtersparnis diesen Monat</p>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:24px;">
      ${kpiBox("No-Show Ersparnis", `&euro;${params.noShowErsparnis}`, "#3b82f6")}
      ${kpiBox("Zeitersparnis", `&euro;${params.zeitErsparnis}`, "#8b5cf6")}
      ${kpiBox("Zahlungen gerettet", `&euro;${params.zahlungsWiederherstellung}`, "#22c55e")}
    </div>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;text-align:center;margin-bottom:24px;">
      <p style="margin:0;color:#166534;font-size:16px;font-weight:600;">ROI: ${params.roi}%</p>
    </div>
    <div style="text-align:center;">
      <a href="${params.dashboardUrl}"
         style="display:inline-block;background:#3b82f6;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
        Vollst&auml;ndigen Report ansehen
      </a>
    </div>
  `);
}

function kpiBox(label: string, value: string, color: string): string {
  return `<div style="background:#f8f9fc;border:1px solid #e5e7eb;border-radius:8px;padding:16px;text-align:center;">
    <p style="margin:0;font-size:24px;font-weight:700;color:${color};">${value}</p>
    <p style="margin:4px 0 0;font-size:12px;color:#666;">${label}</p>
  </div>`;
}
