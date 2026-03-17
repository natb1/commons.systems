import { describe, it, expect } from "vitest";
import { generateFeedXml } from "../src/feed";
import type { PostMeta } from "../src/post-types";

const config = {
  title: "commons.systems",
  siteUrl: "https://commons.systems",
  feedUrl: "https://commons.systems/feed.xml",
};

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

describe("generateFeedXml", () => {
  it("sorts published posts newest-first", () => {
    const xml = generateFeedXml(publishedPosts, config);
    const newerIdx = xml.indexOf("Newer Post");
    const olderIdx = xml.indexOf("Older Post");
    expect(newerIdx).toBeLessThan(olderIdx);
  });

  it("excludes unpublished posts", () => {
    const xml = generateFeedXml(mixedPosts, config);
    expect(xml).toContain("Newer Post");
    expect(xml).toContain("Older Post");
    expect(xml).not.toContain("Draft");
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
    const xml = generateFeedXml(drafts, config);
    expect(xml).toContain("<channel>");
    expect(xml).toContain("</channel>");
    expect(xml).not.toContain("<item>");
  });

  it("uses custom postLinkPrefix in links", () => {
    const customConfig = {
      ...config,
      postLinkPrefix: "post/",
    };
    const xml = generateFeedXml(publishedPosts, customConfig);
    expect(xml).toContain("https://commons.systems/post/newer-post");
    expect(xml).toContain("https://commons.systems/post/older-post");
    expect(xml).not.toContain("#/post/");
  });
});
