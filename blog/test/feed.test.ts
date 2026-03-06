import { describe, it, expect } from "vitest";
import { generateRssXml } from "../src/feed";
import type { PostMeta } from "../src/post-types";

const config = { title: "commons.systems", siteUrl: "https://commons.systems" };

const publishedPosts: PostMeta[] = [
  {
    id: "older-post",
    title: "Older Post",
    published: true,
    publishedAt: "2026-01-10T00:00:00Z",
    filename: "older.md",
  },
  {
    id: "newer-post",
    title: "Newer Post",
    published: true,
    publishedAt: "2026-02-15T00:00:00Z",
    filename: "newer.md",
  },
];

const mixedPosts: PostMeta[] = [
  ...publishedPosts,
  {
    id: "draft-1",
    title: "Draft",
    published: false,
    publishedAt: null,
    filename: "draft.md",
  },
];

describe("generateRssXml", () => {
  it("generates valid RSS 2.0 with published posts sorted newest-first", () => {
    const xml = generateRssXml(publishedPosts, config);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<rss version="2.0">');
    expect(xml).toContain("<channel>");

    const newerIdx = xml.indexOf("Newer Post");
    const olderIdx = xml.indexOf("Older Post");
    expect(newerIdx).toBeLessThan(olderIdx);
  });

  it("excludes unpublished posts", () => {
    const xml = generateRssXml(mixedPosts, config);
    expect(xml).toContain("Newer Post");
    expect(xml).toContain("Older Post");
    expect(xml).not.toContain("Draft");
  });

  it("escapes HTML entities in titles", () => {
    const xssPosts: PostMeta[] = [
      {
        id: "xss",
        title: "Post <script>alert(1)</script>",
        published: true,
        publishedAt: "2026-02-01T00:00:00Z",
        filename: "xss.md",
      },
    ];
    const xml = generateRssXml(xssPosts, config);
    expect(xml).not.toContain("<script>");
    expect(xml).toContain("&lt;script&gt;");
  });

  it("returns empty channel when no published posts", () => {
    const drafts: PostMeta[] = [
      {
        id: "d1",
        title: "Draft Only",
        published: false,
        publishedAt: null,
        filename: "d.md",
      },
    ];
    const xml = generateRssXml(drafts, config);
    expect(xml).toContain("<channel>");
    expect(xml).toContain("</channel>");
    expect(xml).not.toContain("<item>");
  });

  it("includes post links in hash URL format", () => {
    const xml = generateRssXml(publishedPosts, config);
    expect(xml).toContain("https://commons.systems/#/post/newer-post");
    expect(xml).toContain("https://commons.systems/#/post/older-post");
  });

  it("guid elements have isPermaLink=false", () => {
    const xml = generateRssXml(publishedPosts, config);
    expect(xml).toContain('isPermaLink="false"');
    expect(xml).not.toMatch(/<guid>(?!.*isPermaLink)/);
  });

  it("includes pubDate elements", () => {
    const xml = generateRssXml(publishedPosts, config);
    expect(xml).toContain("<pubDate>");
  });

  it("uses config title and siteUrl in channel", () => {
    const customConfig = { title: "My Blog", siteUrl: "https://myblog.com" };
    const xml = generateRssXml(publishedPosts, customConfig);
    expect(xml).toContain("<title>My Blog</title>");
    expect(xml).toContain("<link>https://myblog.com</link>");
    expect(xml).toContain("https://myblog.com/#/post/newer-post");
  });
});
