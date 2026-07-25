# NixOS build performance — findings

Investigation of the `nixos-build` job shared by `.github/workflows/unit-tests.yml`
(pre-merge, nix-gated) and `.github/workflows/main-nix-validate.yml` (post-merge,
unconditional on nix-touching pushes to main). Both run
`.github/scripts/build-nixos-config.sh`, i.e.
`nix build <repo>#nixosConfigurations.nixos.config.system.build.toplevel --no-link --print-build-logs`,
and both configure the substituter `https://claude-code.cachix.org` with the
pinned trusted public key. The pre-merge job keeps the inherited
`timeout-minutes: 30`; the post-merge job carries `timeout-minutes: 120`,
sized against the cold from-source build these findings describe (a too-tight
cap on main reddens origin/main rather than just blocking a PR).

Date: 2026-07-23. Nix 2.24.11. All numbers below are a **LOCAL data point** from
this sandboxed session's machine and store state — **not** a CI baseline. CI runs
on a cold `ubuntu-latest` runner with a different substituter reach; treat CI
timing as still-unmeasured until real runs accumulate (see "Next step").

## What the build actually does

`nix build --dry-run` on the toplevel resolves to **13–15 derivations that must be
built** (the count varied 15 → 13 between back-to-back runs as intermediates got
realized locally), and — critically — **zero "will be fetched" paths**. The base
nixpkgs closure was already realized in this machine's local `/nix/store`, so the
only work left is the repo's *own* derivations:

- `wezterm-0-unstable-<pin>` — WSL wezterm **built from source via cargo** (Rust)
- `wezterm-windows-<pin>` — the matching Windows nightly artifact
- `home-manager-path`, `home-manager-files`, `home-manager-generation`
- `user-environment`, `activation-script`, `system-units`, `etc`, `activate`
- `wezterm-mux-server.service`, `unit-home-manager-n8.service`, `hm_*` fragments
- `nixos-system-nixos-<version>` (the toplevel)

### Dominant cost: wezterm compiled from source

`nix/home/wezterm-package.nix` overrides nixpkgs' `wezterm` `src`/`cargoDeps` to
the pinned nightly commit (`nix/home/wezterm-pin.nix`) so the WSL mux server and
the Windows GUI speak the same PDU protocol. Because `src` is overridden to a
non-nixpkgs commit, **the cargo build cannot be served by `cache.nixos.org`** —
nixpkgs' binary cache only has *its own* pinned wezterm snapshot, not this repo's
override. So wezterm is a full-source Rust compile on every cold build. In the
local run, wezterm was the derivation that dominated wall time (all the
home-manager/system derivations are cheap file/closure assembly by comparison);
the build was still in wezterm's compile phase well past the point every other
derivation would have finished. **wezterm-from-source is the long pole.**

## Local timing

**The local build did not complete within this session's budget** and there is
**no local wall-clock total** to report. `.github/scripts/build-nixos-config.sh`
(equivalently `nix build …#nixosConfigurations.nixos.config.system.build.toplevel
--no-link --print-build-logs`) was run on this machine with the base nixpkgs
closure already realized locally (dry-run: ~13–15 derivations to build, 0 to
fetch). Every non-wezterm derivation (home-manager fragments, system-units, etc,
activate, the toplevel) is cheap closure/file assembly; the run spent its entire
budget inside the **wezterm from-source cargo compile** and was stopped while
still compiling wezterm's own workspace crates — it had compiled **~470 crates**
and was on `wezterm> Compiling codec v0.1.0 (/build/source/codec)` when halted.
No "copying path … from 'https://…'" lines appeared in the build log: nothing was
substituted; everything was built locally.

Interpretation: **treat "dominant cost: wezterm-from-source" as the qualitative
finding; a quantitative wall-clock total is pending a completed run or — better —
real CI timing.** This local machine is a sandboxed single-box environment whose
compile throughput is not a CI baseline anyway (see the note at the top), so the
missing total costs little: the actionable signal is the 0% cache hit-rate and
the from-source wezterm compile, both of which are established independently of a
finish time. A cold CI runner would additionally pay to *fetch* the base closure
from `cache.nixos.org` (fast, prebuilt) on top of this same wezterm compile.

## Cache hit-rate for the repo's own outputs: 0%

This is the key finding, and it is **authoritative** (measured by direct
narinfo HTTP lookups against the cache, not inferred from a local dry-run whose
untrusted-user warning would suppress the substituter anyway).

`https://claude-code.cachix.org` is a valid, reachable binary cache
(`GET /nix-cache-info` → HTTP 200, `Priority: 41`). Querying it for the output
paths of the repo's own top-level derivations:

| derivation output | `claude-code.cachix.org/<hash>.narinfo` |
|---|---|
| `nixos-system-nixos-…` (toplevel) | **404** |
| `wezterm-0-unstable-…` | **404** |
| `home-manager-generation` | **404** |
| `home-manager-path` | **404** |
| `wezterm-windows-…` | **404** |
| `system-units` | **404** |
| `etc` | **404** |
| `activate` | **404** |

0 of 9 sampled repo outputs are present — a **0% hit-rate for this repo's own
build outputs**. The cache does not even carry common nixpkgs paths: the shared
`bash-5.3p9` store path returns **404** on `claude-code.cachix.org` but **200**
on `cache.nixos.org`. So `claude-code.cachix.org` is scoped to Claude-Code's own
derivations, not general nixpkgs, and it contributes **nothing** to this repo's
nixos build. The base closure that *does* get substituted in CI comes from the
default `cache.nixos.org`, independent of the cachix line.

