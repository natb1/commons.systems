import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";

const distDir = join(dirname(new URL(import.meta.url).pathname), "..", "dist");
const indexPath = join(distDir, "index.html");

const hasDistBuild = existsSync(indexPath);
const html = hasDistBuild ? readFileSync(indexPath, "utf-8") : "";

describe.skipIf(!hasDistBuild)("meta description", () => {
  it("index.html contains a meta description tag", () => {
    expect(html).toMatch(/<meta name="description" content="[^"]+"/);
  });
});
