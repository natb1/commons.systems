---
id: tactic-eval-finding-main-dirt-halts-ladder-as-violation
kind: tactic
statement: One unrelated modified intentions file in the main checkout made
  provision-node-worktree refuse its git merge --ff-only, dispatch-graph-execute
  return park-failed, and dispatch-ladder-advance route that through its failed
  catch-all arm to exit 11 — ending a 102-minute run at its first SUCCESSFUL
  phase boundary with terminus violation, the classification reserved for a
  contract breach, on a transient environment state that a restart 17 minutes
  later cleared in 37 seconds
owner: ai
status: codified
parent: null
rationale: Auto-created by dispatch-eval-finding as an evaluation finding ledger
  entry. Similar findings MERGE into this node — a recurrence updates
  attributes.measured_impact, never mints a second node, and the node is never
  pruned while it carries measurements. (Finalized 2026-08-18 by
  /align-tactics.) The body now carries the incident record AND the three-unit
  plan that closes it; the merge-on-recurrence and never-prune rules above are
  unchanged by the finalize. The draft body's first remediation candidate —
  "scope provision-node-worktree's dirty-tree gate to the paths the fast-forward
  actually touches" — was REFUTED by measurement in that round (git merge
  --ff-only is already path-scoped); the body records the measurement and the
  corrected design.
reading: null
serves:
  - strategy-recursive-self-improvement
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: true
rounds: null
attributes:
  ledger_entry: true
  first_seen: 2026-08-14
  measured_impact:
    - metric: dirty_files_blocking_main_checkout
      value: 2
      unit: files
      window: tactic-attention-per-tier-boost-migration/align-tactics
        2026-08-14T16:54:30Z
      sensor: events.jsonl
      measured: 2026-08-14
    - metric: main_checkout_commits_behind_origin
      value: 9
      unit: commits
      window: 2026-08-14T16:54Z main checkout
      sensor: rsi
      measured: 2026-08-14
    - metric: run_wall_clock_seconds_ended_by_halt
      value: 6152
      unit: seconds
      window: tactic-attention-per-tier-boost-migration ladder run 2026-08-14T15:11:58Z
      sensor: events.jsonl
      measured: 2026-08-14
    - metric: phases_completed_before_halt
      value: 1
      unit: phases
      window: tactic-attention-per-tier-boost-migration ladder run 2026-08-14T15:11:58Z
      sensor: events.jsonl
      measured: 2026-08-14
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-14
---
# Clear already-landed residue before the main-checkout fast-forward, and make the escalation park land under residue, so a transient dirty main checkout stops ending ladder runs with `terminus: violation`

## Context

### The incident this node records

Observed on `tactic-attention-per-tier-boost-migration`, at the `align-tactics`
phase boundary, 2026-08-14T16:54:30Z.

The `align-tactics` phase **succeeded** — `verify-landed` saw `advanced` at
`origin/main`, the node moved to `phase: implement`, and a four-unit plan
(sonnet/opus/sonnet/opus, with Scope / Reuse / Verification sections) was in the
node body. Seven seconds later the run halted:

```
halt align-tactics throw | throw tactic-attention-per-tier-boost-migration execute-failed
dispatch-ladder-run: halted … (exit 11, terminus violation)
```

`terminus: violation` — the classification reserved for a run that broke a
contract — on a run that did nothing wrong.

The cause, recovered from journald (it is *not* in `events.jsonl`; that gap is
owned by `tactic-eval-finding-ladder-halt-drops-captured-cause`, and is NOT
re-fixed here):

```
provision-node-worktree: 'git merge --ff-only origin/main' failed in
/home/n8/natb1/commons.systems (the tree is dirty or diverged) — this checkout
needs a person before anything may be read from or written into it
 M intentions/tactic-invalid-state-rc-0b9860b2.md
dispatch-ladder-advance: dispatch-graph-execute exited 1 with
  'failed tactic-attention-per-tier-boost-migration park-failed'
```

**One modified node file in the shared main checkout ended a 102-minute ladder
run at its first successful phase boundary.** The chain, verified against the
working tree on 2026-08-18:

