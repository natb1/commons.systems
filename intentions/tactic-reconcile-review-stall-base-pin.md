---
id: tactic-reconcile-review-stall-base-pin
kind: tactic
statement: reconcile-graph-review-stall must pin the diagnosis-time base blob on
  its landing graph-commit, so a concurrently landed write is three-way-merged
  rather than clobbered by a stale in-memory node
owner: ai
status: codified
parent: null
rationale: "Sibling call site split out of tactic-reconcile-park-clobber (bug X)
  at that node's own direction: its plan states that
  .claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall:276-290
  builds its GC_ARGS with the same zero---base shape and carries the same latent
  lost-update exposure, but that it is deliberately out of scope there because
  its writes are fix-state writes on a different sweep with different id
  sourcing -- 'A sibling node should carry it; do not widen this PR to cover
  it.' This node is that sibling. The remedy is analogous, not identical: the
  greenfield contract is that every graph-write primitive pins the blob it read
  as --base on its landing graph-commit (park-node, clear-park and
  lib-frozen-session-park.sh all do this today; 4725a16b landed it for the
  frozen-session sweep), and reconcile-graph-review-stall is a primitive that
  never adopted it. Filed 2026-08-05 by the bootstrap monitor pass after a
  find-or-create dedup check over intentions/ found no existing owner: the
  tactic-review-stall-* family covers cache-miss, conflict-lane, duplicate-scan,
  subprocess-spawn and duplicate-fetch concerns, and
  tactic-reconcile-graph-{mainqa-guard-prune,merged-test-harness} cover other
  reconcile concerns -- none pins --base. Bug X's own measured rate on the
  sibling call site (8 park erasures across 5 nodes in one 24h window) is the
  reason this exposure is worth closing rather than leaving latent."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications:
  - question: "Re-check requested by commit e6421e6c: does the 2026-08-13
      tactic-eval-finding-reconcile-base-revert-blocks-main-graph-writes
      occurrence support this node, and is the code anchor in the rationale
      still valid after PR #3090?"
    answer: "Re-checked 2026-08-14. Three results. (1) EVIDENCE — the occurrence is
      not evidence for this node and was never cited by it. This node was filed
      2026-08-05; the occurrence is 2026-08-13. The occurrence has since been
      re-diagnosed: the leaked node file came from graph-select-target
      --clear-fix in _gate_fix_active, not from a reconciler, and nothing stale
      was involved — apply-fix-state.ts --clear-fix writes execution.fix = null
      and strips the reviewed marker, precisely the two fields that had changed
      since db9e7f2c, so a current write reproduced the old blob byte for byte.
      The write was current; the commit refused to start. A --base pin would not
      have prevented it. This node stands on its original evidence unchanged:
      tactic-reconcile-park-clobber measured 8 park erasures across 5 nodes in
      one 24h window on the sibling call site. (2) GAP — the exposure is still
      open. reconcile-graph-review-stall builds its landing GC_ARGS with no
      --base at lines 323-326 as of 1092a403, and the file contains zero
      occurrences of --base. (3) ANCHOR — the rationale cites
      reconcile-graph-review-stall:276-290 for that GC_ARGS build. That anchor
      drifted when e6421e6c inserted the rollback-arming block; :276-290 now
      holds the HEAD_AT_ARM pin, and the GC_ARGS build is at :323-326. What
      e6421e6c did change here is the rollback idiom, not the pin: the sweep no
      longer restores a captured origin/main blob (which left the tree dirty
      when the checkout lagged origin/main) but calls the shared
      graph_rollback_node_writes at :154. Rollback-on-failure and
      compare-and-swap-on-land are separate remedies; only the first has
      shipped."
  - question: "Finalize round, 2026-08-19: is the --base gap still open at
      origin/main 58e643e9, is the contract this node applies already ratified
      doctrine, and does a new shared lib carry the copy-fixture cost the caller
      feared?"
    answer: "Re-verified 2026-08-19 by the /align-tactics tactic-mode finalize
      round. Three results. (1) GAP — still open. At origin/main 58e643e9 `grep
      -c -- '--base'
      .claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall`
      returns 0; the landing GC_ARGS build is now at :323-326 and the
      pre---set-fix capture point at :286, so the anchors drifted again from the
      2026-08-14 re-check's baseline. Three sibling tactics
      (tactic-review-stall-listnodes-duplicate-scan,
      tactic-review-stall-predicate-subprocess-spawn,
      tactic-review-stall-pr-json-duplicate-fetch) are at phase: implement on
      this same file, so the anchors are expected to drift again before this
      node implements — the plan therefore locates both splice points by code
      shape and scopes out :188-265, which those siblings own. (2) DOCTRINE —
      the contract this node applies (every graph-write primitive pins the blob
      it read as --base on its landing graph-commit) needs no fresh author
      ruling: its canonical prose home is
      .claude/skills/ref-diagnosis-time-cas/SKILL.md,
      tactic-graph-write-recipes-base-cas is phase: done, and three primitives
      implement it today. Two idioms exist and must not be swapped —
      park-node/clear-park and lib-frozen-session-park.sh:580-591 re-resolve
      --base from the origin/main REF (git rev-parse) with an exit-3
      stale-diagnosis refusal, while reconcile-graph-merged pins the ON-DISK
      working-tree blob with `git hash-object -w`. This sweep's case is
      reconcile-graph-merged's, because apply-fix-state.ts reads and writes the
      on-disk file; -w is mandatory because graph-commit's check_base_freshness
      resolves the base with `git cat-file -p` and dies when the blob is absent
      from the local object database. (3) FIXTURE COST — the caller flagged a
      new shared lib as risking the ~17-fixture copy-seed breakage class.
      Measured and refuted: exactly one harness, test-graph-write-rollback.sh,
      copies either reconcile sweep into a seed repo
      (test-dispatch-select-tick.sh names both but writes no-op fakes), so one
      `cp` in one build_seed_repo() covers it. The greenfield extraction
      therefore ships in this PR rather than being deferred behind a brownfield
      copy-the-idiom step."
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# reconcile-graph-review-stall must pin the diagnosis-time base blob on its landing graph-commit, so a concurrently landed write is three-way-merged rather than clobbered by a stale in-memory node

