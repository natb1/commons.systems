import { describe, it, expect } from "vitest";
import { generateRssXml, type RssPost, type RssConfig } from "../src/index";

const config: RssConfig = {
  title: "commons.systems",
  siteUrl: "https://commons.systems",
  feedUrl: "https://commons.systems/feed.xml",
};

const posts: RssPost[] = [
  {
    id: "newer-post",
    title: "Newer Post",
    publishedAt: "2026-02-15T00:00:00Z",
  },
  {
    id: "older-post",
    title: "Older Post",
    publishedAt: "2026-01-10T00:00:00Z",
  },
];

describe("generateRssXml", () => {
  it("generates valid RSS 2.0 structure", () => {
    const xml = generateRssXml(posts, config);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain("<channel>");
    expect(xml).toContain("</channel>");
  });

  it("escapes HTML entities in titles and descriptions", () => {
    const xssPosts: RssPost[] = [
      {
        id: "xss",
        title: "Post <script>alert(1)</script>",
        publishedAt: "2026-02-01T00:00:00Z",
        previewDescription: "Description with <tags> & ampersands",
      },
    ];
    const xml = generateRssXml(xssPosts, config);
    expect(xml).not.toContain("<script>");
    expect(xml).toContain("&lt;script&gt;");
    expect(xml).toContain("&amp;");
  });

  it("returns empty channel when no posts", () => {
    const xml = generateRssXml([], config);
    expect(xml).toContain("<channel>");
    expect(xml).toContain("</channel>");
    expect(xml).not.toContain("<item>");
  });

  it("omits description tag when previewDescription is absent", () => {
    const noDesc: RssPost[] = [
      { id: "no-desc", title: "No Desc", publishedAt: "2026-01-01T00:00:00Z" },
    ];
    const xml = generateRssXml(noDesc, config);
    const itemMatch = xml.match(/<item>[\s\S]*?<\/item>/);
    expect(itemMatch).not.toBeNull();
    expect(itemMatch![0]).not.toContain("<description>");
  });

  it("includes pubDate when publishedAt is valid", () => {
    const xml = generateRssXml(posts, config);
    expect(xml).toContain("<pubDate>");
  });

  it("omits pubDate when publishedAt is missing", () => {
    const noDates: RssPost[] = [{ id: "no-date", title: "No Date" }];
    const xml = generateRssXml(noDates, config);
    expect(xml).not.toContain("<pubDate>");
  });

  it("omits pubDate when publishedAt is invalid", () => {
    const badDate: RssPost[] = [
      { id: "bad", title: "Bad Date", publishedAt: "not-a-date" },
    ];
    const xml = generateRssXml(badDate, config);
    expect(xml).not.toContain("<pubDate>");
  });

  it("includes lastBuildDate from first post", () => {
    const xml = generateRssXml(posts, config);
    const expected = new Date("2026-02-15T00:00:00Z").toUTCString();
    expect(xml).toContain(`<lastBuildDate>${expected}</lastBuildDate>`);
  });

  it("omits lastBuildDate when no posts", () => {
    const xml = generateRssXml([], config);
    expect(xml).not.toContain("<lastBuildDate>");
  });

  it("omits lastBuildDate when first post has invalid date", () => {
    const badDate: RssPost[] = [
      { id: "bad", title: "Bad Date", publishedAt: "not-a-date" },
    ];
    const xml = generateRssXml(badDate, config);
    expect(xml).not.toContain("<lastBuildDate>");
    expect(xml).not.toContain("Invalid Date");
  });

  it("includes xmlns:atom namespace", () => {
    const xml = generateRssXml(posts, config);
    expect(xml).toContain('xmlns:atom="http://www.w3.org/2005/Atom"');
  });

  it("includes atom:link rel=self with feedUrl", () => {
    const xml = generateRssXml(posts, config);
    expect(xml).toContain(
      '<atom:link href="https://commons.systems/feed.xml" rel="self" type="application/rss+xml" />',
    );
  });

  it("includes docs and generator elements", () => {
    const xml = generateRssXml(posts, config);
    expect(xml).toContain(
      "<docs>https://www.rssboard.org/rss-specification</docs>",
    );
    expect(xml).toContain("<generator>commons.systems</generator>");
  });

  it("uses config title and siteUrl in channel", () => {
    const custom: RssConfig = {
      title: "My Blog",
      siteUrl: "https://myblog.com",
      feedUrl: "https://myblog.com/feed.xml",
    };
    const xml = generateRssXml(posts, custom);
    expect(xml).toContain("<title>My Blog</title>");
    expect(xml).toContain("<link>https://myblog.com</link>");
  });

  it("uses custom postLinkPrefix", () => {
    const custom: RssConfig = {
      ...config,
      postLinkPrefix: "post/",
    };
    const xml = generateRssXml(posts, custom);
    expect(xml).toContain("https://commons.systems/post/newer-post");
  });

  it("guid elements have isPermaLink=true", () => {
    const xml = generateRssXml(posts, config);
    expect(xml).toContain('isPermaLink="true"');
    expect(xml).not.toContain('isPermaLink="false"');
  });

  it("generates post links in path URL format", () => {
    const xml = generateRssXml(posts, config);
    expect(xml).toContain("https://commons.systems/post/newer-post");
    expect(xml).toContain("https://commons.systems/post/older-post");
  });

  it("throws when config.title is empty", () => {
    expect(() => generateRssXml(posts, { ...config, title: "" })).toThrow("RssConfig.title is required");
  });

  it("throws when config.siteUrl is empty", () => {
    expect(() => generateRssXml(posts, { ...config, siteUrl: "" })).toThrow("RssConfig.siteUrl is required");
  });

  it("throws when config.feedUrl is empty", () => {
    expect(() => generateRssXml(posts, { ...config, feedUrl: "" })).toThrow("RssConfig.feedUrl is required");
  });

  it("includes enclosure when previewImage is present", () => {
    const withImage: RssPost[] = [
      { id: "img-post", title: "Image Post", previewImage: "/blog-map.jpg" },
    ];
    const xml = generateRssXml(withImage, config);
    expect(xml).toContain('<enclosure url="https://commons.systems/blog-map.jpg" type="image/jpeg" length="0" />');
  });

  it("omits enclosure when previewImage is absent", () => {
    const xml = generateRssXml(posts, config);
    expect(xml).not.toContain("<enclosure");
  });

  it("detects png content type for .png images", () => {
    const withPng: RssPost[] = [
      { id: "png-post", title: "PNG Post", previewImage: "/tile.png" },
    ];
    const xml = generateRssXml(withPng, config);
    expect(xml).toContain('type="image/png"');
  });

  it("detects webp content type for .webp images", () => {
    const withWebp: RssPost[] = [
      { id: "webp-post", title: "WebP Post", previewImage: "/photo.webp" },
    ];
    const xml = generateRssXml(withWebp, config);
    expect(xml).toContain('type="image/webp"');
  });

  it("detects jpeg content type for .jpeg extension", () => {
    const withJpeg: RssPost[] = [
      { id: "jpeg-post", title: "JPEG Post", previewImage: "/photo.jpeg" },
    ];
    const xml = generateRssXml(withJpeg, config);
    expect(xml).toContain('type="image/jpeg"');
  });

  it("detects gif content type for .gif extension", () => {
    const withGif: RssPost[] = [
      { id: "gif-post", title: "GIF Post", previewImage: "/anim.gif" },
    ];
    const xml = generateRssXml(withGif, config);
    expect(xml).toContain('type="image/gif"');
  });

  it("throws on unrecognized image extension", () => {
    const withBmp: RssPost[] = [
      { id: "bmp-post", title: "BMP Post", previewImage: "/image.bmp" },
    ];
    expect(() => generateRssXml(withBmp, config)).toThrow(
      'Unsupported image extension for RSS enclosure: "/image.bmp"',
    );
  });

  it("throws when previewImage is not root-relative", () => {
    const withAbsolute: RssPost[] = [
      { id: "abs-post", title: "Abs Post", previewImage: "https://example.com/img.jpg" },
    ];
    expect(() => generateRssXml(withAbsolute, config)).toThrow(
      'previewImage must be a root-relative path, got: "https://example.com/img.jpg"',
    );
  });
});
