import { describe, it, expect } from "vitest";
import { renderHero } from "../../src/pages/hero";

describe("renderHero", () => {
  const html = renderHero();

  it("contains headline", () => {
    expect(html).toContain("This is Not an App.");
  });

  it("contains subtext", () => {
    expect(html).toContain("No signup. No subscription. No data sharing.");
  });

  it("renders three chip buttons", () => {
    const matches = html.match(/class="hero-chip"/g);
    expect(matches).toHaveLength(3);
  });

  it("contains Easy, Medium, Hard badges", () => {
    expect(html).toContain("chip-badge--easy");
    expect(html).toContain("chip-badge--medium");
    expect(html).toContain("chip-badge--hard");
  });

  it("panels are hidden by default", () => {
    const panels = html.match(/class="hero-chip-panel"[^>]*hidden/g);
    expect(panels).toHaveLength(3);
  });

  it("renders a FAQ section", () => {
    expect(html).toContain('class="hero-faq"');
    expect(html).toContain("<summary>FAQ</summary>");
  });

  it("FAQ contains two questions", () => {
    const dts = html.match(/<dt>/g);
    expect(dts).toHaveLength(2);
  });
});
