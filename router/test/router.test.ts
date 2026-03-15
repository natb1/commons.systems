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
});