1. `provision-node-worktree:160-169` calls `sync_main_checkout`
   (`.claude/skills/dispatch-propagate/scripts/lib.sh:2109-2113`); the
   `git merge --ff-only origin/main` fails, and the script exits `2` — the
   generic mechanical-error code, with no repair attempted.
2. `dispatch-graph-execute:469-479` (the `*)` arm of `case "$prov_rc"`) calls
   `PARK_NODE` (`:133` → `packages/intentionsutil/scripts/park-node`). That park
   is itself a `graph-commit` write **against the same dirty checkout**, and
   `graph-commit`'s default `worktree` writer refuses on any unrelated tracked
   dirt (`assert_clean_outside_ids`, `packages/intentionsutil/scripts/graph-commit:3593-3660`,
   gated on `GRAPH_COMMIT_WRITER == worktree`). So the park fails and the arm
   emits `failed <id> park-failed` (`dispatch-graph-execute:477`).
3. `dispatch-ladder-advance:453-457` routes any `failed` word-1 disposition
   through its `failed|*)` catch-all to `throw <id> execute-failed`, exit 11.
4. `dispatch-ladder-run:1539` maps advance's exit 11 to `halt 11 throw`, and
   `classify_terminus` (`:933-957`) asks `.office_hours != null` at
   `origin/main` — which reads null **because the park write never landed** —
   so the run is classified `violation` (`:955`).

Two facts make the residue worse than a one-off:

- **It was pre-existing and long-lived.** `intentions/tactic-invalid-state-rc-0b9860b2.md`
  was already `M` when the run started at 15:11:58Z and was still `M` at
  16:54Z. The checkout was also **9 commits behind `origin/main`**, so the
  fast-forward had real work to do.
- **The residue set churns while the guard is armed.** During the evaluation the
  dirty set went from `tactic-eval-finding-ledger-has-no-retirement-actor.md` +
  `tactic-invalid-state-rc-0b9860b2.md` to
  `tactic-eval-finding-fix-phase-emits-no-outcome-record.md` +
  `tactic-invalid-state-rc-0b9860b2.md`. Other graph writers actively leave and
  clear residue in the shared checkout, so any ladder run's advance step races a
  window it cannot see.

**The classification is provably wrong.** The driver was restarted 17 minutes
later and the node ran on in 37 seconds:

```json
{"ts":"2026-08-14T17:11:29Z","event":"start","phase":null,"disposition":"running", …}
{"ts":"2026-08-14T17:12:06Z","event":"launched","phase":"implement","disposition":"launched","detail":"kind=tactic skill=/implement"}
```

Nothing about the node changed between halt and restart — it sat at
`phase: implement` both times. Only the checkout's cleanliness changed.

### What the 2026-08-14 draft got wrong, and is corrected here

The original body proposed *"scope `provision-node-worktree`'s dirty-tree gate to
the paths the fast-forward actually touches"*. **That candidate is refuted:
`git merge --ff-only` is already path-scoped.** Measured 2026-08-18 in a
throwaway repo (init, commit files `A` and `B`, branch `base`, change `B` on
`main`, then attempt the ff from `base`):

| local state | `git merge --ff-only main` |
|---|---|
| `A` modified (untouched by the ff) | **rc 0**, fast-forwards, `A` left ` M` |
| `A` staged-modified (untouched by the ff) | **rc 0** |
| an untracked new file | **rc 0** |
| `B` modified (`B` IS updated by the ff) | rc 1, *"Your local changes … would be overwritten by merge"* |
| a local commit on `base` (diverged) | rc 128, *"Not possible to fast-forward"* |

`test-provision-node-worktree.sh:586-589` already records the same fact in its
Case 15 comment. So the refusal in the incident was **not** an over-broad gate:
the dirty node file was one the incoming 9 commits also changed. There is no
"scope the gate" fix to make.

