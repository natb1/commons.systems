---
id: tactic-graph-worktree-implicit-invocation
kind: tactic
statement: A graph-operation wrapper that resolves the target node worktree
  itself, so sessions stop restating absolute `.claude/worktrees/<id>` paths in
  every Bash call
owner: ai
status: codified
parent: null
rationale: "Surfaced 2026-08-11 in the same /align round. Measured: 1,612 of
  8,728 Bash calls in the 2026-08-10/11 corpus (18%) restate a worktree path via
  `cd .../worktrees/<id>` or `git -C .../worktrees/<id>`, 1,632 occurrences. The
  restated path carries no information — the node id already determines the
  worktree — so this is pure per-call byte tax. It also buys correctness, not
  only tokens: it closes the recorded failed-cd hazard where a `cd` that fails
  drops the session into the main checkout and subsequent mutating git
  operations hit main instead of the worktree. (Reconciled 2026-08-19 at
  finalize.) The 18% figure is a two-day point-in-time snapshot of a growing
  corpus, and it covers two frictions rather than one: the restated-path class
  this tactic removes, and the separate worktree-isolation refusal of loops,
  compound commands and redirects, which forces a caller to re-issue the same
  one-line command N times and which a node-id wrapper does not shrink. The plan
  therefore claims savings only over the path-restatement class and re-derives
  the baseline at verification time rather than treating 1,612/8,728 as a fixed
  constant."
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
# A graph-operation wrapper that resolves the target node worktree itself, so sessions stop restating absolute `.claude/worktrees/<id>` paths in every Bash call

## Context

Clarification 218 of `strategy-graph-native-dispatch` measured the 2026-08-10/11
transcript corpus: of 8,728 Bash calls, **1,612 (18%) restate a node worktree
path** — `cd <root>/.claude/worktrees/<id>` or `git -C <root>/.claude/worktrees/<id>`
— across 1,632 occurrences. The restated path carries no information: the node id
already determines the worktree. This tactic owns that one line item.

