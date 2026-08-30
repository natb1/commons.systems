#!/usr/bin/env bash
# resolve-diff-base.sh — resolve the single commit a branch-scoped check must
# diff against, or fail loudly saying why it cannot.
#
# WHY THIS EXISTS
#
#   Every change-gated check in this repo used to spell its baseline inline as
#   `git diff ... origin/main...HEAD`. The three-dot form expands to
#   `merge-base(origin/main, HEAD)..HEAD`, so it silently produces an EMPTY
#   diff whenever `merge-base == HEAD` — i.e. whenever HEAD is already
#   contained in origin/main. Every caller reads "empty diff" as "nothing
#   changed, clean pass". The check therefore passes without examining
#   anything: a VACUOUS pass.
#
#   The three live ways that happens:
#     1. On a push to `main`. actions/checkout leaves refs/remotes/origin/main
#        pointing AT the pushed commit, so HEAD == origin/main and the diff is
#        empty. Every change gate reads false and the job goes green having
#        run nothing.
#     2. On a branch already merged into main (a post-merge re-run, a stale
#        worktree, a `--fix` pass after the PR landed).
#     3. From a foreign cwd. A bare `git diff` (no `-C`) resolves against the
#        CURRENT DIRECTORY's repository, not the script's. Invoked by absolute
#        path from another checkout, it diffs the wrong tree — usually clean,
#        hence empty, hence green.
#
#   Per .claude/rules/code-style.md this helper never substitutes a "safe
#   default" for a base it cannot justify. Every unresolvable situation exits
#   non-zero with a named reason.
#
#   Prior art for the same defect class, in this repo:
#   .github/scripts/check-graph-fast-path.sh:5 carries a
#   `# WHY NOT a three-dot git diff origin/main...HEAD:` note, pinned by
#   .github/scripts/test-check-graph-fast-path.sh.
#
# INTERFACE
#
#   resolve-diff-base.sh [--repo-root <dir>]
#                        [--head <ref>]                       (default: HEAD)
#                        [--remote-ref <ref>]                 (default: origin/main)
#                        [--at-remote-tip fail|first-parent]  (default: fail)
#
#   --repo-root names the checkout to resolve against. It defaults to the repo
#   containing the CWD — NOT the one containing this script — and when it is
#   omitted the CWD's root is compared against this script's own root and a
#   divergence is a hard error naming the flag. That is the shape the nearest
#   neighbour in this directory already uses (lint-verify-fence-paths.sh:168-181):
#   it costs no churn at call sites whose cwd is already right, and it still
#   refuses to guess when the two trees disagree. Running one checkout's copy of
#   a script against a DIFFERENT checkout is a routine dispatch pattern, but it
#   is only safe when the target is named explicitly.
#
#   --at-remote-tip governs the case where HEAD carries NO delta against
#   <remote-ref> — i.e. `merge-base(<remote-ref>, HEAD) == HEAD`. That covers
#   two shapes: HEAD is exactly the remote tip, and HEAD is a STRICT ANCESTOR
#   of it.
#     fail          (default) exit 8 at the tip, exit 5 for a strict ancestor.
#                   For checks that are meaningless without a branch delta; the
#                   two codes are kept distinct because the causes and remedies
#                   differ.
#     first-parent  use HEAD^1 as the base — "what this commit introduced" — in
#                   BOTH shapes. Correct for CI checks that must also run on
#                   `main`. The strict-ancestor shape is not an error for such a
#                   caller: it is what a second push to `main` produces while an
#                   earlier run is still in flight, and HEAD^1 answers the
#                   question just as well after the tip has moved on. Failing it
#                   would turn a benign push race into a red required context on
#                   `main`, blocking merges repo-wide.
#                     Every first-parent call site today is ALSO a
#                   developer-invoked script (run-lint.sh, run-unit-tests.sh,
#                   lint-prose-rules.sh, lint-ds-drift.sh, detect-changes.sh).
#                   The strict-ancestor shape there usually just means a stale
#                   local checkout, and used to be exit 5 — the developer's only
#                   signal their tree was behind. Silently narrowing to HEAD^1
#                   would destroy that signal, so this mode prints a same-shape
#                   warning to stderr (not fatal) whenever HEAD != --remote-ref,
#                   naming the narrowed range and telling the reader to fetch and
#                   rebase if this is a local checkout. It is silent only in the
#                   one case that needs to be: HEAD exactly at the remote tip.
#
# STDOUT CONTRACT
#
#   On success: exactly one line, the 40-hex base commit SHA, and nothing else.
#   Callers may safely do BASE=$(resolve-diff-base.sh ...).
#   On failure: stdout is empty.
#
# STDERR CONTRACT
#
#   On success: exactly one provenance line, always, e.g.
#     resolve-diff-base: base=<sha> source=merge-base repo=<root> \
#       head=HEAD@<sha> remote=origin/main@<sha>
#   This line is the audit trail: a run whose base came from the wrong tree or
#   the wrong ref is visible in the CI log instead of silently green.
#   On failure: a multi-line diagnostic naming the condition and the remedy.
#
# EXIT CODES
#
#   0  base resolved; printed on stdout
#   2  usage error (unknown argument, missing argument value, bad
#      --at-remote-tip value)
#   3  the repo root could not be resolved unambiguously: --repo-root is not a
#      directory, or is not inside a git work tree, or --repo-root was omitted
#      and the CWD's root diverges from this script's own root
#   4  --remote-ref does not resolve (not fetched / shallow clone / no remote)
#   5  HEAD is a STRICT ancestor of --remote-ref (already merged, or the
#      checkout is behind) and --at-remote-tip is `fail` (the default) — no
#      defensible base exists for a caller that needs a branch delta.
#      Unreachable under --at-remote-tip first-parent, which resolves this
#      shape to HEAD^1 instead — but still prints a non-fatal stderr warning
#      naming the narrowed range, since this is the one signal a developer on a
#      stale local checkout gets that their tree is behind.
#   6  no merge base between --remote-ref and --head (unrelated histories, or a
#      shallow clone whose grafted history does not reach the fork point)
#   7  --head does not resolve to a commit
#   8  HEAD == --remote-ref and --at-remote-tip is `fail` (the default)
#   9  --at-remote-tip first-parent was requested but HEAD is a root commit
#
# NOT IN SCOPE (deliberately)
#
#   The WORKING TREE. This helper resolves a COMMIT base and says nothing about
#   uncommitted work. `<base>..HEAD` is a commit range, so a working-tree
#   modification is in no commit and is invisible to it — every changed-file
#   tier in run-lint.sh and run-unit-tests.sh is therefore still vacuous on
#   uncommitted work, exactly as it was before. That is a SEPARATE defect with
#   a separate fix (union the range with `git status --porcelain` in a
#   local-invocation mode); it is recorded in
#   plans/dispatch-rsi-batch-steering.md and plans/dispatch-rsi-sequence.md and
#   is not addressed here. CI always runs on a committed tree, so this is a
#   developer-ergonomics gap, not a CI-correctness one.
#
#   MULTI-COMMIT PUSHES. `--at-remote-tip first-parent` answers "what did this
#   push introduce" EXACTLY when the push carried one commit. PR merges do:
#   this repo is squash-only with a linear main. A direct multi-commit push
#   (graph-commit pushes HEAD, and a batched landing can carry more than one
#   commit) fires ONE workflow run at the head commit, so HEAD^1..HEAD sees
#   only the last commit of that push and the earlier ones stay invisible. The
#   exact answer for a push event is GitHub's `github.event.before`; wiring it
#   through the workflow to every consumer is deliberately left out of this
#   change rather than shipped as an unused flag. Narrower hole, same class.
#
#   FETCHING. This helper performs no network I/O and never mutates refs. A
#   STALE origin/main (present locally but behind the true remote) yields a
#   base that is too old — a diff that is too BROAD, never vacuous — and the
#   provenance line prints the origin/main SHA so staleness is diagnosable from
#   the log. Keeping the remote ref current is the caller's job; in CI that is
#   `actions/checkout` with `fetch-depth: 0`.
#
#   Detached HEAD needs no special handling and gets none: this script resolves
#   `--head` through `rev-parse --verify <ref>^{commit}` and never reads a
#   branch name, `@{upstream}`, or `HEAD`'s symbolic target.
#
#   Worktrees need no special handling either: `git -C <worktree>` resolves
#   `--show-toplevel` to that worktree's checkout, while remote-tracking refs
#   live in the shared common dir and resolve normally.

