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

const TEMPLATE_WITH_HERO = `<!DOCTYPE html>
<html>
<head>
  <title>My Blog</title>
</head>
<body>
  <nav><app-nav id="nav"></app-nav></nav>
  <section class="landing-hero">default hero marker</section>
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
    if (p.endsWith("index.html")) return TEMPLATE_WITH_HERO;
    for (const [filename, content] of Object.entries(markdownByFilename)) {
      if (p === `${postDir}/${filename}`) return content;
    }
    throw new Error(`Unexpected readFileSync call: ${p}`);
  };
}

function makeTwoPostConfig(): PrerenderConfig {
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
  return config;
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

  it("replaces template meta description with post-specific description", async () => {
    const templateWithDesc = TEMPLATE_WITH_HERO.replace(
      "<title>",
      '<meta name="description" content="Site description" />\n  <title>',
    );
    vi.mocked(fs.readFileSync).mockImplementation(((path: string) => {
      if (path === "/dist/index.html") return templateWithDesc;
      return MARKDOWN_HELLO;
    }) as typeof fs.readFileSync);

    await prerenderPosts(makeConfig());

    const perPostCall = vi.mocked(fs.writeFileSync).mock.calls.find(
      (c) => String(c[0]).includes("post/hello-world"),
    );
    const html = perPostCall![1] as string;
    expect(html).toContain('<meta name="description" content="A first post about hello world.">');
    expect(html).not.toContain("Site description");
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
    expect(html).toContain("<title>My Blog - Hello World</title>");
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
    expect(html).toContain("<title>My Blog - Say &quot;Hello&quot; &amp; &lt;Goodbye&gt;</title>");
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
    await prerenderPosts(makeTwoPostConfig());

    const perPostCall = vi.mocked(fs.writeFileSync).mock.calls.find(
      (c) => String(c[0]).includes("post/hello-world"),
    );
    const html = perPostCall![1] as string;
    expect(html).toContain('<article id="post-hello-world">');
    expect(html).toContain('<article id="post-second-post">');
    expect(html).toContain('data-hydrated');
    expect(html).toContain('<main id="app"><div id="posts">');
    expect(html).toContain("hello world");
  });

  it("per-post pages contain all published articles matching root index", async () => {
    await prerenderPosts(makeTwoPostConfig());

    const rootCall = vi.mocked(fs.writeFileSync).mock.calls.find(
      (c) => String(c[0]) === "/dist/index.html",
    );
    const rootHtml = rootCall![1] as string;

    const perPostCall = vi.mocked(fs.writeFileSync).mock.calls.find(
      (c) => String(c[0]).includes("post/hello-world"),
    );
    const perPostHtml = perPostCall![1] as string;

    expect(perPostHtml).toContain('<article id="post-hello-world">');
    expect(perPostHtml).toContain('<article id="post-second-post">');
    expect(perPostHtml).toContain("<hr>");

    expect(rootHtml).toContain('<article id="post-hello-world">');
    expect(rootHtml).toContain('<article id="post-second-post">');
    expect(rootHtml).toContain("<hr>");
  });

  it("injects all published posts into root index.html", async () => {
    await prerenderPosts(makeTwoPostConfig());

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

  it("injects OG tags into root index.html when siteDefaults provided", async () => {
    await prerenderPosts(makeConfig({
      siteDefaults: {
        title: "My Site",
        description: "Site description for OG",
        image: "/og-image.jpg",
      },
    }));

    const rootCall = vi.mocked(fs.writeFileSync).mock.calls.find(
      (c) => String(c[0]) === "/dist/index.html",
    );
    const html = rootCall![1] as string;
    expect(html).toContain('<meta property="og:title" content="My Site">');
    expect(html).toContain('<meta property="og:description" content="Site description for OG">');
    expect(html).toContain('<meta property="og:image" content="https://example.com/og-image.jpg">');
    expect(html).toContain('<meta property="og:type" content="website">');
    expect(html).toContain('<meta property="og:url" content="https://example.com">');
    expect(html).toContain('<meta name="description" content="Site description for OG">');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
    expect(html).toContain('<meta name="twitter:title" content="My Site">');
    expect(html).toContain('<meta name="twitter:description" content="Site description for OG">');
    expect(html).toContain('<meta name="twitter:image" content="https://example.com/og-image.jpg">');
  });

  it("injects twitter:* tags into per-post HTML when post has previewDescription and previewImage", async () => {
    await prerenderPosts(makeConfig());

    const perPostCall = vi.mocked(fs.writeFileSync).mock.calls.find(
      (c) => String(c[0]).includes("post/hello-world"),
    );
    const html = perPostCall![1] as string;
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
    expect(html).toContain('<meta name="twitter:title" content="Hello World">');
    expect(html).toContain('<meta name="twitter:description" content="A first post about hello world.">');
    expect(html).toContain('<meta name="twitter:image" content="https://example.com/hello.jpg">');
  });

  it("omits twitter:image in per-post HTML when previewImage is absent", async () => {
    const config = makeConfig();
    const doc = config.seed.collections[0].documents[0];
    delete (doc.data as Record<string, unknown>).previewImage;

    await prerenderPosts(config);

    const perPostCall = vi.mocked(fs.writeFileSync).mock.calls.find(
      (c) => String(c[0]).includes("post/hello-world"),
    );
    const html = perPostCall![1] as string;
    expect(html).not.toContain("twitter:image");
    expect(html).toContain('<meta name="twitter:description"');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
  });

  it("omits twitter:description in per-post HTML when previewDescription is absent", async () => {
    const config = makeConfig();
    const doc = config.seed.collections[0].documents[0];
    delete (doc.data as Record<string, unknown>).previewDescription;
    delete (doc.data as Record<string, unknown>).previewImage;

    await prerenderPosts(config);

    const perPostCall = vi.mocked(fs.writeFileSync).mock.calls.find(
      (c) => String(c[0]).includes("post/hello-world"),
    );
    const html = perPostCall![1] as string;
    expect(html).not.toContain("twitter:description");
    expect(html).not.toContain("twitter:image");
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
    expect(html).toContain('<meta name="twitter:title" content="Hello World">');
  });

  it("omits root OG tags when siteDefaults not provided", async () => {
    await prerenderPosts(makeConfig());

    const rootCall = vi.mocked(fs.writeFileSync).mock.calls.find(
      (c) => String(c[0]) === "/dist/index.html",
    );
    const html = rootCall![1] as string;
    expect(html).not.toContain("og:title");
  });

  it("renders archive section with posts in info panel", async () => {
    await prerenderPosts(makeConfig());

    const rootCall = vi.mocked(fs.writeFileSync).mock.calls.find(
      (c) => String(c[0]) === "/dist/index.html",
    );
    const html = rootCall![1] as string;
    expect(html).toContain("Archive");
  });

  it("injects canonical link on homepage", async () => {
    await prerenderPosts(makeConfig());
    const rootCall = vi.mocked(fs.writeFileSync).mock.calls.find(
      (c) => String(c[0]) === "/dist/index.html",
    );
    const html = rootCall![1] as string;
    expect(html).toContain('<link rel="canonical" href="https://example.com/">');
  });

  it("injects canonical link on post pages", async () => {
    await prerenderPosts(makeConfig());
    const perPostCall = vi.mocked(fs.writeFileSync).mock.calls.find(
      (c) => String(c[0]).includes("post/hello-world"),
    );
    const html = perPostCall![1] as string;
    expect(html).toContain('<link rel="canonical" href="https://example.com/post/hello-world">');
  });

  it("injects Organization JSON-LD on homepage when organization provided", async () => {
    await prerenderPosts(makeConfig({
      organization: {
        name: "Example Org",
        url: "https://example.com",
        logo: "https://example.com/logo.svg",
        sameAs: ["https://github.com/example"],
      },
    }));
    const rootCall = vi.mocked(fs.writeFileSync).mock.calls.find(
      (c) => String(c[0]) === "/dist/index.html",
    );
    const html = rootCall![1] as string;
    expect(html).toContain('<script type="application/ld+json">');
    expect(html).toContain('"@type":"Organization"');
    expect(html).toContain("Example Org");
  });

  it("omits Organization JSON-LD when organization not provided", async () => {
    await prerenderPosts(makeConfig());
    const rootCall = vi.mocked(fs.writeFileSync).mock.calls.find(
      (c) => String(c[0]) === "/dist/index.html",
    );
    const html = rootCall![1] as string;
    expect(html).not.toContain("Organization");
  });

  it("injects BlogPosting JSON-LD on post pages when author provided", async () => {
    await prerenderPosts(makeConfig({ author: { name: "Alice" } }));
    const perPostCall = vi.mocked(fs.writeFileSync).mock.calls.find(
      (c) => String(c[0]).includes("post/hello-world"),
    );
    const html = perPostCall![1] as string;
    expect(html).toContain('<script type="application/ld+json">');
    expect(html).toContain('"@type":"BlogPosting"');
    expect(html).toContain('"headline":"Hello World"');
    expect(html).toContain("Alice");
  });

  it("omits BlogPosting JSON-LD when author not provided", async () => {
    await prerenderPosts(makeConfig());
    const perPostCall = vi.mocked(fs.writeFileSync).mock.calls.find(
      (c) => String(c[0]).includes("post/hello-world"),
    );
    const html = perPostCall![1] as string;
    expect(html).not.toContain("BlogPosting");
  });

  it("injects rel=me links on homepage when relMe provided", async () => {
    await prerenderPosts(makeConfig({ relMe: ["https://github.com/alice"] }));
    const rootCall = vi.mocked(fs.writeFileSync).mock.calls.find(
      (c) => String(c[0]) === "/dist/index.html",
    );
    const html = rootCall![1] as string;
    expect(html).toContain('<link rel="me" href="https://github.com/alice">');
  });

  it("injects rel=me links on post pages when relMe provided", async () => {
    await prerenderPosts(makeConfig({ relMe: ["https://github.com/alice"] }));
    const perPostCall = vi.mocked(fs.writeFileSync).mock.calls.find(
      (c) => String(c[0]).includes("post/hello-world"),
    );
    const html = perPostCall![1] as string;
    expect(html).toContain('<link rel="me" href="https://github.com/alice">');
  });

  it("omits rel=me when relMe not provided or empty", async () => {
    await prerenderPosts(makeConfig({ relMe: [] }));
    const rootCall = vi.mocked(fs.writeFileSync).mock.calls.find(
      (c) => String(c[0]) === "/dist/index.html",
    );
    const html = rootCall![1] as string;
    expect(html).not.toContain('rel="me"');
  });

  it("injects exactly 3 SoftwareApplication JSON-LD scripts on root when 3 apps provided", async () => {
    await prerenderPosts(makeConfig({
      softwareApplications: [
        { name: "A", url: "https://a.example", applicationCategory: "FinanceApplication", operatingSystem: "Web" },
        { name: "B", url: "https://b.example", applicationCategory: "MultimediaApplication", operatingSystem: "Web" },
        { name: "C", url: "https://c.example", applicationCategory: "BookApplication", operatingSystem: "Web" },
      ],
    }));
    const rootCall = vi.mocked(fs.writeFileSync).mock.calls.find(
      (c) => String(c[0]) === "/dist/index.html",
    );
    const html = rootCall![1] as string;
    const matches = html.match(/"@type":"SoftwareApplication"/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBe(3);
  });

  it("does not inject SoftwareApplication JSON-LD on post pages", async () => {
    await prerenderPosts(makeConfig({
      softwareApplications: [
        { name: "A", url: "https://a.example", applicationCategory: "FinanceApplication", operatingSystem: "Web" },
      ],
    }));
    const perPostCall = vi.mocked(fs.writeFileSync).mock.calls.find(
      (c) => String(c[0]).includes("post/hello-world"),
    );
    const html = perPostCall![1] as string;
    expect(html).not.toContain("SoftwareApplication");
  });

  it("omits SoftwareApplication scripts when softwareApplications is undefined", async () => {
    await prerenderPosts(makeConfig());
    const rootCall = vi.mocked(fs.writeFileSync).mock.calls.find(
      (c) => String(c[0]) === "/dist/index.html",
    );
    const html = rootCall![1] as string;
    expect(html).not.toContain("SoftwareApplication");
  });

  it("replaces <section class=\"landing-hero\"> with homeExtraHtml on root", async () => {
    await prerenderPosts(makeConfig({ homeExtraHtml: "<div class=\"showcase-injected\">SHOWCASE</div>" }));
    const rootCall = vi.mocked(fs.writeFileSync).mock.calls.find(
      (c) => String(c[0]) === "/dist/index.html",
    );
    const html = rootCall![1] as string;
    expect(html).toContain('<div class="showcase-injected">SHOWCASE</div>');
    expect(html).not.toContain("default hero marker");
    expect(html).not.toContain('<section class="landing-hero">');
  });

  it("strips <section class=\"landing-hero\"> from post pages when homeExtraHtml is set", async () => {
    await prerenderPosts(makeConfig({ homeExtraHtml: "<div class=\"showcase-injected\">SHOWCASE</div>" }));
    const perPostCall = vi.mocked(fs.writeFileSync).mock.calls.find(
      (c) => String(c[0]).includes("post/hello-world"),
    );
    const html = perPostCall![1] as string;
    expect(html).not.toContain('<section class="landing-hero">');
    expect(html).not.toContain("default hero marker");
    expect(html).not.toContain("SHOWCASE");
  });

  it("does not strip <section class=\"landing-hero\"> from post pages when homeExtraHtml is not set", async () => {
    await prerenderPosts(makeConfig());
    const perPostCall = vi.mocked(fs.writeFileSync).mock.calls.find(
      (c) => String(c[0]).includes("post/hello-world"),
    );
    const html = perPostCall![1] as string;
    expect(html).toContain('<section class="landing-hero">');
  });

  it("does not throw when homeExtraHtml is not set and template lacks <section class=\"landing-hero\">", async () => {
    vi.mocked(fs.readFileSync).mockImplementation(((path: string) => {
      if (String(path).endsWith("index.html")) return TEMPLATE;
      return MARKDOWN_HELLO;
    }) as typeof fs.readFileSync);

    await expect(prerenderPosts(makeConfig())).resolves.toBeUndefined();
  });

  it("throws when homeExtraHtml is set but <section class=\"landing-hero\"> is absent", async () => {
    vi.mocked(fs.readFileSync).mockImplementation(((path: string) => {
      if (String(path).endsWith("index.html")) return TEMPLATE;
      return MARKDOWN_HELLO;
    }) as typeof fs.readFileSync);

    await expect(
      prerenderPosts(makeConfig({ homeExtraHtml: '<div class="showcase">SHOWCASE</div>' })),
    ).rejects.toThrow('<section class="landing-hero"> marker not found in template');
  });
});
