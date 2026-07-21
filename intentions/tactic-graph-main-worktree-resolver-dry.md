---
id: tactic-graph-main-worktree-resolver-dry
kind: tactic
statement: "Extract the duplicated main-checked-out-worktree resolver into a
  shared lib.sh helper. The awk one-liner `git worktree list --porcelain | awk
  '/^worktree /{wt=substr($0,10)} /^branch refs\\/heads\\/main$/{print wt;
  exit}'` (resolve the project root = the worktree with `main` checked out) is
  copy-pasted verbatim across four files added/edited by
  tactic-graph-router-selector: .claude/hooks/worktree-create.sh,
  .claude/skills/dispatch-propagate/scripts/dispatch-graph-execute,
  .claude/skills/dispatch-propagate/scripts/provision-node-worktree, and
  .claude/skills/dispatch-propagate/scripts/graph-select-target. Introduce one
  helper (e.g. resolve_main_worktree in lib.sh, honoring the
  DISPATCH_GRAPH_MAIN_WORKTREE test override where the two execute/provision
  scripts already do) and replace the four copies. Low-severity DRY cleanup; no
  behavior change."
owner: ai
status: codified
parent: null
rationale: "Deferred review finding from the tactic-graph-router-selector
  terminal review during the 2026-07-07 graph-native router tick. Deferred
  low-severity finding from the tactic-graph-router-selector terminal review (PR
  #2785, merged 9a50fe47). Not blocking — armed and merged clean. The
  project-root resolver `git worktree list --porcelain | awk '/^worktree
  /{wt=substr($0,10)} /^branch refs/heads/main$/{print wt; exit}'` appears
  verbatim in four files: - .claude/hooks/worktree-create.sh (node lane) -
  .claude/skills/dispatch-propagate/scripts/dispatch-graph-execute (with
  DISPATCH_GRAPH_MAIN_WORKTREE override) -
  .claude/skills/dispatch-propagate/scripts/provision-node-worktree (with
  DISPATCH_GRAPH_MAIN_WORKTREE override) -
  .claude/skills/dispatch-propagate/scripts/graph-select-target (NATIVE_ROOT
  resolution) Extract to a single sourceable helper in lib.sh (or a small
  lib-graph-worktree.sh) so the override handling and the awk parse live in one
  place. graph-select-target and the two execute-path scripts already source
  lib-reservation-ledger.sh which sources lib.sh, so the helper is reachable;
  worktree-create.sh sources it directly if needed. Prefer clear errors on an
  unresolvable root (matches the existing per-site error messages). Pure
  refactor — the router.test.ts and test-dispatch-scripts.sh integration cases
  must stay green."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: qa
execution:
  branch: tactic-graph-main-worktree-resolver-dry
  pr: 2916
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

# Extract the duplicated main-checked-out-worktree resolver into a shared lib.sh helper. The awk one-liner `git worktree l

Deferred low-severity finding from the tactic-graph-router-selector terminal review (PR #2785, merged 9a50fe47). Not blocking — armed and merged clean.

The project-root resolver `git worktree list --porcelain | awk '/^worktree /{wt=substr($0,10)} /^branch refs/heads/main$/{print wt; exit}'` appears verbatim in four files:
- .claude/hooks/worktree-create.sh (node lane)
- .claude/skills/dispatch-propagate/scripts/dispatch-graph-execute (with DISPATCH_GRAPH_MAIN_WORKTREE override)
- .claude/skills/dispatch-propagate/scripts/provision-node-worktree (with DISPATCH_GRAPH_MAIN_WORKTREE override)
- .claude/skills/dispatch-propagate/scripts/graph-select-target (NATIVE_ROOT resolution)

Extract to a single sourceable helper in lib.sh (or a small lib-graph-worktree.sh) so the override handling and the awk parse live in one place. graph-select-target and the two execute-path scripts already source lib-reservation-ledger.sh which sources lib.sh, so the helper is reachable; worktree-create.sh sources it directly if needed. Prefer clear errors on an unresolvable root (matches the existing per-site error messages). Pure refactor — the router.test.ts and test-dispatch-scripts.sh integration cases must stay green.

## Context

`tactic-graph-router-selector` (PR #2785) introduced the "resolve the project
root = the worktree with `main` checked out" awk one-liner independently at
four call sites, with three subtly different variants: two sites
(`dispatch-graph-execute`, `provision-node-worktree`) honor a
`DISPATCH_GRAPH_MAIN_WORKTREE` test override before falling back to the awk
parse; `worktree-create.sh` has no override and hard-errors on failure with
its own message; `graph-select-target` has no override and soft-falls-back to
`$REPO_ROOT` on failure instead of erroring. This finding was deferred as
low-severity/non-blocking at the time. This session (2026-07-19) re-verified
against the current worktree: the duplication is still present verbatim in
all four files, and no other in-flight or landed node supersedes or deletes
any of the four files, so the cleanup is still live.

**Fresh finding this session** (a record-completeness gap the original
deferred review missed): the original review text says "graph-select-target
and the two execute-path scripts already source lib-reservation-ledger.sh
which sources lib.sh, so the helper is reachable" — this is only true for
`graph-select-target` and `dispatch-graph-execute`. `provision-node-worktree`
currently sources **nothing** (confirmed by grep: no `source` line anywhere in
the file). The plan below accounts for this — `provision-node-worktree` gets
its own new `source` line, not a free ride via an existing include.

**Test-fixture consequence** (also newly surfaced this session):
`.claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh`
copies `dispatch-graph-execute`'s sourced libs into an isolated tmp dir by
**explicit filename** (`lib-reservation-ledger.sh`, `lib.sh`,
`lib-claude-agents.sh` — not a glob; see lines 51-54). Adding a `source` line
for a new lib file to `dispatch-graph-execute` without also adding a matching
`cp` line in that test file will break every case in
`test-dispatch-graph-execute.sh` (the sourced-but-missing file makes
`resolve_main_worktree` an undefined function, so every invocation of the
copied SUT fails). `test-dispatch-scripts.sh`'s `graph-select-target` fixture
(around line 30436) already copies via a `lib-*.sh` glob, so it needs no
edit. Neither `provision-node-worktree` nor `worktree-create.sh` has any
script-level test harness that exercises their real resolver logic today (the
former is stubbed wholesale in `test-dispatch-graph-execute.sh`; the latter is
only mentioned in a comment) — their edits have no automated safety net and
must be verified by hand (see Verification).

**Amendment (2026-07-19, same session, post-landing self-review via an
independent opus verification pass — whole-node reconciliation per the
skill's amendment-completeness bar, not a formal re-evaluation trigger):**
this plan originally landed with a `set -e` defect and a stderr-suppression
inconsistency. Both are corrected below.

- **`set -e` defect (real; fixed in the Scope below).**
  `worktree-create.sh` runs `set -euo pipefail` — it has `-e` — while the
  other three sites run `set -uo pipefail` (no `-e`). A bare
  `PROJECT_ROOT=$(resolve_main_worktree)` returns exit 1 on failure (from
  `resolve_main_worktree`'s own `[[ -n "$wt" ]] || return 1`), and under
  `set -e` that failing assignment aborts the script immediately — **before**
  reaching the existing `worktree-create.sh:105-106` hard-error block, so the
  specific `$BRANCH`-naming error message is silently replaced by a generic
  ERR-trap message instead of being "preserved exactly" as the original plan
  claimed. Only `worktree-create.sh`'s call site needs the fix (see Scope);
  the other three sites have no `-e` and are unaffected.
- **stderr-suppression inconsistency (real; fixed in the Scope below).** The
  original helper hardcoded `2>/dev/null` on the `git worktree list` call
  inside `resolve_main_worktree` itself. Two of the four original sites
  (`dispatch-graph-execute`, `provision-node-worktree`) already redirected
  that way; the other two (`worktree-create.sh`, `graph-select-target`) did
  not, so hardcoding it inside the helper would have silently suppressed
  git's stderr (e.g. a corrupt-worktree-registry warning) at those two sites
  that previously surfaced it. Fixed by removing the redirect from
  **inside** the function entirely and instead redirecting at the two call
  sites that want it — `resolve_main_worktree 2>/dev/null` — via bash's
  ordinary per-invocation stderr redirection (redirecting a function call's
  fd 2 redirects everything the function's body writes to stderr, including
  the `git`/`awk` pipeline inside it). This preserves each site's exact
  original stderr behavior with no added parameter or branching in the
  helper. See the corrected helper body and the four call sites below.

## Unit 1 — Extract `resolve_main_worktree` and replace the four call sites

**Recommended model:** sonnet — well-specified mechanical refactor with a
clear diff shape at each of five known files; no design judgment calls left
open.

**Dependencies:** none.

### Scope

**New file** `.claude/skills/dispatch-propagate/scripts/lib-graph-worktree.sh`
— a small sourceable helper, matching the header-comment and naming
convention of sibling files `lib-reservation-ledger.sh` / `lib-claude-agents.sh`
/ `lib-decision-log.sh` in the same directory. Contents:

```bash
#!/usr/bin/env bash
# lib-graph-worktree.sh — sourceable helper: resolve the worktree with `main`
# checked out (substrate clarification 23: the graph-native project root).
#
# resolve_main_worktree [<git-dir>]
#   <git-dir> optional — run `git -C <git-dir> worktree list` instead of
#   relying on cwd already being inside the repo (graph-select-target passes
#   $REPO_ROOT since it may run from outside a worktree cwd; the other three
#   call sites omit it, relying on their own cwd).
#
# Honors DISPATCH_GRAPH_MAIN_WORKTREE, the shared test override, ahead of the
# real git worktree parse.
#
# Prints the resolved path on stdout and returns 0, or prints nothing and
# returns 1 if no worktree has `main` checked out. Never exits the caller's
# shell and does no existence (`-d`) check — each call site keeps its own
# existence check and its own error message, since those differ per site
# (hard error vs. soft fallback) and that difference is preserved, not fixed,
# by this refactor.
#
# Does NOT redirect its own stderr — the `git worktree list` call's stderr is
# left to inherit the caller's fd 2 normally. Two of the four call sites want
# it suppressed (they did before this refactor too); they redirect at the
# call site with `resolve_main_worktree 2>/dev/null` instead of this function
# hardcoding it, so the other two sites keep seeing git's stderr exactly as
# they did before this refactor.
resolve_main_worktree() {
  local git_dir="${1:-}"
  if [[ -n "${DISPATCH_GRAPH_MAIN_WORKTREE:-}" ]]; then
    printf '%s\n' "$DISPATCH_GRAPH_MAIN_WORKTREE"
    return 0
  fi
  local list wt
  if [[ -n "$git_dir" ]]; then
    list=$(git -C "$git_dir" worktree list --porcelain)
  else
    list=$(git worktree list --porcelain)
  fi
  wt=$(awk '/^worktree /{wt=substr($0,10)} /^branch refs\/heads\/main$/{if(!f){print wt; f=1}}' <<<"$list")
  [[ -n "$wt" ]] || return 1
  printf '%s\n' "$wt"
}
```

The awk program is copied byte-for-byte from the existing call sites (the
`if(!f){print wt; f=1}` first-match-only form already in use at all four
sites today — not the `{print wt; exit}` form quoted in this tactic's
`statement` field, which is a stale paraphrase from the original deferred
finding; verify against the live files before treating the `statement` field
as authoritative).

**Edit** `.claude/hooks/worktree-create.sh` — this file currently sources
nothing, and unlike the other three sites it runs `set -euo pipefail` (has
`-e`) — this matters for the replacement below. Add, near the top after the
`set -euo pipefail` line (`worktree-create.sh:38`, immediately after the
existing shell-options line and before the `WORKTREE_REGISTERED=0` variable
block):

```bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/../skills/dispatch-propagate/scripts/lib-graph-worktree.sh"
```

(Path is relative to `.claude/hooks/`, three levels up from
`.claude/skills/dispatch-propagate/scripts/`.)

Then replace `worktree-create.sh:103-104`:

```bash
  PROJECT_ROOT=$(git worktree list --porcelain \
    | awk '/^worktree /{wt=substr($0,10)} /^branch refs\/heads\/main$/{if(!f){print wt; f=1}}')
```

with:

```bash
  PROJECT_ROOT=$(resolve_main_worktree) || PROJECT_ROOT=""
```

**Do not write this as a bare `PROJECT_ROOT=$(resolve_main_worktree)`.** This
file runs `set -euo pipefail`; `resolve_main_worktree` returns exit 1 on
failure, and a bare assignment's failure aborts the script under `-e` before
the line-105 hard-error check ever runs, silently replacing the specific
`$BRANCH`-naming error message with a generic ERR-trap message. The
`|| PROJECT_ROOT=""` clause absorbs the failure so control reaches the
existing check below unchanged. (The other three sites below assign without
this guard deliberately — they run `set -uo pipefail` with no `-e`, so a
failing assignment there just leaves `PROJECT_ROOT`/`NATIVE_ROOT` empty and
falls through to their own checks; do not add `|| PROJECT_ROOT=""` at those
sites, it would be a no-op but is unnecessary noise inconsistent with their
existing style.)

Leave `worktree-create.sh:105-106` (the `[ -n "$PROJECT_ROOT" ] || { ... exit 1; }`
hard-error block, with its `worktree-create`-specific message naming
`$BRANCH`) unchanged — that per-site error message is now genuinely preserved
exactly, including on the failure path.

**Edit**
`.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute` — add a
source line immediately after the existing
`source "$SCRIPT_DIR/lib-reservation-ledger.sh"` at line 77:

```bash
# shellcheck source=/dev/null
source "$SCRIPT_DIR/lib-graph-worktree.sh"
```

Then replace `dispatch-graph-execute:84-91`:

```bash
# Project root = the worktree with `main` checked out (substrate clarification
# 23). DISPATCH_GRAPH_MAIN_WORKTREE is the test override, authoritative.
if [[ -n "${DISPATCH_GRAPH_MAIN_WORKTREE:-}" ]]; then
  PROJECT_ROOT="$DISPATCH_GRAPH_MAIN_WORKTREE"
else
  PROJECT_ROOT=$(git worktree list --porcelain 2>/dev/null \
    | awk '/^worktree /{wt=substr($0,10)} /^branch refs\/heads\/main$/{if(!f){print wt; f=1}}')
fi
```

with:

```bash
# Project root = the worktree with `main` checked out (substrate clarification
# 23). resolve_main_worktree honors DISPATCH_GRAPH_MAIN_WORKTREE, the test
# override.
PROJECT_ROOT=$(resolve_main_worktree 2>/dev/null)
```

The `2>/dev/null` on the call (not inside the helper) matches this site's
original `git worktree list --porcelain 2>/dev/null` redirect exactly.

Leave `dispatch-graph-execute:92-95` (the `-z`/`! -d` hard-error check and its
message) unchanged.

**Edit**
`.claude/skills/dispatch-propagate/scripts/provision-node-worktree` — this
file sources nothing today (confirmed by grep — do not assume it inherits
`lib-reservation-ledger.sh`). Add, immediately after the existing
`SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"` at line 44:

```bash
# shellcheck source=/dev/null
source "$SCRIPT_DIR/lib-graph-worktree.sh"
```

Then replace `provision-node-worktree:57-65`:

```bash
# Project root = the worktree with `main` checked out (substrate clarification
# 23: `main` is checked out at the project root). DISPATCH_GRAPH_MAIN_WORKTREE
# is the test override, authoritative when set.
if [[ -n "${DISPATCH_GRAPH_MAIN_WORKTREE:-}" ]]; then
  PROJECT_ROOT="$DISPATCH_GRAPH_MAIN_WORKTREE"
else
  PROJECT_ROOT=$(git worktree list --porcelain 2>/dev/null \
    | awk '/^worktree /{wt=substr($0,10)} /^branch refs\/heads\/main$/{if(!f){print wt; f=1}}')
fi
```

with:

```bash
# Project root = the worktree with `main` checked out (substrate clarification
# 23: `main` is checked out at the project root). resolve_main_worktree
# honors DISPATCH_GRAPH_MAIN_WORKTREE, the test override, when set.
PROJECT_ROOT=$(resolve_main_worktree 2>/dev/null)
```

The `2>/dev/null` on the call (not inside the helper) matches this site's
original `git worktree list --porcelain 2>/dev/null` redirect exactly.

Leave `provision-node-worktree:66-69` (the `-z`/`! -d` hard-error check and
its message) unchanged.

**Edit**
`.claude/skills/dispatch-propagate/scripts/graph-select-target` — add a
source line alongside the existing ones, immediately after
`source "$SCRIPT_DIR/lib-claude-agents.sh"` at line 71:

```bash
# shellcheck source=/dev/null
source "$SCRIPT_DIR/lib-graph-worktree.sh"
```

Then replace `graph-select-target:179-180`:

```bash
NATIVE_ROOT=$(git -C "$REPO_ROOT" worktree list --porcelain \
  | awk '/^worktree /{wt=substr($0,10)} /^branch refs\/heads\/main$/{if(!f){print wt; f=1}}')
```

with:

```bash
NATIVE_ROOT=$(resolve_main_worktree "$REPO_ROOT")
```

Leave `graph-select-target:181` (`NATIVE_ROOT="${NATIVE_ROOT:-$REPO_ROOT}"`,
the soft-fallback — the one site of the four that does NOT hard-error)
unchanged. This site never checks `resolve_main_worktree`'s exit status; the
parameter-expansion fallback on the empty-string output preserves today's
behavior exactly.

**Edit**
`.claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh` —
add a fourth `cp` line at line 54 (immediately after the existing
`cp "$SCRIPT_DIR/lib-claude-agents.sh" "$SUT_DIR/lib-claude-agents.sh"`):

```bash
cp "$SCRIPT_DIR/lib-graph-worktree.sh" "$SUT_DIR/lib-graph-worktree.sh"
```

Required because `dispatch-graph-execute` will now `source` this file, and
this test's harness comment ("copy the SUT and its sourced libs") already
states the intent — it just needs the new file added to the enumerated list.
Without this line every case in this test file breaks (see Context, above).

**Out of scope:** `test-dispatch-scripts.sh`'s `graph-select-target` fixture
(the `cp "$SCRIPT_DIR"/graph-select-target "$SCRIPT_DIR"/lib.sh
"$SCRIPT_DIR"/lib-*.sh "$GSC_SCRIPTS/"` line, around line 30436) — it already
copies via a `lib-*.sh` glob and needs no edit. Do not add
`provision-node-worktree` or `worktree-create.sh` test harnesses — that is
the separately-tracked draft `tactic-provision-worktree-script-tests` (out of
scope for this per-node finalize; do not fold it in here).

### Reuse

- `.claude/skills/dispatch-propagate/scripts/lib-reservation-ledger.sh` and
  `lib-claude-agents.sh` — the existing small-sourceable-lib pattern this new
  file follows (header-comment convention; `# shellcheck source=/dev/null`
  convention already used at every existing cross-file `source` line in this
  directory).
- The awk program itself, reused verbatim from the four existing call sites —
  not rewritten or "improved."

### Verification

```verify
bash -n .claude/hooks/worktree-create.sh
bash -n .claude/skills/dispatch-propagate/scripts/lib-graph-worktree.sh
bash -n .claude/skills/dispatch-propagate/scripts/provision-node-worktree
bash -n .claude/skills/dispatch-propagate/scripts/dispatch-graph-execute
bash -n .claude/skills/dispatch-propagate/scripts/graph-select-target
bash -n .claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh
```

```verify
npx vitest run --project packages/intentionsutil --root .
npx vitest run --project packages/router --root .
```
(These two vitest projects are unrelated to this refactor's shell-only
surface — no source in either package references the awk resolver or
`DISPATCH_GRAPH_MAIN_WORKTREE` — so they are a sanity check that nothing else
regressed, not a targeted test for this change.)

Manual (no automated harness exercises the real
`provision-node-worktree`/`worktree-create.sh` resolver logic today):

- From a real worktree checkout, run
  `source .claude/skills/dispatch-propagate/scripts/lib-graph-worktree.sh &&
  resolve_main_worktree` directly and confirm it prints the path of the
  worktree with `main` checked out, matching what
  `git worktree list --porcelain` shows for that branch by hand.
- Run `provision-node-worktree <some-existing-tactic-id> implement` end-to-end
  (or dry-read its new resolver block) and confirm `PROJECT_ROOT` still
  resolves correctly and the existing exit-2 error message still fires when
  `DISPATCH_GRAPH_MAIN_WORKTREE` is unset and pointed at a directory with no
  `main` worktree (e.g. via a scratch git init with no `main` branch).
  `provision-node-worktree`'s own comment-documented exit codes (0/2/10/11/12/13)
  are unaffected by this change — only the internals of the `PROJECT_ROOT`
  resolution move.
- Trigger the `WorktreeCreate` hook once (e.g. via `EnterWorktree` on a
  node-id branch) and confirm the resulting worktree lands at the expected
  `<project-root>/.claude/worktrees/<node-id>` path, unchanged from before
  this refactor.
- **Failure-path check specific to `worktree-create.sh`** (this is the site
  with the `set -e` hazard called out in Scope — the success-path checks
  above do not exercise it): run the edited `worktree-create.sh` standalone
  in a directory with no worktree registry (or with
  `DISPATCH_GRAPH_MAIN_WORKTREE`-style env forced empty and no real `main`
  worktree reachable) and confirm it still prints the specific
  `"[worktree-create] ERROR: no worktree with 'main' checked out; cannot
  resolve the project root for node-id worktree '$BRANCH'"` message and exits
  1 — not a generic `set -e` ERR-trap message. If you see a generic/blank
  failure instead of that exact message, the `|| PROJECT_ROOT=""` guard in
  this unit's edit was dropped or misplaced; fix before landing.
