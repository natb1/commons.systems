import { describe, it, expect } from "vitest";
import type { MediaMeta } from "../../src/firestore";
import { renderView } from "../../src/pages/view";

const sampleItem: MediaMeta = {
  id: "phaedrus",
  title: "Phaedrus",
  mediaType: "epub",
  publicDomain: true,
  sizeBytes: 500_000,
  tags: { genre: "philosophy", era: "classical" },
  sourceNotes: "Platonic Foundation: https://www.platonicfoundation.org/translation/phaedrus",
};

const noTagsItem: MediaMeta = {
  id: "no-tags",
  title: "No Tags Book",
  mediaType: "pdf",
  publicDomain: false,
  sizeBytes: 1_000,
  tags: {},
  sourceNotes: "",
};

describe("renderView", () => {
  it("renders 'Not Found' when item is undefined", () => {
    const html = renderView(undefined);

    expect(html).toContain("Not Found");
    expect(html).toContain('id="view-not-found"');
    expect(html).toContain('href="#/"');
    expect(html).toContain("Back to library");
  });

  it("does not render metadata table when item is undefined", () => {
    const html = renderView(undefined);

    expect(html).not.toContain('id="metadata-table"');
  });

  it("renders the title as h2", () => {
    const html = renderView(sampleItem);

    expect(html).toContain("<h2>Phaedrus</h2>");
  });

  it("renders back to library link", () => {
    const html = renderView(sampleItem);

    expect(html).toContain('href="#/"');
    expect(html).toContain("Back to library");
  });

  it("renders metadata table with correct data-media-id", () => {
    const html = renderView(sampleItem);

    expect(html).toContain('id="metadata-table"');
    expect(html).toContain('data-media-id="phaedrus"');
  });

  it("renders ID in metadata table", () => {
    const html = renderView(sampleItem);

    expect(html).toContain("<td>ID</td>");
    expect(html).toContain("<td>phaedrus</td>");
  });

  it("renders Media Type in metadata table", () => {
    const html = renderView(sampleItem);

    expect(html).toContain("<td>Media Type</td>");
    expect(html).toContain("<td>epub</td>");
  });

  it("renders Public Domain as 'Yes' for public domain items", () => {
    const html = renderView(sampleItem);

    expect(html).toContain("<td>Public Domain</td>");
    expect(html).toContain("<td>Yes</td>");
  });

  it("renders Public Domain as 'No' for non-public-domain items", () => {
    const html = renderView(noTagsItem);

    expect(html).toContain("<td>Public Domain</td>");
    expect(html).toContain("<td>No</td>");
  });

  it("renders formatted size", () => {
    const html = renderView(sampleItem);

    expect(html).toContain("<td>Size</td>");
    expect(html).toContain("<td>500.0 KB</td>");
  });

  it("renders tag rows when tags exist", () => {
    const html = renderView(sampleItem);

    expect(html).toContain("<td>genre</td><td>philosophy</td>");
    expect(html).toContain("<td>era</td><td>classical</td>");
  });

  it("renders 'No tags' when tags object is empty", () => {
    const html = renderView(noTagsItem);

    expect(html).toContain("No tags");
    expect(html).toContain('colspan="2"');
  });

  it("renders download button with correct data attributes", () => {
    const html = renderView(sampleItem);

    expect(html).toContain('data-media-id="phaedrus"');
    expect(html).toContain('data-media-type="epub"');
    expect(html).toContain('class="btn btn-download"');
  });

  it("renders Source row in metadata table", () => {
    const html = renderView(sampleItem);

    expect(html).toContain("<td>Source</td>");
    expect(html).toContain("Platonic Foundation: https://www.platonicfoundation.org/translation/phaedrus");
  });

  it("renders empty Source row when sourceNotes is empty", () => {
    const html = renderView(noTagsItem);

    expect(html).toContain("<td>Source</td><td></td>");
  });

  it("escapes HTML in sourceNotes", () => {
    const xssSource: MediaMeta = {
      id: "xss-source",
      title: "Safe Title",
      mediaType: "pdf",
      publicDomain: true,
      sizeBytes: 0,
      tags: {},
      sourceNotes: '<script>alert("xss")</script>',
    };
    const html = renderView(xssSource);

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes HTML in title", () => {
    const xssItem: MediaMeta = {
      id: "xss",
      title: "<img onerror=alert(1)>",
      mediaType: "pdf",
      publicDomain: true,
      sizeBytes: 0,
      tags: {},
      sourceNotes: "",
    };
    const html = renderView(xssItem);

    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img onerror=alert(1)&gt;");
  });

  it("escapes HTML in id", () => {
    const xssItem: MediaMeta = {
      id: '"><script>',
      title: "Safe Title",
      mediaType: "pdf",
      publicDomain: true,
      sizeBytes: 0,
      tags: {},
      sourceNotes: "",
    };
    const html = renderView(xssItem);

    expect(html).not.toContain("<script>");
  });

  it("escapes HTML in tag keys and values", () => {
    const xssItem: MediaMeta = {
      id: "safe",
      title: "Safe",
      mediaType: "pdf",
      publicDomain: true,
      sizeBytes: 0,
      tags: { "<b>key</b>": "<i>value</i>" },
      sourceNotes: "",
    };
    const html = renderView(xssItem);

    expect(html).not.toContain("<b>");
    expect(html).not.toContain("<i>");
    expect(html).toContain("&lt;b&gt;key&lt;/b&gt;");
    expect(html).toContain("&lt;i&gt;value&lt;/i&gt;");
  });
});
