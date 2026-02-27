import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createRouter, Route } from "../src/router";

describe("createRouter", () => {
  let outlet: HTMLDivElement;
  let routes: Route[];
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    outlet = document.createElement("div");
    routes = [
      { path: "/", render: () => "<h2>Home</h2>" },
      { path: "/about", render: () => "<h2>About</h2>" },
    ];
    location.hash = "";
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("renders the default route when there is no hash", async () => {
    createRouter(outlet, routes);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Home</h2>");
    });
  });

  it("navigates to the correct route on hash change", async () => {
    createRouter(outlet, routes);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Home</h2>");
    });

    location.hash = "#/about";
    window.dispatchEvent(new HashChangeEvent("hashchange"));

    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>About</h2>");
    });
  });

  it("falls back to the first route for an unknown hash", async () => {
    location.hash = "#/nonexistent";
    createRouter(outlet, routes);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Home</h2>");
    });
  });

  it("supports async render functions", async () => {
    const asyncRoutes: Route[] = [
      {
        path: "/",
        render: async () => "<h2>Async Home</h2>",
      },
    ];
    createRouter(outlet, asyncRoutes);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Async Home</h2>");
    });
  });

  it("discards stale async render when a newer navigation starts", async () => {
    let resolveSlowRoute!: (html: string) => void;
    const slowRoute: Route = {
      path: "/",
      render: () =>
        new Promise<string>((resolve) => {
          resolveSlowRoute = resolve;
        }),
    };
    const fastRoute: Route = {
      path: "/fast",
      render: () => "<h2>Fast</h2>",
    };

    createRouter(outlet, [slowRoute, fastRoute]);

    // Initial navigate() is pending on slowRoute
    // Trigger a second navigation to the fast route
    location.hash = "#/fast";
    window.dispatchEvent(new HashChangeEvent("hashchange"));

    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Fast</h2>");
    });

    // Now resolve the slow route — it should be discarded
    resolveSlowRoute("<h2>Slow</h2>");
    await new Promise((r) => setTimeout(r, 10));

    expect(outlet.innerHTML).toBe("<h2>Fast</h2>");
  });

  it("shows error message when render throws", async () => {
    const errorRoutes: Route[] = [
      {
        path: "/",
        render: () => {
          throw new Error("boom");
        },
      },
    ];
    createRouter(outlet, errorRoutes);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toContain("Something went wrong. Try refreshing the page.");
    });
  });

  it("returns a refresh function that re-renders the current route", async () => {
    let count = 0;
    const dynamicRoutes: Route[] = [
      { path: "/", render: () => `<h2>Count ${++count}</h2>` },
    ];
    const refresh = createRouter(outlet, dynamicRoutes);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Count 1</h2>");
    });

    refresh();
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Count 2</h2>");
    });
  });

  it("matches a RegExp path against the current hash", async () => {
    const regexpRoutes: Route[] = [
      { path: "/", render: () => "<h2>Home</h2>" },
      { path: /^\/post\//, render: () => "<h2>Post</h2>" },
    ];
    location.hash = "#/post/hello-world";
    createRouter(outlet, regexpRoutes);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Post</h2>");
    });
  });

  it("passes the full hash path to the render function for a RegExp route", async () => {
    const receivedHashes: string[] = [];
    const regexpRoutes: Route[] = [
      { path: "/", render: () => "<h2>Home</h2>" },
      {
        path: /^\/post\//,
        render: (hash) => {
          receivedHashes.push(hash);
          return "<h2>Post</h2>";
        },
      },
    ];
    location.hash = "#/post/hello-world";
    createRouter(outlet, regexpRoutes);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Post</h2>");
    });
    expect(receivedHashes).toContain("/post/hello-world");
  });

  it("navigates to a RegExp route on hash change", async () => {
    const regexpRoutes: Route[] = [
      { path: "/", render: () => "<h2>Home</h2>" },
      { path: /^\/post\//, render: () => "<h2>Post</h2>" },
    ];
    createRouter(outlet, regexpRoutes);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Home</h2>");
    });

    location.hash = "#/post/hello-world";
    window.dispatchEvent(new HashChangeEvent("hashchange"));

    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Post</h2>");
    });
  });

  it("passes the hash argument to string-path render functions", async () => {
    const receivedHashes: string[] = [];
    const stringRoutes: Route[] = [
      {
        path: "/",
        render: (hash) => {
          receivedHashes.push(hash);
          return "<h2>Home</h2>";
        },
      },
    ];
    createRouter(outlet, stringRoutes);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Home</h2>");
    });
    expect(receivedHashes).toContain("/");
  });

  it("calls afterRender after setting innerHTML", async () => {
    const afterRenderSpy = vi.fn();
    const routesWithAfterRender: Route[] = [
      {
        path: "/",
        render: () => "<h2>Home</h2>",
        afterRender: afterRenderSpy,
      },
    ];
    createRouter(outlet, routesWithAfterRender);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Home</h2>");
    });
    expect(afterRenderSpy).toHaveBeenCalledWith(outlet, "/");
  });

  it("does not call afterRender if navigation is stale", async () => {
    const afterRenderSpy = vi.fn();
    let resolveSlowRoute!: (html: string) => void;
    const slowRoute: Route = {
      path: "/",
      render: () =>
        new Promise<string>((resolve) => {
          resolveSlowRoute = resolve;
        }),
      afterRender: afterRenderSpy,
    };
    const fastRoute: Route = {
      path: "/fast",
      render: () => "<h2>Fast</h2>",
    };

    createRouter(outlet, [slowRoute, fastRoute]);

    location.hash = "#/fast";
    window.dispatchEvent(new HashChangeEvent("hashchange"));

    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Fast</h2>");
    });

    resolveSlowRoute("<h2>Slow</h2>");
    await new Promise((r) => setTimeout(r, 10));

    expect(afterRenderSpy).not.toHaveBeenCalled();
  });

  it("works without afterRender defined", async () => {
    const routesNoAfterRender: Route[] = [
      { path: "/", render: () => "<h2>No Hook</h2>" },
    ];
    createRouter(outlet, routesNoAfterRender);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>No Hook</h2>");
    });
  });

  it("throws when routes array is empty", () => {
    expect(() => createRouter(outlet, [])).toThrow(
      "createRouter requires at least one route",
    );
  });

  it("calls onNavigate callback on each navigation", async () => {
    const onNavigate = vi.fn();
    createRouter(outlet, routes, { onNavigate });
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Home</h2>");
    });
    expect(onNavigate).toHaveBeenCalled();
    const callsBefore = onNavigate.mock.calls.length;

    location.hash = "#/about";
    window.dispatchEvent(new HashChangeEvent("hashchange"));

    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>About</h2>");
    });
    expect(onNavigate.mock.calls.length).toBeGreaterThan(callsBefore);
  });
});
