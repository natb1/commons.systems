#!/usr/bin/env bash
# lint-verify-fence-paths.sh — fail at the commit that orphans a fence-named path.
#
# THE INCIDENT CLASS THIS CLOSES: a script named inside a ```verify fence in a
# live (non-`done`) intention-node body was deleted, and nothing caught it.
# Each downstream node then hit the deletion at its OWN verification gate, as a
# generic "No such file or directory" — which every phase lane treats as an
# ambiguous failure, so the lane reverts and parks the node for human review.
# The signal arrived once per node, late, disguised, and expensive.
#
# This checker moves the signal to the commit that DELETES the file, in CI,
# loudly: for every non-`done` node it extracts the ```verify blocks (via the
# shared lib-verify-fence.sh parser, the same walk dispatch-run-verification
# runs) and asserts that every path-like token in them still exists.
#
# `done` nodes are NEVER scanned: their bodies are historical archives by
# design and may legitimately name paths that no longer exist.
#
# It is wired into run-lint.sh UNCONDITIONALLY — not behind a changed-files
# flag. That is deliberate: the failure mode is a DELETION, and any
# changed-files gate that stats the path on disk (lib.sh's `is_shell_script`,
# which drives RUN_PROSE) returns false for a deleted file, leaving exactly the
# case this guard exists to catch uncovered.
#
# TOKEN RULE (deliberately narrow — a false positive here would recreate the
# very park problem the guard prevents). Each verify-block line is split on
# whitespace; a token is a candidate only if ALL hold:
#   - it contains `/`
#   - it contains none of  $ * ? { } ( )   (no variables, no globs, no subshell)
#   - it is not a URL (no `://`)
#   - its first path segment is a top-level entry of the repo — live on disk,
#     present at HEAD or origin/main, or one git history shows once existed
#     (all read live, never a hardcoded list)
# A trailing `:<line>` or `:<line>-<line>` anchor is stripped before the
# existence test. Everything else is ignored.
#
# The leading-segment filter must NOT be derived from the post-deletion working
# tree alone. The largest deletions — removing or renaming a whole top-level
# app/package — take the segment itself away, so every orphaned path beneath it
# would lose its key and be silently skipped: the guard would fail OPEN at
# exactly its highest blast radius. Hence the union with HEAD, origin/main and
# the history snapshot below. Widening the CANDIDATE set adds no false
# positives — the `-e` and ever-existed gates still do the deciding.
#
# ORPHAN vs FORWARD REFERENCE: a missing path is reported only if git history
# shows it once existed. Plans legitimately name files their own unit will
# CREATE, and those never existed — flagging them would park the node this
# guard protects. See the EVER snapshot below.
#
# Output: one `<node-id>: <path>` line per miss on stdout; that message IS the
# remediation (it names exactly what to fix and where). Exit 1 if any miss
# survives the baseline, else exit 0 with no output.
#
# SECOND, ADVISORY CHECK — swallowed statement status. dispatch-run-verification
# runs each block as plain `bash <tmpfile>` with NO `set -e`, so in a
# multi-statement block only the LAST statement decides pass/fail. An earlier
# assertion can fail while the fence reports PASS. Measured 2026-08-30: 7 such
# false-passing fences under intentions/, two of them on nodes that had already
# reached a terminal phase behind the gate. That 7 counts THIS mechanism only —
# a discarded non-final status. It is deliberately not a corpus-wide false-pass
# count: at least one further fence passes falsely by INVERTED POLARITY (a
# negated grep whose intent is absence, exiting 0 while printing violating
# hits), which this check does not and cannot detect.
#
# This check WARNS on stderr and NEVER changes the exit status. That is
# deliberate and load-bearing: the statement split is line-wise and therefore
# approximate, and an approximate signal must not be able to break a build. The
# path-orphan check above owns the exit status alone.
#
# KNOWN LIMITATIONS of that line-wise split. Each is RECORDED here rather than
# fixed because no live block under intentions/ exercises it today, and each
# produces a FALSE POSITIVE (noise) rather than a miss — none of them can hide a
# swallowed assertion. Re-read this list before trusting a surprising warning.
#
#   1. HEREDOC PAYLOAD. Nothing here knows about `<<WORD` / `<<-WORD`, so every
#      line of a heredoc body — and the terminator line itself — is parsed as a
#      top-level statement: `cat <<EOF > f` / `payload` / `EOF` warns on the
#      payload line and on the literal `EOF`.
#   2. FUNCTION BODY. `}` is a closer but `{` is not an opener, so an
#      `f() {` … `}` definition warns on the definition line and on each body
#      line, though a body line does not run at that point at all. Only a later
#      CALL to `f` is a true positive. (The `depth > 0` guard on the closer
#      keeps the unmatched `}` from driving depth negative.)
#   3. OPERATOR CONTINUATION. Backslash continuations and unbalanced-quote
#      continuations are rejoined; a statement continued by a TRAILING `|`,
#      `&&` or `||` is not. `foo |` / `grep -q bar` is split in two and the
#      continuation half warned as an independent statement, though the
#      pipeline's status is never independently discarded.
#
# Measured blast radius, 2026-08-30, with the anchored exemptions below: 61 of
# the 585 scanned blocks warn — 45 nodes, 126 warning lines. `done` nodes are
# exempt from this check too, since they are exempt from the scan loop
# entirely, so they never reach the 585. That is two warning lines MORE than
# the 124 this check reported at introduction, on the same 61 blocks and 45
# nodes: the two `printf … | grep -q …` assertions in
# tactic-dispatch-pause-config-field that the old head-word exemption swallowed.
# Every warning it already emitted is unchanged. Any future edit here must move
# this count UP or leave it flat — a DROP means an exemption widened, which is
# the one failure this check cannot show you.
#
# --no-status-warn silences it (used by this script's own test fixtures, which
# assert on exactly-empty combined output).
#
# Usage:
#   lint-verify-fence-paths.sh [--intentions-dir DIR] [--repo-root DIR]
#                              [--baseline FILE] [--no-status-warn]
#
# --repo-root defaults to the repo containing the CWD (not the one containing
# this script). When the script is invoked from a checkout other than the one
# it lives in, --repo-root is REQUIRED — see the resolution block below.
#
# Exit codes:
#   0  no violations (or every violation is grandfathered by the baseline)
#   1  at least one new violation
#   2  bad usage / unreadable input
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib-verify-fence.sh
source "$SCRIPT_DIR/lib-verify-fence.sh"

