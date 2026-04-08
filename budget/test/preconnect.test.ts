import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";

const indexPath = join(
  dirname(new URL(import.meta.url).pathname),
  "..",
  "index.html",
);
const html = readFileSync(indexPath, "utf-8");

describe("budget preconnect links", () => {
  it.each([
    "www.googleapis.com",
    "firebaseinstallations.googleapis.com",
    "apis.google.com",
    "firestore.googleapis.com",
  ])("preconnects to %s", (host) => {
    expect(html).toContain(
      `<link rel="preconnect" href="https://${host}" crossorigin`,
    );
  });
});
