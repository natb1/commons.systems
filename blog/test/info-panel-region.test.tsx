// @vitest-environment happy-dom
//
// InfoPanelRegion is the React replacement for the imperative renderInfoPanel +
// hydrateInfoPanel pair (AdminRegion is a thin pass-through over <Admin>). These
// checks mount via RTL and assert both the initial delegated markup and the
// post-mount blog-roll hydration. Because the hydrate effect reaches its DOM via
// document.getElementById("info-panel") — the host <aside> the driver mounts into
// — InfoPanelRegion is rendered into a container carrying that id, mirroring the
// real host element.
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import { InfoPanelRegion } from "../src/components/InfoPanelRegion";
import { AdminRegion } from "../src/pages/AdminRegion";
import type { InfoPanelData } from "../src/components/info-panel";
import type {
  BlogRollEntry,
  BlogRollStrategy,
  LatestPost,
} from "../src/blog-roll/types";
import type { User } from "firebase/auth";

if (typeof globalThis.reportError !== "function") {
  globalThis.reportError = () => {};
}

const blogRoll: BlogRollEntry[] = [
  { id: "test-blog", name: "Test Blog", url: "https://example.com" },
  { id: "other-blog", name: "Other Blog", url: "https://other.example.com" },
];

const baseData: InfoPanelData = {
  linkSections: [
    { heading: "Links", links: [{ label: "Source", url: "https://github.com/x" }] },
  ],
  topPosts: [],
  blogRoll,
  postLinkPrefix: "/post/",
};

function strategyResolving(post: LatestPost | null): BlogRollStrategy {
  return { fetchLatestPost: () => Promise.resolve(post) };
}

// Render into a host carrying id="info-panel" so the hydrate effect's
// getElementById finds it (the effect mutates that host's subtree).
function renderInPanel(ui: React.ReactElement) {
  const host = document.createElement("aside");
  host.id = "info-panel";
  host.className = "sidebar";
  document.body.appendChild(host);
  return render(ui, { container: host });
}

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