## Context

`.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall` is a
graph-write primitive: it enumerates tactics stranded at `phase: review` with the
`reviewed` marker, polls each one's PR, and for the `fix` route mutates
`intentions/<id>.md` on disk (`apply-fix-state.ts --set-fix`) before landing every
staged write as ONE `graph-commit`.

It hands `graph-commit` **zero** `--base` flags. Measured on this worktree at
origin/main `58e643e9`: `grep -c -- '--base'
.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall` returns
`0`. The file has no pin at all.

Without a pin, `check_base_freshness()`
(`packages/intentionsutil/scripts/graph-commit:766`) short-circuits on its first
line and the sweep lands whatever is on disk. The disk content came from a
whole-node read/rewrite (`apply-fix-state.ts` reads the node, sets
`execution.fix`, writes the WHOLE node back from that in-memory read), so any
field another writer landed on origin/main between this sweep's enumeration and
its commit is silently overwritten — `office_hours` most damagingly, because the
sweep never touches that field and therefore has nothing legitimate to say about
it. That is **bug X**, the same lost-update class already closed on the sibling
sweep `reconcile-graph-merged`. Bug X's measured rate on that sibling call site
was 8 park erasures across 5 nodes in one 24h window; that measurement is the
reason this latent exposure is worth closing rather than leaving.

This node is the sibling split out of `tactic-reconcile-park-clobber` (phase:
done) at that node's own direction. Its plan states that this call site "builds
its `GC_ARGS` with the same zero-`--base` shape and carries the same latent
lost-update exposure", that it is deliberately out of scope there because these
are fix-state writes on a different sweep with different id sourcing, and that
"a sibling node should carry it; do not widen this PR to cover it."

The intended outcome: the review-stall sweep pins, per node id, the blob of the
file it read (the diagnosis-time base) and threads it as `--base <id>=<blob>` on
its landing `graph-commit`, so a concurrently landed write is **three-way merged**
(base = the pinned blob, ours = the sweep's on-disk edit, theirs = origin/main's
landed content) rather than clobbered — and `graph-commit` fails closed to a
structured park on genuinely unresolvable divergence.

### Greenfield design, and why the migration is one PR

The ideal design is not "copy the pin into a second script." The CAS-pin idiom
(id-shape gate + `git hash-object -w` on the on-disk file) is a **class**
requirement on graph-write primitives, and this repo already has the precedent
for what happens when such an idiom is re-derived per writer. The header of
`.claude/skills/dispatch-propagate/scripts/lib-graph-rollback.sh:11-17` records
it verbatim: *"This file exists because that rollback had been re-derived per
writer and the copies drifted. reconcile-graph-merged grew the correct one; its
siblings kept an earlier, subtly wrong idiom … New writers call it; they do not
re-derive it."* The rollback idiom drifted exactly once and was then extracted.
The CAS pin is at the same point in its life: one correct copy
(`reconcile-graph-merged`), one writer about to need it (`reconcile-graph-review-stall`).

So the greenfield design is a shared, standalone
`lib-graph-base-pin.sh` sitting beside `lib-graph-rollback.sh`, with both sweeps
calling it and neither owning a private copy.

