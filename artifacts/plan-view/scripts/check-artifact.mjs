#!/usr/bin/env node
/**
 * The artifact contract check.
 *
 * Asserts a built file satisfies what the claude.ai artifact viewer requires,
 * BEFORE anyone publishes. CI cannot publish — the Artifact tool exists only
 * inside a Claude session, there is no CLI — so the final step is always a
 * session action. The whole point of this check is that the step carries no
 * risk: everything checkable is checked first.
 *
 * Follows the repo's clear-errors-over-fallbacks rule: every failure names the
 * violated clause and says what to do, the way `lint-prose-rules.sh` does.
 *
 * Usage: check-artifact.mjs <file> [...]
 */
import { readFileSync, statSync } from "node:fs";

/** Rendered-page cap. `data:` URIs count toward it. */
const MAX_BYTES = 16 * 1024 * 1024;

/** Only this prefix is scanned for the `<title>`. */
const TITLE_SCAN_BYTES = 8 * 1024;

const failures = [];

function fail(clause, detail, remedy) {
  failures.push({ clause, detail, remedy });
}

/**
 * Hosts an artifact may never reach. Matches a scheme-relative or absolute URL
 * in markup or CSS. `data:` and `blob:` are not hosts; a bare `#fragment`,
 * `mailto:` and an in-document `/#/route` are not requests.
 *
 * Deliberately matches inside the JS bundle too. A `fetch("https://…")` that
 * never fires on the happy path still ships a dependency the CSP will block,
 * and finding it at review time beats finding it when a viewer opens the page.
 */
