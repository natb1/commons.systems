import { describe, it, expect } from "vitest";
import { createMarked, IMAGE_DIMENSIONS } from "../src/marked-config.ts";
import { BLOG_IMAGES } from "../src/image-config.ts";

describe("image renderer", () => {
  it("includes width and height for known image paths", async () => {
    const marked = createMarked();
    const html = await marked.parse("![alt](/woman-with-a-flower-head.webp)");
    expect(html).toContain('width="1600"');
    expect(html).toContain('height="900"');
  });

  it("sets fetchpriority=high on the first image", async () => {
    const marked = createMarked();
    const html = await marked.parse("![first](/woman-with-a-flower-head.webp)");
    expect(html).toContain('fetchpriority="high"');
    expect(html).not.toContain('loading="lazy"');
  });

  it("sets loading=lazy on the second image", async () => {
    const marked = createMarked();
    const html = await marked.parse(
      "![first](/woman-with-a-flower-head.webp)\n\n![second](/blog-map-color.webp)",
    );
    const imgs = html.match(/<img [^>]+>/g)!;
    expect(imgs).toHaveLength(2);
    expect(imgs[0]).toContain('fetchpriority="high"');
    expect(imgs[1]).toContain('loading="lazy"');
    expect(imgs[1]).not.toContain("fetchpriority");
  });

  it("throws for unknown image paths", () => {
    const marked = createMarked();
    expect(() =>
      marked.parse("![unknown](/unknown.webp)"),
    ).toThrow("not found in IMAGE_DIMENSIONS");
  });

  it("escapes HTML in alt text", async () => {
    const marked = createMarked();
    const html = await marked.parse('![<script>alert("xss")</script>](/alienurn.webp)');
    expect(html).toContain("alt=\"&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;\"");
    expect(html).not.toContain("<script>");
  });

  it("shares image counter across multiple parse calls", async () => {
    const marked = createMarked();
    await marked.parse("![first](/woman-with-a-flower-head.webp)");
    const html = await marked.parse("![second](/blog-map-color.webp)");
    expect(html).toContain('loading="lazy"');
    expect(html).not.toContain("fetchpriority");
  });

  it("includes srcset attribute with width descriptors", async () => {
    const marked = createMarked();
    const html = await marked.parse("![alt](/woman-with-a-flower-head.webp)");
    expect(html).toContain("srcset=");
    expect(html).toContain("/woman-with-a-flower-head-400w.webp 400w");
    expect(html).toContain("/woman-with-a-flower-head-800w.webp 800w");
    expect(html).toContain("/woman-with-a-flower-head.webp 1600w");
  });

  it("includes sizes attribute", async () => {
    const marked = createMarked();
    const html = await marked.parse("![alt](/woman-with-a-flower-head.webp)");
    expect(html).toContain('sizes="');
  });

  it("gives each createMarked() call an independent counter", async () => {
    const marked1 = createMarked();
    const marked2 = createMarked();

    await marked1.parse("![first](/woman-with-a-flower-head.webp)");

    const html2 = await marked2.parse("![first](/blog-map-color.webp)");
    expect(html2).toContain('fetchpriority="high"');
  });
});

