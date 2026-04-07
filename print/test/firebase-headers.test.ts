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
const printHosting = firebaseConfig.hosting.find(
  (h: { target: string }) => h.target === "print",
);
if (!printHosting) {
  throw new Error("firebase.json missing hosting config with target 'print'");
}
const headers: { source: string; headers: { key: string; value: string }[] }[] =
  printHosting.headers;
if (!headers || headers.length === 0) {
  throw new Error("print hosting config has no header rules");
}

describe("print security headers", () => {
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
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self'",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self'",
      "frame-src 'self'",
      "worker-src 'self' https://cdn.jsdelivr.net",
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
