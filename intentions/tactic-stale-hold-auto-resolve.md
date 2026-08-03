---
id: tactic-stale-hold-auto-resolve
kind: tactic
statement: A tracked hold keeps blocking its source node after the condition it
  tracks is gone — nothing re-checks a hold's own predicate, so a
  worktree-residue hold whose worktree is verifiably clean stays parked at phase
  null with its blocked_by edge intact, and the source node remains blocked with
  no signal distinguishing it from a hold whose condition still holds
owner: ai
status: codified
parent: null
rationale: "Found 2026-07-31 by two independent verification passes that each
  hit the same wall from a different node.
  tactic-prune-conflict-recovery-silent-loss is blocked_by
  tactic-hold-residue-prune-conflict-recovery-silent-loss, and
  tactic-standdown-winner-liveness is blocked_by
  tactic-hold-residue-standdown-winner-liveness. Both holds were recorded
  against an uncommitted intentions/ diff in the source node's worktree. Both
  worktrees were then verified clean — `git status --porcelain
  --untracked-files=no` returns empty for each — so both holds track a condition
  that no longer exists, yet both remained parked with their edges intact at the
  time of discovery. Both were since cleared by hand, so as of this finalize the
  repo carries no live stale hold; the fix is verified by harness plus
  post-merge tick observation, not by watching those two nodes. resolve-hold
  exists and is the correct scripted inverse of hold-node; it writes
  office_hours null AND phase done on the hold and then removes the edge from
  the source, deliberately in two separate graph-commits because blocked_by is a
  LIST field whose layer-2 union merge can only ADD, so a removal batched with
  other writes is silently dropped and reported as a successful land. What was
  missing was not the primitive but the trigger: nothing ever asked whether a
  hold's predicate still holds. Finalized 2026-07-31 via /align-tactics into the
  5-unit plan in the body below: give each hold kind a machine-checkable
  predicate and re-evaluate it on a cadence, in the shape
  lib-standdown-recheck.sh already established for stand-down markers — run from
  the main checkout so invariant I1 holds, keep the record and retry next tick
  on failure rather than swallowing it, and emit a per-sweep count so a growing
  stale-hold population is visible rather than silent. worktree-residue is the
  first (and, this round, only) auto-checkable kind; provision-conflict and
  fix-attempt-cap are declared manual with a written reason rather than silently
  left never-re-checked. Note the hazard a pruned blocker already demonstrates:
  clearing an edge is a removal on a union-merged list field, so any automated
  resolver must re-read origin/main and assert the edge is actually gone, never
  trust a reported successful land — the same rule as invariant I2. Interim
  attention scaffolding only — tactic-attention-tier-ranking replaces the
  numeric scheme with lexicographic (tier, rank) and max-lifting, and
  tactic-attention-boost-scripts converts these boosts to tier/bug_fix marks."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 20
  override: null
  rationale: "Bootstrap re-scale 2026-07-31: Wave B of the three-band interim
    scale (50 / 20 / 10) — dispatch-containment work that follows the Wave A
    write-path fixes. Wave B rather than Wave A because the resolve primitive
    already exists and a human can run it in seconds once the stale hold is
    noticed, so the defect costs latency and attention rather than correctness.
    blocked_by is empty, so this promotion lifts no blocker and cannot compound.
    Finalized 2026-07-31 (/align-tactics) to phase: implement with the boost
    left unchanged at 20; blocked_by remains empty so this promotion still lifts
    no blocker and cannot compound."
  tier: 1
phase: qa
execution:
  branch: tactic-stale-hold-auto-resolve
  pr: 3011
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix: null
  completion: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: true
rounds: null
attributes: {}
---

# tactic-stale-hold-auto-resolve

## Context

A tracked hold (`hold-node`) is a born-parked `tactic-hold-<slug>-<source>` node
plus a `blocked_by` edge from the source node to it. It exists so a *mechanical*
retry state does not park the source itself. The reverse move is scripted —
`packages/intentionsutil/scripts/resolve-hold` writes `office_hours: null` **and**
`phase: done` on the hold, then removes the hold id from the source's
`blocked_by` in a **second** `graph-commit` (a removal on the union-merged
`blocked_by` LIST field is silently re-added if batched), re-reading `origin/main`
after each write to assert it actually landed.

