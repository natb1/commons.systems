import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";

const testDir = dirname(new URL(import.meta.url).pathname);
const publicDir = join(testDir, "..", "public");
const manifestPath = join(publicDir, "manifest.webmanifest");
const indexPath = join(testDir, "..", "index.html");

const manifest = JSON.parse(readFileSync(manifestPath, "utf-8")) as {
  name: string;
  short_name: string;
  start_url: string;
  display: string;
  background_color: string;
  theme_color: string;
  icons: Array<{ src: string; sizes: string; type: string; purpose: string }>;
};
const html = readFileSync(indexPath, "utf-8");

describe("web app manifest", () => {
  it("name and short_name are non-empty strings", () => {
    expect(typeof manifest.name).toBe("string");
    expect(manifest.name.length).toBeGreaterThan(0);
    expect(typeof manifest.short_name).toBe("string");
    expect(manifest.short_name.length).toBeGreaterThan(0);
  });

  it("start_url is /", () => {
    expect(manifest.start_url).toBe("/");
  });

  it("display is standalone", () => {
    expect(manifest.display).toBe("standalone");
  });

  it("background_color and theme_color start with #", () => {
    expect(manifest.background_color).toMatch(/^#/);
    expect(manifest.theme_color).toMatch(/^#/);
  });

  it("icons includes a 192x192 png entry", () => {
    const icon = manifest.icons.find((i) => i.sizes === "192x192");
    expect(icon).toBeDefined();
    expect(icon?.type).toBe("image/png");
  });

  it("icons includes a 512x512 png entry", () => {
    const icon = manifest.icons.find((i) => i.sizes === "512x512");
    expect(icon).toBeDefined();
    expect(icon?.type).toBe("image/png");
  });

  it("icons includes at least one maskable entry", () => {
    const maskable = manifest.icons.find((i) => i.purpose.includes("maskable"));
    expect(maskable).toBeDefined();
  });

  it("every icon src resolves to an existing file under public/", () => {
    for (const icon of manifest.icons) {
      const filePath = join(publicDir, icon.src.replace(/^\//, ""));
      expect(existsSync(filePath), `missing icon file: ${icon.src}`).toBe(true);
    }
  });

  it("index.html links to manifest.webmanifest", () => {
    expect(html).toContain(`rel="manifest" href="/manifest.webmanifest"`);
  });

  it("index.html contains apple-touch-icon link", () => {
    expect(html).toContain(`rel="apple-touch-icon"`);
  });

  it("index.html contains the SVG favicon link", () => {
    expect(html).toContain(`rel="icon" type="image/svg+xml" href="/icons/icon.svg"`);
  });

  it("index.html contains theme-color meta", () => {
    expect(html).toMatch(/<meta name="theme-color"/);
  });
});
