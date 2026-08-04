#!/usr/bin/env bash
# lib-session-reap.sh — sourceable helper that reaps terminal graph-node worker
# sessions the daemon has DECLINED to remove.
#
# The failure this closes: `claude rm <id>` exits 0 while DECLINING to remove a
# session whose worktree has no verifiable repository — a branch that was never
# pushed to origin. It prints
#
#   kept <id> — worktree has files but no repository to verify them against
#
# and exits 0. `dispatch-self-close` ends with `exec "$CLAUDE_CMD" rm "$JOB_ID"`
# and treats that exec AS the reap: `exec` replaces the process, so nothing
# survives to check the outcome. A decline is therefore indistinguishable from a
# removal — no error, no retry, no detection. The session stays registered in
# `claude agents --json --all` forever, and because `worktree_has_live_session`
# is NAME-keyed on the node id, that node becomes permanently unselectable while
# still consuming a live-session slot.
#
# It is systemic, not incidental: an `/align-tactics` round lands its work by
# `graph-commit` direct-push to `main` and never pushes a branch named for the
# node, so EVERY align-round worker ends in exactly this state. Measured
# 2026-08-03: 8 sessions cleared by hand in one day, two of three worker slots
# stranded.
#
# `session_reap_sweep` is the fix, and it belongs here rather than in
# `dispatch-self-close` for one structural reason: the reap must be performed by
# something that OUTLIVES the session, so the post-state can be verified. A
# self-closing session cannot verify its own removal — by construction, if the
# removal worked there is no one left to look.
#
# TWO bits are load-bearing, and they are exactly what the `exec claude rm` path
# lacks:
#   (a) `git worktree remove` runs BEFORE `claude rm`. Removing the worktree is
#       what makes the daemon ACCEPT the removal — the decline is about an
#       unverifiable worktree, so deleting it removes the objection.
#   (b) the post-state is VERIFIED by re-querying the registry, instead of
#       trusting exit 0. A still-present id is logged as REAP_DECLINED, loudly,
#       and left for the operator.
#
# BROWNFIELD STEP 1. This ADDS the sweep arm; it deliberately does NOT modify
# `dispatch-self-close`, whose `exec claude rm` stays for now. The two are safe
# side by side: a session that self-closed successfully is simply not in the
# listing this sweep reads, so there is nothing for it to find. Step 2 (deleting
# that line) happens only after this arm is observed working in production.
#
# Usage: source this file, then call:
#   session_reap_sweep [log-file-path] [log-tag]
#
# session_reap_sweep [log-file-path] [log-tag]
#   Bookkeeping only — it runs inline on a sweep and must never abort it, so it
#   ALWAYS returns 0, on every path including a daemon failure, an unresolvable
#   repo root, a failed `git worktree remove`, and a failed `claude rm`. Every
#   disposition is a single greppable line, and the sweep ends with exactly one
#   summary line. This is the deliberate exception to
#   `.claude/rules/code-style.md`'s "prefer clear errors over defensive
#   fallbacks": the sibling sweeps in this family establish the posture, and a
#   fatal bookkeeping arm would take the whole sweep down with it.
#     return 0 — ALWAYS.
#
#   Lines go to stderr with a `lib-session-reap:` prefix. When [log-file-path]
#   is supplied they are ALSO appended as `<ts> [<log-tag>] <msg>`, matching
#   `worktree_in_sync`'s optional-log convention so the arm's decisions land in
#   `dispatch-sweep`'s own `tmp/dispatch-sweep.log` rather than vanishing into a
#   stderr nobody reads. [log-tag] defaults to `dispatch-sweep`.
#
#   EVERY gate fails toward KEEP. UNKNOWN is never "none":
#     - `claude_agents_list_terminal_workers` returning 1 (daemon unqueryable,
#       non-array, whitespace-only) ABORTS the arm entirely, with a line saying
#       so. An uncorroborated empty read means "cannot see", not "nothing there".
#     - an unreadable transcript mtime (grace unmeasurable) skips the session.
#     - a `gh` failure on the open-PR probe skips the session.
#     - a `git` error on either worktree gate skips the session.
#     - an UNKNOWN post-state read is logged as REAP_UNVERIFIED, NOT as success.
#       Collapsing it into success would reproduce the very silent-PASS bug this
#       file exists to fix.
#
#   The gates, in order, per terminal worker session S:
#     1. name shape — `^[0-9]+-` is a legacy issue worker, not ours; anything
#        that is not a valid node id is rejected before it becomes a path
#        component.
#     2. session-id shape — `sid` feeds a `find -name` glob, `jid` a job-dir
#        path; both are validated at this edge.
#     3. job-dir ownership — `<jobs-root>/<jid>/state.json`'s `.name` must equal
#        the node id. See the JOB DIR note below.
#     4. `node-terminal` marker — a valid marker naming S.name must exist. This
#        is the SAME validation `dispatch-self-close` applies (see MARKER below):
#        positive evidence that the pass reached a terminal disposition.
#     5. grace — the transcript must have been idle at least <grace> seconds.
#     6. reap-safety, ALL of:
#          - the worktree is clean (`git status --porcelain
#            --untracked-files=no` empty),
#          - `git diff origin/main HEAD -- . ':!intentions'` is EMPTY,
#          - no OPEN PR has this branch as its head.
#     7. `git worktree remove` FIRST, then `claude rm`, then verify.
#
#   WHY THE REAP-SAFETY GATE IS A CONTENT DIFF, NOT A COMMIT COUNT. This was
#   measured, and it corrects earlier guidance. GitHub squash-merges, so a
#   branch's individual commits are NEVER ancestors of `main` — only their
#   CONTENT is. Both sessions reaped by hand on 2026-08-03 read 11 and 12 commits
#   "ahead" of `origin/main` and were entirely safe. A commit-count gate fails
#   toward a false "do not touch": it looks conservative while silently stranding
#   worker slots forever, which is the same class of bug as the silent decline.
#   `worktree_in_sync` (lib-worktree-in-sync.sh) is exactly that reachability
#   gate (`rev-list --count HEAD --not --remotes`) and is therefore NOT reused
#   here. `worktree_merged_in_sync` is closer — it is a tree-identity gate for
#   the same squash-merge reason — but it compares the WHOLE tree, with no way to
#   exclude a path, so it cannot express the `intentions/` carve-out below. The
#   gate is written explicitly rather than bending either helper.
#
#   THE `':!intentions'` EXCLUSION. A node's own graph commits legitimately ride
#   along on its branch and are landed separately by `graph-commit`'s direct push
#   to `main`. Counting them as unlanded divergence would block the reap of every
#   node that ever wrote to its own graph record — i.e. all of them.
#
#   THE BRANCH IS NEVER DELETED. Removing the WORKTREE is what makes `claude rm`
#   accept; the branch is not the blocker. The other reap arms in `dispatch-sweep`
#   delete a branch only on positive merged/closed evidence, and this arm has
#   none — so it leaves the branch in place.
#
#   ABSENT WORKTREE. When nothing exists at `<worktrees-root>/<node-id>` the
#   three reap-safety gates are vacuous: they exist to protect worktree content
#   from `git worktree remove`, and there is no worktree to remove and no content
#   to lose. The arm logs the absence, skips the removal step, and goes straight
#   to `claude rm`. This is safe because gate 4 already required positive
#   evidence — a `node-terminal` marker naming this node — that the session
#   reached a terminal disposition, and because `claude rm` deletes a registry
#   entry and a job dir, never a transcript (those live under <projects-root>).
#
#   JOB DIR. The job dir is keyed on the registry's `.id` column, NOT the
#   sessionId and NOT a prefix of it: a RESUMED session keeps its original `.id`
#   while its `.sessionId` changes. `lib-frozen-session-park.sh` step (11)
#   documents this at length; the same two guards apply here — the `^[0-9a-fA-F-]+$`
#   shape check (the id becomes a path component) and an OWNERSHIP check
#   (`state.json`'s `.name`, the field `dispatch-stop` itself reads, must equal
#   the node id). A row with no `.id` renders as an EMPTY column, which means "no
#   job dir" and never a match.
#
#   MARKER. `<jobs-root>/<jid>/node-terminal` is written by
#   `packages/intentionsutil/scripts/mark-node-terminal` as exactly two lines:
#       node=<node-id>
#       disposition=<advance|demote|park|fix-attempt|align-round|no-claim
#                    |conflict-resolved|conflict-hold>
#   `dispatch-self-close:210-212` validates it with
#       [[ -s "$CLAUDE_JOB_DIR/node-terminal" ]] &&
#         marked="$(sed -n '/^node=/{s/^node=//;p;q;}' "$CLAUDE_JOB_DIR/node-terminal")"
#       if [[ "$marked" != "$REQUIRE_NODE" ]]; then  # HOLD
#   — first `^node=` line only, `disposition=` is diagnostic, a missing or
#   zero-byte file leaves `marked` empty which never equals a valid node id. This
#   file applies that check BYTE-FOR-BYTE. Deliberately not looser (a marker for
#   some OTHER node must not authorize this reap — `mark-node-terminal` enforces
#   that at write time via state.json, and this is the read-side half) and not
#   stricter (a stricter check here would refuse to reap sessions self-close
#   itself considers reapable, re-stranding the slot).
#
#   THE GRACE WINDOW. Brownfield step 1 leaves `dispatch-self-close`'s own
#   `exec claude rm` in place, so a just-terminal session may be mid-reap right
#   now; racing it would be bad. Idle time is measured the way the sibling
#   measures it — newest mtime across `<projects-root>/*/<sid>.jsonl`, keyed on
#   the globally-unique SESSION id (the transcript is keyed on `sid`, the job dir
#   on `jid`). Unmeasurable means UNKNOWN, which means skip.
#
# Environment overrides (test seams — every external dependency has one):
#   DISPATCH_SESSION_REAP_NOW_EPOCH        "now" in epoch seconds. Default: date -u +%s.
#   DISPATCH_SESSION_REAP_GRACE_S          Idle grace, seconds. Default: 300.
#   DISPATCH_SESSION_REAP_MAX              Max reap attempts per sweep. Default: 8.
#   DISPATCH_SESSION_REAP_PROJECTS_ROOT    Transcript store. Default: $HOME/.claude/projects.
#   DISPATCH_SESSION_REAP_JOBS_ROOT        Managed-job dirs. Default: $HOME/.claude/jobs.
#   DISPATCH_SESSION_REAP_REPO_ROOT        Repo root. Default: resolve_project_root.
#   DISPATCH_SESSION_REAP_WORKTREES_ROOT   Worktree container. Default: <repo-root>/.claude/worktrees.
#   CLAUDE_AGENTS_CMD                      The `claude` binary, for BOTH the registry
#                                          query and `claude rm`. Default: `claude`.
#                                          Same seam lib-claude-agents.sh uses.
#
# Sandbox: `claude agents --json --all` and `claude rm` reach the local Claude
# daemon over a Unix socket, and `gh` needs the host TLS store. Callers MUST run
# this with `dangerouslyDisableSandbox: true` — see `.claude/rules/sandbox.md`.
# A sandboxed run yields `[]` from the daemon, which reads as a definite "no
# terminal workers" and reaps nothing: fail-safe, but also not measured.
#
# Safe to source multiple times. Does NOT use set -e (must return, not exit).
# Side effect: sourcing once sets `-u` and `-o pipefail` in the caller shell (via
# its own load guard, and transitively via the siblings below).

