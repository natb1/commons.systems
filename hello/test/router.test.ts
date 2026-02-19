import { describe, it, expect, beforeEach, vi } from "vitest";
import { createRouter, Route } from "../src/router";

describe("createRouter", () => {
  let outlet: HTMLDivElement;
  let routes: Route[];

  beforeEach(() => {
    outlet = document.createElement("div");
    routes = [
      { path: "/", render: () => "<h2>Home</h2>" },
      { path: "/about", render: () => "<h2>About</h2>" },
    ];
    location.hash = "";
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
});
