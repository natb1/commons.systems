import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { About, AboutPanel } from "../src/pages/About";

describe("About", () => {
  it("contains the About heading", () => {
    const html = renderToStaticMarkup(<About />);
    expect(html).toContain("<h2");
    expect(html).toContain("About");
  });

  it("describes the independent-contractor model", () => {
    expect(renderToStaticMarkup(<About />)).toContain("independent contractor");
  });

  it("lists what an engagement delivers", () => {
    expect(renderToStaticMarkup(<About />)).toContain('class="about-deliverables"');
  });
});

describe("AboutPanel", () => {
  it("includes a mailto link to nathan@natb1.com", () => {
    expect(renderToStaticMarkup(<AboutPanel />)).toContain("mailto:nathan@natb1.com");
  });

  it("includes a call to action prompting contact", () => {
    expect(renderToStaticMarkup(<AboutPanel />)).toContain('class="profile-cta"');
  });
});
