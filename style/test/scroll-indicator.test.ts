/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { initScrollIndicator } from "../src/scroll-indicator";

function setup(): { container: HTMLElement; teardown: () => void } {
  document.body.innerHTML = "";
  const container = document.createElement("div");
  document.body.appendChild(container);

  // happy-dom doesn't implement matchMedia
  window.matchMedia = vi.fn().mockReturnValue({ matches: true });

  const teardown = initScrollIndicator(container);
  return { container, teardown };
}

describe("initScrollIndicator", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("creates track and thumb elements in DOM", () => {
    setup();
    const track = document.querySelector(".sidebar-scroll-track");
    expect(track).not.toBeNull();
    const thumb = track?.querySelector(".sidebar-scroll-thumb");
    expect(thumb).not.toBeNull();
  });

  it("removes existing track on re-init (idempotent)", () => {
    const { container } = setup();
    initScrollIndicator(container);
    const tracks = document.querySelectorAll(".sidebar-scroll-track");
    expect(tracks.length).toBe(1);
  });

  it("returns a teardown function", () => {
    const { teardown } = setup();
    expect(typeof teardown).toBe("function");
  });

  it("teardown removes track from DOM", () => {
    const { teardown } = setup();
    teardown();
    expect(document.querySelector(".sidebar-scroll-track")).toBeNull();
  });

  it("hides track when content does not overflow", () => {
    const { container } = setup();
    // scrollHeight === clientHeight means no overflow
    Object.defineProperty(container, "scrollHeight", { value: 100, configurable: true });
    Object.defineProperty(container, "clientHeight", { value: 100, configurable: true });
    container.dispatchEvent(new Event("scroll"));
    const track = document.querySelector(".sidebar-scroll-track") as HTMLElement;
    expect(track.style.display).toBe("none");
  });

  it("adds sidebar-overflow-bottom when content overflows", () => {
    const { container } = setup();
    Object.defineProperty(container, "scrollHeight", { value: 500, configurable: true });
    Object.defineProperty(container, "clientHeight", { value: 200, configurable: true });
    Object.defineProperty(container, "scrollTop", { value: 0, configurable: true });
    container.dispatchEvent(new Event("scroll"));
    expect(container.classList.contains("sidebar-overflow-bottom")).toBe(true);
  });

  it("does not add sidebar-overflow-top when scrolled to top", () => {
    const { container } = setup();
    Object.defineProperty(container, "scrollHeight", { value: 500, configurable: true });
    Object.defineProperty(container, "clientHeight", { value: 200, configurable: true });
    Object.defineProperty(container, "scrollTop", { value: 0, configurable: true });
    container.dispatchEvent(new Event("scroll"));
    expect(container.classList.contains("sidebar-overflow-top")).toBe(false);
  });

  it("adds both overflow classes when scrolled to middle", () => {
    const { container } = setup();
    Object.defineProperty(container, "scrollHeight", { value: 500, configurable: true });
    Object.defineProperty(container, "clientHeight", { value: 200, configurable: true });
    Object.defineProperty(container, "scrollTop", { value: 100, configurable: true });
    container.dispatchEvent(new Event("scroll"));
    expect(container.classList.contains("sidebar-overflow-top")).toBe(true);
    expect(container.classList.contains("sidebar-overflow-bottom")).toBe(true);
  });

  it("removes sidebar-overflow-bottom when scrolled to bottom", () => {
    const { container } = setup();
    Object.defineProperty(container, "scrollHeight", { value: 500, configurable: true });
    Object.defineProperty(container, "clientHeight", { value: 200, configurable: true });
    Object.defineProperty(container, "scrollTop", { value: 300, configurable: true });
    container.dispatchEvent(new Event("scroll"));
    expect(container.classList.contains("sidebar-overflow-top")).toBe(true);
    expect(container.classList.contains("sidebar-overflow-bottom")).toBe(false);
  });

  it("cleans up when container disconnects", () => {
    const { container } = setup();
    container.remove();
    // Trigger update via scroll — teardown should fire internally
    container.dispatchEvent(new Event("scroll"));
    expect(document.querySelector(".sidebar-scroll-track")).toBeNull();
  });
});
