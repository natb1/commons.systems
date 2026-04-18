import { describe, it, expect } from "vitest";
import { renderShowcase } from "../src/showcase-render";
import type { AppCard, Dependency } from "../src/site-config";

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

const DEPS: Dependency[] = [
  {
    name: "Dep1",
    solves: "solves1",
    classification: "class1",
    exitPath: "exit1",
    ratchetRisk: "risk1",
  },
  {
    name: "Dep2",
    solves: "solves2",
    classification: "class2",
    exitPath: "exit2",
    ratchetRisk: "risk2",
  },
  {
    name: "Dep3",
    solves: "solves3",
    classification: "class3",
    exitPath: "exit3",
    ratchetRisk: "risk3",
  },
];

describe("renderShowcase", () => {
  it("contains the hero band headline", () => {
    const html = renderShowcase(APPS, DEPS);
    expect(html).toContain("Build with commons.systems. Run without.");
  });

  it("contains exactly one <a class=\"app-card\" per app", () => {
    const html = renderShowcase(APPS, DEPS);
    const matches = html.match(/<a class="app-card"/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBe(APPS.length);
  });

  it("each anchor href matches the app url", () => {
    const html = renderShowcase(APPS, DEPS);
    for (const app of APPS) {
      expect(html).toContain(`href="${app.url}"`);
    }
  });

  it("each image has loading=\"lazy\" and correct src and alt", () => {
    const html = renderShowcase(APPS, DEPS);
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

  it("table has a <tbody> containing one <tr> per dependency", () => {
    const html = renderShowcase(APPS, DEPS);
    const tbodyMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/);
    expect(tbodyMatch).not.toBeNull();
    const tbody = tbodyMatch![1];
    const rows = tbody.match(/<tr>/g);
    expect(rows).not.toBeNull();
    expect(rows!.length).toBe(DEPS.length);
  });

  it("table <thead> has 5 <th scope=\"col\"> columns", () => {
    const html = renderShowcase(APPS, DEPS);
    const theadMatch = html.match(/<thead>([\s\S]*?)<\/thead>/);
    expect(theadMatch).not.toBeNull();
    const thead = theadMatch![1];
    const cols = thead.match(/<th scope="col">/g);
    expect(cols).not.toBeNull();
    expect(cols!.length).toBe(5);
    expect(thead).toContain("Dependency");
    expect(thead).toContain("Solves");
    expect(thead).toContain("Required or parasitic?");
    expect(thead).toContain("Exit path");
    expect(thead).toContain("Ratchet risk");
  });

  it("HTML-escapes special characters in app.problem", () => {
    const apps: AppCard[] = [
      {
        ...APPS[0],
        problem: "<script>alert('xss')</script>",
      },
    ];
    const html = renderShowcase(apps, DEPS);
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
  });
});
