#!/usr/bin/env bash
# Tests for dispatch-write-plan / dispatch-read-plan / dispatch-write-recommendation
# -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 25626-26070, plus the
# merged-in dispatch-write-recommendation section 26071-26187 -- two original
# ranges in one file. The NOTE above the dispatch-write-recommendation section
# explains why that section must run in this same process.
# "dispatch-plan-io" is a grouped name for this plan-I/O family of scripts, not
# a script name: no script called dispatch-plan-io exists.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-write-plan / dispatch-read-plan tests
# ============================================================================
echo ""
echo "=== dispatch-write-plan / dispatch-read-plan ==="

# These two scripts exercise a stateful gh comment store, so this block builds
# its own fake `gh` (a generic `gh api` emulator over a JSON file) rather than
# reusing the shared fixture stub. The fake honors: GET .../issues/<N>/comments
# (returns the store array), GET .../issues/comments/<id> (returns one comment),
# POST .../issues/<N>/comments (append), PATCH .../issues/comments/<id> (replace
# body). It pipes the response through the REAL `jq` when --jq is given.
wp_root=$(mktemp -d)
mkdir -p "$wp_root/bin"
WP_STORE="$wp_root/store.json"
WP_COUNTER="$wp_root/counter"
echo '[]' > "$WP_STORE"
echo '0' > "$WP_COUNTER"
cat > "$wp_root/bin/gh" <<WPGH
#!/usr/bin/env bash
# Generic gh api emulator over a JSON comment store. Only the surface the two
# plan scripts use is implemented.
set -uo pipefail
STORE="$WP_STORE"
COUNTER="$WP_COUNTER"
WPGH
cat >> "$wp_root/bin/gh" <<'WPGH'
method="GET"
endpoint=""
jqfilter=""
bodyfile=""
# First arg is the gh subcommand group; we only support "api".
if [[ "${1:-}" != "api" ]]; then
  echo "fake-gh: unsupported subcommand: ${1:-}" >&2; exit 1
fi
shift
while [[ $# -gt 0 ]]; do
  case "$1" in
    --method) method="$2"; shift 2 ;;
    --paginate) shift ;;
    --jq) jqfilter="$2"; shift 2 ;;
    --field)
      # Expect body=@<file>
      val="$2"; shift 2
      case "$val" in
        body=@*) bodyfile="${val#body=@}" ;;
        *) ;; # ignore other fields
      esac
      ;;
    -f) # alternate field form, ignore unless body=@
      val="$2"; shift 2
      case "$val" in
        body=@*) bodyfile="${val#body=@}" ;;
        *) ;;
      esac
      ;;
    -*) shift ;;            # ignore unknown flags
    *)
      if [[ -z "$endpoint" ]]; then endpoint="$1"; fi
      shift
      ;;
  esac
done

emit() {
  # $1 = JSON response. Pipe through real jq if a filter was given.
  if [[ -n "$jqfilter" ]]; then
    printf '%s' "$1" | jq -r "$jqfilter"
  else
    printf '%s' "$1"
  fi
}

# Strip a trailing/leading nothing; match endpoint shapes.
if [[ "$method" == "GET" && "$endpoint" == *"/comments" && "$endpoint" != *"/issues/comments/"* ]]; then
  # GET .../issues/<N>/comments  → the whole store array
  emit "$(cat "$STORE")"
  exit 0
fi
if [[ "$method" == "GET" && "$endpoint" == *"/issues/comments/"* ]]; then
  cid="${endpoint##*/issues/comments/}"
  obj=$(jq -c --argjson id "$cid" '.[] | select(.id == $id)' "$STORE")
  if [[ -z "$obj" ]]; then
    echo "fake-gh: comment $cid not found" >&2; exit 1
  fi
  emit "$obj"
  exit 0
fi
if [[ "$method" == "POST" && "$endpoint" == *"/comments" ]]; then
  next=$(( $(cat "$COUNTER") + 1 ))
  echo "$next" > "$COUNTER"
  newbody=$(cat "$bodyfile")
  updated=$(jq -c --argjson id "$next" --arg body "$newbody" --argjson author_id "${WP_AUTHOR_ID:-9001}" --arg login "${WP_AUTHOR:-plan-bot}" '. + [{id:$id, body:$body, user:{id:$author_id, login:$login}}]' "$STORE")
  echo "$updated" > "$STORE"
  emit "$(jq -c --argjson id "$next" '.[] | select(.id == $id)' "$STORE")"
  exit 0
