import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Datenschutzerklärung | Fahrschule Autopilot",
  description: "Datenschutzerklärung von Fahrschule Autopilot — AI-Automation für deutsche Fahrschulen.",
};

export default function Datenschutz() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Startseite
        </Link>

        <h1 className="text-3xl font-bold mb-8">Datenschutzerklärung</h1>

        <div className="space-y-8 text-sm text-muted leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              1. Datenschutz auf einen Blick
            </h2>
            <h3 className="text-base font-medium text-foreground mt-4 mb-2">Allgemeine Hinweise</h3>
            <p>
              Die folgenden Hinweise geben einen einfachen Überblick darüber,
              was mit Ihren personenbezogenen Daten passiert, wenn Sie diese
              Website besuchen. Personenbezogene Daten sind alle Daten, mit
              denen Sie persönlich identifiziert werden können. Ausführliche
              Informationen zum Thema Datenschutz entnehmen Sie unserer unter
              diesem Text aufgeführten Datenschutzerklärung.
            </p>
            <h3 className="text-base font-medium text-foreground mt-4 mb-2">
              Datenerfassung auf dieser Website
            </h3>
            <p>
              <strong className="text-foreground">Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong><br />
              Die Datenverarbeitung auf dieser Website erfolgt durch den
              Websitebetreiber. Dessen Kontaktdaten können Sie dem Abschnitt
              &bdquo;Hinweis zur verantwortlichen Stelle&ldquo; in dieser
              Datenschutzerklärung entnehmen.
            </p>
            <p className="mt-3">
              <strong className="text-foreground">Wie erfassen wir Ihre Daten?</strong><br />
              Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese
              mitteilen. Hierbei kann es sich z.B. um Daten handeln, die Sie
              in ein Kontaktformular eingeben oder per Chat/WhatsApp an uns senden.
              Andere Daten werden automatisch oder nach Ihrer Einwilligung beim
              Besuch der Website durch unsere IT-Systeme erfasst. Das sind vor
              allem technische Daten (z.B. Internetbrowser, Betriebssystem oder
              Uhrzeit des Seitenaufrufs).
            </p>
            <p className="mt-3">
              <strong className="text-foreground">Wofür nutzen wir Ihre Daten?</strong><br />
              Ein Teil der Daten wird erhoben, um eine fehlerfreie
              Bereitstellung der Website zu gewährleisten. Andere Daten können
              zur Analyse Ihres Nutzerverhaltens verwendet werden. Wenn Sie uns
              über das Kontaktformular, den Chat oder WhatsApp kontaktieren,
              werden Ihre Daten zur Bearbeitung Ihrer Anfrage verwendet.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              2. Verantwortliche Stelle
            </h2>
            <p>
              Die verantwortliche Stelle für die Datenverarbeitung auf dieser
              Website ist:
            </p>
            <p className="mt-3">
              Andrew Arbo<br />
              Fahrschule Autopilot<br />
              <br />
              E-Mail: andrew@fahrschulautopilot.de<br />
              Telefon: +49 171 477 4026
            </p>
            <p className="mt-3">
              Verantwortliche Stelle ist die natürliche oder juristische Person,
              die allein oder gemeinsam mit anderen über die Zwecke und Mittel
              der Verarbeitung von personenbezogenen Daten (z.B. Namen,
              E-Mail-Adressen o. Ä.) entscheidet.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              3. Ihre Rechte
            </h2>
            <p>
              Sie haben jederzeit das Recht, unentgeltlich Auskunft über
              Herkunft, Empfänger und Zweck Ihrer gespeicherten
              personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht,
              die Berichtigung oder Löschung dieser Daten zu verlangen. Wenn Sie
              eine Einwilligung zur Datenverarbeitung erteilt haben, können Sie
              diese Einwilligung jederzeit für die Zukunft widerrufen. Außerdem
              haben Sie das Recht, unter bestimmten Umständen die Einschränkung
              der Verarbeitung Ihrer personenbezogenen Daten zu verlangen. Des
              Weiteren steht Ihnen ein Beschwerderecht bei der zuständigen
              Aufsichtsbehörde zu.
            </p>
            <p className="mt-3">
              Hierzu sowie zu weiteren Fragen zum Thema Datenschutz können Sie
              sich jederzeit an uns wenden.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              4. Datenerfassung auf dieser Website
            </h2>
            <h3 className="text-base font-medium text-foreground mt-4 mb-2">Hosting</h3>
            <p>
              Wir hosten die Inhalte unserer Website bei Vercel Inc., 440 N
              Baxter St, Coppell, TX 75019, USA. Wenn Sie unsere Website
              besuchen, erfasst Vercel verschiedene Logfiles inklusive Ihrer
              IP-Adressen. Details entnehmen Sie der Datenschutzerklärung von
              Vercel:{" "}
              <a
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                https://vercel.com/legal/privacy-policy
              </a>
              .
            </p>
            <p className="mt-3">
              Die Verwendung von Vercel erfolgt auf Grundlage von Art. 6 Abs. 1
              lit. f DSGVO. Wir haben ein berechtigtes Interesse an einer
              möglichst zuverlässigen Darstellung unserer Website.
            </p>

            <h3 className="text-base font-medium text-foreground mt-4 mb-2">Chat-Widget</h3>
            <p>
              Auf unserer Website befindet sich ein Chat-Widget, über das Sie
              uns Nachrichten senden können. Wenn Sie den Chat nutzen, werden
              Ihre Eingaben zur Bearbeitung Ihrer Anfrage bei uns gespeichert.
              Diese Daten geben wir nicht ohne Ihre Einwilligung weiter. Die
              Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO,
              sofern Ihre Anfrage mit der Erfüllung eines Vertrags
              zusammenhängt oder zur Durchführung vorvertraglicher Maßnahmen
              erforderlich ist.
            </p>

            <h3 className="text-base font-medium text-foreground mt-4 mb-2">Calendly</h3>
            <p>
              Für die Terminbuchung nutzen wir den Dienst Calendly (Calendly
              LLC, 3423 Piedmont Rd NE, Atlanta, GA 30305, USA). Wenn Sie einen
              Termin buchen, werden Ihre eingegebenen Daten (Name,
              E-Mail-Adresse) an Calendly übermittelt und dort gespeichert.
              Details entnehmen Sie der Datenschutzerklärung von Calendly:{" "}
              <a
                href="https://calendly.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                https://calendly.com/privacy
              </a>
              .
            </p>

            <h3 className="text-base font-medium text-foreground mt-4 mb-2">WhatsApp</h3>
            <p>
              Wenn Sie uns über WhatsApp kontaktieren, werden Ihre Nachrichten
              und Kontaktdaten von Meta Platforms Ireland Limited (4 Grand Canal
              Square, Grand Canal Harbour, Dublin 2, Irland) verarbeitet. Wir
              nutzen WhatsApp zur Kommunikation mit Interessenten und Kunden.
              Die Nutzung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO
              (Vertragserfüllung/vorvertragliche Maßnahmen) bzw. Art. 6 Abs. 1
              lit. f DSGVO (berechtigtes Interesse an effizienter Kommunikation).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              5. Weitere Dienste und Auftragsverarbeiter
            </h2>

            <h3 className="text-base font-medium text-foreground mt-4 mb-2">Supabase (Datenbank)</h3>
            <p>
              Wir nutzen Supabase (Supabase Inc.) als Datenbank- und
              Authentifizierungsdienst. Die Daten werden auf Servern in
              Frankfurt/Main (AWS eu-central-1) gespeichert. Es findet keine
              Übertragung personenbezogener Daten außerhalb der EU statt. Die
              Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO
              (Vertragserfüllung) bzw. Art. 6 Abs. 1 lit. f DSGVO (berechtigtes
              Interesse an einer sicheren Datenhaltung).
            </p>

            <h3 className="text-base font-medium text-foreground mt-4 mb-2">Anthropic / Claude AI (AI-Chatbot &amp; Theorie-Tutor)</h3>
            <p>
              Für unseren AI-Chatbot und den Theorie-Tutor nutzen wir die
              API von Anthropic PBC (San Francisco, USA). Bei der Nutzung
              dieser Funktionen werden Ihre Eingaben (z.B. Chat-Nachrichten,
              Fragen zum Theorie-Trainer) an die Anthropic-API übermittelt und
              dort verarbeitet. Anthropic speichert keine Nutzerdaten dauerhaft
              und verwendet sie nicht zum Trainieren von Modellen. Die
              Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO
              (Vertragserfüllung) bzw. Art. 6 Abs. 1 lit. a DSGVO
              (Einwilligung bei Nutzung des Chats).
            </p>

            <h3 className="text-base font-medium text-foreground mt-4 mb-2">fonio.ai (KI-Telefon-Assistent)</h3>
            <p>
              Für den AI-Telefon-Assistenten nutzen wir den Dienst fonio.ai.
              Wenn ein Anruf an den KI-Assistenten weitergeleitet wird, werden
              die Gesprächsinhalte von fonio.ai verarbeitet, um den Anruf zu
              beantworten und ggf. Terminwünsche oder Rückrufbitten
              weiterzuleiten. Die Verarbeitung erfolgt auf Grundlage von Art. 6
              Abs. 1 lit. b DSGVO (Vertragserfüllung) bzw. Art. 6 Abs. 1 lit. f
              DSGVO (berechtigtes Interesse an effizienter Erreichbarkeit).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              6. Google Fonts
            </h2>
            <p>
              Diese Seite nutzt zur einheitlichen Darstellung von Schriftarten
              so genannte Google Fonts, die von Google bereitgestellt werden.
              Die Google Fonts werden lokal auf dem Server gehostet. Eine
              Verbindung zu Servern von Google findet dabei nicht statt.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              7. SSL- bzw. TLS-Verschlüsselung
            </h2>
            <p>
              Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der
              Übertragung vertraulicher Inhalte, wie zum Beispiel Anfragen, die
              Sie an uns als Seitenbetreiber senden, eine SSL- bzw.
              TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie
              daran, dass die Adresszeile des Browsers von &bdquo;http://&ldquo; auf
              &bdquo;https://&ldquo; wechselt und an dem Schloss-Symbol in Ihrer
              Browserzeile.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              8. Aktualität und Änderung dieser Datenschutzerklärung
            </h2>
            <p>
              Diese Datenschutzerklärung ist aktuell gültig und hat den Stand
              März 2026. Durch die Weiterentwicklung unserer Website und
              Angebote oder aufgrund geänderter gesetzlicher beziehungsweise
              behördlicher Vorgaben kann es notwendig werden, diese
              Datenschutzerklärung zu ändern.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
