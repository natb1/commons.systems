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

  it("contains agentic coding link", () => {
    expect(html).toContain('href="https://commons.systems"');
  });

  it("renders a single chip button", () => {
    const matches = html.match(/class="hero-chip"/g);
    expect(matches).toHaveLength(1);
  });

  it("contains the Easy badge but not Medium or Hard", () => {
    expect(html).toContain("chip-badge--easy");
    expect(html).not.toContain("chip-badge--medium");
    expect(html).not.toContain("chip-badge--hard");
  });

  it("the single chip references its panel via data-panel", () => {
    expect(html).toContain('data-panel="panel-analyze"');
    expect(html).not.toContain("panel-parser");
    expect(html).not.toContain("panel-host");
  });

  it("panels are hidden by default", () => {
    const panels = html.match(/class="hero-chip-panel"[^>]*hidden/g);
    expect(panels).toHaveLength(1);
  });

  it("step 6 points to the parser flow as plain text, not an inline chip", () => {
    expect(html).not.toContain("data-opens");
    expect(html).toContain("/budget-parser");
    expect(html).toContain('href="https://github.com/natb1/commons.systems/fork"');
  });

  it("renders a single FAQ details element with summary", () => {
    expect(html).toContain('class="hero-faq"');
    expect(html).toContain("<summary>FAQ</summary>");
  });

  it("FAQ contains two questions as dt elements", () => {
    const dts = html.match(/<dt>/g);
    expect(dts).toHaveLength(2);
  });
});
