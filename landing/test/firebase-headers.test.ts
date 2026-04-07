import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";

const firebaseJsonPath = join(
  dirname(new URL(import.meta.url).pathname),
  "..",
  "..",
  "firebase.json",
);
const firebaseConfig = JSON.parse(readFileSync(firebaseJsonPath, "utf-8"));
const landingHosting = firebaseConfig.hosting.find(
  (h: { target: string }) => h.target === "landing",
);
if (!landingHosting) {
  throw new Error("firebase.json missing hosting config with target 'landing'");
}
const headers: { source: string; headers: { key: string; value: string }[] }[] =
  landingHosting.headers;
if (!headers || headers.length === 0) {
  throw new Error("landing hosting config has no header rules");
}

describe("landing firebase headers", () => {
  const cachedExtensions = [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "avif",
    "svg",
    "woff2",
  ];

  const STATIC_ASSET_CACHE = "public, max-age=31536000";
  const HASHED_ASSET_CACHE = "public, max-age=31536000, immutable";

  for (const ext of cachedExtensions) {
    it(`has a Cache-Control header for *.${ext} files`, () => {
      const rule = headers.find((h) => h.source === `**/*.${ext}`);
      expect(rule).toBeDefined();
      const cacheHeader = rule!.headers.find(
        (h) => h.key === "Cache-Control",
      );
      expect(cacheHeader, `Cache-Control header not found in rule for **/*.${ext}`).toBeDefined();
      expect(cacheHeader!.value).toBe(STATIC_ASSET_CACHE);
    });
  }

  it("has no unexpected extension-based cache rules", () => {
    const extensionRules = headers
      .filter((h) => h.source.match(/^\*\*\/\*\.\w+$/))
      .map((h) => h.source.replace("**/*.", ""));
    expect(extensionRules.sort()).toEqual([...cachedExtensions].sort());
  });

  it("has an immutable Cache-Control header for /assets/**", () => {
    const rule = headers.find((h) => h.source === "/assets/**");
    expect(rule).toBeDefined();
    const cacheHeader = rule!.headers.find((h) => h.key === "Cache-Control");
    expect(cacheHeader, "Cache-Control header not found in /assets/** rule").toBeDefined();
    expect(cacheHeader!.value).toBe(HASHED_ASSET_CACHE);
  });

  it("does not use extglob syntax in any header source", () => {
    for (const rule of headers) {
      expect(rule.source).not.toMatch(/@\(/);
    }
  });
});
