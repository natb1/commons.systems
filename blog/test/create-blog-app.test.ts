import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createBlogApp } from "../src/create-blog-app.ts";
import type { CreateBlogAppConfig } from "../src/create-blog-app.ts";
import { getPosts } from "../src/firestore.ts";

// Issue #1285 — shared SPA bootstrap routing regression and info-panel AC tests.
//
// createBlogApp(config) is called directly as a function — no module-import
// side effects to manage. The REAL @commons-systems/router is under test
// (render→null preservation is the behavior we verify). All heavy blog deps
// are mocked by relative path to match create-blog-app.ts's own imports.

// vi.hoisted so these spies exist before the hoisted vi.mock factories run.
const { renderHomeHtml, renderInfoPanel, hydrateInfoPanel, initScrollIndicator } = vi.hoisted(
  () => ({
    renderHomeHtml: vi.fn(() => '<div id="posts" data-test="home">HOME</div>'),
    renderInfoPanel: vi.fn(() => "<div>INFO PANEL</div>"),
    hydrateInfoPanel: vi.fn(),
    initScrollIndicator: vi.fn(() => vi.fn()),
  }),
);

// Relative mocks matching create-blog-app.ts's relative imports.
vi.mock("../src/pages/home.ts", () => ({
  renderHomeHtml,
  hydrateHome: vi.fn(),
}));
vi.mock("../src/pages/admin.ts", () => ({
  renderAdmin: vi.fn(() => '<div data-test="admin">ADMIN</div>'),
}));
vi.mock("../src/components/info-panel.ts", () => ({
  renderInfoPanel,
  hydrateInfoPanel,
}));
vi.mock("../src/og-meta.ts", () => ({ updateOgMeta: vi.fn() }));
vi.mock("../src/canonical.ts", () => ({ updateCanonical: vi.fn() }));
vi.mock("../src/github.ts", () => ({
  createFetchPost: vi.fn(() => vi.fn()),
}));
vi.mock("../src/firestore.ts", () => ({
  getPosts: vi.fn(() => Promise.resolve({ posts: [], skippedCount: 0 })),
}));

// Alias mocks for third-party packages.
vi.mock("@commons-systems/authutil/groups", () => ({
  isInGroup: vi.fn(() => Promise.resolve(false)),
}));
vi.mock("@commons-systems/components/panel-toggle", () => ({
  initPanelToggle: vi.fn(),
}));
vi.mock("@commons-systems/components/scroll-indicator", () => ({
  initScrollIndicator,
}));
// Side-effect import — no runtime exports needed.
vi.mock("@commons-systems/components/nav", () => ({}));
vi.mock("@commons-systems/firebaseutil/defer-appcheck", () => ({
  deferAppCheckInit: vi.fn(),
}));

// happy-dom lacks ResizeObserver.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

/** Build a minimal valid config. `onAuthStateChanged` returns a resolved
 *  Promise WITHOUT invoking its callback, so currentUser stays null. */
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

/** Scaffold a DOM with a prerendered #posts in #app. */
function scaffoldDom({ populatedInfoPanel = false }: { populatedInfoPanel?: boolean } = {}): void {
  const infoPanelContent = populatedInfoPanel
    ? '<nav aria-label="Info panel links"><ul><li>Link</li></ul></nav>'
    : "";
  document.body.innerHTML = `
    <div id="nav"></div>
    <div class="page">
      <header></header>
      <div id="app"><div id="posts" data-prerendered="true">PRERENDERED HOME</div></div>
      <aside id="info-panel">${infoPanelContent}</aside>
      <button id="panel-toggle"></button>
    </div>
  `;
}

let handle: ReturnType<typeof createBlogApp> | undefined;