What is missing is the **trigger**. Nothing ever re-asks whether a hold's
predicate still holds. Found 2026-07-31 by two independent verification passes:
`tactic-hold-residue-prune-conflict-recovery-silent-loss` and
`tactic-hold-residue-standdown-winner-liveness` both tracked an uncommitted
`intentions/` diff in their source's worktree; both worktrees were verified clean
(`git status --porcelain --untracked-files=no` empty); both holds still sat at
`phase: null` with `office_hours` set, and both sources were still blocked. Both
were then cleared **by hand** — so as of this plan's authoring the repo carries no
live stale hold, and the fix is verified by harness plus post-merge observation,
not by watching those two nodes.

Intended outcome: each hold kind carries an explicitly declared re-check policy
(a kind with no machine-checkable predicate must *say so*, not default to
never-re-checked), and a per-tick sweep re-evaluates the machine-checkable ones
and calls `resolve-hold` when the tracked condition is gone. The sweep is
containment/observability only — it always returns 0, never gates a tick, keeps
the record and retries next tick on failure, and emits one greppable line per
candidate plus exactly one summary line so a growing stale-hold population is
visible instead of silent.

Greenfield shape (what this plan builds, and what it would be built as from
scratch): the residue predicate has exactly one implementation, shared by the
producer that raises the hold and the sweep that clears it; the hold-kind
vocabulary has exactly one home and every kind in it is classified as
`auto`-re-checkable or `manual` by a total mapping the type system enforces; the
decision half is a pure, offline-testable TS enumerator and the landing half is a
thin bash sweep that shells out to the existing `resolve-hold` primitive. No
brownfield migration path is needed — nothing depends on the current
never-re-checked behavior, and the one refactor (Unit 2) is behavior-preserving
for its existing caller.

Non-goals, explicitly out of scope for every unit below:
- Pruning resolved hold nodes (`graph-commit --prune`). A prune while an inbound
  `blocked_by` still names the hold is rejected by `validateGraph`; ordering is
  the owed-prune census's concern, as `resolve-hold`'s header already records.
- A predicate for `provision-conflict` or `fix-attempt-cap`. Both are declared
  `manual` with a written reason (Unit 1) and surfaced per sweep pass, which is
  the whole requirement.
- Any change to `hold-node`, to `dispatch-graph-execute`'s hold producers, or to
  the shape/wording of generated hold bodies.
- Any change to `resolve-hold` itself.

---

### Unit 1 — Give the hold-kind vocabulary one home and a total re-check policy

**Scope.**

New file `packages/intentionsutil/src/holds.ts`. Move, verbatim, out of
`packages/intentionsutil/scripts/hold-node-decide.ts`:

- `HOLD_KINDS` (`hold-node-decide.ts:63-67`) and `type HoldKind` (`:69`)
- `KIND_SLUGS` (`:71-75`) and `isHoldKind` (`:83-85`)
- `RESERVED_KIND_SLUGS` (`:88`)
- `NODE_ID_RE` (`:91`) and `holdIdFor` (`:124-138`)
- `RESOLUTION_SENTENCE` (`:93-95`)

Keep every doc comment attached to what it documents (the long `KIND_SLUGS`
doc-comment at `:42-62` moves with it). `hold-node-decide.ts` then imports these
from `../src/holds.js` and **re-exports** `HOLD_KINDS`, `HoldKind`,
`RESERVED_KIND_SLUGS`, `RESOLUTION_SENTENCE`, and `holdIdFor` under their current
names, so its public surface is byte-identical to callers. The only TS importer
is `packages/intentionsutil/test/hold-node-decide.test.ts:1-10`; the bash callers
(`packages/intentionsutil/scripts/hold-node:58,111-140`,
`packages/intentionsutil/scripts/resolve-hold:104,312-314`) shell out to the CLI
and are untouched.

Add to `src/holds.ts` the new total re-check policy:

```ts
export type HoldRecheck =
  | { policy: "auto"; predicate: "worktree-clean" }
  | { policy: "manual"; why: string };

export const KIND_RECHECK: Record<HoldKind, HoldRecheck> = { … };
```

with, exactly:
- `"worktree-residue"` → `{ policy: "auto", predicate: "worktree-clean" }`
- `"provision-conflict"` → `{ policy: "manual", why: … }` — resolving a content
  conflict against a moving main is a session's job (`/dispatch-conflict` Lane 3);
  there is no single-call predicate that distinguishes "resolved" from "not yet
  attempted".
- `"fix-attempt-cap"` → `{ policy: "manual", why: … }` — the cap is exhausted
  attempts, not an observable external condition; re-checking would mean re-running
  CI, which is not a predicate.