This confirms the pre-established finding: **there is no `cachix push` step
anywhere in `.github/`** (verified — no push/auth step in either workflow), so
nothing warms `claude-code.cachix.org` with this repo's outputs. The
`extra-substituters` line is currently dead weight for the nixos build: it adds a
substituter that will 404 on every repo-specific path and fall through to a
local rebuild. It is harmless (a quick 404, then build) but delivers no speedup.

## Recommended next step (requires a human decision — do NOT self-serve)

**Top recommendation: add a `cachix push` step that warms the cache with this
repo's own nixos build outputs.** This is the only change that attacks the
dominant cost (wezterm-from-source): push once from a trusted run (e.g. the
post-merge `main-nix-validate` job after a successful build), and every
subsequent cold CI build — and every developer's `nixos-rebuild` — substitutes
the wezterm binary and the full toplevel closure instead of recompiling Rust.

This was **deliberately not landed in this session** because it requires a
**cachix write token / auth secret that cannot be provisioned from here**. A
human needs to:

1. Create a cachix **write token** for `claude-code.cachix.org` (or a repo-owned
   cache), then add it as a GitHub Actions secret (e.g. `CACHIX_AUTH_TOKEN`).
2. Add a push step to the build job — typically `cachix/cachix-action` with
   `name: claude-code`, `authToken: ${{ secrets.CACHIX_AUTH_TOKEN }}`, or an
   explicit `cachix push claude-code <path>` after the build — so the build's
   output closure is uploaded. The post-merge `main-nix-validate.yml` job is the
   natural place (it runs on trusted `main` pushes, not fork PRs).

Confirm the target cache is actually writable by this repo before wiring it; if
`claude-code.cachix.org` is externally owned, provision a repo-owned cache
instead and swap the substituter/key in both workflows.

### No other cheap in-session win was landed

I looked for a low-risk, no-secret win (a stray flag, redundant step, wrong
invocation). Nothing stood out as safe to change without a real CI baseline:

- The `--no-link --print-build-logs` invocation is correct and minimal.
- Removing the `extra-substituters`/`extra-trusted-public-keys` lines would be a
  *tidy-up* (they currently do nothing for this build), but they are harmless and
  become useful the moment a `cachix push` lands — removing them now would just
  have to be re-added. Left in place intentionally.
- The pre-merge `timeout-minutes: 30` guard in `unit-tests.yml` is left
  unchanged — there is no CI timing to size it against, and a pre-merge timeout
  only blocks a PR (see below).

## Timeout guard — needs real CI data

`unit-tests.yml`'s `nixos-build` and `darwin-build` jobs carry the inherited
rationale comment: the Build step has 0 logged CI executions, 30 min is a
conservative runaway guard, tighten to ~2× observed p95 once 3–5 real runs
accumulate (`#2636`; darwin cites `#1932`).

The post-merge job deviates: it uses **120 min**. The reason is the asymmetry
in what a timeout failure costs. Pre-merge, a timeout just blocks a PR. On
`origin/main` it turns the branch red, and `repo-health`'s workflow-agnostic
`gh run list --branch main` pickup then feeds the automated red-main diagnosis
path — so a cap the *normal* build can exceed produces recurring diagnosis toil
on every nix-touching merge. Since this is a documented cold, 0%-cache-hit,
from-source Rust compile (above), 30 min is not a safe cap for it; 120 min still
bounds a runaway well under GitHub's 6h default.

I have **no access to trigger or read GitHub Actions runs** from this session, so
no CI number exists yet. **Action for a human:** once the new post-merge
`main-nix-validate.yml` workflow accumulates **3–5 real runs on origin/main**,
read the `nixos-build` job durations from the Actions UI and size
`timeout-minutes` to roughly **2× the observed p95**. Do this *after* the
`cachix push` decision above, because a warmed cache changes the p95
dramatically (a warm run substitutes wezterm instead of compiling it), and the
steady-state warm-cache duration — not today's cold-rebuild-every-time
behavior — is what the tightened value should track. Note that until a push step
lands, warm-cache runs cannot accumulate at all: nothing warms the cache.

## Summary

- **Measured locally:** the nixos toplevel resolves to ~13–15 repo-specific
  derivations to build, 0 to fetch (base closure already local here). wezterm is
  compiled from source and dominates wall time.
- **Cache hit-rate for repo outputs on `claude-code.cachix.org`: 0%** (0/9
  sampled, authoritative via narinfo HTTP; cache is valid but lacks these paths
  and even lacks common nixpkgs paths like bash). No `cachix push` warms it.
- **Dominant cost:** wezterm-from-source cargo (Rust) build — cannot be served by
  `cache.nixos.org` because the `src` is overridden to a non-nixpkgs commit.
- **Recommended next step:** a human provisions a cachix write token + secret and
  adds a `cachix push` step (best on the post-merge job) so wezterm's closure is
  cached; then, after 3–5 warm runs, tighten the post-merge timeout to ~2× p95.
- **Landed alongside these findings:** the post-merge
  `.github/workflows/main-nix-validate.yml` workflow (the tactic's Unit A
  deliverable), carrying `timeout-minutes: 120` sized against the cold
  from-source build documented here. The investigation itself (Unit B) landed no
  build-performance change: the one high-value change — `cachix push` — needs a
  human-provisioned write token, and nothing else was a safe, justified win
  without a real CI baseline.