REPO_ROOT=""
INTENTIONS_DIR=""
BASELINE_FILE="$SCRIPT_DIR/verify-fence-path-baseline.json"
STATUS_WARN=true

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo-root)
      [[ $# -lt 2 ]] && { echo "lint-verify-fence-paths.sh: --repo-root requires an argument" >&2; exit 2; }
      REPO_ROOT="$2"; shift 2 ;;
    --intentions-dir)
      [[ $# -lt 2 ]] && { echo "lint-verify-fence-paths.sh: --intentions-dir requires an argument" >&2; exit 2; }
      INTENTIONS_DIR="$2"; shift 2 ;;
    --baseline)
      [[ $# -lt 2 ]] && { echo "lint-verify-fence-paths.sh: --baseline requires an argument" >&2; exit 2; }
      BASELINE_FILE="$2"; shift 2 ;;
    --no-status-warn)
      STATUS_WARN=false; shift ;;
    -h|--help)
      echo "usage: lint-verify-fence-paths.sh [--intentions-dir DIR] [--repo-root DIR] [--baseline FILE] [--no-status-warn]"
      echo "  0  no violations   1  at least one new violation   2  bad usage"
      exit 0 ;;
    *)
      echo "lint-verify-fence-paths.sh: unexpected argument: $1" >&2
      echo "usage: lint-verify-fence-paths.sh [--intentions-dir DIR] [--repo-root DIR] [--baseline FILE] [--no-status-warn]" >&2
      exit 2 ;;
  esac
done

if [[ -z "$REPO_ROOT" ]]; then
  # Resolve from the CALLER's CWD — the same rule every sibling linter uses
  # (lint-prose-rules.sh, lint-ds-drift.sh, get-changed-apps.sh). The tree under
  # test is the one the caller is standing in, never the one this script file
  # happens to live in: resolving from $SCRIPT_DIR would make main's copy of the
  # script scan main's intentions/ while the rest of run-lint.sh scanned the
  # worktree, and report PASS for a branch it never looked at.
  if ! REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"; then
    echo "lint-verify-fence-paths.sh: could not resolve the repo root from $PWD" >&2
    exit 2
  fi
  # Running one checkout's copy of this script against a DIFFERENT checkout is a
  # routine dispatch pattern (main's scripts, a worktree CWD), but it is only
  # safe when the target is named explicitly. With no --repo-root the two trees
  # disagree and either guess is silently wrong, so refuse and name the flag
  # that resolves it.
  SCRIPT_REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null || true)"
  if [[ -n "$SCRIPT_REPO_ROOT" && "$SCRIPT_REPO_ROOT" != "$REPO_ROOT" ]]; then
    echo "lint-verify-fence-paths.sh: script lives in $SCRIPT_REPO_ROOT but the CWD resolves to $REPO_ROOT;" >&2
    echo "  pass --repo-root to name the tree to scan" >&2
    exit 2
  fi
