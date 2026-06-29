/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach } from "vitest";
import { initPanelToggle } from "../src/panel-toggle";

function setup(): {
  panel: HTMLElement;
  toggle: HTMLElement;
  handle: ReturnType<typeof initPanelToggle>;
} {
  document.body.innerHTML = "";
  const panel = document.createElement("div");
  const toggle = document.createElement("button");
  toggle.setAttribute("aria-expanded", "false");
  document.body.appendChild(panel);
  document.body.appendChild(toggle);
  const handle = initPanelToggle(panel, toggle);
  return { panel, toggle, handle };
}

describe("initPanelToggle", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("toggle click adds .open and sets aria-expanded='true'", () => {
    const { panel, toggle } = setup();
    toggle.click();
    expect(panel.classList.contains("open")).toBe(true);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
  });

  it("second click removes .open and sets aria-expanded='false'", () => {
    const { panel, toggle } = setup();
    toggle.click();
    toggle.click();
    expect(panel.classList.contains("open")).toBe(false);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("ESC closes open panel", () => {
    const { panel, toggle } = setup();
    toggle.click();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(panel.classList.contains("open")).toBe(false);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("ESC no-op when panel closed", () => {
    const { panel, toggle } = setup();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(panel.classList.contains("open")).toBe(false);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("click outside closes open panel", () => {
    const { panel, toggle } = setup();
    toggle.click();
    const outside = document.createElement("div");
    document.body.appendChild(outside);
    outside.click();
    expect(panel.classList.contains("open")).toBe(false);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("click inside panel does not close", () => {
    const { panel, toggle } = setup();
    toggle.click();
    const child = document.createElement("span");
    panel.appendChild(child);
    child.click();
    expect(panel.classList.contains("open")).toBe(true);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
  });

  it("click on toggle does not trigger click-outside", () => {
    const { panel, toggle } = setup();
    toggle.click();
    // The toggle click toggles, so clicking again closes via toggle logic.
    // But the click-outside handler should not also fire.
    // Verify that a single click on toggle results in a clean toggle-off.
    expect(panel.classList.contains("open")).toBe(true);
    toggle.click();
    expect(panel.classList.contains("open")).toBe(false);
  });

  it("destroy() removes all listeners", () => {
    const { panel, toggle, handle } = setup();
    handle.destroy();
    toggle.click();
    expect(panel.classList.contains("open")).toBe(false);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("close() closes panel without destroying listeners", () => {
    const { panel, toggle, handle } = setup();
    toggle.click();
    handle.close();
    expect(panel.classList.contains("open")).toBe(false);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    // Listeners still work after close()
    toggle.click();
    expect(panel.classList.contains("open")).toBe(true);
  });
});
