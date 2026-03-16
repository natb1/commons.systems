import { describe, it, expect, vi, beforeEach } from "vitest";
import { prerenderPosts, type PrerenderConfig } from "../src/prerender";
import * as fs from "node:fs";

vi.mock("node:fs");

const TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <title>My Blog</title>
</head>
<body><div id="app"></div></body>
</html>`;

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
    ...overrides,
  };
}

describe("prerenderPosts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.readFileSync).mockReturnValue(TEMPLATE);
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
    vi.mocked(fs.mkdirSync).mockImplementation(() => undefined as unknown as string);
  });

  it("generates OG tags for a post with description and image", () => {
    prerenderPosts(makeConfig());

    expect(fs.writeFileSync).toHaveBeenCalledOnce();
    const html = vi.mocked(fs.writeFileSync).mock.calls[0][1] as string;
    expect(html).toContain('<meta property="og:title" content="Hello World">');
    expect(html).toContain('<meta property="og:url" content="https://example.com/post/hello-world">');
    expect(html).toContain('<meta property="og:type" content="article">');
    expect(html).toContain('<meta property="og:description" content="A first post about hello world.">');
    expect(html).toContain('<meta name="description" content="A first post about hello world.">');
    expect(html).toContain('<meta property="og:image" content="https://example.com/hello.jpg">');
  });

  it("omits og:image when previewImage is absent", () => {
    const config = makeConfig();
    const doc = config.seed.collections[0].documents[0];
    delete (doc.data as Record<string, unknown>).previewImage;

    prerenderPosts(config);

    const html = vi.mocked(fs.writeFileSync).mock.calls[0][1] as string;
    expect(html).not.toContain("og:image");
    expect(html).toContain('<meta property="og:description"');
  });

  it("omits description tags when previewDescription is absent", () => {
    const config = makeConfig();
    const doc = config.seed.collections[0].documents[0];
    delete (doc.data as Record<string, unknown>).previewDescription;
    delete (doc.data as Record<string, unknown>).previewImage;

    prerenderPosts(config);

    const html = vi.mocked(fs.writeFileSync).mock.calls[0][1] as string;
    expect(html).not.toContain("og:description");
    expect(html).not.toContain('<meta name="description"');
    expect(html).not.toContain("og:image");
    expect(html).toContain('<meta property="og:title"');
  });

  it("rewrites title tag with post title and suffix", () => {
    prerenderPosts(makeConfig());

    const html = vi.mocked(fs.writeFileSync).mock.calls[0][1] as string;
    expect(html).toContain("<title>Hello World | My Blog</title>");
    expect(html).not.toContain("<title>My Blog</title>");
  });

  it("skips unpublished posts", () => {
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

    prerenderPosts(config);

    expect(fs.writeFileSync).toHaveBeenCalledOnce();
    expect(vi.mocked(fs.mkdirSync).mock.calls[0][0]).toContain("hello-world");
  });

  it("throws when posts collection is missing", () => {
    const config = makeConfig({ seed: { collections: [] } });
    expect(() => prerenderPosts(config)).toThrow("No 'posts' collection found");
  });

  it("throws when published post is missing a title", () => {
    const config = makeConfig();
    delete (config.seed.collections[0].documents[0].data as Record<string, unknown>).title;

    expect(() => prerenderPosts(config)).toThrow('missing a title');
  });

  it("throws when </head> marker is missing from template", () => {
    vi.mocked(fs.readFileSync).mockReturnValue("<html><body></body></html>");
    expect(() => prerenderPosts(makeConfig())).toThrow("</head> marker not found");
  });

  it("throws when <title> tag is missing from template", () => {
    vi.mocked(fs.readFileSync).mockReturnValue("<html><head></head><body></body></html>");
    expect(() => prerenderPosts(makeConfig())).toThrow("<title> tag not found");
  });

  it("escapes HTML in title and description", () => {
    const config = makeConfig();
    const doc = config.seed.collections[0].documents[0];
    (doc.data as Record<string, unknown>).title = 'Say "Hello" & <Goodbye>';
    (doc.data as Record<string, unknown>).previewDescription = 'A <script>alert("xss")</script> post';

    prerenderPosts(config);

    const html = vi.mocked(fs.writeFileSync).mock.calls[0][1] as string;
    expect(html).toContain('content="Say &quot;Hello&quot; &amp; &lt;Goodbye&gt;"');
    expect(html).toContain("<title>Say &quot;Hello&quot; &amp; &lt;Goodbye&gt; | My Blog</title>");
    expect(html).not.toContain("<script>");
  });

  it("creates output directory with recursive flag", () => {
    prerenderPosts(makeConfig());

    expect(fs.mkdirSync).toHaveBeenCalledWith(
      expect.stringContaining("post/hello-world"),
      { recursive: true },
    );
  });
});
