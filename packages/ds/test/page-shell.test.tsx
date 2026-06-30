import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PageShell } from "../src/index.ts";

// Rendering PageShell to a static string under Node (no DOM) proves that
// PageShell and Footer pull no import-time browser globals — the SSG-safety
// guarantee this test encodes.

describe("PageShell", () => {
  const html = renderToStaticMarkup(
    <PageShell
      wordmark="your.brand"
      tagline="A short tagline"
      navLinks={[
        { href: "/", label: "Home" },
        { href: "/about", label: "About" },
        { href: "/sign-in", label: "Sign in", align: "end" },
      ]}
      current="/"
    >
      <main>
        <h2>Welcome</h2>
        <p>Main content.</p>
      </main>
    </PageShell>,
  );

  it("renders the page wrapper", () => {
    expect(html).toContain('class="page"');
  });

  it("renders the wordmark inside an <h1>", () => {
    expect(html).toContain("<h1>");
    expect(html).toContain("your.brand");
  });

  it("renders nav links with ds nav class names", () => {
    expect(html).toContain("cs-nav");
    expect(html).toContain("cs-nav__link");
    expect(html).toContain('href="/"');
    expect(html).toContain("Home");
  });

  it("renders the content-grid wrapper", () => {
    expect(html).toContain('class="content-grid"');
  });

  it("renders footer with CC-BY-SA attribution", () => {
    expect(html).toContain('alt="CC-BY-SA"');
  });
});

describe("PageShell headerEnd slot", () => {
  const html = renderToStaticMarkup(
    <PageShell
      wordmark="your.brand"
      navLinks={[{ href: "/", label: "Home" }]}
      headerEnd={<button className="panel-toggle">▸</button>}
    >
      <main />
    </PageShell>,
  );

  it("renders headerEnd as a child of <header>", () => {
    expect(html).toMatch(
      /<header\b[^>]*>[\s\S]*?class="panel-toggle"[\s\S]*?<\/header>/,
    );
  });
});
