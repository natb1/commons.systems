#!/usr/bin/env bash
#
# test-graph-commit.sh — functional harness for graph-commit.
#
# Recreates the verification setup from PR #2751 (which previously lived only
# in job-scratch dirs): a throwaway bare origin plus two clones (two
# independent writers), `gh` and `npx` PATH shims standing in for the GitHub
# API and the tsx parking helper, and GRAPH_COMMIT_* env overrides shrinking
# the poll windows. The graph-commit under test is the one next to this file;
# it is copied into the scratch repo at its real repo-relative path so its own
# REPO_ROOT resolution points at the scratch clone.
#
# Covers:
#   1. happy path lands (exit 0), scratch branch deleted on origin
#   2. idempotent re-run on a clean tree: exit 0, no new commit on main, and
#      the no-op short-circuit makes zero gh polls and leaves no scratch branch
#   3. non-overlapping concurrent edits auto-merge; both writers' edits survive
#   4. overlapping concurrent edits: exit 1, the other writer's landed content
#      survives on main, this writer's content is NOT landed, the office_hours
#      park commit lands, the losing content is preserved in the kept
#      snapshot dir, and — the durability half — the record ON MAIN still
#      carries that content verbatim after the snapshot dir is deleted
#   5. concluded check failure (gh shim reports "3 1"): immediate die, no
#      retry burn (exactly one poll, no second attempt)
#   6. gh hard failure (shim exits 1): die surfacing gh's stderr after exactly
#      3 consecutive polls
#   7. pending timeout (shim reports "0 0"): still transient — burns all
#      attempts and exits with the busy-main error, whose terminal line names
#      the cause and attributes the observed check state to the SHA it was read
#      on (guarding against a prior attempt's snapshot being shown as this
#      failure's state)
#   8. desynced check-run status (one required check's status is stuck
#      in_progress even though its conclusion already reports success — a
#      known GitHub check-runs desync, #2457): the fixed --jq filter keys off
#      .conclusion alone, so this still counts as the fourth success and
#      lands immediately instead of spinning to the busy-main timeout
#   9. id validation: `v1..v2-migration` lands end-to-end; `/`, `\`, a comma
#      (in either an ordinary or a --prune id), and the exact ids `.` / `..`
#      are rejected with exit 2
#  10. --prune: an ordinary edit id and a prune id land in ONE commit
#  11. --prune guard: a prune id whose file is still present on disk is
#      rejected (no commit lands)
#  12. --base fresh: a --base entry matching origin/main's current blob lands
#  13. --base stale, disjoint appended lines (bare line-based fixture): now
#      that layer 3 attempts an automatic merge before refusing, two disjoint
#      appended lines (this writer's line13, the concurrent writer's line14)
#      auto-resolve — exit 0, both lines land, no park. (Pre-Unit-3 this was a
#      hard `die`; cases 21-22 below cover the field-level resolve/unresolved
#      split this case can no longer distinguish on its own.)
#  14. --prune alone (no positional id, IDS empty): a pure deletion lands on
#      main and the scratch branch is cleaned up — this is the owed-prune
#      backlog's actual shape (a done node with no accompanying edit), not
#      exercised by case 10's mixed edit+prune
#  15. --base manifest-file form: a file of <id>=<blobsha> lines (as opposed
#      to the inline form used by cases 12-13) lands
#  16. far-ahead worktree (PR branch with a non-intentions code commit): the
#      edit is rebuilt on origin/main, ONLY the intentions/ change lands (the
#      code commit is excluded), exit 0, and the worktree HEAD is restored to
#      the PR tip
#  17. overlapping edit vs prune conflict: park recommendation omits a
#      snapshot path (no content to preserve) and states the
#      prune-reconciliation instruction instead
#  18. far-ahead worktree + --prune: a deletion issued from a far-ahead PR
#      branch lands on main (the node is removed) without landing the code
#      commit, HEAD restored
#  19. layer 2 (rebase-conflict field merge) resolves a textual conflict whose
#      two sides touch DIFFERENT fields: exit 0, the "auto-resolved" log
#      suffix appears, both writers' field edits land
#  20. layer 2 leaves a textual conflict whose two sides touch the SAME field
#      mechanical-unresolved: exit 1, office_hours.reason carries
#      "mechanical-unresolved", and the recommendation names both values
#  21. layer 3 (--base stale re-read) auto-resolves a field-level fixture
#      whose disjoint fields diverged: exit 0, no die, no park, both fields land
#  22. layer 3 leaves a stale-`--base` SAME-field divergence
#      mechanical-unresolved: exit 1, office_hours.reason carries
#      "mechanical-unresolved", both values are named in the recommendation
# 22b. the SNAP_DIR frozen-original contract on a MULTI-ID batch where id A's
#      layer-3 merge resolves and id B's does not (so the batch fails closed
#      and both park): SNAP_DIR/A.md still hashes to A's PRE-merge content,
#      graph-commit's blend of it with the concurrent writer's landed edit sits
#      beside it at SNAP_DIR/A.merged.md, and the park recommendation names
#      both paths and says which is which
#  23. a --prune id racing a concurrent edit to the same node is excluded from
#      the layer-2 merge attempt entirely (a deletion has nothing to
#      structurally merge against) — no false "auto-resolved" claim, parks
#      with the prune-specific sentinel note
#  24. an unrelated dirty tracked file outside the node set: clear pre-flight
#      error naming the file, no rebase/CI attempted, main untouched
#  25. -C targeting from an unrelated cwd: the graph-commit script FILE lives
#      inside one clone (w16) but is invoked with `-C` pointing at a DIFFERENT
#      clone (w17), from a cwd that is neither — the exact scenario that used
#      to silently break (REPO_ROOT derived from the script's own on-disk
#      location, landing in whatever checkout the script FILE happened to sit
#      in, regardless of caller intent or -C). Asserts the edit lands via w17,
#      not w16 or the cwd.
#      (cwd-derivation with no `-C` — the default path — is already exercised
#      as a regression guard by nearly every other case via run_gc(), which
#      always `cd`s into the target clone and passes no `-C`; no separate case
#      needed.)
#  26. no-repo error: invoked with no `-C` from a cwd that is not inside any
#      git repository at all (a plain `mktemp -d`, never `git init`'d) — a
#      clear non-zero exit naming "not inside a git repository", never a
#      silent fall-back to the script's own checkout.
#  27. fail-loud guard, differing blob: a clone that never edited a given id
#      (nothing staged) while origin/main has since advanced with a DIFFERENT
#      edit to that same id (a stale clone) — dies loudly naming "mis-pointed
#      -C/--repo", never reaches the "landed" success message, main untouched.
#  28. fail-loud guard, benign equal-blob: a clone synced exactly to
#      origin/main's tip (nothing staged, and the local blob for the id
#      equals origin/main's blob) proceeds benignly — exit 0, the same
#      "no new changes to stage" message, no die, and zero gh polls (the
#      no-op short-circuit).
#  29. lock contention is cheap: a waiting writer makes zero gh polls while
#      blocked on the landing lock, then exactly one poll cycle once it
#      acquires the lock and lands (not a re-poll-from-scratch retry burn)
#  30. dead-holder steal: an expired foreign lock claim is stolen promptly,
#      not held to the full lock-wait timeout
#  31. live-holder wait: a live foreign lock is not stolen prematurely; the
#      writer waits for the planted expiry before proceeding
#  32. lock-ref hygiene: refs/graph/landing-lock is absent after a normal
#      landing and never appears under refs/heads/graph/** (disjoint from
#      the scratch-branch namespace graph-fast-path.yml triggers on)
#  33. --expect happy path: an --expect entry matching the blob the caller
#      actually wrote is transparent — exit 0, the edit lands
#  34. --expect catches the equal-blob wrong-repo case that case 28's benign
#      path cannot: a clone synced bit-for-bit to origin/main (nothing staged,
#      local blob == origin/main blob, so the nothing-staged guard passes)
#      invoked with an --expect sha for content that is NOT there — dies
#      naming "mis-pointed -C/--repo", never reaches "landed", main untouched
#  35. --expect on a --prune id is a usage error (exit 2, origin untouched) —
#      a deletion has no content to assert
#  36. a rebase ALREADY in progress in the target checkout: refused up front
#      (non-zero exit naming "already in progress"), main untouched, zero gh
#      calls — graph-commit never runs on a mid-operation worktree, so a
#      caller's own stopped rebase is never aborted by case 37's cleanup
#  37. a rebase THIS run stranded (a die() fires while the pull --rebase
#      conflict is still live) is aborted by cleanup(): no rebase state dir
#      survives, HEAD is reattached to the branch, and the checkout's local
#      commits are intact
#  38. duplicate green rows land: a SHA re-stamped by several pushes carries
#      TWO completed/success rows per required name (plus an unrelated CodeQL
#      row). The gate counts DISTINCT required contexts resolved to their
#      newest run, not rows, so this lands (exit 0) instead of spinning to
#      the busy-main timeout a row-count `== 4` gate could never satisfy
#  39. duplicated rows do not paper over a missing context: four rows but only
#      three distinct required names green (two lint successes, no acceptance
#      row at all) — exit 1, nothing lands on main, and the reported state
#      names "acceptance=absent" (the regression guard against relaxing the
#      gate to `-ge 4`)
#  40. a stale failed row superseded by a newer success lands: acceptance has
#      a lower-id conclusion=failure row and a higher-id conclusion=success
#      row, so max_by(.id) resolves it green — exit 0, no "concluded
#      non-success" misdiagnosis. The stale row carries the LATER started_at,
#      so ordering on that caller-settable field would fail this case
#  41. no-op short-circuit exits 0 even when checks are unusable: a clone
#      synced exactly to origin/main's tip, invoked on an existing id with
#      nothing edited, while gh is in hard-fail mode (every call exits 1) —
#      still exits 0 with zero gh polls and no "polling failed", proving the
#      no-op path never reaches the poller
#      (tactic-graph-commit-noop-landing-false-failure, Defect 1)
#  42. lock-wait exhaustion is diagnosed as lock contention, not as a check
#      state: a foreign lock with a far-future expiry blocks the writer, which
#      exits after zero gh polls — the terminal message names the landing lock
#      as the cause and states that the required-check state was never
#      observed, instead of presenting any check-state snapshot
#      (tactic-graph-commit-noop-landing-false-failure, Defect 3 residue)
#  43. a forged green row cannot mask a genuine failure: `lint` has a real
#      GitHub-Actions failure row plus a success row written by another App
#      (a `checks: write` principal) with a far-future started_at and a higher
#      id. The producer filter drops the foreign row, so `lint` resolves to the
#      failure — hard refusal (1 poll, "not retrying"), nothing lands on main
#  44. bystander prune lands despite a park on another id in the same
#      invocation: a --prune id NOT implicated in a concurrent-edit conflict
#      is re-applied and landed with the park commit rather than resurrected
#      and silently dropped; the conflicted id still parks exactly as before;
#      the landed park commit's subject names the parked id and the pruned
#      id in separate clauses, never describing the pruned id as parked
#  45. stale --base on a --prune id parks with a prune-specific reason instead
#      of resurrecting the file: check_base_freshness() refuses to hand a
#      nonexistent --ours to merge-node.ts, so a prune whose base moved on
#      origin/main fails closed (exit 1) rather than silently landing rc 0
#      through the empty-diff "no new changes to stage" branch
#  46. bystander prune lands through the LAYER-3 park entry (the --base path an
#      owed-prune census actually takes): a stale --base same-field divergence
#      on one id parks it from inside check_base_freshness() — before any
#      commit exists and with the writer's edits still uncommitted — while an
#      unrelated --prune in the same invocation is re-applied after the reset
#      and lands with the park commit
#  47. a --base MANIFEST entry outside this invocation's node set that fails to
#      merge does not degenerate into a park of nothing: every committed id is
#      a bystander prune, so the partition would leave park_ids empty — the
#      conservative fallback parks every id instead and re-applies no prune,
#      rather than announcing a park while writing office_hours on no node
#  48. far-ahead + stale --base: the layer-3 merge survives the rebuild — a
#      writer whose worktree is BOTH far-ahead (a non-intentions code commit
#      on HEAD) AND carrying a stale --base that a concurrent writer has
#      since landed a disjoint-field edit against; the layer-3 merge's result
#      must not be reverted by the far-ahead rebuild's snapshot-restore, so
#      both writers' fields land, the code commit is excluded, and HEAD is
#      restored to the far-ahead tip
#  49. far-ahead, NO --base, disjoint field: a concurrent writer lands an edit
#      to a DIFFERENT field of the same node between this writer's snapshot and
#      the far-ahead rebuild — the rebuild's three-way replay merges instead of
#      blindly copying, so both edits land (pre-fix the concurrent edit was
#      silently reverted with no conflict, park, or diagnostic)
#  50. far-ahead, NO --base, SAME field: the rebuild's replay cannot resolve the
#      divergence, so it parks (exit 1, "mechanical-unresolved", both values
#      named) instead of overwriting — and the far-ahead worktree's HEAD is
#      still restored to its PR tip on this new park path
#  51. far-ahead --prune racing a concurrent edit to the same node: the prune is
#      guarded rather than forced through — exit 1, park, and the node SURVIVES
#      on main carrying the concurrent edit
#  52. far-ahead, NO --base, LIST-ENTRY REMOVAL racing a concurrent edit: this
#      writer clears one `blocked_by` entry while another writer lands an
#      unrelated field edit to the same node. `threeWayList` is base-aware and
#      honors the removal, so the replay's merge resolves and this LANDS —
#      exit 0, no office_hours on the landed node, the concurrent edit
#      preserved, the PR's code commit still excluded, HEAD restored to the PR
#      tip. Which entries survive is asserted against the real merge by
#      test/node-merge.test.ts and test/merge-node-cli.test.ts, not here: the
#      harness shim discards YAML list-item lines
#
# Cases 53-57 are the SIGKILL cases (tactic-graph-commit-landing-signal-
# unreliable). A SIGKILL fires no trap, so cleanup() never runs and no
# trap-based defense applies — these exercise the exact paths the orphan-window
# containment and the terminal verdict line were written for, by actually
# killing the writer's whole process group rather than simulating it:
#  53. killed while WAITING on a live landing lock leaves NO orphan: the local
#      commit is made inside try_land() after the lock is held, so a kill during
#      the wait makes zero local commits, leaves the writer's edit uncommitted
#      on disk (still recoverable by a re-run), and leaves origin/main untouched
#  54. killed MID-STAMP (inside await_checks, past commit+lock+scratch push)
#      leaves the residual orphan the header block documents: a local commit
#      exists, `verify-landed` reports `not-landed` (exit 4) against the
#      content the run intended, and a PLAIN RE-RUN of the identical invocation
#      lands it — the tribal `git reset --hard` is NOT required and is retired
#  55. the `not-landed` verdict on that orphan names the commit AND the
#      recovery: an `orphan=<sha>` line carrying "re-run" and the prohibition
#      on hand-pushing it to main
#  56. Direction B: a writer whose main push is rejected until its attempts are
#      exhausted, while a peer lands byte-identical content, exits 0 with
#      `verdict: landed-equivalent` — not exit 1 with a rejection as its last
#      word
#  57. verdict-line uniqueness: a happy-path run, a busy-but-actually-landed
#      run and a park run each emit EXACTLY ONE `graph-commit: verdict: ` line
#
#  58. delete/modify divergence: another writer's deletion lands on main FIRST
#      (genuine rm+commit+push, not --prune), then a stale --base edit races
#      it: exit 1, no false "layer 2/3 auto-resolved" claim, and the LANDED
#      DELETION STANDS — the node is NOT resurrected on origin/main (a losing
#      writer must never push a deleted node's content back to main with no PR
#      and no review). The re-materialization is local and UNTRACKED: the
#      worktree file carries office_hours and the "delete/modify divergence"
#      recommendation, the writer's field edit survives in its frontmatter, and
#      the authored markdown body is preserved rather than replaced by the
#      generated "# <statement>" placeholder. stderr reports the divergence and
#      says plainly that nothing was parked ON MAIN, WITHOUT emitting
#      land-align-round's landed-park needle
#
#  59. idempotent park retry: a node whose office_hours block is ALREADY on
#      origin/main byte-identically (a peer parked it first) parks again with
#      nothing to commit and nothing to push (park_and_exit()'s committed=0
#      arm, PUSHED_SHA empty). The verdict must still be `parked` — decided by
#      comparing origin/main against the PARK's content, not against SNAP_DIR's
#      unlanded pre-park edit or a --prune id's absence — never `not-landed`,
#      which would deny land-align-round its park marker for a park that IS on
#      main. origin/main must not move.
#
# Cases 60-69 cover build_commit_plumbing() — the commit builder behind
# GRAPH_COMMIT_WRITER=plumbing — as a UNIT. Unlike every case above they do not
# drive the CLI end to end: they source graph-commit (which defines its
# functions and runs nothing) and call the builder directly against a real
# throwaway repo, which is how the tree-SHA equivalence claim below is made
# precisely. Cases 70-73 then drive the wired-in writer through the CLI.
#
# The central assertion is TREE-SHA EQUIVALENCE: for identical inputs, the
# plumbing writer and the working-tree writer (git add + git commit) must
# produce the same tree object. A tree SHA is a total, order-independent
# fingerprint of the content a commit lands, so equal trees IS the proof that
# swapping the writer changes nothing about what reaches main.
#  60. single-node edit: same tree SHA as `git add` + `git commit`
#  61. multi-node edit (three ids in one commit): same tree SHA
#  62. prune (file deleted on disk): same tree SHA, and the path is gone from
#      the plumbing tree
#  63. mixed edit + prune in one commit: same tree SHA
#  64. RESURRECTED_IDS: a resurrected id is excluded from the plumbing tree
#      exactly as commit_files() excludes it — same tree SHA as the
#      working-tree writer's identical exclusion, and the node still carries
#      BASE content (never the on-disk re-materialization) in the built commit
#  65. carry-through: the built commit differs from its base in EXACTLY the
#      named node paths — every other path in the repo (the other intentions/
#      nodes, packages/**) is untouched
#  66. the builder touches neither the working tree nor the repo's own
#      .git/index: both are byte-identical after a build, and the built commit
#      is reachable from no ref (HEAD has not moved)
#  67. GRAPH_COMMIT_WRITER gating: unset lands exactly as today, an explicit
#      `worktree` lands identically, `plumbing` LANDS THE SAME CONTENT while
#      leaving the checkout's HEAD exactly where it was (no local commit is ever
#      made on that path), and an unknown value is refused with origin/main
#      unmoved
#  68. base-commit fidelity: the builder builds against the BASE COMMIT it is
#      handed, not against HEAD or the index — a commit built on an older base
#      carries that base's content for paths it does not name
#  69. a --prune id naming a path the base commit does not carry is REFUSED —
#      `update-index --force-remove` would silently succeed there, so the
#      builder dies instead of emitting a commit that pruned nothing
#
# Cases 70-75 drive GRAPH_COMMIT_WRITER=plumbing through the CLI end to end —
# the wiring itself, not the builder.
#  70. UNRELATED DIRTY TRACKED FILE. The finding this wiring dissolves
#      (tactic-eval-finding-eval-write-blocked-by-unrelated-main-dirt): a
#      modified file the write never reads must NOT block a plumbing landing,
#      must still block a worktree landing (that writer's rebase genuinely
#      cannot run on it), and must SURVIVE the plumbing landing — a writer that
#      tolerates dirt by destroying it is not tolerating it
#  71. SAME-NODE CONCURRENT EDIT, disjoint fields: with no rebase to conflict,
#      the divergence is caught by comparing the node's blob between bases and
#      routed through the SAME field-level merge layer 2 uses, so BOTH writers'
#      edits survive on main — never a blind overwrite of the peer's landed edit
#  72. SAME-NODE CONCURRENT EDIT the merge CANNOT resolve: parks exactly as the
#      worktree writer's unresolvable rebase conflict does (exit 1, the peer's
#      content stands on main, office_hours landed, the loser's content kept in
#      the snapshot dir) — the return-10 → land()-12 → park_and_exit() path is
#      preserved, not re-derived
#  73. the park in case 72 leaves the checkout's UNRELATED dirt intact:
#      park_and_exit()'s whole-tree `git reset --hard` is a path-scoped sync for
#      this writer, so the park cannot destroy what the pre-flight refusal was
#      dropped for
#  74. NO-OP FIDELITY. A clean checkout merely BEHIND origin/main whose content
#      is already there must still short-circuit: the "HEAD == origin/main" test
#      is the wrong question for a writer that builds from disk onto
#      origin/main, and without the widened arm the run would push an empty
#      commit whose tree equals its parent's
#  75. COMPOSITION WITH --base. dispatch-eval-finding, the one caller that opts
#      into this writer, passes --base on every update, so the layer-3
#      stale-base reconciliation (which merges on disk) and the plumbing
#      rebuild (which then reconciles and builds) must compose — both edits
#      reach main
#
# Cases 76-77 return to the builder as a unit, to pin its commit-date behavior:
#  76. same base, same content, same message -> the SAME commit SHA (the
#      GIT_AUTHOR_DATE/GIT_COMMITTER_DATE pin, not the wall clock)
#  77. a different base -> a different commit SHA regardless, since the base
#      is the built commit's parent
#
# Cases 78-79 pin the no-op integrity guard (assert_noop_matches_intent): the
# invariant that `noop` is never reported for a run whose INTENDED content is
# not what origin/main carries
# (tactic-eval-finding-noop-verdict-hides-dropped-node-edit — the incident
# printed `verdict: landed ids=… pushed=none context=noop` while origin/main
# still held the pre-edit body):
#  78. END TO END: a far-ahead worktree (an unpushed non-intentions commit on
#      HEAD) editing an EXISTING node whose content differs from origin/main
#      lands that edit and never reports `verdict: landed … context=noop`. The
#      far-ahead rebuild's `git reset --hard` makes HEAD and origin/main equal
#      for every id, so every repository-vs-repository guard on the no-op path
#      is satisfied by construction and none of them can see a dropped edit.
#  79. THE GUARD AS A UNIT (sourced, in the cases 60-69 idiom), because no CLI
#      path currently reaches a mismatch — that is what an assertion is for.
#      Four arms: intent equal to origin/main proceeds silently; intent
#      differing dies naming the id, the preserved snapshot dir and the --base
#      entry, reporting `verdict: not-landed` and never `landed`; a resolved
#      merge's <id>.merged.md matching origin/main proceeds (the shape of the
#      "far-ahead + stale --base: layer-3 merge survives the far-ahead rebuild"
#      case above — cite it by that assertion text, not a case number: PR #2990
#      once cited this same case's earlier ordinal, and an unrelated insertion
#      shifted it out from under the citation), proving the comparison reads
#      snap_intended_file(); and the mirror —
#      frozen original matching while the merge output does not — still dies
#
#  84. THE PARK CARRIES THE CONTENT, run against the REAL park helper — the
#      tsx module extracted from park_write's own heredoc, driven with the real
#      store module (every other case runs the node SHIM, so only this one
#      pins the shipped helper). Two arms: an ordinary snapshot is carried in
#      office_hours.recommendation byte-exactly and still reads back after
#      SNAP_DIR is destroyed; an over-cap snapshot is carried as a strict
#      prefix with a note stating exactly how many bytes were dropped.
#
# Cases 86-88 pin park_and_exit()'s partition to WHICH --base pin refused,
# rather than to "is it a --prune id". Before them, park_ids was ALL_IDS minus
# the bystander prunes, so an invocation passing no --prune parked its whole
# batch on one node's unresolvable divergence, and the collateral never
# self-healed (every enumerating caller skips office_hours != null):
#  86. THE DEFECT, on an invocation with NO --prune at all: three pinned ids,
#      one concurrent same-field edit. Only the diverged id parks; the two ids
#      whose pins still match origin/main land their edits with the park commit
#      and carry no office_hours
#  87. THE NEGATIVE: an id the caller never pinned still parks. Freshness is
#      the --base CAS's answer and nothing else, which is what keeps every park
#      by an unpinned caller (cases 4, 20, 50, 72) behaving as before
#  88. COMPOSITION: a fresh-pin edit and an unrelated --prune ride the same
#      park commit, each in its own subject clause (park / land / prune)
#
# No network and no real gh needed; requires bash + git + jq + setsid, plus
# node and this repo's node_modules (tsx + yaml) for case 84's real-helper run.

set -uo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GC_SCRIPT="$HARNESS_DIR/graph-commit"
[[ -f "$GC_SCRIPT" ]] || { echo "error: graph-commit not found at $GC_SCRIPT" >&2; exit 1; }
command -v jq >/dev/null || { echo "error: jq not found (required by the gh shim)" >&2; exit 1; }
# Required by the SIGKILL cases (53-57): the writer must run in its OWN process
# group so the test can kill the whole tree without killing this harness.
# A hard requirement rather than a skip — a silently skipped kill case is a
# vacuous pass, which is precisely the failure mode these cases exist to end.
command -v setsid >/dev/null || { echo "error: setsid not found (required by the SIGKILL cases)" >&2; exit 1; }

WORK="$(mktemp -d)" || { echo "error: mktemp failed" >&2; exit 1; }
declare -a SNAP_DIRS_TO_CLEAN=()
harness_cleanup() {
  rm -rf "$WORK" "${SNAP_DIRS_TO_CLEAN[@]}"
}
trap harness_cleanup EXIT

PASS=0; FAIL=0
ok() { echo "PASS: $1"; PASS=$((PASS + 1)); }
no() { echo "FAIL: $1"; FAIL=$((FAIL + 1)); }

# A fixture-setup failure is not a test result — it must abort the whole run
# rather than being walked past by `set -uo pipefail` (no -e, deliberately,
# so genuine case FAILs still get tallied instead of aborting the run). Every
# bootstrap operation below that builds the scratch origin/seed is wrapped in
# this guard, extending the mktemp/setsid guard idiom above to the rest of
# fixture setup: a clone or init failure now reports ONE clear diagnostic
# naming the operation instead of silently letting every case that depends on
# it die downstream with a misleading assertion FAIL.
setup_or_die() { "$@" || { echo "error: fixture setup failed: $*" >&2; exit 1; }; }

# --- Scratch origin + seed content ------------------------------------------
ORIGIN="$WORK/origin.git"
setup_or_die git init -q --bare "$ORIGIN"
setup_or_die git -C "$ORIGIN" symbolic-ref HEAD refs/heads/main
# Silence the only asynchronous writer the scratch origin can have: an
# in-process auto-gc that relocates loose objects into a pack right after the
# seed push, racing make_clone's --no-local clone (see there). No assertion
# in this suite depends on gc behavior in the fixtures.
setup_or_die git -C "$ORIGIN" config gc.auto 0
setup_or_die git -C "$ORIGIN" config receive.autogc false
# plant_lock (cases 30/31) runs `git commit-tree` directly in this bare repo,
# which needs an author identity. CI runners have no global git identity, so
# without this commit-tree fails, plant_lock yields an empty sha, and the lock
# is never planted — case 31 lands immediately instead of waiting out the
# expiry, and case 30 passes vacuously with nothing to steal.
setup_or_die git -C "$ORIGIN" config user.email harness@test
setup_or_die git -C "$ORIGIN" config user.name harness

SEED="$WORK/seed"
setup_or_die mkdir -p "$SEED"
setup_or_die git -C "$SEED" init -q -b main
setup_or_die git -C "$SEED" config user.email harness@test
setup_or_die git -C "$SEED" config user.name harness
setup_or_die git -C "$SEED" config gc.auto 0
setup_or_die git -C "$SEED" config receive.autogc false
setup_or_die git -C "$SEED" remote add origin "$ORIGIN"
setup_or_die mkdir -p "$SEED/intentions" \
         "$SEED/packages/intentionsutil/scripts" \
         "$SEED/packages/intentionsutil/src"
setup_or_die cp "$GC_SCRIPT" "$SEED/packages/intentionsutil/scripts/graph-commit"
# The path must exist for STORE_MODULE resolution; the npx shim never loads it.
: >"$SEED/packages/intentionsutil/src/store.js" \
  || { echo "error: fixture setup failed: writing $SEED/packages/intentionsutil/src/store.js" >&2; exit 1; }

seed_node() { # <id> — 12 numbered lines so distant edits rebase cleanly
  local i
  {
    echo "id: $1"
    for i in $(seq 1 12); do echo "line$i: base"; done
  } >"$SEED/intentions/$1.md"
}
for id in t-happy t-merge t-conflict t-ckfail t-ghfail t-pending t-desync v1..v2-migration \
          t-prune-edit t-prune t-prune-guard t-prune-solo t-base t-base-manifest \
          t-farahead t-farahead-prune t-prune-conflict t-dirty-preflight \
          t-cwd-target t-fail-loud-diff t-fail-loud-benign \
          t-lock-contend t-lock-steal t-lock-wait t-lock-hygiene \
          t-farahead-prune-race \
          t-expect-happy t-expect-wrong-repo t-expect-prune \
          t-preexist-conflict t-preexist-rebase t-strand-other t-strand-main \
          t-dup-rows t-partial-dup t-stale-fail t-forged-green \
          t-bystander-prune t-bystander-conflict t-prune-base-stale \
          t-base-bystander-prune t-manifest-foreign t-manifest-prune \
          t-kill-lockwait t-kill-stamp t-kill-busy \
          t-verdict-happy t-verdict-park t-park-retry \
          t-orphan t-live-pending \
          t-plumb-cli t-plumb-dirty t-plumb-race t-plumb-race-conflict \
          t-plumb-noop t-plumb-base \
          t-noop-guard t-noop-unit t-merge-npx-guard \
          t-behind-noop t-behind-advance t-mixed-prune; do
  seed_node "$id"
done

# seed_field_node writes a real ---fenced IntentionNode (id, kind: tactic,
# statement, owner: ai, status: raw — the minimum validateNode requires; see
# packages/intentionsutil/src/schema.ts) plus caller-supplied extra frontmatter
# lines, for the layer-2/3 field-merge cases (17-21) below. Unlike seed_node's
# bare line-based format (kept untouched for cases 1-16, which only exercise
# textual rebase mechanics), this is real enough for a human reader to
# recognize as node content, though the node shim's merge-node.ts branch
# below never actually parses it as YAML — it only greps `key: value` lines.
seed_field_node() { # <id> <extra-yaml-lines...>
  local id="$1"; shift
  {
    echo "---"
    echo "id: $id"
    echo "kind: tactic"
    echo "statement: base statement for $id"
    echo "owner: ai"
    echo "status: raw"
    local line
    for line in "$@"; do echo "$line"; done
    echo "---"
    echo "Placeholder body for $id."
  } >"$SEED/intentions/$id.md"
}
seed_field_node t-field-merge "fieldA: base" "fieldB: base"
seed_field_node t-field-conflict "sentinel: base"
seed_field_node t-field-base-ok "fieldA: base" "fieldB: base"
seed_field_node t-field-base-bad "sentinel: base"
seed_field_node t-farahead-base "fieldA: base" "fieldB: base"
seed_field_node t-farahead-race "fieldA: base" "fieldB: base"
seed_field_node t-farahead-race-conflict "sentinel: base"
seed_field_node t-farahead-list-removal "fieldB: base" "blocked_by:" "  - t-satisfied-blocker" "  - t-other-blocker"
seed_field_node t-base-bystander-conflict "sentinel: base"
seed_field_node t-field-delete-edit "fieldA: base"
seed_field_node t-multi-snap-a "fieldA: base" "fieldB: base"
seed_field_node t-multi-snap-b "sentinel: base"
# Dedicated to the merge-npx-park-storm regression cases (Unit 3 of
# tactic-graph-commit-merge-npx-park-storm): a launch-failure of the merge
# tool must die with no park, while a genuine same-field divergence on an
# otherwise-identical fixture must still park.
seed_field_node t-merge-unrunnable-base "sentinel: base"
seed_field_node t-merge-unrunnable-farahead "sentinel: base"
seed_field_node t-merge-real-divergence "sentinel: base"
# Cases 86-88: the park partition keyed on which --base pin actually refused.
seed_field_node t-fresh-diverged "sentinel: base"
seed_field_node t-fresh-bystander-a "fieldA: base"
seed_field_node t-fresh-bystander-b "fieldA: base"
seed_field_node t-unpinned-diverged "sentinel: base"
seed_field_node t-unpinned-sibling "fieldA: base"
seed_field_node t-mixed-diverged "sentinel: base"
seed_field_node t-mixed-edit "fieldA: base"

setup_or_die git -C "$SEED" add -A
setup_or_die git -C "$SEED" commit -qm seed
setup_or_die git -C "$SEED" push -q origin main

