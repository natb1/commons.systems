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
const fellspiralHosting = firebaseConfig.hosting.find(
  (h: { target: string }) => h.target === "fellspiral",
);
if (!fellspiralHosting) {
  throw new Error("firebase.json missing hosting config with target 'fellspiral'");
}
const headers: { source: string; headers: { key: string; value: string }[] }[] =
  fellspiralHosting.headers;
if (!headers || headers.length === 0) {
  throw new Error("fellspiral hosting config has no header rules");
}

describe("fellspiral firebase headers", () => {
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

describe("fellspiral security headers", () => {
  const globalRule = headers.find((h) => h.source === "**");

  it("has a global ** source rule", () => {
    expect(globalRule).toBeDefined();
  });

  function getHeader(key: string): string | undefined {
    if (!globalRule) {
      throw new Error("Cannot look up headers: global ** rule is missing from firebase.json");
    }
    return globalRule.headers.find((h) => h.key === key)?.value;
  }

  describe("Content-Security-Policy", () => {
    const csp = getHeader("Content-Security-Policy");

    it("is present", () => {
      expect(csp).toBeDefined();
    });

    const requiredDirectives = [
      "default-src 'none'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self'",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ];

    for (const directive of requiredDirectives) {
      it(`contains ${directive}`, () => {
        expect(csp).toContain(directive);
      });
    }
  });

  it("sets Cross-Origin-Opener-Policy to same-origin", () => {
    expect(getHeader("Cross-Origin-Opener-Policy")).toBe("same-origin");
  });

  it("sets X-Frame-Options to DENY", () => {
    expect(getHeader("X-Frame-Options")).toBe("DENY");
  });

  describe("Strict-Transport-Security", () => {
    const hsts = getHeader("Strict-Transport-Security");

    it("includes includeSubDomains", () => {
      expect(hsts).toContain("includeSubDomains");
    });

    it("includes preload", () => {
      expect(hsts).toContain("preload");
    });

    it("includes max-age=31536000", () => {
      expect(hsts).toContain("max-age=31536000");
    });
  });
});
