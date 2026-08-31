---
id: tactic-qa-main-park-base-cas
kind: tactic
statement: /qa-main's cannot-verify Stop-hook park calls park-node with no
  --base CAS, so an in-flight qa-main session can revert a phase transition that
  landed on origin/main after it read the node — and the pinned form must also
  be made invocable under auto mode, which currently denies the --base flag
owner: ai
status: codified
parent: null
rationale: "Observed clobber on tactic-execution-pr-merge-verification,
  2026-07-28: an in-flight /qa-main session reverted the author's just-landed
  done transition 54 seconds later and re-parked on a residue item the author
  had already waived, deadlocking tactic-census-scripted-tick (which is
  blocked_by that node). park-node already supports --base with an exit-3
  stale-diagnosis refusal that would have caught it. Distinct producer from
  tactic-graph-write-recipes-base-cas, tactic-drain-disposition-diagnosis-cas,
  tactic-demote-node-stale-local-read, and
  tactic-fix-checks-pushed-nothing-base. Planned 2026-07-30 by the
  dispatch-pipeline bootstrap through a parallel Workflow fan-out rather than an
  /align-tactics round, so that skill's two-sided drift review and its census
  were bypassed (deliberate: ten concurrent align rounds would mean ten
  concurrent graph-commits, the exact hazard the bootstrap exists to avoid).
  Each plan was authored against the node's own cited code and then
  independently verified by a second agent; all reported citation and substance
  gaps were applied before landing. A later /align-tactics round should treat
  this body as unreviewed by the normal path."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 0.05
  override: null
  rationale: >-
    Bootstrap re-scale 2026-07-30: Wave A of a three-band interim scale (50 / 20
    / 10) that puts write-path integrity work above ordinary feature work. This
    band holds the silent graph-write-corruption defects plus the two paths the
    bootstrap arms or depends on. Interim scaffolding only -
    tactic-attention-tier-ranking replaces the whole numeric scheme with
    lexicographic (tier, rank) and max-lifting, and
    tactic-attention-boost-scripts converts these boosts to tier/bug_fix marks.


    NAMESPACING STOPGAP 2026-08-11: magnitude compressed from 50 to 0.05 so this
    boost can no longer lift the node out of its parent strategy's band. The
    bound - a tactic boost is namespaced to its strategy's rank and must never
    cause the tactic to outrank a tactic of a higher-ranked strategy - is
    recorded doctrine on strategy-recursive-self-improvement but is NOT yet
    enforced by the resolver; tactic-attention-namespaced-rank makes it
    structural. Until then the flat additive sum defeats it, so the magnitudes
    are compressed by hand onto a 0.01-per-level ladder that preserves the
    original ordering WITHIN the band. Original magnitude preserved at
    attributes.pre_namespacing_boost for restoration.
  tier: 1