# --- Independent writer clones -------------------------------------------
make_clone() { # <dst> <identity>
  # --no-local routes the clone through upload-pack (one streamed pack)
  # instead of the default local-path file-copy/hardlink of $ORIGIN/objects,
  # which races a source-side loose->pack relocation triggered by auto-gc
  # right after the seed push. --no-hardlinks is NOT equivalent: it keeps the
  # same per-file copy loop and is exposed to the same race.
  #
  # Bounded single retry: the observed CI failure is a genuine race (a
  # source-side loose-to-pack relocation), not a deterministic defect, so one
  # retry usually clears it. The retry is loud (a warning on stderr, so a
  # clean run's output is easy to tell apart from one that needed it) and
  # bounded (exactly one extra attempt, no loop) — if it also fails, this
  # falls through to the same loud abort as a first-attempt failure, naming
  # the operation and destination. The partial destination directory is
  # removed before retrying: the observed failure left dst/.git/objects/…
  # missing files, so retrying git clone into the same half-populated
  # directory would fail differently than a fresh attempt.
  if ! git clone -q --no-local "$ORIGIN" "$1"; then
    echo "warning: fixture clone failed, retrying once: $1" >&2
    rm -rf "$1"
    if ! git clone -q --no-local "$ORIGIN" "$1"; then
      echo "error: fixture setup failed: git clone --no-local $ORIGIN $1" >&2
      exit 1
    fi
  fi
  setup_or_die git -C "$1" config user.email "$2@test"
  setup_or_die git -C "$1" config user.name "$2"
}
A="$WORK/a"; B="$WORK/b"
make_clone "$A" writer-a
make_clone "$B" writer-b

# --- gh / npx PATH shims ------------------------------------------------------
mkdir -p "$WORK/bin" "$WORK/fixtures"
MODE_FILE="$WORK/gh-mode"
CALL_LOG="$WORK/gh-calls"
# Parent-check-suite lookups are counted separately from check-run polls: a
# suite lookup is not a poll, and every existing poll-count assertion would
# otherwise shift the moment check_suite_concluded() fires.
SUITE_CALL_LOG="$WORK/gh-suite-calls"
FIXTURE_DIR="$WORK/fixtures"

# Fixture JSON per mode: {status,conclusion}-shaped check_runs entries for the
# four required names, run through graph-commit's REAL --jq filter below (not
# a hardcoded count) so the filter itself is exercised end-to-end.
#
# Every genuine row carries `"app": {"slug": "github-actions"}` because that is
# what the real payload carries for a row written by the GitHub Actions App —
# and the filter now considers ONLY those rows, so a fixture row without it is
# invisible to the gate (see the forged-green fixture, which relies on exactly
# that).
cat >"$FIXTURE_DIR/green.json" <<'JSON'
{"check_runs": [
  {"name": "acceptance", "id": 1, "app": {"slug": "github-actions"}, "status": "completed", "conclusion": "success"},
  {"name": "preview-and-smoke", "id": 2, "app": {"slug": "github-actions"}, "status": "completed", "conclusion": "success"},
  {"name": "lint", "id": 3, "app": {"slug": "github-actions"}, "status": "completed", "conclusion": "success"},
  {"name": "unit-tests", "id": 4, "app": {"slug": "github-actions"}, "status": "completed", "conclusion": "success"}
]}
JSON

cat >"$FIXTURE_DIR/pending.json" <<'JSON'
{"check_runs": [
  {"name": "acceptance", "id": 1, "app": {"slug": "github-actions"}, "status": "in_progress", "conclusion": null},
  {"name": "preview-and-smoke", "id": 2, "app": {"slug": "github-actions"}, "status": "in_progress", "conclusion": null},
  {"name": "lint", "id": 3, "app": {"slug": "github-actions"}, "status": "in_progress", "conclusion": null},
  {"name": "unit-tests", "id": 4, "app": {"slug": "github-actions"}, "status": "in_progress", "conclusion": null}
]}
JSON

cat >"$FIXTURE_DIR/concluded-fail.json" <<'JSON'
{"check_runs": [
  {"name": "acceptance", "id": 1, "app": {"slug": "github-actions"}, "status": "completed", "conclusion": "success"},
  {"name": "preview-and-smoke", "id": 2, "app": {"slug": "github-actions"}, "status": "completed", "conclusion": "success"},
  {"name": "lint", "id": 3, "app": {"slug": "github-actions"}, "status": "completed", "conclusion": "success"},
  {"name": "unit-tests", "id": 4, "app": {"slug": "github-actions"}, "status": "completed", "conclusion": "failure"}
]}
JSON

# Desynced-success: one required check's status is still in_progress even
# though its conclusion already reports success (the GitHub check-runs desync
# the fixed --jq filter tolerates by keying off .conclusion alone) — #2457.
cat >"$FIXTURE_DIR/desynced-success.json" <<'JSON'
{"check_runs": [
  {"name": "acceptance", "id": 1, "app": {"slug": "github-actions"}, "status": "completed", "conclusion": "success"},
  {"name": "preview-and-smoke", "id": 2, "app": {"slug": "github-actions"}, "status": "completed", "conclusion": "success"},
  {"name": "lint", "id": 3, "app": {"slug": "github-actions"}, "status": "completed", "conclusion": "success"},
  {"name": "unit-tests", "id": 4, "app": {"slug": "github-actions"}, "status": "in_progress", "conclusion": "success"}
]}
JSON

# Duplicate rows: the incident shape. A SHA re-stamped by two pushes carries
# TWO completed/success rows per required name (distinct id and started_at),
# so a row-count gate sees 8 green rows and `== 4` can never fire. The
# unrelated failing CodeQL row proves the name filter still excludes non-
# required runs.
cat >"$FIXTURE_DIR/duplicate-rows.json" <<'JSON'
{"check_runs": [
  {"name": "acceptance",        "id": 101, "app": {"slug": "github-actions"}, "started_at": "2026-07-27T10:00:00Z", "status": "completed", "conclusion": "success"},
  {"name": "acceptance",        "id": 201, "app": {"slug": "github-actions"}, "started_at": "2026-07-27T11:00:00Z", "status": "completed", "conclusion": "success"},
  {"name": "preview-and-smoke", "id": 102, "app": {"slug": "github-actions"}, "started_at": "2026-07-27T10:00:00Z", "status": "completed", "conclusion": "success"},
  {"name": "preview-and-smoke", "id": 202, "app": {"slug": "github-actions"}, "started_at": "2026-07-27T11:00:00Z", "status": "completed", "conclusion": "success"},
  {"name": "lint",              "id": 103, "app": {"slug": "github-actions"}, "started_at": "2026-07-27T10:00:00Z", "status": "completed", "conclusion": "success"},
  {"name": "lint",              "id": 203, "app": {"slug": "github-actions"}, "started_at": "2026-07-27T11:00:00Z", "status": "completed", "conclusion": "success"},
  {"name": "unit-tests",        "id": 104, "app": {"slug": "github-actions"}, "started_at": "2026-07-27T10:00:00Z", "status": "completed", "conclusion": "success"},
  {"name": "unit-tests",        "id": 204, "app": {"slug": "github-actions"}, "started_at": "2026-07-27T11:00:00Z", "status": "completed", "conclusion": "success"},
  {"name": "Analyze (javascript)", "id": 999, "app": {"slug": "github-actions"}, "started_at": "2026-07-27T11:30:00Z", "status": "completed", "conclusion": "failure"}
]}
JSON

# Partial duplicate: four rows total but only THREE distinct required names
# green — lint is duplicated and acceptance has no row at all. The regression
# guard against naively relaxing the gate to a `-ge 4` row count.
cat >"$FIXTURE_DIR/partial-duplicate.json" <<'JSON'
{"check_runs": [
  {"name": "lint",              "id": 301, "app": {"slug": "github-actions"}, "started_at": "2026-07-27T10:00:00Z", "status": "completed", "conclusion": "success"},
  {"name": "lint",              "id": 302, "app": {"slug": "github-actions"}, "started_at": "2026-07-27T11:00:00Z", "status": "completed", "conclusion": "success"},
  {"name": "preview-and-smoke", "id": 303, "app": {"slug": "github-actions"}, "started_at": "2026-07-27T10:00:00Z", "status": "completed", "conclusion": "success"},
  {"name": "unit-tests",        "id": 304, "app": {"slug": "github-actions"}, "started_at": "2026-07-27T10:00:00Z", "status": "completed", "conclusion": "success"}
]}
JSON

# Stale fail then green: acceptance's OLDER row concluded failure and its
# NEWER row (higher server-assigned id) concluded success, so max_by(.id) must
# resolve the name to success rather than treating the stale failure as a hard
# stop. The stale row deliberately carries the LATER started_at, so a filter
# that still ordered on the caller-settable timestamp would resolve this name
# to failure and fail this case.
cat >"$FIXTURE_DIR/stale-fail-then-green.json" <<'JSON'
{"check_runs": [
  {"name": "acceptance",        "id": 401, "app": {"slug": "github-actions"}, "started_at": "2026-07-27T12:00:00Z", "status": "completed", "conclusion": "failure"},
  {"name": "acceptance",        "id": 402, "app": {"slug": "github-actions"}, "started_at": "2026-07-27T11:00:00Z", "status": "completed", "conclusion": "success"},
  {"name": "preview-and-smoke", "id": 403, "app": {"slug": "github-actions"}, "started_at": "2026-07-27T11:00:00Z", "status": "completed", "conclusion": "success"},
  {"name": "lint",              "id": 404, "app": {"slug": "github-actions"}, "started_at": "2026-07-27T11:00:00Z", "status": "completed", "conclusion": "success"},
  {"name": "unit-tests",        "id": 405, "app": {"slug": "github-actions"}, "started_at": "2026-07-27T11:00:00Z", "status": "completed", "conclusion": "success"}
]}
JSON

# Forged green: a genuine GitHub-Actions `lint` FAILURE row, plus a row a
# `checks: write` principal (any other App, or a PAT) could POST onto the
# scratch SHA — same name, conclusion success, a far-future caller-supplied
# started_at, and (as any forger would) a high id. Neither the timestamp nor
# the id may let it supersede the genuine row: the producer filter drops it
# before a winner is picked, so `lint` resolves to the real failure and the
# gate refuses hard (exit 2) instead of fast-forwarding a red SHA onto main.
cat >"$FIXTURE_DIR/forged-green.json" <<'JSON'
{"check_runs": [
  {"name": "acceptance",        "id": 501, "app": {"slug": "github-actions"}, "started_at": "2026-07-27T11:00:00Z", "status": "completed", "conclusion": "success"},
  {"name": "preview-and-smoke", "id": 502, "app": {"slug": "github-actions"}, "started_at": "2026-07-27T11:00:00Z", "status": "completed", "conclusion": "success"},
  {"name": "unit-tests",        "id": 503, "app": {"slug": "github-actions"}, "started_at": "2026-07-27T11:00:00Z", "status": "completed", "conclusion": "success"},
  {"name": "lint",              "id": 504, "app": {"slug": "github-actions"}, "started_at": "2026-07-27T11:00:00Z", "status": "completed", "conclusion": "failure"},
  {"name": "lint",              "id": 999999, "app": {"slug": "attacker-app"}, "started_at": "9999-01-01T00:00:00Z", "status": "completed", "conclusion": "success"}
]}
JSON

# Orphaned required row (tactic-orphaned-check-run-pins-pending-ci-guard): three
# required names concluded green while `preview-and-smoke` sits at in_progress
# with a null conclusion — the shape that burned the whole green-wait budget on
# 2026-08-11. The row carries its parent check_suite id, which is what lets
# check_suite_concluded() tell an orphan from a slow check. The `orphan-pending`
# and `live-pending` fixtures are byte-identical: only the SUITE fixture below
# differs, so the pair isolates exactly the suite-status signal.
for _m in orphan-pending live-pending; do
cat >"$FIXTURE_DIR/$_m.json" <<'JSON'
{"check_runs": [
  {"name": "acceptance", "id": 1, "app": {"slug": "github-actions"}, "status": "completed", "conclusion": "success", "check_suite": {"id": 85480333626}},
  {"name": "preview-and-smoke", "id": 2, "app": {"slug": "github-actions"}, "status": "in_progress", "conclusion": null, "check_suite": {"id": 85480333626}},
  {"name": "lint", "id": 3, "app": {"slug": "github-actions"}, "status": "completed", "conclusion": "success", "check_suite": {"id": 85480333626}},
  {"name": "unit-tests", "id": 4, "app": {"slug": "github-actions"}, "status": "completed", "conclusion": "success", "check_suite": {"id": 85480333626}}
]}
JSON
done
# The orphan signal: the parent suite has already reported completed, so the
# unconcluded row can never report.
cat >"$FIXTURE_DIR/orphan-pending-suite-85480333626.json" <<'JSON'
{"status": "completed", "conclusion": "success"}
JSON
# Default for any un-fixtured suite lookup, and the `live-pending` negative: the
# suite is still running, so an unconcluded row is a genuinely slow check.
cat >"$FIXTURE_DIR/suite-running.json" <<'JSON'
{"status": "in_progress", "conclusion": null}
JSON

