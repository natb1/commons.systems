# PR1 execution brief — graph write-path integrity

**This file is self-contained.** A fresh session with no memory of the planning
that produced it can execute PR1 end-to-end from this text alone. You do **not**
need to open `plans/dispatch-rsi-serialized-pr-plan.md`; where that document is
wrong, this brief says so and gives the correction — see the Appendix, which is
long, because the master plan's PR1 section carries several stale anchors.

Every `path:line` anchor below was verified against `origin/main` on
2026-08-14, and the ruling-dependent parts re-verified on 2026-08-15.

The work: implement **8 units** across 4 files, open an ad-hoc PR, stop for
author review, absorb the review residuals, merge, QA `main`, then close **8**
graph nodes.

> **Read this first — the shape changed twice.** The master plan describes PR1
> as 8 units closing 9 nodes. Three `/align-tactics` rounds were run on
> 2026-08-14 to finalize the three under-specified nodes; **two parked**. An
> author sitting on **2026-08-15 ruled both parks and cleared them**, and the
> rulings are landed as strategy clarifications **241, 242 and 243** on
> `strategy-graph-native-dispatch`.
>
> | Node | Outcome | Effect on PR1 |
> |---|---|---|
> | `tactic-graph-commit-snap-dir-merge-clobbers-original` | parked, then **ruled (b)** — clarification 241 | **U6 is restored** to Lane A; the node closes here |
> | `tactic-explicit-ref-graph-reads` | parked, then **ruled shape (a)** — clarification 242 | **U8 proceeds**, but **loses `demote-node-to-implement`**; node closes here |
> | `tactic-graph-commit-merge-npx-park-storm` | **finalized** — `phase: implement`, full plan body | **U7's plan lives on the node** and is authoritative — see §0 |
>
> **Net against the master plan: 8 units, but only 8 nodes.**
> `tactic-demote-node-stale-local-read` is **no longer absorbed into U8** and
> does **not** close here — clarification 242 gives it sole ownership of
> `demote-node-to-implement`, and it is blocked anyway. See F9.
>
> All outcomes are landed on `origin/main` (verified at `42884460`). Neither
> node carries a park any more — `office_hours` is `null` on both. Read the
> three nodes and the three clarifications before starting:
>
> ```bash
> git show origin/main:intentions/<id>.md
> git show origin/main:intentions/strategy-graph-native-dispatch.md   # 241-243
> ```

---

## 0. U7's plan lives on its node — read it first

`tactic-graph-commit-merge-npx-park-storm` was **finalized** by its align round
on 2026-08-14: `status: codified`, `phase: implement`, with a ~24KB
clean-session plan in its body carrying `## Context`, three units each with a
`**Recommended model:**` line, `## Reuse`, and `## Verification`.

```bash
git show origin/main:intentions/tactic-graph-commit-merge-npx-park-storm.md
```

**That node body is the authority for U7.** §3's Lane A U7 entry is a summary
and a set of corrections to it — not a replacement. Read the node.

Its three units, as landed:

| Unit | Recommended model | What |
|---|---|---|
| 1 | sonnet | Remove the run-time npm-registry dependency from **both** `graph-commit` tsx spawns |
| 2 | opus | Distinguish "the merge tool could not run" from "content diverged", and die on the former |
| 3 | sonnet | Regression coverage: no park on an unrunnable merge tool, park preserved on a real divergence |

Two of its findings **refute guidance the master plan gives**, and are measured
rather than argued — see F7.

---

## 1. How to start

### The opening prompt

> Execute `plans/pr1-graph-write-path-brief.md` end-to-end. Check §0, run the
> pre-flight in §1, then implement Lanes A–D concurrently per §3 — each unit in
> its own subagent at the model the unit names, constrained to working-tree
> edits only. Run the verification in §4, open the PR per §5, and stop for my
> review.

### Branch

Cut `pr1-graph-write-path` from **fresh** `origin/main`:

```bash
git fetch origin
git worktree add --no-track -b pr1-graph-write-path \
  .claude/worktrees/pr1-graph-write-path origin/main
```

Work in that worktree. Do not author in the shared `main` checkout — a dirty
tracked file there blocks `graph-commit` for **every** writer in the repo.

### Pre-flight — four checks, all blocking

**(a) Local `main` must be in sync with `origin/main` before any graph write.**

```bash
git fetch origin
git rev-list --left-right --count origin/main...main   # must print: 0	0
```

This is not ceremony. It is the exact precondition of the U1 defect: **any**
unpushed local commit on `main` arms a silent drop of a node edit while
`graph-commit` reports `landed ... context=noop`. Until U1 ships, every graph
write this brief performs is exposed to it. Re-check immediately before §9.

**(b) The ref-split disposition must read DEFER.**

```bash
git show origin/main:intentions/tactic-graph-refsplit-blocker-audit.md \
  | grep -n "Disposition: \*\*(b) DEFER"
```

That node carries the settled disposition (recorded 2026-08-14): ref-split does
**not** land before this bundle. If it no longer reads DEFER, **stop** — U1 and
U5 target code ref-split deletes outright. See §2's "Why we implement U1 and U5
anyway".

**(c) Re-verify the two premises of U1's second half.** PR #3050 already changed
`dispatch-eval-finding`:

```bash
grep -n "GRAPH_COMMIT_WRITER=plumbing" .claude/skills/dispatch-propagate/scripts/dispatch-eval-finding
grep -n "verify-landed" .claude/skills/dispatch-propagate/scripts/dispatch-eval-finding
```

Expected: the writer is already forced to `plumbing` (~`:794`) and verification
already delegates to `verify-landed` (~`:806-822`). If so, the only live defect
left is that `verify_landed()` hashes the working-tree `$NODE_FILE` — a one-line
fix, not a unit. **If PR #3050's changes are absent, re-scope U1's second half
before writing code.**

**(d) Confirm no node already has a PR.** See §10.

---

## 2. Context — the findings

PR1 hardens the path every other PR in the serialized plan uses to close its own
tactics; roughly 94 node closures run through it. The findings say that path can
silently lose an edit, abandon a write on a GitHub reporting artifact, turn a
transient `npx` failure into a fleet-wide park storm, be blocked repo-wide by an
unrelated node, and cannot express a forward reference — and that the **read**
path can report a vacuous pass against the wrong tree.

### The nodes

| # | Node id | Unit | Closes in PR1? |
|---|---|---|---|
| 1 | `tactic-eval-finding-noop-verdict-hides-dropped-node-edit` | U1 | yes |
| 2 | `tactic-eval-finding-sensor-validator-red-main-blocks-all-graph-writes` | U2 | yes |
| 3 | `tactic-eval-finding-eval-finding-forward-crossref-fails-ci` | U3 | yes |
| 4 | `tactic-eval-finding-origin-main-data-test-blocks-atomic-schema-tightening` | U4 | yes |
| 5 | `tactic-graph-commit-orphan-refusal-misattributed-content-failure` | U5 | yes |
| 6 | `tactic-graph-commit-snap-dir-merge-clobbers-original` | U6 | yes — ruled (b), clarification 241 |
| 7 | `tactic-graph-commit-merge-npx-park-storm` | U7 | yes (see §0) |
| 8 | `tactic-explicit-ref-graph-reads` | U8 | yes — ruled shape (a), clarification 242 |
| — | `tactic-demote-node-stale-local-read` | **none** | **NO** — out of scope, stays blocked (F9) |

`packages/intentionsutil/scripts/graph-commit` is **3715 lines**. Four of the
eight units live in it, which is why §3 groups by file rather than by node.

### F1 — a far-ahead rebuild drops an edit and reports success (U1)

When local `main` carries any unpushed commit, `graph-commit` takes the
far-ahead rebuild path: `ensure_intentions_only_base()` (defined `:1213`, called
from `:3573`) runs `git reset --hard "$MAIN_SHA"`. The false-`landed` guard at
`:3635` then compares `HEAD:intentions/<id>.md` against
`MAIN_SHA:intentions/<id>.md` — but after that reset those two blobs are equal
**by construction, for every id, always**. So the guard cannot fire, control
falls through to the `head_sha == main_sha` short-circuit, and
`emit_verdict_and_exit noop` (`:3659`) reports success while an **edit to an
existing node** was silently dropped.

