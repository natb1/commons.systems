#!/usr/bin/env bash
#
# test-dispatch-eval-finding.sh — unit-test harness for dispatch-eval-finding,
# the evaluation finding ledger's write surface.
#
# Fixture shape is test-dispatch-fleet-alarm.sh's: every graph-touching call is
# dependency-injected through the SUT's DISPATCH_EVAL_FINDING_* command
# overrides, so the suite never touches the real intentions/ store, never runs
# tsx, and never reaches a git remote. The SUT is copied into a miniature repo
# root so its SCRIPT_DIR/../../../.. math resolves inside the fixture, beside a
# tiny git repo whose refs/remotes/origin/main stands in for the real remote.
#
# Coverage, weighted to the two DELIBERATE DIVERGENCES from dispatch-fleet-alarm
# that this ledger depends on:
#
#   (1)  slug shape is an addressing guard, not a taxonomy: a malformed slug is
#        refused with no graph read, an unknown-but-well-shaped one is accepted
#        (divergence 1 — the key is NOT a closed enum). (1b) the ONE exception:
#        the doctrine root's own slug is refused on every write mode, because
#        membership in --list and addressability by --slug are separable and it
#        is a planning node rather than an entry.
#   (2)  --list emits open AND retired entries, the similarity judgment's input.
#   (3)  absent -> mint: exact node JSON (NO ledger_entry class marker,
#        first_seen, recurrence_count 1, attention null, pace_exempt true),
#        graph-commit WITHOUT --base, body spliced over the placeholder.
#   (4)  a second occurrence with a BYTE-IDENTICAL body still commits and moves
#        the count to 2, and mints NO second node. This is the divergence-2
#        consequence: fleet-alarm's cmp -s body-identity gate would swallow
#        exactly this write, which is the whole payload here.
#   (5)  a retired (phase done) entry RESUMES — count 7 -> 8, phase cleared back
#        to null, first_seen preserved, graph-commit called WITH --base (a CAS
#        update of the existing node, never a fresh mint).
#   (6)  a caller-supplied impact record is upserted by (metric, window) —
#        rewritten, not appended — while the script's own recurrence_count
#        record is preserved and incremented.
#   (7)  --retire completes to phase done with measured_impact INTACT.
#   (8)  the in-flight guard: a non-null execution records nothing, exits 0
#        skipped-in-flight (NOT noop — see unit D2's contract change below),
#        and says the occurrence was NOT COUNTED. (8b) the same guard also
#        blocks --retire, with the same token.
#   (9)  usage refusals: missing --sensor, a malformed --impact-file, and an
#        --impact-file carrying a recurrence_count record (the metric the script
#        owns) are all exit 64 with no graph write.
#   (10) the named silent-PASS invariant — a graph-commit that exits 0 without
#        landing must make the SUT exit 1, not 0.
#   (11) a doctrine ratchet over the SUT source: no cmp -s body-identity gate,
#        no minimum-refresh-interval brake, no `absent|retired` mint-over case
#        label, and the BOUNDED-WAIT mutex verb rather than the sibling's
#        non-blocking one. Re-introducing any of those silently understates the
#        recurrence count, which is the one metric the ledger exists to carry.
#   (12) a CONTENDED mutex is WAITED for, not skipped: with the lock held by a
#        background holder that releases inside the wait budget, the SUT blocks
#        and then lands. This is divergence 3 — the caller is a fire-and-forget
#        per-phase evaluator with no next pass, so the sibling's immediate skip
#        would silently drop the occurrence.
#   (13) and the wait is BOUNDED: a holder that outlives the budget still gets
#        the `skipped-locked` disposition, but the log line must state the loss
#        outright (not counted, nothing will re-invoke) rather than the sibling's
#        benign "re-invoke to record it".
#   (15) --list membership is the whole open tactic population, in no namespace:
#        every tactic that is not phase "done", plus every retired tactic still
#        carrying a non-empty measured_impact. An open tactic OUTSIDE the id
#        prefix is a candidate reporting its real recurrence_count — the row the
#        prefix search missed — the doctrine root tactic-eval-finding-ledger is
#        no longer excluded from its own list (though it is emitted with a null
#        slug and addressable_by "id" — context, not a write target), a retired
#        tactic with no
#        measurements is not a candidate, no row carries `unregistered`, and
#        every row surfaces `resolved_by` and `addressable_by`. `--like` ranks
#        the population and `--limit` bounds it, but the measurement carriers
#        ride a floor past the cut and the elision is disclosed on stderr; an
#        explicitly EMPTY --like/--limit is refused at parse time rather than
#        read as "flag absent", which would have skipped the bound in silence.
#        This
#        exercises the REAL default list_entries() path (the node/store.js
#        one-liner), not the LIST_CMD stub the rest of this suite uses, so it
#        invokes the real, uncopied SUT directly.
#   (16) --resolved-by states a FACT without counting an occurrence: it writes
#        attributes.resolved_by and leaves recurrence_count, its `measured`
#        stamp, first_seen and phase exactly as they were. Reference forms are
#        normalized at write time (bare number -> '#N', sha lowercased,
#        abbreviated sha expanded to 40), an ambiguous all-digit reference and an
#        unresolvable abbreviation are refused, and the in-flight guard applies
#        only to the --body-file refresh — naming an in-flight PR as the
#        resolution is the whole point of the flag. That refusal reports
#        skipped-in-flight, not noop (the token re-stating an ALREADY-recorded
#        resolution still gets, since nothing there was refused) — a fire-
#        and-forget caller cannot tell "already satisfied" from "refused,
#        recorded nothing" any other way.
#   (17) --list-retirable is the close-path TRIGGER: open entries whose
#        resolved_by names a change that is an ancestor of origin/main, resolved
#        offline (sha by merge-base, PR by the merge subject on origin/main).
#        An entry whose fix has not landed, whose reference cannot be resolved,
#        or whose id cannot be addressed by --retire --slug is named on stderr
#        and left out — never silently skipped.
#
# Run under bash -c, never zsh.

set -uo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUT="$HARNESS_DIR/dispatch-eval-finding"
[[ -f "$SUT" ]] || { echo "error: dispatch-eval-finding not found at $SUT" >&2; exit 1; }
# The SUT's verify_landed() delegates to the real verify-landed primitive, which
# is NOT copied into the miniature fixture repo — its `--blob` mode is pure git
# plumbing (no tsx), so it is safe to run directly against the fixture's `-C`
# path. Resolved from HARNESS_DIR (this file's real on-disk location).
REAL_VERIFY_LANDED="$HARNESS_DIR/../../../../packages/intentionsutil/scripts/verify-landed"
[[ -x "$REAL_VERIFY_LANDED" ]] || { echo "error: verify-landed not found at $REAL_VERIFY_LANDED" >&2; exit 1; }

WORK="$(mktemp -d)" || { echo "error: mktemp failed" >&2; exit 1; }
trap 'rm -rf "$WORK"' EXIT

# assert_eq / assert_contains and the PASS/FAIL/TOTAL counters come from the
# shared harness, which also sources lib-test-decision-log-guard.sh — that
# redirects DISPATCH_DECISION_LOG_DIR into a per-run tmp sandbox, which is what
# keeps this suite off the production routing-decision log. Sourcing it is the
# isolation test-decision-log-isolation.sh's Part B ratchet requires; the
# sibling test-dispatch-fleet-alarm.sh predates the harness and is allowlisted
# instead, which that file's own comment marks as the less-preferred route.
# shellcheck source=test-helpers.sh
source "$HARNESS_DIR/test-helpers.sh"

# Not in the shared harness; defined here against its counters so a negative
# assertion tallies identically to a positive one.
assert_not_contains() { # <label> <needle> <haystack>
  local label="$1" needle="$2" haystack="$3"
  TOTAL=$((TOTAL + 1))
  if [[ "$haystack" != *"$needle"* ]]; then
    PASS=$((PASS + 1)); echo "  PASS: $label"
  else
    FAIL=$((FAIL + 1)); echo "  FAIL: $label"
    echo "    expected NOT to contain: $needle"
    echo "    actual: $haystack"
  fi
}

# --- fixture repo root -------------------------------------------------------
FR="$WORK/repo"
FR_SCRIPTS="$FR/.claude/skills/dispatch-propagate/scripts"
LOG="$WORK/logs"
BIN="$WORK/bin"
mkdir -p "$FR_SCRIPTS" "$FR/intentions" "$LOG" "$BIN"
cp "$SUT" "$FR_SCRIPTS/dispatch-eval-finding"
chmod +x "$FR_SCRIPTS/dispatch-eval-finding"
# The SUT sources lib.sh from its own directory for the graph-write mutex.
cp "$HARNESS_DIR/lib.sh" "$FR_SCRIPTS/lib.sh"
EVAL_FINDING="$FR_SCRIPTS/dispatch-eval-finding"
LOCK_FILE="$WORK/graph-write.lock"

git -C "$FR" init -q
git -C "$FR" config user.email fixture@test
git -C "$FR" config user.name fixture
# The fixture's copy of the SUT is scaffolding, not repo content.
printf '.claude/\n' > "$FR/.git/info/exclude"
printf 'fixture\n' > "$FR/README.md"
git -C "$FR" add README.md
# Case (16) asserts that an abbreviated sha is EXPANDED to 40 characters. But
# normalize_resolved_ref() refuses an all-digit reference of 7+ characters as
# ambiguous — a PR number and an abbreviated sha resolve differently — which is
# CORRECT behaviour that an accidental fixture can walk into. With an unpinned
# clock the fixture's HEAD sha varied per run, so the assertion failed whenever
# the first 8 hex characters came up all digits: roughly (10/16)^8, ~2.3%.
#
# Pinning the dates to a single value is NOT the fix. That just freezes the dice
# at one roll, and the roll is not even stable across environments (local commit
# signing, git version) — a pinned date that happens to yield an all-digit
# prefix fails 100% of the time instead of 2.3%, which is how this was found.
#
# So: disable signing to remove that variable, then walk the commit date forward
# until the abbreviation is unambiguous. Same start, same increment, same tree
# everywhere, and the loop is guaranteed to produce a fixture case (16) can
# actually use. It converges immediately in the common case.
fixture_epoch=1767225600  # 2026-01-01T00:00:00Z
GIT_AUTHOR_DATE="$fixture_epoch +0000" GIT_COMMITTER_DATE="$fixture_epoch +0000" \
  git -C "$FR" -c commit.gpgsign=false commit -q -m init
while [[ "$(git -C "$FR" rev-parse HEAD | cut -c1-8)" =~ ^[0-9]+$ ]]; do
  fixture_epoch=$((fixture_epoch + 1))
  GIT_AUTHOR_DATE="$fixture_epoch +0000" GIT_COMMITTER_DATE="$fixture_epoch +0000" \
    git -C "$FR" -c commit.gpgsign=false commit -q --amend --no-edit
done
git -C "$FR" update-ref refs/remotes/origin/main HEAD

# --- stubs -------------------------------------------------------------------
cat > "$BIN/stub-classify" <<'STUB'
#!/usr/bin/env bash
# usage: stub-classify <id> — print the fabricated classification.
echo "classify $1" >> "$STUB_LOG/classify.log"
printf '%s\n' "${STUB_STATE:-absent}"
STUB

cat > "$BIN/stub-list" <<'STUB'
#!/usr/bin/env bash
# usage: stub-list <intentions-dir> — stands in for the listNodes one-liner.
echo "list $*" >> "$STUB_LOG/list.log"
printf '%s\n' "${STUB_LIST_JSON:-[]}"
STUB