set -euo pipefail

SELF="resolve-diff-base"
SELF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

die() {
  local code="$1"
  shift
  local line
  for line in "$@"; do
    printf '%s: %s\n' "$SELF" "$line" >&2
  done
  exit "$code"
}

# Run `git "$@"`, capturing STDOUT ONLY into $GIT_OUT and its stderr into
# $GIT_ERR, and returning git's exit status.
#
# WHY NOT `VAR=$(git ... 2>&1)`: that spelling splices git's stderr into the
# VALUE, and git writes to stderr on its SUCCESS path too. The case defended
# against is an ambiguous refname — a tag and a branch sharing a name — where
# git prints `warning: refname '<name>' is ambiguous.`, still exits 0,
# and the caller's variable comes back as the warning line followed by the SHA.
# Every later use of that value is then garbage: measured, the following
# `git diff "$BASE"..HEAD` exits 128. The failure is silent at the point of
# capture and only surfaces one command later, wearing the wrong diagnosis.
#
# NO CURRENT CALLER CAN REACH IT, and this comment used to claim one did. The
# only explicit-base path resolves its ref to a 40-hex SHA before any of this
# runs, and git cannot call a SHA ambiguous. The capture spelling is kept
# because it is what makes the whole class impossible, not because something
# live exercises it — do not delete it as dead on the strength of that.
#
# Stderr is not discarded: on success it is forwarded to this script's own
# stderr (so a warning still reaches the log), and on failure it is left for the
# caller's die() to quote as `git said: $GIT_ERR`.
GIT_OUT=""
GIT_ERR=""
git_capture() {
  local err_file rc=0
  err_file=$(mktemp)
  GIT_OUT=$(git "$@" 2>"$err_file") || rc=$?
  GIT_ERR=$(cat "$err_file")
  rm -f "$err_file"
  if [ "$rc" -eq 0 ] && [ -n "$GIT_ERR" ]; then
    printf '%s\n' "$GIT_ERR" >&2
  fi
  return "$rc"
}