describe("InfoPanelRegion", () => {
  it("renders the blogroll li[data-blogroll-id] items for each entry", () => {
    const { container } = renderInPanel(
      <InfoPanelRegion data={baseData} strategies={new Map()} />,
    );
    const items = container.querySelectorAll("li[data-blogroll-id]");
    expect(items.length).toBe(2);
    expect(container.querySelector("#blogroll-entry-test-blog")).not.toBeNull();
    expect(container.querySelector("#blogroll-latest-test-blog")).not.toBeNull();
    expect(container.querySelector("#blogroll-date-test-blog")).not.toBeNull();
  });

  it("hydrates each entry's latest post into the delegated DOM", async () => {
    const post: LatestPost = {
      title: "Latest Article",
      url: "https://example.com/latest",
      publishedAt: "2026-03-01T00:00:00Z",
    };
    const strategies = new Map<string, BlogRollStrategy>([
      ["test-blog", strategyResolving(post)],
    ]);

    const { container } = renderInPanel(
      <InfoPanelRegion data={baseData} strategies={strategies} />,
    );

    await waitFor(() => {
      expect(container.querySelector("#blogroll-latest-test-blog")?.textContent).toBe(
        "Latest Article",
      );
    });

    expect(
      container.querySelector("#blogroll-entry-test-blog")?.getAttribute("href"),
    ).toBe("https://example.com/latest");
    const dateSpan = container.querySelector("#blogroll-date-test-blog");
    expect(dateSpan?.getAttribute("data-iso")).toBe("2026-03-01T00:00:00Z");
    expect(dateSpan?.textContent?.length).toBeGreaterThan(0);
  });

  it("re-sorts entries by publishedAt descending after hydration", async () => {
    const data: InfoPanelData = {
      ...baseData,
      blogRoll: [
        { id: "old-blog", name: "Old Blog", url: "https://old.com" },
        { id: "new-blog", name: "New Blog", url: "https://new.com" },
      ],
    };
    const strategies = new Map<string, BlogRollStrategy>([
      [
        "old-blog",
        strategyResolving({
          title: "Old Post",
          url: "https://old.com/post",
          publishedAt: "2025-01-01",
        }),
      ],
      [
        "new-blog",
        strategyResolving({
          title: "New Post",
          url: "https://new.com/post",
          publishedAt: "2025-11-19",
        }),
      ],
    ]);

    const { container } = renderInPanel(
      <InfoPanelRegion data={data} strategies={strategies} />,
    );

    await waitFor(() => {
      const items = container.querySelectorAll("li[data-blogroll-id]");
      expect(items[0].getAttribute("data-blogroll-id")).toBe("new-blog");
      expect(items[1].getAttribute("data-blogroll-id")).toBe("old-blog");
    });
  });

  it("leaves the placeholder empty when a strategy resolves null", async () => {
    const data: InfoPanelData = {
      ...baseData,
      blogRoll: [{ id: "test-blog", name: "Test Blog", url: "https://example.com" }],
    };
    const strategy = strategyResolving(null);
    const fetchSpy = vi.spyOn(strategy, "fetchLatestPost");
    const strategies = new Map<string, BlogRollStrategy>([["test-blog", strategy]]);

    const { container } = renderInPanel(
      <InfoPanelRegion data={data} strategies={strategies} />,
    );

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    expect(container.querySelector("#blogroll-latest-test-blog")?.textContent).toBe("");
  });

  it("degrades silently, leaving the placeholder empty, when a strategy rejects", async () => {
    const data: InfoPanelData = {
      ...baseData,
      blogRoll: [{ id: "test-blog", name: "Test Blog", url: "https://example.com" }],
    };
    const strategy: BlogRollStrategy = {
      fetchLatestPost: vi.fn<() => Promise<LatestPost | null>>().mockRejectedValue(
        new Error("Network error"),
      ),
    };
    const strategies = new Map<string, BlogRollStrategy>([["test-blog", strategy]]);

    const { container } = renderInPanel(
      <InfoPanelRegion data={data} strategies={strategies} />,
    );

    await waitFor(() => expect(strategy.fetchLatestPost).toHaveBeenCalled());
    expect(container.querySelector("#blogroll-latest-test-blog")?.textContent).toBe("");
  });

  it("renders aboutContent and runs no fetch when provided", async () => {
    const fetchLatestPost = vi.fn<() => Promise<LatestPost | null>>();
    const strategies = new Map<string, BlogRollStrategy>([
      ["test-blog", { fetchLatestPost }],
    ]);

    const { container } = renderInPanel(
      <InfoPanelRegion
        data={baseData}
        strategies={strategies}
        aboutContent='<section class="about-panel"><h2>About</h2></section>'
      />,
    );

    expect(container.querySelector(".about-panel")).not.toBeNull();
    expect(container.textContent).toContain("About");
    // No blogroll rendered, no fetch performed.
    expect(container.querySelector("li[data-blogroll-id]")).toBeNull();

    // Give any (incorrectly scheduled) effect a chance to run, then confirm none did.
    await Promise.resolve();
    expect(fetchLatestPost).not.toHaveBeenCalled();
  });
});

describe("AdminRegion", () => {
  it("prompts sign-in when signed out", () => {
    const { container } = render(<AdminRegion user={null} isAdmin={false} />);
    expect(container.textContent).toContain("Sign in");
    expect(container.querySelector("#not-authorized")).toBeNull();
  });

  it("shows the not-authorized marker for a signed-in non-admin", () => {
    const user = { displayName: "Jane", email: "jane@example.com" } as User;
    const { container } = render(<AdminRegion user={user} isAdmin={false} />);
    expect(container.querySelector("#not-authorized")).not.toBeNull();
  });

  it("greets the admin and shows the skipped-count warning", () => {
    const user = { displayName: "Admin", email: "admin@example.com" } as User;
    const { container } = render(
      <AdminRegion user={user} isAdmin={true} skippedCount={2} />,
    );
    expect(container.querySelector("#not-authorized")).toBeNull();
    expect(container.textContent).toContain("Admin");
    expect(container.textContent).toContain("2 post(s)");
  });
});
