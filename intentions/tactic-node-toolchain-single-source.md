---
id: tactic-node-toolchain-single-source
kind: tactic
statement: Derive the nix dev-shell node version from .node-version (or assert
  equality in the shell hook) so CI and dev shell cannot silently drift
owner: ai
status: codified
parent: null
rationale: "Surfaced at the 2026-07-07 /align-strategy operational-mechanics
  round: CI pins node via .node-version (22.22.3, dodging the 22.23.0 undici
  OAuth regression) while flake.nix ships nodejs_22 from nixos-unstable, so
  patch-level drift is invisible until something breaks — the Playwright browser
  mismatch already did (local acceptance runs blocked, CI authoritative).
  Options in preference order: read .node-version in the flake and
  build/override that exact version; or cheaper, a dev-shell hook that compares
  `node --version` to .node-version and fails loudly on mismatch. Either makes
  the drift impossible or at least loud. Retained as a draft for
  /align-tactics."
reading: null
gap: null
serves:
  - strategy-distribute-workflow
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution:
  branch: tactic-node-toolchain-single-source
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint:
    hash: 1b4010bd0ef97663a511f2ea60d27d7edd89b7c0f53ca29dcaa98c1f1881ec62
    sha: b8d2e250fcd9188e40f678cd8408933a3edac3ef
  fix: null
  completion: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Derive the nix dev-shell node version from .node-version (or assert equality in the shell hook) so CI and dev shell cannot silently drift

## Context

CI pins Node via `.node-version` (currently `22.22.3`, chosen to dodge the
22.23.0 undici regression that broke Firebase OAuth in preview deploys),
while `flake.nix:85` ships floating `nodejs_22` from nixos-unstable —
22.23.1 at planning time. So every local dev shell runs a different Node
than CI, on the regressed undici line, and the drift is invisible until
something breaks: the Playwright browser-version mismatch that blocked local
acceptance runs was this drift. A forkable-in-practice workflow includes a
dev environment that reproduces what CI runs
(strategy-distribute-workflow's 2026-07-07 clarification).

Greenfield design: one source of truth — the dev shell **builds the exact
version `.node-version` names**, from the official prebuilt Node dist
tarball (never a nixpkgs source rebuild, which would compile Node in every
uncached shell). A missing hash for a newly bumped version fails loudly at
eval time with instructions — that failure IS the drift assert.

Implement the unit in a subagent launched with its recommended model
(Agent/Task tool, `model: opus`), passing this context and scope; constrain
it to working-tree edits.

## Units of work

### Unit 1 — pinned Node derivation wired into the dev shell

Recommended model: opus

Scope:
- New `nix/packages/nodejs-pinned.nix`: a derivation that
  - reads `version` from `.node-version` at the repo root
    (`builtins.readFile` + trim; the file contains `22.22.3` with a
    newline);
  - fetches the official prebuilt dist tarball
    `https://nodejs.org/dist/v${v}/node-v${v}-<platform>.tar.xz` for each
    system `flake.nix:60` enumerates (`x86_64-linux` → `linux-x64`,
    `aarch64-linux` → `linux-arm64`, `x86_64-darwin` → `darwin-x64`,
    `aarch64-darwin` → `darwin-arm64`);
  - keeps a `version+system → sha256` attrset in the same file, and fails
    at eval with an actionable message when the entry is missing ("bumped
    .node-version? add its hash here; get it with `nix-prefetch-url <dist
    url>`");
  - on Linux uses `autoPatchelfHook` (plus `stdenv.cc.cc.lib` for
    libstdc++) to patch the prebuilt binaries; the darwin tarballs run
    as-is.
- `flake.nix:85` — replace `nodejs_22` in the default devShell's `packages`
  with the pinned package (`pkgs.callPackage ./nix/packages/nodejs-pinned.nix {}`
  in the existing `let` at `flake.nix:79-81`).
- `flake.nix:96-98` (`shellHook`) — append a belt-and-braces check that
  compares `node --version` to `v$(cat .node-version)` and prints a loud,
  unmissable warning on mismatch (PATH shadowing detection). A warning, not
  an exit: a hard exit in `shellHook` would break direnv shell entry; the
  derivation hash is the hard guarantee.
- Out of scope: CI workflows (actions/setup-node already reads
  `.node-version`); the WezTerm nightly pin (`nix/home/wezterm-pin.nix`,
  owned elsewhere); home-manager configs; other flake outputs
  (`nix/packages/dispatch.nix`, `office-hours.nix`) unless they embed their
  own nodejs — check and leave them unless trivially the same swap.

## Reuse

- Package-per-file pattern: `nix/packages/dispatch.nix`,
  `nix/packages/office-hours.nix` (both `pkgs.callPackage`d from
  `flake.nix:79-81`).
- `forAllSystems` plumbing at `flake.nix:60-61` — the devShell is already
  per-system; the derivation only needs `pkgs.system` to pick its platform
  string.

## Verification

```verify
nix develop --command node --version | grep -qx "v$(cat .node-version)"
```

Prose: `nix flake check`/CI `nixos-build` must stay green — note nixos-build
was red on main at planning time for an unrelated WezTerm nightly hash drift
(see tactic-nix-instance-flake-extraction's park); rebase onto the pin
refresh rather than coupling that fix in. The fetchurl needs network access
to nodejs.org — in a sandboxed session run the build with the sandbox
override, or let CI verify. After the shell ships 22.22.3, re-run one local
Playwright acceptance to observe the browser-version mismatch clearing (an
observation, not a gate).
