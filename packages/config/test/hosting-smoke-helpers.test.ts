import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { APIRequestContext, APIResponse } from "@playwright/test";
import {
  getEntryAsset,
  fetchWithRetry,
  getWithRetry,
  headWithRetry,
  isTransientError,
} from "../hosting-smoke-helpers.js";

const INDEX_HTML =
  '<!doctype html><html><head>' +
  '<script type="module" src="/assets/index-abc123.js"></script>' +
  "</head><body></body></html>";

/** Minimal fake APIResponse exposing the surface the helpers touch. */
function fakeResponse(status: number, body = INDEX_HTML): APIResponse {
  return {
    status: () => status,
    text: async () => body,
  } as unknown as APIResponse;
}

type Step = APIResponse | (() => never);

/** A scripted request context: `.get`/`.head` walk a per-call sequence and
 * record the options object each call received. A step that is a function is
 * invoked (used to throw). */
function fakeRequest(steps: Step[]): {
  request: APIRequestContext;
  getCalls: unknown[];
  headCalls: unknown[];
} {
  const getCalls: unknown[] = [];
  const headCalls: unknown[] = [];
  let i = 0;
  const next = (options: unknown, record: unknown[]): Promise<APIResponse> => {
    record.push(options);
    const step = steps[Math.min(i, steps.length - 1)];
    i++;
    if (typeof step === "function") {
      // Throw synchronously-in-promise so fetchWithRetry's catch handles it.
      return Promise.resolve().then(() => step());
    }
    return Promise.resolve(step);
  };
  const request = {
    get: (_url: string, options?: unknown) => next(options, getCalls),
    head: (_url: string, options?: unknown) => next(options, headCalls),
  } as unknown as APIRequestContext;
  return { request, getCalls, headCalls };
}

const throws = (message: string): (() => never) => {
  return () => {
    throw new Error(message);
  };
};

const ORIG = {
  attempts: process.env.HOSTING_SMOKE_RETRY_ATTEMPTS,
  delay: process.env.HOSTING_SMOKE_RETRY_DELAY_MS,
  timeout: process.env.HOSTING_SMOKE_REQUEST_TIMEOUT_MS,
};

beforeEach(() => {
  process.env.HOSTING_SMOKE_RETRY_DELAY_MS = "0"; // instant retries
  delete process.env.HOSTING_SMOKE_RETRY_ATTEMPTS; // default 4 unless a case sets it
  delete process.env.HOSTING_SMOKE_REQUEST_TIMEOUT_MS; // default 10000
});

afterEach(() => {
  restore("HOSTING_SMOKE_RETRY_ATTEMPTS", ORIG.attempts);
  restore("HOSTING_SMOKE_RETRY_DELAY_MS", ORIG.delay);
  restore("HOSTING_SMOKE_REQUEST_TIMEOUT_MS", ORIG.timeout);
});

