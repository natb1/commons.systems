import {
  describeFirebaseHeaders,
  type HeaderRule,
} from "@commons-systems/config/firebase-headers.test-helper";
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const firebaseJsonDir = join(import.meta.dirname, "..", "..");

describeFirebaseHeaders("fellspiral", firebaseJsonDir);

const firebaseConfig = JSON.parse(
  readFileSync(join(firebaseJsonDir, "firebase.json"), "utf-8"),
);
const fellspiralHosting = firebaseConfig.hosting.find(
  (h: { target: string }) => h.target === "fellspiral",
);
if (!fellspiralHosting) {
  throw new Error("firebase.json missing hosting config with target 'fellspiral'");
}
const headers: HeaderRule[] = fellspiralHosting.headers;

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
