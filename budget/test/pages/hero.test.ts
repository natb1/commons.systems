import { describe, it, expect } from "vitest";
import { renderHero } from "../../src/pages/hero";

describe("renderHero", () => {
  const html = renderHero();

  it("contains headline 'This is Not an App.'", () => {
    expect(html).toContain("<h2>This is Not an App.</h2>");
  });

  it("contains subtext 'No signup. No subscription. No data sharing.'", () => {
    expect(html).toContain("No signup. No subscription. No data sharing.");
  });

  it("contains agentic coding link with href='https://commons.systems'", () => {
    expect(html).toContain('<a href="https://commons.systems">agentic coding</a>');
  });

  it("renders three .hero-chip-detail elements", () => {
    const matches = html.match(/class="hero-chip-detail"/g);
    expect(matches).toHaveLength(3);
  });

  it("contains Easy, Medium, Hard badge text", () => {
    expect(html).toContain("chip-badge--easy\">Easy</span>");
    expect(html).toContain("chip-badge--medium\">Medium</span>");
    expect(html).toContain("chip-badge--hard\">Hard</span>");
  });

  it("contains inline chip button with data-opens='chip-parser'", () => {
    expect(html).toContain('data-opens="chip-parser"');
    expect(html).toContain('class="inline-chip"');
  });

  it("chip details element with id='chip-parser' exists", () => {
    expect(html).toContain('id="chip-parser"');
  });

  it("all three chip details have name='hero-chips' attribute", () => {
    const matches = html.match(/name="hero-chips"/g);
    expect(matches).toHaveLength(3);
  });

  it("contains two .hero-faq-item elements", () => {
    const matches = html.match(/class="hero-faq-item"/g);
    expect(matches).toHaveLength(2);
  });

  it("FAQ details do NOT have a name attribute", () => {
    const faqSection = html.slice(html.indexOf('class="hero-faq"'));
    const detailsTags = faqSection.match(/<details[^>]*>/g) ?? [];
    for (const tag of detailsTags) {
      expect(tag).not.toContain("name=");
    }
  });
});
