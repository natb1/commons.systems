---
id: tactic-subagent-cwd-worktree-guard
kind: tactic
statement: Guarantee phase-skill subagents write to the launching worktree, not
  the primary checkout — pin the implementation-subagent prompt contract to
  absolute worktree paths and add a post-subagent contamination guard
owner: ai
status: codified
parent: null
rationale: "Surfaced 2026-07-19 during a /implement run of
  tactic-otel-sensor-substrate: the Unit 1 implementation subagent (launched via
  the Agent tool from /implement-unit inside the tactic worktree) inherited a
  cwd of the PRIMARY checkout, so its relative-path Write landed in
  ~/natb1/commons.systems instead of the worktree, leaving the worktree with a
  clean git status (silent work loss) and requiring manual detection and
  relocation. The dispatch execution model has the main thread never edit files
  (it delegates every change to a subagent), so this drift silently loses the
  entire unit. The violated invariant is recorded as a 2026-07-19 clarification
  on strategy-graph-native-dispatch; this tactic carries the fix. Distinct from
  tactic-primary-checkout-main-guard (keeps the primary checkout ON main); this
  keeps subagent WRITES OUT of it."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 90
  override: null
  rationale: "Author-directed 2026-07-23: boost to top ranking. This node carries
    the seed half of the 2026-07-23 manual-dispatch-tick failure. An abandoned
    earlier draft of tactic-main-health-signal-attribution's unit-1 edit to
    .claude/skills/dispatch-propagate/scripts/repo-health was left uncommitted
    in the primary checkout while the unit itself was redone correctly on the
    tactic branch as d5786bdc; that single out-of-node-set file then blocked
    every graph write in the tick via graph-commit's assert_clean_outside_ids.
    Sized at 90, which composes to 95.33 with the boost 5 inherited from
    strategy-graph-native-dispatch, placing it above the live discretionary
    composed max (90.33, tactic-graph-router-live-worker-read-robust) and below
    the strategy-main-health ceiling (100, author-override-guarded), which it
    does not displace. Paired with tactic-graph-write-failure-rollback, which
    carries the amplifier half of the same incident."
phase: qa
execution:
  branch: tactic-subagent-cwd-worktree-guard
  pr: 2957
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Guarantee phase-skill subagents write to the launching worktree, not the primary checkout

## Context

The graph-native dispatch execution model has the **main thread never edit
files** — every code change in a phase skill is delegated to a subagent
(`.claude/skills/implement/SKILL.md`: "The main thread never edits files";
`.claude/skills/implement-unit/SKILL.md` Step 1 launches the implementation
subagent via the Agent tool). That contract carries an implicit, unenforced
invariant: **a subagent operates on the launching worktree, not the primary
checkout.**

The invariant fails silently. The Agent tool pins a spawned subagent's cwd at
launch to the **primary checkout** (`~/natb1/commons.systems`), not the
launching worktree. A subagent that writes via a **relative** path therefore
lands its edits in the primary checkout, while the launching worktree keeps a
**clean git status** — so the entire unit is lost with no error and no diff to
detect it.

Observed live 2026-07-19 in Unit 1 of `tactic-otel-sensor-substrate`: the
implementation subagent wrote `otel-trial-notes.md` into the primary checkout's
`.claude/skills/dispatch-token-audit/` instead of the worktree, discovered only
because the worktree's `git diff --name-only HEAD` came back empty. Recovery was
manual: `find` the stray file, Read it, Write it into the correct worktree path,
`rm` the stray from the primary checkout.

This is **distinct** from `tactic-primary-checkout-main-guard`, which keeps the
primary checkout **on `main`** (drift mechanism: a failed `git worktree add` +
chained `cd`, moving the primary checkout off main). That guards where the
primary checkout's *HEAD* points; this guards that subagent *writes* never land
in the primary checkout at all.

