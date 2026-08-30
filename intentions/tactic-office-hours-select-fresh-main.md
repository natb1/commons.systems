---
id: tactic-office-hours-select-fresh-main
kind: tactic
statement: office-hours-select.ts performs its own local origin/main freshness
  read so every consumer inherits it, retiring the wrapper-only
  park_live_on_main duplication
owner: ai
status: codified
parent: null
rationale: Byproduct of the 2026-07-25 concurrency/serialization review,
  resolving the purity-premise clarification recorded the same day. The
  origin/main park-liveness guard lives only in office-hours-graph
  (park_live_on_main), so every other consumer of the selector must reimplement
  it; a stale-worktree false positive has been observed live, and this round's
  subagent sweep had to be told in prose to re-check origin/main.
  graph-select-target already sets the precedent by snapshotting origin/main
  itself via git archive.
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boosts:
    "1": 0.02
  rationale: >-
    Bootstrap re-scale 2026-07-30: demoted from the pre-bootstrap 85-90 band to
    10. These are ordinary improvements, not integrity defects; at 85-90 they
    outranked strategy-main-health (101 resolved) and flooded the selector hot
    band. Interim scaffolding only; tactic-attention-tier-ranking and
    tactic-attention-boost-scripts retire this numeric scheme.


    NAMESPACING STOPGAP 2026-08-11: magnitude compressed from 10 to 0.02 so this
    boost can no longer lift the node out of its parent strategy's band. The
    bound - a tactic boost is namespaced to its strategy's rank and must never
    cause the tactic to outrank a tactic of a higher-ranked strategy - is
    recorded doctrine on strategy-recursive-self-improvement but is NOT yet
    enforced by the resolver; tactic-attention-namespaced-rank makes it
    structural. Until then the flat additive sum defeats it, so the magnitudes
    are compressed by hand onto a 0.01-per-level ladder that preserves the
    original ordering WITHIN the band. Original magnitude preserved at
    attributes.pre_namespacing_boost for restoration.
phase: main-qa
execution:
  branch: tactic-office-hours-select-fresh-main
  pr: 2976
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-04T09:01:13Z
    mergeCommitSha: 8cce4045f46367de2c1717abe1ffcfa88d8ce3f4
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by:
  - tactic-office-hours-concurrency-dedup
office_hours:
  reason: 'Awaited event still has not occurred: no live
    office-hours-graph/office-hours-select.ts invocation (targeted launch,
    not-parked message, or held/liveness line) appears in journalctl since PR
    #2976 merged 2026-08-04T09:01:13Z, now ~33h and ~130 dispatch-sweep ticks
    later. Re-checked journalctl --user across
    dispatch-claude-daemon/dispatch-sweep-periodic/dispatch-heartbeat since the
    merge: zero office-hours: prefixed runtime lines. Also checked ~565 session
    transcripts modified since the merge for a "/office-hours" command
    invocation: none found. Root cause: office-hours-graph is a
    human/interactively-invoked entry point — dispatch-route and
    graph-select-target never select or dispatch office_hours-phase nodes, and
    dispatch-sweep/-tick/-heartbeat only reference office-hours-graph in
    comments, never exec it. So the awaited event depends on an actual
    /office-hours session or manual office-hours-graph run happening at least
    once post-merge, not on tick cadence alone. Earliest useful re-check: after
    the next completed /office-hours session (human-run or dispatched) of ANY
    node, or after a direct grep of journalctl for an "office-hours:" runtime
    line.'
  since: 2026-08-05
  recommendation: 'No author decision needed — re-selection only. Blocker
    tactic-office-hours-concurrency-dedup confirmed phase: done at origin/main.
    PR #2976 confirmed MERGED (gh pr view 2976: state MERGED, mergedAt
    2026-08-04T09:01:13Z). Both needs-main residue items (wrapper-live-dispatch,
    stale-worktree-live-repro) remain Verifiability: WAIT for the same reason:
    no live office-hours-select.ts/office-hours-graph invocation has landed in
    journalctl or session transcripts since the merge. Do not re-park
    indefinitely on a fixed timer — the next /qa-main re-read should first
    confirm whether any /office-hours session has actually run (grep transcripts
    for a "/office-hours" command, or journalctl for an "office-hours:" runtime
    line) before concluding the wait is still warranted.'
  session_type: other