fi
INTENTIONS_DIR_EXPLICIT=false
if [[ -n "$INTENTIONS_DIR" ]]; then
  INTENTIONS_DIR_EXPLICIT=true
else
  INTENTIONS_DIR="$REPO_ROOT/intentions"
fi

if [[ ! -d "$INTENTIONS_DIR" ]]; then
  if [[ "$INTENTIONS_DIR_EXPLICIT" == true ]]; then
    echo "lint-verify-fence-paths.sh: not a directory: $INTENTIONS_DIR" >&2
    exit 2
  fi
  # Default-resolved path, not explicitly named: a repo with no intentions/
  # directory has no nodes to check, which is a legitimate empty-repo state
  # (e.g. run-lint.sh's own test fixtures build ephemeral repos with no
  # intentions/ at all) — nothing to check is a pass, not an error.
  exit 0
fi

# --- Grandfather baseline ---------------------------------------------------
# Same rollout pattern as packages/intentionsutil/prose-ref-baseline.json and
# plan-body-baseline.json: a JSON array of {id, path} objects naming violations
# that already existed when this check landed, so introducing the check does not
# retroactively break main. It ships EMPTY (a sibling unit swept every live
# violation first) and it must NOT grow: a newly orphaned fence path is a
# violation to FIX, not a baseline entry to add.
declare -A BASELINE=()
if [[ ! -f "$BASELINE_FILE" ]]; then
  echo "lint-verify-fence-paths.sh: baseline file not found: $BASELINE_FILE" >&2
  exit 2
fi
if ! BASELINE_KEYS="$(jq -r 'if (type == "array") and (all(.[]; type == "object" and (.id | type == "string") and (.path | type == "string")))
                             then (.[] | "\(.id)|\(.path)")
                             else error("expected a JSON array of {id, path} objects") end' "$BASELINE_FILE" 2>&1)"; then
  echo "lint-verify-fence-paths.sh: malformed baseline: $BASELINE_FILE: $BASELINE_KEYS" >&2
  exit 2
fi
while IFS= read -r key; do
  [[ -z "$key" ]] && continue
  BASELINE["$key"]=1
done <<<"$BASELINE_KEYS"

# --- History snapshot: every path that ever existed -------------------------
# ONE bulk history query per run, never one `git log` fork per candidate token.
# A per-token fork is pathological: for a path with NO history git walks the
# whole commit graph to the root before returning empty, so the cost is set by
# node-body content — a single node body carrying a few thousand nonexistent
# path tokens turned a 7.5s scan into ~2 minutes, and every branch's lint job
# pays it for as long as the body lives on main. One `git log` gives the same
# discriminator (did this path EVER exist?) at a fixed cost.
#
# `--no-renames` is load-bearing: with rename detection on, a rename is one `R`
# entry naming only the NEW path, so the old path — orphaned by that very commit
# — would never enter the map. `--no-renames` decomposes it into A + D.
#
# Directory tokens: git tracks files, not directories, so each path is expanded
# into its ancestor prefixes. That preserves the old `git log -- <path>`
# pathspec behaviour, where naming a directory matched the files beneath it.
declare -A EVER=()
if ! HISTORY_RAW="$(git -C "$REPO_ROOT" -c core.quotePath=false log --no-renames \
                      --diff-filter=AD --name-only --pretty=format: HEAD 2>&1)"; then
  echo "lint-verify-fence-paths.sh: could not read git history under $REPO_ROOT: $HISTORY_RAW" >&2
  exit 2
fi
while IFS= read -r hist_path; do
  [[ -n "$hist_path" ]] || continue
  EVER["$hist_path"]=1
done < <(printf '%s\n' "$HISTORY_RAW" |
           awk 'NF { print; while (sub(/\/[^\/]*$/, "")) print }' | sort -u)
unset HISTORY_RAW

