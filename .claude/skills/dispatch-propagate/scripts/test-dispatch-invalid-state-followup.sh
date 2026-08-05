#!/usr/bin/env bash
# Tests for dispatch-invalid-state-followup — the find-or-create root-cause node
# minter, deduped by CAUSE.
#
# The script writes to the GRAPH, so every case runs against a scratch repo root
# with faked `npx` (dump-node/write-node), a faked `graph-commit`, and a fake
# ESM `store.js` — the fixture shape test-dispatch-graph-main-red-sync.sh
# established for exactly this class of script. The real script is driven as a
# PHYSICAL COPY under that scratch root, because REPO_ROOT derives from the
# script's own location: running the repo's copy would land writes in the real
# `intentions/`.
#
# What that fixture makes testable, and why it matters here: this script MINTS
# AND PUSHES GRAPH NODES. A test that reached the real primitives would mint
# real nodes into the real graph. (The sibling lane's Finding 5 is the recorded
# instance of that going wrong: one suite run drove a real fleet-latch counter
# to 156 observations before the mint incidentally failed.)
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

echo ""
echo "=== dispatch-invalid-state-followup ==="

REAL_REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
SAVED_PATH="$PATH"

FU_ROOT=""
FU_OUT=""
FU_RC=0

fu_setup() {
  FU_ROOT=$(mktemp -d)
  FU_SCRIPTS="$FU_ROOT/.claude/skills/dispatch-propagate/scripts"
  FU_LOG="$FU_ROOT/logs"
  mkdir -p "$FU_SCRIPTS" "$FU_ROOT/bin" "$FU_LOG" \
           "$FU_ROOT/packages/intentionsutil/src" \
           "$FU_ROOT/packages/intentionsutil/scripts" \
           "$FU_ROOT/intentions"
  ln -s "$REAL_REPO_ROOT/node_modules" "$FU_ROOT/node_modules"

  # Physical copy — REPO_ROOT derives from the script's location.
  cp "$SCRIPT_DIR/dispatch-invalid-state-followup" "$FU_SCRIPTS/dispatch-invalid-state-followup"
  chmod +x "$FU_SCRIPTS/dispatch-invalid-state-followup"
  FU_SUT="$FU_SCRIPTS/dispatch-invalid-state-followup"

  printf '{"type":"module","name":"fixture-intentionsutil"}\n' \
    > "$FU_ROOT/packages/intentionsutil/package.json"

  # Fake ESM store: readNode throws when the node file is absent (that is what
  # produces "absent"), otherwise reports the phase/office_hours the fixture set.
  cat > "$FU_ROOT/packages/intentionsutil/src/store.js" <<'STORE'
import { existsSync } from "node:fs";
export function readNode(dir, id) {
  if (!existsSync(`${dir}/${id}.md`)) throw new Error("absent");
  const map = JSON.parse(process.env.FAKE_STATES || "{}");
  const s = Object.prototype.hasOwnProperty.call(map, id) ? map[id] : {};
  return { id, phase: s.phase ?? null, office_hours: s.office_hours ?? null };
}
STORE

  # Fake npx: dump-node.ts writes a manifest and echoes its path; write-node.ts
  # creates the node file with the frontmatter and the generated `# <statement>`
  # placeholder body, which is what the real one does and what the body splice
  # then overwrites. Anything else fails loudly rather than silently masking a
  # real-npx call.
  cat > "$FU_ROOT/bin/npx" <<'NPX'
#!/usr/bin/env bash
if [[ "$1" != "tsx" ]]; then
  echo "fake npx: unexpected invocation: $*" >&2; exit 3
fi
shift
script="$1"; shift
case "$script" in
  *dump-node.ts)
    outdir=""; id=""
    while [[ $# -gt 0 ]]; do
      case "$1" in --out-dir) outdir="$2"; shift 2 ;; *) id="$1"; shift ;; esac
    done
    mkdir -p "$outdir"
    echo "dump-node $id" >> "$FAKE_LOG_DIR/dump-node.log"
    printf '%s=deadbeef\n' "$id" > "$outdir/base-manifest.txt"
    printf '%s\n' "$outdir/base-manifest.txt"
    ;;
  *write-node.ts)
    file=""
    while [[ $# -gt 0 ]]; do
      case "$1" in --file) file="$2"; shift 2 ;; *) shift ;; esac
    done
    echo "write-node --file $file" >> "$FAKE_LOG_DIR/write-node.log"
    if [[ -f "$FAKE_ROOT/write-node-fail" ]]; then
      echo "fake write-node: refused" >&2; exit 1
    fi
    id=$(jq -r '.id' "$file")
    statement=$(jq -r '.statement' "$file")
    {
      printf -- '---\n'
      jq -r 'to_entries[] | "\(.key): \(.value|tostring)"' "$file"
      printf -- '---\n'
      printf '# %s\n' "$statement"
    } > "$FAKE_ROOT/intentions/$id.md"
    ;;
  *) echo "fake npx: unexpected tsx script: $script" >&2; exit 3 ;;
