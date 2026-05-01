import { describe, it, expect } from "vitest";
import { renderAboutHtml } from "../src/pages/about";

describe("renderAboutHtml", () => {
  it("contains the About heading", () => {
    const html = renderAboutHtml();
    expect(html).toContain("<h2");
    expect(html).toContain("About");
  });

  it("includes a mailto link to nathan@natb1.com", () => {
    expect(renderAboutHtml()).toContain('mailto:nathan@natb1.com');
  });

  it("includes a back-to-home link", () => {
    expect(renderAboutHtml()).toContain('href="/"');
  });

  it("links to the project charter", () => {
    expect(renderAboutHtml()).toContain("CHARTER.md");
  });
});
