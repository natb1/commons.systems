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
- **`Hero`, `OfficeHours`, `PageShell`** also trip `[GRID_OVERFLOW] wide` — each
  gets `cfg.overrides.<Name>.cardMode: "column"`. Same targeted-rebuild rule.

## Verification env (WSL/Nix box)
- **This is NixOS — the cached playwright chromium CANNOT run.** The
  `~/.cache/ms-playwright/chromium-*` binaries are generic-linux dynamically
  linked executables; launching one fails with *"NixOS cannot run dynamically
  linked executables intended for generic linux environments"* (exit 127), which
  the driver surfaces as `[RENDER_SKIPPED] browserType.launch: Target page,
  context or browser has been closed`. **`DS_CHROMIUM_PATH` is REQUIRED, not a
  cache-miss fallback.** Point it at the nix-patched chromium:
  `export DS_CHROMIUM_PATH="$(ls /nix/store/*-chromium-*/bin/chromium | head -1)"`
  (was chromium-131 on 2026-06-28; playwright 1.60 drives it fine via
  `executablePath`). Set it before every `resync.mjs` / `compare.mjs` run.
- **Pin `.ds-sync` playwright to the repo's version (1.60.0).** A bare
  `npm i playwright` pulls latest, which wants chromium rev **1228** (not cached
  and un-runnable anyway); `npm i playwright@1.60.0` keeps it matching the repo.
  The `.ds-sync/node_modules` is transient (gitignored) — reinstall esbuild +
  ts-morph + @types/react + playwright@1.60.0 on a fresh clone.
- npm cache writes (`.ds-sync` installs) AND the driver/compare runs (esbuild +
  chromium launch) need `dangerouslyDisableSandbox: true`.

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
- **13 components, 39 stories, all graded `match`** — 8 core/form/nav (30 stories)
  + 5 templates (9 stories): `Landing` (1 story), `OfficeHours` (3), `ContextPanel`
  (1), `Hero` (2), `PageShell` (2), all updated/added 2026-07-03. No `close`, none
  skipped. No story caps hit. No owned previews — all 13 use generated story-module
  previews, so upstream story edits re-grade automatically on the next driver run.
- **`Hero`, `OfficeHours`, `PageShell`** are wide templates with `cardMode:column`
  (see Grid overflow). `Landing` and `ContextPanel` render within their cells — no
  override needed. If future edits widen them, expect `[GRID_OVERFLOW] wide` →
  apply `cardMode:column`.
- **`BudgetPaceChart`** is exported from `src/index.ts` but has **no stories** —
  it won't appear in the sync (storybook shape includes only storied components).
  If a story is added to `packages/ds/src/charts/`, it'll appear on the next sync.
- **Toolchain assumed**: node 22.22.3, playwright 1.60 → chromium driven via
  `DS_CHROMIUM_PATH` (nix chromium — the cached ms-playwright chromium is
  un-runnable on this NixOS box; see Verification env). Storybook 10, React 18.
- **No remote/CDN assets** in any story — captures are fully offline; no
  `[ASSETS_BLOCKED]` exposure.