usage() {
  cat >&2 <<'EOF'
Usage: resolve-diff-base.sh [--repo-root <dir>] [--head <ref>]
                            [--remote-ref <ref>]
                            [--at-remote-tip fail|first-parent]

  --repo-root <dir>       The checkout to resolve against. Defaults to the repo
                          containing the CWD; REQUIRED when the CWD's repo is
                          not the one this script lives in.
  --head <ref>            Default: HEAD
  --remote-ref <ref>      Default: origin/main
  --at-remote-tip <mode>  fail (default) | first-parent

Prints the base commit SHA on stdout. See the header comment for exit codes.
EOF
  exit 2
}

REPO_ROOT=""
HEAD_REF="HEAD"
REMOTE_REF="origin/main"
AT_REMOTE_TIP="fail"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --repo-root)
      if [ "$#" -lt 2 ]; then usage; fi
      # An EMPTY value is REJECTED, not read as "flag absent". $REPO_ROOT is
      # the sentinel selecting the explicit-tree branch below, so
      # `--repo-root "$SOME_UNSET_VAR"` would otherwise fall through to the CWD
      # default — and when the CWD sits in this script's own checkout the
      # divergence guard does not fire either, so a caller that NAMED a tree
      # silently gets a different one. That is the same guess-the-tree vacuity
      # the flag exists to stop. Same guard, same wording, as the two
      # .github/scripts gates that take this flag.
      if [ -z "$2" ]; then
        echo "resolve-diff-base: --repo-root was given an empty value" >&2
        echo "  pass a path, or omit the flag to default to the CWD's repo" >&2
        exit 2
      fi
      REPO_ROOT="$2"
      shift 2
      ;;
    --head)
      if [ "$#" -lt 2 ]; then usage; fi
      HEAD_REF="$2"
      shift 2
      ;;
    --remote-ref)
      if [ "$#" -lt 2 ]; then usage; fi
      REMOTE_REF="$2"
      shift 2
      ;;
    --at-remote-tip)
      if [ "$#" -lt 2 ]; then usage; fi
      case "$2" in
        fail|first-parent) AT_REMOTE_TIP="$2" ;;
        *) usage ;;
      esac
      shift 2
      ;;
    -h|--help)
      usage
      ;;
    *)
      printf '%s: unknown argument: %s\n' "$SELF" "$1" >&2
      usage
      ;;
  esac
