#!/usr/bin/env bash
# Tests for graph-auto-merge -- relocated from a test-dispatch-scripts.sh
# addition that arrived via origin/main after the monolith split
# (tactic-dispatch-test-monolith-split), commit c2a7970c
# ("graph-tick: tick-owned label-free auto-merge of reviewed node-lane PRs").
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# Test: graph-auto-merge — the graph-native, marker-keyed PR auto-merger
# (tactic-graph-tick-node-lane-auto-merge Unit 1)
# ============================================================================
# graph-auto-merge derives REPO_ROOT/UTIL_SCRIPTS from its own on-disk location
# and shells out to two `node --import tsx/esm` invocations (the listNodes
# candidate enumeration and compute-freshness.ts) plus gh. Following the
# graph-select-target precedent above, the two pure `node` computations are
# STUBBED on PATH (the enumeration filter and the freshness verdict are covered
# by the pure layer's own tests); this fixture exercises the bash orchestration
# the unit owns: the config kill-switch, the per-candidate OPEN/MERGEABLE/CI
# gates, the fail-closed fingerprint hold, and the label-free squash merge.
#
# The fake `node` re-implements the enumeration filter with jq over a nodes
# fixture and serves per-id freshness fixtures; the fake `gh` serves per-PR raw
# REST objects (gh_pr_view_rest projects them), records merge PUTs, and no-ops
# `gh pr ready`. CI verdicts are injected through DISPATCH_CI_VERDICT_CACHE so no
# check-runs stub is needed. MAIN_ROOT is pinned via GRAPH_AUTO_MERGE_MAIN_ROOT
# so the stamp path resolves without a git lookup.
echo "Test: graph-auto-merge — marker-keyed node-lane PR auto-merge"
GAM_ROOT=$(mktemp -d)
GAM_SCRIPTS="$GAM_ROOT/.claude/skills/dispatch-propagate/scripts"
mkdir -p "$GAM_SCRIPTS" "$GAM_ROOT/bin" "$GAM_ROOT/stub" "$GAM_ROOT/cache" \
         "$GAM_ROOT/config" "$GAM_ROOT/.claude/worktrees"
# graph-auto-merge's REPO_ROOT resolves to GAM_ROOT itself (4 levels up from
# GAM_SCRIPTS), so its `git archive origin/main intentions` runs for real here
# — the fail-closed freshness-gate fix makes that call hard-error instead of
# silently degrading to an empty snapshot on failure, so origin/main must
# genuinely resolve. Mirror the dispatch-graph-scope-sweep fixture above: a
# real git repo seeded with an intentions/ tree, pushed to a local bare remote
# and fetched, so refs/remotes/origin/main resolves without network or a git
# stub. The freshness computation itself is still fully mocked by the fake
# `node` below, so the tree's actual content never matters — only that the
# archive succeeds.
GAM_BARE=$(mktemp -d)
git init -q -b main "$GAM_ROOT"
git -C "$GAM_ROOT" config user.email t@t
git -C "$GAM_ROOT" config user.name t
mkdir -p "$GAM_ROOT/intentions"
echo '# placeholder' > "$GAM_ROOT/intentions/placeholder.md"
git -C "$GAM_ROOT" add -A
git -C "$GAM_ROOT" commit -q -m seed
git init -q --bare -b main "$GAM_BARE"
git -C "$GAM_ROOT" remote add origin "$GAM_BARE"
git -C "$GAM_ROOT" push -q origin main
git -C "$GAM_ROOT" fetch -q origin
# REPO_ROOT is derived from the script's real location, so the copy is physical;
# dispatch-config-load and lib.sh sit alongside (both resolved via SCRIPT_DIR).
cp "$SCRIPT_DIR"/graph-auto-merge "$SCRIPT_DIR"/dispatch-config-load \
   "$SCRIPT_DIR"/lib.sh "$GAM_SCRIPTS/"
GAM_SCRIPT="$GAM_SCRIPTS/graph-auto-merge"

# Fake dispatch-graph-main-red-sync: graph-auto-merge now owns the main-health
# admission gate itself (tactic-graph-auto-merge-main-health-gate) and calls
# this sibling with --read-only. The stub serves stub/main-red.txt when present
# (absent file → empty stdout → main known-good) and, like the real script,
# ALWAYS exits 0. It asserts --read-only is passed: an unflagged call from this
# caller would be an authority violation (completing the latch belongs to the
# tick), so the fixture fails loudly rather than silently tolerating it.
cat > "$GAM_SCRIPTS/dispatch-graph-main-red-sync" <<'GAMRED'
#!/usr/bin/env bash
STUB="$(cd "$(dirname "$0")/../../../.." && pwd)/stub"
case " $* " in
  *" --read-only "*) ;;
  *) echo "main-red stub: caller MUST pass --read-only (got: $*)" >&2; exit 99 ;;
esac
[[ -f "$STUB/main-red.txt" ]] && cat "$STUB/main-red.txt"
exit 0
GAMRED
chmod +x "$GAM_SCRIPTS/dispatch-graph-main-red-sync"

# Fake node: enumeration ( -e inline ) applies the
# id/phase/pr/conflict/blocked_by/reviewed-marker filter over stub/nodes.json;
# compute-freshness.ts <id> serves stub/freshness-<id>.json.
cat > "$GAM_ROOT/bin/node" <<'GAMNODE'
#!/usr/bin/env bash
STUB="$(cd "$(dirname "$0")/.." && pwd)/stub"
if [[ "$*" == *compute-freshness.ts* ]]; then
  id="" ; seen_ts=0
  for a in "$@"; do
    if [[ "$seen_ts" == 1 ]]; then id="$a"; break; fi
    [[ "$a" == *compute-freshness.ts ]] && seen_ts=1
  done
  cat "$STUB/freshness-$id.json"
  exit 0
