import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Button,
  Badge,
  Card,
  Metric,
  Input,
  Select,
  Checkbox,
  Nav,
} from "../src/index.ts";

describe("all eight components importable from the barrel", () => {
  it("each export is a function", () => {
    expect(typeof Button).toBe("function");
    expect(typeof Badge).toBe("function");
    expect(typeof Card).toBe("function");
    expect(typeof Metric).toBe("function");
    expect(typeof Input).toBe("function");
    expect(typeof Select).toBe("function");
    expect(typeof Checkbox).toBe("function");
    expect(typeof Nav).toBe("function");
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
    const html = renderToStaticMarkup(
      <Card as="a" href="/">
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
});

describe("resting styles from tokens", () => {
  it("primary Button markup contains var(--accent)", () => {
    const html = renderToStaticMarkup(<Button variant="primary">Go</Button>);
    expect(html).toContain("var(--accent)");
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
