import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export type HeaderEntry = { key: string; value: string };
export type HeaderRule = { source: string; headers: HeaderEntry[] };

const STATIC_ASSET_CACHE = "public, max-age=31536000";
const HASHED_ASSET_CACHE = "public, max-age=31536000, immutable";

const CACHED_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "avif",
  "svg",
  "woff2",
];

function loadHeaders(target: string, firebaseJsonDir: string): HeaderRule[] {
  const firebaseJsonPath = join(firebaseJsonDir, "firebase.json");
  const firebaseConfig = JSON.parse(readFileSync(firebaseJsonPath, "utf-8"));
  const hosting = firebaseConfig.hosting.find(
    (h: { target: string }) => h.target === target,
  );
  if (!hosting) {
    throw new Error(
      `firebase.json missing hosting config with target '${target}'`,
    );
  }
  const headers: HeaderRule[] = hosting.headers;
  if (!headers || headers.length === 0) {
    throw new Error(`${target} hosting config has no header rules`);
  }
  return headers;
}

export function describeFirebaseHeaders(
  target: string,
  firebaseJsonDir: string,
): void {
  const headers = loadHeaders(target, firebaseJsonDir);

  describe(`${target} firebase headers`, () => {
    for (const ext of CACHED_EXTENSIONS) {
      it(`has a Cache-Control header for *.${ext} files`, () => {
        const rule = headers.find((h) => h.source === `**/*.${ext}`);
        expect(rule).toBeDefined();
        const cacheHeader = rule!.headers.find(
          (h) => h.key === "Cache-Control",
        );
        expect(
          cacheHeader,
          `Cache-Control header not found in rule for **/*.${ext}`,
        ).toBeDefined();
        expect(cacheHeader!.value).toBe(STATIC_ASSET_CACHE);
      });
    }

    it("has no unexpected extension-based cache rules", () => {
      const extensionRules = headers
        .filter((h) => h.source.match(/^\*\*\/\*\.\w+$/))
        .map((h) => h.source.replace("**/*.", ""));
      expect(extensionRules.sort()).toEqual([...CACHED_EXTENSIONS].sort());
    });

    it("has an immutable Cache-Control header for /assets/**", () => {
      const rule = headers.find((h) => h.source === "/assets/**");
      expect(rule).toBeDefined();
      const cacheHeader = rule!.headers.find(
        (h) => h.key === "Cache-Control",
      );
      expect(
        cacheHeader,
        "Cache-Control header not found in /assets/** rule",
      ).toBeDefined();
      expect(cacheHeader!.value).toBe(HASHED_ASSET_CACHE);
    });

    it("does not use extglob syntax in any header source", () => {
      for (const rule of headers) {
        expect(rule.source).not.toMatch(/@\(/);
      }
    });
  });
}
