import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Hero } from "../../src/pages/Hero.tsx";

describe("Hero", () => {
  const html = renderToStaticMarkup(<Hero />);

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

  it("contains Easy, Medium, Hard badge labels", () => {
    expect(html).toContain("Easy");
    expect(html).toContain("Medium");
    expect(html).toContain("Hard");
  });

  it("chip-badge base class appears three times", () => {
    expect(html.match(/chip-badge/g)).toHaveLength(3);
  });

  it("ds badge variants are present", () => {
    expect(html).toContain("cs-badge--success");
    expect(html).toContain("cs-badge--accent");
    expect(html).toContain("cs-badge--error");
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

  it("chips reference their panels via data-panel", () => {
    expect(html).toContain('data-panel="panel-upload"');
    expect(html).toContain('data-panel="panel-format"');
    expect(html).toContain('data-panel="panel-host"');
  });
});
