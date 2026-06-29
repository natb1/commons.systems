# design-sync notes — @commons-systems/ds

Repo-specific gotchas for future re-syncs. One bullet per gotcha.

## Build shape
- The DS ships **TypeScript source directly** (`exports['.']` → `src/index.ts`);
  there is **no `dist/` build** and no `build` script in `packages/ds`. The
  converter bundles straight from source via `cfg.entry`
  (`packages/ds/src/index.ts`); esbuild compiles the TSX. No `buildCmd` needed.
- **`packages/ds/package.json` carries `"types": "src/index.ts"`** — required
  so the converter's ts-morph export/prop extraction
  (`exportedNames`/`projectFor` in lib/dts.mjs) finds the entry. It keys the
  types-root off `pkgJson.types`/`typings`/a `dist/types` tree and never reads
  `exports`. With no `.d.ts` tree and no `types` field, it loaded no entry →
  `exported PascalCase symbols: 0` → every storybook title dropped
  (`[TITLE_UNMAPPED]`). Pointing `types` at the source lets ts-morph parse the
  `.ts`/`.tsx` directly. **Inert for consumers**: `exports["."]` is a string and
  the repo uses `moduleResolution: bundler`, so TS resolves the `.` subpath via
  `exports` and ignores top-level `types`; even if a node-classic consumer read
  it, `src/index.ts` is the correct source-types entry. If a future sync sees 0
  components / `[TITLE_UNMAPPED]`, this field was removed — restore it.
- `--node-modules` is the **repo-root** `node_modules` (react/react-dom/
  @types/react are hoisted there; `packages/ds/node_modules` is sparse and lacks
  react). Storybook devdeps + playwright are also hoisted to the repo root.
- Reproduce the build from the repo root:
  `node .ds-sync/resync.mjs --config .design-sync/config.json --node-modules ./node_modules --entry packages/ds/src/index.ts --out ./ds-bundle [--remote .design-sync/.cache/remote-sync.json]`
  (omit `--remote` on a first sync / no anchor).

## Reference storybook
- Rebuild it whenever `packages/ds/src` or its CSS changes:
  `npx storybook build -c packages/ds/.storybook -o "$(git rev-parse --show-toplevel)/.design-sync/sb-reference"`.
  `cfg.storybookStatic` points compare/re-sync at it.

## Fonts
- Brand fonts (IBM Plex Mono / Serif, 5 weights) live at
  `packages/ds/.storybook/public/fonts/*.woff2`, served by storybook's
  `staticDirs` at runtime path `/fonts/...`. `fonts.css` references them with
  **absolute** `url("/fonts/...")`. Wired into the bundle via `cfg.extraFonts`
  (the 5 woff2 paths) — they DO ship and render on both panels.
- `[FONT_MISSING]` for **"Cascadia Code" / "Source Code Pro"** is a false alarm:
  those are tail entries in the `--font-mono` fallback stack
  (`packages/ds/tokens/typography.css`), after the brand "IBM Plex Mono" which
  ships. They're intentional graceful-degradation fallbacks, never meant to ship.
  Suppressed via `cfg.runtimeFontPrefixes: ["Cascadia Code", "Source Code Pro"]`.
  `runtimeFontPrefixes` is baked in at **build** time (validate reads only the
  bundle dir), so editing it needs a full `package-build.mjs`, not just validate.

## Grid overflow
- `Input` stories render wider than a grid cell → `cfg.overrides.Input.cardMode:
  "column"` (full card width per story). Presentation-only; targeted rebuild,
  grades carry.

## Verification env (WSL/Nix box)
- Chromium: repo playwright is 1.60.0 → wants chromium rev 1223, already in the
  `~/.cache/ms-playwright` cache. No download needed. `DS_CHROMIUM_PATH` is the
  fallback if the cache ever misses.
- npm cache writes (`.ds-sync` installs) need `dangerouslyDisableSandbox: true`.

## Providers / decorators
- `.storybook/preview.ts` has **no decorators** — only imports `styles.css` and
  sets `layout: centered`. No `cfg.provider` needed; components are pure React +
  CSS-var/class-name styling.

## Re-sync risks (watch-list for the next sync)
- **`packages/ds/package.json` `"types": "src/index.ts"`** is load-bearing for
  the converter (see Build shape). If a future maintainer removes it, the sync
  silently drops to 0 components (`[TITLE_UNMAPPED]`). First thing to check if
  components vanish.
- **Reference storybook must be rebuilt** when `packages/ds/src` or its CSS
  changes — a stale `.design-sync/sb-reference` grades previews against the OLD
  design. `[REFERENCE_STALE?]` in the capture log flags it.
- **Fonts depend on storybook `staticDirs`**: the woff2 are under
  `.storybook/public/fonts/`. If that path moves, `cfg.extraFonts` breaks.
  `[FONT_MISSING]` for IBM Plex (not the Cascadia/Source-Code fallbacks) = real.
- **All 30 stories graded `match` from images on first sync** (8 components × 30
  stories, no `close`, none skipped). No story caps hit (≤6 stories each). No
  owned previews — all 8 use the generated story-module previews, so an upstream
  story edit re-grades automatically on the next driver run.
- **Toolchain assumed**: node 22.22.3, playwright 1.60 → chromium 1223 (cached).
  Storybook 10, React 18.
- **No remote/CDN assets** in any story — captures are fully offline; no
  `[ASSETS_BLOCKED]` exposure.
