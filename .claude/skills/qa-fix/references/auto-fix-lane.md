# Step 3.7 — Auto-fix lane (finalize paths, tallies, outcome envelope, invariants)

This reference carries the full finalize-path mechanics for Step 3.7 of
`SKILL.md`. The body holds the top-level branch structure (compute `opusFixable`;
empty → skip; else branch on `fix_plan === null` / `deviation` / empty units /
have-units → no-progress short-circuit → attempt gate → fix-or-escalate). This
file carries the two finalize paths, the tallies, the outcome-envelope emits, and
the CRITICAL invariants.

## Branch detail (have opus-fixable items)

Otherwise (opus-fixable items present), choose exactly one path:

- **`result.fix_plan === null`** → **escalate** all residue to office-hours;
  take the **escalate finalize path** below and apply **no** attempt label.
  Distinguish the two failure modes that both yield `null` so operators see
  the correct remediation:
  - **`plan_fix` was false** (the attempt count `ATTEMPT_N >= CAP`, so
    planning was deliberately not run) → use a **"cap reached"** reason. The
    remediation is to wait for the cap to reset.
  - **`plan_fix` was true but `fix_plan` is `null`** (the planning agent died
    without returning a plan) → use a distinct **"planning agent did not
    return a plan"** reason. The remediation is to re-trigger the planner, not
    to wait for a cap reset.

- **`result.deviation === true`** → **scope-deviation escape**: the planner
  refused to author a fix because the change exceeds QA-fix scope. Escalate
  to office-hours passing `result.fix_plan.deviation_reason`. Take the
  **escalate finalize path** below; apply **NO** attempt label — a
  scope-deviation is a permanent escalation, not a retry.

- **`result.fix_plan.units` is empty** (and not a deviation — i.e. planning
  produced nothing usable) → escalate with a planning-failed reason. Take the
  **escalate finalize path** below; apply **no** attempt label.