The usual objection to a new lib file — a new `source` line breaks the ~17
copy-fixtures that build seed repos — **does not apply here** (measured
2026-08-19 at origin/main `58e643e9`, and re-measure before relying on it). The
check that matters is not how many files mention `lib-graph-rollback.sh` (that
is five: the lib, `test-graph-write-rollback.sh`, and the three consumers
`graph-select-target`, `reconcile-graph-merged`, `reconcile-graph-review-stall`),
but how many test harnesses copy the two scripts gaining the new `source` into a
seed repo. `grep -rln 'cp .*reconcile-graph-merged\|cp .*reconcile-graph-review-stall'`
over `.claude`, `packages` and `.github` returns exactly one file:
`test-graph-write-rollback.sh`. (`test-dispatch-select-tick.sh:141-153` names
both sweeps, but writes silent no-op *fakes* rather than copying the real
scripts, so it is unaffected.) One `cp` line in one `build_seed_repo()` covers
the whole fixture cost. There is therefore no brownfield/greenfield split to
make: the ideal design ships in this PR.

### Carried-forward evidence (measured 2026-08-19, origin/main 58e643e9)

Locate by symbol, not by line — the stored rationale's `path:line` anchor is
stale and every anchor below was re-measured at this HEAD.

**Anchors in `.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall`
(340 lines):**

- `source "$SCRIPT_DIR/lib.sh"` at `:91`; `source "$SCRIPT_DIR/lib-graph-rollback.sh"`
  at `:94`.
- `UTIL_SCRIPTS` at `:111`, `GRAPH_COMMIT="$UTIL_SCRIPTS/graph-commit"` at `:112`.
- `HEAD_AT_ARM=""` declaration at `:151`; `restore_staged_writes()` immediately
  below it; the EXIT trap that calls it below that.
- The `fix)` case arm — the mutation site:
  - lazy `HEAD_AT_ARM=$(git ... rev-parse HEAD)` capture at `:277`
  - tracked-at-HEAD guard `git -C "$REPO_ROOT" cat-file -e "HEAD:intentions/$id.md"`
    at `:282-285` (skips with `continue` when untracked)
  - `WRITTEN_IDS+=("$id")` at `:286`, `RESTORE_ON_FAILURE=1` at `:287`
  - the disk mutation `node --import tsx/esm "$UTIL_SCRIPTS/apply-fix-state.ts"
    "$id" --set-fix --dir "$REPO_ROOT/intentions"` at `:288`
  - `RECOVERED_IDS+=("$id")` at `:293`
- The `conflict)` arm below it is a **deliberate retired no-op**
  (tactic-graph-router-conflict-routing) — nothing staged, `ACTED` not
  incremented. Do not revive it.
- Landing block: `GC_ARGS=(-C "$REPO_ROOT" -m "graph: enter fix-interrupt on
  stalled reviews (${#RECOVERED_IDS[@]} node(s))")` at `:323`; the positional-id
  loop `for id in "${RECOVERED_IDS[@]}"; do GC_ARGS+=("$id"); done` at `:324`;
  the invocation `"$GRAPH_COMMIT" "${GC_ARGS[@]}"` at `:326`.
- The rationale's cited `:276-290` for the GC_ARGS build is **wrong at this HEAD**
  — `:276-282` holds the `HEAD_AT_ARM` rollback-arming block. This drift was
  already recorded by the node's own 2026-08-14 re-check clarification.

**Sibling precedent in `.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged`:**

- `declare -A BASE_BLOB=()` at `:230`.
- `validate_node_id()` at `:253-259` — hard-errors on an id that is unsafe as the
  KEY of `--base <id>=<blobsha>`. `add_blob_pair()` splits the pair at the FIRST
  `=`, so an id of the shape tactic-a=b records the pin under the truncated id
  tactic-a with a garbage sha, silently re-keying the pin onto a different node.
  (Those two placeholder ids are deliberately un-backticked: the prose-reference
  validator resolves backticked `tactic-*` tokens against the store and would
  reject them as dangling.) Whitespace and
  control characters are equally unsafe. Regex: `^[A-Za-z0-9][A-Za-z0-9._-]*$`.
  It is defined **only here** — it is not in `lib.sh` and
  `reconcile-graph-review-stall` has no copy.
- The rationale comment at `:205-230` explaining the pin, and specifically
  **Ruling 31, read side vs write side** (`:215-220`): the pin governs the WRITE
  side only and must NOT be "simplified" into a read-side skip. The review-stall
  sweep's own read-side exclusions (parked nodes at the `office_hours != null`
  enumeration gate, open blockers) are a separate mechanism and stay exactly as
  they are.
- The pin loop at `:294-300`: `blob=$(git -C "$REPO_ROOT" hash-object -w --
  "intentions/$sid.md")`, preceded by `validate_node_id "$sid"`. The rationale at
  `:278-293` records two things the implementer must preserve:
  - `-w` is **MANDATORY**, not an optimization: `check_base_freshness` resolves
    the base with `git cat-file -p <sha>` and `die()`s "base blob … is unreadable
    in the local object database" when it misses. A disk blob differing from
    every committed blob is absent from the object DB unless `-w` writes it.
  - The **ON-DISK** blob is pinned, never `origin/main`'s. `graph-commit` defines
    base as "the blob the writer read"; pinning `origin/main` when the checkout
    lags would make `scalarMerge` compute a spurious "ours" delta on untouched
    fields and could revert landed content — the exact failure the pin exists to
    close. (Contrast `lib-frozen-session-park.sh`, which pins with `git rev-parse
    "origin/main:intentions/<id>.md"` because its source IS a git ref. Do not
    swap the two forms.)
