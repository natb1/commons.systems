// @vitest-environment happy-dom
//
// createBlogApp(config) is called directly as a function — no module-import
// side effects to manage. The REAL @commons-systems/router drives navigation
// (its render→null routes leave #app to React) and the REAL Region components
// (HomeRegion / InfoPanelRegion / AdminRegion / BlogNav) render into the three
// hydrateRoot roots, so the DOM under test is the real component output.
//
// Only the DATA layer the driver still imports is mocked: firestore.getPosts,
// github.createFetchPost, authutil/groups.isInGroup, the panel-toggle, the
// app-check defer hook, the og-meta/canonical SEO writers, and the
// scroll-indicator. Everything React renders is real.
//
// To avoid React hydration mismatches, scaffoldDom server-renders the SAME
// elements the driver hydrates with (renderToString over BlogNav / HomeRegion /
// InfoPanelRegion with the build-time props), mirroring prerender.ts (Unit 5).
// renderToString (NOT renderToStaticMarkup) emits the hydration markers React's
// hydrateRoot expects, giving it the best chance to REUSE the prerendered nodes
// rather than client-render — which is what the node-identity (CLS) assertions
// in Cases 2 and 7 verify.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "@testing-library/react";
import { createElement, Fragment } from "react";
import { renderToString } from "react-dom/server";

import { createBlogApp } from "../src/create-blog-app.ts";
import type { CreateBlogAppConfig } from "../src/create-blog-app.ts";
import { getPosts } from "../src/firestore.ts";
import { initScrollIndicator } from "@commons-systems/components/scroll-indicator";

import { BlogNav } from "../src/components/BlogNav.tsx";
import { HomeRegion } from "../src/pages/HomeRegion.tsx";
import { InfoPanelRegion } from "../src/components/InfoPanelRegion.tsx";
import type { PostMeta } from "../src/post-types.ts";
import type { PostContent } from "../src/marked-config.ts";
import type { BlogRollEntry, BlogRollStrategy, LatestPost } from "../src/blog-roll/types.ts";

// React calls globalThis.reportError on render errors under happy-dom.
if (typeof globalThis.reportError !== "function") {
  globalThis.reportError = () => {};
}

// ── Data-layer mocks (everything the driver imports that touches I/O) ────────
vi.mock("../src/og-meta.ts", () => ({ updateOgMeta: vi.fn() }));
vi.mock("../src/canonical.ts", () => ({ updateCanonical: vi.fn() }));
vi.mock("../src/github.ts", () => ({
  // Return a stub fetchPost resolving a tiny markdown doc; HomeRegion only hits
  // it for posts lacking a contentMap (data-hydrated) entry.
  createFetchPost: vi.fn(() => vi.fn(() => Promise.resolve("# Title\nBody text."))),
}));
vi.mock("../src/firestore.ts", () => ({
  getPosts: vi.fn(() => Promise.resolve({ posts: [], skippedCount: 0 })),
}));
vi.mock("@commons-systems/authutil/groups", () => ({
  isInGroup: vi.fn(() => Promise.resolve(false)),
}));
vi.mock("@commons-systems/components/panel-toggle", () => ({
  initPanelToggle: vi.fn(),
}));
vi.mock("@commons-systems/components/scroll-indicator", () => ({
  initScrollIndicator: vi.fn(() => vi.fn()),
}));
vi.mock("@commons-systems/firebaseutil/defer-appcheck", () => ({
  deferAppCheckInit: vi.fn(),
}));

// happy-dom lacks ResizeObserver.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

// A published post with a contentMap entry: HomeRegion marks its content div
// data-hydrated, so the post-mount effect skips fetchPost (clean hydration).
const PUBLISHED_POST: PostMeta = {
  id: "first-post",
  title: "First Post",
  published: true,
  publishedAt: "2026-01-01T00:00:00Z",
  filename: "first-post.md",
};
const PUBLISHED_CONTENT: Record<string, PostContent> = {
  "first-post": { html: "<p>First body</p>", title: "First Post" },
};

const BLOGROLL: BlogRollEntry[] = [
  { id: "test-blog", name: "Test Blog", url: "https://example.com" },
];
const LATEST: LatestPost = {
  title: "Latest Article",
  url: "https://example.com/latest",
  publishedAt: "2026-03-01T00:00:00Z",
};

/** Build a minimal valid config. `onAuthStateChanged` returns a resolved Promise
 *  WITHOUT invoking its callback, so currentUser stays null. */
