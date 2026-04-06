/**
 * Structured logger for production (JSON) and development (human-readable).
 *
 * Usage:
 *   const log = createLogger("crm");
 *   log.info("Schüler erstellt", { schuelerId, tenantId });
 *   log.error("Fehler", { error: err.message });
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  component: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

const isProd = process.env.NODE_ENV === "production";

function emit(entry: LogEntry): void {
  if (isProd) {
    // Structured JSON — compatible with Vercel log drains
    const line = JSON.stringify(entry);
    if (entry.level === "error") {
      console.error(line);
    } else if (entry.level === "warn") {
      console.warn(line);
    } else {
      console.log(line);
    }
  } else {
    // Human-readable for local dev
    const prefix = `[${entry.component.toUpperCase()}]`;
    const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : "";
    const msg = `${prefix} ${entry.message}${dataStr}`;

    if (entry.level === "error") console.error(msg);
    else if (entry.level === "warn") console.warn(msg);
    else if (entry.level === "debug") console.debug(msg);
    else console.log(msg);
  }
}

export interface Logger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
}

export function createLogger(component: string): Logger {
  const log = (level: LogLevel) => (message: string, data?: Record<string, unknown>) => {
    emit({ level, component, message, data, timestamp: new Date().toISOString() });
  };

  return {
    debug: log("debug"),
    info: log("info"),
    warn: log("warn"),
    error: log("error"),
  };
}
