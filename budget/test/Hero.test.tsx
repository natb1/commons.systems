// @vitest-environment happy-dom
//
// The <Hero> island (Unit 2/3). The hero MARKUP is produced by the unchanged
// renderHero string renderer (covered by test/pages/hero.test.ts); this only
// pins the island wiring: on mount it calls mountHero(ref, renderHero) exactly
// once and renders the #hero-container / content-grid wrapper with the hidden
// prop wired. Small by design — the heavy content assertions stay in
// hero.test.ts.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

const mountHero = vi.fn();
vi.mock("@commons-systems/components/hero", () => ({
  mountHero: (...args: unknown[]) => mountHero(...args),
}));

import { Hero } from "../src/Hero";
import { renderHero } from "../src/pages/hero";

describe("Hero island", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    cleanup();
  });

  it("renders the #hero-container content-grid wrapper", () => {
    const { container } = render(<Hero hidden={false} />);
    const el = container.querySelector("#hero-container");
    expect(el).not.toBeNull();
    expect(el!.classList.contains("content-grid")).toBe(true);
  });

  it("calls mountHero(ref, renderHero) once on mount", () => {
    render(<Hero hidden={false} />);
    expect(mountHero).toHaveBeenCalledTimes(1);
    const [el, renderer] = mountHero.mock.calls[0];
    expect((el as HTMLElement).id).toBe("hero-container");
    expect(renderer).toBe(renderHero);
  });

  it("reflects the hidden prop on the wrapper", () => {
    const { container } = render(<Hero hidden={true} />);
    expect((container.querySelector("#hero-container") as HTMLElement).hidden).toBe(true);
  });
});
