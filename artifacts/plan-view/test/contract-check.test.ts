import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

/**
 * The contract check must FAIL a deliberately broken build, naming the violated
 * clause. A gate that only ever passes is indistinguishable from no gate, and
 * this one guards a publish step no CI job can perform.
 */
const CHECK = resolve(import.meta.dirname, "../scripts/check-artifact.mjs");
const dir = mkdtempSync(join(tmpdir(), "artifact-check-"));

afterAll(() => rmSync(dir, { recursive: true, force: true }));

/** Run the check; return `{ ok, output }` rather than throwing on a non-zero exit. */
function check(name: string, html: string): { ok: boolean; output: string } {
  const file = join(dir, name);
  writeFileSync(file, html);
  try {
    const output = execFileSync(process.execPath, [CHECK, file], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { ok: true, output };
  } catch (error) {
    const failure = error as { stderr?: string; stdout?: string };
    return { ok: false, output: `${failure.stdout ?? ""}${failure.stderr ?? ""}` };
  }
}

const GOOD_HEAD = "<title>Plan View</title><style>:root{--fg:#000}body{background:var(--fg)}</style>";

describe("artifact contract check", () => {
  it("passes a well-formed page", () => {
    const result = check("good.html", `${GOOD_HEAD}<div>rows</div>`);
    expect(result.ok, result.output).toBe(true);
  });

  it("rejects an external script host", () => {
    const result = check(
      "external.html",
      `${GOOD_HEAD}<script src="https://cdn.example.com/x.js"></script>`,
    );
    expect(result.ok).toBe(false);
    expect(result.output).toContain("self-contained");
    expect(result.output).toContain("cdn.example.com");
  });

  it("rejects an external font in CSS", () => {
    const result = check(
      "font.html",
      `<title>x</title><style>:root{--a:1}body{background:red}` +
        `@font-face{src:url(https://fonts.example.com/a.woff2)}</style>`,
    );
    expect(result.ok).toBe(false);
    expect(result.output).toContain("fonts.example.com");
  });

  it("rejects a runtime network call", () => {
    const result = check("fetch.html", `${GOOD_HEAD}<script>fetch("/api")</script>`);
    expect(result.ok).toBe(false);
    expect(result.output).toContain("network API call");
  });

  it("does NOT reject the word fetch inside the baked JSON data block", () => {
    // The regression that made the first run of this check unusable: 400-odd
    // node statements are baked into the page and several say "git fetch".
    const result = check(
      "data.html",
      `${GOOD_HEAD}<script type="application/json" id="plan-view-payload">` +
        `{"s":"collapse the inlined git fetch origin main into one call"}</script>`,
    );
    expect(result.ok, result.output).toBe(true);
  });

  it("rejects a missing title", () => {
    const result = check("notitle.html", "<style>:root{--a:1}body{background:red}</style><div/>");
    expect(result.ok).toBe(false);
    expect(result.output).toContain("no <title> in the first 8KB");
  });

  it("rejects a title pushed past the 8KB scan window", () => {
    const result = check(
      "latetitle.html",
      `<style>:root{--a:1}body{background:red}/*${"x".repeat(9000)}*/</style><title>Late</title>`,
    );
    expect(result.ok).toBe(false);
    expect(result.output).toContain("first 8KB");
  });

  it("rejects a document skeleton", () => {
    const result = check("skeleton.html", `<title>x</title><html><body>hi</body></html>`);
    expect(result.ok).toBe(false);
    expect(result.output).toContain("content-only");
  });

  it("rejects a palette with no bare :root definition", () => {
    const result = check(
      "media-only.html",
      `<title>x</title><style>@media (prefers-color-scheme: dark){:root{--fg:#fff}}` +
        `body{background:#fff}</style>`,
    );
    expect(result.ok).toBe(false);
    expect(result.output).toContain("theme-tokens");
  });

  it("rejects a transparent body", () => {
    const result = check("nobg.html", `<title>x</title><style>:root{--a:1}</style><div/>`);
    expect(result.ok).toBe(false);
    expect(result.output).toContain("body-background");
  });

  it("rejects a table with no overflow container", () => {
    const result = check(
      "table.html",
      `${GOOD_HEAD}<table><tbody><tr><td>1</td></tr></tbody></table>`,
    );
    expect(result.ok).toBe(false);
    expect(result.output).toContain("horizontal-scroll");
  });

  it("names the violated clause AND a remedy on every failure", () => {
    const result = check("many.html", `<html><table></table>`);
    expect(result.ok).toBe(false);
    expect(result.output).toMatch(/\[\w[\w-]*\]/);
    expect(result.output).toContain("→");
  });
});