esac
exit 0
NPX
  chmod +x "$FU_ROOT/bin/npx"

  cat > "$FU_ROOT/packages/intentionsutil/scripts/graph-commit" <<'GC'
#!/usr/bin/env bash
base=""; id=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --base) base="$2"; shift 2 ;;
    -m) shift 2 ;;
    *) id="$1"; shift ;;
  esac
done
echo "graph-commit $id --base ${base:-none}" >> "$FAKE_LOG_DIR/graph-commit.log"
exit 0
GC
  chmod +x "$FU_ROOT/packages/intentionsutil/scripts/graph-commit"

  printf 'A lane ended a pass without declaring a terminal disposition.\n' \
    > "$FU_ROOT/body.md"
}

fu_teardown() {
  export PATH="$SAVED_PATH"
  rm -rf "$FU_ROOT"
  FU_ROOT=""
}

# run_fu <args...> — drive the copied script with the fake toolchain on PATH.
run_fu() {
  FU_OUT=""
  FU_RC=0
  FU_OUT=$(env PATH="$FU_ROOT/bin:$SAVED_PATH" FAKE_LOG_DIR="$FU_LOG" \
    FAKE_ROOT="$FU_ROOT" FAKE_STATES="${FU_STATES:-{\}}" \
    DISPATCH_INVALID_STATE_FOLLOWUP_NOW="${FU_NOW:-2026-08-05T04:00:00Z}" \
    "$FU_SUT" "$@" 2>/dev/null) || FU_RC=$?
}

fu_log_count() { # <logfile> -> count (0 if absent)
  if [[ -f "$FU_LOG/$1" ]]; then grep -c . "$FU_LOG/$1" || true; else echo 0; fi
}

# --- Test 1: the id is a pure function of the CAUSE slug --------------------
# The whole dedup design rests on this: same cause → same id, regardless of
# which node was stranded or which session died.
echo "Test: the id is derived from the cause slug alone"
fu_setup
run_fu --cause-slug align-tactics-missing-mark-node-terminal \
  --source-node tactic-alpha --statement "s" --body-file "$FU_ROOT/body.md" --dry-run
id_a=$(printf '%s' "$FU_OUT" | head -1)
run_fu --cause-slug align-tactics-missing-mark-node-terminal \
  --source-node tactic-beta --statement "s" --body-file "$FU_ROOT/body.md" --dry-run
id_b=$(printf '%s' "$FU_OUT" | head -1)
run_fu --cause-slug self-close-reap-declined \
  --source-node tactic-alpha --statement "s" --body-file "$FU_ROOT/body.md" --dry-run
id_c=$(printf '%s' "$FU_OUT" | head -1)
assert_eq "same slug, different source node → SAME id" "$id_a" "$id_b"
assert_eq "different slug → different id" "no" \
  "$( [ "$id_a" = "$id_c" ] && printf 'yes' || printf 'no')"
assert_eq "the id satisfies the anchored regex" "yes" \
  "$( [[ "$id_a" =~ ^tactic-invalid-state-rc-[0-9a-f]{8}$ ]] && printf 'yes' || printf 'no')"
fu_teardown

