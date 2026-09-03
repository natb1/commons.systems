import { describe, it, expect, vi, beforeEach } from "vitest";
import { createElement } from "react";
import { Hero } from "@commons-systems/ds";
import {
  prerenderStaticPage,
  loadPostsForPrerender,
  type StaticPageConfig,
} from "../src/prerender";
import { personJsonLd } from "../src/seo";
import * as fs from "node:fs";

vi.mock(import("node:fs"), async (importOriginal) => ({
  ...(await importOriginal()),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

// The single injection path: the template ships an empty `<div id="root">`
// PageShell mount, into which prerender injects renderToString(<BlogPageShell…>).
const TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <meta name="description" content="Default site description">
  <title>My Blog</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`;

// No `<div id="root">` mount — used for the missing-mount-marker case.
const TEMPLATE_NO_MOUNT = `<!DOCTYPE html>
<html>
<head>
  <meta name="description" content="Default site description">
  <title>My Blog</title>
</head>
<body>
  <div id="other"></div>
</body>
</html>`;

const MARKDOWN_HELLO = `# Hello World Title
This is the **hello world** post.`;

function makeStaticConfig(
  overrides: Partial<StaticPageConfig> = {},
  pageOverrides: Partial<StaticPageConfig["page"]> = {},
): StaticPageConfig {
  return {
    siteUrl: "https://example.com",
    titleSuffix: "My Blog",
    distDir: "/dist",
    page: {
      url: "/about",
      title: "About",
      description: "About this site",
      ...pageOverrides,
    },
    body: createElement("article", { id: "about-body" }, "About body"),
    navLinks: [
      { href: "/", label: "Home" },
      { href: "/about", label: "About" },
    ],
    aboutContent: createElement(
      "section",
      { className: "panel-section profile-card" },
      createElement("p", { className: "profile-name" }, "Nathan Buesgens"),
    ),
    shell: {
      mount: "root",
      wordmark: "commons.systems",
      // hero is set but must be gated OFF for an off-home static page.
      hero: createElement(Hero, { headline: "SHOULD NOT APPEAR", cards: [] }),
      panelAriaLabel: "Context",
    },
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

  it("does not interpret $-sequences in the page title or description as replacement patterns", () => {
    // Regression: the static <title> and SEO/OG block are injected via
    // String.replace. A string-form replacement interprets `$&`, `$'`, `$$`
    // in the (escapeHtml'd) title/description as replacement patterns — e.g.
    // `$&` splices the matched `</head>` mid-attribute. Function-form
    // replacers must insert the text verbatim.
    prerenderStaticPage(
      makeStaticConfig({}, { title: "Big $& Sale", description: "Deal $& save $' now $$ end" }),
    );
    const html = getWrittenHtml("/dist/about/index.html");

    // Exactly one </head> — no `$&`-spliced copy injected mid-attribute.
    expect(html.split("</head>")).toHaveLength(2);
    expect(html).toContain("<title>My Blog - Big $&amp; Sale</title>");
    expect(html).toContain(
      '<meta property="og:description" content="Deal $&amp; save $&#39; now $$ end">',
    );
    expect(html).toContain(
      '<meta name="description" content="Deal $&amp; save $&#39; now $$ end">',
    );
  });

  it("injects canonical link pointing at siteUrl + path", () => {
    prerenderStaticPage(makeStaticConfig());
    const html = getWrittenHtml("/dist/about/index.html");
    expect(html).toContain('<link rel="canonical" href="https://example.com/about">');
  });

  it("injects og:* and twitter:* meta tags with page-specific values", () => {
    prerenderStaticPage(makeStaticConfig({}, { image: "/og-card.png" }));
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

  it("uses og:type 'profile' when page.type is profile", () => {
    prerenderStaticPage(makeStaticConfig({}, { type: "profile" }));
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

  it("renders the body ReactNode (wrapped in a <div>) as the shell's children", () => {
    prerenderStaticPage(makeStaticConfig());
    const html = getWrittenHtml("/dist/about/index.html");
    // The body is server-rendered wrapped in a <div> so it byte-matches the
    // client's createElement("div", null, node) entry-hydration wrapper.
    expect(html).toContain(
      '<div><article id="about-body">About body</article></div>',
    );
  });

  it("renders the panel through InfoPanelRegion's aboutContent branch", () => {
    prerenderStaticPage(makeStaticConfig());
    const html = getWrittenHtml("/dist/about/index.html");
    // InfoPanelRegion's aboutContent branch wraps the node in a <div>, so the
    // prerendered #info-panel matches what the client hydrates on a deep /about entry.
    expect(html).toContain('<aside id="info-panel"');
    expect(html).toContain(
      '<div><section class="panel-section profile-card"><p class="profile-name">Nathan Buesgens</p></section></div>',
    );
  });

  it("throws when aboutContent is not provided", () => {
    expect(() =>
      prerenderStaticPage(makeStaticConfig({ aboutContent: undefined })),
    ).toThrow("shell mode requires aboutContent for the panel");
  });

  it("renders the shell nav with the configured links", () => {
    prerenderStaticPage(makeStaticConfig({ showHomeLink: true }));
    const html = getWrittenHtml("/dist/about/index.html");
    // The PageShell's ds Nav renders both links (the /about link is
    // align:undefined here, so it stays in the start group) plus the home link,
    // anonymously (no "Login").
    expect(html).toContain("cs-nav");
    expect(html).toContain('href="/"');
    expect(html).toContain("Home");
    expect(html).toContain('href="/about"');
    expect(html).toContain("About");
    expect(html).toContain('href="https://commons.systems/"');
    expect(html).not.toContain("Login");
  });

  it("omits home link from nav when showHomeLink is false (default)", () => {
    prerenderStaticPage(makeStaticConfig());
    const html = getWrittenHtml("/dist/about/index.html");
    // Nav still renders with cs-nav and the configured nav links.
    expect(html).toContain("cs-nav");
    expect(html).toContain('href="/"');
    expect(html).toContain("Home");
    expect(html).toContain('href="/about"');
    expect(html).toContain("About");
    // Home link to commons.systems root must be absent.
    expect(html).not.toContain('href="https://commons.systems/"');
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
      makeStaticConfig(
        {},
        {
          title: 'Say "Hi" & <Bye>',
          description: 'A <script>alert("xss")</script> page',
        },
      ),
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

  it("omits og:image / twitter:image when page.image is absent", () => {
    prerenderStaticPage(makeStaticConfig());
    const html = getWrittenHtml("/dist/about/index.html");
    expect(html).not.toContain("og:image");
    expect(html).not.toContain("twitter:image");
  });

  it("throws when </head> marker is missing from template", () => {
    vi.mocked(fs.readFileSync).mockImplementation(((path: string) => {
      if (String(path).endsWith("index.html"))
        return '<html><title>X</title><body><div id="root"></div></body></html>';
      throw new Error(`Unexpected readFileSync: ${path}`);
    }) as typeof fs.readFileSync);
    expect(() => prerenderStaticPage(makeStaticConfig())).toThrow(
      "</head> marker not found",
    );
  });

  it("throws when <title> tag is missing from template", () => {
    vi.mocked(fs.readFileSync).mockImplementation(((path: string) => {
      if (String(path).endsWith("index.html"))
        return '<html><head></head><body><div id="root"></div></body></html>';
      throw new Error(`Unexpected readFileSync: ${path}`);
    }) as typeof fs.readFileSync);
    expect(() => prerenderStaticPage(makeStaticConfig())).toThrow(
      "<title> tag not found",
    );
  });

  // ── PageShell rendering (the single injection path) ────────────────────────
  // The template ships an empty `<div id="root">` PageShell mount; prerender
  // injects renderToString(<BlogPageShell…>) there, requires `aboutContent` for
  // the panel, and gates the hero off (page.url !== "/"). The <head> SEO runs
  // on top.
  it("injects the ds PageShell at the mount with the about panel, no hero", () => {
    prerenderStaticPage(makeStaticConfig());
    const html = getWrittenHtml("/dist/about/index.html");
    expect(html).toContain('<div id="root"><div class="page">');
    expect(html).toContain('class="content-grid"');
    expect(html).toContain("cs-nav");
    expect(html).toContain('<aside id="info-panel"');
    expect(html).toContain("profile-card");
    expect(html).toContain("Nathan Buesgens");
    // /about is off the home gate — no hero.
    expect(html).not.toContain("hero-band-section");
    expect(html).not.toContain("SHOULD NOT APPEAR");
    expect(html).not.toContain('<div id="root"></div>');
  });

  it("keeps the <head> SEO intact (canonical + title + og)", () => {
    prerenderStaticPage(makeStaticConfig());
    const html = getWrittenHtml("/dist/about/index.html");
    expect(html).toContain('<link rel="canonical" href="https://example.com/about">');
    expect(html).toContain("<title>My Blog - About</title>");
    expect(html).toContain('<meta property="og:title" content="About">');
    // The homepage default description is stripped; the page description remains.
    expect(html).not.toContain("Default site description");
    expect(html).toContain('content="About this site"');
  });

  it("throws when the #root mount marker is absent from the template", () => {
    vi.mocked(fs.readFileSync).mockImplementation(((path: string) => {
      if (String(path).endsWith("index.html")) return TEMPLATE_NO_MOUNT;
      throw new Error(`Unexpected readFileSync: ${path}`);
    }) as typeof fs.readFileSync);
    expect(() => prerenderStaticPage(makeStaticConfig())).toThrow(
      '<div id="root"> mount marker not found in template',
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

  it("returns topPosts, panelHtml, bodyHtml, and rendered posts", async () => {
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
    expect(result.rendered[0].meta.id).toBe("hello-world");
    // bodyHtml is the server-rendered HomeRegion feed (the #posts container).
    expect(result.bodyHtml).toContain('id="posts"');
    expect(result.bodyHtml).toContain('id="post-hello-world"');
    expect(result.bodyHtml).toContain('id="post-content-hello-world"');
    expect(result.bodyHtml).toContain("data-hydrated");
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
    expect(result.bodyHtml).toContain("<hr/>");
    const firstIdx = result.bodyHtml.indexOf("post-second");
    const secondIdx = result.bodyHtml.indexOf("post-hello-world");
    expect(firstIdx).toBeLessThan(secondIdx);
  });
});
