import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { buildSitemapXml, generateSitemapXml, type SitemapConfig } from "../src/sitemap";

function makeSeed(
  docs: Array<{ id: string; data: Record<string, unknown> }> = [
    {
      id: "hello-world",
      data: {
        title: "Hello World",
        published: true,
        publishedAt: "2026-01-01T00:00:00Z",
        filename: "hello-world.md",
      },
    },
  ],
) {
  return { collections: [{ name: "posts", documents: docs }] };
}

function makeConfig(overrides: Partial<SitemapConfig> = {}): SitemapConfig {
  return {
    siteUrl: "https://example.com",
    seed: makeSeed(),
    ...overrides,
  };
}

describe("buildSitemapXml", () => {
  it("produces valid XML with declaration and urlset", () => {
    const xml = buildSitemapXml(makeConfig());
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain("</urlset>");
  });

  it("includes homepage by default", () => {
    const xml = buildSitemapXml(makeConfig());
    expect(xml).toContain("<loc>https://example.com/</loc>");
  });

  it("includes all published posts", () => {
    const xml = buildSitemapXml(
      makeConfig({
        seed: makeSeed([
          {
            id: "post-a",
            data: {
              title: "A",
              published: true,
              publishedAt: "2026-01-01T00:00:00Z",
              filename: "a.md",
            },
          },
          {
            id: "post-b",
            data: {
              title: "B",
              published: true,
              publishedAt: "2026-02-01T00:00:00Z",
              filename: "b.md",
            },
          },
        ]),
      }),
    );
    expect(xml).toContain("<loc>https://example.com/post/post-a</loc>");
    expect(xml).toContain("<loc>https://example.com/post/post-b</loc>");
  });

  it("excludes unpublished posts", () => {
    const xml = buildSitemapXml(
      makeConfig({
        seed: makeSeed([
          {
            id: "pub",
            data: {
              title: "Published",
              published: true,
              publishedAt: "2026-01-01T00:00:00Z",
              filename: "pub.md",
            },
          },
          {
            id: "draft",
            data: { title: "Draft", published: false, publishedAt: null, filename: "draft.md" },
          },
        ]),
      }),
    );
    expect(xml).toContain("pub");
    expect(xml).not.toContain("<loc>https://example.com/post/draft</loc>");
  });

  it("uses post publishedAt as lastmod", () => {
    const xml = buildSitemapXml(makeConfig());
    expect(xml).toContain("<lastmod>2026-01-01T00:00:00Z</lastmod>");
  });

  it("uses most recent post's publishedAt as homepage lastmod", () => {
    const xml = buildSitemapXml(
      makeConfig({
        seed: makeSeed([
          {
            id: "older",
            data: {
              title: "Older",
              published: true,
              publishedAt: "2026-01-01T00:00:00Z",
              filename: "older.md",
            },
          },
          {
            id: "newer",
            data: {
              title: "Newer",
              published: true,
              publishedAt: "2026-03-01T00:00:00Z",
              filename: "newer.md",
            },
          },
        ]),
      }),
    );
    const homepageSection = xml.split("</url>")[0];
    expect(homepageSection).toContain("<loc>https://example.com/</loc>");
    expect(homepageSection).toContain("<lastmod>2026-03-01T00:00:00Z</lastmod>");
  });

  it("encodes post ids with special characters", () => {
    const xml = buildSitemapXml(
      makeConfig({
        seed: makeSeed([
          {
            id: "a&b",
            data: {
              title: "A",
              published: true,
              publishedAt: "2026-01-01T00:00:00Z",
              filename: "a.md",
            },
          },
        ]),
      }),
    );
    expect(xml).toContain("a%26b");
  });

  it("respects custom staticPaths", () => {
    const xml = buildSitemapXml(makeConfig({ staticPaths: ["/", "/about"] }));
    expect(xml).toContain("<loc>https://example.com/</loc>");
    expect(xml).toContain("<loc>https://example.com/about</loc>");
  });

  it("throws when posts collection is missing", () => {
    expect(() => buildSitemapXml(makeConfig({ seed: { collections: [] } }))).toThrow(
      "No 'posts' collection found",
    );
  });

  it("omits homepage lastmod when there are no published posts", () => {
    const xml = buildSitemapXml(
      makeConfig({
        seed: makeSeed([
          {
            id: "draft",
            data: { title: "Draft", published: false, publishedAt: null, filename: "d.md" },
          },
        ]),
      }),
    );
    expect(xml).toContain("<loc>https://example.com/</loc>");
    expect(xml).not.toContain("<lastmod>");
  });
});

describe("generateSitemapXml", () => {
  let tmpDir: string;
  afterEach(() => {
    if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
  });

  it("writes sitemap.xml to distDir", () => {
    tmpDir = mkdtempSync(join(tmpdir(), "sitemap-test-"));
    generateSitemapXml({ ...makeConfig(), distDir: tmpDir });
    const content = readFileSync(join(tmpDir, "sitemap.xml"), "utf-8");
    expect(content).toContain("<urlset");
    expect(content).toContain("hello-world");
  });
});
