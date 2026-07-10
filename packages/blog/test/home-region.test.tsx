// @vitest-environment happy-dom
//
// HomeRegion is the React replacement for the imperative renderHomeHtml +
// hydrateHome pair. These checks mount it via RTL (the established pattern for
// effect-driven region components — see budget/test/smoke/home-scroll.smoke)
// and assert both the initial delegated markup and the post-mount effect's
// per-post fetch/parse/sanitize overwrite. fetchPost is stubbed directly, so no
// network/github mock is needed.
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import { HomeRegion } from "../src/pages/HomeRegion";
import type { PostContent } from "../src/marked-config";
import type { PostMeta } from "../src/post-types";

if (typeof globalThis.reportError !== "function") {
  globalThis.reportError = () => {};
}

const fetched: PostMeta = {
  id: "hello-world",
  title: "Hello World",
  published: true,
  publishedAt: "2026-01-01T00:00:00Z",
  filename: "hello-world.md",
};

const preRendered: PostMeta = {
  id: "second-post",
  title: "Second Post",
  published: true,
  publishedAt: "2026-01-02T00:00:00Z",
  filename: "second-post.md",
};

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

describe("HomeRegion", () => {
  it("renders the #posts container with an article + content div per post", () => {
    const { container } = render(
      <HomeRegion posts={[fetched, preRendered]} postLinkPrefix="/post/" fetchPost={vi.fn()} />,
    );
    expect(container.querySelector("#posts")).not.toBeNull();
    expect(container.querySelector("#post-hello-world")).not.toBeNull();
    expect(container.querySelector("#post-content-hello-world")).not.toBeNull();
    expect(container.querySelector("#post-second-post")).not.toBeNull();
    expect(container.querySelector("#post-content-second-post")).not.toBeNull();
  });

  it("renders EmptyFeed when there are no posts", () => {
    const fetchPost = vi.fn();
    const { container } = render(
      <HomeRegion posts={[]} postLinkPrefix="/post/" fetchPost={fetchPost} />,
    );
    expect(container.querySelector("#posts")).toBeNull();
    expect(container.textContent).toContain("No posts yet.");
    expect(fetchPost).not.toHaveBeenCalled();
  });

  it("fetches and overwrites the content div for posts without contentMap", async () => {
    const fetchPost = vi
      .fn<(filename: string) => Promise<string>>()
      .mockResolvedValue("# Markdown Title\nBody text here.");

    const { container } = render(
      <HomeRegion posts={[fetched]} postLinkPrefix="/post/" fetchPost={fetchPost} />,
    );

    // Initial delegated markup: the loading placeholder, not yet overwritten.
    expect(container.querySelector("#post-content-hello-world")?.innerHTML).toContain("Loading...");

    await waitFor(() => {
      const content = container.querySelector("#post-content-hello-world");
      expect(content?.innerHTML).toContain("Body text here.");
      expect(content?.innerHTML).not.toContain("Loading...");
      expect(content?.innerHTML).not.toContain("Markdown Title");
    });

    // The extracted h1 replaces the rendered title.
    expect(
      container.querySelector("#post-hello-world h2 .post-title")?.textContent,
    ).toBe("Markdown Title");
    expect(fetchPost).toHaveBeenCalledWith("hello-world.md");
  });

  it("marks the content div data-hydrated after a runtime hydrate and skips a second fetch", async () => {
    const first = vi
      .fn<(filename: string) => Promise<string>>()
      .mockResolvedValue("# Title\nBody one.");

    const { container, rerender } = render(
      <HomeRegion posts={[fetched]} postLinkPrefix="/post/" fetchPost={first} />,
    );

    await waitFor(() => {
      expect(container.querySelector("#post-content-hello-world")?.innerHTML).toContain(
        "Body one.",
      );
    });

    // The runtime hydrate now marks the div, mirroring the SSR marker, so the
    // guard short-circuits the re-fetch on the next effect run.
    const content = container.querySelector("#post-content-hello-world");
    expect(content?.hasAttribute("data-hydrated")).toBe(true);

    // A fresh fetchPost triggers the effect's dep change (a re-run/re-nav). The
    // guard sees data-hydrated and performs no second fetch.
    const second = vi
      .fn<(filename: string) => Promise<string>>()
      .mockResolvedValue("# Title 2\nBody two.");
    rerender(<HomeRegion posts={[fetched]} postLinkPrefix="/post/" fetchPost={second} />);

    await waitFor(() => {
      expect(first).toHaveBeenCalledTimes(1);
    });
    expect(second).not.toHaveBeenCalled();
    expect(content?.innerHTML).toContain("Body one.");
  });

  it("preserves pre-rendered content and skips fetch for hydrated posts", async () => {
    const contentMap: Record<string, PostContent> = {
      "second-post": { html: "<p>Pre-rendered body</p>", title: "Second Post" },
    };
    const fetchPost = vi
      .fn<(filename: string) => Promise<string>>()
      .mockResolvedValue("# Fetched\nShould not appear.");

    const { container } = render(
      <HomeRegion
        posts={[fetched, preRendered]}
        contentMap={contentMap}
        postLinkPrefix="/post/"
        fetchPost={fetchPost}
      />,
    );

    await waitFor(() => {
      // The non-hydrated post is fetched and overwritten.
      expect(container.querySelector("#post-content-hello-world")?.innerHTML).toContain(
        "Should not appear.",
      );
    });

    // The data-hydrated post keeps its server markup; fetchPost never ran for it.
    const hydrated = container.querySelector("#post-content-second-post");
    expect(hydrated?.innerHTML).toContain("Pre-rendered body");
    expect(fetchPost).not.toHaveBeenCalledWith("second-post.md");
    expect(fetchPost).toHaveBeenCalledTimes(1);
    expect(fetchPost).toHaveBeenCalledWith("hello-world.md");
  });

  it("shows the error fallback when a fetch rejects", async () => {
    const fetchPost = vi
      .fn<(filename: string) => Promise<string>>()
      .mockRejectedValue(new Error("network error"));

    const { container } = render(
      <HomeRegion posts={[fetched]} postLinkPrefix="/post/" fetchPost={fetchPost} />,
    );

    await waitFor(() => {
      expect(container.querySelector("#post-content-hello-world")?.innerHTML).toContain(
        "Could not load post content. Try refreshing.",
      );
    });
  });

  it("scrolls to the target article when scrollSlug is provided", async () => {
    const header = document.createElement("header");
    Object.defineProperty(header, "offsetHeight", { value: 60, configurable: true });
    document.body.appendChild(header);

    const fetchPost = vi
      .fn<(filename: string) => Promise<string>>()
      .mockResolvedValue("# Hello");
    const scrollSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

    try {
      render(
        <HomeRegion
          posts={[fetched]}
          postLinkPrefix="/post/"
          fetchPost={fetchPost}
          scrollSlug="hello-world"
        />,
      );

      await waitFor(() => {
        expect(scrollSpy).toHaveBeenCalled();
      });

      // getBoundingClientRect().top is 0 in happy-dom, so
      // Math.max(0, 0 + 0 - 60 - 16) = 0.
      const call = scrollSpy.mock.calls[0][0] as ScrollToOptions; // type-safety-ok: mock call argument inspection
      expect(call.top).toBe(0);
      expect(call.behavior).toBe("instant");
    } finally {
      scrollSpy.mockRestore();
      document.body.removeChild(header);
    }
  });

  it("does not scroll or write from a stale run after props change mid-flight", async () => {
    const header = document.createElement("header");
    Object.defineProperty(header, "offsetHeight", { value: 60, configurable: true });
    document.body.appendChild(header);

    const scrollSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

    try {
      // First mount with a deferred fetch that never resolves before the rerender.
      let resolveFirst!: (value: string) => void; // type-safety-ok: deferred promise resolver definite assignment
      const firstFetch = vi
        .fn<(filename: string) => Promise<string>>()
        .mockReturnValue(new Promise<string>((resolve) => { resolveFirst = resolve; }));

      const { rerender, container } = render(
        <HomeRegion
          posts={[fetched]}
          postLinkPrefix="/post/"
          fetchPost={firstFetch}
          scrollSlug="hello-world"
        />,
      );

      // Rerender with a NEW fetchPost — the effect's dep change runs the first
      // run's cleanup (cancelling its writes/scroll) and starts a fresh run.
      let resolveSecond!: (value: string) => void; // type-safety-ok: deferred promise resolver definite assignment
      const secondFetch = vi
        .fn<(filename: string) => Promise<string>>()
        .mockReturnValue(new Promise<string>((resolve) => { resolveSecond = resolve; }));

      rerender(
        <HomeRegion
          posts={[fetched]}
          postLinkPrefix="/post/"
          fetchPost={secondFetch}
          scrollSlug="hello-world"
        />,
      );

      // Resolve the stale (first) run; its container/cancel guard must drop the
      // write and skip the scroll.
      resolveFirst("# Stale should not appear");
      resolveSecond("# Fresh");

      await waitFor(() => {
        expect(scrollSpy).toHaveBeenCalledTimes(1);
      });

      // The single scroll came from the live (second) run, and the content
      // reflects the live fetch — the stale fetch's markdown never landed.
      const content = container.querySelector("#post-content-hello-world");
      expect(content?.innerHTML).not.toContain("Stale should not appear");
      expect(content?.innerHTML).not.toContain("Loading...");
    } finally {
      scrollSpy.mockRestore();
      document.body.removeChild(header);
    }
  });
});