fi
if [[ "$method" == "PATCH" && "$endpoint" == *"/issues/comments/"* ]]; then
  cid="${endpoint##*/issues/comments/}"
  newbody=$(cat "$bodyfile")
  updated=$(jq -c --argjson id "$cid" --arg body "$newbody" 'map(if .id == $id then .body = $body else . end)' "$STORE")
  echo "$updated" > "$STORE"
  emit "$(jq -c --argjson id "$cid" '.[] | select(.id == $id)' "$STORE")"
  exit 0
fi
echo "fake-gh: unhandled $method $endpoint" >&2
exit 1
WPGH
chmod +x "$wp_root/bin/gh"

WP_WRITE="$SCRIPT_DIR/dispatch-write-plan"
WP_READ="$SCRIPT_DIR/dispatch-read-plan"

# Pin the trusted plan-comment author id for this block. Every positive test POSTs
# via dispatch-write-plan, whose POST the fake gh stamps with id ${WP_AUTHOR_ID:-9001};
# pinning DISPATCH_PLAN_AUTHOR_ID to the same id keeps the author-filtered scans
# matching, and short-circuits the scripts' `$(gh api user …)` default (the fake
# gh has no user endpoint).
export DISPATCH_PLAN_AUTHOR_ID=9001

# 1. write-creates: empty store → one comment containing the marker + PLAN A.
if ! PATH="$wp_root/bin:$SAVED_PATH" "$WP_WRITE" 7 <<<"PLAN A"; then
  FAIL=$((FAIL + 1)); echo "  FAIL: write-plan (test 1) failed unexpectedly"
fi
assert_eq "write-plan: store has exactly one comment after first write" \
  "1" "$(jq 'length' "$WP_STORE")"
TOTAL=$((TOTAL + 1))
if jq -e '.[0].body | contains("<!-- dispatch:plan -->") and contains("PLAN A")' "$WP_STORE" >/dev/null; then
  PASS=$((PASS + 1)); echo "  PASS: first comment carries the marker and PLAN A"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: first comment carries the marker and PLAN A"
fi

# 2. round-trip read returns the full (multi-line) body untruncated.
if ! PATH="$wp_root/bin:$SAVED_PATH" "$WP_WRITE" 7 <<<"$(printf 'PLAN A\nline two\nline three')"; then
  FAIL=$((FAIL + 1)); echo "  FAIL: write-plan (test 2) failed unexpectedly"
