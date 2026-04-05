import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";

const srcDir = join(dirname(new URL(import.meta.url).pathname), "..");
const indexPath = join(srcDir, "index.html");

const html = readFileSync(indexPath, "utf-8");

describe("font preload links", () => {
  const preloadLinks = [...html.matchAll(/<link[^>]*rel="preload"[^>]*>/g)].map(
    (m) => m[0],
  );

  it("preloads uncial-antiqua-latin-400-normal.woff2", () => {
    const link = preloadLinks.find((l) =>
      l.includes("/fonts/uncial-antiqua-latin-400-normal.woff2"),
    );
    expect(link).toBeDefined();
  });

  it("preloads eb-garamond-latin-400-normal.woff2", () => {
    const link = preloadLinks.find((l) =>
      l.includes("/fonts/eb-garamond-latin-400-normal.woff2"),
    );
    expect(link).toBeDefined();
  });

  it('preload links have as="font", type="font/woff2", and crossorigin', () => {
    for (const link of preloadLinks) {
      expect(link).toContain('as="font"');
      expect(link).toContain('type="font/woff2"');
      expect(link).toContain("crossorigin");
    }
  });
});
