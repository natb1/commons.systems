import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { parsePath, createHistoryRouter, type Route, type Router } from "../src/index";

describe("parsePath", () => {
  it("returns pathname and empty params with no query string", () => {
    const result = parsePath();
    expect(result.path).toBe("/");
    expect([...result.params]).toEqual([]);
  });
});

describe("createHistoryRouter", () => {
  let outlet: HTMLDivElement;
  let routes: [Route, ...Route[]];
  let router: Router;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    history.pushState({}, "", "/");
    outlet = document.createElement("div");
    routes = [
      { path: "/", render: () => "<h2>Home</h2>" },
      { path: "/about", render: () => "<h2>About</h2>" },
    ];
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    router?.destroy();
    consoleErrorSpy.mockRestore();
  });

  it("renders default route", async () => {
    router = createHistoryRouter(outlet, routes);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Home</h2>");
    });
  });

  it("navigates on popstate", async () => {
    router = createHistoryRouter(outlet, routes);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Home</h2>");
    });

    history.pushState({}, "", "/about");
    window.dispatchEvent(new PopStateEvent("popstate"));

    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>About</h2>");
    });
  });

  it("falls back to first route for unknown path", async () => {
    history.pushState({}, "", "/nonexistent");
    router = createHistoryRouter(outlet, routes);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Home</h2>");
    });
  });

  it("intercepts same-origin anchor clicks", async () => {
    router = createHistoryRouter(outlet, routes);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Home</h2>");
    });

    const anchor = document.createElement("a");
    anchor.setAttribute("href", "/about");
    document.body.appendChild(anchor);

    try {
      anchor.click();
      await vi.waitFor(() => {
        expect(outlet.innerHTML).toBe("<h2>About</h2>");
      });
      expect(location.pathname).toBe("/about");
    } finally {
      document.body.removeChild(anchor);
    }
  });

  it("does not intercept links with target=_blank", async () => {
    router = createHistoryRouter(outlet, routes);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Home</h2>");
    });

    const anchor = document.createElement("a");
    anchor.setAttribute("href", "/about");
    anchor.setAttribute("target", "_blank");
    document.body.appendChild(anchor);

    try {
      anchor.click();
      await new Promise((r) => setTimeout(r, 10));
      expect(outlet.innerHTML).toBe("<h2>Home</h2>");
    } finally {
      document.body.removeChild(anchor);
    }
  });

  it("does not intercept external links", async () => {
    router = createHistoryRouter(outlet, routes);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Home</h2>");
    });

    const anchor = document.createElement("a");
    anchor.setAttribute("href", "https://external.com/page");
    document.body.appendChild(anchor);

    try {
      anchor.click();
      await new Promise((r) => setTimeout(r, 10));
      expect(outlet.innerHTML).toBe("<h2>Home</h2>");
    } finally {
      document.body.removeChild(anchor);
    }
  });

  it("does not intercept hash-only links", async () => {
    router = createHistoryRouter(outlet, routes);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Home</h2>");
    });

    const anchor = document.createElement("a");
    anchor.setAttribute("href", "#section");
    document.body.appendChild(anchor);

    try {
      anchor.click();
      await new Promise((r) => setTimeout(r, 10));
      // Still on home since "#section" doesn't start with "/"
      expect(outlet.innerHTML).toBe("<h2>Home</h2>");
    } finally {
      document.body.removeChild(anchor);
    }
  });

  it("destroy() stops popstate listener", async () => {
    router = createHistoryRouter(outlet, routes);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Home</h2>");
    });

    router.destroy();

    history.pushState({}, "", "/about");
    window.dispatchEvent(new PopStateEvent("popstate"));
    await new Promise((r) => setTimeout(r, 10));

    expect(outlet.innerHTML).toBe("<h2>Home</h2>");
  });

  it("matches RegExp path", async () => {
    const regexpRoutes: [Route, ...Route[]] = [
      { path: "/", render: () => "<h2>Home</h2>" },
      { path: /^\/post\//, render: (path) => `<h2>Post: ${path}</h2>` },
    ];
    history.pushState({}, "", "/post/hello-world");
    router = createHistoryRouter(outlet, regexpRoutes);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Post: /post/hello-world</h2>");
    });
  });

  it("supports async render", async () => {
    const asyncRoutes: [Route, ...Route[]] = [
      { path: "/", render: () => Promise.resolve("<h2>Async Home</h2>") },
    ];
    router = createHistoryRouter(outlet, asyncRoutes);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Async Home</h2>");
    });
  });

  it("discards stale async render", async () => {
    let resolveFirst!: (value: string) => void;
    const slowRoutes: [Route, ...Route[]] = [
      {
        path: "/",
        render: () => new Promise((resolve) => { resolveFirst = resolve; }),
      },
      { path: "/about", render: () => "<h2>About</h2>" },
    ];
    router = createHistoryRouter(outlet, slowRoutes);

    history.pushState({}, "", "/about");
    window.dispatchEvent(new PopStateEvent("popstate"));

    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>About</h2>");
    });

    resolveFirst("<h2>Stale Home</h2>");
    await new Promise((r) => setTimeout(r, 10));
    expect(outlet.innerHTML).toBe("<h2>About</h2>");
  });

  it("shows generic error message when render throws", async () => {
    const errorRoutes: [Route, ...Route[]] = [
      { path: "/", render: () => { throw new Error("boom"); } },
    ];
    router = createHistoryRouter(outlet, errorRoutes);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<p>Something went wrong. Please try again.</p>");
    });
  });

  it("formatError returns custom message", async () => {
    const errorRoutes: [Route, ...Route[]] = [
      { path: "/", render: () => { throw new Error("boom"); } },
    ];
    router = createHistoryRouter(outlet, errorRoutes, {
      formatError: () => "Custom error",
    });
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<p>Custom error</p>");
    });
  });

  it("formatError returning undefined falls through", async () => {
    const errorRoutes: [Route, ...Route[]] = [
      { path: "/", render: () => { throw new Error("boom"); } },
    ];
    router = createHistoryRouter(outlet, errorRoutes, {
      formatError: () => undefined,
    });
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<p>Something went wrong. Please try again.</p>");
    });
  });

  it("strips query params for route matching", async () => {
    history.pushState({}, "", "/about?group=household");
    router = createHistoryRouter(outlet, routes);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>About</h2>");
    });
  });

  it("passes path to render function", async () => {
    const pathRoutes: [Route, ...Route[]] = [
      { path: /^\//, render: (path) => `<h2>Path: ${path}</h2>` },
    ];
    history.pushState({}, "", "/some/path");
    router = createHistoryRouter(outlet, pathRoutes);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Path: /some/path</h2>");
    });
  });

  it("passes path to afterRender", async () => {
    let receivedPath: string | undefined;
    const afterRoutes: [Route, ...Route[]] = [
      {
        path: "/",
        render: () => "<h2>Home</h2>",
        afterRender: (_outlet, path) => { receivedPath = path; },
      },
    ];
    router = createHistoryRouter(outlet, afterRoutes);
    await vi.waitFor(() => {
      expect(receivedPath).toBe("/");
    });
  });

  it("calls afterRender after innerHTML set", async () => {
    let sawContent = false;
    const afterRoutes: [Route, ...Route[]] = [
      {
        path: "/",
        render: () => "<h2>Home</h2>",
        afterRender: (el) => { sawContent = el.innerHTML === "<h2>Home</h2>"; },
      },
    ];
    router = createHistoryRouter(outlet, afterRoutes);
    await vi.waitFor(() => {
      expect(sawContent).toBe(true);
    });
  });

  it("does not call afterRender on stale navigation", async () => {
    let afterRenderCalled = false;
    let resolveFirst!: (value: string) => void;
    const staleRoutes: [Route, ...Route[]] = [
      {
        path: "/",
        render: () => new Promise((resolve) => { resolveFirst = resolve; }),
        afterRender: () => { afterRenderCalled = true; },
      },
      { path: "/about", render: () => "<h2>About</h2>" },
    ];
    router = createHistoryRouter(outlet, staleRoutes);

    history.pushState({}, "", "/about");
    window.dispatchEvent(new PopStateEvent("popstate"));

    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>About</h2>");
    });

    resolveFirst("<h2>Stale</h2>");
    await new Promise((r) => setTimeout(r, 10));
    expect(afterRenderCalled).toBe(false);
  });

  it("afterRender error appended inline", async () => {
    const afterRoutes: [Route, ...Route[]] = [
      {
        path: "/",
        render: () => "<h2>Home</h2>",
        afterRender: () => { throw new Error("after boom"); },
      },
    ];
    router = createHistoryRouter(outlet, afterRoutes);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toContain("<h2>Home</h2>");
      expect(outlet.innerHTML).toContain("Some content failed to load");
    });
  });

  it("afterRender TypeError/ReferenceError deferred", async () => {
    const deferredErrors: unknown[] = [];
    const origSetTimeout = globalThis.setTimeout;
    vi.spyOn(globalThis, "setTimeout").mockImplementation((fn: TimerHandler) => {
      if (typeof fn === "function") {
        try { fn(); } catch (e) { deferredErrors.push(e); }
      }
      return 0 as unknown as ReturnType<typeof setTimeout>;
    });

    try {
      const afterRoutes: [Route, ...Route[]] = [
        {
          path: "/",
          render: () => "<h2>Home</h2>",
          afterRender: () => { throw new TypeError("type error"); },
        },
      ];
      router = createHistoryRouter(outlet, afterRoutes);
      await vi.waitFor(() => {
        expect(outlet.innerHTML).toBe("<h2>Home</h2>");
      });
      expect(deferredErrors).toHaveLength(1);
      expect(deferredErrors[0]).toBeInstanceOf(TypeError);
    } finally {
      vi.mocked(globalThis.setTimeout).mockRestore();
    }
  });

  it("throwing onNavigate does not prevent rendering", async () => {
    router = createHistoryRouter(outlet, routes, {
      onNavigate: () => { throw new Error("navigate boom"); },
    });
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Home</h2>");
    });
  });

  it("onNavigate TypeError/ReferenceError deferred", async () => {
    const deferredErrors: unknown[] = [];
    vi.spyOn(globalThis, "setTimeout").mockImplementation((fn: TimerHandler) => {
      if (typeof fn === "function") {
        try { fn(); } catch (e) { deferredErrors.push(e); }
      }
      return 0 as unknown as ReturnType<typeof setTimeout>;
    });

    try {
      router = createHistoryRouter(outlet, routes, {
        onNavigate: () => { throw new TypeError("type error"); },
      });
      await vi.waitFor(() => {
        expect(outlet.innerHTML).toBe("<h2>Home</h2>");
      });
      expect(deferredErrors).toHaveLength(1);
      expect(deferredErrors[0]).toBeInstanceOf(TypeError);
    } finally {
      vi.mocked(globalThis.setTimeout).mockRestore();
    }
  });

  it("onNavigate callback fires with path on each navigation", async () => {
    const paths: string[] = [];
    router = createHistoryRouter(outlet, routes, {
      onNavigate: ({ path }) => { paths.push(path); },
    });
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Home</h2>");
    });

    history.pushState({}, "", "/about");
    window.dispatchEvent(new PopStateEvent("popstate"));

    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>About</h2>");
    });
    expect(paths).toEqual(["/", "/about"]);
  });

  it("navigate() re-renders current route", async () => {
    let renderCount = 0;
    const countRoutes: [Route, ...Route[]] = [
      { path: "/", render: () => { renderCount++; return "<h2>Home</h2>"; } },
    ];
    router = createHistoryRouter(outlet, countRoutes);
    await vi.waitFor(() => {
      expect(renderCount).toBe(1);
    });

    router.navigate();
    await vi.waitFor(() => {
      expect(renderCount).toBe(2);
    });
  });

  it("navigate() is no-op after destroy()", async () => {
    let renderCount = 0;
    const countRoutes: [Route, ...Route[]] = [
      { path: "/", render: () => { renderCount++; return "<h2>Home</h2>"; } },
    ];
    router = createHistoryRouter(outlet, countRoutes);
    await vi.waitFor(() => {
      expect(renderCount).toBe(1);
    });

    router.destroy();
    router.navigate();
    await new Promise((r) => setTimeout(r, 10));
    expect(renderCount).toBe(1);
  });

  it("showTerminalError() calls destroy and sets outlet HTML", async () => {
    router = createHistoryRouter(outlet, routes);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Home</h2>");
    });

    router.showTerminalError("<p>Fatal error</p>");
    expect(outlet.innerHTML).toBe("<p>Fatal error</p>");

    history.pushState({}, "", "/about");
    window.dispatchEvent(new PopStateEvent("popstate"));
    await new Promise((r) => setTimeout(r, 10));
    expect(outlet.innerHTML).toBe("<p>Fatal error</p>");
  });
});
