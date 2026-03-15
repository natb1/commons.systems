import { describe, it, expect, beforeEach } from "vitest";
import { updateOgMeta } from "../src/og-meta";
import type { PostMeta } from "../src/post-types";

const SITE_URL = "https://example.com";

function getOgContent(property: string): string | null {
  return document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)?.getAttribute("content") ?? null;
}

function allOgMeta(): string[] {
  return Array.from(document.querySelectorAll('meta[property^="og:"]')).map(
    (el) => el.getAttribute("property")!,
  );
}

const basePost: PostMeta = {
  id: "test-post",
  title: "Test Post",
  published: true,
  publishedAt: "2026-01-01T00:00:00Z",
  filename: "test.md",
  previewDescription: "A test description",
  previewImage: "/images/test.png",
};

describe("updateOgMeta", () => {
  beforeEach(() => {
    document.head.querySelectorAll('meta[property^="og:"]').forEach((el) => el.remove());
  });

  it("sets og:title, og:description, og:type, og:url when post has previewDescription", () => {
    updateOgMeta(SITE_URL, basePost);
    expect(getOgContent("og:title")).toBe("Test Post");
    expect(getOgContent("og:description")).toBe("A test description");
    expect(getOgContent("og:type")).toBe("article");
    expect(getOgContent("og:url")).toBe("https://example.com/post/test-post");
  });

  it("sets og:image with siteUrl prefix when post has previewImage", () => {
    updateOgMeta(SITE_URL, basePost);
    expect(getOgContent("og:image")).toBe("https://example.com/images/test.png");
  });

  it("removes all OG tags when called with undefined post", () => {
    updateOgMeta(SITE_URL, basePost);
    expect(allOgMeta().length).toBeGreaterThan(0);
    updateOgMeta(SITE_URL, undefined);
    expect(allOgMeta()).toHaveLength(0);
  });

  it("removes all OG tags when post has no previewDescription", () => {
    updateOgMeta(SITE_URL, basePost);
    const postWithoutDescription = { ...basePost, previewDescription: undefined };
    updateOgMeta(SITE_URL, postWithoutDescription);
    expect(allOgMeta()).toHaveLength(0);
  });

  it("removes og:image when navigating from post with image to post without", () => {
    updateOgMeta(SITE_URL, basePost);
    expect(getOgContent("og:image")).toBe("https://example.com/images/test.png");
    const postWithoutImage = { ...basePost, previewImage: undefined };
    updateOgMeta(SITE_URL, postWithoutImage);
    expect(getOgContent("og:image")).toBeNull();
    expect(getOgContent("og:title")).toBe("Test Post");
  });

  it("updates existing meta tags rather than creating duplicates on repeated calls", () => {
    updateOgMeta(SITE_URL, basePost);
    updateOgMeta(SITE_URL, { ...basePost, title: "Updated Title" });
    const titles = document.querySelectorAll('meta[property="og:title"]');
    expect(titles).toHaveLength(1);
    expect(titles[0].getAttribute("content")).toBe("Updated Title");
  });

  it("includes og:url in cleanup", () => {
    const meta = document.createElement("meta");
    meta.setAttribute("property", "og:url");
    meta.setAttribute("content", "https://example.com/post/test");
    document.head.appendChild(meta);
    updateOgMeta(SITE_URL, undefined);
    expect(getOgContent("og:url")).toBeNull();
  });
});