What actually produces that state is mechanical and repeating: `graph-commit`'s
**plumbing writer** (`GRAPH_COMMIT_WRITER=plumbing`, `graph-commit:1661-1737`)
lands a node by hashing the on-disk file into a throwaway index and pushing —
touching neither the checkout nor `.git/index`, and never moving local `HEAD`.
`dispatch-eval-finding:814` already writes every ledger entry this way. So after
each such land into a main checkout that is behind `origin/main`, the node file
on disk holds the content that is now on `origin/main`, while local `HEAD` holds
the old content — a tracked-modified path that the next fast-forward must
update, i.e. a **self-inflicted deadlock**: the residue can only clear by
fast-forwarding, and the fast-forward is blocked by the residue. That matches
the incident exactly, and it means residue frequency scales with evaluation
volume rather than with human error.

### The intended outcome

1. **Stop denying service on residue that carries nothing.** A tracked-modified
   path whose working-tree bytes are already `origin/main`'s bytes can be
   restored losslessly, and the fast-forward retried. That is a provable
   safety argument (the content is on `origin/main`; the restore drops nothing
   that is not already durable), not a heuristic — and it is the exact shape of
   the residue the plumbing writer creates.
2. **When a person genuinely is needed, say so in a way the ladder can classify
   honestly.** The escalation path already intends to park the node; it just
   cannot, because the park's own write trips the same guard. Make it land, and
   `classify_terminus` returns `excused-parked` (`dispatch-ladder-run:948-949`)
   instead of `violation` — with no change to the terminus vocabulary, to
   `classify_terminus`, or to any ladder exit code.
3. **Name the condition.** Give the main-checkout sync failure its own exit code
   out of `provision-node-worktree`'s generic `2`, so the park the caller writes
   carries an actionable remedy instead of *"Inspect the provisioning failure
   (git fetch/worktree add, direnv)"*.

### Why this stays a distinct ledger entry

`tactic-eval-finding-eval-write-blocked-by-unrelated-main-dirt` (phase `done`)
was about `graph-commit` refusing and costing the *evaluator* its write; it was
fixed by the per-call-site plumbing override at `dispatch-eval-finding:814`.
`tactic-eval-finding-reconcile-base-revert-blocks-main-graph-writes` (phase
`done`) was about a writer that *creates* residue. Here the refusing guard is
`sync_main_checkout`'s `--ff-only` — not a `graph-commit` call at all, so no
writer flip can reach it — and the victim is the ladder's forward progress and
its terminus classification. Both neighbours are terminal; there is nothing to
merge into. This entry stays distinct.

### What is deliberately NOT in this plan

