import { describe, it, expect } from "vitest";
import { createMarked, IMAGE_DIMENSIONS } from "../src/marked-config.ts";

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

  it("renders unknown image paths without width/height", async () => {
    const marked = createMarked();
    // consume first image so the unknown one gets loading="lazy"
    const html = await marked.parse(
      "![first](/woman-with-a-flower-head.webp)\n\n![unknown](/unknown.webp)",
    );
    const imgs = html.match(/<img [^>]+>/g)!;
    expect(imgs[1]).not.toContain("width=");
    expect(imgs[1]).not.toContain("height=");
    expect(imgs[1]).toContain('loading="lazy"');
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

  it("gives each createMarked() call an independent counter", async () => {
    const marked1 = createMarked();
    const marked2 = createMarked();

    await marked1.parse("![first](/woman-with-a-flower-head.webp)");

    const html2 = await marked2.parse("![first](/blog-map-color.webp)");
    expect(html2).toContain('fetchpriority="high"');
  });
});

describe("IMAGE_DIMENSIONS", () => {
  it("contains entries for all known blog images", () => {
    expect(Object.keys(IMAGE_DIMENSIONS).length).toBeGreaterThanOrEqual(4);
    expect(IMAGE_DIMENSIONS["/woman-with-a-flower-head.webp"]).toEqual({
      width: 1600,
      height: 900,
    });
  });
});
