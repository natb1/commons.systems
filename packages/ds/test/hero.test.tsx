import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Hero } from "../src/index.ts";

// Rendering Hero to a static string under Node (no DOM) proves the new per-card
// `media`/`className` and `overflow`/`overflowLabel` seams render the expected
// markup, and that omitting them is a no-op (the pre-existing render is byte-
// stable). Mirrors page-shell.test.tsx's renderToStaticMarkup style.

describe("Hero per-card media", () => {
  const html = renderToStaticMarkup(
    <Hero
      headline="Ship faster"
      cards={[
        {
          name: "App one",
          problem: "Solves a thing",
          media: <img className="card-shot" src="/shot.png" alt="App one shot" />,
        },
      ]}
    />,
  );

  it("wraps media in .hero-band-card-media", () => {
    expect(html).toContain('class="hero-band-card-media"');
    expect(html).toContain('class="card-shot"');
  });

  it("renders the media BEFORE the card name", () => {
    expect(html).toMatch(
      /hero-band-card-media[\s\S]*?hero-band-card-name/,
    );
  });
});

describe("Hero per-card className", () => {
  it("merges the card className onto the card alongside hero-band-card", () => {
    const html = renderToStaticMarkup(
      <Hero
        headline="Ship faster"
        cards={[{ name: "App one", problem: "Solves a thing", className: "project-card" }]}
      />,
    );
    // Card prepends its own cs-card class; Hero appends "hero-band-card" then the
    // consumer className, so the merged token order is "hero-band-card project-card".
    expect(html).toContain("hero-band-card project-card");
  });
});

describe("Hero overflow tier", () => {
  it("renders a <details class=\"hero-band-overflow\"> with the overflow cards in a .hero-band-grid", () => {
    const html = renderToStaticMarkup(
      <Hero
        headline="Ship faster"
        cards={[{ name: "Primary", problem: "P", href: "#" }]}
        overflow={[{ name: "Gamma", problem: "G", href: "https://gamma.example.com" }]}
      />,
    );
    expect(html).toContain('<details class="hero-band-overflow">');
    // The overflow card lives inside a hero-band-grid nested in the <details>.
    expect(html).toMatch(
      /<details class="hero-band-overflow">[\s\S]*?hero-band-grid[\s\S]*?Gamma[\s\S]*?<\/details>/,
    );
    expect(html).toContain('href="https://gamma.example.com"');
  });

  it("defaults the summary text to 'more…' when overflowLabel is omitted", () => {
    const html = renderToStaticMarkup(
      <Hero
        headline="Ship faster"
        cards={[{ name: "Primary", problem: "P" }]}
        overflow={[{ name: "Gamma", problem: "G" }]}
      />,
    );
    expect(html).toContain("<summary>more…</summary>");
  });

  it("uses overflowLabel as the summary text when provided", () => {
    const html = renderToStaticMarkup(
      <Hero
        headline="Ship faster"
        cards={[{ name: "Primary", problem: "P" }]}
        overflow={[{ name: "Gamma", problem: "G" }]}
        overflowLabel="More projects"
      />,
    );
    expect(html).toContain("<summary>More projects</summary>");
    expect(html).not.toContain("more…");
  });
});

describe("Hero regression: media/overflow/className omitted", () => {
  const html = renderToStaticMarkup(
    <Hero
      headline="Ship faster"
      subline="A promise"
      cards={[
        { name: "App one", problem: "Solves a thing", href: "#" },
        { name: "App two", problem: "Solves another", href: "#" },
      ]}
    />,
  );

  it("emits no .hero-band-card-media wrapper", () => {
    expect(html).not.toContain("hero-band-card-media");
  });

  it("emits no .hero-band-overflow <details>", () => {
    expect(html).not.toContain("hero-band-overflow");
    expect(html).not.toContain("<details");
  });

  it("still renders the headline, subline, and cards", () => {
    expect(html).toContain("hero-band-section");
    expect(html).toContain("Ship faster");
    expect(html).toContain("A promise");
    expect(html).toContain("App one");
    expect(html).toContain("App two");
    expect(html).toContain("hero-band-card-name");
  });
});
