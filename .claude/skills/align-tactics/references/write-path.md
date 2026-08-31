# Write path — mechanics for landing an `/align-tactics` result

This is the mechanical detail behind `/align-tactics` SKILL.md's "Step 2 —
Apply the Workflow result" (and the tactic-target flow, which reuses this same
writer for its single-node result). The Workflow
(`.claude/workflows/align-tactics.js`) authors no files — it returns a
structured result and this session lands every graph write. The write path
mirrors `/align` Step 5 exactly: `write-node.ts` is the single
validation gate (never hand-author YAML frontmatter), and `graph-commit` is
the only landing path.

## Mint ids and resolve temp_refs

The Workflow cannot know the node count or slugs until it decomposes, so each
new tactic in `result.tactics` and each approval gate in `result.gates`
carries a stable `temp_ref` and a `slug_hint`, with its `parent`/`blocked_by`
edges (and each gate's `blocks`) expressed in `temp_ref`s — an edge to a
pre-existing draft/tactic already uses its real node id.

1. **Mint one real node id per new tactic and per gate** from its
   `slug_hint`, deduped against the existing corpus (`grep -l
   intentions/tactic-<slug_hint>.md`, or `grep -rl` the id across
   `intentions/tactic-*.md`, for a collision; disambiguate with a suffix
   before using it).
2. **Build the `temp_ref → real-id` map** over the union of tactics and
   gates.
3. **Rewrite every `parent`/`blocked_by` edge** (and each gate's `blocks`)
   naming a `temp_ref` to its resolved real id; an edge already naming a
   real node id passes through unchanged.

`resolveTempRefs()` in `.claude/workflows/align-tactics.js` (between the
`// >>> resolveTempRefs >>>` sentinels) is the **validated** resolver — feed
it the tactic+gate set with each entry's minted `id`, plus the
`existing_ids` supplied to the Workflow in Step 1, and it returns the
edge-rewritten set or throws on a dangling reference (rule 13) or a
`blocked_by` cycle (rule 15). This step mints the ids and applies that
validated mapping; it does not re-implement the validation.

## Capture a base manifest for every pre-existing node this round edits

Covers: the serving strategy (a drift clarification, a `rounds` bump, a
`last_aligned` stamp, or a park) and any existing tactic finalized from a
draft (`draft_source_id` set). Dump these *before* rewriting, then pass the
manifest to `graph-commit --base` so a stale read of a live node is refused
mechanically rather than by rebase luck (the 2026-07-06 near-miss). Nodes
this round **creates** (new tactics, new gates) have no origin/main blob and
take no `--base` entry.

The two recipes below are alternatives — pick one. Either way, a single
`dump-node.ts` call must name **every** id the `graph-commit` will land: a
manifest only guards the ids it holds, and the rest land with no
compare-and-swap at all.

```bash
BASE=$(node --import tsx/esm packages/intentionsutil/scripts/dump-node.ts --dir intentions \
  --out-dir "$TMPDIR/dump" <pre-existing-id> [<pre-existing-id> ...])
```

For a single-node tactic-target session (finalize/re-plan of one
`tactic-<slug>`), the manifest and commit name exactly one id:

```bash
BASE=$(node --import tsx/esm packages/intentionsutil/scripts/dump-node.ts --dir intentions \
  --out-dir "$TMPDIR/dump" <tactic-id>)
packages/intentionsutil/scripts/land-align-round --terminal <tactic-id> \
  --base "$BASE" -m 'graph: finalize <tactic-id>' <tactic-id>
```

`land-align-round` is the wrapper around `graph-commit` used for the round's
**final** landing call — it passes `--base`, `-m`, and the positional ids
through verbatim and, in the **same process**, records this session's terminal
disposition via `mark-node-terminal` (`align-round` on a clean land, `park`
when `graph-commit`'s concurrent-edit fallback parked the node). `--terminal`
names exactly one node — this session's own target, here the `tactic-<slug>`
being finalized — and is never inferred from the positional ids, which
routinely include child tactics this session does not own. See Step 4 below.

**Capture the manifest at the read, before any write, and never re-dump over
an edited worktree.** The manifest's claim is "this is the content that was
read" — so it must be taken at the session's **read** step (the
strategy-target flow's "Gather the input", or the tactic-target flow's node
read), before `write-node.ts` or the body `Edit` touches anything, not later
in Step 2. Do **not** re-run `dump-node.ts` in a worktree that already holds
an edit, including during a `graph-commit` timeout/`git reset --mixed`
recovery — a dump taken after the writer's own edit records that in-flight
content as the base, defeating the compare-and-swap entirely.

**A lost manifest is an unverifiable state — park, do not recompute.** Never
manufacture a base from the *current* remote tip (`git rev-parse
origin/main:intentions/<id>.md`): that records content the session never read,
so `assert-node-fresh` compares the recorded blob against an identical
`FETCH_HEAD` blob and always exits 0, and `graph-commit`'s
`check_base_freshness()` sees `base == theirs` and resolves the three-way
merge wholesale to `ours` — silently discarding anything a concurrent writer
landed between the read and the recompute. It is the same silent revert as the
2026-07-31 incident with the operands swapped. When the manifest is gone, park
the node — `office_hours: {reason, since}` per the Parks section below — with
a reason naming the lost manifest and recommending a fresh `/align-tactics
<node-id>` round. The only admissible reconstruction is one that names the
blob the session actually read — the provision-time sha (`git rev-parse
<provision-time-sha>:intentions/<id>.md`) or the sha recorded in the worker's
provisioning record — never the current tip.

This is not theoretical: on 2026-07-31 a re-dump after the edit made
`base == ours`, so
`check_base_freshness()`'s three-way merge resolved cleanly to `theirs` and
silently reverted a 310-line finalized plan body to a 2-line draft stub,
reporting nothing.

## Artifact-owner placement (strategy clarification 27)

`serves` names the strategy that actually owns the artifact the tactic
changes. Normally that is the strategy under decomposition, but a byproduct
that genuinely changes a different strategy's artifact (e.g. a finalized
draft retained here that touches another strategy's surface) uses an honest
multi-entry `serves` naming every owning strategy — never a force-fit onto
the strategy being decomposed just because it is convenient. When no
strategy owns the artifact, surface the gap (a park, or a note for the
author) instead of assigning ownership by proximity.

## Per node (tactic or gate)

1. **Frontmatter via `write-node.ts`.** Construct the full node JSON from
   the Workflow's tactic/gate object — `kind: "tactic"`, `owner`, `status`
   (a claude-eligible tactic `codified`; a born-parked gate
   `owner: human`, `status: delegated`), `serves: [<strategy-id>]` (rule 7
   requires a tactic's `serves` resolve to a strategy), `parent` for a
   subtree child, `blocked_by` (the resolved edges from the map above),
   `validates` for a signal-validating tactic. A tactic that carries a
   non-null `body_markdown` and is not a park target lands
   `phase: "implement"`; a born-parked tactic or gate (in `result.parks`,
   or carrying `office_hours`, or a gate) **omits** `phase` and sets
   `office_hours` (see Parks, below). Leave `execution: null` — the
   execution object is the router's live in-flight record, populated when
   it launches the worker in a worktree, not plan-time state. These are
   **first-class** frontmatter fields (`schema.ts` promoted
   `phase`/`execution`/`validates`/`blocked_by`/`office_hours`/`rounds`);
   write them at top level, not squatted under `attributes` —
   `validateNode` silently drops unknown top-level keys, so a mistyped
   field vanishes. Pipe or `--file` the JSON into `write-node.ts`:

   ```bash
   node --import tsx/esm packages/intentionsutil/scripts/write-node.ts --dir intentions \
     --file "$TMPDIR/tactic.json"
   ```

2. **Freshness assertion before the body write.** The body write is a
   *wholesale replacement* — `body_markdown` is not merged into the existing
   body — so it must be preceded by a freshness assertion against the same ref
   the write will land on. Run, from the worktree:

   ```bash
   .claude/skills/dispatch-propagate/scripts/assert-node-fresh \
     --base "$BASE" <id> [<id> ...]
   ```

   naming **every** id this round will write a body for. Exit 0 means no
   named node moved on `origin/main` since the base was captured — proceed.
   A non-zero exit means the node moved (or the fetch failed, or a
   pre-existing id is missing from `$BASE`): **do not write the body.** The
   guard compares the recorded base blob against `origin/main`, never the
   on-disk file, so the frontmatter `write-node.ts` just landed does not
   trip it.

   On a refusal naming a moved node, take **one** bounded retry. Step 1 above
   already rewrote the node's frontmatter on disk, and `dump-node.ts` hashes
   the **on-disk** file — so the retry must first restore the worktree copy to
   the remote content, or the new manifest would record this writer's own
   in-flight frontmatter as the base. In order:

   ```bash
   git fetch origin main
   git checkout origin/main -- intentions/<id>.md
   ```

   Then re-read that node from `origin/main`
   (`git show origin/main:intentions/<id>.md`), rebuild `args` from the fresh
   body, re-invoke the Workflow once, capture a **new** base manifest into a
   **fresh `--out-dir`** (never a second dump into the old one, and never a
   dump over an edited file), re-run `write-node.ts`, and re-run
   `assert-node-fresh`. If the second check also refuses, or the refusal is a
   fetch failure or a missing `--base` entry, **park** the node —
   `office_hours: {reason, since}` per the Parks section below — with a
   reason naming the intervening commit and recommending a fresh
   `/align-tactics <node-id>` round. Never overwrite, and never end the pass
   without one of these two dispositions.

3. **Plan body via `Edit`.** `write-node.ts` lands only frontmatter;
   `writeNode` preserves an existing tactic body verbatim across
   frontmatter-only rewrites. For each tactic with a non-null
   `body_markdown` (the Workflow merged the authored plan onto the tactic
   by `temp_ref`, from `PLAN_SCHEMA`'s `body_markdown`), immediately `Edit`
   the node body (everything after the closing `---` fence) to that
   `body_markdown`. When finalizing a draft, this replaces the retained
   draft body with the plan. A born-parked tactic or gate carries no
   implement-phase body — only its statement and the reason it needs a
   human.

4. **Land via `graph-commit`.** One `graph-commit` per tactic, or a small
   batch (e.g. a parent plus its immediate children, the drift-clarified
   strategy alongside the round's tactics, or a split-parent tactic
   alongside its new born-parked sibling) in one call:

   ```bash
   packages/intentionsutil/scripts/graph-commit --base "$BASE" \
     <tactic-id> [<tactic-id> ...] [<strategy-id>]
   ```

   **The round's FINAL landing call — and only that one — goes through
   `land-align-round` instead:**

   ```bash
   packages/intentionsutil/scripts/land-align-round \
     --terminal <target-node-id> --base "$BASE" -m '<message>' \
     <tactic-id> [<tactic-id> ...] [<strategy-id>]
   ```

   `land-align-round` invokes `graph-commit` with `--base`, `-m`, and the
   positional ids passed through verbatim, then writes this session's terminal
   disposition marker in the **same process** as the land — the guarantee
   `park-node` and `transition-node` already carry, and the one this session
   used to lack when the marker was a separate call a turn or more later (a
   session that died in between left the round landed on `main` with no
   declared disposition, and the tick's terminal-without-disposition sweep
   parked the node; confirmed 3x in production). `--terminal` names exactly
   one node — this session's own target (the tactic-target id in tactic mode,
   the strategy id in strategy mode) — and is never inferred from the
   positional ids, which routinely include child tactics this session does not
   own. `mark-node-terminal`'s own ownership gate makes the call safe
   unconditionally; it is a no-op in an interactive run.

   A **multi-call** round keeps bare `graph-commit` for every earlier call. A
   marker written after call 1 of 3 would declare a partially landed round
   terminal, making it reapable mid-round — converting a failure the sweep
   currently catches into a silent one.

   A split's parent edit and its new sibling must never land as two
   separate `graph-commit` calls — the 2026-07-18 near-miss (`c037cec7`
   landed the parent alone; the follow-up sibling-add call lost the push
   race five times and landed nothing, recovered same-day as `032768e5`)
   is the concrete failure this closes.

   Pass `--base "$BASE"` whenever the call touches a pre-existing node;
   omit it for a round that only creates new tactics. `--base` covers only
   the dumped pre-existing ids — newly created ids in the same call are
   simply absent from the manifest and unchecked. `graph-commit` stages
   exactly `intentions/<id>.md` for each id (frontmatter and the body
   `Edit` both live there), commits, stamps the four required checks via
   the `graph/**` fast path, and fast-forwards onto `main` with a bounded
   rebase-retry loop.

### Discriminating the exit-1 cases

`graph-commit` has **three** distinct exit-1 cases. The parking
*announcement* (`... parking node(s) — this writer's content is NOT landed`)
does not separate them: it prints **before** the parking write is pushed, so
it appears on two of the three. Only the post-push confirmation does:

- **Park landed** — the announcement, then `parked <ids> (office_hours set
  on the origin/main content) ... pushed to main`. A concurrent writer landed
  an overlapping edit to the same node: the node is on `main` with
  `office_hours` set instead of the intended content, and this session's
  unlanded content is preserved on disk.
- **Park attempted, not landed** — the announcement, then `could not land
  the parking write ... office_hours set locally but not pushed to main`.
  Nothing reached `main`: the node is still unparked, at a working phase,
  with `office_hours: null`. The local worktree holds the only copy of both
  this writer's content and the park.
- **No announcement at all** — instead the busy-main exhaustion error ending
  `... retry later` — nothing landed and no `office_hours` was set: `main`
  stayed busy (or the required checks never stamped green) across all
  `MAX_PUSH_ATTEMPTS`, with no semantic conflict.

Either way, report it and stop — do not retry automatically within this
session.

On the round's final call, **`land-align-round` performs this discrimination
itself** and writes the matching marker: `park` **only** on the park-landed
case (the node really did reach a terminal disposition — an `office_hours`
park on `main` — even though this writer's content did not land), and **no
marker at all** on the other two (nothing landed and nothing parked on
`main`, so there is no disposition to declare and the session stays held for
the tick's terminal-without-disposition sweep). It keys that decision on the
post-push confirmation, never on the announcement — a marker written for an
unlanded park would let the job and its worktree be reaped while the only
copy of the round's content lives there. Either exit code is propagated
unchanged. So this session no longer decides *which* marker to write — it
still reads the stderr, reports which case occurred, and stops.

## Parks — writing `office_hours`

For every park (a strategy-wide drift/decompose/plan park from
`result.parks`, or a tactic-target park), set `office_hours: {reason,
since}` on the target node via `write-node.ts`, landed in this round's
`graph-commit`. A park `target` is either a real id (the strategy, or a
pre-existing tactic) or a `temp_ref` (a new tactic whose plan agent parked,
or a decompose-forced park) — map a `temp_ref` target through the id map
above first. `since` is `date -u +%Y-%m-%d`, computed here (the Workflow has
no way to run `date`), never hand-guessed. The `reason` text — including its
trailing `Recommend: <next step>.` sentence — comes from the Workflow's park
object; see `references/autonomy.md` for the park-time recommendation
convention this reason text must satisfy. A drift-side strategy park is
applied the same way, on the strategy node.

Separately, land each `result.drift.clarifications_to_add` entry as a dated
`clarifications` entry on the strategy (the immaterial-observation path —
no park); the material premises and failed Side-A conditions arrive as
strategy parks in `result.parks` and are applied as above.

## Prunes and greenfield drops

Apply each `result.prunes` entry by dropping the named draft the round does
not need (record why in the `graph-commit` message). `result.greenfield_drops`
name units the Workflow already excluded against a superseding node —
nothing to mint; record the drop in the round's report.

## Validate and report

After landing, run `node --import tsx/esm
packages/intentionsutil/scripts/validate-graph.ts intentions` (the store directory is a required argument, clarification 194/242)
and report the round: the tactics landed (with their minted ids), parks
written, prunes/greenfield drops, and the Workflow's `disposition`.

## Strategy round accounting

Ensure the serving strategy carries a `rounds` object (`validateGraph` rule
12 — strategies only). On the first round, initialize `rounds: {count: 0,
last_completed: null, last_aligned: null}` if null.

- `count` increments and `last_completed` timestamps when the round's
  **final** tactic completes — a completion-time write behind prod
  verification (`intentions/tactic-graph-native-dispatch.md` §1.1; in the
  bootstrap interim with no live router, that stamp is made by hand at
  completion).
- `last_aligned` is a **separate, landing-time** stamp: when a
  strategy-target round lands its tactics for a strategy, this session
  also sets that strategy's `rounds.last_aligned` to the round's commit
  date (`date -u +%Y-%m-%d`) via `write-node.ts`, bundled into the same
  `graph-commit` as the round's tactics. `last_aligned` tracks when the
  strategy was last decomposed, distinct from `count`/`last_completed`,
  which stay keyed to tactic-completion time (per clarification 22).
- A **per-node finalize** invocation (`/align-tactics <tactic-id>`) does
  **not** stamp `last_aligned` — it is not a strategy round and never
  bumps `rounds` at all (per clarification 52).

Any strategy frontmatter this session does change (a drift clarification, a
park, the `rounds` init, the `last_aligned` stamp) lands via `graph-commit
<strategy-id>`, bundled with the round's tactics when small.

## Fingerprint honesty

`execution.strategy_fingerprint` is a **per-strategy map**
`{<strategy-id>: {hash, sha}}` — one entry per serving strategy — that the
router's soft-freeze trigger compares against each serving strategy's
current substance (strategy clarification 10).

At mint time this session stamps only the **decomposed** (or, for a
tactic-target re-plan, the **re-evaluated**) strategy's entry:
`{<strategy-id>: {hash: <fingerprint>, sha: <origin/main sha>}}`, where
`hash` is the value printed by

```bash
node --import tsx/esm packages/intentionsutil/scripts/strategy-fingerprint.ts <strategy-id>
```

run against a fresh `origin/main` at stamp time — the single runnable
callsite for `strategyFingerprint(strategy)`
(`packages/intentionsutil/src/router.ts`); never hand-compute the hash, and
never re-derive the recipe inline — always run this command. `sha` is the
origin/main commit the hash was taken against, obtained with `git rev-parse
origin/main` in the bootstrap-interim hand-stamp path (a live router passes
it through `apply-node-transition.ts --strategy-sha`).

A serving strategy absent from the map is never stale (per-strategy null),
so an honest multi-serves tactic is not born frozen against its other
serving strategies; those entries are filled by whichever session decomposes
or re-evaluates each of them. Untouched sibling-strategy entries in the same
map are left as-is — this session converts only the key it is re-stamping,
never a key it is not touching (opportunistic conversion, not bulk
migration). A tactic not yet advanced still carries `execution: null` (no
map to stamp); the map is seeded the first time an `execution` object
exists. The bare-string form is deprecated-legacy — never emit it. In the
bootstrap interim with no live router, the mint-time stamp is made by hand
at completion; the freeze-on-mismatch rule is otherwise discharged by
running re-evaluation in the same session as the strategy edit.

Dropping the bare-string form entirely, and making `validate-graph`
**reject** it, is sequenced future work (migration step 4), not this change
— bare strings remain valid deprecated-legacy, and only classification-touched
keys convert to the `{hash, sha}` object form.
