---
id: tactic-dispatch-skill-input-contract
kind: tactic
statement: Give each dispatch-* skill a structured-params execution core with a
  node-id + derivation-script front door, replacing worktree-branch-name
  inference
owner: ai
status: codified
parent: null
rationale: "Surfaced in the 2026-07-18 /align-strategy interview recording the
  uniform dispatch-skill input contract (clarification 68). Generalizes
  /align-tactics's explicit node-id argument to every dispatch phase skill.
  Finalized as a BACKLOG tactic (off-path, low rank) per clarification 69:
  legitimate work, selectable only as slack once no higher-ranked round work
  remains."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: review
execution:
  branch: tactic-dispatch-skill-input-contract
  pr: 2923
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Give each dispatch-* skill a structured-params execution core with a node-id + derivation-script front door, replacing worktree-branch-name inference

### Context

Five dispatch phase skills — `implement`, `fix-checks`, `qa-fix`, `review-fix`, `qa-main` — each re-derive their target node id, target kind, and PR number by parsing the current git worktree's branch name (`basename "$(git rev-parse --show-toplevel)"` or `git rev-parse --abbrev-ref HEAD`, inconsistently across the five), even though the router (`dispatch-graph-execute`) already knows the node id at selection time and already passes it as a literal trailing argument in the spawn prompt (e.g. `/implement tactic-foo`) — an argument every one of these five skills currently ignores. `qa-fix` derives it **twice**, via two different and mutually inconsistent conventions. This hidden branch-name coupling makes target-resolution untestable except by physically checking out a correctly-named worktree, and means a human invoking a skill directly has no way to state the target explicitly in the invocation itself — only by having previously created/renamed a worktree to match (the front door below still requires the session to already be in the matching worktree, see the branch-match guard in Unit 1 — this removes the *hidden* coupling and makes it a testable, explicit assertion, not the worktree requirement itself). This unit of work gives each skill a thin front door — read the node-id argument, call a shared derivation script, bind the result — ahead of its existing execution-core logic (which now consumes bound parameters instead of re-deriving them), mirroring the pattern `align-tactics` (`.claude/skills/align-tactics/SKILL.md:39-52`, including its "no argument → stop" clause at lines 51-52) already uses for its own node-id argument.

### Design decisions locked for this PR

**Shared vs. per-skill derivation script — one shared script, narrowly scoped, not a per-phase param emitter.** The five skills' full parameter needs diverge too much to share one script that emits *everything* each phase needs (`qa-main`'s node lane never does a PR-by-branch lookup at all — it reads `execution.pr` from frontmatter directly; `fix-checks`/`qa-fix`/`review-fix` treat a missing PR as a hard error; `implement` tolerates a missing PR as "first run"; `qa-fix` alone needs an attempt-counter parsed from PR labels; `review-fix` alone needs a local `git merge-base`; `qa-main` alone parses a `## needs-main residue` body section). A single script branching on `--phase` to produce all of that would become exactly the "per-phase-branching mess" this open design question warned against. But there **is** a genuine, functionally-identical (not byte-identical — `implement` uses `$N`, the other three use `$BRANCH`), four-times-duplicated primitive: fetch `intentions/<id>.md` from `origin/main`, assert its `phase`, and (optionally) resolve the open PR via `gh pr list --head <id> --state open --json number --jq '.[0].number // empty'` (duplicated at `implement/SKILL.md:114`, `fix-checks/SKILL.md:59-60`, `qa-fix/SKILL.md:80`, `review-fix/SKILL.md:80`). Unit 1 below builds **one** shared script for exactly that primitive; every other phase-specific parameter (context-pack flags, `MERGE_BASE`, attempt-counter labels, residue parsing) stays exactly where it already lives today — inline prose calling already-existing tools — because pushing those into the shared script would be the DRY-for-its-own-sake mistake, not a reuse win.