done

if [ -n "$REPO_ROOT" ]; then
  if [ ! -d "$REPO_ROOT" ]; then
    die 3 "ERROR: --repo-root '$REPO_ROOT' is not a directory." \
          "Pass a path inside the checkout whose diff base you want."
  fi
  if ! git_capture -C "$REPO_ROOT" rev-parse --show-toplevel; then
    die 3 "ERROR: --repo-root '$REPO_ROOT' is not inside a git work tree." \
          "git said: $GIT_ERR"
  fi
  ROOT="$GIT_OUT"
else
  # Resolve from the CALLER's CWD, never from this script's own location: a
  # script's path says nothing about which checkout the caller means, and
  # inferring the tree from it is a recurring defect in this repo's tooling
  # (transition-node, graph-commit).
  if ! git_capture rev-parse --show-toplevel; then
    die 3 "ERROR: could not resolve a git repo root from the current directory ($PWD)." \
          "git said: $GIT_ERR" \
          "Pass --repo-root to name the checkout to resolve against."
  fi
  ROOT="$GIT_OUT"
  # With no --repo-root, a CWD in a different checkout from this script's own
  # means either guess is silently wrong. Refuse, and name the flag that fixes
  # it — the same contract lint-verify-fence-paths.sh:174-181 applies.
  SELF_ROOT="$(git -C "$SELF_DIR" rev-parse --show-toplevel 2>/dev/null || true)"
  if [ -n "$SELF_ROOT" ] && [ "$SELF_ROOT" != "$ROOT" ]; then
    die 3 "ERROR: this script lives in $SELF_ROOT but the CWD resolves to $ROOT." \
          "Either tree could be the one you mean, and guessing is how a check" \
          "ends up diffing a tree nobody looked at." \
          "Pass --repo-root to name the checkout to resolve against."
  fi
fi

if ! HEAD_SHA=$(git -C "$ROOT" rev-parse --verify --quiet "${HEAD_REF}^{commit}"); then
  die 7 "ERROR: --head '$HEAD_REF' does not resolve to a commit in $ROOT." \
        "An unborn branch or an empty repository has no diff base."
fi

if ! REMOTE_SHA=$(git -C "$ROOT" rev-parse --verify --quiet "${REMOTE_REF}^{commit}"); then
  die 4 "ERROR: --remote-ref '$REMOTE_REF' does not resolve in $ROOT." \
        "There is no baseline to diff against, so this check cannot run." \
        "In CI this means the checkout was shallow: use fetch-depth: 0." \
        "Locally, fetch first:  git -C $ROOT fetch origin main"
fi

if ! git_capture -C "$ROOT" merge-base "$REMOTE_SHA" "$HEAD_SHA"; then
  die 6 "ERROR: no merge base between '$REMOTE_REF' and '$HEAD_REF' in $ROOT." \
        "git said: $GIT_ERR" \
        "Unrelated histories, or a shallow clone whose grafted history does" \
        "not reach the fork point. In CI use fetch-depth: 0." \
        "Locally:  git -C $ROOT fetch --unshallow origin"
fi
BASE="$GIT_OUT"

SOURCE="merge-base"

