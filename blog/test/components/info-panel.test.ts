import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { renderInfoPanel, hydrateInfoPanel } from "../../src/components/info-panel";
import type { PostMeta } from "../../src/post-types";
import type {
  BlogRollEntry,
  BlogRollStrategy,
  LatestPost,
} from "../../src/blog-roll/types";

const mockPosts: PostMeta[] = [
  {
    id: "post-1",
    title: "First Post",
    published: true,
    publishedAt: "2026-02-15T00:00:00Z",
    filename: "post-1.md",
  },
  {
    id: "post-2",
    title: "Second Post",
    published: true,
    publishedAt: "2026-01-10T00:00:00Z",
    filename: "post-2.md",
  },
  {
    id: "draft-1",
    title: "Draft Post",
    published: false,
    publishedAt: null,
    filename: "draft.md",
  },
];

const mockLinkSections = [
  { heading: "Links", links: [{ label: "Source", url: "https://github.com/natb1/commons.systems" }] },
];

const mockBlogRoll: BlogRollEntry[] = [
  { id: "test-blog", name: "Test Blog", url: "https://example.com" },
];

function defaultData() {
  return {
    linkSections: mockLinkSections,
    topPosts: mockPosts,
    blogRoll: mockBlogRoll,
  };
}

describe("renderInfoPanel", () => {
  it("returns HTML with all four sections", () => {
    const html = renderInfoPanel(defaultData());
    expect(html).toContain("Links");
    expect(html).toContain("Top Posts");
    expect(html).toContain("Blogroll");
    expect(html).toContain("Archive");
  });

  it("link sections contain anchor tags with correct URLs and labels", () => {
    const html = renderInfoPanel(defaultData());
    expect(html).toContain(
      'href="https://github.com/natb1/commons.systems"',
    );
    expect(html).toContain("Source");
  });

  it("renders multiple link sections with their headings", () => {
    const html = renderInfoPanel({
      linkSections: [
        { heading: "Social", links: [{ label: "GitHub", url: "https://github.com" }] },
        { heading: "Games", links: [{ label: "Cairn", url: "https://cairnrpg.com" }] },
      ],
      topPosts: [],
      blogRoll: [],
    });
    expect(html).toContain("Social");
    expect(html).toContain("Games");
    expect(html).toContain("GitHub");
    expect(html).toContain("Cairn");
  });

  it("renders link section without heading when heading is omitted", () => {
    const html = renderInfoPanel({
      linkSections: [
        { links: [{ label: "itch.io", url: "https://itch.io" }] },
      ],
      topPosts: [],
      blogRoll: [],
    });
    expect(html).toContain("itch.io");
    expect(html).toContain('href="https://itch.io"');
    const container = document.createElement("div");
    container.innerHTML = html;
    const sections = container.querySelectorAll(".panel-section");
    const firstSection = sections[0];
    expect(firstSection.querySelector("h3")).toBeNull();
    expect(firstSection.querySelector("ul.panel-list")).not.toBeNull();
  });

  it("renders mixed heading and headingless sections together", () => {
    const html = renderInfoPanel({
      linkSections: [
        { links: [{ label: "itch.io", url: "https://itch.io" }] },
        { heading: "Games", links: [{ label: "Cairn", url: "https://cairnrpg.com" }] },
      ],
      topPosts: [],
      blogRoll: [],
    });
    const container = document.createElement("div");
    container.innerHTML = html;
    const sections = container.querySelectorAll(".panel-section");
    expect(sections[0].querySelector("h3")).toBeNull();
    expect(sections[0].querySelector("ul.panel-list")).not.toBeNull();
    expect(sections[1].querySelector("h3")?.textContent).toBe("Games");
    expect(sections[1].querySelector("ul.panel-list")).not.toBeNull();
  });

  it("top posts section contains links to published posts", () => {
    const html = renderInfoPanel(defaultData());
    expect(html).toContain('href="/post/post-1"');
    expect(html).toContain("First Post");
    expect(html).toContain('href="/post/post-2"');
    expect(html).toContain("Second Post");
  });

  it("top posts section filters out unpublished posts", () => {
    const html = renderInfoPanel(defaultData());
    expect(html).not.toContain('href="/post/draft-1"');
    expect(html).not.toContain("Draft Post");
  });

  it("blog roll section contains entries with correct names and URLs", () => {
    const html = renderInfoPanel(defaultData());
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain("Test Blog");
  });

  it("blog roll section has entry link and latest post placeholder", () => {
    const html = renderInfoPanel(defaultData());
    expect(html).toContain('id="blogroll-entry-test-blog"');
    expect(html).toContain('id="blogroll-latest-test-blog"');
  });

  it("escapes special characters in link labels", () => {
    const html = renderInfoPanel({
      linkSections: [{ heading: "Links", links: [{ label: '<script>alert(1)</script>', url: "https://safe.com" }] }],
      topPosts: [],
      blogRoll: [],
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes special characters in post titles", () => {
    const xssPosts: PostMeta[] = [
      {
        id: "xss",
        title: '<script>alert(1)</script>',
        published: true,
        publishedAt: "2026-02-01T00:00:00Z",
        filename: "xss.md",
      },
    ];
    const html = renderInfoPanel({
      linkSections: [],
      topPosts: xssPosts,
      blogRoll: [],
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes special characters in blog roll names", () => {
    const xssBlogRoll: BlogRollEntry[] = [
      { id: "xss", name: '<script>alert(1)</script>', url: "https://safe.com" },
    ];
    const html = renderInfoPanel({
      linkSections: [],
      topPosts: [],
      blogRoll: xssBlogRoll,
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("handles empty arrays gracefully", () => {
    const html = renderInfoPanel({
      linkSections: [],
      topPosts: [],
      blogRoll: [],
    });
    expect(html).toContain("Top Posts");
    expect(html).toContain("Blogroll");
    expect(html).not.toContain("Archive");
  });

  it("blogroll section includes OPML icon when opmlUrl provided", () => {
    const html = renderInfoPanel({ ...defaultData(), opmlUrl: "/blogroll.opml" });
    expect(html).toContain('href="/blogroll.opml"');
    expect(html).toContain('src="/icons/opml.svg"');
    expect(html).toContain('class="feed-icon"');
    expect(html).toContain('alt="OPML"');
  });

  it("blogroll section omits OPML icon when opmlUrl not provided", () => {
    const html = renderInfoPanel(defaultData());
    expect(html).not.toContain('src="/icons/opml.svg"');
  });

  it("archive section includes RSS icon as img when rssFeedUrl provided", () => {
    const html = renderInfoPanel({
      ...defaultData(),
      rssFeedUrl: "/feed.xml",
    });
    expect(html).toContain('src="/icons/rss.svg"');
    expect(html).toContain('alt="RSS"');
    expect(html).toContain('href="/feed.xml"');
    expect(html).not.toContain("download=");
  });

  it("archive section has no RSS icon when rssFeedUrl undefined", () => {
    const html = renderInfoPanel(defaultData());
    expect(html).not.toContain('src="/icons/rss.svg"');
  });

  it("blogroll entries include date placeholder span", () => {
    const html = renderInfoPanel(defaultData());
    expect(html).toContain('id="blogroll-date-test-blog"');
    expect(html).toContain('class="blogroll-date"');
  });

  describe("archive (pinned date)", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-02-15"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("groups posts by year and month correctly", () => {
      const html = renderInfoPanel(defaultData());
      expect(html).toContain("2026");
      expect(html).toContain("February");
      expect(html).toContain("January");
    });

    it("current year (2026) is open by default", () => {
      const html = renderInfoPanel(defaultData());
      const container = document.createElement("div");
      container.innerHTML = html;

      const allDetails = container.querySelectorAll("details");
      let foundOpen = false;
      for (const details of allDetails) {
        const summary = details.querySelector("summary");
        if (summary?.textContent?.trim() === "2026") {
          expect(details.hasAttribute("open")).toBe(true);
          foundOpen = true;
        }
      }
      expect(foundOpen).toBe(true);
    });

    it("other years are collapsed", () => {
      const multiYearPosts: PostMeta[] = [
        {
          id: "p1",
          title: "Old",
          published: true,
          publishedAt: "2025-03-01T00:00:00Z",
          filename: "old.md",
        },
        {
          id: "p3",
          title: "New",
          published: true,
          publishedAt: "2026-02-15T00:00:00Z",
          filename: "new.md",
        },
      ];
      const html = renderInfoPanel({
        linkSections: [],
        topPosts: multiYearPosts,
        blogRoll: [],
      });
      const container = document.createElement("div");
      container.innerHTML = html;

      const allDetails = container.querySelectorAll("details");
      for (const details of allDetails) {
        const summary = details.querySelector("summary");
        if (summary?.textContent?.trim() === "2025") {
          expect(details.hasAttribute("open")).toBe(false);
        }
      }
    });

    it("current month (February 2026) is open by default", () => {
      const html = renderInfoPanel(defaultData());
      const container = document.createElement("div");
      container.innerHTML = html;

      const allDetails = container.querySelectorAll("details");
      let foundOpen = false;
      for (const details of allDetails) {
        const summary = details.querySelector("summary");
        if (summary?.textContent?.trim() === "February") {
          expect(details.hasAttribute("open")).toBe(true);
          foundOpen = true;
        }
      }
      expect(foundOpen).toBe(true);
    });

    it("other months are collapsed", () => {
      const html = renderInfoPanel(defaultData());
      const container = document.createElement("div");
      container.innerHTML = html;

      const allDetails = container.querySelectorAll("details");
      for (const details of allDetails) {
        const summary = details.querySelector("summary");
        if (
          summary?.textContent?.trim() === "January"
        ) {
          expect(details.hasAttribute("open")).toBe(false);
        }
      }
    });

    it("years sorted descending, months sorted descending within year", () => {
      const multiYearPosts: PostMeta[] = [
        {
          id: "p1",
          title: "Old",
          published: true,
          publishedAt: "2025-03-01T00:00:00Z",
          filename: "old.md",
        },
        {
          id: "p2",
          title: "Older",
          published: true,
          publishedAt: "2025-06-01T00:00:00Z",
          filename: "older.md",
        },
        {
          id: "p3",
          title: "New",
          published: true,
          publishedAt: "2026-02-15T00:00:00Z",
          filename: "new.md",
        },
      ];
      const html = renderInfoPanel({
        linkSections: [],
        topPosts: multiYearPosts,
        blogRoll: [],
      });
      const container = document.createElement("div");
      container.innerHTML = html;

      const archiveSection = container.querySelector(
        ".panel-section:last-child",
      )!;
      const yearDetails = [...archiveSection.children].filter(
        (el) => el.tagName === "DETAILS",
      );
      const years = yearDetails.map(
        (d) => d.querySelector("summary")!.textContent!.trim(),
      );
      expect(years).toEqual(["2026", "2025"]);

      const year2025 = yearDetails[1];
      const monthDetails = [...year2025.children].filter(
        (el) => el.tagName === "DETAILS",
      );
      const months = monthDetails.map(
        (d) => d.querySelector("summary")!.textContent!.trim(),
      );
      expect(months).toEqual(["June", "March"]);
    });

    it("groups UTC midnight post under its UTC month", () => {
      const boundaryPost: PostMeta[] = [
        {
          id: "utc-boundary",
          title: "UTC Boundary",
          published: true,
          publishedAt: "2026-02-01T00:00:00Z",
          filename: "utc.md",
        },
      ];
      const html = renderInfoPanel({
        linkSections: [],
        topPosts: boundaryPost,
        blogRoll: [],
      });
      expect(html).toContain("February");
      expect(html).not.toContain("January");
    });

    it("uses custom postLinkPrefix in top posts and archive links", () => {
      const html = renderInfoPanel({ ...defaultData(), postLinkPrefix: "/post/" });
      const container = document.createElement("div");
      container.innerHTML = html;

      // Top posts use custom prefix
      expect(html).toContain('href="/post/post-1"');
      expect(html).toContain('href="/post/post-2"');
      expect(html).not.toContain('href="#/post/');

      // Archive links also use custom prefix
      const archiveLinks = container.querySelectorAll("details a");
      for (const link of archiveLinks) {
        const href = link.getAttribute("href");
        if (href?.includes("post-")) {
          expect(href).toMatch(/^\/post\//);
        }
      }
    });

    it("archive is empty when no published posts", () => {
      const draftsOnly: PostMeta[] = [
        {
          id: "d1",
          title: "Draft",
          published: false,
          publishedAt: null,
          filename: "d.md",
        },
      ];
      const html = renderInfoPanel({
        linkSections: [],
        topPosts: draftsOnly,
        blogRoll: [],
      });
      expect(html).not.toContain("Archive");
    });
  });
});

describe("hydrateInfoPanel", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function createPanel(blogRoll: BlogRollEntry[]): HTMLElement {
    const container = document.createElement("div");
    container.innerHTML = renderInfoPanel({
      linkSections: [],
      topPosts: [],
      blogRoll,
    });
    return container;
  }

  it("calls strategy.fetchLatestPost() for each blog roll entry", () => {
    const entries: BlogRollEntry[] = [
      { id: "blog-a", name: "Blog A", url: "https://a.com" },
      { id: "blog-b", name: "Blog B", url: "https://b.com" },
    ];
    const panel = createPanel(entries);

    const strategyA: BlogRollStrategy = {
      fetchLatestPost: vi.fn().mockResolvedValue(null),
    };
    const strategyB: BlogRollStrategy = {
      fetchLatestPost: vi.fn().mockResolvedValue(null),
    };
    const strategies = new Map<string, BlogRollStrategy>([
      ["blog-a", strategyA],
      ["blog-b", strategyB],
    ]);

    hydrateInfoPanel(panel, entries, strategies);

    expect(strategyA.fetchLatestPost).toHaveBeenCalledOnce();
    expect(strategyB.fetchLatestPost).toHaveBeenCalledOnce();
  });

  it("fills placeholder text and updates entry href when strategy succeeds", async () => {
    const entries: BlogRollEntry[] = [
      { id: "test-blog", name: "Test Blog", url: "https://example.com" },
    ];
    const panel = createPanel(entries);

    const latest: LatestPost = {
      title: "New Article",
      url: "https://example.com/article",
    };
    const strategy: BlogRollStrategy = {
      fetchLatestPost: vi.fn().mockResolvedValue(latest),
    };
    const strategies = new Map<string, BlogRollStrategy>([
      ["test-blog", strategy],
    ]);

    hydrateInfoPanel(panel, entries, strategies);

    await vi.waitFor(() => {
      const placeholder = panel.querySelector("#blogroll-latest-test-blog");
      expect(placeholder!.textContent).toBe("New Article");
      const entryLink = panel.querySelector("#blogroll-entry-test-blog");
      expect(entryLink!.getAttribute("href")).toBe("https://example.com/article");
    });
  });

  it("fills date span and sets data-iso when strategy returns publishedAt", async () => {
    const entries: BlogRollEntry[] = [
      { id: "test-blog", name: "Test Blog", url: "https://example.com" },
    ];
    const panel = createPanel(entries);

    const latest: LatestPost = {
      title: "New Article",
      url: "https://example.com/article",
      publishedAt: "2026-02-01T00:00:00Z",
    };
    const strategy: BlogRollStrategy = {
      fetchLatestPost: vi.fn().mockResolvedValue(latest),
    };
    const strategies = new Map<string, BlogRollStrategy>([
      ["test-blog", strategy],
    ]);

    hydrateInfoPanel(panel, entries, strategies);

    await vi.waitFor(() => {
      const dateSpan = panel.querySelector("#blogroll-date-test-blog");
      expect(dateSpan!.textContent).toBe("Feb 1, 2026");
      expect(dateSpan!.getAttribute("data-iso")).toBe("2026-02-01T00:00:00Z");
    });
  });

  it("sorts entries by publishedAt descending", async () => {
    const entries: BlogRollEntry[] = [
      { id: "old-blog", name: "Old Blog", url: "https://old.com" },
      { id: "new-blog", name: "New Blog", url: "https://new.com" },
    ];
    const panel = createPanel(entries);

    const strategyOld: BlogRollStrategy = {
      fetchLatestPost: vi.fn().mockResolvedValue({
        title: "Old Post",
        url: "https://old.com/post",
        publishedAt: "2025-01-01",
      }),
    };
    const strategyNew: BlogRollStrategy = {
      fetchLatestPost: vi.fn().mockResolvedValue({
        title: "New Post",
        url: "https://new.com/post",
        publishedAt: "2025-11-19",
      }),
    };
    const strategies = new Map<string, BlogRollStrategy>([
      ["old-blog", strategyOld],
      ["new-blog", strategyNew],
    ]);

    hydrateInfoPanel(panel, entries, strategies);

    await vi.waitFor(() => {
      const items = panel.querySelectorAll("li[data-blogroll-id]");
      expect(items[0].getAttribute("data-blogroll-id")).toBe("new-blog");
      expect(items[1].getAttribute("data-blogroll-id")).toBe("old-blog");
    });
  });

  it("leaves placeholder empty when strategy returns null", async () => {
    const entries: BlogRollEntry[] = [
      { id: "test-blog", name: "Test Blog", url: "https://example.com" },
    ];
    const panel = createPanel(entries);

    const strategy: BlogRollStrategy = {
      fetchLatestPost: vi.fn().mockResolvedValue(null),
    };
    const strategies = new Map<string, BlogRollStrategy>([
      ["test-blog", strategy],
    ]);

    hydrateInfoPanel(panel, entries, strategies);

    await vi.waitFor(() => expect(strategy.fetchLatestPost).toHaveBeenCalled());
    const placeholder = panel.querySelector("#blogroll-latest-test-blog");
    expect(placeholder!.textContent).toBe("");
  });

  it("leaves placeholder empty when strategy rejects", async () => {
    const entries: BlogRollEntry[] = [
      { id: "test-blog", name: "Test Blog", url: "https://example.com" },
    ];
    const panel = createPanel(entries);

    const strategy: BlogRollStrategy = {
      fetchLatestPost: vi.fn().mockRejectedValue(new Error("Network error")),
    };
    const strategies = new Map<string, BlogRollStrategy>([
      ["test-blog", strategy],
    ]);

    hydrateInfoPanel(panel, entries, strategies);

    await vi.waitFor(() => expect(strategy.fetchLatestPost).toHaveBeenCalled());
    const placeholder = panel.querySelector("#blogroll-latest-test-blog");
    expect(placeholder!.textContent).toBe("");
  });
});
