---
id: tactic-clear-park-repo-targeting-guard
kind: tactic
statement: graph-commit's --base token asserts the resolved repo actually holds
  that base blob at HEAD and has a pending edit, so a wrong-repo invocation can
  no longer pass the nothing-staged guard by coincidence; and clear-park /
  resolve-park gain a functional test harness that exercises the repo-targeting
  dimension
owner: ai
status: codified
parent: null
rationale: "Surfaced 2026-07-28 at an office-hours drain sitting, while
  root-causing why a clear-park invocation reported success without landing.
  clear-park derives REPO_ROOT from its own script location
  (packages/intentionsutil/scripts/clear-park:55) and mutates intentions/<id>.md
  under THAT root, but invokes graph-commit as \"$SCRIPT_DIR/graph-commit\" with
  no -C argument (packages/intentionsutil/scripts/clear-park:169) — and
  graph-commit resolves its target repo from the CALLER'S CWD, by design, since
  tactic-graph-commit-cwd-repo-resolution landed. When cwd and the
  script-derived REPO_ROOT are different checkouts, clear-park writes repo A and
  graph-commit lands repo B. resolve-park has the identical shape at
  packages/intentionsutil/scripts/resolve-park:176. The immediate two-call-site
  fix (pass -C for REPO_ROOT) is being landed separately on branch
  tactic-graph-commit-staleness-silent-revert; this node covers ONLY the
  systemic residue that let the missing -C survive undetected, which is two
  distinct gaps. (a) graph-commit's nothing-staged guard
  (packages/intentionsutil/scripts/graph-commit:1466-1476) compares each id's
  HEAD blob against the FETCH_HEAD blob and dies only when they DIFFER. A
  wrong-repo invocation whose resolved repo happens to be in sync with
  origin/main produces EQUAL blobs, so the guard passes, the script prints 'no
  new changes to stage ... landing current HEAD' and exits 0 'landed' — a false
  success indistinguishable from the benign 'a prior attempt already committed'
  case. The guard is written to catch a differing blob; it structurally cannot
  catch the equal-blob wrong-repo case. This is a designed hole, not an
  oversight, but the --base token clear-park already passes carries exactly the
  information needed to close it. (b) There is NO test coverage of clear-park at
  all — grep over the repo's test-*.sh files returns zero references to
  clear-park — which is precisely why the missing -C shipped. resolve-park is
  partially covered (test-park-node.sh cases 9-11 exercise --ratify, --reject,
  and the unparked refusal), but no case for either script exercises the
  repo-targeting dimension: every existing case runs with cwd equal to the clone
  root, so the cwd/REPO_ROOT divergence that produces the defect is never
  constructed. Planned 2026-07-30 by the dispatch-pipeline bootstrap through a
  parallel Workflow fan-out rather than an /align-tactics round, so that skill's
  two-sided drift review and its census were bypassed (deliberate: ten
  concurrent align rounds would mean ten concurrent graph-commits, the exact
  hazard the bootstrap exists to avoid). Each plan was authored against the
  node's own cited code and then independently verified by a second agent; all
  reported citation and substance gaps were applied before landing. A later
  /align-tactics round should treat this body as unreviewed by the normal path."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 50
  override: null
  rationale: "Bootstrap re-scale 2026-07-30: Wave A of a three-band interim scale
    (50 / 20 / 10) that puts write-path integrity work above ordinary feature
    work. This band holds the silent graph-write-corruption defects plus the two
    paths the bootstrap arms or depends on. Interim scaffolding only -
    tactic-attention-tier-ranking replaces the whole numeric scheme with
    lexicographic (tier, rank) and max-lifting, and
    tactic-attention-boost-scripts converts these boosts to tier/bug_fix marks."
phase: qa
execution:
  branch: tactic-clear-park-repo-targeting-guard
  pr: 2988
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix: null
  completion: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# graph-commit `--base` repo assertion, and a clear-park / resolve-park test harness

## Context

