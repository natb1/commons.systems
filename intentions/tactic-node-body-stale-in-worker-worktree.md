---
id: tactic-node-body-stale-in-worker-worktree
kind: tactic
statement: a worker's worktree pins `intentions/` at provision time and nothing
  re-syncs it mid-session, so any edit to the worker's own node landed after
  provisioning is invisible to that worker — and because /align-tactics finishes
  by writing the plan's body_markdown wholesale, a stale-based write replaces
  the newer body rather than merging with it, discarding the landed edit with no
  error at the point of loss
owner: ai
status: codified
parent: null
rationale: "Found 2026-07-31 by direct observation, and caught before it landed.
  A node was filed at 12:42:45 (9980d695), the fleet provisioned a worktree for
  it at 12:47:22, and a corrected scope for the same node landed at 13:02:43
  (e2b2198b) — fifteen minutes after provisioning. The worker had by then spent
  twenty-four minutes authoring a 771-line plan against the superseded body, had
  already run write-node.ts over the frontmatter, and its next step was to
  replace the body with the plan's body_markdown. It was stopped in that window;
  origin/main was verified still carrying the correction. Nothing in the
  pipeline had reported a problem at any point. This is the same mechanism as
  tactic-node-worker-fresh-skill-body — a worktree is a snapshot, and the worker
  reads its own checkout rather than main — but applied to NODE bodies rather
  than skill bodies, and nothing tracks that variant. It is the more destructive
  of the two for a specific reason: a stale skill body makes a worker behave as
  an older version of itself, which is recoverable, whereas a stale node body
  feeds a wholesale body write. body_markdown is not merged into the existing
  body; it replaces it. So the newer content is not conflicted, not flagged, and
  not preserved — it is overwritten by a plan that never knew it existed. What
  makes this worth tracking rather than filing under operator caution is where
  the protection sits. The --base CAS would probably have caught this instance,
  because the base manifest was dumped from the stale working tree and dump-node
  computes its token from the working tree; graph-commit would then have found
  the base unfresh against origin/main and parked the write. But that is a guard
  at the wrong layer and with the wrong outcome. It fires at land time, after
  the plan has been authored and the body already overwritten locally, and its
  success case is a parked write for a human to clear rather than a preserved
  edit. There is no check at the point where the loss actually occurs, which is
  the body write itself. And the failure it guards against is silent at every
  earlier stage: the worker cannot tell that its node changed underneath it,
  because nothing tells it. That places this in the class the bootstrap plan
  names — a path whose failure mode produces no signal where the signal is
  needed. Direction for planning, not a plan. The interim fix is to re-read the
  node from origin/main immediately before the body write and fail closed if it
  differs from the base snapshot, naming the intervening commit; a worker that
  discovers its node moved should re-plan or hand back, never overwrite. The
  general rule worth encoding alongside it: a wholesale body write must always
  be preceded by a freshness assertion against the same ref the write will land
  on. The greenfield answer is different and already exists as
  tactic-graph-ref-split, which moves intentions/ onto a dedicated graph branch
  and gives every worktree a symlink to one shared graph store instead of a
  private checkout. That collapses N per-worktree snapshots into one, so the
  question stops being whether each of N worktrees is fresh and becomes whether
  the single store is fresh — one question with one answer, and no divergence
  between workers to begin with. This node should be recorded as superseded by
  that migration, and kept alive until it lands, on the same reasoning the
  bootstrap plan already applied to the three other tactics ref-split
  supersedes: they are live silent-corruption defects today and the migration is
  weeks out behind a freeze and a drain. Interim attention scaffolding only —
  tactic-attention-tier-ranking replaces the numeric scheme with lexicographic
  (tier, rank) and max-lifting, and tactic-attention-boost-scripts converts
  these boosts to tier/bug_fix marks."
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
  rationale: "Bootstrap re-scale 2026-07-31: Wave A of the three-band interim
    scale (50 / 20 / 10) that puts write-path and pipeline-integrity work above
    ordinary feature work. Belongs in this band on the band's own criterion — it
    is a silent-content-loss defect on the graph write path, and the graph is
    the artifact the whole pipeline coordinates through. The one observed
    instance was caught only because a human happened to be watching the node it
    affected; the same race under an unattended fleet discards the edit and
    leaves a plan built on superseded intent, with the node reading as
    successfully planned. blocked_by is empty, so this promotion lifts no
    blocker and cannot compound."