pace_exempt: false
rounds: null
attributes:
  pre_namespacing_boost: 10
---
# office-hours-select.ts performs its own local origin/main freshness read so every consumer inherits it, retiring the wrapper-only park_live_on_main duplication

## Context

`packages/intentionsutil/scripts/office-hours-select.ts` is the single
disposition oracle for office hours: it prints exactly one of
`launch <node-id> <cwd>` / `empty` / `empty not-parked <node-id>` on stdout
(plus an advisory `NOTE — …` blocker line on stderr). Today it reads the
**local working tree** store — `listNodes(intentionsDir)` at
`office-hours-select.ts:105`, with `intentionsDir` hardcoded to
`<repoRoot>/intentions` at `:36-38` — so its answer is only as fresh as the
checkout it runs in. A stale PR-branch worktree therefore reports a node as
parked after `origin/main` already shows the park cleared (observed live), and
— the more common direction — a checkout that has not pulled recently never
sees a park that a background dispatch job landed on `origin/main` minutes ago.

The only guard today lives in bash: `park_live_on_main()` in
`packages/intentionsutil/scripts/office-hours-graph` (`git show
origin/main:intentions/<id>.md` + an awk/grep frontmatter test). Because it
sits in the wrapper, no other consumer inherits it — the `/office-hours`
skill's readiness relay (`.claude/skills/office-hours/SKILL.md:360`) does not,
and a recent review sweep had to be told in prose to re-check `origin/main` by
hand for ten candidate nodes. This change moves the freshness guarantee into
the TypeScript selector so every consumer inherits it, and retires the bash
duplication.

## Doctrinal basis (settled 2026-07-25, do not re-litigate)

`tactic-office-hours-concurrency-dedup` recorded a decision to make zero
changes to `office-hours-select.ts`, reasoning that daemon/network checks
would violate its "no gh, no daemon, no network" contract. The author amended
the premise this round: the real contract is avoiding Claude sequencing
system/network commands that a script could do with fewer round trips and
fewer tokens (recorded on `strategy-token-economy`). A `git`-in-TS read is
therefore preferred, not merely tolerated — doing it once in the script beats
every caller re-deriving it. `graph-select-target` already does exactly this
with `git archive origin/main`, and `office-hours-select.ts` already performs
fs reads, so it was never pure in the sense the annotation implied.

## Dependency — blocked on PR #2945 landing first

