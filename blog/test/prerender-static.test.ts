import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  prerenderStaticPage,
  loadPostsForPrerender,
  type StaticPageConfig,
} from "../src/prerender";
import { personJsonLd } from "../src/seo";
import * as fs from "node:fs";

vi.mock("node:fs");

const TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <meta name="description" content="Default site description">
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

function makeStaticConfig(overrides: Partial<StaticPageConfig> = {}): StaticPageConfig {
  return {
    siteUrl: "https://example.com",
    titleSuffix: "My Blog",
    distDir: "/dist",
    path: "/about",
    pageTitle: "About",
    pageDescription: "About this site",
    bodyHtml: '<article id="about-body">About body</article>',
    navLinks: [
      { href: "/", label: "Home" },
      { href: "/about", label: "About" },
    ],
    panelHtml: '<section class="panel-section"><h3>Panel</h3></section>',
    ...overrides,
  };
}

function getWrittenHtml(path: string): string {
  const call = vi.mocked(fs.writeFileSync).mock.calls.find(
    (c) => String(c[0]) === path,
  );
  expect(call, `expected writeFileSync call for ${path}`).toBeDefined();
  return call![1] as string;
}

describe("prerenderStaticPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.readFileSync).mockImplementation(((path: string) => {
      if (String(path).endsWith("index.html")) return TEMPLATE;
      throw new Error(`Unexpected readFileSync: ${path}`);
    }) as typeof fs.readFileSync);
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
    vi.mocked(fs.mkdirSync).mockImplementation(() => undefined as unknown as string);
  });

  it("rewrites <title> with the suffix and page title", () => {
    prerenderStaticPage(makeStaticConfig());
    const html = getWrittenHtml("/dist/about/index.html");
    expect(html).toContain("<title>My Blog - About</title>");
    expect(html).not.toContain("<title>My Blog</title>");
  });

  it("injects canonical link pointing at siteUrl + path", () => {
    prerenderStaticPage(makeStaticConfig());
    const html = getWrittenHtml("/dist/about/index.html");
    expect(html).toContain('<link rel="canonical" href="https://example.com/about">');
  });

  it("injects og:* and twitter:* meta tags with page-specific values", () => {
    prerenderStaticPage(makeStaticConfig({ pageImage: "/og-card.png" }));
    const html = getWrittenHtml("/dist/about/index.html");
    expect(html).toContain('<meta property="og:title" content="About">');
    expect(html).toContain('<meta property="og:description" content="About this site">');
    expect(html).toContain('<meta property="og:url" content="https://example.com/about">');
    expect(html).toContain('<meta property="og:type" content="website">');
    expect(html).toContain('<meta property="og:image" content="https://example.com/og-card.png">');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
    expect(html).toContain('<meta name="twitter:title" content="About">');
    expect(html).toContain('<meta name="twitter:description" content="About this site">');
    expect(html).toContain('<meta name="twitter:image" content="https://example.com/og-card.png">');
    expect(html).toContain('<meta name="description" content="About this site">');
  });

  it("uses og:type 'profile' when pageType is profile", () => {
    prerenderStaticPage(makeStaticConfig({ pageType: "profile" }));
    const html = getWrittenHtml("/dist/about/index.html");
    expect(html).toContain('<meta property="og:type" content="profile">');
    expect(html).not.toContain('<meta property="og:type" content="website">');
  });

  it("strips the homepage default <meta name=\"description\"> from the template", () => {
    prerenderStaticPage(makeStaticConfig());
    const html = getWrittenHtml("/dist/about/index.html");
    expect(html).not.toContain("Default site description");
    // page-specific description still present
    expect(html).toContain('content="About this site"');
  });

  it("renders jsonLdBlocks as <script type=\"application/ld+json\"> with valid JSON", () => {
    const person = personJsonLd({
      name: "Nathan",
      url: "https://example.com/about",
      email: "nathan@natb1.com",
      jobTitle: "Independent contractor",
      sameAs: ["https://github.com/natb1"],
    });
    prerenderStaticPage(makeStaticConfig({ jsonLdBlocks: [person] }));
    const html = getWrittenHtml("/dist/about/index.html");
    expect(html).toContain('<script type="application/ld+json">');
    expect(html).toContain('"@type":"Person"');
    expect(html).toContain('"name":"Nathan"');
    expect(html).toContain('"jobTitle":"Independent contractor"');

    // The script body should parse as JSON after un-escaping the unicode escapes.
    const match = html.match(/<script type="application\/ld\+json">([^<]*)<\/script>/);
    expect(match).not.toBeNull();
    const decoded = match![1]
      .replace(/\\u003c/g, "<")
      .replace(/\\u003e/g, ">")
      .replace(/\\u0026/g, "&");
    expect(() => JSON.parse(decoded)).not.toThrow();
  });

  it("emits multiple json-ld blocks when several are passed", () => {
    prerenderStaticPage(
      makeStaticConfig({
        jsonLdBlocks: [
          { "@context": "https://schema.org", "@type": "Person", name: "A" },
          { "@context": "https://schema.org", "@type": "WebPage", name: "B" },
        ],
      }),
    );
    const html = getWrittenHtml("/dist/about/index.html");
    const matches = html.match(/<script type="application\/ld\+json">/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBe(2);
    expect(html).toContain('"@type":"Person"');
    expect(html).toContain('"@type":"WebPage"');
  });

  it("strips the landing-hero block by default", () => {
    prerenderStaticPage(makeStaticConfig());
    const html = getWrittenHtml("/dist/about/index.html");
    expect(html).not.toContain('<section class="landing-hero">');
    expect(html).not.toContain("default hero marker");
  });

  it("preserves the landing-hero block when stripHero is false", () => {
    prerenderStaticPage(makeStaticConfig({ stripHero: false }));
    const html = getWrittenHtml("/dist/about/index.html");
    expect(html).toContain('<section class="landing-hero">');
    expect(html).toContain("default hero marker");
  });

  it("injects bodyHtml into <main id=\"app\">", () => {
    prerenderStaticPage(makeStaticConfig());
    const html = getWrittenHtml("/dist/about/index.html");
    expect(html).toContain(
      '<main id="app"><article id="about-body">About body</article></main>',
    );
  });

  it("injects panelHtml into the aside info-panel", () => {
    prerenderStaticPage(makeStaticConfig());
    const html = getWrittenHtml("/dist/about/index.html");
    expect(html).toContain(
      '<aside id="info-panel" class="sidebar"><section class="panel-section"><h3>Panel</h3></section></aside>',
    );
  });

  it("injects nav links into <app-nav>", () => {
    prerenderStaticPage(makeStaticConfig());
    const html = getWrittenHtml("/dist/about/index.html");
    expect(html).toContain('<app-nav id="nav"><span class="nav-links">');
    expect(html).toContain('<a href="/">Home</a>');
    expect(html).toContain('<a href="/about">About</a>');
  });

  it("writes output to ${distDir}${path}/index.html and creates the directory", () => {
    prerenderStaticPage(makeStaticConfig());
    expect(fs.mkdirSync).toHaveBeenCalledWith("/dist/about", { recursive: true });
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      "/dist/about/index.html",
      expect.any(String),
    );
  });

  it("escapes HTML in title and description", () => {
    prerenderStaticPage(
      makeStaticConfig({
        pageTitle: 'Say "Hi" & <Bye>',
        pageDescription: 'A <script>alert("xss")</script> page',
      }),
    );
    const html = getWrittenHtml("/dist/about/index.html");
    expect(html).toContain(
      "<title>My Blog - Say &quot;Hi&quot; &amp; &lt;Bye&gt;</title>",
    );
    expect(html).toContain(
      'content="A &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; page"',
    );
    expect(html).not.toContain("<script>alert");
  });

  it("emits rel=me link tags when relMe is provided", () => {
    prerenderStaticPage(
      makeStaticConfig({ relMe: ["https://github.com/natb1"] }),
    );
    const html = getWrittenHtml("/dist/about/index.html");
    expect(html).toContain('<link rel="me" href="https://github.com/natb1">');
  });

  it("omits rel=me when relMe is empty or absent", () => {
    prerenderStaticPage(makeStaticConfig({ relMe: [] }));
    const html = getWrittenHtml("/dist/about/index.html");
    expect(html).not.toContain('rel="me"');
  });

  it("omits og:image / twitter:image when pageImage is absent", () => {
    prerenderStaticPage(makeStaticConfig());
    const html = getWrittenHtml("/dist/about/index.html");
    expect(html).not.toContain("og:image");
    expect(html).not.toContain("twitter:image");
  });

  it("throws when </head> marker is missing from template", () => {
    vi.mocked(fs.readFileSync).mockImplementation(((path: string) => {
      if (String(path).endsWith("index.html"))
        return '<html><title>X</title><body><app-nav id="nav"></app-nav><section class="landing-hero">h</section><main id="app"></main><aside id="info-panel" class="sidebar"></aside></body></html>';
      throw new Error(`Unexpected readFileSync: ${path}`);
    }) as typeof fs.readFileSync);
    expect(() => prerenderStaticPage(makeStaticConfig())).toThrow(
      "</head> marker not found",
    );
  });

  it("throws when <title> tag is missing from template", () => {
    vi.mocked(fs.readFileSync).mockImplementation(((path: string) => {
      if (String(path).endsWith("index.html"))
        return '<html><head></head><body><app-nav id="nav"></app-nav><main id="app"></main><aside id="info-panel" class="sidebar"></aside></body></html>';
      throw new Error(`Unexpected readFileSync: ${path}`);
    }) as typeof fs.readFileSync);
    expect(() => prerenderStaticPage(makeStaticConfig())).toThrow(
      "<title> tag not found",
    );
  });

  it("throws when stripHero is true (default) and the landing-hero marker is absent", () => {
    vi.mocked(fs.readFileSync).mockImplementation(((path: string) => {
      if (String(path).endsWith("index.html"))
        return `<!DOCTYPE html><html><head><title>My Blog</title></head><body><app-nav id="nav"></app-nav><main id="app"></main><aside id="info-panel" class="sidebar"></aside></body></html>`;
      throw new Error(`Unexpected readFileSync: ${path}`);
    }) as typeof fs.readFileSync);
    expect(() => prerenderStaticPage(makeStaticConfig())).toThrow(
      '<section class="landing-hero"> marker not found in template',
    );
  });
});

