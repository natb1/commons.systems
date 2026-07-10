import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("firebase-admin/app", () => ({
  getApps: () => [{}],
  initializeApp: vi.fn(),
}));

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: vi.fn(),
  FieldValue: { serverTimestamp: () => "__server_timestamp__" },
}));

import { getFirestore } from "firebase-admin/firestore";
import { handleWebmention, mentionId, OWNED_TARGET_HOSTS } from "../src/webmention";

// ---- in-memory Firestore stub (mirrors project-signals.test.ts) ----
function createInMemoryFirestore() {
  const docs = new Map<string, Record<string, unknown>>();
  const doc = (path: string) => ({
    path,
    set: (data: Record<string, unknown>) => {
      docs.set(path, data);
      return Promise.resolve();
    },
  });
  const collection = (path: string) => ({
    doc: (id: string) => doc(`${path}/${id}`),
  });
  return { doc, collection, _docs: docs };
}

function useStore() {
  const store = createInMemoryFirestore();
  vi.mocked(getFirestore).mockReturnValue(store as never); // type-safety-ok: in-memory stub stands in for the firebase-admin Firestore
  return store;
}

function createMockRes() {
  const res = {
    statusCode: 200,
    body: "",
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    send(body: string) {
      res.body = body;
      return res;
    },
  };
  return res;
}

function createMockReq(opts: {
  method?: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
}) {
  const method = opts.method ?? "POST";
  const headers = opts.headers ?? {
    "content-type": "application/x-www-form-urlencoded",
  };
  const body = opts.body ?? {};
  return {
    method,
    header: (name: string) => headers[name.toLowerCase()],
    body,
  };
}

// Drives the handler with the mock request/response doubles. The single
// suppressed cast here keeps every call site cast-free.
async function invoke(
  req: ReturnType<typeof createMockReq>,
  res: ReturnType<typeof createMockRes>,
) {
  await handleWebmention(req as never, res as never); // type-safety-ok: mock req/res doubles satisfy the shape the handler reads
}

const VALID = {
  source: "https://example.com/post",
  target: "https://commons.systems/post/y",
};

function urlencodedReq(body: Record<string, unknown>) {
  return createMockReq({ body });
}

describe("handleWebmention", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useStore();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("returns 405 for non-POST methods", async () => {
    const res = createMockRes();
    await invoke(createMockReq({ method: "GET" }), res);
    expect(res.statusCode).toBe(405);
  });

  it("returns 400 when content-type is not form-urlencoded", async () => {
    const res = createMockRes();
    await invoke(
      createMockReq({ headers: { "content-type": "application/json" }, body: VALID }),
      res,
    );
    expect(res.statusCode).toBe(400);
    expect(res.body).toContain("application/x-www-form-urlencoded");
  });

  it("accepts a charset suffix on the content-type", async () => {
    // Reaches the param stage (would 400 for a missing param) rather than
    // rejecting the content-type outright.
    const res = createMockRes();
    await invoke(
      createMockReq({
        headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8" },
        body: {},
      }),
      res,
    );
    expect(res.statusCode).toBe(400);
    expect(res.body).toContain("Missing required form parameters");
  });

  it("returns 400 when source is missing", async () => {
    const res = createMockRes();
    await invoke(urlencodedReq({ target: VALID.target }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body).toContain("Missing required form parameters");
  });

  it("returns 400 when target is missing", async () => {
    const res = createMockRes();
    await invoke(urlencodedReq({ source: VALID.source }), res);
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 when source is not a valid URL", async () => {
    const res = createMockRes();
    await invoke(urlencodedReq({ source: "not-a-url", target: VALID.target }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body).toContain("source must be an http(s) URL");
  });

  it("returns 400 when source uses a non-http(s) scheme", async () => {
    const res = createMockRes();
    await invoke(
      urlencodedReq({ source: "ftp://example.com/x", target: VALID.target }),
      res,
    );
    expect(res.statusCode).toBe(400);
    expect(res.body).toContain("source must be an http(s) URL");
  });

  it("returns 400 when target uses a non-http(s) scheme", async () => {
    const res = createMockRes();
    await invoke(
      urlencodedReq({ source: VALID.source, target: "javascript:alert(1)" }),
      res,
    );
    expect(res.statusCode).toBe(400);
    expect(res.body).toContain("target must be an http(s) URL");
  });

  it("returns 400 when source equals target", async () => {
    const same = "https://commons.systems/post/y";
    const res = createMockRes();
    await invoke(urlencodedReq({ source: same, target: same }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body).toContain("must differ");
  });

  it("returns 400 when target host is not an owned publication surface", async () => {
    const res = createMockRes();
    await invoke(
      urlencodedReq({ source: VALID.source, target: "https://evil.example.com/x" }),
      res,
    );
    expect(res.statusCode).toBe(400);
    expect(res.body).toContain("commons.systems");
  });

  it("advertises both owned hosts", () => {
    expect(OWNED_TARGET_HOSTS).toContain("commons.systems");
    expect(OWNED_TARGET_HOSTS).toContain("fellspiral.commons.systems");
  });

  it("returns 400 when the source fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("DNS failure")));
    const res = createMockRes();
    await invoke(urlencodedReq(VALID), res);
    expect(res.statusCode).toBe(400);
    expect(res.body).not.toContain("DNS");
  });

  it("returns 400 when the source responds non-ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("nope", { status: 404 })),
    );
    const res = createMockRes();
    await invoke(urlencodedReq(VALID), res);
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 when the source body does not link to target", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("<html>no link here</html>", { status: 200 }),
      ),
    );
    const res = createMockRes();
    await invoke(urlencodedReq(VALID), res);
    expect(res.statusCode).toBe(400);
    expect(res.body).toContain("Source does not contain a link to target");
  });

  it("returns 202 and stores the mention when the source links to target", async () => {
    const store = useStore();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          `<html><a href="${VALID.target}">reply</a></html>`,
          { status: 200 },
        ),
      ),
    );
    const res = createMockRes();
    await invoke(urlencodedReq(VALID), res);

    expect(fetch).toHaveBeenCalledWith(VALID.source, {
      headers: { "User-Agent": "commons-systems-webmention/1.0" },
      signal: expect.any(AbortSignal),
    });
    expect(res.statusCode).toBe(202);

    const expectedPath = `webmentions/prod/mentions/${mentionId(VALID.source, VALID.target)}`;
    const stored = store._docs.get(expectedPath);
    expect(stored).toBeDefined();
    expect(stored).toMatchObject({
      source: VALID.source,
      target: VALID.target,
      receivedAt: "__server_timestamp__",
    });
  });

  it("is idempotent: re-sending the same (source, target) overwrites one doc", async () => {
    const store = useStore();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          `<html><a href="${VALID.target}">reply</a></html>`,
          { status: 200 },
        ),
      ),
    );
    await invoke(urlencodedReq(VALID), createMockRes());
    await invoke(urlencodedReq(VALID), createMockRes());
    expect(store._docs.size).toBe(1);
  });

  it("mentionId is a stable hex digest of source|target", () => {
    const id1 = mentionId(VALID.source, VALID.target);
    const id2 = mentionId(VALID.source, VALID.target);
    expect(id1).toBe(id2);
    expect(id1).toMatch(/^[0-9a-f]{64}$/);
    expect(mentionId("https://a.example/1", VALID.target)).not.toBe(id1);
  });
});
