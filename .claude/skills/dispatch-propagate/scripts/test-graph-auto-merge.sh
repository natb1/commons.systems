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

# Fake node: enumeration ( -e inline ) applies the
# id/phase/pr/conflict/reviewed-marker filter over stub/nodes.json;
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
# enumeration — mirror the script's listNodes filter with jq.
jq -r '.[]
  | select(.kind=="tactic" and .phase=="review"
           and (.execution.pr != null)
           and (.execution.conflict == null)
           and ((.execution.markers // []) | index("reviewed")))
  | "\(.id)\t\(.execution.pr)"' "$STUB/nodes.json"
exit 0
GAMNODE

# Fake gh: `pr ready` no-ops; `api .../pulls/<N>` serves the raw REST fixture;
# `api -X PUT .../pulls/<N>/merge` records the call.
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
run_gam() {
  PATH="$GAM_ROOT/bin:$SAVED_PATH" \
  DISPATCH_CONFIG_DIR="$GAM_ROOT/config" \
  DISPATCH_CI_VERDICT_CACHE="$GAM_ROOT/cache" \
  GRAPH_AUTO_MERGE_MAIN_ROOT="$GAM_ROOT" \
  GH_RETRY_BASE_DELAY=0 GH_RETRY_ATTEMPTS=1 \
  "$GAM_SCRIPT"
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

rm -rf "$GAM_ROOT" "$GAM_BARE"

# <<< END MOVED <<<

report_results