cat > "$BIN/stub-write-node" <<'STUB'
#!/usr/bin/env bash
# usage: stub-write-node --file <json>. Records the JSON it was handed, then
# writes the node markdown the real writeNode would produce — YAML frontmatter
# between two `---` fences plus a body.
#
# THE BODY IS PRESERVED ACROSS REWRITES, exactly as the real writeNode does
# (packages/intentionsutil/src/store.ts: `readExistingBody(...) ?? "# ${statement}"`,
# with assertNoBodyLoss refusing any rewrite that would drop it). Only a
# BRAND-NEW file gets the generated `# <statement>` placeholder. The stub used
# to regenerate the placeholder unconditionally, which no writeNode has ever
# done — under that fiction the SUT's body writer always saw a placeholder on
# disk, so nothing in this suite could observe whether an existing body survived
# a write, which is precisely what cases (21a)-(21e) below assert.
echo "write-node $*" >> "$STUB_LOG/write-node.log"
file=""
while [[ $# -gt 0 ]]; do
  case "$1" in --file) file="$2"; shift 2 ;; *) shift ;; esac
done
cp "$file" "$STUB_LOG/write-node-input.json"
id=$(jq -r .id "$file")
statement=$(jq -r '.statement // "placeholder"' "$file")
phase=$(jq -r '.phase // "null"' "$file")
node_md="$STUB_INTENTIONS/$id.md"
body_tmp="$node_md.stub-body"
if [[ -f "$node_md" ]]; then
  awk 'p; /^---$/{c++; if(c==2) p=1}' "$node_md" > "$body_tmp"
else
  printf '# %s\n' "$statement" > "$body_tmp"
fi
{
  printf -- '---\n'
  printf 'id: %s\n' "$id"
  printf 'kind: tactic\n'
  printf 'phase: %s\n' "$phase"
  printf -- '---\n'
  cat "$body_tmp"
} > "$node_md"
rm -f "$body_tmp"
STUB

cat > "$BIN/stub-dump-node" <<'STUB'
#!/usr/bin/env bash
# usage: stub-dump-node --out-dir <dir> <id>. Writes <dir>/<id>.json (content
# from $STUB_NODE_JSON) and a base manifest, and prints the manifest path.
echo "dump-node $*" >> "$STUB_LOG/dump-node.log"
outdir=""; id=""
while [[ $# -gt 0 ]]; do
  case "$1" in --out-dir) outdir="$2"; shift 2 ;; *) id="$1"; shift ;; esac
done
mkdir -p "$outdir"
# Built in two steps, never as a `${STUB_NODE_JSON:-{...}}` default: the JSON
# contains `{}` and bash would end the parameter expansion at that first `}`,
# leaking the tail of the default into the file as literal text.
json="${STUB_NODE_JSON:-}"
[[ -n "$json" ]] || json=$(printf '{"id":"%s","phase":null,"execution":null,"attributes":{}}' "$id")
printf '%s\n' "$json" > "$outdir/$id.json"
printf '%s=deadbeef\n' "$id" > "$outdir/base-manifest.txt"
printf '%s\n' "$outdir/base-manifest.txt"
STUB

cat > "$BIN/stub-graph-commit" <<'STUB'
#!/usr/bin/env bash
# usage: stub-graph-commit -C <repo> [--base <manifest>] -m <msg> <id>.
# STUB_GC_EXIT   — exit with this code instead of landing (default 0).
# STUB_GC_LAND=1 — actually land: commit intentions/ and move the fixture's
#                  origin/main ref. With it unset the stub exits 0 having landed
#                  NOTHING — the silent-PASS shape verification exists to catch.
echo "graph-commit $*" >> "$STUB_LOG/graph-commit.log"
# Which WRITER the SUT asked graph-commit for. The env var, not an argument, is
# the whole interface, so the stub records it out of band (case 18).
printf 'GRAPH_COMMIT_WRITER=%s\n' "${GRAPH_COMMIT_WRITER:-<unset>}" >> "$STUB_LOG/graph-commit-env.log"
repo=""
last=""
while [[ $# -gt 0 ]]; do
  case "$1" in -C) repo="$2"; shift 2 ;; *) last="$1"; shift ;; esac
done
# The trailing positional is the node id (graph-commit's argv shape), which
# STUB_GC_DROP_LOCAL below needs.
[[ "${STUB_GC_EXIT:-0}" == "0" ]] || exit "${STUB_GC_EXIT}"
if [[ "${STUB_GC_LAND:-0}" == "1" ]]; then
  git -C "$repo" add -A intentions >/dev/null 2>&1
  git -C "$repo" commit -q -m 'fixture land' >/dev/null 2>&1
  git -C "$repo" update-ref refs/remotes/origin/main HEAD
fi
# STUB_GC_PLUMB=1 — land the way the PLUMBING writer really does, which
# STUB_GC_LAND does NOT: build the commit from the on-disk content through a
# throwaway index and move origin/main to it, while leaving HEAD, the real
# index and the working tree exactly as they were. The residue that leaves
# behind in the checkout is the whole subject of case 19, and STUB_GC_LAND
# cannot express it — its `commit` moves HEAD, which is the worktree writer's
# behaviour and is precisely what makes the tree come out clean.
if [[ "${STUB_GC_PLUMB:-0}" == "1" ]]; then
  idx="$repo/.git/stub-plumb-index"
  rm -f "$idx"
  export GIT_INDEX_FILE="$idx"
  git -C "$repo" read-tree HEAD
  git -C "$repo" add -A intentions >/dev/null 2>&1
  tree=$(git -C "$repo" write-tree)
  sha=$(git -C "$repo" commit-tree "$tree" -p HEAD -m 'fixture plumbing land')
  unset GIT_INDEX_FILE
  rm -f "$idx"
  git -C "$repo" update-ref refs/remotes/origin/main "$sha"
fi
# STUB_GC_DROP_LOCAL=1 — after landing, leave the checkout's copy of the node
# somewhere OTHER than where the write left it. The real graph-commit is
# entitled to do exactly this: its far-ahead rebuild resets the tree, and its
# park path re-syncs the node's path from origin/main. Deleting it is the
# sharpest form, and it is what the 2026-08-14 incident actually produced
# (`fatal: could not open …/intentions/<slug>.md` on four successful mints).
if [[ "${STUB_GC_DROP_LOCAL:-0}" == "1" && -n "$last" ]]; then
  rm -f "$repo/intentions/$last.md"
fi
exit 0
STUB

chmod +x "$BIN"/stub-*