fi
# enumeration — mirror the script's listNodes filter with jq. The real script
# passes its --node selection filter as the LAST argv element after the inline
# -e program (empty string = no filter); mirror that here so the bash→node
# plumbing of --node is genuinely exercised rather than assumed.
#
# The `blocked_by` conjunct mirrors `blockersComplete`
# (packages/intentionsutil/src/router.ts): a blocker is complete when ABSENT
# from the store (prune-on-done makes absence completion) or present at
# `phase: done`; a present, not-done blocker blocks. Expressed here as a join of
# each node's blocked_by ids against the same fixture array — without it the
# gate would be invisible to this fixture, since the real predicate never runs.
# Record the enumeration environment. graph-auto-merge is bash and shells out
# to `node` for the enumeration, and in this harness that `node` is THIS stub
# -- so this file is the only place a test at this layer can observe what
# actually reached the enumeration process.
printf '%s\n' "${DISPATCH_GRAPH_NODE_CACHE:-<unset>}" >> "$STUB/../nodecache-env.log"
only="${!#}"
jq -r --arg only "$only" '
  (map({key: .id, value: .}) | from_entries) as $byId
  | .[]
  | select($only == "" or .id == $only)
  | select(.kind=="tactic" and .phase=="review"
           and (.execution.pr != null)
           and (.execution.conflict == null)
           and ([ (.blocked_by // [])[]
                  | $byId[.]
                  | select(. != null and .phase != "done") ] | length == 0)
           and ((.execution.markers // []) | index("reviewed")))
  | "\(.id)\t\(.execution.pr)\t\(if .office_hours == null then "clean" else "parked" end)"' "$STUB/nodes.json"
exit 0
GAMNODE

# Fake gh: `pr ready` no-ops; `api .../pulls/<N>` serves the raw REST fixture;
# `api -X PUT .../pulls/<N>/merge` records the call.
#
# The up-to-date gate (tactic-graph-auto-merge-up-to-date-gate) adds three arms,
# ALL of which must precede the `pr-$N.json` fallback below — otherwise
# `.../commits/main` falls through to `N=main` and looks for `stub/pr-main.json`.
#
# The sync cap (tactic-graph-auto-merge-sync-cap) adds a fourth,
# `*/pulls/<N>/commits`, under the same rule — it must precede the `pr-$N.json`
# fallback, which would otherwise read N as the literal `commits?per_page=100`.
#
# `*/compare/*`, `*/commits/main`, and `*/pulls/<N>/commits` serve a DEFAULT when
# their fixture file is absent (up-to-date main tip, `ahead`, and an empty commit
# list = zero syncs), mirroring the shared fixture's
# `compare-status.json` arm (dispatch-test-fixture.sh). Defaulting rather than
# requiring every case to seed the pair keeps the ~15 pre-existing cases (and
# any a later unit adds) untouched; the gate itself is still exercised head-on by
# the (n*) cases below, which write the fixtures explicitly — delete the gate
# from graph-auto-merge and those go RED.
cat > "$GAM_ROOT/bin/gh" <<'GAMGH'
#!/usr/bin/env bash
STUB="$(cd "$(dirname "$0")/.." && pwd)/stub"
if [[ "$1" == "pr" && "$2" == "ready" ]]; then exit 0; fi
if [[ "$1" == "api" ]]; then
  path=""
  for a in "$@"; do [[ "$a" == repos/* ]] && { path="$a"; break; }; done
  if [[ "$path" == */merge ]]; then
    echo "$*" >> "$STUB/merge-calls.log"
    echo '{}'
    exit 0
  fi
  if [[ "$path" == */update-branch ]]; then
    echo "$*" >> "$STUB/update-branch-calls.log"
    if [[ -f "$STUB/update-branch-fail" ]]; then
      echo "gh stub: forced update-branch failure" >&2; exit 1
    fi
    echo '{}'
    exit 0
  fi
  if [[ "$path" == */pulls/*/commits* ]]; then
    if [[ -f "$STUB/pr-commits-fail" ]]; then
      echo "gh stub: forced commits-listing failure" >&2; exit 1
    fi
    q="${path%%\?*}"; q="${q%/commits}"; q="${q##*/}"
    if [[ -f "$STUB/pr-commits-$q.json" ]]; then cat "$STUB/pr-commits-$q.json"
    else echo '[]'; fi
    exit 0
  fi
  if [[ "$path" == */compare/* ]]; then
    if [[ -f "$STUB/compare.json" ]]; then cat "$STUB/compare.json"
    else echo '{"status":"ahead"}'; fi
    exit 0
  fi
  if [[ "$path" == */commits/main ]]; then
    if [[ -f "$STUB/main-sha-fail" ]]; then
      echo "gh stub: forced main-tip read failure" >&2; exit 1
    fi
    if [[ -f "$STUB/main-sha.json" ]]; then cat "$STUB/main-sha.json"
    else echo '{"sha":"mainsha"}'; fi
    exit 0
  fi
  N="${path##*/}"
  if [[ -f "$STUB/pr-$N.json" ]]; then cat "$STUB/pr-$N.json"; exit 0; fi
  echo "gh stub: no fixture for $path" >&2; exit 1
fi
echo "gh stub: unexpected: $*" >&2; exit 1
GAMGH
chmod +x "$GAM_ROOT/bin/node" "$GAM_ROOT/bin/gh"

gam_reset() {
  rm -f "$GAM_ROOT/stub/"* "$GAM_ROOT/cache/"* "$GAM_ROOT/config/"*.json \
        "$GAM_ROOT/.claude/worktrees/"*.scope-fingerprint 2>/dev/null || true
}
run_gam() {  # forwards its arguments to graph-auto-merge (e.g. --node <id>)
  # GAM_SYNC_MAX exercises the sync cap's env override. Empty (the default for
  # every pre-existing case) reads as unset to the script's `${...:-3}`, so the
  # cases below that do not set it see the shipped default.
  PATH="$GAM_ROOT/bin:$SAVED_PATH" \
  DISPATCH_CONFIG_DIR="$GAM_ROOT/config" \
  DISPATCH_CI_VERDICT_CACHE="$GAM_ROOT/cache" \
  GRAPH_AUTO_MERGE_MAIN_ROOT="$GAM_ROOT" \
  GRAPH_AUTO_MERGE_SYNC_MAX="${GAM_SYNC_MAX:-}" \
  GH_RETRY_BASE_DELAY=0 GH_RETRY_ATTEMPTS=1 \
  "$GAM_SCRIPT" "$@"
}
gam_fresh() {  # write a fresh (not-stale) freshness fixture for node id $1
  printf '%s\n' '{"scopeStale":false,"strategyStale":false,"stampMissing":false,"nodeOnMain":true}' \
    > "$GAM_ROOT/stub/freshness-$1.json"
}

# ---- (a) reviewed + green CI + MERGEABLE + fresh stamp → merges -------------
gam_reset
printf '%s\n' '[{"id":"tactic-a","kind":"tactic","phase":"review","execution":{"pr":101,"markers":["planned","qa-done","reviewed"]}}]' \
  > "$GAM_ROOT/stub/nodes.json"
printf '%s\n' '{"number":101,"title":"Tactic A","body":"Closes #1","state":"open","merged_at":null,"mergeable":true,"mergeable_state":"clean","head":{"ref":"tactic-a","sha":"sha101"},"labels":[]}' \
  > "$GAM_ROOT/stub/pr-101.json"
echo passing > "$GAM_ROOT/cache/sha101"
echo fp > "$GAM_ROOT/.claude/worktrees/tactic-a.scope-fingerprint"
gam_fresh tactic-a
gam_a_out=$(run_gam 2>/dev/null); gam_a_rc=$?
assert_eq "graph-auto-merge (a): reviewed+green+mergeable node merges" \
  "merged #101 (tactic-a)" "$gam_a_out"
assert_eq "graph-auto-merge (a): exit 0" "0" "$gam_a_rc"
if grep -q 'pulls/101/merge' "$GAM_ROOT/stub/merge-calls.log" 2>/dev/null; then gam_a_m=yes; else gam_a_m=no; fi
assert_eq "graph-auto-merge (a): squash-merge PUT issued for #101" "yes" "$gam_a_m"
if grep -q 'merge_method=squash' "$GAM_ROOT/stub/merge-calls.log" 2>/dev/null; then gam_a_sq=yes; else gam_a_sq=no; fi
assert_eq "graph-auto-merge (a): merge is a squash" "yes" "$gam_a_sq"

# ---- (b) phase:review WITHOUT the reviewed marker → skipped ----------------
gam_reset
printf '%s\n' '[{"id":"tactic-b","kind":"tactic","phase":"review","execution":{"pr":102,"markers":["planned","qa-done"]}}]' \
  > "$GAM_ROOT/stub/nodes.json"
gam_b_out=$(run_gam 2>/dev/null); gam_b_rc=$?
assert_eq "graph-auto-merge (b): review node without reviewed marker is not merged" "" "$gam_b_out"
assert_eq "graph-auto-merge (b): exit 0" "0" "$gam_b_rc"
if [[ -f "$GAM_ROOT/stub/merge-calls.log" ]]; then gam_b_m=present; else gam_b_m=absent; fi
assert_eq "graph-auto-merge (b): no merge attempted" "absent" "$gam_b_m"

# ---- (c) pending CI and failing CI → skipped (no merge) --------------------
gam_reset
printf '%s\n' '[{"id":"tactic-c","kind":"tactic","phase":"review","execution":{"pr":103,"markers":["reviewed"]}}]' \
  > "$GAM_ROOT/stub/nodes.json"
printf '%s\n' '{"number":103,"title":"Tactic C","body":"","state":"open","merged_at":null,"mergeable":true,"mergeable_state":"clean","head":{"ref":"tactic-c","sha":"sha103"},"labels":[]}' \
  > "$GAM_ROOT/stub/pr-103.json"
echo pending > "$GAM_ROOT/cache/sha103"
echo fp > "$GAM_ROOT/.claude/worktrees/tactic-c.scope-fingerprint"
gam_fresh tactic-c
gam_c_out=$(run_gam 2>/dev/null)
assert_eq "graph-auto-merge (c): pending CI is skipped" "" "$gam_c_out"
if [[ -f "$GAM_ROOT/stub/merge-calls.log" ]]; then gam_c_m=present; else gam_c_m=absent; fi
assert_eq "graph-auto-merge (c): pending CI issues no merge" "absent" "$gam_c_m"
echo failing > "$GAM_ROOT/cache/sha103"
gam_cf_out=$(run_gam 2>/dev/null)
assert_eq "graph-auto-merge (c): failing CI is skipped" "" "$gam_cf_out"
if [[ -f "$GAM_ROOT/stub/merge-calls.log" ]]; then gam_cf_m=present; else gam_cf_m=absent; fi
assert_eq "graph-auto-merge (c): failing CI issues no merge (fix interrupt owns red CI)" "absent" "$gam_cf_m"

# ---- (d) CONFLICTING mergeable → skipped -----------------------------------
gam_reset
printf '%s\n' '[{"id":"tactic-d","kind":"tactic","phase":"review","execution":{"pr":104,"markers":["reviewed"]}}]' \
  > "$GAM_ROOT/stub/nodes.json"
printf '%s\n' '{"number":104,"title":"Tactic D","body":"","state":"open","merged_at":null,"mergeable":false,"mergeable_state":"dirty","head":{"ref":"tactic-d","sha":"sha104"},"labels":[]}' \
  > "$GAM_ROOT/stub/pr-104.json"
echo passing > "$GAM_ROOT/cache/sha104"
echo fp > "$GAM_ROOT/.claude/worktrees/tactic-d.scope-fingerprint"
gam_fresh tactic-d
gam_d_out=$(run_gam 2>/dev/null)
assert_eq "graph-auto-merge (d): CONFLICTING PR is skipped" "" "$gam_d_out"
if [[ -f "$GAM_ROOT/stub/merge-calls.log" ]]; then gam_d_m=present; else gam_d_m=absent; fi
assert_eq "graph-auto-merge (d): CONFLICTING PR issues no merge" "absent" "$gam_d_m"

# ---- (e) scope-stale and missing-stamp → held (fail closed, no merge) ------
gam_reset
printf '%s\n' '[{"id":"tactic-e","kind":"tactic","phase":"review","execution":{"pr":105,"markers":["reviewed"]}}]' \
  > "$GAM_ROOT/stub/nodes.json"
printf '%s\n' '{"number":105,"title":"Tactic E","body":"","state":"open","merged_at":null,"mergeable":true,"mergeable_state":"clean","head":{"ref":"tactic-e","sha":"sha105"},"labels":[]}' \
  > "$GAM_ROOT/stub/pr-105.json"
echo passing > "$GAM_ROOT/cache/sha105"
echo fp > "$GAM_ROOT/.claude/worktrees/tactic-e.scope-fingerprint"
printf '%s\n' '{"scopeStale":true,"strategyStale":false,"stampMissing":false,"nodeOnMain":true}' \
  > "$GAM_ROOT/stub/freshness-tactic-e.json"
gam_e_out=$(run_gam 2>/dev/null)
assert_eq "graph-auto-merge (e): scope-stale node is held" "held tactic-e (scope-stale)" "$gam_e_out"
if [[ -f "$GAM_ROOT/stub/merge-calls.log" ]]; then gam_e_m=present; else gam_e_m=absent; fi
assert_eq "graph-auto-merge (e): scope-stale hold issues no merge" "absent" "$gam_e_m"
# missing stamp: same PR, delete the stamp file so the file-existence gate fires.
rm -f "$GAM_ROOT/.claude/worktrees/tactic-e.scope-fingerprint"
gam_em_out=$(run_gam 2>/dev/null)
assert_eq "graph-auto-merge (e): missing stamp is held" "held tactic-e (missing-stamp)" "$gam_em_out"
if [[ -f "$GAM_ROOT/stub/merge-calls.log" ]]; then gam_em_m=present; else gam_em_m=absent; fi
assert_eq "graph-auto-merge (e): missing-stamp hold issues no merge" "absent" "$gam_em_m"

# ---- (g) in-flight execution.conflict → excluded from the candidate set ----
# The load-bearing conflict-interrupt guard: the PR is otherwise fully
# mergeable (reviewed marker, green CI, MERGEABLE, fresh stamp) — a resolved
# conflict flipped it back to MERGEABLE before the selector pass self-healed
# the interrupt. It must NOT merge; the re-review path owns it.
gam_reset
printf '%s\n' '[{"id":"tactic-g","kind":"tactic","phase":"review","execution":{"pr":107,"markers":["planned","qa-done","reviewed"],"conflict":{"since":"2026-08-05","attempt":1}}}]' \
  > "$GAM_ROOT/stub/nodes.json"
printf '%s\n' '{"number":107,"title":"Tactic G","body":"","state":"open","merged_at":null,"mergeable":true,"mergeable_state":"clean","head":{"ref":"tactic-g","sha":"sha107"},"labels":[]}' \
  > "$GAM_ROOT/stub/pr-107.json"
echo passing > "$GAM_ROOT/cache/sha107"
echo fp > "$GAM_ROOT/.claude/worktrees/tactic-g.scope-fingerprint"
gam_fresh tactic-g
gam_g_out=$(run_gam 2>/dev/null); gam_g_rc=$?
assert_eq "graph-auto-merge (g): node with an in-flight conflict interrupt is not merged" "" "$gam_g_out"
assert_eq "graph-auto-merge (g): exit 0" "0" "$gam_g_rc"
if [[ -f "$GAM_ROOT/stub/merge-calls.log" ]]; then gam_g_m=present; else gam_g_m=absent; fi
assert_eq "graph-auto-merge (g): conflict-interrupt node issues no merge" "absent" "$gam_g_m"

# ---- (f) config kill-switch (enabled:false) suppresses all merges ----------
gam_reset
printf '%s\n' '{"enabled":false}' > "$GAM_ROOT/config/auto-merge.json"
printf '%s\n' '[{"id":"tactic-a","kind":"tactic","phase":"review","execution":{"pr":101,"markers":["reviewed"]}}]' \
  > "$GAM_ROOT/stub/nodes.json"
printf '%s\n' '{"number":101,"title":"Tactic A","body":"","state":"open","merged_at":null,"mergeable":true,"mergeable_state":"clean","head":{"ref":"tactic-a","sha":"sha101"},"labels":[]}' \
  > "$GAM_ROOT/stub/pr-101.json"
echo passing > "$GAM_ROOT/cache/sha101"
echo fp > "$GAM_ROOT/.claude/worktrees/tactic-a.scope-fingerprint"
gam_fresh tactic-a
gam_f_out=$(run_gam 2>/dev/null); gam_f_rc=$?
assert_eq "graph-auto-merge (f): kill-switch suppresses output" "" "$gam_f_out"
assert_eq "graph-auto-merge (f): kill-switch exit 0" "0" "$gam_f_rc"
if [[ -f "$GAM_ROOT/stub/merge-calls.log" ]]; then gam_f_m=present; else gam_f_m=absent; fi
assert_eq "graph-auto-merge (f): kill-switch issues no merge" "absent" "$gam_f_m"

# ---- (g) live office_hours park → held (declines, no merge) ---------------
gam_reset
printf '%s\n' '[{"id":"tactic-g","kind":"tactic","phase":"review","execution":{"pr":107,"markers":["planned","qa-done","reviewed"]},"office_hours":{"reason":"fixture park","since":"2026-08-01","recommendation":null,"session_type":"other"}}]' \
  > "$GAM_ROOT/stub/nodes.json"
printf '%s\n' '{"number":107,"title":"Tactic G","body":"","state":"open","merged_at":null,"mergeable":true,"mergeable_state":"clean","head":{"ref":"tactic-g","sha":"sha107"},"labels":[]}' \
  > "$GAM_ROOT/stub/pr-107.json"
echo passing > "$GAM_ROOT/cache/sha107"
echo fp > "$GAM_ROOT/.claude/worktrees/tactic-g.scope-fingerprint"
gam_fresh tactic-g
gam_g_out=$(run_gam 2>/dev/null); gam_g_rc=$?
assert_eq "graph-auto-merge (g): office_hours-parked node is held" \
  "held tactic-g (office-hours)" "$gam_g_out"
assert_eq "graph-auto-merge (g): exit 0" "0" "$gam_g_rc"
if [[ -f "$GAM_ROOT/stub/merge-calls.log" ]]; then gam_g_m=present; else gam_g_m=absent; fi
assert_eq "graph-auto-merge (g): office_hours hold issues no merge" "absent" "$gam_g_m"

# ============================================================================
# tactic-graph-auto-merge-main-health-gate / tactic-dispatch-ladder-skill:
#   --node selection filter + the internal main-health admission gate
# ============================================================================

# ---- (h) --node selects ONLY the named node; an eligible sibling is passed over
# Both nodes are fully mergeable. Unflagged, the sweep merges both; with
# `--node tactic-h1` it must merge exactly one and leave the sibling alone.
# This is the property the /dispatch-ladder driver depends on: a node-scoped
# merge must not drag unrelated reviewed work onto main as a side effect.
gam_reset
printf '%s\n' '[{"id":"tactic-h1","kind":"tactic","phase":"review","execution":{"pr":110,"markers":["reviewed"]}},{"id":"tactic-h2","kind":"tactic","phase":"review","execution":{"pr":111,"markers":["reviewed"]}}]' \
  > "$GAM_ROOT/stub/nodes.json"
printf '%s\n' '{"number":110,"title":"Tactic H1","body":"","state":"open","merged_at":null,"mergeable":true,"mergeable_state":"clean","head":{"ref":"tactic-h1","sha":"sha110"},"labels":[]}' \
  > "$GAM_ROOT/stub/pr-110.json"
printf '%s\n' '{"number":111,"title":"Tactic H2","body":"","state":"open","merged_at":null,"mergeable":true,"mergeable_state":"clean","head":{"ref":"tactic-h2","sha":"sha111"},"labels":[]}' \
  > "$GAM_ROOT/stub/pr-111.json"
echo passing > "$GAM_ROOT/cache/sha110"; echo passing > "$GAM_ROOT/cache/sha111"
echo fp > "$GAM_ROOT/.claude/worktrees/tactic-h1.scope-fingerprint"
echo fp > "$GAM_ROOT/.claude/worktrees/tactic-h2.scope-fingerprint"
gam_fresh tactic-h1; gam_fresh tactic-h2
gam_h_out=$(run_gam --node tactic-h1 2>/dev/null); gam_h_rc=$?
assert_eq "graph-auto-merge (h): --node merges only the named node" \
  "merged #110 (tactic-h1)" "$gam_h_out"
assert_eq "graph-auto-merge (h): --node exit 0" "0" "$gam_h_rc"
if grep -q 'pulls/111/merge' "$GAM_ROOT/stub/merge-calls.log" 2>/dev/null; then gam_h_sib=merged; else gam_h_sib=untouched; fi
assert_eq "graph-auto-merge (h): eligible sibling is NOT merged" "untouched" "$gam_h_sib"
# Control: unflagged, the SAME fixture merges both — proving (h) isolated the
# sibling by the filter, not by some unrelated ineligibility.
rm -f "$GAM_ROOT/stub/merge-calls.log" "$GAM_ROOT/nodecache-env.log"
gam_hc_out=$(run_gam 2>/dev/null)
assert_eq "graph-auto-merge (h): control — unflagged sweep merges both" \
  "merged #110 (tactic-h1)
merged #111 (tactic-h2)" "$gam_hc_out"
# DISPATCH_GRAPH_NODE_CACHE names a storage LOCATION for the enumeration memo
# (packages/intentionsutil/src/store-cache.ts), never a node subset. Re-run the
# SAME fixture with it pointed at an empty directory: the candidate set and the
# stdout must be byte-identical to the unflagged control above. A regression
# that let the variable narrow the sweep — the failure mode `--node`'s
# process.argv contract exists to prevent — shows up here as a shorter list.
#
# SCOPE, stated plainly. This harness replaces `node` with a jq stub, so
# listNodesStrictCached NEVER EXECUTES here and no assertion at this layer can
# say anything about caching BEHAVIOUR — that belongs to intentionsutil's own
# unit tests. Comparing two stub runs would therefore have compared two runs of
# a program that ignores the variable entirely: a pass carrying no information.
# What this layer CAN observe, and now does, is the bash→node plumbing: that the
# variable reaches the enumeration process at all, and that its presence does
# not narrow the candidate set. The env log below is what makes the first half
# non-vacuous; without it the identical-output assertion is true by construction.
rm -f "$GAM_ROOT/stub/merge-calls.log"
GAM_NODE_CACHE_DIR="$GAM_ROOT/nodecache"; mkdir -p "$GAM_NODE_CACHE_DIR"
assert_eq "graph-auto-merge (h): control run reached the enumeration with the var UNSET" \
  "<unset>" "$(head -n1 "$GAM_ROOT/nodecache-env.log" 2>/dev/null)"
rm -f "$GAM_ROOT/nodecache-env.log"
gam_hn_out=$(DISPATCH_GRAPH_NODE_CACHE="$GAM_NODE_CACHE_DIR" run_gam 2>/dev/null)
unset DISPATCH_GRAPH_NODE_CACHE
assert_eq "graph-auto-merge (h): DISPATCH_GRAPH_NODE_CACHE set → identical candidate set and stdout" \
  "$gam_hc_out" "$gam_hn_out"
assert_eq "graph-auto-merge (h): the variable actually reached the enumeration process" \
  "$GAM_NODE_CACHE_DIR" "$(head -n1 "$GAM_ROOT/nodecache-env.log" 2>/dev/null)"

# ---- (i) --node with an unknown id merges nothing (empty candidate set) -----
gam_reset
printf '%s\n' '[{"id":"tactic-i","kind":"tactic","phase":"review","execution":{"pr":112,"markers":["reviewed"]}}]' \
  > "$GAM_ROOT/stub/nodes.json"
printf '%s\n' '{"number":112,"title":"Tactic I","body":"","state":"open","merged_at":null,"mergeable":true,"mergeable_state":"clean","head":{"ref":"tactic-i","sha":"sha112"},"labels":[]}' \
  > "$GAM_ROOT/stub/pr-112.json"
echo passing > "$GAM_ROOT/cache/sha112"
echo fp > "$GAM_ROOT/.claude/worktrees/tactic-i.scope-fingerprint"
gam_fresh tactic-i
gam_i_out=$(run_gam --node tactic-nonexistent 2>/dev/null); gam_i_rc=$?
assert_eq "graph-auto-merge (i): --node with an unknown id merges nothing" "" "$gam_i_out"
assert_eq "graph-auto-merge (i): unknown id exit 0" "0" "$gam_i_rc"
if [[ -f "$GAM_ROOT/stub/merge-calls.log" ]]; then gam_i_m=present; else gam_i_m=absent; fi
assert_eq "graph-auto-merge (i): unknown id issues no merge" "absent" "$gam_i_m"

# ---- (j) --node is a SELECTION filter, never a gate bypass -----------------
# The named node is office_hours-parked. `--node` must still HOLD it — the whole
# point of routing the ladder's merge through this script rather than `gh pr merge`.
gam_reset
printf '%s\n' '[{"id":"tactic-j","kind":"tactic","phase":"review","execution":{"pr":113,"markers":["reviewed"]},"office_hours":{"reason":"fixture park","since":"2026-08-01","recommendation":null,"session_type":"other"}}]' \
  > "$GAM_ROOT/stub/nodes.json"
printf '%s\n' '{"number":113,"title":"Tactic J","body":"","state":"open","merged_at":null,"mergeable":true,"mergeable_state":"clean","head":{"ref":"tactic-j","sha":"sha113"},"labels":[]}' \
  > "$GAM_ROOT/stub/pr-113.json"
echo passing > "$GAM_ROOT/cache/sha113"
echo fp > "$GAM_ROOT/.claude/worktrees/tactic-j.scope-fingerprint"
gam_fresh tactic-j
gam_j_out=$(run_gam --node tactic-j 2>/dev/null)
assert_eq "graph-auto-merge (j): --node does NOT bypass the office-hours gate" \
  "held tactic-j (office-hours)" "$gam_j_out"
if [[ -f "$GAM_ROOT/stub/merge-calls.log" ]]; then gam_j_m=present; else gam_j_m=absent; fi
assert_eq "graph-auto-merge (j): --node park hold issues no merge" "absent" "$gam_j_m"

# ---- (k) main-health admission gate suppresses the WHOLE sweep -------------
# An open tactic-main-red-* latch, the UNKNOWN read-failure sentinel, and a
# non-zero exit from the sync script must each merge nothing — and must do so
# WITHOUT emitting a per-candidate `held` line, since main health is a
# whole-sweep condition (a stderr note + silent exit 0, like the kill-switch).
gam_reset
printf '%s\n' '[{"id":"tactic-k","kind":"tactic","phase":"review","execution":{"pr":114,"markers":["reviewed"]}}]' \
  > "$GAM_ROOT/stub/nodes.json"
printf '%s\n' '{"number":114,"title":"Tactic K","body":"","state":"open","merged_at":null,"mergeable":true,"mergeable_state":"clean","head":{"ref":"tactic-k","sha":"sha114"},"labels":[]}' \
  > "$GAM_ROOT/stub/pr-114.json"
echo passing > "$GAM_ROOT/cache/sha114"
echo fp > "$GAM_ROOT/.claude/worktrees/tactic-k.scope-fingerprint"
gam_fresh tactic-k

# (k1) empty latch → main known-good → merges (the positive control).
gam_k1_out=$(run_gam 2>/dev/null); gam_k1_rc=$?
assert_eq "graph-auto-merge (k1): empty main-red latch permits the merge" \
  "merged #114 (tactic-k)" "$gam_k1_out"
assert_eq "graph-auto-merge (k1): exit 0" "0" "$gam_k1_rc"

# (k2) a non-empty latch suppresses the sweep.
rm -f "$GAM_ROOT/stub/merge-calls.log"
echo 'tactic-main-red-abc1234' > "$GAM_ROOT/stub/main-red.txt"
gam_k2_out=$(run_gam 2>/dev/null); gam_k2_rc=$?
assert_eq "graph-auto-merge (k2): open main-red latch suppresses the sweep (no held line)" "" "$gam_k2_out"
assert_eq "graph-auto-merge (k2): exit 0" "0" "$gam_k2_rc"
if [[ -f "$GAM_ROOT/stub/merge-calls.log" ]]; then gam_k2_m=present; else gam_k2_m=absent; fi
assert_eq "graph-auto-merge (k2): open main-red latch issues no merge" "absent" "$gam_k2_m"

# (k3) the literal UNKNOWN read-failure sentinel suppresses it too (fail closed).
printf '%s\n' 'UNKNOWN' > "$GAM_ROOT/stub/main-red.txt"
gam_k3_out=$(run_gam 2>/dev/null); gam_k3_rc=$?
assert_eq "graph-auto-merge (k3): UNKNOWN main health suppresses the sweep" "" "$gam_k3_out"
assert_eq "graph-auto-merge (k3): exit 0" "0" "$gam_k3_rc"
if [[ -f "$GAM_ROOT/stub/merge-calls.log" ]]; then gam_k3_m=present; else gam_k3_m=absent; fi
assert_eq "graph-auto-merge (k3): UNKNOWN main health issues no merge" "absent" "$gam_k3_m"

# (k4) the gate also fires for --node: a single-node caller cannot merge onto a
# broken main any more than the sweep can.
gam_k4_out=$(run_gam --node tactic-k 2>/dev/null)
assert_eq "graph-auto-merge (k4): --node is still main-health gated" "" "$gam_k4_out"
if [[ -f "$GAM_ROOT/stub/merge-calls.log" ]]; then gam_k4_m=present; else gam_k4_m=absent; fi
assert_eq "graph-auto-merge (k4): --node issues no merge while main is red" "absent" "$gam_k4_m"

# (k5) a non-zero exit from the sync script is UNKNOWN, not "healthy". The real
# script's contract is ALWAYS exit 0, so non-zero means it did not run as
# designed (missing, unreadable, `timeout`-killed) and must fail closed.
rm -f "$GAM_ROOT/stub/main-red.txt"
mv "$GAM_SCRIPTS/dispatch-graph-main-red-sync" "$GAM_ROOT/main-red-sync.bak"
gam_k5_out=$(run_gam 2>/dev/null); gam_k5_rc=$?
assert_eq "graph-auto-merge (k5): an unrunnable main-red sync suppresses the sweep" "" "$gam_k5_out"
assert_eq "graph-auto-merge (k5): exit 0 (a suppressed sweep is not an error)" "0" "$gam_k5_rc"
if [[ -f "$GAM_ROOT/stub/merge-calls.log" ]]; then gam_k5_m=present; else gam_k5_m=absent; fi
assert_eq "graph-auto-merge (k5): unrunnable main-red sync issues no merge" "absent" "$gam_k5_m"
mv "$GAM_ROOT/main-red-sync.bak" "$GAM_SCRIPTS/dispatch-graph-main-red-sync"

# ============================================================================
# tactic-graph-auto-merge-blocked-by-gate: blocked_by must gate the merge
# ============================================================================
# The candidate is otherwise fully mergeable (reviewed marker, green CI,
# MERGEABLE, fresh stamp, unparked) in all three cases — the ONLY variable is
# its blocker's presence/phase, so a pass here can only be the blocker gate.
gam_m_setup() {  # $1 = the nodes.json array literal
  gam_reset
  printf '%s\n' "$1" > "$GAM_ROOT/stub/nodes.json"
  printf '%s\n' '{"number":115,"title":"Tactic M","body":"","state":"open","merged_at":null,"mergeable":true,"mergeable_state":"clean","head":{"ref":"tactic-m","sha":"sha115"},"labels":[]}' \
    > "$GAM_ROOT/stub/pr-115.json"
  echo passing > "$GAM_ROOT/cache/sha115"
  echo fp > "$GAM_ROOT/.claude/worktrees/tactic-m.scope-fingerprint"
  gam_fresh tactic-m
}

# ---- (m1) a present, not-done blocker → NOT merged (silent skip) -----------
# A blocker skip is a plain skip, not a `held <id> (...)` line: the node is not
# a candidate at all, so the stdout protocol emits nothing for it.
gam_m_setup '[{"id":"tactic-m","kind":"tactic","phase":"review","blocked_by":["tactic-m-blocker"],"execution":{"pr":115,"markers":["reviewed"]}},{"id":"tactic-m-blocker","kind":"tactic","phase":"implement","execution":{"pr":null,"markers":[]}}]'
gam_m1_out=$(run_gam 2>/dev/null); gam_m1_rc=$?
assert_eq "graph-auto-merge (m1): a node with an incomplete blocker is not merged" "" "$gam_m1_out"
assert_eq "graph-auto-merge (m1): exit 0" "0" "$gam_m1_rc"
if [[ -f "$GAM_ROOT/stub/merge-calls.log" ]]; then gam_m1_m=present; else gam_m1_m=absent; fi
assert_eq "graph-auto-merge (m1): incomplete blocker issues no merge" "absent" "$gam_m1_m"
# The same gate applies under --node: the ladder's single-node caller cannot
# merge past an open blocker either.
gam_m1n_out=$(run_gam --node tactic-m 2>/dev/null)
assert_eq "graph-auto-merge (m1): --node does NOT bypass the blocker gate" "" "$gam_m1n_out"
if [[ -f "$GAM_ROOT/stub/merge-calls.log" ]]; then gam_m1n_m=present; else gam_m1n_m=absent; fi
assert_eq "graph-auto-merge (m1): --node with an incomplete blocker issues no merge" "absent" "$gam_m1n_m"

# ---- (m2) a blocker at phase:done → merged ---------------------------------
gam_m_setup '[{"id":"tactic-m","kind":"tactic","phase":"review","blocked_by":["tactic-m-blocker"],"execution":{"pr":115,"markers":["reviewed"]}},{"id":"tactic-m-blocker","kind":"tactic","phase":"done","execution":{"pr":null,"markers":[]}}]'
gam_m2_out=$(run_gam 2>/dev/null); gam_m2_rc=$?
assert_eq "graph-auto-merge (m2): a done blocker does not block the merge" \
  "merged #115 (tactic-m)" "$gam_m2_out"
assert_eq "graph-auto-merge (m2): exit 0" "0" "$gam_m2_rc"

# ---- (m3) a blocker ABSENT from the store → merged (absence = completion) --
# prune-on-done removes a completed node, so an unresolvable blocker id is read
# as complete — the documented `blockersComplete` rule, which is only safe
# because the enumeration is STRICT.
gam_m_setup '[{"id":"tactic-m","kind":"tactic","phase":"review","blocked_by":["tactic-m-pruned"],"execution":{"pr":115,"markers":["reviewed"]}}]'
gam_m3_out=$(run_gam 2>/dev/null); gam_m3_rc=$?
assert_eq "graph-auto-merge (m3): a blocker absent from the store is complete" \
  "merged #115 (tactic-m)" "$gam_m3_out"
assert_eq "graph-auto-merge (m3): exit 0" "0" "$gam_m3_rc"

# ---- (l) usage errors exit 2 ----------------------------------------------
gam_reset
gam_l1_rc=0; run_gam --node >/dev/null 2>&1 || gam_l1_rc=$?
assert_eq "graph-auto-merge (l): --node without an id is a usage error (exit 2)" "2" "$gam_l1_rc"
gam_l2_rc=0; run_gam --bogus >/dev/null 2>&1 || gam_l2_rc=$?
assert_eq "graph-auto-merge (l): an unknown flag is a usage error (exit 2)" "2" "$gam_l2_rc"

# ============================================================================
# tactic-graph-auto-merge-up-to-date-gate: a behind branch is SYNCED, not merged
# ============================================================================
# The candidate is otherwise fully mergeable (reviewed marker, green CI,
# MERGEABLE, fresh stamp, unparked) in every case below — the ONLY variable is
# the compare status (or the reachability of the live main tip), so a pass here
# can only be the up-to-date gate.
gam_n_setup() {  # $1 = the compare `.status` value (empty → leave the default)
  gam_reset
  printf '%s\n' '[{"id":"tactic-n","kind":"tactic","phase":"review","execution":{"pr":116,"markers":["reviewed"]}}]' \
    > "$GAM_ROOT/stub/nodes.json"
  printf '%s\n' '{"number":116,"title":"Tactic N","body":"","state":"open","merged_at":null,"mergeable":true,"mergeable_state":"clean","head":{"ref":"tactic-n","sha":"sha116"},"labels":[]}' \
    > "$GAM_ROOT/stub/pr-116.json"
  echo passing > "$GAM_ROOT/cache/sha116"
  echo fp > "$GAM_ROOT/.claude/worktrees/tactic-n.scope-fingerprint"
  gam_fresh tactic-n
  printf '%s\n' '{"sha":"mainsha"}' > "$GAM_ROOT/stub/main-sha.json"
  [[ -n "${1:-}" ]] && printf '%s\n' "{\"status\":\"$1\"}" > "$GAM_ROOT/stub/compare.json"
  return 0
}

# ---- (n1) compare `diverged` → sync the branch, do NOT merge ---------------
# The ordinary behind-PR case: main has commits the head lacks, so its green CI
# ran on a stale base. The sweep updates the branch (re-triggering CI on the
# fresh base) and defers the merge to a later tick.
gam_n_setup diverged
gam_n1_rc=0
gam_n1_out=$(run_gam 2>/dev/null) || gam_n1_rc=$?
assert_eq "graph-auto-merge (n1): a diverged branch is synced, not merged" \
  "synced #116 (tactic-n)" "$gam_n1_out"
assert_eq "graph-auto-merge (n1): exit 0" "0" "$gam_n1_rc"
if grep -q 'pulls/116/update-branch' "$GAM_ROOT/stub/update-branch-calls.log" 2>/dev/null; then gam_n1_u=yes; else gam_n1_u=no; fi
assert_eq "graph-auto-merge (n1): update-branch PUT issued for #116" "yes" "$gam_n1_u"
# The CAS guard must carry the SAME head oid the CI verdict was computed on, so
# a head that moved between sensing and syncing yields a 422 rather than a blind
# update.
if grep -q 'expected_head_sha=sha116' "$GAM_ROOT/stub/update-branch-calls.log" 2>/dev/null; then gam_n1_cas=yes; else gam_n1_cas=no; fi
assert_eq "graph-auto-merge (n1): update-branch carries expected_head_sha=<sensed head>" "yes" "$gam_n1_cas"
if [[ -f "$GAM_ROOT/stub/merge-calls.log" ]]; then gam_n1_m=present; else gam_n1_m=absent; fi
assert_eq "graph-auto-merge (n1): a synced branch issues no merge" "absent" "$gam_n1_m"

# ---- (n2) compare `behind` → same sync-and-defer treatment -----------------
# The head is an ancestor of the main tip (its commits already landed out of
# band). Rare, still not up to date — sync and defer; reconcile-graph-merged
# absorbs the genuinely-already-merged case on a later tick.
gam_n_setup behind
gam_n2_rc=0
gam_n2_out=$(run_gam 2>/dev/null) || gam_n2_rc=$?
assert_eq "graph-auto-merge (n2): a behind branch is synced, not merged" \
  "synced #116 (tactic-n)" "$gam_n2_out"
assert_eq "graph-auto-merge (n2): exit 0" "0" "$gam_n2_rc"
if [[ -f "$GAM_ROOT/stub/merge-calls.log" ]]; then gam_n2_m=present; else gam_n2_m=absent; fi
assert_eq "graph-auto-merge (n2): behind issues no merge" "absent" "$gam_n2_m"

# ---- (n3) compare `identical` → up to date, merges -------------------------
gam_n_setup identical
gam_n3_rc=0
gam_n3_out=$(run_gam 2>/dev/null) || gam_n3_rc=$?
assert_eq "graph-auto-merge (n3): an identical head is up to date and merges" \
  "merged #116 (tactic-n)" "$gam_n3_out"
assert_eq "graph-auto-merge (n3): exit 0" "0" "$gam_n3_rc"
if grep -q 'pulls/116/merge' "$GAM_ROOT/stub/merge-calls.log" 2>/dev/null; then gam_n3_m=yes; else gam_n3_m=no; fi
assert_eq "graph-auto-merge (n3): squash-merge PUT issued for #116" "yes" "$gam_n3_m"
if [[ -f "$GAM_ROOT/stub/update-branch-calls.log" ]]; then gam_n3_u=present; else gam_n3_u=absent; fi
assert_eq "graph-auto-merge (n3): an up-to-date branch is not synced" "absent" "$gam_n3_u"

# ---- (n4) update-branch failure → hard error, no merge ---------------------
# The 422 a moved head produces lands here: stderr + HARD_ERROR, never a merge.
gam_n_setup diverged
touch "$GAM_ROOT/stub/update-branch-fail"
gam_n4_rc=0
gam_n4_out=$(run_gam 2>/dev/null) || gam_n4_rc=$?
assert_eq "graph-auto-merge (n4): a failed sync emits no stdout line" "" "$gam_n4_out"
assert_eq "graph-auto-merge (n4): a failed sync exits 1" "1" "$gam_n4_rc"
if [[ -f "$GAM_ROOT/stub/merge-calls.log" ]]; then gam_n4_m=present; else gam_n4_m=absent; fi
assert_eq "graph-auto-merge (n4): a failed sync issues no merge" "absent" "$gam_n4_m"

# ---- (n5) an unexpected compare status fails CLOSED ------------------------
# Includes the literal `null` jq prints when the response has no `.status`.
gam_n_setup weird
gam_n5_rc=0
gam_n5_out=$(run_gam 2>/dev/null) || gam_n5_rc=$?
assert_eq "graph-auto-merge (n5): an unexpected compare status emits no stdout line" "" "$gam_n5_out"
assert_eq "graph-auto-merge (n5): an unexpected compare status exits 1" "1" "$gam_n5_rc"
if [[ -f "$GAM_ROOT/stub/merge-calls.log" ]]; then gam_n5_m=present; else gam_n5_m=absent; fi
assert_eq "graph-auto-merge (n5): an unexpected compare status issues no merge" "absent" "$gam_n5_m"
if [[ -f "$GAM_ROOT/stub/update-branch-calls.log" ]]; then gam_n5_u=present; else gam_n5_u=absent; fi
assert_eq "graph-auto-merge (n5): an unexpected compare status issues no sync" "absent" "$gam_n5_u"

# ---- (n6) an unreadable live main tip aborts the sweep ---------------------
# Fail closed: without the tip the gate cannot run, so nothing merges. The read
# is deliberately the LIVE REST tip rather than `git rev-parse origin/main` —
# a stale local ref would make a behind PR look current and silently disable
# the gate.
gam_n_setup ahead
touch "$GAM_ROOT/stub/main-sha-fail"
gam_n6_rc=0
gam_n6_out=$(run_gam 2>/dev/null) || gam_n6_rc=$?
assert_eq "graph-auto-merge (n6): an unreadable main tip emits no stdout line" "" "$gam_n6_out"
assert_eq "graph-auto-merge (n6): an unreadable main tip exits 1" "1" "$gam_n6_rc"
if [[ -f "$GAM_ROOT/stub/merge-calls.log" ]]; then gam_n6_m=present; else gam_n6_m=absent; fi
assert_eq "graph-auto-merge (n6): an unreadable main tip issues no merge" "absent" "$gam_n6_m"
if [[ -f "$GAM_ROOT/stub/update-branch-calls.log" ]]; then gam_n6_u=present; else gam_n6_u=absent; fi
assert_eq "graph-auto-merge (n6): an unreadable main tip issues no sync" "absent" "$gam_n6_u"

# ============================================================================
# tactic-graph-auto-merge-sync-cap: a PR that has already been synced N times
# is HELD for a person instead of synced again
# ============================================================================
# Same single-variable discipline as the (n) cases: the candidate is otherwise
# fully mergeable and the compare status is pinned, so the ONLY variable is the
# PR's merge-commit count (and the cap it is compared against).
gam_o_commits() {  # $1 = PR number, $2 = API-form merges, $3 = worker merges (0)
  # Two distinct merge-commit forms, because only ONE of them is this gate's:
  #   - API form   `Merge branch 'main' into <ref>` — GitHub's update-branch
  #     API, i.e. this gate's own sync. COUNTS toward the cap.
  #   - worker form `Merge remote-tracking branch 'origin/main' into <ref>` —
  #     commit-merge-push's local `git merge origin/main`, run at the end of
  #     every implement unit and fix pass. Must NOT count.
  # Always append one ORDINARY (single-parent) commit: the counter must count
  # multi-parent commits, not commits, so a fixture of all-merges could not tell
  # a correct filter from `length`.
  jq -cn --argjson api "$2" --argjson worker "${3:-0}" \
    '[range($api) | {sha:"apimerge\(.)", parents:[{sha:"p1"},{sha:"p2"}],
        commit:{message:"Merge branch '\''main'\'' into tactic-n"}}]
     + [range($worker) | {sha:"wmerge\(.)", parents:[{sha:"p1"},{sha:"p2"}],
        commit:{message:"Merge remote-tracking branch '\''origin/main'\'' into tactic-n"}}]
     + [{sha:"plain", parents:[{sha:"p1"}],
        commit:{message:"Implement the unit\n\nA body paragraph."}}]' \
    > "$GAM_ROOT/stub/pr-commits-$1.json"
}

# ---- (o1) under the cap → syncs, exactly as before -------------------------
gam_n_setup diverged
gam_o_commits 116 2
gam_o1_rc=0
gam_o1_out=$(run_gam 2>/dev/null) || gam_o1_rc=$?
assert_eq "graph-auto-merge (o1): below the sync cap the branch is still synced" \
  "synced #116 (tactic-n)" "$gam_o1_out"
assert_eq "graph-auto-merge (o1): exit 0" "0" "$gam_o1_rc"
if grep -q 'pulls/116/update-branch' "$GAM_ROOT/stub/update-branch-calls.log" 2>/dev/null; then gam_o1_u=yes; else gam_o1_u=no; fi
assert_eq "graph-auto-merge (o1): update-branch PUT issued below the cap" "yes" "$gam_o1_u"

# ---- (o2) at the cap → held, no sync, no merge -----------------------------
# `held` (not a silent skip) because a thrashing PR is a person's call, and
# dispatch-ladder-run halts 11 on `^held <id> `.
gam_n_setup diverged
gam_o_commits 116 3
gam_o2_rc=0
gam_o2_out=$(run_gam 2>/dev/null) || gam_o2_rc=$?
assert_eq "graph-auto-merge (o2): at the sync cap the node is held" \
  "held tactic-n (sync-cap: 3 syncs)" "$gam_o2_out"
assert_eq "graph-auto-merge (o2): exit 0 (a hold is not an error)" "0" "$gam_o2_rc"
if [[ -f "$GAM_ROOT/stub/update-branch-calls.log" ]]; then gam_o2_u=present; else gam_o2_u=absent; fi
assert_eq "graph-auto-merge (o2): a capped node issues no sync" "absent" "$gam_o2_u"
if [[ -f "$GAM_ROOT/stub/merge-calls.log" ]]; then gam_o2_m=present; else gam_o2_m=absent; fi
assert_eq "graph-auto-merge (o2): a capped node issues no merge" "absent" "$gam_o2_m"

# ---- (o3) the cap is env-overridable, in both directions -------------------
gam_n_setup diverged
gam_o_commits 116 1
GAM_SYNC_MAX=1
gam_o3_rc=0
gam_o3_out=$(run_gam 2>/dev/null) || gam_o3_rc=$?
assert_eq "graph-auto-merge (o3): GRAPH_AUTO_MERGE_SYNC_MAX can lower the cap" \
  "held tactic-n (sync-cap: 1 syncs)" "$gam_o3_out"
assert_eq "graph-auto-merge (o3): lowered cap exit 0" "0" "$gam_o3_rc"
# Raised: the same 3 merge commits that hold at the default cap sync at 5.
gam_n_setup diverged
gam_o_commits 116 3
GAM_SYNC_MAX=5
gam_o3b_rc=0
gam_o3b_out=$(run_gam 2>/dev/null) || gam_o3b_rc=$?
assert_eq "graph-auto-merge (o3): GRAPH_AUTO_MERGE_SYNC_MAX can raise the cap" \
  "synced #116 (tactic-n)" "$gam_o3b_out"
assert_eq "graph-auto-merge (o3): raised cap exit 0" "0" "$gam_o3b_rc"
# A malformed override is a usage error, not a silently-zero comparison.
GAM_SYNC_MAX=three
gam_o3c_rc=0; run_gam >/dev/null 2>&1 || gam_o3c_rc=$?
assert_eq "graph-auto-merge (o3): a non-numeric cap is a usage error (exit 2)" "2" "$gam_o3c_rc"
GAM_SYNC_MAX=

# ---- (o4) a commits-listing failure is a hard error, never a silent sync ---
gam_n_setup diverged
touch "$GAM_ROOT/stub/pr-commits-fail"
gam_o4_rc=0
gam_o4_out=$(run_gam 2>/dev/null) || gam_o4_rc=$?
assert_eq "graph-auto-merge (o4): an unreadable commit listing emits no stdout line" "" "$gam_o4_out"
assert_eq "graph-auto-merge (o4): an unreadable commit listing exits 1" "1" "$gam_o4_rc"
if [[ -f "$GAM_ROOT/stub/update-branch-calls.log" ]]; then gam_o4_u=present; else gam_o4_u=absent; fi
assert_eq "graph-auto-merge (o4): an unreadable commit listing issues no sync" "absent" "$gam_o4_u"
if [[ -f "$GAM_ROOT/stub/merge-calls.log" ]]; then gam_o4_m=present; else gam_o4_m=absent; fi
assert_eq "graph-auto-merge (o4): an unreadable commit listing issues no merge" "absent" "$gam_o4_m"

# ---- (o5) the cap gates only the SYNC arm, never an up-to-date merge -------
# A long-lived PR with many merge commits that is already current must still
# merge — the cap exists to stop sync thrash, not to block landing.
gam_n_setup identical
gam_o_commits 116 9
gam_o5_rc=0
gam_o5_out=$(run_gam 2>/dev/null) || gam_o5_rc=$?
assert_eq "graph-auto-merge (o5): an up-to-date head merges regardless of past syncs" \
  "merged #116 (tactic-n)" "$gam_o5_out"
assert_eq "graph-auto-merge (o5): exit 0" "0" "$gam_o5_rc"

# ---- (o6) worker merges do NOT count toward the cap ------------------------
# The regression this filter exists for. commit-merge-push runs
# `git merge origin/main` at the end of every implement unit and every fix
# pass, so an ordinary multi-unit PR carries several worker merge commits that
# this gate never made. Counting them held healthy PRs at the cap before the
# gate had synced them even once — and `held <id> (sync-cap: …)` is a hard
# exit-11 halt in dispatch-ladder-run. Modelled on real PR #3068, which carried
# 3 worker merges (plus 1 API merge) and was already over the default cap of 3.
gam_n_setup diverged
gam_o_commits 116 0 4   # 4 worker merges, ZERO of this gate's own syncs
gam_o6_rc=0
gam_o6_out=$(run_gam 2>/dev/null) || gam_o6_rc=$?
assert_eq "graph-auto-merge (o6): worker origin/main merges do not count toward the sync cap" \
  "synced #116 (tactic-n)" "$gam_o6_out"
assert_eq "graph-auto-merge (o6): exit 0" "0" "$gam_o6_rc"
case "$gam_o6_out" in *sync-cap*) gam_o6_h=held ;; *) gam_o6_h=not-held ;; esac
assert_eq "graph-auto-merge (o6): a PR carrying only worker merges is never held" "not-held" "$gam_o6_h"
if grep -q 'pulls/116/update-branch' "$GAM_ROOT/stub/update-branch-calls.log" 2>/dev/null; then gam_o6_u=yes; else gam_o6_u=no; fi
assert_eq "graph-auto-merge (o6): update-branch PUT still issued" "yes" "$gam_o6_u"

# ---- (o7) mixed history: only the API-form merges are counted --------------
# 3 worker merges + 2 API merges is 5 merge commits but only 2 syncs, so it is
# still below the default cap of 3 and syncs.
gam_n_setup diverged
gam_o_commits 116 2 3
gam_o7_rc=0
gam_o7_out=$(run_gam 2>/dev/null) || gam_o7_rc=$?
assert_eq "graph-auto-merge (o7): 3 worker + 2 API merges counts as 2 syncs, below the cap" \
  "synced #116 (tactic-n)" "$gam_o7_out"
assert_eq "graph-auto-merge (o7): exit 0" "0" "$gam_o7_rc"
# One more API sync on the same mixed history crosses the cap — and the reported
# count is 3 (the API merges), not 6 (every merge commit).
gam_n_setup diverged
gam_o_commits 116 3 3
gam_o7b_rc=0
gam_o7b_out=$(run_gam 2>/dev/null) || gam_o7b_rc=$?
assert_eq "graph-auto-merge (o7): the cap counts API merges only, and still holds at 3" \
  "held tactic-n (sync-cap: 3 syncs)" "$gam_o7b_out"
assert_eq "graph-auto-merge (o7): mixed-history hold exit 0" "0" "$gam_o7b_rc"

rm -rf "$GAM_ROOT" "$GAM_BARE"

# <<< END MOVED <<<

report_results
