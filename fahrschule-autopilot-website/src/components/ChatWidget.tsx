"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Calendar, Star, Shield, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface Message {
  role: "bot" | "user";
  text: string;
  options?: { label: string }[];
}

const CALENDLY = "https://calendly.com/andrewarbohq/30min";
const WHATSAPP_URL =
  "https://wa.me/491714774026?text=Hallo%20Andrew%2C%20ich%20interessiere%20mich%20f%C3%BCr%20Fahrschule%20Autopilot.%20K%C3%B6nnen%20wir%20kurz%20sprechen%3F";

const INITIAL_OPTIONS = [
  { label: "Was kostet das?" },
  { label: "Wie funktioniert das?" },
  { label: "Passt das zu meiner Software?" },
  { label: "Ich will eine Demo sehen" },
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const chatHistoryRef = useRef<{ role: string; content: string }[]>([]);

  // Focus input when chat opens
  useEffect(() => {
    if (open && !initialized.current) {
      initialized.current = true;
      setTimeout(() => {
        setMessages([
          {
            role: "bot",
            text: "Hallo! Ich bin der Autopilot-Assistent. Wie kann ich Ihnen helfen?\n\nFragen Sie uns — auch auf Türkisch, Arabisch, Russisch oder Englisch.",
            options: INITIAL_OPTIONS,
          },
        ]);
        inputRef.current?.focus();
      }, 400);
    } else if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendToAI = useCallback(async (userMessage: string): Promise<string> => {
    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          chatHistory: chatHistoryRef.current.slice(-10),
        }),
      });

      if (!res.ok) {
        if (res.status === 503) setAiAvailable(false);
        throw new Error(`API ${res.status}`);
      }

      const data = await res.json();
      return data.response;
    } catch {
      setAiAvailable(false);
      return "";
    }
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim() || isTyping) return;

      // Handle special actions
      if (text === "Demo buchen") {
        setMessages((prev) => [
          ...prev,
          { role: "user", text },
          { role: "bot", text: "Perfekt! Ich öffne die Terminbuchung." },
        ]);
        setTimeout(() => window.open(CALENDLY, "_blank"), 500);
        return;
      }

      if (text === "WhatsApp öffnen" || text === "Lieber per WhatsApp") {
        setMessages((prev) => [
          ...prev,
          { role: "user", text },
          { role: "bot", text: "Ich öffne WhatsApp für Sie." },
        ]);
        setTimeout(() => window.open(WHATSAPP_URL, "_blank"), 500);
        return;
      }

      // Add user message
      setMessages((prev) => [...prev, { role: "user", text }]);
      setInputValue("");
      setIsTyping(true);

      // Update chat history
      chatHistoryRef.current.push({ role: "user", content: text });

      // Try AI response
      let botText = "";
      if (aiAvailable) {
        botText = await sendToAI(text);
      }

      // Fallback to smart matching if AI unavailable
      if (!botText) {
        botText = getFallbackResponse(text);
      }

      // Update history
      chatHistoryRef.current.push({ role: "assistant", content: botText });

      // Detect if response mentions demo/calendly → add options
      const lower = botText.toLowerCase();
      const suggestDemo = lower.includes("demo") || lower.includes("gespräch") || lower.includes("termin") || lower.includes("calendly");
      const options = suggestDemo
        ? [{ label: "Demo buchen" }, { label: "Lieber per WhatsApp" }]
        : [{ label: "Demo buchen" }, { label: "Was kostet das?" }];

      setMessages((prev) => [...prev, { role: "bot", text: botText, options }]);
      setIsTyping(false);
    },
    [isTyping, aiAvailable, sendToAI]
  );

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary-dark hover:scale-110 transition-all"
            aria-label="Chat öffnen"
          >
            <MessageCircle className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-accent" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={chatWindowRef}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-label="Chat mit Autopilot AI-Assistent"
            className="fixed bottom-6 right-6 z-50 w-[min(400px,calc(100vw-2rem))] rounded-2xl border border-border bg-surface shadow-2xl shadow-black/40 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-surface-light to-surface">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full overflow-hidden border-2 border-primary/30">
                    <Image src="/logo.svg" alt="Autopilot" width={28} height={28} />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-accent border-2 border-surface" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Autopilot AI-Assistent</p>
                  <p className="text-[11px] text-accent">
                    {aiAvailable ? "AI-gestützt" : "Jetzt online"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-lighter transition-colors"
                aria-label="Chat schließen"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div
              className="h-[360px] overflow-y-auto p-4 space-y-4"
              role="log"
              aria-live="polite"
              aria-label="Chat-Nachrichten"
            >
              {messages.map((msg, i) => (
                <div key={i}>
                  <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                        msg.role === "user"
                          ? "bg-primary text-white rounded-br-md"
                          : "bg-surface-lighter text-foreground rounded-bl-md"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                  {msg.role === "bot" && msg.options && (
                    <div className="flex flex-wrap gap-2 mt-3" role="group" aria-label="Antwort-Optionen">
                      {msg.options.map((opt) => (
                        <button
                          key={opt.label}
                          onClick={() => handleSend(opt.label)}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                            opt.label === "Demo buchen"
                              ? "border-primary/40 bg-primary/10 text-primary-light hover:bg-primary/20"
                              : opt.label.includes("WhatsApp")
                                ? "border-[#25D366]/30 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20"
                                : "border-border bg-surface text-muted hover:bg-surface-light hover:text-foreground"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start" aria-label="Assistent tippt">
                  <div className="bg-surface-lighter rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1.5" role="status" aria-label="Nachricht wird geschrieben">
                      <span className="h-2 w-2 rounded-full bg-muted animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 rounded-full bg-muted animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 rounded-full bg-muted animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick actions */}
            <div className="px-3 py-2 border-t border-border flex gap-2 overflow-x-auto" role="group" aria-label="Schnellaktionen">
              <button
                onClick={() => handleSend("Was kostet das?")}
                className="shrink-0 inline-flex items-center gap-1 rounded-full bg-surface-lighter px-3 py-1.5 text-[11px] text-muted hover:text-foreground transition-colors"
              >
                <Star className="h-3 w-3" aria-hidden="true" /> Preise
              </button>
              <button
                onClick={() => handleSend("Ist das DSGVO-konform?")}
                className="shrink-0 inline-flex items-center gap-1 rounded-full bg-surface-lighter px-3 py-1.5 text-[11px] text-muted hover:text-foreground transition-colors"
              >
                <Shield className="h-3 w-3" aria-hidden="true" /> DSGVO
              </button>
              <button
                onClick={() => handleSend("Wie schnell sehe ich Ergebnisse?")}
                className="shrink-0 inline-flex items-center gap-1 rounded-full bg-surface-lighter px-3 py-1.5 text-[11px] text-muted hover:text-foreground transition-colors"
              >
                <Clock className="h-3 w-3" aria-hidden="true" /> Ergebnisse
              </button>
              <button
                onClick={() => handleSend("Demo buchen")}
                className="shrink-0 inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/30 px-3 py-1.5 text-[11px] text-primary-light hover:bg-primary/20 transition-colors"
              >
                <Calendar className="h-3 w-3" aria-hidden="true" /> Demo
              </button>
            </div>

            {/* Input */}
            <div className="border-t border-border p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(inputValue);
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ihre Frage..."
                  aria-label="Chat-Nachricht eingeben"
                  className="flex-1 rounded-full bg-surface-lighter border border-border px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isTyping}
                  aria-label="Nachricht senden"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white hover:bg-primary-dark disabled:opacity-50 disabled:hover:bg-primary transition-all"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Fallback-Responses wenn AI nicht verfügbar
 */
function getFallbackResponse(text: string): string {
  const lower = text.toLowerCase();

  if (lower.includes("kost") || lower.includes("preis") || lower.includes("euro") || lower.includes("€")) {
    return "Wir haben 3 Pakete — monatlich kündbar, keine Einrichtungsgebühr:\n\n✓ Starter (€99/Mo): Erinnerungen + Bewertungen\n✓ Pro (€249/Mo): Alles automatisiert — am beliebtesten\n✓ Premium (€499/Mo): Inkl. Website + SEO + CRM + Blog\n\n+ AI Telefon-Assistent als Addon (+€149/Mo)\n\nDurchschnittlich sparen unsere Kunden €1.400/Monat. 30-Tage Geld-zurück-Garantie.";
  }
  if (lower.includes("funktion") || lower.includes("wie geht") || lower.includes("wie läuft")) {
    return "3 Schritte:\n\n1. Kostenloses 10-Min Gespräch — ich zeige Ihnen live, wie es aussieht\n2. Ich richte alles ein (unter 24h) — Sie müssen nichts tun\n3. Es läuft automatisch im Hintergrund\n\nKein Technik-Wissen nötig. Sie behalten Ihre aktuelle Software.";
  }
  if (lower.includes("software") || lower.includes("autovio") || lower.includes("cockpit") || lower.includes("kompatib")) {
    return "Ja! Wir ersetzen nichts — wir bauen die Automation drumherum.\n\nFunktioniert mit AUTOVIO, Fahrschulcockpit, ClickClickDrive, Excel und jeder anderen Software.";
  }
  if (lower.includes("dsgvo") || lower.includes("datenschutz")) {
    return "Zu 100% DSGVO-konform. Alle Daten auf europäischen Servern. WhatsApp Business API ist DSGVO-konform. AVV vorbereitet. Schüler können sich jederzeit abmelden.";
  }
  if (lower.includes("demo") || lower.includes("zeig")) {
    return "In 10 Minuten zeige ich Ihnen, wie Fahrschule Autopilot mit Ihren echten Zahlen aussieht. Kein Verkaufsdruck — nur eine ehrliche Demo.";
  }
  if (lower.includes("spar") || lower.includes("roi") || lower.includes("lohn")) {
    return "Bei einer mittleren Fahrschule (3 Fahrlehrer) sparen Sie ca. €1.600/Monat durch weniger No-Shows, schnellere Zahlungen und mehr Neukunden. Das ist ein 6.5x ROI bei €249/Monat.";
  }
  if (lower.includes("ergebnis") || lower.includes("schnell") || lower.includes("wann")) {
    return "Tag 1: System läuft, erste Erinnerungen gehen raus. Woche 1: Spürbar weniger No-Shows. Woche 2-3: Erste neue Google-Bewertungen. Wenn nicht: Geld zurück.";
  }

  return "Gute Frage! Am besten kann ich Ihnen das in einem kurzen 10-Minuten-Gespräch zeigen — mit Ihren echten Zahlen. Oder schreiben Sie mir direkt auf WhatsApp.";
}
