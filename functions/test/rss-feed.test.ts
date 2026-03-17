import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleRssFeed } from "../src/rss-feed";

const mockDocs: Array<{ id: string; data: () => Record<string, unknown> }> = [];
let mockGetRejects = false;

vi.mock("firebase-admin/app", () => ({
  getApps: () => [{}],
  initializeApp: vi.fn(),
}));

vi.mock("firebase-admin/firestore", () => {
  const get = vi.fn(() => {
    if (mockGetRejects) return Promise.reject(new Error("Firestore unavailable"));
    return Promise.resolve({ docs: mockDocs });
  });
  const where = vi.fn(() => ({ get }));
  const collection = vi.fn(() => ({ where }));
  return {
    getFirestore: () => ({ collection }),
  };
});

function createMockReq(host?: string) {
  return {
    headers: host ? { "x-forwarded-host": host } : {},
    query: {},
  } as unknown as Parameters<typeof handleRssFeed>[0];
}

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

describe("handleRssFeed", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockDocs.length = 0;
    mockGetRejects = false;
    // Seed two published posts for default test scenarios
    mockDocs.push(
      {
        id: "newer-post",
        data: () => ({
          title: "Newer Post",
          published: true,
          publishedAt: "2026-02-15T00:00:00Z",
          filename: "newer.md",
          previewDescription: "A newer post",
        }),
      },
      {
        id: "older-post",
        data: () => ({
          title: "Older Post",
          published: true,
          publishedAt: "2026-01-10T00:00:00Z",
          filename: "older.md",
        }),
      },
    );
  });

  it("returns 400 with text/plain for unknown host", async () => {
    const res = createMockRes();
    await handleRssFeed(createMockReq("unknown.example.com"), res as never);
    expect(res.statusCode).toBe(400);
    expect(res.headers["Content-Type"]).toBe("text/plain");
  });

  it("returns valid RSS XML for fellspiral host with correct Content-Type and Cache-Control", async () => {
    const res = createMockRes();
    await handleRssFeed(
      createMockReq("fellspiral.commons.systems"),
      res as never,
    );
    expect(res.statusCode).toBe(200);
    expect(res.headers["Content-Type"]).toBe(
      "application/rss+xml; charset=utf-8",
    );
    expect(res.headers["Cache-Control"]).toBe("public, max-age=3600");
    expect(res.body).toContain("<rss");
    expect(res.body).toContain("<title>fellspiral</title>");
    expect(res.body).toContain(
      "<link>https://fellspiral.commons.systems</link>",
    );
  });

  it("returns valid RSS XML for landing host", async () => {
    const res = createMockRes();
    await handleRssFeed(createMockReq("commons.systems"), res as never);
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain("<title>commons.systems</title>");
    expect(res.body).toContain("<link>https://commons.systems</link>");
  });

  it("filters to published posts only", async () => {
    const { getFirestore } = await import("firebase-admin/firestore");
    const db = getFirestore();
    const collection = db.collection as ReturnType<typeof vi.fn>;
    const res = createMockRes();
    await handleRssFeed(
      createMockReq("fellspiral.commons.systems"),
      res as never,
    );
    const where = collection.mock.results[0].value.where;
    expect(where).toHaveBeenCalledWith("published", "==", true);
  });

  it("sorts posts newest-first in output", async () => {
    // Provide docs in oldest-first order to verify in-memory sort
    mockDocs.length = 0;
    mockDocs.push(
      {
        id: "older-post",
        data: () => ({
          title: "Older Post",
          published: true,
          publishedAt: "2026-01-10T00:00:00Z",
          filename: "older.md",
        }),
      },
      {
        id: "newer-post",
        data: () => ({
          title: "Newer Post",
          published: true,
          publishedAt: "2026-02-15T00:00:00Z",
          filename: "newer.md",
          previewDescription: "A newer post",
        }),
      },
    );
    const res = createMockRes();
    await handleRssFeed(
      createMockReq("fellspiral.commons.systems"),
      res as never,
    );
    const newerIdx = res.body.indexOf("Newer Post");
    const olderIdx = res.body.indexOf("Older Post");
    expect(newerIdx).toBeLessThan(olderIdx);
  });

  it("returns 500 when Firestore query fails", async () => {
    mockGetRejects = true;
    const res = createMockRes();
    await handleRssFeed(
      createMockReq("fellspiral.commons.systems"),
      res as never,
    );
    expect(res.statusCode).toBe(500);
    expect(res.headers["Content-Type"]).toBe("text/plain");
    expect(res.body).toBe("RSS feed temporarily unavailable");
  });

  it("skips documents with non-string title", async () => {
    mockDocs.length = 0;
    mockDocs.push(
      {
        id: "good-post",
        data: () => ({
          title: "Good Post",
          published: true,
          publishedAt: "2026-02-15T00:00:00Z",
        }),
      },
      {
        id: "bad-post",
        data: () => ({
          title: 42,
          published: true,
          publishedAt: "2026-01-10T00:00:00Z",
        }),
      },
      {
        id: "no-title",
        data: () => ({
          published: true,
          publishedAt: "2026-01-05T00:00:00Z",
        }),
      },
    );
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const res = createMockRes();
    await handleRssFeed(
      createMockReq("fellspiral.commons.systems"),
      res as never,
    );
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain("Good Post");
    expect(res.body).not.toContain("bad-post");
    expect(res.body).not.toContain("no-title");
    expect(warnSpy).toHaveBeenCalledTimes(2);
    warnSpy.mockRestore();
  });

  it("pushes NaN dates to end of sort order", async () => {
    mockDocs.length = 0;
    mockDocs.push(
      {
        id: "bad-date",
        data: () => ({
          title: "Bad Date",
          published: true,
          publishedAt: "not-a-date",
        }),
      },
      {
        id: "good-date",
        data: () => ({
          title: "Good Date",
          published: true,
          publishedAt: "2026-01-10T00:00:00Z",
        }),
      },
    );
    const res = createMockRes();
    await handleRssFeed(
      createMockReq("fellspiral.commons.systems"),
      res as never,
    );
    const goodIdx = res.body.indexOf("Good Date");
    const badIdx = res.body.indexOf("Bad Date");
    expect(goodIdx).toBeLessThan(badIdx);
  });

  it("returns empty channel when no published posts", async () => {
    mockDocs.length = 0;
    const res = createMockRes();
    await handleRssFeed(
      createMockReq("fellspiral.commons.systems"),
      res as never,
    );
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain("<channel>");
    expect(res.body).not.toContain("<item>");
  });

  it("resolves preview channel hostname to production config", async () => {
    const res = createMockRes();
    await handleRssFeed(
      createMockReq("cs-fellspiral-4e12--pr-224-rmzvwgbc.web.app"),
      res as never,
    );
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain("<title>fellspiral</title>");
    expect(res.body).toContain(
      "<link>https://fellspiral.commons.systems</link>",
    );
  });

  it("resolves localhost to emulator config when FIRESTORE_NAMESPACE is set", async () => {
    const origNs = process.env.FIRESTORE_NAMESPACE;
    process.env.FIRESTORE_NAMESPACE = "fellspiral/emulator";
    try {
      const res = createMockRes();
      await handleRssFeed(createMockReq("localhost:44023"), res as never);
      expect(res.statusCode).toBe(200);
      expect(res.body).toContain("<title>fellspiral</title>");
    } finally {
      if (origNs === undefined) delete process.env.FIRESTORE_NAMESPACE;
      else process.env.FIRESTORE_NAMESPACE = origNs;
    }
  });

  it("returns 400 for localhost without FIRESTORE_NAMESPACE", async () => {
    const origNs = process.env.FIRESTORE_NAMESPACE;
    delete process.env.FIRESTORE_NAMESPACE;
    try {
      const res = createMockRes();
      await handleRssFeed(createMockReq("localhost:44023"), res as never);
      expect(res.statusCode).toBe(400);
    } finally {
      if (origNs !== undefined) process.env.FIRESTORE_NAMESPACE = origNs;
    }
  });
});