cat >"$WORK/bin/gh" <<'SH'
#!/usr/bin/env bash
# gh shim: behavior selected by $GC_GH_MODE_FILE; every invocation appends one
# fixed marker line to $GC_GH_CALL_LOG so tests can assert poll counts (the
# real args contain a multi-line --jq program, so they must not be logged raw).
# For modes that reach the check-runs endpoint, this runs graph-commit's REAL
# --jq program (extracted from "$@") against a mode-specific fixture file, so
# the filter itself is exercised rather than a hardcoded count string.
args="$*"
mode="$(cat "$GC_GH_MODE_FILE")"
# check_suite_concluded()'s parent-suite lookup is a DIFFERENT endpoint from the
# check-run poll, so it is logged to its own file — poll-count assertions must
# keep counting polls, not suite lookups. Fixture per mode+suite:
# <mode>-suite-<id>.json; when absent the suite is reported as still running,
# which is the inert default. Every legacy fixture's rows carry no `check_suite`
# at all, so graph-commit emits `-` for them and this branch is never reached.
if [[ "$args" == *check-suites/* ]]; then
  echo "gh-suite-invocation" >>"${GC_GH_SUITE_CALL_LOG:-/dev/null}"
  suite_id="$(printf '%s' "$args" | sed -E 's#.*check-suites/([^/ ]+).*#\1#')"
  suite_fixture="$GC_FIXTURE_DIR/$mode-suite-$suite_id.json"
  [[ -f "$suite_fixture" ]] || suite_fixture="$GC_FIXTURE_DIR/suite-running.json"
  suite_jq=""
  while [[ $# -gt 0 ]]; do
    if [[ "$1" == "--jq" ]]; then suite_jq="$2"; break; fi
    shift
  done
  jq -r "$suite_jq" "$suite_fixture"
  exit 0
fi
echo "gh-invocation" >>"$GC_GH_CALL_LOG"
if [[ "$mode" == "hard-fail" ]]; then
  echo "gh: HTTP 403: API rate limit exceeded (harness shim)" >&2
  exit 1
fi
if [[ "$mode" == "blocked-green" ]]; then
  while [[ ! -e "$GC_GH_SENTINEL_FILE" ]]; do sleep 0.2; done
  mode=green
fi
jq_program=""
while [[ $# -gt 0 ]]; do
  if [[ "$1" == "--jq" ]]; then jq_program="$2"; break; fi
  shift
done
fixture="$GC_FIXTURE_DIR/$mode.json"
[[ -f "$fixture" ]] || { echo "gh shim: no fixture for mode $mode" >&2; exit 99; }
jq -r "$jq_program" "$fixture"
SH

printf '#!/usr/bin/env bash\nREAL_NODE=%q\n' "$(command -v node)" >"$WORK/bin/node"
cat >>"$WORK/bin/node" <<'SH'
# npx shim: dispatches on the script path passed right after `tsx` (argv[2] to
# this shim) so it can emulate TWO distinct real tsx invocations without node:
#
#   merge-node.ts  — graph-commit's run_merge_node() layer-2/3 CLI. This branch
#     does NOT reimplement the real three-way YAML field merge (that primitive,
#     mergeIntentionNodes, is Unit 1's job and its correctness is covered by
#     packages/intentionsutil/test/node-merge.test.ts — the source of truth).
#     This shim only proves graph-commit invokes merge-node.ts at the right
#     point and branches correctly on its resolved/unresolved verdict. It does
#     so with a SIMPLIFIED three-way merge over bare `key: value` lines (works
#     against both seed_node's line1..line12 format and seed_field_node's real
#     frontmatter, since both are just newline-delimited `key: value` pairs):
#     for each key appearing in ours and/or theirs, if both sides agree (or
#     only one side touched it), that value wins; if both sides changed it
#     away from base to DIFFERENT values (or there is no base to compare
#     against and the two sides disagree), it is an unresolved conflict. A
#     missing --ours file exits 3 with no JSON, mirroring the real CLI's
#     "ran and failed on its inputs" contract (see merge-node.ts's output
#     contract header) instead of silently resolving from theirs alone. The code
#     must be 3, not 1: graph-commit's run_merge_node() reads 3 as a content
#     outcome that parks, and every OTHER non-zero status as "the merge tool
#     could not be executed", which dies without writing any office_hours.
#   anything else (park_write's throwaway tsx module) — emulates `npx tsx
#     <helper> <storeModule> <intentionsDir> <since> <reason> <snapDir>
#     <pruneCsv> <id...>` without node. Mirrors the real helper's two-pass
#
# GC_MERGE_NODE_UNRUNNABLE, when set, short-circuits BEFORE the case
# statement below: it models a merge tool that never started (a module
# resolution failure, e.g. ERR_MODULE_NOT_FOUND) rather than one that ran and
# reached a verdict. Deliberately exits 1, not 127: run_merge_node() must
# route "the tool could not be executed" to die() on ANY non-3, non-parsable
# outcome, not merely a recognizable "missing binary" code — a naive
# rc==127-only check would misclassify a real ERR_MODULE_NOT_FOUND (which
# also exits 1) as a content divergence and park it. See
# tactic-graph-commit-merge-npx-park-storm.
#     shape: verify every id is readable first, then write all. Composes
#     office_hours.recommendation additively like the real helper: a per-id BASE
#     recovery string distinguishing a pruned id (no snapshot) from an ordinary
#     edit id (snapshot path included), then APPENDS the out-of-band field
#     breakdown from $GRAPH_COMMIT_RECOMMENDATION_FILE (the mechanical-unresolved
#     text — see graph-commit's park_write) when it is set, so tests can assert
#     on both the prune-vs-edit distinction and the field detail reaching the
#     landed node.
if [[ "$1" == "--import" && "$2" == "tsx/esm" ]]; then
  shift 2
  set -- tsx "$@"          # re-shape argv to what the body below already parses
else
  exec "$REAL_NODE" "$@"   # any other node invocation runs for real
fi

if [[ -n "${GC_MERGE_NODE_UNRUNNABLE:-}" ]]; then
  echo "node: ERR_MODULE_NOT_FOUND: Cannot find package 'tsx'" >&2
  exit 1
fi

case "$(basename "$2")" in
  merge-node.ts)
    shift 2
    base=""; ours=""; theirs=""; out=""
    while [[ $# -gt 0 ]]; do
      case "$1" in
        --base) base="$2"; shift 2 ;;
        --ours) ours="$2"; shift 2 ;;
        --theirs) theirs="$2"; shift 2 ;;
        --out) out="$2"; shift 2 ;;
        *) shift ;;
      esac
    done

    # Mirror the real CLI's "ran and failed ON ITS INPUTS" contract (see the
    # output-contract header of merge-node.ts: exit 3, an error on stderr, NO
    # JSON on stdout) for a missing --ours file. Without this guard the shim
    # below silently treats a nonexistent --ours as an empty OURS_V map and
    # resolves from theirs alone — diverging from the real merge-node.ts, which
    # throws ENOENT reading a missing --ours path and exits 3 from its catch.
    # The 3 is load-bearing, not cosmetic: run_merge_node() routes exit 3 to a
    # park (Case 47 depends on that) and every other non-zero status to a die
    # with no office_hours written. Exiting 1 here would model a merge tool that
    # never started, which is a different test.
    if [[ -n "$ours" && ! -f "$ours" ]]; then
      echo "merge-node shim: --ours file does not exist: $ours" >&2
      exit 3
    fi

    # theirs genuinely absent (the id no longer exists on the landed side).
    # Branches on --base, mirroring merge-node.ts:74-78: if base is also
    # empty/absent, this is a genuine add/add and ours is the only content,
    # so ours wins outright. If base is non-empty, theirs going empty means
    # the landed side deleted a node ours still edits — an unresolved
    # delete/modify conflict, not a silent ours-wins.
    if [[ -z "$theirs" ]]; then
      if [[ -n "$base" && -f "$base" && -s "$base" ]]; then
        id="$(basename "$ours" .md)"
        printf '{"resolved":false,"conflicts":[{"field":"<node>","ours":"%s","theirs":null}]}\n' "$id"
        exit 0
      fi
      [[ -n "$out" && -n "$ours" ]] && cp -- "$ours" "$out"
      printf '{"resolved":true,"conflicts":[]}\n'
      exit 0
    fi

    declare -A BASE_V=() OURS_V=() THEIRS_V=()
    declare -a ALL_KEYS=()
    if [[ -n "$base" && -f "$base" ]]; then
      while IFS= read -r line || [[ -n "$line" ]]; do
        [[ "$line" == *:* ]] || continue
        k="${line%%:*}"; v="${line#*: }"
        [[ -n "${BASE_V[$k]+x}" ]] || BASE_V["$k"]="$v"
      done <"$base"
    fi
    if [[ -n "$ours" && -f "$ours" ]]; then
      while IFS= read -r line || [[ -n "$line" ]]; do
        [[ "$line" == *:* ]] || continue
        k="${line%%:*}"; v="${line#*: }"
        if [[ -z "${OURS_V[$k]+x}" ]]; then OURS_V["$k"]="$v"; ALL_KEYS+=("$k"); fi
      done <"$ours"
    fi
    if [[ -n "$theirs" && -f "$theirs" ]]; then
      while IFS= read -r line || [[ -n "$line" ]]; do
        [[ "$line" == *:* ]] || continue
        k="${line%%:*}"; v="${line#*: }"
        [[ -n "${THEIRS_V[$k]+x}" ]] || THEIRS_V["$k"]="$v"
        seen=0
        for existing in "${ALL_KEYS[@]:-}"; do [[ "$existing" == "$k" ]] && { seen=1; break; }; done
        [[ $seen -eq 1 ]] || ALL_KEYS+=("$k")
      done <"$theirs"
    fi

    conflicts_json="[]"
    resolved=true
    merged_lines=()
    for k in "${ALL_KEYS[@]}"; do
      have_b=0; [[ -n "${BASE_V[$k]+x}" ]] && have_b=1
      have_o=0; [[ -n "${OURS_V[$k]+x}" ]] && have_o=1
      have_t=0; [[ -n "${THEIRS_V[$k]+x}" ]] && have_t=1
      bv="${BASE_V[$k]-}"; ov="${OURS_V[$k]-}"; tv="${THEIRS_V[$k]-}"
      final=""
      if [[ $have_o -eq 1 && $have_t -eq 1 && "$ov" == "$tv" ]]; then
        final="$ov"
      elif [[ $have_b -eq 1 && $have_o -eq 1 && "$ov" == "$bv" && $have_t -eq 1 ]]; then
        final="$tv"
      elif [[ $have_b -eq 1 && $have_t -eq 1 && "$tv" == "$bv" && $have_o -eq 1 ]]; then
        final="$ov"
      elif [[ $have_o -eq 1 && $have_t -eq 0 ]]; then
        final="$ov"
      elif [[ $have_t -eq 1 && $have_o -eq 0 ]]; then
        final="$tv"
      else
        resolved=false
        conflicts_json="$(jq -c --arg field "$k" --arg ours "$ov" --arg theirs "$tv" \
          '. + [{field:$field, ours:$ours, theirs:$theirs}]' <<<"$conflicts_json")"
        continue
      fi
      merged_lines+=("$k: $final")
    done

    if [[ "$resolved" == true ]]; then
      if [[ -n "$out" ]]; then
        printf '%s\n' "${merged_lines[@]}" >"$out"
      fi
      printf '{"resolved":true,"conflicts":[]}\n'
    else
      printf '{"resolved":false,"conflicts":%s}\n' "$conflicts_json"
    fi
    exit 0
    ;;
  *)
    shift 3   # tsx, helper script path, store module path
    dir="$1"; since="$2"; reason="$3"; snap_dir="$4"; prune_csv="$5"; shift 5
    # SNAP_DIR path contract, mirroring the real helper's snapIntended() /
    # preservedContent() (graph-commit's park_write) and the shell-side
    # snap_intended_file(): <id>.md is the writer's FROZEN pre-merge original,
    # and <id>.merged.md — present only when a layer-2/3 merge resolved for that
    # id — is graph-commit's own merge output. Which content a human is pointed
    # at, and how the two are labelled, is decided in ONE place here, as it is
    # in the real helper.
    snap_intended() {
      if [[ -f "$snap_dir/$1.merged.md" ]]; then
        printf '%s' "$snap_dir/$1.merged.md"
      else
        printf '%s' "$snap_dir/$1.md"
      fi
    }
    preserved_content() {
      local orig="$snap_dir/$1.md" merged="$snap_dir/$1.merged.md"
      # Mirrors the real helper's preservedContent(), including its two
      # conditionals:
      #  - the CARRIED-copy claim is made only when a frozen original actually
      #    exists to carry. snap_dir can hold <id>.merged.md with no <id>.md
      #    beside it, and a record that promises a verbatim block that is not
      #    there sends a human looking for content nobody wrote down.
      #  - the "may not survive past this session" caveat is attached to the
      #    snap_dir paths and to NOTHING else. The carried copy is inside the
      #    recommendation, which lands on origin/main; calling that perishable
      #    would be backwards.
      local local_only="on this machine only — it may not survive past this session"
      local own carried_ref
      if [[ -f "$orig" ]]; then
        own="this session's OWN unlanded content preserved at $orig ($local_only), a frozen pre-merge copy; a VERBATIM copy of it is carried at the end of this recommendation"
        carried_ref=", and the carried copy at the end of this recommendation as the record of what this session meant to write"
      else
        own="this session's OWN pre-merge content was NOT preserved: no frozen original exists at $orig, so this record carries no verbatim copy"
        carried_ref="; nothing verbatim was carried, so that partial merge is the only surviving artifact of this session's edit"
      fi
      if [[ -f "$merged" ]]; then
        printf '%s' "$own; graph-commit's PARTIAL MERGE of it with the concurrent writer's landed edit is beside it at $merged ($local_only), which is neither this session's content nor anything that landed$carried_ref"
      else
        printf '%s' "$own"
      fi
    }
    # own_content_embed — mirrors the real helper's ownContentEmbed(): the losing
    # writer's frozen original, carried VERBATIM at the end of the
    # recommendation so the record that lands on origin/main does not depend on
    # snap_dir surviving. Emits nothing for an id with no snapshot (a --prune id
    # has no content to carry), which is why the prune cases still assert the
    # absence of any snapshot path.
    # Indented four spaces because the real helper writes through writeNode, and
    # the YAML emitter indents the whole scalar — so no carried line ever sits at
    # column 0 on main. Assertions anchored at ^ (e.g. case 4's "the losing
    # writer's line did NOT land as node content") depend on that.
    # The real helper also CAPS the embed at 65536 bytes with an explicit
    # truncation notice; this shim does not, because every harness fixture is a
    # few hundred bytes. The cap and its notice are covered against the REAL
    # helper by case 84.
    own_content_embed() {
      local orig="$snap_dir/$1.md"
      [[ -f "$orig" ]] || return 0
      {
        printf "%s\n" "----- BEGIN this session's unlanded content for $1 (verbatim) -----"
        cat "$orig"
        printf "%s\n" "----- END this session's unlanded content for $1 -----"
      } | sed 's/^/    /'
    }
    # Delete/modify divergence: a non-prune id whose target file is absent but
    # whose snapshot exists was deleted by another writer's already-landed
    # change while this session's edit was in flight; re-materialize it from the
    # snapshot (mirrors the real helper) and record it as a divergence. Hard-
    # error only when NEITHER the target nor the snapshot exists.
    deleted_csv=""
    for id in "$@"; do
      if [[ -f "$dir/$id.md" ]]; then
        continue
      fi
      if [[ ",$prune_csv," != *",$id,"* && -f "$snap_dir/$id.md" ]]; then
        cp "$(snap_intended "$id")" "$dir/$id.md"
        deleted_csv="$deleted_csv,$id"
        continue
      fi
      echo "npx shim: unreadable node $id" >&2; exit 1
    done
    deleted_csv="$deleted_csv,"
    # Report the re-materialized ids back out of band, NUL-delimited (mirrors
    # the real helper's GRAPH_COMMIT_RESURRECTED_FILE contract). park_and_exit()
    # reads this into RESURRECTED_IDS and refuses to stage those paths, so the
    # other writer's landed deletion is not reverted by the park commit.
    if [[ -n "${GRAPH_COMMIT_RESURRECTED_FILE:-}" ]]; then
      : >"$GRAPH_COMMIT_RESURRECTED_FILE"
      for id in "$@"; do
        if [[ ",$deleted_csv," == *",$id,"* ]]; then
          printf '%s\0' "$id" >>"$GRAPH_COMMIT_RESURRECTED_FILE"
        fi
      done
    fi
    # The out-of-band field breakdown (mechanical-unresolved detail), appended
    # after each node's base recovery text — mirrors the real helper.
    field_breakdown=""
    if [[ -n "${GRAPH_COMMIT_RECOMMENDATION_FILE:-}" && -f "$GRAPH_COMMIT_RECOMMENDATION_FILE" ]]; then
      field_breakdown="$(cat "$GRAPH_COMMIT_RECOMMENDATION_FILE")"
    fi
    for id in "$@"; do
      if [[ ",$prune_csv," == *",$id,"* ]]; then
        rec="prune, no content snapshot, mailbox discipline"
      elif [[ ",$deleted_csv," == *",$id,"* ]]; then
        rec="delete/modify divergence: other writer deleted this node while this session's edit was in flight; the landed deletion WINS and this record is LOCAL ONLY. Re-materialized from $(snap_intended "$id") with authored body preserved, untracked; $(preserved_content "$id").
Recommended: a human picks ONE of two intents.
(1) OVERRIDE the deletion: review the file, drop office_hours, re-run graph-commit ${id}.
(2) CONFIRM the other writer's deletion: rm ${dir}/${id}.md.
Mailbox discipline."
      else
        rec="$(preserved_content "$id"); mailbox discipline"
      fi
      [[ -n "$field_breakdown" ]] && rec="$rec"$'\n\n'"$field_breakdown"
      # Carried content last, after the prose and the field breakdown — the
      # real helper's third composition layer.
      embed="$(own_content_embed "$id")"
      [[ -n "$embed" ]] && rec="$rec"$'\n\n'"$embed"
      # SET, not append. The real helper does `node.office_hours = {...}` and
      # writeNode serializes the whole node, so re-parking a node that ALREADY
      # carries an office_hours block REPLACES it — which is what makes the
      # idempotent-retry park byte-identical (nothing to commit, nothing to
      # push). A blind append here would fabricate a second block, leave the
      # file dirty, and hide that path from the harness entirely. This shim
      # always writes the block last, so "from the block's opening line to EOF"
      # is exactly the previous block.
      sed -i '/^office_hours: {/,$d' "$dir/$id.md"
      printf 'office_hours: {reason: "%s", since: %s, recommendation: "%s"}\n' "$reason" "$since" "$rec" >>"$dir/$id.md"
      echo "graph-commit: set office_hours on $id (since=$since)" >&2
    done
    ;;
esac
SH

printf '#!/usr/bin/env bash\nNPX_CALL_LOG=%q\n' "$WORK/npx-calls.log" >"$WORK/bin/npx"
cat >>"$WORK/bin/npx" <<'SH'
printf '%s\n' "$*" >>"$NPX_CALL_LOG"
echo "npx shim: npx must not be invoked by graph-commit (see tactic-graph-commit-merge-npx-park-storm)" >&2
exit 127
SH
chmod +x "$WORK/bin/gh" "$WORK/bin/npx" "$WORK/bin/node"

# --- Helpers ------------------------------------------------------------------
set_mode() { printf '%s' "$1" >"$MODE_FILE"; : >"$CALL_LOG"; : >"$SUITE_CALL_LOG"; }
gh_calls() { wc -l <"$CALL_LOG" | tr -d ' '; }
gh_suite_calls() { wc -l <"$SUITE_CALL_LOG" | tr -d ' '; }
origin_show() { git -C "$ORIGIN" show "main:intentions/$1.md"; }
origin_sha() { git -C "$ORIGIN" rev-parse main; }
sync_clone() { git -C "$1" fetch -q origin main && git -C "$1" reset -q --hard FETCH_HEAD; }
edit_line() { # <clone> <id> <n> <text>
  sed -i "s/^line$3: .*/line$3: $4/" "$1/intentions/$2.md"
}
edit_field() { # <clone> <id> <field> <value> — for seed_field_node fixtures
  sed -i "s/^$3: .*/$3: $4/" "$1/intentions/$2.md"
}
scratch_refs() { git -C "$ORIGIN" for-each-ref --format='%(refname)' 'refs/heads/graph/**'; }
lock_ref_exists() { git -C "$ORIGIN" show-ref --verify --quiet refs/graph/landing-lock; }

run_gc() { # <clone> [graph-commit args...]; knobs: GC_POLL GC_TIMEOUT GC_ATTEMPTS
           # GC_LOCK_TTL GC_LOCK_POLL GC_LOCK_WAIT GC_SENTINEL
           # GC_MERGE_NODE_UNRUNNABLE
  local clone="$1"; shift
  (
    cd "$clone" || exit 99
    export PATH="$WORK/bin:$PATH"
    export GC_GH_MODE_FILE="$MODE_FILE" GC_GH_CALL_LOG="$CALL_LOG" GC_FIXTURE_DIR="$FIXTURE_DIR"
    export GC_GH_SUITE_CALL_LOG="$SUITE_CALL_LOG"
    export GRAPH_COMMIT_CHECK_POLL_SECONDS="${GC_POLL:-0}"
    export GRAPH_COMMIT_CHECK_TIMEOUT_SECONDS="${GC_TIMEOUT:-5}"
    export GRAPH_COMMIT_MAX_ATTEMPTS="${GC_ATTEMPTS:-5}"
    export GRAPH_COMMIT_LOCK_TTL_SECONDS="${GC_LOCK_TTL:-}"
    export GRAPH_COMMIT_LOCK_POLL_SECONDS="${GC_LOCK_POLL:-}"
    export GRAPH_COMMIT_LOCK_WAIT_SECONDS="${GC_LOCK_WAIT:-}"
    export GC_GH_SENTINEL_FILE="${GC_SENTINEL:-}"
    export GC_MERGE_NODE_UNRUNNABLE="${GC_MERGE_NODE_UNRUNNABLE:-}"
    bash packages/intentionsutil/scripts/graph-commit "$@"
  )
}

# --- SIGKILL harness (cases 53-57) -------------------------------------------
# A SIGKILL fires no trap, so the writer's cleanup() never runs: the scratch
# branch survives on origin, the landing lock stays claimed until its TTL, and
# any local commit already made is left behind as an orphan. That is exactly
# the state these cases must produce, and it cannot be produced by returning a
# non-zero exit code from a shim — only by actually killing the process tree.
#
# WAITING FOR THE WRITER TO REACH THE RIGHT POINT. Never `pgrep -f
# graph-commit` here: a pgrep whose pattern is the writer's command line also
# matches the poll loop's OWN command line, so the loop never exits and the
# kill never fires. Every wait below polls a filesystem-observable condition
# instead (the writer's own FETCH_HEAD, the gh call log), in the same
# bounded-poll shape case 29 already uses.

# wait_until <max-tenths-of-a-second> <command...> — poll <command> until it
# succeeds. Returns 1 if it never does, so callers report a real failure rather
# than proceeding against an unmet precondition.
wait_until() {
  local tries="$1"; shift
  local i
  for (( i=0; i<tries; i++ )); do
    "$@" && return 0
    sleep 0.1
  done
  return 1
}

fetch_head_is() { # <clone> <sha> — the writer's last `git fetch` landed on <sha>
  [[ "$(git -C "$1" rev-parse FETCH_HEAD 2>/dev/null || true)" == "$2" ]]
}
gh_calls_at_least() { [[ "$(gh_calls)" -ge "$1" ]]; }
group_gone() { ! kill -0 -- "-$1" 2>/dev/null; }

# start_gc_killable <pgidfile> <outfile> <clone> [graph-commit args...]
# Launch graph-commit under `setsid` so it leads its own process group, which
# is what makes `kill -9 -- -<pgid>` reach the whole tree (git, the gh shim,
# its sleeps) without touching this harness — a plain background job would
# share the harness's process group.
# The group leader writes its own pid — post-setsid that pid IS the pgid — to
# <pgidfile> and then `exec`s graph-commit, so the recorded pid stays valid for
# the writer's whole life. Honors the same GC_* knobs as run_gc().
GC_BG_PID=""
start_gc_killable() {
  local pgidfile="$1" outfile="$2" clone="$3"; shift 3
  rm -f "$pgidfile"
  setsid env \
    PATH="$WORK/bin:$PATH" \
    GC_GH_MODE_FILE="$MODE_FILE" \
    GC_GH_CALL_LOG="$CALL_LOG" \
    GC_GH_SUITE_CALL_LOG="$SUITE_CALL_LOG" \
    GC_FIXTURE_DIR="$FIXTURE_DIR" \
    GC_GH_SENTINEL_FILE="${GC_SENTINEL:-}" \
    GC_PGID_FILE="$pgidfile" \
    GRAPH_COMMIT_CHECK_POLL_SECONDS="${GC_POLL:-0}" \
    GRAPH_COMMIT_CHECK_TIMEOUT_SECONDS="${GC_TIMEOUT:-5}" \
    GRAPH_COMMIT_MAX_ATTEMPTS="${GC_ATTEMPTS:-5}" \
    GRAPH_COMMIT_LOCK_TTL_SECONDS="${GC_LOCK_TTL:-}" \
    GRAPH_COMMIT_LOCK_POLL_SECONDS="${GC_LOCK_POLL:-}" \
    GRAPH_COMMIT_LOCK_WAIT_SECONDS="${GC_LOCK_WAIT:-}" \
    bash -c 'cd "$1" || exit 99
             shift
             printf "%s" "$$" >"$GC_PGID_FILE"
             exec bash packages/intentionsutil/scripts/graph-commit "$@"' \
    _ "$clone" "$@" >"$outfile" 2>&1 &
  GC_BG_PID=$!
}

# kill_gc_group <pgidfile> — SIGKILL the whole writer group and wait for it to
# be gone before any assertion reads the repo (the kill is asynchronous; a
# surviving child could still be mid-write). The `wait` reaps our own child so
# a zombie leader cannot keep group_gone() false forever; when `setsid` forked,
# that child has already exited and the real leader was reparented to init,
# which reaps it.
kill_gc_group() {
  local pgid
  pgid="$(cat "$1" 2>/dev/null || true)"
  [[ -n "$pgid" ]] || return 1
  kill -9 -- "-$pgid" 2>/dev/null || true
  [[ -n "$GC_BG_PID" ]] && wait "$GC_BG_PID" 2>/dev/null
  wait_until 100 group_gone "$pgid"
}

# local_commits_ahead <clone> <base-sha> — commits on the clone's HEAD that are
# not on <base-sha>. Deliberately takes the ORIGIN's tip as an argument rather
# than reading the clone's own remote-tracking ref, which the writer's fetches
# move around.
local_commits_ahead() { git -C "$1" rev-list --count "$2..HEAD" 2>/dev/null || echo unknown; }

verdict_lines() { grep -c 'graph-commit: verdict: ' <<<"$1" | tr -d ' '; }

drop_scratch_refs() { # delete every graph/** scratch branch a killed writer left
  local ref
  while IFS= read -r ref; do
    [[ -n "$ref" ]] && git -C "$ORIGIN" update-ref -d "$ref"
  done < <(git -C "$ORIGIN" for-each-ref --format='%(refname)' 'refs/heads/graph/**')
}

# --- Case 1: happy path --------------------------------------------------------
set_mode green
edit_line "$A" t-happy 1 A-edit
out="$(run_gc "$A" -m 'test: happy' t-happy 2>&1)"; rc=$?
if [[ $rc -eq 0 ]] && origin_show t-happy | grep -q 'line1: A-edit'; then
  ok "happy path lands on main (exit 0)"
else
  no "happy path (rc=$rc)"; printf '%s\n' "$out"
fi
if [[ -z "$(scratch_refs)" ]]; then
  ok "scratch branch deleted on origin after landing"
else
  no "scratch branch left behind: $(scratch_refs)"
fi

# --- Case 2: idempotent re-run on a clean tree ----------------------------------
set_mode green
before="$(origin_sha)"
out="$(run_gc "$A" t-happy 2>&1)"; rc=$?
if [[ $rc -eq 0 && "$(origin_sha)" == "$before" ]] && grep -q 'no new changes to stage' <<<"$out"; then
  ok "idempotent re-run: exit 0, no new commit on main"
else
  no "idempotent re-run (rc=$rc)"; printf '%s\n' "$out"
fi
if [[ "$(gh_calls)" -eq 0 && -z "$(scratch_refs)" ]]; then
  ok "idempotent re-run: no-op short-circuit makes zero gh polls, no scratch branch"
else
  no "idempotent re-run: expected zero gh polls and no scratch branch (gh_calls=$(gh_calls), scratch_refs=$(scratch_refs))"
fi

# --- Case 3: non-overlapping concurrent edits auto-merge ------------------------
set_mode green
sync_clone "$A"                       # B stays stale at the seed commit
edit_line "$A" t-merge 1 A-top
run_gc "$A" t-merge >/dev/null 2>&1; rcA=$?
edit_line "$B" t-merge 12 B-bottom
out="$(run_gc "$B" t-merge 2>&1)"; rcB=$?
content="$(origin_show t-merge)"
if [[ $rcA -eq 0 && $rcB -eq 0 ]] \
   && grep -q 'line1: A-top' <<<"$content" \
   && grep -q 'line12: B-bottom' <<<"$content"; then
  ok "non-overlapping concurrent edits auto-merge; both survive on main"
else
  no "non-overlapping merge (rcA=$rcA rcB=$rcB)"; printf '%s\n' "$out"
fi

# --- Case 4: overlapping concurrent edits — fail closed, park -------------------
set_mode green
sync_clone "$A"; sync_clone "$B"
edit_line "$A" t-conflict 1 A-wins
run_gc "$A" t-conflict >/dev/null 2>&1
edit_line "$B" t-conflict 1 B-loses
out="$(run_gc "$B" t-conflict 2>&1)"; rc=$?
content="$(origin_show t-conflict)"
snap="$(sed -n 's/.*preserved at \(.*\) for the manual merge.*/\1/p' <<<"$out")"
[[ -n "$snap" ]] && SNAP_DIRS_TO_CLEAN+=("$snap")
if [[ $rc -eq 1 ]] \
   && grep -q 'concurrent-edit conflict' <<<"$out" \
   && grep -q 'line1: A-wins' <<<"$content" \
   && ! grep -q '^line1: B-loses' <<<"$content" \
   && grep -q 'office_hours' <<<"$content"; then
  ok "overlap: exit 1, other writer survives on main, office_hours park landed"
else
  no "overlap conflict handling (rc=$rc)"; printf '%s\n' "$out"; printf '%s\n' "$content"
fi
if [[ -n "$snap" && -f "$snap/t-conflict.md" ]] && grep -q 'B-loses' "$snap/t-conflict.md"; then
  ok "overlap: losing writer's content preserved in the kept snapshot dir"
else
  no "overlap snapshot preservation (snap='$snap')"
fi
if [[ -n "$snap" ]] && grep -q 'recommendation' <<<"$content" \
   && grep -q "$snap/t-conflict.md" <<<"$content" \
   && grep -q 'mailbox discipline' <<<"$content"; then
  ok "overlap: office_hours recommendation carries the snapshot path and mailbox instruction"
else
  no "overlap: recommendation missing snapshot path or mailbox instruction"; printf '%s\n' "$content"
fi
# Durability (tactic-graph-commit-park-content-durability): the record that
# LANDED must carry the losing writer's content, not a pointer into a tempdir.
# Destroy the tempdir — the thing a reboot, a tmp reaper or a container exit
# destroys for free — and re-read origin/main. The park path's whole purpose
# fails if the content is only in the directory just deleted.
if [[ -n "$snap" ]]; then rm -rf "$snap"; fi
content_after_snap_gone="$(origin_show t-conflict)"
if [[ -n "$snap" && ! -e "$snap" ]] \
   && grep -qF "BEGIN this session's unlanded content for t-conflict (verbatim)" <<<"$content_after_snap_gone" \
   && grep -qF "END this session's unlanded content for t-conflict" <<<"$content_after_snap_gone" \
   && grep -q 'line1: B-loses' <<<"$content_after_snap_gone" \
   && ! grep -q '^line1: B-loses' <<<"$content_after_snap_gone"; then
  ok "overlap: with SNAP_DIR deleted, the record on origin/main still carries the losing writer's content verbatim (and only inside the recommendation, not as node content)"
else
  no "overlap: parked record does not survive SNAP_DIR deletion (snap='$snap')"; printf '%s\n' "$content_after_snap_gone"
fi

# --- Case 5: concluded check failure — immediate die, no retry burn -------------
set_mode concluded-fail
sync_clone "$A"
edit_line "$A" t-ckfail 1 never-lands
out="$(run_gc "$A" t-ckfail 2>&1)"; rc=$?
calls="$(gh_calls)"
if [[ $rc -eq 1 && "$calls" -eq 1 ]] \
   && grep -q 'concluded non-success' <<<"$out" \
   && grep -q 'not retrying' <<<"$out" \
   && ! grep -q 'attempt 2/' <<<"$out" \
   && ! grep -q 'retry later' <<<"$out"; then
  ok "concluded check failure dies immediately (1 poll, no retries, no busy-main misdiagnosis)"
else
  no "concluded check failure (rc=$rc gh_calls=$calls)"; printf '%s\n' "$out"
fi
sync_clone "$A"   # drop the never-landed local commit

# --- Case 6: gh hard failure — die with surfaced stderr after 3 polls -----------
set_mode hard-fail
sync_clone "$B"
edit_line "$B" t-ghfail 1 never-lands
out="$(run_gc "$B" t-ghfail 2>&1)"; rc=$?
calls="$(gh_calls)"
if [[ $rc -eq 1 && "$calls" -eq 3 ]] \
   && grep -q 'polling failed 3 consecutive times' <<<"$out" \
   && grep -q 'API rate limit exceeded' <<<"$out"; then
  ok "gh hard failure dies after 3 consecutive polls with gh's stderr surfaced"
else
  no "gh hard failure (rc=$rc gh_calls=$calls)"; printf '%s\n' "$out"
fi
sync_clone "$B"

# --- Case 7: pending timeout is transient — retries then busy-main --------------
set_mode pending
sync_clone "$A"
edit_line "$A" t-pending 1 stuck
out="$(export GC_POLL=1 GC_TIMEOUT=1 GC_ATTEMPTS=2; run_gc "$A" t-pending 2>&1)"; rc=$?
if [[ $rc -eq 1 ]] \
   && grep -q 'attempt 2/2' <<<"$out" \
   && grep -q 'could not land on main after 2/2 attempts' <<<"$out"; then
  ok "pending timeout stays transient: burns attempts, exits busy-main"
else
  no "pending timeout retry path (rc=$rc)"; printf '%s\n' "$out"
fi
# The terminal line must attribute the check state to the commit it was read
# on, and must name what ended the run. Without the SHA, a snapshot carried
# over from an earlier attempt (an attempt can end before any poll runs) would
# be printed as if it described this failure.
if grep -Eq 'required-check state observed on [0-9a-f]{7,}: .*acceptance=' <<<"$out" \
   && grep -q 'cause: the required checks did not report green' <<<"$out"; then
  ok "pending timeout: terminal line attributes the observed state to a SHA and names the cause"
else
  no "pending timeout terminal attribution"; printf '%s\n' "$out"
fi
sync_clone "$A"

# --- Case 8: desynced check-run status — fixed filter counts it as concluded ----
# GitHub sometimes leaves a check-run's status stuck at in_progress even after
# its conclusion is already populated (a known check-runs desync, #2457). The
# fixed --jq filter keys off .conclusion alone, so this fixture's fourth entry
# (status=in_progress, conclusion=success) still counts toward nsucc==4 and
# lands immediately instead of spinning to the busy-main timeout the
# pre-fix status=="completed"-gated filter would hit.
set_mode desynced-success
sync_clone "$A"
edit_line "$A" t-desync 1 desync-lands
out="$(run_gc "$A" t-desync 2>&1)"; rc=$?
if [[ $rc -eq 0 ]] && origin_show t-desync | grep -q 'line1: desync-lands'; then
  ok "desynced check-run (status stuck in_progress, conclusion success) still lands"
else
  no "desynced check-run handling (rc=$rc)"; printf '%s\n' "$out"
fi
sync_clone "$A"

# --- Case 8b: ORPHANED required row — bounded re-stamp, then a GitHub-side die --
# The complement of case 8's #2457 desync: `preview-and-smoke` has NO conclusion
# at all, and its parent check suite has already reported completed. A suite
# cannot conclude while one of its own jobs is still running, so the row will
# never report and `gh run rerun` refuses it. Pre-fix, graph-commit read it as
# pending and burned the whole green-wait budget (five 180s attempts) before
# exiting busy-exhausted with an orphan local commit — with the graph store's
# only write path shut for the duration.
#
# An orphan is a GitHub artifact, not a statement about the commit, so the run
# must neither wait for it nor accuse the content. It re-stamps: delete the
# graph/** scratch ref and push the SHA again for a fresh stamping run, on its
# OWN cap (MAX_ORPHAN_RESTAMPS, default 2) that is separate from the landing
# budget. This fixture mode replays the orphan on every poll, so the cap is
# always exhausted here: exactly ONE poll per stamp (initial + 2 re-stamps = 3
# polls, 3 suite lookups — no green-wait is ever entered, which is what keeps
# the store open), no landing attempt consumed, nothing landed, and a terminal
# message naming the GitHub-side cause instead of the old content accusation.
set_mode orphan-pending
sync_clone "$A"
edit_line "$A" t-orphan 1 never-lands
out="$(export GC_POLL=1 GC_TIMEOUT=5 GC_ATTEMPTS=5; run_gc "$A" t-orphan 2>&1)"; rc=$?
calls="$(gh_calls)"; scalls="$(gh_suite_calls)"
if [[ $rc -eq 1 && "$calls" -eq 3 && "$scalls" -eq 3 ]] \
   && grep -q 're-stamp 1/2' <<<"$out" \
   && grep -q 're-stamp 2/2' <<<"$out" \
   && grep -q 'still ORPHANED after 2 re-stamp' <<<"$out" \
   && ! grep -q 'attempt 2/' <<<"$out" \
   && ! origin_show t-orphan | grep -q 'never-lands'; then
  ok "orphaned required row re-stamps under its own cap then fails closed (3 polls, 3 suite lookups, no landing attempt burned, nothing landed)"
else
  no "orphaned required row re-stamp cap (rc=$rc gh_calls=$calls suite_calls=$scalls)"; printf '%s\n' "$out"
fi
# The diagnostic must be specific enough to distinguish a GitHub orphan from a
# genuinely failing check — the required check's name AND its suite id — and the
# terminal message must not accuse the commit content, which is the thing an
# orphan is NOT evidence of.
if grep -q 'preview-and-smoke=orphaned' <<<"$out" \
   && grep -q '85480333626 already concluded' <<<"$out" \
   && grep -q 'GitHub-side condition, NOT broken commit content' <<<"$out" \
   && grep -q 'nothing was pushed to main' <<<"$out" \
   && ! grep -q 'the commit content fails CI' <<<"$out"; then
  ok "orphaned required row: diagnostic names the check and its concluded suite, and blames GitHub rather than the content"
else
  no "orphaned required row diagnostic"; printf '%s\n' "$out"
fi
sync_clone "$A"   # drop the never-landed local commit

# --- Case 8c: the negative — same row, suite still running, keeps waiting -------
# Byte-identical check-runs payload; only the SUITE fixture differs (absent, so
# the shim reports in_progress). A check whose suite is still running is just
# slow, and relaxing THAT into a refusal would turn every genuinely in-flight
# graph write into a hard failure. It must keep the pre-existing wait-and-retry
# behavior and time out as transient.
set_mode live-pending
sync_clone "$A"
edit_line "$A" t-live-pending 1 stuck
out="$(export GC_POLL=1 GC_TIMEOUT=1 GC_ATTEMPTS=2; run_gc "$A" t-live-pending 2>&1)"; rc=$?
scalls="$(gh_suite_calls)"
if [[ $rc -eq 1 && "$scalls" -ge 1 ]] \
   && grep -q 'attempt 2/2' <<<"$out" \
   && grep -q 'could not land on main after 2/2 attempts' <<<"$out" \
   && ! grep -q 'orphaned' <<<"$out"; then
  ok "unconcluded row under a STILL-RUNNING suite keeps waiting (transient, not a refusal)"
else
  no "live pending row handling (rc=$rc suite_calls=$scalls)"; printf '%s\n' "$out"
fi
sync_clone "$A"

# --- Case 9: id validation -------------------------------------------------------
set_mode green
sync_clone "$A"
edit_line "$A" v1..v2-migration 1 dotdot-ok
out="$(run_gc "$A" v1..v2-migration 2>&1)"; rc=$?
if [[ $rc -eq 0 ]] && origin_show v1..v2-migration | grep -q 'line1: dotdot-ok'; then
  ok "id with '..' substring lands end-to-end"
else
  no "dotdot-substring id (rc=$rc)"; printf '%s\n' "$out"
fi
# A comma is banned for a DELIMITER reason, not a path one: park_write() carries
# PRUNE_IDS to its tsx helper as a comma-joined argv value, and a comma inside an
# id would split the set into fragments — misclassifying a prune as an edit on
# the park path, where the helper then looks for a snapshot that deliberately
# does not exist and kills the whole park. Rejected at the edge, in BOTH id
# positions (ordinary and --prune).
for bad in 'a/b' 'a\b' '.' '..' 'a,b'; do
  run_gc "$A" "$bad" >/dev/null 2>&1; rc=$?
  if [[ $rc -eq 2 ]]; then
    ok "id '$bad' rejected with exit 2"
  else
    no "id '$bad' expected exit 2, got $rc"
  fi
done
run_gc "$A" --prune 'a,b' >/dev/null 2>&1; rc=$?
if [[ $rc -eq 2 ]]; then
  ok "--prune id 'a,b' rejected with exit 2 (the comma-delimited prune channel stays splittable)"
else
  no "--prune id 'a,b' expected exit 2, got $rc"
fi

# ---------------------------------------------------------------------------
# Cases 10-11: --prune
# ---------------------------------------------------------------------------
set_mode green

# Case 10: an ordinary edit id and a prune id land in ONE commit.
W1="$WORK/w1"
make_clone "$W1" writer-1
echo "line13: edited" >>"$W1/intentions/t-prune-edit.md"
rm -f "$W1/intentions/t-prune.md"
if out="$(run_gc "$W1" -m 'test: prune + edit' t-prune-edit --prune t-prune 2>&1)"; then
  landed_edit="$(origin_show t-prune-edit 2>/dev/null | grep -c 'line13: edited')"
  pruned_gone=1
  git -C "$ORIGIN" cat-file -e main:intentions/t-prune.md 2>/dev/null && pruned_gone=0
  if [[ "$landed_edit" -eq 1 && "$pruned_gone" -eq 1 ]]; then
    ok "prune: edit + prune land together, deletion visible on main"
  else
    no "prune: edit=$landed_edit pruned_gone=$pruned_gone"; printf '%s\n' "$out"
  fi
  # The edit and the deletion must be the SAME commit, not two commits.
  changed_paths="$(git -C "$ORIGIN" show --name-only --format= main | sort | tr '\n' ' ')"
  if [[ "$changed_paths" == *"intentions/t-prune-edit.md"* && "$changed_paths" == *"intentions/t-prune.md"* ]]; then
    ok "prune: edit + prune land in the SAME commit"
  else
    no "prune: expected one commit touching both paths, got: $changed_paths"
  fi
else
  no "prune: expected exit 0, got $? (see below)"; printf '%s\n' "$out"
fi

# Case 11: a prune id whose file is still present on disk is rejected.
W2="$WORK/w2"
make_clone "$W2" writer-2
before_sha="$(origin_sha)"
if out="$(run_gc "$W2" --prune t-prune-guard 2>&1)"; then
  no "prune guard: expected rejection when file still present on disk, got exit 0"
else
  after_sha="$(origin_sha)"
  if grep -q "still exists on disk" <<<"$out" && [[ "$before_sha" == "$after_sha" ]]; then
    ok "prune guard: rejects a prune id still present on disk, no commit landed"
  else
    no "prune guard: rejected but wrong error or main moved"; printf '%s\n' "$out"
  fi
fi

# Case 14: --prune alone (no positional id) — a pure deletion-only commit.
# This is the owed-prune backlog's actual shape (a `phase: done` node with no
# accompanying edit), distinct from case 10's mixed edit+prune: IDS is empty
# here, so ALL_IDS[0] resolves entirely from PRUNE_IDS, exercising the
# scratch-branch ref-name path and id_files_dirty()/commit_files() with no
# ordinary ids at all.
W5="$WORK/w5"
make_clone "$W5" writer-5
rm -f "$W5/intentions/t-prune-solo.md"
if out="$(run_gc "$W5" -m 'test: pure prune' --prune t-prune-solo 2>&1)"; then
  pruned_gone=1
  git -C "$ORIGIN" cat-file -e main:intentions/t-prune-solo.md 2>/dev/null && pruned_gone=0
  if [[ "$pruned_gone" -eq 1 ]]; then
    ok "pure prune: a --prune-only invocation (no positional id) lands the deletion on main"
  else
    no "pure prune: deletion did not land"; printf '%s\n' "$out"
  fi
else
  no "pure prune: expected exit 0, got $? (see below)"; printf '%s\n' "$out"
fi
if [[ -z "$(scratch_refs)" ]]; then
  ok "pure prune: scratch branch cleaned up after landing"
else
  no "pure prune: leftover scratch branch: $(scratch_refs)"
fi

# ---------------------------------------------------------------------------
# Cases 12-13: --base compare-and-swap
# ---------------------------------------------------------------------------

# Case 12: --base fresh — a blob matching origin/main's current content lands.
W3="$WORK/w3"
make_clone "$W3" writer-3
fresh_sha="$(git -C "$W3" hash-object intentions/t-base.md)"
echo "line13: writer3 edit" >>"$W3/intentions/t-base.md"
if out="$(run_gc "$W3" -m 'test: base fresh' --base "t-base=$fresh_sha" t-base 2>&1)"; then
  landed="$(origin_show t-base 2>/dev/null | grep -c 'line13: writer3 edit')"
  if [[ "$landed" -eq 1 ]]; then
    ok "base fresh: a --base matching origin/main's blob lands"
  else
    no "base fresh: landed but content missing"; printf '%s\n' "$out"
  fi
else
  no "base fresh: expected exit 0, got $? (see below)"; printf '%s\n' "$out"
fi

# Case 13: --base stale, disjoint appended lines (bare line-based fixture) —
# now auto-resolves via layer 3 instead of dying. Pre-Unit-3 this was a hard
# `die "stale base for ..."`. Since Unit 3, check_base_freshness() attempts an
# automatic structural merge (run_merge_node()) before refusing; against this
# harness's npx merge-node.ts shim (a simplified key:value three-way merge —
# see the shim's own comment), two writers appending DIFFERENT new lines
# (line13 vs line14, neither present in the other's base or landed content) is
# exactly the disjoint case the shim resolves cleanly, so this now lands
# (exit 0) rather than refusing. Cases 19-20 below cover the resolve/unresolved
# split on real seed_field_node fixtures that this bare-line fixture can no
# longer distinguish (a genuine same-line divergence is exercised by case 4,
# and a same-FIELD divergence specifically by cases 18/20).
W4="$WORK/w4"
make_clone "$W4" writer-4
stale_sha="$(git -C "$W4" hash-object intentions/t-base.md)"

# Simulate a concurrent writer landing an unrelated change to the SAME node
# on origin/main, bypassing graph-commit (representing "another session
# already committed" for fast test setup — the mechanism under test is the
# blob comparison, not how the concurrent write itself lands).
# NOTE: case 11 (above) already landed a "line13" key onto this same t-base
# node — the appended keys here must be fresh (line15/line16) or the harness's
# simplified key:value merge shim (first-occurrence-wins per file) would treat
# "line13" as an already-known key colliding with a stale duplicate rather
# than the genuinely disjoint new key this case means to exercise.
OTHER="$WORK/other"
make_clone "$OTHER" other
echo "line16: concurrent edit" >>"$OTHER/intentions/t-base.md"
git -C "$OTHER" commit -qam 'concurrent edit'
git -C "$OTHER" push -q origin main

echo "line15: writer4 edit (based on a stale read)" >>"$W4/intentions/t-base.md"
out="$(run_gc "$W4" -m 'test: base stale, disjoint fields' --base "t-base=$stale_sha" t-base 2>&1)"; rc=$?
content="$(origin_show t-base 2>/dev/null)"
if [[ $rc -eq 0 ]] \
   && grep -q 'line15: writer4 edit (based on a stale read)' <<<"$content" \
   && grep -q 'line16: concurrent edit' <<<"$content"; then
  ok "base stale, disjoint lines: layer 3 auto-resolves rather than dying, both edits land"
else
  no "base stale disjoint-lines resolve (rc=$rc)"; printf '%s\n' "$out"; printf '%s\n' "$content"
fi

# Case 15: --base manifest-file form — a file of <id>=<blobsha> lines (as
# opposed to cases 12-13's inline <id>=<blobsha> argument).
W6="$WORK/w6"
make_clone "$W6" writer-6
manifest_sha="$(git -C "$W6" hash-object intentions/t-base-manifest.md)"
manifest_file="$WORK/base-manifest.txt"
printf 't-base-manifest=%s\n' "$manifest_sha" >"$manifest_file"
echo "line13: writer6 edit" >>"$W6/intentions/t-base-manifest.md"
if out="$(run_gc "$W6" -m 'test: base manifest' --base "$manifest_file" t-base-manifest 2>&1)"; then
  landed="$(origin_show t-base-manifest 2>/dev/null | grep -c 'line13: writer6 edit')"
  if [[ "$landed" -eq 1 ]]; then
    ok "base manifest-file form: a fresh entry read from a manifest file lands"
  else
    no "base manifest-file form: landed but content missing"; printf '%s\n' "$out"
  fi
else
  no "base manifest-file form: expected exit 0, got $? (see below)"; printf '%s\n' "$out"
fi

# --- Case 16: far-ahead worktree (PR branch) — rebuild on origin/main -----------
# A PR-branch checkout whose HEAD carries a non-intentions code commit. A commit
# made on top of it is NOT intentions/-only, so the pre-fix graph-commit's
# scratch push would fail the fast-path guard and never land. The fix rebuilds
# the edit on origin/main: only the intentions/ change lands (never the code
# commit), and the worktree HEAD is restored to the PR tip.
set_mode green
W7="$WORK/w7"
make_clone "$W7" writer-7
mkdir -p "$W7/src"
echo "console.log('pr feature code')" >"$W7/src/feature.js"
git -C "$W7" add src/feature.js
git -C "$W7" commit -qm 'pr: non-intentions code change (simulated PR branch)'
far_tip="$(git -C "$W7" rev-parse HEAD)"
edit_line "$W7" t-farahead 1 farahead-edit
out="$(run_gc "$W7" -m 'test: far-ahead edit' t-farahead 2>&1)"; rc=$?
landed="$(origin_show t-farahead 2>/dev/null || true)"
main_tree="$(git -C "$ORIGIN" ls-tree -r --name-only main)"
restored="$(git -C "$W7" rev-parse HEAD)"
if [[ $rc -eq 0 ]] \
   && grep -q 'line1: farahead-edit' <<<"$landed" \
   && ! grep -q 'src/feature.js' <<<"$main_tree" \
   && [[ "$restored" == "$far_tip" ]]; then
  ok "far-ahead worktree: intentions edit lands, code commit excluded, HEAD restored to PR tip"
else
  no "far-ahead worktree (rc=$rc restored=$restored far_tip=$far_tip code-on-main=$(grep -c 'src/feature.js' <<<"$main_tree"))"; printf '%s\n' "$out"
fi

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

# --- Case 18: far-ahead worktree + --prune --------------------------------------
# A prune issued from the same far-ahead PR branch: the node is removed from
# main, the code commit is still excluded, and HEAD is restored.
set_mode green
git -C "$W7" fetch -q origin main
rm -f "$W7/intentions/t-farahead-prune.md"
far_tip2="$(git -C "$W7" rev-parse HEAD)"   # still the code-commit tip
out="$(run_gc "$W7" -m 'test: far-ahead prune' --prune t-farahead-prune 2>&1)"; rc=$?
restored2="$(git -C "$W7" rev-parse HEAD)"
main_tree2="$(git -C "$ORIGIN" ls-tree -r --name-only main)"
if [[ $rc -eq 0 ]] \
   && ! grep -q 'intentions/t-farahead-prune.md' <<<"$main_tree2" \
   && ! grep -q 'src/feature.js' <<<"$main_tree2" \
   && [[ "$restored2" == "$far_tip2" ]]; then
  ok "far-ahead worktree + --prune: node removed from main, code commit excluded, HEAD restored"
else
  no "far-ahead prune (rc=$rc restored2=$restored2 far_tip2=$far_tip2)"; printf '%s\n' "$out"
fi

# ---------------------------------------------------------------------------
# Cases 19-23: layer 2 (rebase-conflict field merge) and layer 3 (stale --base
# re-read) auto-merge, using seed_field_node's real-frontmatter fixtures.
# ---------------------------------------------------------------------------

# Case 19: layer 2 resolves a textual rebase conflict whose two sides touch
# DIFFERENT fields. fieldA and fieldB are adjacent lines in the seeded
# frontmatter, so editing each independently still produces a textual git
# CONFLICT (the diff hunks' contexts overlap) even though the fields
# themselves never collide — exactly the case run_merge_node() should resolve.
set_mode green
sync_clone "$A"; sync_clone "$B"
edit_field "$A" t-field-merge fieldA A-edit
run_gc "$A" t-field-merge >/dev/null 2>&1
edit_field "$B" t-field-merge fieldB B-edit
out="$(run_gc "$B" t-field-merge 2>&1)"; rc=$?
content="$(origin_show t-field-merge)"
if [[ $rc -eq 0 ]] \
   && grep -q 'layer 2/3 auto-resolved a concurrent-edit divergence' <<<"$out" \
   && grep -q 'fieldA: A-edit' <<<"$content" \
   && grep -q 'fieldB: B-edit' <<<"$content"; then
  ok "layer 2: non-overlapping field-level conflict auto-merges, both writers' edits land"
else
  no "layer 2 field-merge (rc=$rc)"; printf '%s\n' "$out"; printf '%s\n' "$content"
fi

# Case 20: layer 2 leaves a textual conflict whose two sides touch the SAME
# field mechanical-unresolved: exit 1, office_hours.reason carries the stable
# "mechanical-unresolved" marker, and the recommendation names both values.
set_mode green
sync_clone "$A"; sync_clone "$B"
edit_field "$A" t-field-conflict sentinel A-value
run_gc "$A" t-field-conflict >/dev/null 2>&1
edit_field "$B" t-field-conflict sentinel B-value
out="$(run_gc "$B" t-field-conflict 2>&1)"; rc=$?
content="$(origin_show t-field-conflict)"
snap="$(sed -n 's/.*preserved at \(.*\) for the manual merge.*/\1/p' <<<"$out")"
[[ -n "$snap" ]] && SNAP_DIRS_TO_CLEAN+=("$snap")
if [[ $rc -eq 1 ]] \
   && grep -q 'mechanical-unresolved' <<<"$content" \
   && grep -q 'A-value' <<<"$content" \
   && grep -q 'B-value' <<<"$content"; then
  ok "layer 2: same-field divergence stays mechanical-unresolved, both values named in the recommendation"
else
  no "layer 2 field-conflict (rc=$rc)"; printf '%s\n' "$out"; printf '%s\n' "$content"
fi

# Case 21: layer 3 (--base stale re-read) auto-resolves a stale --base whose
# delta touches a DIFFERENT field than the concurrently-landed write.
set_mode green
W21="$WORK/w21"
make_clone "$W21" writer-21
base_ok_sha="$(git -C "$W21" hash-object intentions/t-field-base-ok.md)"
edit_field "$W21" t-field-base-ok fieldA writer8-edit

OTHER2="$WORK/other2"
make_clone "$OTHER2" other2
edit_field "$OTHER2" t-field-base-ok fieldB concurrent-edit
git -C "$OTHER2" commit -qam 'concurrent field edit'
git -C "$OTHER2" push -q origin main

out="$(run_gc "$W21" -m 'test: base field resolve' --base "t-field-base-ok=$base_ok_sha" t-field-base-ok 2>&1)"; rc=$?
content="$(origin_show t-field-base-ok 2>/dev/null)"
if [[ $rc -eq 0 ]] \
   && grep -q 'fieldA: writer8-edit' <<<"$content" \
   && grep -q 'fieldB: concurrent-edit' <<<"$content"; then
  ok "layer 3: stale --base auto-resolves a disjoint-field divergence, both edits land"
else
  no "layer 3 base resolve (rc=$rc)"; printf '%s\n' "$out"; printf '%s\n' "$content"
fi

# Case 22: layer 3 leaves a stale --base SAME-field divergence
# mechanical-unresolved: exit 1, office_hours.reason carries
# "mechanical-unresolved", both values are named in the recommendation.
set_mode green
W22="$WORK/w22"
make_clone "$W22" writer-22
base_bad_sha="$(git -C "$W22" hash-object intentions/t-field-base-bad.md)"
edit_field "$W22" t-field-base-bad sentinel writer9-value

OTHER3="$WORK/other3"
make_clone "$OTHER3" other3
edit_field "$OTHER3" t-field-base-bad sentinel concurrent-value
git -C "$OTHER3" commit -qam 'concurrent same-field edit'
git -C "$OTHER3" push -q origin main

out="$(run_gc "$W22" -m 'test: base field conflict' --base "t-field-base-bad=$base_bad_sha" t-field-base-bad 2>&1)"; rc=$?
content="$(origin_show t-field-base-bad 2>/dev/null)"
calls="$(gh_calls)"
snap="$(sed -n 's/.*preserved at \(.*\) for the manual merge.*/\1/p' <<<"$out")"
[[ -n "$snap" ]] && SNAP_DIRS_TO_CLEAN+=("$snap")
if [[ $rc -eq 1 ]] \
   && grep -q 'mechanical-unresolved' <<<"$content" \
   && grep -q 'writer9-value' <<<"$content" \
   && grep -q 'concurrent-value' <<<"$content" \
   && [[ "$calls" -eq 1 ]] \
   && [[ -n "$snap" && -f "$snap/t-field-base-bad.md" ]] \
   && grep -q 'writer9-value' "$snap/t-field-base-bad.md"; then
  ok "layer 3: stale --base same-field divergence stays mechanical-unresolved (parks via a single stamp poll, no prior retry loop), and SNAP_DIR retains the writer's original node content"
else
  no "layer 3 base conflict (rc=$rc calls=$calls)"; printf '%s\n' "$out"; printf '%s\n' "$content"
fi

# Case 22b: the frozen-original SNAP_DIR contract, on the shape this defect was
# filed about — a MULTI-ID batch in which id A's layer-3 merge RESOLVES and id
# B's does not. The batch fails closed as a unit, so both park; A's resolved
# merge must not have eaten A's evidence on the way. Assert all three halves:
#   (1) SNAP_DIR/A.md still hashes to A's PRE-merge content — byte-identical to
#       what the writer had on disk before graph-commit ran;
#   (2) SNAP_DIR/A.merged.md holds the blend (this writer's fieldA edit plus the
#       concurrent writer's landed fieldB edit);
#   (3) the park recommendation names BOTH paths and says which is which.
# Before the fix the merge output was copied OVER SNAP_DIR/A.md, so the losing
# writer's only surviving copy of its own edit was a blend it never wrote and
# that never landed — and the concurrent writer, by choosing which field to
# touch, chose which of the losing writer's ids kept their evidence.
#
# NOTE on (3): the recovery text asserted here is the node SHIM's, which mirrors
# the real park helper's wording (the harness shims `node`, so the real tsx
# heredoc in park_write never executes). What this pins end to end is that
# park_write is handed a SNAP_DIR carrying both files, that they hold the right
# content, and that the recommendation reaching origin/main distinguishes them.
set_mode green
W22B="$WORK/w22b"
make_clone "$W22B" writer-22b
msa_sha="$(git -C "$W22B" hash-object intentions/t-multi-snap-a.md)"
msb_sha="$(git -C "$W22B" hash-object intentions/t-multi-snap-b.md)"
edit_field "$W22B" t-multi-snap-a fieldA a-writer-edit
edit_field "$W22B" t-multi-snap-b sentinel b-writer-value
# The writer's pre-merge content for A, captured before graph-commit sees it.
msa_pre="$(git -C "$W22B" hash-object intentions/t-multi-snap-a.md)"

OTHER22B="$WORK/other22b"
make_clone "$OTHER22B" other22b
# A's landed edit touches a DIFFERENT field (A's layer-3 merge resolves); B's
# touches the SAME field (B's does not, so the whole batch parks).
edit_field "$OTHER22B" t-multi-snap-a fieldB concurrent-edit
edit_field "$OTHER22B" t-multi-snap-b sentinel concurrent-value
git -C "$OTHER22B" commit -qam 'concurrent edits racing a multi-id batch'
git -C "$OTHER22B" push -q origin main

out="$(run_gc "$W22B" -m 'test: multi-id partial resolve' \
       --base "t-multi-snap-a=$msa_sha" --base "t-multi-snap-b=$msb_sha" \
       t-multi-snap-a t-multi-snap-b 2>&1)"; rc=$?
content="$(origin_show t-multi-snap-a 2>/dev/null)"
snap="$(sed -n 's/.*preserved at \(.*\) for the manual merge.*/\1/p' <<<"$out")"
[[ -n "$snap" ]] && SNAP_DIRS_TO_CLEAN+=("$snap")
snap_a_sha=""
[[ -n "$snap" && -f "$snap/t-multi-snap-a.md" ]] \
  && snap_a_sha="$(git -C "$W22B" hash-object "$snap/t-multi-snap-a.md")"
if [[ $rc -eq 1 ]] \
   && grep -q 'mechanical-unresolved' <<<"$content" \
   && [[ -n "$snap_a_sha" && "$snap_a_sha" == "$msa_pre" ]] \
   && [[ -f "$snap/t-multi-snap-a.merged.md" ]] \
   && grep -q 'fieldA: a-writer-edit' "$snap/t-multi-snap-a.merged.md" \
   && grep -q 'fieldB: concurrent-edit' "$snap/t-multi-snap-a.merged.md" \
   && ! grep -q 'fieldB: concurrent-edit' "$snap/t-multi-snap-a.md" \
   && grep -qF "$snap/t-multi-snap-a.md" <<<"$content" \
   && grep -qF "$snap/t-multi-snap-a.merged.md" <<<"$content" \
   && grep -q 'PARTIAL MERGE' <<<"$content"; then
  ok "multi-id partial resolve: SNAP_DIR keeps the resolved id's frozen pre-merge original, the merge lands beside it as <id>.merged.md, and the park names both"
else
  no "multi-id partial resolve (rc=$rc snap='$snap' snap_a_sha=$snap_a_sha msa_pre=$msa_pre)"; printf '%s\n' "$out"; printf '%s\n' "$content"
fi

# Case 23: a --prune id racing a concurrent edit to the same node is excluded
# from the layer-2 merge attempt entirely (a deletion has nothing to
# structurally merge against) — no false "auto-resolved" claim, parks with the
# prune-specific sentinel note.
set_mode green
sync_clone "$A"; sync_clone "$B"
edit_line "$A" t-prune-conflict 1 landed-edit
run_gc "$A" t-prune-conflict >/dev/null 2>&1
rm -f "$B/intentions/t-prune-conflict.md"
out="$(run_gc "$B" --prune t-prune-conflict 2>&1)"; rc=$?
content="$(origin_show t-prune-conflict 2>/dev/null)"
snap="$(sed -n 's/.*preserved at \(.*\) for the manual merge.*/\1/p' <<<"$out")"
[[ -n "$snap" ]] && SNAP_DIRS_TO_CLEAN+=("$snap")
if [[ $rc -eq 1 ]] \
   && ! grep -q 'layer 2/3 auto-resolved' <<<"$out" \
   && grep -q 'mechanical-unresolved' <<<"$content" \
   && grep -q 'prune vs. concurrent edit' <<<"$content" \
   && grep -q 'landed-edit' <<<"$content"; then
  ok "prune-vs-edit: excluded from the layer-2 merge attempt, parks with the prune-specific reason"
else
  no "prune-vs-edit exclusion (rc=$rc)"; printf '%s\n' "$out"; printf '%s\n' "$content"
fi

# --- Case 24: unrelated dirty tracked file — clear pre-flight error, no rebase attempted ---
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

# --- Case 25: -C targeting from an unrelated cwd --------------------------------
# The graph-commit script FILE lives inside w16's checkout, but the invocation
# passes `-C` pointing at a DIFFERENT clone (w17), from a cwd that is neither.
# Pre-fix, REPO_ROOT was derived from the script's own on-disk location
# (SCRIPT_DIR-climbing), so this would have silently landed in w16 regardless
# of -C or cwd. Post-fix, REPO_ROOT is resolved from -C, so the edit must land
# via w17's tree.
set_mode green
W16="$WORK/w16"; make_clone "$W16" writer-16   # only the script FILE's location
W17="$WORK/w17"; make_clone "$W17" writer-17   # the actual -C target
edit_line "$W17" t-cwd-target 1 target-edit-via-C
UNRELATED_DIR="$WORK/unrelated-cwd"
mkdir -p "$UNRELATED_DIR"
out="$(
  cd "$UNRELATED_DIR" || exit 99
  export PATH="$WORK/bin:$PATH"
  export GC_GH_MODE_FILE="$MODE_FILE" GC_GH_CALL_LOG="$CALL_LOG" GC_FIXTURE_DIR="$FIXTURE_DIR"
  export GRAPH_COMMIT_CHECK_POLL_SECONDS=0 GRAPH_COMMIT_CHECK_TIMEOUT_SECONDS=5 GRAPH_COMMIT_MAX_ATTEMPTS=5
  bash "$W16/packages/intentionsutil/scripts/graph-commit" -C "$W17" -m 'test: -C from unrelated cwd' t-cwd-target 2>&1
)"; rc=$?
if [[ $rc -eq 0 ]] && origin_show t-cwd-target | grep -q 'line1: target-edit-via-C'; then
  ok "-C targeting: script physically inside w16, targeting w17 via -C from an unrelated cwd, lands in w17's repo"
