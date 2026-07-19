---
id: tactic-graph-commit-park-context
kind: tactic
statement: "graph-commit conflict-park writes recoverable context: a
  recommendation and snapshot/mailbox pointer in the park record, and a clear
  pre-flight error naming any unrelated dirty tracked file before attempting the
  rebase"
owner: ai
status: codified
parent: null
rationale: "Finding from the 2026-07-06/07 emulated router ticks
  (graph-tick-emulation-workflow-gotchas), finalized by a 2026-07-18
  /align-tactics per-node pass. Residual after tactic-graph-commit-hardening (PR
  #2778, merged) whose Unit 2 covered park_write atomicity, id validation, and
  signal traps but not park content or the dirty-tree failure mode.
  office_hours.recommendation has since landed as a first-class schema field via
  tactic-office-hours-graph-entry (PR #2787, merged), so the plan below writes
  it directly rather than folding it into reason (the interim convention this
  tactic's earlier draft assumed no longer applies)."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
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
pace_exempt: false
rounds: null
attributes: {}
---
# graph-commit conflict-park writes recoverable context: a recommendation and snapshot/mailbox pointer in the park record, and a clear pre-flight error naming any unrelated dirty tracked file before attempting the rebase

## Context

`packages/intentionsutil/scripts/graph-commit` is the single primitive every
graph writer uses to land a node edit on `main`. Two residue findings survive
`tactic-graph-commit-hardening` (PR #2778, merged), surfaced during the
2026-07-06/07 emulated router ticks:

**Finding 1 — the conflict park writes no recoverable context.** When
`try_land()` hits a genuine rebase conflict (a concurrent writer landed an
overlapping edit to the same node), `park_write()` (currently
`packages/intentionsutil/scripts/graph-commit:540-565`) hardcodes
`node.office_hours = { reason, since }` with a bare, generic reason string —
`"graph-commit: concurrent-edit conflict — manual merge needed"` — and no
`recommendation`. `office_hours.recommendation` is now a first-class
`schema.ts` field (`packages/intentionsutil/src/schema.ts:373`, landed by
`tactic-office-hours-graph-entry`, PR #2787, merged; `park-node`
(`packages/intentionsutil/scripts/park-node`) already accepts and writes it as
its optional 3rd arg). The park's essential recoverable state today —
`SNAP_DIR`, the tempdir holding the losing writer's only surviving content
copy — is only ever printed to stderr (`graph-commit:690`), which nothing
durable ever sees: a fresh session reading the parked node later has no way to
find it. Nor does the park record the "mailbox discipline" convention (the
losing writer re-lands and clears the park; a third session encountering the
park while the loser is still working should wait rather than compete for the
merge).

**Finding 2 — an unrelated dirty tracked file dies with a misleading error.**
`try_land()`'s first step, `git pull --rebase origin main`
(`packages/intentionsutil/scripts/graph-commit:462`), refuses to start at all
when ANY tracked file in the working tree is dirty — including files entirely
outside `intentions/` (observed: a freshly-provisioned worktree's modified
`flake.lock` from `npm install`). Because `rebase_in_progress()` correctly
reports no rebase started, this falls through to the generic
`die "'git pull --rebase origin main' failed and left no rebase in progress
(dirty tree or fetch failure)"` (`graph-commit:468`) — a message that never
names the offending path(s) and is indistinguishable from a genuine
environment/network problem. Per `.claude/rules/code-style.md` ("prefer clear
errors over defensive fallbacks"), the fix is a pre-flight check that names
the culprit file(s) with actionable remediation *before* any rebase is
attempted — not a silent `--autostash`, which would hide the anomaly rather
than surface it (and risks losing track of what was stashed if the run dies
partway).

**Orthogonal to the in-flight conflict-resolution redesign.** Two sibling
`strategy-graph-native-dispatch` tactics —
`tactic-dispatch-conflict-greenfield` and
`tactic-graph-commit-auto-serialization` — are themselves parked
(`office_hours` set), pending an author `/align-strategy` reconciliation pass
on which of them owns which layer of a 5-layer conflict-resolution ladder
(auto-merge mechanics vs. model-driven reconciliation vs. true-conflict
parking). Both are raw, never-finalized drafts, so per the greenfield-relevance
gate ("a raw draft never obsoletes live work") neither blocks this tactic. More
directly: this tactic changes only the *content* of a park once one happens
(Finding 1) and adds a *pre-flight guard* before the rebase that might produce
one (Finding 2) — it does not touch conflict-resolution *behavior* (which
conflicts auto-resolve vs. which genuinely park). Whichever architecture the
ladder redesign eventually picks, a true-conflict park still needs recoverable
content, and a rebase attempt still needs to not be sabotaged by unrelated
dirt. Nothing here pre-empts that redesign's scope.

There is a dedicated functional test harness,
`packages/intentionsutil/scripts/test-graph-commit.sh` (a self-contained bash
script — throwaway bare origin + two writer clones + `gh`/`npx` PATH shims —
run directly with `bash packages/intentionsutil/scripts/test-graph-commit.sh`,
no npm/vitest involved). It currently passes 25/25. Both units below extend
it; there is no separate unit-test file for `graph-commit` itself (it is a
bash script verified structurally + via this harness, the same posture as its
siblings `park-node`/`clear-park`).

## Unit 1 — Park content: recommendation, snapshot pointer, mailbox instruction

**Recommended model:** sonnet

**Scope.** `packages/intentionsutil/scripts/graph-commit` only. Replace the
current `park_write()` function body (the block from the `park_write() {`
line through its closing `}`, `graph-commit:540-565`) with:

```bash
park_write() {
  local since reason tmpts prune_csv
  since="$(date -u +%Y-%m-%d)"
  reason="graph-commit: concurrent-edit conflict — manual merge needed"
  # Comma-join PRUNE_IDS (already populated by main()'s arg parsing) so the
  # tsx helper can tell a prune id (no on-disk snapshot — a deletion has
  # nothing to preserve) from an ordinary edit id (snapshotted to
  # SNAP_DIR/<id>.md by snapshot(), graph-commit:272-280) when composing each
  # node's recommendation.
  prune_csv="$(IFS=,; echo "${PRUNE_IDS[*]:-}")"
  tmpts="$(mktemp --suffix=.mts)" || die "could not create temp file for the parking write"
  cat >"$tmpts" <<'TS'
// argv: <storeModule> <intentionsDir> <since> <reason> <snapDir> <pruneCsv> <id...>
const [storePath, intentionsDir, since, reason, snapDir, pruneCsv, ...ids] = process.argv.slice(2);
const pruneSet = new Set(pruneCsv ? pruneCsv.split(",") : []);
const { readNode, writeNode } = await import(storePath);
// Two-pass for atomicity: read every node up front so an unreadable id fails
// BEFORE any write — a single read-modify-write loop that threw mid-way would
// leave the earlier ids mutated on disk, uncommitted.
const nodes = ids.map((id) => readNode(intentionsDir, id));
for (let i = 0; i < nodes.length; i++) {
  const node = nodes[i];
  const id = ids[i];
  const recommendation = pruneSet.has(id)
    ? "A concurrent writer landed an overlapping edit to this node while this " +
      "session's prune was in flight; the prune was NOT landed (a deletion has " +
      "no content snapshot). Recommended: the losing writer re-reads the " +
      "current origin/main content, decides whether the prune still applies, " +
      "and re-runs graph-commit (--prune, or a fresh edit) on the reconciled " +
      "result — that same commit clears this office_hours park. A third " +
      "session encountering this park while the loser is still working should " +
      "wait rather than attempt its own merge (the mailbox discipline)."
    : `A concurrent writer landed an overlapping edit to this node while this ` +
      `session's edit was in flight; this writer's content was NOT landed. ` +
      `This session's unlanded content is preserved at ${snapDir}/${id}.md ` +
      `(this machine only — may not survive past this session). Recommended: ` +
      `the losing writer re-reads the current origin/main content, manually ` +
      `merges in its intended edit, and re-runs graph-commit on the merged ` +
      `result — that same commit clears this office_hours park. A third ` +
      `session encountering this park while the loser is still working should ` +
      `wait rather than attempt its own merge (the mailbox discipline).`;
  node.office_hours = { reason, since, recommendation };
  writeNode(intentionsDir, node);
  process.stderr.write(`graph-commit: set office_hours on ${id} (since=${since})\n`);
}
TS

  if ! npx tsx "$tmpts" "$STORE_MODULE" "$INTENTIONS_DIR" "$since" "$reason" "$SNAP_DIR" "$prune_csv" "${ALL_IDS[@]}" >&2; then
    rm -f "$tmpts"
    die "failed to write the office_hours parking record"
  fi
  rm -f "$tmpts"
}
```

This is the only change to `graph-commit` in this unit: `PRUNE_IDS` and
`SNAP_DIR` are already-populated globals by the time `park_write()` runs
(`main()`'s arg parsing and the `SNAP_DIR="$(mktemp -d)"` line,
`graph-commit:643`), so no other call site changes.

Also update the file's own header comment block near the top
(`graph-commit:9-10`, "except the office_hours parking fallback below") only
if it no longer accurately describes the fallback after this edit — read it
first; if it still reads correctly (it describes going through `store.ts`'s
`writeNode`, which remains true), leave it unchanged.

**Test harness updates (same unit, same file set purpose — extends the
existing coverage rather than adding a parallel one):**

`packages/intentionsutil/scripts/test-graph-commit.sh` fakes `npx` with a
shim that hardcodes `park_write()`'s old argv shape
(`test-graph-commit.sh:132-147`:
`npx tsx <helper> <storeModule> <intentionsDir> <since> <reason> <id...>`).
This unit's argv shape gains two positional args (`snapDir`, `pruneCsv`)
before the id list, so the shim must be updated in lockstep or every case
touching a park (Case 4) breaks. Replace the `npx` shim body
(`test-graph-commit.sh:132-147`, inside the `cat >"$WORK/bin/npx" <<'SH'`
block) with:

```bash
cat >"$WORK/bin/npx" <<'SH'
#!/usr/bin/env bash
# npx shim: emulates `npx tsx <helper> <storeModule> <intentionsDir> <since>
# <reason> <snapDir> <pruneCsv> <id...>` (graph-commit's park_write) without
# node. Mirrors the real helper's two-pass shape: verify every id is readable
# first, then write all; fakes a recommendation string per-id distinguishing a
# pruned id (no snapshot) from an ordinary edit id (snapshot path included) so
# tests can assert on the distinction without needing the real store.ts.
[[ "$1" == "tsx" ]] || { echo "npx shim: unexpected invocation: $*" >&2; exit 1; }
shift 3   # tsx, helper script path, store module path
dir="$1"; since="$2"; reason="$3"; snap_dir="$4"; prune_csv="$5"; shift 5
for id in "$@"; do
  [[ -f "$dir/$id.md" ]] || { echo "npx shim: unreadable node $id" >&2; exit 1; }
done
for id in "$@"; do
  if [[ ",$prune_csv," == *",$id,"* ]]; then
    rec="prune, no content snapshot, mailbox discipline"
  else
    rec="unlanded content preserved at ${snap_dir}/${id}.md; mailbox discipline"
  fi
  printf 'office_hours: {reason: "%s", since: %s, recommendation: "%s"}\n' "$reason" "$since" "$rec" >>"$dir/$id.md"
  echo "graph-commit: set office_hours on $id (since=$since)" >&2
done
SH
chmod +x "$WORK/bin/gh" "$WORK/bin/npx"
```

(The trailing `chmod +x` line already exists right after the shim heredoc —
keep it, do not duplicate it.)

Then extend **Case 4** (`test-graph-commit.sh:214-237`, "overlapping concurrent
edits — fail closed, park") by adding these assertions directly after the
existing "overlap snapshot preservation" `if`/`else` block (after
`test-graph-commit.sh:237`, before the "Case 5" comment):

```bash
if [[ -n "$snap" ]] && grep -q 'recommendation' <<<"$content" \
   && grep -q "$snap/t-conflict.md" <<<"$content" \
   && grep -q 'mailbox discipline' <<<"$content"; then
  ok "overlap: office_hours recommendation carries the snapshot path and mailbox instruction"
else
  no "overlap: recommendation missing snapshot path or mailbox instruction"; printf '%s\n' "$content"
fi
```

Finally, add a **new Case 17** exercising the prune branch of the
recommendation (no existing case parks a `--prune` id via a genuine conflict).
Insert it right after the existing Case 16 block ends
(`test-graph-commit.sh:485-488`, before the "No scratch branches left behind"
final check):

```bash
# --- Case 17: overlapping edit vs prune conflict — park recommendation covers the prune branch ---
# A rebase CONFLICT where the losing writer's commit is a --prune (delete)
# racing another writer's edit to the SAME node exercises park_write()'s
# prune-vs-edit recommendation branch (Unit 1): a pruned id has no on-disk
# snapshot, so its recommendation must say so instead of pointing at a
# (nonexistent) SNAP_DIR/<id>.md.
set_mode green
W8="$WORK/w8"; W9="$WORK/w9"
make_clone "$W8" writer-8
make_clone "$W9" writer-9
sync_clone "$W8"; sync_clone "$W9"
edit_line "$W8" t-prune-conflict 1 W8-edit
run_gc "$W8" t-prune-conflict >/dev/null 2>&1
rm -f "$W9/intentions/t-prune-conflict.md"
out="$(run_gc "$W9" --prune t-prune-conflict 2>&1)"; rc=$?
content="$(origin_show t-prune-conflict)"
if [[ $rc -eq 1 ]] \
   && grep -q 'concurrent-edit conflict' <<<"$out" \
   && grep -q 'line1: W8-edit' <<<"$content" \
   && grep -q 'office_hours' <<<"$content" \
   && grep -q 'recommendation' <<<"$content" \
   && ! grep -q 'preserved at' <<<"$content"; then
  ok "prune-vs-edit conflict: park recommendation omits a snapshot path for a pruned id"
else
  no "prune-vs-edit conflict handling (rc=$rc)"; printf '%s\n' "$out"; printf '%s\n' "$content"
fi
```

And add `t-prune-conflict` to the `seed_node` loop
(`test-graph-commit.sh:93-97`, the `for id in t-happy t-merge t-conflict ...`
list) — append it to that list (order within the list doesn't matter).

Also update the file's header "Covers:" comment list (`test-graph-commit.sh:
13-49`) to add a line describing case 17, matching the existing style (e.g.
after the case 16 description: `#  17. overlapping edit vs prune conflict:
park recommendation omits a snapshot path (no content to preserve) and states
the prune-reconciliation instruction instead`).

**Dependencies.** None.

## Unit 2 — Pre-flight: refuse clearly on an unrelated dirty tracked file

**Recommended model:** sonnet

**Scope.** `packages/intentionsutil/scripts/graph-commit` and
`packages/intentionsutil/scripts/test-graph-commit.sh` only.

Add a new function to `graph-commit`, placed immediately before the
`# --- Main ------` section comment (`graph-commit:567`, i.e. insert between
the end of `park_write()` — after Unit 1's edit, still the line ending in a
closing `}` — and that comment):

```bash
# --- Pre-flight: refuse on unrelated dirty tracked files --------------------
# try_land()'s `git pull --rebase origin main` refuses outright when ANY
# tracked file is dirty, including files entirely unrelated to this call's
# node set (observed: a modified flake.lock in a freshly-provisioned
# worktree). Left unchecked, that refusal surfaces as try_land()'s generic
# "dirty tree or fetch failure" die() — indistinguishable from a genuine
# environment problem, and it never names the offending paths. Catch it here,
# before ANY tree mutation — in particular before ensure_intentions_only_base()
# could run a `git reset --hard` that would silently discard the very dirt
# this is trying to surface — scoped to exclude exactly the paths this call is
# about to write (those are expected to be dirty; that is the point). Ignores
# untracked (`??`) entries: only a dirty TRACKED file blocks `git pull
# --rebase`, per the observed failure mode (code-style.md: clear error over a
# silent fallback such as --autostash, which would hide rather than surface
# the anomaly).
assert_clean_outside_ids() {
  local dirty
  dirty="$(git status --porcelain)"
  [[ -z "$dirty" ]] && return 0
  local -A ours=()
  local id
  for id in "${ALL_IDS[@]}"; do
    ours["intentions/$id.md"]=1
  done
  local offending="" line path
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    [[ "$line" == '??'* ]] && continue
    path="${line:3}"
    [[ -n "${ours[$path]:-}" ]] && continue
    offending+="$line"$'\n'
  done <<<"$dirty"
  if [[ -n "$offending" ]]; then
    echo "error: graph-commit: refusing to start — unrelated dirty tracked file(s) outside this call's node set:" >&2
    printf '%s' "$offending" >&2
    echo "       stash or commit these first (e.g. 'git stash -u'), then re-run graph-commit — it resumes safely (a prior partial local commit is detected and just pushed forward)." >&2
    exit 1
  fi
}
```

Call it in `main()` right after `ALL_IDS` is computed
(`graph-commit:622-623`, the `ALL_IDS=("${IDS[@]}" "${PRUNE_IDS[@]}")` /
`check_base_freshness` lines) — insert the call on the line immediately after
`check_base_freshness`:

```bash
  ALL_IDS=("${IDS[@]}" "${PRUNE_IDS[@]}")
  check_base_freshness
  assert_clean_outside_ids
```

Finally, tighten the now-partially-obsolete `die()` message at
`graph-commit:468` (inside `try_land()`) — the dirty-tree case it used to
describe is now caught earlier by the pre-flight above, so this path is
reached only by a genuine fetch/network failure or another unexpected git
error:

```bash
# Before:
      die "'git pull --rebase origin main' failed and left no rebase in progress (dirty tree or fetch failure)"
# After:
      die "'git pull --rebase origin main' failed and left no rebase in progress (fetch failure or another unexpected git error — an unrelated dirty tracked file would have been caught by the pre-flight check)"
```

**Test harness update.** Add a new seed node `t-dirty-preflight` to the
`seed_node` loop (`test-graph-commit.sh:93-97`, same list Unit 1 adds
`t-prune-conflict` to). Add a new **Case 18**, inserted after Unit 1's Case 17
(or after Case 16 if Unit 1 is implemented after this one — place it directly
before the final "No scratch branches left behind anywhere" check either way):

```bash
# --- Case 18: unrelated dirty tracked file — clear pre-flight error, no rebase attempted ---
set_mode green
W10="$WORK/w10"
make_clone "$W10" writer-10
sync_clone "$W10"
edit_line "$W10" t-dirty-preflight 1 dirty-edit
echo "unrelated local change" >>"$W10/packages/intentionsutil/src/store.js"
before_sha="$(origin_sha)"
out="$(run_gc "$W10" t-dirty-preflight 2>&1)"; rc=$?
after_sha="$(origin_sha)"
if [[ $rc -eq 1 ]] \
   && grep -q 'unrelated dirty tracked file' <<<"$out" \
   && grep -q 'store.js' <<<"$out" \
   && [[ "$after_sha" == "$before_sha" ]] \
   && [[ "$(gh_calls)" -eq 0 ]]; then
  ok "unrelated dirty tracked file: clear pre-flight error names the file, no rebase/CI attempted, main untouched"
else
  no "unrelated dirty tracked file pre-flight (rc=$rc)"; printf '%s\n' "$out"
fi
```

(`gh_calls` staying `0` proves the pre-flight aborted before `await_checks`
ever ran — `set_mode green` at the top of this case resets `$CALL_LOG` to
empty, so any nonzero count would mean the rebase/stamp loop was reached
despite the dirty file.)

Update the header "Covers:" comment list (`test-graph-commit.sh:13-49`) to add
a line for case 18, e.g.: `#  18. an unrelated dirty tracked file outside the
node set: clear pre-flight error naming the file, no rebase/CI attempted,
main untouched`.

**Dependencies.** None (independent of Unit 1 — different function, and the
two test-harness additions touch disjoint regions of the same file; implement
in either order).

## Reuse

- `packages/intentionsutil/src/schema.ts`'s `OfficeHours` interface and
  `validateOfficeHours` (`schema.ts:370-373`, `485-494`) — already validate
  `recommendation` as an optional string; no schema change needed.
- `packages/intentionsutil/scripts/park-node` — the sibling primitive that
  already threads a caller-supplied `recommendation` into
  `office_hours.recommendation`; this unit generates the recommendation
  programmatically instead (the park is fully mechanical, not caller-supplied),
  but writes through the identical `office_hours = { reason, since,
  recommendation }` shape.
- The existing `snapshot()` / `SNAP_DIR` / `PRUNE_IDS` machinery already in
  `graph-commit` — Unit 1 only reads these, it does not change how they are
  populated.
- `packages/intentionsutil/scripts/test-graph-commit.sh`'s existing harness
  structure (`make_clone`, `sync_clone`, `edit_line`, `run_gc`, `set_mode`,
  `gh_calls`, `origin_show`, `origin_sha`) — both units' new cases reuse these
  helpers verbatim, no new harness infrastructure.

## Verification

```verify
bash packages/intentionsutil/scripts/test-graph-commit.sh
```

Must report `failed: 0` with the case count grown by 2 (25 → at least 27:
existing 25 plus new Case 17 and Case 18 — each case may emit more than one
`ok`/`no` line, so check the `passed:`/`failed:` summary line, not the raw
`ok` count).

```verify
npx vitest run --project packages/intentionsutil --root .
```

Confirms Unit 1/2's changes to `graph-commit` (a bash script `store.ts`
imports at runtime, not at TypeScript compile time) introduce no regression in
the existing `store.ts`/`schema.ts` test suite, which is what actually
validates the `office_hours` shape both units write through.

Manual / observe-in-production (not auto-runnable — the real park path writes
to `main`, and the harness above already substitutes a shimmed `npx`/`gh` for
speed rather than the real store.ts write):

- The next time `graph-commit` genuinely parks a node in production (a real
  concurrent-edit conflict, not the test harness), read the landed node's
  `office_hours.recommendation` by eye and confirm it names the snapshot path
  (edit case) or the no-snapshot prune wording (prune case) and the mailbox
  instruction, matching Unit 1's intent.
- To exercise Unit 2's pre-flight deliberately outside the harness: in a
  scratch worktree, dirty an unrelated tracked file (e.g. touch
  `flake.lock`), then run `graph-commit` on some other scratch node id;
  confirm the new error names `flake.lock` specifically and exits before any
  `gh api` check-run poll, then revert the dirty file and confirm a normal
  `graph-commit` run succeeds.