The invariant nobody checks: the writer's intended content is never compared
against what actually reached `origin/main`. Every guard compares two views of
the repository to each other, never either one to the caller's intent.

**Fix.** Before `emit_verdict_and_exit noop`, for each id compare
`SNAP_DIR/<id>.md` against `MAIN_SHA:intentions/<id>.md`. Byte-identical is a
genuine no-op; different means the caller's edit was dropped — die or park,
never report `landed`. A `noop` verdict on an invocation that passed `--base`
for an already-existing node deserves particular suspicion: the caller
demonstrably believed it was changing something.

> **`SNAP_DIR` is the right comparison source — but read U6 first, because U6
> changes what it holds.** U1 compares *what this run intended to land* against
> what landed. Today `SNAP_DIR/<id>.md` is that intent (refreshed with the merge
> output when a merge resolves; `print_verdict` reads it as ground truth at
> `:2091-2098`). **After U6, the intent-to-land copy is `<id>.merged.md` when it
> exists, and `<id>.md` is the writer's frozen pre-merge original.** U1 must
> compare against the *preferred* path, not blindly against `<id>.md` — that is
> why U6 runs first in Lane A. U1's logic is unchanged; only the path it reads
> is.

> **Anchor correction.** The master plan and the node body both cite
> `graph-commit:3261` for the false-`landed` die. That is stale. The die is at
> **`:3635`**, the `noop` exit at **`:3659`**. Re-locate by string:
> `grep -n "false 'landed'" packages/intentionsutil/scripts/graph-commit`.

> **The node records an unresolved sub-question.** It states the mechanism above
> explains why the loss was *reported as success* but does **not** explain where
> the edit was lost, and suspects `dispatch-eval-finding`'s `splice_body`. That
> stays open. U1 fixes the false report, and the node closes on that. Do not
> widen the unit to hunt the original loss.

### F2 — one unbound sensor name denies every graph write repo-wide (U2)

`validateRegisteredSensorNames` (`packages/intentionsutil/src/sensors.ts:101`)
throws `IntentionSchemaError` when a registered sensor constant matches no
node's `success_signal.sensor`. Its **sole** call site is
`packages/intentionsutil/scripts/validate-graph.ts:93`, which is the `guard` job
of `.github/workflows/graph-fast-path.yml` (invocation at `:32`).

That workflow triggers only on `push: branches: ['graph/**']`, and its four
other required contexts — `acceptance` (`:35`), `preview-and-smoke` (`:42`),
`lint` (`:49`), `unit-tests` (`:56`) — are stub jobs that all declare
`needs: guard`. So one throw fails `guard`, skips all four dependents, and
leaves the scratch branch with four required checks non-success. `graph-commit`'s
`await_checks` then refuses to land **for every writer in the repository**, on
content that has nothing to do with sensors.

Worse, the validator never runs on the `main` push that introduces the problem —
the graph fast path does not trigger on `main`. A 54-minute repo-wide write
outage on 2026-08-14 is recorded on the node.

**Fix, two halves.** (i) Run `validate-graph.ts` in the PR CI of any branch
touching `packages/intentionsutil`, so a validator change is exercised by the PR
that makes it. (ii) Scope the escalation: an unbound *registered name* says
nothing about the node being written, so downgrade it from repo-wide denial to a
node-scoped failure.

> **Anchor correction.** The node body cites `read-sensors.ts:1184-1215`. That
> is the **ladder-terminus census sensor**, an unrelated block. Real sites:
> `UNBOUND_SENSOR_NAMES` at **`read-sensors.ts:1637`** (docstring `:1629`), the
> validator at **`sensors.ts:101`**, sole call site **`validate-graph.ts:93`**.

> **Do not reach for `UNBOUND_SENSOR_NAMES` as the fix.** Its docstring
> (`:1629-1636`) is explicit: it is for genuinely node-agnostic adapters, and "a
> node-bound sensor that lands there stops being guarded." Parking the name
> there converts a 54-minute outage into a permanently unguarded sensor.

### F3 — forward cross-references fail CI (U3)

`validateGraphProseRefs` (`packages/intentionsutil/src/schema.ts:1614`; the
throw the stack trace names is at `~:1656`) rejects an entry whose prose names a
sibling the same batch has not landed yet. A batch write then fails after 3
attempts and rolls back. Measured cost on the recorded occurrence: 3 attempts
plus a full CI round trip, ~4 minutes, a 17% waste rate on that evaluator's
entire write surface — and it biases the ledger against exactly the cross-links
that make it useful.

**Fix.** Resolve prose refs against **the batch under write** plus `origin/main`,
not `origin/main` alone.

### F4 — an `origin/main` data test blocks atomic schema tightening (U4)

`packages/intentionsutil/test/office-hours.test.ts:860` opens
`describe.skipIf(!hasOriginMain())("office-hours-select CLI (real repo)")`
(`hasOriginMain()` at `:37`). Every case inside reads `intentions/` at the
literal `origin/main` git ref — `git -C <root> show origin/main:intentions/<id>.md`
at `:875`, `--ref origin/main` at `:890-891` — while executing **this branch's**
schema code.

So any PR that both migrates node data and tightens the schema reading it is
**red by construction** until merge, and CI runs with `fetch-depth: 0` so
`origin/main` resolves in GitHub Actions too. This is a planning constraint the
plan did not encode, not a coding defect. It cost a 107-turn Opus subagent
($21.02 price proxy) concluding — correctly — that no code fix exists.

**Fix.** Run those assertions against a **fixture** graph, keeping one
explicitly-marked smoke assertion against live `origin/main`.

> Verified during planning: this trap does **not** catch the later ledger-
> retirement PR. `attributes` is `Record<string, unknown>` (`schema.ts:244`), so
> dropping `attributes.ledger_entry` from 40 nodes tightens nothing. U4 stands
> on its own merits, not as a prerequisite.

### F5 — an ORPHANED check row is misreported as a content failure (U5)

`await_checks()` (`graph-commit:1842`) returns rc `2` for two situations its own
header comment already distinguishes (`:1836-1837`): a required check that
**concluded non-success** (deterministic — the content fails CI, do not retry),
and a required check that is **ORPHANED** — no conclusion, parent suite already
finished, so no verdict will ever arrive.

The orphan *detection* is correct and not in dispute: `check_suite_concluded()`
(`:1794`, documented `:1766-1775`) resolves it and the detail string at
`:1917-1918` names it precisely. Only the **return code** collapses the two, so
the caller's `die()` asserts the content cause unconditionally. The operator is
told *"the commit content fails CI; not retrying (fix the content and re-run)"* —
the one remedy that cannot work — while the remedy that does work (re-push,
which mints a fresh check suite) is never attempted and **the graph write is
abandoned**.

The two causes want opposite handling: a genuine non-success reproduces on every
re-push; an orphan does not, because a new SHA gets a new suite.

**Fix.** Split rc `2` into content-failure and orphaned-suite (or return the
orphan verdict alongside it), and route the orphan case to a **bounded**
re-push-and-re-stamp under its own attempt cap, so a persistently orphaning
repository cannot loop. Rewrite the operator message for the orphan case.

**Amend, do not delete, the existing test.** `test-graph-commit.sh` asserts
`grep -q 'not retrying'` on the orphan fixture while the comment above it states
the intent as a *diagnostic*. Amend that assertion to the new behaviour.
**Leave the still-running-suite negative case untouched** — it is the regression
guard against relaxing the refusal back into an unbounded wait. Re-locate both
by string; the node's cited line is stale.

**Honest limit, recorded on the node:** the retry that succeeded pushed a
different SHA onto a fresh suite, which proves the second attempt passed but
does not by itself exclude a content component in the first. The attempt cap is
therefore required, not optional.

Out of scope: the populated-conclusion-behind-stale-status desync — a third
case, already handled.

### F6 — `SNAP_DIR` on the park path (U6) — **ruled (b), U6 restored**

**The defect.** A multi-id batch fails closed as a unit. When id A's layer-3
merge *resolved* and id B's did not, `park_and_exit()` parks both, and
`park_write()`'s recovery text points the human at `SNAP_DIR/A.md` claiming it
holds *their* unlanded content. It does not: `check_base_freshness()` and
`replay_snapshot_onto_base()` have overwritten it with graph-commit's own merge
output — the losing writer's edit blended with a concurrent writer's landed
one. Because the concurrent writer chooses which field to touch, they choose
which of the losing writer's ids lose their evidence.