`packages/intentionsutil/scripts/graph-commit` is the only primitive that lands
intention-node edits on `main`. Since `tactic-graph-commit-cwd-repo-resolution`
landed (graph-commit:1330-1341), graph-commit resolves the checkout it commits
from the **caller** — `-C/--repo` when given, else cwd — never from its own
script location. The park-lifecycle wrappers (`park-node`, `clear-park`,
`resolve-park`) do the opposite: they derive `REPO_ROOT` from their own
`SCRIPT_DIR` (clear-park:54-56, resolve-park:33-36, park-node:82-85) and write
`intentions/<id>.md` under **that** root. When the two resolve to different
checkouts, the wrapper edits repo A and graph-commit lands repo B.

### What is already fixed (do not re-land)

The immediate two-call-site fix landed on `origin/main` as commit `29952532`
("fix: pass -C REPO_ROOT from clear-park and resolve-park to graph-commit",
PR #2978). Both wrappers now pass `-C "$REPO_ROOT"`:

- `packages/intentionsutil/scripts/clear-park:181`
- `packages/intentionsutil/scripts/resolve-park:188`

**Citation drift:** the node's rationale cites `clear-park:169` and
`resolve-park:176` for these call sites. Both moved — the fix added a ~12-line
explanatory comment above each call (clear-park:169-180, resolve-park:176-187).
The current call-site lines are 181 and 188. `clear-park:55` (the `REPO_ROOT`
derivation) is still accurate.

### Residue (a): the nothing-staged guard structurally cannot see the equal-blob case

`graph-commit`'s nothing-staged branch is at **graph-commit:1451-1477** (the
node cites `1466-1476`, which is the tail comment plus the loop — still
substantially accurate). When `id_files_dirty()` (graph-commit:531-537) reports
nothing staged, it runs a per-id check (graph-commit:1468-1475):

```
local_blob="$(git rev-parse "HEAD:intentions/$id.md" 2>/dev/null || true)"
main_blob="$(git rev-parse "FETCH_HEAD:intentions/$id.md" 2>/dev/null || true)"
if [[ "$local_blob" != "$main_blob" ]]; then
  die "the resolved repo ($REPO_ROOT) holds intentions/$id.md content differing
       from origin/main but has nothing staged to commit. ... mis-pointed -C/--repo ..."
fi
```

then prints (graph-commit:1476):

```
graph-commit: no new changes to stage for <id> — landing current HEAD (nothing to commit, or a prior attempt already committed but did not push)
graph-commit: landed <id> on main
```

and exits 0.

This catches a wrong repo whose blob **differs** from `origin/main`. It cannot
catch a wrong repo whose blob **equals** `origin/main` — the common case, since
a freshly-cloned or freshly-synced checkout is in sync. Both blobs match, the
loop passes, and the script emits a "landed" success while the caller's real
edit sits dirty and unpushed in a different checkout. That false success is
byte-identical to the benign "already landed / prior attempt committed but did
not push" case, so no caller can tell them apart.

