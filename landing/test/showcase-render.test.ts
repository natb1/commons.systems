import { describe, it, expect } from "vitest";
import { renderShowcase } from "../src/showcase-render";
import type { ProjectCard } from "../src/site-config";

const PROJECTS: ProjectCard[] = [
  {
    name: "Alpha",
    url: "https://alpha.example.com",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    description: "Alpha description.",
    problem: "Alpha problem statement.",
    screenshot: "/screenshots/alpha.png",
    screenshotAlt: "Alpha screenshot alt text.",
  },
  {
    name: "Beta",
    url: "https://beta.example.com",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    description: "Beta description.",
    problem: "Beta problem statement.",
    screenshot: "/screenshots/beta.png",
    screenshotAlt: "Beta screenshot alt text.",
  },
];

describe("renderShowcase", () => {
  it("contains the hero band headline", () => {
    const html = renderShowcase(PROJECTS);
    expect(html).toContain("Build with commons.systems. Learn to run without.");
  });

  it("contains exactly one project-card anchor per app", () => {
    const html = renderShowcase(PROJECTS);
    // The ds Card composes its own classes ahead of the consumer's, so each card
    // anchor is `<a class="cs-card cs-card--interactive project-card" ...>`. Match the
    // project-card token at the end of an anchor's class list (the closing quote
    // excludes the `project-card-screenshot` img, which also starts with project-card).
    const matches = html.match(/<a [^>]*class="[^"]*\bproject-card"/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBe(PROJECTS.length);
  });

  it("each anchor href matches the app url", () => {
    const html = renderShowcase(PROJECTS);
    for (const app of PROJECTS) {
      expect(html).toContain(`href="${app.url}"`);
    }
  });

  it("each image has loading=\"lazy\" and correct src and alt", () => {
    const html = renderShowcase(PROJECTS);
    for (const app of PROJECTS) {
      const imgRegex = new RegExp(
        `<img[^>]*loading="lazy"[^>]*src="${app.screenshot}"[^>]*alt="${app.screenshotAlt}"`,
      );
      const altFirstRegex = new RegExp(
        `<img[^>]*alt="${app.screenshotAlt}"[^>]*src="${app.screenshot}"[^>]*loading="lazy"`,
      );
      expect(imgRegex.test(html) || altFirstRegex.test(html)).toBe(true);
    }
  });

  it("HTML-escapes special characters in app.problem", () => {
    const apps: ProjectCard[] = [
      {
        ...PROJECTS[0],
        problem: "<script>alert('xss')</script>",
      },
    ];
    const html = renderShowcase(apps);
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
  });

  it("HTML-escapes special characters in app.url", () => {
    const apps: ProjectCard[] = [
      {
        ...PROJECTS[0],
        url: 'https://example.com/"onmouseover="alert(1)',
      },
    ];
    const html = renderShowcase(apps);
    expect(html).not.toContain('"onmouseover=');
    expect(html).toContain("&quot;");
  });

  describe("overflow tier", () => {
    const OVERFLOW: ProjectCard[] = [
      {
        name: "Gamma",
        url: "https://gamma.example.com",
        applicationCategory: "MultimediaApplication",
        operatingSystem: "Web",
        description: "Gamma description.",
        problem: "Gamma problem statement.",
        screenshot: "/screenshots/gamma.png",
        screenshotAlt: "Gamma screenshot alt text.",
      },
    ];

    it("includes the overflow card href in the SSR string (crawlable)", () => {
      const html = renderShowcase(PROJECTS, OVERFLOW);
      expect(html).toContain('href="https://gamma.example.com"');
    });

    it("renders a <details> that is collapsed by default", () => {
      const html = renderShowcase(PROJECTS, OVERFLOW);
      expect(html).toContain("<details");
      expect(html).not.toContain("<details open");
      expect(html).not.toMatch(/<details[^>]*\sopen/);
    });

    it("renders a <summary>", () => {
      const html = renderShowcase(PROJECTS, OVERFLOW);
      expect(html).toContain("<summary");
    });

    it("renders one <a class=\"project-card\" per primary and overflow app", () => {
      const html = renderShowcase(PROJECTS, OVERFLOW);
      const matches = html.match(/<a [^>]*class="[^"]*\bproject-card"/g);
      expect(matches).not.toBeNull();
      expect(matches).toHaveLength(PROJECTS.length + OVERFLOW.length);
    });

    it("renders no <details> when overflow is empty", () => {
      const html = renderShowcase(PROJECTS);
      expect(html).not.toContain("<details");
    });

    it("summary text is 'more…' and not 'More projects'", () => {
      const html = renderShowcase(PROJECTS, OVERFLOW);
      expect(html).toContain("more…");
      expect(html).not.toContain("More projects");
    });

    it("<details> overflow block appears after .landing-hero-grid in SSR output", () => {
      const html = renderShowcase(PROJECTS, OVERFLOW);
      const gridIndex = html.indexOf("landing-hero-grid");
      const detailsIndex = html.indexOf("<details");
      expect(detailsIndex).toBeGreaterThan(gridIndex);
    });
  });

  describe("band CTAs", () => {
    it("renders Learn More link to /about", () => {
      const html = renderShowcase(PROJECTS);
      expect(html).toContain('href="/about"');
      expect(html).toContain("Learn More");
    });

    it("renders Source link to the GitHub repo", () => {
      const html = renderShowcase(PROJECTS);
      expect(html).toContain('href="https://github.com/natb1/commons.systems"');
      expect(html).toContain("Source");
    });

    it("CTA row appears after the subline", () => {
      const html = renderShowcase(PROJECTS);
      const sublineIndex = html.indexOf("landing-hero-band-subline");
      const ctaIndex = html.indexOf("landing-hero-band-cta");
      expect(ctaIndex).toBeGreaterThan(sublineIndex);
    });
  });
});
