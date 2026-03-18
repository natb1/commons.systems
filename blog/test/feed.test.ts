import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { generateFeedXml, type FeedConfig } from "../src/feed";

function makeSeed(
  docs: Array<{ id: string; data: Record<string, unknown> }> = [
    {
      id: "hello-world",
      data: {
        title: "Hello World",
        published: true,
        publishedAt: "2026-01-01T00:00:00Z",
        previewDescription: "A first post.",
      },
    },
  ],
) {
  return { collections: [{ name: "posts", documents: docs }] };
}

function makeConfig(overrides: Partial<FeedConfig> = {}): FeedConfig {
  return {
    title: "Test Blog",
    siteUrl: "https://example.com",
    distDir: "",
    seed: makeSeed(),
    ...overrides,
  };
}

describe("generateFeedXml", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
  });

  function setup(overrides: Partial<FeedConfig> = {}): string {
    tmpDir = mkdtempSync(join(tmpdir(), "feed-test-"));
    generateFeedXml(makeConfig({ distDir: tmpDir, ...overrides }));
    return readFileSync(join(tmpDir, "feed.xml"), "utf-8");
  }

  it("generates valid RSS XML with correct title/link/items", () => {
    const xml = setup();
    expect(xml).toContain('<?xml');
    expect(xml).toContain('<rss');
    expect(xml).toContain("<title>Test Blog</title>");
    expect(xml).toContain("<link>https://example.com</link>");
    expect(xml).toContain("<title>Hello World</title>");
    expect(xml).toContain("https://example.com/feed.xml");
  });

  it("filters unpublished posts", () => {
    const xml = setup({
      seed: makeSeed([
        { id: "pub", data: { title: "Published", published: true, publishedAt: "2026-01-01T00:00:00Z" } },
        { id: "draft", data: { title: "Draft", published: false, publishedAt: "2026-02-01T00:00:00Z" } },
      ]),
    });
    expect(xml).toContain("Published");
    expect(xml).not.toContain("Draft");
  });

  it("sorts newest-first, NaN dates to end", () => {
    const xml = setup({
      seed: makeSeed([
        { id: "older", data: { title: "Older", published: true, publishedAt: "2026-01-01T00:00:00Z" } },
        { id: "bad-date", data: { title: "Bad Date", published: true, publishedAt: "not-a-date" } },
        { id: "newer", data: { title: "Newer", published: true, publishedAt: "2026-02-01T00:00:00Z" } },
      ]),
    });
    const newerIdx = xml.indexOf("Newer");
    const olderIdx = xml.indexOf("Older");
    const badIdx = xml.indexOf("Bad Date");
    expect(newerIdx).toBeLessThan(olderIdx);
    expect(olderIdx).toBeLessThan(badIdx);
  });

  it("throws on missing posts collection", () => {
    tmpDir = mkdtempSync(join(tmpdir(), "feed-test-"));
    expect(() =>
      generateFeedXml(makeConfig({ distDir: tmpDir, seed: { collections: [] } })),
    ).toThrow("No 'posts' collection found");
  });

  it("throws on missing title for published post", () => {
    tmpDir = mkdtempSync(join(tmpdir(), "feed-test-"));
    expect(() =>
      generateFeedXml(
        makeConfig({
          distDir: tmpDir,
          seed: makeSeed([{ id: "no-title", data: { published: true } }]),
        }),
      ),
    ).toThrow('Post "no-title" is missing a title');
  });

  it("writes feed.xml to distDir", () => {
    tmpDir = mkdtempSync(join(tmpdir(), "feed-test-"));
    generateFeedXml(makeConfig({ distDir: tmpDir }));
    const content = readFileSync(join(tmpDir, "feed.xml"), "utf-8");
    expect(content).toContain("<rss");
  });

  it("produces empty channel when no published posts", () => {
    const xml = setup({
      seed: makeSeed([{ id: "draft", data: { title: "Draft", published: false } }]),
    });
    expect(xml).toContain("<channel>");
    expect(xml).not.toContain("<item>");
  });

  it("passes postLinkPrefix through", () => {
    const xml = setup({ postLinkPrefix: "/blog/" });
    expect(xml).toContain("https://example.com/blog/hello-world");
  });
});
