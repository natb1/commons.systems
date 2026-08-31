# lib-graph-base-pin.sh — the ONE diagnosis-time compare-and-swap pin for a
# graph writer that mutates intentions/<id>.md on disk and lands it with a
# separate `graph-commit`.
#
# Every such writer reads a node, rewrites the WHOLE node from that in-memory
# read, and commits later. Anything another writer landed on origin/main inside
# that window is silently overwritten unless the land carries
# `--base <id>=<blobsha>` naming the blob THIS writer read. With the pin,
# graph-commit's check_base_freshness runs the structural three-way merge (base
# = the pinned blob, ours = our on-disk edit, theirs = origin/main's landed
# content) and parks only when a divergence is genuinely unresolvable. Without
# it, check_base_freshness short-circuits on its first line and the sweep lands
# whatever is sitting on disk. See .claude/skills/ref-diagnosis-time-cas/SKILL.md
# for the doctrine.
#
# This file exists for the same reason lib-graph-rollback.sh does, and its header
# is the precedent: that rollback had been re-derived per writer and the copies
# drifted. The CAS pin is at exactly that point in its life — one correct copy
# (reconcile-graph-merged grew it), one writer about to need it
# (reconcile-graph-review-stall). The functions below are
# reconcile-graph-merged's version, extracted verbatim and parameterized by
# <label>. New writers call them; they do not re-derive them.
#
# Usage (source it, then pin BEFORE the mutation, thread AFTER it):
#   source "$SCRIPT_DIR/lib-graph-base-pin.sh"
#   declare -A BASE_BLOB=()
#   require_safe_node_id my-script "$id"                  # or node_id_is_safe
#   BASE_BLOB[$id]=$(pin_base_blob "$REPO_ROOT" my-script "$id") || exit 1
#   ... mutate intentions/<id>.md ...
#   require_safe_node_id my-script "$id"                  # re-gate at pair build
#   GC_ARGS+=(--base "$id=${BASE_BLOB[$id]}")
#
# No `source` of any other file: this library is copied standalone into test
# fixtures, exactly as lib.sh and lib-graph-rollback.sh are.

# A node id must be safe both as a single path component and as the KEY of
# graph-commit's `--base <id>=<blobsha>` pair. add_blob_pair() splits the pair at
# the FIRST `=` (packages/intentionsutil/scripts/graph-commit:674, parsed by
# parse_blob_arg() at :689), so an id containing `=` is silently re-keyed:
# `tactic-a=b` records the pin under the truncated id `tactic-a` with the garbage
# sha `b=<real-sha>`. If a genuine `tactic-a` is in the same batch its correct pin
# is overwritten, and check_base_freshness then three-way merges against the wrong
# (or unresolvable) base — defeating the very lost-update protection the pin
# exists to provide. Whitespace and control characters are equally unsafe: pin
# loops read the planned edit ids line by line, so a multi-line id would hash the
# wrong path and leave the true id unpinned.
#
# Node ids are unvalidated frontmatter strings, so gate them here. A skipped pin
# is an UNPROTECTED write — exactly the failure this compare-and-swap closes — so
# a caller must never let an unsafe id through to the mutation.

# node_id_is_safe <id>
#   Pure predicate: returns 0 when <id> is a safe path component and `--base`
#   pair key, 1 otherwise. Prints nothing and never exits, so a caller that
#   wants a per-candidate skip rather than an abort can supply its own message.
node_id_is_safe() {
  [[ "$1" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]]
}

# require_safe_node_id <label> <id>
#   The hard-error posture (.claude/rules/code-style.md: clear errors over
#   fallbacks): on an unsafe id, name the regex and the offending id and exit 1.
#   <label> prefixes the diagnostic (the calling script's name) so an
#   operator-visible error keeps naming which sweep raised it.
require_safe_node_id() {
  local label="$1"
  node_id_is_safe "$2" || {
    echo "$label: unsafe node id $(printf '%q' "$2") — ids must match ^[A-Za-z0-9][A-Za-z0-9._-]*\$ (no '=', whitespace, or control characters) to be a valid --base pair key" >&2
    exit 1
  }
}

# Pin a planned edit id's diagnosis-time base blob — the blob of the ON-DISK
# file, which is exactly the content the writer's own reader reads before it
# mutates. NOT origin/main's blob: graph-commit defines base as "the blob the
# writer read", and when the checkout sits behind origin/main the two differ.
# Pinning origin/main would make scalarMerge compute a spurious "ours" delta on
# fields the sweep never touched and could revert landed content — the exact
# failure class the pin exists to close. In the normal synced case the two are
# byte-identical and the distinction is a no-op. (Contrast
# lib-frozen-session-park.sh, which pins with
# `git rev-parse "origin/main:intentions/<id>.md"` because ITS source genuinely
# IS a git ref. Do not swap the two forms.)
#
# `-w` is MANDATORY, not an optimization: check_base_freshness resolves the base
# with `git cat-file -p <sha>` and die()s with "base blob … is unreadable in the
# local object database" when it misses. A disk blob differing from every
# committed blob is absent from the object database unless -w writes it there,
# so omitting -w would convert a benign stale base into a hard die.
#
# pin_base_blob <repo-root> <label> <id>
#   Prints the blob sha on stdout. On failure prints a diagnostic naming <label>
#   to stderr and RETURNS non-zero WITHOUT exiting, so each caller chooses its
#   own posture: reconcile-graph-merged hard-errors (a planned edit id it cannot
#   pin is a real error), while reconcile-graph-review-stall skips that one
#   candidate and keeps sweeping. The library serves both; it does not pick.
pin_base_blob() {
  local repo_root="$1" label="$2" id="$3"
  git -C "$repo_root" hash-object -w -- "intentions/$id.md" || {
    echo "$label: cannot pin base blob for $id (no CAS base, no rollback path)" >&2
    return 1
  }
}