- **No new `dispatch-ladder-advance` / `-await` / `-run` exit code, and no edit
  to those three scripts.** `intentions/tactic-dispatch-ladder-exit-code-space.md`
  is in flight (phase `implement`, source PR #3072) and owns that space
  (reserving 3, 15, 16, 17 and protecting the deliberately-unmapped `7`/`9`
  fixtures at `test-dispatch-ladder-run.sh:926,947`). Its governing rule —
  *"A distinct exit code is warranted iff the caller must take a distinct
  ACTION. Everything finer rides the stdout token."* — is satisfied here without
  touching the ladder: once the park lands, the existing `parked|held` arm
  (`dispatch-ladder-advance:448-452`) already carries the case, and the terminus
  flips on its own.
- **No halt-detail cause plumbing.** `tactic-eval-finding-ladder-halt-drops-captured-cause`
  owns folding `ADV_ERR_LAST` into the exit-11 halt event.
- **No global `GRAPH_COMMIT_WRITER` default flip and no deletion of
  `assert_clean_outside_ids`.** `intentions/tactic-graph-commit-plumbing-default.md`
  (draft) owns that; Unit 2 here is the narrow per-call-site override that flip
  would later subsume, mirroring the already-validated `dispatch-eval-finding:814`
  pattern.
- **No change to `dispatch-select-tick`'s Step 1** (`:305-450`). The tick
  open-codes its own fetch/merge rather than calling `sync_main_checkout`, and it
  already has a bounded repair lane (attempt counter → `/commit-merge-push` bg
  job → `repo-health` latch → `dispatch-escalate-sync-broken`). It does not deny
  service the way the ladder does, so it is left alone; migrating it onto the
  shared helper is a separate, larger refactor.
- **No standalone residue sweeper.** The original candidate 3 ("have something
  sweep or report stale `intentions/*.md` residue") is answered by Unit 1 for the
  already-landed half — the sweep runs immediately before every fast-forward,
  where it is needed, with no new timer, job or sentinel — and by Unit 3 for the
  half that genuinely needs a person.

---

## Unit 1 — `sync_main_checkout` retries the fast-forward after a lossless clear of already-landed residue

### Scope

**Changes `.claude/skills/dispatch-propagate/scripts/lib.sh` only.**

1. Add a new helper immediately above `sync_main_checkout`
   (`lib.sh:2109-2113`):

   `clear_landed_residue <root>` — restore tracked paths whose **working-tree
   bytes are byte-identical to `origin/main`'s bytes** for that path.

   - Enumerate with `git -C "$root" status --porcelain --untracked-files=no -z`
     and parse the NUL-delimited records (`XY<space>path\0`). Use `-z`, not the
     plain porcelain: plain porcelain quotes and escapes paths containing
     spaces or non-ASCII bytes, and this helper must never act on a
     mis-parsed path.
   - Act **only** on records whose two status characters are exactly `" M"`
     (unstaged modification over a clean index). Skip every other code —
     staged (`M `, `A `, `MM`), deleted (` D`, `D `), renamed/copied, and
     unmerged (`U*`). Never touch untracked files. Never `git stash`, never
     `git reset`, never `git clean`.
   - For each candidate path: compare `git -C "$root" hash-object -- "$path"`
     against `git -C "$root" rev-parse --verify --quiet "origin/main:$path"`.
     Restore with `git -C "$root" checkout -- "$path"` **iff both reads
     succeed and the two SHAs are equal**; otherwise leave the path exactly as
     found.
   - Log every decision to stderr, one line per path, naming the path and
     whether it was restored (and if not, why: `content-not-on-origin-main`,
     `not-an-unstaged-modification`, `restore-failed`). A failed restore
     (e.g. a read-only `.claude/**` carve-out under a sandboxed caller) is
     logged and skipped, never fatal.
   - Returns 0 iff **at least one** path was restored; 1 otherwise. The return
     is "is a retry worth anything", not "is the tree clean".
   - Header must carry the safety argument verbatim in substance: restoring
     from the index/`HEAD` moves the file to the *older* content, which the
     pending fast-forward then brings forward to exactly the bytes that were
     on disk — so the operation is a no-op in final state and loses nothing,
     because `origin/main` already carries those bytes. Cite this node's id.

2. Change `sync_main_checkout` (`lib.sh:2109-2113`) to retry once:

   ```
   git -C "$root" fetch origin main 1>&2 || return 1
   git -C "$root" merge --ff-only origin/main 1>&2 && return 0
   clear_landed_residue "$root" || return 2
   git -C "$root" merge --ff-only origin/main 1>&2 || return 2
   return 0
   ```

   The clear runs **only after** a failed merge, so the clean fast path costs
   nothing extra, and it runs **after** the fetch, so `origin/main` is current
   when the comparison is made. Update the function header
   (`lib.sh:2085-2108`): the return codes are unchanged (0 clean, 1 fetch
   failed, 2 merge failed) but rc 2's *meaning* narrows to "dirty with content
   that is NOT on `origin/main`, or diverged". Keep and extend the existing
   sandbox note — `git checkout -- <path>` is a tree-updating op with the same
   requirement as the merge it precedes.

**Out of scope for this unit:** every call site
(`provision-node-worktree:160-169`, `dispatch-ladder-run:1112-1120`,
`dispatch-tick`, `remove-worktree`, `dispatch-eval-finding`) inherits the fix
with **no call-site edit** — that is the point of putting it here, and it is
what covers `dispatch-ladder-run`'s own `reconcile_pass` sync (which today
`halt 11 throw`s on the same condition) without touching the ladder driver.
Do not migrate `dispatch-select-tick`'s inline fetch/merge onto the helper.

### Tests (in this unit)

Add to `.claude/skills/dispatch-propagate/scripts/test-provision-node-worktree.sh`,
following the existing Case 15/16 shape (`:583-632`) and reusing its
`advance_origin_main` / `run_prov` / `assert_*` helpers:

- **Already-landed residue clears.** Seed and push a file, `advance_origin_main`
  it to new content, then write **that exact new content** into `$MAIN_WT` as an
  uncommitted change. `run_prov` must exit **0**; assert the checkout
  fast-forwarded, the path is clean afterwards
  (`git status --porcelain -- <path>` empty), and the selection gate WAS
  invoked (`$NPX_LOG` non-empty) — the pre-fix behavior was exit 2 with the
  gate never reached.
- **Unlanded residue still refuses.** Case 15 keeps exit 2 unchanged; add an
  assertion that the file's bytes are byte-identical afterwards (the existing
  case already checks the content — keep it and make the intent explicit).