**The ruling — strategy clarification 241, 2026-08-15.** Keep the writer's
original immutable and put the merged content *beside* it:

- `snapshot()` writes `$SNAP_DIR/<id>.md` and **never rewrites it**.
- The merge paths write `$SNAP_DIR/<id>.merged.md`.
- Every reader that means *"what this run intended to land"* prefers
  `.merged.md` when present — `ensure_intentions_only_base()`'s replay and
  `print_verdict` (`:2091-2098`).
- `park_write()` names **both** paths and labels which is the session's own
  original and which is graph-commit's partial merge.

> **The 2026-08-14 align round parked this node claiming the fix "cannot be
> built without breaking `test-graph-commit.sh` cases 48–51". That claim was
> wrong and is withdrawn** — it under-weighted the second half of the node's own
> fix, that the rebuild replays `.merged.md`. Case 48 (*"far-ahead + stale
> `--base`: layer-3 merge survives the far-ahead rebuild, both fields land"*)
> passes unchanged, because `.merged.md` carries exactly the merged content
> `SNAP_DIR` carries today. Case 22 (`:1551-1581`, `SNAP_DIR` retains the
> original on an **unresolved** merge) is preserved by construction. Only a
> naive freeze *without* the replay preference breaks them — which is the
> failure mode the master plan's own work-to-skip list warns against.
> **`.claude/rules/test-integrity.md` is not engaged.**

**All three clobber sites are in scope.** The master plan names two
(`:810` in `check_base_freshness()`, `:1207` in `replay_snapshot_onto_base()`).
A third, structurally identical one is at **`:1652`** in
`build_commit_plumbing()`, feeding the same `park_write` text. It is named by
neither the master plan nor the node.

One claim in the node's own text is still overstated and should not be repeated
in the PR body: `run_merge_node()` is a three-way merge whose resolved output
still carries the writer's delta, so the writer's *intent* survives — what is
lost is the exact pre-merge byte image and the ability to tell the two apart.
The blend is also not "already-landed" content; the batch lands nothing.

**Not adopted, still open.** Candidate (c) — that the losing writer's content
belongs in the node's own `office_hours` record rather than behind any
machine-local tmpdir pointer, since `park_write` concedes the tmpdir is *"this
machine only — may not survive past this session"* (`:2944-2952`) — was not
adopted. Its premise is sound and it complements (b) rather than replacing it.
**Already filed** as `tactic-graph-commit-park-content-durability` (`origin/main`
`e23fea43`), `blocked_by` U6's and U1's nodes. **Out of scope for PR1** beyond
the seam U6 is told to leave (see §7).

### F7 — a transient `npx` failure becomes a fleet-wide park storm (U7)

`run_merge_node()` (`:989`) shells out to `npx tsx "$MERGE_NODE_SCRIPT"` at
**`:995`** (`MERGE_NODE_SCRIPT` set at `:336`). It deliberately never dies on a
crash — it appends a `{id, note: "could not attempt structural merge"}` sentinel
and returns 1. Its callers treat that 1 as a genuine content divergence, set
`unresolved=1`, and reach `park_and_exit()`, which **commits and pushes an
`office_hours` park to protected `main`** for every affected id.

So when `npx` cannot run at all (sandbox `EROFS`, cold cache, registry outage),
every far-ahead graph write touching a concurrently-moved node becomes a pushed
park plus a hard failure — durable state a human must then drain. Before the
replay path existed this path never invoked `npx` at all.

**Fix.** Distinguish "the merger ran and could not resolve" from "the merger
could not start". Only the former is a park; the latter is an environment error
that dies loudly with the captured stderr
(`.claude/rules/code-style.md` — clear errors over defensive fallbacks). The
same doomed-spawn shape is already flagged in a comment near `:762`.

**The node's landed plan (§0) is authoritative for how.** Three of its findings
are measured on this host and each one refutes an obvious approach:

> **1. `node_modules/.bin/tsx` does NOT fix this — the master plan's suggestion
> is refuted.** It resolves (tsx@4.22.4) and skips npm's resolution step, but it
> runs the same tsx **CLI**, which opens an IPC unix socket at start-up that a
> sandboxed caller cannot create (`EPERM`) — the failure
> `packages/intentionsutil/scripts/verify-landed:246-250` already records. Only
> the **ESM loader form** avoids it:
> `node --import tsx/esm packages/intentionsutil/scripts/merge-node.ts …`,
> which needs no npm resolution at run time and opens no socket. It runs
> `merge-node.ts` unchanged (`process.argv.slice(2)` at `:45`, `pathToFileURL`
> main-guard at `:100`, and `packages/intentionsutil/package.json:5` is
> `"type": "module"`). Every `.claude/worktrees/*` checkout carries
> `node_modules`, so the loader resolves from a worktree too.
>
> **2. A non-zero exit code cannot be the discriminator.** Measured 2026-08-14:
> running the loader form where `tsx` is unresolvable exits **1** with
> `ERR_MODULE_NOT_FOUND` on stderr and zero bytes on stdout — byte-for-byte the
> same rc as `merge-node.ts`'s own caught failure (`merge-node.ts:106`
> `process.exit(1)`). "rc != 0" cannot separate them, and neither can "rc ==
> 127" (a loader failure is not 127). `merge-node.ts` must therefore signal
> *"I ran and failed on these inputs"* with a **reserved exit code** distinct
> from every way a process can fail to start.
>
> **3. There is a second `npx tsx` spawn on the write path**, at
> `graph-commit:2968`, inside `park_write()`'s throwaway store helper. Both
> spawns are run-time registry dependencies; Unit 1 covers both. Note
> `MERGE_NODE_SCRIPT` and `STORE_MODULE` (`:334-336`) resolve from `SCRIPT_DIR`
> **deliberately**, not from `REPO_ROOT` — any replacement invocation form must
> preserve that.

> **Correction — there are FOUR `run_merge_node` call sites, not two (and not
> three).** The master plan names `:793` and `:1203`; the node's own plan
> enumerates three (`:793`, `:1203`, `:2298`). Verified by grep on 2026-08-14,
> the complete set is **`:793`, `:1203`, `:1650`, `:2298`** — `:1650` sits in
> `build_commit_plumbing()` and is missed by both. A fix that guards only the
> enumerated three leaves one park-storm path open. Enumerate before editing:
> `grep -n "run_merge_node " packages/intentionsutil/scripts/graph-commit`.

### F8 — graph reads resolve their tree from cwd or script location (U8)

Four readers disagree about where their tree comes from, so a read invoked from
the wrong directory silently targets the wrong tree — and `validate-graph.ts`
can report a **vacuous pass** against a directory that is not the graph:

| Reader | Roots from | Anchor |
|---|---|---|
| `packages/intentionsutil/scripts/validate-graph.ts` | **cwd**, defaulting to the literal `"intentions"` | `:73` |
| `packages/intentionsutil/scripts/dump-node.ts` | script location (`import.meta.url`) | `:38-40` |
| `packages/intentionsutil/scripts/write-node.ts` | script location (`import.meta.url`) | `:18-22` |
| `packages/intentionsutil/scripts/clear-park` | script location (`SCRIPT_DIR/../../..`) | `:99-100` |

This is adopted doctrine, not a proposal: `strategy-graph-native-dispatch`
clarification **194** (ruled 2026-08-05, *"ADOPTED as stated"*) requires reads to
take the tree/ref as a **required argument**. The recording session then tripped
the very defect it was adopting the fix for — it ran `write-node.ts` from the
primary checkout, so the script resolved its root from that copy and wrote the
amended strategy into the shared main checkout.

**Already converted** (do not redo): `check-node-selection.ts:14-15` takes a
required `--dir`; `compute-freshness.ts` takes an explicit `--snapshot`/`--stamp`
with `transition-node:161,182,186` as the acquiring wrapper — the
"wrapper acquires provenance, pure function consumes it" precedent to follow.

**Fix.** Make the tree an explicit **required** argument on the four files above
— no cwd default, no script-location default.

