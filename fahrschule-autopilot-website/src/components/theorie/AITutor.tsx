"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Sparkles, Send, X, Loader2, Bot } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Daily usage limit (localStorage-based)                             */
/* ------------------------------------------------------------------ */
const DAILY_LIMIT = 20;
const STORAGE_KEY = "ai-tutor-usage";

function getTutorUsage(): { count: number; date: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { count: 0, date: new Date().toISOString().split("T")[0] };
    const parsed = JSON.parse(raw);
    const today = new Date().toISOString().split("T")[0];
    if (parsed.date !== today) return { count: 0, date: today };
    return { count: parsed.count || 0, date: today };
  } catch {
    return { count: 0, date: new Date().toISOString().split("T")[0] };
  }
}

function incrementTutorUsage(): number {
  const usage = getTutorUsage();
  usage.count++;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
  return usage.count;
}

function syncDailyCount(serverCount: number): void {
  const today = new Date().toISOString().split("T")[0];
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ count: serverCount, date: today }));
}

/* ------------------------------------------------------------------ */
/*  Simple markdown renderer for tutor messages                        */
/* ------------------------------------------------------------------ */
function renderTutorMessage(text: string): React.ReactNode {
  const lines = text.split("\n");
  return lines.map((line, lineIdx) => {
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let key = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      const codeMatch = remaining.match(/`(.+?)`/);

      const matches = [
        boldMatch ? { type: "bold", match: boldMatch } : null,
        codeMatch ? { type: "code", match: codeMatch } : null,
      ].filter(Boolean).sort((a, b) => a!.match.index! - b!.match.index!);

      if (matches.length === 0) {
        parts.push(remaining);
        break;
      }

      const first = matches[0]!;
      const idx = first.match.index!;

      if (idx > 0) {
        parts.push(remaining.slice(0, idx));
      }

      if (first.type === "bold") {
        parts.push(
          <strong key={key++} className="font-semibold">
            {first.match[1]}
          </strong>
        );
      } else if (first.type === "code") {
        parts.push(
          <code key={key++} className="text-purple-400 font-medium">
            {first.match[1]}
          </code>
        );
      }

      remaining = remaining.slice(idx + first.match[0].length);
    }

    return (
      <span key={lineIdx}>
        {lineIdx > 0 && <br />}
        {parts}
      </span>
    );
  });
}

