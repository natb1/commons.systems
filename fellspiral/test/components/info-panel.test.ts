import { describe, it, expect, vi } from "vitest";
import fs from "fs";
import path from "path";

vi.mock("../../src/firebase", () => ({
  getAppCheckHeaders: undefined,
}));

import { BLOG_ROLL_ENTRIES } from "../../src/blog-roll/config";

describe("OPML/config sync", () => {
  it("blogroll.opml entries match BLOG_ROLL_ENTRIES in order", () => {
    const opmlPath = path.resolve(__dirname, "../../public/blogroll.opml");
    const opml = fs.readFileSync(opmlPath, "utf-8");

    const outlineRegex = /<outline\s[^>]*text="([^"]*)"[^>]*htmlUrl="([^"]*)"[^>]*\/>/g;
    const opmlEntries: { name: string; url: string }[] = [];
    let match;
    while ((match = outlineRegex.exec(opml)) !== null) {
      opmlEntries.push({ name: match[1], url: match[2] });
    }

    const configEntries = BLOG_ROLL_ENTRIES.map((e) => ({
      name: e.name,
      url: e.url,
    }));

    expect(opmlEntries).toEqual(configEntries);
  });
});