It buys correctness as well as bytes. A `cd` that fails silently drops the
session into the main checkout, and every subsequent mutating git operation then
hits `main` instead of the node's worktree (recorded failed-`cd` hazard). A
resolver that hard-fails when the worktree is absent or fails an identity
assertion closes that hazard; a resolver that falls back to cwd would reproduce
it, which is why `.claude/rules/code-style.md` ("clear errors over defensive
fallbacks") is load-bearing here rather than stylistic.

Two distinguishable defects sit behind the measurement, and this plan takes
both, in that order of priority:

- **(a) sessions** restate the path in ad-hoc Bash — the 1,612 calls;
- **(b) owned scripts** restate it too. `worktrees_root()` was written
  (`.claude/skills/dispatch-propagate/scripts/lib-repo-roots.sh:63`) so the
  `.claude/worktrees` arithmetic is defined exactly once, after two of its three
  former call sites shipped it backwards as `<repo>/.git/.claude/worktrees` and
  silently broke the WorktreeRemove hook (PR #3080). Despite that, the
  concatenation is still open-coded at ~25 sites across bash and TypeScript
  (verified by grep 2026-08-19), so the helper did not actually end the drift.

Intended outcome: one owned, offline-testable path primitive; one execution
wrapper sessions call with a node id instead of a path; the graph-native scripts
that open-code the arithmetic converted onto the primitive; and the doctrine
prose that currently instructs sessions to hand-construct the path rewritten to
say "pass the node id".

### Where the arithmetic lives today (verified 2026-08-19, `origin/main` d81374ca)

- `.claude/skills/dispatch-propagate/scripts/lib-repo-roots.sh:53` `resolve_project_root()`
  — `dirname "$(git rev-parse --path-format=absolute --git-common-dir)"`,
  fail-closed on empty, never exits the caller. `:63` `worktrees_root()` prints
  `<repo-root>/.claude/worktrees` on top of it. `:73` `legacy_worktrees_root()`
  prints the pre-migration `<repo-root>/worktrees` (out of scope here — the
  graph-native lane is `.claude/worktrees` only). The file is **self-contained
  and sources nothing**, deliberately, and is include-guarded.
- `.claude/skills/dispatch-propagate/scripts/lib-graph-worktree.sh:27`
  `resolve_main_worktree [<git-dir>]` — the checkout with `main` actually
  checked out; honors the `DISPATCH_GRAPH_MAIN_WORKTREE` test override; prints
  path + returns 0 or prints nothing + returns 1; does no `-d` check and never
  exits the caller.
- `.claude/skills/dispatch-propagate/scripts/provision-node-worktree:126,131`
  — the canonical node-id → path derivation:
  `PROJECT_ROOT=$(resolve_main_worktree)` then
  `WT="$PROJECT_ROOT/.claude/worktrees/$NODE_ID"`. It also validates the id
  against the canonical slug regex at `:117`
  (`^[a-z][a-z0-9]*(-[a-z0-9]+)*$`, plus a numeric-prefix rejection for the
  retired gh lane). It is not usable as a cheap resolver: it also fetches,
  syncs, merges and gates on CI.
- `packages/intentionsutil/scripts/office-hours-select.ts:120-132`
  `resolveSessionCwd(repoRoot, nodeId)` — the TypeScript twin,
  `join(repoRoot, ".claude", "worktrees", nodeId)`, with an `isPathSafeId`
  guard at `:113`. Local to that one script, not a shared module.
- `packages/intentionsutil/scripts/restamp-scope-fingerprint.ts:38,64,75,97`
  — the strongest existing precedent for the calling convention this tactic
  wants: it takes a bare node id (plus optional `--repo-root`/`--main-root`) and
  resolves `<mainRoot>/.claude/worktrees/<id>.scope-fingerprint` itself.

### The identity assertion to reuse, not rebuild

`.claude/skills/dispatch-propagate/scripts/lib-worktree-residue.sh:60`
`worktree_identity_ok <worktree-path> <node-id>` — returns 0 when the path IS
the linked worktree for that id (`rev-parse --show-toplevel` realpath-equal to
the path AND `rev-parse --absolute-git-dir` ending `/worktrees/<node-id>`),
1 for an orphan directory, 2 for an inspection failure; prints
`toplevel=… git-dir=…` on failure. Its header (`:38-47`) states why this is
load-bearing: a node worktree lives *inside* the project root's own working
tree, so when the directory exists but carries no valid `.git` file, git
discovery walks **up** and every `git -C <that path>` silently addresses the
enclosing `main` checkout. Any wrapper that resolves a worktree and then
executes there must run this first.

### Second half of the byte tax: the target-selector flags are heterogeneous

A session must remember not only the path but which flag each primitive wants
(verified usage strings, 2026-08-19):

```
--dir <intentions-dir>       dump-node.ts:46, write-node.ts:27
<intentionsDir> positional   validate-graph.ts:85
-C <repo-root>               clear-park:119, verify-landed:86, graph-commit (parsed ~:3655)
--repo-root / --main-root    restamp-scope-fingerprint.ts:63
(none — resolves cwd)        park-node:122, hold-node:64, land-align-round:134,
                             mark-node-terminal:53, demote-node-to-implement:59
```

`land-align-round` having no `-C` is a live recorded trap: it falls through to
`graph-commit`'s cwd resolution. This plan does **not** add `--node` to those
ten scripts (a wide surface change, and a per-primitive flag table in a wrapper
would be a second home for each script's contract and would drift). It supplies
a wrapper that sets cwd **and** interpolates the resolved paths into the
argument vector, so each primitive keeps its own contract verbatim.

### Doctrine that constrains the design

- **Clarification 194 (R3, ruled 2026-08-05, ADOPTED)** — every graph read takes
  the tree/ref as a **required** argument, never from cwd or script location. A
  `<node-id>` selector satisfies this: the id IS an explicit argument, and the
  wrapper constructs the path from it and passes it explicitly. It must never
  degrade into a cwd/script-location fallback when the id is omitted.
- **Clarification 86 (standing invariant)** — `graph-commit` resolves its target
  repo from the caller's cwd or an explicit `-C`/`--repo`, **never** from the
  invoked script's own location. The wrapper preserves that: it passes an
  explicit `-C`, never elides it, and never resurrects script-location
  resolution.
- **Clarification 193 (R2)** — graph-write primitives land atomically or not at
  all and read their verdict back from post-push remote state. The wrapper is a
  pass-through: it must propagate the wrapped command's exit status verbatim, or
  it destroys those verdicts.
- **Strategy condition (graph operations)** — retrieval and query, node editing,
  and concurrency control run through owned, offline-testable primitives, as a
  **floor, not a ceiling**: ad-hoc shell stays available for genuinely novel
  graph questions.
- **`.claude/rules/code-style.md`** — clear errors over defensive fallbacks.

### Harness constraint the design must confront deliberately

`.claude/rules/sandbox.md:144-162`: from a **worktree-isolated session**, Claude
Code refuses *any* `git -C` to a path other than that session's own worktree,
including a sanctioned sibling under `.claude/worktrees/`. It is a built-in
gate, earlier than the PreToolUse hook, and it keys on the **`-C` flag**, not on
where the flag points. Two consequences the plan acts on:

1. The 1,612 restated-path calls come overwhelmingly from **non-isolated**
   sessions in the shared main checkout — the tick, the `/dispatch-ladder`
   driver, office-hours, and manual sessions. That is the population the wrapper
   serves.
2. A non-`git` wrapper is **not** refused (`graph-commit` is the documented
   precedent, `.claude/rules/sandbox.md:174`). So a naive
   `run-in-node-worktree` would hand an isolated session a route to mutate a
   *sibling* worktree that the built-in currently blocks. **Decision taken here:
   the wrapper refuses a cross-worktree target when the caller's own cwd is
   itself a node worktree other than the target**, preserving the built-in's
   guarantee rather than inheriting a hole by accident. No escape-hatch flag —
   an opt-out any caller can pass is the same hole with a longer name.

### CI wiring and permission traps

- Shell tests are **not** auto-discovered. Every one is an explicit step in
  `.github/workflows/unit-tests.yml` (the `packages/intentionsutil/scripts/`
  block is lines 292-303; the `.claude/skills/dispatch-propagate/scripts/` block
  is immediately above, lines ~240-291; the `dispatch-ladder` block is
  304-313). A new `test-*.sh` that is not added there never runs.
- Adding a `source` line to a script whose functional test copies it into a
  scratch repo **standalone** turns CI red while local runs stay green. The
  copy lists are explicit: `test-dispatch-ladder-advance.sh:41` loops over
  `lib-claude-agents.sh lib-reservation-ledger.sh lib-graph-worktree.sh lib.sh`;
  `test-dispatch-graph-execute.sh:56` copies libs one `cp` per line. Every
  converted script's fixture must gain `lib-repo-roots.sh` in the **same** edit.
- `.claude/settings.json` allowlists `Bash(npx tsx:*)` (line 69) and enumerates
  individual `.claude/skills/dispatch-propagate/scripts/*` entries
  (lines ~40-55) — **nothing under `packages/intentionsutil/scripts/`**. New
  bash scripts therefore belong beside `lib-repo-roots.sh` in
  `.claude/skills/dispatch-propagate/scripts/`, and each needs its own
  `Bash(<path>:*)` entry or every invocation routes through the auto-mode
  classifier instead of a static approval — which cuts against the
  round-trip-cost half of clarification 218.

### Live environment hazard (observed 2026-08-19 provisioning this very node)

`provision-node-worktree tactic-graph-worktree-implicit-invocation align-tactics`
failed with `error: could not lock config file .git/config: File exists` /
`unable to write upstream branch configuration`. `.git/config.lock` exists as a
0-byte read-only phantom mount, so **every** git config write fails, sandbox-off
included; the failure left the branch created with no checkout and did not
propagate a non-zero status through the caller's pipeline. Recovery was
`git worktree prune` + `git worktree add <path> <existing-branch>` (no
`--no-track` — git rejects it for an existing branch). **Scoping call taken
here: the wrapper never provisions.** It resolves and asserts; provisioning
stays `provision-node-worktree`'s job, and the config-lock hazard is
`tactic-sandbox-config-lock-phantom-mount-blocks-git-config-writes`'s.

### Adjacent — do NOT build here

Sibling drafts from the same 2026-08-11 round, all still `phase: null`:

- `tactic-graph-read-at-ref-cli` — expose
  `packages/intentionsutil/scripts/lib-store-at-ref.ts` (a library with several
  script consumers and no CLI) as a read-at-ref CLI. Owns the 270 hand-rolled
  `git show origin/main:intentions/<id>.md` calls. **Do not build a storeAtRef
  CLI in this tactic.**
- `tactic-graph-compound-edit-and-land` — one compound primitive covering
  dump → reconcile → validate → commit → verify-landed. Owns the round-trip half
  of clarification 218. **Do not fold this wrapper into a compound
  edit-and-land primitive.**
- `tactic-graph-ops-model-recovery-edge` — clarification 219's retained
  `recovers`-edge question. Doctrine only, no code.
- `tactic-sync-main-checkout-helper` — collapses the repeated
  fetch + `merge --ff-only origin/main` into one `sync_main_checkout <path>`
  helper. Adjacent, narrower, and competing for the same `lib.sh` surface: this
  plan touches `lib-repo-roots.sh`, not `lib.sh`, so the two do not collide.
- `tactic-node-worker-fresh-skill-body` (phase done) already moved the exit-11
  conflict lane off the node's own worktree onto `--cwd` on the primary
  checkout. **Do not re-solve that call site.**

Also live and touching the same files: `tactic-align-tactics-mark-terminal-skipped`
(main-qa, edits `land-align-round`) and `tactic-autonomous-ci-pending-liveness-bound`
(qa, edits `graph-select-target`). Expect churn — **locate every anchor below by
symbol, not by line number.**

---

## Unit 1 — Single-source the node-worktree arithmetic in `lib-repo-roots.sh`

**Scope.** Edit `.claude/skills/dispatch-propagate/scripts/lib-repo-roots.sh`
only, adding three functions beside the existing `resolve_project_root` /
`worktrees_root` / `legacy_worktrees_root`, and extend
`.claude/skills/dispatch-propagate/scripts/test-lib-repo-roots.sh`.

```
worktrees_root_at <root>                     # prints <root>/.claude/worktrees
node_worktree_path <node-id> [<root>]        # prints <root>/.claude/worktrees/<node-id>
node_sidecar_path <node-id> <suffix> [<root>] # prints <root>/.claude/worktrees/<node-id><suffix>
```

- `worktrees_root_at` holds the **only** literal `.claude/worktrees` string in
  the file; refactor the existing `worktrees_root()` to
  `worktrees_root_at "$(resolve_project_root)" ` so the literal appears once.
  Keep `legacy_worktrees_root()` exactly as it is — the `worktrees/`
  pre-migration placement is a different string with a different meaning.
- `<root>` is **optional and defaults to `resolve_project_root`**, never to cwd
  and never to script location. Callers that need main-worktree semantics
  (the `DISPATCH_GRAPH_MAIN_WORKTREE` test override) pass
  `resolve_main_worktree`'s output explicitly — that is the point of the
  optional argument, and it keeps `lib-repo-roots.sh` sourcing nothing.
- **Do not add a `source` line to this file.** It is self-contained by design
  (its header explains why; `lib.sh:2034-2039` carries a byte-identical
  `resolve_project_root` copy for exactly this reason, because ~17 test
  fixtures `cp` `lib.sh` standalone). A third copy of the arithmetic is
  likewise forbidden — new code calls these functions.
- Validate the node id against the canonical slug regex used by
  `provision-node-worktree:117` and `dispatch-derive-node-target:96-120`
  (`^[a-z][a-z0-9]*(-[a-z0-9]+)*$`, rejecting a numeric-leading id). Return
  non-zero, print nothing, on a bad id or an unresolvable root — matching this
  file's existing contract: never exit the caller, never print an error, leave
  the message to `|| { … }`.
- Keep the include guard and the "no `set -e`/`set -u` at file scope" property
  intact (`approve-workflow-commands.sh` sources this under an ERR trap).
- Tests to add in `test-lib-repo-roots.sh`: explicit-root form; default-root
  form; sidecar suffix form; invalid id rejected (non-zero, empty stdout);
  unresolvable root rejected; and an assertion that `worktrees_root` and
  `node_worktree_path` agree on the same prefix.
- **Wire `test-lib-repo-roots.sh` into CI in this same unit.** The file already
  exists but `grep -rn 'test-lib-repo-roots' .github/` returns nothing
  (verified 2026-08-19) — it runs in no workflow and no runner script, so
  today it is dead weight and the tests added above would never execute in CI.
  Add a `Run lib-repo-roots tests` step to the `hook-tests` job's
  `.claude/skills/dispatch-propagate/scripts/` block in
  `.github/workflows/unit-tests.yml`, modelled on the neighbouring
  `Run provision-node-worktree tests` step. This is a one-line addition, and it
  is what makes Unit 1 verifiable rather than merely written.

**Out of scope.** Any other file, apart from the single
`.github/workflows/unit-tests.yml` step named above. `legacy_worktrees_root`
semantics. Any `.claude/worktrees` literal elsewhere in the tree (Unit 4).

**Recommended model.** sonnet

## Unit 2 — `node-worktree`: the path-printing CLI

**Scope.** New executable
`.claude/skills/dispatch-propagate/scripts/node-worktree`, new
`.claude/skills/dispatch-propagate/scripts/test-node-worktree.sh`, and one new
step in `.github/workflows/unit-tests.yml` inside the `hook-tests` job's
`.claude/skills/dispatch-propagate/scripts/` block (model it on the
`Run provision-node-worktree tests` step at ~line 286).

Contract:

```
node-worktree <node-id> [--sidecar <suffix>] [--main-root <dir>]
                        [--require-exists] [--require-identity]
```

- Resolves the root from `--main-root` when given, else from
  `resolve_main_worktree` (source `lib-graph-worktree.sh` — the honored
  `DISPATCH_GRAPH_MAIN_WORKTREE` override is what makes the tests hermetic),
  then composes the path via Unit 1's `node_worktree_path` /
  `node_sidecar_path`. It sources both `lib-repo-roots.sh` and
  `lib-graph-worktree.sh` relative to its own `SCRIPT_DIR`, the pattern used
  throughout this directory.
- Prints the absolute path on stdout and exits 0. **Default does no existence
  check** — the script must be able to name a not-yet-provisioned worktree and
  a sidecar file that does not exist yet.
- `--require-exists` fails when the directory is missing.
  `--require-identity` additionally runs `worktree_identity_ok` from
  `lib-worktree-residue.sh` and fails on mismatch, echoing that function's
  `toplevel=… git-dir=…` detail to stderr.
- Exit codes: `2` usage / invalid node id; `64` root unresolvable; `65`
  `--require-exists` and directory missing; `66` `--require-identity`
  failure. Every failure prints `node-worktree: <reason>` on stderr and prints
  nothing on stdout. **No cwd fallback on any path.**
- Keep the usage string as a top-of-file `USAGE=` constant referenced on every
  exit-2 path, matching `park-node:102` / `hold-node:64` /
  `mark-node-terminal:53` — and update it in the same edit as any flag change.

Sidecar suffixes this makes first-class (all currently hand-built in prose):
`.scope-fingerprint`, `.ladder`, `.conflict-strikes`, `.review-base`,
`.invalid-state-attempts`.

Tests (`test-node-worktree.sh`, hermetic — no network, no `npm ci` beyond the
repo root install; set `DISPATCH_GRAPH_MAIN_WORKTREE` to a scratch repo, the
harness pattern used by `test-transition-node.sh` and `test-park-node.sh`):
path form; sidecar form; `--main-root` override; invalid id → 2; unresolvable
root → 64; `--require-exists` on a missing dir → 65; `--require-identity`
against a plain (non-worktree) directory inside the repo → 66 **and** stdout
empty, the regression that proves it does not silently hand back the enclosing
checkout.

**Out of scope.** Provisioning. Freshness checks (compose with the existing
`assert-worktree-fresh <worktree-path>` rather than reimplementing). Any
change to the graph primitives' own flags.

**Dependencies.** Unit 1.

**Recommended model.** sonnet

## Unit 3 — `node-op`: the execution wrapper sessions call

**Scope.** New executable
`.claude/skills/dispatch-propagate/scripts/node-op`, new
`.claude/skills/dispatch-propagate/scripts/test-node-op.sh`, one new step in
`.github/workflows/unit-tests.yml` beside Unit 2's, and two new
`permissions.allow` entries in `.claude/settings.json`:
`"Bash(.claude/skills/dispatch-propagate/scripts/node-worktree:*)"` and
`"Bash(.claude/skills/dispatch-propagate/scripts/node-op:*)"`, placed in the
existing `.claude/skills/dispatch-propagate/scripts/*` block at lines ~40-55.

Contract:

```
node-op <node-id> [--main-root <dir>] -- <command> [args…]
```

Behavior, in order:

1. Validate the id and resolve the worktree by calling Unit 2's
   `node-worktree --require-exists --require-identity` (shell out to it — one
   home for the resolution contract, not two).
2. **Cross-worktree refusal.** If the caller's own cwd resolves to a node
   worktree (`git rev-parse --absolute-git-dir` ending `/worktrees/<name>`)
   and `<name>` is not `<node-id>`, refuse with exit `67` and a message that
   names the Claude Code built-in isolation gate this preserves
   (`.claude/rules/sandbox.md:144-162`). No opt-out flag.
3. **Token interpolation.** In each argument after `--`, substitute
   `%w` → the resolved worktree path and `%i` → `<worktree>/intentions`.
   Substitute **only** when the argument is exactly `%w`/`%i` or begins with
   `%w/`/`%i/` — never a bare embedded match, so a commit message or a
   `printf` format containing a percent sign is untouched. Test that
   explicitly.
4. `cd` into the worktree and `exec` the command, so its **exit status passes
   through verbatim**. This is load-bearing under clarification 193 and for
   the ladder's exit-code space (`dispatch-ladder-advance` 11/12/13/14) — a
   wrapper that swallows or remaps a wrapped verdict is a defect. The wrapper's
   own failure codes (`2`, `64`-`67`) are chosen above every code the wrapped
   primitives use, and every wrapper failure prints `node-op: …` on stderr and
   never runs the command.

Worked shapes the wrapper must support (used verbatim in Unit 5's prose):

```
node-op <id> -- npx tsx packages/intentionsutil/scripts/dump-node.ts --dir %i <id>
node-op <id> -- packages/intentionsutil/scripts/graph-commit -C %w
node-op <id> -- packages/intentionsutil/scripts/park-node <id> "<reason>" "<rec>"
node-op <id> -- git status --porcelain
```

The third shows why cwd is set as well as tokens interpolated: the
cwd-defaulting primitives (`park-node`, `hold-node`, `land-align-round`,
`mark-node-terminal`, `demote-node-to-implement`) then resolve correctly
without a flag change. The second shows `graph-commit` keeping its **explicit**
`-C` per clarification 86 — constructed by the wrapper from the node id, never
elided, never inferred from the script's own location.

Tests (`test-node-op.sh`, hermetic, `DISPATCH_GRAPH_MAIN_WORKTREE` scratch
repo, a stub command that echoes its cwd and argv): cwd is the worktree;
`%w`/`%i` interpolated at exact and prefix positions; a bare `%wibble`
argument passes through untouched; the stub's exit status 7 propagates as 7;
missing worktree → 65; identity failure → 66; cross-worktree refusal → 67 with
the command never executed (assert the stub's side-effect file is absent);
missing `--` → 2.

**Out of scope.** Provisioning. A per-primitive verb table. Any `--node` flag
added to a graph primitive. Compound edit-and-land (that is
`tactic-graph-compound-edit-and-land`).

**Caveat for the implementing session.** `.claude/settings.json` edits are
gated: writes land, but the **commit** may be refused under auto mode. If the
commit gate refuses that hunk, drop it, leave the two scripts and their tests
in place, and record the allowlist entries as an attended follow-up in the PR
body — do not weaken or work around the gate, and do not relocate the scripts
to dodge it.

**Dependencies.** Units 1, 2.

**Recommended model.** opus

## Unit 4 — Convert the open-coded call sites in the graph-native scripts

**Scope.** Five files, seven sites, each replacing a hand-built
`"$ROOT/.claude/worktrees/…"` with a Unit 1 helper call. All are already inside
scripts that resolve their own root, so the root is passed explicitly:

- `.claude/skills/dispatch-propagate/scripts/assert-node-selection:90`
  `STAMP_PATH="$PROJECT_ROOT/.claude/worktrees/$NODE_ID.scope-fingerprint"`
  → `node_sidecar_path "$NODE_ID" .scope-fingerprint "$PROJECT_ROOT"`
- `.claude/skills/dispatch-propagate/scripts/transition-node:185`
  `STAMP_FILE="$MAIN_ROOT/.claude/worktrees/$NODE_ID.scope-fingerprint"` → same shape
- `.claude/skills/dispatch-propagate/scripts/graph-auto-merge:365`
  `STAMP_FILE="$MAIN_ROOT/.claude/worktrees/$id.scope-fingerprint"` → same shape
- `.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute:236` (the
  `rm -f …$id.conflict-strikes`), `:289` (`STRIKE_FILE=`), `:437`
  (`RESIDUE_WT=` — `node_worktree_path`)
- `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-advance:165`
  `NODE_WT="$PROJECT_ROOT/.claude/worktrees/$NODE_ID"` → `node_worktree_path`

Each of these five scripts must gain
`source "$SCRIPT_DIR/lib-repo-roots.sh"` (for `dispatch-ladder-advance`, the
existing `$DISPATCH_SCRIPTS` variable — it already sources
`lib-graph-worktree.sh` from there at `:130`). **In the same edit**, add
`lib-repo-roots.sh` to each script's test fixture copy list, or the suite goes
red in CI while passing locally:
`.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-advance.sh:41`
(the `for lib in …` list) and
`.claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh:56`
(the per-lib `cp` block); check
`test-assert-node-selection.sh`, `test-graph-auto-merge.sh`,
`packages/intentionsutil/scripts/test-transition-node.sh` and
`.claude/skills/dispatch-propagate/scripts/test-dispatch-conflict-lane3-cwd-ratchet.sh`
for the same pattern before editing, since these files churn.

**Explicitly out of scope** (named follow-ups, not silent omissions):

- The **TypeScript** sites — `office-hours-select.ts:120-132`,
  `restamp-scope-fingerprint.ts:97`, `list-scope-stale-tactics.ts:22`. A shared
  TS helper is a second language surface and belongs in its own unit of work.
- `packages/intentionsutil/scripts/` bash — `demote-node-to-implement:75`,
  `office-hours-graph:389`. Cross-tree sourcing from that directory into
  `.claude/skills/…` is a new coupling this PR should not introduce.
- The libs that deliberately re-derive their own root to stay copyable
  standalone — `lib.sh:2739`, `commit-merge-push:143`,
  `lib-session-reap.sh:286`. Their duplication is load-bearing, not drift.
- Human-facing **prose strings** that name `.claude/worktrees/$id` inside
  recommendation text (`dispatch-graph-execute:378,459`) — those are messages
  for a person, and the literal path is the point.
- Every remaining site (`graph-select-target:706,1194`, `dispatch-sweep:76`,
  `dispatch-terminal-gap-audit:170`, `dispatch-graph-scope-sweep:75`,
  `dispatch-invalid-state-route:237,409`, `dispatch-invalid-state-sweep:170`,
  `lib-stale-hold-recheck.sh:332-333`, `lib-standdown-recheck.sh:669`,
  `dispatch-fleet-watch:669-671`, `dispatch-ladder-run:494`,
  `dispatch-ladder-status:117`). Behavior-preserving, but a ~20-file sweep is
  its own PR and two of those files are under active churn from
  `tactic-autonomous-ci-pending-liveness-bound` and
  `tactic-align-tactics-mark-terminal-skipped`.

**Behavior must not change.** Every converted site produces a
byte-identical path; the tests that already cover these scripts are the
regression net, and no test may be weakened to accommodate a conversion.

**Dependencies.** Unit 1.

**Recommended model.** sonnet

## Unit 5 — Rewrite the doctrine that tells sessions to build the path by hand

**Scope.** Prose only; no code.

- `.claude/rules/sandbox.md`, the `### \`git -C /path\` is auto-approved for
  worktrees` section (`:144-179`). Keep the built-in-refusal explanation and
  the `graph-commit` exception paragraph intact — both are still true and both
  are load-bearing. Replace the "What works instead" paragraph's per-script
  flag catalogue (`dump-node.ts` and `write-node.ts` require `--dir …`,
  `validate-graph.ts` a positional, `clear-park` a `-C …`) with: from a
  non-isolated session, `node-op <node-id> -- <command>` resolves and asserts
  the worktree and interpolates `%w`/`%i`; the underlying flags are unchanged
  and stay required, so the catalogue moves to `node-op`'s own usage string
  rather than being deleted. State plainly that `node-op` is refused across
  worktrees from an isolated session **by its own gate**, so the built-in's
  guarantee is preserved rather than routed around.
- Same file, `### Avoid \`cd && command\` for write/execute commands`
  (`:128`): add that `node-op` is the directory-flag equivalent for node
  worktrees, so `cd <worktree> && <cmd>` has a first-class replacement.
- `.claude/skills/dispatch-conflict/SKILL.md:795-815` — the `SOURCE_ID`/`WT`
  re-derivation bootstrap that instructs re-running
  `WT="$PROJECT_ROOT/.claude/worktrees/<literal-source-id>"` in **every** Bash
  call because variables do not persist. Rewrite to pass the source id to
  `node-op`. Keep the surrounding lane semantics untouched.
- `.claude/skills/dispatch-conflict/SKILL.md:1074-1082` — the
  subagent-contamination-guard's "explicit `$WT` third argument is required"
  instruction: say where the path comes from now (`node-worktree <id>`), and
  keep the requirement that baseline and check pass the *same* path.
- `.claude/skills/office-hours/SKILL.md:376` — the
  `worktree_has_live_session "<project-root>/.claude/worktrees/<node-id>"`
  call pattern: `node-worktree <node-id>`.

**Out of scope.** `.claude/skills/office-hours/SKILL.md:510` (human-facing "name
the item's worktree" instruction — the literal path is what the human needs),
`.claude/skills/dispatch-invalid-state/SKILL.md:299-302`,
`.claude/skills/review-fix/SKILL.md:1281-1283`,
`.claude/skills/align-tactics/references/tactic-target.md:211,248`,
`.claude/skills/align/SKILL.md:607-613`,
`.claude/skills/dispatch-ladder/SKILL.md:282-283`,
`.claude/skills/rsi/SKILL.md:65-67` — all sidecar-path prose, which `node-worktree
--sidecar` now covers but which is not worth churning five more skill bodies for
in this PR. Name them in the PR body as the follow-up sweep.

**Do not** claim in prose that the wrapper removes the isolation refusal, or
that it provisions. Both are false.

**Dependencies.** Units 2, 3.

**Recommended model.** opus

---

## Reuse

- `.claude/skills/dispatch-propagate/scripts/lib-repo-roots.sh` —
  `resolve_project_root` (`:53`), `worktrees_root` (`:63`). THE canonical
  arithmetic; Unit 1 extends this file and adds no fourth copy. Note the
  deliberate byte-identical duplicate of `resolve_project_root` at
  `lib.sh:2034-2039` (fixtures `cp` `lib.sh` standalone) — do not add a third.
- `.claude/skills/dispatch-propagate/scripts/lib-graph-worktree.sh:27`
  `resolve_main_worktree [<git-dir>]` — root resolution honoring
  `DISPATCH_GRAPH_MAIN_WORKTREE`; sourced by `node-worktree` and reused by the
  tests as the hermetic override.
- `.claude/skills/dispatch-propagate/scripts/lib-worktree-residue.sh:60`
  `worktree_identity_ok <path> <node-id>` — the identity assertion, reused
  verbatim; never reimplemented.
- `.claude/skills/dispatch-propagate/scripts/provision-node-worktree:117,126,131`
  — the canonical id regex and the id → path derivation this generalizes.
  Provisioning itself stays there.
- `.claude/skills/dispatch-propagate/scripts/dispatch-derive-node-target:96-120`
  — the same canonical slug regex, and the branch==node-id assumption. Reuse
  the regex; note `verify-landed:86`'s broader `ID_CHARSET`
  (`^[A-Za-z0-9._-]+$`) is a *different* pattern — this plan adopts the
  lowercase slug regex and does not change `verify-landed`.
- `packages/intentionsutil/scripts/restamp-scope-fingerprint.ts:38,63-75` —
  the id-in / path-resolved-internally calling convention `node-worktree`
  copies.
- `.claude/skills/dispatch-propagate/scripts/assert-worktree-fresh` — the
  freshness half; compose with it by passing the resolved path, never
  reimplement.
- `.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:1166`
  `worktree_occupancy_state <path>` — occupancy over an already-resolved path;
  a natural `node-worktree` consumer. (Its `claude agents --json` call needs
  `dangerouslyDisableSandbox`; nothing in this plan invokes it.)
- `packages/intentionsutil/scripts/verify-landed:86-165` — the most complete
  existing option-loop pattern (`-C|--repo` plus the `=`-forms and an id
  guard); imitate its argument-parsing shape.
- `packages/intentionsutil/scripts/park-node:102` (and `hold-node:64`,
  `mark-node-terminal:53`, `land-align-round:134`) — the top-of-file `USAGE=`
  constant convention both new scripts follow.
- `packages/intentionsutil/scripts/test-transition-node.sh` /
  `test-park-node.sh` — the scratch-repo + PATH-shim harness both new test
  files follow (no network, no `npm ci` beyond the repo-root install).
- `.github/workflows/unit-tests.yml:240-313` — the explicit per-test step
  lists both new tests must be added to.

## Verification

Auto-runnable; run them from the worktree root. Each is either an existing CI
step or a step this plan adds. Note that `test-lib-repo-roots.sh` is in the
second category, not the first: the file exists on `origin/main` today but is
referenced by no workflow and no runner script (verified 2026-08-19), so Unit 1
adds its CI step as well as its cases.

```verify
.claude/skills/dispatch-propagate/scripts/test-lib-repo-roots.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-node-worktree.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-node-op.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-assert-node-selection.sh || exit 1
.claude/skills/dispatch-propagate/scripts/test-dispatch-graph-execute.sh || exit 1
.claude/skills/dispatch-propagate/scripts/test-graph-auto-merge.sh || exit 1
.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-advance.sh || exit 1
packages/intentionsutil/scripts/test-transition-node.sh
```

Three test files must be wired into `.github/workflows/unit-tests.yml` — the
two new ones, plus the already-existing-but-unwired `test-lib-repo-roots.sh`
— and that wiring is itself checked. This fence **fails today** on all three
`grep -q` lines and passes only once the steps are added:

```verify
set -e
grep -q 'scripts/test-lib-repo-roots.sh' .github/workflows/unit-tests.yml
grep -q 'scripts/test-node-worktree.sh' .github/workflows/unit-tests.yml
grep -q 'scripts/test-node-op.sh' .github/workflows/unit-tests.yml
echo "CI wiring present"
```

The conversion in Unit 4 is checked positively (the helper is called) and
negatively (no assignment still open-codes the suffix). This fence **fails
today** on the first `grep -q`:

```verify
set -e
for f in \
  .claude/skills/dispatch-propagate/scripts/assert-node-selection \
  .claude/skills/dispatch-propagate/scripts/transition-node \
  .claude/skills/dispatch-propagate/scripts/graph-auto-merge \
  .claude/skills/dispatch-propagate/scripts/dispatch-graph-execute \
  .claude/skills/dispatch-ladder/scripts/dispatch-ladder-advance
do
  grep -q 'node_sidecar_path\|node_worktree_path' "$f" \
    || { echo "FAIL: $f does not call the shared helper"; exit 1; }
  if grep -nE '^[[:space:]]*[A-Za-z_][A-Za-z0-9_]*=.*\.claude/worktrees' "$f"; then
    echo "FAIL: $f still open-codes a .claude/worktrees assignment"; exit 1
  fi
done
echo "conversion clean"
```

Syntax check on the two new scripts and the edited libs:

```verify
set -e
bash -n .claude/skills/dispatch-propagate/scripts/node-worktree
bash -n .claude/skills/dispatch-propagate/scripts/node-op
bash -n .claude/skills/dispatch-propagate/scripts/lib-repo-roots.sh
echo "syntax ok"
```

Manual and judgment steps.

- Run `.claude/skills/dispatch-propagate/scripts/run-lint.sh` before pushing —
  it runs the type-safety and prose-rule linters unconditionally, so it catches
  a `.sh` prose-rule violation locally rather than in CI. Not a fence: it can
  fail for reasons unrelated to this change.
- **From the shared main checkout** (not a worktree-isolated session), against a
  real provisioned node worktree: `node-worktree <id>` prints the expected
  path; `node-worktree <id> --sidecar .scope-fingerprint` names the existing
  stamp; `node-op <id> -- git status --porcelain` reports that worktree's status
  and not `main`'s.
- **From a worktree-isolated session**, confirm `node-op <other-node-id> -- git
  status` exits 67 with the isolation message and does not execute — the whole
  point of the deliberate refusal in Unit 3. This cannot be exercised from CI.
- Confirm the `.claude/settings.json` allowlist entries are present and that
  invoking `node-op` no longer routes through the auto-mode classifier. If the
  config-edit commit gate refused that hunk (see Unit 3's caveat), verify the
  follow-up is recorded in the PR body instead — and treat the classifier
  round-trip as a known, recorded residual, not a silent one.
- Re-derive the baseline before claiming a saving. The 1,612 / 8,728 figure is
  a two-day point-in-time snapshot of a growing corpus; a post-change
  measurement over a comparable window is the honest check, and it will not go
  to zero — a share of those calls came from isolated sessions whose refusals
  this change does not address.
