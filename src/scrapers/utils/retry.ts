import { log } from "./logger";

/**
 * Execute an async function with retry logic and exponential backoff.
 *
 * Retries the function up to maxRetries times, with delays that double
 * on each attempt (baseDelay, baseDelay*2, baseDelay*4, ...).
 *
 * @param fn - Async function to execute
 * @param maxRetries - Maximum number of attempts (default: 3)
 * @param baseDelay - Initial delay in milliseconds (default: 1000)
 * @returns The result of the function on success
 * @throws The last error if all attempts fail
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) {
        log("error", "All retry attempts failed", {
          attempts: maxRetries,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      log("warn", `Attempt ${attempt + 1} failed, retrying in ${delay}ms`, {
        attempt: attempt + 1,
        maxRetries,
        delay,
        error: error instanceof Error ? error.message : String(error),
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // TypeScript requires this, but it's unreachable
  throw new Error("Retry failed");
}