# --- Top-level repo entries -------------------------------------------------
# Read live rather than hardcoded, so the leading-segment filter tracks the repo
# instead of a stale guess — and unioned with HEAD, origin/main and the history
# snapshot, so a commit that DELETES or RENAMES a whole top-level tree still
# qualifies the tokens beneath it as candidates (see the header note).
declare -A TOPLEVEL=()
for entry in "$REPO_ROOT"/* "$REPO_ROOT"/.*; do
  base="$(basename "$entry")"
  [[ "$base" == "." || "$base" == ".." ]] && continue
  [[ -e "$entry" ]] || continue
  TOPLEVEL["$base"]=1
done
for ref in HEAD origin/main; do
  # A missing ref (no origin remote in a fixture repo, say) is not an error —
  # the other sources still populate the filter.
  while IFS= read -r name; do
    [[ -n "$name" ]] || continue
    TOPLEVEL["$name"]=1
  done < <(git -C "$REPO_ROOT" -c core.quotePath=false ls-tree --name-only "$ref" 2>/dev/null || true)
done
for hist_path in "${!EVER[@]}"; do
  [[ "$hist_path" == */* ]] && continue
  TOPLEVEL["$hist_path"]=1
done

# Read a node file's frontmatter `phase` value (empty when absent). Only the
# leading `---` block is inspected, so a `phase:` line in the BODY (e.g. prose
# documenting the phase enum) is never mistaken for frontmatter.
node_phase() {
  local file="$1"
  awk '
    NR == 1 { if ($0 != "---") exit; next }
    $0 == "---" { exit }
    /^phase:[[:space:]]*/ {
      sub(/^phase:[[:space:]]*/, "")
      sub(/[[:space:]]+$/, "")
      print
      exit
    }
  ' "$file"
}

# --- Shell-shape helpers for the advisory check below ----------------------
# Both answer a question the obvious one-line test gets WRONG, and both get it
# wrong in the same direction: they exempt or discard a statement that really is
# unguarded, so the miss is invisible.

# Is this line's shell quoting closed at end-of-line? Counting quote characters
# cannot answer it: `grep -q 'AW_DISP" == "pruned"'` has an odd `"` count while
# being balanced, and `echo "don't panic"` an odd `'` count. A miscount is not
# cosmetic — the line is then treated as a continuation, absorbing the whole
# REST of the block, so every statement after it vanishes from the analysis.
# Track the STATE instead: inside `'…'` only the closing `'` is special; inside
# `"…"` a backslash escapes the next character.
quoting_balanced() {
  local s="$1" in_s=0 in_d=0 ch j
  for (( j = 0; j < ${#s}; j++ )); do
    ch="${s:j:1}"
    if (( in_s )); then
      [[ "$ch" == "'" ]] && in_s=0
      continue
    fi
    if (( in_d )); then
      if [[ "$ch" == '\' ]]; then j=$(( j + 1 ))
      elif [[ "$ch" == '"' ]]; then in_d=0
      fi
      continue
    fi
    case "$ch" in
      "'") in_s=1 ;;
      '"') in_d=1 ;;
      '\') j=$(( j + 1 )) ;;
    esac
  done
  (( in_s == 0 && in_d == 0 ))
}

# Is this statement nothing but variable assignments? A leading `^NAME=` cannot
# say: it also matches an env-var-PREFIXED command (`NODE_ENV=test npx vitest
# run`, `DISPATCH_CONFIG_DIR="$d" some-script --flag`), a real command whose
# status is discarded like any other. Plain whitespace splitting cannot say
# either, because an assignment's value legitimately contains spaces
# (`out=$(cmd a b)`, `msg="a b"`) and warning on THOSE would be a false positive
# on the corpus's most common shape. So split into TOP-LEVEL words, honouring
# quoting and `$( … )` / `${ … }` nesting, and require every word to assign.
assignments_only() {
  local s="$1" ch i in_s=0 in_d=0 depth=0 word="" w
  local -a words=()
  for (( i = 0; i < ${#s}; i++ )); do
    ch="${s:i:1}"
    if (( in_s )); then
      [[ "$ch" == "'" ]] && in_s=0
      word+="$ch"; continue
    fi
    if (( in_d )); then
      [[ "$ch" == '"' ]] && in_d=0
      word+="$ch"; continue
    fi
    case "$ch" in
      "'") in_s=1; word+="$ch" ;;
      '"') in_d=1; word+="$ch" ;;
      '\') word+="$ch"; i=$(( i + 1 )); word+="${s:i:1}" ;;
      '('|'{') depth=$(( depth + 1 )); word+="$ch" ;;
      ')'|'}') (( depth > 0 )) && depth=$(( depth - 1 )); word+="$ch" ;;
      ' '|$'\t')
        if (( depth > 0 )); then
          word+="$ch"
        else
          [[ -n "$word" ]] && words+=("$word")
          word=""
        fi ;;
      *) word+="$ch" ;;
    esac
  done
  [[ -n "$word" ]] && words+=("$word")
  [[ "${#words[@]}" -ge 1 ]] || return 1
  for w in "${words[@]}"; do
    [[ "$w" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]] || return 1
  done
  return 0
}

