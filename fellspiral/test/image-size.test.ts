import { describe, it, expect } from "vitest";
import { existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";

const publicDir = join(
  dirname(new URL(import.meta.url).pathname),
  "..",
  "public",
);
const imagePath = join(publicDir, "blog-map-color-800w.webp");

const imageExists = existsSync(imagePath);

describe.skipIf(!imageExists)("image compression", () => {
  it("blog-map-color-800w.webp is under 55,000 bytes", () => {
    const { size } = statSync(imagePath);
    expect(size).toBeLessThan(55_000);
  });
});
