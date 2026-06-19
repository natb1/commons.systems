import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { App, mountSmoke } from "../src/App.tsx";

describe("React toolchain smoke", () => {
  it("App renders expected markup via renderToStaticMarkup", () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain("react-smoke");
    expect(html).toContain("audio");
  });

  it("mountSmoke mounts without throwing (proves react-dom/client resolves)", () => {
    const el = document.createElement("div");
    expect(() => mountSmoke(el)).not.toThrow();
  });
});
