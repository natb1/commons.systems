import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { About } from "../../src/pages/About.tsx";

describe("About", () => {
  it("renders an About heading", () => {
    const html = renderToStaticMarkup(<About />);
    expect(html).toContain("<h2>About</h2>");
  });

  it("renders the description text", () => {
    const html = renderToStaticMarkup(<About />);
    expect(html).toContain("commons.systems app");
  });
});
