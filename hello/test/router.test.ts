import { describe, it, expect, beforeEach } from "vitest";
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

  it("renders the default route when there is no hash", () => {
    createRouter(outlet, routes);
    expect(outlet.innerHTML).toBe("<h2>Home</h2>");
  });

  it("navigates to the correct route on hash change", async () => {
    createRouter(outlet, routes);

    location.hash = "#/about";
    window.dispatchEvent(new HashChangeEvent("hashchange"));

    expect(outlet.innerHTML).toBe("<h2>About</h2>");
  });

  it("falls back to the first route for an unknown hash", () => {
    location.hash = "#/nonexistent";
    createRouter(outlet, routes);
    expect(outlet.innerHTML).toBe("<h2>Home</h2>");
  });
});