phase: qa
execution:
  branch: tactic-qa-main-park-base-cas
  pr: 2993
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion: null
validates: []
blocked_by: []
office_hours:
  reason: "/qa-fix: item 12 (dispatch-stop.sh malformed office-hours-base marker
    silently degrades to an unpinned park, no stderr warning, unlike its two
    sibling branches) was dispositioned opus-fixable and refuted by adversarial
    skeptics as 'nothing to fix', but the gated fix-plan phase refused to author
    a fix, flagging a scope-deviation: choosing among
    ratify/warn-on-stderr/fail-closed is a failure-mode policy decision the PR's
    acceptance criteria do not authorize. Escalating to office-hours for a human
    ratification call; no code defect found, no attempt label applied (permanent
    deviation escalation, not attempt-capped)."
  since: 2026-07-31
  recommendation: |-
    # Recommendation: `tactic-qa-main-park-base-cas` (PR #2993)

    ## The decision you need to make

    `dispatch-stop.sh` reads the new `office-hours-base` marker and, if the value is not 40 hex chars, silently drops it and parks unpinned (`.claude/hooks/dispatch-stop.sh:91-97`). The *degrade-rather-than-pass-through* choice is settled and correct — passing a bad value to `park-node` yields a usage error (exit 2) and loses the escalation park entirely. What is **not** settled is whether that branch should say anything. Its two siblings in the same function both warn on stderr (`:132-135` for `stale-diagnosis`, `:137-140` for generic failure). Pick one: **(a) add a stderr warning** matching the siblings, **(b) ratify the silence** and record why in the comment, or **(c) fail closed** (refuse the park on a malformed marker).

    Two automated judgments split on this, which is why it reached you: the disposition workflow classified it `opus-fixable` and 2/2 skeptics refuted "nothing to fix"; the fix-planning agent refused, calling failure-mode selection outside the PR's acceptance criteria. Both are defensible — the fix is mechanical, but it *is* a behavior choice, and that is your call.

    ## My read (for you to ratify or override)

    Option (a), the stderr warning. `.claude/rules/code-style.md` is close to dispositive: silently swallowing a malformed input is exactly the "defensive fallback" it warns against, while "defensive checks... that turn confusing crashes into clear errors are encouraged." A malformed `office-hours-base` marker means a *producer bug* — `dispatch-derive-node-target` emitted a bad `BASE:`, or the marker got truncated — and the only symptom today is that the CAS protection this whole PR exists to add quietly stops applying. That is the failure mode the PR was written to prevent, reintroduced through the back door. A warning costs nothing, changes no control flow, and leaves the degrade decision untouched.

    I would **not** take (c): fail-closed contradicts the opt-in design documented at `:86-90` and the hook's stated best-effort philosophy, and losing an escalation park is worse than losing a pin. (b) is tenable if you consider hook stderr already noisy enough that a warning would be ignored — but then say so in the comment, so the asymmetry with the siblings is explained rather than merely present.

    ## If you choose (a)

    Add the `else` arm to the regex check at `.claude/hooks/dispatch-stop.sh:94-96`, in the sibling branches' format:

    ```
    [dispatch-stop] WARNING: office-hours-base marker for '$JOB_NAME' is malformed (not a 40-hex blob sha); parking UNPINNED (non-fatal)
    ```

    Do not echo the raw value verbatim without thought — it lands in hook stderr. Extend the existing malformed-marker test at `.claude/skills/dispatch-propagate/scripts/test-dispatch-stop-hook.sh:254-265`: it currently asserts exit code and argv-has-no-`--base` but never inspects stderr. Add an assertion that stderr contains the warning marker, mirroring how the exit-3 case at `:267+` already asserts stderr surfacing. Keep the existing exit-0 and single-`park-node`-call assertions intact. Then rerun `test-dispatch-stop-hook.sh` (61/61 today) — no other suite should move.

    ## Item 11 is not yours today

    The end-to-end question — does the pin actually fire on a real `/qa-main` cannot-verify park with a genuine concurrent transition — is already filed as `needs-main` residue on the node body and will be verified post-merge during `main-qa`. It needs a live production occurrence and requires no action from you now. Item 12 above is the only thing blocking this park.
  session_type: other
pace_exempt: false
rounds: null
attributes:
  pre_namespacing_boost: 50
---
# /qa-main's cannot-verify park must pin a diagnosis-time `--base`, and the pinned form must be invocable under auto mode

## Context

`/qa-main`'s graph-node lane has three terminal exits. Two of them (`pass`, `broken`) write through `transition-node`. The third, **cannot-verify**, does not write the graph in-session at all: the session writes its reason to `$CLAUDE_JOB_DIR/office-hours-reason` and its recommendation to `$CLAUDE_JOB_DIR/office-hours-recommendation`, then stops, and the Stop hook (`.claude/hooks/dispatch-stop.sh`, the park backstop at lines 64–98) invokes `packages/intentionsutil/scripts/park-node "$JOB_NAME" "$reason" "$reco"` to land the `office_hours` record on `origin/main`.

**The defect.** That `park-node` call carries no `--base` compare-and-swap. `park-node` supports one — the usage line is `packages/intentionsutil/scripts/park-node:69`, the resolution logic is `:147–180`, and the refusal is `:205–208` (exit 3, `stale-diagnosis`, "the node changed between diagnosis and execution … Nothing was written"). Without the pin, the park lands unconditionally against whatever `origin/main` holds when the Stop hook fires — which can be minutes after the session read the node and decided its verdict. Anything that landed on the node in that window is absorbed silently, including a phase transition that makes the park itself wrong.

**Observed clobber, 2026-07-28, node `tactic-execution-pr-merge-verification`.** Three commits on `main`, same morning:

| time | commit | effect |
|---|---|---|
| 11:14:29 | `71c013b8` | the author records a human-override waiver of needs-main residue item 12 |
| 11:17:18 | `6d7adefb` | `phase: main-qa` → `phase: done` |
| 11:18:12 | `fd9b3d6f` | `/qa-main` park: reverts `phase: done` → `main-qa` and writes `office_hours` |

