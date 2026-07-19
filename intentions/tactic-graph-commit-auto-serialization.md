---
id: tactic-graph-commit-auto-serialization
kind: tactic
statement: "graph-commit auto-serializes mechanical contention (ladder layers
  1-3): structural field-level merge, stale-base auto re-read/re-apply,
  structured mechanical-unresolved exit; model layers are dispatch-conflict's"
owner: ai
status: codified
parent: null
rationale: "Tooling byproduct of the 2026-07-13 automatic-serialization
  interview on strategy-graph-native-dispatch (clarification 58), narrowed
  2026-07-19 by the partition clarification 78: this tactic owns the ladder's
  deterministic mechanical layers 1-3 inside graph-commit the script, exiting
  mechanical-unresolved for the model layers 4-5 owned by
  tactic-dispatch-conflict-greenfield. Parked and cleared 2026-07-19 (two-draft
  collision, resolved by the ratified partition), then finalized the same day by
  an /align-tactics per-node pass into a full clean-session implementation
  plan."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 64
  override: null
  rationale: "Boosted to top ranking by author direction (2026-07-18), following
    the office-hours drain of tactic-review-sitting-skill-generalization (PR
    #2871): that node's needs-main residue was silently dropped by park-node
    reading a stale local checkout (the writer never re-reads origin/main), and
    graph-commit rebased the residue-less body onto main with no textual
    conflict — a genuine instance of exactly the auto-serialization gap this
    node tracks (stale-base re-apply, not a true conflict, should not silently
    clobber). Sized against the composed selector rank (childless, empty
    blocked_by: rank = boost + 5.33; current max 68.33 on
    tactic-fix-interrupt-orthogonal-state at boost 63), so boost 64 gives 69.33
    -- strictly top of the selector frontier, verified via select-targets. The
    boost flows nowhere else (no blocked_by, no children). Reconfirmed
    2026-07-19: still boost 64 / rank 69.33, verified top of the
    actually-selectable candidates against origin/main 9e376105 (412+ nodes;
    tactic-align-tactics-workflow was separately boosted to a nominal 75 the
    same day, but it is phase:implement and blocked_by
    tactic-align-family-opus-default (still in merge-ready-hold), so it is
    excluded from the candidates list and does not displace this node from #1).
    No boost change made -- already sufficient. Second live incident of the
    tracked gap the same day: an /align-tactics session's trivial office_hours
    wording edit on tactic-dispatch-conflict-greenfield raced a
    concurrently-landing /align-strategy ratification (clarification 78) and
    lost -- graph-commit's rebase hit a textual CONFLICT on the same node and
    fell through to the fail-closed park path, clobbering the just-ratified
    clean office_hours state with the generic 'concurrent-edit conflict' message
    until a manual follow-up commit (d6d371ba) cleared it. Exactly this node's
    layer-3 gap (stale-base auto re-read/re-apply): a fresh re-read would have
    shown the losing writer's delta moot and landed cleanly with no park at all.
    Finalized 2026-07-19 by an /align-tactics per-node pass into a full
    implementation plan (this same finalize hit a THIRD live instance of the
    tracked gap: this session's own graph-commit --base check found the
    reconfirm/second-incident text above had landed on origin/main between this
    session's dump-node read and its land attempt -- a concurrent,
    non-overlapping append to this same attention.rationale field, hand-merged
    here by re-reading origin/main and combining both writers' text, exactly the
    layer-2/3 structural field-level merge this tactic's own plan below makes
    automatic); boost preserved unchanged across the finalize."
phase: implement
execution:
  branch: tactic-graph-commit-auto-serialization
  pr: 2911
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix:
    since: 2026-07-19
    attempt: 1
    pushed_sha: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# graph-commit auto-serializes mechanical contention (ladder layers 1-3): structural field-level merge, stale-base auto re-read/re-apply, structured mechanical-unresolved exit; model layers are dispatch-conflict's

Finalized 2026-07-19 by an `/align-tactics tactic-graph-commit-auto-serialization`
per-node pass into the full clean-session plan below. Scope is fixed by the
2026-07-19 partition (clarification 78 on `strategy-graph-native-dispatch`,
ratified at the office-hours review that cleared this node's 2026-07-19 park):
this tactic owns the resolution ladder's deterministic mechanical layers 1-3
inside `graph-commit` the script; layers 4-5 (scoped model reconciliation,
true-conflict park) belong to `tactic-dispatch-conflict-greenfield`, which is
`blocked_by` this tactic.

## Context

Today `try_land()` in `packages/intentionsutil/scripts/graph-commit` maps ANY
rebase CONFLICT straight to an `office_hours` park (`park_write()`), and a
`--base` staleness mismatch in `check_base_freshness()` is a hard `die()` —
both fail closed with no attempt at automatic, deterministic reconciliation.
This is the residual scope of a 5-layer resolution ladder ratified by the
author at the **2026-07-19 office-hours review** that cleared the 2026-07-19
parks on both `tactic-graph-commit-auto-serialization` and
`tactic-dispatch-conflict-greenfield` — recorded as **clarification 78 on
`strategy-graph-native-dispatch`**. That partition assigns the ladder's
deterministic, unit-testable, script-hostable layers (1: existing git
three-way auto-merge, 2: structural field-level frontmatter merge, 3: stale
`--base` auto re-read/re-apply) to **this tactic**, inside `graph-commit` the
bash script itself, and reserves the model-driven layers (4: scoped Opus
reconciliation on human-owned doctrine fields, 5: the true-conflict park with
both divergent values) to `tactic-dispatch-conflict-greenfield`, which records
`blocked_by: [tactic-graph-commit-auto-serialization]` to encode this
ordering. Clarification 78's answer is explicit that no bash script in the
repo performs a scoped model evaluation — model-resolution only runs as a
`SKILL.md`-driven subagent — so the script cannot host layers 4-5; conversely
pushing layers 1-3 into a skill would hide deterministic, unit-testable merge
logic behind a model call. This tactic implements exactly layers 1
(unchanged)–3 (new) plus a structured `mechanical-unresolved` exit that, until
`dispatch-conflict` exists, falls back to today's `park_write`, but carrying
the divergent field values instead of a bare generic reason.

Ground-truth line anchors below were verified against the live files as of
this finalize (`graph-commit` 720 lines, `store.ts` 135 lines, `schema.ts` 843
lines, `frontmatter.ts` 39 lines, `test-graph-commit.sh` 501 lines).
**`tactic-graph-commit-park-context` is a sibling tactic, already at `phase:
implement` as of this finalize, separately planned to change `park_write()`'s
body/signature** (adding `office_hours.recommendation`, a snapshot pointer,
and mailbox-discipline text) **but not yet implemented as of this writing** —
the live `park_write()` is still the old `{reason, since}`-only shape at
`graph-commit:540-565`. If that sibling tactic lands first, `park_write()`'s
exact line numbers/signature will differ from what's quoted here; locate it by
the `park_write() {` function-name anchor and the
`office_hours.reason`/`recommendation` assignment lines, not by trusting a
stale line number. Unit 4 below composes additively with whatever
`reason`/`recommendation`-building code already exists there — it does not
require replacing that sibling's work in either landing order.

## Unit 1 — `node-merge.ts`: the field-level three-way merge primitive + CLI wrapper + unit tests

**Recommended model:** opus (novel algorithm design: list-union-with-dedup
semantics, nested `attributes.conditions` handling, structural vs. cosmetic
YAML divergence — genuinely judgment-heavy, no existing pattern in this
codebase to mechanically follow).

**Scope — greenfield design.** No merge/field-union helper exists anywhere in
`packages/intentionsutil/src` (grep-confirmed). The cleanest shape, ignoring
today's ad-hoc inline-bash `park_write()` pattern: a **pure, fs-free TS
module** — `packages/intentionsutil/src/node-merge.ts` — that takes
already-read `IntentionNode` values (or raw text) and returns a merge result,
mirroring how `frontmatter.ts` is pure/fs-free and shared by `store.ts` and
`digest.ts`. A **separate persistent CLI wrapper** —
`packages/intentionsutil/scripts/merge-node.ts` — does the fs/argv/stdout I/O,
following `scripts/write-node.ts`'s `--file`-argument convention
(`write-node.ts:39-64`) rather than `park_write()`'s inline-heredoc-tmpfile
pattern: `merge-node.ts` is complex enough (3-way YAML merge, not a one-line
mutate) to warrant its own named, independently-testable script. Single-PR
scope; no brownfield migration section applies (nothing today calls anything
this replaces).

Exports of `packages/intentionsutil/src/node-merge.ts`:
```ts
export interface FieldConflict { field: string; ours: unknown; theirs: unknown }
export interface MergeResult { merged: IntentionNode; body: string; conflicts: FieldConflict[] }

export function mergeIntentionNodes(
  base: { node: IntentionNode; body: string } | null, // null only if no common-ancestor read exists; treat every field as if it fell to the eq(ours,theirs)/conflict branches
  ours:   { node: IntentionNode; body: string },  // THIS writer's intended edit — content that must NOT silently lose
  theirs: { node: IntentionNode; body: string },  // the already-landed / fresh-origin content
): MergeResult
```
Field classification (from `schema.ts:111-143`):
- **List fields** (union-append, dedup exact duplicates): `serves`,
  `recovers`, `clarifications`, `tooling_goals`, `validates`, `blocked_by` —
  export as `const LIST_FIELDS: readonly (keyof IntentionNode)[]`.
- **`attributes.conditions`** — array-by-convention, not schema-typed
  (`coverage.ts:86-89`, `router.ts:81-93`). Merge `attributes` key-by-key:
  `conditions` gets the list-union rule; every other `attributes` key gets the
  scalar rule below (keys present in only one side are always kept — an
  addition, not a divergence).
- **Scalar/object fields** (one-side-wins / identical-collapse / divergent →
  conflict): every other top-level `IntentionNode` field — `id`, `kind`,
  `statement`, `owner`, `status`, `parent`, `rationale`, `reading`, `gap`,
  `success_signal`, `attention`, `phase`, `execution`, `office_hours`,
  `pace_exempt`, `rounds` — plus a **synthetic scalar pseudo-field `body`**
  (the markdown body, `extractBody`'s output) merged by the identical
  three-way rule. This folds the durable-body contract (`store.ts:52-76`'s
  `assertNoBodyLoss`) into the same algorithm: if only one side touched the
  body, that side wins; if both touched it identically, collapse; if both
  touched it differently, `body` becomes an entry in `conflicts` (expected
  rare — callers normally only change frontmatter fields — but must not
  silently clobber prose if it happens).
- Scalar rule, precisely: let `eq(a,b)` be a recursive structural
  deep-equality (order-independent for plain-object keys, order-DEPENDENT for
  arrays — do NOT use naive `JSON.stringify` comparison, since two independent
  `yaml.stringify` round-trips of semantically-identical objects can differ in
  key insertion order and would otherwise produce false conflicts). For field
  `f`: if `eq(ours[f], base[f])` → take `theirs[f]`. Else if `eq(theirs[f],
  base[f])` → take `ours[f]`. Else if `eq(ours[f], theirs[f])` → take that
  value (identical-edit collapse). Else → **conflict**: push `{field: f,
  ours: ours[f], theirs: theirs[f]}` to `conflicts`, and `merged[f]` takes
  `theirs[f]` (the currently-landed truth — `merged` must always be a valid,
  landable node even with unresolved fields, since layer 4 lands the park on
  top of `theirs` regardless).
- List rule, precisely: dedup via the same `eq()`, not stringify. `merged[f] =
  dedupe([...theirs[f], ...ours[f]])` keeping first occurrence (theirs' order
  preserved, then ours' novel entries appended in ours' original order) —
  deterministic, no `base` needed for lists (this only matters for pure
  additions per scope; removals are not a stated requirement).

Add `packages/intentionsutil/scripts/merge-node.ts` (CLI):
```
Usage: npx tsx packages/intentionsutil/scripts/merge-node.ts \
  --base <path-or-empty> --ours <path> --theirs <path-or-empty> --out <path>
```
- Reads each file as raw node text (`---\n`-fenced) via
  `extractFrontmatter`/`extractBody` (import from `../src/frontmatter.js`) +
  `parse` (from `yaml`) + `validateNode` (from `../src/schema.js`) — the same
  read semantics `store.ts`'s `readNode` uses (`store.ts:101-105`),
  reimplemented here rather than imported because `readNode` is
  `(dir, id)`-scoped to a real store directory, not an arbitrary temp file
  path; do not modify `store.ts` to add a path-based variant — keep
  `node-merge.ts`/`merge-node.ts` self-contained.
- `--base`/`--theirs` may be passed as an empty string to mean "absent" (id
  did not exist on that side) — treat as `base = null` per the module's
  documented fallback.
- Calls `mergeIntentionNodes`. If `conflicts.length === 0`: writes the merged
  file to `--out` as `` `---\n${stringify(validateNode(merged))}---\n${body}` ``
  (mirrors `store.ts:48`'s exact serialization, reimplemented here rather than
  calling `writeNode` because `writeNode`'s `readExistingBody` fallback would
  read the WRONG body — the conflicted working-tree file, not this merge's
  computed `body`). Prints `{"resolved":true,"conflicts":[]}` to stdout
  (single line, valid JSON) and exits 0.
- If `conflicts.length > 0`: does NOT write `--out`. Prints
  `{"resolved":false,"conflicts":[...]}` to stdout and exits 0 (an expected,
  not exceptional, outcome). A tool crash (e.g. unparseable frontmatter via
  `IntentionSchemaError`) exits non-zero with no valid JSON, letting the bash
  caller distinguish "attempted, unresolved" (stdout JSON present) from
  "could not even attempt" (non-zero exit).

**Tests** — `packages/intentionsutil/test/node-merge.test.ts` (vitest,
following this package's existing `test/*.test.ts` convention). Cover at
minimum: (a) list-field union with an overlapping duplicate entry (dedup
fires); (b) `attributes.conditions` union; (c) an unrelated `attributes` key
added on only one side (kept, no conflict); (d) two distinct scalar fields
each edited by a different side (both land, no conflict — the headline
"structural field-level merge" case); (e) the same scalar field edited
identically on both sides (collapses, no conflict); (f) the same scalar field
edited to different values on both sides (`conflicts` has exactly one entry,
`merged` takes `theirs`); (g) `body` divergence (both sides changed markdown
body differently → conflict entry with `field: "body"`); (h) `base === null`
fallback behavior.

**Dependencies.** None.

## Unit 2 — Wire layer 2 (structural field-level merge) into `try_land()`

**Recommended model:** opus (tricky git-rebase stage-number semantics —
`git rebase`'s stage numbering is INVERTED relative to `git merge`, a
well-known footgun — plus a same-iteration control-flow fallthrough inside an
existing bounded retry loop, plus extracting a new shared exit path other
units depend on).

**Scope.** `packages/intentionsutil/scripts/graph-commit` only.

1. Add a new path constant immediately after `STORE_MODULE`
   (`graph-commit:76`):
   ```bash
   MERGE_NODE_SCRIPT="$REPO_ROOT/packages/intentionsutil/scripts/merge-node.ts"
   ```
2. Add two new globals to the globals block (`graph-commit:105-126`, after
   `RESTORE_HEAD`):
   - `RESOLVED_VIA_MERGE=0` — set to `1` the moment any layer-2 or layer-3
     merge actually resolves a divergence; read once at the final "landed"
     log line (`graph-commit:676`) to print a distinct **landed-after-
     resolution** message (append `" (layer 2/3 auto-resolved a
     concurrent-edit divergence)"`) — the SAME `rc 0` exit as plain `landed`,
     distinguished only by this log-line suffix (no new exit code — keeps the
     existing 0/1/2 exit-status contract at `graph-commit:46-58` unchanged,
     since nothing downstream currently branches on graph-commit's exit code
     beyond 0/1/2).
   - `CONFLICT_FIELDS_JSON=""` — path to a tempfile (created inside
     `SNAP_DIR` once it exists — see Unit 3's reordering) accumulating
     unresolved `{id, field, ours, theirs}` entries across every id this
     invocation could not fully resolve. Empty string = "no captured
     conflicts yet."
3. Add a new function `run_merge_node()` placed after `snapshot()` (after
   `graph-commit:280`, before the "Far-ahead worktree" section comment at
   `:282`):
   ```
   run_merge_node() {
     # run_merge_node <id> <base-file-or-empty> <ours-file> <theirs-file-or-empty> <out-file>
     # Invokes MERGE_NODE_SCRIPT. On resolution: <out-file> is valid merged
     # content when the function returns 0; sets RESOLVED_VIA_MERGE=1.
     # On partial/no resolution, OR a tool crash (non-zero exit / unparsable
     # stdout): appends one JSON object per unresolved field (or one generic
     # "could not attempt structural merge for <id>" entry on a crash) to
     # CONFLICT_FIELDS_JSON; returns 1. NEVER dies — a per-node content
     # divergence is expected, recoverable state, not a broken environment
     # (per .claude/rules/code-style.md's "clear error over silent fallback":
     # DIE stays reserved for genuine environment/tooling breakage; a crash
     # here is logged but does not abort the whole invocation).
   }
   ```
   Use `jq` (already a hard dependency, see `await_checks()`) to parse
   `merge-node.ts`'s stdout JSON per `.claude/rules/shell-json.md`'s rule —
   capture stdout into a variable first, then `jq <<<"$captured"` (here-
   string), never `echo "$captured" | jq`.
4. **Layer 2 wiring** — replace the conflict branch of `try_land()`'s failure
   handling (`graph-commit:462-468`, currently: `if ! git pull --rebase
   origin main; then if rebase_in_progress; then ... git rebase --abort;
   return 10; else die ...; fi; fi`) with logic that, on
   `rebase_in_progress()` being true, BEFORE aborting:
   - Enumerates conflicted paths via `git diff --name-only
     --diff-filter=U`, intersected with `intentions/<id>.md` for `id` in
     `IDS` (NOT `PRUNE_IDS` — see exclusion below).
   - **Critical git-rebase stage-number note** (document verbatim as a code
     comment at the call site): during `git rebase`, HEAD is replayed ONTO
     the upstream tip, so **stage `:2:<path>` is the upstream / already-
     landed content (`theirs` in this plan's terminology) and stage
     `:3:<path>` is the patch being replayed / THIS writer's intended content
     (`ours`)** — the OPPOSITE of `git merge`'s stage numbering. Stage
     `:1:<path>` is the merge-base (`base`). Extract each via `git show
     ":1:$path"`, `git show ":2:$path"`, `git show ":3:$path"` into
     tempfiles under `SNAP_DIR`, then call `run_merge_node "$id"
     <stage1-file> <stage3-file-as-ours> <stage2-file-as-theirs>
     <out-file>`.
   - **Prune-id exclusion:** if a conflicted path's id is in `PRUNE_IDS`, do
     NOT attempt a merge (a deletion has no content to structurally merge
     against) — treat it as automatically unresolved for this id (append a
     generic "prune vs. concurrent edit" entry to `CONFLICT_FIELDS_JSON`
     without calling `run_merge_node`), matching the prune-recommendation
     convention `tactic-graph-commit-park-context` already establishes for
     its (separate) park-content unit.
   - **Unexpected-path defensive check:** any conflicted path that does NOT
     correspond to an id in `ALL_IDS` is unexpected given
     `assert_staged_safe`'s invariant that only requested paths are ever
     staged by this writer — `die()` in that case (a genuinely broken
     assumption, not a content divergence).
   - If every conflicted id resolved: `git add` each merged file, `git
     rebase --continue`. If that succeeds, **do not `return`/`continue` the
     `for` loop** — let execution fall through naturally to the existing
     `sha="$(git rev-parse HEAD)"` line (`graph-commit:472`) and the rest of
     the stamping/push logic, exactly as if `git pull --rebase` had
     succeeded outright. (If `git rebase --continue` unexpectedly fails
     after every id reports resolved, treat as the unresolved branch below —
     do not assume infallibility.)
   - If any conflicted id did NOT resolve: `git rebase --abort || true` (as
     today), then `return 10` — reusing the existing return code, but
     redefining what triggers it: now "a genuine textual conflict occurred
     AND layer 2 could not fully resolve it," since every textual conflict
     now goes through the merge attempt first. `land()`'s existing `10 → 12`
     mapping (`graph-commit:528`) is UNCHANGED — no new numeric exit codes.
5. **Extract the shared park path.** Refactor `main()`'s existing rc-12 tail
   (`graph-commit:684-713`, from the `KEEP_SNAP=1` line through the final
   `exit 1`) into a new function `park_and_exit()` placed right after
   `park_write()` — `main()`'s rc-12 branch reduces to a single
   `park_and_exit` call. This function must itself call `exit 1` at the end
   (never returns) — Unit 3 needs to invoke this same function from a second
   call site (inside/after `check_base_freshness()`, which runs BEFORE any
   commit exists) without duplicating fetch/reset/`park_write`/re-commit/
   `land()` logic. No behavior change beyond making the block callable
   twice; done here so Unit 3 only adds a second call site.
6. Update `try_land()`'s doc comment (`graph-commit:441-458`) and `land()`'s
   doc comment (`graph-commit:510-521`) to describe the new "layer 2
   attempted before park" behavior — read the current prose first; rewrite
   only the sentences that are now factually wrong (e.g. `graph-commit:450-
   451`'s "there is no safe automatic resolution" must be corrected).

**Dependencies.** Unit 1 (needs `merge-node.ts` to exist and its stdout JSON
contract to be final).

## Unit 3 — Wire layer 3 (stale-`--base` auto re-read/re-apply) into `check_base_freshness()`

**Recommended model:** opus (a subtle safety-relevant reordering of `main()`'s
setup sequence — `SNAP_DIR`/`trap cleanup EXIT` must move earlier without
breaking `cleanup()`'s assumptions — plus a new early-exit control-flow branch
reusing Unit 2's shared park path from a context where no commit exists yet).

**Scope.** `packages/intentionsutil/scripts/graph-commit` only.

1. **Required reordering.** `check_base_freshness()` is called at
   `graph-commit:623`, but `SNAP_DIR="$(mktemp -d)"` and `trap cleanup EXIT`
   / `trap 'exit 130' INT TERM` don't run until `graph-commit:643-648` — and
   layer 3's merge attempt needs `SNAP_DIR` (for `run_merge_node()`'s
   tempfiles and for `CONFLICT_FIELDS_JSON`) to exist BEFORE
   `check_base_freshness()` runs. Move the block `SNAP_DIR="$(mktemp -d)" ||
   die ...` through `trap 'exit 130' INT TERM` (currently
   `graph-commit:643-648`) to immediately after `ALL_IDS=("${IDS[@]}"
   "${PRUNE_IDS[@]}")` (`graph-commit:622`) and before `check_base_freshness`
   (`graph-commit:623`). Also move the `SCRATCH_BRANCH="graph/$ref_id-$$"`
   computation (`graph-commit:640-641`, which only depends on `ALL_IDS`,
   already available) up alongside it. Verify `cleanup()` (`graph-
   commit:219-237`) has no dependency on anything computed AFTER the moved
   block (re-read it: `RESTORE_HEAD`/`ORIG_HEAD` default empty/0,
   `SNAP_DIR`/`KEEP_SNAP` are exactly what's being moved earlier,
   `SCRATCH_PUSHED`/`SCRATCH_BRANCH` likewise) — this reordering is safe
   because `cleanup()` only reads globals, all either already-initialized-
   empty at file top (`graph-commit:105-126`) or part of the moved block
   itself.
2. **Layer 3 wiring.** Replace the `die "stale base for '$id' ..."` line
   (`graph-commit:208`) with:
   - Retrieve the writer's originally-read content via `git cat-file -p
     "$sha"` (the blob sha recorded in `BASE["$id"]`) into a `SNAP_DIR`
     tempfile. This blob is expected to be reachable in the local object
     database because the writer read it from a real checkout of a fetched
     commit. If `git cat-file -p "$sha"` fails, this genuinely IS
     unrecoverable staleness (no base to diff against) — keep this specific
     sub-case as a `die()`, with an updated message distinguishing it from
     the (now handled) ordinary mismatch case.
   - The writer's CURRENT intended content is `$INTENTIONS_DIR/$id.md`
     as-is — at this point in `main()`'s execution (before `snapshot()`,
     which runs later at `:660`), this file is exactly what `write-node.ts`
     wrote before `graph-commit` was invoked; use it directly.
   - The fresh landed content is already available: `check_base_freshness()`
     already did `git fetch origin main` (`:197`) and computed
     `origin_sha`/existence via `FETCH_HEAD:$path` (`:202-206`) — extract it
     via `git show "FETCH_HEAD:$path"` (or treat as absent per the existing
     `<absent>` branch).
   - Call `run_merge_node "$id" <base-file> <ours-file=current on-disk>
     <theirs-file=FETCH_HEAD content> <out-file>` — same `(base, ours,
     theirs)` naming convention as Unit 2, but this call site does NOT have
     git's rebase-stage inversion (plain `git show`/file reads, not rebase
     conflict stages) — do not carry over Unit 2's stage-swap logic here.
   - If resolved: overwrite `$INTENTIONS_DIR/$id.md` with `<out-file>`'s
     content, set `RESOLVED_VIA_MERGE=1`, and `continue` the existing `for id
     in "${!BASE[@]}"` loop (`:199`) — no further action needed; the
     freshness check is now satisfied against the exact `origin_sha` just
     merged against.
   - If unresolved: append to `CONFLICT_FIELDS_JSON` as `run_merge_node`
     already does; set a new local/global flag `STALE_BASE_UNRESOLVED=1`;
     `continue` the loop (finish checking every remaining `--base` id before
     exiting, so the eventual park record names every divergent id/field,
     not just the first one hit).
3. After the `for id in "${!BASE[@]}"` loop completes (still inside
   `check_base_freshness()`), add:
   ```
   if [[ "${STALE_BASE_UNRESOLVED:-0}" -eq 1 ]]; then
     park_and_exit   # Unit 2's extracted function — never returns
   fi
   ```
   This is the mechanism by which an unresolved stale-base divergence reaches
   the SAME structured park path as an unresolved rebase conflict, even
   though no local commit exists yet at this point in `main()` —
   `park_and_exit()` already does its own `git fetch origin main; git reset
   --hard FETCH_HEAD` before `park_write()`, which is a safe no-op here
   (nothing to discard) rather than a special case to add.
4. Update `check_base_freshness()`'s doc comment (`graph-commit:186-193`) to
   describe the new re-read/re-apply behavior in place of the "refused...
   die" framing.

**Dependencies.** Unit 1 (merge primitive), Unit 2 (`run_merge_node()`,
`CONFLICT_FIELDS_JSON`, and `park_and_exit()` must exist first — Unit 3 only
adds a second call site and does not duplicate any of that plumbing).

## Unit 4 — `mechanical-unresolved` park content: carry both divergent values

**Recommended model:** opus (real judgment call: composing additively with a
sibling tactic — `tactic-graph-commit-park-context` — whose landing order
relative to this one is unknown at plan time, per the Context note above).

**Scope.** `packages/intentionsutil/scripts/graph-commit` only (`park_write()`,
wherever it currently sits — verify against the live file first per the
Context note, since the sibling tactic may have already changed its
signature).

1. Inside `park_write()` (or, if the sibling tactic has landed, inside
   whatever function/CLI it delegates the recommendation-building to), read
   `CONFLICT_FIELDS_JSON` (skip this step entirely — behave exactly as
   today — if it is empty or the file it points to is empty/absent, e.g. a
   merge-node tool crash with no field-level detail captured).
2. Build the `office_hours.reason` string to include a **stable, greppable
   marker**: `"graph-commit: mechanical-unresolved — <N> field(s) diverged
   across concurrent writes and could not be auto-merged (layers 1-3
   exhausted)"` (`<N>` = count of entries in `CONFLICT_FIELDS_JSON`) — this
   exact substring `mechanical-unresolved` is what a future `dispatch-
   conflict` skill (`tactic-dispatch-conflict-greenfield`) is expected to
   grep/parse for, per this tactic's structured-exit contract, and what this
   unit's new `test-graph-commit.sh` assertions check for.
3. Build (or append to, if `office_hours.recommendation`-building code from
   `tactic-graph-commit-park-context` already exists) the `recommendation`
   string with one block per conflict entry:
   ```
   Diverged field '<field>' on <id>:
     this session's value: <JSON.stringify(ours) if non-string else ours>
     origin/main's value: <JSON.stringify(theirs) if non-string else theirs>
   ```
   concatenated across all entries. Do not invent a second structured-content
   convention — `reason`/`recommendation` (both plain `string | null`,
   `schema.ts:370-374`) are the only carriers; no new `schema.ts` field, no
   `attributes.*` addition. If the sibling tactic's snapshot-pointer/mailbox-
   discipline text already occupies `recommendation`, append this unit's
   "Diverged field" blocks after it (do not replace).
4. Update the top-of-file header doc block's exit-status prose
   (`graph-commit:46-58`) — it currently says a conflict always means "this
   writer's content is NOT landed... parked... for a manual merge," no longer
   universally true (layers 2-3 now auto-resolve many conflicts). Rewrite to
   describe the four observable outcomes: landed (rc 0, no special log line),
   landed-after-resolution (rc 0, `RESOLVED_VIA_MERGE` log suffix),
   mechanical-unresolved-parked (rc 1, `office_hours.reason` contains
   `mechanical-unresolved`), and busy-main (rc 1, no park). Also re-verify
   the module-comment line at `graph-commit:9-10` for continued accuracy,
   updating only if it no longer reads correctly.

**Dependencies.** Units 2 and 3 (both are producers of `CONFLICT_FIELDS_JSON`
that this unit consumes).

## Unit 5 — `test-graph-commit.sh` coverage for layers 2-3

**Recommended model:** sonnet (contracts are fully pinned by Units 1-4; this
is disciplined extension of an existing, well-understood harness pattern with
explicit new cases).

**Scope.** `packages/intentionsutil/scripts/test-graph-commit.sh` only.

1. **New seed helper for realistic frontmatter.** The existing `seed_node()`
   (`test-graph-commit.sh:86-97`) writes a bare `id: $1\nline1: base\n...`
   file with **no `---` frontmatter fences at all** — it is NOT valid
   `IntentionNode` YAML and cannot be read by `readNode`/the new
   `mergeIntentionNodes`. It remains correct and untouched for the existing
   line-based conflict/merge/busy-main cases (1-16), which only exercise
   git-level textual rebase mechanics, not field semantics. Add a second
   helper, e.g. `seed_field_node() { # <id> <extra-yaml-lines...>`, that
   writes a real `---\n...\n---\n` fenced node with the minimum required
   `IntentionNode` fields (`id`, `kind: tactic`, `statement`, `owner: ai`,
   `status: raw`) plus caller-supplied additional frontmatter lines, so
   these new cases exercise genuine field-level merges.
2. **`npx` shim extension for `merge-node.ts`.** The existing shim
   (`test-graph-commit.sh:132-147`) fakes `park_write()`'s ad-hoc heredoc
   tmpfile invocation and cannot distinguish it from a `merge-node.ts`
   invocation by filename (heredoc tmpfiles are randomly named). Because
   `merge-node.ts` (Unit 1) is a fixed, persistent script path
   (`$MERGE_NODE_SCRIPT`, Unit 2), the shim CAN dispatch on `$2` (the script
   path argv passed to `npx tsx <script> ...`): add a `case "$(basename
   "$2")" in merge-node.ts) ... ;; *) <existing park_write shim body> ;;
   esac` split. The `merge-node.ts` shim branch does NOT need to perform a
   real YAML merge — it should read a **sentinel marker line** already
   present in the seed content to decide resolved-vs-unresolved
   deterministically: e.g. if both the `--ours` and `--theirs` files contain
   a line matching `CONFLICT_MARKER: <same-field>`, print
   `{"resolved":false,"conflicts":[{"field":"<same-field>","ours":"...","theirs":"..."}]}`;
   otherwise perform a trivial "concat distinct lines" merge into `--out`
   and print `{"resolved":true,"conflicts":[]}`. Document in a comment that
   Unit 1's `test/node-merge.test.ts` (vitest) is the source of truth for
   the REAL merge algorithm's correctness — this shim only proves
   `graph-commit` invokes the tool at the right point and branches correctly
   on its resolved/unresolved verdict.
3. **New cases**, inserted after the existing Case 16 block
   (`test-graph-commit.sh:471-488`, before the final "No scratch branches
   left behind" check):
   - **Case 17 — layer 2 resolves a non-overlapping field-level conflict.**
     Two writers each edit a DIFFERENT scalar field on the same node such
     that git's line-level rebase reports a textual CONFLICT (force this by
     having both edits land on physically adjacent/same lines even though
     the FIELDS differ) — assert exit 0, `RESOLVED_VIA_MERGE`'s log-line
     suffix present, and both writers' field edits present in the landed
     content.
   - **Case 18 — layer 2 leaves a same-field divergence
     `mechanical-unresolved`.** Both writers edit the SAME field to
     different values — assert exit 1, `office_hours.reason` contains
     `mechanical-unresolved`, and `office_hours.recommendation` (or wherever
     the shim renders it) contains both writers' values.
   - **Case 19 — layer 3 auto-resolves a stale `--base`.** A `--base`
     mismatch (as in existing Case 12) where the writer's field-level delta
     touches a field the concurrent landed write did NOT touch — assert
     exit 0 (no `die`, no park) and both edits present on `main`.
   - **Case 20 — layer 3 leaves a stale-`--base` same-field divergence
     `mechanical-unresolved`.** Same as Case 19 but both sides touch the
     same field — assert exit 1, `office_hours.reason` contains
     `mechanical-unresolved`, `gh_calls` is `0` (proves this parks before
     ever reaching the stamp/poll loop).
   - **Case 21 — prune-vs-edit conflict is excluded from layer 2, always
     `mechanical-unresolved`.** A `--prune` id racing a concurrent edit to
     the same node — assert it does NOT attempt a merge (no false
     "resolved") and parks with the prune-specific generic reason.
4. Add each new seed id to whichever seed loop it needs (`seed_node` list at
   `test-graph-commit.sh:93-97` for line-based cases, or the new
   `seed_field_node` calls for the field-level cases).
5. Update the header "Covers:" comment list (`test-graph-commit.sh:13-49`)
   with one line per new case (17-21), matching the existing style.

**Dependencies.** Units 1-4 (exercises all of them; write last).

## Reuse

- `packages/intentionsutil/src/store.ts`'s `readNode`/`writeNode`/
  `readNodeBody` (`store.ts:101-134`) and `packages/intentionsutil/src/
  frontmatter.ts`'s `extractFrontmatter`/`extractBody` (`frontmatter.ts:
  13-39`) — `node-merge.ts` (Unit 1) reimplements the SAME read semantics
  these use (fence-parse + `yaml.parse` + `validateNode`) rather than
  importing `readNode` directly, since `readNode` is `(dir, id)`-scoped to a
  real store directory, not arbitrary temp files.
- `packages/intentionsutil/scripts/write-node.ts`'s `--file` argv convention
  (`write-node.ts:39-64`) as the CLI-shape template for `merge-node.ts`.
- `packages/intentionsutil/scripts/graph-commit`'s existing `park_write()`
  tsx-one-liner pattern (`graph-commit:540-565`) as the invocation-style
  precedent (`npx tsx <script> <args...>`) for the new `MERGE_NODE_SCRIPT`
  invocation, and its `snapshot()`/`SNAP_DIR`/`PRUNE_IDS` machinery
  (`graph-commit:265-280`) which Units 2-3 read but do not restructure
  beyond the required setup-ordering move (Unit 3, step 1).
- `packages/intentionsutil/src/schema.ts`'s `OfficeHours` interface and
  `validateOfficeHours` (`schema.ts:370-374`, `485-494`) — Unit 4 writes
  through this unchanged shape; no schema change in this tactic.
- `packages/intentionsutil/scripts/test-graph-commit.sh`'s existing harness
  helpers (`make_clone`, `sync_clone`, `edit_line`, `run_gc`, `set_mode`,
  `gh_calls`, `origin_show`, `origin_sha`, `scratch_refs`) — Unit 5 reuses
  these verbatim for the new cases.

## Verification

```verify
cd packages/intentionsutil && npx vitest run test/node-merge.test.ts
```
Confirms Unit 1's merge algorithm in isolation (list-union/dedup,
`attributes.conditions`, scalar collapse/one-side-wins/conflict,
`body`-as-pseudo-field) before any bash wiring depends on it.

```verify
bash packages/intentionsutil/scripts/test-graph-commit.sh
```
Must report `failed: 0` with the case count grown from the current baseline
by 5 (Cases 17-21) — or by more if `tactic-graph-commit-park-context`'s own
new cases land first, in which case this tactic's new cases are numbered
accordingly; check the `passed:`/`failed:` summary line, not raw case
numbers.

```verify
npx vitest run --project packages/intentionsutil --root .
```
Full package suite — confirms no regression in `store.ts`/`schema.ts`/
`frontmatter.ts` consumers from Unit 1's new module sitting alongside them.

Manual / judgment (not auto-runnable):
- Re-read the live `packages/intentionsutil/scripts/graph-commit` and
  `park_write()` immediately before starting Unit 4 to detect whether
  `tactic-graph-commit-park-context` has landed in the interim, and adapt the
  exact insertion point (function name, not line number) accordingly.
- After Unit 2, manually trace through the git-rebase stage-number
  assignment (`:2:` = theirs/landed, `:3:` = ours/intended) against a real
  conflicted rebase in a scratch clone to confirm the inversion is
  implemented correctly — the single highest-risk correctness detail in the
  whole plan, not fully exercised by the bash harness's shimmed
  `merge-node.ts` (Unit 5's Cases 17/18 prove graph-commit *calls* the tool
  and branches correctly, not that the real stage extraction feeds it the
  right content in the right slots).
- Confirm `dispatch-conflict`'s eventual consumer (out of scope here,
  tracked by `tactic-dispatch-conflict-greenfield`) will be able to `grep -q
  'mechanical-unresolved'` against a real parked node's `office_hours.reason`
  in production once this lands — no automated check exists for that
  cross-tactic contract yet.

## Out of scope

- Layers 4-5 — scoped model reconciliation (clarification 58's model scope
  guard) and the true-conflict park decision: `tactic-dispatch-conflict-greenfield`.
- Claim-ledger narrowing: `tactic-claim-dedup-only`.
- Park-record content quality: `tactic-graph-commit-park-context`.
