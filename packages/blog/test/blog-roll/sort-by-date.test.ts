import { describe, it, expect } from "vitest";
import { sortBlogrollByPublishedDesc, type BlogRollItem } from "../../src/blog-roll/sort-by-date";

const entry = (id: string) => ({ id, name: id, url: `https://${id}.example.com` });

describe("sortBlogrollByPublishedDesc", () => {
  it("sorts entries newest-first by publishedAt", () => {
    const items: BlogRollItem[] = [
      { entry: entry("a"), post: { title: "A", url: "/a", publishedAt: "2024-01-01" } },
      { entry: entry("b"), post: { title: "B", url: "/b", publishedAt: "2024-06-15" } },
      { entry: entry("c"), post: { title: "C", url: "/c", publishedAt: "2023-12-31" } },
    ];
    const result = sortBlogrollByPublishedDesc(items);
    expect(result.map((i) => i.entry.id)).toEqual(["b", "a", "c"]);
  });

  it("sorts entries with missing publishedAt last", () => {
    const items: BlogRollItem[] = [
      { entry: entry("no-post"), post: null },
      { entry: entry("dated"), post: { title: "D", url: "/d", publishedAt: "2024-03-01" } },
      { entry: entry("empty-date"), post: { title: "E", url: "/e", publishedAt: "" } },
    ];
    const result = sortBlogrollByPublishedDesc(items);
    expect(result[0].entry.id).toBe("dated");
    expect(result.slice(1).map((i) => i.entry.id)).toEqual(
      expect.arrayContaining(["no-post", "empty-date"]),
    );
  });

  it("treats both-missing as equal (preserves relative order)", () => {
    const items: BlogRollItem[] = [
      { entry: entry("x"), post: null },
      { entry: entry("y"), post: { title: "Y", url: "/y", publishedAt: "" } },
    ];
    const result = sortBlogrollByPublishedDesc(items);
    // both missing → comparator returns 0 → stable sort preserves original order
    expect(result.map((i) => i.entry.id)).toEqual(["x", "y"]);
  });

  it("does not mutate the input array", () => {
    const items: BlogRollItem[] = [
      { entry: entry("old"), post: { title: "Old", url: "/old", publishedAt: "2022-01-01" } },
      { entry: entry("new"), post: { title: "New", url: "/new", publishedAt: "2025-01-01" } },
    ];
    const originalFirst = items[0];
    const originalSecond = items[1];
    sortBlogrollByPublishedDesc(items);
    expect(items[0]).toBe(originalFirst);
    expect(items[1]).toBe(originalSecond);
  });
});