> **The partition is ruled — strategy clarification 242, 2026-08-15.** The
> 2026-08-14 align round parked this node because three open nodes claimed
> overlapping files with no recorded partition: this node,
> `tactic-demote-node-stale-local-read`, and **`tactic-graph-read-at-ref-cli`**
> — a node the master plan never mentions, which exposes `storeAtRef` as a CLI.
> Shape **(a)** was ruled and the park is **cleared**:
>
> - **This node** owns the required-explicit-argument **contract** plus the four
>   files tabled above.
> - **`tactic-demote-node-stale-local-read`** owns
>   `demote-node-to-implement` **alone**. U8 does **not** touch it — see F9.
> - **`tactic-graph-read-at-ref-cli`** adds a **new CLI** rather than editing
>   these readers, so it is separable under any shape. It is the reason U8 must
>   **not** build a read CLI of its own: change the four signatures, do not
>   invent `storeAtRef` CLI surface.
>
> The node's own body now carries this scope table — `git show
> origin/main:intentions/tactic-explicit-ref-graph-reads.md`.

> **Note the swap against the master plan.** `clear-park` was previously listed
> as deferred to another PR and `demote-node-to-implement` as in scope.
> Clarification 242 reverses both: **`clear-park` is in, `demote` is out.**
>
> Still owned elsewhere and **not** to be touched:
> - **`check-node-selection.ts`** — already converted, and owned by
>   `tactic-graph-execute-fresh-main-read` (`phase: qa`). Clarification **213**
>   settles it: that node is *"an instance with a cross-reference, not absorbed
>   into or superseding the broader node."*
> - **`compute-freshness.ts`** — already converted (explicit
>   `--snapshot`/`--stamp`).
> - **`transition-node`** — claimed by `tactic-graph-ref-split` (`phase: implement`).
> - **`park-node`** — a separate planned PR extracts its `--base` helper.
>   (`clear-park`'s `--base` extraction is that PR's; *this* unit changes only
>   how `clear-park` resolves its tree. Keep the two apart and say so in the PR
>   body.)
> - **`graph-commit`** — a **writer**, not a reader. Its `-C`/cwd resolution is
>   already a ratified standing invariant (clarification **86**); making `-C`
>   mandatory would change every caller.

> **⚠ A required argument is a breaking change to every caller.** Measured
> exhaustively on 2026-08-14: `validate-graph.ts` has **exactly two executable
> call sites**. `.github/workflows/graph-fast-path.yml:32` already passes
> `intentions` explicitly and will **not** break.
> **`.claude/skills/align/scripts/validate-deployment.sh:53` invokes it bare**
> and must be updated in the same PR. About ninety further hits are
> documentation prose; the ones showing the bare form
> (`align/SKILL.md:177,790`, `align-tactics/SKILL.md:443`,
> `grounding-research/SKILL.md:160`, `reading-review/SKILL.md:626,634,646`,
> `align-tactics/references/write-path.md:318`) are doc-accuracy follow-ups.
> Re-confirm before editing:
> `grep -rn "validate-graph" --exclude-dir=node_modules --exclude-dir=.git .`

### F9 — `demote-node-to-implement`: **out of PR1 entirely**

The master plan folds `tactic-demote-node-stale-local-read` into U8 as an
absorbed node, closing with it and contributing one bullet. **Clarification 242
reverses that: the node owns `demote-node-to-implement` alone, U8 does not touch
that file, and the node does not close in PR1.** Do no work on it here. Three
independent reasons, each verified on 2026-08-15:

1. **Its one contributed bullet is already implemented.** The master plan has U8
   lift `## Greenfield shape` item 3 — the `--base` compare-and-swap — and calls
   the current code a lost update with "no `--base` token". That is stale.
   Commit **`156ce3a1`** gave the script both halves:

   ```bash
   # demote-node-to-implement:217  — item 2, the fresh origin/main read
   git -C "$REPO_ROOT" show "origin/main:intentions/$NODE_ID.md" > "$INTENTIONS_DIR/$NODE_ID.md"
   # demote-node-to-implement:254  — item 3, the CAS
   "$SCRIPT_DIR/graph-commit" -C "$REPO_ROOT" --base "$NODE_ID=$FRESH_BLOB" --expect "$NODE_ID=$EXPECT_BLOB" ...
   ```

   Implementing it again would be a no-op at best and a regression at worst.

2. **Its remaining defect is not what U8 would fix anyway.** Only item 1
   survives — `REPO_ROOT` from `SCRIPT_DIR` (`:52-53`) — plus item 2's
   consequence, the scope-fingerprint stamp path inheriting that root (`:75`).
   The node's line citations (`:36`, `:46`, `:115`, `:126-127`) have all moved;
   any future plan for it must be re-derived from the current file.