- **Otherwise (have units):**

  **No-progress short-circuit (#2040).** Before spending another fix lane,
  verify this attempt would resolve at least one item the prior attempt was
  still failing on. Write the current opus-fixable failing-id set —
  `opusFixable.map(d => d.id)`, one id per line — to
  `tmp/qa-residue-current.txt`, then (use `dangerouslyDisableSandbox: true`
  — it calls `gh`):
  ```bash
  .claude/skills/dispatch-propagate/scripts/dispatch-qa-noprogress \
    "$PR_NUM" tmp/qa-residue-current.txt
  ```
  Branch on its **STDOUT only**:
  - Prints **`no-progress`** → the prior attempt's failing set was non-empty
    and this attempt resolves none of it; re-spending the lane would just
    spin. Take the **escalate finalize path** below (apply **NO** attempt
    label), with a reason naming the per-issue total read from the issue's
    `dispatch:attempts-<n>` label (the cross-phase counter):
    ```bash
    TOTAL=$(gh issue view "$N" --json labels \
      --jq '[.labels[].name | capture("^dispatch:attempts-(?<n>[0-9]+)$").n | tonumber] | max // 0')
    ```
    (use `dangerouslyDisableSandbox: true` — `gh` needs network)
    Reason: `qa-fix made no progress vs the prior attempt; total attempts across all phases = <TOTAL>`.
  - Prints **`progress`** (first attempt, or at least one prior-failing item
    resolved) → fall through to the attempt-cap gate below. The script has
    already refreshed the `<!-- dispatch:qa-residue -->` PR comment with the
    current set, so the next attempt has a fresh baseline.

  Then run the attempt gate (use
  `dangerouslyDisableSandbox: true` — it calls `gh`):
  ```bash
  .claude/skills/dispatch-propagate/scripts/dispatch-qa-fix-attempt "$PR_NUM"
  ```
  Branch on its **STDOUT only**. It applies the attempt label itself as a
  side effect when it prints `fix` — **this skill must NOT separately apply
  any attempt label** on any path.
  - Prints **`escalate`** (defensive cap re-check / race-safety) → escalate
    with a cap reason. Take the **escalate finalize path** below.
  - Prints **`fix`** → take the **fix finalize path** below.

## Fix finalize path (units present, gate printed `fix`)

1. Loop `result.fix_plan.units` **in dependency order** (the `units` array is
   emitted ordered; respect each unit's `dependencies`). For each unit, invoke
   `/implement-unit` via the Skill tool, mapping only `unit.model`,
   `unit.scope`, `unit.context`, `unit.commit_intent` into its parameters
   (`id` / `dependencies` / `resolves_ids` are for your ordering and the Step 4
   comment, not passed through; `resolves_ids` is **also** read to compute the
   `--fixes-applied` count below, but is still not passed into `/implement-unit`).
   Fold into each unit's `context`, verbatim: "Read any file with the Read tool
   before your first Edit or Write to it in this session — the edit is rejected
   otherwise and the retry burns the tokens twice."
   The draft PR already exists — open **NO** new
   PR. A unit completing in this `/implement-unit` loop is mid-loop, not the end
   of the turn — continue to the next unit, then Steps 4 and 5 and the marker;
   do not emit a closing summary. The terminal rule is the **CRITICAL
   invariants** block below (the fix path HARD-STOPS the skill).

   **Track a `fixes_applied_count` tally** (agent-maintained running count, NOT
   a shell variable — this loop is an agent-driven sequence of Skill calls, not
   a bash `for`-loop): initialize it to `0` before the first `/implement-unit`
   invocation. After each invocation, accumulate the unit's resolved
   opus-fixable finding IDs — increment by `len(unit.resolves_ids)` (equivalently,
   add the unit's `resolves_ids` to a running set of resolved IDs and use that
   set's size) **only** when the invocation hands control back per its Step 4
   (the unit's commit landed cleanly). `resolves_ids` is already available per
   unit in the loop. Do **not** increment when an invocation errors, dies, or
   returns without a landed commit. The precise definition: `fixes_applied_count`
   = the count of **distinct** opus-fixable finding IDs resolved by landed units
   this pass (the planner partitions opus-fixable findings disjointly across
   units, so this equals the sum of `resolves_ids` lengths over landed units).
   This tally feeds `--fixes-applied` in item 5 of this path (the outcome
   envelope call, below — replacing the planned `units.length` with the count of
   resolved opus-fixable findings).

   **Also increment `SKILL_SUBAGENTS` by 1 after EACH `/implement-unit`
   invocation**, regardless of whether the unit landed a commit — every
   invocation is a spawn. Keep this distinct from `fixes_applied_count`, which
   increments only on a landed commit: an invocation that errors, dies, or
   returns without a landed commit still bumps `SKILL_SUBAGENTS` (it forked) but
   does **not** bump `fixes_applied_count`.

   **If `fixes_applied_count == 0` after the loop** (no opus-fixable finding was
   resolved this pass — either no unit landed a commit, or the landed units
   collectively resolved zero findings), do **NOT** continue down this fix
   finalize path — its outcome envelope hard-codes
   `--disposition completed_with_fixes`, which the `outcome-envelope.md`
   contract defines as "the phase finished and applied one or more fixes."
   Emitting it with `fixes_applied = 0` violates the contract and corrupts
   downstream hit-rate metrics. Instead take the **escalate finalize path**
   below with a `terminated_reason` of `fix-pass-landed-nothing` (no opus-fixable
   finding was resolved this pass). The guard now fires on resolved-finding
   count, not on the planned `units.length`.
2. Run **Step 4** (post the PR-comment summary; its disposition section uses the
   **fixing-pass** prose — see Step 4).
3. Run **Step 5** (cleanup — it self-guards and no-ops if the QA server never
   started).
4. Write the `qa` phase-completed marker (use `dangerouslyDisableSandbox: true`
   — it invokes `gh`); apply **NO** `dispatch:qa-done`:
   ```bash
   .claude/skills/dispatch-propagate/scripts/dispatch-mark-complete \
     --phase qa --pr "$PR_NUM"
   ```
5. **Emit the outcome envelope** (contract: `.claude/docs/outcome-envelope.md`).
   This call runs **sandboxed** — `dispatch-emit-outcome` is pure (no
   gh/git/network), so do **not** pass `dangerouslyDisableSandbox`. The fix
   finalize path always runs after Step 3.5, so `result` is in scope. **Override**
   `--disposition` to `completed_with_fixes` and **recompute** the counts the
   Workflow could not — do **NOT** forward `result.fixes_applied` /
   `result.followups_filed` (both literal `0` from the Workflow):
   - `--fixes-applied` = `fixes_applied_count` — the count of distinct
     opus-fixable finding IDs resolved by successfully landed units this pass
     (the sum of `resolves_ids` lengths over landed units; the tally maintained
     by the loop above, per the `outcome-envelope.md` contract that
     `fixes_applied` = items the phase actually fixed). Do **not** use
     `result.fix_plan.units.length` (the planned unit count) or
     `result.fixes_applied` (a literal `0` from the Workflow, which plans but
     never executes).
   - `--followups-filed` = the count of `needs-main` follow-ups Step 3.6 actually
     filed this pass (newly-filed only, not already-tracked); `0` if Step 3.6 did
     not run.
   - `--tool-denials` / `--denied-command`: **omit both**. The script derives
     `tool_denials` and `denied_commands` from this session's transcript
     (`toolDenialKind == "user-rejected"`) and always emits them, defaulting to
     `0` / `[]` — see the tool-denial accounting note in
     `terminal-disposition.md`.
   - `--subagents-launched` = `SKILL_SUBAGENTS + result.subagents_launched`.
     `result` is always in scope on the fix finalize path (it runs after Step
     3.5), so add the Workflow's own fan-out (`result.subagents_launched`) to the
     skill-body tally. `SKILL_SUBAGENTS` already counts every skill-body fork
     this pass — the Step-2b triage, any Step-0.5 fallback fork, the Step-3.6
     filing subagents, and the Step-3.7 `/implement-unit` invocations.

   qa-fix keeps **no** merge base for the ledger (Step 1 resolves a base through
   `resolve-diff-base.sh` and runs one name-only `git diff "$DIFF_BASE"..HEAD`
   against it — a base for that one diff, not a base the pass records), so
   **omit** `--base-sha` (it serializes as null). Derive `repo` from the local remote (read-only git, sandbox-safe). On
   the node lane (`TARGET_KIND=node`) pass `--node-id "$N"` and omit `--issue`;
   on the legacy issue lane (`TARGET_KIND=issue`) keep `--issue "$N"` and omit
   `--node-id`:
   ```bash
   REPO=$(git remote get-url origin | sed -E 's#.*github.com[:/]##; s#\.git$##')
   if [[ "$TARGET_KIND" == node ]]; then
     id_arg=(--node-id "$N")
   else
     id_arg=(--issue "$N")
   fi
   # tool_denials / denied_commands are always in the record and are DERIVED by
   # the script from this session's transcript — pass no flag for them.
   .claude/skills/dispatch-propagate/scripts/dispatch-emit-outcome \
     --phase qa --repo "$REPO" "${id_arg[@]}" --pr "$PR_NUM" \
     --findings-surfaced <result.findings_surfaced> \
     --findings-actionable <result.findings_actionable> \
     --fixes-applied <fixes_applied_count> \
     --followups-filed <count of needs-main follow-ups Step 3.6 newly filed> \
     --subagents-launched <SKILL_SUBAGENTS + result.subagents_launched> \
     --disposition completed_with_fixes
   ```
6. **Stamp the lane pass on the node** (`TARGET_KIND=node` only). The dispatch
   ladder decides whether a phase pass completed by reading `origin/main` graph
   state. A fixing pass finishes by pushing fix commits to the node's branch and
   writing job-dir markers — it deliberately does **not** move the node's `phase`
   (that is the re-QA mechanism, below). With no durable graph write, a
   **successful** fixing pass reads as `stalled` and the ladder halts a run that
   made progress. `execution.lane_pass` is that write: a single object each pass
   overwrites, never cleared.

   Run it from the node's worktree, exactly as the clean path runs
   `transition-node "$N" --set-pr "$PR_NUM"` (`.claude/skills/qa-fix/SKILL.md`,
   the node-lane **Completion** bullet). Use `dangerouslyDisableSandbox: true`
   on the **first** attempt — not because of the network (`github.com` is
   allowlisted, so `git push` needs no override), but because `graph-commit`
   rebases onto an `intentions/`-only base and that rebase meets the
   read-only `.claude/` carve-outs. When it aborts it **reverts the
   uncommitted node edit**, so a retry has nothing left to land. See
   `.claude/rules/sandbox.md`, §graph-commit:
   ```bash
   node --import tsx/esm packages/intentionsutil/scripts/apply-lane-pass.ts "$N" --stamp \
     --lane qa-fix --phase qa --sha "$(git rev-parse HEAD)"
   packages/intentionsutil/scripts/graph-commit -m "graph: record qa fixing pass on $N" "$N"
   ```

   `--phase qa` is a **literal**, not a read. The front door already gated on
   `phase == qa` (`.claude/skills/qa-fix/references/target-resolution.md:18-23`),
   so there is nothing to read and no drift to guard against.

   **Push first, stamp second.** This item sits after the `/implement-unit` loop
   because each unit's `/commit-merge-push` has already pushed by then — the
   stamp claims a pass completed, and that claim is only honest once the fixes
   are durable at `origin`. It makes "stamp landed, push failed" rare rather
   than reachable.

   **A non-zero exit from either call is a WARNING, not a hard stop.** Print it
   to stderr and continue to item 7. **This inverts the usual graph-write
   discipline — where a failed write stops the path — and it is meant to; do not
   "fix" it to match a neighboring hard-stop rule.** A pass that stops here
   never writes the node-terminal marker in item 7, so `dispatch-self-close`
   HOLDs the job, the node becomes permanently unselectable, and a worker slot
   is consumed. A failed stamp costs one false `stalled` read — today's status
   quo, and the exact thing the stamp exists to remove — which is strictly
   cheaper than a wedged worker.

7. **Write the node lane's terminal-disposition marker** (`TARGET_KIND=node`
   only; the legacy issue lane has no such marker). This must come **after**
   the PR comment (Step 4), the phase-completed marker (item 4 above), the
   outcome envelope (item 5 above), and the lane-pass stamp (item 6 above) —
   `Stop` fires on every turn yield, not only on terminal exit, so writing this
   marker early would let the hook reap the job before those writes land:
   ```bash
   packages/intentionsutil/scripts/mark-node-terminal "$N" fix-attempt
   ```
   `fix-attempt` is correct here too: this pass spent an attempt via the fix
   lane, same as `/fix-checks`' own node lane (retry by design — the selector
   re-routes on a later tick).
8. **STOP.**

## Escalate finalize path

(cap reached, scope-deviation, planning-failed, fix-pass-landed-nothing,
no-progress vs the prior attempt, or the gate printed `escalate`):
1. Run **Step 4** (post the PR-comment summary; non-fixing-pass / escalation
   prose).
2. Run **Step 5** (cleanup — self-guards).
3. Escalate per the **Escalation** section (`dispatch-mark-deviation`), tailored
   to the reason that fired (cap reached / scope-deviation with
   `deviation_reason` / planning-failed / qa-fix-no-progress / fix-pass-landed-nothing — no
   opus-fixable finding was resolved this pass — either no unit landed a commit,
   or the landed units collectively resolved zero findings, so
   `fixes_applied_count` stayed `0`).
4. **STOP.**

## CRITICAL invariants — state and obey these

- **The fix path HARD-STOPS the skill.** After the `/implement-unit` loop +
  Step 4 + Step 5 + `dispatch-mark-complete --phase qa`, the skill MUST stop and
  MUST NOT fall through to Step 6. If it fell through, Step 6 would escalate the
  residue — producing **both** a fix AND an escalation in the same pass. The
  auto-fix lane writing the `qa` marker is **terminal** for this pass.

- **Mixed case = fix-first, escalate NOTHING that pass.** The lane fires
  whenever `opusFixable` is non-empty **regardless** of co-present `needs-main`
  / `needs-human` items. A fixing pass fixes only the opus-fixable units and
  **escalates nothing** — it fixes, writes the `qa` marker, and stops. Co-present
  `needs-main` items were already filed as `blocked_by` follow-ups in Step 3.6
  (which ran before this lane) and are dropped from escalation; they are **not**
  re-escalated. Co-present `needs-human` items re-surface on the re-QA tick;
  once **no** opus-fixable items remain, *that* later run escalates the
  `needs-human` items via the normal Step 6 path. Do **not** escalate co-present
  human items "while we're here," and do **not** escalate `needs-main` items at
  all — they were filed as follow-ups.

- **Re-QA mechanism.** The fix commits (landed per-unit by `/implement-unit`'s
  `/commit-merge-push`) restart CI. qa-fix wrote a `qa` phase-completed marker
  with **no** `dispatch:qa-done`, so the chain re-derives `qa` once CI passes
  (`dispatch-phase`: qa-done-absent → `qa`) and re-QAs the fixed build. Because
  qa-fix writes a marker (the Stop hook's "phase advanced" branch), the qa-fix
  **attempt cap is enforced HERE in this skill**, not in the stop hook — no
  `dispatch-stop.sh` change is needed.

- **Known pre-existing race (flag, do NOT "fix").** If a Stop hook fires after a
  fix push but before GitHub registers the new pending checks, the rollup could
  read the prior green state → ready → a spurious same-phase office-hours park.
  This TOCTOU window already governs **every** `fix-*` phase; commit-merge-push
  pushes synchronously and CI registration is near-immediate, so the worst case
  is a spurious office-hours park (the spawned tick re-gates), **never lost
  work** — re-QA rediscovers deferred items regardless. State this so a future
  reader does not "fix" it by adding a qa-fix-attempt branch to the stop hook.