function restore(name: string, value: string | undefined): void {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

describe("getEntryAsset with retry", () => {
  it("retries a transient 503 then resolves (case 1)", async () => {
    const { request, getCalls } = fakeRequest([
      fakeResponse(503),
      fakeResponse(200),
    ]);
    const { entryAssetUrl } = await getEntryAsset(request);
    expect(entryAssetUrl).toBe("/assets/index-abc123.js");
    expect(getCalls).toHaveLength(2);
  });

  it("returns the last 503 after exhausting the budget → throws non-200 (case 2)", async () => {
    process.env.HOSTING_SMOKE_RETRY_ATTEMPTS = "4";
    const { request, getCalls } = fakeRequest([fakeResponse(503)]);
    await expect(getEntryAsset(request)).rejects.toThrow(/status 503/);
    expect(getCalls).toHaveLength(4);
  });

  it("retries a transient throw (timeout) then resolves (case 3)", async () => {
    const { request, getCalls } = fakeRequest([
      throws("Request timed out"),
      fakeResponse(200),
    ]);
    const { entryAssetUrl } = await getEntryAsset(request);
    expect(entryAssetUrl).toBe("/assets/index-abc123.js");
    expect(getCalls).toHaveLength(2);
  });

  it("retries a transient throw (ECONNRESET) then resolves (case 3b)", async () => {
    const { request, getCalls } = fakeRequest([
      throws("read ECONNRESET"),
      fakeResponse(200),
    ]);
    const { entryAssetUrl } = await getEntryAsset(request);
    expect(entryAssetUrl).toBe("/assets/index-abc123.js");
    expect(getCalls).toHaveLength(2);
  });

  it("rejects after exhausting a persistent transient throw (case 4)", async () => {
    process.env.HOSTING_SMOKE_RETRY_ATTEMPTS = "4";
    const { request, getCalls } = fakeRequest([throws("Request timed out")]);
    await expect(getEntryAsset(request)).rejects.toThrow(/attempt/i);
    expect(getCalls).toHaveLength(4);
  });

  it("does NOT retry a 404 — one call, non-200 throw (case 5a)", async () => {
    const { request, getCalls } = fakeRequest([
      fakeResponse(404),
      fakeResponse(200),
    ]);
    await expect(getEntryAsset(request)).rejects.toThrow(/status 404/);
    expect(getCalls).toHaveLength(1);
  });
});

describe("fetchWithRetry", () => {
  it("rethrows a non-transient error immediately — one call (case 5b)", async () => {
    let calls = 0;
    const doFetch = (): Promise<APIResponse> => {
      calls++;
      throw new Error("boom");
    };
    await expect(
      fetchWithRetry(doFetch, { delayMs: 0 }),
    ).rejects.toThrow("boom");
    expect(calls).toBe(1);
  });

  it("returns a <500 response immediately without retrying", async () => {
    let calls = 0;
    const doFetch = (): Promise<APIResponse> => {
      calls++;
      return Promise.resolve(fakeResponse(404));
    };
    const res = await fetchWithRetry(doFetch, { delayMs: 0 });
    expect(res.status()).toBe(404);
    expect(calls).toBe(1);
  });

  it("returns the last 5xx after exhausting attempts", async () => {
    let calls = 0;
    const doFetch = (): Promise<APIResponse> => {
      calls++;
      return Promise.resolve(fakeResponse(500));
    };
    const res = await fetchWithRetry(doFetch, { attempts: 3, delayMs: 0 });
    expect(res.status()).toBe(500);
    expect(calls).toBe(3);
  });
});

describe("bounded timeout option (case 6)", () => {
  it("getWithRetry passes a positive numeric timeout to request.get", async () => {
    const { request, getCalls } = fakeRequest([fakeResponse(200)]);
    await getWithRetry(request, "/");
    expect(getCalls).toHaveLength(1);
    const opts = getCalls[0] as { timeout?: unknown };
    expect(typeof opts.timeout).toBe("number");
    expect(opts.timeout as number).toBeGreaterThan(0);
  });

  it("headWithRetry passes a positive numeric timeout to request.head", async () => {
    const { request, headCalls } = fakeRequest([fakeResponse(200)]);
    const res = await headWithRetry(request, "/asset.js");
    expect(res.status()).toBe(200);
    expect(headCalls).toHaveLength(1);
    const opts = headCalls[0] as { timeout?: unknown };
    expect(typeof opts.timeout).toBe("number");
    expect(opts.timeout as number).toBeGreaterThan(0);
  });

  it("every wrapped call on retry carries the timeout option", async () => {
    const { request, getCalls } = fakeRequest([
      fakeResponse(503),
      fakeResponse(200),
    ]);
    await getWithRetry(request, "/");
    expect(getCalls).toHaveLength(2);
    for (const opts of getCalls as { timeout?: unknown }[]) {
      expect(typeof opts.timeout).toBe("number");
    }
  });
});

describe("isTransientError (case 7)", () => {
  it.each(["HTTP 503", "ECONNRESET", "Request timed out"])(
    "true for transient %s",
    (msg) => {
      expect(isTransientError(msg)).toBe(true);
    },
  );

  it.each(["boom", "HTTP 404"])("false for non-transient %s", (msg) => {
    expect(isTransientError(msg)).toBe(false);
  });
});
