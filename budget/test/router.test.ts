import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createRouter, Route, Router } from "../src/router";

describe("createRouter", () => {
  let outlet: HTMLDivElement;
  let routes: [Route, ...Route[]];
  let router: Router;

  beforeEach(() => {
    outlet = document.createElement("div");
    routes = [
      { path: "/", render: () => "<h2>Home</h2>" },
      { path: "/about", render: () => "<h2>About</h2>" },
    ];
    location.hash = "";
  });

  afterEach(() => {
    router?.destroy();
  });

  it("renders the default route when there is no hash", async () => {
    router = createRouter(outlet, routes);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Home</h2>");
    });
  });

  it("navigates to the correct route on hash change", async () => {
    router = createRouter(outlet, routes);
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
    router = createRouter(outlet, routes);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Home</h2>");
    });
  });

  it("supports async render functions", async () => {
    const asyncRoutes: [Route] = [
      {
        path: "/",
        render: async () => "<h2>Async Home</h2>",
      },
    ];
    router = createRouter(outlet, asyncRoutes);
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

    router = createRouter(outlet, [slowRoute, fastRoute]);

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
    const errorRoutes: [Route] = [
      {
        path: "/",
        render: () => {
          throw new Error("boom");
        },
      },
    ];
    router = createRouter(outlet, errorRoutes);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toContain("Something went wrong");
    });
  });

  it("shows data error message when render throws RangeError", async () => {
    const errorRoutes: [Route] = [
      {
        path: "/",
        render: () => {
          throw new RangeError("reimbursement out of range");
        },
      },
    ];
    router = createRouter(outlet, errorRoutes);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toContain("A data error occurred");
    });
  });

  it("strips query params for route matching", async () => {
    location.hash = "#/about?group=household";
    router = createRouter(outlet, routes);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>About</h2>");
    });
  });

  it("returns a router with navigate that re-renders the current route", async () => {
    let count = 0;
    const dynamicRoutes: [Route] = [
      { path: "/", render: () => `<h2>Count ${++count}</h2>` },
    ];
    router = createRouter(outlet, dynamicRoutes);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Count 1</h2>");
    });

    router.navigate();
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Count 2</h2>");
    });
  });
});