const EXTERNAL_URL = /(?:src|href)\s*=\s*["'](?:https?:)?\/\/[^"']+|url\(\s*["']?(?:https?:)?\/\/[^"')]+/g;

/**
 * Runtime network APIs, matched at CALL syntax rather than as bare words.
 *
 * A bare-word match is unusable here: this page bakes 400-odd human-written
 * node statements into a JSON block, and several of them contain the English
 * word "fetch" (`git fetch origin main`, "duplicate PR-json fetch"). Twenty
 * false positives on the first run. Requiring `fetch(` / `new WebSocket(`
 * matches the thing that actually issues a request.
 */
const NETWORK_API = /\bfetch\s*\(|\bnew\s+(?:XMLHttpRequest|WebSocket|EventSource)\s*\(|\bnavigator\s*\.\s*sendBeacon\s*\(/g;

/** Allowed inside string literals: the XML namespace React writes on <svg>. */
const EXTERNAL_ALLOWLIST = [/^https?:\/\/www\.w3\.org\//];

/**
 * The baked JSON data block, which is content and not code.
 *
 * Scanned out before the code checks run: `application/json` is inert under the
 * CSP — the browser never executes it and never dereferences a URL inside it —
 * so a node statement mentioning a URL or the word "fetch" is text on the page,
 * not a request. Everything else in the file, minified bundle included, is
 * still scanned.
 */
const DATA_BLOCK = /<script type="application\/json"[^>]*>[\s\S]*?<\/script>/g;

/**
 * Whether the palette is defined on a BARE `:root` — outside every at-rule and
 * every `[data-theme]` qualifier.
 *
 * A regex cannot answer this. `/:root\s*\{[^}]*--/` matches
 * `@media (prefers-color-scheme: dark){:root{--fg:#fff}}` just as happily as a
 * top-level rule, which passes exactly the page the check exists to reject —
 * one whose colours are defined ONLY under a media query and therefore render
 * wrong in the viewer's unstamped system-default state. So this scans brace
 * depth: an at-rule opens a nesting level, and a `:root` seen at any level
 * below the top does not count.
 */
function hasBareRootTokens(css) {
  const AT_RULE = /@(?:media|supports|container|layer|scope)\b/y;
  let depth = 0;
  let atRuleDepth = null;

  for (let i = 0; i < css.length; i += 1) {
    const ch = css[i];
    if (ch === "@") {
      AT_RULE.lastIndex = i;
      if (AT_RULE.test(css)) atRuleDepth = atRuleDepth ?? depth;
      continue;
    }
    if (ch === "{") {
      depth += 1;
      continue;
    }
    if (ch === "}") {
      depth -= 1;
      if (atRuleDepth !== null && depth <= atRuleDepth) atRuleDepth = null;
      continue;
    }
    if (ch !== ":" || !css.startsWith(":root", i)) continue;
    if (atRuleDepth !== null || depth > 0) continue;

    // `:root[data-theme="dark"]` is a qualified selector, not the bare root.
    const rest = css.slice(i + ":root".length);
    const selector = /^\s*(?:,[^{]*)?\{([^}]*)\}/.exec(rest);
    if (selector === null) continue;
    if (selector[1].includes("--")) return true;
  }
  return false;
}

function checkFile(file) {
  const html = readFileSync(file, "utf8");
  const code = html.replace(DATA_BLOCK, "");
  const bytes = statSync(file).size;

  // --- one self-contained file ------------------------------------------------
  if (bytes > MAX_BYTES) {
    fail(
      "size",
      `${(bytes / 1024 / 1024).toFixed(2)}MB exceeds the 16MB rendered-page cap`,
      "Shrink the baked payload or drop an inlined asset. data: URIs count toward the cap.",
    );
  }

  // --- zero external hosts ----------------------------------------------------
  const hits = [];
  for (const match of code.matchAll(EXTERNAL_URL)) {
    const url = /(?:https?:)?\/\/[^"')\s]+/.exec(match[0])?.[0] ?? "";
    if (url === "" || EXTERNAL_ALLOWLIST.some((allowed) => allowed.test(url))) continue;
    hits.push(`external host: ${url.slice(0, 90)}`);
  }
  for (const match of code.matchAll(NETWORK_API)) {
    hits.push(`network API call: ${match[0].replace(/\s+/g, " ")}`);
  }
  if (hits.length > 0) {
    fail(
      "self-contained",
      `${hits.length} external reference(s): ${[...new Set(hits)].slice(0, 5).join("; ")}`,
      "The viewer's CSP blocks every external host. Inline the asset as a data: URI, " +
        "or drop the dependency. A page that renders locally can still break under the CSP.",
    );
  }

  // --- title within the first 8KB ---------------------------------------------
  const prefix = html.slice(0, TITLE_SCAN_BYTES);
  const title = /<title>([^<]*)<\/title>/.exec(prefix);
  if (title === null) {
    fail(
      "title",
      "no <title> in the first 8KB",
      "Only the first 8KB is scanned for the title. Put it at the very top of the file.",
    );
  } else if (title[1].trim() === "") {
    fail("title", "<title> is empty", "The title names the artifact in the tab and gallery.");
  }

  // --- no document skeleton ---------------------------------------------------
  const skeleton = /<!doctype|<html[\s>]|<head[\s>]|<body[\s>]/i.exec(code);
  if (skeleton !== null) {
    fail(
      "content-only",
      `found ${skeleton[0]}`,
      "The publish step wraps the file in its own <!doctype>/<html>/<head>/<body>. " +
        "Emitting your own nests a second document inside it.",
    );
  }

  // --- theme ------------------------------------------------------------------
  // The viewer has THREE theme states: data-theme="dark", data-theme="light",
  // and the default system setting, which stamps nothing. A colour whose only
  // definition lives inside a media or [data-theme] block renders wrong in at
  // least one of them.
  if (!hasBareRootTokens(code)) {
    fail(
      "theme-tokens",
      "no custom properties defined on a bare :root",
      "Define the complete palette on bare :root, and redefine only what changes under " +
        '@media (prefers-color-scheme: dark) and :root[data-theme="dark"]. ' +
        "CSS light-dark() on a bare :root also satisfies this.",
    );
  }
  if (!/\bbody\s*\{[^}]*\bbackground\b/.test(code)) {
    fail(
      "body-background",
      "body has no explicit background",
      "The viewer paints its own ground behind the page, so a transparent body borrows " +
        "the host's theme. Give body an explicit token background.",
    );
  }

  // --- horizontal scroll ------------------------------------------------------
  // Not provable from source alone — the render smoke measures it for real.
  // What IS checkable: that at least one wide-content container opts into its
  // own scroll rather than letting the page body scroll.
  if (/<table[\s>]/i.test(code) && !/overflow-x\s*:\s*auto/.test(code)) {
    fail(
      "horizontal-scroll",
      "a <table> ships with no overflow-x: auto container",
      "Wide content must scroll inside its own container; the page body must never " +
        "scroll horizontally.",
    );
  }

  console.error(
    `checked ${file} — ${(bytes / 1024).toFixed(0)}KB, ` +
      `title ${title === null ? "MISSING" : JSON.stringify(title[1])}`,
  );
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("usage: check-artifact.mjs <file> [...]");
  process.exit(2);
}
for (const file of files) checkFile(file);

if (failures.length > 0) {
  console.error(`\nartifact contract: ${failures.length} violation(s)\n`);
  for (const { clause, detail, remedy } of failures) {
    console.error(`  [${clause}] ${detail}`);
    console.error(`      → ${remedy}\n`);
  }
  process.exit(1);
}
console.error("artifact contract: ok");