else
  no "-C targeting from unrelated cwd (rc=$rc)"; printf '%s\n' "$out"
fi

# --- Case 26: no-repo error -------------------------------------------------------
# No `-C` given, invoked from a cwd that is not inside any git repository at
# all (a plain mktemp -d, never `git init`'d). Must die loudly naming the
# problem — never silently fall back to the script's own on-disk checkout.
NOREPO_DIR="$WORK/no-repo-dir"
mkdir -p "$NOREPO_DIR"
out="$(
  cd "$NOREPO_DIR" || exit 99
  export PATH="$WORK/bin:$PATH"
  export GC_GH_MODE_FILE="$MODE_FILE" GC_GH_CALL_LOG="$CALL_LOG" GC_FIXTURE_DIR="$FIXTURE_DIR"
  export GRAPH_COMMIT_CHECK_POLL_SECONDS=0 GRAPH_COMMIT_CHECK_TIMEOUT_SECONDS=5 GRAPH_COMMIT_MAX_ATTEMPTS=5
  bash "$A/packages/intentionsutil/scripts/graph-commit" -m 'test: no repo' t-happy 2>&1
)"; rc=$?
if [[ $rc -ne 0 ]] && grep -q 'not inside a git repository' <<<"$out"; then
  ok "no-repo error: cwd outside any git repository dies with a clear message, no silent fallback"
else
  no "no-repo error (rc=$rc)"; printf '%s\n' "$out"
fi

# --- Case 27: fail-loud guard, differing blob -------------------------------------
# A clone that never edited t-fail-loud-diff (nothing staged for it) while
# origin/main has since advanced with a DIFFERENT edit to that same id (a
# stale clone/checkout). Under caller-derived repo resolution this can only
# mean the wrong checkout is targeted, so graph-commit must die loudly rather
# than emit the false "landed" success the old script-location-derived
# resolution risked.
set_mode green
W13="$WORK/w13"; make_clone "$W13" writer-13   # stays at the seed tip — never synced
OTHER4="$WORK/other4"; make_clone "$OTHER4" other4
edit_line "$OTHER4" t-fail-loud-diff 1 concurrent-landed
git -C "$OTHER4" commit -qam 'concurrent edit lands on origin, unrelated to w13'
git -C "$OTHER4" push -q origin main
before_sha="$(origin_sha)"
out="$(run_gc "$W13" t-fail-loud-diff 2>&1)"; rc=$?
after_sha="$(origin_sha)"
if [[ $rc -ne 0 ]] \
   && grep -q 'mis-pointed -C/--repo' <<<"$out" \
   && ! grep -q 'landed t-fail-loud-diff on main' <<<"$out" \
   && [[ "$after_sha" == "$before_sha" ]]; then
  ok "fail-loud guard: differing blob vs origin/main with nothing staged dies loudly, never lands"
else
  no "fail-loud guard differing-blob (rc=$rc)"; printf '%s\n' "$out"
fi

# --- Case 28: fail-loud guard, benign equal-blob ----------------------------------
# A clone synced exactly to origin/main's current tip: nothing staged, and the
# local blob for the id already EQUALS origin/main's blob (the already-landed
# / already-at-HEAD case). This must proceed benignly — same "no new changes
# to stage" message as case 2, no die.
set_mode green
W15="$WORK/w15"; make_clone "$W15" writer-15
sync_clone "$W15"   # now bit-for-bit at origin/main's tip
before_sha="$(origin_sha)"
out="$(run_gc "$W15" t-happy 2>&1)"; rc=$?
after_sha="$(origin_sha)"
if [[ $rc -eq 0 ]] \
   && grep -q 'no new changes to stage' <<<"$out" \
   && ! grep -q 'mis-pointed' <<<"$out" \
   && [[ "$after_sha" == "$before_sha" ]]; then
  ok "fail-loud guard: benign equal-blob (already at origin/main's tip) proceeds without error"
else
  no "fail-loud guard benign-equal-blob (rc=$rc)"; printf '%s\n' "$out"
fi
if [[ "$(gh_calls)" -eq 0 ]]; then
  ok "fail-loud guard benign-equal-blob: no-op short-circuit makes zero gh polls"
else
  no "fail-loud guard benign-equal-blob: expected zero gh polls (gh_calls=$(gh_calls))"
fi

# --- Case 29: contention is now cheap, not exhausting -----------------------
set_mode blocked-green
W18="$WORK/w18"; W19="$WORK/w19"
make_clone "$W18" writer-18
make_clone "$W19" writer-19
edit_line "$W18" t-lock-contend 1 A-top
edit_line "$W19" t-lock-contend 12 B-bottom
SENTINEL="$WORK/lock-sentinel-29"; rm -f "$SENTINEL"
outA="$WORK/out-29-a.log"; outB="$WORK/out-29-b.log"
( GC_SENTINEL="$SENTINEL" run_gc "$W18" -m 'test: lock contend A' t-lock-contend >"$outA" 2>&1; echo $? >"$WORK/rc-29-a" ) &
pidA=$!
# Wait (bounded poll) for A to have made its gh call (now blocked inside the
# shim on the sentinel) — this guarantees A already holds the lock and is
# parked in await_checks(), so the reset+start-B sequence below cannot race
# against A's own call landing in the log after the reset.
claimed=0
for _ in $(seq 1 100); do
  [[ "$(gh_calls)" -ge 1 ]] && { claimed=1; break; }
  sleep 0.1
done
if [[ "$claimed" -ne 1 ]]; then
  no "lock contend: writer A never reached await_checks (no gh call observed)"
  rm -f "$SENTINEL"; wait "$pidA" 2>/dev/null
else
  : >"$CALL_LOG"   # from here, CALL_LOG counts only B's calls
  ( GC_LOCK_POLL=1 GC_SENTINEL="$SENTINEL" run_gc "$W19" -m 'test: lock contend B' t-lock-contend >"$outB" 2>&1; echo $? >"$WORK/rc-29-b" ) &
  pidB=$!
  sleep 1   # give B a moment to attempt (and fail) to claim the held lock
  callsB_while_blocked="$(gh_calls)"
  : >"$SENTINEL"   # release A
  wait "$pidA"; rcA="$(cat "$WORK/rc-29-a")"
  wait "$pidB"; rcB="$(cat "$WORK/rc-29-b")"
  callsB_final="$(gh_calls)"
  content="$(origin_show t-lock-contend)"
  if [[ "$callsB_while_blocked" -eq 0 && "$rcA" -eq 0 && "$rcB" -eq 0 && "$callsB_final" -eq 1 ]] \
     && grep -q 'line1: A-top' <<<"$content" && grep -q 'line12: B-bottom' <<<"$content"; then
    ok "lock contend: B makes 0 polls while A holds the lock, then lands in exactly 1 poll cycle"
  else
    no "lock contend: callsB_while_blocked=$callsB_while_blocked rcA=$rcA rcB=$rcB callsB_final=$callsB_final"
    printf '%s\n' "$(cat "$outA" 2>/dev/null)" "$(cat "$outB" 2>/dev/null)"
  fi
fi
rm -f "$SENTINEL"

plant_lock() { # <expiry_unix_ts> <holder>
  local expiry="$1" holder="$2" sha
  sha="$(git -C "$ORIGIN" commit-tree 4b825dc642cb6eb9a060e54bf8d69288fbee4904 \
    -m "graph-commit-lock v1" -m "holder=$holder expiry=$expiry")"
  # Fail loudly: an empty sha here means no lock gets planted, which silently
  # turns the steal/wait cases into vacuous passes rather than failures.
  if [[ -z "$sha" ]]; then
    echo "plant_lock: commit-tree produced no sha in $ORIGIN" >&2
    exit 1
  fi
  git -C "$ORIGIN" update-ref refs/graph/landing-lock "$sha"
}

# --- Case 30: dead-holder steal ----------------------------------------------
set_mode green
past_expiry=$(( $(date +%s) - 60 ))
plant_lock "$past_expiry" dead-holder-test
W20="$WORK/w20"
make_clone "$W20" writer-20
edit_line "$W20" t-lock-steal 1 steal-lands
start_ts=$(date +%s)
out="$(GC_LOCK_POLL=1 run_gc "$W20" -m 'test: dead-holder steal' t-lock-steal 2>&1)"; rc=$?
elapsed=$(( $(date +%s) - start_ts ))
if [[ $rc -eq 0 ]] && origin_show t-lock-steal | grep -q 'line1: steal-lands' && [[ "$elapsed" -le 10 ]]; then
  ok "dead-holder steal: expired foreign lock is stolen and lands promptly (${elapsed}s)"
else
  no "dead-holder steal (rc=$rc elapsed=${elapsed}s)"; printf '%s\n' "$out"
fi

# --- Case 31: live-holder wait (no premature steal) --------------------------
set_mode green
future_expiry=$(( $(date +%s) + 3 ))
plant_lock "$future_expiry" live-holder-test
planted_sha="$(git -C "$ORIGIN" for-each-ref --format='%(objectname)' refs/graph/landing-lock)"
W11="$WORK/w11"
make_clone "$W11" writer-11
edit_line "$W11" t-lock-wait 1 wait-then-lands
outfile="$WORK/out-31.log"
start_ts=$(date +%s)
( GC_LOCK_POLL=1 run_gc "$W11" -m 'test: live-holder wait' t-lock-wait >"$outfile" 2>&1; echo $? >"$WORK/rc-31" ) &
pid20=$!
sleep 1
current_sha="$(git -C "$ORIGIN" for-each-ref --format='%(objectname)' refs/graph/landing-lock)"
no_premature_steal=0
[[ "$current_sha" == "$planted_sha" ]] && no_premature_steal=1
wait "$pid20"
end_ts=$(date +%s)
elapsed=$(( end_ts - start_ts ))
rc="$(cat "$WORK/rc-31")"
out="$(cat "$outfile")"
if [[ "$no_premature_steal" -eq 1 && $rc -eq 0 && "$elapsed" -ge 2 ]] \
   && origin_show t-lock-wait | grep -q 'line1: wait-then-lands'; then
  ok "live-holder wait: does not steal before the planted expiry (${elapsed}s elapsed), lands once it passes"
else
  no "live-holder wait (no_premature_steal=$no_premature_steal rc=$rc elapsed=${elapsed}s)"; printf '%s\n' "$out"
fi

# --- Case 32: lock-ref hygiene ------------------------------------------------
set_mode green
W12="$WORK/w12"
make_clone "$W12" writer-12
edit_line "$W12" t-lock-hygiene 1 hygiene-lands
out="$(run_gc "$W12" -m 'test: lock hygiene' t-lock-hygiene 2>&1)"; rc=$?
if [[ $rc -eq 0 ]] && ! lock_ref_exists; then
  ok "lock hygiene: refs/graph/landing-lock absent on origin after a normal successful landing"
else
  no "lock hygiene: rc=$rc"; printf '%s\n' "$out"
fi
if ! git -C "$ORIGIN" for-each-ref --format='%(refname)' 'refs/heads/graph/**' | grep -q landing-lock; then
  ok "lock hygiene: refs/heads/graph/** never lists the landing-lock ref (disjoint namespaces)"
else
  no "lock hygiene: landing-lock ref leaked into refs/heads/graph/**"
fi

# --- Case 33: --expect is transparent on the happy path -----------------------
# The caller hashes the content it just wrote in its OWN checkout and pins it.
# The resolved repo is that same checkout, so the assertion holds and the edit
# lands exactly as it would without --expect.
set_mode green
W33="$WORK/w33"; make_clone "$W33" writer-33
sync_clone "$W33"
edit_line "$W33" t-expect-happy 1 expect-happy-lands
expect_sha="$(git -C "$W33" hash-object -- intentions/t-expect-happy.md)"
out="$(run_gc "$W33" -m 'test: expect happy' --expect "t-expect-happy=$expect_sha" t-expect-happy 2>&1)"; rc=$?
if [[ $rc -eq 0 ]] && origin_show t-expect-happy | grep -q 'line1: expect-happy-lands'; then
  ok "--expect happy path: matching blob assertion is transparent, edit lands"
else
  no "--expect happy path (rc=$rc)"; printf '%s\n' "$out"
fi

# --- Case 34: --expect catches the equal-blob wrong-repo case -------------------
# The exact hole case 28 leaves open. This clone is bit-for-bit at origin/main
# and has nothing staged, so the nothing-staged guard sees local_blob ==
# main_blob and proceeds benignly ("no new changes to stage" + "landed") — a
# false success when the caller's real edit lives in a DIFFERENT checkout.
# With --expect naming the content the caller actually wrote, graph-commit must
# refuse instead.
set_mode green
W34="$WORK/w34"; make_clone "$W34" writer-34
sync_clone "$W34"   # bit-for-bit at origin/main, nothing staged
elsewhere_sha="$(printf 'content that lives in some OTHER checkout\n' | git -C "$W34" hash-object --stdin)"
before_sha="$(origin_sha)"
out="$(run_gc "$W34" -m 'test: expect wrong repo' --expect "t-expect-wrong-repo=$elsewhere_sha" t-expect-wrong-repo 2>&1)"; rc=$?
after_sha="$(origin_sha)"
# The assertion greps an --expect-SPECIFIC substring. 'mis-pointed -C/--repo'
# appears in BOTH the --expect die and the pre-existing nothing-staged guard
# (which case 27 greps with exactly that string), so it cannot tell the two
# apart — and this case exists precisely to prove --expect fired where the
# nothing-staged guard structurally could not.
if [[ $rc -ne 0 ]] \
   && grep -q 'does not hold the content the caller asserted' <<<"$out" \
   && ! grep -q 'landed t-expect-wrong-repo on main' <<<"$out" \
   && [[ "$after_sha" == "$before_sha" ]]; then
  ok "--expect: equal-blob wrong-repo invocation dies loudly, never emits a false landed"
else
  no "--expect wrong-repo (rc=$rc)"; printf '%s\n' "$out"
fi

# --- Case 35: --expect on a --prune id is a usage error ------------------------
# A deletion has no content to assert, so pinning one is a caller mistake.
set_mode green
W35="$WORK/w35"; make_clone "$W35" writer-35
sync_clone "$W35"
prune_sha="$(git -C "$W35" hash-object -- intentions/t-expect-prune.md)"
rm -f "$W35/intentions/t-expect-prune.md"   # --prune requires the file gone on disk
before_sha="$(origin_sha)"
out="$(run_gc "$W35" -m 'test: expect prune' --prune t-expect-prune --expect "t-expect-prune=$prune_sha" 2>&1)"; rc=$?
after_sha="$(origin_sha)"
if [[ $rc -eq 2 ]] \
   && grep -q 'no content to assert' <<<"$out" \
   && [[ "$after_sha" == "$before_sha" ]]; then
  ok "--expect on a --prune id is a usage error (exit 2), origin untouched"
else
  no "--expect on a prune id (rc=$rc)"; printf '%s\n' "$out"
fi

# --- Case 36: a pre-existing rebase is refused up front -------------------------
# graph-commit must not run on a mid-operation worktree. The refusal runs before
# the EXIT trap is installed, precisely so this caller-owned rebase survives the
# refusal untouched (case 37's cleanup abort would otherwise destroy it).
set_mode green
W36="$WORK/w36"; make_clone "$W36" writer-36
sync_clone "$W36"
OTHER36="$WORK/other36"; make_clone "$OTHER36" other36
sync_clone "$OTHER36"
edit_line "$OTHER36" t-preexist-conflict 1 landed-remote
git -C "$OTHER36" commit -qam 'concurrent edit lands on origin (case 36 fixture)'
git -C "$OTHER36" push -q origin main
# W36 is now stale: give it a conflicting local commit and start the rebase that
# stops on it, leaving a live rebase state dir and a detached HEAD.
edit_line "$W36" t-preexist-conflict 1 local-side
git -C "$W36" commit -qam 'local conflicting commit (case 36 fixture)'
git -C "$W36" fetch -q origin main
git -C "$W36" rebase FETCH_HEAD >/dev/null 2>&1
rebase_started=0
[[ -d "$W36/.git/rebase-merge" || -d "$W36/.git/rebase-apply" ]] && rebase_started=1
# An unrelated node edit, so the invocation would otherwise be a normal landing.
edit_line "$W36" t-preexist-rebase 1 should-never-land
set_mode green   # resets the gh call log
before_sha="$(origin_sha)"
out="$(run_gc "$W36" -m 'test: pre-existing rebase' t-preexist-rebase 2>&1)"; rc=$?
after_sha="$(origin_sha)"
if [[ "$rebase_started" -eq 1 && $rc -ne 0 ]] \
   && grep -q 'a rebase is already in progress' <<<"$out" \
   && [[ "$after_sha" == "$before_sha" ]] \
   && [[ "$(gh_calls)" -eq 0 ]]; then
  ok "pre-existing rebase: refused up front, main untouched, zero gh calls"
else
  no "pre-existing rebase refusal (rebase_started=$rebase_started rc=$rc gh_calls=$(gh_calls))"; printf '%s\n' "$out"
fi
# The caller's rebase must still be there — the refusal aborts nothing.
if [[ -d "$W36/.git/rebase-merge" || -d "$W36/.git/rebase-apply" ]]; then
  ok "pre-existing rebase: the caller's own rebase is left in progress, not aborted"
else
  no "pre-existing rebase: the caller's rebase was destroyed by the refusal"
fi
git -C "$W36" rebase --abort >/dev/null 2>&1

# --- Case 37: a rebase this run stranded is aborted by cleanup() ----------------
# End-to-end (not the sourced-function fallback): the run is driven down a real
# die() that fires while `git pull --rebase origin main`'s conflict is still
# live. The lever is try_layer2_resolve()'s broken-staging-invariant die — an
# EXTRA local commit touching a DIFFERENT node id conflicts on the rebase, and
# that conflicted path is outside this invocation's node set, so layer 2 dies
# instead of reaching its own explicit `git rebase --abort`. Only cleanup() can
# clear the rebase on this path. (The extra commit is intentions/-only, so
# ensure_intentions_only_base() leaves the worktree alone and the commit
# survives to be replayed.)
set_mode green
W37="$WORK/w37"; make_clone "$W37" writer-37
sync_clone "$W37"
OTHER37="$WORK/other37"; make_clone "$OTHER37" other37
sync_clone "$OTHER37"
edit_line "$OTHER37" t-strand-other 1 landed-remote
git -C "$OTHER37" commit -qam 'concurrent edit lands on origin (case 37 fixture)'
git -C "$OTHER37" push -q origin main
edit_line "$W37" t-strand-other 1 local-strand
git -C "$W37" commit -qam 'local conflicting commit on an out-of-set node (case 37 fixture)'
edit_line "$W37" t-strand-main 1 strand-edit   # the node actually passed to graph-commit
before_sha="$(origin_sha)"
out="$(run_gc "$W37" -m 'test: stranded rebase' t-strand-main 2>&1)"; rc=$?
after_sha="$(origin_sha)"
if [[ $rc -ne 0 ]] \
   && grep -q 'unexpected conflicted path' <<<"$out" \
   && [[ "$after_sha" == "$before_sha" ]]; then
  ok "stranded rebase: the run dies mid-rebase on the broken-staging-invariant path"
else
  no "stranded rebase setup (rc=$rc)"; printf '%s\n' "$out"
fi
if [[ ! -d "$W37/.git/rebase-merge" && ! -d "$W37/.git/rebase-apply" ]] \
   && [[ "$(git -C "$W37" symbolic-ref -q HEAD)" == "refs/heads/main" ]] \
   && git -C "$W37" show HEAD:intentions/t-strand-other.md | grep -q 'line1: local-strand'; then
  ok "stranded rebase: cleanup() aborted it — no state dir, HEAD reattached, local commits intact"
else
  no "stranded rebase not aborted by cleanup (HEAD=$(git -C "$W37" symbolic-ref -q HEAD))"; printf '%s\n' "$out"
fi