The `Record<HoldKind, HoldRecheck>` type is load-bearing: adding a kind to
`HOLD_KINDS` without classifying it fails typecheck. That is the mechanical form
of the tactic's requirement that a kind with no machine-checkable predicate must
say so explicitly rather than defaulting to never-re-checked. Say this in the
doc-comment above `KIND_RECHECK`, in those terms.

Tests: extend `packages/intentionsutil/test/hold-node-decide.test.ts` (its
existing imports keep working via the re-exports — do not rewrite them) and add
`packages/intentionsutil/test/holds.test.ts` asserting: every `HOLD_KINDS` entry
has a `KIND_RECHECK` entry; every `manual` entry has a non-empty `why`; exactly
one kind is `auto`; `holdIdFor("worktree-residue", "tactic-x") ===
"tactic-hold-residue-x"`.

Out of scope: changing any value, id-derivation rule, or sentence text; touching
`decideHold`, `buildHoldNode` (`:159-193`), or `buildHoldBody` (`:198-222`).

**Recommended model:** opus

---

### Unit 2 — Extract the worktree-residue predicate into one read-only classifier

**Scope.**

The residue predicate exists once today, inline and unsourceable, in
`.claude/skills/dispatch-propagate/scripts/provision-node-worktree`:

- identity assertion (is `$WT` really the linked worktree for `$NODE_ID`, or an
  orphan directory whose `git -C` would address the enclosing main checkout) —
  `:203-235`
- `wt_git_path` (absolute git-path resolution + containment guard) — `:214-235`
- `check_worktree_usable` (operation-in-progress with auto-repair, detached HEAD,
  wrong branch, dirty tracked tree) — `:248-308`
- the bounded repair loop — `:318-332`

New file `.claude/skills/dispatch-propagate/scripts/lib-worktree-residue.sh`, a
load-guarded sourceable library (`_LIB_WORKTREE_RESIDUE_LOADED`, `BASH_SOURCE`-
dirname sourcing, copying the shape of
`lib-standdown-recheck.sh:199-207`). It exposes exactly two functions, both
**strictly read-only — they never repair, abort, checkout, or write anything**:

```
worktree_identity_ok <worktree-path> <node-id>
  stdout on mismatch: `toplevel=<t> git-dir=<g>` (empty on success)
  return 0 — <path> is the linked worktree for <node-id>
  return 1 — orphan directory / identity mismatch
  return 2 — directory missing, or git could not be run there

worktree_residue_condition <worktree-path> <expected-branch>
  stdout: EXACTLY ONE slug, always:
    absent | clean | rebase-in-progress | merge-in-progress |
    cherry-pick-in-progress | detached-head | wrong-branch:<branch> |
    dirty-tracked-tree | unknown
  return 0 — absent | clean          (no residue)
  return 1 — any residue slug
  return 2 — unknown                 (could not inspect; callers KEEP)
```

`worktree_residue_condition` performs the identity assertion internally first and
returns 2/`unknown` on mismatch, so no caller can be tricked into reading the
enclosing checkout's state. It keeps `wt_git_path`'s containment rule verbatim
(`provision-node-worktree:226-233`) and the `--untracked-files=no` dirty test
(`:304`) — that flag is load-bearing (node worktrees carry build output).

Rewire `provision-node-worktree` to source the lib and call it, preserving
behavior exactly:

- Replace the inline identity block (`:203-235`, keeping `WT_REAL`/`WT_GITDIR`
  assignments only if still needed downstream) with `worktree_identity_ok`,
  emitting the **current, unchanged** two stderr lines and `exit 2` on failure.
- Replace `check_worktree_usable`'s inspection with one
  `worktree_residue_condition "$WT" "$NODE_ID"` call and a `case` over the slug:
  `rebase-in-progress` → `git -C "$WT" rebase --abort` → `return 2` (repaired,
  re-check) or `unusable_worktree operation-in-progress` on abort failure;
  `merge-in-progress` / `cherry-pick-in-progress` → the matching abort, same
  shape; `detached-head` → `unusable_worktree detached-head`; `wrong-branch:<b>`
  → `unusable_worktree "wrong-branch (checked out: $b)"`; `dirty-tracked-tree` →
  `unusable_worktree dirty-tracked-tree`; `clean` → `return 0`; `absent` /
  `unknown` → `return 1` (the existing "cannot inspect the worktree state" →
  `exit 2` path at `:330-333`).
- `unusable_worktree` (`:238-245`) and the bounded repair loop (`:318-332`) stay
  where they are, unchanged. The auto-repair stays in the provisioner: a sweep
  must never abort a rebase in a worktree it does not own.