- `--base` threading at `:329-348`: re-validates the id at the pair-construction
  site (defense in depth against plan drift), hard-errors when a planned edit id
  has no pin ("a skipped pin is an UNPROTECTED write"), then appends
  `GC_ARGS+=(--base "$id=${BASE_BLOB[$id]}")` followed by the positional ids.

**Consumer — `packages/intentionsutil/scripts/graph-commit`:**

- `add_blob_pair()` at `:670`, `parse_blob_arg()` at `:685` — the `<id>=<sha>`
  pair parser, dies on a malformed pair.
- Flag parsing at `:3659-3660` accepts BOTH repeated `--base <id>=<sha>` flags and
  a manifest file path. The repeated-pair form is what the sibling uses and what
  drops straight into this sweep's existing id loop. **No graph-commit change is
  needed** — it is the consumer this sweep must feed correctly.
- `check_base_freshness()` at `:766` — its no-`--base` short-circuit on the first
  line IS the defect being closed.

**Doctrine:** `.claude/skills/ref-diagnosis-time-cas/SKILL.md` is the canonical
prose reference for the diagnosis-time compare-and-swap contract. Cite it from
code comments rather than re-deriving the rationale inline, exactly as
`reconcile-graph-merged` does.

### Concurrent siblings on the same file — expect textual conflicts, not semantic overlap

Three tactics are at `phase: implement` right now, all editing
`reconcile-graph-review-stall`, and all three explicitly scope OUT the regions
this node owns:

- `tactic-review-stall-listnodes-duplicate-scan` — owns the `listNodesStrict`
  candidate enumeration (`:188-207`).
- `tactic-review-stall-pr-json-duplicate-fetch` — owns the `gh_pr_view_rest`
  fetch (~`:224`).
- `tactic-review-stall-predicate-subprocess-spawn` — owns the `reviewStallRoute`
  subprocess (~`:258-265`). Its plan names `reconcile-graph-review-stall:288`
  (the `apply-fix-state` call) as EXPLICITLY OUT OF SCOPE for itself, and
  likewise the landing block.

This node's scope is exactly: the per-id pin capture inside the `fix)` arm
(before `:288`), the `--base` threading in the GC_ARGS build (`:323-326`), the
id-shape gate, the shared lib, and new test cases. **Nothing in `:188-265`.**
Merge origin/main early and expect textual conflicts in the shared file.

### Explicitly out of scope

- `reconcile-graph-merged`'s pin **behavior**. Unit 1 relocates its function
  bodies into a shared lib; the resulting behavior must be byte-for-byte
  equivalent and cases 6/6b/7/8/9/9a remain its regression guard.
- The rollback idiom. It already shipped: `graph_rollback_node_writes` is called
  from `restore_staged_writes()` and the shared lib is `lib-graph-rollback.sh`.
  Rollback-on-failure and compare-and-swap-on-land are **separate remedies**;
  only the first has shipped for this sweep, and this node is the second. Do not
  touch the rollback.
- The `conflict)` route arm — a deliberate retired no-op.
- Any read-side change. The sweep's `office_hours != null` enumeration exclusion
  and its open-blocker gate stay exactly as they are (Ruling 31).
- `graph-commit` itself. It already parses repeated `--base` pairs.

---

## Unit 1 — Extract the CAS-pin idiom into `lib-graph-base-pin.sh` and move `reconcile-graph-merged` onto it

**Scope.**

Create `.claude/skills/dispatch-propagate/scripts/lib-graph-base-pin.sh`, a
standalone shell library that `source`s nothing (it is copied into test fixtures
standalone, exactly as `lib.sh` and `lib-graph-rollback.sh` are — state that in
its header). Model its header on
`.claude/skills/dispatch-propagate/scripts/lib-graph-rollback.sh:1-28`: say why
the file exists (the CAS pin was about to be re-derived by a second writer, and
the rollback idiom already drifted once when it was), and point at
`.claude/skills/ref-diagnosis-time-cas/SKILL.md` for the doctrine.

Three functions, parameterized by a `<label>` argument the way
`graph_rollback_node_writes` is, so diagnostics name the calling sweep:

1. `node_id_is_safe <id>` — pure predicate, returns 0/1, prints nothing, never
   exits. Body is the regex from `reconcile-graph-merged:254`:
   `[[ "$1" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]]`. Carry over the explanatory
   comment from `reconcile-graph-merged:243-252` (the first-`=` re-keying hazard,
   whitespace/control chars, "a skipped pin is an UNPROTECTED write").
