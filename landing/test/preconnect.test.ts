import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";

const indexPath = join(
  dirname(new URL(import.meta.url).pathname),
  "..",
  "index.html",
);
const html = readFileSync(indexPath, "utf-8");

describe("landing preconnect links", () => {
  it("preconnects to firebaseinstallations.googleapis.com (SDK init)", () => {
    expect(html).toContain(
      `<link rel="preconnect" href="https://firebaseinstallations.googleapis.com" />`,
    );
  });

  it.each([
    "www.googleapis.com",
    "apis.google.com",
    "firestore.googleapis.com",
  ])("does not preconnect to %s (not used on initial load)", (host) => {
    expect(html).not.toContain(
      `<link rel="preconnect" href="https://${host}"`,
    );
  });
});