Behavior preservation is the acceptance bar: exit-14 condition slugs, every
stderr message, and every exit code are unchanged, and
`.claude/skills/dispatch-propagate/scripts/test-provision-node-worktree.sh` and
`test-dispatch-provision-worktree.sh` must pass **without edits** (additions
allowed, changes to existing assertions are not).

New harness `.claude/skills/dispatch-propagate/scripts/test-lib-worktree-residue.sh`
(shape: `mktemp -d` scratch repo + real `git worktree add`, following
`test-lib-standdown-recheck.sh`), covering each slug: absent dir; clean worktree;
dirty tracked file; untracked-only file (must be `clean`); wrong branch; detached
HEAD; a manufactured `MERGE_HEAD`; an orphan directory inside another checkout
(must be `unknown`/rc 2, never the enclosing checkout's status); and that no case
mutates the worktree (assert `git status --porcelain` before == after in every
case).

Out of scope: any change to what the provisioner does *after* the guard (merges,
CI probe, stamps).

**Recommended model:** opus

**Dependencies:** none

---

### Unit 3 — Pure enumerator: which holds are re-checkable, and which are stale by construction

**Scope.**

New pure module `packages/intentionsutil/src/hold-sweep.ts`, modelled on
`packages/intentionsutil/src/scope-sweep.ts:60-120` (read-only, dependency-injected,
no git/gh/network):

```ts
export type HoldClass = "predicate" | "edge-residue" | "manual";
export interface HoldCandidate {
  holdId: string; sourceId: string; kind: HoldKind; cls: HoldClass;
}
export function listHoldCandidates(nodes: IntentionNode[]): HoldCandidate[]
```

A node is a hold iff `kind === "tactic"` and
`attributes.hold_kind` is a member of `HOLD_KINDS` and `attributes.hold_for` is a
non-empty string (the fields `buildHoldNode` writes,
`hold-node-decide.ts:186-190`). Classify each hold whose `hold_for` source
exists in `nodes`:

- **`edge-residue`** — the hold is terminal (`phase === "done"` **and**
  `office_hours === null`) but the source's `blocked_by` still contains the hold
  id. The tracked condition is definitionally gone; no predicate applies. Emitted
  for **every** kind, `auto` or `manual`.
- **`predicate`** — the hold is open (`phase !== "done"` **or** `office_hours !==
  null`), the source's `blocked_by` contains the hold id, and
  `KIND_RECHECK[kind].policy === "auto"`.
- **`manual`** — same as `predicate` but `KIND_RECHECK[kind].policy === "manual"`.
  Emitted so the sweep can *report* it; the sweep never acts on it. This is what
  makes "this kind has no machine-checkable predicate" visible per pass instead
  of silent.

Excluded entirely (return nothing): a hold whose source id is absent from
`nodes`; a terminal hold whose source no longer names it (fully resolved);
a node with no `hold_for` / an unrecognized `hold_kind`. Ordering is stable
(sorted by hold id) so the CLI's output is deterministic.

New CLI `packages/intentionsutil/scripts/list-recheckable-holds.ts`, a thin
network-free wrapper in the exact shape of
`packages/intentionsutil/scripts/list-scope-stale-tactics.ts`:

```
node --import tsx/esm list-recheckable-holds.ts --dir <intentions-dir>
```

Stdout: one TSV line per candidate, `<hold-id>\t<source-id>\t<kind>\t<class>`;
nothing when there are none. Exit 0 on success, exit 2 on a usage error or a
malformed store. It reads the store with `listNodes` (`src/store.ts:143`) — no new
index, no filename globbing.

Tests: `packages/intentionsutil/test/hold-sweep.test.ts` — an open
worktree-residue hold with the edge → `predicate`; the same hold with the edge
already gone → excluded; a done hold with a surviving edge → `edge-residue`; a
done hold with no edge → excluded; an open `provision-conflict` hold → `manual`;
a done `provision-conflict` hold with a surviving edge → `edge-residue`; a hold
whose source is missing from the store → excluded; a plain tactic with no
`attributes` → excluded; `office_hours` set while `phase === "done"` → still
`predicate` (open), not `edge-residue`; stable sorted ordering.

Out of scope: reading git, worktrees, or the filesystem beyond the store dir;
any write.

**Recommended model:** opus

**Dependencies:** Unit 1 (imports `HOLD_KINDS`, `HoldKind`, `KIND_RECHECK` from
`src/holds.ts`).

---

### Unit 4 — The sweep: `lib-stale-hold-recheck.sh`

**Scope.**

New file `.claude/skills/dispatch-propagate/scripts/lib-stale-hold-recheck.sh`,
a load-guarded sourceable library (`_LIB_STALE_HOLD_RECHECK_LOADED`), structurally
mirroring `lib-standdown-recheck.sh` — copy its sourcing block idiom
(`:199-207`), its numbered-rule-ladder + one-stderr-line-per-item contract, its
per-invocation action cap, its fail-safe "UNKNOWN keeps rather than acts" posture,
and `_standdown_log_decision` (`:362-389`) verbatim in shape (`jq -c -n` build,
`command -v decision_log_append` guard, never fails the caller) as
`_stale_hold_log_decision`. Give it its own lib file; do not extend
`lib-standdown-recheck.sh` (that file's own doc note at `:329-332` records the
same deliberate non-sharing precedent with `lib-frozen-session-park.sh`).

Sources: `lib.sh`, `lib-claude-agents.sh` (for `worktree_has_live_session`,
`lib-claude-agents.sh:104-125,798`), `lib-reservation-ledger.sh` (for
`reservation_exists`, `:409`), `lib-graph-worktree.sh` (for
`resolve_main_worktree`, `:27`), `lib-worktree-residue.sh` (Unit 2), and
`lib-decision-log.sh` non-fatally.

Single entry point:

```
stale_hold_recheck_sweep     # no arguments; ALWAYS returns 0
```

Steps, in order:

1. **Repo root (invariant I1).** `DISPATCH_HOLD_RECHECK_REPO_ROOT` if set, else
   `resolve_main_worktree`. Unresolvable → emit the summary with
   `status=repo-unresolvable` and return 0. Every path below (enumerator,
   `resolve-hold`, worktree lookups) is anchored at this root — `resolve-hold`
   and `graph-commit` derive their own `REPO_ROOT` from their script location, so
   invoking `$ROOT/packages/intentionsutil/scripts/resolve-hold` is what makes the
   write land against the main checkout regardless of the tick's cwd.
2. **Enumerate.** `node --import tsx/esm
   $ROOT/packages/intentionsutil/scripts/list-recheckable-holds.ts --dir
   $ROOT/intentions`, run with cwd `$ROOT` (same invocation shape as
   `dispatch-graph-scope-sweep:100-104`). Overridable for tests via
   `DISPATCH_HOLD_RECHECK_ENUM`. Non-zero exit → one loud stderr line, summary with
   `status=enumeration-failed`, return 0. **A failed enumeration must never be
   reported as "no stale holds"** — that distinction is a verification requirement.
3. **Per candidate**, this ladder in this exact order, one greppable stderr line
   per candidate, one `_stale_hold_log_decision` record per candidate:
   - a. hold id or source id fails the node-id slug shape
     (`^[a-z][a-z0-9]*(-[a-z0-9]+)*$`) or carries `/`, `..`, or a control
     character → `unsafe-id`, skip.
   - b. `class == manual` → `skip-manual-policy (<kind> has no machine-checkable
     predicate)`, skip. Counted, never acted on.
   - c. `class == edge-residue` → resolve (rule f). No predicate applies: the hold
     is already terminal, the surviving edge is exactly the dropped-removal shape
     `resolve-hold`'s header describes.
   - d. **claimed** — `reservation_exists <source-id>` **or**
     `worktree_has_live_session "$ROOT/.claude/worktrees/<source-id>"` →
     `observing-claimed`, skip. A session may be actively clearing the residue;
     never mutate a node another session holds. `worktree_has_live_session` is
     fail-safe (an unqueryable daemon reports occupied), which is the posture we
     want.
   - e. **predicate** — `worktree_residue_condition
     "$ROOT/.claude/worktrees/<source-id>" "<source-id>"`. rc 0 (`clean` or
     `absent`) → resolve (rule f). rc 1 → `observing-residue (<slug>)`, skip. rc 2
     (`unknown`) → `unknown`, skip — never resolve on an inspection failure.
   - f. **resolve** — if the per-pass cap is already reached →
     `deferred (cap=<n>)`, skip. Otherwise
     `$ROOT/packages/intentionsutil/scripts/resolve-hold <source-id> --kind
     <kind>`. Exit 0 → `resolved <hold-id> (unblocked <source-id>)`. Non-zero →
     `resolve-failed (rc=<n>) — keeping the hold, retrying next tick`, and
     **continue to the next candidate** (never abort the sweep, never park
     anything, never touch the node by hand). `resolve-hold` overridable for tests
     via `DISPATCH_HOLD_RECHECK_RESOLVE`.
4. **Summary — exactly one line, always emitted, on every return path:**
   `lib-stale-hold-recheck: sweep complete (candidates=N resolved=N observing=N
   manual=N unknown=N failed=N deferred=N status=<ok|enumeration-failed|repo-unresolvable>)`

Cap: `DISPATCH_HOLD_RECHECK_MAX`, default `3`, non-numeric falls back to `3`
(same validation idiom as `DISPATCH_STANDDOWN_PARK_MAX`,
`lib-standdown-recheck.sh:406-407`).

Contract, stated in the file header in these terms: containment/observability
only, never a gate, `return 0` on every path including an unqueryable daemon, an
unresolvable root, a failed enumeration and a failed `resolve-hold`. It performs
**no** graph write of its own — every write goes through `resolve-hold`, which
owns the fresh-`origin/main` refresh, the `--base` compare-and-swap, the two-commit
split, and the post-land re-read that asserts the edge is actually gone. Do not
add a second edge-clearing path here.

New harness
`.claude/skills/dispatch-propagate/scripts/test-lib-stale-hold-recheck.sh`,
building on `test-resolve-hold.sh:44-110`'s fixture idiom (throwaway repo, real
git worktrees, `node_modules` symlink so the real enumerator executes) with
`resolve-hold` replaced by a logging stub. Cases:

1. Open worktree-residue hold + clean worktree → stub invoked exactly once with
   `<source-id> --kind worktree-residue`; `resolved=1`.
2. Worktree directory absent → resolved.
3. Dirty tracked tree → not invoked; `observing-residue (dirty-tracked-tree)`.
4. Wrong branch, and detached HEAD → `observing-residue`, not invoked.
5. Live session under the worktree (stubbed `worktree_has_live_session`) →
   `observing-claimed`, not invoked.
6. Reservation marker present (`DISPATCH_RESERVATION_DIR` scratch) →
   `observing-claimed`, not invoked.
7. `edge-residue` candidate whose worktree is **dirty** → still resolved (no
   predicate applies).
8. Open `provision-conflict` hold → `skip-manual-policy`, `manual=1`, never
   invoked.
9. Enumerator stub exits 2 → `status=enumeration-failed`, `candidates=0`,
   nothing invoked, return 0 — and assert the summary is distinguishable from the
   genuine "no candidates" pass of case 10.
10. No holds at all → `candidates=0 status=ok`.
11. `resolve-hold` stub exits 1 → `failed=1`, return 0, other candidates in the
    same pass still processed.
12. Four resolvable candidates with `DISPATCH_HOLD_RECHECK_MAX=2` →
    `resolved=2 deferred=2`.
