import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { AnchorHTMLAttributes } from "react";
import {
  Button,
  Badge,
  Card,
  Metric,
  Input,
  Select,
  Checkbox,
  Nav,
  Landing,
  Hero,
  ContextPanel,
  ContextPanelToggle,
} from "../src/index.ts";

describe("all nine components importable from the barrel", () => {
  // A renderable React component is either a function component or a
  // forwardRef/memo exotic object (those carry a `$$typeof` symbol). Button and
  // Input forward refs, so they are objects rather than bare functions.
  const isRenderable = (c: unknown): boolean =>
    typeof c === "function" ||
    (typeof c === "object" && c !== null && "$$typeof" in c);

  it("each export is a renderable component", () => {
    expect(isRenderable(Button)).toBe(true);
    expect(isRenderable(Badge)).toBe(true);
    expect(isRenderable(Card)).toBe(true);
    expect(isRenderable(Metric)).toBe(true);
    expect(isRenderable(Input)).toBe(true);
    expect(isRenderable(Select)).toBe(true);
    expect(isRenderable(Checkbox)).toBe(true);
    expect(isRenderable(Nav)).toBe(true);
    expect(isRenderable(Landing)).toBe(true);
    expect(isRenderable(Hero)).toBe(true);
    expect(isRenderable(ContextPanel)).toBe(true);
    expect(isRenderable(ContextPanelToggle)).toBe(true);
  });
});

describe("cs-* class names", () => {
  it("Button renders cs-btn and cs-btn--primary", () => {
    const html = renderToStaticMarkup(<Button variant="primary">Go</Button>);
    expect(html).toContain("cs-btn");
    expect(html).toContain("cs-btn--primary");
  });

  it("Badge renders cs-badge and cs-badge--accent", () => {
    const html = renderToStaticMarkup(<Badge variant="accent">New</Badge>);
    expect(html).toContain("cs-badge");
    expect(html).toContain("cs-badge--accent");
  });

  it("Card renders cs-card", () => {
    const html = renderToStaticMarkup(<Card>Content</Card>);
    expect(html).toContain("cs-card");
  });

  it("interactive Card renders cs-card--interactive", () => {
    const html = renderToStaticMarkup(<Card interactive>Content</Card>);
    expect(html).toContain("cs-card--interactive");
  });

  it("polymorphic Card with as='a' renders an <a> and is interactive", () => {
    const anchorProps: AnchorHTMLAttributes<HTMLAnchorElement> = { href: "/" };
    const html = renderToStaticMarkup(
      <Card as="a" {...anchorProps}>
        Content
      </Card>,
    );
    expect(html).toMatch(/<a[^>]*>/);
    expect(html).toContain("cs-card--interactive");
  });

  it("Card with onClick is auto-detected as interactive", () => {
    const html = renderToStaticMarkup(<Card onClick={() => {}}>Content</Card>);
    expect(html).toContain("cs-card--interactive");
  });

  it("Metric renders cs-metric", () => {
    const html = renderToStaticMarkup(<Metric label="Revenue" value="$1k" />);
    expect(html).toContain("cs-metric");
  });

  it("Input with label renders cs-input and cs-field", () => {
    const html = renderToStaticMarkup(<Input label="Email" />);
    expect(html).toContain("cs-input");
    expect(html).toContain("cs-field");
  });

  it("Select with label renders cs-select and cs-field", () => {
    const html = renderToStaticMarkup(
      <Select label="Color" options={["a", "b"]} />,
    );
    expect(html).toContain("cs-select");
    expect(html).toContain("cs-field");
  });

  it("Input in error state sets aria-invalid, error token, and message", () => {
    const html = renderToStaticMarkup(<Input error="Required" />);
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain("var(--error)");
    expect(html).toContain("Required");
  });

  it("Select in error state sets aria-invalid, error token, and message", () => {
    const html = renderToStaticMarkup(
      <Select error="Required" options={[]} />,
    );
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain("var(--error)");
    expect(html).toContain("Required");
  });

  it("Checkbox renders cs-checkbox", () => {
    const html = renderToStaticMarkup(<Checkbox label="Agree" />);
    expect(html).toContain("cs-checkbox");
  });

  it("Nav renders cs-nav and cs-nav__link", () => {
    const html = renderToStaticMarkup(
      <Nav links={[{ href: "/", label: "Home" }]} />,
    );
    expect(html).toContain("cs-nav");
    expect(html).toContain("cs-nav__link");
  });

  it("Nav marks the current link with aria-current='page'", () => {
    const html = renderToStaticMarkup(
      <Nav links={[{ href: "/a", label: "A" }]} current="/a" />,
    );
    expect(html).toContain('aria-current="page"');
  });

  it("Landing renders the page shell with sticky header, grid, and panel", () => {
    const html = renderToStaticMarkup(<Landing />);
    expect(html).toContain("cs-landing");
    expect(html).toContain("content-grid");
    expect(html).toContain("sidebar");
    expect(html).toContain("panel-toggle");
    expect(html).toContain("<header");
    expect(html).toContain("<footer");
    // Composes the shared Nav primitive rather than a bespoke one.
    expect(html).toContain("cs-nav");
    expect(html).toContain("hero-band");
    expect(html).toContain("context-panel");
  });
});

describe("resting styles from tokens", () => {
  it("primary Button markup contains var(--accent)", () => {
    const html = renderToStaticMarkup(<Button variant="primary">Go</Button>);
    expect(html).toContain("var(--accent)");
  });
});

describe("Hero and ContextPanel primitives", () => {
  it("Hero renders the hero-band band and grid", () => {
    const html = renderToStaticMarkup(
      <Hero
        headline="Ship faster"
        subline="A promise"
        ctas={[{ label: "Get started", href: "#" }]}
        cards={[{ name: "App one", problem: "Solves a thing", href: "#" }]}
      />,
    );
    expect(html).toContain("hero-band-section");
    expect(html).toContain("hero-band");
    expect(html).toContain("hero-band-grid");
    expect(html).toContain("Ship faster");
    // CTA link and a card render
    expect(html).toContain("Get started");
    expect(html).toContain("App one");
  });

  it("ContextPanel renders an aside with sidebar context-panel classes", () => {
    const html = renderToStaticMarkup(
      <ContextPanel open id="panel-1" aria-label="Context">
        <p>Panel body</p>
      </ContextPanel>,
    );
    expect(html).toMatch(/<aside[^>]*>/);
    expect(html).toContain("sidebar");
    expect(html).toContain("context-panel");
    expect(html).toContain("open");
    expect(html).toContain('id="panel-1"');
    expect(html).toContain("Panel body");
  });

  it("ContextPanelToggle renders panel-toggle with aria wiring", () => {
    const html = renderToStaticMarkup(
      <ContextPanelToggle open={false} onToggle={() => {}} controls="panel-1" />,
    );
    expect(html).toContain("panel-toggle");
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-controls="panel-1"');
  });
});

describe("...rest passthrough", () => {
  it("data-* attribute on Button appears in its markup", () => {
    const html = renderToStaticMarkup(
      <Button data-testid="b">Go</Button>,
    );
    expect(html).toContain('data-testid="b"');
  });

  it("Checkbox rest props land on the <input>, not the label", () => {
    const html = renderToStaticMarkup(
      <Checkbox label="Agree" data-testid="cb" />,
    );
    expect(html).toMatch(/<input[^>]*data-testid="cb"/);
  });
});
