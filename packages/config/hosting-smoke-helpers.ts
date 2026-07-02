import type { APIRequestContext, APIResponse } from "@playwright/test";

/**
 * True when an error/response message indicates a transient failure worth
 * retrying: HTTP 429, any HTTP 5xx, a rate-limit / availability phrase, or a
 * Playwright timeout/hang shape. Mirrors `isTransientGhError` in
 * `packages/intentionsutil/scripts/backfill.ts`, extended with the
 * timeout/deadline vocabulary Playwright's request context surfaces when a
 * per-request `{ timeout }` fires. A deterministic failure (e.g. HTTP 404) is
 * NOT transient — it must fail unmasked so a real regression is not hidden.
 */
export function isTransientError(message: string): boolean {
  return /HTTP 429|HTTP 5\d\d|Service Unavailable|Bad Gateway|ECONNRESET|connection reset|secondary rate limit|abuse detection|retry your request|temporarily unavailable|i\/o timeout|deadline exceeded|TLS handshake|Timeout|timed out|exceeded/i.test(
    message,
  );
}

/** Parse a positive-int env knob with a safe fallback (mirrors backfill.ts's
 * `parseInt(...) || N` guard — used for attempts/timeout where 0 is illegal). */
function envInt(name: string, fallback: number): number {
  return parseInt(process.env[name] ?? String(fallback), 10) || fallback;
}

/** Parse a non-negative-int env knob where 0 is a legal value (delay), so a
 * `|| fallback` guard must NOT swallow it. Mirrors backfill.ts's `Number(...)`
 * for base delay. Falls back only when the value is not a finite number. */
function envIntAllowingZero(name: string, fallback: number): number {
  const parsed = Number(process.env[name] ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Per-request timeout (ms) so a hang throws a catchable Playwright
 * TimeoutError EARLY — before the test-scoped request context is disposed. */
function requestTimeoutMs(): number {
  return envInt("HOSTING_SMOKE_REQUEST_TIMEOUT_MS", 10000);
}

export interface RetryOpts {
  attempts?: number;
  delayMs?: number;
}

/**
 * Retry a single fetch, but ONLY on transient signals:
 *   - the RESOLVED response has a 5xx status (`[500, 600)`), or
 *   - `doFetch()` THROWS an error whose `.message` matches `isTransientError`.
 *
 * A `<500` resolved response is returned immediately (no retry) — a genuine
 * 200-with-wrong-header or a 404 must fail unmasked. A non-transient throw is
 * rethrown immediately for the same reason.
 *
 * On exhaustion: the status path returns the last 5xx response (so the
 * caller's `expect(status).toBe(200)` fails downstream); the throw path
 * rethrows the last transient error, augmented with the attempt count.
 *
 * Backoff is async with exponential doubling. Knobs default from the
 * environment per-call (HOSTING_SMOKE_RETRY_ATTEMPTS=4,
 * HOSTING_SMOKE_RETRY_DELAY_MS=500); `opts` overrides env.
 */
export async function fetchWithRetry(
  doFetch: () => Promise<APIResponse>,
  opts: RetryOpts = {},
): Promise<APIResponse> {
  const attempts = Math.max(
    1,
    opts.attempts ?? envInt("HOSTING_SMOKE_RETRY_ATTEMPTS", 4),
  );
  const delayMs =
    opts.delayMs ?? envIntAllowingZero("HOSTING_SMOKE_RETRY_DELAY_MS", 500);

  let lastResponse: APIResponse | undefined;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    let response: APIResponse | undefined;
    try {
      response = await doFetch();
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : String(err);
      if (attempt < attempts && isTransientError(message)) {
        await sleep(delayMs * 2 ** (attempt - 1));
        continue;
      }
      // Non-transient, or transient budget exhausted.
      if (isTransientError(message)) {
        throw new Error(
          `fetchWithRetry: transient error persisted after ${attempts} attempt(s): ${message}`,
          { cause: err },
        );
      }
      throw err;
    }

    lastResponse = response;
    if (response.status() >= 500 && response.status() < 600) {
      if (attempt < attempts) {
        await sleep(delayMs * 2 ** (attempt - 1));
        continue;
      }
      // Budget exhausted — return the last 5xx so the caller's assertion fails.
      return response;
    }
    // <500: return immediately, no retry.
    return response;
  }

  // Unreachable in practice: the loop always returns or throws. Guard for types.
  if (lastResponse) return lastResponse;
  throw lastError ?? new Error("fetchWithRetry: no attempts were made");
}

/** Async sleep. Do NOT use Atomics.wait — this runs inside async Playwright. */
function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * GET `url` through `fetchWithRetry` with a bounded per-request timeout so a
 * hang throws early and can be retried within budget.
 */
export function getWithRetry(
  request: APIRequestContext,
  url: string,
): Promise<APIResponse> {
  const timeout = requestTimeoutMs();
  return fetchWithRetry(() => request.get(url, { timeout }));
}

/** HEAD `url` through `fetchWithRetry`; see `getWithRetry`. */
export function headWithRetry(
  request: APIRequestContext,
  url: string,
): Promise<APIResponse> {
  const timeout = requestTimeoutMs();
  return fetchWithRetry(() => request.head(url, { timeout }));
}

/**
 * Discover the content-hashed entry asset from the deployed index HTML.
 *
 * The hashed asset filename is unknowable from the URL, so this performs the
 * one unavoidable small-body GET of `/`. The index response is returned so
 * callers can reuse it (e.g. to assert the index's own headers) without a
 * second fetch.
 */
export async function getEntryAsset(
  request: APIRequestContext,
): Promise<{ indexResponse: APIResponse; entryAssetUrl: string }> {
  const indexResponse = await getWithRetry(request, "/");
  if (indexResponse.status() !== 200) {
    throw new Error(
      `GET / returned status ${indexResponse.status()}, expected 200`,
    );
  }

  const html = await indexResponse.text();

  const scriptMatch = html.match(/src="(\/assets\/[^"]+\.js)"/);
  const styleMatch = html.match(/href="(\/assets\/[^"]+\.css)"/);
  const entryAssetUrl = scriptMatch?.[1] ?? styleMatch?.[1];

  if (!entryAssetUrl) {
    throw new Error(
      'No content-hashed entry asset found in index HTML: searched for a ' +
        'script src="/assets/*.js" then a stylesheet href="/assets/*.css"',
    );
  }

  return { indexResponse, entryAssetUrl };
}