2. `require_safe_node_id <label> <id>` — calls `node_id_is_safe`; on failure
   prints the diagnostic to stderr (`<label>: unsafe node id …` naming the
   regex, using `printf '%q'` on the id as `reconcile-graph-merged:255` does) and
   `exit 1`. This is `validate_node_id`'s exact behavior, label-parameterized.
3. `pin_base_blob <repo-root> <label> <id>` — prints the blob sha on stdout;
   on failure prints a diagnostic to stderr and **returns non-zero without
   exiting**, so each caller chooses skip-vs-abort. Body:
   `git -C "$1" hash-object -w -- "intentions/$3.md"`. Carry over the `-w`-is-
   mandatory and pin-the-on-disk-blob comments from `reconcile-graph-merged:278-293`
   verbatim in substance.

Then repoint `.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged`:

- Add `source "$SCRIPT_DIR/lib-graph-base-pin.sh"` beside its existing
  `source "$SCRIPT_DIR/lib-graph-rollback.sh"` at `:87`.
- Delete the local `validate_node_id()` definition at `:253-259`, moving its
  explanatory comment block (`:243-252`) into the lib rather than dropping it.
- Replace `validate_node_id "$sid"` (`:296`) with
  `require_safe_node_id reconcile-graph-merged "$sid"`, and the pin line
  (`:297-298`) with
  `blob=$(pin_base_blob "$REPO_ROOT" reconcile-graph-merged "$sid") || exit 1`
  — preserving its current hard-error-with-message posture.
- Replace `validate_node_id "$id"` at `:342` with
  `require_safe_node_id reconcile-graph-merged "$id"`.
- Leave the `no pinned base blob for planned edit id` hard-error at `:343-345`
  and every `--base` pair construction at `:346` untouched.

Finally, in `.claude/skills/dispatch-propagate/scripts/test-graph-write-rollback.sh`,
add one `cp` inside `build_seed_repo()` — beside the existing
`cp "$HARNESS_DIR/lib-graph-rollback.sh" …` line (the file's `build_seed_repo`
runs roughly `:124-157`, with the lib copies at its tail) — copying
`lib-graph-base-pin.sh` to
`$dst/.claude/skills/dispatch-propagate/scripts/lib-graph-base-pin.sh`.

Out of scope for this unit: any behavior change. Cases 6, 6b, 7, 8, 9, 9a in
`test-graph-write-rollback.sh` must pass unchanged, with **no edit to their
assertions**. Before starting, check whether any of those cases greps
`reconcile-graph-merged`'s stderr for the literal `validate_node_id`/unsafe-id
message; the audit at planning time found none (case 6 asserts on `--base` count
and pinned values; 6b on filtering; 7 on landed content; 8/9/9a on tree
cleanliness), but re-confirm before changing the message prefix. If one does,
keep the message text identical rather than weakening the assertion
(`.claude/rules/test-integrity.md`).

**Recommended model:** sonnet.

---

## Unit 2 — Thread the diagnosis-time pin through `reconcile-graph-review-stall`

**Scope.** Single production file:
`.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall`.

1. **Source the lib.** Add `source "$SCRIPT_DIR/lib-graph-base-pin.sh"` beside the
   existing `source "$SCRIPT_DIR/lib-graph-rollback.sh"` at `:94`, with a
   one-line comment naming what it provides.

2. **Declare the map.** Add `declare -A BASE_BLOB=()` beside the existing
   `WRITTEN_IDS=()` / `RESTORE_ON_FAILURE=0` / `HEAD_AT_ARM=""` declarations
   (around `:149-151`).

3. **Pin per candidate, before the mutation.** Inside the `fix)` arm, insert the
   pin **after** the tracked-at-HEAD guard (`:282-285`) and **before**
   `WRITTEN_IDS+=("$id")` (`:286`) — i.e. before `apply-fix-state.ts --set-fix`
   at `:288` mutates the file. The pinned blob must be the content the writer
   read, which is the on-disk file at that instant:

   - `node_id_is_safe "$id"` — on failure, print a loud stderr diagnostic naming
     the id and `continue`. Rationale to put in a comment: this loop's
     established contract is a per-candidate skip (the tracked-at-HEAD guard
     immediately above does exactly this), nothing is staged for this id yet, the
     sweep is idempotent, and aborting would roll back earlier candidates'
     legitimate staged writes. The skip is loud, not silent, and it never lands
     an unprotected write — which is the invariant that matters.
   - `BASE_BLOB[$id]=$(pin_base_blob "$REPO_ROOT" reconcile-graph-review-stall
     "$id") || continue` — same posture, same reasoning; `pin_base_blob` already
     printed the diagnostic.

   Add a comment at the insertion point recording **why the pin sits here and not
   later**: `apply-fix-state.ts` rewrites the WHOLE node from its in-memory read,
   so the base must be the pre-mutation blob; pinning after the write would pin
   the sweep's own output and defeat the CAS entirely.