3. **Its prescribed remedy does not work.** Item 1 says resolve the root **from
   the caller's cwd**. But `transition-node` invokes this script *from inside
   the worker's worktree*, so cwd resolves to the worktree — the same wrong
   answer script-location gives — while the demotion must act on the main
   checkout. **Clarification 243** rules the correct shape: a **required
   explicit tree argument** (clarification 194's reader shape), with
   `transition-node` updated to pass it. `resolve_project_root` would also
   resolve correctly but leaves the tree implicit, which is what 194 exists to
   end. That work belongs to this node, not to U8, and it is **blocked** by
   `tactic-phase-evidence-fingerprint-bound` regardless.

The node stays `raw`, blocked, and open. Record in the PR body that PR1
deliberately leaves it alone.

### Why we implement U1 and U5 anyway — a recorded, accepted cost

Under ref-split (deferred, pre-flight (b)), `ensure_intentions_only_base()` and
`await_checks` are both on its **delete-entirely** list — so U1 and U5 target
code a future ref-split would remove. That is *future* redundancy, not present
supersession, and the disposition is DEFER, so both defects are live today on
the path all ~94 node closures run through.

We implement both anyway. U1 is the highest-severity item here — silent loss of
a node edit, armed by any unpushed local commit — and leaving it means every
closure runs through a known-broken writer for the whole window. The rework risk
is bounded: if ref-split lands, this code is **deleted**, not migrated.

The inverse holds too: **U2 and U8 are things ref-split needs first** — its own
plan makes `validate-graph.ts` the sole push gate and calls it with an explicit
directory. PR1 proceeds under either disposition.

### Work already delivered elsewhere — do not re-implement

- **`noop-verdict` remedy #1 is substantially shipped** by PR #3050. The
  residual is that `verify_landed()` still hashes the working-tree `$NODE_FILE`.
  One line, folded into U1 — **not** a unit. Re-verify per pre-flight (c).
- **`noop-verdict` remedy #1's tree-resolution character is U8's defect class.**
  Do not implement it separately; close node 1 on remedy #2 alone.
- **U2 loses its tree-resolution half.** The node's `validate-graph.ts`
  vacuous-pass complaint **is** U8's `validate-graph.ts` bullet. U2 shrinks to
  the sensor-scoping + PR-CI-call-site half only.

---

## 3. Lanes and units

Eight units land on four files. Grouping by **node** would put four subagents
in one 3715-line bash file; grouping by **file** removes the contention.

| Lane | Model | File(s) | Units, in order |
|---|---|---|---|
| **A** | opus | `packages/intentionsutil/scripts/graph-commit` | **U6 → U1 → U7 → U5** |
| **B** | opus | `src/sensors.ts`, `scripts/validate-graph.ts`, `.github/workflows/graph-fast-path.yml`, `scripts/dump-node.ts`, `scripts/write-node.ts`, `scripts/clear-park`, `.claude/skills/align/scripts/validate-deployment.sh` | **U2 → U8** |
| **C** | opus | `packages/intentionsutil/src/schema.ts` | **U3** |
| **D** | sonnet | `packages/intentionsutil/test/office-hours.test.ts` | **U4** |

**Lanes A–D run concurrently. Units *within* a lane run as sequential subagents,
each handed the previous one's working tree. No two agents ever touch the same
file.**

### How to run a unit

Spawn a subagent with the **Agent** (or Task) tool, `model` set to the value the
unit names:

```
Agent(model: "opus", prompt: "<the unit's Context + Scope, verbatim from this brief>")
```

**Constrain every subagent to working-tree edits only.** No commits, no pushes,
no `graph-commit`, no branch operations. The orchestrating session commits once
per lane after that lane's units finish.

### PR-wide out of scope

`graph-commit`'s multi-bundle stash behaviour; the landing lock
(`refs/graph/landing-lock`); the `noop` short-circuit widening (skip-item 1);
candidate (c) of clarification 241 (moving park content into the node's
`office_hours` record — filed as
`tactic-graph-commit-park-content-durability`, see §7);
`demote-node-to-implement` and `transition-node` (clarifications 242/243);
`park-node`'s `--base` extraction; and anything ref-split would delete beyond
the U1/U5 surfaces named here.

### Lane A — `packages/intentionsutil/scripts/graph-commit` (opus)

> **Lane order is forced.** U6 precedes U1 because U1's guard needs a faithful
> record of what the writer intended to land, and U6 is what makes
> `SNAP_DIR/<id>.md` that record rather than a merge blend. U7 follows U6
> because both touch the `run_merge_node` call sites. U5 is a disjoint region
> (`:1830-1900`) and goes last.

**U6 — keep the writer's original immutable; merged content goes beside it.**

- **Recommended model: opus.** Cross-cutting contract change in a 3715-line
  bash file, with three writer sites and three readers that must stay
  consistent, pinned by regression tests that must keep passing.
- **Context.** See F6. Ruled by strategy clarification **241** (2026-08-15).
  The park that previously blocked this unit is cleared.
- **Scope — writers (all three, do not stop at two):**
  - `check_base_freshness()` — the `cp -- "$out_f" "$SNAP_DIR/$id.md"` at
    **`:810`** writes `$SNAP_DIR/$id.merged.md` instead.
  - `replay_snapshot_onto_base()` — same change at **`:1207`**.
  - `build_commit_plumbing()` — same change at **`:1652`**. *Named by neither
    the master plan nor the node; it is in scope.*
  - `snapshot()` (`:936`/`:939`) writes `$SNAP_DIR/<id>.md` once and is never
    rewritten. Update its header comment at `:919-935`, which currently asserts
    the opposite (*"SNAP_DIR is NOT a frozen pre-merge copy"*).
- **Scope — readers (a freeze without these is the failure mode to avoid):**
  - `ensure_intentions_only_base()`'s replay prefers `<id>.merged.md` when it
    exists, else `<id>.md`. **This is what keeps case 48 green.**
  - `print_verdict` (`:2091-2098`) reads the same preferred path for
    "what this run intended to land".
  - `park_write()` (`:2944-2952`) names **both** paths and labels which is the
    session's own original and which is graph-commit's partial merge.
  - Update the defending comments at `:794-808` and `:1205-1206`, which
    currently justify the clobber.
- **Leave the seam.** `park_write` composes two recommendations — the ordinary
  lost-writer branch (`:2944-2952`) and the delete/modify branch
  (`:2925-2943`) — and both name the preserved-content path. Keep the decision
  of *which content, and where the human finds it* in **one** place rather than
  duplicating the new two-path wording across the two branches. This costs
  nothing here and is what makes the follow-up
  `tactic-graph-commit-park-content-durability` a localized change instead of a
  second sweep through the same function. Do not implement that follow-up.
- **Out of scope.** The tmpdir's durability — candidate (c), filed as
  `tactic-graph-commit-park-content-durability` (§7); the merge algorithm
  itself; anything in U1/U5/U7's regions.
- **Reuse.** `test-graph-commit.sh`'s existing harness; extend it with a case
  asserting that on a **resolved** merge `SNAP_DIR/<id>.md` still hashes to the
  writer's pre-merge content while `<id>.merged.md` holds the blend.
- **Verification.** `test-graph-commit.sh` must pass **unchanged** — in
  particular case 48 (*"far-ahead + stale `--base`: layer-3 merge survives the
  far-ahead rebuild, both fields land"*) and case 22 (`:1551-1581`). If either
  goes red, the replay-preference half is wrong or missing. **Do not weaken
  either test** (`.claude/rules/test-integrity.md`).

**U1 — assert intent against outcome before `noop`.**
*Scope:* before `emit_verdict_and_exit noop` (`:3659`), for each id compare
`SNAP_DIR/<id>.md` against `MAIN_SHA:intentions/<id>.md`. Byte-identical →
genuine no-op. Different → the edit was dropped; die or park, never `landed`.
Make `noop` unreachable on a path that reset the tree
(`ensure_intentions_only_base`, `:1213`, called `:3573`). Keep the existing die
at `:3635` intact. Separately fix `verify_landed()` to hash
`origin/main:intentions/<id>.md` rather than the working-tree `$NODE_FILE` (one
line — confirm against pre-flight (c) first).
*Out of scope:* finding where the edit was originally lost (the node's own open
sub-question); `SNAP_DIR`'s park-path contract (F6); the multi-bundle stash; the
landing lock.
*Dependencies:* none. *Recommended model:* **opus** — concurrency semantics and
a false-negative verification path; the failure mode is silent data loss.

**U7 — distinguish "merger could not start" from "content diverged".**

> **Implement this from the node body, not from this entry.**
> `git show origin/main:intentions/tactic-graph-commit-merge-npx-park-storm.md`
> carries the full plan (§0) with per-unit scope, reuse and verification. What
> follows is the summary plus the corrections that override it.

*Scope:* three sub-units, run as three sequential subagents at the models the
node names:
- **U7.1** (*sonnet*) — replace **both** `npx tsx` spawns (`:995` in
  `run_merge_node()`, `:2968` in `park_write()`) with the ESM loader form
  `node --import tsx/esm <script>`. Preserve `SCRIPT_DIR`-based resolution of
  `MERGE_NODE_SCRIPT` / `STORE_MODULE` (`:334-336`). **Do not** use
  `node_modules/.bin/tsx` — measured refuted (F7).
- **U7.2** (*opus*) — give `merge-node.ts` a **reserved exit code** meaning "I
  ran and failed on these inputs", distinct from any start-up failure (rc 1 is
  ambiguous — F7). Then **all four callers** — `:793`, `:1203`, `:1650`,
  `:2298` — must `die` with the captured stderr when the tool could not start,
  rather than setting `unresolved=1` and reaching `park_and_exit()`. The node's
  own plan enumerates only three; **`:1650` is the fourth and must be
  included.**
- **U7.3** (*sonnet*) — regression coverage: no park on an unrunnable merge
  tool, park preserved on a real divergence. Reuse the `npx` PATH shim at
  `test-graph-commit.sh:674-882`, `set_mode()` (`:885`) and `run_gc()`
  (`:900-965`).

*Out of scope:* the merge algorithm itself; the park path for genuine
divergence; the `SNAP_DIR` copies adjacent to those call sites (F6). Do not
disturb the stage-numbering note at `:2281-2292`, which explains
`try_layer2_resolve()`'s deliberate base/ours/theirs inversion.
*Dependencies:* none. *Recommended model:* per sub-unit above.

**U5 — split rc 2 into content-failure and orphaned-suite.**
*Scope:* `await_checks()` (`:1842`; rc contract comment `:1836-1837`; orphan
detail `:1917-1918`; `check_suite_concluded()` `:1794`). Split the return code,
route the orphan case to a bounded re-push-and-re-stamp under its own attempt
cap, rewrite the operator message. Amend the orphan assertion in
`packages/intentionsutil/scripts/test-graph-commit.sh` (re-locate by string) to
assert the new behaviour; **leave the still-running-suite negative case
untouched**.
*Out of scope:* the populated-conclusion-behind-stale-status desync; the orphan
*detection* logic, which is correct.
*Dependencies:* none (disjoint region); run last in the lane.
*Recommended model:* **opus** — a retry path against protected `main` with a
recorded honest limit on the evidence.

### Lane B — sensors, validate-graph, and the four readers (opus)

**Order is forced:** both units edit `validate-graph.ts` — U2 at the
`validateRegisteredSensorNames` call site (`:93`), U8 at the cwd default (`:73`).

**U2 — scope the sensor-validator failure, and run it where the change is made.**
*Scope:* (i) run `validate-graph.ts` in the PR CI of any branch touching
`packages/intentionsutil`. (ii) `sensors.ts:101` and its call site
`validate-graph.ts:93` — downgrade an unbound *registered name* from repo-wide
write denial to a node-scoped failure. `UNBOUND_SENSOR_NAMES` is at
`read-sensors.ts:1637` (docstring `:1629`).
*Out of scope:* **the tree-resolution half of this node — U8 owns it.** Adding
names to `UNBOUND_SENSOR_NAMES` to quiet the rule. The four stub jobs'
`needs: guard` structure, which is correct as a fast path.
*Dependencies:* none. *Recommended model:* **opus** — the failure mode is
repo-wide write denial; getting the blast radius right is the whole unit.

**U8 — make the tree an explicit required argument on four readers.**
*Scope:* exactly four files, per clarification **242** —
`packages/intentionsutil/scripts/validate-graph.ts` (`:73`, drop the
cwd-relative `"intentions"` default), `dump-node.ts` (`:38-40`, drop the
`import.meta.url` root), `write-node.ts` (`:18-22`, same), and
`packages/intentionsutil/scripts/clear-park` (`:99-100`, `REPO_ROOT` from
`SCRIPT_DIR`). Update `.claude/skills/align/scripts/validate-deployment.sh:53`,
the one executable caller that passes no directory, and correct the SKILL.md
prose listed in F8.
*Out of scope, explicitly:* **`demote-node-to-implement`** — owned solely by
`tactic-demote-node-stale-local-read` (clarification 242); its CAS is already
implemented and its correct shape is ruled separately (clarification 243). See
F9. Also out: `check-node-selection.ts` and `compute-freshness.ts` (already
converted), `transition-node`, `park-node`, `graph-commit`, and `clear-park`'s
`--base` extraction (that is the other PR's; change only how it resolves its
tree). Building a `storeAtRef` CLI (owned by `tactic-graph-read-at-ref-cli`).
*Reuse:* `lib-store-at-ref.ts` / `storeAtRef` as a library (not a new CLI);
`compute-freshness.ts` + `transition-node:161,182,186` as the
wrapper-acquires/function-consumes precedent; `test-park-node.sh` for harness
shape.
*Dependencies:* **U2**. *Recommended model:* **opus** — a cross-cutting
signature change across four files plus every caller; a missed caller is a
runtime break.

### Lane C — `packages/intentionsutil/src/schema.ts` (opus)

**U3 — resolve prose refs against the batch under write.**
*Scope:* `validateGraphProseRefs` (`:1614`, throw `~:1656`) resolves a prose
reference against **the batch currently being written** plus `origin/main`.
*Out of scope, deliberately:*
- **The `/rsi` step-6 prose stopgap.** The node offers a documentation stopgap
  *or* the real validator fix. U3 is the real fix; writing both is dead code.
- **The caller half.** Teaching `dispatch-eval-finding` to recognise ids it is
  about to mint is unnecessary once the validator resolves against the batch.
*Dependencies:* none. *Recommended model:* **opus** — a validator gating every
graph write; a permissive mistake silently admits dangling refs.

### Lane D — `packages/intentionsutil/test/office-hours.test.ts` (sonnet)

**U4 — run the real-repo assertions against a fixture graph.**
*Scope:* the `describe.skipIf(!hasOriginMain())` block at `:860` through the end
of the file (`:895`). Move its assertions onto a **fixture** graph, keeping
**one** explicitly-marked smoke assertion against live `origin/main`.
`hasOriginMain()` is at `:37`; the `origin/main` reads at `:875` and `:890-891`.
*Reuse:* `anode()` at **`:56`** builds a full `IntentionNode` fixture. (The
master plan says `:54`; wrong.) `committed-store.test.ts`'s
`describe.skipIf(!existsSync(...))` is the sibling pattern the file's own
comment at `:859` already cites.
*Out of scope, deliberately:* **the node's "direction 1"** — a planning-time
rule that a data migration and the tightening rejecting its pre-migration
spelling cannot share a PR. That is `/align-tactics` doctrine, not this PR's
code. Recommend it as a follow-up node in the PR body.
*Dependencies:* none. *Recommended model:* **sonnet** — mechanical test refactor
against an existing fixture builder.

### Work to skip — redundant or superseded

1. **Do not widen the no-op short-circuit.**
   `tactic-graph-commit-noop-shortcircuit-head-behind` is deliberately not in
   this PR (it is "not a correctness defect" and belongs to a later
   `graph-commit` simplification PR, at `:2077` and `:3643-3659`). U1 makes
   `noop` unreachable on a path that *reset the tree*; that later PR widens it
   where it *is* reachable. **Say so in the PR body** so it is not re-litigated.
2. Drop U3's `/rsi` step-6 prose stopgap (Lane C).
3. Drop U3's caller half (Lane C).
4. Drop U4's "direction 1" (Lane D).
5. Reduce U1's second guard to its residual (pre-flight (c)).
6. **Do not freeze `SNAP_DIR` naively** (F6). Freezing the copy without also
   making the rebuild replay, `print_verdict` and `park_write` prefer
   `<id>.merged.md` reverts resolved merges and turns case 48 red. Both halves
   or neither. And do **not** take on candidate (c) — the tmpdir-durability
   question is already filed as `tactic-graph-commit-park-content-durability`
   (§7). U6 leaves it a seam; it does not implement it.
7. Keep the out-of-scope readers out of U8, and **do no work on
   `demote-node-to-implement`** (F8, F9).
8. Drop `noop-verdict` remedy #1 and U2's tree-resolution half — retired by U8 /
   PR #3050.
9. **One verification pass, not eight** — §4.

---

## 4. Verification

Run once, after all four lanes are done — not per unit.

```verify
npm test --prefix packages/intentionsutil
packages/intentionsutil/scripts/test-graph-commit.sh
packages/intentionsutil/scripts/test-verify-landed.sh
packages/intentionsutil/scripts/test-demote-node-to-implement.sh
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh --app packages/intentionsutil
.claude/skills/dispatch-propagate/scripts/run-lint.sh
npx tsx packages/intentionsutil/scripts/validate-graph.ts intentions
```

> **Two things the master plan gets wrong here.**
>
> 1. It says `run-unit-tests.sh --pr-scripts` reaches `test-graph-commit.sh`,
>    `test-verify-landed.sh` and `test-demote-node-to-implement.sh`. **It does
>    not.** `--pr-scripts` iterates only
>    `.claude/skills/dispatch-propagate/scripts/test-*.sh`; those three live in
>    `packages/intentionsutil/scripts/` and CI invokes them directly by path
>    (`.github/workflows/unit-tests.yml:264-268`). Run them directly, as above.
> 2. `run-typecheck.sh` **requires** the `packages/` prefix on `--app`; a bare
>    workspace name is rejected with `no such workspace directory`.

`npm test --prefix packages/intentionsutil` is the right form for a package —
vitest's `--project` flag is apps-only.

### Manual probes — one per unit, none covered by the suites above

- **U1** — with a deliberately unpushed local commit on `main`, run a
  `graph-commit` that edits an **existing** node. Confirm the verdict is **not**
  `landed ... context=noop` and that the edit is genuinely present at
  `origin/main` (`git show origin/main:intentions/<id>.md` — never the verdict
  line). Clean up the unpushed commit afterwards.
- **U5** — cannot be provoked on demand; it needs GitHub to orphan a check row.
  Unit-test the rc mapping directly: assert a concluded non-success and an
  orphaned suite produce **different** return codes, and that the orphaned path
  attempts a bounded re-push.
- **U6** — the probe that matters is the one the node was filed about, and no
  suite covers it. Drive a **multi-id** batch where id A's layer-3 merge
  *resolves* and id B's does not, so the batch fails closed and parks both.
  Then assert three things: `SNAP_DIR/A.md` still hashes to A's **pre-merge**
  content; `SNAP_DIR/A.merged.md` holds the blend; and `park_write`'s recovery
  text names both and says which is which. Before the fix, the first assertion
  fails — that is the defect.
- **U7** — force the failure with `PATH` stripped of `npx`, or
  `MERGE_NODE_SCRIPT` pointed at a nonexistent file, on a divergent node.
  Confirm the run dies with an environment error and that **no** `office_hours`
  park reaches `origin/main`. Exercise more than one of the four call sites.
- **U8** — run `validate-graph.ts` from a directory with no `intentions/` and
  confirm it fails with a clear error instead of passing vacuously. Then run
  `.claude/skills/align/scripts/validate-deployment.sh` and confirm it still
  works after the signature change.

---

## 5. Open the PR, then stop

Open an **ad-hoc** PR. There is no carrier node: do **not** set `execution.pr`
or a branch on any node, and do not run any `dispatch-*` script.

```bash
gh pr create --title "pr1: graph write-path integrity" --body-file <file>
```

The PR body should record:

- the **eight** units and which node each closes;
- that **U6 implements ruling (b)** of strategy clarification **241**, fixing
  **all three** clobber sites including `:1652`, which neither the master plan
  nor the node names — and that candidate (c) was **not** adopted and is filed
  as `tactic-graph-commit-park-content-durability`, blocked on this PR (§7);
- that **U8 implements shape (a)** of clarification **242** over exactly four
  files, and that `clear-park` is **in** scope while
  `demote-node-to-implement` is **out**, reversing the master plan;
- that `tactic-demote-node-stale-local-read` is deliberately **untouched and
  not closed** — its `--base` CAS already shipped in `156ce3a1`, its remaining
  defect is ruled separately (clarification **243**), and it stays blocked (F9);
- that the no-op short-circuit widening is deliberately not here (skip-item 1);
- U4's "direction 1" recommended as a follow-up node.

> **⚠ No closing keyword anywhere in the body.** These are graph nodes, not
> GitHub issues, so `Closes #N` buys nothing — and GitHub scans the **entire**
> body for `close`/`closes`/`closed`/`fix`/`fixes`/`fixed`/`resolve`/`resolves`/
> `resolved` followed by `#N` and treats **every** match as a close directive
> for this PR, regardless of context. Paraphrasing does not help; every form is
> a keyword. To narrate another PR's effect use a bare number with no preceding
> keyword: `PR #3050 (for #2989)` — never "which resolved".

**Then halt for author review. Do not merge.**

---

## 6. Author runs `/code-review high --fix --comment`

The author runs this. It reviews the diff, applies what it can to the working
tree, and posts the rest as inline PR comments.

---

## 7. Residuals

After the fix pass:

1. **Re-read the review comments on the PR** — `--fix` does not fix everything,
   and what it left is only visible in the comments.
2. **Apply what it left unfixed**, in the same working tree.
3. For anything **deliberately not fixed**, post a recommendation on the PR
   saying which and why: *fix here*, *follow-up node*, or *decline*, with the
   reason.
4. Re-run §4 after any change.

**Do not merge with unaddressed findings.** A finding is addressed when it is
fixed, or when a posted recommendation explains why it is not.

### Follow-up nodes

1. **Park context durability** — candidate **(c)** of clarification 241, not
   adopted by U6. **Already filed** as
   `tactic-graph-commit-park-content-durability`, landed on `origin/main` at
   `e23fea43`. Nothing to do here; it is listed so the PR body can point at it
   rather than re-derive it.

   It is `blocked_by` **both** `tactic-graph-commit-snap-dir-merge-clobbers-original`
   and `tactic-eval-finding-noop-verdict-hides-dropped-node-edit` — i.e. by U6
   and U1 — so it becomes workable only when this PR merges and those two close.
   That is deliberate: it would collide with both. It rewrites the same
   recommendation text U6 rewrites, and its likely shape (carrying the writer's
   content in `office_hours.recommendation`) makes the parked block
   writer-dependent, which changes the byte-identical idempotent-retry arm
   (`graph-commit:2138-2144`, documented at `:150-161`) that U1 is rewriting.
   U6 is instructed to leave the seam for it; see U6's scope.

2. **U4's "direction 1"** — the planning-time rule that a data migration and a
   tightening that rejects its pre-migration spelling cannot share a PR. That
   is `/align-tactics` doctrine, not this PR's code. **Still to file.**

---

## 8. Merge, then QA of `main`

Merge the PR. Then QA merged `main` — restricted to checks that are
**meaningless before merge**. Run these as subagents.

- **A live `graph-commit` round trip** editing an **existing** node, from a
  checkout carrying a deliberately unpushed local commit. This is U1's exact
  trigger; confirm the edit is present at `origin/main` afterwards and the
  verdict was not a false `noop`. Push or drop the scratch commit when done.
- **`verify-landed`** against merged `main`:
  `packages/intentionsutil/scripts/verify-landed -C <repo> --node <id> --blob <sha>`
  (exit 0 landed / 4 not landed / 1 unknown). It **requires** `--blob` or `--jq`
  after each `--node`; a bare `--node` is a usage error.
- **`validate-graph.ts` on merged `main`** — clean.
- **The U8 probe** — `validate-graph.ts` from a directory with no `intentions/`
  must now fail with a clear error rather than passing vacuously.

> **`/qa-main` is not invocable here.** It derives its target node from the
> worktree **directory basename** and requires the node at `phase: main-qa`.
> From the primary checkout, or from a branch worktree not named after a node,
> it exits 1. Run the checks above directly instead.

---

## 9. Close the nodes, in one batch

Re-run pre-flight (a) first — `git rev-list --left-right --count
origin/main...main` must print `0	0`. A single unpushed local commit re-arms the
U1 drop on the very batch that closes U1's node.

### No park to clear — both were cleared on 2026-08-15

Earlier drafts of this brief told you to `clear-park` the U8 node first. **That
step is done.** The author sitting that ruled clarifications 241/242/243 also
cleared both parks; `office_hours` is `null` on both nodes as of `origin/main`
`42884460`. Confirm rather than assume — if either is non-null, someone
re-parked it and you should stop and read the reason:

```bash
git show origin/main:intentions/tactic-explicit-ref-graph-reads.md | grep '^office_hours'
git show origin/main:intentions/tactic-graph-commit-snap-dir-merge-clobbers-original.md | grep '^office_hours'
```

### Close eight ids in one call

```bash
D="$CLAUDE_JOB_DIR/tmp/close-pr1"; mkdir -p "$D"
npx tsx <worktree>/packages/intentionsutil/scripts/dump-node.ts --out-dir "$D" \
  tactic-eval-finding-noop-verdict-hides-dropped-node-edit \
  tactic-eval-finding-sensor-validator-red-main-blocks-all-graph-writes \
  tactic-eval-finding-eval-finding-forward-crossref-fails-ci \
  tactic-eval-finding-origin-main-data-test-blocks-atomic-schema-tightening \
  tactic-graph-commit-orphan-refusal-misattributed-content-failure \
  tactic-graph-commit-snap-dir-merge-clobbers-original \
  tactic-graph-commit-merge-npx-park-storm \
  tactic-explicit-ref-graph-reads
# prints the base-manifest path -> $BASE
# 2. jq each node's JSON: phase -> "done", and set execution.completion
# 3. write-node.ts each edited JSON  (run the WORKTREE's own copy)
# 4. validate-graph.ts <worktree>/intentions
# 5. graph-commit -C <worktree> --base "$BASE" --expect <id>=<blob> <id> ...
# 6. verify-landed --blob, AND git show origin/main:intentions/<id>.md
```

**`tactic-demote-node-stale-local-read` is deliberately absent.** The master
plan closes it here as absorbed into U8. Clarification 242 removed it from U8's
scope, so PR1 does no work on it and it must **not** be closed — closing it
would claim a fix that was never made. It stays `raw` and blocked. See F9.

### Set `execution.completion`, **not** `execution.resolved_by`

> **⚠ The master plan's closing recipe is wrong.** It says to set
> `execution.resolved_by: <merge sha>`. **`resolved_by` is not a schema field** —
> `grep -n resolved_by packages/intentionsutil/src/schema.ts` returns nothing,
> and `write-node.ts` routes every write through `validateNode`, which **drops
> unknown keys silently**. You would see a clean exit and land nothing.
>
> The real field is `execution.completion`, the `Completion` interface in
> `schema.ts`:
>
> ```ts
> export interface Completion {
>   mergedAt: string | null;        // GitHub PR merged_at, FULL ISO-8601 w/ time
>   mergeCommitSha: string | null;  // GitHub merge_commit_sha (sha on the base)
>   graphCommitSha: string | null;  // manually-backfilled out-of-band landing sha
> }
> ```
>
> A real PR merge sets `mergedAt` **and** `mergeCommitSha` (GitHub REST never
> reports a PR state of "MERGED", so non-null `merged_at` is the merge signal).
> All three null means "reconciled to done with no evidence", which a later
> census step flags. **This correction applies to every PR in the serialized
> plan, not just PR1.**

### All eight close as implemented

Every id in the batch above has a unit in this PR and closes on its own work.
There is no superseded close and no absorbed node — the master plan's
"8 implemented + 1 superseded" (and this brief's earlier "7 + 1") are both
obsolete, retired by clarification 242.

Two nodes need a note appended to their bodies before closing, because in each
case the shipped fix differs from what the node's own text prescribes:

- **`tactic-graph-commit-snap-dir-merge-clobbers-original`** — record that it
  shipped under clarification **241** as ruling (b), that all **three** clobber
  sites were fixed (including `:1652`, which the node never named), and that
  candidate (c) was not adopted and is filed as
  `tactic-graph-commit-park-content-durability` (§7).
- **`tactic-explicit-ref-graph-reads`** — record that it shipped under
  clarification **242** as shape (a), covering four files, and that
  `demote-node-to-implement` was deliberately excluded and remains open on
  `tactic-demote-node-stale-local-read`.

Both nodes already carry the ruling in their bodies from the 2026-08-15
sitting; you are adding the *implementation* record (PR number, merge sha) on
top, not restating the ruling.

### Five hazards on this batch

1. **Dump before you edit, never after.** `dump-node.ts` records
   `git hash-object` of what it reads. Run it after an edit and the manifest
   records a sha that was never committed, so `graph-commit --base` fails
   (`base blob <sha> is unreadable in the local object database`). Recovery:
   `git rev-parse origin/main:intentions/<id>.md` and write `<id>=<sha>` into
   the manifest by hand.
2. **Never re-dump into the same out-dir after editing** — it overwrites the
   JSON with the edited content and silently reverts your work. One dump, then
   edit.
3. **Use a session-unique out-dir.** A fixed name collides with a concurrent
   session and can write *another* node's id through `write-node.ts`.
4. **`dump-node.ts` and `write-node.ts` resolve the repo root from their own
   script location** — until U8 lands, after which they take an explicit
   argument. Either way, run the **target worktree's own copy** by absolute
   path, or pass the explicit tree.
5. **Never trust `graph-commit`'s verdict line.** Verify every id with
   `git show origin/main:intentions/<id>.md` and/or `verify-landed --blob`. A
   `pushed=none context=noop` verdict is a **failure** on an edit, not a
   success — that is literally F1. If `graph-commit` times out, the local commit
   may be made but unpushed; re-run the identical command (it is idempotent)
   with a longer timeout rather than hand-diagnosing.

---

## 10. In-flight PRs — verify, do not assume

For each id check both:

```bash
git show origin/main:intentions/<id>.md | grep -A3 '^execution:'
gh pr list --head <id> --state open
```

All eight were `execution: null` with no open PR carrying their branch names
when this brief was written, so this is expected to be a **no-op** — but verify.

If one **is** found, do not `gh pr merge` it:

```bash
gh pr close <N> --comment "Absorbed by #<Y>"
.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged --node <id>
```

---

## Appendix — errata in `plans/dispatch-rsi-serialized-pr-plan.md`

Carried here so this brief is usable without opening that document.

| It says | Actually |
|---|---|
| `execution.resolved_by: <merge sha>` in every PR's closing recipe | **not a schema field**; `write-node.ts` silently drops it. Use `execution.completion.{mergedAt, mergeCommitSha, graphCommitSha}`. Affects **every** PR |
| U1's die is at `graph-commit:3261` | **`:3635`**; the `noop` exit at `:3659` |
| U2 cites `read-sensors.ts:1184-1215` | that is the ladder-terminus census sensor. Real: `UNBOUND_SENSOR_NAMES` at `:1637` (docstring `:1629`), validator `sensors.ts:101`, sole call site `validate-graph.ts:93` |
| `anode()` at `office-hours.test.ts:54` | **`:56`** |
| `demote-node-to-implement` (path unstated) | `packages/intentionsutil/scripts/demote-node-to-implement`, **not** under `.claude/skills/` |
| `validate-graph.ts` has exactly one call site | one **CI** call site (`graph-fast-path.yml:32`, which already passes `intentions` and will not break). A second executable caller passes **no** directory: `.claude/skills/align/scripts/validate-deployment.sh:53`. Plus ~90 doc-prose hits |
| `run-unit-tests.sh --pr-scripts` reaches the `graph-commit`/`verify-landed`/`demote` suites | it does **not** — it iterates only `.claude/skills/dispatch-propagate/scripts/test-*.sh`. Run those three directly by path; CI does (`unit-tests.yml:264-268`) |
| U6's node says "Not addressed by PR #2989" | #2989 is **merged** (`a6a07ced`) and introduced the behaviour **deliberately**, defended at `graph-commit:794-808`, `:919-935`, `:2091-2098`. The node's provenance line is wrong, but the defect it reports is real: **U6 ships** under clarification 241 (F6) |
| U6 has two `SNAP_DIR` clobber sites | **three** — `:810`, `:1207`, and `:1652` |
| U7's `run_merge_node` has two call sites | **four** — `:793`, `:1203`, `:1650`, `:2298` |
| U8 must convert `check-node-selection.ts` | already converted — it takes a required `--dir` (`:14-15`). So has `compute-freshness.ts` |
| U8 converts `demote-node-to-implement`, and lifts its `--base` CAS | **both wrong.** The CAS and the `origin/main` fresh read already shipped in `156ce3a1` (`:217`, `:254`), and clarification 242 removes the file from U8's scope entirely. `clear-park` takes its place (F8, F9) |
| `tactic-demote-node-stale-local-read` closes as absorbed | it does **not** close in PR1 at all — no unit touches it and it stays blocked (F9) |
| U8's fourth file is `demote-node-to-implement`; `clear-park` is deferred | reversed by clarification 242 — `clear-park` is **in** (`:99-100`), `demote` is **out** |
| PR1 is 8 units closing 9 nodes | **8 units closing 8 nodes** — see the banner at the top |

**Confirmed correct** in the master plan: `graph-commit:793` and `:1203-1206`
(two of U6's three sites), `:995` (U7's npx call), `office-hours.test.ts:853-891`
(U4's block), `schema.ts:244` (`attributes` is `Record<string, unknown>`), and
the `needs: guard` structure of `graph-fast-path.yml`'s four required contexts.

## Appendix — the three align rounds, and the sitting that resolved them

Rounds run 2026-08-14 against `origin/main` `da1c3c7f` in `mode: "tactic"`;
outcomes verified landed at `2d2e77d4`. Both parks were **ruled and cleared** by
an author sitting on 2026-08-15, landed at `42884460`.

| Node | Round outcome | Resolution |
|---|---|---|
| `tactic-graph-commit-snap-dir-merge-clobbers-original` | **parked** — premise overtaken by PR #2989 | **ruled (b)**, clarification **241**. Park cleared. U6 restored |
| `tactic-explicit-ref-graph-reads` | **parked** — scope partition unrecorded across three siblings | **ruled shape (a)**, clarification **242**. Park cleared. U8 keeps four files, loses `demote` |
| `tactic-graph-commit-merge-npx-park-storm` | **finalized** — `status: codified`, `phase: implement`, ~24KB plan body, 3 units | unchanged; the node body is authoritative (§0) |

Per the tactic-target contract a per-node round writes **nothing** onto the
serving strategy, so both rounds left their proposed clarifications unlanded.
The 2026-08-15 sitting landed them, plus a third the rounds did not anticipate:

| # | Subject |
|---|---|
| **241** | What `SNAP_DIR/<id>.md` must hold on the park path — ruled **(b)**, frozen original beside `<id>.merged.md`, all three clobber sites in scope |
| **242** | How the R3 read-path scope is partitioned across the three siblings — ruled shape **(a)** |
| **243** | Which ratified shape binds `demote-node-to-implement`, which is both reader and writer — ruled clarification 194's **required explicit argument** |

> **One round finding was withdrawn.** The snap-dir park claimed the fix "cannot
> be built without breaking cases 48–51". It can: the node's own fix has the
> rebuild replay `<id>.merged.md`, so case 48 passes unchanged. The park
> under-weighted that half. See F6.

### A related decision landed the same day

`tactic-graph-refsplit-blocker-audit` now carries the **ref-split disposition**
(pre-flight (b)): **DEFER**, with the measured finding that 15 of its 23 open
blockers encode quiescence rather than mechanism dependency, and a corrected
exposure table showing PR1's real ref-split exposure is **U1 and U5 only** — not
Units 1–4 as the master plan claims — while U2 and U8 are things ref-split
needs first. Read it if pre-flight (b) is ever revisited.