**Router change (`dispatch-graph-execute`) — out of scope for this PR, deferred.** The router already spawns each phase with the bare node id in the prompt (`"$SKILL $id"`, `dispatch-graph-execute:179`) and a pre-provisioned worktree whose name equals that id (`provision-node-worktree`, `dispatch-graph-execute:172`) — this is exactly the front-door invocation shape this PR's five skills are being taught to actually use (today they ignore the passed id and re-derive it from the worktree name instead). Landing the front-door + derivation-script split therefore already fixes the router path's correctness with **zero changes to `dispatch-graph-execute` or its test** (`test-dispatch-graph-execute.sh` asserts only the outer `"$SKILL $id"` / `--cwd` / `--model` spawn contract, which does not change). Changing the router to pass fully-computed structured params instead of a bare id would require the router to duplicate the same derivation logic this PR is centralizing per-skill, would change the spawn-prompt shape from a plain string to something richer, and would force edits to all six of `test-dispatch-graph-execute.sh`'s assertion blocks — a materially larger, differently-shaped diff than "give five skills a front door," for a benefit (saving one cheap local shell-script round-trip per dispatch — no LLM cost) that is real but not load-bearing for correctness. This PR lands the five-skill restructure now; "router passes structured params directly" is an explicit, separately-scoped follow-up — naturally absorbed by `tactic-dispatch-skill-rename` (`blocked_by` this tactic, re-sweeping these same five skills after this PR merges) if it turns out to matter, or a fresh tactic otherwise. Do not add it to this PR's scope.

**Test coverage.** `test-dispatch-graph-execute.sh` needs no changes (see above — run it anyway as a regression check). The new shared script gets its own from-scratch unit-test script in the unit that introduces it, so "testable in isolation" (the point of this whole tactic) is backed by an actual test, not just an assertion.

**Mechanism for "explicit structured params" with no real function-call boundary.** Each of the five `SKILL.md` files gets a documented `## Parameters` section (the pattern `/implement-unit` already uses, `.claude/skills/implement-unit/SKILL.md:20-30`) naming the node-lane's structured inputs (`node_id`, `pr_num`, etc. — see each unit below). A short **front door** block above the existing steps binds these: it reads the node-id argument out of the invoking message the same way `/align-tactics` already does (`.claude/skills/align-tactics/SKILL.md:39-52` — proven to work when router-spawned via the identical `"$SKILL $id"` prompt shape), then invokes the shared derivation script and binds its output to the `## Parameters` fields. Everything below that point — today's "Steps" — is the **execution core**: it is edited only to stop re-deriving `$N`/`$TARGET_KIND`/`$PR_NUM`/`$NODE_MD` from git state and instead treat them as already-bound inputs, exactly the "params in, no git inference" shape `review-fix`'s own Workflow `args` object already demonstrates (`.claude/skills/review-fix/SKILL.md:412-430`). The front door still asserts the current branch equals the given node id (the derivation script does this, see Unit 1 step 2) — this is a cheap safety check, not a re-introduction of branch inference: identity now comes from the argument, the branch match is just a guard that the session is in the right worktree. The legacy `<N>-…` issue lane is untouched and undocumented by the new `## Parameters` table — it is out of scope everywhere in this plan.

**The legacy `case` split is preserved; only its node-lane arm is replaced.** Every one of the five skills' current branch-inference blocks is a `case "$BRANCH" in [0-9]*-*) ... ;; *) ... ;; esac` (or equivalent) with a legacy issue-lane arm (`TARGET_KIND=issue`) and a node-lane default arm (`TARGET_KIND=node`). In every unit below, "replace the branch-inference block with the front-door call" means: keep the `case` statement and its legacy `[0-9]*-*)` arm **byte-identical**, and replace only the default (`*)`) node-lane arm's body with the call to `dispatch-derive-node-target` (plus rebinding `N="$NODE_ID"; TARGET_KIND=node` as today) — never delete or restructure the legacy arm, and never collapse the `case` into an unconditional call. This matters mechanically: `dispatch-derive-node-target` rejects any id that isn't the lowercase-slug node-id shape (Unit 1 step 1/8), so it cannot serve a legacy `<N>-…` target at all — an unconditional replacement would delete the legacy lane outright. It also matters for this plan's own Verification requirement below that the legacy arm diff byte-identical against the pre-edit file. `qa-fix` has one additional wrinkle beyond this pattern — see Unit 4.