phase: qa
execution:
  branch: tactic-node-body-stale-in-worker-worktree
  pr: 3005
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

# a worker's worktree pins `intentions/` at provision time and nothing re-syncs it mid-session, so any edit to the worker's own node landed after provisioning is invisible to that worker — and because /align-tactics finishes by writing the plan's body_markdown wholesale, a stale-based write replaces the newer body rather than merging with it, discarding the landed edit with no error at the point of loss

## Context

A worker's worktree is a **snapshot** of `intentions/` taken at provision time.
Nothing re-syncs it for the life of the session. So a worker's view of **its own
node** is frozen at spawn, and any edit landed afterwards is invisible to it.

`/align-tactics` finishes by writing the plan's `body_markdown` **wholesale** —
`writeNode` lands frontmatter only, and the body is replaced by a plain `Edit`
(`.claude/skills/align-tactics/references/write-path.md:104-113`). It is not
merged into the existing body; it replaces it. A stale-based write therefore
does not conflict, does not flag, and does not preserve — it overwrites a landed
edit the plan never knew existed, with **no error at the point of loss**.

Observed live on 2026-07-31 (memory `node-edit-races-worktree-provisioning`,
and the target node's own body):

| time | event |
|---|---|
| 12:42:45 | node filed — `9980d695` |
| 12:47:22 | fleet provisions the worktree, pinned at `9980d695` |
| 13:02:43 | **corrected scope lands** — `e2b2198b` |
| 12:47–13:11 | worker authors a 771-line plan against the superseded body |
| ~13:11 | frontmatter written via `write-node.ts`; next step is the body write |
| 13:14 | stopped in that window; `origin/main` verified intact |

Nothing reported a problem at any point in that sequence.

**Why the existing guards do not cover it.**

- `assert-worktree-fresh`
  (`.claude/skills/dispatch-propagate/scripts/assert-worktree-fresh:1-79`) is
  already mandated at `/align-tactics` Step 0
  (`.claude/skills/align-tactics/SKILL.md:103-119`), but it is **whole-tree and
  once-per-session**: `git rev-list --count HEAD..origin/main` at the moment the
  worktree is entered. When the worktree came from `provision-node-worktree` it
  is skipped entirely (that script cuts fresh from `origin/main`). Either way it
  cannot see an edit that lands twenty minutes later.
- `graph-commit --base` (`check_base_freshness()`,
  `packages/intentionsutil/scripts/graph-commit:464-529`) fires only at **land
  time** — after the plan has been authored and the body already overwritten
  locally. It no longer simply refuses: it attempts a structural three-way merge
  via `merge-node.ts`, where `body` is a synthetic scalar pseudo-field
  (`packages/intentionsutil/src/node-merge.ts:220-229`). base/ours/theirs all
  differ in this race, so the body conflicts and the node parks — a parked write
  for a human to clear, after a wasted authoring session, rather than a preserved
  edit. And when the base itself was captured wrongly, the same merge silently
  reverts instead of parking: memory
  `align-tactics-dump-node-after-edit-wipes-content` records a 310-line finalized
  plan body reverting to a 2-line draft stub on 2026-07-31 because
  `dump-node.ts` was re-run **after** the edit, so `base == ours` and the merge
  resolved cleanly to `theirs`.

**Intended outcome.** A check at the point of loss: immediately before the
wholesale body `Edit`, re-read the node from the same ref the write will land on
(`origin/main`) and fail closed if it moved since the base snapshot, naming the
intervening commit. A worker that discovers its node moved re-plans once or
hands back — never overwrites.

**Greenfield, and why this is not it.** The ideal design is
`tactic-graph-ref-split` (status codified, phase implement): move `intentions/`
onto a dedicated graph branch and give every worktree a symlink to **one shared
graph store** instead of a private checkout. That collapses N per-worktree
snapshots into one — the question stops being "is each of N worktrees fresh"
and becomes "is the single store fresh", one question with one answer and no
divergence between workers to begin with. That migration is weeks out behind a
freeze and a drain, and this is a live silent-content-loss defect on the graph
write path today. **Everything below is explicitly interim scaffolding, retired
when ref-split lands** — implementers should not grow it beyond the scope
below.

A second design was considered and rejected: a `PreToolUse` hook that refuses
any `Edit` to `intentions/*.md` from a stale worktree. It would be genuinely
non-skippable (unlike doctrine prose), but it puts a network `git fetch` on
every graph edit, false-fires on legitimate flows that deliberately hold
divergent content (conflict resolution, `merge-node` output, park writes), and
buys a mechanism whose whole point is superseded by ref-split. The chosen shape
— a detect-only script plus a doctrine ratchet test — is the same enforcement
posture the repo already uses for `assert-worktree-fresh`.

---

## Unit 1 — `assert-node-fresh`: a per-node, pre-write freshness primitive

**Scope.** Two new files; no existing file changes in this unit.

**New: `.claude/skills/dispatch-propagate/scripts/assert-node-fresh`** (bash,
`chmod +x`, `set -euo pipefail`).

Usage:

```
assert-node-fresh --base <manifest-path-or-id=blobsha> [--worktree <path>] <node-id> [<node-id> ...]
```

Structure, mirrored from `assert-worktree-fresh` verbatim:

- Header comment block in the same shape as
  `.claude/skills/dispatch-propagate/scripts/assert-worktree-fresh:1-26`: line 2
  is a one-line usage summary; then a multi-paragraph WHY/scope explanation;
  then an explicit "This is a DETECT-ONLY primitive" + sandbox-posture paragraph
  (it never merges, never writes, never runs a tree-updating git op; the
  read-only `git fetch origin main` to `github.com` is sandbox-allowlisted, so
  sandbox handling is purely a caller concern); then an `Exit-code contract:`
  block listing each code with a terse cause.
- `SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"` then
  `# shellcheck source=./lib.sh` / `source "$SCRIPT_DIR/lib.sh"`, exactly as
  `assert-worktree-fresh:28-30`.
- Argument parsing in the same usage-error shape as
  `assert-worktree-fresh:32-46` (exit 2 on a flag-shaped positional, an
  un-`cd`-able `--worktree`, a missing `--base`, no node ids, or a malformed
  `<id>=<blobsha>` pair).
- `--worktree` defaults to `$PWD`; `cd` there, exit 2 if that fails.
- Pre-flight `resolve_project_root >/dev/null 2>&1`
  (`.claude/skills/dispatch-propagate/scripts/lib.sh:1837`) purely to give a
  clear "not inside a git repository" error before the network fetch — exit 1,
  as `assert-worktree-fresh:48-52` does.
- All messaging (both the refusal and the up-to-date confirmation) goes to
  **stderr**; stdout stays free for future machine-readable output
  (`assert-worktree-fresh:65-73`).

`--base` parsing: accept either a literal `<id>=<blobsha>` pair or a path to a
manifest file of such pairs, one per line, blank lines ignored — the identical
convention `graph-commit`'s `parse_blob_arg()` / `add_blob_pair()` implement at
`packages/intentionsutil/scripts/graph-commit:364-395`. Copy that ~15-line
parser into this script (it is bash, populating a `declare -A BASE`), with a
comment naming `graph-commit:369-395` as the convention's home. Do **not** try
to `source` `graph-commit` — it is an executable with a `main()` and a
process-wide `EXIT` trap; sourcing it would run the landing machinery.
`--base` may be repeated.

Freshness algorithm (per named `<node-id>`), reusing exactly the two git
primitives `check_base_freshness()` uses at `graph-commit:467-477`:

1. Once, up front: `git fetch origin main`. Non-zero → exit 1 with
   "cannot verify freshness, refusing to proceed on unverified local state".
   Never treat a failed fetch as license to proceed.
2. `path="intentions/$id.md"`. If `git cat-file -e "FETCH_HEAD:$path"` succeeds,
   `origin_sha="$(git rev-parse "FETCH_HEAD:$path")"`; else the literal string
   `<absent>`. Use `FETCH_HEAD`, not `origin/main`, matching `graph-commit` — it
   is the ref this fetch just wrote and does not depend on a remote-tracking ref
   being configured in the worktree.
3. `recorded` = `BASE[$id]` if present, else the literal `<unrecorded>`.
4. Decide:

   | `recorded` | `origin_sha` | outcome |
   |---|---|---|
   | equal to `origin_sha` | — | **fresh** — continue |
   | `<unrecorded>` | `<absent>` | **fresh** — node created this round, has no origin blob and takes no `--base` entry |
   | `<unrecorded>` | a sha | **refuse** — pre-existing node with no `--base` entry; the write would land with no compare-and-swap at all |
   | a sha | anything else | **refuse** — the node moved on `origin/main` since the base was captured |

5. On a *moved* refusal, print the recorded sha, the current `origin_sha`, and
   **the intervening commit** — `git log -1 --format='%h %ad %s' --date=short
   FETCH_HEAD -- "$path"` — because naming it is what lets the caller decide
   whether to re-plan or hand back.
6. Check **every** named id before exiting, accumulating refusals, so one call
   names them all — the same reason `check_base_freshness()` keeps iterating
   after a divergence (`graph-commit:520-524`). Exit 1 once at the end if any
   refused; exit 0 with a stderr confirmation naming the count if none did.

**The one semantic that must not be got wrong** (call it out in the header
comment): this compares the **recorded base blob** against `origin/main` — it
**never** hashes the on-disk file. By the time it runs, the on-disk node has
already been rewritten by `write-node.ts` (frontmatter), so an on-disk hash
would differ for a completely benign reason and the guard would refuse every
round. Hashing on-disk content here would also be precisely the
`align-tactics-dump-node-after-edit-wipes-content` mistake, one layer earlier.

**New: `.claude/skills/dispatch-propagate/scripts/test-assert-node-fresh.sh`**
(`chmod +x`). Open with
`FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"` then
`source "$FIXTURE_DIR/dispatch-test-fixture.sh"`, exactly as
`.claude/skills/dispatch-propagate/scripts/test-assert-worktree-fresh.sh:6-8`.
Use `assert_eq`
(`.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh:36-48`) for
every assertion and end the file with `report_results`
(`dispatch-test-fixture.sh:50-60`) as the final call. Locate the real scripts
directory via the fixture-level `SCRIPT_DIR` (`dispatch-test-fixture.sh:18`) —
do not redefine it.

Fixture shape, copied from `test-assert-worktree-fresh.sh:15-64`:

- **No network.** `git init -q --bare -b main "$ANF_BARE"` reached only by local
  file path serves as `origin`; a normal working repo commits and pushes to it.
- Because the SUT derives `SCRIPT_DIR` from `$0` and sources `lib.sh` relative
  to it, **`cp` (never symlink)** both `assert-node-fresh` and `lib.sh` into a
  scratch `.claude/skills/dispatch-propagate/scripts` dir under the temp root —
  the reason is spelled out at `test-assert-worktree-fresh.sh:15-20`.
- Staleness is simulated by a **second local clone** of the same bare origin
  (`git clone -q "$ANF_BARE" "$ANF_CLONE"`) that edits and pushes, advancing
  `origin/main` without touching the worktree under test
  (`test-assert-worktree-fresh.sh:47-58`).
- Assert stderr details with the `case "$out" in *pattern*) … esac` idiom
  (`test-assert-worktree-fresh.sh:59-64`).

Required cases:

1. **fresh** — manifest sha equals origin's blob → exit 0.
2. **moved** — the second clone rewrites `intentions/<id>.md` and pushes → exit
   1, and the message contains that commit's short sha.
3. **on-disk edited, origin unmoved** — modify the worktree's
   `intentions/<id>.md` *after* capturing the manifest → still exit 0. This is
   the semantics guard for the "never hash on-disk" rule above; without it the
   guard would false-fire on every real round.
4. **created this round** — an id with no manifest entry and no file on origin →
   exit 0.
5. **unguarded pre-existing** — an id present on origin but absent from the
   manifest → exit 1, message contains a phrase naming the missing `--base`
   entry.
6. **unreachable origin** — `git remote add origin /nonexistent/…` → exit 1.
7. **usage** — no node ids → 2; flag-shaped positional → 2; missing `--base` →
   2.
8. **multi-id** — two ids, one moved and one fresh → exit 1 and the message
   names the moved id.

Clean up every temp dir at the end (`rm -rf`).

**Out of scope for this unit.** No changes to `graph-commit`, `dump-node.ts`,
`merge-node.ts`, or any `/align-tactics` skill file. No merge or auto-freshen
behavior — this is detect-only. No fleet-wide watchdog or alarm surface (that
territory belongs to `tactic-fleet-watchdogs-session-scoped`, currently parked).

**CI note.** The SUT lives inside
`.claude/skills/dispatch-propagate/scripts/`, so `run-unit-tests.sh`'s
`"$SCRIPTS"/test-*.sh` glob (`.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh:186-204`)
already picks this suite up when that directory changes — no
`.github/workflows/unit-tests.yml` entry is needed for it (this is why
`test-assert-worktree-fresh.sh` has none either). Unit 3's suite is different;
see there.

**Recommended model:** opus

---

## Unit 2 — Mandate the guard in the `/align-tactics` write path

**Scope.** Doctrine prose only — three files, no code. Every insertion point is
named below with a line anchor.

**(a) `.claude/skills/align-tactics/references/write-path.md:39-66` — "Capture a
base manifest for every pre-existing node this round edits."**

Add a short paragraph (and keep both existing `dump-node.ts` recipes exactly as
they are) stating:

- Capture the manifest at the session's **read** step — the strategy-target
  flow's "Gather the input" and the tactic-target flow's node read — **before
  any write to any node file**, not later in Step 2. The manifest's claim is
  "this is the content that was read"; a dump taken after `write-node.ts` or the
  body `Edit` records the writer's own in-flight content as the base.
- **Never re-run `dump-node.ts` in a worktree that already holds an edit**,
  including during a `graph-commit` timeout/`git reset --mixed` recovery. If the
  original manifest is lost, recompute the base directly as
  `git rev-parse origin/main:intentions/<id>.md` rather than re-dumping.
- Cite the concrete loss: on 2026-07-31 a re-dump after the edit made
  `base == ours`, so `check_base_freshness()`'s three-way merge resolved cleanly
  to `theirs` and silently reverted a 310-line finalized plan body to a 2-line
  draft stub, reporting nothing.

**(b) `.claude/skills/align-tactics/references/write-path.md:79-138` — the "Per
node (tactic or gate)" numbered sequence.**

Insert a new **item 2** between the current item 1 (frontmatter via
`write-node.ts`, lines 81-102) and the current item 2 (plan body via `Edit`,
lines 104-113). Renumber: body `Edit` becomes 3, `graph-commit` becomes 4, and
fix any in-text cross-references to the old numbers.

New item 2 says, in the file's existing voice:

> 2. **Freshness assertion before the body write.** The body write is a
>    *wholesale replacement* — `body_markdown` is not merged into the existing
>    body — so it must be preceded by a freshness assertion against the same ref
>    the write will land on. Run, from the worktree:
>
>    ```bash
>    .claude/skills/dispatch-propagate/scripts/assert-node-fresh \
>      --base "$BASE" <id> [<id> ...]
>    ```
>
>    naming **every** id this round will write a body for. Exit 0 means no
>    named node moved on `origin/main` since the base was captured — proceed.
>    A non-zero exit means the node moved (or the fetch failed, or a
>    pre-existing id is missing from `$BASE`): **do not write the body.** The
>    guard compares the recorded base blob against `origin/main`, never the
>    on-disk file, so the frontmatter `write-node.ts` just landed does not
>    trip it.

Then a disposition paragraph, satisfying the strategy's router-failure-
containment condition that every pass declares exactly one of progression,
bounded retry, or park — never a silent fourth exit:

> On a refusal naming a moved node, take **one** bounded retry: re-read that
> node from `origin/main` (`git show origin/main:intentions/<id>.md`), rebuild
> `args` from the fresh body, re-invoke the Workflow once, capture a **new**
> base manifest into a **fresh `--out-dir`** (never a second dump into the old
> one, and never a dump over an edited file), and re-run `assert-node-fresh`. If
> the second check also refuses, or the refusal is a fetch failure or a missing
> `--base` entry, **park** the node — `office_hours: {reason, since}` per the
> Parks section below — with a reason naming the intervening commit and
> recommending a fresh `/align-tactics <node-id>` round. Never overwrite, and
> never end the pass without one of these two dispositions.

**(c) `.claude/skills/align-tactics/references/tactic-target.md:107-115` — "Apply
the result via the write path."**

That paragraph narrates the same sequence in prose as
`dump-node.ts` (base manifest) → `write-node.ts` (frontmatter) → body `Edit` →
`graph-commit --base`. Insert `assert-node-fresh` between the frontmatter write
and the body `Edit` so the two flows — which explicitly share one writer — do
not diverge. Also add one sentence to the **read** step at
`tactic-target.md:34-73` mandating the single-node base-manifest dump there
(the single-node recipe already sits at `write-path.md:60-66`; point at it, do
not restate it).

**(d) `.claude/skills/align-tactics/SKILL.md`** — two narration sites carry the
same ordered sequence and must gain the new step:

- Line 46 (the `/align-strategy` inheritance bullet): `write-node.ts` → body
  `Edit` → `graph-commit` becomes `write-node.ts` → `assert-node-fresh` → body
  `Edit` → `graph-commit`.
- Lines 289-296 (Step 2's "The shape of the work, in order"): insert
  **assert** between **frontmatter** and the body `Edit`, one clause, and add
  `assert-node-fresh` to the "See `references/write-path.md` for the full …
  mechanics" list.
- In "Step 1 — Build `args`", at the "**Gather the input.**" paragraph
  (`SKILL.md:187-195`), add one sentence: dump the base manifest for every
  pre-existing node this round will edit **here**, at the read, pointing at
  `references/write-path.md`'s "Capture a base manifest" section for the recipe.

**Out of scope.** Do not extend the mandate to other wholesale-body writers
(`transition-node`, `qa-fix` needs-main residue, `park-node`/`clear-park`).
Those have their own sibling tactics
(`tactic-transition-node-needs-main-residue-clobbered`,
`tactic-qa-fix-node-terminal-declaration`) and the general rule is recorded in
the target node's body for them to pick up. Do not change `graph-commit`'s
land-time behavior. Do not add a `PreToolUse` hook (rejected in Context).

**Dependencies.** Unit 1 (the script must exist before doctrine mandates it).

**Recommended model:** sonnet

---

## Unit 3 — Doctrine ratchet so the mandate cannot silently regress

**Scope.** One new test file plus one CI wiring entry.

**New:
`.claude/skills/dispatch-propagate/scripts/test-align-tactics-write-path-freshness.sh`**
(`chmod +x`), modeled directly on
`.claude/skills/dispatch-propagate/scripts/test-fix-checks-cas-guard.sh:1-60` —
a prose/fenced-block guard over skill doctrine rather than a functional harness.
Same opening: `FIXTURE_DIR=…` → `source "$FIXTURE_DIR/dispatch-test-fixture.sh"`,
`assert_eq` for each assertion, `report_results` last. Resolve the repo root as
that file does: `GUARD_ROOT=$(cd "$SCRIPT_DIR/../../../.." && pwd)`.

Assertions (each a separate `assert_eq`, each with a `FAIL` when the target file
is missing rather than a silent skip — copy that pattern from
`test-fix-checks-cas-guard.sh:49-52`):

1. `.claude/skills/align-tactics/references/write-path.md` contains
   `assert-node-fresh`.
2. In `write-path.md`, the `assert-node-fresh` mention occurs **between** the
   `write-node.ts` invocation and the body-`Edit` item of the "Per node (tactic
   or gate)" section — assert on byte/line ordering within that section, not a
   file-global count, so the guard binds to the position that matters. (Header
   comment: a file-global occurrence count would let the totals stay correct
   while the step drifts to the wrong place — exactly the regression this
   exists to catch.)
3. `.claude/skills/align-tactics/references/tactic-target.md` contains
   `assert-node-fresh`.
4. `.claude/skills/align-tactics/SKILL.md` contains `assert-node-fresh`.
5. `write-path.md` states the refusal disposition — it mentions both a bounded
   re-plan and `office_hours` in the same section as `assert-node-fresh`.
6. The script `.claude/skills/dispatch-propagate/scripts/assert-node-fresh`
   exists and is executable.

Add the same "if this expectation legitimately changes, update this row **and**
confirm every site still carries the step — never drop a row to make the suite
green" comment `test-fix-checks-cas-guard.sh:43-46` carries. That comment is
load-bearing under `.claude/rules/test-integrity.md`.

**Edit `.github/workflows/unit-tests.yml`** — add one step to the `hook-tests`
job, in the block that begins with the comment at lines 197-208 ("The suites
below guard SUTs that live OUTSIDE `.claude/skills/dispatch-propagate/scripts/`
… Keep this list in sync when adding a suite whose SUT is outside that scripts
dir"):

```yaml
      - name: Run align-tactics write-path freshness doctrine ratchet
        run: .claude/skills/dispatch-propagate/scripts/test-align-tactics-write-path-freshness.sh
```

This entry is **required**: this suite's SUT is `/align-tactics` prose under
`.claude/skills/align-tactics/`, outside the scripts dir, so
`run-unit-tests.sh` only sets `RUN_PR_SCRIPTS=true` for changes under
`.claude/skills/dispatch-propagate/scripts/*` and a PR editing only the doctrine
would run nothing and merge green. Unit 1's suite needs **no** such entry (its
SUT is inside that dir) — do not add one.

**Out of scope.** No new lint rule; no changes to `run-unit-tests.sh`.

**Dependencies.** Units 1 and 2.

**Recommended model:** sonnet

---

## Reuse

- `.claude/skills/dispatch-propagate/scripts/assert-worktree-fresh:1-79` — the
  precedent freshness guard. Reuse its header-comment structure (usage line,
  WHY/scope prose, DETECT-ONLY + sandbox paragraph, exit-code contract block),
  its `SCRIPT_DIR` + `source lib.sh` preamble (lines 28-30), its
  argument-parsing/usage-error skeleton (lines 32-46), its `resolve_project_root`
  pre-flight (lines 48-52), and its stderr-only messaging convention
  (lines 65-73).
- `packages/intentionsutil/scripts/graph-commit:464-529`
  (`check_base_freshness()`) — the freshness comparison to mirror: `git fetch
  origin main`, then `git cat-file -e FETCH_HEAD:<path>` /
  `git rev-parse FETCH_HEAD:<path>` versus the recorded base blob, with the
  literal `<absent>` sentinel and check-every-entry-before-exiting behavior.
  Take the comparison only — **not** the merge/park machinery
  (`run_merge_node`, `park_and_exit`).
- `packages/intentionsutil/scripts/graph-commit:364-395`
  (`parse_blob_arg()` / `add_blob_pair()`) — the `<id>=<blobsha>`-or-manifest-path
  CLI convention for `--base`. Copy the parser (~15 lines); do not source
  `graph-commit`.
- `packages/intentionsutil/scripts/dump-node.ts:1-26` (header),
  `:54-58` (`hashNodeFile`), `:82-97` (`readManifest`), `:131-165` (`dumpNodes`)
  — the existing base-manifest producer and its `<id>=<blobsha>` /
  `base-manifest.txt` format. Unit 2 only relocates *when* it is called; the
  format, the merge-by-id semantics, and the tool itself are reused unchanged.
- `.claude/skills/align-tactics/references/write-path.md:39-66` — the two
  existing `dump-node.ts` recipes (multi-node and single-node tactic-target).
  Point at them; do not write new ones.
- `.claude/skills/dispatch-propagate/scripts/lib.sh:1837`
  (`resolve_project_root`) — the "am I inside a git repo" pre-flight.
- `.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh:18`
  (`SCRIPT_DIR`), `:36-48` (`assert_eq`), `:50-60` (`report_results`) — the one
  true harness for this test-file family.
- `.claude/skills/dispatch-propagate/scripts/test-assert-worktree-fresh.sh:6-8,
  15-20, 21-45, 47-64` — the sourcing convention, the physical-copy-not-symlink
  rationale, the local-bare-repo-as-origin no-network idiom, and the
  second-clone-pushes staleness simulation.
- `.claude/skills/dispatch-propagate/scripts/test-fix-checks-cas-guard.sh:1-60`
  — the doctrine-ratchet template for Unit 3 (repo-root resolution, missing-file
  FAIL instead of skip, per-site assertions rather than a global count, and the
  "never drop a row to go green" comment).
- `.github/workflows/unit-tests.yml:197-250` — the `hook-tests` list of suites
  whose SUTs live outside the dispatch scripts dir, and the comment explaining
  why membership is required.

---

## Verification

Auto-runnable:

```verify
bash -n .claude/skills/dispatch-propagate/scripts/assert-node-fresh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-assert-node-fresh.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-align-tactics-write-path-freshness.sh
```

Manual / judgment:

- **No false-fire on a clean round.** Run one real `/align-tactics <tactic-id>`
  round end to end. `assert-node-fresh` must exit 0 after `write-node.ts` has
  already rewritten the frontmatter, and the body write must proceed. A refusal
  here means the guard is hashing the on-disk file instead of the recorded base
  — the single most likely implementation error.
- **Refusal on a real occurrence** (the node's own exit criterion). In a scratch
  worktree: capture a base manifest for a node with
  `dump-node.ts --out-dir "$TMPDIR/dump" <id>`; from a *different* checkout land
  an edit to `intentions/<id>.md` on `origin/main`; then run
  `assert-node-fresh --base "$TMPDIR/dump/base-manifest.txt" <id>` in the first
  worktree. It must exit 1 and name the intervening commit's short sha. Confirm
  the body `Edit` is then **not** performed and one of the two dispositions
  (bounded re-plan, or `office_hours` park) is recorded on the node.
- **Fleet-level detect still fires** — the node's own machine-detect, run from
  the main checkout while a fleet is live; a hit is a worker planning against
  superseded intent, which is exactly the window this guard now closes at the
  write:

  ```bash
  git worktree list --porcelain \
    | awk '/^branch refs\/heads\//{sub(/^branch refs\/heads\//,""); print}' | sort -u \
    | while read -r id; do
        [ -f "intentions/$id.md" ] || continue
        git -C ".claude/worktrees/$id" diff --quiet origin/main -- "intentions/$id.md" \
          || echo "STALE-NODE-BODY $id"
      done
  ```

  Note for the implementer: run this in a subshell or use a loop variable other
  than `path` — `while read -r path` clobbers `$PATH` under zsh.
- **CI wiring is real.** After Unit 3, confirm
  `.github/workflows/unit-tests.yml` runs the doctrine ratchet in the
  `hook-tests` job (a PR touching only `.claude/skills/align-tactics/**` must
  execute it). Also confirm CI's `run-lint.sh` shellcheck/prose-lint pass is
  green for both new shell files.
- **Sandbox posture.** `assert-node-fresh` performs only `git fetch origin main`
  (allowlisted host) plus read-only `git cat-file`/`rev-parse`/`log`, and no
  tree-updating op, so it needs **no** `dangerouslyDisableSandbox`. Confirm it
  runs clean under the default sandbox; if an implementer finds themselves
  reaching for a sandbox override, the script is doing something it should not.