# --- Case 38: duplicate green rows still land --------------------------------
set_mode duplicate-rows
W38="$WORK/w38"
make_clone "$W38" writer-38
edit_line "$W38" t-dup-rows 1 dup-rows-land
out="$(run_gc "$W38" -m 'test: duplicate rows' t-dup-rows 2>&1)"; rc=$?
if [[ $rc -eq 0 ]] && origin_show t-dup-rows | grep -q 'line1: dup-rows-land' \
   && ! grep -q 'retry later' <<<"$out"; then
  ok "duplicate green rows per required name still land (distinct-context gate)"
else
  no "duplicate green rows (rc=$rc)"; printf '%s\n' "$out"
fi

# --- Case 39: duplicated rows do not paper over a missing context ------------
set_mode partial-duplicate
W39="$WORK/w39"
make_clone "$W39" writer-39
edit_line "$W39" t-partial-dup 1 must-not-land
before="$(origin_sha)"
out="$(export GC_POLL=0 GC_TIMEOUT=1 GC_ATTEMPTS=1; run_gc "$W39" -m 'test: partial dup' t-partial-dup 2>&1)"; rc=$?
if [[ $rc -eq 1 && "$(origin_sha)" == "$before" ]] \
   && grep -q 'acceptance=absent' <<<"$out"; then
  ok "duplicated rows do not satisfy the gate when a required context is absent"
else
  no "partial-duplicate gate (rc=$rc)"; printf '%s\n' "$out"
fi
sync_clone "$W39"   # drop the never-landed local commit

# --- Case 40: a stale failed row superseded by a newer success lands ---------
set_mode stale-fail-then-green
W40="$WORK/w40"
make_clone "$W40" writer-40
edit_line "$W40" t-stale-fail 1 newest-run-wins
out="$(run_gc "$W40" -m 'test: stale fail then green' t-stale-fail 2>&1)"; rc=$?
if [[ $rc -eq 0 ]] && origin_show t-stale-fail | grep -q 'line1: newest-run-wins' \
   && ! grep -q 'concluded non-success' <<<"$out"; then
  ok "stale failed row superseded by a newer success lands (newest run per name)"
else
  no "stale-fail-then-green (rc=$rc)"; printf '%s\n' "$out"
fi

# --- Case 41: no-op short-circuit exits 0 even when checks are unusable ------
# A clone synced exactly to origin/main's tip, invoked on an existing id with
# nothing edited, while gh is in hard-fail mode (every call exits 1). If the
# no-op guard did not short-circuit before the poller, this would die with
# "polling failed" instead of landing (a genuine no-op) cleanly.
set_mode hard-fail
W41="$WORK/w41"
make_clone "$W41" writer-41
sync_clone "$W41"   # now bit-for-bit at origin/main's tip
before_sha="$(origin_sha)"
out="$(run_gc "$W41" t-happy 2>&1)"; rc=$?
after_sha="$(origin_sha)"
calls="$(gh_calls)"
if [[ $rc -eq 0 ]] \
   && ! grep -q 'polling failed' <<<"$out" \
   && [[ "$calls" -eq 0 ]] \
   && [[ "$after_sha" == "$before_sha" ]]; then
  ok "no-op short-circuit exits 0 with zero gh polls even when checks are unusable (hard-fail mode)"
else
  no "no-op short-circuit under hard-fail (rc=$rc gh_calls=$calls)"; printf '%s\n' "$out"
fi

# --- Case 42: lock-wait exhaustion names the lock, not a check observation ---
# A foreign lock with a far-future expiry is never stolen, so the writer exits
# the attempt loop having made ZERO check-run polls. The terminal message must
# then name the landing lock as the cause and state plainly that no check state
# was ever observed — never print a check-state snapshot (which, before
# LAST_CHECK_SHA, could only have come from an unrelated earlier attempt).
# Reuses the t-lock-wait node on a different line; this run must not land.
set_mode green
blocking_expiry=$(( $(date +%s) + 3600 ))
plant_lock "$blocking_expiry" blocking-holder-test
W42="$WORK/w42"
make_clone "$W42" writer-42
edit_line "$W42" t-lock-wait 5 must-not-land
before="$(origin_sha)"
out="$(export GC_LOCK_POLL=1 GC_LOCK_WAIT=1 GC_ATTEMPTS=1; run_gc "$W42" -m 'test: lock wait exhausted' t-lock-wait 2>&1)"; rc=$?
calls="$(gh_calls)"
if [[ $rc -eq 1 && "$(origin_sha)" == "$before" && "$calls" -eq 0 ]] \
   && grep -q 'could not land on main after 1/1 attempts' <<<"$out" \
   && grep -q 'cause: the landing lock was not acquired' <<<"$out" \
   && grep -q 'required-check state was never observed' <<<"$out" \
   && ! grep -q 'required-check state observed on' <<<"$out"; then
  ok "lock-wait exhaustion: names the landing lock as the cause, reports no check observation (0 polls)"
else
  no "lock-wait exhaustion diagnostic (rc=$rc gh_calls=$calls origin_moved=$([[ "$(origin_sha)" == "$before" ]] && echo no || echo yes))"
  printf '%s\n' "$out"
fi
git -C "$ORIGIN" update-ref -d refs/graph/landing-lock

# --- Case 43: a forged green row cannot mask a genuine failure ---------------
# A row named `lint` written by a principal OTHER than the GitHub Actions App
# (any holder of `checks: write`), with conclusion success, a far-future
# caller-supplied started_at, and a high id. The producer filter drops it, so
# `lint` still resolves to the genuine failure row: hard refusal, no retry,
# nothing lands on main.
set_mode forged-green
W43="$WORK/w43"
make_clone "$W43" writer-43
edit_line "$W43" t-forged-green 1 must-not-land
before="$(origin_sha)"
out="$(run_gc "$W43" -m 'test: forged green row' t-forged-green 2>&1)"; rc=$?
calls="$(gh_calls)"
if [[ $rc -eq 1 && "$(origin_sha)" == "$before" && "$calls" -eq 1 ]] \
   && grep -q 'concluded non-success' <<<"$out" \
   && grep -q 'lint=failure' <<<"$out" \
   && grep -q 'not retrying' <<<"$out"; then
  ok "forged non-Actions green row cannot supersede a genuine failure (hard refusal, nothing lands)"
else
  no "forged-green gate (rc=$rc gh_calls=$calls origin_moved=$([[ "$(origin_sha)" == "$before" ]] && echo no || echo yes))"
  printf '%s\n' "$out"
fi
sync_clone "$W43"   # drop the never-landed local commit
# --- Case 44: bystander prune lands despite a park on another id ---------------
# t-bystander-conflict races a concurrent edit (same shape as Case 4) while
# t-bystander-prune, an unrelated node, is pruned in the SAME invocation. The
# conflicted id still parks; the bystander prune is not implicated in the
# conflict, so it must be re-applied after the park's re-sync and land WITH
# the park commit — not resurrected on disk and silently dropped. The landed
# park commit's subject must name the parked id and the pruned id in separate
# clauses (park.../prune...), never listing the pruned id as parked.
set_mode green
sync_clone "$A"; sync_clone "$B"
edit_line "$A" t-bystander-conflict 1 A-wins
run_gc "$A" t-bystander-conflict >/dev/null 2>&1
edit_line "$B" t-bystander-conflict 1 B-loses
rm -f "$B/intentions/t-bystander-prune.md"
out="$(run_gc "$B" -m 'test: bystander prune' t-bystander-conflict --prune t-bystander-prune 2>&1)"; rc=$?
content="$(origin_show t-bystander-conflict 2>/dev/null)"
snap="$(sed -n 's/.*preserved at \(.*\) for the manual merge.*/\1/p' <<<"$out")"
[[ -n "$snap" ]] && SNAP_DIRS_TO_CLEAN+=("$snap")
subject="$(git -C "$ORIGIN" log -1 --format=%s main)"
park_clause="${subject%%; prune*}"
if [[ $rc -eq 1 ]] \
   && grep -q 'line1: A-wins' <<<"$content" \
   && ! grep -q '^line1: B-loses' <<<"$content" \
   && grep -q 'office_hours' <<<"$content" \
   && ! git -C "$ORIGIN" cat-file -e main:intentions/t-bystander-prune.md 2>/dev/null \
   && grep -q 't-bystander-conflict' <<<"$park_clause" \
   && ! grep -q 't-bystander-prune' <<<"$park_clause"; then
  ok "bystander prune: conflicted id parks, unrelated --prune lands anyway, commit subject names sets separately"
else
  no "bystander prune (rc=$rc)"; printf '%s\n' "$out"; printf '%s\n' "$content"; printf 'subject: %s\n' "$subject"
fi
# --- Case 45: stale --base on a --prune id parks, no resurrection --------------
# A concurrent writer advances t-prune-base-stale on origin/main after W45
# read its base blob. W45 then prunes it locally with that stale --base. Before
# Unit 2, check_base_freshness() handed the (nonexistent, by --prune contract)
# --ours path to the merge-node shim, which — lacking a guard for a missing
# --ours — silently resolved from theirs alone, resurrecting the file and
# landing rc 0 through the empty-diff branch. Since Unit 2, a --prune id is
# excluded from the merge attempt entirely and parks with a prune-specific
# reason.
set_mode green
W45="$WORK/w45"
make_clone "$W45" writer-45
stale="$(git -C "$W45" hash-object intentions/t-prune-base-stale.md)"
OTHER45="$WORK/other45"
make_clone "$OTHER45" other45
echo "line13: concurrent edit" >>"$OTHER45/intentions/t-prune-base-stale.md"
git -C "$OTHER45" commit -qam 'concurrent edit'
git -C "$OTHER45" push -q origin main
rm -f "$W45/intentions/t-prune-base-stale.md"
out="$(run_gc "$W45" -m 'test: prune stale base' --base "t-prune-base-stale=$stale" --prune t-prune-base-stale 2>&1)"; rc=$?
content="$(origin_show t-prune-base-stale 2>/dev/null)"
snap="$(sed -n 's/.*preserved at \(.*\) for the manual merge.*/\1/p' <<<"$out")"
[[ -n "$snap" ]] && SNAP_DIRS_TO_CLEAN+=("$snap")
if [[ $rc -eq 1 ]] \
   && [[ -n "$content" ]] \
   && grep -q 'office_hours' <<<"$content" \
   && grep -q 'prune base moved' <<<"$content" \
   && ! grep -q 'ran and rejected these inputs' <<<"$content" \
   && ! grep -q 'layer 2/3 auto-resolved' <<<"$out"; then
  ok "prune stale base: refuses to land, parks with a prune-specific reason, no resurrection"
else
  no "prune stale base (rc=$rc)"; printf '%s\n' "$out"; printf '%s\n' "$content"
fi

# --- Case 46: bystander prune lands through the LAYER-3 park entry -------------
# Case 44 enters park_and_exit() from the layer-2 rc-12 tail: a local commit
# already exists and the conflicting rebase was aborted. This case enters it
# from inside check_base_freshness() instead — before any commit exists, with
# the writer's edits still uncommitted in the tree — which is the entry a
# --base-passing caller (the owed-prune census this fix exists for) actually
# takes. Same partition contract must hold: the stale-base id parks, the
# unrelated --prune is re-applied after the reset and lands with the park
# commit, and the subject names the two sets in separate clauses.
set_mode green
W46="$WORK/w46"
make_clone "$W46" writer-46
base46_sha="$(git -C "$W46" hash-object intentions/t-base-bystander-conflict.md)"
edit_field "$W46" t-base-bystander-conflict sentinel writer46-value
rm -f "$W46/intentions/t-base-bystander-prune.md"

OTHER46="$WORK/other46"
make_clone "$OTHER46" other46
edit_field "$OTHER46" t-base-bystander-conflict sentinel concurrent46-value
git -C "$OTHER46" commit -qam 'concurrent same-field edit'
git -C "$OTHER46" push -q origin main

out="$(run_gc "$W46" -m 'test: layer-3 bystander prune' \
        --base "t-base-bystander-conflict=$base46_sha" \
        t-base-bystander-conflict --prune t-base-bystander-prune 2>&1)"; rc=$?
content="$(origin_show t-base-bystander-conflict 2>/dev/null)"
snap="$(sed -n 's/.*preserved at \(.*\) for the manual merge.*/\1/p' <<<"$out")"
[[ -n "$snap" ]] && SNAP_DIRS_TO_CLEAN+=("$snap")
subject="$(git -C "$ORIGIN" log -1 --format=%s main)"
park_clause="${subject%%; prune*}"
if [[ $rc -eq 1 ]] \
   && grep -q 'mechanical-unresolved' <<<"$content" \
   && grep -q 'sentinel: concurrent46-value' <<<"$content" \
   && ! git -C "$ORIGIN" cat-file -e main:intentions/t-base-bystander-prune.md 2>/dev/null \
   && grep -q 't-base-bystander-conflict' <<<"$park_clause" \
   && ! grep -q 't-base-bystander-prune' <<<"$park_clause" \
   && grep -q 't-base-bystander-prune' <<<"$subject"; then
  ok "layer 3 bystander prune: stale --base parks its own node while the unrelated --prune lands with the park commit"
else
  no "layer 3 bystander prune (rc=$rc)"; printf '%s\n' "$out"; printf '%s\n' "$content"; printf 'subject: %s\n' "$subject"
fi

# --- Case 47: a foreign --base manifest entry must not park nothing ------------
# check_base_freshness() walks EVERY --base key, and a batch manifest (the
# owed-prune census's whole-graph dump) may name nodes this invocation does not
# commit. Here t-manifest-foreign was pruned on origin/main by another writer
# after the dump, so the manifest blob is stale AND the id is absent from this
# fresh checkout — merge-node.ts crashes on the nonexistent --ours, which lands
# t-manifest-foreign (and only it) in the conflicted set. Every id this
# invocation actually commits is then a bystander prune, so the naive partition
# leaves park_ids empty: park_write() would be called with zero ids, the subject
# would carry an empty park clause, and the run would exit 1 announcing a park
# that exists nowhere. The conservative fallback must fire instead — park every
# id, re-apply no prune.
set_mode green
OTHER47="$WORK/other47"
make_clone "$OTHER47" other47
stale47="$(git -C "$OTHER47" hash-object intentions/t-manifest-foreign.md)"
git -C "$OTHER47" rm -q intentions/t-manifest-foreign.md
git -C "$OTHER47" commit -qm 'concurrent prune of the foreign manifest node'
git -C "$OTHER47" push -q origin main

W47="$WORK/w47"
make_clone "$W47" writer-47            # fresh: t-manifest-foreign is NOT on disk
MANIFEST47="$WORK/base47.manifest"
printf 't-manifest-foreign=%s\n' "$stale47" >"$MANIFEST47"
rm -f "$W47/intentions/t-manifest-prune.md"

out="$(run_gc "$W47" -m 'test: foreign manifest entry' --base "$MANIFEST47" \
        --prune t-manifest-prune 2>&1)"; rc=$?
content="$(origin_show t-manifest-prune 2>/dev/null)"
snap="$(sed -n 's/.*preserved at \(.*\) for the manual merge.*/\1/p' <<<"$out")"
[[ -n "$snap" ]] && SNAP_DIRS_TO_CLEAN+=("$snap")
subject="$(git -C "$ORIGIN" log -1 --format=%s main)"
if [[ $rc -eq 1 ]] \
   && grep -q "names no id in this invocation's node set" <<<"$out" \
   && [[ -n "$content" ]] \
   && grep -q 'office_hours' <<<"$content" \
   && grep -q 't-manifest-prune' <<<"$subject" \
   && ! grep -q '; prune' <<<"$subject"; then
  ok "foreign manifest entry: park_ids never degenerates to empty — every id parks, no prune is re-applied"
else
  no "foreign manifest entry (rc=$rc)"; printf '%s\n' "$out"; printf '%s\n' "$content"; printf 'subject: %s\n' "$subject"
fi

# --- Case 48: far-ahead + stale --base: the layer-3 merge survives the rebuild ---
# Cases 48-52 are the five Unit 1/Unit 2 regression guards from PR #2990. That
# PR's body cited them as "cases 36-40" — its own numbers when the body was
# written — but an unrelated origin/main commit inserted its own new cases
# 36-47 ahead of them before the PR merged, shifting these five to 48-52
# without the body text ever being corrected
# (tactic-tactic-graph-commit-rebuild-snapshot-stale-revert-main-qa-regression).
# The case content and behavior were never wrong, only the PR body's ordinal
# citation — a hazard inherent to citing by position in an ordered list that
# keeps growing. Cite these cases by their `ok`/`no` assertion text (e.g. "the
# far-ahead + stale --base: layer-3 merge survives the far-ahead rebuild"
# case), never by number, in any PR body, node text, or comment elsewhere in
# this file: the assertion text moves with the case; the ordinal does not.
#
# Unit 1 regression guard. Wfab is BOTH far-ahead (a non-intentions code
# commit on HEAD, like case 16) AND carrying a stale --base whose field-level
# delta is disjoint from a concurrent writer's landed edit (like case 21).
# Before Unit 1's fix, ensure_intentions_only_base()'s far-ahead rebuild would
# copy the PRE-merge SNAP_DIR content back over the layer-3 merge result,
# silently reverting the concurrent writer's landed fieldB edit even though
# the log line still claimed "layer 2/3 auto-resolved". The fix keeps
# SNAP_DIR authoritative once the merge resolves, so the rebuild replays the
# merged content instead.
set_mode green
Wfab="$WORK/wfab"
make_clone "$Wfab" writer-fab
fab_sha="$(git -C "$Wfab" hash-object intentions/t-farahead-base.md)"

mkdir -p "$Wfab/src"
echo "console.log('pr feature code, far-ahead + stale base')" >"$Wfab/src/farahead-base-feature.js"
git -C "$Wfab" add src/farahead-base-feature.js
git -C "$Wfab" commit -qm 'pr: non-intentions code change (far-ahead + stale base)'
fab_tip="$(git -C "$Wfab" rev-parse HEAD)"

edit_field "$Wfab" t-farahead-base fieldA farahead-edit

OTHERFAB="$WORK/otherfab"
make_clone "$OTHERFAB" otherfab
edit_field "$OTHERFAB" t-farahead-base fieldB concurrent-edit
git -C "$OTHERFAB" commit -qam 'concurrent field edit (far-ahead + stale base)'
git -C "$OTHERFAB" push -q origin main

out="$(run_gc "$Wfab" -m 'test: far-ahead stale base' --base "t-farahead-base=$fab_sha" t-farahead-base 2>&1)"; rc=$?
content="$(origin_show t-farahead-base 2>/dev/null)"
main_tree3="$(git -C "$ORIGIN" ls-tree -r --name-only main)"
restored3="$(git -C "$Wfab" rev-parse HEAD)"
if [[ $rc -eq 0 ]] \
   && grep -q 'fieldA: farahead-edit' <<<"$content" \
   && grep -q 'fieldB: concurrent-edit' <<<"$content" \
   && ! grep -q 'src/farahead-base-feature.js' <<<"$main_tree3" \
   && [[ "$restored3" == "$fab_tip" ]]; then
  ok "far-ahead + stale --base: layer-3 merge survives the far-ahead rebuild, both fields land"
else
  no "far-ahead + stale --base (rc=$rc restored3=$restored3 fab_tip=$fab_tip)"; printf '%s\n' "$out"; printf '%s\n' "$content"
fi

# ---------------------------------------------------------------------------
# Cases 49-51: the far-ahead rebuild's three-way replay (Unit 2).
#
# Cases 16/18/48 all exercise the far-ahead rebuild where either nothing landed
# concurrently or a --base CAS caught the divergence first. These three cover
# the hole that opened when NEITHER applies: a writer with NO --base whose
# worktree is far-ahead, racing a concurrent landing to the same node. Pre-Unit-2
# the rebuild blindly `cp`'d the snapshot back over the freshly-reset tree, so
# the concurrent edit was reverted with no conflict, no park, and no diagnostic.
#
# NOT covered here: a concurrent PRUNE racing this writer's edit (the node exists
# at the fork point but is absent on origin/main). The real merge-node.ts treats
# an empty --theirs with a non-null base as a delete/modify conflict (see
# merge-node.ts's own comment), but this harness's npx shim resolves an empty
# --theirs in favor of ours — a test here would assert shim behavior, not
# product behavior. It is covered by the real merge primitive's own unit tests.

# --- Case 49: far-ahead, no --base, disjoint field — both edits land ---------
set_mode green
W49="$WORK/w49"
make_clone "$W49" writer-49
mkdir -p "$W49/src"
echo "console.log('pr feature code, far-ahead race')" >"$W49/src/farahead-race-feature.js"
git -C "$W49" add src/farahead-race-feature.js
git -C "$W49" commit -qm 'pr: non-intentions code change (far-ahead race)'
race_tip="$(git -C "$W49" rev-parse HEAD)"
edit_field "$W49" t-farahead-race fieldA writer-edit

OTHERRACE="$WORK/otherrace"
make_clone "$OTHERRACE" otherrace
edit_field "$OTHERRACE" t-farahead-race fieldB concurrent-edit
git -C "$OTHERRACE" commit -qam 'concurrent field edit (far-ahead race)'
git -C "$OTHERRACE" push -q origin main

out="$(run_gc "$W49" -m 'test: far-ahead race, disjoint field' t-farahead-race 2>&1)"; rc=$?
content="$(origin_show t-farahead-race 2>/dev/null)"
main_tree49="$(git -C "$ORIGIN" ls-tree -r --name-only main)"
restored49="$(git -C "$W49" rev-parse HEAD)"
if [[ $rc -eq 0 ]] \
   && grep -q 'fieldA: writer-edit' <<<"$content" \
   && grep -q 'fieldB: concurrent-edit' <<<"$content" \
   && ! grep -q 'src/farahead-race-feature.js' <<<"$main_tree49" \
   && [[ "$restored49" == "$race_tip" ]]; then
  ok "far-ahead race, no --base: the rebuild's three-way replay merges, both writers' fields land"
else
  no "far-ahead race disjoint field (rc=$rc restored49=$restored49 race_tip=$race_tip)"; printf '%s\n' "$out"; printf '%s\n' "$content"
fi

# --- Case 50: far-ahead, no --base, SAME field — parks, HEAD restored --------
set_mode green
W50="$WORK/w50"
make_clone "$W50" writer-50
mkdir -p "$W50/src"
echo "console.log('pr feature code, far-ahead race conflict')" >"$W50/src/farahead-race-conflict-feature.js"
git -C "$W50" add src/farahead-race-conflict-feature.js
git -C "$W50" commit -qm 'pr: non-intentions code change (far-ahead race conflict)'
race_conflict_tip="$(git -C "$W50" rev-parse HEAD)"
edit_field "$W50" t-farahead-race-conflict sentinel writer-value

OTHERRACE2="$WORK/otherrace2"
make_clone "$OTHERRACE2" otherrace2
edit_field "$OTHERRACE2" t-farahead-race-conflict sentinel concurrent-value
git -C "$OTHERRACE2" commit -qam 'concurrent same-field edit (far-ahead race conflict)'
git -C "$OTHERRACE2" push -q origin main

out="$(run_gc "$W50" -m 'test: far-ahead race, same field' t-farahead-race-conflict 2>&1)"; rc=$?
content="$(origin_show t-farahead-race-conflict 2>/dev/null)"
restored50="$(git -C "$W50" rev-parse HEAD)"
snap="$(sed -n 's/.*preserved at \(.*\) for the manual merge.*/\1/p' <<<"$out")"
[[ -n "$snap" ]] && SNAP_DIRS_TO_CLEAN+=("$snap")
if [[ $rc -eq 1 ]] \
   && grep -q 'mechanical-unresolved' <<<"$content" \
   && grep -q 'writer-value' <<<"$content" \
   && grep -q 'concurrent-value' <<<"$content" \
   && [[ "$restored50" == "$race_conflict_tip" ]]; then
  ok "far-ahead race, same field: parks mechanical-unresolved instead of overwriting, HEAD restored to the PR tip"
else
  no "far-ahead race same-field park (rc=$rc restored50=$restored50 race_conflict_tip=$race_conflict_tip)"; printf '%s\n' "$out"; printf '%s\n' "$content"
fi

# --- Case 51: far-ahead --prune racing a concurrent edit — park, node survives ---
set_mode green
W51="$WORK/w51"
make_clone "$W51" writer-51
mkdir -p "$W51/src"
echo "console.log('pr feature code, far-ahead prune race')" >"$W51/src/farahead-prune-race-feature.js"
git -C "$W51" add src/farahead-prune-race-feature.js
git -C "$W51" commit -qm 'pr: non-intentions code change (far-ahead prune race)'
prune_race_tip="$(git -C "$W51" rev-parse HEAD)"
rm -f "$W51/intentions/t-farahead-prune-race.md"

OTHERRACE3="$WORK/otherrace3"
make_clone "$OTHERRACE3" otherrace3
edit_line "$OTHERRACE3" t-farahead-prune-race 1 concurrent-edit-survives
git -C "$OTHERRACE3" commit -qam 'concurrent edit racing a far-ahead prune'
git -C "$OTHERRACE3" push -q origin main

out="$(run_gc "$W51" -m 'test: far-ahead prune race' --prune t-farahead-prune-race 2>&1)"; rc=$?
content="$(origin_show t-farahead-prune-race 2>/dev/null || true)"
restored51="$(git -C "$W51" rev-parse HEAD)"
snap="$(sed -n 's/.*preserved at \(.*\) for the manual merge.*/\1/p' <<<"$out")"
[[ -n "$snap" ]] && SNAP_DIRS_TO_CLEAN+=("$snap")
if [[ $rc -eq 1 ]] \
   && grep -q 'line1: concurrent-edit-survives' <<<"$content" \
   && grep -q 'prune vs. concurrent edit' <<<"$content" \
   && [[ "$restored51" == "$prune_race_tip" ]]; then
  ok "far-ahead prune race: the prune is guarded, the node survives on main with the concurrent edit, HEAD restored"
else
  no "far-ahead prune race (rc=$rc restored51=$restored51 prune_race_tip=$prune_race_tip)"; printf '%s\n' "$out"; printf '%s\n' "$content"
fi

# --- Case 52: far-ahead list-entry removal racing a concurrent edit ----------
# This writer clears one satisfied `blocked_by` entry (the routine drain
# operation) from a far-ahead PR worktree; another writer lands an unrelated
# field edit to the same node first, so the replay takes its MERGE branch.
#
# Until tactic-node-merge-list-removal-loss landed, mergeIntentionNodes merged
# list fields with a BASE-FREE union that would have restored the cleared entry
# while reporting a clean auto-resolve, so replay_snapshot_onto_base carried an
# interim guard that PARKED this shape rather than hand the removal to that
# merge. `threeWayList` (packages/intentionsutil/src/node-merge.ts) is now
# base-aware and drops an entry present in base and theirs but absent from
# ours, so the guard was deleted and this shape must LAND.
#
# WHAT THIS CASE ASSERTS, AND WHAT IT DELIBERATELY DOES NOT. It asserts the
# graph-commit-level ROUTING property that replaced the guard: a far-ahead
# replay whose snapshot drops a frontmatter list entry now reaches the
# field-level merge and lands — exit 0, no office_hours and no park text on the
# landed node, the concurrent writer's edit preserved, the PR's non-intentions
# commit still absent from main, and HEAD restored to the PR tip.
#
# It does NOT assert which list entries survive the merge. The harness's
# merge-node.ts shim merges bare `key: value` lines and discards every YAML
# list-ITEM line on all three sides, so it emits NEITHER the removed entry nor
# the one that must survive: `! grep t-satisfied-blocker` would pass vacuously
# here and `grep t-other-blocker` — the control that would make it non-vacuous
# — would fail against the shim, not against the product. That is the same
# reason cases 49-51 give for not testing a concurrent prune at this layer.
# The removal-is-honored property is asserted against the REAL code, at the two
# layers that can run it:
#   - packages/intentionsutil/test/node-merge.test.ts (i)/(j)/(p)/(q) — the
#     primitive, including the survivor: base [x,y], ours [y], theirs [x,y]
#     merges to [y].
#   - packages/intentionsutil/test/merge-node-cli.test.ts, "a removed
#     blocked_by entry survives validateNode + stringify to --out" — the exact
#     CLI run_merge_node invokes, end to end through the file round-trip.
set_mode green
W52="$WORK/w52"
make_clone "$W52" writer-52
mkdir -p "$W52/src"
echo "console.log('pr feature code, far-ahead list removal')" >"$W52/src/farahead-list-removal-feature.js"
git -C "$W52" add src/farahead-list-removal-feature.js
git -C "$W52" commit -qm 'pr: non-intentions code change (far-ahead list removal)'
list_removal_tip="$(git -C "$W52" rev-parse HEAD)"
sed -i '/^  - t-satisfied-blocker$/d' "$W52/intentions/t-farahead-list-removal.md"

OTHERRACE4="$WORK/otherrace4"
make_clone "$OTHERRACE4" otherrace4
edit_field "$OTHERRACE4" t-farahead-list-removal fieldB concurrent-edit
git -C "$OTHERRACE4" commit -qam 'concurrent field edit racing a list-entry removal'
git -C "$OTHERRACE4" push -q origin main

out="$(run_gc "$W52" -m 'test: far-ahead list-entry removal' t-farahead-list-removal 2>&1)"; rc=$?
content="$(origin_show t-farahead-list-removal 2>/dev/null)"
main_tree52="$(git -C "$ORIGIN" ls-tree -r --name-only main)"
restored52="$(git -C "$W52" rev-parse HEAD)"
if [[ $rc -eq 0 ]] \
   && ! grep -q 'office_hours' <<<"$content" \
   && ! grep -q 'list-entry removal vs. concurrent edit' <<<"$content" \
   && grep -q 'fieldB: concurrent-edit' <<<"$content" \
   && ! grep -q 'src/farahead-list-removal-feature.js' <<<"$main_tree52" \
   && [[ "$restored52" == "$list_removal_tip" ]]; then
  ok "far-ahead list-entry removal: reaches the base-aware merge and LANDS instead of parking, concurrent edit preserved, HEAD restored"
else
  no "far-ahead list-entry removal lands (rc=$rc restored52=$restored52 list_removal_tip=$list_removal_tip)"; printf '%s\n' "$out"; printf '%s\n' "$content"
fi

# ---------------------------------------------------------------------------
# Cases 53-57: SIGKILL. See the header block. These kill the writer's process
# group for real (no trap runs, no cleanup), so each one cleans up after the
# corpse explicitly — the killed writer cannot.
# ---------------------------------------------------------------------------

# --- Case 53: killed while WAITING on a live lock leaves no orphan ------------
# The orphan-window containment property (graph-commit's ORPHAN-WINDOW
# CONTAINMENT comment in try_land): the local commit is made INSIDE try_land,
# after the landing lock is held. A writer killed while blocked in
# lock_claim_or_renew has therefore committed nothing — the window where the
# observed incidents died is gone. Before that change, main() committed before
# land(), so this same kill left an orphan every time.
#
# The wait condition is the writer's own FETCH_HEAD: main()'s single
# `git fetch origin main` leaves it at main's tip, and the FIRST pass of
# lock_claim_or_renew re-points it at the lock commit (the lock object is not
# in a fresh clone's object database, so read_lock_payload misses and the loop
# fetches refs/graph/landing-lock). FETCH_HEAD == the planted lock sha is
# therefore a precise, stable signal that the writer is inside the lock wait.
#
# ORDER MATTERS: the clone is made BEFORE the lock is planted. `git clone` from
# a local path copies (hardlinks) the whole object directory, so a lock commit
# that already exists in $ORIGIN would arrive in the clone's own object
# database — read_lock_payload would then succeed on its first try, the loop
# would never fetch, and FETCH_HEAD would never move off main's tip.
set_mode green
W53="$WORK/w53"
make_clone "$W53" writer-53
lockwait_expiry=$(( $(date +%s) + 3600 ))
plant_lock "$lockwait_expiry" kill-lockwait-holder
lockwait_lock_sha="$(git -C "$ORIGIN" for-each-ref --format='%(objectname)' refs/graph/landing-lock)"
edit_line "$W53" t-kill-lockwait 1 killed-before-any-commit
before53="$(origin_sha)"
pgid53="$WORK/pgid-53"; out53="$WORK/out-53.log"
# Prefix assignments on a FUNCTION call persist in bash, so they are unset
# again immediately — start_gc_killable must launch in this shell (not a
# subshell) for kill_gc_group's `wait` to be able to reap its own child.
GC_LOCK_POLL=1 GC_LOCK_WAIT=600 \
  start_gc_killable "$pgid53" "$out53" "$W53" -m 'test: killed in lock wait' t-kill-lockwait
unset GC_LOCK_POLL GC_LOCK_WAIT
if ! wait_until 300 fetch_head_is "$W53" "$lockwait_lock_sha"; then
  no "kill in lock wait: writer never reached the lock wait (FETCH_HEAD never became the lock sha)"
  printf 'planted=%s observed FETCH_HEAD=%s\n' "$lockwait_lock_sha" "$(git -C "$W53" rev-parse FETCH_HEAD 2>&1)"
  printf '%s\n' "$(cat "$out53" 2>/dev/null)"
  kill_gc_group "$pgid53"
