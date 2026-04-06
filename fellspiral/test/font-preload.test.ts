import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";

const srcDir = join(dirname(new URL(import.meta.url).pathname), "..");
const indexPath = join(srcDir, "index.html");

const html = readFileSync(indexPath, "utf-8");

describe("font preload links", () => {
  it("does not preload fonts (font-display: optional makes preloads wasteful)", () => {
    const preloadLinks = [
      ...html.matchAll(/<link[^>]*rel="preload"[^>]*as="font"[^>]*>/g),
    ];
    expect(preloadLinks).toHaveLength(0);
  });
});