**Front-door output binding.** The derivation script's stdout sections bind to three variables the execution core reads by name, in place of everything the old block used to compute: `PR_NUM` (from the `PR:` line — `none` binds to an empty string, exactly as `PR_NUM` behaves today on a miss), `NODE_JSON` (the `=== NODE-JSON ===` section — a single-line compact JSON blob, read via `jq <<<"$NODE_JSON"`, never `echo | jq`), and `NODE_BODY` (the `=== NODE-BODY ===` section, replacing every downstream use of today's `$NODE_MD`). `$NODE_MD` itself no longer exists once a skill's front door is replaced. Grepping each of the five files for `NODE_MD` before editing shows the full set of references that need repointing — most are contained inside the branch-inference block being replaced (moot), but Units 2, 4, and 6 each have at least one *downstream* reference to `$NODE_MD` outside that block (a later Step reading the node body or a frontmatter field via the old variable) that this plan calls out explicitly in that unit's scope below — do not rely on a blanket find-and-replace, since the correct replacement (`$NODE_JSON` for a frontmatter field vs `$NODE_BODY` for body prose) differs per reference.

**Exit-code routing on `--pr-mode required`'s exit 4 (no PR found) is a preservation of each skill's current behavior, not a new design choice, and differs per skill.** `fix-checks` routes to its existing `office-hours-reason` escalation (Unit 3, unchanged from today). `qa-fix` and `review-fix` currently hard-stop with a plain `exit 1` error message when no PR is found (`qa-fix/SKILL.md:81-84`, `review-fix/SKILL.md:81-84`) — Units 4 and 5 preserve exactly that: the front door treats the derivation script's exit 4 as the same hard stop, printing the same message text those skills already print today, not a new escalation path. `qa-main` never requests a PR (`--pr-mode none`), so exit 4 cannot occur on that lane. `implement` uses `--pr-mode optional`, so exit 4 never fires for it either — a missing PR there is the legitimate "first run" case, not an error.

---

### Unit 1 — Add the shared node-target derivation script and its tests

**Scope.** New file `.claude/skills/dispatch-propagate/scripts/dispatch-derive-node-target`. Usage:

```
dispatch-derive-node-target <node-id> --expect-phase <phase> [--pr-mode none|optional|required]
```

(`--pr-mode` defaults to `none`.) Behavior:

1. Validate `<node-id>` against the node-id slug regex `dispatch-graph-execute` already uses (`^[a-z][a-z0-9]*(-[a-z0-9]+)*$`, `dispatch-graph-execute:121`) — usage error otherwise, exit 2. Require `--expect-phase` to be present and non-empty — exit 2 otherwise.
2. Consistency check: `CUR_BRANCH=$(git rev-parse --abbrev-ref HEAD)`; if it does not equal `<node-id>`, exit 2 with a message naming both values (this preserves the existing "session must already be in the target worktree" invariant every one of the five skills states today, now as an explicit assertion instead of an implicit assumption).
3. `git fetch origin main --quiet`; snapshot `intentions/<node-id>.md` from `origin/main` into a scratch directory via `git archive origin/main "intentions/<node-id>.md" | tar -x -C "$SNAP_DIR"` (mirrors `transition-node`'s snapshot-directory pattern, `.claude/skills/dispatch-propagate/scripts/transition-node:120-124`, rather than the fragile `git archive ... | tar -xO` + hand-written `sed -n 's/^phase: *//p'` every one of the five skills currently duplicates). If the archive/extract fails (path absent at `origin/main`), exit 1.
4. Read the node via the existing TypeScript primitives, reusing the exact idiom `transition-node:76-81` already uses:
   ```bash
   node --import tsx/esm -e '
     const { readNode, readNodeBody } = await import("<repo-root>/packages/intentionsutil/src/store.js");
     const id = process.argv[1];
     process.stdout.write(JSON.stringify({ node: readNode(process.argv[2], id), body: readNodeBody(process.argv[2], id) }));
   ' "$NODE_ID" "$SNAP_DIR/intentions"
   ```
   Never `echo "$VAR" | jq` this result — consume it with a here-string (`jq <<<"$JSON"`) per `.claude/rules/shell-json.md`, which `lint-prose-rules.sh` enforces in CI for net-new lines in committed `.sh` files.
5. Compare `.node.phase` to `--expect-phase`; mismatch → exit 3, with a message naming both.
6. Per `--pr-mode`:
   - `none` — skip PR resolution entirely (this is `qa-main`'s mode: its node lane never looks up a PR by branch head, it reads `execution.pr` from the node body instead).
   - `optional`/`required` — resolve `PR_NUM=$(gh pr list --head "$NODE_ID" --state open --json number --jq '.[0].number // empty')`; `required` with an empty result → exit 4.
7. On success (exit 0), emit to stdout, in the same plain-text-section convention `dispatch-context-pack` already uses (so the "detect no-PR by the `PR: none` line, never by exit code" idiom every skill already uses stays uniform):
   ```
   === NODE <node-id> ===
   PHASE: <phase>
   PR: <num>|none
   === NODE-JSON ===
   <compact JSON: the full readNode() frontmatter object — execution.pr, execution.markers, serves, status, owner, etc.>
   === NODE-BODY ===
   <raw markdown body via readNodeBody()>
   ```
   The `NODE-JSON` section exists specifically so downstream skills stop hand-parsing frontmatter with `sed`/`awk` (see Units 5 and 6 below) — that duplication is itself one of the fragility points this tactic replaces.

**Explicitly out of scope for this unit:** no changes to `dispatch-graph-execute` itself, no changes to `dispatch-context-pack`, no per-phase parameter logic (attempt counters, `MERGE_BASE`, diff/browser detection, residue parsing) — those stay in each skill's own front door in Units 2-6.

Also add a companion test script `.claude/skills/dispatch-propagate/scripts/test-dispatch-derive-node-target.sh` and wire it into CI: add one step to `.github/workflows/unit-tests.yml` immediately after the existing "Run dispatch-graph-execute tests" step (`run: .claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh`):
```yaml
      - name: Run dispatch-derive-node-target tests
        run: .claude/skills/dispatch-propagate/scripts/test-dispatch-derive-node-target.sh
```

**Recommended model:** sonnet — a well-specified new script following two already-established in-repo patterns (`transition-node`'s snapshot+`readNode` idiom, `dispatch-context-pack`'s plain-text section convention), with an explicit test-case list given below.

**Dependencies:** none.

Test cases for `test-dispatch-derive-node-target.sh` (reuse `test-lint-prose-rules.sh`'s `make_repo()`-style fixture — an ephemeral bare "origin" plus a working checkout with `origin` remote pointed at it — to get a real `origin/main` to `git fetch`/`git archive` against. Stub `gh` via a real `PATH` shim script (a small executable named `gh` placed earlier on `$PATH` than the real one) — this is a different mechanism from `test-dispatch-graph-execute.sh`'s `dispatch-spawn-job` stub, which that test resolves via its own `$SCRIPT_DIR`/`SUT_DIR`, not `PATH`; `gh` here is invoked by bare name from inside the new script, so it needs a genuine `PATH`-based shim):

1. Node id absent from `origin/main` → exit 1.
2. Node present, `phase` differs from `--expect-phase` → exit 3.
3. Node present, phase matches, `--pr-mode none` → exit 0; output has `PR: none` and no `gh` invocation occurs (assert the `gh` stub was never called).
4. Node present, phase matches, `--pr-mode required`, `gh` stub returns empty → exit 4.
5. Node present, phase matches, `--pr-mode required`, `gh` stub returns a number → exit 0; output's `PR:` line carries that number; `NODE-JSON`'s `.phase` matches; `NODE-BODY` contains the fixture body text verbatim.
6. Node present, phase matches, `--pr-mode optional`, `gh` stub returns empty → exit 0, `PR: none`.
7. Current branch does not equal the given node id → exit 2.
8. Malformed node id (e.g. contains an uppercase letter or underscore) → exit 2.

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-derive-node-target.sh
```

---

### Unit 2 — Restructure `implement`

**Scope.** `.claude/skills/implement/SKILL.md` (453 lines):
- Insert a `## Parameters` section immediately before `## Idempotency preamble` (line 25), documenting the node lane's structured inputs: `node_id`, `pr_num` (may be empty on a first run — this lane is the one skill of the five that tolerates that).
- Within the branch-inference `case` block (lines 36-61), preserve the legacy `[0-9]*-*)` arm (lines 38-42: `N="${BRANCH%%-*}"; TARGET_KIND=issue`) byte-identical (see "The legacy `case` split is preserved" in Design decisions above). Replace only the node-lane default arm's body with a call to `dispatch-derive-node-target "$id" --expect-phase implement --pr-mode optional`, binding its output to `$PR_NUM`/`$NODE_JSON`/`$NODE_BODY` (parsed via the `PHASE:`/`PR:` plain-text lines exactly as `dispatch-context-pack` output is parsed elsewhere in this file), and setting `N="$NODE_ID"; TARGET_KIND=node` as today.
- In the **Node lane** prose, remove the now-redundant inline `gh pr list --head "$N"` call at line 114 — `PR_NUM` is now bound by the front door. Repoint the **plan-source note** (line 83, which currently reads "the node body ... already read at the Step-0 gate as `$NODE_MD`") to `$NODE_BODY` instead — `$NODE_MD` no longer exists once the front door binds `$NODE_JSON`/`$NODE_BODY` in its place, and this is the one downstream (non-branch-inference-block) reference to `$NODE_MD` in this file. The rest of the surrounding prose (context/PR skip-issue-comment note, completion, escalation) is unchanged except that it now reads `$PR_NUM` as an already-bound value instead of "resolve by branch head."
- Everything from `## Steps` onward (line 201 to end: plan reading, unit building, verification, PR opening via `dispatch-open-pr` at line 348, phase-log/marker writing) is **unchanged** — it already consumes `$N`/`$TARGET_KIND`/`$PR_NUM` by name, and those names are still bound the same way, just earlier and by the derivation script instead of by inline `gh`/`git archive`.
- Explicitly out of scope: the legacy issue lane (the `TARGET_KIND=issue` branch and its `dispatch-read-plan`/`dispatch-check-blockers` blocker-recheck) — untouched.

**Recommended model:** opus — the file is long with many downstream references to the preamble's bound variables; a wrong edit silently changes autonomous re-entry/marker semantics rather than failing loudly.

**Dependencies:** Unit 1.

---

### Unit 3 — Restructure `fix-checks`

**Scope.** `.claude/skills/fix-checks/SKILL.md` (463 lines; this file has no separate "Idempotency preamble" heading — its target-resolution block sits directly under `## Steps`, line 20):
- Insert `## Parameters` immediately before `## Steps` (line 20): `node_id`, `pr_num` (required — `fix-checks` never runs without an open PR).
- Within the branch-inference `case` block (lines 37-56, the "Target resolution — keyspace split" bash block), preserve the legacy `[0-9]*-*)` arm (lines 40-41: `N="${BRANCH%%-*}"; TARGET_KIND=issue`) byte-identical. Replace only the node-lane default arm's body with the front-door call: `dispatch-derive-node-target "$id" --expect-phase fix --pr-mode required`, binding `$PR_NUM`/`$NODE_JSON`/`$NODE_BODY` and setting `N="$NODE_ID"; TARGET_KIND=node` as today. On exit 4 (no PR found), route to the existing `office-hours-reason` escalation this skill's node lane already defines for that exact case (lines 63-65) rather than inventing new error text (see "Exit-code routing" in Design decisions above).
- In the **Node-target lane** prose (lines 58-80) and Step 1, remove the restated inline `gh pr list --head` one-liner (lines 59-60) — `PR_NUM` is now bound by the front door; Step 1's `dispatch-context-pack "$PR_NUM" --pr --pr-is-number` call (line 94) is unchanged, it already consumes `$PR_NUM` by name.
- Steps 2-9 (accumulator, failed-check reading, reproduce/classify, flake handling, attempt-counter labels, marker) are **unchanged**.
- Explicitly out of scope: the legacy issue lane branch (the `[0-9]*-*` case arm and every `TARGET_KIND=issue` branch throughout).

**Recommended model:** opus — same reasoning as Unit 2; this file additionally has flake-dedup and needs-human escalation logic whose exit paths must keep binding the same `$N`/`$PR_NUM`.

**Dependencies:** Unit 1.

---

### Unit 4 — Restructure `qa-fix` (and unify its duplicated, inconsistent branch inference)

**Scope.** `.claude/skills/qa-fix/SKILL.md` (1523 lines):
- Insert `## Parameters` immediately before `## Idempotency preamble` (line 57): `node_id`, `pr_num` (required).
- This file currently derives the target **twice**, inconsistently: the idempotency-preamble copy (lines 65-88, `case` split on `git rev-parse --abbrev-ref HEAD`, legacy arm at lines 68-71: `N="${BRANCH%%-*}"`) and the Step-0 "Target resolution" copy (lines 173-193, `case` split on `basename "$(git rev-parse --show-toplevel)"`, its own separate legacy arm). Keep **one** `case` statement — the idempotency-preamble copy — preserving its legacy `[0-9]*-*)` arm (lines 68-71) byte-identical, and replace only its node-lane default arm's body with a call to `dispatch-derive-node-target "$id" --expect-phase qa --pr-mode required`, binding `$PR_NUM`/`$NODE_JSON`/`$NODE_BODY` and setting `N="$NODE_ID"; TARGET_KIND=node` as today. Delete the Step-0 copy (lines 173-193) **entirely** — both its legacy and node arms — since by the time Step 0 runs the preamble copy above has already bound the target once; a second `case` split here was always redundant, not an independent lane needing its own preservation. Step 0 becomes "target already resolved by the front door above; see `## Parameters`". This is a genuine bug fix, not just a refactor: the two existing copies use different git primitives and could in principle disagree.
- Every other read of `$PR_NUM`/`$N`/`$TARGET_KIND` in the idempotency preamble (labels line, `ATTEMPT_N` computation lines 111-127, `dispatch-stamp-session`, `PRIOR_SUMMARY`/`PRIOR_PHASE_LOG` reads) is unchanged — it already consumes these by name.
- **Repoint the one downstream `$NODE_MD` reference outside both branch-inference copies:** line 311 ("the acceptance-criteria role `--issue` plays on the legacy lane is filled by `$NODE_MD` (the node body, already read at Step 0)") must become "already read by the front door above" and read `$NODE_BODY` instead of `$NODE_MD` — `$NODE_MD` no longer exists once the Step-0 copy that produced it is deleted.
- The rest of `## Steps` (line 154 onward) — merge, browser detection, the Step-3.5 disposition Workflow, auto-fix lane — is **unchanged** except for that one line-311 repoint; the Workflow's own `args` object already presupposes `pr_num`/`issue_num` are resolved, so nothing else there needs to change.
- Explicitly out of scope: the legacy issue lane arm preserved in the idempotency-preamble `case` statement — its behavior is untouched, only the node-lane derivation is consolidated and the redundant Step-0 copy removed.

**Recommended model:** opus — this is the highest-risk unit of the five: it is the longest file, has two divergent copies of the same logic to reconcile (real risk of accidentally preserving the wrong one or introducing a third inconsistency), and feeds a Workflow tool invocation whose `args` shape must not change.

**Dependencies:** Unit 1.

---

### Unit 5 — Restructure `review-fix`

**Scope.** `.claude/skills/review-fix/SKILL.md` (1143 lines):
- Insert `## Parameters` immediately before `## Idempotency preamble` (line 33): `node_id`, `pr_num` (required).
- Within the branch-inference `case` block (lines 43-62), preserve the legacy arm (lines 45-46) byte-identical. Replace only the node-lane default arm's body with the front-door call: `dispatch-derive-node-target "$id" --expect-phase review --pr-mode required`, binding `$PR_NUM`/`$NODE_JSON`/`$NODE_BODY` and setting `N="$NODE_ID"; TARGET_KIND=node` as today. On exit 4 (no PR found), preserve the existing hard-stop behavior (see "Exit-code routing" in Design decisions above) rather than inventing a new escalation.
- In the `PACK_TARGET`/`PACK_FLAGS` case block, remove the node-lane's inline `gh pr list --head "$BRANCH"` call (line 80) — `PR_NUM` is now front-door-bound; `PACK_TARGET="$PR_NUM"` / `PACK_FLAGS=(--pr --phase-log --diff --pr-is-number)` stay unchanged.
- Replace the re-entry marker check's hand-rolled `awk` state machine (lines 189-195, which scans raw `NODE_MD` text for the `execution:`/`markers:`/`- reviewed` YAML shape) with a `jq` query against the derivation script's `NODE-JSON` section: `jq -e '.execution.markers // [] | index("reviewed") != null' <<<"$NODE_JSON"`. This directly replaces the fragility the file's own comment already flags by name (a bare `grep` for `reviewed` would false-match the node body, a `validates`/`serves` edge, or a rationale) with the structured field the derivation script now provides — in scope here as a direct, low-risk consequence of Unit 1's output shape, not separate gold-plating. This file is generally careful about not trusting untrusted PR-body text when parsing derived values (see its `MERGE_BASE`-vs-pack-header handling nearby, around lines 219-249, which cites #1522) — apply the same discipline: derive from `NODE-JSON`/`origin/main` state, never from anything that could echo attacker-controlled PR body text.
- Step 2's `args` object build (lines 412-430) and the rest of the Workflow invocation are **unchanged**.
- Explicitly out of scope: the legacy issue lane, Step 5's deferred-findings gh-vs-graph-node branching, and the `MERGE_BASE`/dependency-audit-baseline logic itself (#1522) — that is pre-existing, correct behavior this unit does not touch.

**Recommended model:** opus — the marker-check swap touches re-entry/idempotency logic in a long file where a mistake causes a silent double-run or a wrongly-skipped review pass rather than a loud failure.

**Dependencies:** Unit 1.

---

### Unit 6 — Restructure `qa-main`

**Scope.** `.claude/skills/qa-main/SKILL.md` (446 lines):
- Insert `## Parameters` immediately before `## Target lanes — legacy issue vs graph node` (line 29): `node_id` only (no `pr_num` — this lane resolves the source PR from `execution.pr` in the node frontmatter, never by branch-head lookup).
- Within the branch-inference `case` block (lines 35-61), preserve the legacy arm (lines 38-42) byte-identical. Replace only the node-lane default arm's body with the front-door call: `dispatch-derive-node-target "$id" --expect-phase main-qa --pr-mode none`, binding `$NODE_JSON`/`$NODE_BODY` (no `$PR_NUM` — `--pr-mode none`) and setting `N="$NODE_ID"; TARGET_KIND=node` as today.
- **Repoint both downstream `$NODE_MD` references outside the branch-inference block:** (1) line 79 ("Parse those fields straight from `NODE_MD` (already read above)" — the `## needs-main residue` section parsing) must read `$NODE_BODY` instead. (2) line 134-135 (the broken-path bug-tactic-filing bullet: "`serves` the same strategy the source tactic serves (read `serves` from `NODE_MD`)") must read the `.serves` field from `$NODE_JSON` (`jq -r '.serves[]' <<<"$NODE_JSON"`) instead — this is a frontmatter field, so it belongs on `NODE_JSON` not `NODE_BODY`, unlike the residue section which is body prose. The `execution.pr` read (used earlier in the node-target lane to identify the source PR) likewise comes from `$NODE_JSON` (`jq -r '.execution.pr' <<<"$NODE_JSON"`) instead of any ad hoc frontmatter parsing.
- Steps 1-6 (the **legacy issue lane**, starting at `## Steps` line 198, explicitly marked "LEGACY LANE ONLY") are **completely untouched** — this file already documents that the node lane skips the Step-1 `N`-derivation, so the legacy lane's own separate branch-derivation block (lines 204-217+) is a distinct, already-isolated code path this unit does not touch.

**Recommended model:** opus — same file-risk reasoning as the other four; the pass/broken/cannot-verify verdict-routing logic downstream must keep binding the same `$N`.

**Dependencies:** Unit 1.

## Reuse

- `readNode` / `readNodeBody` from `packages/intentionsutil/src/store.js`, and the `node --import tsx/esm -e '...'` invocation idiom, exactly as `transition-node:76-81` already uses them.
- `transition-node`'s origin/main snapshot pattern (`transition-node:120-124`, `git archive origin/main intentions | tar -x`) instead of each skill's current `git archive ... | tar -xO` + hand-written `sed` frontmatter scrape.
- The `gh pr list --head <id> --state open --json number --jq '.[0].number // empty'` one-liner already present at `implement/SKILL.md:114`, `fix-checks/SKILL.md:59-60`, `qa-fix/SKILL.md:80`, `review-fix/SKILL.md:80` — consolidated into Unit 1's script instead of kept as four copies.
- `dispatch-context-pack`'s plain-text section convention and its "detect no-PR by the `PR: none` line, never by exit code" idiom, for the new script's output format.
- `.claude/rules/shell-json.md`'s here-string `jq` idiom — required for the new script and for Units 5/6's `jq`-based frontmatter reads, since `lint-prose-rules.sh` enforces it in CI.
- `.claude/skills/align-tactics/SKILL.md:39-52` as the proven precedent for a Claude Code skill reading a node-id argument out of the invoking slash-command message.
- `.claude/skills/implement-unit/SKILL.md:20-30` as the `## Parameters` table precedent to replicate in each of the five skills.
- `.claude/skills/review-fix/SKILL.md:412-430` (the Workflow `args` object) as the existing "params in, no git inference" precedent in this codebase.
- `test-lint-prose-rules.sh`'s ephemeral bare-origin + working-checkout git fixture pattern, and `test-dispatch-graph-execute.sh`'s PATH-stub style, both reused for the new test script.

## Verification

Unit 1's own test suite is the only new automated coverage; Units 2-6 are prose-only changes to slash-command instruction files with no compiled artifact, so their verification is a combination of the regression checks below and a manual read-through.

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-derive-node-target.sh
.claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh
.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh
.claude/skills/dispatch-propagate/scripts/test-lint-prose-rules.sh
```

For each of Units 2-6, after editing, manually re-read the full modified `SKILL.md` end-to-end and confirm: (1) `grep -n NODE_MD` on the edited file returns **zero matches** — every reference this plan didn't explicitly call out has still been caught and repointed to `$NODE_JSON`/`$NODE_BODY` (a nonzero result means a dangling reference this plan missed); (2) every reference to `$N`, `$TARGET_KIND`, `$PR_NUM`, `$NODE_JSON`, and `$NODE_BODY` past the new front door resolves to a value the front door actually binds; (3) the legacy issue lane's `case` arm is byte-identical to before the edit (diff the pre-edit and post-edit file restricted to that arm's line range — for `qa-fix`, this means only the surviving idempotency-preamble copy's legacy arm, since the Step-0 copy is deleted outright, arms and all); (4) the new `## Parameters` section lists exactly the fields the front door binds and no others. There is no way to execute a `SKILL.md` directly in this environment (it is consumed by a live Claude Code session, not run as code), so this manual trace has no automated substitute — do not skip it in favor of the checks above, which only cover the shared script and the unrelated router contract.

Note for the implementing session: re-verify every `path:line` anchor above against the actual current file state before editing — these were captured against a specific commit and may have drifted by the time this tactic is implemented.