else
  kill_gc_group "$pgid53"
  ahead53="$(local_commits_ahead "$W53" "$before53")"
  dirty53="$(git -C "$W53" status --porcelain -- intentions/t-kill-lockwait.md)"
  if [[ "$ahead53" == "0" && "$(origin_sha)" == "$before53" ]]; then
    ok "kill in lock wait: no local commit was made and origin/main is untouched (no orphan)"
  else
    no "kill in lock wait: ahead=$ahead53 origin_moved=$([[ "$(origin_sha)" == "$before53" ]] && echo no || echo yes)"
    printf '%s\n' "$(cat "$out53" 2>/dev/null)"
  fi
  # Non-vacuity, and the recovery story: the writer's edit is still on disk
  # uncommitted, so re-running the same invocation still has something to land.
  if [[ -n "$dirty53" ]] && grep -q 'line1: killed-before-any-commit' "$W53/intentions/t-kill-lockwait.md"; then
    ok "kill in lock wait: the writer's edit survives uncommitted on disk (a re-run still lands it)"
  else
    no "kill in lock wait: expected the edit to remain uncommitted (status='$dirty53')"
  fi
  if [[ -z "$(scratch_refs)" ]]; then
    ok "kill in lock wait: no scratch branch was ever pushed (the kill landed before the stamp)"
  else
    no "kill in lock wait: unexpected scratch branch: $(scratch_refs)"
    drop_scratch_refs
  fi
fi
git -C "$ORIGIN" update-ref -d refs/graph/landing-lock

# --- Cases 54 & 55: killed MID-STAMP — a detectable, recoverable orphan -------
# The residual window graph-commit's header block says CANNOT be closed (git
# has no atomic commit-and-push): commit → stamp → push. `blocked-green` parks
# the writer inside await_checks() — past the lock, past its local commit, past
# the scratch push — and the gh call log is the observable that it got there.
# Killing it then produces the real orphan, and the three properties that make
# an orphan survivable are asserted in order:
#   54a the local commit exists (the window is real, not hypothetical)
#   54b `verify-landed` reports not-landed (exit 4) against the intended blob
#   55  a graph-commit run over that orphan prints the `orphan=` recovery line
#   54c a PLAIN RE-RUN of the identical invocation lands it — no `git reset
#       --hard`, which the header block explicitly retires (it DISCARDS the
#       orphan)
# GC_LOCK_TTL=2 on the killed run: a SIGKILL never releases the landing lock,
# so the two runs below can only proceed by stealing the dead holder's claim
# after its TTL — which is the real recovery path, not a harness shortcut.
set_mode blocked-green
SENTINEL54="$WORK/kill-sentinel-54"; rm -f "$SENTINEL54"
W54="$WORK/w54"
make_clone "$W54" writer-54
edit_line "$W54" t-kill-stamp 1 kill-mid-stamp
intended54="$(git -C "$W54" hash-object -- intentions/t-kill-stamp.md)"
before54="$(origin_sha)"
pgid54="$WORK/pgid-54"; out54="$WORK/out-54.log"
GC_LOCK_POLL=1 GC_LOCK_TTL=2 GC_SENTINEL="$SENTINEL54" \
  start_gc_killable "$pgid54" "$out54" "$W54" -m 'test: killed mid-stamp' t-kill-stamp
unset GC_LOCK_POLL GC_LOCK_TTL GC_SENTINEL
if ! wait_until 300 gh_calls_at_least 1; then
  no "kill mid-stamp: writer never reached await_checks (no gh call observed)"
  rm -f "$SENTINEL54"; kill_gc_group "$pgid54"; drop_scratch_refs
else
  kill_gc_group "$pgid54"
  ahead54="$(local_commits_ahead "$W54" "$before54")"
  scratch54="$(scratch_refs)"
  if [[ "$ahead54" == "1" && "$(origin_sha)" == "$before54" ]]; then
    ok "kill mid-stamp: a local commit exists and is NOT on origin/main (the residual orphan window is real)"
  else
    no "kill mid-stamp: expected exactly 1 unpushed local commit (ahead=$ahead54)"
    printf '%s\n' "$(cat "$out54" 2>/dev/null)"
  fi
  # Non-vacuity: the killed writer had already pushed its scratch branch, which
  # is what places the kill INSIDE the commit→stamp→push window rather than
  # before it. No trap ran, so the branch is still there — drop it here, since
  # the corpse cannot.
  if [[ -n "$scratch54" ]]; then
    ok "kill mid-stamp: the kill landed after the scratch push (no cleanup ran — the branch survives)"
  else
    no "kill mid-stamp: expected a leftover scratch branch from the killed writer"
  fi
  drop_scratch_refs

  vl_out="$(bash "$HARNESS_DIR/verify-landed" -C "$W54" --node t-kill-stamp --blob "$intended54" 2>&1)"; vl_rc=$?
  if [[ $vl_rc -eq 4 ]] && grep -q 'verdict=not-landed' <<<"$vl_out"; then
    ok "kill mid-stamp: verify-landed reports not-landed (exit 4) for the orphaned content"
  else
    no "kill mid-stamp: verify-landed (rc=$vl_rc)"; printf '%s\n' "$vl_out"
  fi

  # --- Case 55: the not-landed verdict names the orphan and the recovery -----
  # A run that cannot land (checks never green, one attempt) over that same
  # orphan. Its terminal verdict is `not-landed`, which is one of the two
  # statuses print_orphan_recovery_line() speaks on. Substrings are taken from
  # the line graph-commit actually emits, not paraphrased.
  set_mode pending
  out55="$(export GC_POLL=1 GC_TIMEOUT=1 GC_ATTEMPTS=1 GC_LOCK_POLL=1
           run_gc "$W54" -m 'test: killed mid-stamp' t-kill-stamp 2>&1)"; rc55=$?
  orphan_line="$(grep 'graph-commit: orphan=' <<<"$out55")"
  if [[ $rc55 -eq 1 ]] \
     && grep -q 'graph-commit: verdict: not-landed ' <<<"$out55" \
     && [[ -n "$orphan_line" ]] \
     && grep -q 're-run this same graph-commit invocation' <<<"$orphan_line" \
     && grep -q 'NEVER git push this commit to main by hand' <<<"$orphan_line"; then
    ok "not-landed verdict names the orphan commit, the re-run recovery, and the no-hand-push prohibition"
  else
    no "orphan recovery line (rc=$rc55)"; printf '%s\n' "$out55"
  fi

  # --- Case 54c: the sanctioned recovery is a plain re-run -------------------
  set_mode green
  out54b="$(export GC_LOCK_POLL=1; run_gc "$W54" -m 'test: killed mid-stamp' t-kill-stamp 2>&1)"; rc54b=$?
  if [[ $rc54b -eq 0 ]] \
     && origin_show t-kill-stamp | grep -q 'line1: kill-mid-stamp' \
     && grep -q 'graph-commit: verdict: landed ' <<<"$out54b"; then
    ok "kill mid-stamp: an identical plain re-run lands the orphan (no 'git reset --hard' needed)"
  else
    no "kill mid-stamp recovery re-run (rc=$rc54b)"; printf '%s\n' "$out54b"
  fi
fi
rm -f "$SENTINEL54"

# --- Case 56: exhausted attempts over an already-landed write exit 0 ----------
# Direction B of the defect. The writer stamps a SHA, a PEER lands byte-
# identical content while it waits in await_checks, and its own push to main is
# then rejected as non-fast-forward. With one attempt configured that exhausts
# the loop, so this run's own view of itself is "I never landed anything" — and
# it used to exit 1 with the rejection as its last log line, telling a caller a
# write failed that is in fact ON origin/main. The verdict is derived from a
# post-push READ instead, so it reports landed-equivalent and exits 0.
set_mode blocked-green
SENTINEL56="$WORK/kill-sentinel-56"; rm -f "$SENTINEL56"
W56="$WORK/w56"; P56="$WORK/p56"
make_clone "$W56" writer-56
make_clone "$P56" peer-56
# Byte-identical edits from the same base: the peer's landed blob must equal
# the writer's intended blob, or the verdict would (correctly) be not-landed.
edit_line "$W56" t-kill-busy 1 both-writers-agree
edit_line "$P56" t-kill-busy 1 both-writers-agree
out56="$WORK/out-56.log"
( GC_ATTEMPTS=1 GC_LOCK_POLL=1 GC_SENTINEL="$SENTINEL56" \
    run_gc "$W56" -m 'test: busy but landed by a peer' t-kill-busy >"$out56" 2>&1
  echo $? >"$WORK/rc-56" ) &
pid56=$!
if ! wait_until 300 gh_calls_at_least 1; then
  no "busy-but-landed: writer never reached await_checks (no gh call observed)"
  : >"$SENTINEL56"; wait "$pid56" 2>/dev/null
else
  # The peer lands while the writer is parked in await_checks, so the writer's
  # own push to main below is guaranteed to be rejected.
  git -C "$P56" commit -qam 'peer lands the identical content'
  git -C "$P56" push -q origin main
  : >"$SENTINEL56"
  wait "$pid56"; rc56="$(cat "$WORK/rc-56")"
  out56_text="$(cat "$out56")"
  if [[ "$rc56" -eq 0 ]] \
     && grep -q 'graph-commit: verdict: landed-equivalent ' <<<"$out56_text" \
     && grep -q 'push of .* to main rejected' <<<"$out56_text" \
     && origin_show t-kill-busy | grep -q 'line1: both-writers-agree'; then
    ok "busy-exhausted over content a peer already landed: exit 0 with verdict landed-equivalent"
  else
    no "busy-but-landed (rc=$rc56)"; printf '%s\n' "$out56_text"
  fi
fi
rm -f "$SENTINEL56"

# --- Case 57: exactly one verdict line per run --------------------------------
# The verdict line is the parsed caller contract, and several paths can reach
# it (die(), park_and_exit(), emit_verdict_and_exit()). Two lines would mean a
# caller grepping for it reads whichever came first. print_verdict()'s
# once-only guard makes that structurally impossible; this is its regression
# test, over the three terminal shapes that reach it by different routes.
set_mode green
W57="$WORK/w57"
make_clone "$W57" writer-57
edit_line "$W57" t-verdict-happy 1 one-line-only
out57="$(run_gc "$W57" -m 'test: verdict uniqueness happy' t-verdict-happy 2>&1)"; rc57=$?
if [[ $rc57 -eq 0 && "$(verdict_lines "$out57")" == "1" ]]; then
  ok "verdict uniqueness: the happy path emits exactly one verdict line"
else
  no "verdict uniqueness happy (rc=$rc57 lines=$(verdict_lines "$out57"))"; printf '%s\n' "$out57"
fi
if [[ "$(verdict_lines "${out56_text:-}")" == "1" ]]; then
  ok "verdict uniqueness: the busy-but-landed run emits exactly one verdict line"
else
  no "verdict uniqueness busy-but-landed (lines=$(verdict_lines "${out56_text:-}"))"
fi
# A park: the same overlapping-edit shape as case 4, on its own node.
sync_clone "$A"; sync_clone "$B"
edit_line "$A" t-verdict-park 1 A-wins
run_gc "$A" t-verdict-park >/dev/null 2>&1
edit_line "$B" t-verdict-park 1 B-loses
out57p="$(run_gc "$B" -m 'test: verdict uniqueness park' t-verdict-park 2>&1)"; rc57p=$?
snap="$(sed -n 's/.*preserved at \(.*\) for the manual merge.*/\1/p' <<<"$out57p")"
[[ -n "$snap" ]] && SNAP_DIRS_TO_CLEAN+=("$snap")
if [[ $rc57p -eq 1 ]] \
   && grep -q 'graph-commit: verdict: parked ' <<<"$out57p" \
   && [[ "$(verdict_lines "$out57p")" == "1" ]]; then
  ok "verdict uniqueness: a park run emits exactly one verdict line (status parked)"
else
  no "verdict uniqueness park (rc=$rc57p lines=$(verdict_lines "$out57p"))"; printf '%s\n' "$out57p"
fi

# --- Case 58: delete/modify divergence — deletion lands first, edit races it via stale --base ---
# The reverse of case 23's direction: there, an edit landed first and a
# --prune raced it via a rebase CONFLICT. Here, a genuine deletion (rm + commit
# + push, not --prune) lands on origin/main FIRST, and a second writer's field
# edit — holding a --base blob sha captured before the deletion — races it via
# the stale-base path (layer 3), not a rebase conflict. merge-node.ts's
# --theirs-empty branch (Unit 1) reports this unresolved rather than silently
# treating it as an add/add ours-wins, and park_and_exit()'s re-materialization
# fix (Unit 2) keeps the park from crashing on the now-absent target file —
# WITHOUT reverting the landed deletion: the re-materialized file is local and
# unstaged, so origin/main keeps the node deleted and a human decides.
set_mode green
W23="$WORK/w23"
make_clone "$W23" writer-23
base_de_sha="$(git -C "$W23" hash-object intentions/t-field-delete-edit.md)"
edit_field "$W23" t-field-delete-edit fieldA writer23-edit
# do NOT commit/push W23's edit yet — it stays local, matching the stale-base
# setup cases 21-22 use, so the --base sha above is now stale once the
# deletion below lands.

W24="$WORK/w24"
make_clone "$W24" writer-24
rm -f "$W24/intentions/t-field-delete-edit.md"
git -C "$W24" commit -qam 'test: delete t-field-delete-edit'
git -C "$W24" push -q origin main

out="$(run_gc "$W23" -m 'test: delete vs edit' --base "t-field-delete-edit=$base_de_sha" t-field-delete-edit 2>&1)"; rc=$?
# The landed deletion must SURVIVE on origin/main: origin_show fails when the
# path is absent, which is exactly the expectation here.
still_deleted=0; origin_show t-field-delete-edit >/dev/null 2>&1 || still_deleted=1
# The re-materialization is local only, and UNTRACKED (`??`) — never staged,
# never committed, never pushed.
local_content="$(cat "$W23/intentions/t-field-delete-edit.md" 2>/dev/null || true)"
untracked58=0
[[ "$(git -C "$W23" status --porcelain -- intentions/t-field-delete-edit.md)" == '?? '* ]] && untracked58=1
snap="$(sed -n 's/.*preserved at \(.*\) for the manual merge.*/\1/p' <<<"$out")"
[[ -n "$snap" ]] && SNAP_DIRS_TO_CLEAN+=("$snap")
if [[ $rc -eq 1 ]] \
   && [[ $still_deleted -eq 1 ]] \
   && [[ $untracked58 -eq 1 ]] \
   && ! grep -q 'layer 2/3 auto-resolved' <<<"$out" \
   && grep -q 'delete/modify divergence on t-field-delete-edit' <<<"$out" \
   && grep -q 'nothing was parked ON MAIN' <<<"$out" \
   && ! grep -qF -- '(office_hours set on the origin/main content)' <<<"$out" \
   && grep -q 'office_hours' <<<"$local_content" \
   && grep -q 'delete/modify divergence' <<<"$local_content" \
   && grep -q 'fieldA: writer23-edit' <<<"$local_content" \
   && grep -q 'Placeholder body for t-field-delete-edit\.' <<<"$local_content" \
   && ! grep -q '^# base statement for t-field-delete-edit' <<<"$local_content"; then
  ok "delete/modify divergence: deletion lands first, stale-base edit races it — the deletion STANDS on main, the re-materialization is local+untracked with office_hours and the authored body, and no landed-park claim is emitted"
else
  no "delete/modify divergence (rc=$rc still_deleted=$still_deleted untracked=$untracked58)"; printf '%s\n' "$out"; printf '%s\n' "$local_content"
fi

# --- Case 59: idempotent park retry — already parked, byte-identical, nothing to push ---
# park_and_exit()'s committed=0 arm: the node on origin/main ALREADY carries a
# byte-identical office_hours block (a peer parked it first), so the park write
# leaves the tree clean, nothing is committed, nothing is pushed, and
# PUSHED_SHA stays empty. print_verdict() therefore cannot answer from
# ancestry and falls through to the content comparison — which must compare
# against the PARK's intended content (origin/main's content plus office_hours,
# recorded by park_write), not against SNAP_DIR (this writer's unlanded
# pre-park edit, which is guaranteed to differ) and not against a --prune id's
# absence (the deletion was not landed; the office_hours record is the intent).
# Both of those wrong questions answer `not-landed` on a park that IS on main,
# which land-align-round then refuses to declare a park for.
#
# Shape: writer A lands an edit; stale writers B and C each --prune the same id.
# B's prune conflicts with A's landed edit and parks (landing the office_hours
# commit). C's prune then conflicts identically and re-parks onto B's already-
# landed record — byte for byte, since the prune recommendation carries no
# per-run path.
set_mode green
sync_clone "$A"; sync_clone "$B"
W59="$WORK/w59"
make_clone "$W59" writer-59
edit_line "$A" t-park-retry 1 landed-edit
run_gc "$A" t-park-retry >/dev/null 2>&1
rm -f "$B/intentions/t-park-retry.md"
out59b="$(run_gc "$B" --prune t-park-retry 2>&1)"; rc59b=$?
snap="$(sed -n 's/.*preserved at \(.*\) for the manual merge.*/\1/p' <<<"$out59b")"
[[ -n "$snap" ]] && SNAP_DIRS_TO_CLEAN+=("$snap")
sha_after_park="$(origin_sha)"
rm -f "$W59/intentions/t-park-retry.md"
out59="$(run_gc "$W59" --prune t-park-retry 2>&1)"; rc59=$?
snap="$(sed -n 's/.*preserved at \(.*\) for the manual merge.*/\1/p' <<<"$out59")"
[[ -n "$snap" ]] && SNAP_DIRS_TO_CLEAN+=("$snap")
sha_after_retry="$(origin_sha)"
content59="$(origin_show t-park-retry 2>/dev/null)"
if [[ $rc59b -eq 1 ]] \
   && [[ $rc59 -eq 1 ]] \
   && [[ "$sha_after_retry" == "$sha_after_park" ]] \
   && grep -q 'graph-commit: verdict: parked ' <<<"$out59" \
   && ! grep -q 'graph-commit: verdict: not-landed ' <<<"$out59" \
   && [[ "$(verdict_lines "$out59")" == "1" ]] \
   && grep -q 'landed-edit' <<<"$content59" \
   && grep -q 'office_hours' <<<"$content59"; then
  ok "idempotent park retry: an already-parked byte-identical node needs no push and still reports verdict: parked (not not-landed)"
else
  no "idempotent park retry (rc_b=$rc59b rc=$rc59 sha_moved=$([[ "$sha_after_retry" == "$sha_after_park" ]] && echo no || echo yes))"; printf '%s\n' "$out59"
fi

# --- Cases 60-69: build_commit_plumbing() as a unit (GRAPH_COMMIT_WRITER) ------
# A dedicated clone whose base commit is LOCAL ONLY (never pushed), so these
# cases neither depend on nor disturb origin/main, and every other case's
# fixtures are untouched. The clone carries the whole seed tree — every other
# intentions/ node plus packages/** — which is what makes the carry-through
# assertion (case 65) meaningful rather than vacuous.
P="$WORK/wplumb"
make_clone "$P" writer-plumb
PLUMB_MSG="test: plumbing equivalence"
for pid in t-plumb-a t-plumb-b t-plumb-c t-plumb-prune t-plumb-prune2 t-plumb-res; do
  printf 'id: %s\nline1: base\nline2: base\n' "$pid" >"$P/intentions/$pid.md"
done
git -C "$P" add -A
git -C "$P" commit -qm 'plumbing fixture base'
PBASE="$(git -C "$P" rev-parse HEAD)"

plumb_reset() { git -C "$P" reset -q --hard "$PBASE" && git -C "$P" clean -qfd; }

# plumb_case <edit-ids> <prune-ids> <resurrected-ids> — space-separated lists,
# "" for none. Runs BOTH writers over the same on-disk state and records their
# trees. The plumbing writer runs FIRST precisely because it must not mutate
# anything: the working-tree writer that follows it sees the identical tree and
# index it would have seen had the plumbing writer never run.
#
# Sets: PLUMB_SHA, PLUMB_TREE, WT_TREE, PLUMB_RC, and the index/worktree
# before/after fingerprints case 66 asserts on.
plumb_case() {
  local edits="$1" prunes="$2" res="$3" i
  PLUMB_SHA=""; PLUMB_TREE=""; WT_TREE=""; PLUMB_RC=0
  PLUMB_INDEX_BEFORE="$(cksum <"$P/.git/index")"
  PLUMB_STATUS_BEFORE="$(git -C "$P" status --porcelain)"
  PLUMB_HEAD_BEFORE="$(git -C "$P" rev-parse HEAD)"
  # Sourcing graph-commit defines its functions and runs nothing (its
  # BASH_SOURCE/$0 guard), which is how the builder is reachable at all while
  # try_land() still uses the worktree writer.
  PLUMB_SHA="$(
    cd "$P" || exit 99
    # shellcheck source=/dev/null
    source "$GC_SCRIPT"
    IDS=(); PRUNE_IDS=(); RESURRECTED_IDS=()
    for i in $edits; do IDS+=("$i"); done
    for i in $prunes; do PRUNE_IDS+=("$i"); done
    for i in $res; do RESURRECTED_IDS+=("$i"); done
    ALL_IDS=("${IDS[@]}" "${PRUNE_IDS[@]}")
    CURRENT_MSG="$PLUMB_MSG"
    build_commit_plumbing HEAD
  )" || PLUMB_RC=$?
  PLUMB_INDEX_AFTER="$(cksum <"$P/.git/index")"
  PLUMB_STATUS_AFTER="$(git -C "$P" status --porcelain)"
  PLUMB_HEAD_AFTER="$(git -C "$P" rev-parse HEAD)"
  [[ $PLUMB_RC -eq 0 && -n "$PLUMB_SHA" ]] || return 1
  PLUMB_TREE="$(git -C "$P" rev-parse "$PLUMB_SHA^{tree}")"

  # The working-tree writer, mirroring commit_files() exactly: `git add` every
  # id that is not resurrected (edits AND prunes — `git add` stages a deletion
  # for a tracked file missing from the working tree), then commit.
  for i in $edits $prunes; do
    case " $res " in *" $i "*) continue ;; esac
    git -C "$P" add -- "intentions/$i.md"
  done
  git -C "$P" commit -qm "$PLUMB_MSG"
  WT_TREE="$(git -C "$P" rev-parse "HEAD^{tree}")"
}

# --- Case 60: single-node edit ------------------------------------------------
plumb_reset
echo "line3: plumb-edit-a" >>"$P/intentions/t-plumb-a.md"
if plumb_case "t-plumb-a" "" "" && [[ "$PLUMB_TREE" == "$WT_TREE" ]]; then
  ok "plumbing writer, single-node edit: same tree SHA as the working-tree writer ($PLUMB_TREE)"
else
  no "plumbing writer, single-node edit (rc=$PLUMB_RC plumb=$PLUMB_TREE worktree=$WT_TREE)"
fi

# --- Case 61: multi-node edit -------------------------------------------------
plumb_reset
echo "line3: plumb-edit-a" >>"$P/intentions/t-plumb-a.md"
echo "line3: plumb-edit-b" >>"$P/intentions/t-plumb-b.md"
echo "line3: plumb-edit-c" >>"$P/intentions/t-plumb-c.md"
if plumb_case "t-plumb-a t-plumb-b t-plumb-c" "" "" && [[ "$PLUMB_TREE" == "$WT_TREE" ]]; then
  ok "plumbing writer, multi-node edit (3 ids, one commit): same tree SHA as the working-tree writer"
else
  no "plumbing writer, multi-node edit (rc=$PLUMB_RC plumb=$PLUMB_TREE worktree=$WT_TREE)"
fi

# --- Case 62: prune -----------------------------------------------------------
plumb_reset
rm -f "$P/intentions/t-plumb-prune.md"
if plumb_case "" "t-plumb-prune" "" \
   && [[ "$PLUMB_TREE" == "$WT_TREE" ]] \
   && ! git -C "$P" cat-file -e "$PLUMB_SHA:intentions/t-plumb-prune.md" 2>/dev/null; then
  ok "plumbing writer, prune: same tree SHA as the working-tree writer, and the path is removed from the tree"
else
  no "plumbing writer, prune (rc=$PLUMB_RC plumb=$PLUMB_TREE worktree=$WT_TREE)"
fi

# --- Case 63: mixed edit + prune in one commit --------------------------------
plumb_reset
echo "line3: plumb-mixed" >>"$P/intentions/t-plumb-a.md"
echo "line3: plumb-mixed-b" >>"$P/intentions/t-plumb-b.md"
rm -f "$P/intentions/t-plumb-prune.md"
rm -f "$P/intentions/t-plumb-prune2.md"
# `git show … | grep -q` is deliberately NOT used for the content assertions in
# these cases: this suite runs under `set -o pipefail`, so a grep -q that exits
# on its first match can SIGPIPE the git show ahead of it and make the whole
# pipeline non-zero regardless of the match. In a negated assertion (cases 64
# and 68) that turns a real regression into a silent pass. Capture the blob
# into a variable first and grep the variable.
mixed_a=""
if plumb_case "t-plumb-a t-plumb-b" "t-plumb-prune t-plumb-prune2" "" \
   && [[ "$PLUMB_TREE" == "$WT_TREE" ]] \
   && ! git -C "$P" cat-file -e "$PLUMB_SHA:intentions/t-plumb-prune.md" 2>/dev/null \
   && ! git -C "$P" cat-file -e "$PLUMB_SHA:intentions/t-plumb-prune2.md" 2>/dev/null \
   && mixed_a="$(git -C "$P" show "$PLUMB_SHA:intentions/t-plumb-a.md")" \
   && grep -q 'plumb-mixed' <<<"$mixed_a"; then
  ok "plumbing writer, mixed edit + prune in one commit: same tree SHA, both prunes removed, both edits present"
else
  no "plumbing writer, mixed edit + prune (rc=$PLUMB_RC plumb=$PLUMB_TREE worktree=$WT_TREE)"
fi

# --- Case 64: RESURRECTED_IDS are excluded ------------------------------------
# The data-integrity case. park_write() re-materializes on disk a node another
# writer's ALREADY-LANDED change deleted from main; putting it in the tree would
# push a deleted node's content back onto main with no PR and no review,
# silently reverting a redaction. The on-disk file here carries content that
# must NOT reach the built commit.
plumb_reset
echo "line3: plumb-edit-a" >>"$P/intentions/t-plumb-a.md"
echo "line3: RESURRECTED-MUST-NOT-LAND" >>"$P/intentions/t-plumb-res.md"
res_body=""
if plumb_case "t-plumb-a t-plumb-res" "" "t-plumb-res" \
   && [[ "$PLUMB_TREE" == "$WT_TREE" ]] \
   && res_body="$(git -C "$P" show "$PLUMB_SHA:intentions/t-plumb-res.md")" \
   && [[ -n "$res_body" ]] \
   && ! grep -q 'RESURRECTED-MUST-NOT-LAND' <<<"$res_body" \
   && [[ "$(git -C "$P" rev-parse "$PLUMB_SHA:intentions/t-plumb-res.md")" \
       == "$(git -C "$P" rev-parse "$PBASE:intentions/t-plumb-res.md")" ]]; then
  ok "plumbing writer, RESURRECTED_IDS: the resurrected node is excluded from the tree and still carries base content (a landed deletion is not reverted)"
else
  no "plumbing writer, RESURRECTED_IDS exclusion (rc=$PLUMB_RC plumb=$PLUMB_TREE worktree=$WT_TREE)"
fi

# --- Case 65: unrelated paths carried through untouched -----------------------
plumb_reset
echo "line3: plumb-carry" >>"$P/intentions/t-plumb-a.md"
rm -f "$P/intentions/t-plumb-prune.md"
if plumb_case "t-plumb-a" "t-plumb-prune" ""; then
  changed="$(git -C "$P" diff --name-only "$PBASE" "$PLUMB_SHA" | sort | tr '\n' ' ')"
  base_entries="$(git -C "$P" ls-tree -r --name-only "$PBASE" | wc -l | tr -d ' ')"
  new_entries="$(git -C "$P" ls-tree -r --name-only "$PLUMB_SHA" | wc -l | tr -d ' ')"
  if [[ "$changed" == "intentions/t-plumb-a.md intentions/t-plumb-prune.md " ]] \
     && [[ "$new_entries" -eq $((base_entries - 1)) ]] \
     && [[ "$base_entries" -gt 10 ]]; then
    ok "plumbing writer carries every unrelated path through from the base commit ($base_entries base entries, exactly the 2 named paths differ)"
  else
    no "plumbing writer carry-through (changed='$changed' base=$base_entries new=$new_entries)"
  fi
else
  no "plumbing writer carry-through: build failed (rc=$PLUMB_RC)"
fi

# --- Case 66: neither the working tree nor the repo's own index is touched ----
# Fingerprints captured by plumb_case around the builder call only — the
# working-tree writer runs after them.
if [[ "$PLUMB_INDEX_BEFORE" == "$PLUMB_INDEX_AFTER" ]] \
   && [[ "$PLUMB_STATUS_BEFORE" == "$PLUMB_STATUS_AFTER" ]] \
   && [[ "$PLUMB_HEAD_BEFORE" == "$PLUMB_HEAD_AFTER" ]]; then
  ok "plumbing writer touches neither the repo's .git/index nor the working tree, and moves no ref"
else
  no "plumbing writer mutated the checkout (index '$PLUMB_INDEX_BEFORE'->'$PLUMB_INDEX_AFTER', head $PLUMB_HEAD_BEFORE->$PLUMB_HEAD_AFTER)"
fi

# --- Case 67: GRAPH_COMMIT_WRITER gating --------------------------------------
# The default must be byte-for-byte today's behavior, and the opt-in must never
# silently downgrade to the writer the caller did not ask for.
set_mode green
sync_clone "$A"
edit_line "$A" t-plumb-cli 1 default-writer
out="$(run_gc "$A" -m 'test: writer default' t-plumb-cli 2>&1)"; rc=$?
if [[ $rc -eq 0 ]] && origin_show t-plumb-cli | grep -q 'line1: default-writer'; then
  ok "GRAPH_COMMIT_WRITER unset: the CLI lands exactly as before"
else
  no "GRAPH_COMMIT_WRITER unset (rc=$rc)"; printf '%s\n' "$out"
fi

sync_clone "$A"
edit_line "$A" t-plumb-cli 2 explicit-worktree
export GRAPH_COMMIT_WRITER=worktree
out="$(run_gc "$A" -m 'test: writer explicit worktree' t-plumb-cli 2>&1)"; rc=$?
unset GRAPH_COMMIT_WRITER
if [[ $rc -eq 0 ]] && origin_show t-plumb-cli | grep -q 'line2: explicit-worktree'; then
  ok "GRAPH_COMMIT_WRITER=worktree: identical to the default, lands"
else
  no "GRAPH_COMMIT_WRITER=worktree (rc=$rc)"; printf '%s\n' "$out"
fi

sync_clone "$A"
edit_line "$A" t-plumb-cli 3 plumbing-writer
head_before="$(git -C "$A" rev-parse HEAD)"
export GRAPH_COMMIT_WRITER=plumbing
out="$(run_gc "$A" -m 'test: writer plumbing' t-plumb-cli 2>&1)"; rc=$?
unset GRAPH_COMMIT_WRITER
# HEAD unmoved is the load-bearing half: the plumbing writer makes NO local
# commit, so the checkout it was pointed at is exactly where it started even
# though the content reached main.
if [[ $rc -eq 0 ]] && origin_show t-plumb-cli | grep -q 'line3: plumbing-writer' \
   && [[ "$(git -C "$A" rev-parse HEAD)" == "$head_before" ]]; then
  ok "GRAPH_COMMIT_WRITER=plumbing lands the same content and never moves the checkout's HEAD"
else
  no "GRAPH_COMMIT_WRITER=plumbing landing (rc=$rc head $head_before -> $(git -C "$A" rev-parse HEAD))"; printf '%s\n' "$out"
fi

before="$(origin_sha)"
export GRAPH_COMMIT_WRITER=bogus
out="$(run_gc "$A" -m 'test: writer bogus' t-plumb-cli 2>&1)"; rc=$?
unset GRAPH_COMMIT_WRITER
if [[ $rc -ne 0 ]] && grep -q "must be 'worktree' or 'plumbing'" <<<"$out" \
   && [[ "$(origin_sha)" == "$before" ]]; then
  ok "GRAPH_COMMIT_WRITER with an unknown value is refused; origin/main untouched"
else
  no "GRAPH_COMMIT_WRITER unknown-value refusal (rc=$rc)"; printf '%s\n' "$out"
fi
sync_clone "$A"