# --- Test 2: the anchored reader regex, against its real near-misses ---------
# The bug class this pins deadlocked auto-merge for weeks when
# dispatch-graph-main-red-sync used a bare prefix test. These three ids are the
# real neighbours in this keyspace.
echo "Test: ^tactic-invalid-state-rc-[0-9a-f]{8}\$ excludes its neighbours"
RC_RE='^tactic-invalid-state-rc-[0-9a-f]{8}$'
matches() { [[ "$1" =~ $RC_RE ]] && printf 'yes' || printf 'no'; }
assert_eq "rejects the hand-authored lane node" "no" "$(matches tactic-invalid-state-lane)"
assert_eq "rejects the hand-authored intervention node" "no" \
  "$(matches tactic-invalid-state-transcript-intervention)"
assert_eq "rejects a sibling FLEET LATCH id (no rc- infix)" "no" \
  "$(matches tactic-invalid-state-deadbeef)"
assert_eq "accepts a well-formed rc id" "yes" "$(matches tactic-invalid-state-rc-deadbeef)"
assert_eq "rejects a short hash" "no" "$(matches tactic-invalid-state-rc-dead)"
assert_eq "rejects a non-hex hash" "no" "$(matches tactic-invalid-state-rc-zzzzzzzz)"
assert_eq "rejects a longer id that merely STARTS with a valid one" "no" \
  "$(matches tactic-invalid-state-rc-deadbeef-followup)"

# --- Test 3: --dry-run writes nothing ---------------------------------------
echo "Test: --dry-run prints the id and JSON but lands nothing"
fu_setup
run_fu --cause-slug some-cause --source-node tactic-alpha \
  --statement "a lane defect" --body-file "$FU_ROOT/body.md" --dry-run
assert_eq "dry-run exits 0" "0" "$FU_RC"
assert_eq "dry-run emits parseable node JSON" "yes" \
  "$(printf '%s' "$FU_OUT" | tail -n +2 | jq -e . >/dev/null 2>&1 && printf 'yes' || printf 'no')"
assert_eq "dry-run wrote no node file" "0" \
  "$(find "$FU_ROOT/intentions" -name '*.md' | wc -l | tr -d ' ')"
assert_eq "dry-run ran no graph-commit" "0" "$(fu_log_count graph-commit.log)"
assert_eq "dry-run ran no write-node" "0" "$(fu_log_count write-node.log)"
fu_teardown

# --- Test 4: the mint path --------------------------------------------------
echo "Test: an absent node is minted, with a schema-shaped body and one occurrence"
fu_setup
run_fu --cause-slug align-tactics-missing-mark-node-terminal \
  --source-node tactic-alpha --session 1111-2222 \
  --statement "align-tactics ends a round without declaring a disposition" \
  --body-file "$FU_ROOT/body.md"
assert_eq "mint exits 0" "0" "$FU_RC"
assert_eq "mint reports 'minted'" "minted" "$(printf '%s' "$FU_OUT" | awk '{print $2}')"
MINTED_ID=$(printf '%s' "$FU_OUT" | awk '{print $1}')
assert_eq "the node file exists" "yes" \
  "$( [ -f "$FU_ROOT/intentions/$MINTED_ID.md" ] && printf 'yes' || printf 'no')"
assert_eq "write-node validated the mint" "1" "$(fu_log_count write-node.log)"
assert_eq "the mint committed once" "1" "$(fu_log_count graph-commit.log)"
# A pure create has no prior blob, so --base does not apply.
assert_eq "the mint passes NO --base (a create has no prior blob)" "yes" \
  "$(grep -q -- '--base none' "$FU_LOG/graph-commit.log" && printf 'yes' || printf 'no')"
assert_eq "the body carries the supplied prose" "yes" \
  "$(grep -q 'without declaring a terminal disposition' "$FU_ROOT/intentions/$MINTED_ID.md" && printf 'yes' || printf 'no')"
assert_eq "the body carries an Occurrences section" "yes" \
  "$(grep -q '^## Occurrences' "$FU_ROOT/intentions/$MINTED_ID.md" && printf 'yes' || printf 'no')"
