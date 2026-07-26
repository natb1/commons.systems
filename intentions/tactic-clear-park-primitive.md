---
id: tactic-clear-park-primitive
kind: tactic
statement: Add a scripted atomic clear-park primitive (inverse of park-node)
  that the self-modification drain lane invokes as its mandatory terminal park
  disposition
owner: ai
status: codified
parent: null
rationale: Surfaced 2026-07-18 align-strategy interview recording the drain-lane
  terminal-disposition requirement (strategy-graph-native-dispatch clarification
  65). park-node has no scripted inverse; a park is cleared today only by
  clarification 4's incidental side-effect (a commit touching the node) or a
  hand-rolled inline readNode -> office_hours=null -> writeNode -> graph-commit.
  The drain lane's fix commit lands on the PR branch and never touches the node
  frontmatter, so the incidental clear never fires and the separate inline
  clear-park is forgettable (park -> drain -> re-park -> clear on
  tactic-phase-standup-audit-lens). A dedicated primitive makes the terminal
  disposition atomic and unskippable.
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 85
  override: null
  rationale: "Author-directed 2026-07-25: the queue-serialization work
    (dispatch-queue claim integrity, office-hours drain claiming, and the
    cross-queue landing path) is the current focus. Own boost 85 composes with
    the +5 inherited from strategy-graph-native-dispatch to an authored 90 —
    exact parity with tactic-graph-router-live-worker-read-robust, the existing
    author-set boost on this same defect class — and deliberately below
    strategy-main-health's standing 100 so the main-health signal keeps its
    recorded dominance."
phase: main-qa
execution:
  branch: tactic-clear-park-primitive
  pr: 2947
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  completion:
    mergedAt: 2026-07-25T18:21:49Z
    mergeCommitSha: dee357ae4d77018525a3a6a07a0adf0c71fa3cca
    graphCommitSha: null
validates: []
blocked_by: []
office_hours:
  reason: "graph-commit: concurrent-edit conflict — manual merge needed"
  since: 2026-07-26
  recommendation: "A concurrent writer landed an overlapping edit to this node
    while this session's edit was in flight; this writer's content was NOT
    landed. This session's unlanded content is preserved at
    /tmp/tmp.Aw7mheRXYx/tactic-clear-park-primitive.md (this machine only — may
    not survive past this session). Recommended: the losing writer re-reads the
    current origin/main content, manually merges in its intended edit, and
    re-runs graph-commit on the merged result — that same commit clears this
    office_hours park. A third session encountering this park while the loser is
    still working should wait rather than attempt its own merge (the mailbox
    discipline)."
pace_exempt: false
rounds: null
attributes: {}
---

# Scripted atomic clear-park primitive

## Context

`park-node` (`packages/intentionsutil/scripts/park-node`) sets a node's
first-class `office_hours` field and lands it on `main` through `graph-commit`.
It has **no scripted inverse**. A parked node's `office_hours` is cleared today
only by (1) clarification 4's incidental side-effect — *any* interactive commit
that touches the node's own frontmatter — or (2) a hand-rolled inline
`readNode → office_hours = null → writeNode → graph-commit` sequence.

The self-modification **drain** lane triggers neither reliably: its fix commit
lands on the **PR branch** and never touches the node's `office_hours` field, so
the incidental clear (1) never fires, and the separate inline clear (2) is not
forced by session termination and so is forgettable. The observed live failure:
`tactic-phase-standup-audit-lens` went park → drain (fix pushed, CI green) →
**re-park** → clear across separate sessions because the terminal clear was
never atomic with the drain.

`strategy-graph-native-dispatch` clarification 65 makes the fix mandatory: the
drain lane must **terminate** with an explicit park disposition executed through
a scripted atomic primitive — `clear-park` on green CI, `park-node` (re-park) on
red/blocked CI — never leaving a drained node ambiguous. This tactic delivers
that `clear-park` primitive. (Wiring it into the drain skill is the separate
`tactic-office-hours-self-modification-skill`; the emulated drain prompt
`~/prompt-emulated-office-hours.md`, outside this repo, already invokes
`clear-park` with an emulation fallback until the script lands — both are out of
scope here.)

## Units of work

### Unit 1 — Add `packages/intentionsutil/scripts/clear-park`

**Recommended model:** sonnet

**Scope.** Create one new executable bash script,
`packages/intentionsutil/scripts/clear-park`, as the exact inverse of
`park-node` (`packages/intentionsutil/scripts/park-node:1`). Mirror park-node's
structure line-for-line, changing only the write payload and the commit message:

- **Usage:** `clear-park <node-id> [note]` — exactly one required arg (the node
  id) and an optional free-text `note` folded into the commit message. Reject
  `$# < 1`, `$# > 2`, or an empty node id with a `usage:` line on stderr and
  `exit 2` (park-node's usage-guard shape, `park-node:44-48`, adjusted for the
  1–2 arg count).
- **Path/module resolution:** copy park-node's `SCRIPT_DIR` / `REPO_ROOT` /
  `INTENTIONS_DIR` / `STORE_MODULE` block verbatim (`park-node:31-35`).
- **Write payload:** in the throwaway `.mts` heredoc, do
  `const node = readNode(intentionsDir, id); node.office_hours = null;
  writeNode(intentionsDir, node);` — the inverse of park-node's
  `node.office_hours = { reason, since, recommendation }` assignment
  (`park-node:63-71`). Author no markdown; go through `store.ts`'s
  `readNode`/`writeNode` exactly as park-node does. `clear-park` needs **no**
  `reason`/`since`/`recommendation` — drop those argv slots from the heredoc.