Two levers, both real code/doc changes (not documentation-only): the subagent
**prompt contract** (prevention) and a **post-subagent contamination guard**
(backstop). Same-repo, single-PR, backwards-compatible fix — no
greenfield/brownfield migration split is warranted.

Exactly **4** launch sites in the repo today directly launch (via the Agent
tool) a subagent that itself edits the working tree — sites that merely
delegate to a named skill like `/implement-unit` inherit whatever
`/implement-unit` does and need no separate fix:

1. `.claude/skills/implement-unit/SKILL.md:43-49` — Step 1, the main
   implementation subagent. Canonical/most-important site; hosts the
   fully-written recipe other sites reference.
2. `.claude/skills/implement-unit/SKILL.md` Step 3, "Merge conflict" bullet
   (~lines 125-134) — launches an `opus` subagent to resolve a merge conflict
   in the working tree.
3. `.claude/skills/implement-unit/SKILL.md` Step 3, "Pre-commit hook failure"
   bullet (~lines 149-150) — launches a `sonnet` subagent to fix a
   pre-commit-hook issue with a new commit.
4. `.claude/skills/dispatch-conflict/SKILL.md:153-172` — "Launch the opus
   subagent" (Step 5), resolving one `origin/main` merge conflict.

The guard is written so that **if the harness later pins subagent cwd to the
launching worktree**, it degrades to a cheap no-op (no contamination ever
found) rather than needing removal — and so a legitimately no-op unit (a
verify-only unit, or a primary checkout with unrelated pre-existing dirty
files) never false-fails.

## Units of work

### Unit 1 — Create the contamination-guard script

**Scope.** New executable file
`.claude/skills/dispatch-propagate/scripts/subagent-contamination-guard`
(`chmod +x`). `lib.sh` does not source `lib-graph-worktree.sh`, and the guard
must persist state to a **file** (not a shell variable — shell state does not
persist across separate Bash tool calls in this harness, and the Agent-tool
subagent launch always sits between the "before" and "after" invocations), so
it is a standalone executable that sources `lib-graph-worktree.sh` itself
rather than a `lib.sh` function. Two subcommands, `baseline <label>` and
`check <label>`, sharing a deterministic snapshot path computed identically by
both: `SNAP="$TMPDIR/contamination-$(git rev-parse --show-toplevel | tr '/' '_')-<label>.baseline"`.
Out of scope: touching `lib.sh`, `assert_primary_checkout_on_main`, or the
Agent tool itself.

Behavior:
- `baseline <label>`: `PRIMARY=$(resolve_main_worktree 2>/dev/null || true)`;
  `CUR=$(git rev-parse --show-toplevel)`. If `PRIMARY` is empty, or
  `[[ "$PRIMARY" -ef "$CUR" ]]` (we *are* the primary checkout — contamination
  is impossible; also covers a future harness fix that correctly pins subagent
  cwd), write the single line `SKIP` to `$SNAP` and exit 0. Else write
  `git -C "$PRIMARY" status --porcelain` to `$SNAP` (capturing any
  **pre-existing** dirty files as part of the baseline, so they can never trip
  the check) and exit 0.
- `check <label>`: if `$SNAP` is missing, print an error to stderr (baseline
  never ran — a wiring bug) and exit 2. If the first line is `SKIP`, exit 0
  silently. Else `AFTER=$(git -C "$(resolve_main_worktree 2>/dev/null)" status --porcelain)`;
  compute `NEW` = lines present in `AFTER` but absent from the baseline via
  `comm -13 <(sort "$SNAP") <(sort <<<"$AFTER")`. Empty `NEW` → exit 0 (clean).
  Non-empty `NEW` → print a labeled block to stderr, modeled on
  `assert_primary_checkout_on_main`'s framing (`lib.sh:1762-1764`):
  `subagent-contamination-guard: INVARIANT VIOLATED — subagent writes landed
  in the primary checkout '<PRIMARY>' instead of the launching worktree
  '<CUR>'. Contaminating paths:` followed by the `NEW` lines, then a
  `  Repair:` line instructing the operator to manually move each listed file
  into the launching worktree and re-run the unit — **never** auto-relocate
  (`.claude/rules/code-style.md`: clear errors over defensive fallbacks; same
  "prevent at source, fail loudly, never auto-correct" shape as
  `assert_primary_checkout_on_main`). Exit 1.