assert_eq "exactly one occurrence line" "1" \
  "$(grep -c 'source node tactic-alpha, session 1111-2222' "$FU_ROOT/intentions/$MINTED_ID.md")"
assert_eq "the generated placeholder body was spliced away" "0" \
  "$(grep -c '^# align-tactics ends a round' "$FU_ROOT/intentions/$MINTED_ID.md" || true)"
fu_teardown

# --- Test 5: the minted node's shape ----------------------------------------
# Every schema field is emitted explicitly, so nothing is left to guess at
# runtime. `office_hours: null` is the deliberate one: a lane defect is
# claude-eligible work /align-tactics should be able to plan, not an
# author-required verification item.
echo "Test: the minted node carries the full schema-valid draft shape"
fu_setup
run_fu --cause-slug some-cause --source-node tactic-alpha \
  --statement "a lane defect" --body-file "$FU_ROOT/body.md" --dry-run
J=$(printf '%s' "$FU_OUT" | tail -n +2)
assert_eq "kind is tactic"        "tactic" "$(jq -r .kind <<<"$J")"
assert_eq "owner is ai"           "ai"     "$(jq -r .owner <<<"$J")"
assert_eq "status is raw"         "raw"    "$(jq -r .status <<<"$J")"
assert_eq "phase is null (a draft)" "null"  "$(jq -r '.phase // "null"' <<<"$J")"
assert_eq "execution is null"     "null"   "$(jq -r '.execution // "null"' <<<"$J")"
assert_eq "office_hours is null — NOT born-parked" "null" \
  "$(jq -r '.office_hours // "null"' <<<"$J")"
assert_eq "serves the dispatch strategy" "strategy-graph-native-dispatch" \
  "$(jq -r '.serves[0]' <<<"$J")"
assert_eq "validates is empty (rank is inherited via serves)" "0" \
  "$(jq -r '.validates | length' <<<"$J")"
assert_eq "pace_exempt is false" "false" "$(jq -r '.pace_exempt' <<<"$J")"
assert_eq "the rationale names the cause slug" "yes" \
  "$(jq -r '.rationale' <<<"$J" | grep -q 'some-cause' && printf 'yes' || printf 'no')"
fu_teardown

# --- Test 6: the open path appends exactly one occurrence, with --base -------
echo "Test: an open node gains one occurrence, landed with a --base CAS token"
fu_setup
run_fu --cause-slug some-cause --source-node tactic-alpha --session 1111-2222 \
  --statement "a lane defect" --body-file "$FU_ROOT/body.md"