describe("loadPostsForPrerender", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.readFileSync).mockImplementation(((path: string) => {
      const p = String(path);
      if (p === "/posts/hello-world.md") return MARKDOWN_HELLO;
      throw new Error(`Unexpected readFileSync: ${p}`);
    }) as typeof fs.readFileSync);
  });

  it("returns topPosts, panelHtml, allArticlesHtml, and rendered posts", async () => {
    const result = await loadPostsForPrerender({
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
                  previewDescription: "First post",
                },
              },
            ],
          },
        ],
      },
      postDir: "/posts",
      infoPanel: {
        linkSections: [
          { heading: "Links", links: [{ label: "Source", url: "https://example.com" }] },
        ],
        blogRoll: [],
        rssFeedUrl: "/feed.xml",
        opmlUrl: "/blogroll.opml",
      },
    });

    expect(result.topPosts).toHaveLength(1);
    expect(result.topPosts[0].id).toBe("hello-world");
    expect(result.rendered).toHaveLength(1);
    expect(result.rendered[0].articleHtml).toContain('<article id="post-hello-world">');
    expect(result.allArticlesHtml).toContain('<article id="post-hello-world">');
    expect(result.panelHtml).toContain("Top Posts");
    expect(result.panelHtml).toContain("Hello World");
  });

  it("sorts posts newest-first and joins with <hr>", async () => {
    vi.mocked(fs.readFileSync).mockImplementation(((path: string) => {
      const p = String(path);
      if (p === "/posts/hello-world.md") return MARKDOWN_HELLO;
      if (p === "/posts/second.md") return "# Second Post\nSecond.";
      throw new Error(`Unexpected readFileSync: ${p}`);
    }) as typeof fs.readFileSync);

    const result = await loadPostsForPrerender({
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
                },
              },
              {
                id: "second",
                data: {
                  title: "Second",
                  published: true,
                  publishedAt: "2026-02-01T00:00:00Z",
                  filename: "second.md",
                },
              },
            ],
          },
        ],
      },
      postDir: "/posts",
      infoPanel: {
        linkSections: [],
        blogRoll: [],
      },
    });

    expect(result.topPosts.map((p) => p.id)).toEqual(["second", "hello-world"]);
    expect(result.allArticlesHtml).toContain("<hr>");
    const firstIdx = result.allArticlesHtml.indexOf("post-second");
    const secondIdx = result.allArticlesHtml.indexOf("post-hello-world");
    expect(firstIdx).toBeLessThan(secondIdx);
  });
});
