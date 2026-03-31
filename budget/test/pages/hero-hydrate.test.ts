// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from "vitest";
import { hydrateHero } from "../../src/pages/hero-hydrate";

describe("hydrateHero", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("clicking inline chip button opens the target details element", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <button type="button" class="inline-chip" data-opens="chip-parser">Open</button>
      <details id="chip-parser"><summary>Parser</summary><p>Content</p></details>
    `;
    document.body.appendChild(container);

    const target = document.getElementById("chip-parser") as HTMLDetailsElement;
    expect(target.open).toBe(false);

    hydrateHero(container);

    const button = container.querySelector("button[data-opens]") as HTMLButtonElement;
    button.click();

    expect(target.open).toBe(true);
  });

  it("does not throw when target element does not exist", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <button type="button" class="inline-chip" data-opens="nonexistent">Open</button>
    `;
    document.body.appendChild(container);

    hydrateHero(container);

    const button = container.querySelector("button[data-opens]") as HTMLButtonElement;
    expect(() => button.click()).not.toThrow();
  });
});