13. Unresolvable repo root → `status=repo-unresolvable`, return 0.
14. Every case above asserts return code 0 and exactly one `sweep complete` line.

**Recommended model:** opus

**Dependencies:** Units 2 and 3.

---

### Unit 5 — Wire the sweep into both `dispatch-tick` cadences

**Scope.**

`.claude/skills/dispatch-propagate/scripts/dispatch-tick`, two call sites, using
the identical conditional-source + `declare -f` verify + loud-failure-never-abort
idiom already in place for `standdown_recheck_sweep`:

- **Paused branch** — immediately after the `standdown_recheck_sweep` block at
  `:343-358`. Rationale (put it in the comment): this `exit 0` path never reaches
  `dispatch-select-tick`'s own sweeps, so nothing else would re-check a hold while
  dispatch is paused.
- **Normal path** — immediately after the `standdown_recheck_sweep` block at
  `:548-565`, i.e. after the `DISPATCH_AGENTS_SNAPSHOT` capture (`:510-546`) and
  **before** Step 1 selection. Rationale (put it in the comment): the sweep's
  session-registry reads reuse this tick's snapshot, and a hold resolved here has
  landed its `blocked_by` removal on `main` before selection runs, so this tick's
  own selection can pick up the just-unblocked source.

Both sites:

```bash
if ! declare -f stale_hold_recheck_sweep >/dev/null 2>&1; then
  # shellcheck source=/dev/null
  source "$SCRIPT_DIR/lib-stale-hold-recheck.sh"
fi
if declare -f stale_hold_recheck_sweep >/dev/null 2>&1; then
  stale_hold_recheck_sweep 1>&2
else
  echo "dispatch-tick: lib-stale-hold-recheck.sh failed to load; stale-hold re-check NOT run this tick" >&2
fi
```

