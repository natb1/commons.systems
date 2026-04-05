import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";

const distDir = join(dirname(new URL(import.meta.url).pathname), "..", "dist");
const indexPath = join(distDir, "index.html");

const hasDistBuild = existsSync(indexPath);
const html = hasDistBuild ? readFileSync(indexPath, "utf-8") : "";

describe.skipIf(!hasDistBuild)("critical CSS inlining", () => {
  it("index.html contains an inline <style> element in the head", () => {
    const head = html.match(/<head[\s\S]*?<\/head>/)?.[0] ?? "";
    expect(head).toMatch(/<style[\s\S]*?<\/style>/);
  });

  it('stylesheet <link> has media="print" for async loading', () => {
    const linkMatch = html.match(/<link[^>]*rel="stylesheet"[^>]*>/);
    expect(linkMatch).not.toBeNull();
    expect(linkMatch![0]).toContain('media="print"');
  });

  it("stylesheet <link> has an onload attribute to swap media", () => {
    const linkMatch = html.match(/<link[^>]*rel="stylesheet"[^>]*>/);
    expect(linkMatch).not.toBeNull();
    expect(linkMatch![0]).toMatch(/onload=/);
  });

  it("inline <style> contains a containment rule", () => {
    const styleMatch = html.match(/<style[\s\S]*?<\/style>/);
    expect(styleMatch).not.toBeNull();
    expect(styleMatch![0]).toMatch(/contain:/);
  });

  it('<noscript> fallback link does NOT have media="print"', () => {
    const noscriptMatch = html.match(/<noscript>[\s\S]*?<\/noscript>/);
    expect(noscriptMatch).not.toBeNull();
    const noscriptLink = noscriptMatch![0].match(
      /<link[^>]*rel="stylesheet"[^>]*>/,
    );
    expect(noscriptLink).not.toBeNull();
    expect(noscriptLink![0]).not.toContain('media="print"');
  });
});
