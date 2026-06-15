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

  it("stylesheet <link> defers without an inline event handler", () => {
    const linkMatch = html.match(/<link[^>]*rel="stylesheet"[^>]*>/);
    expect(linkMatch).not.toBeNull();
    expect(linkMatch![0]).not.toContain('media="print"');
    expect(linkMatch![0]).not.toMatch(/onload=/);
    // No inline event handler anywhere in the document.
    expect(html).not.toMatch(/onload=/);
  });

  it("inline <style> contains a containment rule", () => {
    const styleMatch = html.match(/<style[\s\S]*?<\/style>/);
    expect(styleMatch).not.toBeNull();
    expect(styleMatch![0]).toMatch(/contain:/);
  });

  it("full stylesheet <link> is moved into the body", () => {
    const splitIdx = html.indexOf("</head>");
    expect(splitIdx).toBeGreaterThan(-1);
    const body = html.slice(splitIdx);
    expect(body).toMatch(/<link[^>]*rel="stylesheet"[^>]*>/);
  });
});
