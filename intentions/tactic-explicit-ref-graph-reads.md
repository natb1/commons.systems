---
id: tactic-explicit-ref-graph-reads
kind: tactic
statement: graph reads resolve their tree from cwd or from script location
  rather than from an explicit ref, so a stale checkout or the wrong script copy
  silently produces a wrong answer -- make the tree/ref a required argument on
  every read
owner: ai
status: raw
parent: null
rationale: "Surfaced and ruled ADOPTED in the 2026-08-05 /align interview (R3).
  Greenfield: check-node-selection.ts reads origin/main rather than the main
  checkout's working tree; validate-graph.ts requires its intentions dir rather
  than defaulting cwd-relative; transition-node, write-node.ts and clear-park
  stop resolving their repo root from script location. Evidence: a correct
  selection rejected as 'stale-selection: not-parked' because the checkout was
  one commit behind; validate-graph printing 'ok -- N nodes' against the wrong
  tree unless the dir is passed explicitly; and a measured case that drove a
  fleet-latch counter to 156. The recording session itself then tripped it while
  landing the very clarification adopting this fix -- it ran write-node.ts from
  the primary checkout, so the script resolved its root from that copy and wrote
  the amended strategy into the shared main checkout, producing the dirty
  tracked file this strategy calls a fleet-stalling defect (caught and reverted
  immediately). Retires the freshly-fetched-state and fast-forward-the-checkout
  invariants and the whole script-location-traps class. Scope is broad and was
  NOT enumerated at interview time."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: pr1-graph-write-path
  pr: 3095
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-15T15:45:21Z
    mergeCommitSha: fe0b1c4d27973922957f4a173c9a44042a31b8f8
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# graph reads resolve their tree from cwd or from script location rather than from an explicit ref, so a stale checkout or the wrong script copy silently produces a wrong answer -- make the tree/ref a required argument on every read

## Scope — ruled 2026-08-15

Clarification 242 partitions this node against its two co-extensive
siblings, closing the gap clarification 194 (R3) left when it adopted the
contract without enumerating its scope. This node owns the
required-explicit-argument **contract** plus exactly four files:

| File | Current defect |
|---|---|
| `packages/intentionsutil/scripts/validate-graph.ts` | `:73` — `process.argv[2] ?? "intentions"` defaults the dir cwd-relative |
| `packages/intentionsutil/scripts/write-node.ts` | `:18-22` — resolves the store from `import.meta.url` |
| `packages/intentionsutil/scripts/dump-node.ts` | `:38-40` — same `import.meta.url` resolution |
| `packages/intentionsutil/scripts/clear-park` | `:99-100` — `REPO_ROOT` from `SCRIPT_DIR` |

One caller changes with them:
`.claude/skills/align/scripts/validate-deployment.sh:53` invokes
`validate-graph.ts` with **no directory argument** and breaks the moment the
argument becomes required. `.github/workflows/graph-fast-path.yml:32` already
passes `intentions` explicitly and needs no change.

**Out of scope**, each owned elsewhere:

- `packages/intentionsutil/scripts/demote-node-to-implement` — owned by
  `tactic-demote-node-stale-local-read`. It does **not** close with this node.
  Note that node's own defect 3 is already fixed (commit `156ce3a1` gave the
  script both the `origin/main` fresh read and the `--base` CAS), so only its
  script-location `REPO_ROOT` and the stamp path inheriting it remain live —
  and its prescribed cwd remedy does not fix them (clarification 243).
- `transition-node` — claimed by `tactic-graph-ref-split`.
- `graph-commit` — a *writer*; its `-C`/cwd shape is already the ratified
  correct one (clarification 86).
- `check-node-selection.ts` (required `--dir`) and `compute-freshness.ts`
  (explicit `--snapshot`/`--stamp`) — already converted; do not re-do.

## Implementation record

Shipped in PR #3095, squash-merged to `main` as `fe0b1c4d`, under
`strategy-graph-native-dispatch` clarification **242**, shape **(a)**: the tree
is a required explicit argument, never inferred from cwd or from the script's
own on-disk location.

Four files, as scoped — `validate-graph.ts` (store as a required positional),
`dump-node.ts` and `write-node.ts` (`--dir <intentions-dir>`), and `clear-park`
(`-C <repo-root>`). Every executable caller was converted with them, and
`packages/intentionsutil/test/reader-required-dir.test.ts` pins the four
refusals by spawning the real CLIs.

`demote-node-to-implement` was deliberately **excluded**. Clarification 242
removed it from this node's scope and clarification 243 rules its correct shape
separately, so it remains open on `tactic-demote-node-stale-local-read`, which
stays `raw` and blocked. Nothing here should be read as having fixed it.

### Residual, found in post-merge QA and not fixed here

The vacuous-pass hole is closed for the two cwd-driven cases that caused it: a
missing store argument and a path that does not exist both exit 2. It is **not**
closed for a directory that exists but holds no nodes — that still prints
`ok — 0 nodes` and exits 0. `validate-graph.ts`'s own docstring (`:111`,
*"Validating \"nothing\" is never a pass"*) therefore overstates what landed;
`main()` guards the path with an existence/is-a-directory check only, and there
is no zero-node guard. A follow-up should either add that guard or narrow the
docstring to the contract the code actually keeps.
