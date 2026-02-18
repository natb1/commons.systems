import { describe, it, expect } from "vitest";
import { renderHome } from "../../src/pages/home";

describe("renderHome", () => {
  it("returns HTML containing a Home heading", () => {
    const html = renderHome();
    expect(html).toContain("<h2>Home</h2>");
  });

  it("returns HTML containing welcome text", () => {
    const html = renderHome();
    expect(html).toContain("Welcome to the commons.systems hello app.");
  });
});