# --- Case 67b: the PLUMBING writer stamps the caller's Graph-Writer trailer ---
# Case 7b in test-graph-write-rollback.sh closes this loop for the WORKTREE
# writer only. The trailer is the input lib-graph-rollback.sh's ownership
# classifier reads, so a plumbing landing that stamped nothing would be read as
# `foreign` by its own writer's rollback and fail closed — and
# dispatch-eval-finding is a live GRAPH_COMMIT_WRITER=plumbing caller, so the
# path is not hypothetical. Read with git's own `%(trailers:key=…)` parser, the
# same one _graph_commit_writer uses.
edit_line "$A" t-plumb-cli 3 plumbing-trailer
export GRAPH_COMMIT_WRITER=plumbing GRAPH_WRITER=test-plumbing-caller
out="$(run_gc "$A" -m 'test: writer plumbing trailer' t-plumb-cli 2>&1)"; rc=$?
unset GRAPH_COMMIT_WRITER GRAPH_WRITER
trailer67b="$(git -C "$ORIGIN" log -1 --format='%(trailers:key=Graph-Writer,valueonly)' main | head -n1 | tr -d '[:space:]')"
subject67b="$(git -C "$ORIGIN" log -1 --format=%s main)"
if [[ $rc -eq 0 ]] && origin_show t-plumb-cli | grep -q 'line3: plumbing-trailer' \
   && [[ "$trailer67b" == "test-plumbing-caller" ]] \
   && [[ "$subject67b" == 'test: writer plumbing trailer' ]]; then
  ok "GRAPH_COMMIT_WRITER=plumbing stamps the caller's Graph-Writer trailer, and the SUBJECT is unchanged by it"
else
  no "plumbing writer trailer (rc=$rc trailer='$trailer67b' subject='$subject67b')"; printf '%s\n' "$out"
fi
sync_clone "$A"

# --- Case 67c: a malformed GRAPH_WRITER is refused before anything is written -
# A trailer that spans lines is not a trailer: git's parser would not read the
# label back, so the commit's attribution would be silently unreadable to the
# rollback classifier — the fail-closed case that strands a writer's own work.
# graph-commit refuses at startup instead, and nothing reaches origin/main.
before67c="$(origin_sha)"
edit_line "$A" t-plumb-cli 1 malformed-writer-label
export GRAPH_WRITER='two
lines'
out="$(run_gc "$A" -m 'test: malformed writer label' t-plumb-cli 2>&1)"; rc=$?
unset GRAPH_WRITER
if [[ $rc -eq 2 ]] && grep -q 'is not a usable writer label' <<<"$out" \
   && [[ "$(origin_sha)" == "$before67c" ]]; then
  ok "a malformed GRAPH_WRITER is refused with exit 2 and nothing reaches origin/main"
else
  no "malformed GRAPH_WRITER refusal (rc=$rc origin moved: $before67c -> $(origin_sha))"; printf '%s\n' "$out"
fi
sync_clone "$A"

# --- Case 68: the builder builds against the BASE it is handed ----------------
# Not against HEAD, not against the index. An older base is handed in while the
# checkout's HEAD carries a newer commit; the built commit must carry the OLD
# base's content for every path it does not name, and parent the OLD base.
plumb_reset
echo "line3: newer-head-content" >>"$P/intentions/t-plumb-b.md"
git -C "$P" add -A
git -C "$P" commit -qm 'plumbing fixture: a newer HEAD commit'
echo "line3: plumb-old-base" >>"$P/intentions/t-plumb-a.md"
old_base_sha="$(
  cd "$P" || exit 99
  # shellcheck source=/dev/null
  source "$GC_SCRIPT"
  IDS=(t-plumb-a); PRUNE_IDS=(); RESURRECTED_IDS=()
  ALL_IDS=("${IDS[@]}")
  CURRENT_MSG="$PLUMB_MSG"
  build_commit_plumbing "$PBASE"
)"; rc=$?
old_a=""; old_b=""
if [[ $rc -eq 0 ]] \
   && [[ "$(git -C "$P" rev-parse "$old_base_sha^")" == "$PBASE" ]] \
   && old_a="$(git -C "$P" show "$old_base_sha:intentions/t-plumb-a.md")" \
   && old_b="$(git -C "$P" show "$old_base_sha:intentions/t-plumb-b.md")" \
   && grep -q 'plumb-old-base' <<<"$old_a" \
   && [[ -n "$old_b" ]] \
   && ! grep -q 'newer-head-content' <<<"$old_b"; then
  ok "plumbing writer builds against the base commit it is handed, not HEAD (parent is the given base; unnamed paths carry the base's content)"
else
  no "plumbing writer base fidelity (rc=$rc sha=$old_base_sha)"
fi
plumb_reset

# --- Case 69: a --prune id absent from the base commit is refused -------------
# The one place the plumbing writer is deliberately STRICTER than `git add`:
# `git update-index --force-remove` silently succeeds on a path the base tree
# does not carry, where `git add -- <path>` rejects the unmatched pathspec. The
# builder must die rather than emit a commit that pruned nothing — and it must
# not leave its throwaway index dir behind when it does.
absent_sha="$(
  {
    cd "$P" || exit 99
    # shellcheck source=/dev/null
    source "$GC_SCRIPT"
    IDS=(); PRUNE_IDS=(t-plumb-absent); RESURRECTED_IDS=()
    ALL_IDS=("${PRUNE_IDS[@]}")
    CURRENT_MSG="$PLUMB_MSG"
    build_commit_plumbing HEAD
  } 2>"$WORK/plumb-absent.err"
)"; rc=$?
absent_head="$(git -C "$P" rev-parse HEAD)"
if [[ $rc -ne 0 ]] && [[ -z "$absent_sha" ]] \
   && grep -q 'names a path absent from base commit' "$WORK/plumb-absent.err" \
   && [[ "$absent_head" == "$(git -C "$P" rev-parse HEAD)" ]]; then
  ok "plumbing writer refuses a --prune id absent from the base commit instead of emitting a no-op commit"
else
  no "plumbing writer absent-prune refusal (rc=$rc sha=$absent_sha)"; cat "$WORK/plumb-absent.err"
fi
plumb_reset

# ---------------------------------------------------------------------------
# Cases 70-75: GRAPH_COMMIT_WRITER=plumbing driven through the CLI
# ---------------------------------------------------------------------------

# --- Case 70: an unrelated dirty tracked file blocks worktree, not plumbing ----
# The finding this wiring dissolves. Case 24 above already pins the worktree
# writer's refusal on its own fixture; the first half here re-states it on the
# SAME dirty checkout the second half then lands from, so the two answers are
# about one state rather than two.
set_mode green
WPD="$WORK/wplumbdirty"
make_clone "$WPD" writer-plumb-dirty
edit_line "$WPD" t-plumb-dirty 1 plumbing-with-dirt
echo "unrelated local change" >>"$WPD/packages/intentionsutil/src/store.js"

before="$(origin_sha)"
out="$(run_gc "$WPD" -m 'test: dirty tree, worktree writer' t-plumb-dirty 2>&1)"; rc=$?
if [[ $rc -ne 0 ]] && grep -q 'unrelated dirty tracked file' <<<"$out" \
   && [[ "$(origin_sha)" == "$before" ]]; then
  ok "unrelated dirty tracked file still refuses the WORKTREE writer (its rebase cannot run on it); origin/main untouched"
else
  no "worktree writer dirty-tree refusal (rc=$rc)"; printf '%s\n' "$out"
fi

export GRAPH_COMMIT_WRITER=plumbing
out="$(run_gc "$WPD" -m 'test: dirty tree, plumbing writer' t-plumb-dirty 2>&1)"; rc=$?
unset GRAPH_COMMIT_WRITER
dirt_survived=0
grep -q 'unrelated local change' "$WPD/packages/intentionsutil/src/store.js" && dirt_survived=1
if [[ $rc -eq 0 ]] && origin_show t-plumb-dirty | grep -q 'line1: plumbing-with-dirt' \
   && [[ "$dirt_survived" -eq 1 ]]; then
  ok "the SAME unrelated dirty tracked file does NOT block the plumbing writer, and the dirt survives the landing untouched"
else
  no "plumbing writer over a dirty tree (rc=$rc dirt_survived=$dirt_survived)"; printf '%s\n' "$out"
fi

# --- Case 71: same-node concurrent edit, disjoint fields -> layer-2 merge -------
# There is no rebase here to produce a conflict, so a blind rebuild would stamp
# this writer's on-disk content over the peer's landed edit and exit 0. The blob
# comparison between bases is what catches it, and run_merge_node is what
# reconciles it — the same primitive the rebase path calls.
set_mode green
sync_clone "$A"                       # B stays stale at the pre-edit commit
sync_clone "$B"
edit_line "$A" t-plumb-race 1 A-top
run_gc "$A" -m 'test: plumb race, peer lands first' t-plumb-race >/dev/null 2>&1; rcA=$?
edit_line "$B" t-plumb-race 12 B-bottom
export GRAPH_COMMIT_WRITER=plumbing
out="$(run_gc "$B" -m 'test: plumb race, plumbing writer' t-plumb-race 2>&1)"; rcB=$?
unset GRAPH_COMMIT_WRITER
content="$(origin_show t-plumb-race)"
if [[ $rcA -eq 0 && $rcB -eq 0 ]] \
   && grep -q 'line1: A-top' <<<"$content" \
   && grep -q 'line12: B-bottom' <<<"$content"; then
  ok "plumbing writer: a same-node concurrent edit is field-merged, not overwritten — both writers' edits are on main"
else
  no "plumbing same-node auto-merge (rcA=$rcA rcB=$rcB)"; printf '%s\n' "$out"; printf '%s\n' "$content"
fi

# --- Cases 72-73: same-node concurrent edit the merge CANNOT resolve -----------
# Overlapping edits to the SAME field. The plumbing path must reach the same
# fail-closed park the worktree path reaches through a rebase conflict — and,
# unlike that path, must do so without resetting the whole tree out from under
# the caller's unrelated dirt.
set_mode green
sync_clone "$A"; sync_clone "$B"
edit_line "$A" t-plumb-race-conflict 1 A-wins
run_gc "$A" -m 'test: plumb conflict, peer lands first' t-plumb-race-conflict >/dev/null 2>&1
edit_line "$B" t-plumb-race-conflict 1 B-loses
echo "unrelated local change during a park" >>"$B/packages/intentionsutil/src/store.js"
export GRAPH_COMMIT_WRITER=plumbing
out="$(run_gc "$B" -m 'test: plumb conflict, plumbing writer' t-plumb-race-conflict 2>&1)"; rc=$?
unset GRAPH_COMMIT_WRITER
content="$(origin_show t-plumb-race-conflict)"
snap="$(sed -n 's/.*preserved at \(.*\) for the manual merge.*/\1/p' <<<"$out")"
[[ -n "$snap" ]] && SNAP_DIRS_TO_CLEAN+=("$snap")
if [[ $rc -eq 1 ]] \
   && grep -q 'concurrent-edit conflict' <<<"$out" \
   && grep -q 'line1: A-wins' <<<"$content" \
   && ! grep -q '^line1: B-loses' <<<"$content" \
   && grep -q 'office_hours' <<<"$content" \
   && [[ -n "$snap" && -f "$snap/t-plumb-race-conflict.md" ]] \
   && grep -q 'B-loses' "$snap/t-plumb-race-conflict.md"; then
  ok "plumbing writer: an unresolvable same-node concurrent edit parks — peer's content stands on main, office_hours landed, loser's content preserved"
else
  no "plumbing unresolvable same-node park (rc=$rc snap='$snap')"; printf '%s\n' "$out"; printf '%s\n' "$content"
fi

if grep -q 'unrelated local change during a park' "$B/packages/intentionsutil/src/store.js"; then
  ok "the park path's re-sync is path-scoped for the plumbing writer: the checkout's unrelated dirt survived the park"
else
  no "plumbing park destroyed the checkout's unrelated dirty file"
fi
git -C "$B" checkout -- packages/intentionsutil/src/store.js
sync_clone "$B"

# --- Case 74: a clean checkout merely BEHIND origin/main is still a no-op ------
# The no-op short-circuit's HEAD == origin/main test is the wrong question for
# this writer — it builds from the ON-DISK content onto origin/main, so what
# decides whether anything can land is whether that content is already there.
# Without the widened arm this run would build a commit whose tree equals its
# parent's and push that empty no-op onto main.
set_mode green
sync_clone "$B"
sync_clone "$A"
edit_line "$A" t-plumb-cli 4 advance-main-past-B
run_gc "$A" -m 'test: advance main past B' t-plumb-cli >/dev/null 2>&1
before="$(origin_sha)"
calls_before="$(gh_calls)"
export GRAPH_COMMIT_WRITER=plumbing
out="$(run_gc "$B" -m 'test: plumbing no-op behind main' t-plumb-noop 2>&1)"; rc=$?
unset GRAPH_COMMIT_WRITER
if [[ $rc -eq 0 ]] && grep -q 'no new changes to stage' <<<"$out" \
   && [[ "$(origin_sha)" == "$before" ]] \
   && [[ "$(gh_calls)" == "$calls_before" ]]; then
  ok "plumbing writer: a clean checkout BEHIND origin/main whose content already matches is a no-op — no empty commit pushed, no stamp cycle bought"
else
  no "plumbing no-op behind main (rc=$rc origin moved: $before -> $(origin_sha))"; printf '%s\n' "$out"
fi
sync_clone "$B"

# --- Case 75: plumbing + a STALE --base (the ledger's own update shape) --------
# dispatch-eval-finding — the one caller that opts into this writer — passes
# --base on every update, so the layer-3 stale-base reconciliation and the
# plumbing rebuild must compose. Layer 3 merges the writer's edit against
# origin/main ON DISK; the plumbing writer then reconciles that same node
# against its own base and builds. Both edits must reach main.
set_mode green
WPB="$WORK/wplumbbase"
make_clone "$WPB" writer-plumb-base
pb_stale_sha="$(git -C "$WPB" hash-object intentions/t-plumb-base.md)"
OTHERPB="$WORK/other-plumb-base"
make_clone "$OTHERPB" other-plumb-base
echo "line16: concurrent edit" >>"$OTHERPB/intentions/t-plumb-base.md"
git -C "$OTHERPB" commit -qam 'concurrent edit to t-plumb-base'
git -C "$OTHERPB" push -q origin main
echo "line15: plumbing writer edit (based on a stale read)" >>"$WPB/intentions/t-plumb-base.md"
export GRAPH_COMMIT_WRITER=plumbing
out="$(run_gc "$WPB" -m 'test: plumbing + stale base' --base "t-plumb-base=$pb_stale_sha" t-plumb-base 2>&1)"; rc=$?
unset GRAPH_COMMIT_WRITER
content="$(origin_show t-plumb-base 2>/dev/null)"
if [[ $rc -eq 0 ]] \
   && grep -q 'line15: plumbing writer edit (based on a stale read)' <<<"$content" \
   && grep -q 'line16: concurrent edit' <<<"$content"; then
  ok "plumbing writer composes with a stale --base: layer 3 reconciles on disk, the rebuild lands both edits"
else
  no "plumbing + stale --base (rc=$rc)"; printf '%s\n' "$out"; printf '%s\n' "$content"
fi

# --- Case 76: rebuilding against the SAME base, content and message yields ----
# the SAME commit SHA ----------------------------------------------------------
# The date-pinning fix under test: build_commit_plumbing() now pins
# GIT_AUTHOR_DATE/GIT_COMMITTER_DATE to the base commit's own committer date
# instead of letting git stamp the wall clock. With no pin, two builds a
# moment apart would mint two different commit SHAs even though base, tree
# and message are byte-identical — which is what turns a checks-timeout retry
# into a full CI restart instead of a re-push of the already-running commit.
# Two builder calls back to back, same base/content/message, must collapse to
# one SHA.
plumb_reset
echo "line3: plumb-stable" >>"$P/intentions/t-plumb-a.md"
stable_sha_1="$(
  cd "$P" || exit 99
  # shellcheck source=/dev/null
  source "$GC_SCRIPT"
  IDS=(t-plumb-a); PRUNE_IDS=(); RESURRECTED_IDS=()
  ALL_IDS=("${IDS[@]}")
  CURRENT_MSG="$PLUMB_MSG"
  build_commit_plumbing "$PBASE"
)"; rc1=$?
stable_sha_2="$(
  cd "$P" || exit 99
  # shellcheck source=/dev/null
  source "$GC_SCRIPT"
  IDS=(t-plumb-a); PRUNE_IDS=(); RESURRECTED_IDS=()
  ALL_IDS=("${IDS[@]}")
  CURRENT_MSG="$PLUMB_MSG"
  build_commit_plumbing "$PBASE"
)"; rc2=$?
if [[ $rc1 -eq 0 && $rc2 -eq 0 && -n "$stable_sha_1" ]] \
   && [[ "$stable_sha_1" == "$stable_sha_2" ]]; then
  ok "plumbing writer: rebuilding against the same base with the same content and message yields the same commit SHA ($stable_sha_1) — a checks-timeout retry re-pushes the identical commit instead of restarting CI"
else
  no "plumbing writer SHA stability (rc1=$rc1 rc2=$rc2 sha1=$stable_sha_1 sha2=$stable_sha_2)"
fi
plumb_reset

# --- Case 77: rebuilding against a DIFFERENT base yields a DIFFERENT SHA ------
# even with identical content and message. The base commit is the built
# commit's parent, so it is always part of the commit object regardless of
# date pinning — the pin collapses only SAME-base rebuilds, not every rebuild.
echo "line3: plumb-diffbase" >>"$P/intentions/t-plumb-a.md"
diffbase_sha_1="$(
  cd "$P" || exit 99
  # shellcheck source=/dev/null
  source "$GC_SCRIPT"
  IDS=(t-plumb-a); PRUNE_IDS=(); RESURRECTED_IDS=()
  ALL_IDS=("${IDS[@]}")
  CURRENT_MSG="$PLUMB_MSG"
  build_commit_plumbing "$PBASE"
)"; rc1=$?
# A second, distinct base: PBASE plus one unrelated committed change (the
# on-disk edit from just above, committed here rather than left staged).
git -C "$P" commit -qam 'plumbing fixture: a second distinct base'
second_base="$(git -C "$P" rev-parse HEAD)"
diffbase_sha_2="$(
  cd "$P" || exit 99
  # shellcheck source=/dev/null
  source "$GC_SCRIPT"
  IDS=(t-plumb-a); PRUNE_IDS=(); RESURRECTED_IDS=()
  ALL_IDS=("${IDS[@]}")
  CURRENT_MSG="$PLUMB_MSG"
  build_commit_plumbing "$second_base"
)"; rc2=$?
if [[ $rc1 -eq 0 && $rc2 -eq 0 && -n "$diffbase_sha_1" && -n "$diffbase_sha_2" ]] \
   && [[ "$diffbase_sha_1" != "$diffbase_sha_2" ]] \
   && [[ "$(git -C "$P" rev-parse "$diffbase_sha_1^")" == "$PBASE" ]] \
   && [[ "$(git -C "$P" rev-parse "$diffbase_sha_2^")" == "$second_base" ]]; then
  ok "plumbing writer: rebuilding against a different base yields a different commit SHA, even with identical content and message"
else
  no "plumbing writer base-sensitivity (rc1=$rc1 rc2=$rc2 sha1=$diffbase_sha_1 sha2=$diffbase_sha_2 base2=$second_base)"
fi
plumb_reset

# --- Cases 78-79: the no-op integrity guard (assert_noop_matches_intent) ------
# The invariant: `noop` is never reported for a run whose INTENDED content is
# not what origin/main carries
# (tactic-eval-finding-noop-verdict-hides-dropped-node-edit).

# --- Case 78: far-ahead + an edit to an existing node is never a `noop` -------
# The shape the incident was filed on, end to end. A far-ahead worktree's
# rebuild runs `git reset --hard "$MAIN_SHA"`, after which HEAD and origin/main
# hold the SAME blob for every id — so every repository-vs-repository guard on
# the no-op path (the nothing-staged wrong-repo die, the HEAD == origin/main
# short-circuit) is satisfied by construction and cannot notice a dropped edit.
# This pins the outcome that must never regress: the edit LANDS, and in no case
# does the run report `verdict: landed … context=noop`.
set_mode green
W78="$WORK/w78"
make_clone "$W78" writer-78
mkdir -p "$W78/src"
echo "console.log('pr feature code, no-op guard')" >"$W78/src/noop-guard-feature.js"
git -C "$W78" add src/noop-guard-feature.js
git -C "$W78" commit -qm 'pr: non-intentions code change (no-op guard)'
n78_tip="$(git -C "$W78" rev-parse HEAD)"
edit_line "$W78" t-noop-guard 1 noop-guard-edit
out="$(run_gc "$W78" -m 'test: far-ahead edit is not a no-op' t-noop-guard 2>&1)"; rc=$?
landed78="$(origin_show t-noop-guard 2>/dev/null || true)"
restored78="$(git -C "$W78" rev-parse HEAD)"
if [[ $rc -eq 0 ]] \
   && grep -q 'line1: noop-guard-edit' <<<"$landed78" \
   && ! grep -q 'verdict: landed.*context=noop' <<<"$out" \
   && [[ "$restored78" == "$n78_tip" ]]; then
  ok "far-ahead + an edit to an existing node lands and is never reported as a no-op"
else
  no "far-ahead no-op guard, end to end (rc=$rc restored78=$restored78 tip=$n78_tip)"; printf '%s\n' "$out"; printf '%s\n' "$landed78"
fi

# --- Case 79: the guard as a unit --------------------------------------------
# Sourced and called directly, in the idiom cases 60-69 use, because no CLI path
# currently REACHES a mismatch: the far-ahead replay re-materializes every id
# from SNAP_DIR before the no-op test runs, so intent and origin/main agree
# whenever the tree reads clean. That is what an assertion is for — the case
# pins the behavior for the day some path stops maintaining the invariant, which
# is precisely how the incident happened.
#
# Four arms, because the guard has to be right in both directions:
#   (a) intent byte-identical to origin/main → proceeds silently (a genuine
#       no-op must not be turned into a failure);
#   (b) intent differing → dies, naming the id, the preserved snapshot dir and
#       the --base entry, and reports `verdict: not-landed` — never `landed`;
#   (c) a RESOLVED merge's <id>.merged.md matching origin/main → proceeds, even
#       though the frozen pre-merge original differs. This is the shape of the
#       "far-ahead + stale --base: layer-3 merge survives the far-ahead rebuild"
#       case above (a merge concluding this writer's whole delta is already on
#       main) — named here rather than numbered, since that case's ordinal has
#       already drifted once under a PR body's citation (PR #2990) — and
#       proves the comparison reads snap_intended_file();
#   (d) the mirror of (c) — frozen original matching while the merge output does
#       NOT — still dies, so the preference is "the merge output wins", not
#       "either file will do".
W79="$WORK/w79"
make_clone "$W79" writer-79
GUARD_ID=t-noop-unit
guard_main_content="$(git -C "$W79" show "origin/main:intentions/$GUARD_ID.md")"
guard_base_sha="$(git -C "$W79" rev-parse "origin/main:intentions/$GUARD_ID.md")"
GUARD_RC=0; GUARD_OUT=""
run_guard() { # <snap-dir> [--base sha] — plant SNAP_DIR, call the guard
  GUARD_RC=0
  GUARD_OUT="$(
    (
      cd "$W79" || exit 99
      # shellcheck source=/dev/null
      source "$GC_SCRIPT"
      IDS=("$GUARD_ID"); PRUNE_IDS=(); RESURRECTED_IDS=(); ALL_IDS=("$GUARD_ID")
      SNAP_DIR="$1"
      # print_verdict()'s "was a write attempted" boundary: set, so die() reports
      # the real content-compared verdict instead of the cheap `refused`.
      SNAPSHOT_TAKEN=1
      MAIN_SHA="$(git rev-parse origin/main)"
      if [[ -n "${2:-}" ]]; then BASE["$GUARD_ID"]="$2"; fi
      assert_noop_matches_intent
    ) 2>&1
  )" || GUARD_RC=$?
}
guard_snap() { # <name> <id.md content> [<id.merged.md content>]
  local d="$WORK/snap-$1"
  mkdir -p "$d"
  printf '%s\n' "$2" >"$d/$GUARD_ID.md"
  [[ $# -ge 3 ]] && printf '%s\n' "$3" >"$d/$GUARD_ID.merged.md"
  printf '%s' "$d"
}
guard_equal="$(guard_snap equal "$guard_main_content")"
guard_diff="$(guard_snap diff "$guard_main_content"$'\n'"line13: dropped-edit")"
guard_merged="$(guard_snap merged "$guard_main_content"$'\n'"line13: pre-merge" "$guard_main_content")"
guard_merged_bad="$(guard_snap mergedbad "$guard_main_content" "$guard_main_content"$'\n'"line13: unlanded-merge")"

run_guard "$guard_equal"; a_rc=$GUARD_RC; a_out="$GUARD_OUT"
run_guard "$guard_diff" "$guard_base_sha"; b_rc=$GUARD_RC; b_out="$GUARD_OUT"
run_guard "$guard_merged"; c_rc=$GUARD_RC; c_out="$GUARD_OUT"
run_guard "$guard_merged_bad"; d_rc=$GUARD_RC; d_out="$GUARD_OUT"
if [[ $a_rc -eq 0 && -z "$a_out" ]] \
   && [[ $b_rc -ne 0 ]] \
   && grep -q "intentions/$GUARD_ID.md" <<<"$b_out" \
   && grep -q "Refusing to emit a false 'landed'" <<<"$b_out" \
   && grep -q "preserved at $guard_diff" <<<"$b_out" \
   && grep -q -- "--base $GUARD_ID=$guard_base_sha" <<<"$b_out" \
   && grep -q 'verdict: not-landed' <<<"$b_out" \
   && ! grep -q 'verdict: landed' <<<"$b_out" \
   && [[ $c_rc -eq 0 ]] \
   && [[ $d_rc -ne 0 ]]; then
  ok "no-op integrity guard: equal intent proceeds, differing intent dies not-landed naming the snapshot and --base, and the comparison reads the merged file"
else
  no "no-op integrity guard as a unit (a_rc=$a_rc b_rc=$b_rc c_rc=$c_rc d_rc=$d_rc)"; printf 'A: %s\nB: %s\nC: %s\nD: %s\n' "$a_out" "$b_out" "$c_out" "$d_out"
fi

# ---------------------------------------------------------------------------
# Cases 80-83: tactic-graph-commit-merge-npx-park-storm, Unit 3 — regression
# coverage for run_merge_node()'s launch-failure discriminator (Unit 2). The
# property under test: an UNRUNNABLE merge tool must die with no park and no
# push, while a REAL content divergence must still park exactly as before —
# the anti-overcorrection guard. GC_MERGE_NODE_UNRUNNABLE (see the node shim
# above) models the tool never starting: stderr only, no stdout, exit 1 (not
# 127 — the real-world ERR_MODULE_NOT_FOUND rc, deliberately not a
# recognizable "missing binary" code, so a naive rc==127 check could not have
# caught the bug this guards).
# ---------------------------------------------------------------------------

# --- Case 80: layer-3 stale --base, merge tool unrunnable -> die, no park ----
# check_base_freshness() call site. A concurrent writer lands a same-field
# edit after W80 read its --base blob, so check_base_freshness() would
# normally hand the divergence to run_merge_node(). With the tool unrunnable,
# the run must die with a clear environment error and write NOTHING to
# origin/main — not even an office_hours park.
set_mode green
W80="$WORK/w80"
make_clone "$W80" writer-80
base80_sha="$(git -C "$W80" hash-object intentions/t-merge-unrunnable-base.md)"
edit_field "$W80" t-merge-unrunnable-base sentinel writer80-value

OTHER80="$WORK/other80"
make_clone "$OTHER80" other80
edit_field "$OTHER80" t-merge-unrunnable-base sentinel concurrent80-value
git -C "$OTHER80" commit -qam 'concurrent same-field edit (unrunnable merge tool, layer 3)'
git -C "$OTHER80" push -q origin main

before80="$(origin_sha)"
out="$(export GC_MERGE_NODE_UNRUNNABLE=1
       run_gc "$W80" -m 'test: layer-3 unrunnable merge tool' \
         --base "t-merge-unrunnable-base=$base80_sha" t-merge-unrunnable-base 2>&1)"; rc=$?
content="$(origin_show t-merge-unrunnable-base 2>/dev/null)"
after80="$(origin_sha)"
if [[ $rc -eq 1 ]] \
   && grep -q "could not be executed for 't-merge-unrunnable-base'" <<<"$out" \
   && grep -q 'NO office_hours park was written and NOTHING was pushed' <<<"$out" \
   && grep -q "ERR_MODULE_NOT_FOUND" <<<"$out" \
   && [[ "$after80" == "$before80" ]] \
   && ! grep -q 'office_hours' <<<"$content" \
   && grep -q 'sentinel: concurrent80-value' <<<"$content"; then
  ok "layer-3 stale --base, merge tool unrunnable: dies with a clear environment error, no office_hours park, origin/main untouched"
else
  no "layer-3 unrunnable merge tool (rc=$rc before80=$before80 after80=$after80)"; printf '%s
' "$out"; printf '%s
' "$content"
fi

# --- Case 81: far-ahead rebuild, merge tool unrunnable -> die, HEAD restored, snapshot kept ---
# replay_snapshot_onto_base() call site (via ensure_intentions_only_base()).
# W81 is far-ahead (a non-intentions commit on HEAD, like the "far-ahead +
# stale --base" and "far-ahead race, same field" cases above) racing a
# concurrent same-field landing, so the far-ahead rebuild's three-way replay
# would normally call run_merge_node(). With the tool unrunnable: die, no
# park, cleanup()'s RESTORE_HEAD still returns the checkout to its PR tip, and
# the writer's only surviving copy of its edit — SNAP_DIR, named in the die
# message — must survive the exit (KEEP_SNAP=1).
set_mode green
W81="$WORK/w81"
make_clone "$W81" writer-81
mkdir -p "$W81/src"
echo "console.log('pr feature code, far-ahead unrunnable merge tool')" >"$W81/src/farahead-unrunnable-feature.js"
git -C "$W81" add src/farahead-unrunnable-feature.js
git -C "$W81" commit -qm 'pr: non-intentions code change (far-ahead, unrunnable merge tool)'
fu_tip="$(git -C "$W81" rev-parse HEAD)"
edit_field "$W81" t-merge-unrunnable-farahead sentinel writer81-value

OTHER81="$WORK/other81"
make_clone "$OTHER81" other81
edit_field "$OTHER81" t-merge-unrunnable-farahead sentinel concurrent81-value
git -C "$OTHER81" commit -qam 'concurrent same-field edit (far-ahead, unrunnable merge tool)'
git -C "$OTHER81" push -q origin main

before81="$(origin_sha)"
out="$(export GC_MERGE_NODE_UNRUNNABLE=1
       run_gc "$W81" -m 'test: far-ahead unrunnable merge tool' t-merge-unrunnable-farahead 2>&1)"; rc=$?
content="$(origin_show t-merge-unrunnable-farahead 2>/dev/null)"
after81="$(origin_sha)"
restored81="$(git -C "$W81" rev-parse HEAD)"
snap="$(sed -n 's/.*preserved at \([^ ]*\)\..*/\1/p' <<<"$out")"
[[ -n "$snap" ]] && SNAP_DIRS_TO_CLEAN+=("$snap")
if [[ $rc -eq 1 ]] \
   && grep -q "could not be executed for 't-merge-unrunnable-farahead'" <<<"$out" \
   && grep -q 'NO office_hours park was written and NOTHING was pushed' <<<"$out" \
   && [[ "$after81" == "$before81" ]] \
   && ! grep -q 'office_hours' <<<"$content" \
   && grep -q 'sentinel: concurrent81-value' <<<"$content" \
   && [[ "$restored81" == "$fu_tip" ]] \
   && [[ -n "$snap" && -f "$snap/t-merge-unrunnable-farahead.md" ]] \
   && grep -q 'writer81-value' "$snap/t-merge-unrunnable-farahead.md"; then
  ok "far-ahead rebuild, merge tool unrunnable: dies, no park, HEAD restored to the PR tip, writer's snapshot survives at SNAP_DIR"
else
  no "far-ahead unrunnable merge tool (rc=$rc restored81=$restored81 fu_tip=$fu_tip snap=$snap)"; printf '%s
' "$out"; printf '%s
' "$content"
fi

# --- Case 82: a REAL divergence still parks (no overcorrection) --------------
# Same shape as case 80 — layer-3 stale --base, same-field concurrent edit —
# but with GC_MERGE_NODE_UNRUNNABLE unset, so the harness's real merge-node.ts
# emulation runs and genuinely cannot resolve the conflict. This must still
# park exactly as it did before Unit 2: the anti-overcorrection guard against
# "fixed the storm by never parking anything."
set_mode green
W82="$WORK/w82"
make_clone "$W82" writer-82
base82_sha="$(git -C "$W82" hash-object intentions/t-merge-real-divergence.md)"
edit_field "$W82" t-merge-real-divergence sentinel writer82-value

OTHER82="$WORK/other82"
make_clone "$OTHER82" other82
edit_field "$OTHER82" t-merge-real-divergence sentinel concurrent82-value
git -C "$OTHER82" commit -qam 'concurrent same-field edit (real divergence, layer 3)'
git -C "$OTHER82" push -q origin main

out="$(run_gc "$W82" -m 'test: layer-3 real divergence still parks' \
        --base "t-merge-real-divergence=$base82_sha" t-merge-real-divergence 2>&1)"; rc=$?
