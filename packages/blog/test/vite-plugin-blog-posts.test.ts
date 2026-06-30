import { describe, it, expect } from "vitest";
import { blogPostsPlugin } from "../src/vite-plugin-blog-posts";

const testSeed = {
  collections: [
    {
      name: "posts",
      documents: [
        {
          id: "post-a",
          data: {
            title: "Post A",
            published: true,
            publishedAt: "2026-01-15T00:00:00Z",
            filename: "post-a.md",
          },
        },
        {
          id: "post-b",
          data: {
            title: "Post B",
            published: true,
            publishedAt: "2026-02-01T00:00:00Z",
            filename: "post-b.md",
          },
        },
        {
          id: "draft",
          data: {
            title: "Draft",
            published: false,
            publishedAt: null,
            filename: "draft.md",
          },
        },
      ],
    },
  ],
};

function createReadFile(files: Record<string, string>) {
  return (path: string) => {
    for (const [name, content] of Object.entries(files)) {
      if (path.endsWith(name)) return content;
    }
    throw new Error(`ENOENT: no such file or directory, open '${path}'`);
  };
}

function parseVirtualModule(moduleCode: string): unknown {
  return JSON.parse(moduleCode.replace("export default ", "").replace(/;$/, ""));
}

describe("blogPostsPlugin", () => {
  it("reads markdown files and produces correct HTML content", async () => {
    const plugin = blogPostsPlugin({
      seed: testSeed,
      postDir: "/fake/posts",
      readFile: createReadFile({
        "post-a.md": "# Hello World\n\nSome **bold** text.",
        "post-b.md": "# Second Post\n\nA paragraph.",
      }),
    });
    await (plugin as any).buildStart();

    const resolvedId = (plugin as any).resolveId("virtual:blog-post-content");
    const content = parseVirtualModule((plugin as any).load(resolvedId)) as Record<string, any>;

    expect(content["post-a"].html).toContain("<strong>bold</strong>");
    expect(content["post-b"].html).toContain("<p>A paragraph.</p>");
  });

  it("extracts h1 title from markdown and strips it from body", async () => {
    const plugin = blogPostsPlugin({
      seed: testSeed,
      postDir: "/fake/posts",
      readFile: createReadFile({
        "post-a.md": "# My Title\n\nBody text here.",
        "post-b.md": "# Another Title\n\nMore body.",
      }),
    });
    await (plugin as any).buildStart();

    const resolvedId = (plugin as any).resolveId("virtual:blog-post-content");
    const content = parseVirtualModule((plugin as any).load(resolvedId)) as Record<string, any>;

    expect(content["post-a"].title).toBe("My Title");
    expect(content["post-a"].html).not.toContain("My Title");
    expect(content["post-a"].html).toContain("Body text here.");
  });

  it("returns null title when markdown has no h1", async () => {
    const plugin = blogPostsPlugin({
      seed: testSeed,
      postDir: "/fake/posts",
      readFile: createReadFile({
        "post-a.md": "Just a paragraph, no heading.",
        "post-b.md": "## Not an h1\n\nSome text.",
      }),
    });
    await (plugin as any).buildStart();

    const resolvedId = (plugin as any).resolveId("virtual:blog-post-content");
    const content = parseVirtualModule((plugin as any).load(resolvedId)) as Record<string, any>;

    expect(content["post-a"].title).toBeNull();
    expect(content["post-b"].title).toBeNull();
  });

  it("only includes published posts, skips unpublished", async () => {
    const readPaths: string[] = [];
    const plugin = blogPostsPlugin({
      seed: testSeed,
      postDir: "/fake/posts",
      readFile: (path) => {
        readPaths.push(path);
        return createReadFile({
          "post-a.md": "# Post A\n\nContent A.",
          "post-b.md": "# Post B\n\nContent B.",
        })(path);
      },
    });
    await (plugin as any).buildStart();

    const resolvedId = (plugin as any).resolveId("virtual:blog-post-content");
    const content = parseVirtualModule((plugin as any).load(resolvedId)) as Record<string, any>;

    expect(Object.keys(content)).toEqual(expect.arrayContaining(["post-a", "post-b"]));
    expect(content).not.toHaveProperty("draft");
    expect(readPaths.some((p) => p.includes("draft.md"))).toBe(false);
  });

  it("sorts metadata by publishedAt descending", async () => {
    const plugin = blogPostsPlugin({
      seed: testSeed,
      postDir: "/fake/posts",
      readFile: createReadFile({
        "post-a.md": "# Post A\n\nContent.",
        "post-b.md": "# Post B\n\nContent.",
      }),
    });
    await (plugin as any).buildStart();

    const resolvedId = (plugin as any).resolveId("virtual:blog-post-metadata");
    const metadata = parseVirtualModule((plugin as any).load(resolvedId)) as any[];

    expect(metadata).toHaveLength(2);
    expect(metadata[0].id).toBe("post-b"); // 2026-02-01 > 2026-01-15
    expect(metadata[1].id).toBe("post-a");
  });

  it("throws when posts collection is missing from seed", async () => {
    const badSeed = { collections: [{ name: "other", documents: [] }] };
    const plugin = blogPostsPlugin({ seed: badSeed, postDir: "/fake/posts" });

    await expect((plugin as any).buildStart()).rejects.toThrow(
      "No 'posts' collection found in seed data",
    );
  });

  it("throws when markdown file does not exist", async () => {
    const singlePostSeed = {
      collections: [
        {
          name: "posts",
          documents: [
            {
              id: "missing",
              data: {
                title: "Missing",
                published: true,
                publishedAt: "2026-01-01T00:00:00Z",
                filename: "missing.md",
              },
            },
          ],
        },
      ],
    };

    const plugin = blogPostsPlugin({
      seed: singlePostSeed,
      postDir: "/fake/posts",
      readFile: () => { throw new Error("ENOENT: no such file or directory"); },
    });

    await expect((plugin as any).buildStart()).rejects.toThrow("ENOENT");
  });
});
