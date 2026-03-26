# Building Workspace Packages

This is an npm workspace. All packages share dependencies installed at the workspace root.

## Install dependencies first

Before any build or type-check, ensure dependencies exist at the workspace root:

```bash
[ -d node_modules ] || npm ci
```

Never run `npm install --prefix <pkg>` for individual packages — workspace dependencies
(`@commons-systems/*`) are not on the npm registry and will fail with E404.

## Production builds

Build a specific app package:

```bash
npm run build --prefix <pkg>
```

Frontend app packages with build scripts: `budget`, `fellspiral`, `landing`, `print`.
Some include a prerender step after `vite build`. The `functions` package also has a
build script but uses a different pipeline (`tsx` + `tsc`, no Vite).

## Type-checking only

Type-check without bundling:

```bash
npx tsc --noEmit --project <pkg>
```

Requires dependencies installed first. Without `node_modules/`, `npx tsc` downloads a
stub package that prints "This is not the tsc command you are looking for" — not the
workspace typescript compiler.

## Scripted workflows

Wrapper scripts in `.claude/skills/ref-pr-workflow/scripts/` call `ensure_deps()`
automatically. Use these for QA, deploy, and test workflows:

- `run-unit-tests.sh` — runs `vitest` on changed app packages
- `run-lint.sh` — runs ESLint on changed app packages
- `run-qa-server.sh <app>` — starts Firebase emulators + Vite dev server
- `run-preview-deploy.sh <app> <channel>` — builds and deploys to Firebase Hosting preview
- `run-acceptance-tests.sh <app>` — runs Playwright acceptance tests

## Common errors

| Symptom | Cause | Fix |
|---|---|---|
| "This is not the tsc command you are looking for" | `npx tsc` without workspace deps | Run `npm ci` at workspace root first |
| E404 on `@commons-systems/*` | `npm install --prefix <pkg>` | Run `npm ci` at workspace root instead |
| `tsc: command not found` | Dependencies not installed | Run `npm ci` at workspace root first |
