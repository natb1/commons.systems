import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("firebase-admin/app", () => ({
  getApps: () => [{}],
  initializeApp: vi.fn(),
}));

const verifyTokenMock = vi.fn().mockResolvedValue({ appId: "test" });
vi.mock("firebase-admin/app-check", () => ({
  getAppCheck: () => ({ verifyToken: verifyTokenMock }),
}));

import { handleFeedProxy, ALLOWED_FEED_URLS, MAX_FEED_BYTES } from "../src/feed-proxy";
import { FEED_REGISTRY } from "../../blog/src/blog-roll/feed-registry";

function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: "",
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    send(body: string) {
      res.body = body;
      return res;
    },
    set(key: string, value: string) {
      res.headers[key] = value;
      return res;
    },
  };
  return res;
}

function createMockReq(
  query: Record<string, string | undefined> = {},
  headers: Record<string, string> = { "X-Firebase-AppCheck": "valid-token" },
) {
  return {
    query,
    header: (name: string) => headers[name],
  } as unknown as Parameters<typeof handleFeedProxy>[0];
}

describe("handleFeedProxy", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    verifyTokenMock.mockResolvedValue({ appId: "test" });
  });

  it("returns 401 when AppCheck token is missing", async () => {
    const res = createMockRes();
    await handleFeedProxy(createMockReq({}, {}), res as never);
    expect(res.statusCode).toBe(401);
    expect(res.body).toBe(
      "Unauthorized: invalid or missing AppCheck token",
    );
  });

  it("returns 401 when AppCheck token is invalid", async () => {
    const err = new Error("invalid") as Error & { code: string };
    err.code = "app-check/invalid-token";
    verifyTokenMock.mockRejectedValue(err);
    const res = createMockRes();
    await handleFeedProxy(createMockReq({}), res as never);
    expect(res.statusCode).toBe(401);
    expect(res.body).toBe(
      "Unauthorized: invalid or missing AppCheck token",
    );
  });

  it("throws on infrastructure error in verifyAppCheck", async () => {
    verifyTokenMock.mockRejectedValue(new Error("network timeout"));
    const res = createMockRes();
    await expect(
      handleFeedProxy(createMockReq({}), res as never),
    ).rejects.toThrow("network timeout");
  });

  it("returns 400 when url query parameter is missing", async () => {
    const res = createMockRes();
    await handleFeedProxy(createMockReq({}), res as never);
    expect(res.statusCode).toBe(400);
    expect(res.body).toBe("Missing required query parameter: url");
  });

  it("returns 400 when url query parameter is empty string", async () => {
    const res = createMockRes();
    await handleFeedProxy(createMockReq({ url: "" }), res as never);
    expect(res.statusCode).toBe(400);
    expect(res.body).toBe("Missing required query parameter: url");
  });

  it("returns 403 for URLs not in the allowlist", async () => {
    const res = createMockRes();
    await handleFeedProxy(
      createMockReq({ url: "https://evil.example.com/feed" }),
      res as never,
    );
    expect(res.statusCode).toBe(403);
    expect(res.body).toBe("URL not in allowlist");
  });

  it("proxies allowed URL and sets cache headers", async () => {
    const feedXml = "<feed><entry>test</entry></feed>";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(feedXml, {
          status: 200,
          headers: { "content-type": "application/atom+xml" },
        }),
      ),
    );

    const allowedUrl = [...ALLOWED_FEED_URLS][0];
    const res = createMockRes();
    await handleFeedProxy(createMockReq({ url: allowedUrl }), res as never);

    expect(fetch).toHaveBeenCalledWith(allowedUrl, {
      headers: { "User-Agent": "commons-systems-feed-proxy/1.0" },
      redirect: "manual",
      signal: expect.any(AbortSignal),
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe(feedXml);
    expect(res.headers["Content-Type"]).toBe("application/atom+xml");
    expect(res.headers["Cache-Control"]).toBe("public, max-age=3600");
  });

  it("defaults content-type to application/xml when upstream omits it", async () => {
    // Use a ReadableStream body so Response does not auto-set a content-type
    // header — that keeps upstream.headers.get("content-type") null and lets
    // the production "?? application/xml" fallback fire.
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode("<feed/>"));
        controller.close();
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(stream, { status: 200 })),
    );

    const allowedUrl = [...ALLOWED_FEED_URLS][0];
    const res = createMockRes();
    await handleFeedProxy(createMockReq({ url: allowedUrl }), res as never);

    expect(res.headers["Content-Type"]).toBe("application/xml");
  });

  it("forwards upstream error status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 502 })),
    );

    const allowedUrl = [...ALLOWED_FEED_URLS][0];
    const res = createMockRes();
    await handleFeedProxy(createMockReq({ url: allowedUrl }), res as never);

    expect(res.statusCode).toBe(502);
    expect(res.body).toBe("Upstream returned 502");
  });

  it("returns 502 when reading upstream response body fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          new ReadableStream({
            start(controller) {
              controller.error(new Error("body stream interrupted"));
            },
          }),
          { status: 200, headers: { "content-type": "application/xml" } },
        ),
      ),
    );

    const allowedUrl = [...ALLOWED_FEED_URLS][0];
    const res = createMockRes();
    await handleFeedProxy(createMockReq({ url: allowedUrl }), res as never);

    expect(res.statusCode).toBe(502);
    expect(res.body).toBe("Failed to read upstream response body");
    expect(res.body).not.toContain("body stream interrupted");
  });

  it("rejects redirect (SSRF protection) with 502 and does not fall through to status-0 message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        type: "opaqueredirect",
        status: 0,
        ok: false,
        body: null,
        headers: new Headers(),
      }),
    );

    const allowedUrl = [...ALLOWED_FEED_URLS][0];
    const res = createMockRes();
    await handleFeedProxy(createMockReq({ url: allowedUrl }), res as never);

    expect(res.statusCode).toBe(502);
    expect(res.body).toBe("Upstream returned a redirect, which is not allowed");
    expect(res.body).not.toBe("Upstream returned 0");
  });

  it("returns 502 when upstream body exceeds MAX_FEED_BYTES", async () => {
    // Enqueue 64 KB chunks lazily via pull() so the reader's early cancel()
    // stops production — no large allocation needed.
    const CHUNK_SIZE = 64 * 1024;
    const chunksNeeded = Math.ceil(MAX_FEED_BYTES / CHUNK_SIZE) + 1;
    let pulled = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (pulled >= chunksNeeded) {
          controller.close();
          return;
        }
        controller.enqueue(new Uint8Array(CHUNK_SIZE).fill(0x41));
        pulled++;
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(stream, {
          status: 200,
          headers: { "content-type": "application/xml" },
        }),
      ),
    );

    const allowedUrl = [...ALLOWED_FEED_URLS][0];
    const res = createMockRes();
    await handleFeedProxy(createMockReq({ url: allowedUrl }), res as never);

    expect(res.statusCode).toBe(502);
    expect(res.body).toBe("Upstream feed exceeded maximum allowed size");
  });

  it("returns 200 when upstream body is exactly MAX_FEED_BYTES (cap is inclusive)", async () => {
    // Exactly at the cap: total === MAX_FEED_BYTES, which the strict `>`
    // comparison in feed-proxy.ts admits. Pins the boundary as inclusive — a
    // regression from `>` to `>=` would reject this and fail the test.
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(MAX_FEED_BYTES).fill(0x41));
        controller.close();
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(stream, {
          status: 200,
          headers: { "content-type": "application/xml" },
        }),
      ),
    );

    const allowedUrl = [...ALLOWED_FEED_URLS][0];
    const res = createMockRes();
    await handleFeedProxy(createMockReq({ url: allowedUrl }), res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(MAX_FEED_BYTES);
  });

  it("returns 502 with generic message when fetch throws (no error leak)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("DNS resolution failed")),
    );

    const allowedUrl = [...ALLOWED_FEED_URLS][0];
    const res = createMockRes();
    await handleFeedProxy(createMockReq({ url: allowedUrl }), res as never);

    expect(res.statusCode).toBe(502);
    expect(res.body).toBe("Failed to fetch upstream feed");
    expect(res.body).not.toContain("DNS");
  });

  it("returns 502 with clear message when upstream returns null body on ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 200 })),
    );

    const allowedUrl = [...ALLOWED_FEED_URLS][0];
    const res = createMockRes();
    await handleFeedProxy(createMockReq({ url: allowedUrl }), res as never);

    expect(res.statusCode).toBe(502);
    expect(res.body).toBe("Upstream returned an empty response body");
  });

  it("ALLOWED_FEED_URLS matches feed registry", () => {
    const registryUrls = new Set(FEED_REGISTRY.map((f) => f.feedUrl));
    expect(ALLOWED_FEED_URLS).toEqual(registryUrls);
  });
});