# run_ef <env NAME=value ...> -- <args to the SUT ...>
#
# The two streams are captured SEPARATELY and only then concatenated as
# stderr-then-stdout into $OUT. Keeping them apart matters: the one-word stdout
# protocol has to be assertable on its own ($SOUT), because verify-landed's
# stderr diagnostics contain the token `not-landed` and a merged-stream
# "does it say landed?" assertion reads that as a success claim.
OUT=""; SOUT=""; RC=0
run_ef() {
  local -a envs=()
  while [[ $# -gt 0 && "$1" != "--" ]]; do envs+=("$1"); shift; done
  shift # drop the --
  rm -f "$LOG"/*.log "$LOG/write-node-input.json"
  env \
    STUB_LOG="$LOG" \
    STUB_INTENTIONS="$FR/intentions" \
    DISPATCH_EVAL_FINDING_CLASSIFY_CMD="$BIN/stub-classify" \
    DISPATCH_EVAL_FINDING_LIST_CMD="$BIN/stub-list" \
    DISPATCH_EVAL_FINDING_WRITE_NODE_CMD="$BIN/stub-write-node" \
    DISPATCH_EVAL_FINDING_DUMP_NODE_CMD="$BIN/stub-dump-node" \
    DISPATCH_EVAL_FINDING_GRAPH_COMMIT_CMD="$BIN/stub-graph-commit" \
    DISPATCH_EVAL_FINDING_VERIFY_LANDED_CMD="$REAL_VERIFY_LANDED" \
    DISPATCH_EVAL_FINDING_INTENTIONS_DIR="$FR/intentions" \
    DISPATCH_EVAL_FINDING_RETRY_DELAY=0 \
    DISPATCH_EVAL_FINDING_RETRIES=1 \
    DISPATCH_GRAPH_WRITE_LOCK_FILE="$LOCK_FILE" \
    "${envs[@]}" "$EVAL_FINDING" "$@" >"$WORK/stdout.txt" 2>"$WORK/stderr.txt"
  RC=$?
  SOUT="$(cat "$WORK/stdout.txt")"
  OUT="$(cat "$WORK/stderr.txt" "$WORK/stdout.txt")"
}
log_lines() { # <logfile-basename> -> its contents (empty when absent)
  [[ -f "$LOG/$1" ]] && cat "$LOG/$1" || printf ''
}
written() { # <jq filter> -> the value from the last write-node input
  jq -r "$1" "$LOG/write-node-input.json" 2>/dev/null
}

BODY="$WORK/body.md"
printf 'The finding.\nSecond line.\n' > "$BODY"
SLUG=stop-hook-hold-loop
ID="tactic-eval-finding-$SLUG"
NODE_MD="$FR/intentions/$ID.md"

# The three views of a node's markdown body the owned-region contract is stated
# in (see "THE OWNED BODY REGION" in the SUT header): the whole body, the part
# the SUT generated, and the part it must never touch.
REGION_OPEN='<!-- generated:dispatch-eval-finding -->'
REGION_CLOSE='<!-- /generated:dispatch-eval-finding -->'
node_body() { # [node.md] -> everything after the closing frontmatter fence
  awk 'p; /^---$/{c++; if(c==2) p=1}' "${1:-$NODE_MD}"
}
node_region() { # [node.md] -> the content BETWEEN the generated markers
  node_body "${1:-$NODE_MD}" | awk -v om="$REGION_OPEN" -v cm="$REGION_CLOSE" '
    $0 == cm { inside = 0 }
    inside   { print }
    $0 == om { inside = 1 }
  '
}
node_body_outside_region() { # [node.md] -> the body with the region cut out
  node_body "${1:-$NODE_MD}" | awk -v om="$REGION_OPEN" -v cm="$REGION_CLOSE" '
    $0 == om { skip = 1 }
    !skip    { print }
    $0 == cm { skip = 0 }
  '
}

# --- (1) slug shape is an addressing guard, not a taxonomy -------------------
run_ef -- --slug 'Not A Slug' --statement x --body-file "$BODY" --sensor s
assert_eq "(1) malformed slug exits 64" "64" "$RC"
assert_eq "(1) no classify" "" "$(log_lines classify.log)"
assert_eq "(1) no graph-commit" "" "$(log_lines graph-commit.log)"
run_ef -- --slug 'under_score' --statement x --body-file "$BODY" --sensor s
assert_eq "(1) underscore slug exits 64" "64" "$RC"

# (1b) The doctrine root is a --list MEMBER but never a WRITE TARGET — the two
# are separable. `--slug ledger` would splice a generated region into the
# ledger's own planning node (the body /dispatch-ladder reads) and stamp
# measured_impact onto it, which also permanently exempts a planning node from
# the owed-prune census. The in-flight guard cannot catch it: between phases
# `execution` is null. Refused on every write mode, before any graph read.
run_ef -- --slug ledger --statement x --body-file "$BODY" --sensor s
assert_eq "(1b) the doctrine-root slug is refused on the mint path" "64" "$RC"
assert_contains "(1b) naming it as the ledger's own planning node" \
  "planning node" "$OUT"
assert_eq "(1b) with no classify" "" "$(log_lines classify.log)"
assert_eq "(1b) and no graph-commit" "" "$(log_lines graph-commit.log)"
run_ef -- --slug ledger --resolved-by '#4242'
assert_eq "(1b) refused on the --resolved-by path too" "64" "$RC"
assert_eq "(1b) with no graph-commit" "" "$(log_lines graph-commit.log)"
run_ef -- --slug ledger --retire
assert_eq "(1b) and on --retire" "64" "$RC"
assert_eq "(1b) with no graph-commit either" "" "$(log_lines graph-commit.log)"
# The prefix itself is untouched: only the exact doctrine-root id is refused.
run_ef STUB_STATE=absent STUB_GC_LAND=1 -- --slug ledger-has-no-retirement-actor \
  --statement x --body-file "$BODY" --sensor s
assert_eq "(1b) a neighbouring slug sharing the leading token still writes" "0" "$RC"

# --- (2) --list emits open AND retired entries ------------------------------
LIST_JSON='[{"id":"tactic-eval-finding-a","state":"open","recurrence_count":3},{"id":"tactic-eval-finding-b","state":"retired","recurrence_count":9}]'
run_ef STUB_LIST_JSON="$LIST_JSON" -- --list
assert_eq "(2) --list exits 0" "0" "$RC"
assert_contains "(2) --list shows the open entry" '"state": "open"' "$(jq . <<<"$OUT")"
assert_contains "(2) --list shows the RETIRED entry too" '"state": "retired"' "$(jq . <<<"$OUT")"
assert_eq "(2) --list takes no mutex-guarded write" "" "$(log_lines graph-commit.log)"

# --- (3) absent -> mint ------------------------------------------------------
run_ef STUB_STATE=absent STUB_GC_LAND=1 -- \
  --slug "$SLUG" --statement 'the Stop hook HOLDs forever when no terminal marker is written' \
  --body-file "$BODY" --sensor dispatch-phase-eval --now 2026-08-01
assert_eq "(3) mint exits 0" "0" "$RC"
assert_eq "(3) stdout says landed" "landed" "$SOUT"
GC3="$(log_lines graph-commit.log)"
assert_contains "(3) graph-commit got the entry id" "$ID" "$GC3"
assert_not_contains "(3) mint passes NO --base" "--base" "$GC3"
# The class marker is retired (PR4 unit 2): membership and the pruning exemption
# are both keyed on attributes.measured_impact now, so a fresh mint must carry no
# ledger_entry key at all — not `false`, absent.
assert_eq "(3) the minted node carries NO ledger_entry class marker" "false" \
  "$(written '.attributes | has("ledger_entry")')"
assert_eq "(3) first_seen stamped" "2026-08-01" "$(written '.attributes.first_seen')"
assert_eq "(3) recurrence_count starts at 1" "1" \
  "$(written '.attributes.measured_impact[] | select(.metric=="recurrence_count") | .value')"
assert_eq "(3) recurrence record is sensor-attributed" "dispatch-phase-eval" \
  "$(written '.attributes.measured_impact[] | select(.metric=="recurrence_count") | .sensor')"
assert_eq "(3) attention is never machine-injected" "null" "$(written '.attention')"
assert_eq "(3) pace_exempt true" "true" "$(written '.pace_exempt')"
assert_eq "(3) phase null (draft shape)" "null" "$(written '.phase')"
# The mint is the ONE path that writes a whole body, and it writes it wrapped in
# the marker pair every later write is confined to (PR18 unit 1).
assert_eq "(3) body spliced over the placeholder, inside the owned region" \
  "$REGION_OPEN
The finding.
Second line.
$REGION_CLOSE" "$(node_body)"

# --- (4) a second occurrence with an IDENTICAL body still counts -------------
# fleet-alarm's cmp -s gate would skip this commit entirely. Here the identical
# body is the NORMAL case for a recurring finding and the count must move.
OPEN_JSON=$(jq -c . <<'JSON'
{"id":"tactic-eval-finding-stop-hook-hold-loop","phase":null,"execution":null,
 "statement":"the Stop hook HOLDs forever when no terminal marker is written",
 "attributes":{"ledger_entry":true,"first_seen":"2026-08-01",
   "measured_impact":[{"metric":"recurrence_count","value":1,"unit":"occurrences",
     "window":"all-time","sensor":"dispatch-phase-eval","measured":"2026-08-01"}]}}
JSON
)
run_ef STUB_STATE=open STUB_GC_LAND=1 STUB_NODE_JSON="$OPEN_JSON" -- \
  --slug "$SLUG" --statement 'ignored on an update' --body-file "$BODY" \
  --sensor dispatch-phase-eval --now 2026-08-05
assert_eq "(4) identical-body recurrence exits 0" "0" "$RC"
assert_eq "(4) stdout says landed (NOT a no-op)" "landed" "$SOUT"
GC4="$(log_lines graph-commit.log)"
assert_contains "(4) update is a CAS write (--base)" "--base" "$GC4"
assert_eq "(4) recurrence_count moved to 2" "2" \
  "$(written '.attributes.measured_impact[] | select(.metric=="recurrence_count") | .value')"
assert_eq "(4) last-seen is the measured date, not a second field" "2026-08-05" \
  "$(written '.attributes.measured_impact[] | select(.metric=="recurrence_count") | .measured')"
assert_eq "(4) no separate last_seen attribute" "null" "$(written '.attributes.last_seen')"
assert_eq "(4) first_seen preserved" "2026-08-01" "$(written '.attributes.first_seen')"
# OPEN_JSON is a LEGACY landed entry: minted before the class marker was retired,
# so it still carries ledger_entry. The recurrence pass neither reads it nor
# re-stamps it — the attribute merge carries it through untouched.
assert_eq "(4) a legacy ledger_entry marker is carried through, never re-stamped" "true" \
  "$(written '.attributes.ledger_entry')"
assert_eq "(4) statement NOT rewritten on an update" \
  "the Stop hook HOLDs forever when no terminal marker is written" "$(written '.statement')"
assert_eq "(4) exactly one classify (no second node minted)" "1" \
  "$(log_lines classify.log | wc -l | tr -d ' ')"

# --- (5) a RETIRED entry resumes, never re-mints -----------------------------
RETIRED_JSON=$(jq -c . <<'JSON'
{"id":"tactic-eval-finding-stop-hook-hold-loop","phase":"done","execution":null,
 "statement":"the Stop hook HOLDs forever when no terminal marker is written",
 "attributes":{"ledger_entry":true,"first_seen":"2026-08-01",
   "measured_impact":[{"metric":"recurrence_count","value":7,"unit":"occurrences",
     "window":"all-time","sensor":"dispatch-phase-eval","measured":"2026-08-09"}]}}
JSON
)
run_ef STUB_STATE=retired STUB_GC_LAND=1 STUB_NODE_JSON="$RETIRED_JSON" -- \
  --slug "$SLUG" --statement 'ignored' --body-file "$BODY" \
  --sensor dispatch-phase-eval --now 2026-08-12
assert_eq "(5) recurrence after retirement exits 0" "0" "$RC"
assert_eq "(5) count RESUMES at 8, not 1" "8" \
  "$(written '.attributes.measured_impact[] | select(.metric=="recurrence_count") | .value')"
assert_eq "(5) phase cleared back to null (reopened)" "null" "$(written '.phase')"
assert_eq "(5) first_seen still the original day" "2026-08-01" "$(written '.attributes.first_seen')"
assert_contains "(5) resumed via a CAS update, not a fresh mint" "--base" "$(log_lines graph-commit.log)"

# --- (6) impact records upsert by (metric, window) ---------------------------
IMPACT="$WORK/impact.json"
printf '%s\n' '[{"metric":"recoverable_tokens","value":42000,"unit":"tokens","window":"7d","sensor":"token-economy","measured":"2026-08-12"}]' > "$IMPACT"
IMPACT_JSON=$(jq -c . <<'JSON'
{"id":"tactic-eval-finding-stop-hook-hold-loop","phase":null,"execution":null,
 "statement":"s",
 "attributes":{"first_seen":"2026-08-01",
   "measured_impact":[
     {"metric":"recurrence_count","value":2,"unit":"occurrences","window":"all-time","sensor":"dispatch-phase-eval","measured":"2026-08-05"},
     {"metric":"recoverable_tokens","value":100,"unit":"tokens","window":"7d","sensor":"token-economy","measured":"2026-08-05"}]}}
JSON
)
run_ef STUB_STATE=open STUB_GC_LAND=1 STUB_NODE_JSON="$IMPACT_JSON" -- \
  --slug "$SLUG" --statement 's' --body-file "$BODY" --sensor dispatch-phase-eval \
  --impact-file "$IMPACT" --now 2026-08-12
assert_eq "(6) impact update exits 0" "0" "$RC"
assert_eq "(6) the (metric,window) record was REWRITTEN, not appended" "1" \
  "$(written '[.attributes.measured_impact[] | select(.metric=="recoverable_tokens" and .window=="7d")] | length')"
assert_eq "(6) rewritten to the new figure" "42000" \
  "$(written '.attributes.measured_impact[] | select(.metric=="recoverable_tokens") | .value')"
assert_eq "(6) the script's own recurrence record survived and incremented" "3" \
  "$(written '.attributes.measured_impact[] | select(.metric=="recurrence_count") | .value')"
# IMPACT_JSON carries no class marker (it is a post-retirement entry), and the
# recurrence pass must not put one back: the second of the two writers retired in
# PR4 unit 2 lives on exactly this path.
assert_eq "(6) and the retired class marker is not stamped onto a node that lacks it" "false" \
  "$(written '.attributes | has("ledger_entry")')"

# --- (7) --retire keeps the metrics ------------------------------------------
run_ef STUB_STATE=open STUB_GC_LAND=1 STUB_NODE_JSON="$IMPACT_JSON" -- --retire --slug "$SLUG"
assert_eq "(7) retire exits 0" "0" "$RC"
assert_eq "(7) phase done" "done" "$(written '.phase')"
assert_eq "(7) measured_impact INTACT (nothing reset)" "2" \
  "$(written '.attributes.measured_impact | length')"
assert_eq "(7) the recurrence figure is preserved for a later resume" "2" \
  "$(written '.attributes.measured_impact[] | select(.metric=="recurrence_count") | .value')"

# --- (8) the in-flight guard -------------------------------------------------
INFLIGHT_JSON=$(jq -c . <<'JSON'
{"id":"tactic-eval-finding-stop-hook-hold-loop","phase":"implement",
 "execution":{"pr":123},"statement":"s","attributes":{}}
JSON
)
run_ef STUB_STATE=open STUB_NODE_JSON="$INFLIGHT_JSON" -- \
  --slug "$SLUG" --statement 's' --body-file "$BODY" --sensor dispatch-phase-eval
assert_eq "(8) in-flight entry exits 0" "0" "$RC"
# CONTRACT CHANGE (tactic-eval-finding-ledger-fixes, unit D2): this used to
# assert "noop", which conflated "nothing needed writing" with "refused and
# recorded nothing" — a fire-and-forget caller cannot tell the two apart from
# stdout alone, and the second one is a silently lost occurrence. The in-flight
# guard now reports its own token so a caller can act on it.
assert_eq "(8) stdout says skipped-in-flight, not noop (a lost occurrence, not a satisfied no-op)" \
  "skipped-in-flight" "$SOUT"
assert_eq "(8) no write-node" "" "$(log_lines write-node.log)"
assert_eq "(8) no graph-commit" "" "$(log_lines graph-commit.log)"
assert_contains "(8) the dropped occurrence is announced, never silent" \
  "NOT COUNTED" "$OUT"

# --- (8b) the in-flight guard also blocks --retire ---------------------------
# Sibling of D2's --resolved-by fix: --retire on an open entry whose execution
# is non-null refuses to complete it mechanically and records nothing. This is
# the same "refused, recorded nothing" shape as (8) and the --resolved-by
# body-refresh case in (16), so it gets the same skipped-in-flight token rather
# than noop (which case (7) and a not-open --retire both still use, correctly,
# for a genuinely satisfied or genuinely nothing-to-do call).
run_ef STUB_STATE=open STUB_NODE_JSON="$INFLIGHT_JSON" -- --retire --slug "$SLUG"
assert_eq "(8b) --retire on an in-flight entry exits 0" "0" "$RC"
assert_eq "(8b) stdout says skipped-in-flight, not noop" "skipped-in-flight" "$SOUT"
assert_eq "(8b) no write-node" "" "$(log_lines write-node.log)"
assert_eq "(8b) no graph-commit" "" "$(log_lines graph-commit.log)"
assert_contains "(8b) refuses to complete it mechanically" \
  "refusing to complete it mechanically" "$OUT"

# --- (9) usage refusals ------------------------------------------------------
run_ef -- --slug "$SLUG" --statement s --body-file "$BODY"
assert_eq "(9) missing --sensor exits 64" "64" "$RC"
assert_contains "(9) and says why" "not admissible ranking input" "$OUT"

BAD_IMPACT="$WORK/bad-impact.json"
printf '%s\n' '[{"metric":"x","value":"not-a-number","unit":"u","window":"7d","sensor":"s","measured":"2026-08-12"}]' > "$BAD_IMPACT"
run_ef -- --slug "$SLUG" --statement s --body-file "$BODY" --sensor s --impact-file "$BAD_IMPACT"
assert_eq "(9) malformed --impact-file exits 64" "64" "$RC"
assert_eq "(9) and never reaches the graph" "" "$(log_lines classify.log)"

OWNED_IMPACT="$WORK/owned-impact.json"
printf '%s\n' '[{"metric":"recurrence_count","value":99,"unit":"occurrences","window":"all-time","sensor":"s","measured":"2026-08-12"}]' > "$OWNED_IMPACT"
run_ef -- --slug "$SLUG" --statement s --body-file "$BODY" --sensor s --impact-file "$OWNED_IMPACT"
assert_eq "(9) a caller-supplied recurrence_count exits 64" "64" "$RC"
assert_contains "(9) and names the owned metric" "owns that metric" "$OUT"

# --- (10) the silent-PASS invariant -----------------------------------------
# graph-commit exits 0 having landed NOTHING (STUB_GC_LAND unset): the SUT's
# post-write blob verification must turn that into exit 1.
run_ef STUB_STATE=open STUB_NODE_JSON="$OPEN_JSON" -- \
  --slug "$SLUG" --statement s --body-file "$BODY" --sensor s
assert_eq "(10) an unlanded graph-commit is exit 1, not 0" "1" "$RC"
assert_contains "(10) and says verification failed" "verification failed" "$OUT"
# Nothing is printed on a failure exit — the non-zero rc is the whole signal, so
# a caller polling stdout can never read an unverified write as a landed one.
# (No rollback here, deliberately, and the same as dispatch-fleet-alarm: the
# commit reported success, so whether anything landed is genuinely unknown and
# blind restoration could discard a write that did land. The rc is the escalation.)
assert_eq "(10) prints nothing on stdout — never claims 'landed'" "" "$SOUT"

# --- (11) doctrine ratchet over the SUT source -------------------------------
SRC="$(cat "$SUT")"
assert_not_contains "(11) no cmp -s body-identity gate (it would swallow the count)" \
  'cmp -s' "$SRC"
assert_not_contains "(11) no minimum-refresh-interval brake (it would drop occurrences)" \
  'MIN_REFRESH_INTERVAL' "$SRC"
assert_not_contains "(11) no absent|closed mint-over case label" 'absent|closed' "$SRC"
assert_not_contains "(11) no absent|retired mint-over case label" 'absent|retired' "$SRC"
assert_contains "(11) retired shares the RESUME path with open" 'open|retired' "$SRC"
# Divergence 3: the sibling's non-blocking verb here would restore the silent
# under-count this ledger exists to avoid.
assert_contains "(11) takes the BOUNDED-WAIT mutex verb" \
  'graph_write_lock_acquire_wait "$REPO_ROOT"' "$SRC"
assert_not_contains "(11) never the sibling's non-blocking acquire" \
  'graph_write_lock_acquire "$REPO_ROOT"' "$SRC"

# --- (12) a contended mutex is WAITED for, then the write lands --------------
# A background holder takes the same flock the SUT will contend on and keeps it
# for 3s. The SUT is given a 30s budget, so it must BLOCK and then land — the
# pre-fix behaviour (non-blocking acquire) exits `skipped-locked` at once, which
# for a fire-and-forget caller is a lost occurrence, not a deferred one.
HOLDER=""
hold_lock() { # <seconds> — hold $LOCK_FILE for that long; sets $HOLDER to its pid
  local secs="$1"
  # NOT called in a command substitution, deliberately: a background job inside
  # `$(...)` inherits the substitution's stdout pipe, so the substitution would
  # not return until the holder exited — which is the whole delay being staged.
  ( exec 9>>"$LOCK_FILE"; flock 9; sleep "$secs" ) &
  HOLDER=$!
  # Block until the flock is genuinely taken, so the SUT contends rather than
  # racing the holder to an uncontended acquire.
  local waited=0
  while (( waited < 50 )); do
    if ! ( exec 8>>"$LOCK_FILE"; flock -n 8 ) 2>/dev/null; then break; fi
    sleep 0.1; waited=$((waited + 1))
  done
}

hold_lock 3
LOCK_T0=$(date +%s)
run_ef STUB_STATE=open STUB_GC_LAND=1 STUB_NODE_JSON="$OPEN_JSON" \
  DISPATCH_EVAL_FINDING_LOCK_WAIT=30 -- \
  --slug "$SLUG" --statement 'ignored on an update' --body-file "$BODY" \
  --sensor dispatch-phase-eval --now 2026-08-05
LOCK_ELAPSED=$(( $(date +%s) - LOCK_T0 ))
wait "$HOLDER" 2>/dev/null || true
assert_eq "(12) contended run exits 0" "0" "$RC"
assert_eq "(12) it WAITED and LANDED — never skipped-locked" "landed" "$SOUT"
assert_contains "(12) and the write really reached graph-commit" "$ID" "$(log_lines graph-commit.log)"
assert_eq "(12) the recurrence count moved (the occurrence was counted)" "2" \
  "$(written '.attributes.measured_impact[] | select(.metric=="recurrence_count") | .value')"
# The holder kept the lock ~3s; an uncontended pass through this fixture is
# sub-second, so a run that took at least 2s demonstrably blocked on the flock.
assert_eq "(12) it blocked on the flock rather than returning at once" "yes" \
  "$( ((LOCK_ELAPSED >= 2)) && echo yes || echo "no (${LOCK_ELAPSED}s)")"

# --- (13) the wait is BOUNDED, and the timeout says the occurrence is LOST ----
# Same contention, but the holder outlives a 1s budget. The disposition stays
# `skipped-locked` (an evaluator must not fail its phase over a ledger write),
# and nothing is read or written — but the log line must NOT read like the
# sibling's benign deferral, because no next pass exists to recover this write.
hold_lock 4
run_ef STUB_STATE=open STUB_GC_LAND=1 STUB_NODE_JSON="$OPEN_JSON" \
  DISPATCH_EVAL_FINDING_LOCK_WAIT=1 -- \
  --slug "$SLUG" --statement 'ignored on an update' --body-file "$BODY" \
  --sensor dispatch-phase-eval --now 2026-08-05
assert_eq "(13) a spent wait budget still exits 0" "0" "$RC"
assert_eq "(13) stdout says skipped-locked" "skipped-locked" "$SOUT"
assert_eq "(13) nothing was read" "" "$(log_lines classify.log)"
assert_eq "(13) nothing was written" "" "$(log_lines graph-commit.log)"
assert_contains "(13) the log names the uncounted occurrence" "NOT COUNTED" "$OUT"
assert_contains "(13) and says it is LOST, not deferred" "IS LOST" "$OUT"
assert_contains "(13) and that nothing will re-invoke it" "NOTHING WILL RE-INVOKE" "$OUT"
assert_contains "(13) and names the wait budget it spent" "after waiting 1s" "$OUT"
wait "$HOLDER" 2>/dev/null || true

# --- (14) `absent` never mints over a LANDED entry ---------------------------
# classify() reports `absent` for ANY readNode failure — an unfetched checkout,
# a half-written file, a schema-invalid hand edit — not only for a genuinely new
# finding. Minting on one of those would overwrite a landed entry and reset its
# recurrence_count to 1: the count divergence the ledger exists to prevent,
# done silently. The LANDED BLOB, not the classification, decides existence.
LANDED_MD="$FR/intentions/$ID.md"
cat > "$LANDED_MD" <<'MD'
---
id: tactic-eval-finding-stop-hook-hold-loop
phase: null
attributes:
  ledger_entry: true
  first_seen: '2026-08-01'
---

The finding.
MD
git -C "$FR" add -A intentions >/dev/null 2>&1
git -C "$FR" commit -q -m 'fixture: land the entry' >/dev/null 2>&1
git -C "$FR" update-ref refs/remotes/origin/main HEAD
rm -f "$LANDED_MD" # the local checkout can no longer read what origin/main has
run_ef STUB_STATE=absent STUB_GC_LAND=1 -- \
  --slug "$SLUG" --statement 'the Stop hook HOLDs forever when no terminal marker is written' \
  --body-file "$BODY" --sensor dispatch-phase-eval --now 2026-08-14
assert_eq "(14) refuses rather than minting over the landed entry" "1" "$RC"
assert_eq "(14) nothing was written" "" "$(log_lines graph-commit.log)"
assert_contains "(14) the log names the uncounted occurrence" "NOT COUNTED" "$OUT"
assert_contains "(14) and says the entry EXISTS at origin/main" "EXISTS at origin/main" "$OUT"
assert_contains "(14) and names the checkout that repairs the local copy" \
  "checkout origin/main -- intentions/$ID.md" "$OUT"
# The local file stays absent: refusing is not a rollback, so nothing is dirty.
assert_eq "(14) no local node file was created" "0" "$([[ -e "$LANDED_MD" ]] && echo 1 || echo 0)"
git -C "$FR" checkout -q origin/main -- "intentions/$ID.md"

# --- (15) --list membership is the whole open tactic population --------------
# The default list_entries() path (LIST_CMD unset) needs the REAL store.js, so
# this section calls the real SUT directly at $SUT — never the FR fixture
# copy, whose SCRIPT_DIR/../../../.. math resolves to the miniature repo where
# packages/intentionsutil/src/store.js does not exist — against an isolated
# intentions/ directory of full, schema-valid node bodies (each field copied
# from the shape of a real landed ledger entry, so validateNode accepts it).
#
# Membership is namespace-free (PR4 unit 3): a tactic is a candidate iff its
# phase is not "done", or it still carries a non-empty measured_impact. Neither
# the id prefix nor the retired ledger_entry marker decides anything, so the
# fixtures below carry no marker at all.
LIST_DIR="$WORK/list-intentions"
mkdir -p "$LIST_DIR"

# (a) an OPEN tactic under the mint prefix carrying measurements — the ordinary
# script-managed entry: listed with its real recurrence_count and its slug.
cat > "$LIST_DIR/tactic-eval-finding-registered-example.md" <<'MD'
---
id: tactic-eval-finding-registered-example
kind: tactic
statement: An open ledger entry under the mint prefix, for the --list membership test.
owner: ai
status: raw
parent: null
rationale: Fixture for test-dispatch-eval-finding.sh.
reading: null
serves:
  - strategy-recursive-self-improvement
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: true
rounds: null
attributes:
  first_seen: 2026-08-01
  resolved_by: '#4242'
  measured_impact:
    - metric: recurrence_count
      value: 4
      unit: occurrences
      window: all-time
      sensor: fixture-sensor
      measured: 2026-08-10
---
# fixture body
MD

# (b) an OPEN tactic under the prefix with attributes: {} — and it is the
# doctrine root itself, which the retired prefix test excluded from its own
# list. Under a whole-population membership that exclusion would be exactly the
# special-casing being retired, so the root is now an ordinary candidate.
cat > "$LIST_DIR/tactic-eval-finding-ledger.md" <<'MD'
---
id: tactic-eval-finding-ledger
kind: tactic
statement: The ledger's own doctrine root, no longer excluded from its own list.
owner: ai
status: raw
parent: null
rationale: Fixture for test-dispatch-eval-finding.sh.
reading: null
serves:
  - strategy-recursive-self-improvement
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# fixture body
MD

# (c) an OPEN tactic OUTSIDE the mint prefix carrying measurements — the row the
# id-prefix search missed, and the whole reason for the widening. Its
# recurrence_count is REPORTED, not zeroed: measured_impact is the general
# recurrence carrier now, whoever wrote it.
cat > "$LIST_DIR/tactic-not-under-the-ledger-prefix.md" <<'MD'
---
id: tactic-not-under-the-ledger-prefix
kind: tactic
statement: The dispatch worker leaks orphaned kubernetes sidecars during rollout.
owner: ai
status: raw
parent: null
rationale: Fixture for test-dispatch-eval-finding.sh.
reading: null
serves:
  - strategy-recursive-self-improvement
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: true
rounds: null
attributes:
  first_seen: 2026-08-01
  measured_impact:
    - metric: recurrence_count
      value: 9
      unit: occurrences
      window: all-time
      sensor: fixture-sensor
      measured: 2026-08-11
---
# fixture body
MD

# (d) a RETIRED tactic outside the prefix that still carries measurements —
# visible on purpose: a recurrence after retirement RESUMES the count, which
# only works if the judgment can still see the retired record.
cat > "$LIST_DIR/tactic-retired-finding-outside-the-prefix.md" <<'MD'
---
id: tactic-retired-finding-outside-the-prefix
kind: tactic
statement: A retired tactic outside the prefix that kept its figures.
owner: ai
status: raw
parent: null
rationale: Fixture for test-dispatch-eval-finding.sh.
reading: null
serves:
  - strategy-recursive-self-improvement
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: true
rounds: null
attributes:
  first_seen: 2026-07-02
  measured_impact:
    - metric: recurrence_count
      value: 6
      unit: occurrences
      window: all-time
      sensor: fixture-sensor
      measured: 2026-07-30
---
# fixture body
MD

# (e) a RETIRED tactic with no measurements — an ordinary completed piece of
# work, and the half of the population the membership test must NOT admit. Every
# done tactic in the graph would otherwise land in the similarity judgment.
cat > "$LIST_DIR/tactic-retired-with-no-measurements.md" <<'MD'
---
id: tactic-retired-with-no-measurements
kind: tactic
statement: An ordinary completed tactic carrying no measurements at all.
owner: ai
status: raw
parent: null
rationale: Fixture for test-dispatch-eval-finding.sh.
reading: null
serves:
  - strategy-recursive-self-improvement
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# fixture body
MD

LIST_RC=0
LIST_OUT=$(DISPATCH_EVAL_FINDING_INTENTIONS_DIR="$LIST_DIR" "$SUT" --list) || LIST_RC=$?
assert_eq "(15) --list against the real store.js exits 0" "0" "$LIST_RC"
assert_eq "(15) exactly the four candidate rows are listed" "4" \
  "$(jq 'length' <<<"$LIST_OUT")"
assert_eq "(15) the doctrine root is no longer excluded from its own list" "1" \
  "$(jq '[.[] | select(.id == "tactic-eval-finding-ledger")] | length' <<<"$LIST_OUT")"
assert_eq "(15) a retired tactic carrying NO measurements is not a candidate" "0" \
  "$(jq '[.[] | select(.id == "tactic-retired-with-no-measurements")] | length' <<<"$LIST_OUT")"
assert_eq "(15) and no row carries the retired unregistered flag" "0" \
  "$(jq '[.[] | select(has("unregistered"))] | length' <<<"$LIST_OUT")"

assert_eq "(15a) an open entry under the prefix keeps its real recurrence_count" "4" \
  "$(jq '[.[] | select(.id == "tactic-eval-finding-registered-example")][0].recurrence_count' <<<"$LIST_OUT")"
assert_eq "(15a) its slug is derived from the prefix" "registered-example" \
  "$(jq -r '[.[] | select(.id == "tactic-eval-finding-registered-example")][0].slug' <<<"$LIST_OUT")"
assert_eq "(15a) so the caller addresses it by slug" "slug" \
  "$(jq -r '[.[] | select(.id == "tactic-eval-finding-registered-example")][0].addressable_by' <<<"$LIST_OUT")"
assert_eq "(15a) and it surfaces its stated resolution to the judgment" "#4242" \
  "$(jq -r '[.[] | select(.id == "tactic-eval-finding-registered-example")][0].resolved_by' <<<"$LIST_OUT")"

assert_eq "(15b) a candidate with no measurements reports recurrence_count 0" "0" \
  "$(jq '[.[] | select(.id == "tactic-eval-finding-ledger")][0].recurrence_count' <<<"$LIST_OUT")"
assert_eq "(15b) and no stated resolution reports null" "null" \
  "$(jq '[.[] | select(.id == "tactic-eval-finding-ledger")][0].resolved_by' <<<"$LIST_OUT")"
# Membership and addressability are separable, and the doctrine root is where
# they come apart: it is listed (the judgment must see it) but carries no slug,
# so a judgment reading this row has nothing to copy into --slug.
assert_eq "(15b) the doctrine root carries NO slug, though it sits under the prefix" "null" \
  "$(jq '[.[] | select(.id == "tactic-eval-finding-ledger")][0].slug' <<<"$LIST_OUT")"
assert_eq "(15b) so it is addressable by id only — it is context, not a write target" "id" \
  "$(jq -r '[.[] | select(.id == "tactic-eval-finding-ledger")][0].addressable_by' <<<"$LIST_OUT")"

assert_eq "(15c) an OPEN tactic outside the prefix is a candidate" "1" \
  "$(jq '[.[] | select(.id == "tactic-not-under-the-ledger-prefix")] | length' <<<"$LIST_OUT")"
assert_eq "(15c) reporting its real recurrence_count, not a zeroed one" "9" \
  "$(jq '[.[] | select(.id == "tactic-not-under-the-ledger-prefix")][0].recurrence_count' <<<"$LIST_OUT")"
assert_eq "(15c) it has no slug (outside the prefix)" "null" \
  "$(jq '[.[] | select(.id == "tactic-not-under-the-ledger-prefix")][0].slug' <<<"$LIST_OUT")"
assert_eq "(15c) so the caller addresses it by id" "id" \
  "$(jq -r '[.[] | select(.id == "tactic-not-under-the-ledger-prefix")][0].addressable_by' <<<"$LIST_OUT")"

assert_eq "(15d) a retired tactic carrying measurements stays visible" "retired" \
  "$(jq -r '[.[] | select(.id == "tactic-retired-finding-outside-the-prefix")][0].state' <<<"$LIST_OUT")"
assert_eq "(15d) with the figure a later recurrence resumes from" "6" \
  "$(jq '[.[] | select(.id == "tactic-retired-finding-outside-the-prefix")][0].recurrence_count' <<<"$LIST_OUT")"

# --like ranks the whole population, --limit bounds it, the measurement carriers
# ride a floor past the cut, and what was left out is stated on stderr.
LIKE_ERR="$WORK/like.err"
LIKE_RC=0
LIKE_OUT=$(DISPATCH_EVAL_FINDING_INTENTIONS_DIR="$LIST_DIR" "$SUT" --list \
  --like 'orphaned kubernetes sidecars rollout' --limit 1 2>"$LIKE_ERR") || LIKE_RC=$?
assert_eq "(15e) --like exits 0" "0" "$LIKE_RC"
assert_eq "(15e) the phrase-matching row ranks first" "tactic-not-under-the-ledger-prefix" \
  "$(jq -r '.[0].id' <<<"$LIKE_OUT")"
assert_eq "(15e) and scores 1 on a phrase drawn entirely from its statement" "1" \
  "$(jq '.[0].score' <<<"$LIKE_OUT")"
assert_eq "(15e) the measurement carriers ride the floor past --limit 1" "3" \
  "$(jq 'length' <<<"$LIKE_OUT")"
assert_eq "(15e) including the RETIRED carrier, which scored nothing" "1" \
  "$(jq '[.[] | select(.id == "tactic-retired-finding-outside-the-prefix")] | length' <<<"$LIKE_OUT")"
assert_eq "(15e) while the unmeasured row below the cut IS elided" "0" \
  "$(jq '[.[] | select(.id == "tactic-eval-finding-ledger")] | length' <<<"$LIKE_OUT")"
assert_contains "(15e) and the elision is disclosed on stderr, not hidden" \
  "population=4 emitted=3 elided=1" "$(cat "$LIKE_ERR")"
assert_contains "(15e) with the score cut that produced it" "score_cut=1.0000" \
  "$(cat "$LIKE_ERR")"
assert_eq "(15e) bare --list discloses nothing, because it elides nothing" "" \
  "$(DISPATCH_EVAL_FINDING_INTENTIONS_DIR="$LIST_DIR" "$SUT" --list 2>&1 >/dev/null)"

# (15e-ties) THE CUT IS NOT A SCORE THRESHOLD. score = shared / min(|a|,|b|)
# over a short query takes few distinct values, so rows tie at the cut in bulk
# and which of them survive is decided by recurrence_count then id — i.e.
# alphabetically, not by relevance. A caller reading score_cut alone takes it as
# "everything at or above this was emitted" and never widens, so the tie
# casualties are disclosed by their own count. Four rows: one scoring 1.0 on
# both query tokens, three tying at 0.5 on one of them. Under --limit 2 the
# 1.0 row and the alphabetically-first tied row are emitted, and the other two
# tied rows — equal-ranked, dropped on id order alone — are the casualties.
TIE_DIR="$WORK/tie-intentions"
mkdir -p "$TIE_DIR"
write_tie_fixture() {
  cat > "$TIE_DIR/$1.md" <<MD
---
id: $1
kind: tactic
statement: $2
owner: ai
status: raw
parent: null
rationale: Fixture for test-dispatch-eval-finding.sh.
reading: null
serves:
  - strategy-recursive-self-improvement
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# fixture body
MD
}
write_tie_fixture tactic-tie-alpha 'A quark gluon fixture row.'
write_tie_fixture tactic-tie-beta 'A quark fixture row.'
write_tie_fixture tactic-tie-gamma 'A quark fixture row.'
write_tie_fixture tactic-tie-delta 'A quark fixture row.'

TIE_ERR="$WORK/tie.err"
TIE_RC=0
TIE_OUT=$(DISPATCH_EVAL_FINDING_INTENTIONS_DIR="$TIE_DIR" "$SUT" --list \
  --like 'quark gluon' --limit 2 2>"$TIE_ERR") || TIE_RC=$?
assert_eq "(15e-ties) --like exits 0" "0" "$TIE_RC"
assert_eq "(15e-ties) the two-token row ranks first" "tactic-tie-alpha" \
  "$(jq -r '.[0].id' <<<"$TIE_OUT")"
assert_eq "(15e-ties) only one of the three tied rows is emitted" "2" \
  "$(jq 'length' <<<"$TIE_OUT")"
assert_eq "(15e-ties) and it is the alphabetically-first one, not the most relevant" \
  "tactic-tie-beta" "$(jq -r '.[1].id' <<<"$TIE_OUT")"
assert_contains "(15e-ties) the cut is disclosed" \
  "population=4 emitted=2 elided=2 score_cut=0.5000" "$(cat "$TIE_ERR")"
assert_contains "(15e-ties) AND the equal-ranked rows dropped AT the cut are counted" \
  "cut_ties_elided=2" "$(cat "$TIE_ERR")"
assert_contains "(15e) no rows tie at that cut, so the count is zero, not absent" \
  "cut_ties_elided=0" "$(cat "$LIKE_ERR")"

# --like/--limit shape the --list view and are refused anywhere else, rather
# than accepted and silently ignored.
LIKE_RC=0
DISPATCH_EVAL_FINDING_INTENTIONS_DIR="$LIST_DIR" "$SUT" --like x --list-retirable >/dev/null 2>&1 || LIKE_RC=$?
assert_eq "(15f) --like outside --list exits 64" "64" "$LIKE_RC"
LIKE_RC=0
DISPATCH_EVAL_FINDING_INTENTIONS_DIR="$LIST_DIR" "$SUT" --list --limit 5 >/dev/null 2>&1 || LIKE_RC=$?
assert_eq "(15f) --limit with nothing to rank by exits 64" "64" "$LIKE_RC"
LIKE_RC=0
DISPATCH_EVAL_FINDING_INTENTIONS_DIR="$LIST_DIR" "$SUT" --list --like x --limit 0 >/dev/null 2>&1 || LIKE_RC=$?
assert_eq "(15f) a non-positive --limit exits 64" "64" "$LIKE_RC"

# (15g) An EXPLICITLY PASSED EMPTY value is refused, not read as "flag absent".
# Every guard downstream tests `-n`, so `--like ""` — the shape a caller writing
# --like "$STATEMENT" gets when the variable is unset — would otherwise reach
# the reader as like.length === 0 and print the WHOLE population, with no stderr
# disclosure and exit 0: the unbounded dump the bound exists to prevent, arrived
# at silently.
LIKE_OUT=""
LIKE_RC=0
LIKE_OUT=$(DISPATCH_EVAL_FINDING_INTENTIONS_DIR="$LIST_DIR" "$SUT" --list --like "" 2>"$LIKE_ERR") || LIKE_RC=$?
assert_eq "(15g) an empty --like exits 64 instead of dumping the population" "64" "$LIKE_RC"
assert_eq "(15g) and prints no rows at all" "" "$LIKE_OUT"
assert_contains "(15g) saying the value must be NON-EMPTY" "NON-EMPTY" "$(cat "$LIKE_ERR")"
# The sibling misdiagnosis: --limit's refusal used to claim no --like was given.
LIKE_RC=0
DISPATCH_EVAL_FINDING_INTENTIONS_DIR="$LIST_DIR" "$SUT" --list --like "" --limit 20 >/dev/null 2>"$LIKE_ERR" || LIKE_RC=$?
assert_eq "(15g) an empty --like beside a --limit exits 64 too" "64" "$LIKE_RC"
assert_not_contains "(15g) and does NOT misreport it as a missing --like" \
  "it needs a --like <text> to rank by" "$(cat "$LIKE_ERR")"
# And an empty --limit is refused rather than accepted-and-ignored by `-n`.
LIKE_RC=0
DISPATCH_EVAL_FINDING_INTENTIONS_DIR="$LIST_DIR" "$SUT" --list --like x --limit "" >/dev/null 2>&1 || LIKE_RC=$?
assert_eq "(15g) an empty --limit exits 64" "64" "$LIKE_RC"
# Outside --list it is refused at parse time rather than accepted and ignored:
# --list-retirable would otherwise run to completion with the flag swallowed.
LIKE_RC=0
DISPATCH_EVAL_FINDING_INTENTIONS_DIR="$LIST_DIR" "$SUT" --list-retirable --limit "" >/dev/null 2>&1 || LIKE_RC=$?
assert_eq "(15g) an empty --limit outside --list is refused, not silently dropped" "64" "$LIKE_RC"

# --- (16) --resolved-by states a fact, and never counts an occurrence --------
# The gap this closes: the only update path was the recurrence path, so a
# re-evaluation that had established a landed PR resolved an entry could not
# write that down without ALSO recording a fresh occurrence of the finding it
# had just seen fixed.
run_ef STUB_STATE=open STUB_GC_LAND=1 STUB_NODE_JSON="$OPEN_JSON" -- \
  --slug "$SLUG" --resolved-by 3079
assert_eq "(16) --resolved-by exits 0" "0" "$RC"
assert_eq "(16) stdout says landed" "landed" "$SOUT"
assert_eq "(16) a bare PR number is stored as #N" "#3079" "$(written '.attributes.resolved_by')"
assert_eq "(16) recurrence_count is NOT incremented" "1" \
  "$(written '.attributes.measured_impact[] | select(.metric=="recurrence_count") | .value')"
assert_eq "(16) and its measured stamp is NOT refreshed" "2026-08-01" \
  "$(written '.attributes.measured_impact[] | select(.metric=="recurrence_count") | .measured')"
assert_eq "(16) first_seen untouched" "2026-08-01" "$(written '.attributes.first_seen')"
assert_eq "(16) phase untouched — retirement is a separate judgment" "null" "$(written '.phase')"
GC16="$(log_lines graph-commit.log)"
assert_contains "(16) it is a CAS update of the existing node" "--base" "$GC16"
assert_contains "(16) and the commit message names the resolution" "resolved by #3079" "$GC16"

run_ef STUB_STATE=open STUB_GC_LAND=1 STUB_NODE_JSON="$OPEN_JSON" -- \
  --slug "$SLUG" --resolved-by '#3079' --body-file "$BODY"
assert_eq "(16) the '#N' form is stored unchanged" "#3079" "$(written '.attributes.resolved_by')"
# The node's body here is case (14)'s hand-written one, restored from
# origin/main and carrying no marker pair — so the refresh must PRESERVE it and
# append a region, never replace it (PR18 unit 1).
assert_eq "(16) --body-file refreshes the generated region" \
  "The finding.
Second line." "$(node_region)"
assert_eq "(16) and the unmarked body it did not write survives the refresh" \
  "
The finding." "$(node_body_outside_region)"

FULL_SHA=$(git -C "$FR" rev-parse HEAD)
run_ef STUB_STATE=open STUB_GC_LAND=1 STUB_NODE_JSON="$OPEN_JSON" -- \
  --slug "$SLUG" --resolved-by "${FULL_SHA^^}"
assert_eq "(16) a 40-character sha is stored lowercased, no lookup needed" \
  "$FULL_SHA" "$(written '.attributes.resolved_by')"
run_ef STUB_STATE=open STUB_GC_LAND=1 STUB_NODE_JSON="$OPEN_JSON" -- \
  --slug "$SLUG" --resolved-by "${FULL_SHA:0:8}"
assert_eq "(16) an abbreviated sha is EXPANDED to 40 characters" \
  "$FULL_SHA" "$(written '.attributes.resolved_by')"

run_ef -- --slug "$SLUG" --resolved-by 1234567
assert_eq "(16) an all-digit reference of 7+ characters is refused as ambiguous" "64" "$RC"
assert_contains "(16) and says how to disambiguate it" "Write a PR as '#1234567'" "$OUT"
assert_eq "(16) and never reaches the graph" "" "$(log_lines classify.log)"

run_ef -- --slug "$SLUG" --resolved-by deadbee
assert_eq "(16) an abbreviated sha this checkout cannot resolve is refused" "64" "$RC"
assert_contains "(16) rather than storing a prefix nothing can resolve later" \
  "does not resolve in" "$OUT"

run_ef -- --slug "$SLUG" --resolved-by 'not-a-ref'
assert_eq "(16) a reference of neither shape is refused" "64" "$RC"
assert_contains "(16) and names both accepted shapes" "invalid --resolved-by" "$OUT"

run_ef -- --slug "$SLUG" --resolved-by '#3079' --sensor s
assert_eq "(16) --resolved-by records no measurement, so --sensor is refused" "64" "$RC"
run_ef -- --retire --slug "$SLUG" --resolved-by '#3079'
assert_eq "(16) --retire and --resolved-by may not be combined" "64" "$RC"
assert_contains "(16) because one states a fact and the other makes a call" \
  "separate acts" "$OUT"

RESOLVED_JSON=$(jq -c . <<'JSON'
{"id":"tactic-eval-finding-stop-hook-hold-loop","phase":null,"execution":null,
 "statement":"s",
 "attributes":{"first_seen":"2026-08-01","resolved_by":"#3079",
   "measured_impact":[{"metric":"recurrence_count","value":1,"unit":"occurrences",
     "window":"all-time","sensor":"dispatch-phase-eval","measured":"2026-08-01"}]}}
JSON
)
run_ef STUB_STATE=open STUB_NODE_JSON="$RESOLVED_JSON" -- --slug "$SLUG" --resolved-by '#3079'
assert_eq "(16) re-stating the same resolution exits 0" "0" "$RC"
# Genuinely satisfied: the entry already records this exact resolved_by and
# there is no body to refresh, so noop is the correct (unchanged) token here —
# contrast with the in-flight BODY-refresh refusal just below, which records
# nothing and must NOT claim the caller's intent was already met.
assert_eq "(16) stdout says noop — no empty commit" "noop" "$SOUT"
assert_eq "(16) and nothing was written" "" "$(log_lines graph-commit.log)"

run_ef STUB_STATE=open STUB_NODE_JSON="$INFLIGHT_JSON" -- \
  --slug "$SLUG" --resolved-by '#3079' --body-file "$BODY"
assert_eq "(16) an in-flight entry refuses the BODY refresh" "0" "$RC"
# CONTRACT CHANGE (tactic-eval-finding-ledger-fixes, unit D2): this used to
# assert "noop", the same token the genuinely-satisfied case above prints. A
# fire-and-forget caller (/rsi) cannot tell "resolved_by was already recorded"
# from "the in-flight guard refused and recorded nothing" from stdout alone —
# the second one is a silently lost resolution. The refusal now gets its own
# token.
assert_eq "(16) with a skipped-in-flight disposition, not noop" "skipped-in-flight" "$SOUT"
assert_eq "(16) and no graph write" "" "$(log_lines graph-commit.log)"
assert_contains "(16) and says nothing was recorded" "NOTHING WAS RECORDED" "$OUT"

run_ef STUB_STATE=open STUB_GC_LAND=1 STUB_NODE_JSON="$INFLIGHT_JSON" -- \
  --slug "$SLUG" --resolved-by '#3079'
assert_eq "(16) but an attributes-only write IS allowed while a PR is in flight" "0" "$RC"
assert_eq "(16) and lands — the in-flight PR is exactly what a caller names" "landed" "$SOUT"
assert_eq "(16) the resolution was recorded" "#3079" "$(written '.attributes.resolved_by')"
assert_eq "(16) and the execution the PR owns is untouched" "123" "$(written '.execution.pr')"

run_ef STUB_STATE=absent -- --slug "$SLUG" --resolved-by '#3079'
assert_eq "(16) --resolved-by against a nonexistent entry is an error, not a no-op" "1" "$RC"
assert_contains "(16) and says the entry must exist first" "EXISTING entry" "$OUT"
assert_eq "(16) and nothing was written" "" "$(log_lines graph-commit.log)"

# --- (17) --list-retirable: the close-path trigger ---------------------------
# Entries someone has said are resolved, whose named change is an ancestor of
# origin/main. Resolution is entirely offline: a sha by merge-base, a PR by the
# merge subject on origin/main's own history.
git -C "$FR" commit -q --allow-empty -m 'fixture: a plain landed fix'
ANC_SHA=$(git -C "$FR" rev-parse HEAD)
git -C "$FR" commit -q --allow-empty -m 'fixture: the squash-merged fix (#4242)'
PR_SHA=$(git -C "$FR" rev-parse HEAD)
git -C "$FR" update-ref refs/remotes/origin/main HEAD
LANDED_DATE=$(git -C "$FR" log -1 --format=%cs HEAD)
# A real commit object that is NOT an ancestor of origin/main (a fix on a branch
# that has not merged) — distinct from a sha this checkout cannot resolve at all.
SIDE_SHA=$(git -C "$FR" commit-tree "HEAD^{tree}" -p HEAD -m 'fixture: an unlanded fix')
UNKNOWN_SHA=0123456789abcdef0123456789abcdef01234567

RETIRABLE_LIST=$(jq -c -n --arg anc "$ANC_SHA" --arg side "$SIDE_SHA" --arg unknown "$UNKNOWN_SHA" '[
  {id:"tactic-eval-finding-squash-merged",slug:"squash-merged",state:"open",
   statement:"a fix merged by squash",recurrence_count:5,last_seen:"2026-08-01",resolved_by:"#4242"},
  {id:"tactic-eval-finding-plain-sha",slug:"plain-sha",state:"open",
   statement:"a fix named by sha",recurrence_count:3,last_seen:"2026-08-02",resolved_by:$anc},
  {id:"tactic-eval-finding-not-landed",slug:"not-landed",state:"open",
   statement:"a fix that has not merged",recurrence_count:2,resolved_by:$side},
  {id:"tactic-eval-finding-unknown-sha",slug:"unknown-sha",state:"open",
   statement:"a reference nothing can resolve",recurrence_count:2,resolved_by:$unknown},
  {id:"tactic-eval-finding-unmerged-pr",slug:"unmerged-pr",state:"open",
   statement:"a PR that has not merged",recurrence_count:1,resolved_by:"#999999"},
  {id:"tactic-eval-finding-no-resolution",slug:"no-resolution",state:"open",
   statement:"nobody has said this is fixed",recurrence_count:9,resolved_by:null},
  {id:"tactic-eval-finding-already-retired",slug:"already-retired",state:"retired",
   statement:"closed already",recurrence_count:4,resolved_by:"#4242"},
  {id:"tactic-outside-the-prefix",slug:null,state:"open",
   statement:"carries the attribute, not the id",recurrence_count:0,resolved_by:"#4242",unregistered:true}
]')
run_ef STUB_LIST_JSON="$RETIRABLE_LIST" -- --list-retirable
assert_eq "(17) --list-retirable exits 0" "0" "$RC"
assert_eq "(17) only the entries whose fix LANDED are listed" "2" "$(jq 'length' <<<"$SOUT")"
assert_eq "(17) a PR reference resolves to its squash-merge commit" "$PR_SHA" \
  "$(jq -r '.[] | select(.slug == "squash-merged") | .resolved_commit' <<<"$SOUT")"
assert_eq "(17) and carries the day it landed" "$LANDED_DATE" \
  "$(jq -r '.[] | select(.slug == "squash-merged") | .resolved_commit_date' <<<"$SOUT")"
assert_eq "(17) a landed sha resolves to itself" "$ANC_SHA" \
  "$(jq -r '.[] | select(.slug == "plain-sha") | .resolved_commit' <<<"$SOUT")"
assert_eq "(17) each row keeps its --list fields for the judgment" "5" \
  "$(jq -r '.[] | select(.slug == "squash-merged") | .recurrence_count' <<<"$SOUT")"

assert_eq "(17) a fix that has not merged is not a candidate" "0" \
  "$(jq '[.[] | select(.slug == "not-landed")] | length' <<<"$SOUT")"
assert_contains "(17) and the reason is stated" "NOT an ancestor of origin/main" "$OUT"
assert_eq "(17) an unresolvable sha is not a candidate" "0" \
  "$(jq '[.[] | select(.slug == "unknown-sha")] | length' <<<"$SOUT")"
assert_contains "(17) and is NAMED, never silently skipped" \
  "tactic-eval-finding-unknown-sha: resolved_by $UNKNOWN_SHA cannot be resolved" "$OUT"
assert_eq "(17) an unmerged PR reference is not a candidate" "0" \
  "$(jq '[.[] | select(.slug == "unmerged-pr")] | length' <<<"$SOUT")"
assert_contains "(17) and it too is named" "tactic-eval-finding-unmerged-pr" "$OUT"
assert_eq "(17) an entry nobody has resolved is not a candidate" "0" \
  "$(jq '[.[] | select(.slug == "no-resolution")] | length' <<<"$SOUT")"
assert_eq "(17) an already-retired entry is not a candidate" "0" \
  "$(jq '[.[] | select(.slug == "already-retired")] | length' <<<"$SOUT")"
assert_eq "(17) a row --retire --slug cannot address is excluded" "0" \
  "$(jq '[.[] | select(.id == "tactic-outside-the-prefix")] | length' <<<"$SOUT")"
assert_contains "(17) and says why" "--retire --slug cannot address it" "$OUT"
assert_eq "(17) it retires NOTHING — the actor stays a person" "" "$(log_lines graph-commit.log)"

run_ef -- --list-retirable --slug "$SLUG"
assert_eq "(17) --list-retirable takes no other arguments" "64" "$RC"

# --- (18) the ledger writes through graph-commit's PLUMBING writer -----------
# tactic-eval-finding-eval-write-blocked-by-unrelated-main-dirt: graph-commit's
# default writer refuses on ANY unrelated dirty tracked file in the checkout,
# which failed every ledger write for a file no ledger write reads — silently,
# because this script's caller is fire-and-forget with a discarded transcript.
# The plumbing writer builds against a throwaway index and has no such refusal.
# The var is the entire interface, so assert the SUT actually sets it.
run_ef STUB_STATE=absent STUB_GC_LAND=1 -- \
  --slug writer-opt-in --statement 'the ledger writes through the plumbing writer' \
  --body-file "$BODY" --sensor dispatch-phase-eval --now 2026-08-13
assert_eq "(18) the write lands" "0" "$RC"
assert_contains "(18) graph-commit is invoked with GRAPH_COMMIT_WRITER=plumbing" \
  "GRAPH_COMMIT_WRITER=plumbing" "$(log_lines graph-commit-env.log)"
# Scoped to the invocation, not exported process-wide: the writer default stays
# `worktree` for every OTHER graph-commit caller, and flipping those is a
# separate decision with a separate blast radius.
assert_contains "(18) the opt-in is per-invocation, not a global export" \
  'GRAPH_COMMIT_WRITER=plumbing "${GRAPH_COMMIT_CMD[@]}"' "$(cat "$SUT")"
assert_not_contains "(18) never a process-wide export" \
  'export GRAPH_COMMIT_WRITER' "$(cat "$SUT")"

# --- (19) a landed write leaves the checkout CLEAN ---------------------------
# The counterpart to case 18, and the reason it is not enough to opt in and stop
# there. The plumbing writer pushes straight to origin/main and never moves this
# checkout's HEAD, index or tree — so unless the SUT clears it, every successful
# write leaves intentions/<id>.md modified (or, on the mint path, untracked)
# indefinitely. That residue is the exact unrelated-dirt condition that fails
# the DEFAULT writer's pre-flight guard for every later graph-commit in the
# checkout whatever node it targets, and makes an --ff-only sync refuse. Left
# unasserted, this script would close
# tactic-eval-finding-eval-write-blocked-by-unrelated-main-dirt by reproducing
# it from its own successes.
PSLUG=plumb-residue
PID="tactic-eval-finding-$PSLUG"

# (a) the mint path — a net-new node, untracked in this checkout.
run_ef STUB_STATE=absent STUB_GC_PLUMB=1 -- \
  --slug "$PSLUG" --statement 'a landed write leaves no residue' \
  --body-file "$BODY" --sensor dispatch-phase-eval --now 2026-08-13
assert_eq "(19a) the mint lands" "0" "$RC"
assert_eq "(19a) stdout says landed" "landed" "$SOUT"
assert_eq "(19a) the content IS on origin/main" "0" \
  "$(git -C "$FR" cat-file -e "refs/remotes/origin/main:intentions/$PID.md" 2>/dev/null; echo $?)"
assert_eq "(19a) HEAD did NOT move — the writer touched no tree" "" \
  "$(git -C "$FR" cat-file -e "HEAD:intentions/$PID.md" 2>/dev/null && echo 'at HEAD')"
assert_eq "(19a) no untracked node file is left behind" "" \
  "$(git -C "$FR" status --porcelain -- "intentions/$PID.md")"

# (b) the update path — a tracked node, so the residue is a MODIFIED file.
# A slug of its own, not (a)'s: (a) put its node on origin/main, and `absent`
# never mints over a landed entry (case 14). Committed to HEAD first with
# STUB_GC_LAND — the worktree-writer shape — so the update has something to be
# dirty against.
#
# --retire is the update chosen deliberately: it moves `phase` to done, so the
# on-disk file provably DIFFERS from HEAD's. A same-body recurrence does not —
# the stub writer's frontmatter is identical across those two writes, so the
# file never goes dirty and the assertion below would pass against a writer that
# clears nothing at all.
BSLUG=plumb-residue-update
BID="tactic-eval-finding-$BSLUG"
run_ef STUB_STATE=absent STUB_GC_LAND=1 -- \
  --slug "$BSLUG" --statement 'a landed update leaves no residue' \
  --body-file "$BODY" --sensor dispatch-phase-eval --now 2026-08-13
assert_eq "(19b) the setup mint lands" "0" "$RC"
assert_eq "(19b) setup leaves the node at HEAD" "0" \
  "$(git -C "$FR" cat-file -e "HEAD:intentions/$BID.md" 2>/dev/null; echo $?)"
HEAD_BLOB_B="$(git -C "$FR" rev-parse "HEAD:intentions/$BID.md")"
PLUMB_OPEN_JSON=$(jq -c --arg id "$BID" '.id = $id' <<<"$OPEN_JSON")
run_ef STUB_STATE=open STUB_GC_PLUMB=1 STUB_NODE_JSON="$PLUMB_OPEN_JSON" -- \
  --retire --slug "$BSLUG"
assert_eq "(19b) the retirement lands" "0" "$RC"
assert_eq "(19b) stdout says landed" "landed" "$SOUT"
# The write really did change the file — without this the cleanliness assertion
# below is satisfied by a file that was never dirty.
assert_eq "(19b) the landed content DIFFERS from HEAD's" "done" \
  "$(git -C "$FR" show "refs/remotes/origin/main:intentions/$BID.md" | sed -n 's/^phase: //p')"
assert_eq "(19b) the node file is NOT left dirty in the checkout" "" \
  "$(git -C "$FR" status --porcelain -- "intentions/$BID.md")"
# Clean means returned to HEAD, not merely unstaged: the worktree blob has to
# equal HEAD's, or the next graph write in this checkout still refuses.
assert_eq "(19b) the working copy equals HEAD's blob" \
  "$HEAD_BLOB_B" "$(git -C "$FR" hash-object -- "$FR/intentions/$BID.md")"

# --- (20) verification answers about THE WRITE, not about the checkout -------
# verify_landed() used to hash the LOCAL PATH after graph-commit ran, which is a
# question about the checkout, not about this write. graph-commit is entitled to
# leave that path on a different base (STUB_GC_DROP_LOCAL models the sharpest
# form: it is gone), and on 2026-08-14 that produced
# `fatal: could not open …/intentions/<slug>.md` on all FOUR successful mints —
# false alarms that left the check with no credibility for the fifth write,
# which was genuinely lost. The subject is now the blob this script wrote,
# captured before the handoff, so a landed write verifies whatever the checkout
# looks like afterwards
# (tactic-eval-finding-noop-verdict-hides-dropped-node-edit, remedy 1 residual).
VSLUG=verify-intent
VID="tactic-eval-finding-$VSLUG"
run_ef STUB_STATE=absent STUB_GC_PLUMB=1 STUB_GC_DROP_LOCAL=1 -- \
  --slug "$VSLUG" --statement 'verification hashes the content this pass wrote' \
  --body-file "$BODY" --sensor dispatch-phase-eval --now 2026-08-13
assert_eq "(20) the mint lands even though the local copy is gone" "0" "$RC"
assert_eq "(20) stdout says landed" "landed" "$SOUT"
assert_eq "(20) the content IS on origin/main" "0" \
  "$(git -C "$FR" cat-file -e "refs/remotes/origin/main:intentions/$VID.md" 2>/dev/null; echo $?)"
assert_not_contains "(20) no false post-write verification failure" \
  "post-write verification failed" "$OUT"
assert_not_contains "(20) the vanished local path is never hashed" \
  "could not hash" "$OUT"

# --- (21) an unattended body write is a REGION write, never a wholesale one ---
# The defect (tactic-autonomous-body-write-wholesale-replace, PR18 unit 1): the
# body is half of tacticScopeFingerprint, so writing it is a scope-substance
# write — and this script used to keep the frontmatter and replace EVERYTHING
# after it on all three paths, including the two where the node already exists.
# The in-flight guard (case 8) does not cover this: it fires on a non-null
# `execution`, which every parked or draft ledger entry — the ones a human has
# actually been reading — does not have.

# Puts $2.. (read from stdin) on origin/main as the body of node <$1>, so a
# later pass sees a landed entry with content this script did not author.
land_node_with_body() { # <id> < <body text>
  local id="$1" md="$FR/intentions/$1.md"
  {
    printf -- '---\n'
    printf 'id: %s\n' "$id"
    printf 'kind: tactic\n'
    printf 'phase: null\n'
    printf -- '---\n'
    cat
  } > "$md"
  git -C "$FR" add -A intentions >/dev/null 2>&1
  git -C "$FR" commit -q -m "fixture: land $id" >/dev/null 2>&1
  git -C "$FR" update-ref refs/remotes/origin/main HEAD
}

HSLUG=hand-authored-body
HID="tactic-eval-finding-$HSLUG"
HMD="$FR/intentions/$HID.md"
HAND_JSON=$(jq -c --arg id "$HID" '.id = $id' <<<"$OPEN_JSON")
HAND_PROSE="# The finding this entry is about

An office-hours sitting added this paragraph. It is durable content, and no one
asked a human whether an evaluator may replace it."

# (21a) a recurrence over an UNMARKED body: the prose is kept verbatim and the
# region is appended after it. This is the migration — refusing an unmarked body
# instead would make every entry minted before this fence unwritable, and the
# recurrence count is the one figure the ledger exists to carry.
land_node_with_body "$HID" <<MD
$HAND_PROSE
MD
run_ef STUB_STATE=open STUB_GC_LAND=1 STUB_NODE_JSON="$HAND_JSON" -- \
  --slug "$HSLUG" --statement 'ignored on an update' --body-file "$BODY" \
  --sensor dispatch-phase-eval --now 2026-08-20
assert_eq "(21a) the recurrence lands" "0" "$RC"
assert_eq "(21a) stdout says landed" "landed" "$SOUT"
assert_eq "(21a) the hand-authored body survives verbatim" \
  "$HAND_PROSE" "$(node_body_outside_region "$HMD")"
assert_eq "(21a) and the generated finding sits inside the owned region" \
  "The finding.
Second line." "$(node_region "$HMD")"
assert_eq "(21a) the occurrence was still counted — preserving is not skipping" "2" \
  "$(written '.attributes.measured_impact[] | select(.metric=="recurrence_count") | .value')"

# (21b) a SECOND recurrence with different content replaces the region in place.
# The generated reading carries its own `##` headings, which is why the region is
# delimited by a marker pair rather than by "everything under the last heading",
# and why append-forever was rejected: this body is a latest-reading body, so an
# append mode would grow it without bound.
BODY2="$WORK/body2.md"
printf 'A different finding.\n\n## With its own heading\n\nAnd a paragraph under it.\n' > "$BODY2"
run_ef STUB_STATE=open STUB_GC_LAND=1 STUB_NODE_JSON="$HAND_JSON" -- \
  --slug "$HSLUG" --statement 'ignored on an update' --body-file "$BODY2" \
  --sensor dispatch-phase-eval --now 2026-08-21
assert_eq "(21b) the second recurrence lands" "0" "$RC"
assert_eq "(21b) the region is replaced in place, its own ## headings intact" \
  "A different finding.

## With its own heading

And a paragraph under it." "$(node_region "$HMD")"
assert_eq "(21b) the hand-authored body is still there, unchanged" \
  "$HAND_PROSE" "$(node_body_outside_region "$HMD")"
assert_eq "(21b) exactly ONE region was ever appended — the body is stable" "1" \
  "$(grep -cxF "$REGION_OPEN" "$HMD")"

# (21c) the MINT is the only path that writes a whole body, and it is gated
# rather than trusted: a local file already carrying an authored body means the
# `absent` classification was wrong, so the create refuses. (Exit 70 is the mint
# path's pre-existing contract for a local-only file it cannot roll back — there
# is no origin/main blob to restore, by construction.)
CSLUG=local-authored-body
CID="tactic-eval-finding-$CSLUG"
CMD_MD="$FR/intentions/$CID.md"
CPROSE="# A draft somebody wrote by hand

It has never reached origin/main, so nothing can roll it back."
{
  printf -- '---\n'
  printf 'id: %s\n' "$CID"
  printf 'kind: tactic\n'
  printf 'phase: null\n'
  printf -- '---\n'
  printf '%s\n' "$CPROSE"
} > "$CMD_MD"
run_ef STUB_STATE=absent STUB_GC_LAND=1 -- \
  --slug "$CSLUG" --statement 'a create may not replace an authored body' \
  --body-file "$BODY" --sensor dispatch-phase-eval --now 2026-08-20
assert_eq "(21c) the mint refuses rather than replacing the authored body" "70" "$RC"
assert_eq "(21c) nothing reached the graph" "" "$(log_lines graph-commit.log)"
assert_contains "(21c) and it says a create replaces WHOLESALE" \
  "a create replaces the body WHOLESALE" "$OUT"
assert_eq "(21c) the authored body is untouched" "$CPROSE" "$(node_body "$CMD_MD")"
assert_eq "(21c) and no .tmp residue is left behind" "0" \
  "$([[ -e "$CMD_MD.tmp" ]] && echo 1 || echo 0)"

# (21d) an unbalanced marker pair is REFUSED, never guessed at — the permissive
# reading (treat a lone opening marker as "the region runs to the end") would
# swallow everything a human wrote below it.
UNSLUG=unbalanced-markers
UNID="tactic-eval-finding-$UNSLUG"
UNMD="$FR/intentions/$UNID.md"
UN_JSON=$(jq -c --arg id "$UNID" '.id = $id' <<<"$OPEN_JSON")
UN_BODY="Prose above.

$REGION_OPEN
half a region, with no closing marker

Prose below, which a permissive reading would eat."
land_node_with_body "$UNID" <<MD
$UN_BODY
MD
run_ef STUB_STATE=open STUB_GC_LAND=1 STUB_NODE_JSON="$UN_JSON" -- \
  --slug "$UNSLUG" --statement 'ignored on an update' --body-file "$BODY" \
  --sensor dispatch-phase-eval --now 2026-08-20
assert_eq "(21d) an unbalanced marker pair is refused" "1" "$RC"
assert_eq "(21d) nothing reached the graph" "" "$(log_lines graph-commit.log)"
assert_contains "(21d) and it refuses to guess which bytes it owns" \
  "refusing to guess which bytes this script owns" "$OUT"
assert_eq "(21d) the body was rolled back to origin/main, byte for byte" \
  "$UN_BODY" "$(node_body "$UNMD")"
assert_eq "(21d) and no .tmp residue is left behind" "0" \
  "$([[ -e "$UNMD.tmp" ]] && echo 1 || echo 0)"

# (21e) a source ratchet, in the spirit of case 11: the mode is the whole fence,
# so a call site that loses it is the defect returning. One create (the mint) and
# two regions (recurrence, --resolved-by refresh) — no fourth spelling.
assert_eq "(21e) exactly one create call site — the mint" "1" \
  "$(grep -c '! splice_body create' "$SUT")"
assert_eq "(21e) and both edit paths write a region" "2" \
  "$(grep -c '! splice_body region' "$SUT")"
assert_not_contains "(21e) no mode-less call survives" \
  '! splice_body;' "$(cat "$SUT")"
assert_not_contains "(21e) and no mode-less call at the end of a chain" \
  '! splice_body \' "$(cat "$SUT")"

# (22) an INVERTED marker pair — the closing marker appears BEFORE the opening
# one, but the pair is still balanced (1 open, 1 close) — is refused too, and
# distinctly from the unbalanced case (21d). The count-only guard `opens !=
# closes || opens > 1` cannot see order, only counts, so it let this through;
# the replacement awk then printed the stray close line, hit the open marker,
# started skipping, and — with no further close line ahead of it — dropped
# every remaining line to EOF, reporting success while silently truncating the
# body. Both the explicit ordering check and the awk's own END backstop exist
# to make that impossible (PR18 finding on unit 1).
INVSLUG=inverted-markers
INVID="tactic-eval-finding-$INVSLUG"
INVMD="$FR/intentions/$INVID.md"
INV_JSON=$(jq -c --arg id "$INVID" '.id = $id' <<<"$OPEN_JSON")
INV_BODY="Prose above.

$REGION_CLOSE
$REGION_OPEN

Prose below, which the inverted-order bug would truncate to nothing."
land_node_with_body "$INVID" <<MD
$INV_BODY
MD
run_ef STUB_STATE=open STUB_GC_LAND=1 STUB_NODE_JSON="$INV_JSON" -- \
  --slug "$INVSLUG" --statement 'ignored on an update' --body-file "$BODY" \
  --sensor dispatch-phase-eval --now 2026-08-20
assert_eq "(22) an inverted marker pair is refused" "1" "$RC"
assert_eq "(22) nothing reached the graph" "" "$(log_lines graph-commit.log)"
assert_contains "(22) and it names the ordering problem, not just 'unbalanced'" \
  "appears before its" "$OUT"
assert_eq "(22) the body was rolled back to origin/main, byte for byte — nothing truncated" \
  "$INV_BODY" "$(node_body "$INVMD")"
assert_eq "(22) and no .tmp residue is left behind" "0" \
  "$([[ -e "$INVMD.tmp" ]] && echo 1 || echo 0)"

# --- summary -----------------------------------------------------------------
# report_results is also the decision-log guard's ONLY call site, so the suite
# must end here rather than tallying by hand.
report_results