`fd9b3d6f`'s parent is `6d7adefb` — the writer had `phase: done` in its git base and landed `main-qa` anyway, 54 seconds later, on a residue item the author had already waived. Blast radius: `tactic-census-scripted-tick` is `blocked_by` that node, so holding it off `done` held census blocked through `blockersComplete` (`packages/intentionsutil/src/router.ts:168–174`) — and the park's own recommendation told the human to wait for census to progress, a cycle the park created. It was drained by hand on 2026-07-30 (restore `phase: done`, `office_hours: null`).

**What is and is not already guarded (verified in this worktree — read this before assuming the path is unprotected).** `park-node` already fetches `origin/main`, overwrites the local node file from it, and passes `graph-commit --base "$NODE_ID=$FRESH_BLOB"` (`park-node:188–213`, `:263`). That guard is *execution-time*: it pins to the blob `park-node` itself just read, seconds before the land, and `graph-commit`'s `--base` does not refuse on staleness — it attempts a structural three-way merge and, failing that, writes its own auto-park (`packages/intentionsutil/scripts/graph-commit`, `check_base_freshness`, ~lines 258–330). What is missing is the *diagnosis-time* pin: the blob the qa-main session actually read and decided against. That pin is checked inside `park-node` before any mutation and **refuses** (exit 3) instead of merging. Applied to 2026-07-28 it would have refused, because the blob qa-main read (`phase: main-qa`, pre-11:17) no longer matched `origin/main` (`phase: done`).

I did **not** re-derive exactly why `graph-commit`'s own three-way merge failed to preserve `phase: done` on 2026-07-28 (fetch race between `park-node`'s fetch and the 11:17 push is the most likely mechanism, but I did not confirm it). Do not treat that as settled; the fix here does not depend on it, because an exit-3 refusal fires before any merge is attempted.

**Doctrine conflict to resolve.** `.claude/skills/ref-diagnosis-time-cas/SKILL.md:18–20` currently says the pin is "NOT needed for immediate mechanical parks that diagnose and execute in the same breath — e.g. the Stop-hook backstop (`.claude/hooks/dispatch-stop.sh`), which parks right after detecting a failure, with no interview gap." That is true of a provisioning failure, and false of `/qa-main`: its gap is a full browser-verification pass, not an interview. Leaving that sentence in place contradicts the change.

**Auto-mode half.** Measured 2026-07-30 during the drain: `graph-commit --base <id>=<sha> -m … <id>` issued as a Bash tool call was denied by the auto-mode classifier, while the identical command without `--base` was permitted and `graph-commit --help` passed — isolating the denial to the `--base` flag. Neither `park-node` nor `graph-commit` is auto-approved today: the PreToolUse hook `.claude/hooks/approve-workflow-commands.sh` only auto-approves paths matching `SCRIPT_RE` at `:26` (`(^|/)\.claude/skills/[a-zA-Z0-9_-]+/scripts/…$`) plus single-word `Bash(cmd:*)` entries from `.claude/settings.json`, and `packages/intentionsutil/scripts/*` matches neither. So both forms fall through to the classifier, which permits the unsafe one and denies the safe one.

**Correction to the node's own framing.** The node states halves (i) and (ii) must land together because "(i) alone produces a skill that either fails closed on every park or silently degrades to the unpinned form." That is only true if the *session* invokes `park-node --base` as a Bash tool call. In the design below the pinned invocation is made by the **Stop hook**, which the harness runs as a hook subprocess — hooks are not permission-gated and never reach the classifier. So Unit 3 is **not** a blocker for Units 1–2. It is still worth fixing, because the direct model-issued `park-node --base` invocations do exist elsewhere (the office-hours drain loop in `ref-diagnosis-time-cas`; note that `.claude/skills/dispatch-conflict/SKILL.md:933` is **not** such a site — it calls `park-node` bare, and `:584-588` of that file argues deliberately against `--base` there), and because the harness currently makes the safer form harder than the unsafe one. Keep it as its own unit; it may land in the same PR or be dropped without breaking Units 1–2.

**Intended outcome.** A `/qa-main` cannot-verify park either lands against exactly the node state the session verified, or refuses with `stale-diagnosis` and writes nothing. It never reverts a transition that landed mid-verification.

---

## Unit 1 — `dispatch-derive-node-target` emits the diagnosis-time base blob