/* ------------------------------------------------------------------ */
/*  SSE stream reader                                                  */
/* ------------------------------------------------------------------ */
async function* readSSEStream(
  response: Response
): AsyncGenerator<{ type: string; text?: string; dailyCount?: number }> {
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (raw === "[DONE]") return;
        try {
          yield JSON.parse(raw);
        } catch {
          // malformed chunk — skip
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface AITutorProps {
  questionData: {
    question: string;
    userAnswer: string;
    correctAnswers: string;
    explanation: string;
    wasCorrect: boolean;
  };
  onClose: () => void;
}

interface Message {
  role: "assistant" | "user";
  content: string;
  streaming?: boolean;
}

export default function AITutor({ questionData, onClose }: AITutorProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isLimitReached = usageCount >= DAILY_LIMIT;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setUsageCount(getTutorUsage().count);
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Stream a single fetch request into the last assistant message     */
  /* ------------------------------------------------------------------ */
  const streamRequest = useCallback(
    async (
      fetchBody: object,
      prependMessages?: Message[]
    ): Promise<void> => {
      // Cancel any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);

      // Add a streaming placeholder for the assistant
      setMessages((prev) => {
        const base = prependMessages ?? prev;
        return [...base, { role: "assistant", content: "", streaming: true }];
      });

      try {
        const res = await fetch("/api/tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fetchBody),
          signal: controller.signal,
        });

        if (!res.ok) {
          // Non-streaming error response (rate limit etc.)
          const data = await res.json().catch(() => ({}));
          const errMsg =
            data.error ||
            "Entschuldigung, da ist etwas schiefgelaufen. Versuch es nochmal!";
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.streaming) {
              next[next.length - 1] = { role: "assistant", content: errMsg };
            }
            return next;
          });
          return;
        }

        for await (const event of readSSEStream(res)) {
          if (controller.signal.aborted) break;

          if (event.type === "meta" && event.dailyCount != null) {
            syncDailyCount(event.dailyCount);
            setUsageCount(event.dailyCount);
          } else if (event.type === "text" && event.text) {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.streaming) {
                next[next.length - 1] = {
                  ...last,
                  content: last.content + event.text,
                };
              }
              return next;
            });
          } else if (event.type === "error" && event.text) {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.streaming) {
                next[next.length - 1] = {
                  role: "assistant",
                  content: event.text!,
                };
              }
              return next;
            });
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.streaming) {
            next[next.length - 1] = {
              role: "assistant",
              content:
                "Entschuldigung, da ist etwas schiefgelaufen. Versuch es nochmal!",
            };
          }
          return next;
        });
      } finally {
        // Remove streaming flag from last message
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.streaming) {
            next[next.length - 1] = { role: last.role, content: last.content };
          }
          return next;
        });
        setIsLoading(false);
      }
    },
    []
  );

  /* ------------------------------------------------------------------ */
  /*  Initial explanation on mount                                      */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (initialLoaded) return;
    setInitialLoaded(true);

    if (getTutorUsage().count >= DAILY_LIMIT) {
      setMessages([
        {
          role: "assistant",
          content: `Du hast dein tägliches Limit von ${DAILY_LIMIT} AI-Tutor Fragen erreicht. 📚 Morgen kannst du wieder fragen! Nutze in der Zwischenzeit die Erklärungen unter jeder Frage.`,
        },
      ]);
      return;
    }

    const newCount = incrementTutorUsage();
    setUsageCount(newCount);

    streamRequest({
      question: questionData.question,
      userAnswer: questionData.userAnswer,
      correctAnswers: questionData.correctAnswers,
      explanation: questionData.explanation,
    });

    return () => {
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Send follow-up message                                            */
  /* ------------------------------------------------------------------ */
  const handleSend = useCallback(
    async (directMessage?: string) => {
      const msg = directMessage || input.trim();
      if (!msg || isLoading || isLimitReached) return;
      setInput("");

      if (getTutorUsage().count >= DAILY_LIMIT) {
        setMessages((prev) => [
          ...prev,
          { role: "user", content: msg },
          {
            role: "assistant",
            content: `Tägliches Limit erreicht (${DAILY_LIMIT}/${DAILY_LIMIT}). Morgen kannst du wieder fragen! 📚`,
          },
        ]);
        setUsageCount(DAILY_LIMIT);
        return;
      }

      const newCount = incrementTutorUsage();
      setUsageCount(newCount);

      const userMessage: Message = { role: "user", content: msg };
      const newMessages: Message[] = [...messages, userMessage];

      // Optimistically add user message, then stream assistant reply
      setMessages(newMessages);

      await streamRequest(
        {
          question: questionData.question,
          userAnswer: questionData.userAnswer,
          correctAnswers: questionData.correctAnswers,
          explanation: questionData.explanation,
          chatHistory: newMessages.map((m) => ({ role: m.role, content: m.content })),
        },
        newMessages
      );
    },
    [input, isLoading, isLimitReached, messages, questionData, streamRequest]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="mt-4 rounded-2xl border border-purple-500/20 bg-surface/80 backdrop-blur-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <span className="text-sm font-semibold">AI-Tutor</span>
            <span className="text-[10px] text-muted ml-2">
              {usageCount}/{DAILY_LIMIT} heute
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-surface-light transition-colors text-muted hover:text-foreground"
          aria-label="AI-Tutor schließen"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div
        className="h-[240px] overflow-y-auto px-5 py-4 space-y-3"
        role="log"
        aria-live="polite"
        aria-label="AI-Tutor Nachrichten"
      >
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : ""}`}
          >
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="h-3.5 w-3.5 text-purple-400" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-white rounded-br-md"
                  : "bg-surface-lighter text-foreground rounded-bl-md"
              }`}
            >
              {msg.role === "assistant" ? (
                <>
                  {renderTutorMessage(msg.content)}
                  {msg.streaming && msg.content.length > 0 && (
                    <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-purple-400 animate-pulse rounded-sm align-middle" />
                  )}
                </>
              ) : (
                msg.content
              )}
            </div>
          </motion.div>
        ))}

        {/* Initial loading (before first chunk arrives) */}
        {isLoading && messages.every((m) => m.content.length === 0 || !m.streaming) && (
          <div className="flex gap-2.5">
            <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
              <Bot className="h-3.5 w-3.5 text-purple-400" />
            </div>
            <div className="bg-surface-lighter rounded-xl rounded-bl-md px-4 py-3">
              <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border">
        {isLimitReached ? (
          <div className="text-center text-xs text-muted py-2">
            Tägliches Limit erreicht ({DAILY_LIMIT}/{DAILY_LIMIT}) — morgen wieder verfügbar 📚
          </div>
        ) : (
          <>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <label htmlFor="tutor-input" className="sr-only">
                Frage an den AI-Tutor
              </label>
              <input
                id="tutor-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Frag den AI-Tutor..."
                className="flex-1 rounded-xl border border-border bg-surface-light px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-colors"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`p-2.5 rounded-xl transition-all ${
                  input.trim() && !isLoading
                    ? "bg-purple-500 text-white hover:bg-purple-600"
                    : "bg-surface-lighter text-muted cursor-not-allowed"
                }`}
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <div className="flex gap-2 mt-2">
              {["Warum genau?", "Beispiel bitte?", "Merkregel?", "Erkläre das einfacher"].map(
                (suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSend(suggestion)}
                    disabled={isLoading}
                    className={`text-[10px] px-2 py-1 rounded-full border transition-all truncate ${
                      isLoading
                        ? "text-muted/50 border-border/50 cursor-not-allowed"
                        : "text-muted hover:text-foreground border-border hover:bg-surface-light"
                    }`}
                  >
                    {suggestion}
                  </button>
                )
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