# BASE == HEAD covers BOTH no-delta shapes: HEAD is exactly the remote tip, or
# HEAD is a STRICT ANCESTOR of it. `fail` mode distinguishes them, because the
# two states have different causes and different remedies. `first-parent` mode
# does not need to: the question it asks — "what did this commit introduce" —
# is answered by HEAD^1 and is well-defined no matter where the remote tip has
# since moved. Making the strict-ancestor case fatal for first-parent callers
# would turn a benign push race on `main` (a second push landing while the
# first run is still in flight, so the run's own HEAD becomes an ancestor of
# origin/main) into a red required check on `main`, which blocks merges
# repo-wide.
if [ "$BASE" = "$HEAD_SHA" ]; then
  if [ "$AT_REMOTE_TIP" = "fail" ]; then
    if [ "$HEAD_SHA" != "$REMOTE_SHA" ]; then
      die 5 "ERROR: HEAD ($HEAD_SHA) is a STRICT ANCESTOR of $REMOTE_REF ($REMOTE_SHA)." \
            "The three-dot diff '${REMOTE_REF}...${HEAD_REF}' would be EMPTY, and a" \
            "check reading that as 'nothing changed' would pass without examining" \
            "anything. There is no defensible base for this state." \
            "Cause: this branch is already merged into $REMOTE_REF, or the" \
            "checkout is behind it. Rebase/merge $REMOTE_REF into the branch, or" \
            "run the check against the range you actually mean via --head." \
            "If this caller is meant to run on a commit already contained in" \
            "$REMOTE_REF, pass --at-remote-tip first-parent to diff what that" \
            "commit introduced."
    fi
    die 8 "ERROR: HEAD is exactly $REMOTE_REF ($REMOTE_SHA), so there is no branch delta." \
          "The three-dot diff would be EMPTY and this check would pass vacuously." \
          "If this caller is meant to run on $REMOTE_REF too (a post-merge push)," \
          "pass --at-remote-tip first-parent to diff what the push introduced."
  fi
  if ! PARENT=$(git -C "$ROOT" rev-parse --verify --quiet "${HEAD_SHA}^1^{commit}"); then
    die 9 "ERROR: --at-remote-tip first-parent was requested but HEAD ($HEAD_SHA)" \
          "is a root commit with no first parent, so 'what this push introduced'" \
          "is undefined."
  fi
  # first-parent mode deliberately absorbs a state `fail` mode treats as
  # exit 5: HEAD is a STRICT ancestor of --remote-ref, not just equal to it.
  # In CI that is the benign push race the mode exists for (a second push
  # landing on `main` while an earlier run is still in flight), and HEAD^1
  # answers "what did this commit introduce" correctly either way. But every
  # first-parent call site is ALSO a developer-invoked script, and on a
  # developer's checkout the old exit 5 was the only signal that their tree
  # was behind — silently narrowing to one commit here would destroy that
  # signal without telling anyone. So warn (non-fatal) whenever HEAD is
  # strictly behind the remote ref; stay silent when HEAD is exactly at the
  # tip, which is the ordinary, expected post-merge push.
  if [ "$HEAD_SHA" != "$REMOTE_SHA" ]; then
    printf '%s: WARNING: HEAD (%s) is behind %s (%s).\n%s: Diffing only HEAD^1..HEAD — what this commit introduced — not the full range since %s.\n%s: If this is a local checkout, it is stale: fetch and rebase. This check is examining far less than the reader expects.\n' \
      "$SELF" "$HEAD_SHA" "$REMOTE_REF" "$REMOTE_SHA" "$SELF" "$REMOTE_REF" "$SELF" >&2
  fi
  BASE="$PARENT"
  SOURCE="first-parent"
fi

printf '%s: base=%s source=%s repo=%s head=%s@%s remote=%s@%s\n' \
  "$SELF" "$BASE" "$SOURCE" "$ROOT" "$HEAD_REF" "$HEAD_SHA" "$REMOTE_REF" "$REMOTE_SHA" >&2

printf '%s\n' "$BASE"
