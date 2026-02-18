import { describe, it, expect } from "vitest";
import { renderNav } from "../../src/components/nav";

describe("renderNav", () => {
  it("returns HTML with a link to the home route", () => {
    const html = renderNav();
    expect(html).toContain('href="#/"');
  });

  it("returns HTML with a link to the about route", () => {
    const html = renderNav();
    expect(html).toContain('href="#/about"');
  });
});