4. **Thread `--base` into the landing call.** In the block at `:323-326`, between
   the `GC_ARGS=(…)` initializer (`:323`) and the positional-id loop (`:324`),
   insert a loop over `RECOVERED_IDS` mirroring `reconcile-graph-merged:341-347`:

   - `require_safe_node_id reconcile-graph-review-stall "$id"` — re-gate at the
     exact point the `<id>=<sha>` pair is built (defense in depth; `graph-commit`
     splits at the first `=`).
   - `[[ -n "${BASE_BLOB[$id]:-}" ]]` or hard-error: print
     `no pinned base blob for recovered id <id>` to stderr and `exit 1`. This
     is an invariant break, not a transient — every id in `RECOVERED_IDS` was
     pinned two statements before it was appended. `RESTORE_ON_FAILURE` is 1 at
     this point, so the EXIT trap rolls every staged write back and the tree is
     left clean.
   - `GC_ARGS+=(--base "$id=${BASE_BLOB[$id]}")`.

   Leave the positional-id loop at `:324` and the invocation at `:326`
   structurally as they are; leave the `-C "$REPO_ROOT"` argument and its
   explanatory comment untouched.

5. **Comment the write-side/read-side split.** Above the landing block, add the
   Ruling 31 note in this sweep's own terms, mirroring
   `reconcile-graph-merged:215-220`: the pin governs the WRITE side only and must
   not be "simplified" into a read-side skip. This sweep already excludes parked
   nodes at enumeration for a different reason (a human owns a parked node's
   state); the pin exists so that a park landing *after* enumeration is merged in
   rather than erased. Both properties hold at once. Also record the expected
   merge outcome: `office_hours` is a field this sweep never touches, so
   `ours == base` and `scalarMerge` takes theirs (the concurrent park survives),
   while `execution.fix` is unchanged on origin (`theirs == base`) so it takes
   ours.

Out of scope: `:188-265` (owned by the three concurrent siblings), the
`conflict)` no-op arm, the rollback, the enumeration gates, and any change to
`graph-commit`.

**Recommended model:** opus.

**Dependencies:** Unit 1.

---

## Unit 3 — Regression cases: pin construction, and the end-to-end race