MINTED_ID=$(printf '%s' "$FU_OUT" | awk '{print $1}')
rm -f "$FU_LOG"/*.log
FU_STATES="{\"$MINTED_ID\":{\"phase\":null,\"office_hours\":null}}"
run_fu --cause-slug some-cause --source-node tactic-beta --session 3333-4444 \
  --statement "a lane defect" --body-file "$FU_ROOT/body.md"
assert_eq "the second occurrence reports 'updated'" "updated" \
  "$(printf '%s' "$FU_OUT" | awk '{print $2}')"
assert_eq "it converges on the SAME node id" "$MINTED_ID" \
  "$(printf '%s' "$FU_OUT" | awk '{print $1}')"
assert_eq "the open path captured a CAS token" "1" "$(fu_log_count dump-node.log)"
assert_eq "the open path landed WITH --base" "yes" \
  "$(grep -q -- "--base .*base-manifest.txt" "$FU_LOG/graph-commit.log" && printf 'yes' || printf 'no')"
assert_eq "the open path did NOT re-run write-node" "0" "$(fu_log_count write-node.log)"
assert_eq "both occurrences are recorded" "2" \
  "$(grep -c '^- .* — source node ' "$FU_ROOT/intentions/$MINTED_ID.md")"
assert_eq "the first occurrence survived" "1" \
  "$(grep -c 'source node tactic-alpha, session 1111-2222' "$FU_ROOT/intentions/$MINTED_ID.md")"
assert_eq "only ONE Occurrences heading exists" "1" \
  "$(grep -c '^## Occurrences' "$FU_ROOT/intentions/$MINTED_ID.md")"
fu_teardown

# --- Test 7: re-entrancy — the same corpse twice churns nothing --------------
# The idempotency key is source+session, NOT the whole line: the line carries a
# timestamp that differs every run, so an exact-line test would be vacuous and
# would append forever while reading as a dedup.
echo "Test: a re-entrant intervention on the same corpse reports unchanged, no commit"
fu_setup
run_fu --cause-slug some-cause --source-node tactic-alpha --session 1111-2222 \
  --statement "a lane defect" --body-file "$FU_ROOT/body.md"
MINTED_ID=$(printf '%s' "$FU_OUT" | awk '{print $1}')
rm -f "$FU_LOG"/*.log
FU_STATES="{\"$MINTED_ID\":{\"phase\":null,\"office_hours\":null}}"
# Same source node AND same session — and a LATER clock, which is exactly the
# case an exact-line comparison would miss.
FU_NOW="2026-08-05T09:99:99Z"
run_fu --cause-slug some-cause --source-node tactic-alpha --session 1111-2222 \
  --statement "a lane defect" --body-file "$FU_ROOT/body.md"
assert_eq "the re-entrant run reports 'unchanged'" "unchanged" \
  "$(printf '%s' "$FU_OUT" | awk '{print $2}')"
assert_eq "the re-entrant run made NO commit" "0" "$(fu_log_count graph-commit.log)"
assert_eq "the re-entrant run captured no CAS token" "0" "$(fu_log_count dump-node.log)"
assert_eq "still exactly one occurrence line" "1" \
  "$(grep -c '^- .* — source node ' "$FU_ROOT/intentions/$MINTED_ID.md")"
unset FU_NOW
fu_teardown

# --- Test 8: a `closed` node mints rather than reopening --------------------
# Reopening a since-dispositioned node would erase that disposition. The cause
# recurring after it was closed is new information, and gets a new record.
echo "Test: a closed node mints a fresh record instead of reopening"
fu_setup
run_fu --cause-slug some-cause --source-node tactic-alpha --session 1111-2222 \
  --statement "a lane defect" --body-file "$FU_ROOT/body.md"
MINTED_ID=$(printf '%s' "$FU_OUT" | awk '{print $1}')
rm -f "$FU_LOG"/*.log
FU_STATES="{\"$MINTED_ID\":{\"phase\":\"done\",\"office_hours\":null}}"
run_fu --cause-slug some-cause --source-node tactic-beta --session 3333-4444 \
  --statement "a lane defect" --body-file "$FU_ROOT/body.md"
assert_eq "a done node takes the mint path, not the edit path" "minted" \
  "$(printf '%s' "$FU_OUT" | awk '{print $2}')"
assert_eq "the mint path ran write-node" "1" "$(fu_log_count write-node.log)"
# A parked node is 'closed' too — office_hours and phase are orthogonal, so
# either one closing the record is enough.
rm -f "$FU_LOG"/*.log
FU_STATES="{\"$MINTED_ID\":{\"phase\":null,\"office_hours\":{\"reason\":\"parked\"}}}"
run_fu --cause-slug some-cause --source-node tactic-gamma --session 5555-6666 \
  --statement "a lane defect" --body-file "$FU_ROOT/body.md"
assert_eq "a parked node also takes the mint path" "minted" \
  "$(printf '%s' "$FU_OUT" | awk '{print $2}')"
fu_teardown

# --- Test 9: the closing-keyword refusal ------------------------------------
# GitHub scans an ENTIRE body for these keywords and treats every match as a
# close directive for the PR/issue carrying it. Transcript-sourced text can
# carry one in a test name or an error string.
echo "Test: a body carrying a closing keyword next to a #N is refused (exit 3)"
fu_setup
for kw in "closes #123" "Fixes #7" "resolved #99" "FIX #1" "close: #42"; do
  printf 'diagnosis prose\nthe failing test was named %s here\n' "$kw" > "$FU_ROOT/bad.md"
  run_fu --cause-slug some-cause --source-node tactic-alpha \
    --statement "a lane defect" --body-file "$FU_ROOT/bad.md"
  assert_eq "'$kw' is refused with exit 3" "3" "$FU_RC"
done
assert_eq "the refusal landed nothing" "0" "$(fu_log_count graph-commit.log)"
assert_eq "the refusal wrote no node file" "0" \
  "$(find "$FU_ROOT/intentions" -name '*.md' | wc -l | tr -d ' ')"
# A bare `#N` with NO keyword is fine — that is the sanctioned way to reference
# another PR/issue in a durable body.
printf 'diagnosis prose referencing PR #911, #905 with no keyword\n' > "$FU_ROOT/ok.md"
run_fu --cause-slug some-cause --source-node tactic-alpha \
  --statement "a lane defect" --body-file "$FU_ROOT/ok.md"
assert_eq "a bare #N reference is NOT refused" "0" "$FU_RC"
fu_teardown

# --- Test 10: argv validation ------------------------------------------------
echo "Test: malformed argv → exit 2"
fu_setup
run_fu --cause-slug "Not A Slug" --source-node tactic-alpha \
  --statement "s" --body-file "$FU_ROOT/body.md"
assert_eq "a non-slug cause exits 2" "2" "$FU_RC"
run_fu --cause-slug "trailing-" --source-node tactic-alpha \
  --statement "s" --body-file "$FU_ROOT/body.md"
assert_eq "a trailing-hyphen slug exits 2" "2" "$FU_RC"
run_fu --cause-slug some-cause --source-node "NOT A NODE" \
  --statement "s" --body-file "$FU_ROOT/body.md"
assert_eq "an invalid source node exits 2" "2" "$FU_RC"
run_fu --cause-slug some-cause --source-node tactic-alpha --statement "s"
assert_eq "a missing --body-file exits 2" "2" "$FU_RC"
run_fu --cause-slug some-cause --source-node tactic-alpha \
  --statement "s" --body-file "$FU_ROOT/does-not-exist.md"
assert_eq "an unreadable --body-file exits 2" "2" "$FU_RC"
run_fu --cause-slug some-cause --source-node tactic-alpha \
  --statement "s" --body-file "$FU_ROOT/body.md" --session "bad/../id"
assert_eq "a path-shaped session exits 2" "2" "$FU_RC"
run_fu --cause-slug some-cause --source-node tactic-alpha --bogus \
  --statement "s" --body-file "$FU_ROOT/body.md"
assert_eq "an unknown flag exits 2" "2" "$FU_RC"
assert_eq "no rejected invocation wrote a node" "0" \
  "$(find "$FU_ROOT/intentions" -name '*.md' | wc -l | tr -d ' ')"
fu_teardown

# --- Test 11: it never touches the SOURCE node ------------------------------
# Escalation is the skill's decision and the skill's act. This script files a
# record and nothing else.
echo "Test: the source node's own file is never written"
fu_setup
printf -- '---\nid: tactic-alpha\n---\n# untouched\n' > "$FU_ROOT/intentions/tactic-alpha.md"
before=$(sha256sum "$FU_ROOT/intentions/tactic-alpha.md" | cut -d' ' -f1)
run_fu --cause-slug some-cause --source-node tactic-alpha --session 1111-2222 \
  --statement "a lane defect" --body-file "$FU_ROOT/body.md"
after=$(sha256sum "$FU_ROOT/intentions/tactic-alpha.md" | cut -d' ' -f1)
assert_eq "the source node file is byte-identical afterwards" "$before" "$after"
assert_eq "graph-commit was never asked to commit the source node" "0" \
  "$(grep -c 'graph-commit tactic-alpha ' "$FU_LOG/graph-commit.log" || true)"
fu_teardown

# --- Test 12: a failing write-node lands nothing ----------------------------
echo "Test: a refused write-node exits 1 without committing"
fu_setup
: > "$FU_ROOT/write-node-fail"
run_fu --cause-slug some-cause --source-node tactic-alpha \
  --statement "a lane defect" --body-file "$FU_ROOT/body.md"
assert_eq "a refused write-node exits 1" "1" "$FU_RC"
assert_eq "a refused write-node commits nothing" "0" "$(fu_log_count graph-commit.log)"
fu_teardown

report_results
