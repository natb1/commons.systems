# PR1 execution brief — graph write-path integrity

**This file is self-contained.** A fresh session with no memory of the planning
that produced it can execute PR1 end-to-end from this text alone. You do **not**
need to open `plans/dispatch-rsi-serialized-pr-plan.md`; where that document is
wrong, this brief says so and gives the correction — see the Appendix, which is
long, because the master plan's PR1 section carries several stale anchors.

Every `path:line` anchor below was verified against `origin/main` on 2026-08-14.

The work: implement **7 units** across 4 files, open an ad-hoc PR, stop for
author review, absorb the review residuals, merge, QA `main`, then close **8**
graph nodes.

> **Read this first — the shape changed on 2026-08-14.** The master plan
> describes PR1 as 8 units closing 9 nodes. Three `/align-tactics` rounds were
> run to finalize the three under-specified nodes. **Two of the three parked**,
> and one of those parks retires a unit outright:
>
> | Node | Round outcome | Effect on PR1 |
> |---|---|---|
> | `tactic-graph-commit-snap-dir-merge-clobbers-original` | **parked** — requirement-ambiguity | **U6 is dropped.** The node does **not** close here |
> | `tactic-explicit-ref-graph-reads` | **parked** — requirement-ambiguity | **U8 proceeds** (hand-authored below); node closes after its park is cleared |
> | `tactic-graph-commit-merge-npx-park-storm` | **finalized** — `phase: implement`, full plan body | **U7's plan lives on the node** and is authoritative — see §0 |
>
> All three outcomes are landed on `origin/main` (verified at `2d2e77d4`). Both
> parks carry full recoverable context and a recommendation. Read all three
> before starting: `git show origin/main:intentions/<id>.md`.

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
| 6 | `tactic-graph-commit-snap-dir-merge-clobbers-original` | ~~U6~~ | **NO — parked** |
| 7 | `tactic-graph-commit-merge-npx-park-storm` | U7 | yes (see §0) |
| 8 | `tactic-explicit-ref-graph-reads` | U8 | yes — clear its park first |
| 9 | `tactic-demote-node-stale-local-read` | absorbed by U8 | yes — as **superseded** |

`packages/intentionsutil/scripts/graph-commit` is **3715 lines**. Three of the
seven units live in it, which is why §3 groups by file rather than by node.

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

> **`SNAP_DIR` is the right comparison source, and U1 does *not* depend on the
> dropped U6.** `SNAP_DIR` is deliberately maintained as *"the content THIS RUN
> INTENDS TO LAND"* — refreshed with the merge output when a merge resolves —
> and `print_verdict` already reads it as ground truth for exactly that at
> `:2091-2098`. Intent-to-land is precisely what U1 needs to compare. (U6 would
> have changed `SNAP_DIR` to hold the writer's *pre-merge bytes* instead; that
> is a different question, now parked. U1 is unaffected either way.)

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

### F6 — `SNAP_DIR` on the park path: **U6 is dropped, node parked**

The master plan's U6 asked to freeze `SNAP_DIR/<id>.md` as the writer's
immutable pre-merge content and route merge output to `<id>.merged.md`. **Do not
implement it.** The 2026-08-14 align round parked the node, with this evidence:

1. **The behaviour is a deliberate, documented contract**, not a defect. PR
   #2989 landed it *after* the node was drafted. `graph-commit:794-808` rebuts
   the node's failure scenario verbatim — the refresh is done *"deliberately"*
   so `park_and_exit()`'s "preserved at `$SNAP_DIR`" message points at the
   **reconciled** content, *"the best available starting point for the manual
   merge — rather than at a stale pre-merge copy."* The same contract is
   asserted independently at `:919-935` (`snapshot()`'s header: *"SNAP_DIR is
   NOT a frozen pre-merge copy"*) and `:2091-2098`.
2. **Preserved regression tests pin it.** `test-graph-commit.sh:2247` is a
   self-described *"Unit 1 regression guard"* proving the refresh stops the
   far-ahead rebuild from reverting a concurrent writer's landed edit; cases
   49–51 guard Unit 2; case 22 pins the unresolved half (`SNAP_DIR` **does**
   retain the writer's original when the merge does **not** resolve). The
   node's prescribed fix cannot be built without breaking cases 48–51, and
   `.claude/rules/test-integrity.md` forbids weakening a preserved test to make
   a change land.
3. **The node's factual claim is partly overstated.** `run_merge_node()` is a
   three-way merge whose resolved output still carries the writer's own delta,
   so the writer's *intent* is not lost — only the exact pre-merge byte image.
   And the blend is not "already-landed" content: the batch fails closed and
   lands nothing.

The park asks the author to rule which of three contracts binds `SNAP_DIR` on
the park path: **(a)** PR #2989's reconciled intended-to-land content (dismiss
the node); **(b)** the node's frozen original beside a separate merged copy;
**(c)** neither — because the strategy's own recorded condition that *"a park
whose context lives only in the parking session is a defect"* is arguably
violated by **any** machine-local pointer, and `park_write`'s own text concedes
*"this machine only — may not survive past this session"* (`:2944-2952`). That
would re-scope the node toward carrying the losing writer's content in the
node's `office_hours` record.

> **New finding, not in the master plan: there is a *third* clobber site.** The
> plan names two `cp -- "$out_f" "$SNAP_DIR/$id.md"` sites (`:810` in
> `check_base_freshness()`, `:1207` in `replay_snapshot_onto_base()`). A third,
> structurally identical one is at **`:1652`**, feeding the same `park_write`
> text. Whichever way the author rules, all three are in scope — not two.

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
| `validate-graph.ts` | **cwd**, defaulting to the literal `"intentions"` | `:73` |
| `dump-node.ts` | script location (`import.meta.url`) | `:35-40` |
| `write-node.ts` | script location (`import.meta.url`) | `:18-22` |
| `demote-node-to-implement` | script location (`SCRIPT_DIR/../../..`) | `:53` |

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
— no cwd default, no script-location default. Additionally give
`demote-node-to-implement` an `origin/main` refresh before it reads: it already
fetches at `:69` but then reads its own checkout via `REPO_ROOT` at `:53`.

> **U8's node is parked — and U8 proceeds anyway.** The align round could not
> author the plan because three open nodes claim overlapping files with no
> recorded partition: this node, `tactic-demote-node-stale-local-read`, and
> **`tactic-graph-read-at-ref-cli`** — a node the master plan never mentions,
> which exposes `storeAtRef` as a CLI. The park asks the author to rule the
> partition. The unit below **is** that partition, hand-authored; the park
> exists so the ruling gets recorded as a clarification rather than living only
> in this file. **Clear the park before closing the node in §9.**
>
> `tactic-graph-read-at-ref-cli` adds a **new CLI** rather than editing these
> four readers, so it is separable — but it is the reason U8 must **not** build
> a read CLI of its own. Change the four signatures; do not invent `storeAtRef`
> CLI surface.

> **U8's surface is exactly those four files.** These are owned elsewhere and
> must **not** be touched:
> - **`check-node-selection.ts`** — already converted, and owned by
>   `tactic-graph-execute-fresh-main-read` (`phase: qa`). Clarification **213**
>   settles it: that node is *"an instance with a cross-reference, not absorbed
>   into or superseding the broader node."*
> - **`transition-node`** — claimed by `tactic-graph-ref-split` (`phase: implement`).
> - **`park-node` / `clear-park`** — a separate planned PR extracts their
>   `--base` helper. Note `clear-park:99-100` still roots from
>   `${BASH_SOURCE[0]}` and **is** named by clarification 194; it is
>   deliberately deferred, not overlooked. Say so in the PR body.
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

### F9 — `demote-node-to-implement` writes from a stale read (absorbed into U8)

`tactic-demote-node-stale-local-read` describes the same defect class as F8, one
naming the specific readers. **It gets no round, no unit, and no separate plan.**
It is `blocked_by: tactic-phase-evidence-fingerprint-bound` (open), so it is not
selectable; its body is already plan-complete; and its first greenfield item
contradicts the adopted remedy.

U8 lifts **exactly one** thing from it — `## Greenfield shape` item 3: the
`--base` compare-and-swap on `demote-node-to-implement`, so a demotion cannot
silently discard content that landed on `origin/main` between read and write.
Today it lands via `graph-commit` with **no `--base` token**, making the write a
lost update rather than a detected conflict. Its item 2 (fetch, then read from
`origin/main`) is compatible and folds in.

> **Item 1 is deliberately discarded.** It says resolve the repo root **from the
> caller's cwd** — directly contradicting clarification 194, which requires an
> explicit tree argument with **no cwd default**. Implementing both yields
> incoherent readers. The adopted node wins. Record this in the PR body.

The existing `FRESH_BLOB` rollback trap keeps working unchanged; it becomes the
failure path for a rejected CAS rather than the only safety net.

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

Seven units land on four files. Grouping by **node** would put three subagents
in one 3715-line bash file; grouping by **file** removes the contention.

| Lane | Model | File(s) | Units, in order |
|---|---|---|---|
| **A** | opus | `packages/intentionsutil/scripts/graph-commit` | **U1 → U7 → U5** |
| **B** | opus | `src/sensors.ts`, `scripts/validate-graph.ts`, `.github/workflows/graph-fast-path.yml`, `scripts/dump-node.ts`, `scripts/write-node.ts`, `scripts/demote-node-to-implement` | **U2 → U8** |
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
`SNAP_DIR`'s park-path contract (F6, parked); and anything ref-split would
delete beyond the U1/U5 surfaces named here.

### Lane A — `packages/intentionsutil/scripts/graph-commit` (opus)

> **U6 is dropped — see F6.** The master plan ordered this lane U6 → U1 → U7 →
> U5 because U1 needed U6's immutable snapshot. That dependency does not exist:
> U1 compares *intent to land*, which is exactly what `SNAP_DIR` already holds.
> The lane starts at U1.

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
*Scope:* exactly four files — `validate-graph.ts` (`:73`, drop the cwd-relative
`"intentions"` default), `dump-node.ts` (`:35-40`), `write-node.ts` (`:18-22`),
`demote-node-to-implement` (`:53`; it already fetches at `:69` — make it read
`origin/main`, and add the `--base` CAS on its `graph-commit` call). Update
`.claude/skills/align/scripts/validate-deployment.sh:53`, the one executable
caller that passes no directory, and correct the SKILL.md prose listed in F8.
*Out of scope, explicitly:* `check-node-selection.ts` (already converted),
`transition-node`, `park-node`, `clear-park`, `graph-commit`. Building a
`storeAtRef` CLI (owned by `tactic-graph-read-at-ref-cli`). The absorbed node's
greenfield item 1 (cwd-based root resolution) — deliberately discarded.
*Reuse:* `lib-store-at-ref.ts` / `storeAtRef` as a library (not a new CLI);
`compute-freshness.ts` + `transition-node:161,182,186` as the
wrapper-acquires/function-consumes precedent;
`packages/intentionsutil/scripts/test-demote-node-to-implement.sh` and
`test-park-node.sh` for harness shape.
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
6. **Do not touch `SNAP_DIR`'s park-path contract at all** (F6 — parked).
7. Keep the out-of-scope readers out of U8 (F8).
8. Drop `noop-verdict` remedy #1 and U2's tree-resolution half — retired by U8 /
   PR #3050.
9. **One verification pass, not seven** — §4.

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

- the seven units and which node each closes;
- that **U6 was dropped** and `tactic-graph-commit-snap-dir-merge-clobbers-original`
  stays parked pending an author ruling (F6), including the third clobber site
  at `:1652`;
- that `tactic-demote-node-stale-local-read` closes as **superseded**, with its
  item 1 deliberately discarded (F9);
- that `clear-park` is named by clarification 194 but deliberately deferred to
  the node-mutation PR (F8);
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

### First: clear `tactic-explicit-ref-graph-reads`'s park

It cannot close while parked. The park exists to get the U8 scope partition
recorded as a clarification; this PR **is** that ruling.

```bash
packages/intentionsutil/scripts/clear-park -C <worktree> tactic-explicit-ref-graph-reads
```

Pass `-C` explicitly — without it `clear-park` resolves its own root from script
location (`:99-100`) and can report a false "landed". Verify with
`git show origin/main:intentions/tactic-explicit-ref-graph-reads.md`.

### Then close eight ids in one call

```bash
D="$CLAUDE_JOB_DIR/tmp/close-pr1"; mkdir -p "$D"
npx tsx <worktree>/packages/intentionsutil/scripts/dump-node.ts --out-dir "$D" \
  tactic-eval-finding-noop-verdict-hides-dropped-node-edit \
  tactic-eval-finding-sensor-validator-red-main-blocks-all-graph-writes \
  tactic-eval-finding-eval-finding-forward-crossref-fails-ci \
  tactic-eval-finding-origin-main-data-test-blocks-atomic-schema-tightening \
  tactic-graph-commit-orphan-refusal-misattributed-content-failure \
  tactic-graph-commit-merge-npx-park-storm \
  tactic-explicit-ref-graph-reads \
  tactic-demote-node-stale-local-read
# prints the base-manifest path -> $BASE
# 2. jq each node's JSON: phase -> "done", and set execution.completion
# 3. write-node.ts each edited JSON  (run the WORKTREE's own copy)
# 4. validate-graph.ts <worktree>/intentions
# 5. graph-commit -C <worktree> --base "$BASE" --expect <id>=<blob> <id> ...
# 6. verify-landed --blob, AND git show origin/main:intentions/<id>.md
```

**`tactic-graph-commit-snap-dir-merge-clobbers-original` is deliberately absent**
— U6 was dropped and it stays parked (F6). Do not close it.

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

### Seven close as implemented. One closes as superseded.

`tactic-demote-node-stale-local-read` had no unit and no plan of its own — U8
absorbed it. It must close in the **same batch** as
`tactic-explicit-ref-graph-reads`; closing one alone leaves a duplicate open
against a fixed defect. Append this to its body:

> Closed as **superseded by `tactic-explicit-ref-graph-reads`**, implemented as
> PR1 Unit 8 in PR #\<N\>. The stale-read defect this node reported is fixed by
> the general explicit-tree change; its `## Greenfield shape` item 3 (`--base`
> CAS on `demote-node-to-implement`) was implemented as part of that unit. Item
> 1 (resolve the repo root from the caller's cwd) was **not** implemented and is
> deliberately discarded — it contradicts the adopted remedy in
> `tactic-explicit-ref-graph-reads`, which requires an explicit tree argument
> with no cwd default.

Do **not** set `execution.pr` or a branch on that node — it never had one.
`execution.completion` carries the same merge sha as the others.

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

All nine were `execution: null` with no open PR carrying their branch names when
this brief was written, so this is expected to be a **no-op** — but verify.

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
| U6's node says "Not addressed by PR #2989" | #2989 is **merged** (`a6a07ced`) and introduced the behaviour **deliberately**, defended at `graph-commit:794-808`, `:919-935`, `:2091-2098` and pinned by `test-graph-commit.sh` cases 48–51. **U6 is dropped; the node is parked** |
| U6 has two `SNAP_DIR` clobber sites | **three** — `:810`, `:1207`, and `:1652` |
| U7's `run_merge_node` has two call sites | **four** — `:793`, `:1203`, `:1650`, `:2298` |
| U8 must convert `check-node-selection.ts` | already converted — it takes a required `--dir` (`:14-15`). So has `compute-freshness.ts` |
| PR1 is 8 units closing 9 nodes | **7 units closing 8 nodes** — see the banner at the top |

**Confirmed correct** in the master plan: `graph-commit:793` and `:1203-1206`
(two of U6's three sites), `:995` (U7's npx call), `office-hours.test.ts:853-891`
(U4's block), `schema.ts:244` (`attributes` is `Record<string, unknown>`), and
the `needs: guard` structure of `graph-fast-path.yml`'s four required contexts.

## Appendix — what the three align rounds produced

Run 2026-08-14 against `origin/main` `da1c3c7f`, in `mode: "tactic"`.

Run 2026-08-14 against `origin/main` `da1c3c7f`, in `mode: "tactic"`. All three
outcomes verified landed at `origin/main` `2d2e77d4`.

| Node | Outcome | Where the detail lives |
|---|---|---|
| `tactic-graph-commit-snap-dir-merge-clobbers-original` | **parked**, requirement-ambiguity — premise overtaken by PR #2989; the prescribed fix would break preserved regression guards | `office_hours.reason` + `recommendation` on the node |
| `tactic-explicit-ref-graph-reads` | **parked**, requirement-ambiguity — scope partition unrecorded across three co-extensive siblings | `office_hours.reason` + `recommendation` on the node |
| `tactic-graph-commit-merge-npx-park-storm` | **finalized** — `status: codified`, `phase: implement`, ~24KB plan body, 3 units | the node body (§0) |

Both parks note that, per the tactic-target contract, a per-node round writes
**nothing** onto the serving strategy — so the clarifications they propose are
**not** landed on `strategy-graph-native-dispatch`. A future `/align` interview
or strategy-target `/align-tactics` round must land them. The two proposed
clarifications worth landing:

1. **What must `SNAP_DIR/<id>.md` hold on the park path** for an id whose
   layer-3 merge resolved earlier in the same multi-id invocation — contract
   (a), (b) or (c) in F6.
2. **How the R3 read-path scope is partitioned** across
   `tactic-explicit-ref-graph-reads`, `tactic-demote-node-stale-local-read` and
   `tactic-graph-read-at-ref-cli` — F8. This brief's U8 is the de-facto ruling.

### A related decision landed the same day

`tactic-graph-refsplit-blocker-audit` now carries the **ref-split disposition**
(pre-flight (b)): **DEFER**, with the measured finding that 15 of its 23 open
blockers encode quiescence rather than mechanism dependency, and a corrected
exposure table showing PR1's real ref-split exposure is **U1 and U5 only** — not
Units 1–4 as the master plan claims — while U2 and U8 are things ref-split
needs first. Read it if pre-flight (b) is ever revisited.