- `set -euo pipefail`; guard `resolve_main_worktree` calls with `|| true`
  where an empty result is expected (no primary checkout resolvable) so
  `set -e` doesn't kill the script.

**Recommended model:** sonnet (fully-specified script).
**Dependencies:** none.

### Unit 2 — Test the contamination-guard script

**Scope.** New file
`.claude/skills/dispatch-propagate/scripts/test-subagent-contamination-guard.sh`,
modeled on `test-primary-checkout-guard.sh` (sources `test-helpers.sh` for
`assert_eq`/`assert_contains`/`report_results`/`TOTAL`/`PASS`/`FAIL`; builds a
throwaway git repo under `mktemp -d` with a `trap ... EXIT` cleanup). Set
`DISPATCH_GRAPH_MAIN_WORKTREE` to point `resolve_main_worktree` at a fake
primary checkout, and set `TMPDIR` to the test's own temp dir. Out of scope:
editing the guard itself.

Cases:
1. **SKIP path** — baseline when the launching worktree *is* the primary →
   `check` exits 0 silently.
2. **Clean** — primary dirty-free at baseline, no new files at check → exit 0.
3. **Contamination** — create a new dirty file in the primary checkout
   between `baseline` and `check` → `check` exits 1, stderr contains
   `INVARIANT VIOLATED`, the new path, and `Repair:`.
4. **Pre-existing dirty tolerated** — primary already has an unrelated dirty
   file at baseline time, unchanged at check time → exit 0 (no false
   positive).
5. **Missing baseline** — `check` with no prior `baseline` call → exit 2.

**Recommended model:** sonnet.
**Dependencies:** Unit 1.

### Unit 3 — Prompt contract + guard wiring at implement-unit Step 1 (canonical host)

**Scope.** `.claude/skills/implement-unit/SKILL.md` Step 1, lines 43-49 only
(not the firestore/Explore sub-bullets at 50-82, not other steps). Add, into
the constraints already folded into the implementation-subagent prompt, the
canonical absolute-worktree-path recipe — this site hosts the full wording;
Unit 4's sites reference it rather than restating it. The skill computes
`WT=$(git rev-parse --show-toplevel)` in its own shell (the orchestrating
session's cwd is correctly the worktree — only the *subagent's* cwd drifts)
and folds this into the subagent prompt:

> "The launching worktree root is `<WT>`. Your working directory may be
> pinned to a different checkout. EVERY Read/Write/Edit path you use MUST be
> absolute and MUST begin with `<WT>` — never relative, never outside it. A
> relative path can silently land your edit in the wrong checkout and lose
> the entire unit."

Guard wiring — one Bash call before the Agent-tool launch:

```bash
.claude/skills/dispatch-propagate/scripts/subagent-contamination-guard baseline impl-step1
```

and one Bash call after the subagent returns, before Step 2's
commit-merge-push:

```bash
.claude/skills/dispatch-propagate/scripts/subagent-contamination-guard check impl-step1
```

Document that a non-zero `check` is a loud stop: do not proceed to Step 2, do
not attempt auto-relocation — follow the printed `Repair:` line (manually
relocate the listed files into the worktree, then re-run the unit).

**Recommended model:** opus (canonical instruction site; the prompt wording is
load-bearing for every other planned unit that runs through `/implement-unit`).
**Dependencies:** Unit 1.

### Unit 4 — Wire the remaining 3 launch sites

**Scope.** The 3 remaining sites, each getting the one-line absolute-path
prompt clause plus a `baseline`/`check` pair with its own distinct label,
referencing Unit 3's recipe rather than restating it in full:

