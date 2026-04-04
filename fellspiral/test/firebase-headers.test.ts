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