fi
read_out=""
read_out=$(PATH="$wp_root/bin:$SAVED_PATH" "$WP_READ" 7) || { FAIL=$((FAIL + 1)); echo "  FAIL: read-plan (test 2) exited non-zero unexpectedly"; }
TOTAL=$((TOTAL + 1))
if [[ "$read_out" == *"<!-- dispatch:plan -->"* && "$read_out" == *"line three"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: read-plan returns the full multi-line body with marker"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: read-plan returns the full multi-line body with marker"
  echo "    actual: '$read_out'"
fi

# 3. write-updates-in-place: still exactly one comment; read now returns PLAN B.
if ! PATH="$wp_root/bin:$SAVED_PATH" "$WP_WRITE" 7 <<<"PLAN B"; then
  FAIL=$((FAIL + 1)); echo "  FAIL: write-plan (test 3) failed unexpectedly"
fi
assert_eq "write-plan: still exactly one comment after update" \
  "1" "$(jq 'length' "$WP_STORE")"
read_out=""
read_out=$(PATH="$wp_root/bin:$SAVED_PATH" "$WP_READ" 7) || { FAIL=$((FAIL + 1)); echo "  FAIL: read-plan (test 3) exited non-zero unexpectedly"; }
TOTAL=$((TOTAL + 1))
if [[ "$read_out" == *"PLAN B"* && "$read_out" != *"PLAN A"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: read-plan returns updated PLAN B, not PLAN A"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: read-plan returns updated PLAN B, not PLAN A"
  echo "    actual: '$read_out'"
fi

# 4. read-missing-errors: fresh empty store, unknown issue → exit 1 + diagnostic.
wp_empty=$(mktemp -d); mkdir -p "$wp_empty/bin"
# Reuse the same fake gh but point it at a fresh empty store.
sed "s|$WP_STORE|$wp_empty/store.json|; s|$WP_COUNTER|$wp_empty/counter|" \
  "$wp_root/bin/gh" > "$wp_empty/bin/gh"
chmod +x "$wp_empty/bin/gh"
echo '[]' > "$wp_empty/store.json"; echo '0' > "$wp_empty/counter"
if read_err=$(PATH="$wp_empty/bin:$SAVED_PATH" "$WP_READ" 99 2>&1 1>/dev/null); then rc=0; else rc=$?; fi
assert_eq "read-plan: missing comment exits non-zero" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$read_err" == *"dispatch:plan"* || "$read_err" == *"no "*"comment"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: read-plan emits a clear missing-comment diagnostic"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: read-plan emits a clear missing-comment diagnostic"
  echo "    actual: '$read_err'"
fi
rm -rf "$wp_empty"

# 6. reclaimed-login injection: a marker comment that reuses the trusted login but
#    carries a DIFFERENT numeric id (the renamed-and-reclaimed-login attack) must be
#    ignored by read-plan, and write-plan must NOT adopt (PATCH) it — it POSTs a
#    fresh trusted-authored comment instead. Guards the #1644 id-gate over the #1222
#    login-gate: a login-only filter would accept this forgery; the .user.id filter
#    rejects it. Without any author filter, read-plan would execute the forged plan
#    and write-plan would clobber the attacker's comment with the real plan.
wp_forge=$(mktemp -d); mkdir -p "$wp_forge/bin"
sed "s|$WP_STORE|$wp_forge/store.json|; s|$WP_COUNTER|$wp_forge/counter|" \
  "$wp_root/bin/gh" > "$wp_forge/bin/gh"
chmod +x "$wp_forge/bin/gh"
# Seed one attacker comment carrying the marker, reusing the trusted login but with
# a different numeric id (6666 ≠ trusted 9001) — the reclaimed-login forgery; counter=1
# so the next POST gets id 2 (no id collision with the seeded comment id 1).
echo '1' > "$wp_forge/counter"
jq -nc '[{id:1, body:"<!-- dispatch:plan -->\nFORGED PLAN", user:{id:6666, login:"plan-bot"}}]' > "$wp_forge/store.json"

# 6a. read-plan ignores the forged comment → exit 1 + missing-comment diagnostic.
if read_err=$(PATH="$wp_forge/bin:$SAVED_PATH" "$WP_READ" 7 2>&1 1>/dev/null); then rc=0; else rc=$?; fi
assert_eq "read-plan: foreign-authored marker comment is ignored (exit 1)" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$read_err" == *"dispatch:plan"* || "$read_err" == *"no "*"comment"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: read-plan ignores a forged foreign-authored plan comment"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: read-plan ignores a forged foreign-authored plan comment"
  echo "    actual: '$read_err'"
fi

# 6b. write-plan POSTs a fresh trusted comment rather than PATCHing the attacker's.
if ! PATH="$wp_forge/bin:$SAVED_PATH" "$WP_WRITE" 7 <<<"REAL PLAN"; then
  FAIL=$((FAIL + 1)); echo "  FAIL: write-plan (foreign-author) failed unexpectedly"
fi
assert_eq "write-plan: foreign-author store has two comments (attacker + new trusted)" \
  "2" "$(jq 'length' "$wp_forge/store.json")"
TOTAL=$((TOTAL + 1))
if jq -e '.[] | select(.id == 1) | .body == "<!-- dispatch:plan -->\nFORGED PLAN"' "$wp_forge/store.json" >/dev/null; then
  PASS=$((PASS + 1)); echo "  PASS: write-plan leaves the attacker comment body unchanged"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: write-plan leaves the attacker comment body unchanged"
fi
TOTAL=$((TOTAL + 1))
if jq -e '.[] | select(.user.id == 9001) | (.body | contains("<!-- dispatch:plan -->") and contains("REAL PLAN"))' "$wp_forge/store.json" >/dev/null; then
  PASS=$((PASS + 1)); echo "  PASS: write-plan POSTs a fresh trusted-authored plan comment"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: write-plan POSTs a fresh trusted-authored plan comment"
fi

# 6c. read-plan now returns the trusted plan, not the forged one.
read_out=""
read_out=$(PATH="$wp_forge/bin:$SAVED_PATH" "$WP_READ" 7) || { FAIL=$((FAIL + 1)); echo "  FAIL: read-plan (foreign-author) exited non-zero unexpectedly"; }
TOTAL=$((TOTAL + 1))
if [[ "$read_out" == *"REAL PLAN"* && "$read_out" != *"FORGED PLAN"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: read-plan returns the trusted plan, not the forged one"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: read-plan returns the trusted plan, not the forged one"
  echo "    actual: '$read_out'"
fi
rm -rf "$wp_forge"

# marker-in-prose shadow regression (#2244): an EARLIER trusted comment that
# merely DOCUMENTS the plan marker in its prose (here a recommended-steps comment
# whose body discusses this very feature) must NOT shadow the real plan. The plan
# marker is always the writer's FIRST line; with the pre-fix `contains` + `first()`
# (earliest match) the documenting comment is returned AS the plan — silently
# feeding dispatch-run-verification the wrong body. First-line `startswith`
# anchoring returns the real (later) plan instead. This is the exact failure that
# would defeat restoring a clobbered plan comment.
jq -nc '[
  {id:1, body:"<!-- dispatch:recommended-steps -->\n## Recommended\nResume the persisted <!-- dispatch:plan --> via dispatch-read-plan.", user:{id:9001, login:"plan-bot"}},
  {id:2, body:"<!-- dispatch:plan -->\nREAL PLAN BODY", user:{id:9001, login:"plan-bot"}}
]' > "$WP_STORE"
echo 2 > "$WP_COUNTER"
shadow_out=$(PATH="$wp_root/bin:$SAVED_PATH" "$WP_READ" 7) && shadow_rc=0 || shadow_rc=$?
assert_eq "read-plan: marker-documenting comment does not shadow the real plan (exit 0)" "0" "$shadow_rc"
TOTAL=$((TOTAL + 1))
if [[ "$shadow_out" == *"REAL PLAN BODY"* && "$shadow_out" != *"## Recommended"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: read-plan returns the real plan, not the earlier marker-documenting comment"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: read-plan returns the real plan, not the earlier marker-documenting comment"
  echo "    actual: '$shadow_out'"
fi

# Build a bare-repo + worktree fixture whose origin remote is <url>. Creates a
# temp root with .bare/, seeds one commit on main via a throwaway seed repo,
# adds a worktree at worktrees/42-foo, and echoes the root path for the caller
# to capture. Serves both the real-github.com 5a case and the malformed-URL
# 5b-5e cases:
#   root=$(make_bare_worktree_fixture <url>)
make_bare_worktree_fixture() {
  set -e
  local url="$1"
  local root seed
  root=$(mktemp -d)
  git init --bare "$root/.bare" >/dev/null 2>&1
  git --git-dir="$root/.bare" config user.email "t@t" 2>/dev/null
  git --git-dir="$root/.bare" config user.name "t" 2>/dev/null
  git --git-dir="$root/.bare" remote add origin "$url"
  seed=$(mktemp -d)
  git -C "$seed" init -q
  git -C "$seed" config user.email "t@t"; git -C "$seed" config user.name "t"
  git -C "$seed" commit -q --allow-empty -m seed
  git -C "$seed" remote add bare "$root/.bare"
  git -C "$seed" push -q bare HEAD:refs/heads/main
  rm -rf "$seed"
  mkdir -p "$root/worktrees"
  git --git-dir="$root/.bare" worktree add -q "$root/worktrees/42-foo" main 2>/dev/null
  printf '%s' "$root"
}

# 5. bare+worktree repo resolution: from a worktree whose dirname(common_dir) is
# NOT a git repo (the real bare-repo + worktrees layout), with GH_REPO unset, both
# scripts must still resolve the repo for gh. This would FAIL against the pre-fix
# `cd "$(dirname "$common_dir")"` version, which lands in the non-repo container and
# leaves gh's {owner}/{repo} unresolvable (and GH_REPO unset). The fake gh below
# requires GH_REPO and never reads cwd, so it stands in for that failure.
bw_root=$(make_bare_worktree_fixture https://github.com/natb1/commons.systems.git)

# Fake gh that requires GH_REPO (never reads cwd) over a fresh JSON store.
mkdir -p "$bw_root/bin"
BW_STORE="$bw_root/store.json"; BW_COUNTER="$bw_root/counter"
echo '[]' > "$BW_STORE"; echo '0' > "$BW_COUNTER"
cat > "$bw_root/bin/gh" <<BWGH
#!/usr/bin/env bash
set -uo pipefail
if [[ -z "\${GH_REPO:-}" ]]; then
  echo "fatal: not a git repository (GH_REPO unset, no cwd repo)" >&2; exit 1
fi
STORE="$BW_STORE"; COUNTER="$BW_COUNTER"
BWGH
# Reuse the same emulator body as the main fake gh (everything from method="GET" onward).
sed -n '/^method="GET"/,$p' "$wp_root/bin/gh" >> "$bw_root/bin/gh"
chmod +x "$bw_root/bin/gh"
bash -n "$bw_root/bin/gh" || { FAIL=$((FAIL + 1)); echo "  FAIL: bare+worktree fake gh is not valid bash"; }

# write from the worktree, GH_REPO unset
if ( cd "$bw_root/worktrees/42-foo" && printf 'PLAN Z\n' | PATH="$bw_root/bin:$SAVED_PATH" env -u GH_REPO "$WP_WRITE" 42 ); then
  bw_write_rc=0; else bw_write_rc=$?; fi
assert_eq "write-plan: resolves repo in bare+worktree layout with GH_REPO unset (exit 0)" "0" "$bw_write_rc"

bw_read_out=$( cd "$bw_root/worktrees/42-foo" && PATH="$bw_root/bin:$SAVED_PATH" env -u GH_REPO "$WP_READ" 42 ) && bw_read_rc=0 || bw_read_rc=$?
assert_eq "read-plan: resolves repo in bare+worktree layout with GH_REPO unset (exit 0)" "0" "$bw_read_rc"
TOTAL=$((TOTAL + 1))
if [[ "$bw_read_out" == *"PLAN Z"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: read-plan round-trips the plan in the bare+worktree layout"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: read-plan round-trips the plan in the bare+worktree layout"
  echo "    actual: '$bw_read_out'"
fi
git --git-dir="$bw_root/.bare" worktree prune 2>/dev/null || true
rm -rf "$bw_root"

# 5b. malformed-URL format guard: SSH-with-port → read-plan rejects it.
# ssh://git@github.com:22/owner/repo.git strips to "22/owner/repo" — two slashes,
# would pass the old */* check but fails the strict ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ regex.
mf_ssh_root=$(make_bare_worktree_fixture ssh://git@github.com:22/owner/repo.git)
if err=$( cd "$mf_ssh_root/worktrees/42-foo" && env -u GH_REPO "$WP_READ" 42 2>&1 1>/dev/null ); then rc=0; else rc=$?; fi
assert_eq "read-plan: SSH-with-port malformed URL exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"unexpected owner/repo format"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: read-plan rejects SSH-with-port malformed URL with format-guard diagnostic"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: read-plan rejects SSH-with-port malformed URL with format-guard diagnostic"
  echo "    actual: '$err'"
fi
git --git-dir="$mf_ssh_root/.bare" worktree prune 2>/dev/null || true
rm -rf "$mf_ssh_root"

# 5c. malformed-URL format guard: non-GitHub remote → write-plan rejects it.
# https://gitlab.com/owner/repo.git has no "github.com" to strip, so repo stays the
# full URL (contains ":") — has slashes, would pass the old */* check but fails the regex.
mf_gl_root=$(make_bare_worktree_fixture https://gitlab.com/owner/repo.git)
if err=$( cd "$mf_gl_root/worktrees/42-foo" && env -u GH_REPO "$WP_WRITE" 42 <<<"PLAN" 2>&1 1>/dev/null ); then rc=0; else rc=$?; fi
assert_eq "write-plan: non-GitHub remote malformed URL exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"remote is not a GitHub repository"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: write-plan rejects non-GitHub remote URL with not-GitHub diagnostic"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: write-plan rejects non-GitHub remote URL with not-GitHub diagnostic"
  echo "    actual: '$err'"
fi
git --git-dir="$mf_gl_root/.bare" worktree prune 2>/dev/null || true
rm -rf "$mf_gl_root"

# 5d. malformed-URL format guard: SSH-with-port → write-plan rejects it.
# Symmetric counterpart to 5b: same ssh://git@github.com:22/owner/repo.git fixture,
# exercised against dispatch-write-plan instead of dispatch-read-plan.
mf_ssh_w_root=$(make_bare_worktree_fixture ssh://git@github.com:22/owner/repo.git)
if err=$( cd "$mf_ssh_w_root/worktrees/42-foo" && env -u GH_REPO "$WP_WRITE" 42 <<<"PLAN" 2>&1 1>/dev/null ); then rc=0; else rc=$?; fi
assert_eq "write-plan: SSH-with-port malformed URL exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"unexpected owner/repo format"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: write-plan rejects SSH-with-port malformed URL with format-guard diagnostic"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: write-plan rejects SSH-with-port malformed URL with format-guard diagnostic"
  echo "    actual: '$err'"
fi
git --git-dir="$mf_ssh_w_root/.bare" worktree prune 2>/dev/null || true
rm -rf "$mf_ssh_w_root"

# 5e. malformed-URL format guard: non-GitHub remote → read-plan rejects it.
# Symmetric counterpart to 5c: same https://gitlab.com/owner/repo.git fixture,
# exercised against dispatch-read-plan instead of dispatch-write-plan.
mf_gl_r_root=$(make_bare_worktree_fixture https://gitlab.com/owner/repo.git)
if err=$( cd "$mf_gl_r_root/worktrees/42-foo" && env -u GH_REPO "$WP_READ" 42 2>&1 1>/dev/null ); then rc=0; else rc=$?; fi
assert_eq "read-plan: non-GitHub remote malformed URL exits 1" "1" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$err" == *"remote is not a GitHub repository"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: read-plan rejects non-GitHub remote URL with not-GitHub diagnostic"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: read-plan rejects non-GitHub remote URL with not-GitHub diagnostic"
  echo "    actual: '$err'"
fi
git --git-dir="$mf_gl_r_root/.bare" worktree prune 2>/dev/null || true
rm -rf "$mf_gl_r_root"

# 7. two-matching-plan-comments: when the store contains two comments both
#    authored by plan-bot and both carrying the marker, read-plan must return
#    the FIRST one without a SIGPIPE-induced exit-141 failure, and write-plan
#    must PATCH that first comment (not POST a third) and also exit 0. Guards the
#    #1643 regression: the old `| head -n1` pipeline under `set -euo pipefail`
#    sent SIGPIPE (exit 141) to the upstream jq process when more than one
#    comment matched, causing a spurious non-zero exit with no diagnostic.
#    dispatch-write-plan received the identical `first()` fix at line 65, so a
#    parallel write sub-case below guards write-plan's copy independently.
wp_two=$(mktemp -d); mkdir -p "$wp_two/bin"
sed "s|$WP_STORE|$wp_two/store.json|; s|$WP_COUNTER|$wp_two/counter|" \
  "$wp_root/bin/gh" > "$wp_two/bin/gh"
chmod +x "$wp_two/bin/gh"
echo '0' > "$wp_two/counter"
# Seed two marker comments both authored by plan-bot; write directly (write-plan
# enforces the at-most-one invariant, so seeding two requires bypassing it).
MARKER='<!-- dispatch:plan -->'
jq -nc --arg m "$MARKER" \
  '[{id:1, body:($m + "\nFIRST PLAN"), user:{id:9001, login:"plan-bot"}},
    {id:2, body:($m + "\nSECOND PLAN"), user:{id:9001, login:"plan-bot"}}]' \
  > "$wp_two/store.json"
read_out=$(PATH="$wp_two/bin:$SAVED_PATH" "$WP_READ" 7) && rc=0 || rc=$?
assert_eq "read-plan: two matching plan comments exit 0 (no SIGPIPE under pipefail, #1643)" "0" "$rc"
TOTAL=$((TOTAL + 1))
if [[ "$read_out" == *"FIRST PLAN"* && "$read_out" == *"$MARKER"* ]]; then
  PASS=$((PASS + 1)); echo "  PASS: read-plan returns first matching comment with marker (two-comment store)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: read-plan returns first matching comment with marker (two-comment store)"
  echo "    actual: '$read_out'"
fi

# 7b. write-plan against the same two-matching-comment store: write-plan's own
#     `first()` scan (line 65) must exit 0 (no SIGPIPE under pipefail) and PATCH
#     the FIRST matching comment in place — store length stays 2 (no third POST)
#     and comment id 1's body is updated. The read sub-case above does NOT cover
#     write-plan's copy of the fix; this guards it independently (#1643).
if PATH="$wp_two/bin:$SAVED_PATH" "$WP_WRITE" 7 <<<"UPDATED PLAN"; then wp_two_rc=0; else wp_two_rc=$?; fi
assert_eq "write-plan: two matching plan comments exit 0 (no SIGPIPE under pipefail, #1643)" "0" "$wp_two_rc"
assert_eq "write-plan: two matching plan comments → PATCH first, no third POST (store length 2)" \
  "2" "$(jq 'length' "$wp_two/store.json")"
TOTAL=$((TOTAL + 1))
if jq -e --arg m "$MARKER" '.[] | select(.id == 1) | (.body | contains($m) and contains("UPDATED PLAN"))' "$wp_two/store.json" >/dev/null; then
  PASS=$((PASS + 1)); echo "  PASS: write-plan PATCHes the first matching comment (id 1 body updated)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: write-plan PATCHes the first matching comment (id 1 body updated)"
  echo "    actual: '$(jq -c '.[] | select(.id == 1) | .body' "$wp_two/store.json")'"
fi
rm -rf "$wp_two"

# <<< END MOVED <<<

# NOTE (tactic-dispatch-test-monolith-split, Unit 2 deviation): the
# dispatch-write-recommendation section (originally lines 26071-26187) is
# appended here instead of living in its own test-dispatch-write-recommendation.sh.
# Its body reads `$wp_root/bin/gh` (the write-plan fake-gh emulator created
# above) to keep the two emulator bodies byte-identical, and its own trailing
# `rm -rf "$wp_root"` cleans that directory up. Splitting it into a separate
# file/process would break that same-process variable sharing (observed at
# runtime: `wp_root: unbound variable`). Widening the range into this file is
# the documented fix for a genuine cross-section dependency.
# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-write-recommendation tests (#2244)
# ============================================================================
echo ""
echo "=== dispatch-write-recommendation ==="
#
# dispatch-write-recommendation is a clone of dispatch-write-plan with the marker
# swapped to <!-- dispatch:recommended-steps -->. Reuse the same generic `gh api`
# comment-store emulator (the write-plan fake gh body) over a fresh store, and
# verify find-or-update (POST then in-place PATCH, no stacking), marker-on-first-
# line, and the empty-STDIN / bad-arg clear errors (exit 2).
wr_root=$(mktemp -d)
mkdir -p "$wr_root/bin"
WR_STORE="$wr_root/store.json"
WR_COUNTER="$wr_root/counter"
echo '[]' > "$WR_STORE"
echo '0' > "$WR_COUNTER"
cat > "$wr_root/bin/gh" <<WRGH
#!/usr/bin/env bash
set -uo pipefail
STORE="$WR_STORE"
COUNTER="$WR_COUNTER"
WRGH
# Reuse the generic emulator body from the write-plan fake gh (everything from
# method="GET" onward) so the two stay byte-identical.
sed -n '/^method="GET"/,$p' "$wp_root/bin/gh" >> "$wr_root/bin/gh"
chmod +x "$wr_root/bin/gh"
bash -n "$wr_root/bin/gh" || { FAIL=$((FAIL + 1)); echo "  FAIL: write-recommendation fake gh is not valid bash"; }

WR_WRITE="$SCRIPT_DIR/dispatch-write-recommendation"
WR_MARKER='<!-- dispatch:recommended-steps -->'
# Pin the trusted author id (same env var the writer shares with dispatch-write-plan)
# so the fake-gh-stamped author (9001) matches the author-filtered find scan.
export DISPATCH_PLAN_AUTHOR_ID=9001

# 1. POST-creates: empty store → one comment carrying the marker + REC A.
if ! PATH="$wr_root/bin:$SAVED_PATH" "$WR_WRITE" 7 <<<"REC A"; then
  FAIL=$((FAIL + 1)); echo "  FAIL: write-recommendation (test 1) failed unexpectedly"
fi
assert_eq "write-recommendation: one comment after first write" "1" "$(jq 'length' "$WR_STORE")"
TOTAL=$((TOTAL + 1))
if jq -e --arg m "$WR_MARKER" '.[0].body | contains($m) and contains("REC A")' "$WR_STORE" >/dev/null; then
  PASS=$((PASS + 1)); echo "  PASS: first comment carries the recommended-steps marker and REC A"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: first comment carries the recommended-steps marker and REC A"
fi

# 2. marker is the first line of the body.
TOTAL=$((TOTAL + 1))
wr_first_line=$(jq -r '.[0].body' "$WR_STORE" | head -1)
if [[ "$wr_first_line" == "$WR_MARKER" ]]; then
  PASS=$((PASS + 1)); echo "  PASS: the marker is the first line of the comment body"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: the marker is the first line of the comment body"
  echo "    actual: '$wr_first_line'"
fi

# 3. PATCH-in-place: re-run updates the same comment; still exactly one comment.
if ! PATH="$wr_root/bin:$SAVED_PATH" "$WR_WRITE" 7 <<<"REC B"; then
  FAIL=$((FAIL + 1)); echo "  FAIL: write-recommendation (test 3) failed unexpectedly"
fi
assert_eq "write-recommendation: still one comment after update" "1" "$(jq 'length' "$WR_STORE")"
TOTAL=$((TOTAL + 1))
if jq -e '.[0].body | contains("REC B") and (contains("REC A") | not)' "$WR_STORE" >/dev/null; then
  PASS=$((PASS + 1)); echo "  PASS: update replaces REC A with REC B in place (no stacking)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: update replaces REC A with REC B in place (no stacking)"
fi

# 4. empty STDIN → clear error, exit 2.
if PATH="$wr_root/bin:$SAVED_PATH" "$WR_WRITE" 7 </dev/null 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "write-recommendation: empty STDIN exits 2" "2" "$rc"

# 5. non-numeric (flag-like) arg → clear error, exit 2.
if PATH="$wr_root/bin:$SAVED_PATH" "$WR_WRITE" "--repo other/repo" <<<"REC" 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "write-recommendation: non-numeric arg exits 2" "2" "$rc"

# 6. missing arg → clear error, exit 2.
if PATH="$wr_root/bin:$SAVED_PATH" "$WR_WRITE" <<<"REC" 2>/dev/null; then rc=0; else rc=$?; fi
assert_eq "write-recommendation: missing arg exits 2" "2" "$rc"

# 7. marker-in-prose regression (#2244): a DIFFERENT comment that merely DOCUMENTS
#    the recommended-steps marker in its prose (here a dispatch:plan comment whose
#    body describes the marker) must NOT be matched and overwritten in place. The
#    writer must POST a fresh comment, not PATCH the documenting one. This guards
#    the first-line (startswith) anchoring against the substring-`contains` find
#    that clobbered the #2244 plan comment. Against the pre-fix `contains` predicate
#    this seeds length 1 → PATCH → stays length 1 (clobbered); the fix POSTs → 2.
jq -nc --arg rm "$WR_MARKER" \
  '[{id:1, body:("<!-- dispatch:plan -->\n## Plan\nUnit 1 clones the writer with the marker " + $rm + " (collision-free)."), user:{id:9001, login:"plan-bot"}}]' \
  > "$WR_STORE"
echo 1 > "$WR_COUNTER"
if ! PATH="$wr_root/bin:$SAVED_PATH" "$WR_WRITE" 7 <<<"FRESH REC"; then
  FAIL=$((FAIL + 1)); echo "  FAIL: write-recommendation (marker-in-prose) failed unexpectedly"
fi
assert_eq "write-recommendation: documenting comment NOT clobbered (store grows to 2)" \
  "2" "$(jq 'length' "$WR_STORE")"
TOTAL=$((TOTAL + 1))
if jq -e '.[] | select(.id==1) | .body | startswith("<!-- dispatch:plan -->")' "$WR_STORE" >/dev/null \
   && jq -e '.[] | select(.id==1) | .body | contains("Unit 1 clones")' "$WR_STORE" >/dev/null; then
  PASS=$((PASS + 1)); echo "  PASS: the dispatch:plan comment is left intact (not overwritten)"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: the dispatch:plan comment is left intact (not overwritten)"
fi
TOTAL=$((TOTAL + 1))
if jq -e --arg m "$WR_MARKER" '.[] | select(.body|startswith($m)) | select(.body|contains("FRESH REC"))' "$WR_STORE" >/dev/null; then
  PASS=$((PASS + 1)); echo "  PASS: a fresh recommended-steps comment was POSTed alongside it"
else
  FAIL=$((FAIL + 1)); echo "  FAIL: a fresh recommended-steps comment was POSTed alongside it"
fi

unset DISPATCH_PLAN_AUTHOR_ID
rm -rf "$wr_root"

rm -rf "$wp_root"
unset DISPATCH_PLAN_AUTHOR_ID

# <<< END MOVED <<<

report_results
