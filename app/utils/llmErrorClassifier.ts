/**
 * Classify LLM provider errors for routing: no retry, cooldown, disable, or retry with backoff.
 * Does NOT expose raw messages to the client.
 */

export type ErrorCategory =
  | "rate_limit"   // 429 TPD / rate limit -> cooldown, next provider
  | "auth"         // 401 invalid_api_key -> disable 10 min, next provider
  | "timeout"      // timeout -> retry once with backoff then next provider
  | "server"      // 5xx / network -> retry once with backoff then next provider
  | "context"     // context length -> reduce and retry once
  | "unknown";    // fallback to next provider

export interface ClassifiedError {
  category: ErrorCategory;
  retryAfterSeconds?: number;
  requestId?: string;
}

function getMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function getStatus(err: unknown): number | undefined {
  if (err && typeof err === "object" && "status" in err && typeof (err as { status: number }).status === "number") {
    return (err as { status: number }).status;
  }
  const res = (err as { response?: { status?: number } })?.response;
  if (res && typeof res.status === "number") return res.status;
  return undefined;
}

function getHeaders(err: unknown): Headers | undefined {
  if (err && typeof err === "object" && "headers" in err && (err as { headers: unknown }).headers instanceof Headers) {
    return (err as { headers: Headers }).headers;
  }
  const res = (err as { response?: { headers?: Headers } })?.response;
  if (res?.headers instanceof Headers) return res.headers;
  return undefined;
}

/** Parse Retry-After (seconds) from error headers if present. */
function getRetryAfter(err: unknown): number | undefined {
  const headers = getHeaders(err);
  if (!headers) return undefined;
  const ra = headers.get("retry-after");
  if (ra == null) return undefined;
  const n = parseInt(ra, 10);
  if (!Number.isNaN(n)) return Math.min(n, 600); // cap 10 min
  return undefined;
}

export function classifyError(err: unknown): ClassifiedError {
  const message = getMessage(err).toLowerCase();
  const status = getStatus(err);
  const retryAfterSeconds = getRetryAfter(err);

  if (status === 429 || /rate limit|rate_limit|quota|overloaded|tpd/i.test(message)) {
    return { category: "rate_limit", retryAfterSeconds };
  }
  if (status === 401 || /incorrect api key|invalid_api_key|authentication|invalid api key/i.test(message)) {
    return { category: "auth" };
  }
  if (status && status >= 500) {
    return { category: "server" };
  }
  if (/timeout|timed out|etimedout/i.test(message)) {
    return { category: "timeout" };
  }
  if (/context length|maximum context|token limit|too many tokens/i.test(message)) {
    return { category: "context" };
  }

  return { category: "unknown", retryAfterSeconds };
}
