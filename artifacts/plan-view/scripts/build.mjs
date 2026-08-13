#!/usr/bin/env node
/**
 * Build the plan view as ONE self-contained file.
 *
 * The artifact viewer enforces a strict CSP that blocks every external host —
 * CDN scripts, external stylesheets, remote fonts and images, fetch/XHR and
 * WebSockets alike. So the output has all CSS and JS inlined and every asset as
 * a `data:` URI. A correctly built artifact therefore also opens from `file://`
 * with the network disabled, which is what makes the render smoke a real
 * acceptance test rather than a lint.
 *
 * Shape borrowed from the design-canvas sync (`.design-sync/`, `NOTES.md`):
 * esbuild bundles `@commons-systems/ds` straight from TypeScript source — there
 * is no `dist/` build in `packages/ds` and none is needed — with the five IBM
 * Plex woff2 inlined. Same shape, different output target.
 *
 * Emits page CONTENT ONLY: no `<!DOCTYPE>`, `<html>`, `<head>` or `<body>`
 * tags. The publish step wraps the file in its own skeleton and adds a minimal
 * CSS reset; emitting our own would nest a second document inside it.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG = resolve(HERE, "..");
const REPO = resolve(PKG, "..", "..");
const DIST = join(PKG, "dist");
const OUT = join(DIST, "plan-view.html");

/** The page title. Must appear within the first 8KB — only that prefix is scanned. */
const TITLE = "Plan View";

const FONT_DIR = join(REPO, "packages/ds/.storybook/public/fonts");

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

// --- 1. Bake the data ---------------------------------------------------------

const payloadFile = join(DIST, "payload.json");
execFileSync(
  process.execPath,
  ["--import", "tsx", join(HERE, "emit-payload.ts"), REPO, payloadFile],
  { cwd: REPO, stdio: ["ignore", "inherit", "inherit"] },
);
const payload = readFileSync(payloadFile, "utf8");

// --- 2. Bundle the client -----------------------------------------------------

const js = await esbuild.build({
  entryPoints: [join(PKG, "src/ui/main.tsx")],
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2022",
  platform: "browser",
  jsx: "automatic",
  legalComments: "none",
  write: false,
  absWorkingDir: PKG,
  define: { "process.env.NODE_ENV": '"production"' },
});

// --- 3. Bundle the CSS, then inline the fonts ---------------------------------

/**
 * Resolve the DS font references.
 *
 * `packages/ds/fonts.css` points at the woff2 with ABSOLUTE `url("/fonts/...")`
 * paths, served at runtime by Storybook's `staticDirs`. A published artifact
 * has no such static root and its CSP blocks every external host, so those
 * references have to become `data:` URIs or the page silently falls down the
 * `--font-mono` fallback stack.
 *
 * esbuild does NOT pass an absolute `url()` through as an opaque runtime path —
 * it tries to resolve it and fails the build. That failure is the good case:
 * it means the wrong-typeface outcome is impossible to reach by accident. This
 * plugin points those five specifiers at the real files, and the `dataurl`
 * loader inlines them.
 */
const dsFontsPlugin = {
  name: "ds-fonts",
  setup(build) {
    build.onResolve({ filter: /^\/fonts\// }, (args) => ({
      path: join(FONT_DIR, args.path.slice("/fonts/".length)),
    }));
  },
};

const cssBuild = await esbuild.build({
  entryPoints: [join(PKG, "src/ui/plan-view.css")],
  bundle: true,
  minify: true,
  write: false,
  absWorkingDir: PKG,
  loader: { ".woff2": "dataurl" },
  plugins: [dsFontsPlugin],
});

const css = cssBuild.outputFiles[0].text;

const inlined = (css.match(/data:font\/woff2/g) ?? []).length;
if (inlined === 0) {
  throw new Error(
    "plan-view build: no inlined woff2 in the bundled CSS. Either packages/ds/fonts.css " +
      "stopped declaring @font-face, or the DS stylesheet is no longer reaching this bundle. " +
      "Both change what ships — fix the cause rather than removing this check.",
  );
}

// --- 4. Assemble --------------------------------------------------------------

/**
 * `</script` inside a script element ends it, whatever the element's type. The
 * payload carries node statements written by humans, so assume it will contain
 * one eventually. Escaping `<` as `<` is JSON-safe and parses identically.
 */
const safePayload = payload.replace(/</g, "\\u003c");

const html = `<title>${TITLE}</title>
<style>${css}</style>
<div id="plan-view-root"></div>
<script type="application/json" id="plan-view-payload">${safePayload}</script>
<script>${js.outputFiles[0].text}</script>
`;

writeFileSync(OUT, html);
rmSync(payloadFile);

const bytes = Buffer.byteLength(html);
console.error(
  `built ${OUT} — ${(bytes / 1024).toFixed(0)}KB ` +
    `(css ${(css.length / 1024).toFixed(0)}KB incl. ${inlined} inlined fonts, ` +
    `js ${(js.outputFiles[0].text.length / 1024).toFixed(0)}KB, ` +
    `payload ${(payload.length / 1024).toFixed(0)}KB)`,
);
