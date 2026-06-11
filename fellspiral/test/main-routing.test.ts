import { describe, it, expect, vi, beforeEach } from "vitest";

// Issue #1285 — fellspiral routing regression.
//
// A direct load of /admin serves the prerendered home index.html (so the
// prerendered #posts is in the DOM), but the router renders the admin route,
// replacing #posts with admin markup. The home route's render must then rebuild
// home content on a later Home navigation — checked against the *live* DOM
// (app.querySelector("#posts")), not a one-shot flag. The pre-fix one-shot flag
// returned null on that Home navigation, leaving stale admin DOM on "/".
//
// This is a full-main.ts integration test: it imports ../src/main for its side
// effects (main.ts constructs the router at module load) under the REAL router
// and mocked heavy dependencies. The real router's render -> null preservation
// is the behavior under test, so @commons-systems/router is NOT mocked.

// vi.hoisted so these spies exist before the hoisted vi.mock factories run.
const { renderHomeHtml, renderAdmin } = vi.hoisted(() => ({
  renderHomeHtml: vi.fn(() => '<div id="posts" data-test="home">HOME</div>'),
  renderAdmin: vi.fn(() => '<div data-test="admin">ADMIN</div>'),
}));

// REAL router — render -> null DOM preservation is the behavior under test.
// onAuthStateChanged returns a thenable (main.ts calls .catch on it) and must
// NOT invoke its callback, so currentUser stays null.
vi.mock("../src/firebase.js", () => ({
  db: { type: "mock-firestore" },
  NAMESPACE: "fellspiral/test",
  trackPageView: vi.fn(),
  initAppCheck: vi.fn(() => Promise.resolve()),
  getAppCheckHeaders: vi.fn(async () => ({})),
  signIn: vi.fn(() => Promise.resolve()),
  signOut: vi.fn(() => Promise.resolve()),
  onAuthStateChanged: vi.fn(() => Promise.resolve()),
}));
vi.mock("@commons-systems/blog/pages/home", () => ({
  renderHomeHtml,
  hydrateHome: vi.fn(),
}));
vi.mock("@commons-systems/blog/pages/admin", () => ({ renderAdmin }));
vi.mock("@commons-systems/authutil/groups", () => ({
  isInGroup: vi.fn(() => Promise.resolve(false)),
  ADMIN_GROUP_ID: "admin-group",
}));
// Virtual build-time data modules.
vi.mock("virtual:blog-post-content", () => ({ default: {} }));
vi.mock("virtual:blog-post-metadata", () => ({ default: [] }));
vi.mock("virtual:blog-roll-feeds", () => ({ default: {} }));
// Module-scope side-effectful imports — no-op so import("../src/main")
// completes under happy-dom.
vi.mock("@commons-systems/blog/components/info-panel", () => ({
  renderInfoPanel: vi.fn(() => ""),
  hydrateInfoPanel: vi.fn(),
}));
vi.mock("@commons-systems/blog/og-meta", () => ({ updateOgMeta: vi.fn() }));
vi.mock("@commons-systems/blog/canonical", () => ({ updateCanonical: vi.fn() }));
vi.mock("@commons-systems/blog/github", () => ({
  createFetchPost: vi.fn(() => vi.fn()),
}));
vi.mock("@commons-systems/blog/firestore", () => ({
  getPosts: vi.fn(() => Promise.resolve({ posts: [], skippedCount: 0 })),
}));
vi.mock("@commons-systems/components/panel-toggle", () => ({
  initPanelToggle: vi.fn(),
}));
vi.mock("@commons-systems/components/scroll-indicator", () => ({
  initScrollIndicator: vi.fn(() => () => {}),
}));
vi.mock("@commons-systems/components/nav", () => ({}));
vi.mock("@commons-systems/firebaseutil/defer-appcheck", () => ({
  deferAppCheckInit: vi.fn(),
}));
vi.mock("../src/blog-roll/config.js", () => ({
  createStrategies: vi.fn(() => new Map()),
  BLOG_ROLL_ENTRIES: [],
}));

// happy-dom lacks ResizeObserver; main.ts constructs one at module init.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

function scaffoldDom(): void {
  document.body.innerHTML = `
    <div id="nav"></div>
    <div class="page">
      <header></header>
      <div class="content-grid">
        <div id="app"><div id="posts" data-prerendered="true">PRERENDERED HOME</div></div>
        <aside id="info-panel"></aside>
        <button id="panel-toggle"></button>
      </div>
    </div>
  `;
}

describe("fellspiral main routing (#1285)", () => {
  beforeEach(() => {
    vi.resetModules();
    renderHomeHtml.mockClear();
    renderAdmin.mockClear();
    globalThis.ResizeObserver =
      ResizeObserverStub as unknown as typeof ResizeObserver;
  });

  it("rebuilds home content after a direct /admin entry, not leaving stale admin DOM", async () => {
    // 1. Resolve /admin as the entry route before main constructs the router.
    history.pushState({}, "", "/admin");
    scaffoldDom();

    // 2. Run the entry fresh.
    await import("../src/main");

    const app = document.getElementById("app")!;

    // 3. The admin route replaced the prerendered home #posts with admin markup.
    await vi.waitFor(() => {
      expect(app.innerHTML).toContain('data-test="admin"');
      expect(app.querySelector("#posts")).toBeNull();
    });

    // 4. Navigate Home through the real router's popstate listener.
    history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));

    // 5. Home content must render — #posts is back and admin markup is gone.
    //    Pre-fix this failed: the one-shot flag returned null, so the admin DOM
    //    persisted on "/".
    await vi.waitFor(() => {
      expect(app.querySelector("#posts")).not.toBeNull();
      expect(app.innerHTML).toContain('data-test="home"');
      expect(app.innerHTML).not.toContain('data-test="admin"');
    });
  });

  it("preserves the prerendered home DOM on a direct / entry (skips teardown)", async () => {
    // Direct home entry: the prerendered #posts is live, so the home render
    // returns null and renderHomeHtml is never called — the optimization the
    // live-DOM check preserves.
    history.pushState({}, "", "/");
    scaffoldDom();

    await import("../src/main");

    const app = document.getElementById("app")!;

    // Give the router's initial async navigation a chance to run.
    await vi.waitFor(() => {
      expect(app.querySelector("#posts")).not.toBeNull();
    });
    await new Promise((r) => setTimeout(r, 0));

    // The prerendered markup is preserved in place; renderHomeHtml was not
    // called to rebuild it.
    expect(renderHomeHtml).not.toHaveBeenCalled();
    expect(app.querySelector("[data-prerendered]")).not.toBeNull();
  });
});
