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
  it("preconnects to www.googleapis.com with crossorigin (auth uses CORS)", () => {
    expect(html).toContain(
      `<link rel="preconnect" href="https://www.googleapis.com" crossorigin`,
    );
  });

  it.each([
    "firebaseinstallations.googleapis.com",
    "apis.google.com",
    "firestore.googleapis.com",
  ])("preconnects to %s without crossorigin", (host) => {
    expect(html).toContain(`<link rel="preconnect" href="https://${host}" />`);
    expect(html).not.toContain(
      `<link rel="preconnect" href="https://${host}" crossorigin`,
    );
  });
});