content="$(origin_show t-merge-real-divergence 2>/dev/null)"
snap="$(sed -n 's/.*preserved at \(.*\) for the manual merge.*/\1/p' <<<"$out")"
[[ -n "$snap" ]] && SNAP_DIRS_TO_CLEAN+=("$snap")
if [[ $rc -eq 1 ]] \
   && grep -q 'office_hours' <<<"$content" \
   && grep -q 'mechanical-unresolved' <<<"$content" \
   && grep -q 'writer82-value' <<<"$content" \
   && grep -q 'concurrent82-value' <<<"$content"; then
  ok "real divergence still parks: a genuine same-field conflict is unaffected by the unrunnable-tool die path"
else
  no "real divergence regression check (rc=$rc)"; printf '%s
' "$out"; printf '%s
' "$content"
fi

# --- Case 83: npx is never on the write path ---------------------------------
# A full happy-path run through run_gc must never reach the hard-failing npx
# shim (Unit 1) — proving graph-commit's write path no longer spawns npx at
# all, in a way a silent regression back to `npx tsx` would fail loudly rather
# than only be catchable by grepping the source.
set_mode green
sync_clone "$A"
edit_line "$A" t-merge-npx-guard 1 A-edit-npx-guard
out="$(run_gc "$A" t-merge-npx-guard 2>&1)"; rc=$?
if [[ $rc -eq 0 ]] && [[ ! -s "$WORK/npx-calls.log" ]]; then
  ok "npx is never invoked on the write path (happy path proven via an empty call log, not just a source grep)"
else
  no "npx-never-invoked guard (rc=$rc)"; printf '%s
' "$out"; printf 'npx-calls.log: %s
' "$(cat "$WORK/npx-calls.log" 2>/dev/null || true)"
fi

# --- Case 84: the REAL park helper carries the losing writer's content ---------
# Every case above runs the node SHIM, so the shim's mirrored wording is what
# they pin. This case runs the REAL tsx helper out of park_write's heredoc,
# against the REAL store module, so the durability claim is made of the shipped
# code and not of its mirror:
#   (a) the office_hours.recommendation writeNode serialized carries the losing
#       writer's frozen original VERBATIM — byte-identical after a YAML
#       round-trip, which is what makes the record a copy rather than a quote;
#   (b) it still does after SNAP_DIR is destroyed (the tmp reaper / reboot /
#       container-exit case KEEP_SNAP=1 does nothing about);
#   (c) over the embed cap the block says exactly how many bytes it dropped and
#       where the whole file is — a bounded embed, never a silent truncation;
#   (d) that byte figure stays exact when the cap lands mid-codepoint on a file
#       with no newline in the capped window (one very long multi-byte line);
#   (e) the record only claims a carried copy when there is one, and the
#       "may not survive past this session" caveat sits on the SNAP_DIR paths
#       rather than on the copy that lands on origin/main.
# Hard requirements, not skips: a skipped case is a vacuous pass, and this is
# the only case that reaches the real helper at all.
[[ -f "$HARNESS_DIR/../src/store.ts" ]] \
  || { echo "error: real store module not found at $HARNESS_DIR/../src/store.ts (required by case 84)" >&2; exit 1; }
command -v node >/dev/null \
  || { echo "error: node not found (required by case 84's real-helper run)" >&2; exit 1; }
REAL_PARK_DIR="$WORK/realpark"
mkdir -p "$REAL_PARK_DIR/intentions" "$REAL_PARK_DIR/snap" "$REAL_PARK_DIR/keep"
# Extract park_write()'s throwaway tsx module from the graph-commit under test.
# `cat >"$tmpts" <<'TS'` ... `TS` is the heredoc; anything else here would test
# a copy of the helper rather than the shipped one.
awk '/^  cat >"\$tmpts" <<.TS.$/{f=1;next} f&&/^TS$/{exit} f' \
  "$GC_SCRIPT" >"$REAL_PARK_DIR/park-helper.mts"
if [[ ! -s "$REAL_PARK_DIR/park-helper.mts" ]] \
   || ! grep -q 'ownContentEmbed' "$REAL_PARK_DIR/park-helper.mts"; then
  no "case 84 setup: could not extract park_write's tsx helper from $GC_SCRIPT (the heredoc markers moved?)"
else
  real_node_file() { # <dir> <id> <statement> <body>
    printf -- '---\nid: %s\nkind: tactic\nstatement: %s\nowner: ai\nstatus: raw\n---\n%s\n' \
      "$2" "$3" "$4" >"$1/$2.md"
  }
  # On origin/main: the concurrent writer's landed content.
  real_node_file "$REAL_PARK_DIR/intentions" t-real-carry "landed statement" "Body as it stands on origin/main."
  # In SNAP_DIR: the losing writer's frozen original, with content shapes a
  # naive embed mangles — a nested "---" fence, an indented line, a code fence.
  {
    printf -- '---\nid: t-real-carry\nkind: tactic\nstatement: REAL-CARRY-STATEMENT\nowner: ai\nstatus: raw\n---\n'
    printf '%s\n' '# Plan' '' '  indented line' '```verify' 'npx vitest run --root .' '```' '' '--- a bare fence line' '' 'REAL-CARRY-BODY the paragraph nobody asked graph-commit to drop'
  } >"$REAL_PARK_DIR/snap/t-real-carry.md"
  # Kept outside SNAP_DIR so the comparison survives SNAP_DIR's destruction.
  cp "$REAL_PARK_DIR/snap/t-real-carry.md" "$REAL_PARK_DIR/keep/t-real-carry.md"
  real_carry_bytes="$(wc -c <"$REAL_PARK_DIR/keep/t-real-carry.md" | tr -d ' ')"
  # Over the cap: 65536 bytes is the embed limit, so a ~120KB snapshot must be
  # carried in part and must name the omission. The tail marker proves the cut.
  {
    printf -- '---\nid: t-real-big\nkind: tactic\nstatement: REAL-BIG-STATEMENT\nowner: ai\nstatus: raw\n---\n'
    seq 1 4000 | sed 's/^/filler line /'
    printf '%s\n' 'REAL-BIG-TAIL-MARKER'
  } >"$REAL_PARK_DIR/snap/t-real-big.md"
  real_node_file "$REAL_PARK_DIR/intentions" t-real-big "landed statement" "Body as it stands on origin/main."
  cp "$REAL_PARK_DIR/snap/t-real-big.md" "$REAL_PARK_DIR/keep/t-real-big.md"
  real_big_bytes="$(wc -c <"$REAL_PARK_DIR/keep/t-real-big.md" | tr -d ' ')"
  # Over the cap with NO newline anywhere in the capped window, in multi-byte
  # UTF-8: one very long line (a YAML-folded recommendation is exactly this
  # shape) built from U+20AC, three bytes each. 3 * 21845 = 65535, so the
  # 65536-byte cap lands on the SECOND byte of a codepoint and the line-boundary
  # cut has no newline to fall back on. A byte-slice-then-decode would end the
  # embed in a U+FFFD replacement character and then measure the omitted count
  # against that 3-byte replacement — reporting a byte figure the file never
  # had, in the one record that is supposed to make truncation loud and exact.
  {
    awk 'BEGIN { for (i = 0; i < 30000; i++) printf "%s", "€" }'
    printf '%s\n' 'REAL-ONELINE-TAIL-MARKER'
  } >"$REAL_PARK_DIR/snap/t-real-oneline.md"
  real_node_file "$REAL_PARK_DIR/intentions" t-real-oneline "landed statement" "Body as it stands on origin/main."
  cp "$REAL_PARK_DIR/snap/t-real-oneline.md" "$REAL_PARK_DIR/keep/t-real-oneline.md"
  real_oneline_bytes="$(wc -c <"$REAL_PARK_DIR/keep/t-real-oneline.md" | tr -d ' ')"
  # A frozen original that is ABSENT while the merge output beside it exists.
  # snapIntended() resolves to <id>.merged.md, so nothing throws and nothing is
  # carried — the state in which a recommendation that unconditionally promises
  # "the carried copy" points a human at a block that was never written.
  printf -- '---\nid: t-real-nocarry\nkind: tactic\nstatement: REAL-NOCARRY-MERGED\nowner: ai\nstatus: raw\n---\nMerge output, not this session content.\n' \
    >"$REAL_PARK_DIR/snap/t-real-nocarry.merged.md"
  real_node_file "$REAL_PARK_DIR/intentions" t-real-nocarry "landed statement" "Body as it stands on origin/main."
  # The real invocation's own shape: cd to the scripts dir (so tsx and `yaml`
  # resolve from this repo's node_modules) and pass the store module as
  # ../src/store.js, exactly as park_write does.
  real_out="$( cd "$HARNESS_DIR" \
    && node --import tsx/esm "$REAL_PARK_DIR/park-helper.mts" \
         "$HARNESS_DIR/../src/store.js" "$REAL_PARK_DIR/intentions" \
         2026-01-02 'graph-commit: concurrent-edit conflict — manual merge needed' \
         "$REAL_PARK_DIR/snap" '' t-real-carry t-real-big t-real-oneline t-real-nocarry 2>&1 )"; real_rc=$?
  # Destroy SNAP_DIR before reading anything back: from here on, only what the
  # park RECORDED can answer.
  rm -rf "$REAL_PARK_DIR/snap"
  # Byte-exactness of the carried copy, read back through the real store's
  # readNode (so a YAML round-trip that folded a newline or ate an indent fails
  # here rather than passing a substring grep). Reports, per id: whether the
  # carried text is the whole original or a strict PREFIX of it, how many bytes
  # it carries, and what the truncation note claims — so the cap arm is checked
  # against the fixture's real size rather than a magic constant.
  cat >"$REAL_PARK_DIR/verify-carry.mts" <<'VERIFY'
import { readFileSync } from "node:fs";
const [storePath, dir, id, expectedFile] = process.argv.slice(2);
const { readNode } = await import(storePath);
const rec = readNode(dir, id).office_hours.recommendation ?? "";
const begin = `----- BEGIN this session's unlanded content for ${id} (verbatim) -----\n`;
const end = `\n----- END this session's unlanded content for ${id} -----`;
const i = rec.indexOf(begin);
const j = rec.indexOf(end);
if (i < 0 || j < 0) { console.log("NO-BLOCK"); process.exit(0); }
// The carried region is the verbatim text, plus the truncation note when the
// embed hit its cap. Split the note back off so the text can be compared to the
// original byte for byte.
let text = rec.slice(i + begin.length, j) + "\n";
let omitted = 0;
let notedTotal = 0;
const note = text.match(/----- TRUNCATED: (\d+) of (\d+) bytes omitted[^\n]*-----\n$/);
if (note) {
  omitted = Number(note[1]);
  notedTotal = Number(note[2]);
  text = text.slice(0, text.length - note[0].length);
}
const original = readFileSync(expectedFile, "utf8");
// The ONLY byte the block ever adds is a single trailing newline, when the cut
// did not already land on one — the no-newline-in-the-window case. Account for
// it explicitly (PREFIX+NL) and measure `carried` against the original's own
// bytes, so `carried + omitted` still has to equal the file size.
let kind, carriedText;
if (text === original) { kind = "EXACT"; carriedText = text; }
else if (original.startsWith(text)) { kind = "PREFIX"; carriedText = text; }
else if (text.endsWith("\n") && original.startsWith(text.slice(0, -1))) {
  kind = "PREFIX+NL"; carriedText = text.slice(0, -1);
} else { kind = "DIFFERS"; carriedText = text; }
// U+FFFD in the carried text means the cut split a codepoint and Node decoded
// the dangling bytes to a replacement character — the defect that also makes
// the omitted count a lie.
const repl = (text.match(/�/g) ?? []).length;
console.log(
  `${kind} carried=${Buffer.byteLength(carriedText, "utf8")} omitted=${omitted} ` +
    `noted_total=${notedTotal} actual_total=${Buffer.byteLength(original, "utf8")} ` +
    `repl=${repl}`,
);
VERIFY
  verify_carry() { # <id> <expected-file>
    ( cd "$HARNESS_DIR" \
      && node --import tsx/esm "$REAL_PARK_DIR/verify-carry.mts" \
           "$HARNESS_DIR/../src/store.ts" "$REAL_PARK_DIR/intentions" "$1" "$2" 2>&1 )
  }
  # office_hours.recommendation as ONE line, read back through the real store.
  # The recommendation lands as a folded YAML scalar, so its sentences are
  # re-wrapped at arbitrary columns on disk: grepping the raw file for a phrase
  # is a coin flip that silently goes vacuous whenever the prose changes length.
  # Unfold it once here and assert against that.
  cat >"$REAL_PARK_DIR/print-rec.mts" <<'PRINTREC'
const [storePath, dir, id] = process.argv.slice(2);
const { readNode } = await import(storePath);
const rec = readNode(dir, id).office_hours?.recommendation ?? "";
console.log(rec.replace(/\s+/g, " "));
PRINTREC
  real_rec() { # <id>
    ( cd "$HARNESS_DIR" \
      && node --import tsx/esm "$REAL_PARK_DIR/print-rec.mts" \
           "$HARNESS_DIR/../src/store.ts" "$REAL_PARK_DIR/intentions" "$1" 2>&1 )
  }
  verify_out="$(verify_carry t-real-carry "$REAL_PARK_DIR/keep/t-real-carry.md")"
  carried_content="$(cat "$REAL_PARK_DIR/intentions/t-real-carry.md")"
  carry_rec="$(real_rec t-real-carry)"
  if [[ $real_rc -eq 0 ]] \
     && [[ ! -e "$REAL_PARK_DIR/snap" ]] \
     && [[ "$verify_out" == "EXACT carried=$real_carry_bytes omitted=0 noted_total=0 actual_total=$real_carry_bytes repl=0" ]] \
     && grep -q 'REAL-CARRY-BODY' <<<"$carried_content" \
     && grep -q 'REAL-CARRY-STATEMENT' <<<"$carried_content" \
     && grep -qF 'carried at the end of this recommendation' <<<"$carry_rec" \
     && grep -q '^statement: landed statement' <<<"$carried_content"; then
    ok "real park helper: the landed office_hours.recommendation carries the losing writer's content byte-exactly, and still does with SNAP_DIR destroyed"
  else
    no "real park helper carry (rc=$real_rc verify='$verify_out')"; printf '%s\n' "$real_out"; printf '%s\n' "$carried_content"
  fi
  # The snapDir caveat sits on the snapDir PATH, and nowhere near the carried
  # copy. The carried copy is inside this recommendation, which lands on
  # origin/main; the frozen original is in a `mktemp -d`. Labelling those the
  # other way round tells a human to distrust the only durable copy and to rely
  # on the perishable one.
  if grep -qF "preserved at $REAL_PARK_DIR/snap/t-real-carry.md (on this machine only — it may not survive past this session) — a frozen pre-merge copy" <<<"$carry_rec" \
     && grep -qF 'does not depend on that directory outliving this session' <<<"$carry_rec"; then
    ok "real park helper: the 'may not survive past this session' caveat is attached to the SNAP_DIR path, not to the copy embedded in the landed record"
  else
    no "real park helper caveat placement"; printf '%s\n' "$carry_rec"
  fi
  big_verify="$(verify_carry t-real-big "$REAL_PARK_DIR/keep/t-real-big.md")"
  big_content="$(cat "$REAL_PARK_DIR/intentions/t-real-big.md")"
  read -r big_kind big_carried big_omitted big_noted big_actual big_repl <<<"$big_verify"
  big_carried="${big_carried#carried=}"; big_omitted="${big_omitted#omitted=}"
  big_noted="${big_noted#noted_total=}"; big_actual="${big_actual#actual_total=}"
  big_repl="${big_repl#repl=}"
  if [[ "$big_kind" == "PREFIX" ]] \
     && [[ "$big_omitted" -gt 0 ]] \
     && [[ "$big_repl" -eq 0 ]] \
     && [[ "$big_noted" == "$big_actual" && "$big_actual" == "$real_big_bytes" ]] \
     && [[ $((big_carried + big_omitted)) -eq "$real_big_bytes" ]] \
     && [[ "$big_carried" -le 65536 ]] \
     && grep -q '65536-byte embed cap' <<<"$big_content" \
     && grep -q 'REAL-BIG-STATEMENT' <<<"$big_content" \
     && ! grep -q 'REAL-BIG-TAIL-MARKER' <<<"$big_content"; then
    ok "real park helper: an over-cap snapshot is carried up to the cap as a strict prefix and states exactly how many bytes it dropped (never a silent truncation)"
  else
    no "real park helper cap ('$big_verify' fixture=$real_big_bytes)"; printf '%s\n' "$big_content"
  fi
  # Over the cap with no newline in the capped window, in multi-byte UTF-8. The
  # cut must land on a codepoint boundary (repl=0, and 65535 of the 65536
  # available bytes carried — the split lead byte dropped), and the omitted
  # figure in the landed record must be the real one: carried + omitted == the
  # file size, measured against the fixture, not against a decoded string.
  one_verify="$(verify_carry t-real-oneline "$REAL_PARK_DIR/keep/t-real-oneline.md")"
  one_content="$(cat "$REAL_PARK_DIR/intentions/t-real-oneline.md")"
  read -r one_kind one_carried one_omitted one_noted one_actual one_repl <<<"$one_verify"
  one_carried="${one_carried#carried=}"; one_omitted="${one_omitted#omitted=}"
  one_noted="${one_noted#noted_total=}"; one_actual="${one_actual#actual_total=}"
  one_repl="${one_repl#repl=}"
  if [[ "$one_kind" == "PREFIX+NL" ]] \
     && [[ "$one_repl" -eq 0 ]] \
     && [[ "$one_carried" -eq 65535 ]] \
     && [[ "$one_noted" == "$one_actual" && "$one_actual" == "$real_oneline_bytes" ]] \
     && [[ $((one_carried + one_omitted)) -eq "$real_oneline_bytes" ]] \
     && grep -q '65536-byte embed cap' <<<"$one_content" \
     && ! grep -q 'REAL-ONELINE-TAIL-MARKER' <<<"$one_content"; then
    ok "real park helper: a >64KB single line of multi-byte UTF-8 is cut on a codepoint boundary and the omitted byte count is exact (no replacement character, no invented bytes)"
  else
    no "real park helper codepoint cut ('$one_verify' fixture=$real_oneline_bytes)"
  fi
  # No frozen original, merge output present: nothing could be carried, so the
  # recommendation must not promise a carried copy — and must not send a human
  # to a snapshot path that does not exist.
  nocarry_rec="$(real_rec t-real-nocarry)"
  if [[ -n "$nocarry_rec" ]] \
     && grep -qF "no frozen original exists at $REAL_PARK_DIR/snap/t-real-nocarry.md" <<<"$nocarry_rec" \
     && grep -qF 'PARTIAL MERGE' <<<"$nocarry_rec" \
     && grep -qF "$REAL_PARK_DIR/snap/t-real-nocarry.merged.md (on this machine only — it may not survive past this session)" <<<"$nocarry_rec" \
     && ! grep -qF 'carried at the end of this recommendation' <<<"$nocarry_rec" \
     && ! grep -qF 'the carried copy' <<<"$nocarry_rec" \
     && ! grep -qF "BEGIN this session's unlanded content for t-real-nocarry" <<<"$nocarry_rec"; then
    ok "real park helper: with no frozen original to carry, the record says so instead of promising a verbatim block that was never written"
  else
    no "real park helper no-carry wording"; printf '%s\n' "$nocarry_rec"
  fi
fi

# --- Case 85: DEFAULT (worktree) writer, a checkout merely BEHIND origin/main ---
# The worktree-writer half of Case 74's defect
# (tactic-graph-commit-noop-shortcircuit-head-behind). $B is clean and its
# content for the target id already matches origin/main, but $A has advanced
# main past it, so HEAD is strictly BEHIND origin/main. Nothing HEAD carries can
# reach main, so the whole landing cycle — landing lock, graph/** scratch push,
# await_checks stamp poll, push to main — is pure cost. Before the widening this
# fell through to a full land() and printed "landing current HEAD … the landing
# cycle will fast-forward"; that branch is now unreachable and deleted, so its
# text appearing at all is the regression.
#
# NO GRAPH_COMMIT_WRITER export here — that is the whole point. Case 74 is the
# same shape with `plumbing`; this one must hold for the default.
set_mode green
sync_clone "$B"
sync_clone "$A"
edit_line "$A" t-behind-advance 4 advance-main-past-B
run_gc "$A" -m 'test: advance main past B' t-behind-advance >/dev/null 2>&1
before="$(origin_sha)"
calls_before="$(gh_calls)"
b_head_before="$(git -C "$B" rev-parse HEAD)"
out="$(run_gc "$B" -m 'test: worktree no-op behind main' t-behind-noop 2>&1)"; rc=$?
b_head_after="$(git -C "$B" rev-parse HEAD)"
# `b_head_before != before` is the fixture's own precondition: without it every
# assertion below would hold vacuously on a clone that happened to be AT
# origin/main (which is the case the OLD guard already covered). `b_head_after
# == b_head_before` pins the accepted behavior change — the checkout is no
# longer fast-forwarded as a side effect of the skipped land(), and nothing may
# compensate for that.
if [[ $rc -eq 0 ]] \
   && [[ "$b_head_before" != "$before" ]] \
   && [[ "$b_head_after" == "$b_head_before" ]] \
   && grep -q 'no new changes to stage' <<<"$out" \
   && grep -q 'skipping the landing cycle' <<<"$out" \
   && ! grep -q 'landing current HEAD' <<<"$out" \
   && [[ "$(origin_sha)" == "$before" ]] \
   && [[ "$(gh_calls)" == "$calls_before" ]] \
   && [[ -z "$(scratch_refs)" ]] \
   && grep -qE 'verdict: landed-equivalent .*pushed=none .*context=noop' <<<"$out"; then
  ok "worktree writer: a clean checkout BEHIND origin/main whose content already matches short-circuits — no landing cycle, no stamp poll, no scratch branch, HEAD left where it was"
else
  no "worktree no-op behind main (rc=$rc origin moved: $before -> $(origin_sha); B HEAD ${b_head_before:0:8} -> ${b_head_after:0:8}, main ${before:0:8})"; printf '%s\n' "$out"
fi

# The same invocation with gh in hard-fail mode (every call exits 1), $B STILL
# behind because the run above pushed nothing and did not fast-forward it.
# Case 41's angle, on the behind case: the short-circuit must fire BEFORE the
# poller, so a broken gh cannot turn a behind-checkout no-op into a failure.
#
# The `still_behind` guard is what keeps this arm honest. A land() that
# fast-forwards $B (the pre-fix behavior) leaves the clone AT origin/main, where
# even the un-widened guard short-circuits with zero gh calls — so without this
# check the arm would pass against the very code it exists to reject.
set_mode hard-fail
still_behind="$(git -C "$B" rev-parse HEAD)"
out="$(run_gc "$B" -m 'test: worktree no-op behind main, gh broken' t-behind-noop 2>&1)"; rc=$?
calls="$(gh_calls)"
if [[ $rc -eq 0 ]] \
   && [[ "$still_behind" != "$(origin_sha)" ]] \
   && ! grep -q 'polling failed' <<<"$out" \
   && [[ "$calls" -eq 0 ]] \
   && [[ "$(origin_sha)" == "$before" ]]; then
  ok "worktree writer: the behind-main short-circuit fires before the poller — zero gh calls even in hard-fail mode, on a clone still behind main"
else
  no "worktree no-op behind main under hard-fail (rc=$rc gh_calls=$calls still_behind=${still_behind:0:8} main=$(origin_sha))"; printf '%s\n' "$out"
fi
set_mode green
sync_clone "$B"

# --- Case 86: a FRESH --base pin makes an id a bystander, not collateral -------
# The defect this trio exists for. Cases 44/46 only ever proved that a --prune
# id escapes the park; an ordinary edit id could not, because park_and_exit()
# drew its bystander set from PRUNE_IDS alone and took park_ids = ALL_IDS minus
# those prunes. An invocation passing NO --prune therefore parked its ENTIRE
# batch on one node's unresolvable divergence — and the collateral does not
# self-heal, since every enumerating caller (reconcile-graph-review-stall, the
# selector) skips nodes with office_hours != null. THIS CASE PASSES NO --prune
# AT ALL, which is exactly the shape that used to park everything.
#
# Three pinned ids, one concurrent same-field edit on the first. The other two
# pins still match origin/main, which is positive proof no concurrent writer
# touched them, so their edits must LAND with the park commit while only the
# diverged id parks.
set_mode green
W86="$WORK/w86"
make_clone "$W86" writer-86
diverged86="$(git -C "$W86" hash-object intentions/t-fresh-diverged.md)"
fresh86a="$(git -C "$W86" hash-object intentions/t-fresh-bystander-a.md)"
fresh86b="$(git -C "$W86" hash-object intentions/t-fresh-bystander-b.md)"
edit_field "$W86" t-fresh-diverged sentinel writer86-value
edit_field "$W86" t-fresh-bystander-a fieldA writer86-a
edit_field "$W86" t-fresh-bystander-b fieldA writer86-b

OTHER86="$WORK/other86"
make_clone "$OTHER86" other86
edit_field "$OTHER86" t-fresh-diverged sentinel concurrent86-value
git -C "$OTHER86" commit -qam 'concurrent same-field edit'
git -C "$OTHER86" push -q origin main

out="$(run_gc "$W86" -m 'test: fresh-pin bystander edits' \
        --base "t-fresh-diverged=$diverged86" \
        --base "t-fresh-bystander-a=$fresh86a" \
        --base "t-fresh-bystander-b=$fresh86b" \
        t-fresh-diverged t-fresh-bystander-a t-fresh-bystander-b 2>&1)"; rc=$?
parked86="$(origin_show t-fresh-diverged 2>/dev/null)"
by86a="$(origin_show t-fresh-bystander-a 2>/dev/null)"
by86b="$(origin_show t-fresh-bystander-b 2>/dev/null)"
snap="$(sed -n 's/.*preserved at \(.*\) for the manual merge.*/\1/p' <<<"$out")"
[[ -n "$snap" ]] && SNAP_DIRS_TO_CLEAN+=("$snap")
subject="$(git -C "$ORIGIN" log -1 --format=%s main)"
park_clause="${subject%%; land*}"
if [[ $rc -eq 1 ]] \
   && grep -q 'mechanical-unresolved' <<<"$parked86" \
   && grep -q 'sentinel: concurrent86-value' <<<"$parked86" \
   && grep -q '^fieldA: writer86-a' <<<"$by86a" \
   && ! grep -q 'office_hours' <<<"$by86a" \
   && grep -q '^fieldA: writer86-b' <<<"$by86b" \
   && ! grep -q 'office_hours' <<<"$by86b" \
   && grep -q 're-applying and landing bystander edit(s)' <<<"$out" \
   && grep -q 't-fresh-diverged' <<<"$park_clause" \
   && ! grep -q 't-fresh-bystander-a' <<<"$park_clause" \
   && ! grep -q 't-fresh-bystander-b' <<<"$park_clause" \
   && grep -q '; land t-fresh-bystander-a t-fresh-bystander-b' <<<"$subject"; then
  ok "fresh --base pin: only the diverged id parks; the unconflicted pinned edits land with the park commit, with NO --prune id in the invocation"
else
  no "fresh-pin bystander edits (rc=$rc)"; printf '%s\n' "$out"; printf 'parked: %s\n' "$parked86"; printf 'a: %s\n' "$by86a"; printf 'b: %s\n' "$by86b"; printf 'subject: %s\n' "$subject"
fi

# --- Case 87: an UNPINNED sibling still parks ---------------------------------
# The negative that keeps the carve-out honest. Freshness is decided by the
# --base compare-and-swap and nothing else, so an id the caller never pinned has
# no evidence behind it — "unchanged since this writer read it" is unanswerable
# — and must keep the pre-existing fail-closed fate. This is what makes every
# park by a caller that passes no --base at all (cases 4, 20, 50, 72) behave
# exactly as it did before the partition changed.
set_mode green
W87="$WORK/w87"
make_clone "$W87" writer-87
diverged87="$(git -C "$W87" hash-object intentions/t-unpinned-diverged.md)"
edit_field "$W87" t-unpinned-diverged sentinel writer87-value
edit_field "$W87" t-unpinned-sibling fieldA writer87-sibling

OTHER87="$WORK/other87"
make_clone "$OTHER87" other87
edit_field "$OTHER87" t-unpinned-diverged sentinel concurrent87-value
git -C "$OTHER87" commit -qam 'concurrent same-field edit'
git -C "$OTHER87" push -q origin main

out="$(run_gc "$W87" -m 'test: unpinned sibling still parks' \
        --base "t-unpinned-diverged=$diverged87" \
        t-unpinned-diverged t-unpinned-sibling 2>&1)"; rc=$?
parked87="$(origin_show t-unpinned-diverged 2>/dev/null)"
sib87="$(origin_show t-unpinned-sibling 2>/dev/null)"
snap="$(sed -n 's/.*preserved at \(.*\) for the manual merge.*/\1/p' <<<"$out")"
[[ -n "$snap" ]] && SNAP_DIRS_TO_CLEAN+=("$snap")
subject="$(git -C "$ORIGIN" log -1 --format=%s main)"
if [[ $rc -eq 1 ]] \
   && grep -q 'office_hours' <<<"$parked87" \
   && grep -q 'office_hours' <<<"$sib87" \
   && grep -q '^fieldA: base' <<<"$sib87" \
   && ! grep -q '^fieldA: writer87-sibling' <<<"$sib87" \
   && grep -q 't-unpinned-sibling' <<<"$subject" \
   && ! grep -q '; land ' <<<"$subject" \
   && ! grep -q 're-applying and landing bystander edit(s)' <<<"$out"; then
  ok "unpinned sibling: an id with no --base pin still parks — freshness is the CAS's answer, never an assumption"
else
  no "unpinned sibling still parks (rc=$rc)"; printf '%s\n' "$out"; printf 'parked: %s\n' "$parked87"; printf 'sibling: %s\n' "$sib87"; printf 'subject: %s\n' "$subject"
fi

# --- Case 88: park / land / prune, all three clauses in one invocation ---------
# The two bystander kinds compose, and the commit subject keeps all three sets
# in separate, fixed-order clauses so no reader can mistake a landed id for a
# parked one.
set_mode green
W88="$WORK/w88"
make_clone "$W88" writer-88
diverged88="$(git -C "$W88" hash-object intentions/t-mixed-diverged.md)"
fresh88="$(git -C "$W88" hash-object intentions/t-mixed-edit.md)"
edit_field "$W88" t-mixed-diverged sentinel writer88-value
edit_field "$W88" t-mixed-edit fieldA writer88-edit
rm -f "$W88/intentions/t-mixed-prune.md"

OTHER88="$WORK/other88"
make_clone "$OTHER88" other88
edit_field "$OTHER88" t-mixed-diverged sentinel concurrent88-value
git -C "$OTHER88" commit -qam 'concurrent same-field edit'
git -C "$OTHER88" push -q origin main

out="$(run_gc "$W88" -m 'test: mixed bystanders' \
        --base "t-mixed-diverged=$diverged88" \
        --base "t-mixed-edit=$fresh88" \
        t-mixed-diverged t-mixed-edit --prune t-mixed-prune 2>&1)"; rc=$?
parked88="$(origin_show t-mixed-diverged 2>/dev/null)"
by88="$(origin_show t-mixed-edit 2>/dev/null)"
snap="$(sed -n 's/.*preserved at \(.*\) for the manual merge.*/\1/p' <<<"$out")"
[[ -n "$snap" ]] && SNAP_DIRS_TO_CLEAN+=("$snap")
subject="$(git -C "$ORIGIN" log -1 --format=%s main)"
if [[ $rc -eq 1 ]] \
   && grep -q 'mechanical-unresolved' <<<"$parked88" \
   && grep -q 'sentinel: concurrent88-value' <<<"$parked88" \
   && grep -q '^fieldA: writer88-edit' <<<"$by88" \
   && ! grep -q 'office_hours' <<<"$by88" \
   && ! git -C "$ORIGIN" cat-file -e main:intentions/t-mixed-prune.md 2>/dev/null \
   && grep -q '^graph: park t-mixed-diverged (concurrent-edit conflict); land t-mixed-edit; prune t-mixed-prune$' <<<"$subject" \
   && grep -q 'landed bystander prune deletion(s) for t-mixed-prune; landed bystander edit(s) for t-mixed-edit' <<<"$out"; then
  ok "mixed bystanders: a fresh-pin edit and an unrelated prune both ride the park commit, each named in its own subject clause"
else
  no "mixed bystanders (rc=$rc)"; printf '%s\n' "$out"; printf 'parked: %s\n' "$parked88"; printf 'edit: %s\n' "$by88"; printf 'subject: %s\n' "$subject"
fi

# --- No scratch branches left behind anywhere ------------------------------------
if [[ -z "$(scratch_refs)" ]]; then
  ok "no graph/** scratch branches remain on origin after all cases"
else
  no "leftover scratch branches: $(scratch_refs)"
fi

echo
echo "passed: $PASS  failed: $FAIL"
[[ $FAIL -eq 0 ]] || exit 1
exit 0