describe("link renderer", () => {
  it("appends ↗ glyph for external http links", async () => {
    const marked = createMarked();
    const html = await marked.parse("[repo](https://github.com/x)");
    expect(html).toContain('class="external-link-icon"');
    expect(html).toContain("&#x2197;");
  });

  it("does not append glyph for relative links", async () => {
    const marked = createMarked();
    const html = await marked.parse("[post](/post/x)");
    expect(html).not.toContain("external-link-icon");
    expect(html).not.toContain("&#x2197;");
  });

  it("does not append glyph for commons.systems subdomain links", async () => {
    const marked = createMarked();
    const html = await marked.parse("[budget](https://budget.commons.systems)");
    expect(html).not.toContain("external-link-icon");
    expect(html).not.toContain("&#x2197;");
  });

  it("does not append glyph for apex commons.systems links", async () => {
    const marked = createMarked();
    const html = await marked.parse("[home](https://commons.systems/x)");
    expect(html).not.toContain("external-link-icon");
    expect(html).not.toContain("&#x2197;");
  });

  it("does not append glyph for mailto links", async () => {
    const marked = createMarked();
    const html = await marked.parse("[email](mailto:user@example.com)");
    expect(html).not.toContain("external-link-icon");
    expect(html).not.toContain("&#x2197;");
  });

  it("preserves target=_blank and rel attributes on all links", async () => {
    const marked = createMarked();
    const externalHtml = await marked.parse("[ext](https://github.com/x)");
    const internalHtml = await marked.parse("[int](/post/x)");
    expect(externalHtml).toContain('target="_blank"');
    expect(externalHtml).toContain('rel="noopener noreferrer"');
    expect(internalHtml).toContain('target="_blank"');
    expect(internalHtml).toContain('rel="noopener noreferrer"');
  });

  // Unsafe scheme rejection
  it("renders label text only for javascript: links", async () => {
    const marked = createMarked();
    const html = await marked.parse("[click](javascript:alert(1))");
    expect(html).not.toContain("<a");
    expect(html).not.toContain("javascript");
    expect(html).toContain("click");
  });

  it("rejects javascript: regardless of case", async () => {
    const marked = createMarked();
    const html = await marked.parse("[x](JavaScript:alert(1))");
    expect(html).not.toContain("<a");
    expect(html).toContain("x");
  });

  it("rejects javascript: with leading space in href", async () => {
    const marked = createMarked();
    const html = await marked.parse("[x]( javascript:alert(1))");
    expect(html).not.toContain("<a");
    expect(html).toContain("x");
  });

  it("rejects data: scheme links", async () => {
    const marked = createMarked();
    const html = await marked.parse("[x](data:text/plain,hi)");
    expect(html).not.toContain("<a");
    expect(html).toContain("x");
  });

  it("rejects vbscript: scheme links", async () => {
    const marked = createMarked();
    const html = await marked.parse("[x](vbscript:msgbox(1))");
    expect(html).not.toContain("<a");
    expect(html).toContain("x");
  });

  // Safe scheme regression guard
  it("produces an anchor for https: links", async () => {
    const marked = createMarked();
    const html = await marked.parse("[repo](https://github.com/x)");
    expect(html).toContain('<a ');
    expect(html).toContain('href="https://github.com/x"');
  });

  it("produces an anchor for leading-slash relative links", async () => {
    const marked = createMarked();
    const html = await marked.parse("[post](/post/x)");
    expect(html).toContain('<a ');
    expect(html).toContain('href="/post/x"');
  });

  it("produces an anchor for hash anchor links", async () => {
    const marked = createMarked();
    const html = await marked.parse("[section](#anchor)");
    expect(html).toContain('<a ');
    expect(html).toContain('href="#anchor"');
  });

  it("produces an anchor for mailto: links", async () => {
    const marked = createMarked();
    const html = await marked.parse("[email](mailto:user@example.com)");
    expect(html).toContain('<a ');
    expect(html).toContain('href="mailto:user@example.com"');
  });

  it("produces an anchor for tel: links", async () => {
    const marked = createMarked();
    const html = await marked.parse("[call](tel:+15551234)");
    expect(html).toContain('<a ');
    expect(html).toContain('href="tel:+15551234"');
  });

  // HTML metacharacter escaping in rejected label
  it("escapes HTML metacharacters in rejected link label", async () => {
    const marked = createMarked();
    const html = await marked.parse("[<b>hi</b>](javascript:alert(1))");
    expect(html).not.toContain("<a");
    expect(html).not.toContain("<b>");
    expect(html).toContain("&lt;b&gt;");
  });

  // Bare relative path: rejected (blog convention is leading-slash)
  it("rejects bare relative path links without leading slash", async () => {
    const marked = createMarked();
    const html = await marked.parse("[x](foo/bar)");
    expect(html).not.toContain("<a");
    expect(html).toContain("x");
  });
});

describe("IMAGE_DIMENSIONS", () => {
  it("derives one entry per BLOG_IMAGES config", () => {
    expect(Object.keys(IMAGE_DIMENSIONS).length).toBe(BLOG_IMAGES.length);
    for (const img of BLOG_IMAGES) {
      expect(IMAGE_DIMENSIONS[`/${img.baseName}.webp`]).toBeDefined();
    }
  });

  it("contains correct dimensions and srcset for a known image", () => {
    expect(IMAGE_DIMENSIONS["/woman-with-a-flower-head.webp"]).toEqual({
      width: 1600,
      height: 900,
      srcset: [
        { path: "/woman-with-a-flower-head-400w.webp", width: 400 },
        { path: "/woman-with-a-flower-head-800w.webp", width: 800 },
        { path: "/woman-with-a-flower-head.webp", width: 1600 },
      ],
    });
  });
});