- **Mixed set.** One already-landed residue path plus one genuinely unlanded
  path: exit **2**, and the unlanded path is byte-identical afterwards. This
  pins "the clear never touches content that is not on `origin/main`".
- **Divergence is untouched.** Case 16 keeps exit 2 (a local commit is not
  residue, and the clear cannot help).
- **Staged residue is not touched.** A path whose already-landed content is
  *staged* (`git add`) must be left alone and still refuse — pins the `" M"`-only
  rule.

### Recommended model

`opus` — the safety argument turns on precise git semantics (index vs worktree
vs `origin/main`, porcelain status codes, what `git checkout -- <path>` restores
from) and the helper is shared by every main-checkout caller in the repo.

---

## Unit 2 — `park-node` and `hold-node` write through the plumbing writer, so the escalation lands under residue

### Scope

1. `packages/intentionsutil/scripts/park-node:424` — prefix the single
   `graph-commit` invocation with `GRAPH_COMMIT_WRITER=plumbing`:

   ```
   GRAPH_COMMIT_WRITER=plumbing "$SCRIPT_DIR/graph-commit" -C "$REPO_ROOT" \
     --base "$NODE_ID=$FRESH_BLOB" --expect "$NODE_ID=$EXPECT_BLOB" \
     -m "graph: park $NODE_ID ($REASON)" "$NODE_ID" || GC_RC=$?
   ```

   Per-invocation export, **not** a global default change — mirror
   `dispatch-eval-finding:814` and reproduce the reasoning from its comment
   block (`dispatch-eval-finding:771-796`) in a short comment here, citing this
   node's id and the fact that the park is the *escalation* write: refusing it
   because the checkout is dirty converts a recoverable environment condition
   into `terminus: violation`.

2. `packages/intentionsutil/scripts/hold-node:320-321` — same one-line override
   on its single `graph-commit` invocation (which runs inside a
   `(cd "$REPO_ROOT" && …)` subshell; put the assignment on the command). Same
   reason: `hold-node` is `dispatch-graph-execute`'s other escalation writer
   against the main checkout (`dispatch-graph-execute:379`, `:460`) and fails the
   same way.

3. **Leave the rollback machinery alone.** `park-node`'s `restore_node`
   (`:282-305`) and its `HEAD_BEFORE`/`HEAD`-moved diagnostic (`:259-286`), and
   `hold-node`'s `MUTATED` trap (`:185-200`), stay exactly as they are. Under the
   plumbing writer `HEAD` does not move, so `restore_node`'s pre-refresh restore
   is the correct target on failure — that path becomes *more* reliable, not
   less. Do not delete `hold-node`'s "a failed land must leave NO dirty
   `intentions/*.md`" comment; annotate it instead with the fact that
   `assert_clean_outside_ids` is inert under this writer while the hygiene
   requirement itself stands.

4. **Wire `test-hold-node.sh` into CI.** `packages/intentionsutil/scripts/test-hold-node.sh`
   exists but appears in no workflow step. Add a step to
   `.github/workflows/unit-tests.yml` next to the park-node step at `:293`:

   ```yaml
   - name: Run hold-node tests
     run: packages/intentionsutil/scripts/test-hold-node.sh
   ```

**Explicitly out of scope:** flipping `GRAPH_COMMIT_WRITER`'s default at
`graph-commit:418`, deleting `assert_clean_outside_ids`, and any other
`graph-commit` caller (`transition-node`, `write-node.ts` callers,
`clear-park`, `land-align-round`). Those belong to
`intentions/tactic-graph-commit-plumbing-default.md`.