- `.claude/skills/implement-unit/SKILL.md` Step 3, "Merge conflict" bullet
  (~lines 125-134) — label `impl-merge`.
- `.claude/skills/implement-unit/SKILL.md` Step 3, "Pre-commit hook failure"
  bullet (~lines 149-150) — label `impl-precommit`.
- `.claude/skills/dispatch-conflict/SKILL.md:153-172` (Step 5, "Launch the
  opus subagent") — label `dispatch-conflict`.

Prompt clause at each site: "The launching worktree root is `<WT>` (from
`git rev-parse --show-toplevel`); use ONLY absolute paths under it for every
Read/Write/Edit — see implement-unit Step 1 for the full contract." Wrap each
launch with `subagent-contamination-guard baseline <label>` before and
`check <label>` after, same shape as Unit 3. Out of scope: sites that merely
delegate to `/implement-unit` — they inherit Unit 3's fix.

**Recommended model:** sonnet (rote wiring following Unit 3's established
pattern).
**Dependencies:** Units 1 and 3.

## Alternatives considered

- **"Fix it upstream in the harness, don't work around it."** The rival
  framing: the real defect is the Agent tool pinning subagent cwd to the
  primary checkout; patching our skills is a workaround. **Diverged:** the
  harness cwd behavior is not ours to change, and the silent-loss risk is
  **live now** — every phase skill that delegates edits is exposed on every
  tick. Worth an upstream report in parallel, but that does not gate this fix.
  (The degrade-to-no-op design means a future upstream fix costs us nothing.)

## Reuse

- `resolve_main_worktree` —
  `.claude/skills/dispatch-propagate/scripts/lib-graph-worktree.sh:27` (honors
  `DISPATCH_GRAPH_MAIN_WORKTREE`; call as `resolve_main_worktree 2>/dev/null`).
- `assert_primary_checkout_on_main` —
  `.claude/skills/dispatch-propagate/scripts/lib.sh:1749` — reuse only its
  error/framing shape ("prevent at source, fail loudly, never auto-correct");
  do not modify this function.
- `test-primary-checkout-guard.sh` + `test-helpers.sh` —
  `.claude/skills/dispatch-propagate/scripts/` — test scaffold to model Unit
  2 on.
- `.claude/skills/implement/SKILL.md` — "the main thread never edits files"
  (the delegation contract this invariant underwrites).
- Prior art, do not call or modify: `assert_clean_outside_ids` —
  `packages/intentionsutil/scripts/graph-commit:975-1010` (a different,
  unrelated pre-flight check — compares `git status --porcelain` against an
  expected node-id file allowlist; noted only as precedent for "diff porcelain
  status against a baseline").
- `tactic-primary-checkout-main-guard` (completed, pruned from the tree in
  `10cffcdd`) — the sibling primary-checkout invariant (keeps it on `main`,
  landed via `assert_primary_checkout_on_main` above); this tactic is
  distinct — it keeps subagent *writes* out of the primary checkout, not its
  `HEAD`.

## Verification

```verify
bash .claude/skills/dispatch-propagate/scripts/test-subagent-contamination-guard.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-primary-checkout-guard.sh
```

```verify
test -x .claude/skills/dispatch-propagate/scripts/subagent-contamination-guard && echo OK
```

Manual/behavioral:
1. In a real worktree, run `subagent-contamination-guard baseline impl-step1`,
   then manually `touch` a file inside the primary checkout, then run
   `subagent-contamination-guard check impl-step1` — confirm it prints
   `INVARIANT VIOLATED`, the touched path, and `Repair:`, and exits non-zero.
2. Repeat with no intervening write — confirm silent exit 0.
3. Dirty the primary checkout **before** `baseline`, leave it unchanged,
   run `check` — confirm exit 0 (no false positive on pre-existing dirt).
4. Read all 4 edited call sites and confirm each subagent launch is
   bracketed by a matching `baseline`/`check` pair with a distinct label, and
   that each carries the absolute-worktree-path prompt clause.
