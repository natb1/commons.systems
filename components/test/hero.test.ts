/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, afterEach } from "vitest";
import { hydrateHero } from "../src/hero";

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
    const panelA = el.querySelector<HTMLElement>("#panel-a")!;
    const panelB = el.querySelector<HTMLElement>("#panel-b")!;

    chipA.click();
    expect(panelA.hidden).toBe(false);
    expect(panelB.hidden).toBe(true);
    expect(chipA.getAttribute("aria-expanded")).toBe("true");
    expect(chipA.classList.contains("hero-chip--active")).toBe(true);

    chipB.click();
    expect(panelA.hidden).toBe(true);
    expect(panelB.hidden).toBe(false);
    expect(chipA.getAttribute("aria-expanded")).toBe("false");
    expect(chipB.getAttribute("aria-expanded")).toBe("true");
    expect(chipA.classList.contains("hero-chip--active")).toBe(false);
    expect(chipB.classList.contains("hero-chip--active")).toBe(true);
  });

  it("clicking an active chip toggles it off", () => {
    const el = buildHeroDOM();
    hydrateHero(el);

    const chipA = el.querySelector<HTMLButtonElement>("button.hero-chip")!;
    const panelA = el.querySelector<HTMLElement>("#panel-a")!;

    chipA.click();
    expect(panelA.hidden).toBe(false);

    chipA.click();
    expect(panelA.hidden).toBe(true);
    expect(chipA.getAttribute("aria-expanded")).toBe("false");
    expect(chipA.classList.contains("hero-chip--active")).toBe(false);
  });

  it("inline chip opens the referenced panel", () => {
    const el = buildHeroDOM();
    hydrateHero(el);

    // First open panel B so the inline chip is visible
    el.querySelectorAll<HTMLButtonElement>("button.hero-chip")[1].click();
    const inlineBtn = el.querySelector<HTMLButtonElement>("button.inline-chip")!;
    inlineBtn.click();

    expect(el.querySelector<HTMLElement>("#panel-a")!.hidden).toBe(false);
    expect(el.querySelector<HTMLElement>("#panel-b")!.hidden).toBe(true);
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
