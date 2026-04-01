import { describe, it, expect } from "vitest";
import { validatePublishedPosts } from "../src/post-types";

function makeSeed(documents: Array<{ id: string; data: Record<string, unknown> }>) {
  return { collections: [{ name: "posts", documents }] };
}

describe("validatePublishedPosts", () => {
  it("returns published posts with all fields populated", () => {
    const seed = makeSeed([
      {
        id: "post-a",
        data: {
          title: "Post A",
          published: true,
          publishedAt: "2026-01-15T00:00:00Z",
          filename: "post-a.md",
        },
      },
    ]);

    const result = validatePublishedPosts(seed);

    expect(result).toEqual([
      {
        id: "post-a",
        title: "Post A",
        published: true,
        publishedAt: "2026-01-15T00:00:00Z",
        filename: "post-a.md",
        previewImage: undefined,
        previewDescription: undefined,
      },
    ]);
  });

  it("filters out unpublished posts", () => {
    const seed = makeSeed([
      {
        id: "published",
        data: { title: "Published", published: true, publishedAt: "2026-01-01T00:00:00Z", filename: "pub.md" },
      },
      {
        id: "draft",
        data: { title: "Draft", published: false, publishedAt: null, filename: "draft.md" },
      },
    ]);

    const result = validatePublishedPosts(seed);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("published");
  });

  it("throws when posts collection is missing from seed", () => {
    const seed = { collections: [{ name: "other", documents: [] }] };

    expect(() => validatePublishedPosts(seed)).toThrow("No 'posts' collection found in seed data");
  });

  it("throws when published post is missing title", () => {
    const seed = makeSeed([
      { id: "bad", data: { published: true, publishedAt: "2026-01-01T00:00:00Z", filename: "bad.md" } },
    ]);

    expect(() => validatePublishedPosts(seed)).toThrow('Post "bad" is missing a title');
  });

  it("throws when published post is missing filename", () => {
    const seed = makeSeed([
      { id: "bad", data: { title: "Bad", published: true, publishedAt: "2026-01-01T00:00:00Z" } },
    ]);

    expect(() => validatePublishedPosts(seed)).toThrow('Post "bad" is missing a filename');
  });

  it("throws when published post is missing publishedAt", () => {
    const seed = makeSeed([
      { id: "bad", data: { title: "Bad", published: true, filename: "bad.md" } },
    ]);

    expect(() => validatePublishedPosts(seed)).toThrow('Post "bad" is missing a publishedAt');
  });

  it("includes optional previewImage and previewDescription when present", () => {
    const seed = makeSeed([
      {
        id: "rich",
        data: {
          title: "Rich Post",
          published: true,
          publishedAt: "2026-03-01T00:00:00Z",
          filename: "rich.md",
          previewImage: "/img/preview.png",
          previewDescription: "A short description",
        },
      },
    ]);

    const result = validatePublishedPosts(seed);

    expect(result[0].previewImage).toBe("/img/preview.png");
    expect(result[0].previewDescription).toBe("A short description");
  });
});