**Why the `--base` token alone does not close it.** The node's rationale
proposes hardening on the existing `--base <id>=<sha>` token. That token carries
the blob the caller *read* (`FRESH_BLOB` = `origin/main`'s content), not the
content it *wrote*. In the nothing-staged branch, the wrong-repo state
(untouched file: on-disk == HEAD == base) and the legitimate idempotent-no-op
state (the caller's mutation produced content byte-identical to what was already
there: on-disk == HEAD == base) are **the same three shas**. Content-wise they
are indistinguishable, so a `--base`-only rule would either miss the defect or
false-fail an idempotent re-write (e.g. `park-node` re-parking the same node with
the same reason on the same day — its payload is `{reason, since: <date>,
recommendation}`, park-node:243, so a same-day re-park is genuinely a no-op).

**The greenfield fix: assert the post-edit content, not the pre-edit base.**
Add a new `--expect <id>=<blobsha>` token to graph-commit: the blob sha of the
content the caller **wrote**. graph-commit hashes `intentions/<id>.md` in the
**resolved** repo and refuses to proceed when it does not match. A wrong-repo
invocation fails immediately and unambiguously — the resolved repo does not
contain the caller's edit — while an idempotent no-op still matches and lands
benignly. This subsumes both the equal-blob and differing-blob wrong-repo cases
and works on the dirty path as well as the nothing-staged path. It is additive
and opt-in (callers passing no `--expect` see no behavior change), so it is
backwards-compatible and needs no separate migration proposal.

### Residue (b): no test harness for clear-park; none for repo targeting

`clear-park` has **zero** test coverage. Verified: no `test-*.sh` under
`packages/intentionsutil/scripts/` or `.claude/skills/dispatch-propagate/scripts/`
references it. That absence is why the missing `-C` shipped.

`resolve-park` is partially covered by
`packages/intentionsutil/scripts/test-park-node.sh` (cases 9, 10, 11 at
test-park-node.sh:601-652). But every existing case runs the wrapper with cwd
equal to the clone root (`run_pn` / `run_rp`, test-park-node.sh:321-346, both
`cd "$clone"` first), so cwd and script-derived `REPO_ROOT` never diverge and
the defect class is invisible to the suite.

### Additional finding: `clear-park` has no `--base` flag

`.claude/skills/ref-diagnosis-time-cas/SKILL.md:42` documents the drain-lane
invocation `clear-park --base <manifest-path> <id> [note]` and an exit-3
`stale-diagnosis` contract "applies identically to clear-park"
(ref-diagnosis-time-cas/SKILL.md:57-65). `clear-park` does not implement it.
Its usage is `clear-park <node-id> [note]` (clear-park:47) with exit codes 0/1/2
only (clear-park:49-51), and its arg guard `[[ $# -lt 1 || $# -gt 2 ]]`
(clear-park:62) rejects the documented three-argument form with exit 2. Verified
against `origin/main`, not just this worktree. `tactic-drain-disposition-diagnosis-cas`
(phase `done`) declared this flag for both `park-node` and `clear-park`; only
`park-node` got it (park-node:87-180, 202-208). Unit 3 below closes that half,
because the node's own scope requires a test of clear-park's `--base` stale-pin
refusal and that test is unwritable without the flag.

## Unit 1 — graph-commit `--expect` post-edit content assertion

**Recommended model**: `opus`

**Scope**

Single file changed: `packages/intentionsutil/scripts/graph-commit`, plus new
cases in `packages/intentionsutil/scripts/test-graph-commit.sh`.

1. **New global.** Add `declare -A EXPECT_BLOB=()` next to `declare -A BASE=()`
   (graph-commit:152) and document it in the "Globals set by main()" comment
   block alongside the `BASE` entry (graph-commit:140-142). Wording: "EXPECT_BLOB —
   optional `--expect` assertion manifest: node id -> the blob SHA of the
   content the caller WROTE (`git hash-object` after its edit). Empty unless
   `--expect` was passed."

2. **New flag.** Parse `--expect` in `main()`'s option loop right after the
   `--base` arm (graph-commit:1321-1322), same shape:
   `--expect) [[ $# -ge 2 ]] || { usage; die "--expect requires an <id>=<blobsha> argument or a manifest file path"; }; parse_expect_arg "$2"; shift 2 ;;`
   Accept both the inline `<id>=<sha>` form and a manifest file, exactly like
   `--base` (see `add_base_pair` / `parse_base_arg`, graph-commit:230-256).
   Prefer factoring those two helpers into shared ones parameterized by the
   target associative array via a bash nameref (`local -n`) over copy-paste —
   the script already requires bash 4 (`declare -A`), and namerefs need 4.3.
   If the implementer judges the nameref refactor riskier than duplication,
   duplicating as `add_expect_pair` / `parse_expect_arg` is acceptable; say
   which was chosen in the commit message.

3. **New pre-flight check** `assert_expected_content()`. Behavior:
   - Return immediately when `${#EXPECT_BLOB[@]}` is 0 (opt-in; no behavior change
     for existing callers).
   - First pass, validation: for each key in `EXPECT_BLOB`, if it is a prune id
     (`is_prune_id`, graph-commit:635-641) print a usage error and `exit 2` —
     **use the raw `echo ... >&2; exit 2` pattern here (as `validate_id_chars`
     and the unknown-option arm do), NOT `die()`.** `die()`
     (graph-commit:200-203) unconditionally exits **1**, so mirroring the
     sibling `--base` argument arms (graph-commit:1315-1322) would ship exit 1
     and case 35's `exit 2` assertion would fail —
     a deletion has no content to assert. Keys that name neither an ordinary id
     nor a prune id are **ignored**, matching the `--base` manifest semantics
     where one batch manifest covers more nodes than a given invocation commits.
   - Second pass, assertion: iterate `IDS` (ordinary edit ids only), and for
     each id that has an `EXPECT_BLOB` entry, compute the on-disk blob and compare.
     `main()` has already `cd "$REPO_ROOT"` (graph-commit:1341), so a
     repo-relative path is correct:

     ```
     local actual
     actual="$(git hash-object -- "intentions/$id.md")" \
       || die "could not hash intentions/$id.md in the resolved repo ($REPO_ROOT)"
     ```

     Declare and assign on separate statements — `local actual="$(...)"` masks
     the command's exit status, and the script runs `set -euo pipefail`
     (graph-commit:86).
   - On mismatch, `die` (exit 1, matching the sibling guard at
     graph-commit:1473). The message MUST contain the existing stable substring
     `mis-pointed -C/--repo` so callers and tests grep one marker, and must name
     both shas and `$REPO_ROOT`. Suggested text: "the resolved repo
     ($REPO_ROOT) does not hold the content the caller asserted for
     intentions/$id.md (--expect $sha, on disk $actual) — the edit was made in a
     DIFFERENT checkout: mis-pointed -C/--repo (or cwd targeting the wrong
     checkout). Refusing to land."

4. **Call site — ordering is load-bearing.** Call `assert_expected_content`
   in `main()` immediately after `assert_clean_outside_ids` (graph-commit:1413)
   and **before** `snapshot` (graph-commit:1425). It must run before
   `check_base_freshness` (graph-commit:1427), whose layer-3 auto-merge
   overwrites `$INTENTIONS_DIR/$id.md` on disk (graph-commit:311-316), and
   before `ensure_intentions_only_base` (graph-commit:1450), which can
   `git reset --hard` the tree (graph-commit:507). Running it later would hash
   content graph-commit itself rewrote, not the caller's.

5. **Docs in-file.** Update the usage string (graph-commit:206), the two
   `Usage:` lines in the header block (graph-commit:32-33), and add a
   `--expect` paragraph next to the `--base` paragraph (graph-commit:48-52)
   explaining that `--base` asserts the pre-edit blob against `origin/main`
   while `--expect` asserts the post-edit blob against the resolved checkout,
   and that only the latter can catch a wrong-repo invocation whose blob happens
   to equal `origin/main`.

6. **New harness cases** appended to
   `packages/intentionsutil/scripts/test-graph-commit.sh` (numbered 33+,
   following case 32; add matching entries to the "Covers:" list at
   test-graph-commit.sh:14-105). Reuse `make_clone`
   (test-graph-commit.sh:204), `run_gc` (test-graph-commit.sh:450-466),
   `sync_clone` (:440), `edit_line` (:441-443), `origin_show` (:438),
   `origin_sha` (:439), `set_mode green`, and the `ok`/`no` counters.
   Add the new node ids to the `seed_node` loop near test-graph-commit.sh:156.
   - **33 — `--expect` transparent on the happy path.** Clone, edit a node,
     compute `git -C <clone> hash-object -- intentions/<id>.md`, pass it as
     `--expect <id>=<sha>`: exit 0, the edit lands on origin.
   - **34 — `--expect` catches the equal-blob wrong-repo case.** This is the
     exact hole. Clone and `sync_clone` it so it is bit-for-bit at
     `origin/main` and nothing is staged (the same setup as case 28,
     test-graph-commit.sh:1065-1082). Pass `--expect <id>=<sha>` where `<sha>`
     is the hash of some *other* content (e.g. `git hash-object` of a temp file,
     or the blob of a different node). Assert: non-zero exit, output contains
     `mis-pointed -C/--repo`, output does NOT contain `landed <id> on main`, and
     `origin_sha` is unchanged. Without the fix this case exits 0 with "no new
     changes to stage" + "landed".
   - **35 — `--expect` on a `--prune` id is a usage error.** exit 2, origin
     untouched.
   - Case 28 (test-graph-commit.sh:1065-1082) passes no `--expect` and MUST
     keep passing unchanged — it is the regression guard that the benign
     equal-blob path stays benign for unpinned callers. Do not modify it.

**Out of scope for this unit**

- Any change to the existing differing-blob `die` at graph-commit:1468-1475.
- `graph-commit`'s staleness/freshness behavior under concurrent `origin/main`
  motion (`tactic-graph-commit-staleness-silent-revert`).
- `ensure_intentions_only_base()`'s unconditional snapshot restore
  (`tactic-graph-commit-intentions-base-stale-restore`).

**Reuse**

- `packages/intentionsutil/scripts/graph-commit:230-256` — `add_base_pair` /
  `parse_base_arg`, the inline-pair-or-manifest parser to mirror or generalize.
- `packages/intentionsutil/scripts/graph-commit:635-641` — `is_prune_id`.
- `packages/intentionsutil/scripts/graph-commit:200-203` — `die`.
- `packages/intentionsutil/scripts/test-graph-commit.sh:204,438-466` —
  `make_clone`, `origin_show`, `origin_sha`, `sync_clone`, `edit_line`,
  `run_gc`.

## Unit 2 — pass `--expect` from the three park-lifecycle wrappers

**Recommended model**: `sonnet`

**Dependencies**: Unit 1 (the flag must exist).

**Scope**

Three files, one small block each. In every case, after the wrapper's `npx tsx`
mutation succeeds and before it invokes `graph-commit`, hash the file the
wrapper just wrote under its own `REPO_ROOT` and pass the result as `--expect`.
Use `-C "$REPO_ROOT"` on the `git hash-object` call for consistency with the
surrounding git calls. Note there is no `.gitattributes` in this repo (verified),
so `hash-object` performs no filtering and its output is directly comparable to
`git rev-parse HEAD:<path>`.

Failure to hash is genuine environment breakage — exit 1 with a descriptive
message, never fall back to omitting the flag (`.claude/rules/code-style.md`).

- `packages/intentionsutil/scripts/clear-park` — insert after the `npx_status`
  handling block ends (clear-park:161) and before the `MESSAGE` assignment
  (clear-park:163); add `--expect "$NODE_ID=$EXPECT_BLOB"` to the graph-commit
  invocation at **clear-park:181**.
- `packages/intentionsutil/scripts/resolve-park` — insert after the clear write
  (resolve-park:167-170) and before `COMMIT_MSG` (resolve-park:172); add
  `--expect "$NODE_ID=$EXPECT_BLOB"` to the invocation at **resolve-park:188**.
- `packages/intentionsutil/scripts/park-node` — insert after the parking write
  (park-node:257-261); add `--expect "$NODE_ID=$EXPECT_BLOB"` to the invocation
  at **park-node:263**.

Extend each wrapper's existing `-C "$REPO_ROOT"` comment block
(clear-park:169-180, resolve-park:176-187) with one sentence: `--expect` is the
second half of the same guarantee — `-C` points graph-commit at the right
checkout, `--expect` proves it.

**Explicitly out of scope**

- `packages/intentionsutil/scripts/hold-node:319` and
  `packages/intentionsutil/scripts/resolve-hold:371,418` invoke graph-commit as
  `(cd "$REPO_ROOT" && "$GRAPH_COMMIT" ...)`, so their cwd and write target
  cannot diverge. Leave them unchanged.
- `packages/intentionsutil/scripts/demote-node-to-implement:115` passes no
  `--base` and is not part of the park lifecycle. Leave it unchanged.

**Reuse**

- The existing `FRESH_BLOB` capture pattern in each wrapper
  (clear-park:123-126, resolve-park:80-83, park-node:192-200) — same
  `git -C "$REPO_ROOT" ...` + `if !` + descriptive-error shape.

## Unit 3 — `clear-park --base` diagnosis-time pin (exit 3 `stale-diagnosis`)

**Recommended model**: `sonnet`

**Scope**

Single file: `packages/intentionsutil/scripts/clear-park`. Make the invocation
documented at `.claude/skills/ref-diagnosis-time-cas/SKILL.md:42` real, mirroring
`park-node` exactly.

**Before starting, re-check**: run
`grep -n -- '--base' $(git rev-parse --show-toplevel)/packages/intentionsutil/scripts/clear-park`
against fresh `origin/main`. If a leading `--base` flag has since landed via
another node, skip this unit entirely and go straight to Unit 4.

Changes, all mirroring `park-node`:

1. Replace the arg handling at clear-park:59-65 with a `USAGE` variable and a
   leading-flags-only parse loop copied in shape from **park-node:87-134**
   (drop the `--pr` arm; keep `--base`, `--base=`, the `--*` catch-all exiting
   2, and the "first non-flag argument ends flag parsing" default arm). New
   usage string: `usage: clear-park [--base <blobsha>|<id>=<blobsha>|<manifest-file>] <node-id> [note]`.
   Then `NODE_ID="${ARGS[0]:-}"`, `NOTE="${ARGS[1]:-}"`, and refuse with exit 2
   when `${#ARGS[@]}` is 0 or > 2, or `NODE_ID` is empty.
2. Resolve the pin to a 40-hex sha before any network call, copied in shape from
   **park-node:147-180**: manifest-file form selects the line whose id matches
   `NODE_ID` (missing entry → exit 2), `<id>=<sha>` form must match `NODE_ID`
   (mismatch → exit 2), bare sha taken as-is, and a non-40-hex result → exit 2.
   Place this block after the arg validation and before the `mktemp` calls at
   clear-park:67-83.
3. Add the pin check after `FRESH_BLOB` is resolved (clear-park:123-126) and
   **before** `MUTATED=1` (clear-park:127), mirroring park-node:202-208:

   ```
   if [[ -n "$PINNED_BASE" && "$PINNED_BASE" != "$FRESH_BLOB" ]]; then
     echo "clear-park: stale-diagnosis — ... Nothing was written." >&2
     exit 3
   fi
   ```

   The message MUST contain the literal `stale-diagnosis` — it is the stable
   machine-greppable marker (`ref-diagnosis-time-cas/SKILL.md:65-67`). At this
   point the temp files exist but the node file has not been touched and
   `MUTATED` is 0, so the EXIT trap (clear-park:106-112) removes the temps and
   performs no restore. Verify that by inspection before writing the code.
4. Update the header's `Usage:` line (clear-park:47) and its exit-code list
   (clear-park:49-51) to add: `3 the supplied --base no longer matches
   origin/main (stale-diagnosis) — nothing was written`.

**Out of scope**

- `.claude/skills/ref-diagnosis-time-cas/SKILL.md` is already correct about the
  intended contract; its only staleness is the note at lines 50-52 that
  clear-park "may not exist yet on origin/main". Leave the skill file alone —
  editing `.claude/skills/**` triggers a separate commit-permission gate and is
  not needed for this change to be correct.
- `resolve-park` gains no `--base` flag; nothing documents one for it.

**Reuse**

- `packages/intentionsutil/scripts/park-node:87-180` and `park-node:202-208` —
  copy the flag-parse loop, the pin resolution, and the pin check in shape;
  change only the script name in messages.

## Unit 4 — clear-park / resolve-park functional test cases, including repo targeting

**Recommended model**: `opus`

**Dependencies**: Unit 2 (the `--expect` wiring the happy-path cases exercise)
and Unit 3 (the `--base` cases).

**Scope**

Single file: `packages/intentionsutil/scripts/test-park-node.sh`. This harness is
already registered in CI at `.github/workflows/unit-tests.yml:206-207`, so
extending it needs **no** workflow change. Do not create a new harness file.

Harness plumbing to add first:

- `CP_SCRIPT="$HARNESS_DIR/clear-park"` plus an existence check, mirroring
  test-park-node.sh:97-105; copy it into the seed at
  `packages/intentionsutil/scripts/clear-park` and `chmod +x`, mirroring
  test-park-node.sh:130-138.
- New seed node ids appended to the loop at test-park-node.sh:160:
  `t-clear-happy t-clear-noop t-clear-rollback t-clear-pinned t-clear-cwd
  t-resolve-cwd`.
- `run_cp()` mirroring `run_pn` (test-park-node.sh:321-332), running
  `bash packages/intentionsutil/scripts/clear-park "$@"` with the same PATH
  shim and `GRAPH_COMMIT_*` exports.
- **npx-shim extension.** clear-park's helper is invoked as
  `npx tsx <helper> <store> <dir> <id>` — 5 args, the same shape as
  resolve-park's two helpers, so it already falls into the `$# -eq 5` branch at
  test-park-node.sh:268-286 and is routed by the
  `grep -q 'cleared office_hours' "$helper"` test at test-park-node.sh:271
  (clear-park's helper body contains `clear-park: cleared office_hours on ${id}`,
  clear-park:144). What the shim does **not** emulate is clear-park's
  not-parked → `process.exit(3)` branch (clear-park:138-141). Extend that shim
  branch: treat the node as parked iff the LAST line matching `^office_hours`
  in the file is not `office_hours: null` (use the same `grep | tail -1` idiom
  the shim already uses for `execution_pr` at test-park-node.sh:280-282); when
  not parked, print the not-parked message to stderr and `exit 3`; otherwise
  append `office_hours: null` as today. Both resolve-park helpers must keep
  working — re-run the whole harness, not just the new cases.

New cases (number them 16+, and add matching entries to the "Covers:" list at
test-park-node.sh:26-85). Each gets its own `make_clone` unless noted.

- **16 — clear-park happy path.** `run_pn` to park `t-clear-happy`,
  `sync_clone`, then `run_cp <clone> t-clear-happy 'note'`. Assert exit 0,
  `origin_show t-clear-happy` contains `office_hours: null`, and
  `git -C <clone> status --porcelain -- intentions/` is empty.
- **17 — clear-park idempotent no-op restores the tree.** Re-run `run_cp` on the
  now-cleared node. Assert exit 0, stderr contains `nothing to do`,
  `origin_sha` unchanged, and `git -C <clone> diff -- intentions/t-clear-happy.md`
  is empty. This is the explicit restore-before-exit-0 path at clear-park:150-157
  — the refresh overwrote the file and the no-op branch must undo it.
- **18 — clear-park byte-identical rollback when graph-commit fails.** Use the
  wrapper-swap technique from case 2 (test-park-node.sh:411-443): move the
  clone's `graph-commit` aside and drop in a stub that `exit 1`s, then
  `git add` + `git commit` the swap so the tree is clean before the run. Park
  `t-clear-rollback` first (via a clone with the real graph-commit), then run
  `run_cp` in the stubbed clone. Assert exit 1, stderr names the rollback, and
  `git -C <clone> diff -- intentions/t-clear-rollback.md` is empty — byte
  identical, mirroring case 4's assertion style.
- **19 — clear-park `--base` pin.** Park `t-clear-pinned`, `sync_clone`, capture
  `pin="$(git -C "$ORIGIN" rev-parse main:intentions/t-clear-pinned.md)"`.
  (a) matching pin: `run_cp <clone> --base "$pin" t-clear-pinned` → exit 0,
  cleared on origin. (b) stale pin: reuse the now-stale `$pin` on a second
  invocation → exit 3, stderr contains `stale-diagnosis`, `origin_sha`
  unchanged, and `git -C <clone> diff -- intentions/t-clear-pinned.md` empty.
  Model on cases 12-13 (test-park-node.sh:654-691).
- **20 — clear-park repo targeting: cwd is a DIFFERENT checkout.** The case
  the whole node exists for. Park `t-clear-cwd` from clone `X`. Make a second
  clone `Y` and a plain non-repo `mktemp -d`. Invoke **clone X's** clear-park
  by absolute path (`bash "$X/packages/intentionsutil/scripts/clear-park"
  t-clear-cwd`) from a subshell whose cwd is `Y`, and again from the non-repo
  dir, with the same PATH/env exports `run_cp` sets. Assert for each: exit 0,
  `origin_show t-clear-cwd` shows `office_hours: null`, and
  `git -C "$Y" status --porcelain -- intentions/` is empty (the divergent-cwd
  checkout was never written). Model the out-of-clone invocation on
  test-graph-commit.sh case 25 (test-graph-commit.sh:995-1020), which does the
  same trick for `-C`.
- **21 — resolve-park repo targeting.** Same construction against
  `t-resolve-cwd`: park it with `--pr 3003` from clone `X`, `sync_clone`, then
  invoke clone X's `resolve-park` by absolute path with `--ratify` from clone
  `Y`'s cwd. Assert exit 0, `ready 3003` recorded in the `GH_LOG` file, origin
  shows `office_hours: null`, and clone `Y`'s `intentions/` is clean.

Cases 20 and 21 are regression guards on the already-landed `-C` fix
(clear-park:181, resolve-park:188): to see them fail, temporarily delete
`-C "$REPO_ROOT"` from one call site, confirm the case goes red, then restore
it. Do that check during implementation — a guard that cannot fail is not a
guard. Do not commit the temporary deletion.

**Out of scope**

- Modifying or weakening any existing case 1-15. If one goes red after the shim
  extension, fix the shim, not the case.
- `.claude/skills/dispatch-propagate/scripts/test-graph-write-rollback.sh` — it
  covers a different set of writers; run it as a regression check but do not
  add clear-park cases there.

**Reuse**

- `packages/intentionsutil/scripts/test-park-node.sh` — `make_clone` (:191-202,
  note it symlinks the real repo's `node_modules` into each clone; see
  `tactic-test-park-node-deps-precondition-guard`), `run_pn` (:321-332),
  `run_rp` (:334-346), `origin_show` / `origin_sha` / `sync_clone` /
  `edit_line` (:314-319), the `gh` and `npx` PATH shims (:220-311), and the
  `ok` / `no` counters (:113-114).
- `packages/intentionsutil/scripts/test-graph-commit.sh:995-1020` (case 25) —
  the pattern for invoking a script that lives in one clone from a cwd that is
  a different clone.

## Verification

Run the full shell harnesses. They need only bash, git, and jq plus the repo's
`node_modules` (already present in the worktree); no network and no real `gh`.

```verify
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && packages/intentionsutil/scripts/test-graph-commit.sh
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && packages/intentionsutil/scripts/test-park-node.sh
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && packages/intentionsutil/scripts/test-transition-node.sh
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && packages/intentionsutil/scripts/test-hold-node.sh
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && .claude/skills/dispatch-propagate/scripts/test-graph-write-rollback.sh
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && .claude/skills/dispatch-propagate/scripts/run-lint.sh
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && npx tsx packages/intentionsutil/scripts/validate-graph.ts
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && npx vitest run --project packages/intentionsutil --root .
```

Notes on the verify list:

- `test-hold-node.sh` and `test-transition-node.sh` are included because
  `hold-node`, `resolve-hold`, and `apply-node-transition.ts` all drive the same
  `graph-commit` binary Unit 1 changes; they must stay green with no `--expect`
  passed (the opt-in guarantee).
- `run-lint.sh` enforces the `.claude/rules/shell-json.md` rule on net-new added
  lines in committed `.sh` files. `test-park-node.sh` is a `.sh` file, so any
  new line there must not pipe a captured JSON variable through `echo` into
  `jq` — use `jq <<<"$VAR"` or `printf '%s'`. The extensionless wrapper scripts
  (`clear-park`, `park-node`, `resolve-park`, `graph-commit`) are not `.sh`
  files and are not scanned, but follow the rule anyway.
- No new test file is created, so `.github/workflows/unit-tests.yml` needs no
  edit. Confirm this by checking that
  `.github/workflows/unit-tests.yml:206-211` still names
  `test-park-node.sh` and `test-graph-commit.sh` and that no new harness file
  was added.

Manual checks that are not auto-runnable:

- **Guard-can-fail check (Unit 1).** Temporarily comment out the
  `assert_expected_content` call in `main()`, re-run
  `test-graph-commit.sh`, and confirm the new case 34 goes red. Restore the
  call. If case 34 passes with the guard removed, the case is not constructing
  the equal-blob geometry and must be rewritten.
- **Guard-can-fail check (Unit 4).** As described in Unit 4: temporarily remove
  `-C "$REPO_ROOT"` from clear-park:181, confirm case 20 goes red, restore.
- **Wrapper smoke, real repo.** Do NOT run `clear-park` / `park-node` against
  the real `origin/main` to test — they land commits. Confidence that the
  wrappers still work end-to-end comes from the harness cases, which execute the
  real scripts against a throwaway bare origin.
- **Judgment call to record in the PR body.** State whether the `--base`
  parser was generalized via nameref or duplicated for `--expect`, and confirm
  that no caller other than `park-node`, `clear-park`, and `resolve-park` passes
  `--expect`.
