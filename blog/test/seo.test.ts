import { describe, it, expect } from "vitest";
import {
  organizationJsonLd,
  blogPostingJsonLd,
  jsonLdScriptTag,
  canonicalLinkTag,
  relMeLinkTags,
} from "../src/seo";
import type { PublishedPost } from "../src/post-types";

const basePost: PublishedPost = {
  id: "hello-world",
  title: "Hello World",
  published: true,
  publishedAt: "2026-03-10T00:00:00Z",
  filename: "hello-world.md",
  previewDescription: "A first post.",
  previewImage: "/hello.jpg",
};

describe("organizationJsonLd", () => {
  it("returns required schema.org fields", () => {
    const json = organizationJsonLd({
      name: "Example Org",
      url: "https://example.com",
      logo: "https://example.com/logo.svg",
      sameAs: ["https://github.com/example"],
    });
    expect(json["@context"]).toBe("https://schema.org");
    expect(json["@type"]).toBe("Organization");
    expect(json.name).toBe("Example Org");
    expect(json.url).toBe("https://example.com");
    expect(json.logo).toBe("https://example.com/logo.svg");
    expect(json.sameAs).toEqual(["https://github.com/example"]);
  });

  it("omits sameAs when empty", () => {
    const json = organizationJsonLd({
      name: "Example",
      url: "https://example.com",
      logo: "https://example.com/logo.svg",
    });
    expect(json.sameAs).toBeUndefined();
  });
});

describe("blogPostingJsonLd", () => {
  it("includes headline, datePublished, author, url, mainEntityOfPage", () => {
    const json = blogPostingJsonLd(basePost, "https://example.com", { name: "Alice" });
    expect(json["@context"]).toBe("https://schema.org");
    expect(json["@type"]).toBe("BlogPosting");
    expect(json.headline).toBe("Hello World");
    expect(json.datePublished).toBe("2026-03-10T00:00:00Z");
    expect(json.author).toEqual({ "@type": "Person", name: "Alice" });
    expect(json.url).toBe("https://example.com/post/hello-world");
    expect(json.mainEntityOfPage).toEqual({
      "@type": "WebPage",
      "@id": "https://example.com/post/hello-world",
    });
  });

  it("includes author url when provided", () => {
    const json = blogPostingJsonLd(basePost, "https://example.com", {
      name: "Alice",
      url: "https://example.com/about",
    });
    expect(json.author).toEqual({
      "@type": "Person",
      name: "Alice",
      url: "https://example.com/about",
    });
  });

  it("includes description and image when available", () => {
    const json = blogPostingJsonLd(basePost, "https://example.com", { name: "Alice" });
    expect(json.description).toBe("A first post.");
    expect(json.image).toBe("https://example.com/hello.jpg");
  });

  it("omits description and image when absent", () => {
    const post: PublishedPost = { ...basePost, previewDescription: undefined, previewImage: undefined };
    const json = blogPostingJsonLd(post, "https://example.com", { name: "Alice" });
    expect(json.description).toBeUndefined();
    expect(json.image).toBeUndefined();
  });

  it("encodes post id in url", () => {
    const post: PublishedPost = { ...basePost, id: "a/b c" };
    const json = blogPostingJsonLd(post, "https://example.com", { name: "Alice" });
    expect(json.url).toBe("https://example.com/post/a%2Fb%20c");
  });
});

describe("jsonLdScriptTag", () => {
  it("wraps JSON in a script tag with correct type", () => {
    const tag = jsonLdScriptTag({ a: 1 });
    expect(tag).toMatch(/^<script type="application\/ld\+json">/);
    expect(tag).toMatch(/<\/script>$/);
  });

  it("produces JSON parseable from script body", () => {
    const tag = jsonLdScriptTag({ "@type": "Organization", name: "Test" });
    const body = tag.replace(/^<script[^>]*>/, "").replace(/<\/script>$/, "");
    const unescaped = body
      .replace(/\\u003c/g, "<")
      .replace(/\\u003e/g, ">")
      .replace(/\\u0026/g, "&");
    const parsed = JSON.parse(unescaped);
    expect(parsed["@type"]).toBe("Organization");
  });

  it("escapes < > & to prevent breaking out of the script tag", () => {
    const tag = jsonLdScriptTag({ evil: "</script><script>alert(1)</script>" });
    expect(tag).not.toContain("</script><script>");
    expect(tag).toContain("\\u003c/script\\u003e");
  });
});

describe("canonicalLinkTag", () => {
  it("returns link tag with rel=canonical and href", () => {
    expect(canonicalLinkTag("https://example.com/")).toBe(
      '<link rel="canonical" href="https://example.com/">',
    );
  });

  it("escapes HTML special characters in href", () => {
    expect(canonicalLinkTag('https://example.com/"><script>')).toContain("&quot;");
    expect(canonicalLinkTag('https://example.com/"><script>')).not.toContain("<script>");
  });
});

describe("relMeLinkTags", () => {
  it("returns empty-join for empty array", () => {
    expect(relMeLinkTags([])).toBe("");
  });

  it("produces one link per URL", () => {
    const html = relMeLinkTags(["https://github.com/a", "https://github.com/b"]);
    expect(html).toContain('<link rel="me" href="https://github.com/a">');
    expect(html).toContain('<link rel="me" href="https://github.com/b">');
  });

  it("escapes HTML special characters in URL", () => {
    expect(relMeLinkTags(['https://github.com/"evil'])).toContain("&quot;");
  });
});
