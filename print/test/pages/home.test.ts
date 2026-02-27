import { describe, it, expect } from "vitest";
import type { MediaMeta } from "../../src/firestore";
import { renderHomeHtml } from "../../src/pages/home";

const publicEpub: MediaMeta = {
  id: "phaedrus",
  title: "Phaedrus",
  mediaType: "epub",
  publicDomain: true,
  sizeBytes: 500_000,
  tags: { genre: "philosophy" },
};

const privatePdf: MediaMeta = {
  id: "private-book",
  title: "Private Book",
  mediaType: "pdf",
  publicDomain: false,
  sizeBytes: 1_200_000,
  tags: {},
};

const largeCbz: MediaMeta = {
  id: "comic-1",
  title: "Amazing Comic",
  mediaType: "cbz",
  publicDomain: true,
  sizeBytes: 2_500_000_000,
  tags: { publisher: "Marvel", era: "silver age" },
};

describe("renderHomeHtml", () => {
  it("shows 'No media found.' when items array is empty", () => {
    const html = renderHomeHtml([]);

    expect(html).toContain("No media found.");
    expect(html).toContain('id="no-media"');
    expect(html).not.toContain("media-item");
  });

  it("renders media-item articles for each item", () => {
    const html = renderHomeHtml([publicEpub, privatePdf]);

    expect(html).toContain('id="media-phaedrus"');
    expect(html).toContain('id="media-private-book"');
    expect(html).toContain('class="media-item"');
  });

  it("renders the title in an h3 element", () => {
    const html = renderHomeHtml([publicEpub]);

    expect(html).toContain("<h3>Phaedrus</h3>");
  });

  it("renders mediaType badge", () => {
    const html = renderHomeHtml([publicEpub]);

    expect(html).toContain('class="badge badge-type"');
    expect(html).toContain("epub");
  });

  it("renders badge-public for public domain items", () => {
    const html = renderHomeHtml([publicEpub]);

    expect(html).toContain('class="badge badge-public"');
    expect(html).toContain("public domain");
  });

  it("renders badge-private for non-public-domain items", () => {
    const html = renderHomeHtml([privatePdf]);

    expect(html).toContain('class="badge badge-private"');
    expect(html).toContain("private");
  });

  it("renders View link with correct href", () => {
    const html = renderHomeHtml([publicEpub]);

    expect(html).toContain('href="#/view/phaedrus"');
    expect(html).toContain('class="btn btn-view"');
  });

  it("renders Download button with data attributes", () => {
    const html = renderHomeHtml([publicEpub]);

    expect(html).toContain('data-media-id="phaedrus"');
    expect(html).toContain('data-media-type="epub"');
    expect(html).toContain('class="btn btn-download"');
  });

  it("renders tags as spans", () => {
    const html = renderHomeHtml([publicEpub]);

    expect(html).toContain('class="tag"');
    expect(html).toContain("genre: philosophy");
  });

  it("renders multiple tags", () => {
    const html = renderHomeHtml([largeCbz]);

    expect(html).toContain("publisher: Marvel");
    expect(html).toContain("era: silver age");
  });

  it("does not render tags div when tags are empty", () => {
    const html = renderHomeHtml([privatePdf]);

    // privatePdf has empty tags, so no tags div should be rendered
    // The tags div is only rendered when there are entries
    expect(html).not.toContain('class="tags"');
  });

  it("formats bytes correctly", () => {
    const tinyItem: MediaMeta = {
      id: "tiny",
      title: "Tiny",
      mediaType: "pdf",
      publicDomain: true,
      sizeBytes: 512,
      tags: {},
    };
    const html = renderHomeHtml([tinyItem]);

    expect(html).toContain("512 B");
  });

  it("formats KB correctly", () => {
    const kbItem: MediaMeta = {
      id: "kb",
      title: "KB Item",
      mediaType: "pdf",
      publicDomain: true,
      sizeBytes: 5_000,
      tags: {},
    };
    const html = renderHomeHtml([kbItem]);

    expect(html).toContain("5.0 KB");
  });

  it("formats MB correctly", () => {
    const html = renderHomeHtml([publicEpub]);

    // 500_000 bytes = 0.5 MB
    expect(html).toContain("500.0 KB");
  });

  it("formats large MB correctly", () => {
    const html = renderHomeHtml([privatePdf]);

    // 1_200_000 bytes = 1.2 MB
    expect(html).toContain("1.2 MB");
  });

  it("formats GB correctly", () => {
    const html = renderHomeHtml([largeCbz]);

    // 2_500_000_000 bytes = 2.5 GB
    expect(html).toContain("2.5 GB");
  });

  it("does not render size span when sizeBytes is 0", () => {
    const zeroSize: MediaMeta = {
      id: "zero",
      title: "Zero Size",
      mediaType: "epub",
      publicDomain: true,
      sizeBytes: 0,
      tags: {},
    };
    const html = renderHomeHtml([zeroSize]);

    expect(html).not.toContain('class="size"');
  });

  it("renders media-list container with items", () => {
    const html = renderHomeHtml([publicEpub]);

    expect(html).toContain('id="media-list"');
  });

  it("renders Library heading", () => {
    const html = renderHomeHtml([publicEpub]);

    expect(html).toContain("<h2>Library</h2>");
  });

  it("renders Library heading for empty list too", () => {
    const html = renderHomeHtml([]);

    expect(html).toContain("<h2>Library</h2>");
  });

  it("escapes HTML in title", () => {
    const xssItem: MediaMeta = {
      id: "xss",
      title: "<script>alert(1)</script>",
      mediaType: "pdf",
      publicDomain: true,
      sizeBytes: 100,
      tags: {},
    };
    const html = renderHomeHtml([xssItem]);

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
