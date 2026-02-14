type LogLevel = "info" | "warn" | "error";

/**
 * Structured JSON logger for scraper operations.
 * Outputs JSON lines for easy parsing in CI/CD and monitoring.
 * Silent when NODE_ENV=test to avoid noise in test output.
 */
export function log(
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>
): void {
  if (process.env.NODE_ENV === "test") {
    return;
  }

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };

  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}
