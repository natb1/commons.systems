import { describe, it, expect } from "vitest";

import { renderHome } from "../../src/pages/home";

describe("renderHome", () => {
  it("returns HTML containing a Home heading", async () => {
    const html = await renderHome();
    expect(html).toContain("<h2>Home</h2>");
  });

  it("returns HTML containing welcome text", async () => {
    const html = await renderHome();
    expect(html).toContain("Welcome to the commons.systems audio app.");
  });
});