**Known and accepted interaction:** a plumbing land leaves the node file on disk
holding `origin/main`'s content while local `HEAD` is behind — i.e. it creates
exactly the residue class Unit 1 clears. That is why Unit 1 lands first. Do not
add a post-land working-tree restore here; `graph-commit`'s `sync_ids_to_rev`
(`graph-commit:1872-1893`) is the writer-side primitive for that and changing
the writer's post-land contract is a `graph-commit` decision, not a `park-node`
one.

### Tests (in this unit)

- `packages/intentionsutil/scripts/test-park-node.sh` — new case, built on the
  existing bare-origin + clone harness: with an **unrelated tracked file dirty**
  in the writer clone (a file no park reads), `park-node` must exit 0, the park
  must be verifiable on `origin/main`, and the unrelated dirty file must be
  byte-identical afterwards. Pin the pre-fix failure explicitly in the case
  comment (the `worktree` writer refuses via `assert_clean_outside_ids`).
- Add a companion case where the dirty file is **another node's**
  `intentions/<other-id>.md` — the literal incident shape.
- `packages/intentionsutil/scripts/test-hold-node.sh` — the same
  unrelated-dirty-file case for `hold-node`, asserting the hold and the
  `blocked_by` edge still land in one commit.
- Keep every existing case in both files green, in particular `test-park-node.sh`
  cases 4, 22, 23 and 24 (rollback target, dirty-tree residue assertion, false
  failure, `unknown` verdict) — these encode the contracts this unit must not
  disturb.

### Dependencies

Unit 1.

### Recommended model

`opus` — the diff is two lines plus tests, but it changes the write path of the
repo's escalation writers and interacts with a rollback contract that several
existing regression cases pin.

---

## Unit 3 — `provision-node-worktree` gives the main-checkout sync failure its own exit code, and `dispatch-graph-execute` parks it with an actionable remedy

### Scope

