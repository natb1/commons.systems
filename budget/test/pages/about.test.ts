import { describe, it, expect } from "vitest";
import { renderAbout } from "../../src/pages/about";

describe("renderAbout", () => {
  it("returns HTML containing an About heading", () => {
    const html = renderAbout();
    expect(html).toContain("<h2>About</h2>");
  });

  it("returns HTML containing description text", () => {
    const html = renderAbout();
    expect(html).toContain(
      "Budget — a commons.systems app.",
    );
  });
});
