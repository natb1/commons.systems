// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from "vitest";
import { hydrateHero } from "../../src/pages/hero-hydrate";

function buildHeroDOM(): HTMLElement {
  const el = document.createElement("div");
  el.innerHTML = `
    <div class="hero-chip-row">
      <button type="button" class="hero-chip" data-panel="panel-a" aria-expanded="false">A</button>
      <button type="button" class="hero-chip" data-panel="panel-b" aria-expanded="false">B</button>
    </div>
    <div class="hero-chip-panel" id="panel-a" hidden>Panel A</div>
    <div class="hero-chip-panel" id="panel-b" hidden>
      <button type="button" class="inline-chip" data-opens="panel-a">Go to A</button>
      Panel B
    </div>
  `;
  document.body.appendChild(el);
  return el;
}

describe("hydrateHero", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("clicking a chip shows its panel and hides others", () => {
    const el = buildHeroDOM();
    hydrateHero(el);

    const [chipA, chipB] = el.querySelectorAll<HTMLButtonElement>("button.hero-chip");
    const panelA = document.getElementById("panel-a")!;
    const panelB = document.getElementById("panel-b")!;

    chipA.click();
    expect(panelA.hidden).toBe(false);
    expect(panelB.hidden).toBe(true);
    expect(chipA.getAttribute("aria-expanded")).toBe("true");

    chipB.click();
    expect(panelA.hidden).toBe(true);
    expect(panelB.hidden).toBe(false);
    expect(chipA.getAttribute("aria-expanded")).toBe("false");
    expect(chipB.getAttribute("aria-expanded")).toBe("true");
  });

  it("clicking an active chip toggles it off", () => {
    const el = buildHeroDOM();
    hydrateHero(el);

    const chipA = el.querySelector<HTMLButtonElement>("button.hero-chip")!;
    const panelA = document.getElementById("panel-a")!;

    chipA.click();
    expect(panelA.hidden).toBe(false);

    chipA.click();
    expect(panelA.hidden).toBe(true);
    expect(chipA.getAttribute("aria-expanded")).toBe("false");
  });

  it("inline chip opens the referenced panel", () => {
    const el = buildHeroDOM();
    hydrateHero(el);

    // First open panel B so the inline chip is visible
    el.querySelectorAll<HTMLButtonElement>("button.hero-chip")[1].click();
    const inlineBtn = el.querySelector<HTMLButtonElement>("button.inline-chip")!;
    inlineBtn.click();

    expect(document.getElementById("panel-a")!.hidden).toBe(false);
    expect(document.getElementById("panel-b")!.hidden).toBe(true);
  });

  it("does not throw when inline chip target does not exist", () => {
    const el = document.createElement("div");
    el.innerHTML = `<button type="button" class="inline-chip" data-opens="nonexistent">Open</button>`;
    document.body.appendChild(el);
    hydrateHero(el);

    const btn = el.querySelector<HTMLButtonElement>("button.inline-chip")!;
    expect(() => btn.click()).not.toThrow();
  });
});
