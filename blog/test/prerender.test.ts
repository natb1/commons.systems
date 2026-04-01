import { describe, it, expect, vi, beforeEach } from "vitest";
import { prerenderPosts, type PrerenderConfig } from "../src/prerender";
import * as fs from "node:fs";

vi.mock("node:fs");

const TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <title>My Blog</title>
</head>
<body>
  <nav><app-nav id="nav"></app-nav></nav>
  <main id="app"></main>
  <aside id="info-panel" class="sidebar"></aside>
</body>
</html>`;

const MARKDOWN_HELLO = `# Hello World Title
This is the **hello world** post.`;

const MARKDOWN_NO_H1 = `This post has no h1 heading.`;

function makeConfig(overrides: Partial<PrerenderConfig> = {}): PrerenderConfig {
  return {
    siteUrl: "https://example.com",
    titleSuffix: "My Blog",
    distDir: "/dist",
    seed: {
      collections: [
        {
          name: "posts",
          documents: [
            {
              id: "hello-world",
              data: {
                title: "Hello World",
                published: true,
                publishedAt: "2026-01-01T00:00:00Z",
                filename: "hello-world.md",
                previewDescription: "A first post about hello world.",
                previewImage: "/hello.jpg",
              },
            },
          ],
        },
      ],
    },
    postDir: "/posts",
    navLinks: [{ href: "/", label: "Home" }],
    infoPanel: {
      linkSections: [
        { heading: "Links", links: [{ label: "Source", url: "https://example.com/source" }] },
      ],
      blogRoll: [{ id: "test-blog", name: "Test Blog", url: "https://test.blog" }],
      rssFeedUrl: "/feed.xml",
      opmlUrl: "/blogroll.opml",
    },
    ...overrides,
  };
}

function mockReadFileSync(postDir: string, markdownByFilename: Record<string, string>) {
  return (path: string | URL) => {
    const p = String(path);
    if (p.endsWith("index.html")) return TEMPLATE;
    for (const [filename, content] of Object.entries(markdownByFilename)) {
      if (p === `${postDir}/${filename}`) return content;
    }
    throw new Error(`Unexpected readFileSync call: ${p}`);
  };
}

describe("prerenderPosts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.readFileSync).mockImplementation(
      mockReadFileSync("/posts", { "hello-world.md": MARKDOWN_HELLO }) as typeof fs.readFileSync,
    );
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
    vi.mocked(fs.mkdirSync).mockImplementation(() => undefined as unknown as string);
  });

  it("generates OG tags for a post with description and image", async () => {
    await prerenderPosts(makeConfig());

    const perPostCall = vi.mocked(fs.writeFileSync).mock.calls.find(
      (c) => String(c[0]).includes("post/hello-world"),
    );
    expect(perPostCall).toBeDefined();
    const html = perPostCall![1] as string;
    expect(html).toContain('<meta property="og:title" content="Hello World">');
    expect(html).toContain('<meta property="og:url" content="https://example.com/post/hello-world">');
    expect(html).toContain('<meta property="og:type" content="article">');
    expect(html).toContain('<meta property="og:description" content="A first post about hello world.">');
    expect(html).toContain('<meta name="description" content="A first post about hello world.">');
    expect(html).toContain('<meta property="og:image" content="https://example.com/hello.jpg">');
  });

  it("omits og:image when previewImage is absent", async () => {
    const config = makeConfig();
    const doc = config.seed.collections[0].documents[0];
    delete (doc.data as Record<string, unknown>).previewImage;

    await prerenderPosts(config);

    const perPostCall = vi.mocked(fs.writeFileSync).mock.calls.find(
      (c) => String(c[0]).includes("post/hello-world"),
    );
    const html = perPostCall![1] as string;
    expect(html).not.toContain("og:image");
    expect(html).toContain('<meta property="og:description"');
  });

  it("omits description tags when previewDescription is absent", async () => {
    const config = makeConfig();
    const doc = config.seed.collections[0].documents[0];
    delete (doc.data as Record<string, unknown>).previewDescription;
    delete (doc.data as Record<string, unknown>).previewImage;

    await prerenderPosts(config);

    const perPostCall = vi.mocked(fs.writeFileSync).mock.calls.find(
      (c) => String(c[0]).includes("post/hello-world"),
    );
    const html = perPostCall![1] as string;
    expect(html).not.toContain("og:description");
    expect(html).not.toContain('<meta name="description"');
    expect(html).not.toContain("og:image");
    expect(html).toContain('<meta property="og:title"');
  });

  it("rewrites title tag with post title and suffix", async () => {
    await prerenderPosts(makeConfig());

    const perPostCall = vi.mocked(fs.writeFileSync).mock.calls.find(
      (c) => String(c[0]).includes("post/hello-world"),
    );
    const html = perPostCall![1] as string;
    expect(html).toContain("<title>Hello World | My Blog</title>");
    expect(html).not.toContain("<title>My Blog</title>");
  });

  it("skips unpublished posts", async () => {
    const config = makeConfig();
    config.seed.collections[0].documents.push({
      id: "draft-post",
      data: {
        title: "Draft",
        published: false,
        publishedAt: null,
        filename: "draft.md",
      },
    });

    await prerenderPosts(config);

    // Root index.html + one per-post page = 2 writes
    expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
    const paths = vi.mocked(fs.writeFileSync).mock.calls.map((c) => String(c[0]));
    expect(paths.some((p) => p.includes("draft-post"))).toBe(false);
  });

  it("throws when posts collection is missing", async () => {
    const config = makeConfig({ seed: { collections: [] } });
    await expect(prerenderPosts(config)).rejects.toThrow("No 'posts' collection found");
  });

  it("throws when published post is missing a title", async () => {
    const config = makeConfig();
    delete (config.seed.collections[0].documents[0].data as Record<string, unknown>).title;

    await expect(prerenderPosts(config)).rejects.toThrow('missing a title');
  });

  it("throws when </head> marker is missing from template", async () => {
    vi.mocked(fs.readFileSync).mockImplementation(((path: string) => {
      if (String(path).endsWith("index.html"))
        return '<html><body><app-nav id="nav"></app-nav><main id="app"></main><aside id="info-panel" class="sidebar"></aside></body></html>';
      return MARKDOWN_HELLO;
    }) as typeof fs.readFileSync);
    await expect(prerenderPosts(makeConfig())).rejects.toThrow("</head> marker not found");
  });

  it("throws when <title> tag is missing from template", async () => {
    vi.mocked(fs.readFileSync).mockImplementation(((path: string) => {
      if (String(path).endsWith("index.html"))
        return '<html><head></head><body><app-nav id="nav"></app-nav><main id="app"></main><aside id="info-panel" class="sidebar"></aside></body></html>';
      return MARKDOWN_HELLO;
    }) as typeof fs.readFileSync);
    await expect(prerenderPosts(makeConfig())).rejects.toThrow("<title> tag not found");
  });

  it("escapes HTML in title and description", async () => {
    const config = makeConfig();
    const doc = config.seed.collections[0].documents[0];
    (doc.data as Record<string, unknown>).title = 'Say "Hello" & <Goodbye>';
    (doc.data as Record<string, unknown>).previewDescription = 'A <script>alert("xss")</script> post';

    await prerenderPosts(config);

    const perPostCall = vi.mocked(fs.writeFileSync).mock.calls.find(
      (c) => String(c[0]).includes("post/hello-world"),
    );
    const html = perPostCall![1] as string;
    expect(html).toContain('content="Say &quot;Hello&quot; &amp; &lt;Goodbye&gt;"');
    expect(html).toContain("<title>Say &quot;Hello&quot; &amp; &lt;Goodbye&gt; | My Blog</title>");
    expect(html).not.toContain("<script>");
  });

  it("creates output directory with recursive flag", async () => {
    await prerenderPosts(makeConfig());

    expect(fs.mkdirSync).toHaveBeenCalledWith(
      expect.stringContaining("post/hello-world"),
      { recursive: true },
    );
  });

  it("injects rendered article with data-hydrated into per-post HTML", async () => {
    await prerenderPosts(makeConfig());

    const perPostCall = vi.mocked(fs.writeFileSync).mock.calls.find(
      (c) => String(c[0]).includes("post/hello-world"),
    );
    const html = perPostCall![1] as string;
    expect(html).toContain('<article id="post-hello-world">');
    expect(html).toContain('data-hydrated');
    expect(html).toContain('<main id="app"><div id="posts">');
    expect(html).toContain("hello world");
  });

  it("injects all published posts into root index.html", async () => {
    const config = makeConfig();
    config.seed.collections[0].documents.push({
      id: "second-post",
      data: {
        title: "Second Post",
        published: true,
        publishedAt: "2026-01-02T00:00:00Z",
        filename: "second-post.md",
      },
    });

    vi.mocked(fs.readFileSync).mockImplementation(
      mockReadFileSync("/posts", {
        "hello-world.md": MARKDOWN_HELLO,
        "second-post.md": "# Second Post\nSecond content.",
      }) as typeof fs.readFileSync,
    );

    await prerenderPosts(config);

    const rootCall = vi.mocked(fs.writeFileSync).mock.calls.find(
      (c) => String(c[0]) === "/dist/index.html",
    );
    expect(rootCall).toBeDefined();
    const html = rootCall![1] as string;
    expect(html).toContain('<article id="post-hello-world">');
    expect(html).toContain('<article id="post-second-post">');
    expect(html).toContain("<hr>");
    // Second post is newer, should appear first
    const firstIdx = html.indexOf("post-second-post");
    const secondIdx = html.indexOf("post-hello-world");
    expect(firstIdx).toBeLessThan(secondIdx);
  });

  it("injects info panel into aside element", async () => {
    await prerenderPosts(makeConfig());

    const rootCall = vi.mocked(fs.writeFileSync).mock.calls.find(
      (c) => String(c[0]) === "/dist/index.html",
    );
    const html = rootCall![1] as string;
    expect(html).toContain('<aside id="info-panel" class="sidebar">');
    expect(html).toContain("Top Posts");
    expect(html).toContain("Blogroll");
    expect(html).toContain("Source");
    expect(html).toContain("test-blog");
    expect(html).not.toContain('<aside id="info-panel" class="sidebar"></aside>');
  });

  it("extracts h1 from markdown as post title", async () => {
    await prerenderPosts(makeConfig());

    const rootCall = vi.mocked(fs.writeFileSync).mock.calls.find(
      (c) => String(c[0]) === "/dist/index.html",
    );
    const html = rootCall![1] as string;
    // h1 "Hello World Title" should be used as the display title
    expect(html).toContain("Hello World Title");
  });

  it("uses seed title when markdown has no h1", async () => {
    vi.mocked(fs.readFileSync).mockImplementation(
      mockReadFileSync("/posts", { "hello-world.md": MARKDOWN_NO_H1 }) as typeof fs.readFileSync,
    );

    await prerenderPosts(makeConfig());

    const rootCall = vi.mocked(fs.writeFileSync).mock.calls.find(
      (c) => String(c[0]) === "/dist/index.html",
    );
    const html = rootCall![1] as string;
    expect(html).toContain("Hello World");
  });

  it("injects nav links into app-nav element", async () => {
    await prerenderPosts(makeConfig());

    const rootCall = vi.mocked(fs.writeFileSync).mock.calls.find(
      (c) => String(c[0]) === "/dist/index.html",
    );
    const html = rootCall![1] as string;
    expect(html).toContain('<app-nav id="nav"><span class="nav-links">');
    expect(html).toContain('<a href="/">Home</a>');
    expect(html).not.toContain('<app-nav id="nav"></app-nav>');
  });

  it("writes root index.html with content", async () => {
    await prerenderPosts(makeConfig());

    const rootCall = vi.mocked(fs.writeFileSync).mock.calls.find(
      (c) => String(c[0]) === "/dist/index.html",
    );
    expect(rootCall).toBeDefined();
    const html = rootCall![1] as string;
    expect(html).toContain('<main id="app"><div id="posts">');
  });

  it("renders archive section with posts in info panel", async () => {
    await prerenderPosts(makeConfig());

    const rootCall = vi.mocked(fs.writeFileSync).mock.calls.find(
      (c) => String(c[0]) === "/dist/index.html",
    );
    const html = rootCall![1] as string;
    expect(html).toContain("Archive");
  });
});
