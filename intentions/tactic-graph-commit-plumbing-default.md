---
id: tactic-graph-commit-plumbing-default
kind: tactic
statement: Flip GRAPH_COMMIT_WRITER's default from worktree to plumbing for
  every caller — adding a post-land residue clear so a landed write leaves no
  dirty node file, and confining the dirty-tree pre-flight guard to the
  now-explicit worktree arm — so unrelated dirt in any checkout cannot block or
  corrupt a graph write
owner: ai
status: codified
parent: null
rationale: "Surfaced by the 2026-08-14 /align round recording the
  write-independence and read-coherence invariant (strategy clarification 237).
  PR #3090 built and wired the plumbing writer but deliberately left the global
  default at worktree — 'a separate decision and a separate blast radius' — with
  dispatch-eval-finding the only opt-in caller. This is the unit that makes
  write independence hold for every writer, and it does NOT depend on
  tactic-graph-ref-split: assert_clean_outside_ids is a main()-level pre-flight
  (graph-commit:3793-3795, defined :3591) already conditional on
  GRAPH_COMMIT_WRITER == worktree and outside try_land(), so the flip makes it
  unreachable on the default path with no cutover and none of ref-split's 37
  blockers. The 2026-08-20 finalize round changed two things from the draft,
  both verified against origin/main 6ce8702d. (1) The guard is CONFINED to the
  explicit worktree arm rather than deleted: that arm stays selectable as the
  one-flag rollback for a change whose blast radius is every graph write in the
  fleet, and the guard is load-bearing for it, so deleting it belongs with
  removing the whole worktree arm — deferred, as the draft's own scope boundary
  already said. (2) The round measured that a successful plumbing land leaves
  the node file MODIFIED against HEAD (the writer never moves HEAD, which is the
  point), a residue only dispatch-eval-finding handles today via
  clear_node_residue; flipping the default without generalizing that clear
  inside graph-commit would recreate, from the fleet's own successful graph
  writes, the outage this writer exists to dissolve. The draft's claim that the
  guard is 'called from land()' was also wrong at this HEAD — it is called from
  main()."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

## Context

`graph-commit` has two writers, both wired in and both tested:

- `worktree` (today's default) commits by staging into the checkout's own index
  and then `git pull --rebase origin main`. Because a rebase refuses on a dirty
  tree, and because the tree-updating steps around it would *discard* unrelated
  dirt rather than report it, the worktree writer must refuse up front whenever
  ANY tracked file outside the invocation's node set is dirty
  (`assert_clean_outside_ids`).
- `plumbing` builds the identical tree with `read-tree` / `update-index` /
  `write-tree` against a THROWAWAY index and seals it with `git commit-tree`,
  parented on fresh `origin/main`. It touches neither the working tree nor the
  repo's `.git/index`, so an unrelated modified `flake.lock` is simply not its
  business.

The blind refusal is a live, recurring outage. On 2026-08-13/14 the author's own
modified `flake.lock` sat in the main checkout and `assert_clean_outside_ids`
failed EVERY write `dispatch-eval-finding` made — the per-phase evaluator's
entire write surface — silently, because `/rsi` is spawned fire-and-forget with
its transcript discarded. A whole ladder's evaluation was lost with no trace,
twice. That is the failure strategy clarification 237 generalized into the
standing WRITE INDEPENDENCE property: *no working tree a human may have touched
may affect whether a graph write succeeds, or what content lands in it.*

PR #3086 (`039bbe11`) built `build_commit_plumbing()` with tree-SHA equivalence
asserted against the working-tree writer across single-node edit, multi-node,
prune, mixed edit+prune, `RESURRECTED_IDS` exclusion, and unrelated-paths
carry-through. PR #3090 (`75d76e26`) wired it into `try_land()` and opted
`dispatch-eval-finding` in **per invocation** (never a process-wide export),
deliberately leaving the global default at `worktree`: "a separate decision with
a separate blast radius". Test counts at that commit: `test-graph-commit.sh`
107/107, `test-dispatch-eval-finding.sh` 155/155.

**This tactic is that separate decision.** It makes write independence hold for
every writer, and it does NOT depend on `tactic-graph-ref-split`: the guard is
already conditional on `GRAPH_COMMIT_WRITER == worktree` and sits outside
`try_land()`, so the flip needs no cutover and none of ref-split's 37 blockers
(23 still open). ref-split stays the ratified greenfield (clarification 80 limb
(a)); it is not the critical path for this invariant.

### Anchors verified against origin/main `6ce8702d` (2026-08-20)

`packages/intentionsutil/scripts/graph-commit` is **4012 lines**. The draft
body's anchors (`:3502` for the call site, `:3300` for the definition) were
stale and are corrected here. The draft also said the guard is "called from
`land()`" — **that is wrong at this HEAD**; it is called from `main()`. The
substantive point survives (it is outside `try_land()` and gated on the worktree
arm) and only that form should be repeated.

| Thing | Anchor |
| --- | --- |
| `GRAPH_COMMIT_WRITER="${GRAPH_COMMIT_WRITER:-worktree}"` | `graph-commit:418` |
| Plumbing-writer paragraph ("SKIPS three tree-mutating steps…") | `graph-commit:403-411` |
| "THE DEFAULT DELIBERATELY STAYS `worktree`…" paragraph | `graph-commit:413-417` |
| Writer-gate comment asserting "Unset resolves to `worktree`… this block is inert" | `graph-commit:3699-3706` |
| `assert_clean_outside_ids()` definition | `graph-commit:3591` |
| `_offending_path_is_marker_only_residue()` helper | `graph-commit:3559` |
| Guard call site, gated, inside `main()` (which begins `:3648`) | `graph-commit:3793-3795`, comment `:3778-3792` |
| Second worktree-only gate — `ensure_intentions_only_base` | `graph-commit:3863-3865`, comment `:3854-3862` |
| `GRAPH_COMMIT_WRITER` value validation (`worktree`\|`plumbing`, else `die`) | `graph-commit:3699-3710` |
| `sync_ids_to_rev <rev>` — path-scoped, worktree-only, never the index | `graph-commit:1872-1892` |
| `emit_verdict_and_exit <context>` — the single exit-0 chokepoint | `graph-commit:2432-2439` |
| Plumbing park path: `sync_ids_to_rev FETCH_HEAD` instead of whole-tree reset | `graph-commit:3346-3368` |
| `assert_staged_safe()` — worktree-only, transitively via `commit_files()` | `graph-commit:927`, called `:1570` |
| Prune-vs-concurrent-delete fail-closed divergence | `graph-commit:1779-1784` |
| Sole opt-in caller | `.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding:814`, comment `:771-798` |

### Two blast-radius findings the draft did not record

**(A) A successful plumbing land leaves the node file MODIFIED against HEAD.**
This is measured, not inferred. The plumbing writer never moves the checkout's
HEAD (that is the point), so after a verified land the on-disk node file carries
content that HEAD does not. `dispatch-eval-finding` is the only caller that
handles it, via `clear_node_residue()`
(`dispatch-eval-finding:866-915`), whose own comment states the consequence
exactly: a dirty tracked file "fails the DEFAULT writer's pre-flight guard for
every later graph-commit there, whatever node it targets, and an untracked one
makes `sync_main_checkout`'s `--ff-only` merge refuse". `sync_main_checkout`
(`.claude/skills/dispatch-propagate/scripts/lib.sh:2109-2113`) is a bare
`fetch` + `merge --ff-only`, called by `dispatch-tick:612`. **Flipping the
default without generalizing that residue clear would, from the fleet's own
successful graph writes, reproduce the outage this writer exists to dissolve** —
and would additionally leave node files dirty in worker worktrees where the next
`/implement-unit` commit could sweep them into a PR branch. Unit 1 fixes this
inside `graph-commit`, once, rather than re-deriving `clear_node_residue()` in
seventeen callers.

**(B) READ COHERENCE — clarification 237 property (2), generalized.** Once the
plumbing writer is universal, any caller that lands and then reads graph state
from its own working tree goes stale, because the checkout's HEAD never moved.
The open sibling `tactic-eval-finding-list-reads-working-tree-stale-after-plumbing-land`
(phase `implement`, `pace_exempt`) tracks exactly this for
`dispatch-eval-finding --list`, and its clarification 3 names this node
verbatim as the trigger. Unit 2 censuses the land-then-read-locally sites and
redirects the ones that would regress; the sibling itself stays **out of
scope** (it is actively worked) but is a landing-order coordination risk, named
in Verification.

### The design question, resolved

`worktree` remains an explicitly selectable value, validated at
`graph-commit:3699-3710` and covered by test case 67 (`:3128-3176`). So
`assert_clean_outside_ids` is inert only for callers that do not set the
variable; it is **not dead code**. Deleting it would silently change the
explicit-`worktree` arm's behavior: `check_base_freshness`'s layer-3 auto-merge
rewrites node files on disk *before* the rebase, so without the pre-flight that
arm would discard unrelated dirt instead of naming it.

**This plan takes option (a): flip the default, keep `worktree` selectable, and
keep `assert_clean_outside_ids` bound to that explicit arm.** Reasoning:

1. The guard is load-bearing for the arm that still exists. "Then-inert" is true
   of the default path only.
2. It buys a one-flag, no-deploy rollback (`GRAPH_COMMIT_WRITER=worktree`) for a
   change whose blast radius is every graph write in the fleet.
3. The guard's deletion belongs with the removal of the whole worktree arm
   (`commit_files`, `pull --rebase`, `rebase_in_progress`, orphan detection,
   `replay_snapshot_onto_base`, `ensure_intentions_only_base`,
   `assert_staged_safe`, and the header's ORPHANED LOCAL COMMITS recovery rule —
   whose claim that commit→push "CANNOT be made atomic" is true of the worktree
   design and false of the plumbing one). The draft's own Scope boundary already
   defers that, and this plan keeps the deferral.

**Consequence for the node's statement:** the statement's second limb ("delete
the then-inert dirty-tree pre-flight guard") is executed here as *confine the
guard to the explicit `worktree` arm* rather than *delete it*. This is a
deliberate, reasoned narrowing, surfaced for the author. The first limb — the
flip, and the write-independence property it buys — is delivered in full.

The second worktree-only gate, `ensure_intentions_only_base`
(`graph-commit:3863-3865`), is **left in place unchanged** for the same reason:
it stays reachable for explicit-`worktree` callers, and the far-ahead rebuild is
genuinely needed there (that writer's commit is made on top of the checkout's
HEAD, so a far-ahead HEAD produces a non-`intentions/`-only SHA the `graph/**`
fast path refuses to stamp).

**Prune (BLAST RADIUS #2).** `75d76e26` records one known behavioral difference,
fail-closed: a `--prune` id whose node a peer already deleted reads as a moved
blob and parks, where a rebase would have seen both sides delete and carried on.
Measured this round: **there is no scripted `graph-commit --prune` caller in the
repo.** Every `--prune` reference outside `graph-commit` and its test suite is
prose recommending a human- or skill-driven prune round
(`packages/intentionsutil/scripts/graph-census-debt.ts:161,167,230,288`). So the
divergence lands on hand-run and skill-run prune rounds, not on an automated
path. Test effort is scoped accordingly (Unit 4), and no caller change is needed.

**DO NOT TOUCH:** any file under `intentions/` (graph records, edited only
through the graph write path), and do not modify `tactic-graph-ref-split`'s plan.

---

## Unit 1 — Give the plumbing writer a post-land residue clear inside `graph-commit`

**Scope.** `packages/intentionsutil/scripts/graph-commit` only.

Add a residue clear that runs on the plumbing writer's **verified-landed** exit
and nowhere else:

- New function `clear_plumbing_residue()`, placed next to `sync_ids_to_rev`
  (`graph-commit:1872-1892`). It calls `sync_ids_to_rev HEAD` — bringing exactly
  this invocation's `ALL_IDS` node paths to the checkout's own HEAD content,
  touching nothing else, writing the working tree only and never the index. An
  id absent at HEAD (the mint path's net-new node) is removed, which is what
  `dispatch-eval-finding:909-916` already does by hand for the same reason: an
  untracked leftover is what an `--ff-only` sync collides with.
- Hook it in `emit_verdict_and_exit()` (`graph-commit:2432-2439`), immediately
  before `exit 0` in the `landed|landed-equivalent` arm, guarded on
  `[[ "$GRAPH_COMMIT_WRITER" == "plumbing" ]]` and on the new `--keep-residue`
  flag being unset. This one hook covers every exit-0 route — the ordinary
  landing (`graph-commit:3979-3996`), the `noop` short-circuit
  (`graph-commit:3944-3956`, which under plumbing is reached when the on-disk
  content already matches `origin/main` while HEAD lags, i.e. exactly a residue
  state), and `busy-exhausted` when the verdict nevertheless reads landed
  (`graph-commit:4000`).
- **HEAD, not `origin/main`**, and this is load-bearing: HEAD is what
  `git status`, every dirty-tree guard, and `merge --ff-only` compare against,
  and this checkout's HEAD may legitimately lag `origin/main`. The landed
  content is public on `origin/main` and arrives here whenever the checkout next
  syncs; the checkout is not the writer's state. This is
  `dispatch-eval-finding`'s recorded reasoning (`:889-892`) applied once, in the
  right place.
- Never on a failure path. `park_and_exit()` already owns its own path-scoped
  sync (`graph-commit:3353-3354`), and the callers own their rollbacks.
- New CLI flag `--keep-residue` (parsed alongside the existing flags in
  `main()`), which suppresses the clear. Pass it from exactly one caller in
  Unit 4's sweep: `packages/intentionsutil/scripts/land-align-round`, because an
  `/align`-family session authors node bodies on disk across a round and may
  re-read them, and reverting them to HEAD mid-round would silently discard the
  session's view of its own work. Every other caller writes one node once and
  exits.
- Rewrite the plumbing paragraph of the writer comment block
  (`graph-commit:403-411`) to state the residue property and its clear, so the
  header stops implying the plumbing writer leaves the caller's tree entirely
  alone in all respects.

Out of scope: touching the worktree arm, the guard, `ensure_intentions_only_base`,
or the default value (Unit 4 owns the default).

**Why this is safe** — the property Unit 2 confirms, stated here because a
reviewer will ask: after the clear, the on-disk node file shows **pre-land**
content until the checkout syncs. That is safe because every graph-write
primitive's recipe is *refresh the node from `origin/main` → mutate → land*
(`tactic-graph-write-recipes-base-cas`, done) rather than *read the local tree →
mutate*, and because
`packages/intentionsutil/scripts/restamp-scope-fingerprint.ts:18,139,156-171`
was already written for exactly this: its header names "`graph-commit`'s
land-then-restore, where the worktree no longer holds the content" and it reads
the committed text through `git show <rev>:<path>` with `--from-rev origin/main`.

**Tests** (in `packages/intentionsutil/scripts/test-graph-commit.sh`, appended as
new cases after case 83; assert **before** any `sync_clone`, which would mask
residue):

1. Plumbing land from a clone behind `origin/main`:
   `git status --porcelain -- intentions/` is EMPTY afterwards, and
   `origin_show <id>` carries the edit. (`git status --porcelain`, not
   `git diff` — it is what sees an index-vs-worktree mismatch and an untracked
   leftover, and it is what `merge --ff-only` and the guard actually consult.
   Same assertion shape as `test-park-node.sh` case 22, described at
   `test-park-node.sh:136-143`.)
2. Plumbing **mint** (net-new node, untracked at HEAD): the local file is gone
   afterwards and `git status --porcelain` is EMPTY.
3. Unrelated dirt survives the clear: repeat case 70's fixture (an appended line
   in `packages/intentionsutil/src/store.js`) and assert the dirt is still there
   after a landed plumbing write — the clear must be path-scoped to `ALL_IDS`.
4. `--keep-residue`: the node file is still modified against HEAD after a landed
   plumbing write.
5. The index is untouched: `git diff --cached --name-only` is empty after the
   clear (the same property case 66 pins for `build_commit_plumbing`).
6. Worktree writer unaffected: an explicit `GRAPH_COMMIT_WRITER=worktree` land
   still leaves HEAD moved and the tree clean.
7. `merge --ff-only` end-to-end: after a landed plumbing write from a clone
   behind `origin/main`, `git fetch origin main && git merge --ff-only origin/main`
   succeeds in that clone. This is the fleet property, asserted directly.

**Recommended model:** opus.

---

## Unit 2 — Census the land-then-read-locally call sites and redirect the ones that regress

**Scope.** Read-only census plus narrowly-targeted edits. Produces no change to
`graph-commit`.

Enumerate every site that invokes `graph-commit` and then, in the same process,
reads graph state from the local checkout rather than from `origin/main`. The
invocation sites, measured this round (grep `\$GRAPH_COMMIT`, `GRAPH_COMMIT_CMD`,
`scripts/graph-commit`):

`packages/intentionsutil/scripts/`: `park-node:424`, `clear-park:422`,
`hold-node:320`, `resolve-hold:416,463`, `resolve-park:207`, `arm-wait:351`,
`release-wait:368`, `demote-node-to-implement:254`, `land-align-round:228`.
`.claude/skills/dispatch-propagate/scripts/`: `dispatch-eval-finding:814` (the
sole opt-in), `dispatch-fleet-alarm:478`, `dispatch-graph-census:152`,
`dispatch-graph-main-red-sync:178`, `dispatch-invalid-state-followup:390,456`,
`dispatch-invalid-state-route:303`, `graph-select-target:524,656`,
`reconcile-graph-merged:350`, `reconcile-graph-review-stall:326`,
`transition-node:230`. Indirect (via `park-node`):
`lib-frozen-session-park.sh`, `lib-standdown-recheck.sh`,
`lib-stale-hold-recheck.sh`, `lib-wait-recheck.sh`,
`dispatch-graph-scope-sweep` (via `demote-node-to-implement`).

For each, classify and record in the commit message:

- **Safe — verdict/`origin/main` based.** Already confirmed by inspection this
  round and expected to need no change: `park-node:435-455` and
  `clear-park:432-455` (both discard `graph-commit`'s rc and ask
  `packages/intentionsutil/scripts/verify-landed`, which answers strictly from
  `origin/main`); `land-align-round:238-278` (parses `graph-commit`'s own
  `verdict:` stderr line); `transition-node:230-247` (`refresh_stamp` →
  `restamp-scope-fingerprint.ts --from-rev origin/main`);
  `dispatch-graph-main-red-sync:166` (per-node `git rev-parse
  origin/main:intentions/<id>.md` before each write);
  `reconcile-graph-merged` and `reconcile-graph-review-stall` (local
  enumeration happens once up front, exactly one land at the very end, no
  read-after-land); `graph-select-target` (selection reads
  `SNAPSHOT_DIR/intentions`, a per-tick snapshot, not the live checkout).
  Re-verify each rather than trusting this list.
- **Regresses — redirect.** Any site that reads `intentions/` from the local
  checkout after a land in the same process. Redirect it to
  `listNodesAtRef(repoRoot, "origin/main")` /
  `readNodeAtRef` — `packages/intentionsutil/scripts/lib-store-at-ref.ts:19-75`,
  built for precisely this ("a script that reads `intentions/` from its own
  checkout answers from whatever that worktree last synced … silently, with no
  signal that the answer is old"). Existing consumers to copy from:
  `packages/intentionsutil/scripts/office-hours-select.ts:381-395`,
  `packages/intentionsutil/scripts/read-sensors.ts:54,767`. Do **not** add a
  local `sync_main_checkout` call as the remedy — it is a tree-updating op with
  its own sandbox requirement (`.claude/rules/sandbox.md`) and it would not fix
  a worker worktree.
- **Cross-step, within one tick.** Check `dispatch-tick` and
  `dispatch-select-tick` for a step that lands a graph write and a *later* step
  in the same run that reads `./intentions` locally. Today the worktree writer
  advances the main checkout's HEAD, so later steps see earlier writes for free;
  under plumbing they will not. `sync_main_checkout` at `dispatch-tick:612` runs
  once at the drain, not between steps.
- **Out of scope, named:** `dispatch-eval-finding --list`. Its stale-read is
  already tracked by
  `tactic-eval-finding-list-reads-working-tree-stale-after-plumbing-land` (phase
  `implement`), with the recorded fix shape being `listNodesAtRef` replacing the
  tolerant `listNodes($INTENTIONS_DIR)` (`packages/intentionsutil/src/store.ts:232`),
  gated on `origin_main_ref_ok`. Do not duplicate that work here; do record the
  landing-order dependency in this unit's commit message.

Edits are expected to be few or none. If the census finds no regressing site
outside the tracked sibling, say so explicitly in the commit message — a census
that changes nothing is still the unit's deliverable, and Unit 4 depends on
having it.

**Recommended model:** opus.

**Dependencies:** none.

---

## Unit 3 — Pin every worktree-specific test case to an explicit `GRAPH_COMMIT_WRITER=worktree`

**Scope.** `packages/intentionsutil/scripts/test-graph-commit.sh` only. This unit
is a **no-op today** (`worktree` is still the default), which is exactly why it
lands first and separately: it makes the Unit 4 diff readable and it removes the
vacuous-pass risk from the flip.

The suite is 3732 lines, 83 cases. Cases that assert worktree-writer-specific
behavior while setting no `GRAPH_COMMIT_WRITER` would silently re-point at the
plumbing arm when the default flips — most of them passing **vacuously** rather
than failing, which is the worse outcome. Add `export GRAPH_COMMIT_WRITER=worktree`
around each (and `unset` after, matching case 67's existing shape at `:3143-3149`).

Measured candidate set, by case header line:

- Case 16 far-ahead worktree (PR branch) rebuild + HEAD restore — `:1515`
- Case 17 overlapping edit vs prune conflict, park recommendation — `:1543`
- Case 18 far-ahead worktree + `--prune` — `:1570`
- Case 24 unrelated dirty tracked file pre-flight refusal — `:1777` (see Unit 4:
  this one's meaning inverts, so pin it here and rewrite it there)
- Case 36 a pre-existing rebase is refused up front — `:2072`
- Case 37 a rebase this run stranded is aborted by `cleanup()` — `:2114`
- Case 46 bystander prune through the layer-3 park entry — `:2332`
- Cases 48-52 far-ahead + stale `--base` layer-3 merge interactions — `:2417`,
  `:2477`, `:2508`, `:2540`, `:2571`
- Case 53 killed while WAITING on a live lock leaves no orphan — `:2618`
- Cases 54 & 55 killed MID-STAMP, detectable recoverable orphan — `:2684`
- Case 58 delete/modify divergence via stale `--base` — `:2855`
- Case 78 far-ahead + edit is never a `noop` — `:3468`
- Case 81 far-ahead rebuild, merge tool unrunnable, HEAD restored — `:3622`

The classification rule, so the implementer can extend the list rather than
trust it: **a case belongs in this set if it asserts rebase state, orphan
detection/recovery, HEAD movement or restoration, the far-ahead rebuild, or the
dirty-tree refusal.** Cases 60-66 and 68-77 already export explicitly and need
no change; case 67 is handled in Unit 4.

Leave every other case unpinned — those are the ones that must keep passing
under the new default, and pinning them would hide a real regression.

**Recommended model:** sonnet. Mechanical, fully enumerated, with a stated
classification rule and a suite that verifies it.

**Dependencies:** none (independent of Unit 1; can run in parallel).

---

## Unit 4 — Flip the default to `plumbing`, rewrite the doc sites, and invert the meaning-changed tests

**Scope.**

`packages/intentionsutil/scripts/graph-commit`:

- `:418` — `GRAPH_COMMIT_WRITER="${GRAPH_COMMIT_WRITER:-plumbing}"`.
- `:413-417` — rewrite the default paragraph. The paragraph beginning "THE DEFAULT
  DELIBERATELY STAYS `worktree`" and the sentence "Unset (the overwhelmingly
  common case) is exactly `worktree`, so no existing caller's control flow is
  touched by this variable's existence" both become false and must be replaced,
  not merely edited around. The replacement states: the default is `plumbing`;
  `worktree` remains explicitly selectable as a rollback and is the arm
  `assert_clean_outside_ids` and `ensure_intentions_only_base` still serve;
  removing that arm entirely is deferred follow-on work.
- `:3778-3792` — amend the WORKTREE WRITER ONLY comment on the guard so it reads
  as "the arm you opt into", not "the default arm". Keep the guard and its call
  site (`:3793-3795`), keep `assert_clean_outside_ids()` (`:3591`) and
  `_offending_path_is_marker_only_residue()` (`:3559`).
- `:3854-3865` — same amendment for `ensure_intentions_only_base`'s gate. No
  behavior change.
- `:3699-3706` — the writer-gate comment. It states "Unset resolves to
  `worktree`, so the default path reaches the `worktree` arm and falls straight
  through — this block is inert for every caller that does not set the variable."
  Every clause of that becomes false: unset now resolves to `plumbing`, and the
  block is what routes the default. Rewrite it; do not leave it for the `grep`
  sweep below to maybe catch. The `case`/`die` validation itself
  (`:3707-3711`) is unchanged.
- `:2381-2401` (`print_orphan_recovery_line`'s PLUMBING WRITER comment) and any
  other prose that describes `worktree` as "the default" — sweep with
  `grep -n 'default' packages/intentionsutil/scripts/graph-commit` and fix each
  hit that is now false.

`.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding`:

- `:795-798` — the comment "Exported per invocation rather than set globally: the
  writer default stays `worktree` for every other graph-commit caller … and
  flipping those is a separate decision with a separate blast radius" is now
  false. Rewrite it to say the per-invocation set is retained as belt-and-braces
  documentation of this lane's hard requirement. **Leave the `GRAPH_COMMIT_WRITER=plumbing`
  prefix at `:814` in place** — it is now redundant but harmless, it keeps the
  lane correct if the global default is ever rolled back, and the test suite
  asserts its literal source text (see below).
- `:904` — the message "blocks every later default-writer graph-commit in this
  checkout" is now false as written (the default writer no longer refuses).
  Reword to the still-true consequence: it makes `sync_main_checkout`'s
  `--ff-only` refuse, and it blocks an explicit-`worktree` graph-commit.

`packages/intentionsutil/scripts/land-align-round:228` — pass `--keep-residue`
(Unit 1's flag) with a comment naming the reason: an `/align`-family round
authors node bodies on disk and may re-read them within the round.

`packages/intentionsutil/scripts/test-graph-commit.sh` — the cases whose
**meaning inverts**; these are rewritten, not re-run:

- **Case 67** (`:3128-3176`), the gating harness. Sub-case 1 (`:3132-3138`,
  unset) currently asserts "the CLI lands exactly as before"; it must now assert
  that unset resolves to **plumbing** — reuse case 67's own sub-case 3 shape
  (`:3155-3165`) and assert `git rev-parse HEAD` is unchanged after the land.
  Sub-case 2 (`:3143-3149`) currently reads "`GRAPH_COMMIT_WRITER=worktree`:
  identical to the default, lands"; it becomes the explicit **non-default**
  case and must assert HEAD **moved**. Sub-case 4 (`:3169-3176`, bogus value
  refused) is unaffected by the flip and stays as is.
- **Case 24** (`:1777-1794`). Pinned to `worktree` by Unit 3, so it keeps
  passing and keeps pinning the guard. Add a paired assertion beside it: the
  same fixture under the **default** (no export) LANDS, the dirt survives, and
  `origin/main` carries the edit. That paired assertion is the regression test
  the whole tactic exists for, and it must live under the default, not under an
  override.
- **Case 70** (`:3243-3275`). Its first half (`:3253-3260`) relies on the
  ambient default being `worktree` to exercise the refusal — Unit 3 pins it.
  Its second half already exports `plumbing` explicitly and needs no change.
  Update the case's header comment, which currently frames case 24 as pinning
  "the worktree writer's refusal on its own fixture" as though that were the
  default path.

`.claude/skills/dispatch-propagate/scripts/test-dispatch-eval-finding.sh` — case
18/19 (`:955-976`). The two source-grep assertions (`assert_contains` for the
literal `GRAPH_COMMIT_WRITER=plumbing "${GRAPH_COMMIT_CMD[@]}"`, and
`assert_not_contains` for `export GRAPH_COMMIT_WRITER`) keep passing unchanged
and should be **kept** — they still pin the per-invocation shape. Only the
surrounding comment, which mirrors the now-false "the writer default stays
`worktree` for every OTHER graph-commit caller" prose, needs the same correction
as its source counterpart. `:219` (the stub log line) needs no change.

Out of scope: deleting the worktree arm, deleting `assert_clean_outside_ids`,
deleting `ensure_intentions_only_base`, the `.claude/rules/sandbox.md` shrink
that becomes possible. All follow-on.

**Recommended model:** opus.

**Dependencies:** Units 1, 2, 3.

---

## Unit 5 — Sweep the caller prose whose worktree-writer reasoning is now stale

**Scope.** Comments only; no behavior change. Every one of these passages
reasons about HEAD movement or `assert_clean_outside_ids` as facts of the
default path, and each is now wrong for a reader who does not know the flip
happened. Do not delete the reasoning — annotate it with what is now true.

- `packages/intentionsutil/scripts/park-node:258-271,283-287` — the `HEAD_BEFORE`
  block. Under plumbing HEAD never moves, so the "HEAD moved" guard is
  **vacuous but safe**: the hazard it protects against (graph-commit having
  locally committed or `reset --hard`-ed the file) cannot arise, because the
  plumbing writer makes no local commit and its park path is a path-scoped
  `sync_ids_to_rev` (`graph-commit:3353-3354`). Correctness under plumbing rests
  on the second guard, the `EXPECT_BLOB` comparison (`:290-297`), which still
  fires. Say exactly that.
- `packages/intentionsutil/scripts/release-wait:196-217` and
  `packages/intentionsutil/scripts/demote-node-to-implement:126-166` — the same
  block, same annotation. `demote-node-to-implement:132-137` additionally
  reasons about the `--base` staleness park committing and pushing before
  exiting non-zero; under plumbing that path pushes without moving HEAD.

  **UNIT 1 IS WHAT MAKES THE ABOVE TRUE — record this in the annotation.**
  Without Unit 1's residue clear, "vacuous but safe" is **false** for
  `release-wait` and `demote-node-to-implement`, and this is measured, not
  inferred. Their rollback is an `EXIT` trap that fires when
  `MUTATED==1 && rc != 0` (`release-wait:241-244`), so it runs on the window
  where `graph-commit` LANDED and the script then failed a later step — for
  `release-wait`, the post-land `fetch` / `rev-parse` / parse verification at
  `:374-396`. In that window under a bare plumbing flip: HEAD did not move
  (guard 1 passes) **and** the on-disk file still hashes to `EXPECT_BLOB`,
  because the plumbing writer never touched the tree (guard 2 passes) — so
  `restore_node` writes the PRE-write bytes over content already on
  `origin/main`, leaving a stale dirty tracked file. That is exactly the
  residue clarification 91 forbids. Unit 1's clear changes the on-disk blob on
  the landed path, so `EXPECT_BLOB` no longer matches and guard 2 correctly
  declines. `park-node` and `clear-park` are immune either way — they discard
  `graph-commit`'s rc and take `verify-landed`'s `origin/main` verdict, setting
  `MUTATED=0` on `landed` (`park-node:435-455`). `arm-wait` (`:220-244`) and
  `hold-node` carry **neither** guard — `arm-wait`'s trap restores from the
  captured blob unconditionally — so they have this hazard on **both** writers
  today; that is pre-existing, is not caused by the flip, and is out of scope
  here. Consequence for sequencing: **Unit 1 must land before Unit 4**, which
  the dependency chain already enforces — but if Unit 1 is ever descoped, these
  two primitives need a real fix (derive the rollback decision from
  `verify-landed`, as `park-node` does) and not a comment.
- `.claude/skills/dispatch-propagate/scripts/lib-graph-rollback.sh:1-75` — the
  header's whole premise ("Every graph writer mutates `intentions/<id>.md` in
  the MAIN checkout's working tree first…", "graph-commit's
  `assert_clean_outside_ids` refuses to START whenever a tracked file outside
  the call's own node set is dirty, so ONE leaked write denies service to every
  graph writer in that checkout"). Under the plumbing default the denial-of-
  service half is gone; the leaked-write half is not (it still blocks
  `--ff-only`). The four-way HEAD classification (`:56-68`) collapses to the
  first arm, correctly and trivially. Rewrite the header to state both.
- `.claude/skills/dispatch-propagate/scripts/graph-select-target:524-540,579-656`
  — the passage describing a residual dirty file tripping
  `assert_clean_outside_ids` and using HEAD movement to tell an ordinary
  rollback from graph-commit having moved HEAD.
- `.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall:135,144`
  — two comments reasoning about `assert_clean_outside_ids`.
- `.claude/skills/dispatch-propagate/scripts/dispatch-graph-main-red-sync:155-156`
  — "would trip graph-commit's `assert_clean_outside_ids` and cascade-fail every
  SUBSEQUENT node's `graph-commit --base`". That cascade is the exact mechanism
  the flip dissolves; the comment should record that it is now historical.

Find any remaining hits mechanically:
`grep -rn 'assert_clean_outside_ids' packages/intentionsutil .claude/skills` and
`grep -rn 'GRAPH_COMMIT_WRITER' packages/intentionsutil .claude/skills`.

**Recommended model:** sonnet.

**Dependencies:** Unit 4.

---

## Reuse

- `sync_ids_to_rev <rev>` — `packages/intentionsutil/scripts/graph-commit:1872-1892`.
  Path-scoped, iterates `ALL_IDS`, writes the working tree only and never the
  index, removes an id absent at `<rev>`. Unit 1's residue clear is this
  function called with `HEAD`; do not write a second one.
- `emit_verdict_and_exit()` — `graph-commit:2432-2439`. The single chokepoint
  where every exit-0 route converges. One hook there covers landed,
  landed-equivalent, `noop`, and `busy-exhausted`-but-landed.
- `clear_node_residue()` — `.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding:866-915`.
  The worked precedent for Unit 1, including the HEAD-not-`origin/main` choice,
  the worktree-not-index discipline, and the mint-path `rm`. Its comment block
  is the design rationale; port the reasoning, do not re-derive it.
- `verify-landed` — `packages/intentionsutil/scripts/verify-landed`. Already
  writer-agnostic: answers landed / not-landed / unknown strictly from
  `origin/main`, never from local-tree state or `graph-commit`'s exit code. The
  pattern every caller should use instead of a local post-land check; see
  `dispatch-fleet-alarm:490-532` for the delegation shape.
- `listNodesAtRef(repoRoot, ref)` / `listNodesStrict` —
  `packages/intentionsutil/scripts/lib-store-at-ref.ts:19-75`. The git-ref-aware
  read primitive for Unit 2's redirects. Consumers to copy:
  `office-hours-select.ts:381-395`, `read-sensors.ts:54,767`.
- `restampScopeFromRev` — `packages/intentionsutil/scripts/restamp-scope-fingerprint.ts:139-171`.
  Already reads committed text via `git show <rev>:<path>`; its header (`:18`)
  names `graph-commit`'s land-then-restore explicitly. Precedent that Unit 1's
  post-land semantics were already anticipated.
- `run_gc()` / `sync_clone()` / `make_clone()` / `edit_line()` / `origin_show()` /
  `origin_sha()` / `ok` / `no` — `packages/intentionsutil/scripts/test-graph-commit.sh:993+`.
  The suite's harness; new cases reuse it. Note `sync_clone` re-syncs the clone
  and would mask residue, so residue assertions must come **before** it.
- Case 67's export/unset shape — `test-graph-commit.sh:3143-3149`. The template
  for Unit 3's pins and Unit 4's rewrite.
- `test-park-node.sh:136-143` — the `git status --porcelain -- intentions/`
  EMPTY assertion and its recorded reasoning (why not `git diff`), reused for
  Unit 1's residue tests.
- `sync_main_checkout()` — `.claude/skills/dispatch-propagate/scripts/lib.sh:2109-2113`.
  The `fetch` + `merge --ff-only` the residue clear must keep working; called at
  `dispatch-tick:612`.

## Verification

Run the full graph-write suite set after each unit. All are plain bash and
should run sandboxed; if one fails with `Read-only file system` or a TLS error,
retry with `dangerouslyDisableSandbox: true` per `.claude/rules/sandbox.md` —
never pre-emptively.

Core suite (must be green after every unit; 107/107 at `75d76e26`, plus the
cases added since and by Units 1/3/4):

```verify
bash packages/intentionsutil/scripts/test-graph-commit.sh
```

The graph-write primitives — these drive the REAL `graph-commit` against a
throwaway bare origin, so they exercise the new default end to end. They are the
strongest signal that the flip is behaviorally neutral for the primitives:

```verify
bash packages/intentionsutil/scripts/test-park-node.sh || exit 1
bash packages/intentionsutil/scripts/test-transition-node.sh || exit 1
bash packages/intentionsutil/scripts/test-hold-node.sh || exit 1
bash packages/intentionsutil/scripts/test-land-align-round.sh || exit 1
bash packages/intentionsutil/scripts/test-arm-wait.sh || exit 1
bash packages/intentionsutil/scripts/test-release-wait.sh || exit 1
bash packages/intentionsutil/scripts/test-demote-node-to-implement.sh || exit 1
bash packages/intentionsutil/scripts/test-verify-landed.sh
```

The rollback library and the callers whose reasoning the flip changes:

```verify
bash .claude/skills/dispatch-propagate/scripts/test-graph-write-rollback.sh || exit 1
bash .claude/skills/dispatch-propagate/scripts/test-resolve-hold.sh || exit 1
bash .claude/skills/dispatch-propagate/scripts/test-graph-select-target.sh || exit 1
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-graph-main-red-sync.sh || exit 1
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-invalid-state-followup.sh || exit 1
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-fleet-alarm.sh
```

The opt-in caller (155/155 at `75d76e26`), which must stay green with its
per-invocation set retained:

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-eval-finding.sh
```

Lint, including the shell-JSON and type-safety sensors:

```verify
bash .claude/skills/dispatch-propagate/scripts/run-lint.sh
```

**Judgment checks — these are the ones a green suite does not answer.**

1. **Vacuous-pass audit (Unit 3 / Unit 4).** A green `test-graph-commit.sh`
   after the flip is NOT sufficient evidence. Before the flip, run the suite
   with `GRAPH_COMMIT_WRITER=plumbing` forced in the environment and record which
   cases fail; every such case must appear in Unit 3's pin list or in Unit 4's
   rewrite list. A case that passes under both writers while claiming to assert
   rebase/orphan/far-ahead/dirty-refusal behavior is passing vacuously and must
   be tightened, not accepted.
2. **Residue, observed directly (Unit 1).** In a scratch clone, land a node edit
   through the default writer, then run `git status --porcelain` and
   `git merge --ff-only origin/main`. Porcelain must be empty and the merge must
   succeed. This is the property that keeps `dispatch-tick:612` working; if it
   regresses, the fleet's main checkout wedges on its own successful writes.
3. **Worker-worktree residue (Unit 1).** Same check from a node worktree on a PR
   branch far ahead of `origin/main`: after a landed graph write, the node file
   must not show up in `git status`, so a later `/implement-unit` commit cannot
   sweep it into the PR branch.
4. **Rollback path, per primitive (Unit 5's premise).** For `park-node`,
   `release-wait` and `demote-node-to-implement`, force a `graph-commit` failure
   (the suites already have wrappers for this) and confirm the tree is returned
   clean — the `EXPECT_BLOB` guard, not the now-vacuous HEAD comparison, is what
   must be carrying it.
5. **Landing order (Unit 2).** Do not merge Unit 4 while
   `tactic-eval-finding-list-reads-working-tree-stale-after-plumbing-land` is
   still open **unless** Unit 2's census confirms `dispatch-eval-finding --list`
   is the only land-then-read-locally site. If the census finds others outside
   that sibling's scope, they must be redirected in Unit 2 before Unit 4 lands.
   This plan authors no `blocked_by` edge; the coordination is the implementer's
   to check at merge time.
6. **Prune (observe in production).** No scripted `--prune` caller exists, so the
   fail-closed prune divergence surfaces only on the next hand- or skill-run
   prune round. If such a round parks on a `--prune` id whose node a peer already
   deleted, that is the known, recorded divergence — not a new defect — and the
   recovery is to re-run without that id.
7. **Rollback drill.** Confirm `GRAPH_COMMIT_WRITER=worktree` still restores the
   old behavior end to end from a real caller (e.g. `park-node` with the variable
   exported). This is the escape hatch the design question was resolved in favor
   of keeping; an unexercised one is a hope, not a path.