1. `.claude/skills/dispatch-propagate/scripts/provision-node-worktree:160-169` —
   split the main-checkout sync failure out of the generic exit `2`:

   - `SYNC_RC == 1` (fetch failed) and `SYNC_RC == 2` (merge failed) both exit
     **15**, keeping their two distinct stderr sentences verbatim (existing
     tests assert on `'git merge --ff-only origin/main' failed` and
     `this checkout needs a person`, and `test-provision-node-worktree.sh:602`,
     `:626` must keep matching — only the asserted exit code changes).
   - On the merge failure, additionally emit the evidence to **stderr only**:
     `git -C "$PROJECT_ROOT" status --porcelain --untracked-files=no` and the
     count of tracked-dirty paths, plus the one-line note that
     `clear_landed_residue` already ran and found nothing losslessly clearable.
     Evidence goes to the journal, never into a graph node — that constraint is
     the existing reason exit 14's rich capture was kept away from this
     condition (`provision-node-worktree:82-90`).
   - Update the exit-code table in the header (`:46-90`): add `15 main-sync-failed`
     and remove "a main checkout that will not fast-forward onto `origin/main`
     — dirty or diverged" from `2`'s list, keeping `2` for bad node id,
     unresolvable project root, failed add/fetch, `orphan-directory` and the
     `.envrc` mismatch. **15 is free in this script's own exit space**
     (`0, 2, 10, 11, 12, 13, 14`); note in the header that
     `dispatch-ladder-advance`'s reserved 15 lives in a different namespace —
     provision's rc is an input to `dispatch-graph-execute` and never propagates
     to the ladder (the same namespace note `dispatch-ladder-run:288-292` makes
     about await's codes).

2. `.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute` — add a
   `15)` arm to `case "$prov_rc"` (`:230`), placed immediately before the `*)`
   arm at `:469`:

   - Call `PARK_NODE` (`:133`) with a **targeted** reason and recommendation:
     the reason names the condition (`the shared main checkout at <root> could
     not fast-forward onto origin/main; the residue it carries is not on
     origin/main, so nothing could be cleared losslessly`) plus the tracked-dirty
     **count**; the recommendation names the exact remedy commands
     (`git -C <root> status --porcelain --untracked-files=no`, then either land
     the content — `graph-commit` for an `intentions/` node write, commit+push
     for code — or `git -C <root> checkout -- <path>` once it is known
     discardable, and never discard sight-unseen because the uncommitted edit may
     be its only copy). Do **not** serialize the porcelain output into the park
     reason.
   - On park success emit `parked $id main-sync-failed`; on park failure emit
     `failed $id park-failed` and increment `FAILURES`, exactly as the `*)` arm
     does. The third stdout field is additive — `dispatch-ladder-advance` reads
     only word 1 (`:398`) and `dispatch-ladder-run` folds the whole line into the
     halt detail — so no consumer changes.
   - Update this script's header disposition/exit list (`:60-100`) with the new
     `parked … main-sync-failed` token.
   - Leave the `*)` arm's behavior unchanged for every other mechanical error.

   The new arm earns its own code under the in-flight sibling's governing rule:
   the caller takes a **distinct action** (a different park reason, a different
   remedy, and stderr evidence capture), which is the same justification
   `case 14)` (`:417-467`) already stands on.

3. Do not touch `dispatch-ladder-advance` or `dispatch-ladder-run`. With Unit 2
   the park lands, so `classify_terminus` reads `.office_hours != null` and
   returns `excused-parked` — the halt stays exit 11 and stops being a
   `violation`.

### Tests (in this unit)

- `test-provision-node-worktree.sh` — Cases 15 and 16 change their asserted exit
  code from `2` to `15`, keep every stderr and byte-identity assertion, and gain
  an assertion that the porcelain evidence reached stderr.
- `test-dispatch-graph-execute.sh` — new cases using the existing
  `provision-node-worktree` stub's `PROV_RC` knob (`:65-98`), in the shape of
  Cases 8b/8c (`:336-360`):
  - `PROV_RC=15` with a working `park-node` → stdout `parked <id> main-sync-failed`,
    script exit 0, and the recorded park reason names the checkout and the
    remedy commands.
  - `PROV_RC=15` with a failing `park-node` → `failed <id> park-failed`, exit 1
    (the residual failure mode, unchanged).
  - `PROV_RC=2` still routes to the `*)` arm with its generic reason —
    pins that the split did not swallow the catch-all.

### Dependencies

Units 1 and 2.

### Recommended model

`sonnet` — mechanical: one new exit code, one new `case` arm modelled on an
adjacent arm, header-table edits, and explicitly enumerated test cases.

---

## Reuse

- `sync_main_checkout` — `.claude/skills/dispatch-propagate/scripts/lib.sh:2109-2113`.
  The one shared fetch+fast-forward primitive; already called by
  `provision-node-worktree:161`, `dispatch-ladder-run:1112` (`reconcile_pass`),
  `dispatch-tick`, `remove-worktree` and `dispatch-eval-finding`. Extending it is
  what makes Unit 1 reach every caller with zero call-site edits.
- `GRAPH_COMMIT_WRITER=plumbing` — `packages/intentionsutil/scripts/graph-commit:418`
  (default), `:1661-1737` (`build_commit_plumbing`), `:3699-3710` (writer gate).
  The already-shipped working-tree-free writer. The per-invocation override
  pattern Unit 2 copies verbatim is
  `.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding:814`, with its
  rationale at `:771-796`.
- `assert_clean_outside_ids` / `_offending_path_is_marker_only_residue` —
  `packages/intentionsutil/scripts/graph-commit:3593-3660` / `:3552-3591`. The
  existing precedent for a node-set-scoped dirty check and for a targeted
  `git checkout -- <path>` remedy string (`:3637`); Unit 1's per-path comparison
  is the same family of reasoning applied to `origin/main` content.
- `sync_ids_to_rev` — `packages/intentionsutil/scripts/graph-commit:1872-1893`.
  The plumbing writer's path-scoped working-tree sync. Referenced by Unit 2's
  out-of-scope note; not called by this plan.
- `PARK_NODE` / `HOLD_NODE` wiring — `dispatch-graph-execute:133`, `:135`; the
  `case 14)` arm at `:417-467` is the structural template for Unit 3's `15)` arm
  (evidence to stderr, targeted reason and recommendation, explicit
  success/failure tokens).
- `classify_terminus` / `terminus_probe` — `dispatch-ladder-run:821-957`
  (`excused-parked` at `:948-949`). Read-only here: Unit 2 changes what this
  classifier *sees*, not what it does.
- `reservation_clear` — `.claude/skills/dispatch-propagate/scripts/lib-reservation-ledger.sh:384-400`.
  Unchanged; noted so no unit invents its own release logic.
- Test harnesses to extend rather than replace:
  `.claude/skills/dispatch-propagate/scripts/test-provision-node-worktree.sh`
  (`advance_origin_main` / `run_prov`, Cases 14-17 at `:540-640`),
  `.claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh`
  (the `PROV_RC` stub at `:65-98`, Cases 8b/8c at `:336-360`),
  `packages/intentionsutil/scripts/test-park-node.sh` (bare-origin + writer-clone
  harness; Cases 4, 22, 23, 24), and
  `packages/intentionsutil/scripts/test-hold-node.sh`.
- Existing repair/latch primitives, deliberately **not** extended here but named
  so a later unit does not re-invent them: `sync_repair_read_attempts` /
  `_bump_` / `_reset_attempts` (`lib.sh:2146-2183`), `repo-health
  --set-sync-broken|--clear-sync-broken|--sync-broken-latched`
  (`.claude/skills/dispatch-propagate/scripts/repo-health:314-368`),
  `dispatch-escalate-sync-broken`, and `dispatch-select-tick:305-450`'s Step 1
  lane that composes them.

## Verification

Run the shell suites the three units touch. These drive real `git` against
throwaway repositories and (for the ladder/graph suites) tree-updating
operations, so run them with `dangerouslyDisableSandbox: true` if a sandboxed
attempt fails read-only (`.claude/rules/sandbox.md`).

```verify
.claude/skills/dispatch-propagate/scripts/test-provision-node-worktree.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh
```

```verify
packages/intentionsutil/scripts/test-park-node.sh
```

```verify
packages/intentionsutil/scripts/test-hold-node.sh
```

```verify
packages/intentionsutil/scripts/test-graph-commit.sh
```

```verify
.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-run.sh
```

```verify
.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-advance.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-select-tick.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

The last three are regression, not new coverage: `test-dispatch-ladder-run.sh`
and `test-dispatch-ladder-advance.sh` must stay green with **no edits** (the
proof that this plan stayed out of the ladder's exit-code space, and in
particular that the deliberately-unmapped `7|weird` and `9|surprise` fixtures at
`test-dispatch-ladder-run.sh:926,947` are untouched), and
`test-dispatch-select-tick.sh` must stay green with no edits (the proof that the
tick's own sync-repair lane was not disturbed).

Manual and observe-in-production checks:

- **The incident, replayed by hand.** In a scratch clone with a bare origin:
  land a node file through `GRAPH_COMMIT_WRITER=plumbing graph-commit` while the
  clone's local `main` is behind, confirm `git status` shows the node file `M`,
  then run `provision-node-worktree <id> <phase>` and confirm it now exits 0
  with the checkout fast-forwarded and the file clean. Pre-fix the same sequence
  exits 2.
- **The escalation still escalates.** Repeat with genuinely unlanded content in
  the checkout (bytes that are on no ref): `provision-node-worktree` must exit
  15, `dispatch-graph-execute` must print `parked <id> main-sync-failed`, and the
  node must carry `office_hours` on `origin/main` afterwards. Then run
  `dispatch-ladder-run` against that node and confirm the halt line reads
  `terminus excused-parked` rather than `terminus violation` — this is the
  single observation that closes this finding.
- **No data loss.** In the same run, confirm the unlanded file is byte-identical
  after the refusal. This is the property the whole design rests on and it is
  worth a human's eyes once, not only a fixture's.
- **Recurrence.** After the change is on `main`, a later `/rsi` pass should see
  no new occurrence of this entry; `attributes.measured_impact.recurrence_count`
  on this node stays at 1. A recurrence with the *same* cause after these three
  units means the residue class is wider than "already on `origin/main`", and the
  next entry should record which bytes were not on any ref.