# --- Advisory: a non-final statement whose exit status the runner discards ---
# See the header. WARN only: stderr, never $FOUND. A statement is NOT reported
# when the author already reasoned about exit status (`!`-prefixed,
# `&&`/`||`-joined, `$?`-captured), when the block turns on errexit itself, or
# when it is nothing but assignments, or a pure output/control builtin STANDING
# ALONE, rather than an assertion. Statements are split line-wise, with
# backslash continuations and unbalanced-quote continuations rejoined and
# `if/for/while/until/case` bodies treated as one top-level statement.
#
# Every exemption below is ANCHORED rather than tested as a raw substring, a
# head word or a leading regex. Each of those shortcuts exempts a statement
# whose status really is discarded — a miss in the single direction this check
# exists to close, and the direction in which a miss is invisible.
#
# Two `set -e` traps this function deliberately avoids. The script runs under
# `set -euo pipefail`, so (1) `(( depth++ ))` is NOT used — it returns rc 1 when
# `depth` is 0 (post-increment yields the OLD value) and would abort the script;
# `depth=$(( depth + 1 ))` is used instead. (2) Every bare `[[ … ]]` test is the
# left side of an `&&` or `||` list, which errexit exempts.
warn_unguarded_statements() {
  local node_id="$1" block="$2"
  # Anchor the errexit exemption to a line that actually RUNS `set -e`. A raw
  # substring test over the whole block also matches `set -e` quoted inside
  # another command — `bash -c 'set -e; …'`, or a fence asserting on the string
  # with `grep -q 'set -e' <file>`, both live idioms here — and would exempt a
  # block that never enables errexit at its own top level. That is the worst
  # shape of miss: the block reads as "the author already handled it".
  if grep -qE '^[[:space:]]*set[[:space:]]+(-[a-zA-Z]*e|-o[[:space:]]+errexit)' <<<"$block"; then
    return 0
  fi

  local line s cont="" depth=0 i last
  local -a stmts=()
  while IFS= read -r line; do
    s="${line#"${line%%[![:space:]]*}"}"; s="${s%"${s##*[![:space:]]}"}"
    [[ -n "$cont" ]] && { s="$cont $s"; cont=""; }
    [[ -z "$s" || "$s" == \#* ]] && continue
    if [[ "$s" == *\\ ]]; then cont="${s%\\}"; continue; fi
    if ! quoting_balanced "$s"; then cont="$s"; continue; fi
    case "$s" in
      fi|done|esac|'}'|'};'|'fi;'|'done;'|'esac;')
        (( depth > 0 )) && depth=$(( depth - 1 )); continue ;;
      if\ *|for\ *|while\ *|until\ *|case\ *)
        [[ "$depth" -eq 0 ]] && stmts+=("$s")
        # A compound written entirely on ONE line closes itself. Incrementing
        # for it would leave `depth` permanently above 0, and the `depth -eq 0`
        # guards below would then silently drop every LATER statement in the
        # block — including the real final one, so the block stops being
        # analysed at all from that line on.
        case "$s" in
          *[\ \;]fi|*[\ \;]fi\;|*[\ \;]done|*[\ \;]done\;|*[\ \;]esac|*[\ \;]esac\;) ;;
          *) depth=$(( depth + 1 )) ;;
        esac
        continue ;;
    esac
    [[ "$depth" -eq 0 ]] && stmts+=("$s")
  done <<<"$block"

  [[ "${#stmts[@]}" -ge 2 ]] || return 0
  last=$(( ${#stmts[@]} - 1 ))
  for (( i = 0; i < last; i++ )); do
    s="${stmts[i]}"
    [[ "$s" == '!'* || "$s" == *'&&'* || "$s" == *'||'* || "$s" == *'$?'* ]] && continue
    assignments_only "$s" && continue
    # Output/control builtins carry no assertion — but only when the builtin IS
    # the whole statement. `printf '%s' "$out" | grep -q x` is an assertion
    # whose status the runner discards like any other, and it is this repo's
    # standard "assert on captured output" idiom; matching the HEAD WORD alone
    # exempts the entire pipeline and misses exactly the class this check
    # exists to find.
    [[ "$s" != *'|'* && "$s" =~ ^(echo|printf|set|shift|exit|return|unset|local|declare|export|:|if|for|while|until|case)([[:space:]]|$) ]] && continue
    echo "lint-verify-fence-paths.sh: WARN $node_id: a non-final verify statement's exit status is discarded (the runner adds no 'set -e', so only the last statement decides): $s" >&2
  done
  return 0
}

FOUND=0
declare -A SEEN=()

# Per-node scan cap. The body is slurped whole into a shell variable, so an
# oversized node is unbounded memory on the runner. The cap is generous — well
# above the largest real node — and a skip is REPORTED on stderr rather than
# silently swallowed, so a node that outgrows it is visible instead of quietly
# unchecked.
MAX_NODE_BYTES=1048576

for file in "$INTENTIONS_DIR"/*.md; do
  [[ -e "$file" ]] || continue
  node_id="$(basename "$file" .md)"

  # Archive exemption: a `done` node's body is a historical record.
  [[ "$(node_phase "$file")" == "done" ]] && continue

  node_bytes="$(wc -c < "$file")"
  if (( node_bytes > MAX_NODE_BYTES )); then
    echo "lint-verify-fence-paths.sh: skipped $node_id: ${node_bytes}B exceeds the ${MAX_NODE_BYTES}B per-node scan cap" >&2
    continue
  fi

  body="$(tr -d '\0' < "$file")"
  declare -a blocks=()
  unclosed=0
  extract_verify_blocks "$body" blocks unclosed
  # An unclosed fence is an authoring problem for dispatch-run-verification to
  # report (exit 5), not a dead path — nothing to check here.
  [[ "$unclosed" -eq 1 ]] && continue
  [[ "${#blocks[@]}" -eq 0 ]] && continue

  for block in "${blocks[@]}"; do
    # Advisory only; must be an `if`, not `[[ … ]] && f`, because a false test
    # would return 1 mid-loop-body and errexit would abort the scan.
    if [[ "$STATUS_WARN" == true ]]; then
      warn_unguarded_statements "$node_id" "$block"
    fi
    while IFS= read -r line; do
      declare -a tokens=()
      read -r -a tokens <<<"$line" || true
      for token in "${tokens[@]:-}"; do
        [[ -z "$token" ]] && continue
        # Strip surrounding shell quoting/backticks and trailing separators;
        # they are punctuation of the surrounding command, not part of a path.
        while [[ "$token" == [\"\'\`]* ]]; do token="${token#?}"; done
        while [[ "$token" == *[\"\'\`,\;] ]]; do token="${token%?}"; done
        [[ -z "$token" ]] && continue

        [[ "$token" == */* ]] || continue
        [[ "$token" == *'://'* ]] && continue
        case "$token" in
          *'$'*|*'*'*|*'?'*|*'{'*|*'}'*|*'('*|*')'*) continue ;;
        esac

        # Leading path segment must be a real top-level entry of the repo.
        # (Empty when the token is absolute — an absolute path is not a
        # repo-relative reference, so it is ignored.)
        head_seg="${token%%/*}"
        [[ -n "$head_seg" ]] || continue
        [[ -n "${TOPLEVEL["$head_seg"]:-}" ]] || continue

        # Strip a trailing `:<line>` / `:<line>-<line>` anchor.
        stripped="$token"
        if [[ "$stripped" =~ ^(.*):[0-9]+(-[0-9]+)?$ ]]; then
          stripped="${BASH_REMATCH[1]}"
        fi
        [[ -n "$stripped" ]] || continue

        [[ -e "$REPO_ROOT/$stripped" ]] && continue

        # A missing path is only an ORPHAN if it once existed. A plan's verify
        # block routinely names files the unit will CREATE (its own new test
        # file, a new script) — those never existed, have no git history, and
        # flagging them would be a false positive that parks the very node the
        # guard exists to protect. The EVER snapshot of HEAD's history is the
        # exact discriminator: absent for a forward reference, present for a
        # path a commit created and a later commit deleted — including the
        # deleting commit itself, which is when this guard must fire.
        [[ -n "${EVER["$stripped"]:-}" ]] || continue

        key="$node_id|$stripped"
        [[ -n "${SEEN[$key]:-}" ]] && continue
        SEEN["$key"]=1
        [[ -n "${BASELINE[$key]:-}" ]] && continue

        echo "$node_id: $stripped"
        FOUND=1
      done
    done <<<"$block"
  done
done

exit "$FOUND"