**Scope.** Single test file:
`.claude/skills/dispatch-propagate/scripts/test-graph-write-rollback.sh`.
**Extend it; do not create a new harness.** This file is NOT autodiscovered by
CI, so it must be invoked explicitly (see ## Verification).

**Append both cases at the END of the file**, after the `# Case 11b` banner, which is
the last case in the file. Number them **Case 12** and **Case 13**. Locate the tail by
that banner, not by a line number: re-measured 2026-08-30 on `origin/main` the file is
1825 lines with `# Case 11b` at `:1789`, so this plan's earlier "ends around `:1668`"
pointed into the middle of Case 11. Do not insert
them into the 10a–10c region: three sibling tactics are mid-implement on this same
sweep and are likely appending near 10x, and appending at the tail minimizes
textual conflict.

Reuse the existing helpers unchanged, locating each by name. Every line number this
plan used to carry for them was stale when re-measured on 2026-08-30, by 6 to 157 lines
— `review_stall_gh_stub()` alone had moved from the cited `:1244` to `:1401`. The
helpers: `new_origin()`,
`build_seed_repo()`, `init_and_push()`,
`clone_with_node_modules()`, `ok()`/`no()`,
`review_stall_gh_stub()` (stubs both REST surfaces: an OPEN/MERGEABLE PR
and a red check-runs verdict), `review_stall_node()` (seeds
`phase: review` + `markers: [reviewed]` + `execution.pr` + `office_hours: null` —
exactly the enumeration's candidate shape). `build_seed_repo()` already copies
`apply-fix-state.ts`, `merge-node.ts`, `graph-commit`, `lib.sh` and
`lib-graph-rollback.sh`; Unit 1 adds `lib-graph-base-pin.sh` to it. Each case
still copies the sweep under test itself, as case 10a does at `:1319-1320`.

**Case 12 — pin construction.** Transpose case 10a's shape (`:1313-1361`) and
case 6's assertions:

- Seed two candidates via `review_stall_node`, both eligible for the `fix` route.
- Capture each node file's blob **before** running the sweep
  (`git -C "$CLONE" hash-object -- intentions/<id>.md` — no `-w` needed to
  compute the expected value).
- Install the argv-capturing `graph-commit` stub (`printf '%s\n' "$@" >file;
  exit 0`) exactly as case 10a does at `:1330-1335`, at
  `$CLONE/packages/intentionsutil/scripts/graph-commit`.
- Run the sweep with `PATH="$BIN:$PATH" GC_FIXTURE_DIR="$FIX"`.
- Assert: rc 0; the captured argv contains exactly **one** `--base` flag per
  recovered id (`grep -c -- '^--base$'` equals the candidate count); and for each
  id the argv contains the literal line `<id>=<pre-run-blob-sha>`. Asserting the
  exact sha (not merely presence) is what proves the pin is the diagnosis-time
  blob; this is the assertion shape
  `test-lib-frozen-session-park.sh:726-745` uses for the same property.
- Also assert the pinned blob follows **disk**, not `origin/main`: for one of the
  two nodes, land a divergent change to it on `origin/main` out-of-band after the
  clone (so the clone's on-disk copy and `origin/main`'s differ) and assert the
  pin equals the **clone's** blob. Case 6 makes the same distinction with its
  `t-r2` node.

**Case 13 — THE RACE.** This is the case that reproduces bug X and must go red if
Unit 2's `--base` threading is reverted. Port case 7's mechanism (`:863-979`)
wholesale, swapping only the sweep and the fields:

- Seed one candidate node via `review_stall_node`, `office_hours: null`.
- Move the real `graph-commit` aside to `graph-commit.real` and install the
  sentinel-guarded wrapper from case 7 (`:900-947`) **in the SEED, then push it** —
  never in the clone. Case 7's comment at `:889-899` records why this is
  load-bearing and not tidiness: a wrapper committed in the clone makes the
  worktree "ahead of origin/main with non-intentions changes", `graph-commit`
  then takes its `ensure_intentions_only_base()` `git reset --hard FETCH_HEAD`
  path and DISCARDS the merged file, so the case would fail for a reason
  unrelated to the code under test.
- The wrapper, on its first invocation only: clones `$GC_ORIGIN` fresh, `awk`-rewrites
  `office_hours: null` into a park block on `intentions/$GC_NODE.md`, commits and
  pushes to `origin/main`, then runs `git -C "$GC_CLONE" fetch -q origin main`
  followed by `git -C "$GC_CLONE" reset -q --mixed FETCH_HEAD` on the caller's
  checkout, then `exec`s `graph-commit.real`. The `--mixed` (not `--hard`) is
  load-bearing per case 7's comment at `:928-940`: it fast-forwards HEAD past the
  park while leaving the sweep's stale-read working-tree edit in place, so the
  push has no textual conflict for layer-2 to rescue and `--base` is the ONLY
  thing that can still catch the lost update. With `--hard`, or with HEAD left
  behind, the case passes with or without the pin and proves nothing.
- Export `GC_ORIGIN`, `GC_NODE`, `GC_CLONE`, plus
  `GRAPH_COMMIT_CHECK_POLL_SECONDS=1 GRAPH_COMMIT_CHECK_TIMEOUT_SECONDS=20` as
  case 7 does at `:955-958`. Only `gh` is stubbed
  (`review_stall_gh_stub`); the REAL `graph-commit` runs, because
  `check_base_freshness` is the machinery under test.
- Before writing the assertions, check whether `reconcile-graph-review-stall` has
  its own clock gate needing a fixed-clock env var the way
  `reconcile-graph-merged` needs `RECON_ENV` (`:725`): the sweep reads
  `MAX_HOLD_SECONDS` around `:73`. Determine whether it gates candidate
  eligibility (in which case the case needs an equivalent fixed value) or only
  the lock heartbeat (in which case it does not). Do not assume `RECON_ENV`
  applies unchanged.
- Assert, against `git show origin/main:intentions/<id>.md` after the run: rc 0;
  the concurrently landed `office_hours` park text is **present** (it survived);
  AND the sweep's own `execution.fix` write is present (the node file carries a
  `since:` key under `fix`, the same grep discriminator case 10a uses at
  `:1341-1345`). Both halves matter — a case that only asserts the park survives
  would also pass if the sweep landed nothing at all.
- Add a header comment on Case 13 stating the fail-today property in the same
  words case 7's header uses: *revert Unit 2's `--base` threading and this case
  goes red with `office_hours: null` — the exact erasure this node exists to
  stop.*

Out of scope: any edit to cases 1–11b's assertions.

**Recommended model:** opus.

**Dependencies:** Units 1 and 2.

---

## Reuse

- `.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged:253-259`
  (`validate_node_id()`), `:294-300` (the `hash-object -w` pin loop), `:329-348`
  (the `--base` threading loop with its re-validation and missing-pin
  hard-error), and its rationale comments at `:205-230` and `:278-293` — the
  source of truth for every function body and comment Unit 1 relocates. Unit 2
  mirrors its structure, not a fresh derivation.
- `.claude/skills/dispatch-propagate/scripts/lib-graph-rollback.sh:1-28` — the
  extraction precedent Unit 1 follows (standalone, sources nothing,
  label-parameterized, header explains why the file exists). Its
  `graph_rollback_node_writes()` is **already shipped and already wired** into
  `reconcile-graph-review-stall` via `restore_staged_writes()` — do not
  re-derive or modify it.
- `packages/intentionsutil/scripts/graph-commit:670` (`add_blob_pair()`), `:685`
  (`parse_blob_arg()`), `:3659-3660` (flag parsing), `:766`
  (`check_base_freshness()`) — the consumer contract. Repeated `--base <id>=<sha>`
  flags are already accepted; **no graph-commit change is needed**.
- `.claude/skills/dispatch-propagate/scripts/lib-frozen-session-park.sh:580-591`
  — the third pin call site, using `git rev-parse "origin/main:intentions/<id>.md"`
  because its source is a git **ref**. Cited to make the contrast explicit: this
  sweep pins a **working-tree file** and therefore must use `hash-object -w`.
  Do not swap the forms.
- `packages/intentionsutil/scripts/park-node` and `clear-park` (`--base`
  resolution, `FRESH_BLOB` rev-parse, exit-3 stale-diagnosis refusal) — the
  single-node idiom of the same greenfield contract, landed by `4725a16b` for the
  frozen-session sweep. Not directly reusable here (this sweep calls
  `graph-commit` directly), cited as evidence the contract is already the house
  convention.
- `.claude/skills/ref-diagnosis-time-cas/SKILL.md` — canonical doctrine. Cite it
  from the new lib's header rather than re-deriving why the pin must be
  diagnosis-time.
- `.claude/skills/dispatch-propagate/scripts/test-graph-write-rollback.sh` —
  `build_seed_repo()`, `new_origin()`, `init_and_push()`,
  `clone_with_node_modules()`, `review_stall_gh_stub()`,
  `review_stall_node()`, the argv-capturing `graph-commit`
  stub, case 6's pin assertions, case 7's
  concurrent-write wrapper, `fail_graph_commit()` and
  `landing_graph_commit()` if a variant needs a real land. All cited by name, not by
  line: re-measured 2026-08-30, every number this list previously carried had drifted.
- `.claude/skills/dispatch-propagate/scripts/test-lib-frozen-session-park.sh:726-745`
  — the "pins the EXACT blob, not merely a `--base`" assertion shape.

## Verification

Run from the worktree root.

```verify
bash .claude/skills/dispatch-propagate/scripts/test-graph-write-rollback.sh
```

Every case must pass, including the pre-existing 1–11b. Cases 6, 6b, 7, 8, 9 and
9a specifically guard that Unit 1's extraction did not change
`reconcile-graph-merged`'s behavior.

```verify
grep -q -- '--base' .claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall
```

Fails today (the file has zero `--base` occurrences at origin/main `58e643e9`),
passes after Unit 2 — so it is a real fail-today check, not a vacuous one.

```verify
bash -n .claude/skills/dispatch-propagate/scripts/lib-graph-base-pin.sh && bash -n .claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall && bash -n .claude/skills/dispatch-propagate/scripts/reconcile-graph-merged
```

```verify
bash .claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Sibling harnesses that also copy or drive these sweeps — run them to catch a
fixture that now needs the new lib:

```verify
bash .claude/skills/dispatch-propagate/scripts/test-graph-select-target.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-tick.sh
```

**Manual — confirm the fix actually engages (the teeth check).** Auto-runnable
negation is deliberately excluded here: a fence that greps for an absence passes
vacuously. Do this by hand and record the result in the PR:

1. With all three units in place, revert **only** Unit 2's `--base` threading in
   the `GC_ARGS` build (leave the pin capture, the lib, and the tests alone) and
   re-run `test-graph-write-rollback.sh`. **Case 13 must go red** with
   `office_hours: null` on the landed node, and Case 12 must go red on the
   `--base` count. Restore the threading afterward.
2. If Case 13 still passes without the threading, the fixture is not reproducing
   the race — most likely the concurrent park is landing before the pin is
   captured rather than between the pin and the commit, or the wrapper's
   `reset --mixed` was written as `--hard` (which lets layer-2's textual merge
   rescue the park all by itself). **Fix the fixture, not the assertion**
   (`.claude/rules/test-integrity.md`).

**Manual — merge discipline.** Merge `origin/main` into the branch early and
again before opening the PR. Three sibling tactics are at `phase: implement` on
`reconcile-graph-review-stall` right now
(`tactic-review-stall-listnodes-duplicate-scan`,
`tactic-review-stall-pr-json-duplicate-fetch`,
`tactic-review-stall-predicate-subprocess-spawn`). Conflicts in that file are
expected and textual; resolve by keeping both sides' regions intact. If a
resolution appears to require changing behavior in `:188-265`, stop — that is a
sibling's territory and a signal the merge went wrong.

**Manual — observe in production.** After merge, on the next tick that recovers
a stalled review, confirm the sweep's `graph-commit` invocation carries one
`--base` per recovered id (visible in the tick journal / the sweep's stderr on a
failure path), and that no `office_hours` park disappears from a node the sweep
touched. The pre-fix measured rate on the sibling call site was 8 park erasures
across 5 nodes in 24h; the post-fix expectation is zero.
