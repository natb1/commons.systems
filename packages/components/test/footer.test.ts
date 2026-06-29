/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach } from "vitest";
import { FOOTER_HTML } from "../src/footer";
import type { AppFooterElement } from "../src/footer";

function createFooter(): AppFooterElement {
  const el = document.createElement("app-footer") as AppFooterElement;
  document.body.appendChild(el);
  return el;
}

describe("AppFooterElement", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("FOOTER_HTML is the canonical source string", () => {
    expect(FOOTER_HTML).toBe(
      `<p>Created with <a href="https://github.com/natb1/commons.systems" target="_blank" rel="noopener">commons.systems</a> | &copy; 2026 RUMOR.ML <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener"><img src="https://mirrors.creativecommons.org/presskit/buttons/88x31/png/by-sa.png" alt="CC-BY-SA" class="cc-badge"></a></p>`
    );
  });

  it("renders two anchors with the correct hrefs", () => {
    const footer = createFooter();
    const anchors = footer.querySelectorAll("a");
    expect(anchors).toHaveLength(2);
    expect(anchors[0].getAttribute("href")).toBe("https://github.com/natb1/commons.systems");
    expect(anchors[1].getAttribute("href")).toBe("https://creativecommons.org/licenses/by-sa/4.0/");
  });

  it("renders an img with the correct src, alt, and class", () => {
    const footer = createFooter();
    const img = footer.querySelector("img");
    expect(img).toBeTruthy();
    expect(img!.getAttribute("src")).toBe(
      "https://mirrors.creativecommons.org/presskit/buttons/88x31/png/by-sa.png"
    );
    expect(img!.getAttribute("alt")).toBe("CC-BY-SA");
    expect(img!.getAttribute("class")).toBe("cc-badge");
  });

  it("textContent contains RUMOR.ML and 2026", () => {
    const footer = createFooter();
    expect(footer.textContent).toContain("RUMOR.ML");
    expect(footer.textContent).toContain("2026");
  });
});