`tactic-office-hours-concurrency-dedup` (PR #2945, open as of 2026-07-25) is
concurrently rewriting `resolve_directive` in this same file — adding a
`job_id_for_name` liveness check inside the same `while` loop that calls
`park_live_on_main`, a `held <node-id> <job-id>` verb, and worktree-provisioning
in the `launch)` case. Unit 5 below (which deletes `park_live_on_main` and
rewrites `resolve_directive`) will conflict at the text level with that PR
regardless of landing order, so this node is `blocked_by:
[tactic-office-hours-concurrency-dedup]` and must not enter implementation
until PR #2945 merges. **By the time this plan executes, `office-hours-graph`
will already look like PR #2945's post-merge version, not the line numbers
below** (which describe the pre-#2945 file) — Unit 5 anchors by function/verb
name for exactly this reason; re-read the file fresh before editing it.

## Decisions settled this round (do not re-litigate)

1. **The selector reads the WHOLE store at `origin/main`, not a per-node
   veto.** `git archive <ref> intentions` on the real store measures ~11 ms,
   so a snapshot is cheaper than N `git show` calls and yields one *consistent*
   source of truth: park state, attention rank (`resolveAttention` needs the
   full node set), `blocked_by` phases, and node existence all come from the
   same tree. A narrow per-node veto would leave a hybrid (park state from
   main, ranking from local) and would still miss the false-negative direction
   (a park that exists only on main, never seen locally). This also aligns
   office hours with the dispatch router's established doctrine —
   `.claude/skills/dispatch-propagate/scripts/graph-select-target:19-20,
   183-196` reads the store "at origin/main ONLY (never a branch, never the
   working tree)" via `git archive origin/main intentions | tar -x`.
2. **Worktree cwd stays LOCAL.** `resolveSessionCwd(repoRoot, nodeId)`
   (`office-hours-select.ts:52-61`) resolves
   `<repoRoot>/.claude/worktrees/<id>` — a local filesystem fact, unchanged.
   Only the *store* moves to the ref.
3. **No new stdout verbs, and no `git fetch` inside the TS script.** A node
   parked locally but cleared on main now simply comes back
   `empty not-parked <id>` (targeted) or drops out of the queue (untargeted) —
   the reclassification this tactic asks for, with zero contract change. The
   selector reads the **already-fetched** `origin/main` ref;
   `office-hours-graph` already fetches at top level before selecting.
   Verified against the current file: the
   `git … fetch origin main --quiet` at `office-hours-graph:137` runs before
   `directive=$(resolve_directive)` at `:141` — the ordering is already
   correct today. Do not "fix" it and do not add a fetch to the TS script.
   (Git worktrees share the repo's refs, so a stale worktree sees the same
   freshly-fetched `origin/main` as the main checkout.)
4. **The bash `cleared <node-id>` verb is deleted, not preserved.** Keeping a
   "was locally parked, already cleared on main" narrative would require bash
   to re-read the local store — reintroducing exactly the duplication this
   tactic retires. Instead, Unit 5 rewords the existing `empty not-parked`
   message to say *not parked on origin/main*, so the human is not confused by
   a local file that still shows a park.
5. **Explicitly out of scope:** the daemon-liveness dedup from
   `tactic-office-hours-concurrency-dedup` / PR #2945 — `job_id_for_name()`,
   the `held <node-id> <job-id>` directive verb, the skip-to-next-rank
   liveness walk, and any worktree-provisioning in the `launch)` arm. Unit 5
   removes *only* the `park_live_on_main` machinery and must leave the
   `--list` walk itself in place, because #2945 needs that loop for liveness
   skipping.

## Unit 1 — `listNodesAtRef`: read the intentions store at a git ref

**Scope.** Add `packages/intentionsutil/scripts/lib-store-at-ref.ts`, a
script-layer helper exporting:

```ts
export function listNodesAtRef(repoRoot: string, ref: string): IntentionNode[]
```

Model the file — placement, header comment rationale, error posture — on the
existing sibling `packages/intentionsutil/scripts/lib-deleted-node-ids.ts:1-7,
55-65` (a shared scripts-layer git helper deliberately kept OUT of `src/` so
`src/` stays fs/git-free; `packages/intentionsutil/SEPARABILITY.md:22-28`
records `src/store.ts` as layout-agnostic library API — keep it that way).

Implementation shape:
1. Precheck the ref has a store:
   `execFileSync("git", ["-C", repoRoot, "cat-file", "-e", `${ref}:intentions`])`
   — mirrors `graph-select-target:187`. On failure throw a descriptive `Error`
   naming `repoRoot`, `ref`, and the remedy (`git fetch origin main`, or pass a
   different `--ref`). No silent empty-list fallback
   (`.claude/rules/code-style.md` prefers clear errors over defensive
   fallbacks).
2. `const tar = execFileSync("git", ["-C", repoRoot, "archive", ref,
   "intentions"], { maxBuffer: 64 * 1024 * 1024 })` — capture the archive as a
   Buffer, no `encoding`. Use `maxBuffer` as `read-sensors.ts` does for its own
   large-output git call (the real store is a few MB, over the 1 MB default).
3. `const dir = mkdtempSync(join(tmpdir(), "intentions-at-ref-"))`, then
   `execFileSync("tar", ["-x", "-C", dir], { input: tar })`.
4. `try { return listNodes(join(dir, "intentions")); } finally { rmSync(dir, {
   recursive: true, force: true }); }`.

**Do NOT** implement this as a shell pipeline (`git archive … | tar -x`) via
`execSync`: without `pipefail`, a failing `git archive` still exits 0 through
`tar`, which happily extracts an empty stream — producing a silently empty
store and a bogus `empty` queue. Two separately status-checked `execFileSync`
calls avoid that class entirely.

**Reuse, do not reimplement:** `listNodes`
(`packages/intentionsutil/src/store.ts:128-134`) already does the
`readdirSync` + README exclusion + `readNode` → `extractFrontmatter` +
`parse` + `validateNode` pipeline (`store.ts:101-105`). Because the snapshot
is a real directory, no frontmatter parsing is written by hand anywhere in
this plan.

**Error posture:** a schema-invalid node at the ref makes `validateNode` throw
`IntentionSchemaError`; let it propagate. A malformed node on `origin/main` is
a repo-integrity failure, not an expected input to swallow silently — and the
bash caller already fails loudly on a selector crash
(`office-hours-graph:118-121`).

**Out of scope:** any caching, any `git fetch`, any change to `src/store.ts`,
and rewiring `select-targets.ts` / `graph-select-target` to use this helper (a
tempting follow-up; not this tactic).

**Recommended model:** opus (new architectural primitive; failure-mode
reasoning about the `execSync` pipeline pitfall is the kind of subtle
correctness judgment the model-selection heuristic reserves for opus).

## Unit 2 — Tests for `listNodesAtRef`

**Depends on:** Unit 1.

**Scope.** New `packages/intentionsutil/test/store-at-ref.test.ts`.

Copy the fixture pattern verbatim from
`packages/intentionsutil/test/deleted-node-ids.test.ts:8-60` — a
`scratch: string[]` + `afterEach` cleanup, a `git(cwd, ...args)`
`execFileSync` wrapper, an origin repo built with `git init --quiet -b main` +
deterministic `user.email`/`user.name`, and `cloneFull()` doing
`git clone --quiet file://<origin> <dest>`. Cloning over `file://` gives the
clone a genuine `origin/main` ref, which is what this helper needs; do not
hand-roll the bare-repo shape from
`packages/intentionsutil/scripts/test-graph-commit.sh:100` (that is the bash
harness's approach and is unnecessary here).

Node fixtures must be schema-valid (`validateNode` runs), so build them with
`writeNodeFromJson` from `../scripts/write-node.js`
(`packages/intentionsutil/scripts/write-node.ts:34`, as
`restamp-scope-fingerprint.test.ts:7,26-40` does) rather than hand-writing
frontmatter strings, then commit and push/clone.

Cases:
1. **Stale-worktree false positive** — node parked (`office_hours` non-null)
   in the clone's working tree, `office_hours: null` in the origin commit the
   clone tracks → `listNodesAtRef(clone, "origin/main")` returns that node
   with `office_hours === null`.
2. **Reverse staleness** — node parked on origin/main, cleared (or absent) in
   the clone's working tree → returned parked.
3. **Local-only node** — a node file committed only on a local branch, absent
   from `origin/main` → absent from the result.
4. **Unknown ref** → throws, and the message names the ref
   (`expect(...).toThrow(/origin\/main/)`).
5. Sanity: the returned array is id-sorted and every element is a validated
   `IntentionNode` (a spot-check on `.id`/`.kind` suffices).

**Out of scope:** anything touching the real repo store or the selector CLI
(Unit 4 covers that).

**Recommended model:** sonnet (mechanical test-writing against an
already-decided fixture pattern).

## Unit 3 — Rewire `office-hours-select.ts` onto `origin/main`

**Depends on:** Unit 1.

**Scope.** `packages/intentionsutil/scripts/office-hours-select.ts` only.

1. Replace `const nodes = listNodes(intentionsDir)` (`:105`) with
   `listNodesAtRef(repoRoot, ref)`; drop the now-unused `listNodes` import
   (`:24`) and the `intentionsDir` constant (`:38`). Keep `repoRoot` (`:37`) —
   it is still needed for `resolveSessionCwd` at `:122`.
2. Add a `--ref <git-ref>` flag defaulting to `"origin/main"`.
   **Argument-parsing trap:** `main()` currently derives positionals as
   `args.filter((a) => !a.startsWith("--"))` (`:98`), which would swallow the
   flag's *value* (`origin/main`) as a node id. Parse with an explicit index
   loop (`select-targets.ts:38-49`'s `--dir` loop is the in-repo precedent) so
   `--ref` consumes its value, `--list` stays a boolean, unknown `--flags`
   error with exit 2, and at most one positional remains. Preserve the
   existing `--list`+positional mutual-exclusion error and exit code
   (`:100-103`) and the unsafe-id guard (`:115-118`). `--ref` exists for three
   reasons: it documents the default, it gives a standalone adopter with no
   `origin` remote an escape hatch (`--ref HEAD`), and it is the knob Unit 4's
   smoke test uses.
3. Wrap the store read so a failed ref read exits 2 with the helper's message
   on stderr (matching this script's existing `process.exit(2)` failure
   convention), rather than dumping a raw stack. Let `IntentionSchemaError`
   from a malformed node propagate uncaught (loud, per Unit 1).
4. Update the header contract comment (`:1-19`): it currently claims "Reads
   only the local `intentions/` store." It must now state that the store is
   read at `origin/main` (already-fetched ref, no network call of its own —
   callers wanting absolute freshness run `git fetch origin main` first, as
   `office-hours-graph` does), that launch cwd is still resolved against the
   LOCAL checkout, that a node parked locally but cleared on main is reported
   `empty not-parked <id>` by design, and document `--ref`.
5. **Unchanged:** the stdout verb set, `formatDisposition` (`:73-91`),
   `resolveSessionCwd` (`:52-61`), `--list`'s `rank\tnodeId\tsince` tab format
   (`:108-110`), the stderr `NOTE —` advisory, and everything in
   `packages/intentionsutil/src/officeHours.ts` (no edits to that file at all
   — the veto happens by which nodes are handed in).

**Recommended model:** opus (rewiring the CLI contract and the flag-parsing
trap both carry real correctness risk if handled mechanically).

## Unit 4 — Selector-level tests

**Depends on:** Unit 3.

**Scope.** Extend `packages/intentionsutil/test/office-hours.test.ts` (its
existing 228 lines of pure `anode()` fixtures and the
`formatDisposition`/`resolveSessionCwd` suites stay untouched).

`office-hours-select.ts` resolves `repoRoot` from `import.meta.url`, so it can
only ever run against *this* repo. Test accordingly, in a
`describe.skipIf(...)` guarded by "this checkout has an `origin/main`"
(`git rev-parse --verify origin/main` succeeds) so the suite stays green in a
stripped CI cache — the same defensive posture as
`committed-store.test.ts:21`, and the real-repo rationale is spelled out at
`restamp-scope-fingerprint.test.ts:14-17`:

1. **Smoke:** `execFileSync("npx", ["tsx", "<repoRoot>/packages/intentionsutil/scripts/office-hours-select.ts",
   "--list"])` exits 0 and every line matches `/^-?\d+\t\S+\t\S+$/`.
2. **Main-authority invariant:** for each id in that `--list` output,
   `git show origin/main:intentions/<id>.md` succeeds and its frontmatter's
   `office_hours` is non-null (parse with `extractFrontmatter` + `yaml.parse`,
   not grep). This is the direct regression test for the behavior
   `park_live_on_main` used to provide.
3. **Targeted not-parked:** run the script with a node id that is absent from
   `origin/main` (e.g. `absent-node-id-xyz`) and assert stdout
   is exactly `empty not-parked absent-node-id-xyz\n`.
4. **`--ref` plumbing:** run with `--ref origin/main` and assert the output is
   byte-identical to the no-flag run (proves the flag parses and does not leak
   into positionals).

Allow a generous vitest timeout on the `npx tsx` cases (they spawn a TS
runtime).

**Out of scope:** end-to-end tests of `office-hours-graph` (there is no bash
harness for it — Unit 5 is verified manually).

**Recommended model:** sonnet (mechanical test-writing against an
already-decided fixture pattern).

## Unit 5 — Retire `park_live_on_main` from `office-hours-graph`

**Depends on:** Unit 3.

**Scope.** `packages/intentionsutil/scripts/office-hours-graph`, plus one doc
touch. **Re-read this file fresh before editing** — by the time this executes,
PR #2945 will have merged and rewritten `resolve_directive`; anchor by
function/verb name, not the pre-#2945 line numbers below.

1. **Delete the `park_live_on_main` function** entirely (pre-#2945: `:55-80`),
   including its comment block.
2. **Targeted branch of `resolve_directive`** (pre-#2945: `:90-111`): collapse
   to a single pass-through — `npx tsx "$SCRIPT_DIR/office-hours-select.ts"
   "$TARGET"`. The double-invocation disambiguation dance (call the guard,
   then call the selector a second time just to tell "genuinely stale" from
   "never parked") is now dead: the selector answers correctly in one call.
   Preserve whatever #2945 added here (the liveness/`held` check) verbatim.
3. **Untargeted branch** (pre-#2945: `:113-131`): keep the `--list` capture,
   its explicit exit-status check and loud failure (that guard against a
   swallowed selector crash stays), and keep the `while` walk — #2945 needs it
   for liveness skipping. Remove only the `park_live_on_main "$nid"` call, the
   stale-worktree `skipping … park already cleared on origin/main` stderr
   note, and the now-redundant condition around the per-candidate selector
   call.
4. **Delete the `cleared)` case arm** (pre-#2945: `:145-148`) and every
   emission of `cleared` (pre-#2945: `:106`). Reword the `empty` arm's
   not-parked message (pre-#2945: `:151`) to name the authority, e.g.
   `office-hours: node $b is not parked on origin/main — nothing to launch for it.`
5. **Keep** the top-level
   `git -C "$SCRIPT_DIR" fetch origin main --quiet 2>/dev/null || true` and
   its position before `directive=$(resolve_directive)` — it is what makes
   the TS-side `origin/main` read current. Extend its comment to say the
   selector now consumes this fetched ref directly.
6. **Update the header comment** (pre-#2945: `:19-24`): the disposition list
   must drop any mention of a wrapper-side freshness guard and state that
   `office-hours-select.ts` itself resolves park state at `origin/main`.
7. **Doc touch:** at `.claude/skills/office-hours/SKILL.md:353-361` (the
   "Blocked-by readiness signal" step that runs
   `npx tsx packages/intentionsutil/scripts/office-hours-select.ts <node-id>`),
   add one sentence noting the selector now resolves park state at the
   already-fetched `origin/main`, so a stale worktree no longer skews the
   advisory, and that a node cleared on main yields `empty not-parked` with no
   `NOTE` — expected, not an error.

**Out of scope:** the dispatcher body from the `launch)` arm onward (spawn /
registration poll / `exec claude attach`), `job_id_for_name`, `held`, and
anything else PR #2945 owns.

**Recommended model:** opus (concurrency/ordering judgment reading a merged
PR's actual post-merge shape before editing; translating bash control flow
correctly under a name/verb-anchored diff rather than line numbers).

## Reuse

- `listNodes` — `packages/intentionsutil/src/store.ts:128-134` (drives the
  whole snapshot read; brings `readNode` → `extractFrontmatter` +
  `yaml.parse` + `validateNode` for free, `store.ts:101-105`).
- `extractFrontmatter` — `packages/intentionsutil/src/frontmatter.ts:13` (only
  if a single-blob read is ever needed, and in Unit 4's assertion; never
  hand-roll fence/YAML parsing).
- `selectOfficeHours` / `officeHoursQueue` / `openBlockers` —
  `packages/intentionsutil/src/officeHours.ts:25,55,84` — called unchanged;
  they are pure over the node array they are handed, which is the entire
  mechanism by which main-authority propagates to every disposition.
- `formatDisposition`, `resolveSessionCwd` —
  `packages/intentionsutil/scripts/office-hours-select.ts:52,73` — unchanged.
- `execFileSync("git", [...])` inline — the established idiom; see
  `packages/intentionsutil/scripts/lib-deleted-node-ids.ts:54,65`,
  `read-sensors.ts` (~line 335, the `isAiOwnedAt` helper),
  `restamp-scope-fingerprint.ts:80`. No new generic git wrapper.
- Shared-scripts-lib file shape and "kept out of `src/` because it shells to
  git" rationale — `packages/intentionsutil/scripts/lib-deleted-node-ids.ts:1-7`.
- Snapshot-at-origin/main precedent —
  `.claude/skills/dispatch-propagate/scripts/graph-select-target:183-196`.
- Test fixtures: origin + `file://` clone with a real `origin/main` —
  `packages/intentionsutil/test/deleted-node-ids.test.ts:8-60`; real-repo
  `origin/main` posture — `packages/intentionsutil/test/restamp-scope-fingerprint.test.ts:14-22`;
  skip-if-store-absent guard — `packages/intentionsutil/test/committed-store.test.ts:21`;
  schema-valid node authoring — `writeNodeFromJson`
  (`packages/intentionsutil/scripts/write-node.ts:34`).

## Verification

Run from the repo/worktree root.

```verify
npx vitest run --project packages/intentionsutil --root "$(git rev-parse --show-toplevel)"
```

```verify
git fetch origin main --quiet; npx tsx packages/intentionsutil/scripts/office-hours-select.ts --list
```
Exits 0; every line is `<rank>\t<node-id>\t<since>`. Cross-check the invariant
by hand for one listed id: `git show origin/main:intentions/<id>.md | head -40`
shows a non-null `office_hours:` in the frontmatter.

```verify
npx tsx packages/intentionsutil/scripts/office-hours-select.ts absent-node-id-xyz
```
Prints exactly `empty not-parked absent-node-id-xyz`.

```verify
bash -n packages/intentionsutil/scripts/office-hours-graph && ! grep -q 'park_live_on_main\|^  cleared)' packages/intentionsutil/scripts/office-hours-graph
```

```verify
git grep -n "park_live_on_main" -- ':!intentions/'
```
Must return no hits (exit 1 from `git grep` is the pass condition — the only
surviving mentions may be in `intentions/*.md` prose describing this tactic's
own history).

**Manual / observational:**

1. **Stale-worktree false positive (the headline defect).** In a worktree
   whose checkout predates a landed `office_hours` clear (or synthesize one:
   `git checkout <sha-before-the-clear> -- intentions/<id>.md` in a scratch
   worktree, do not commit), run
   `npx tsx packages/intentionsutil/scripts/office-hours-select.ts <id>` from
   that worktree. Before this change it printed `launch <id> <cwd>`; after, it
   must print `empty not-parked <id>`. Restore the file afterwards.
2. **Reverse staleness.** With the local `intentions/` deliberately behind
   main (`git fetch origin main` but no pull), confirm a node parked on
   `origin/main` but absent from the local tree appears in `--list`. This case
   was impossible to satisfy before.
3. **Wrapper end-to-end.** `packages/intentionsutil/scripts/office-hours-graph
   <id>` for (a) a node genuinely parked on main → still reaches the
   `launch)` arm and attaches, (b) a node cleared on main → prints the
   reworded "not parked on origin/main" line and exits 0 with no launch, (c)
   no argument → launches the top main-parked node. Run with
   `dangerouslyDisableSandbox: true` (the daemon socket) per the script
   header.
4. **Post-#2945 coexistence.** Confirm the liveness dedup still functions:
   with a live `office-hours-<id>` session registered, targeted mode still
   reports `held`/errors as #2945 specifies, and the untargeted walk still
   skips to the next rank — i.e. removing `park_live_on_main` from the loop
   did not disturb the liveness branch.
5. **No-remote posture.** In a clone without `origin/main`, the selector exits
   2 with a message naming the ref and the remedy, and `--ref HEAD` works as
   the documented escape hatch.