function makeConfig(overrides: Partial<CreateBlogAppConfig> = {}): CreateBlogAppConfig {
  return {
    buildTimeContent: {},
    buildTimeMetadata: [],
    fetchPostSource: "test/post",
    siteUrl: "https://example.com",
    ogTitle: "Test Site",
    siteDefaults: { title: "Test Site", description: "A test site.", image: "/og.png" },
    navLinks: [],
    showHomeLink: false,
    infoPanelLinkSections: [],
    blogRollEntries: [],
    strategies: new Map(),
    firebase: {
      db: { type: "mock-firestore" } as never,
      namespace: "test/env" as never,
      trackPageView: vi.fn(),
      initAppCheck: vi.fn(() => Promise.resolve()),
      signIn: vi.fn(() => Promise.resolve()),
      signOut: vi.fn(() => Promise.resolve()),
      // Must return a thenable without invoking the callback.
      onAuthStateChanged: vi.fn(() => Promise.resolve()),
    },
    adminGroupId: "admin" as never,
    ...overrides,
  };
}

/**
 * Server-render the three roots with the SAME build-time props the driver
 * hydrates with (mirroring prerender.ts, Unit 5) and inject them into the
 * scaffold. renderToString emits hydration markers so hydrateRoot can REUSE the
 * prerendered nodes — preserving node identity so the CLS / no-teardown
 * assertions in Cases 2 and 7 hold. The #app body is rendered with the same
 * scrollSlug the driver hydrates with (initialSlug, derived from the entry
 * path), so a deep /post/x scaffold matches homeElement(initialSlug). The
 * signed-out nav uses the current path so `showAuth` matches the driver's
 * `navElement(parsePath().path)`.
 */
function scaffoldDom(config: CreateBlogAppConfig, path = window.location.pathname): void {
  const initialSlug = path.startsWith("/post/") ? path.slice(6) : undefined;
  const navHtml = renderToString(
    createElement(BlogNav, {
      links: config.navLinks,
      showHomeLink: config.showHomeLink,
      showAuth: path === "/admin",
      user: null,
      onSignIn: () => {},
      onSignOut: () => {},
    }),
  );
  const appHtml = renderToString(
    createElement(HomeRegion, {
      posts: config.buildTimeMetadata,
      contentMap: config.buildTimeContent,
      postLinkPrefix: "/post/",
      fetchPost: () => Promise.resolve(""),
      scrollSlug: initialSlug,
    }),
  );
  const panelHtml = renderToString(
    createElement(InfoPanelRegion, {
      data: {
        linkSections: config.infoPanelLinkSections,
        topPosts: config.buildTimeMetadata,
        blogRoll: config.blogRollEntries,
        rssFeedUrl: "/feed.xml",
        opmlUrl: "/blogroll.opml",
        postLinkPrefix: "/post/",
        buildTimeFeeds: config.buildTimeFeeds,
      },
      strategies: config.strategies,
      useScrollIndicator: config.useScrollIndicator,
    }),
  );

  document.body.innerHTML = `
    <div id="nav">${navHtml}</div>
    <div class="page">
      <header></header>
      <div id="app">${appHtml}</div>
      <aside id="info-panel" class="sidebar">${panelHtml}</aside>
      <button id="panel-toggle"></button>
    </div>
  `;
}

/** Navigate via the real router's popstate listener (same mechanism the app uses). */
async function navigate(path: string): Promise<void> {
  await act(async () => {
    history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
    // Let the synchronous dispatch + React commit + any awaited branch settle.
    await Promise.resolve();
    await new Promise((r) => setTimeout(r, 0));
  });
}

/** Settle the initial hydration + router construction dispatch. */
async function settle(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await new Promise((r) => setTimeout(r, 0));
  });
}

let handle: ReturnType<typeof createBlogApp> | undefined;