# Source siblings via BASH_SOURCE dirname, matching lib-frozen-session-park.sh.
# lib.sh supplies resolve_project_root and gh_pr_list_rest; lib-claude-agents.sh
# supplies claude_agents_list_terminal_workers; lib-worktree-reap.sh supplies
# reap_marker_clear. All three are load-guarded or plain function definitions —
# no source cycle (none of them sources this file).
_lsr_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$_lsr_dir/lib.sh"
# shellcheck source=lib-claude-agents.sh
source "$_lsr_dir/lib-claude-agents.sh"
# shellcheck source=lib-worktree-reap.sh
source "$_lsr_dir/lib-worktree-reap.sh"

if [[ -z "${_LIB_SESSION_REAP_LOADED:-}" ]]; then
  _LIB_SESSION_REAP_LOADED=1

  set -uo pipefail

  # _lsr_log <log-file> <log-tag> <msg> — one greppable disposition line, to
  # stderr always and to the caller's log file when one was supplied. Mirrors
  # `_wis_log` in lib-worktree-in-sync.sh so a dispatch-sweep run keeps ONE
  # timestamped, tagged log format end to end.
  _lsr_log() {
    local log_file="$1" log_tag="$2" msg="$3"
    printf 'lib-session-reap: %s\n' "$msg" >&2
    if [[ -n "$log_file" ]]; then
      printf '%s [%s] %s\n' "${DISPATCH_SWEEP_NOW:-$(date -u +%FT%TZ)}" "$log_tag" "$msg" \
        >>"$log_file" 2>/dev/null || true
    fi
    return 0
  }

  # session_reap_sweep [log-file-path] [log-tag] — see the header for the full
  # contract. ALWAYS returns 0.
  session_reap_sweep() {
    local log_file="${1:-}" log_tag="${2:-dispatch-sweep}"

    # The candidate query — a DIRECT `--all` listing (the tick snapshot is
    # captured WITHOUT `--all` and so lacks the terminal rows this arm exists to
    # find). Return 1 is UNKNOWN and ABORTS the arm: an uncorroborated empty read
    # means "cannot see", never "none".
    local candidates
    if ! candidates=$(claude_agents_list_terminal_workers); then
      _lsr_log "$log_file" "$log_tag" \
        "SESSION_REAP_UNKNOWN: daemon unqueryable; cannot see the session registry; reaping nothing"
      return 0
    fi

    local terminal=0 reaped=0 declined=0 unverified=0 skipped=0

    if [[ -z "$candidates" ]]; then
      _lsr_log "$log_file" "$log_tag" \
        "SESSION_REAP_COMPLETE: terminal=$terminal reaped=$reaped declined=$declined unverified=$unverified skipped=$skipped"
      return 0
    fi

    # Resolve "now" and the tunables ONCE, before the loop. A non-numeric
    # override falls back to its baked default — the same integer-guard idiom
    # `terminal_without_disposition_sweep` uses.
    local now
    if [[ "${DISPATCH_SESSION_REAP_NOW_EPOCH:-}" =~ ^[0-9]+$ ]]; then
      now="$DISPATCH_SESSION_REAP_NOW_EPOCH"
    else
      now=$(date -u +%s)
    fi
    local grace="${DISPATCH_SESSION_REAP_GRACE_S:-300}"
    [[ "$grace" =~ ^[0-9]+$ ]] || grace=300
    # A cap, not because reaping is expensive, but so one pathological sweep
    # cannot walk the whole registry issuing daemon calls. Excess candidates are
    # simply retried on the next sweep.
    local reap_max="${DISPATCH_SESSION_REAP_MAX:-8}"
    [[ "$reap_max" =~ ^[0-9]+$ ]] || reap_max=8
    local projects_root="${DISPATCH_SESSION_REAP_PROJECTS_ROOT:-$HOME/.claude/projects}"
    local jobs_root="${DISPATCH_SESSION_REAP_JOBS_ROOT:-$HOME/.claude/jobs}"
    local claude_cmd="${CLAUDE_AGENTS_CMD:-claude}"

    local repo_root="${DISPATCH_SESSION_REAP_REPO_ROOT:-}"
    if [[ -z "$repo_root" ]]; then
      repo_root=$(resolve_project_root) || repo_root=""
    fi
    if [[ -z "$repo_root" ]]; then
      _lsr_log "$log_file" "$log_tag" \
        "SESSION_REAP_SKIP_ALL: repo root unresolvable; reaping nothing"
      _lsr_log "$log_file" "$log_tag" \
        "SESSION_REAP_COMPLETE: terminal=$terminal reaped=$reaped declined=$declined unverified=$unverified skipped=$skipped"
      return 0
    fi
    local worktrees_root="${DISPATCH_SESSION_REAP_WORKTREES_ROOT:-$repo_root/.claude/worktrees}"

    # Drain the candidate list into an array BEFORE looping, for the reason the
    # sibling does: the loop body runs git/gh/claude subprocesses that would
    # otherwise consume the remaining candidates off the loop's stdin.
    local -a rows=()
    mapfile -t rows <<<"$candidates"

    local row rest sid jid name cwd
    for row in "${rows[@]}"; do
      # Field-split by parameter expansion, NOT `IFS=$'\t' read`: TAB is IFS
      # WHITESPACE, so `read` collapses a run of tabs into one delimiter, and a
      # row with a null `.id` (which `@tsv` renders as "") would silently shift
      # `name` one column left onto the cwd. Rows with a null `.id` are exactly
      # the ones this arm must still classify correctly — as "no job dir".
      sid="${row%%$'\t'*}";  rest="${row#*$'\t'}"
      jid="${rest%%$'\t'*}"; rest="${rest#*$'\t'}"
      name="${rest%%$'\t'*}"
      cwd="${rest#*$'\t'}"
      [[ -n "$sid" && -n "$name" ]] || continue
      terminal=$(( terminal + 1 ))

      # (1) Name shape. A `<N>-slug` legacy issue worker belongs to the issue
      # lane's own machinery; this arm owns graph-node workers only. The name
      # also becomes a path component (the worktree path, the job-dir ownership
      # comparison), so validate its shape with the SAME node-id regex
      # `mark-node-terminal:67` and `provision-node-worktree` apply.
      if [[ "$name" =~ ^[0-9]+- ]]; then
        skipped=$(( skipped + 1 ))
        _lsr_log "$log_file" "$log_tag" \
          "SESSION_REAP_SKIP_ISSUE_WORKER: name=$name session=$sid (legacy issue lane; not a graph node)"
        continue
      fi
      if [[ ! "$name" =~ ^[a-z][a-z0-9]*(-[a-z0-9]+)*$ ]]; then
        skipped=$(( skipped + 1 ))
        _lsr_log "$log_file" "$log_tag" \
          "SESSION_REAP_SKIP_BAD_NAME: name=$name session=$sid (not a valid node id)"
        continue
      fi

      # (2) Session-id shape. `sid` feeds a `find -name` glob below.
      if [[ ! "$sid" =~ ^[0-9a-fA-F-]+$ ]]; then
        skipped=$(( skipped + 1 ))
        _lsr_log "$log_file" "$log_tag" \
          "SESSION_REAP_SKIP_BAD_SESSION_ID: name=$name session=$sid"
        continue
      fi

      # (3) Job dir, keyed on the registry's `.id` — see the JOB DIR note in the
      # header. Shape check first (the id becomes a path component), then the
      # OWNERSHIP check against state.json's `.name`. An empty `.id` column means
      # "no job dir", never a match.
      if [[ -z "$jid" || ! "$jid" =~ ^[0-9a-fA-F-]+$ ]]; then
        skipped=$(( skipped + 1 ))
        _lsr_log "$log_file" "$log_tag" \
          "SESSION_REAP_SKIP_NO_JOB_DIR: name=$name session=$sid id=${jid:-<empty>} (no usable job id; cannot read a terminal marker)"
        continue
      fi
      local job_dir="$jobs_root/$jid" job_name
      # shell-json.md: jq reads the file directly; never `echo "$VAR" | jq`.
      job_name=$(jq -r '.name // empty' "$job_dir/state.json" 2>/dev/null) || job_name=""
      if [[ -z "$job_name" || "$job_name" != "$name" ]]; then
        skipped=$(( skipped + 1 ))
        _lsr_log "$log_file" "$log_tag" \
          "SESSION_REAP_SKIP_FOREIGN_JOB_DIR: name=$name session=$sid job_dir=$job_dir state_json_name=${job_name:-<unreadable>}"
        continue
      fi

      # (4) The `node-terminal` marker. Byte-for-byte the check
      # dispatch-self-close:210-212 applies — `-s` on the file, first `^node=`
      # line only, compared to this node id.
      local marked=""
      [[ -s "$job_dir/node-terminal" ]] &&
        marked="$(sed -n '/^node=/{s/^node=//;p;q;}' "$job_dir/node-terminal")"
      if [[ "$marked" != "$name" ]]; then
        skipped=$(( skipped + 1 ))
        _lsr_log "$log_file" "$log_tag" \
          "SESSION_REAP_SKIP_NO_TERMINAL_MARKER: name=$name session=$sid job_dir=$job_dir marker_node=${marked:-<none>} (no positive terminal-disposition evidence)"
        continue
      fi

      # (5) Grace. The transcript lives at <projects-root>/<project>/<sid>.jsonl
      # — keyed on the globally-unique SESSION id. Take the NEWEST mtime across
      # matches. No match, or an unreadable mtime, is UNKNOWN: keep.
      local matches transcript best="" cur
      matches=$(find "$projects_root" -mindepth 2 -maxdepth 2 -name "${sid}.jsonl" 2>/dev/null)
      if [[ -n "$matches" ]]; then
        while IFS= read -r transcript; do
          [[ -n "$transcript" ]] || continue
          cur=$(stat -c %Y "$transcript" 2>/dev/null) || continue
          [[ "$cur" =~ ^[0-9]+$ ]] || continue
          if [[ -z "$best" ]] || (( cur > best )); then
            best="$cur"
          fi
        done <<<"$matches"
      fi
      if [[ -z "$best" ]]; then
        skipped=$(( skipped + 1 ))
        _lsr_log "$log_file" "$log_tag" \
          "SESSION_REAP_SKIP_UNMEASURABLE: name=$name session=$sid (transcript unreadable — idle time unmeasurable)"
        continue
      fi
      local idle=$(( now - best ))
      # A negative (future-stamped) idle is `< grace` too, so it is kept — the
      # safe direction.
      if (( idle < grace )); then
        skipped=$(( skipped + 1 ))
        _lsr_log "$log_file" "$log_tag" \
          "SESSION_REAP_SKIP_GRACE: name=$name session=$sid idle_seconds=$idle grace_seconds=$grace (self-close may still be mid-reap)"
        continue
      fi

      # (6) Cap. Excess candidates are retried on the next sweep.
      if (( reaped + declined + unverified >= reap_max )); then
        skipped=$(( skipped + 1 ))
        _lsr_log "$log_file" "$log_tag" \
          "SESSION_REAP_DEFER: name=$name session=$sid (reap cap $reap_max reached this sweep)"
        continue
      fi

      # (7) The worktree. Its path is derived, never taken from the registry's
      # `cwd`: provision-node-worktree puts a node's checkout at exactly
      # <project-root>/.claude/worktrees/<node-id> on a branch of the same name.
      local wt_path="$worktrees_root/$name"
      local branch="$name"
      local wt_present=0
      [[ -d "$wt_path" ]] && wt_present=1

      if (( wt_present )); then
        # Prefer the worktree's ACTUAL branch for the PR probe when it can be
        # read; fall back to the node id. A detached HEAD reads back as the
        # literal "HEAD", which is not a branch.
        local head_ref
        head_ref=$(git -C "$wt_path" rev-parse --abbrev-ref HEAD 2>/dev/null) || head_ref=""
        if [[ -n "$head_ref" && "$head_ref" != "HEAD" ]]; then
          branch="$head_ref"
        fi

        # (7a) Clean tree. `--untracked-files=no`: untracked residue is build
        # output and scratch, not work — the CONTENT gate below is what protects
        # actual work. A `git status` failure is UNKNOWN → keep.
        local status_out
        if ! status_out=$(git -C "$wt_path" status --porcelain --untracked-files=no 2>/dev/null); then
          skipped=$(( skipped + 1 ))
          _lsr_log "$log_file" "$log_tag" \
            "SESSION_REAP_SKIP_STATUS_ERROR: name=$name session=$sid worktree=$wt_path (git status failed)"
          continue
        fi
        if [[ -n "$status_out" ]]; then
          skipped=$(( skipped + 1 ))
          _lsr_log "$log_file" "$log_tag" \
            "SESSION_REAP_SKIP_DIRTY: name=$name session=$sid worktree=$wt_path (uncommitted changes)"
          continue
        fi

        # (7b) CONTENT gate — see the header for why this is a content diff and
        # not a commit count. `--quiet` exits 0 for "no diff", 1 for "diff", >1
        # for an error (which is UNKNOWN → keep). `-C` puts the cwd at the
        # worktree root, so `.` and `:!intentions` are both anchored there.
        local diff_rc=0
        git -C "$wt_path" diff --quiet origin/main HEAD -- . ':!intentions' 2>/dev/null || diff_rc=$?
        case "$diff_rc" in
          0) ;;
          1)
            skipped=$(( skipped + 1 ))
            _lsr_log "$log_file" "$log_tag" \
              "SESSION_REAP_SKIP_UNLANDED_CONTENT: name=$name session=$sid worktree=$wt_path branch=$branch (tree differs from origin/main outside intentions/)"
            continue
            ;;
          *)
            skipped=$(( skipped + 1 ))
            _lsr_log "$log_file" "$log_tag" \
              "SESSION_REAP_SKIP_DIFF_ERROR: name=$name session=$sid worktree=$wt_path (git diff vs origin/main failed, rc=$diff_rc)"
            continue
            ;;
        esac

        # (7c) No OPEN PR on this branch. A `gh` failure fails toward KEEP —
        # never toward reap.
        local pr_json open_count
        if ! pr_json=$(gh_pr_list_rest --head "$branch" --state all 2>/dev/null); then
          skipped=$(( skipped + 1 ))
          _lsr_log "$log_file" "$log_tag" \
            "SESSION_REAP_SKIP_PR_FETCH_FAILED: name=$name session=$sid branch=$branch (gh_pr_list_rest failed)"
          continue
        fi
        open_count=$(jq '[.[] | select(.state == "OPEN")] | length' <<<"$pr_json" 2>/dev/null) || open_count=""
        if [[ ! "$open_count" =~ ^[0-9]+$ ]]; then
          skipped=$(( skipped + 1 ))
          _lsr_log "$log_file" "$log_tag" \
            "SESSION_REAP_SKIP_PR_FETCH_FAILED: name=$name session=$sid branch=$branch (PR list unparseable)"
          continue
        fi
        if (( open_count > 0 )); then
          skipped=$(( skipped + 1 ))
          _lsr_log "$log_file" "$log_tag" \
            "SESSION_REAP_SKIP_OPEN_PR: name=$name session=$sid branch=$branch open_prs=$open_count"
          continue
        fi

        # (7d) Remove the worktree — FIRST, before `claude rm`. THIS is what
        # makes the daemon accept the removal: it declines while the worktree has
        # files it cannot verify against a repository. NOT `--force`: the gates
        # above already proved the tree clean, so a plain remove that still fails
        # is telling us something we did not model, and the safe answer is to
        # keep. The BRANCH is deliberately left alone (see the header).
        if ! git -C "$repo_root" worktree remove "$wt_path" 2>/dev/null; then
          skipped=$(( skipped + 1 ))
          _lsr_log "$log_file" "$log_tag" \
            "SESSION_REAP_SKIP_WORKTREE_REMOVE_FAILED: name=$name session=$sid worktree=$wt_path"
          continue
        fi
        git -C "$repo_root" worktree prune 2>/dev/null || true
        # Clear any not-in-sync grace marker, exactly as the other reap arms in
        # dispatch-sweep do, so a future same-named worktree cannot inherit a
        # stale grace timestamp.
        reap_marker_clear "$repo_root" "$name" || true
        _lsr_log "$log_file" "$log_tag" \
          "SESSION_REAP_WORKTREE_REMOVED: name=$name session=$sid worktree=$wt_path branch=$branch (branch retained)"
      else
        # Absent worktree — the reap-safety gates are vacuous. See the header.
        _lsr_log "$log_file" "$log_tag" \
          "SESSION_REAP_NO_WORKTREE: name=$name session=$sid worktree=$wt_path (nothing to remove; proceeding to claude rm)"
      fi

      # (8) `claude rm` — on the JOB id (`.id`), which is what dispatch-self-close
      # passes and what the daemon keys removals on. Its exit code is recorded
      # but NOT trusted: exiting 0 while declining is the entire bug.
      local rm_rc=0
      "$claude_cmd" rm "$jid" >/dev/null 2>&1 || rm_rc=$?

      # (9) Verify the POST-STATE by re-querying, instead of believing exit 0.
      # THREE outcomes, never two. The candidates were terminal going in, so a
      # session the daemon declined to remove is still terminal and still in this
      # listing; absence from it is a genuine removal.
      local post
      if ! post=$(claude_agents_list_terminal_workers); then
        unverified=$(( unverified + 1 ))
        _lsr_log "$log_file" "$log_tag" \
          "SESSION_REAP_UNVERIFIED: name=$name session=$sid id=$jid claude_rm_rc=$rm_rc (daemon unqueryable on the post-state read; removal NOT confirmed)"
        continue
      fi
      local still=0 prow prest pjid
      if [[ -n "$post" ]]; then
        while IFS= read -r prow; do
          [[ -n "$prow" ]] || continue
          prest="${prow#*$'\t'}"
          pjid="${prest%%$'\t'*}"
          if [[ -n "$pjid" && "$pjid" == "$jid" ]]; then
            still=1
            break
          fi
        done <<<"$post"
      fi
      if (( still )); then
        declined=$(( declined + 1 ))
        _lsr_log "$log_file" "$log_tag" \
          "REAP_DECLINED: name=$name session=$sid id=$jid claude_rm_rc=$rm_rc — the daemon still reports this session after \`claude rm\`; it is holding a worker slot and its node is unselectable. Left for the operator."
        continue
      fi
      reaped=$(( reaped + 1 ))
      _lsr_log "$log_file" "$log_tag" \
        "SESSION_REAPED: name=$name session=$sid id=$jid idle_seconds=$idle worktree_present=$wt_present cwd=$cwd"
    done

    _lsr_log "$log_file" "$log_tag" \
      "SESSION_REAP_COMPLETE: terminal=$terminal reaped=$reaped declined=$declined unverified=$unverified skipped=$skipped"
    return 0
  }

fi
