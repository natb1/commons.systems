import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { parseHash, createRouter, type Route, type Router } from "../src/index";

describe("parseHash", () => {
  afterEach(() => {
    location.hash = "";
  });

  it("returns path '/' and empty params with no hash", () => {
    location.hash = "";
    const result = parseHash();
    expect(result.path).toBe("/");
    expect([...result.params]).toEqual([]);
  });

  it("extracts path without query string", () => {
    location.hash = "#/about";
    const result = parseHash();
    expect(result.path).toBe("/about");
    expect([...result.params]).toEqual([]);
  });

  it("extracts URLSearchParams from query string", () => {
    location.hash = "#/home?group=household&sort=date";
    const result = parseHash();
    expect(result.path).toBe("/home");
    expect(result.params.get("group")).toBe("household");
    expect(result.params.get("sort")).toBe("date");
  });
});

describe("createRouter", () => {
  let outlet: HTMLDivElement;
  let routes: [Route, ...Route[]];
  let router: Router;
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
    router?.destroy();
    consoleErrorSpy.mockRestore();
  });

  it("renders default route with no hash", async () => {
    router = createRouter(outlet, routes);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Home</h2>");
    });
  });

  it("navigates on hashchange", async () => {
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

  it("falls back to first route for unknown hash", async () => {
    location.hash = "#/nonexistent";
    router = createRouter(outlet, routes);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Home</h2>");
    });
  });

  it("supports async render", async () => {
    router = createRouter(outlet, [
      { path: "/", render: async () => "<h2>Async Home</h2>" },
    ]);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Async Home</h2>");
    });
  });

  it("discards stale async render", async () => {
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

    location.hash = "#/fast";
    window.dispatchEvent(new HashChangeEvent("hashchange"));

    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Fast</h2>");
    });

    resolveSlowRoute("<h2>Slow</h2>");
    await new Promise((r) => setTimeout(r, 10));

    expect(outlet.innerHTML).toBe("<h2>Fast</h2>");
  });

  it("shows generic error message when render throws", async () => {
    router = createRouter(outlet, [
      {
        path: "/",
        render: () => {
          throw new Error("boom");
        },
      },
    ]);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toContain(
        "Something went wrong. Please try again.",
      );
    });
  });

  it("formatError returns custom message for specific errors", async () => {
    router = createRouter(
      outlet,
      [
        {
          path: "/",
          render: () => {
            throw new RangeError("out of range");
          },
        },
      ],
      {
        formatError: (error) => {
          if (error instanceof RangeError) return "A data error occurred.";
          return undefined;
        },
      },
    );
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toContain("A data error occurred.");
    });
  });

  it("formatError returning undefined falls through to default message", async () => {
    router = createRouter(
      outlet,
      [{ path: "/", render: () => { throw new Error("boom"); } }],
      { formatError: () => undefined },
    );
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toContain("Something went wrong. Please try again.");
    });
  });

  it("strips query params for route matching", async () => {
    location.hash = "#/about?group=household";
    router = createRouter(outlet, routes);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>About</h2>");
    });
  });

  it("matches RegExp path", async () => {
    const regexpRoutes: [Route, ...Route[]] = [
      { path: "/", render: () => "<h2>Home</h2>" },
      { path: /^\/post\//, render: () => "<h2>Post</h2>" },
    ];
    location.hash = "#/post/hello-world";
    router = createRouter(outlet, regexpRoutes);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Post</h2>");
    });
  });

  it("passes path to render function", async () => {
    const receivedPaths: string[] = [];
    router = createRouter(outlet, [
      {
        path: /^\/post\//,
        render: (path) => {
          receivedPaths.push(path);
          return "<h2>Post</h2>";
        },
      },
    ]);
    location.hash = "#/post/hello-world";
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Post</h2>");
    });
    expect(receivedPaths).toContain("/post/hello-world");
  });

  it("passes path to afterRender", async () => {
    const afterRenderSpy = vi.fn();
    router = createRouter(outlet, [
      {
        path: "/",
        render: () => "<h2>Home</h2>",
        afterRender: afterRenderSpy,
      },
    ]);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Home</h2>");
    });
    expect(afterRenderSpy).toHaveBeenCalledWith(outlet, "/");
  });

  it("calls afterRender after innerHTML set", async () => {
    let outletHtmlDuringAfterRender = "";
    router = createRouter(outlet, [
      {
        path: "/",
        render: () => "<h2>Home</h2>",
        afterRender: (el) => {
          outletHtmlDuringAfterRender = el.innerHTML;
        },
      },
    ]);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Home</h2>");
    });
    expect(outletHtmlDuringAfterRender).toBe("<h2>Home</h2>");
  });

  it("does not call afterRender on stale navigation", async () => {
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

    router = createRouter(outlet, [slowRoute, fastRoute]);

    location.hash = "#/fast";
    window.dispatchEvent(new HashChangeEvent("hashchange"));

    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Fast</h2>");
    });

    resolveSlowRoute("<h2>Slow</h2>");
    await new Promise((r) => setTimeout(r, 10));

    expect(afterRenderSpy).not.toHaveBeenCalled();
  });

  it("afterRender error appended inline without hiding content", async () => {
    router = createRouter(outlet, [
      {
        path: "/",
        render: () => "<h2>Home</h2>",
        afterRender: () => {
          throw new Error("hydration failed");
        },
      },
    ]);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toContain("<h2>Home</h2>");
      expect(outlet.innerHTML).toContain("Some content failed to load");
    });
  });

  it.each([
    { name: "TypeError", ErrorClass: TypeError, message: "cannot read property of undefined" },
    { name: "ReferenceError", ErrorClass: ReferenceError, message: "x is not defined" },
  ])("afterRender $name preserves content and defers error", async ({ ErrorClass, message }) => {
    const deferred: Array<() => void> = [];
    const realSetTimeout = globalThis.setTimeout;
    vi.stubGlobal("setTimeout", (fn: TimerHandler, ...rest: unknown[]) => {
      if (typeof fn === "function" && (!rest[0] || rest[0] === 0)) {
        deferred.push(fn as () => void);
        return 0;
      }
      return realSetTimeout(fn, ...(rest as [number?]));
    });

    router = createRouter(outlet, [
      {
        path: "/",
        render: () => "<h2>Home</h2>",
        afterRender: () => {
          throw new ErrorClass(message);
        },
      },
    ]);

    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Home</h2>");
    });
    vi.stubGlobal("setTimeout", realSetTimeout);

    // Content preserved — not replaced with generic error message
    expect(outlet.innerHTML).not.toContain("Something went wrong");
    expect(outlet.innerHTML).not.toContain("Some content failed to load");
    expect(deferred).toHaveLength(1);
    expect(() => deferred[0]()).toThrow(ErrorClass);
  });

  it("throwing onNavigate does not prevent route rendering", async () => {
    const onNavigate = vi.fn(() => {
      throw new Error("analytics down");
    });
    router = createRouter(outlet, routes, { onNavigate });
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Home</h2>");
    });
    expect(onNavigate).toHaveBeenCalledWith({ path: "/", params: expect.any(URLSearchParams) });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "onNavigate error:",
      expect.any(Error),
    );
  });

  it("onNavigate TypeError is deferred, not swallowed", async () => {
    const deferred: Array<() => void> = [];
    const realSetTimeout = globalThis.setTimeout;
    vi.stubGlobal("setTimeout", (fn: TimerHandler, ...rest: unknown[]) => {
      if (typeof fn === "function" && (!rest[0] || rest[0] === 0)) {
        deferred.push(fn as () => void);
        return 0;
      }
      return realSetTimeout(fn, ...(rest as [number?]));
    });

    const onNavigate = vi.fn(() => {
      throw new TypeError("cannot read property of undefined");
    });
    router = createRouter(outlet, routes, { onNavigate });
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Home</h2>");
    });
    vi.stubGlobal("setTimeout", realSetTimeout);

    // Route still renders despite TypeError
    expect(outlet.innerHTML).not.toContain("Something went wrong");
    // TypeError deferred via setTimeout, not swallowed
    expect(deferred).toHaveLength(1);
    expect(() => deferred[0]()).toThrow(TypeError);
    // Not logged to console.error (deferred instead)
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      "onNavigate error:",
      expect.any(TypeError),
    );
  });

  it("onNavigate callback fires with path on each navigation", async () => {
    const onNavigate = vi.fn();
    router = createRouter(outlet, routes, { onNavigate });
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Home</h2>");
    });
    expect(onNavigate).toHaveBeenCalledWith({ path: "/", params: expect.any(URLSearchParams) });

    location.hash = "#/about";
    window.dispatchEvent(new HashChangeEvent("hashchange"));

    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>About</h2>");
    });
    expect(onNavigate).toHaveBeenCalledWith({ path: "/about", params: expect.any(URLSearchParams) });
  });

  it("navigate() re-renders current route", async () => {
    let count = 0;
    router = createRouter(outlet, [
      { path: "/", render: () => `<h2>Count ${++count}</h2>` },
    ]);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Count 1</h2>");
    });

    router.navigate();
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Count 2</h2>");
    });
  });

  it("destroy() stops hashchange listener", async () => {
    router = createRouter(outlet, routes);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Home</h2>");
    });

    router.destroy();

    location.hash = "#/about";
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    await new Promise((r) => setTimeout(r, 10));

    expect(outlet.innerHTML).toBe("<h2>Home</h2>");
  });

  it("navigate() is no-op after destroy()", async () => {
    router = createRouter(outlet, routes);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Home</h2>");
    });

    router.destroy();
    location.hash = "#/about";
    router.navigate();
    await new Promise((r) => setTimeout(r, 10));

    expect(outlet.innerHTML).toBe("<h2>Home</h2>");
  });

  it("showTerminalError() calls destroy() and sets outlet HTML", async () => {
    router = createRouter(outlet, routes);
    await vi.waitFor(() => {
      expect(outlet.innerHTML).toBe("<h2>Home</h2>");
    });

    router.showTerminalError("<p>Fatal error</p>");

    expect(outlet.innerHTML).toBe("<p>Fatal error</p>");

    // Verify destroyed — hashchange should not re-render
    location.hash = "#/about";
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    await new Promise((r) => setTimeout(r, 10));

    expect(outlet.innerHTML).toBe("<p>Fatal error</p>");
  });
});
