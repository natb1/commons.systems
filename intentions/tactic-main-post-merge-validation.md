---
id: tactic-main-post-merge-validation
kind: tactic
statement: validate origin/main via a paths-filtered post-merge nixos-build
  fired only on nix-touching pushes, and investigate speeding up the ~22-minute
  nixos-build job
owner: ai
status: codified
parent: null
rationale: "Born 2026-07-23 as a human decision gate on strategy-main-health
  (wezterm-pin /align-strategy round): unit-tests.yml carries branches-ignore
  [main, graph/**], so the merge-gating suite validates pre-merge on branch
  pushes and never observes origin/main directly — external, commit-less
  breakage (the wezterm asset repackage) stays invisible until an unrelated PR
  touches the same surface. The author decided 2026-07-23 to add a
  paths-filtered post-merge nixos-build on main (fired only when nix-touching
  paths change) and to investigate speeding up the ~22-minute job. Finalized by
  a 2026-07-23 /align-tactics per-node pass: Unit A needs no explicit
  main-health wiring (repo-health's workflow-agnostic gh run list --branch main
  pickup is already automatic), and the draft's strategy-token-economy trade-off
  claim is corrected to a general cost-awareness framing rather than a formal
  signal edge — both details recorded in the finalized plan body."
reading: null
gap: null
serves:
  - strategy-main-health
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution:
  branch: tactic-main-post-merge-validation
  pr: 2962
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# validate origin/main via a paths-filtered post-merge nixos-build, and investigate speeding up that job

Finalized by a 2026-07-23 `/align-tactics` per-node pass. Born as a human
decision gate (2026-07-23 `/align-strategy` round on `strategy-main-health`,
wezterm-pin clarification); the author's decision below is now decomposed into
two PR-sized units with full plans, ready for a fresh `/implement-unit` session
per unit.

## Context

`strategy-main-health` (attention boost 100) exists to catch origin/main going
red. Its sensor reads GitHub check-runs / workflow-runs attached to main's HEAD
sha (`repo-health`'s `main_broken_sha()`,
`.claude/skills/dispatch-propagate/scripts/repo-health:178-201`). But today the
merge-gating jobs in `.github/workflows/unit-tests.yml` — including
`nixos-build` — are governed by a single workflow-level trigger `on: push:
branches-ignore: [main, 'graph/**']` (`unit-tests.yml:3-7`). Every one of those
fifteen jobs runs pre-merge on branch pushes only and NONE ever runs on `main`
itself. The merge commit is never rebuilt.

This produces a blind spot for breakage whose cause is external to the repo —
e.g. an upstream nix asset getting repackaged — because there is no repo commit
on a branch to trigger a pre-merge build, so nothing re-validates main. This
actually happened: the "wezterm pin" incident, where `nixos-build` went red on
every nix-touching branch while main's health reading stayed green the entire
time, until an unrelated PR happened to touch nix again.

The author (human, ratified 2026-07-23) chose to close this gap with a
**paths-filtered post-merge trigger** — explicitly NOT a `schedule:` cron (that
alternative was considered and rejected) — that runs the existing `nixos-build`
build **only when nix-touching paths change on a push to main**. That is
Unit A. Separately, Unit B investigates speeding up the job (nominally ~22
min, but it has 0 logged executions — it has never actually run to completion,
so there is no real baseline yet).

Note on cost framing: CI runner-minutes are a real but separate resource from
the Claude token budget; this change spends a bounded amount of the former.
This is general cost-awareness, not a formal trade-off against
`strategy-token-economy`'s signal (which tracks Claude/token allowance
utilization — a different resource; `intentions/strategy-token-economy.md:385-392`
has no observable tied to CI runner-minutes). The draft's original wording
overstated this connection; corrected here.

Correction to the draft's other overstatement: the draft said Unit A must
"wire a failure into the main-health signal." It does not. `main_broken_sha()`
aggregates `gh run list --branch main --commit "$sha"`
(`repo-health:192-196`), which is workflow-agnostic — ANY workflow that fires
on a push to main and fails is automatically counted, with no registration and
no explicit call to `dispatch-diagnose-main`. Discovery is tick-driven polling
(guards at `dispatch-select-tick:634` and `:862`, both
`[[ -z "$OPEN_MAIN_RED" ]]`), so there is a polling-cadence lag rather than
instant push-driven detection — identical to how existing red-main detection
already works, and fine. On a hit, `dispatch-tick:460-467` auto-spawns
`/dispatch-diagnose-main <sha>`. So Unit A is purely: add the trigger + reuse
the existing build steps. Nothing wires into main-health; that is already
automatic.

## Unit A — Post-merge nix validation trigger

**Scope.** Add a **new dedicated workflow file**,
`.github/workflows/main-nix-validate.yml`, that runs the existing nixos build
on nix-touching pushes to main.

Design decision — new file, NOT a modification of `unit-tests.yml`'s trigger,
and justification: `unit-tests.yml` has exactly ONE workflow-level `on:` block
(`unit-tests.yml:3-7`) governing all fifteen jobs. GitHub Actions triggers are
workflow-level, never job-level. Adding `main` back at that level (or via a
second `push:` entry) would fire ALL fifteen jobs on every main push — wrong.
The two real options are (a) a dedicated new workflow file scoped to just this
build, or (b) a broadened `unit-tests.yml` trigger plus an `if:` guard on each
of the other fourteen jobs to suppress them on main. Option (b) touches
fourteen jobs, is fragile (every future job must remember to add the guard),
and couples an unrelated concern into the big file. Option (a) is chosen: one
small, self-contained file, no change to any existing job.

Second design decision — do NOT reuse `detect-changes.sh` / the
`if: steps.changes.outputs.nix == 'true'` conditional inside the new workflow.
Justification: on a `push:` event to main, after checkout the fetched
`origin/main` ref equals HEAD, so `git diff --name-only origin/main...HEAD`
(`detect-changes.sh:11`) returns EMPTY (it succeeds, so the `HEAD~1` fallback
at `:13` does not engage), which sets `nix=false`, which would make the
`if:`-guarded install and build steps SKIP — silently defeating the whole
workflow. The `paths:` filter on the trigger is the correct and sufficient
gate here; the install and build steps must therefore run UNCONDITIONALLY (no
`if:`). This simplifies the reused step block: drop the "Detect changed file
categories" step and both `if:` conditions.

The new file, built by adapting the reused pieces from `nixos-build`
(`unit-tests.yml:356-381`) and the trigger shape from `functions-deploy.yml:3-9`:

- `name:` a descriptive workflow name.
- `on: push: branches: [main]` with `paths:` = exactly the nix glob list from
  `detect-changes.sh:20` (`nix/**`, `flake.nix`, `flake.lock`) PLUS the
  workflow's own path `.github/workflows/main-nix-validate.yml` (self-inclusion
  pattern, matching `functions-deploy.yml:8` — so edits to the trigger fire it
  and can be smoke-tested).
- `workflow_dispatch:` (matching `functions-deploy.yml:9`) — enables manual
  runs, which Unit B needs to gather timing and which lets a fresh session
  trigger an on-demand validation.
- `permissions: contents: read` (matches `nixos-build`, `unit-tests.yml:358-359`).
- `timeout-minutes: 30` (carry over the existing runaway guard and its
  rationale comment from `unit-tests.yml:360-364`; reference issue #2636 in
  the comment).
- One job with steps: `actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
  # v4` (fetch-depth may be left at the default — the `fetch-depth: 0` on the
  original is only needed for the dropped diff step; note this in a comment or
  simply omit the `with:` block), then
  `DeterminateSystems/nix-installer-action@d96bc962e61b3049ce8128d03d57a1144fa96539
  # main` with the SAME `extra-conf:` cache block verbatim from
  `unit-tests.yml:376-378` (`extra-substituters = https://claude-code.cachix.org`
  + the pinned `extra-trusted-public-keys`), then
  `run: .github/scripts/build-nixos-config.sh` — the exact existing build
  script, unmodified — with NO `if:` guard.

Pin all action SHAs to the exact values already used in `unit-tests.yml` (do
not float versions; this repo pins by commit sha with a version comment).

**Out of scope.** Any change to `unit-tests.yml`; any change to
`build-nixos-config.sh` or `detect-changes.sh`; the darwin build
(`darwin-build`, `unit-tests.yml:335-354` — macOS-only, different runner, not
part of this incident); any new build logic; any cachix push / cache-warming
step (that surfaces in Unit B, and is investigation-first, not a code change
here); any change to `repo-health` or the dispatch tick (main-health pickup is
already automatic).

**Recommended model.** `sonnet`. Both design decisions (dedicated file; drop
the conditional) are made and justified above, the reused fragments are quoted
exactly, and the remaining work is rote assembly of a small YAML file from
known-good templates. The one subtlety (unconditional steps, no `if:`) is
called out explicitly, so no implement-time judgment remains.

## Unit B — Investigate speeding up the nixos build

**Scope.** Investigation plus an optional cheap fix. There is NO real timing
baseline yet (`unit-tests.yml:360-363`: the build step has executed 0 times),
so this unit cannot promise a measured speedup — it establishes the baseline,
diagnoses the dominant cost, and lands a fix only if a cheap, low-risk win is
found. Concretely:

1. **Gather what is obtainable immediately (local).** Run `nix build
   "<repo>#nixosConfigurations.nixos.config.system.build.toplevel" --no-link
   --print-build-logs` locally, once cold and once warm, and record
   wall-clock for each. This is the same invocation as
   `build-nixos-config.sh:5`. This is a data point, not the CI baseline
   (different machine, different cache state) — label it as such.
2. **Establish whether the cachix substituter is actually warm for this
   repo's own derivations.** Critical finding from grounding: the
   `extra-substituters = https://claude-code.cachix.org` config is
   pull/substitute-only, and there is NO `cachix push` step anywhere in
   `.github/` — nothing warms the cache with this repo's own
   `nixosConfigurations.nixos` outputs. So the substituter only helps to the
   extent that cache already contains these derivations from somewhere.
   Determine the actual hit-rate: query the cache for the built store paths
   (e.g. attempt substitution / inspect `--print-build-logs` for "copying
   path … from 'https://claude-code.cachix.org'" vs. local building). If the
   repo's own nixosConfiguration is NOT cached, the leading candidate cheap
   win is adding a post-build `cachix push` step (requires an auth token /
   write key — flag this as a secret-provisioning decision for the author,
   out of scope to provision autonomously) so subsequent runs substitute
   instead of rebuild.
3. **Plan the post-Unit-A observation step (the real baseline).** Once Unit A
   merges, the first nix-touching push to main (or a manual
   `workflow_dispatch` run) produces the FIRST real CI timing data ever for
   this build. The implementer should: trigger one run (via
   `workflow_dispatch` on `main-nix-validate.yml`, or observe the next
   natural nix-touching merge), read its duration and logs from the Actions
   run, and repeat until 3-5 warm runs accumulate — matching the tightening
   criterion already written at `unit-tests.yml:362-363` ("tighten to ~2x the
   observed p95 once 3-5 real warm-cache runs accumulate"). This observation
   is asynchronous and may outlast the implementing session; record interim
   numbers in the tactic's completion record.
4. **Land a cheap win if and only if one is clearly identified** (e.g. the
   `cachix push` step above if a write key is available; or dropping the now
   unnecessary `fetch-depth: 0`; or trimming the timeout toward ~2x observed
   p95 once data exists). If no cheap, low-risk win is found, do NOT force a
   speculative change — write the findings (local timings, cache hit-rate,
   dominant cost, recommended next step and its prerequisite) into the
   tactic's completion record and close the investigation there.

**Out of scope.** Any large refactor of the nix build itself; provisioning
secrets/auth tokens (surface as an author decision); changing the build's
semantics or what it builds; speculative optimizations without a measured
cause.

**Recommended model.** `opus`. This is judgment-heavy: the plan deliberately
leaves decisions for implement time (is the cache warm? is there a cheap win?
is a `cachix push` step worth its secret-provisioning cost?), the subsystem
(nix + cachix substitution economics) is subtle, and the deliverable is a
reasoned findings report plus a conditional fix rather than a mechanical diff.

**Dependencies.** Unit A must complete and merge first. Unit B's real CI
baseline (step 3) does not exist until Unit A's workflow has actually run on
a push to main. Steps 1-2 (local timing, cache-warmth probe) can begin
immediately in parallel, but the landable conclusion depends on Unit A's
running job.

## Reuse

- `.github/scripts/build-nixos-config.sh` — the exact reusable build script
  (`nix build …#nixosConfigurations.nixos.config.system.build.toplevel
  --no-link --print-build-logs`). Used verbatim by Unit A's build step and by
  Unit B's local timing probe. Do not modify.
- `nixos-build` job step block, `.github/workflows/unit-tests.yml:356-381` —
  source of the checkout sha, the `nix-installer-action` sha, the
  `extra-conf:` cache block (`:376-378`), the `timeout-minutes: 30` guard, and
  its rationale comment (`:360-363`, issue #2636).
- `.github/workflows/functions-deploy.yml:3-9` — the `push: branches: [main]`
  + `paths:` + workflow-self-inclusion + `workflow_dispatch:` trigger
  template. `.github/workflows/firestore-deploy.yml:3-9` is the same shape
  without `workflow_dispatch`; prefer the functions-deploy variant because
  Unit B wants manual dispatch.
- The nix path glob list, `detect-changes.sh:20` — `nix/**`, `flake.nix`,
  `flake.lock` — copied into Unit A's `paths:` filter. (The script itself is
  intentionally NOT invoked by the new workflow; see Unit A's second design
  decision.)
- No new main-health wiring: `main_broken_sha()` (`repo-health:178-201`,
  workflow-agnostic `gh run list` at `:192-196`) and the auto-spawn at
  `dispatch-tick:460-467` already pick up any failing main workflow run.
  Reuse by relying on it; write nothing.

## Verification

The syntactic checks below are auto-runnable. Everything else in this system
is manual/observe-in-production — this repo has no local GitHub Actions
runner, so the trigger firing, the run's pass/fail, and the timing can only be
confirmed against real GitHub after merge.

```verify
# YAML is well-formed (adjust path if named differently)
python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/main-nix-validate.yml'))" && echo "YAML OK"
```

```verify
# Trigger sanity: the new workflow gates on push-to-main + nix paths, runs the reused build script, and carries NO detect-changes conditional on its build step
grep -q "branches: \[main\]" .github/workflows/main-nix-validate.yml && \
grep -q "flake.lock" .github/workflows/main-nix-validate.yml && \
grep -q "build-nixos-config.sh" .github/workflows/main-nix-validate.yml && \
! grep -q "steps.changes.outputs.nix" .github/workflows/main-nix-validate.yml && \
echo "trigger + steps OK"
```

Manual / observe-in-production (prose, not auto-runnable):

- **Unit A trigger fires on nix changes, not otherwise.** After merge,
  confirm via the Actions tab that `main-nix-validate` runs on the merge
  commit only when a nix path (`nix/**`, `flake.nix`, `flake.lock`) or the
  workflow file itself changed, and does NOT run on a non-nix push to main. A
  clean way to smoke-test the "fires" half without a real nix change: because
  the workflow self-includes its own path, the very commit that adds/edits
  `main-nix-validate.yml` on main should itself trigger one run — watch for
  it.
- **Unit A build actually executes (not skipped).** In that first run's
  logs, confirm the "Build nixosConfigurations.nixos" step RAN and printed
  the `build-nixos-config.sh` output (`=== nix build … ===` / `PASS: …`),
  i.e. it was not skipped — this is the specific failure mode the "no `if:`
  conditional" decision guards against.
- **Unit A red-main pickup (end-to-end, external-breakage scenario).** The
  definitive test is the wezterm-pin class of event: if the upstream nix
  asset breaks with no repo commit, the next nix-touching push to main (or a
  `workflow_dispatch` run) should go red, and — via the already-automatic
  path (`main_broken_sha` → tick poll → `dispatch-diagnose-main`) — a
  `tactic-main-red-<shortsha>` node should subsequently appear under
  `strategy-main-health`. This is polling-cadence-lagged, not instant; that
  is expected. No code verifies this; observe it in production or reason it
  through against `repo-health:192-196`.
- **Unit A local pre-merge confidence** (optional, before merge): run `nix
  build "<repo-root>#nixosConfigurations.nixos.config.system.build.toplevel"
  --no-link` locally to confirm the target the workflow will build currently
  builds green, so the first CI run is a clean baseline rather than an
  immediate (unrelated) red.
- **Unit B baseline.** Record local cold/warm `nix build` wall-clock and the
  cache hit-rate finding. After Unit A merges, trigger `main-nix-validate`
  via `workflow_dispatch` and read the run duration from the Actions UI;
  repeat until 3-5 warm runs exist, then compare against the ~22 min figure
  and against the `timeout-minutes` guard. Capture all numbers, the
  cache-warmth conclusion, and any landed cheap win (or the reasoned decision
  not to) in the tactic's completion record.

## needs-main residue

`/qa-fix` ran all 11 script-verifiable checks in the QA plan (YAML validity,
trigger shape, action-sha parity with `nixos-build`, no `if:` conditional,
build-script invocation, permissions) — all PASS. The remaining 3 plan items
are documented planned deferrals (this tactic's own Verification section
already says so) that require observing `origin/main` post-merge; they are
not fixable now and are handed to `tactic-main-qa-phase`:

- **id 12 — Self-inclusion smoke test: workflow fires on its own merge commit**
  - URL path: N/A
  - Expected outcome: the first real `main-nix-validate` run is the merge
    commit that introduces the workflow (the workflow self-includes its own
    path in the `paths:` filter).
  - Finding: cannot be confirmed pre-merge; verify via the Actions tab on
    `origin/main` after this PR merges.

- **id 13 — Build step actually executes (not skipped) on a real run**
  - URL path: N/A
  - Expected outcome: the `Build nixosConfigurations.nixos` step runs to
    completion (not skipped) on that first run, establishing a real timing
    baseline (0 logged executions today).
  - Finding: cannot be confirmed pre-merge; verify by reading that run's job
    log on `origin/main`.

- **id 14 — Red-main pickup path works end-to-end on a future nix-touching push**
  - URL path: N/A
  - Expected outcome: a genuine main breakage (the wezterm-pin class of
    incident) is detected by this workflow and flows into
    `strategy-main-health`'s existing, workflow-agnostic `main_broken_sha()`
    sensor with no extra wiring.
  - Finding: requires a future failing nix build on `origin/main` to exercise
    end-to-end; not assertable at merge time.
