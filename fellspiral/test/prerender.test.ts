import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";

const appDir = join(dirname(new URL(import.meta.url).pathname), "..");
const read = (rel: string): string => readFileSync(join(appDir, rel), "utf-8");

const indexHtml = read("index.html");
const mainTs = read("src/main.ts");
const prerenderTs = read("scripts/prerender.ts");

// The single PageShell mount id, and the shell config both sides must agree on.
const MOUNT = "root";

describe("fellspiral single-injection (PageShell) template", () => {
  it("ships exactly one empty PageShell mount in <body>", () => {
    expect(indexHtml).toContain(`<div id="${MOUNT}"></div>`);
    expect(indexHtml.match(new RegExp(`<div id="${MOUNT}">`, "g"))).toHaveLength(1);
  });

  it.each([
    '<app-nav id="nav">',
    '<aside id="info-panel"',
    '<main id="app">',
    "<app-footer>",
    '<section class="landing-hero"',
    'id="panel-toggle"',
  ])("carries no legacy per-region injection marker: %s", (marker) => {
    expect(indexHtml).not.toContain(marker);
  });
});

describe("fellspiral shell config parity (hydration contract)", () => {
  // The prerendered HTML must byte-match the client's first render, so the
  // `shell` object passed to prerenderPosts and to createBlogApp must agree on
  // every field that affects rendered output.
  const shellBlock = (src: string): string => {
    const start = src.indexOf("shell: {");
    expect(start).toBeGreaterThan(-1);
    const end = src.indexOf("}", start);
    return src
      .slice(start, end + 1)
      .replace(/\s+/g, " ")
      .trim();
  };

  it("client and prerender pass identical shell config", () => {
    expect(shellBlock(prerenderTs)).toBe(shellBlock(mainTs));
  });

  it("mounts at the template's mount id, with no hero and no tagline", () => {
    const shell = shellBlock(mainTs);
    expect(shell).toContain(`mount: "${MOUNT}"`);
    expect(shell).toContain(`wordmark: "fellspiral"`);
    expect(shell).not.toContain("hero:");
    expect(shell).not.toContain("tagline:");
  });

  it("drops the legacy footerHtml option (the shell renders the ds Footer)", () => {
    expect(prerenderTs).not.toContain("footerHtml");
    expect(prerenderTs).not.toContain("FOOTER_HTML");
  });
});
