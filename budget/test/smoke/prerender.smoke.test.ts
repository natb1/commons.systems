import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";

const distDir = join(dirname(new URL(import.meta.url).pathname), "..", "..", "dist");
const indexPath = join(distDir, "index.html");

const hasDistBuild = existsSync(indexPath);
const html = hasDistBuild ? readFileSync(indexPath, "utf-8") : "";

describe.skipIf(!hasDistBuild)("prerender build output", () => {
  it("index.html is non-empty", () => {
    expect(html.length).toBeGreaterThan(0);
  });

  it("nav links were pre-rendered", () => {
    expect(html).toContain('<span class="nav-links">');
  });

  it("budgets table was pre-rendered", () => {
    expect(html).toContain('id="budgets-table"');
  });

  it("seed data notice was included", () => {
    expect(html).toContain('id="seed-data-notice"');
  });

  it("references a JS module asset", () => {
    expect(html).toMatch(/<script type="module"[^>]+src="[^"]+\.js"/);
  });

  it("references a CSS asset", () => {
    expect(html).toMatch(/<link[^>]+href="[^"]+\.css"/);
  });
});