describe("createBlogApp routing and panel behavior", () => {
  beforeEach(() => {
    handle = undefined;
    renderHomeHtml.mockClear();
    renderInfoPanel.mockClear();
    hydrateInfoPanel.mockClear();
    initScrollIndicator.mockClear();
    globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    handle?.destroy();
    handle = undefined;
    history.pushState({}, "", "/");
    vi.clearAllMocks();
  });

  // Case 1 — #1285 regression: direct /admin entry, then Home rebuilds #posts.
  it("rebuilds home content after a direct /admin entry (#1285)", async () => {
    history.pushState({}, "", "/admin");
    // Scaffold without prerendered #posts — simulate an /admin direct entry
    // where the admin route will replace the initial DOM.
    document.body.innerHTML = `
      <div id="nav"></div>
      <div class="page">
        <header></header>
        <div id="app"><div id="posts" data-prerendered="true">PRERENDERED HOME</div></div>
        <aside id="info-panel"></aside>
        <button id="panel-toggle"></button>
      </div>
    `;

    handle = createBlogApp(makeConfig());
    const app = document.getElementById("app")!;

    // Admin route renders — prerendered #posts is replaced by admin markup.
    await vi.waitFor(() => {
      expect(app.innerHTML).toContain('data-test="admin"');
      expect(app.querySelector("#posts")).toBeNull();
    });

    // Navigate home via the real router's popstate listener.
    history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));

    // Home content must rebuild — the live-DOM check sees no #posts, so
    // loadPosts() is called and renderHomeHtml returns the home markup.
    // Pre-fix: the one-shot flag returned null, leaving stale admin DOM.
    await vi.waitFor(() => {
      expect(app.querySelector("#posts")).not.toBeNull();
      expect(app.innerHTML).toContain('data-test="home"');
      expect(app.innerHTML).not.toContain('data-test="admin"');
    });
  });

  // Case 2 — Direct / preserves prerendered home #posts (render returns null).
  it("preserves prerendered home DOM on direct / entry — renderHomeHtml not called", async () => {
    history.pushState({}, "", "/");
    scaffoldDom();

    handle = createBlogApp(makeConfig());
    const app = document.getElementById("app")!;

    // Wait for the router's initial navigation to settle.
    await vi.waitFor(() => {
      expect(app.querySelector("#posts")).not.toBeNull();
    });
    // Let any remaining microtasks drain.
    await new Promise((r) => setTimeout(r, 0));

    // The home render returns null (prerendered #posts is live in the DOM),
    // so renderHomeHtml was never called and the prerendered markup is intact.
    expect(renderHomeHtml).not.toHaveBeenCalled();
    expect(app.querySelector("[data-prerendered]")).not.toBeNull();
  });

  // Case 3 — AC#2 panel preservation + self-limiting (consumable marker).
  it("preserves prerendered info-panel once, then re-renders on second data change", async () => {
    history.pushState({}, "", "/");
    // Populate #info-panel so createBlogApp sets the consumable marker.
    scaffoldDom({ populatedInfoPanel: true });

    // Navigate to /admin first so the home route render() sees no #posts,
    // which forces loadPosts() to run and reach afterRender→updateInfoPanel.
    history.pushState({}, "", "/admin");
    window.dispatchEvent(new PopStateEvent("popstate"));

    handle = createBlogApp(makeConfig());

    // Go back to home so afterRender→updateInfoPanel runs for the first time.
    history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));

    const app = document.getElementById("app")!;

    // First home render: guard passes (buildTimeMetadata [] ≠ undefined), but
    // the consumable marker is present → renderInfoPanel NOT called; marker consumed.
    await vi.waitFor(() => {
      expect(app.querySelector("#posts")).not.toBeNull();
    });
    await new Promise((r) => setTimeout(r, 0));

    const callsAfterFirst = renderInfoPanel.mock.calls.length;
    expect(callsAfterFirst).toBe(0);
    // hydrateInfoPanel still runs (always called in updateInfoPanel).
    expect(hydrateInfoPanel).toHaveBeenCalled();

    // Force a second data change: clear lastRenderedPosts so the guard passes again.
    handle!.forceInfoPanelRefresh();

    // Navigate away and back to trigger a second afterRender→updateInfoPanel.
    history.pushState({}, "", "/admin");
    window.dispatchEvent(new PopStateEvent("popstate"));
    await vi.waitFor(() => {
      expect(app.innerHTML).toContain('data-test="admin"');
    });

    history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));

    await vi.waitFor(() => {
      expect(app.querySelector("#posts")).not.toBeNull();
    });
    await new Promise((r) => setTimeout(r, 0));

    // Second data change: marker already consumed → renderInfoPanel IS called.
    expect(renderInfoPanel.mock.calls.length).toBeGreaterThan(callsAfterFirst);
  });

  // Case 4 — extraRoutes composition.
  it("renders extraRoutes and navigates back to home", async () => {
    history.pushState({}, "", "/");
    document.body.innerHTML = `
      <div id="nav"></div>
      <div class="page">
        <header></header>
        <div id="app"></div>
        <aside id="info-panel"></aside>
        <button id="panel-toggle"></button>
      </div>
    `;

    const aboutAfterRender = vi.fn();
    handle = createBlogApp(
      makeConfig({
        extraRoutes: [
          {
            path: "/about",
            render: () => '<div data-test="about">ABOUT</div>',
            afterRender: aboutAfterRender,
          },
        ],
      }),
    );

    const app = document.getElementById("app")!;

    // Navigate to /about via the real router.
    history.pushState({}, "", "/about");
    window.dispatchEvent(new PopStateEvent("popstate"));

    await vi.waitFor(() => {
      expect(app.innerHTML).toContain('data-test="about"');
    });
    expect(aboutAfterRender).toHaveBeenCalled();
    expect(app.innerHTML).not.toContain('data-test="home"');

    // Navigate back to home.
    history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));

    await vi.waitFor(() => {
      expect(app.querySelector("#posts")).not.toBeNull();
      expect(app.innerHTML).toContain('data-test="home"');
    });
    expect(app.innerHTML).not.toContain('data-test="about"');
  });

  // Case 5a — useScrollIndicator: false → initScrollIndicator NOT called.
  it("does not call initScrollIndicator when useScrollIndicator is false", async () => {
    // Navigate to /admin first so home route renders from loadPosts (not prerendered).
    history.pushState({}, "", "/admin");
    document.body.innerHTML = `
      <div id="nav"></div>
      <div class="page">
        <header></header>
        <div id="app"></div>
        <aside id="info-panel"></aside>
        <button id="panel-toggle"></button>
      </div>
    `;

    handle = createBlogApp(makeConfig({ useScrollIndicator: false }));

    // Navigate home so afterRender→updateInfoPanel runs.
    history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));

    const app = document.getElementById("app")!;
    await vi.waitFor(() => {
      expect(app.querySelector("#posts")).not.toBeNull();
    });
    await new Promise((r) => setTimeout(r, 0));

    // hydrateInfoPanel ran (updateInfoPanel ran), but scroll indicator was not set up.
    expect(hydrateInfoPanel).toHaveBeenCalled();
    expect(initScrollIndicator).not.toHaveBeenCalled();
  });

  // Case 5b — useScrollIndicator: true → initScrollIndicator IS called.
  it("calls initScrollIndicator when useScrollIndicator is true and panel updates", async () => {
    // Navigate to /admin first so home route renders from loadPosts (not prerendered).
    history.pushState({}, "", "/admin");
    document.body.innerHTML = `
      <div id="nav"></div>
      <div class="page">
        <header></header>
        <div id="app"></div>
        <aside id="info-panel"></aside>
        <button id="panel-toggle"></button>
      </div>
    `;

    handle = createBlogApp(makeConfig({ useScrollIndicator: true }));

    // Navigate home so afterRender→updateInfoPanel runs.
    history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));

    const app = document.getElementById("app")!;
    await vi.waitFor(() => {
      expect(app.querySelector("#posts")).not.toBeNull();
    });
    await new Promise((r) => setTimeout(r, 0));

    // updateInfoPanel ran AND useScrollIndicator is true → initScrollIndicator called.
    expect(hydrateInfoPanel).toHaveBeenCalled();
    expect(initScrollIndicator).toHaveBeenCalled();
  });

  // Case 6 — sign-in on home bypasses prerendered-DOM guard so admin drafts load.
  it("reloads posts on home after sign-in so admin drafts replace prerendered published markup", async () => {
    history.pushState({}, "", "/");
    scaffoldDom();

    // Configure getPosts to return a recognizable draft post for the signed-in user.
    const draftPost = { id: "draft-post", title: "Draft Post Title", published: false };
    (getPosts as ReturnType<typeof vi.fn>).mockResolvedValue({
      posts: [draftPost],
      skippedCount: 0,
    });
    // renderHomeHtml spy already returns '<div id="posts" data-test="home">HOME</div>';
    // use a distinguishable value to confirm it ran after sign-in.
    renderHomeHtml.mockReturnValue('<div id="posts" data-test="home">DRAFT HOME</div>');

    // Capture the auth callback instead of dropping it.
    let authCallback: ((user: { uid: string } | null) => void) | undefined;
    const config = makeConfig({
      firebase: {
        db: { type: "mock-firestore" } as never,
        namespace: "test/env" as never,
        trackPageView: vi.fn(),
        initAppCheck: vi.fn(() => Promise.resolve()),
        signIn: vi.fn(() => Promise.resolve()),
        signOut: vi.fn(() => Promise.resolve()),
        onAuthStateChanged: vi.fn((cb) => {
          authCallback = cb;
          return Promise.resolve();
        }),
      },
    });

    handle = createBlogApp(config);
    const app = document.getElementById("app")!;

    // Wait for initial route to settle with prerendered #posts intact (signed out).
    await vi.waitFor(() => {
      expect(app.querySelector("#posts")).not.toBeNull();
    });
    await new Promise((r) => setTimeout(r, 0));

    // Signed out: prerendered DOM preserved, loadPosts/renderHomeHtml not called.
    const callsBeforeSignIn = renderHomeHtml.mock.calls.length;
    expect(callsBeforeSignIn).toBe(0);

    // Sign in — fire the captured auth callback with a user object.
    const signedInUser = { uid: "admin-uid" };
    authCallback!(signedInUser as never);

    // After sign-in, refreshAfterAuthChange calls router.navigate(), which must
    // call loadPosts() even though #posts is still live, because currentUser !== null.
    await vi.waitFor(() => {
      expect(renderHomeHtml.mock.calls.length).toBeGreaterThan(callsBeforeSignIn);
    });

    // getPosts was called with the signed-in user — draft posts were fetched.
    expect(getPosts).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      signedInUser,
    );

    // The home DOM was rebuilt (not the prerendered markup, but the post-sign-in render).
    await vi.waitFor(() => {
      expect(app.querySelector("#posts")).not.toBeNull();
    });
  });

  // Case 8 — #1715: onAuthStateChanged unsubscribe is called on destroy().
  // Production-representative: createAppContext returns Promise<() => void>.
  it("calls the onAuthStateChanged unsubscribe returned as Promise<() => void> on destroy() (#1715)", async () => {
    history.pushState({}, "", "/");
    scaffoldDom();

    const unsubscribeSpy = vi.fn();
    const config = makeConfig({
      firebase: {
        db: { type: "mock-firestore" } as never,
        namespace: "test/env" as never,
        trackPageView: vi.fn(),
        initAppCheck: vi.fn(() => Promise.resolve()),
        signIn: vi.fn(() => Promise.resolve()),
        signOut: vi.fn(() => Promise.resolve()),
        // Production-representative: createAppContext wraps Firebase's
        // onAuthStateChanged and returns Promise<() => void>.
        onAuthStateChanged: vi.fn(() => Promise.resolve(unsubscribeSpy)),
      },
    });

    handle = createBlogApp(config);

    // Flush the microtask queue so .then(captureUnsub) stores authUnsub.
    await new Promise((r) => setTimeout(r, 0));

    handle.destroy();

    expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
  });

  // Case 9 — #1715: destroy-before-resolve race: destroy() runs before the
  // Promise resolves; captureUnsub must call unsub() immediately on late resolution.
  it("calls the onAuthStateChanged unsubscribe even when destroy() runs before the Promise resolves (#1715)", async () => {
    history.pushState({}, "", "/");
    scaffoldDom();

    const unsubscribeSpy = vi.fn();
    let resolveUnsub!: (unsub: () => void) => void;
    const controlledPromise = new Promise<() => void>((resolve) => {
      resolveUnsub = resolve;
    });

    const config = makeConfig({
      firebase: {
        db: { type: "mock-firestore" } as never,
        namespace: "test/env" as never,
        trackPageView: vi.fn(),
        initAppCheck: vi.fn(() => Promise.resolve()),
        signIn: vi.fn(() => Promise.resolve()),
        signOut: vi.fn(() => Promise.resolve()),
        onAuthStateChanged: vi.fn(() => controlledPromise),
      },
    });

    handle = createBlogApp(config);

    // destroy() before the promise resolves — sets authDestroyed, authUnsub is still undefined.
    handle.destroy();

    // Now resolve with the spy — captureUnsub sees authDestroyed and calls unsub() immediately.
    resolveUnsub(unsubscribeSpy);
    await new Promise((r) => setTimeout(r, 0));

    expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
  });

  // Case 10 — #1715: synchronous-function case: onAuthStateChanged returns
  // the unsubscribe directly (not a promise).
  it("calls the onAuthStateChanged unsubscribe returned synchronously on destroy() (#1715)", () => {
    history.pushState({}, "", "/");
    scaffoldDom();

    const unsubscribeSpy = vi.fn();
    const config = makeConfig({
      firebase: {
        db: { type: "mock-firestore" } as never,
        namespace: "test/env" as never,
        trackPageView: vi.fn(),
        initAppCheck: vi.fn(() => Promise.resolve()),
        signIn: vi.fn(() => Promise.resolve()),
        signOut: vi.fn(() => Promise.resolve()),
        onAuthStateChanged: vi.fn(() => unsubscribeSpy),
      },
    });

    handle = createBlogApp(config);
    handle.destroy();

    expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
  });

  // Case 7 — #1409: the live-DOM skip fires whenever #posts is live, not only
  // on the initial prerender. After a loadPosts() run renders a fresh #posts,
  // repeat navigations to "/" and "/post/..." both return null from render and
  // leave #posts untouched. Ported from the retired fellspiral per-app test
  // (#1667) — the behavior now lives in createBlogApp's home route.
  it("keeps skipping while #posts is live from loadPosts across Post and repeat-Home navigations (#1409)", async () => {
    // 1. Enter via /admin so the first Home nav finds no live #posts and runs
    //    loadPosts → renderHomeHtml. Mirror the #1285 /admin setup (no prerender).
    history.pushState({}, "", "/admin");
    document.body.innerHTML = `
      <div id="nav"></div>
      <div class="page">
        <header></header>
        <div id="app"><div id="posts" data-prerendered="true">PRERENDERED HOME</div></div>
        <aside id="info-panel"></aside>
        <button id="panel-toggle"></button>
      </div>
    `;

    handle = createBlogApp(makeConfig());
    const app = document.getElementById("app")!;

    // Admin route renders — the prerendered #posts is replaced by admin markup.
    await vi.waitFor(() => {
      expect(app.querySelector("#posts")).toBeNull();
    });

    // 2. Navigate Home via the real router's popstate listener. With no live
    //    #posts, the home render runs loadPosts → renderHomeHtml exactly once.
    history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
    await vi.waitFor(() => {
      expect(app.querySelector("#posts")).not.toBeNull();
      expect(app.innerHTML).toContain('data-test="home"');
    });
    expect(renderHomeHtml).toHaveBeenCalledTimes(1);

    // 3. Navigate to a post. The post route shares the home regex
    //    (/^\/(?:post\/.*)?$/); render returns null because #posts is live
    //    (the loadPosts-origin live-DOM skip — the new coverage).
    history.pushState({}, "", "/post/example");
    window.dispatchEvent(new PopStateEvent("popstate"));
    await new Promise((r) => setTimeout(r, 0));
    expect(app.querySelector("#posts")).not.toBeNull();
    expect(renderHomeHtml).toHaveBeenCalledTimes(1);

    // 4. Navigate Home again — also skips because #posts is still live. The
    //    skip is keyed on the live DOM, not a one-shot flag.
    history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
    await new Promise((r) => setTimeout(r, 0));
    expect(app.querySelector("#posts")).not.toBeNull();
    expect(renderHomeHtml).toHaveBeenCalledTimes(1);
  });
});
