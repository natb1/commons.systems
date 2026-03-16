import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleRssFeed } from "../src/rss-feed";

const mockDocs: Array<{ id: string; data: () => Record<string, unknown> }> = [];

vi.mock("firebase-admin/app", () => ({
  getApps: () => [{}],
  initializeApp: vi.fn(),
}));

vi.mock("firebase-admin/firestore", () => {
  const get = vi.fn(() => Promise.resolve({ docs: mockDocs }));
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
    // Mock returns docs in this order (simulating Firestore's orderBy publishedAt desc)
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

  it("returns 400 for unknown host", async () => {
    const res = createMockRes();
    await handleRssFeed(createMockReq("unknown.example.com"), res as never);
    expect(res.statusCode).toBe(400);
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
    expect(res.body).toContain("<channel>");
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

  it("escapes XML entities in title and description", async () => {
    mockDocs.length = 0;
    mockDocs.push({
      id: "special-chars",
      data: () => ({
        title: 'Post with <b>HTML</b> & "quotes"',
        published: true,
        publishedAt: "2026-03-01T00:00:00Z",
        filename: "special.md",
        previewDescription: "Description with <tags> & ampersands",
      }),
    });
    const res = createMockRes();
    await handleRssFeed(
      createMockReq("fellspiral.commons.systems"),
      res as never,
    );
    expect(res.body).not.toContain("<b>HTML</b>");
    expect(res.body).toContain("&amp;");
    expect(res.body).toContain("&lt;");
  });

  it("includes atom:link rel='self'", async () => {
    const res = createMockRes();
    await handleRssFeed(
      createMockReq("fellspiral.commons.systems"),
      res as never,
    );
    expect(res.body).toContain('xmlns:atom="http://www.w3.org/2005/Atom"');
    expect(res.body).toContain(
      '<atom:link href="https://fellspiral.commons.systems/feed.xml" rel="self" type="application/rss+xml"',
    );
  });

  it("includes lastBuildDate from newest post", async () => {
    const res = createMockRes();
    await handleRssFeed(
      createMockReq("fellspiral.commons.systems"),
      res as never,
    );
    const expectedDate = new Date("2026-02-15T00:00:00Z").toUTCString();
    expect(res.body).toContain(
      `<lastBuildDate>${expectedDate}</lastBuildDate>`,
    );
  });

  it("includes docs and generator elements", async () => {
    const res = createMockRes();
    await handleRssFeed(
      createMockReq("fellspiral.commons.systems"),
      res as never,
    );
    expect(res.body).toContain(
      "<docs>https://www.rssboard.org/rss-specification</docs>",
    );
    expect(res.body).toContain("<generator>commons.systems</generator>");
  });

  it("guid has isPermaLink='true'", async () => {
    const res = createMockRes();
    await handleRssFeed(
      createMockReq("fellspiral.commons.systems"),
      res as never,
    );
    expect(res.body).toContain('<guid isPermaLink="true">');
    expect(res.body).toContain(
      "https://fellspiral.commons.systems/post/newer-post",
    );
    expect(res.body).toContain(
      "https://fellspiral.commons.systems/post/older-post",
    );
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

  it("handles posts without description or previewDescription", async () => {
    mockDocs.length = 0;
    mockDocs.push({
      id: "no-desc-post",
      data: () => ({
        title: "No Description Post",
        published: true,
        publishedAt: "2026-03-01T00:00:00Z",
        filename: "no-desc.md",
      }),
    });
    const res = createMockRes();
    await handleRssFeed(
      createMockReq("fellspiral.commons.systems"),
      res as never,
    );
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain("<title>No Description Post</title>");
    // Channel-level <description> exists, but no item-level <description>
    const itemMatch = res.body.match(/<item>[\s\S]*?<\/item>/);
    expect(itemMatch).not.toBeNull();
    expect(itemMatch![0]).not.toContain("<description>");
  });
});
