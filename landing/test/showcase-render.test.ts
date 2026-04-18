import { describe, it, expect } from "vitest";
import { renderShowcase } from "../src/showcase-render";
import type { AppCard } from "../src/site-config";

const APPS: AppCard[] = [
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
    const html = renderShowcase(APPS);
    expect(html).toContain("Build with commons.systems. Run without.");
  });

  it("contains exactly one <a class=\"app-card\" per app", () => {
    const html = renderShowcase(APPS);
    const matches = html.match(/<a class="app-card"/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBe(APPS.length);
  });

  it("each anchor href matches the app url", () => {
    const html = renderShowcase(APPS);
    for (const app of APPS) {
      expect(html).toContain(`href="${app.url}"`);
    }
  });

  it("each image has loading=\"lazy\" and correct src and alt", () => {
    const html = renderShowcase(APPS);
    for (const app of APPS) {
      const imgRegex = new RegExp(
        `<img[^>]*loading="lazy"[^>]*src="${app.screenshot}"[^>]*alt="${app.screenshotAlt}"`,
      );
      const altFirstRegex = new RegExp(
        `<img[^>]*alt="${app.screenshotAlt}"[^>]*src="${app.screenshot}"[^>]*loading="lazy"`,
      );
      expect(imgRegex.test(html) || altFirstRegex.test(html)).toBe(true);
      expect(html).toContain(`src="${app.screenshot}"`);
      expect(html).toContain(`alt="${app.screenshotAlt}"`);
      expect(html).toContain(`loading="lazy"`);
    }
  });

  it("HTML-escapes special characters in app.problem", () => {
    const apps: AppCard[] = [
      {
        ...APPS[0],
        problem: "<script>alert('xss')</script>",
      },
    ];
    const html = renderShowcase(apps);
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
  });
});
