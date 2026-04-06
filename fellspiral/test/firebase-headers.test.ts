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

  for (const ext of cachedExtensions) {
    it(`has a Cache-Control header for *.${ext} files`, () => {
      const rule = headers.find((h) => h.source === `**/*.${ext}`);
      expect(rule).toBeDefined();
      const cacheHeader = rule!.headers.find(
        (h) => h.key === "Cache-Control",
      );
      expect(cacheHeader?.value).toBe("public, max-age=86400");
    });
  }

  it("has an immutable Cache-Control header for /assets/**", () => {
    const rule = headers.find((h) => h.source === "/assets/**");
    expect(rule).toBeDefined();
    const cacheHeader = rule!.headers.find((h) => h.key === "Cache-Control");
    expect(cacheHeader?.value).toBe(
      "public, max-age=31536000, immutable",
    );
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
    return globalRule?.headers.find((h) => h.key === key)?.value;
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
  });
});