- **Already-cleared guard (intentional, not a fallback):** after `readNode`, if
  `node.office_hours` is already `null`, print an informative stderr note
  (`clear-park: <id> is not parked (office_hours already null); nothing to do`)
  and `exit 0` **without** calling `graph-commit`. This is deliberate idempotent
  behavior — clearing an unparked node is a no-op, and skipping the commit avoids
  a `graph-commit` empty-diff failure. It is a clear boundary decision, not a
  buried error-hiding fallback (`.claude/rules/code-style.md`). Have the heredoc
  signal the guard to the outer shell (e.g. `process.exit(3)` from the `.mts` on
  already-null, and let the bash wrapper translate exit-3 → the note + `exit 0`;
  any other non-zero heredoc exit → the write-failed path + `exit 1`).
- **Land on main:** on a real clear, land via the `graph-commit` primitive with
  `-m "graph: clear office_hours park on <node-id> (<note>)"` — omit the
  `(<note>)` suffix when `note` is empty (`park-node:88-91` is the model call).
  `graph-commit` is the only main-landing path; never push/commit to main
  directly.
- **Exit codes** mirror park-node (`park-node:26-28`): `0` cleared and landed on
  main (or already-clear no-op); `1` the write or graph-commit failed; `2` usage
  error.
- **Header comment:** open with a park-node-style block comment naming this as
  the scripted inverse, citing clarification 65 and the drain-lane terminal
  disposition, and noting the already-cleared no-op behavior.
- `chmod +x` the new file (park-node is executable; match its mode).

Out of scope: any change to `park-node`, `graph-commit`, `store.ts`,
`schema.ts`, the drain skill (`tactic-office-hours-self-modification-skill`), or
the emulated prompt.

**Dependencies.** None.

## Reuse

- `packages/intentionsutil/scripts/park-node` — the script to mirror
  line-for-line; invert only the `office_hours` assignment and the commit
  message, and drop the `reason`/`recommendation` args.
- `packages/intentionsutil/src/store.ts` `readNode` / `writeNode` — the sole
  validated read/write path (already unit-tested by
  `packages/intentionsutil/test/store.test.ts`); `clear-park` authors no YAML
  itself.
- `packages/intentionsutil/scripts/graph-commit` — the only path that lands a
  node edit on `main` (stamps the four required checks via the `graph/**` fast
  path, then fast-forwards). Called exactly as park-node calls it.

## Verification

`clear-park` is a thin bash wrapper whose only real work — `readNode →
office_hours=null → writeNode` — delegates to the already-tested `store.ts`, and
whose landing delegates to `graph-commit` (which lands on `main` and so is not
exercised in an isolated unit test, exactly as its sibling `park-node` carries
no unit test). Verification is therefore mostly inspection plus a store-level
round-trip, matching the sibling's posture:

- Structural inspection: `clear-park` mirrors `park-node`'s arg-guard,
  path-resolution, heredoc, and `graph-commit` invocation, differing only in the
  `office_hours = null` payload, the dropped `reason`/`recommendation` args, the
  already-cleared no-op guard, and the commit message.

- The `store.ts` round-trip the script relies on (write `office_hours` non-null,
  read it back null after clearing) is covered by the existing suite:

```verify
npx vitest run --project packages/intentionsutil --root .
```

- Manual/observe-in-production (not auto-runnable, `graph-commit` lands on
  `main`): against a genuinely parked scratch node, run
  `./packages/intentionsutil/scripts/clear-park <node-id> "test note"`
  (sandbox off — it needs network/daemon/TLS) and confirm
  `git show origin/main:intentions/<node-id>.md` shows `office_hours: null` and
  the commit message reads `graph: clear office_hours park on <node-id> (test
  note)`. Re-running it on the now-unparked node prints the not-parked note and
  exits 0 without a new commit (idempotency). The full drain-lane terminal
  disposition is exercised in production once
  `tactic-office-hours-self-modification-skill` wires the call.

## needs-main residue

`/qa-fix` ran the autonomous QA pass on PR #2947 (2026-07-23). All
script-verifiable items passed (syntax check, executable+shebang check, usage-error
exit codes). Two acceptance criteria are genuine planned deferrals — their
verification requires a live `git fetch origin/main` and a real `graph-commit`
landing on `main`, both out of scope for an automated non-mutating check — so they
are deferred here for post-merge verification against deployed main:

- **id 4** — Idempotent no-op exit 0 when the node is already unparked on
  origin/main
  - url_path: current (CLI script, no URL)
  - expected_outcome: Against a node whose `office_hours` is already `null` on
    origin/main, `clear-park <node-id>` prints an already-unparked note, exits 0,
    and does NOT invoke `graph-commit` (no empty commit lands).
  - finding: exercising this path requires a live `git fetch origin main` and an
    `npx tsx` execution against `store.ts` against a real already-unparked node —
    network/mutating side effects out of scope for an automated non-mutating
    shell check in this sandbox; verify by running `clear-park` against a real
    already-unparked scratch node on main.

- **id 5** — Full clear-and-land round-trip, `--base` compare-and-swap, and
  stale-base refusal
  - url_path: current (CLI script, no URL)
  - expected_outcome: Against a genuinely parked node, `clear-park <node-id>
    "<note>"` clears the park and `graph-commit` lands the edit on origin/main
    with the correct commit message; separately, a since-advanced `--base` is
    refused (exit 1) rather than silently reverting intervening changes.
  - finding: the production round-trip (real fetch, real store write,
    `graph-commit` landing on `origin/main`, and the stale-base refusal path)
    requires network and repository-mutating side effects out of scope for an
    automated non-mutating check; verify by running `clear-park` against a real
    parked scratch node on main, and by testing the stale-base refusal directly.
