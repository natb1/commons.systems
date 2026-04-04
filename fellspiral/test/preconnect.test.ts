import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";

const indexPath = join(
  dirname(new URL(import.meta.url).pathname),
  "..",
  "index.html",
);
const html = readFileSync(indexPath, "utf-8");

describe("fellspiral preconnect links", () => {
  it("preconnects to www.googleapis.com", () => {
    expect(html).toContain(
      '<link rel="preconnect" href="https://www.googleapis.com"',
    );
  });

  it("preconnects to firebaseinstallations.googleapis.com", () => {
    expect(html).toContain(
      '<link rel="preconnect" href="https://firebaseinstallations.googleapis.com"',
    );
  });
});