Tests: extend `.claude/skills/dispatch-propagate/scripts/test-dispatch-tick.sh`,
copying the standdown wiring block at `:818-872` — `tick_setup` must copy
`lib-stale-hold-recheck.sh` (and the libs it sources) into `TMPDIR_TEST` the way
it already copies `lib-standdown-recheck.sh`; point
`DISPATCH_HOLD_RECHECK_REPO_ROOT` at a scratch dir with an empty `intentions/` so
the sweep finds nothing and emits only its summary. Assert: (a) paused branch
emits `lib-stale-hold-recheck: sweep complete`, exit 0; (b) normal path likewise;
(c) with the copied lib replaced by invalid bash, both sites log
`lib-stale-hold-recheck.sh failed to load; stale-hold re-check NOT run this tick`,
no `sweep complete` line appears, and the tick still exits 0.

Out of scope: `dispatch-select-tick` (the scope sweep's home) — this sweep is
tick-level, matching the stand-down precedent, so a paused fleet still re-checks.

**Recommended model:** sonnet

**Dependencies:** Unit 4.

---

## Reuse

- `packages/intentionsutil/scripts/resolve-hold` (whole file; header `:1-100`,
  `--kind` default `:112`) — **the** landing primitive. The sweep shells out to it
  and reimplements none of it: no `office_hours` clearing, no `phase` write, no
  `blocked_by` removal, no `graph-commit`, no post-land verification.
- `packages/intentionsutil/scripts/hold-node-decide.ts:63-95,124-138` —
  `HOLD_KINDS` / `KIND_SLUGS` / `RESERVED_KIND_SLUGS` / `holdIdFor` /
  `RESOLUTION_SENTENCE`, moved to `src/holds.ts` in Unit 1 and re-exported. Never
  re-derive the slug map anywhere else.
- `packages/intentionsutil/scripts/hold-node-decide.ts:186-190` —
  `attributes.hold_for` / `attributes.hold_kind`, the fields Unit 3 filters on.
- `packages/intentionsutil/src/store.ts:143` — `listNodes`, the enumeration reader.
- `packages/intentionsutil/src/scope-sweep.ts:60-120` +
  `packages/intentionsutil/scripts/list-scope-stale-tactics.ts` — the pure-enumerator
  + thin-CLI template Unit 3 copies.
- `.claude/skills/dispatch-propagate/scripts/dispatch-graph-scope-sweep` — the
  decision/land split precedent: network-free TS enumerator, thin bash landing
  script, per-node best-effort, sweep always exits 0.
- `.claude/skills/dispatch-propagate/scripts/lib-standdown-recheck.sh:199-207`
  (sourcing/load-guard), `:362-389` (`_standdown_log_decision`), `:391-717`
  (ladder + counters + summary), `:406-407` (cap validation) — Unit 4's structural
  template.
- `.claude/skills/dispatch-propagate/scripts/provision-node-worktree:203-235,238-245,248-308,318-332`
  — the residue predicate being extracted in Unit 2.
- `.claude/skills/dispatch-propagate/scripts/lib-graph-worktree.sh:27` —
  `resolve_main_worktree` (honors `DISPATCH_GRAPH_MAIN_WORKTREE` for tests).
- `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:104-125,798` —
  `worktree_has_live_session` (fail-safe: unqueryable ⇒ occupied).
- `.claude/skills/dispatch-propagate/scripts/lib-reservation-ledger.sh:409` —
  `reservation_exists`.
- `.claude/skills/dispatch-propagate/scripts/dispatch-tick:343-358,548-565` — the
  two-cadence wiring idiom.
- Harnesses to copy rather than invent:
  `.claude/skills/dispatch-propagate/scripts/test-resolve-hold.sh:44-110`,
  `test-lib-standdown-recheck.sh`, `test-dispatch-tick.sh:818-872`,
  `packages/intentionsutil/test/scope-sweep.test.ts`.
- `.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute:416-465` —
  the only current producer of worktree-residue holds; its recommendation prose
  (`:450`) is the manual recipe this tactic mechanizes. Read it, do not edit it.

## Verification

```verify
npx vitest run --project packages/intentionsutil --root .
```

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh --app packages/intentionsutil
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-lib-worktree-residue.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-lib-stale-hold-recheck.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-provision-node-worktree.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-provision-worktree.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-resolve-hold.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-hold-node.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-tick.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

The three acceptance behaviors the tactic names map to harness cases, all covered
above: (1) *seed a hold, clean the worktree, sweep ⇒ hold `phase: done` and the
source's `blocked_by` no longer contains it when read back from `origin/main`* —
`test-lib-stale-hold-recheck.sh` case 1 for the sweep's decision, and
`test-resolve-hold.sh` cases 1 and 2 (already on main) for the landing and the
dropped-removal detection; (2) *a hold whose residue still exists survives the
sweep untouched* — cases 3, 4; (3) *the per-run count is visible and distinguishes
"no stale holds" from "could not evaluate"* — cases 9 and 10 asserting two
distinguishable summary lines.

Manual / observe-in-production, after merge (not auto-runnable):

- Confirm the two motivating instances stay resolved and are not re-opened by the
  sweep: `tactic-hold-residue-prune-conflict-recovery-silent-loss` and
  `tactic-hold-residue-standdown-winner-liveness` are already `phase: done`,
  `office_hours: null`, with their sources' edges cleared, so the enumerator must
  classify them as neither `predicate` nor `edge-residue`. Check by running the
  enumerator read-only against the real store from the main checkout:
  `node --import tsx/esm packages/intentionsutil/scripts/list-recheckable-holds.ts --dir intentions`
  — expect no line naming either id.
- Watch one real tick's stderr for exactly one
  `lib-stale-hold-recheck: sweep complete (...)` line, on both a paused and a
  normal tick (`journalctl --user -u dispatch-claude-daemon` or the tick job log).
  Judgment call on first observation: any `unknown=` or `failed=` count above zero
  on a steady-state fleet means the predicate or the resolve path is misfiring and
  wants a look before the sweep is trusted.
- The sweep needs `dangerouslyDisableSandbox` semantics — it queries the Claude
  daemon over a Unix socket and `resolve-hold`'s `graph-commit` needs gh/TLS +
  network. `dispatch-tick` already runs sandbox-off, so no new requirement is
  introduced; verify only that no *new* sandboxed call path was added.
- `resolve-hold` inherits `graph-commit`'s `assert_clean_outside_ids` rule, so a
  dirty main checkout makes a resolution fail. Expected and by design: the sweep
  logs `resolve-failed` and retries next tick. Confirm on first observation that a
  transiently dirty main produces a retry line, not a park and not a partial write.

## needs-main residue

Filed by `/qa-fix` (PR #3011). Items 7 and 8 of the QA triage plan require
observation against real post-merge behavior — no pre-merge fixture or unit
test can reproduce steady-state fleet conditions or a real `graph-commit`
refusal against a genuinely dirty `main`. Both are drawn verbatim from this
node's own "Manual / observe-in-production" section above; QA confirmed the
other two items in that section (the two historical hold ids, and the no-new-
sandboxed-call-path check) directly against the live `intentions/` store and
code, so only these two remain.

- id: 7
  title: First live tick emits exactly one summary line per cadence, with zero unknown=/failed=
  url_path: current
  expected_outcome: On the first real post-merge tick (both paused and normal cadence), dispatch-tick's stderr carries exactly one `lib-stale-hold-recheck: sweep complete (...)` line per cadence, with `status=ok` and `unknown=0`, `failed=0` on a steady-state fleet.
  finding: Requires a live tick against the real fleet with real worktrees in real states — no pre-merge fixture or unit test can reproduce steady-state fleet conditions.
  Verifiability: MACHINE
  Check: `journalctl --user -u dispatch-claude-daemon --since -2h | grep 'lib-stale-hold-recheck: sweep complete'` (or the tick job log) — confirm exactly one line per cadence and `unknown=0 failed=0`.

- id: 8
  title: Transiently dirty main produces resolve-failed + next-tick retry, not a park or partial write
  url_path: current
  expected_outcome: When `resolve-hold`'s inherited `assert_clean_outside_ids` rule refuses a resolution against a transiently dirty `main`, the sweep logs `resolve-failed`, the tick's summary line shows `failed>=1` with `status=ok`, no `office_hours` park is written, and no partial graph write lands — confirmed by the following tick retrying the same candidate.
  finding: The pre-merge test harness stubs `resolve-hold` rather than exercising `graph-commit`'s actual `assert_clean_outside_ids` refusal against a real dirty checkout, so this specific failure path can only be observed against a real occurrence post-merge.
  Verifiability: MACHINE
  Check: On a tick log showing `resolve-failed`, confirm via `git log -- intentions/` that no partial/half-applied write landed for the named hold, and confirm the following tick's log retries the same hold id (`lib-stale-hold-recheck: resolve-failed` followed later by `resolved` or another `resolve-failed`, never silence).
