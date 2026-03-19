import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("firebase-admin/app", () => ({
  getApps: () => [{}],
  initializeApp: vi.fn(),
}));

const verifyTokenMock = vi.fn().mockResolvedValue({ appId: "test" });
vi.mock("firebase-admin/app-check", () => ({
  getAppCheck: () => ({ verifyToken: verifyTokenMock }),
}));

import { handleFeedProxy, ALLOWED_FEED_URLS } from "../src/feed-proxy";
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
    verifyTokenMock.mockRejectedValue(new Error("invalid"));
    const res = createMockRes();
    await handleFeedProxy(createMockReq({}), res as never);
    expect(res.statusCode).toBe(401);
    expect(res.body).toBe(
      "Unauthorized: invalid or missing AppCheck token",
    );
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
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(feedXml),
        headers: new Headers({ "content-type": "application/atom+xml" }),
      }),
    );

    const allowedUrl = [...ALLOWED_FEED_URLS][0];
    const res = createMockRes();
    await handleFeedProxy(createMockReq({ url: allowedUrl }), res as never);

    expect(fetch).toHaveBeenCalledWith(allowedUrl, {
      headers: { "User-Agent": "commons-systems-feed-proxy/1.0" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe(feedXml);
    expect(res.headers["Content-Type"]).toBe("application/atom+xml");
    expect(res.headers["Cache-Control"]).toBe("public, max-age=3600");
  });

  it("defaults content-type to application/xml when upstream omits it", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve("<feed/>"),
        headers: new Headers(),
      }),
    );

    const allowedUrl = [...ALLOWED_FEED_URLS][0];
    const res = createMockRes();
    await handleFeedProxy(createMockReq({ url: allowedUrl }), res as never);

    expect(res.headers["Content-Type"]).toBe("application/xml");
  });

  it("forwards upstream error status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        headers: new Headers(),
      }),
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
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.reject(new Error("body stream interrupted")),
        headers: new Headers(),
      }),
    );

    const allowedUrl = [...ALLOWED_FEED_URLS][0];
    const res = createMockRes();
    await handleFeedProxy(createMockReq({ url: allowedUrl }), res as never);

    expect(res.statusCode).toBe(502);
    expect(res.body).toBe(
      "Failed to read upstream response body: body stream interrupted",
    );
  });

  it("ALLOWED_FEED_URLS matches feed registry", () => {
    const registryUrls = new Set(FEED_REGISTRY.map((f) => f.feedUrl));
    expect(ALLOWED_FEED_URLS).toEqual(registryUrls);
  });
});