describe("createBlogApp routing and panel behavior", () => {
  beforeEach(() => {
    handle = undefined;
    globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    handle?.destroy();
    handle = undefined;
    history.pushState({}, "", "/");
    vi.clearAllMocks();
  });

  // Case 1 — #1285 regression: direct /admin entry shows admin body; navigating
  // home rebuilds the home feed. Through the React model: on /admin the app shows
  // AdminRegion markup and no #posts; after popstate to /, #posts is present.
  it("rebuilds home content after a direct /admin entry (#1285)", async () => {
    history.pushState({}, "", "/admin");
    const config = makeConfig({ buildTimeMetadata: [PUBLISHED_POST], buildTimeContent: PUBLISHED_CONTENT });
    scaffoldDom(config, "/admin");

    handle = createBlogApp(config);
    const app = document.getElementById("app")!;

    // Admin route renders (signed-out non-admin) — no #posts feed.
    await vi.waitFor(() => {
      expect(app.querySelector("#posts")).toBeNull();
      expect(app.textContent).toContain("Admin");
    });

    await navigate("/");

    // Home content rebuilds — the feed is present again.
    await vi.waitFor(() => {
      expect(app.querySelector("#posts")).not.toBeNull();
      expect(app.querySelector("#post-first-post")).not.toBeNull();
      expect(app.textContent).not.toContain("Could not verify admin");
    });
  });

  // Case 2 — Direct / signed-out preserves the prerendered home feed WITHOUT
  // tearing down the #posts node (no CLS on the SEO surface) and does NOT fetch
  // firestore. Node identity: hydrateRoot(app, homeElement(initialSlug)) reuses
  // the renderToString scaffold, and the first-dispatch skip (TASK 1) avoids the
  // redundant root.render that would abandon hydration and client-render. We
  // capture #posts BEFORE createBlogApp and assert the SAME reference survives.
  it("reuses the prerendered #posts node on direct / entry (no CLS); getPosts not called", async () => {
    history.pushState({}, "", "/");
    const config = makeConfig({ buildTimeMetadata: [PUBLISHED_POST], buildTimeContent: PUBLISHED_CONTENT });
    scaffoldDom(config, "/");

    const postsNode = document.querySelector("#posts");
    expect(postsNode).not.toBeNull();

    handle = createBlogApp(config);
    const app = document.getElementById("app")!;

    await vi.waitFor(() => {
      expect(app.querySelector("#posts")).not.toBeNull();
    });
    await settle();

    // The prerendered node was REUSED, not torn down and replaced — hydrateRoot
    // + the first-dispatch skip preserved the DOM (no CLS).
    expect(document.querySelector("#posts")).toBe(postsNode);
    expect(app.querySelector("#post-first-post")).not.toBeNull();
    // Signed out: no firestore fetch.
    expect(getPosts).not.toHaveBeenCalled();
  });

  // Case 2b — Direct / signed-out preserves the prerendered nav and info-panel
  // nodes WITHOUT tearing them down (no CLS, no hydration error #424). Mirrors
  // Case 2's #posts guard but for the nav and info-panel roots: hydrateRoot already
  // rendered both for the entry path, so the first-dispatch skip avoids the
  // redundant root.render() that would abandon hydration and client-render. We
  // capture the nav <nav.cs-nav> and info-panel firstElementChild BEFORE
  // createBlogApp and assert the SAME references survive after settle().
  it("reuses the prerendered nav and info-panel nodes on direct / entry (no CLS, no hydration error #424)", async () => {
    history.pushState({}, "", "/");
    const config = makeConfig({ buildTimeMetadata: [PUBLISHED_POST], buildTimeContent: PUBLISHED_CONTENT });
    scaffoldDom(config, "/");

    // Capture stable server-rendered wrapper elements from both roots before
    // createBlogApp runs. nav.cs-nav is BlogNav's top-level <nav>; info-panel's
    // firstElementChild is InfoPanel's first rendered <section class="panel-section">.
    const navNode = document.getElementById("nav")!.firstElementChild; // type-safety-ok: test DOM node mounted in beforeEach
    expect(navNode).not.toBeNull();
    const panelNode = document.getElementById("info-panel")!.firstElementChild; // type-safety-ok: test DOM node mounted in beforeEach
    expect(panelNode).not.toBeNull();

    handle = createBlogApp(config);

    await settle();

    // The prerendered nodes were REUSED, not torn down and replaced — hydrateRoot
    // + the first-dispatch skip (guards on renderNav/renderPanel) preserved the DOM.
    // If the guards are absent, React abandons hydration and client-renders, breaking
    // these references.
    expect(document.getElementById("nav")!.firstElementChild).toBe(navNode); // type-safety-ok: test DOM node mounted in beforeEach
    expect(document.getElementById("info-panel")!.firstElementChild).toBe(panelNode); // type-safety-ok: test DOM node mounted in beforeEach
  });

  // Case 3 + TASK 1 — info-panel blogroll hydration runs, and
  // forceInfoPanelRefresh() REMOUNTS the panel so the blogroll RE-fetches.
  it("hydrates the blogroll, and forceInfoPanelRefresh re-fetches it via key remount", async () => {
    history.pushState({}, "", "/");
    const fetchLatestPost = vi.fn(() => Promise.resolve(LATEST));
    const strategies = new Map<string, BlogRollStrategy>([["test-blog", { fetchLatestPost }]]);
    const config = makeConfig({ blogRollEntries: BLOGROLL, strategies });
    scaffoldDom(config, "/");

    handle = createBlogApp(config);
    const panel = document.getElementById("info-panel")!; // type-safety-ok: test DOM node mounted in beforeEach

    // Blogroll effect ran: the stubbed latest post is written into the DOM.
    await vi.waitFor(() => {
      expect(panel.querySelector("#blogroll-latest-test-blog")?.textContent).toBe("Latest Article");
    });
    expect(fetchLatestPost).toHaveBeenCalledTimes(1);

    // forceInfoPanelRefresh bumps the React key → remount → effect re-runs → re-fetch.
    await act(async () => {
      handle!.forceInfoPanelRefresh(); // type-safety-ok: handle assigned by createBlogApp in setup
      await Promise.resolve();
      await new Promise((r) => setTimeout(r, 0));
    });
    await vi.waitFor(() => {
      expect(fetchLatestPost).toHaveBeenCalledTimes(2);
    });
  });

  // Case 4 — extraRoutes composition: /about renders a ReactNode body
  // + deferred afterRender, then home navigation restores the feed.
  it("renders extraRoutes and navigates back to home", async () => {
    history.pushState({}, "", "/");
    const config = makeConfig({
      buildTimeMetadata: [PUBLISHED_POST],
      buildTimeContent: PUBLISHED_CONTENT,
    });
    scaffoldDom(config, "/");

    const aboutAfterRender = vi.fn();
    config.extraRoutes = [
      {
        path: "/about",
        render: () => createElement("div", { "data-test": "about" }, "ABOUT"),
        afterRender: aboutAfterRender,
      },
    ];

    handle = createBlogApp(config);
    const app = document.getElementById("app")!;
    await settle();

    await navigate("/about");
    await vi.waitFor(() => {
      expect(app.innerHTML).toContain('data-test="about"');
      expect(app.querySelector("#posts")).toBeNull();
    });
    expect(aboutAfterRender).toHaveBeenCalled();

    await navigate("/");
    await vi.waitFor(() => {
      expect(app.querySelector("#posts")).not.toBeNull();
    });
    expect(app.innerHTML).not.toContain('data-test="about"');
  });

  // Case 4c (#2003) — DEEP /about entry hydrates #app over the prerendered About
  // body WITHOUT abandoning hydration (React #424 / CLS on the SEO surface). The
  // driver hydrates #app with the sync extraRoute body wrapped in <div>
  // (byte-matching prerenderStaticPage) and skips the first-dispatch
  // appRoot.render. Mirrors Case 2b's node-identity guard, but for an extraRoute
  // deep entry — the gap that shipped #424 on /about (e2e never loads /about, and
  // Case 4 only exercises SPA nav, not a deep entry). Without the fix, #app
  // hydrates the home feed over the About body and the first dispatch's
  // appRoot.render tears the node down (client render), failing the toBe below.
  it("reuses the prerendered #app node on direct /about entry (no CLS, no hydration error #424)", async () => {
    history.pushState({}, "", "/about");
    // The body and panel are ReactNodes. Both the route render / panel override
    // and the scaffold below derive from these SAME nodes so the server-rendered
    // markup byte-matches what the driver hydrates with (node-identity guard).
    const aboutBody = createElement(
      Fragment,
      null,
      createElement("h2", null, "About"),
      createElement("p", { "data-test": "about-body" }, "About content"),
    );
    const aboutPanel = createElement("section", { className: "profile-card" }, "ABOUT PANEL");
    const config = makeConfig({
      buildTimeMetadata: [PUBLISHED_POST],
      buildTimeContent: PUBLISHED_CONTENT,
      infoPanelContentForPath: (p) => (p === "/about" ? aboutPanel : undefined),
      extraRoutes: [{ path: "/about", render: () => aboutBody }],
    });

    // Scaffold the prerendered DOM exactly as a deep /about entry is served: #app
    // is the extraRoute body ReactNode wrapped in <div> (the element the driver
    // hydrates with — createElement("div", null, node)), #info-panel is
    // InfoPanelRegion(aboutContent), and nav is BlogNav for the entry path.
    const navHtml = renderToString(
      createElement(BlogNav, {
        links: config.navLinks,
        showHomeLink: config.showHomeLink,
        showAuth: false,
        user: null,
        onSignIn: () => {},
        onSignOut: () => {},
      }),
    );
    const appHtml = renderToString(createElement("div", null, aboutBody));
    const panelHtml = renderToString(
      createElement(InfoPanelRegion, {
        data: {
          linkSections: config.infoPanelLinkSections,
          topPosts: config.buildTimeMetadata,
          blogRoll: config.blogRollEntries,
          rssFeedUrl: "/feed.xml",
          opmlUrl: "/blogroll.opml",
          postLinkPrefix: "/post/",
          buildTimeFeeds: config.buildTimeFeeds,
        },
        strategies: config.strategies,
        useScrollIndicator: config.useScrollIndicator,
        aboutContent: aboutPanel,
      }),
    );
    document.body.innerHTML = `
      <div id="nav">${navHtml}</div>
      <div class="page">
        <header></header>
        <div id="app">${appHtml}</div>
        <aside id="info-panel" class="sidebar">${panelHtml}</aside>
        <button id="panel-toggle"></button>
      </div>
    `;

    // Capture the prerendered #app wrapper before createBlogApp runs.
    const appNode = document.getElementById("app")!.firstElementChild; // type-safety-ok: test DOM node mounted in beforeEach
    expect(appNode).not.toBeNull();
    expect(appNode!.tagName).toBe("DIV"); // type-safety-ok: appNode asserted non-null above

    handle = createBlogApp(config);
    await settle();

    // REUSED, not torn down — the deep /about entry hydrated the prerendered body
    // in place (no abandoned hydration, no CLS). The About content survives.
    expect(document.getElementById("app")!.firstElementChild).toBe(appNode); // type-safety-ok: test DOM node mounted in beforeEach
    expect(document.querySelector('[data-test="about-body"]')).not.toBeNull();
  });

  // Case 4b — infoPanelContentForPath: navigating to /about routes the override
  // panel HTML through InfoPanelRegion (aboutContent); navigating back to / shows
  // the standard blogroll panel again. Starts at / so the scaffold's standard
  // panel matches the initial hydrate (scaffoldDom has no aboutContent path).
  it("routes infoPanelContentForPath through the info panel on /about and restores the standard panel on /", async () => {
    history.pushState({}, "", "/");
    const config = makeConfig({
      buildTimeMetadata: [PUBLISHED_POST],
      buildTimeContent: PUBLISHED_CONTENT,
      blogRollEntries: BLOGROLL,
      strategies: new Map([["test-blog", { fetchLatestPost: () => Promise.resolve(LATEST) }]]),
      infoPanelContentForPath: (p) =>
        p === "/about"
          ? createElement("section", { className: "profile-card" }, "ABOUT PANEL")
          : undefined,
    });
    config.extraRoutes = [
      { path: "/about", render: () => createElement("div", { "data-test": "about" }, "ABOUT") },
    ];
    scaffoldDom(config, "/");

    handle = createBlogApp(config);
    const app = document.getElementById("app")!;
    const panel = document.getElementById("info-panel")!; // type-safety-ok: test DOM node mounted in beforeEach
    await settle();

    // Standard panel is present on / (blogroll markup), no about override.
    expect(panel.querySelector("li[data-blogroll-id]")).not.toBeNull();
    expect(panel.innerHTML).not.toContain("ABOUT PANEL");

    await navigate("/about");
    await vi.waitFor(() => {
      expect(app.innerHTML).toContain('data-test="about"');
      expect(panel.innerHTML).toContain("ABOUT PANEL");
      // The about override replaces the standard blogroll panel.
      expect(panel.querySelector("li[data-blogroll-id]")).toBeNull();
    });

    await navigate("/");
    await vi.waitFor(() => {
      expect(app.querySelector("#posts")).not.toBeNull();
      // Standard blogroll panel restored; the about override is gone.
      expect(panel.querySelector("li[data-blogroll-id]")).not.toBeNull();
      expect(panel.innerHTML).not.toContain("ABOUT PANEL");
    });
  });

  // Case 5a — useScrollIndicator: false → initScrollIndicator NOT called.
  it("does not call initScrollIndicator when useScrollIndicator is false", async () => {
    history.pushState({}, "", "/");
    const config = makeConfig({
      blogRollEntries: BLOGROLL,
      strategies: new Map([["test-blog", { fetchLatestPost: () => Promise.resolve(LATEST) }]]),
      useScrollIndicator: false,
    });
    scaffoldDom(config, "/");

    handle = createBlogApp(config);
    const panel = document.getElementById("info-panel")!; // type-safety-ok: test DOM node mounted in beforeEach

    await vi.waitFor(() => {
      expect(panel.querySelector("#blogroll-latest-test-blog")?.textContent).toBe("Latest Article");
    });
    expect(initScrollIndicator).not.toHaveBeenCalled();
  });

  // Case 5b — useScrollIndicator: true → initScrollIndicator IS called.
  it("calls initScrollIndicator when useScrollIndicator is true", async () => {
    history.pushState({}, "", "/");
    const config = makeConfig({
      blogRollEntries: BLOGROLL,
      strategies: new Map([["test-blog", { fetchLatestPost: () => Promise.resolve(LATEST) }]]),
      useScrollIndicator: true,
    });
    scaffoldDom(config, "/");

    handle = createBlogApp(config);
    await settle();

    expect(initScrollIndicator).toHaveBeenCalled();
  });

  // Case 6 — sign-in on home: getPosts IS called with the signed-in user, and
  // the firestore (draft-inclusive) posts replace the prerendered markup.
  it("reloads posts on home after sign-in so admin drafts replace prerendered published markup", async () => {
    history.pushState({}, "", "/");
    const config = makeConfig({ buildTimeMetadata: [PUBLISHED_POST], buildTimeContent: PUBLISHED_CONTENT });

    let authCallback: ((user: { uid: string } | null) => void) | undefined;
    config.firebase.onAuthStateChanged = vi.fn((cb) => {
      authCallback = cb;
      return Promise.resolve();
    });

    const draftPost: PostMeta = {
      id: "draft-post",
      title: "Draft Post Title",
      published: false,
      publishedAt: null,
      filename: "draft-post.md",
    };
    (getPosts as ReturnType<typeof vi.fn>).mockResolvedValue({ posts: [draftPost], skippedCount: 0 }); // type-safety-ok: vitest mock cast

    scaffoldDom(config, "/");
    handle = createBlogApp(config);
    const app = document.getElementById("app")!;

    await vi.waitFor(() => {
      expect(app.querySelector("#post-first-post")).not.toBeNull();
    });
    await settle();
    expect(getPosts).not.toHaveBeenCalled(); // signed out

    // Sign in — fire the captured auth callback with a user.
    const signedInUser = { uid: "admin-uid" };
    await act(async () => {
      authCallback!(signedInUser as never); // type-safety-ok: captured auth callback + test user fixture
      await Promise.resolve();
      await new Promise((r) => setTimeout(r, 0));
    });

    // getPosts called with the signed-in user; draft post now in the feed.
    expect(getPosts).toHaveBeenCalledWith(expect.anything(), expect.anything(), signedInUser);
    await vi.waitFor(() => {
      expect(app.querySelector("#post-draft-post")).not.toBeNull();
    });
  });

  // Case 7 — #1409: across / → /post/x → / the home feed stays rendered AND the
  // #posts node is never torn down. In the React model, reconciliation keeps the
  // same HomeRegion mounted (#posts always rendered) across these navigations, so
  // the node reference is stable — proving the repeat-home navigation does not
  // rebuild/replace the feed (the regression #1409 guarded against). We capture
  // #posts after settle() (the current, hydrated node) and assert the SAME
  // reference survives both navigations.
  it("keeps the same #posts node across Post and repeat-Home navigations (#1409)", async () => {
    history.pushState({}, "", "/");
    const config = makeConfig({ buildTimeMetadata: [PUBLISHED_POST], buildTimeContent: PUBLISHED_CONTENT });
    scaffoldDom(config, "/");

    handle = createBlogApp(config);
    const app = document.getElementById("app")!; // type-safety-ok: test DOM node mounted in beforeEach
    await settle();

    const postsNode = app.querySelector("#posts");
    expect(postsNode).not.toBeNull();

    await navigate("/post/first-post");
    expect(app.querySelector("#posts")).toBe(postsNode);
    expect(app.querySelector("#post-first-post")).not.toBeNull();

    await navigate("/");
    // Repeat-home navigation reconciles the same node — no teardown (#1409).
    expect(app.querySelector("#posts")).toBe(postsNode);
    expect(app.querySelector("#post-first-post")).not.toBeNull();
  });

  // Case 8 — #1715: onAuthStateChanged unsubscribe (returned as Promise<() => void>)
  // is called on destroy().
  it("calls the onAuthStateChanged unsubscribe returned as Promise<() => void> on destroy() (#1715)", async () => {
    history.pushState({}, "", "/");
    const config = makeConfig();
    const unsubscribeSpy = vi.fn();
    config.firebase.onAuthStateChanged = vi.fn(() => Promise.resolve(unsubscribeSpy));
    scaffoldDom(config, "/");

    handle = createBlogApp(config);

    // Macrotask: all pending .then(captureUnsub) callbacks run first → authUnsub stored.
    await new Promise((r) => setTimeout(r, 0));

    handle.destroy();
    handle = undefined;

    expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
  });

  // Case 9 — #1715: destroy-before-resolve race: destroy() runs before the
  // Promise resolves; captureUnsub must call unsub() immediately on late resolution.
  it("calls the onAuthStateChanged unsubscribe even when destroy() runs before the Promise resolves (#1715)", async () => {
    history.pushState({}, "", "/");
    const config = makeConfig();
    const unsubscribeSpy = vi.fn();
    let resolveUnsub!: (unsub: () => void) => void;
    config.firebase.onAuthStateChanged = vi.fn(
      () => new Promise<() => void>((resolve) => (resolveUnsub = resolve)),
    );
    scaffoldDom(config, "/");

    handle = createBlogApp(config);

    handle.destroy(); // sets authDestroyed; authUnsub still undefined
    handle = undefined;

    resolveUnsub(unsubscribeSpy); // late resolution → captureUnsub calls it immediately
    await new Promise((r) => setTimeout(r, 0));

    expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
  });

  // Case 10 — #1715: synchronous-function case: onAuthStateChanged returns the
  // unsubscribe directly (not a promise).
  it("calls the onAuthStateChanged unsubscribe returned synchronously on destroy() (#1715)", () => {
    history.pushState({}, "", "/");
    const config = makeConfig();
    const unsubscribeSpy = vi.fn();
    config.firebase.onAuthStateChanged = vi.fn(() => unsubscribeSpy);
    scaffoldDom(config, "/");

    handle = createBlogApp(config);
    handle.destroy();
    handle = undefined;

    expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
  });

  // Case A — router.destroy() via handle.destroy() removes the popstate listener.
  // After destroy, a popstate fires no dispatch — trackPageView (which runs
  // unconditionally at the top of every dispatch) is not called. Drop
  // teardowns.push(() => router.destroy()) and this fails.
  it("router popstate listener removed by destroy() (no dispatch after teardown)", async () => {
    history.pushState({}, "", "/");
    const config = makeConfig({ buildTimeMetadata: [PUBLISHED_POST], buildTimeContent: PUBLISHED_CONTENT });
    scaffoldDom(config, "/");

    handle = createBlogApp(config);
    await settle();

    handle.destroy();
    handle = undefined;

    const trackPageView = config.firebase.trackPageView as ReturnType<typeof vi.fn>; // type-safety-ok: vitest mock cast
    trackPageView.mockClear();

    history.pushState({}, "", "/post/first-post");
    window.dispatchEvent(new PopStateEvent("popstate"));
    await new Promise((r) => setTimeout(r, 0));

    // No dispatch ran — the router's popstate listener was torn down.
    expect(trackPageView).not.toHaveBeenCalled();
  });

  // Case B — headerObserver.disconnect() called by destroy().
  it("headerObserver.disconnect() called by destroy()", () => {
    const disconnectSpy = vi.spyOn(ResizeObserverStub.prototype, "disconnect");
    const config = makeConfig();
    scaffoldDom(config, "/");

    handle = createBlogApp(config);
    handle.destroy();
    handle = undefined;

    expect(disconnectSpy).toHaveBeenCalledTimes(1);
    disconnectSpy.mockRestore();
  });

  // Case C — same-uid guard: firing the auth callback twice with the same uid
  // calls getPosts once (sign-in triggers refreshAfterAuthChange → loadPosts).
  it("same-UID guard: onAuthStateChanged twice with same UID calls getPosts once", async () => {
    history.pushState({}, "", "/");
    const config = makeConfig({ buildTimeMetadata: [PUBLISHED_POST], buildTimeContent: PUBLISHED_CONTENT });

    let authCallback: ((user: { uid: string } | null) => void) | undefined;
    config.firebase.onAuthStateChanged = vi.fn((cb) => {
      authCallback = cb;
      return Promise.resolve();
    });
    scaffoldDom(config, "/");

    handle = createBlogApp(config);
    await settle();
    (getPosts as ReturnType<typeof vi.fn>).mockClear();

    // First fire — new uid → refreshAfterAuthChange → getPosts once.
    await act(async () => {
      authCallback!({ uid: "u1" } as never); // type-safety-ok: captured auth callback + test user fixture
      await Promise.resolve();
      await new Promise((r) => setTimeout(r, 0));
    });
    await vi.waitFor(() => expect(getPosts).toHaveBeenCalledTimes(1));

    // Second fire — same uid → guard early-returns → no second getPosts.
    await act(async () => {
      authCallback!({ uid: "u1" } as never); // type-safety-ok: captured auth callback + test user fixture
      await Promise.resolve();
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(getPosts).toHaveBeenCalledTimes(1);
  });

  // /admin sign-in: exactly one getPosts call (no redundant re-fetch after router.navigate).
  it("sign-in on /admin calls getPosts exactly once", async () => {
    history.pushState({}, "", "/admin");
    const config = makeConfig({ buildTimeMetadata: [PUBLISHED_POST], buildTimeContent: PUBLISHED_CONTENT });

    let authCallback: ((user: { uid: string } | null) => void) | undefined;
    config.firebase.onAuthStateChanged = vi.fn((cb) => {
      authCallback = cb;
      return Promise.resolve();
    });
    scaffoldDom(config, "/admin");

    handle = createBlogApp(config);
    await settle();
    (getPosts as ReturnType<typeof vi.fn>).mockClear(); // type-safety-ok: vitest mock cast

    // Fire sign-in with a new uid → refreshAfterAuthChange → loadPosts once.
    await act(async () => {
      authCallback!({ uid: "u2" } as never); // type-safety-ok: captured auth callback + test user fixture
      await Promise.resolve();
      await new Promise((r) => setTimeout(r, 0));
    });
    await vi.waitFor(() => expect(getPosts).toHaveBeenCalledTimes(1));
  });

  // Nav island — #sign-in click invokes firebase.signIn (signed-out /admin).
  it("renders the React nav and wires #sign-in to firebase.signIn on /admin", async () => {
    history.pushState({}, "", "/admin");
    const signIn = vi.fn(() => Promise.resolve());
    const config = makeConfig({ navLinks: [{ href: "/", label: "Home" }] });
    config.firebase.signIn = signIn;
    scaffoldDom(config, "/admin");

    handle = createBlogApp(config);
    const nav = document.getElementById("nav")!;

    // settle() flushes the async client-render so the live #sign-in carries
    // React's delegated click handler (the prerendered markup alone does not).
    await settle();
    await vi.waitFor(() => {
      expect(nav.querySelector(".cs-nav")).not.toBeNull();
      expect(nav.querySelector('a[href="/"]')).not.toBeNull();
      expect(nav.querySelector("#sign-in")).not.toBeNull();
    });

    nav.querySelector<HTMLElement>("#sign-in")!.click();
    expect(signIn).toHaveBeenCalledTimes(1);
  });

  // Nav island — #sign-out click invokes firebase.signOut for a signed-in admin.
  it("wires #sign-out to firebase.signOut once a user is signed in on /admin", async () => {
    history.pushState({}, "", "/admin");
    const signOut = vi.fn(() => Promise.resolve());
    let authCallback: ((user: { uid: string } | null) => void) | undefined;
    const config = makeConfig();
    config.firebase.signOut = signOut;
    config.firebase.onAuthStateChanged = vi.fn((cb) => {
      authCallback = cb;
      return Promise.resolve();
    });
    scaffoldDom(config, "/admin");

    handle = createBlogApp(config);
    const nav = document.getElementById("nav")!;
    await settle();
    await vi.waitFor(() => expect(nav.querySelector("#sign-in")).not.toBeNull());

    // Sign in — nav re-renders with the user (#sign-out replaces #sign-in).
    await act(async () => {
      authCallback!({ uid: "admin-uid" } as never); // type-safety-ok: captured auth callback + test user fixture
      await Promise.resolve();
      await new Promise((r) => setTimeout(r, 0));
    });
    await vi.waitFor(() => {
      expect(nav.querySelector("#sign-out")).not.toBeNull();
      expect(nav.querySelector("#sign-in")).toBeNull();
    });

    nav.querySelector<HTMLElement>("#sign-out")!.click();
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
