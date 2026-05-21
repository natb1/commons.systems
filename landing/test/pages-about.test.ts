import { describe, it, expect } from "vitest";
import { renderAboutHtml, renderAboutPanelHtml } from "../src/pages/about";

describe("renderAboutHtml", () => {
  it("contains the About heading", () => {
    const html = renderAboutHtml();
    expect(html).toContain("<h2");
    expect(html).toContain("About");
  });

  it("describes the independent-contractor model", () => {
    expect(renderAboutHtml()).toContain("independent contractor");
  });

  it("lists what an engagement delivers", () => {
    expect(renderAboutHtml()).toContain('class="about-deliverables"');
  });
});

describe("renderAboutPanelHtml", () => {
  it("includes a mailto link to nathan@natb1.com", () => {
    expect(renderAboutPanelHtml()).toContain("mailto:nathan@natb1.com");
  });

  it("includes a call to action prompting contact", () => {
    expect(renderAboutPanelHtml()).toContain('class="profile-cta"');
  });
});