**Recommended model**: `sonnet`

**Scope**

`.claude/skills/dispatch-propagate/scripts/dispatch-derive-node-target` is the shared front door every graph-native phase skill calls to derive its target. It already fetches `origin/main` (`:124`) and extracts `intentions/<id>.md` from it via `git archive origin/main` into a temp dir (`:129–133`), then reads the node through the store primitives. It does **not** expose the blob sha of what it read, so no caller can pin a later write to it.

Change:

1. In Step 3, immediately after the successful `git archive` at `:132–135`, resolve the blob sha of the node file as it exists at `origin/main`:

   ```bash
   BASE_BLOB="$(git rev-parse "origin/main:intentions/$NODE_ID.md")" || {
     echo "dispatch-derive-node-target: could not resolve the origin/main blob sha for intentions/$NODE_ID.md" >&2
     exit 1
   }
   ```

   Use `git rev-parse origin/main:<path>` specifically — that is byte-for-byte the same expression `park-node` uses to compute `FRESH_BLOB` (`packages/intentionsutil/scripts/park-node:192`), so the two shas are directly comparable. Do not substitute `git hash-object` on the snapshot.
   A failure here is a hard error (exit 1, matching the script's existing "node-not-found / read-failure" code), never a fallback to an empty base — an empty base silently degrades every downstream pin.

2. In Step 7's emit block (`:179–190`), add one line to the **header** region, after the `PR:` line and before `=== NODE-JSON ===`:

   ```bash
   printf 'BASE: %s\n' "$BASE_BLOB"
   ```

3. Update the script's header usage comment (`:33–41`, the `Stdout (success only):` block) to document the new `BASE: <40-hex blob sha>` line and what it is for: the diagnosis-time compare-and-swap token a caller passes to `park-node --base` / `clear-park --base`.

Placement matters: every existing consumer slices the front door's stdout with `sed -n '/^=== NODE-JSON ===$/,/^=== NODE-BODY ===$/p'` (see `.claude/skills/qa-main/SKILL.md:81–82`), so a new header line above that fence is invisible to them.

**Tests.** `.claude/skills/dispatch-propagate/scripts/test-dispatch-derive-node-target.sh` (291 lines; run in CI at `.github/workflows/unit-tests.yml:203`). Its assertions use `assert_contains` against captured stdout (see its Test 3 at `:186–193`), so existing cases stay green. Add assertions to at least one existing success case that:
- stdout contains a `BASE: ` line;
- the value matches `^[0-9a-f]{40}$`;
- the value equals `git rev-parse origin/main:intentions/<id>.md` computed independently in the harness for the same fixture node.

**Out of scope**: changing `PHASE:`/`PR:` emission or their parsing; changing any other consumer of the front door (fix-checks, review-fix, qa-fix, dispatch-conflict) to *use* the new line — this unit only publishes it.

**Reuse**: the existing fetch at `dispatch-derive-node-target:124` (do not add a second fetch); the existing `SNAP_DIR` machinery at `:129–135`; the harness helpers already in `test-dispatch-derive-node-target.sh`.

---

## Unit 2 — thread the pin from `/qa-main` through the Stop hook into `park-node`

**Recommended model**: `opus`

**Dependencies**: Unit 1 (the `BASE:` line must exist).

**Scope**

Four files.

**(a) `.claude/skills/qa-main/SKILL.md`.**

- In the node-lane front-door block (`:63–83`), bind the base alongside `NODE_JSON` / `NODE_BODY`. Parse it out of the **header** region only — a line inside the node body could otherwise start with `BASE: `:

  ```bash
  NODE_BASE=$(printf '%s\n' "$FRONT_DOOR" | sed -n '1,/^=== NODE-JSON ===$/p' | sed -n 's/^BASE: //p' | head -1)
  ```

- In the node-lane **cannot-verify** bullet — currently `.claude/skills/qa-main/SKILL.md:199–207` (the node's prose cites `198-206`; the citation has **drifted by one line**, locate it by the `- **cannot-verify** → the safety valve.` bullet) — add a third marker write: write `$NODE_BASE` to `$CLAUDE_JOB_DIR/office-hours-base` using the same atomic tempfile+`mv` write this lane already uses for `office-hours-reason` / `office-hours-recommendation` (the phrasing to mirror is in `.claude/skills/qa-fix/SKILL.md:193–195` and `.claude/skills/review-fix/SKILL.md:156–158`, which do exactly this for `office-hours-pr`).
- State in that bullet what the pin buys and what an exit-3 refusal means: the park is refused, nothing is written, the node keeps whatever newer state landed, and the job is held (not reaped) for a human. Do not instruct any retry or unpinned fallback.

**(b) `.claude/hooks/dispatch-stop.sh`.**

- Alongside the existing `office-hours-pr` marker read (`:71–77`), read `$CLAUDE_JOB_DIR/office-hours-base` into `_OH_BASE`, accepting it only when it matches `^[0-9a-f]{40}$` (mirror the `_OH_PR_RAW` integer validation exactly).
- When `_OH_BASE` is non-empty, prepend `--base "$_OH_BASE"` to `_PARK_ARGS` (built at `:84–91`). `park-node`'s parser is leading-flags-only and stops at the first non-flag argument (`park-node:89–134`), so all flags must precede `<node-id>`; `--pr` and `--base` may both be present, in either order, as long as both come before the id.
- **Absence of the marker keeps today's unpinned behavior.** This is the documented opt-in contract, not a silent fallback: the other marker-writing lanes (`fix-checks`, `review-fix`, `qa-fix`, `dispatch-conflict`) do not write a base yet, and a hook that failed closed on them would break every park they make. Say so in a comment.
- **Stop swallowing `park-node`'s stderr.** Line 92 currently runs `"$_PARK" "${_PARK_ARGS[@]}" >/dev/null 2>&1`, which discards the `stale-diagnosis` line that is the entire diagnostic value of the refusal. Capture the exit code, and on failure surface `park-node`'s stderr through the hook's own stderr — this mirrors the deliberate treatment of `dispatch-self-close`'s stderr documented at `:111–113` ("the one-line HOLD reason is the canary … swallowing it defeats the design"). Silence stdout only.
- Branch the failure log on exit code: **3** gets its own message naming `stale-diagnosis` and the node id, stating the park was refused because the node changed since the session read it and that nothing was written; any other non-zero keeps the existing generic warning at `:95`. Both stay non-fatal — the hook exits 0 unconditionally, per its best-effort contract (`:41–44`).
- Markers must **not** be consumed on any failure, including exit 3. The existing code only `rm -f`s on success (`:93`); keep that. Do **not** retry, and do **not** re-invoke `park-node` without `--base`.
- Update the hook's header block (`:24–29`) to describe the base marker the same way it describes `office-hours-pr`.

The resulting exit-3 outcome — deliberate, and to be stated in both the skill and the hook comment: `park-node` writes no `node-terminal` marker on a refusal (it writes one only after a landed park, `park-node:277`), so `dispatch-self-close --node` HOLDs the job alive instead of reaping it (the gate tested at `.claude/skills/dispatch-propagate/scripts/test-dispatch-stop-hook.sh`). The node is left at its newer, correct state; the held session is visible and resumable, and re-verification is the next `/qa-main` run — which is the re-diagnosis the doctrine requires. This is an operational stall requiring a human glance, not a graph corruption, and it is strictly better than the alternative of reverting a landed transition.

**(c) `.claude/skills/ref-diagnosis-time-cas/SKILL.md:18–20`.** Rewrite the "NOT needed … e.g. the Stop-hook backstop" carve-out. The distinguishing criterion is the *gap*, not the caller: a provisioning failure diagnosed and parked in the same breath needs no pin; a `/qa-main` cannot-verify park, whose verification pass runs for minutes between the front-door read and the Stop-hook park, does. Document the marker seam (`office-hours-base`) and the exit-3 disposition described above (hold, no re-park, re-verify on the next selection) so the reference stays the single home of this contract.

**(d) `.claude/skills/dispatch-propagate/scripts/test-dispatch-stop-hook.sh`** — new cases in the `=== dispatch-stop ===` block (starts `:20074`, ends before `:20351`). The fixture already exists: `stopnc_setup` at `:20106` installs a fake `park-node` that appends `"$*"` to `park-calls.log` and honors a `park-exit` override file; `stopnc_state` writes `state.json`; `stopnc_run` runs the hook with `CLAUDE_JOB_DIR` set and captures stderr to `$ROOT/hook-stderr.log`. Follow the existing argv-assertion style (see the `park-node <id> <reason>` and `+ recommendation` cases at ~`:20232–20256`). Add:
1. base marker present → argv is `--base <sha> <id> <reason>` (and with a recommendation, `--base <sha> <id> <reason> <reco>`).
2. base + pr markers both present → both flags precede the id.
3. base marker absent → argv unchanged from today (no `--base`).
4. base marker present but malformed (not 40-hex) → no `--base` in argv, and the hook still parks; assert the hook exits 0. (Choose and document one behavior here; do not let a malformed marker produce a `--base` that `park-node` would reject with exit 2.)
5. fake `park-node` exits 3 → hook exits 0, `office-hours-reason`, `office-hours-recommendation` and `office-hours-base` markers all survive, `park-node` called exactly once, and the hook's stderr contains `stale-diagnosis`. Make the fake write a `stale-diagnosis` line to stderr for this case so the "stderr is not swallowed" assertion is real.

**Out of scope**: any change to `packages/intentionsutil/scripts/park-node` itself (`--base` already works and is covered by `packages/intentionsutil/scripts/test-park-node.sh` cases 12–15); wiring `fix-checks`, `review-fix`, `qa-fix` or `dispatch-conflict` to write `office-hours-base` (they can adopt the seam later — note them as follow-up candidates in the skill/reference prose, do not edit them); anything in `graph-commit`.

**Reuse**: `park-node`'s existing `--base` bare-40-hex form (`park-node:173–179`) — pass the sha alone, not `<id>=<sha>`, and not a manifest; the `_OH_PR` marker-read pattern at `dispatch-stop.sh:71–77`; the `stopnc_*` harness helpers in `test-dispatch-stop-hook.sh`.

**Shell rules**: net-new lines in committed `.sh` files are linted by `.claude/skills/dispatch-propagate/scripts/lint-prose-rules.sh` (run from `run-lint.sh`) — never `echo "$JSON" | jq`; use `jq <<<"$VAR"`.

---

## Unit 3 — make the pinned invocation pass auto mode

**Recommended model**: `opus`

**Scope**

**Re-measure first.** The 2026-07-30 measurement (classifier denies `graph-commit --base …`, permits the same command without `--base`) may no longer hold. Re-run it before changing anything: issue `packages/intentionsutil/scripts/graph-commit --help`, then a `--base`-carrying invocation, and record whether the denial reproduces. If it does not reproduce, land only the documentation note (below) and skip the permission change — say so explicitly in the commit message rather than making a change with no observed cause.

**Greenfield design.** The graph-write primitives under `packages/intentionsutil/scripts/` are the repo's sanctioned graph write path, exactly as `.claude/skills/*/scripts/*` are its sanctioned workflow scripts. They should be auto-approved by the same PreToolUse hook, so approval never depends on an LLM's read of a flag — and in particular so the *safer* pinned form can never be harder to invoke than the unpinned one.

Implementation: in `.claude/hooks/approve-workflow-commands.sh`, beside `SCRIPT_RE` at `:26`, add a second explicit regex and test it in `is_allowed_cmd` (`:107–120`):

```bash
PKG_SCRIPT_RE='(^|/)packages/intentionsutil/scripts/(park-node|clear-park|hold-node|resolve-hold|resolve-park|mark-node-terminal|demote-node-to-implement|graph-commit)$'
```

Enumerate the primitives rather than globbing the directory, and comment why they are here (the pinned-form-denied-while-unpinned-permitted inversion). Confirm each named file exists before listing it — `clear-park`, `hold-node`, `resolve-hold`, `resolve-park`, `mark-node-terminal`, `demote-node-to-implement`, `graph-commit` and `park-node` all exist in `packages/intentionsutil/scripts/` as of this plan; drop any that do not at implementation time.

**Disclose the widening in the comment and in the PR body:** `is_allowed_cmd` inspects only the command token, never its arguments, so this approves these scripts with *any* flags — including `graph-commit --prune <id>`, which deletes nodes. That is unavoidable in this mechanism; a flag-sensitive allowlist is not something the hook expresses today, and inventing one for a single flag would be worse than the classifier.

If the author judges `graph-commit` too broad to auto-approve, land the list **without** `graph-commit`. `park-node` alone unblocks the pinned park form for the direct-invocation lanes, and Units 1–2 do not depend on this unit at all (the Stop hook is a hook subprocess, not a Bash tool call, so it is never permission-gated).

**Rejected alternative** (state it in the PR body, do not implement): adding `"Bash(packages/intentionsutil/scripts/park-node:*)"` entries to `.claude/settings.json` `permissions.allow`. It works — the hook's `ALLOWED_CMDS` builder at `:36–48` extracts single-word `Bash(<cmd>:*)` entries and `is_allowed_cmd` matches them by exact token — but it only matches when the invocation is written with that exact relative path (`is_allowed_cmd` compares `basename(token)` against the entry, which would be the full path here, and the raw token against the entry), so an absolute-path invocation from a worktree silently misses. `SCRIPT_RE`-style regexes already handle both forms.

**Also in scope**: a short note in `.claude/skills/ref-diagnosis-time-cas/SKILL.md` recording that the pinned form is (now) invocable under auto mode and what makes it so, so the next lane adopting `--base` does not re-discover the denial.

**Tests**: `.claude/hooks/test-approve-workflow-commands.sh` (427 lines, CI at `.github/workflows/unit-tests.yml:196`). Add `assert_approves` cases for a relative-path and an absolute-path `park-node --base <40-hex> <id> <reason>` invocation, and an `assert_passthrough` case for a *non*-listed path under the same directory (e.g. `packages/intentionsutil/scripts/read-sensors.ts`) proving the regex is an enumeration, not a directory glob.

**Out of scope**: changing `.claude/settings.json`; changing what the classifier itself does; any change to `graph-commit`'s own `--base` semantics.

**Reuse**: the existing `SCRIPT_RE` / `is_allowed_cmd` structure in `.claude/hooks/approve-workflow-commands.sh`; the `assert_approves` / `assert_passthrough` helpers at `.claude/hooks/test-approve-workflow-commands.sh:14–42`.

**Note on landing this unit**: edits to `.claude/hooks/**` are frequently denied at *commit* time under auto mode (the harness gates committing config, not editing it). If the commit is denied, stop and surface it — do not work around it.

---

## Verification

```verify
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && .claude/skills/dispatch-propagate/scripts/test-dispatch-derive-node-target.sh
.claude/skills/dispatch-propagate/scripts/test-dispatch-stop-hook.sh || exit 1
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && .claude/hooks/test-approve-workflow-commands.sh
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && packages/intentionsutil/scripts/test-park-node.sh
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && .claude/skills/dispatch-propagate/scripts/run-lint.sh
cd /home/n8/natb1/commons.systems/.claude/worktrees/strategy-graph-native-dispatch && node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts
```

`test-park-node.sh` must stay green unchanged — it is the regression net for `park-node`'s `--base` contract (its cases 12–15 cover a matching pin landing normally, a stale pin refusing with exit 3 and zero side effects, the manifest form, and the usage-error forms). If it goes red, the change touched `park-node` and it should not have.

Manual checks, outside the verify blocks:

1. **End-to-end shape, by hand.** In a scratch clone (or by reading the diff), confirm the exact argv the Stop hook builds is `park-node --base <40-hex> [--pr <n>] <node-id> <reason> [<reco>]` with every flag before the node id. `park-node`'s parser stops flag scanning at the first non-flag argument (`park-node:89–134`), so a flag placed after the id is silently swallowed into `<reason>` — a bug the unit tests should catch, but eyeball the built array too.
2. **Sha comparability.** Confirm by hand on a live node that the front door's `BASE:` value equals `git rev-parse origin/main:intentions/<id>.md`, which is what `park-node` computes as `FRESH_BLOB` (`park-node:192`) and compares the pin against (`:205`). If those two ever diverge, every park refuses with a false `stale-diagnosis` and the cannot-verify exit becomes unusable.
3. **Auto-mode re-measurement (Unit 3).** Record, in the PR body, whether the `--base` denial reproduced before the hook change, and confirm after the change that a `park-node --base …` Bash call is auto-approved by the PreToolUse hook (no classifier prompt).
4. **Observe in production.** The next `/qa-main` cannot-verify park on the node lane should either land with the pin and produce the same `office_hours` record as before, or refuse with `stale-diagnosis` in the Stop-hook stderr and leave the node untouched. Watch for false refusals: if a routine mid-verification write (for example a reconciler touching `execution`) makes exit-3 the common case rather than the rare one, the pin is too tight at whole-file granularity and needs a follow-up tactic — do not respond by removing the pin.
5. **No new park-node behavior.** Confirm `git diff` touches no file under `packages/intentionsutil/scripts/` except (for Unit 3) nothing at all — Unit 3 changes `.claude/hooks/`, not the primitives.
