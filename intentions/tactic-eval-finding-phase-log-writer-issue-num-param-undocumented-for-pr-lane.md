---
id: tactic-eval-finding-phase-log-writer-issue-num-param-undocumented-for-pr-lane
kind: tactic
statement: "dispatch-write-phase-log's positional argument is a GitHub
  comment-thread number — the dispatch issue number on the issue lane, the PR
  number (execution.pr) on the graph-native node lane — but its usage line, its
  header prose and both of its error strings name it <issue-num>, so a node-lane
  worker reads the script body to rediscover that a PR number is legitimate
  (measured: 3 attempts, about 70 seconds, paid on every node-lane
  implement/qa/review phase-log write); rename the placeholder lane-neutrally,
  state in the header why GitHub's issues API addresses pull requests by the
  same number, and add the missing-argument and lane-neutral-wording test cases
  the suite lacks — comment and message text only, no behaviour change and no
  callsite change"
owner: ai
status: codified
parent: null
rationale: 'Auto-created by dispatch-eval-finding as an evaluation finding
  ledger entry. Similar findings MERGE into this node — a recurrence updates
  attributes.measured_impact, never mints a second node; the node carries
  attributes.measured_impact and is therefore never pruned. Finalized to phase
  implement by the 2026-08-19 /align-tactics per-node round, which re-verified
  the defect live against origin/main 649a7cce and judged the observation to be
  work: the fix is a comment-and-message edit with no behaviour change. Its
  scope is deliberately narrower than the defect family — see the two
  clarifications of that date for the boundary against
  tactic-outcome-envelope-node-lane-parity and for why this node was minted
  alongside that prior node of record rather than merged into it. The body
  carries the finding under "## Observed" and the clean-session plan from "##
  Context" onward.'
reading: null
serves:
  - strategy-recursive-self-improvement
recovers: []
clarifications:
  - question: How does this node's scope relate to
      tactic-outcome-envelope-node-lane-parity, the author-designated node of
      record for the node-lane numeric-argument family?
    answer: "(Recorded 2026-08-19 /align-tactics per-node round; verified against
      origin/main this date.) Scope boundary against
      tactic-outcome-envelope-node-lane-parity. That node's rationale records a
      2026-07-29 author ruling making it \"the node of record for the whole
      numeric-arg family rather than just the emit-outcome instance\", with
      dispatch-write-phase-log folded in \"as an added unit\". The two scopes
      are DISJOINT and this node is not a re-mint of that one: the parity node
      fixes CALLERS — .claude/skills/qa-fix/SKILL.md:475,
      .claude/skills/qa-fix/references/pr-comment-summary.md:121,
      .claude/skills/review-fix/references/terminal-actions.md:128 and :140, and
      .claude/skills/implement/SKILL.md:435 and :448 all pass \"$N\", which on
      the node lane is the non-numeric node id (qa-fix/SKILL.md:106 and
      review-fix/SKILL.md:105 both bind N=\"$NODE_ID\") — whereas this node
      fixes the SCRIPT'S OWN usage line, header comment and two error strings at
      .claude/skills/dispatch-propagate/scripts/dispatch-write-phase-log:1-40.
      Residual gap owned at record time: the parity node's phase-log unit was
      never delivered. PR #3030 (commit e05c1e78, merged 2026-08-04) changed
      only dispatch-emit-outcome and its callers; it touched no phase-log call
      site, and all six still pass \"$N\" today. That node is now phase main-qa
      carrying an office_hours park, so it can absorb no further unit and no
      open node owns the caller half. This node therefore stays doc-only exactly
      as its body records (\"a comment-and-message edit, no behaviour change\");
      the caller half is named here rather than silently widened into this
      node's plan."
  - question: Why does this node stand alongside a prior node of record rather than
      merging into it, given condition 20 and the layered-dedup clarification?
    answer: (Recorded 2026-08-19 /align-tactics per-node round.) Why this node
      stands alongside a prior node of record, judged against condition 20's
      single-find-or-recur-surface rule and the layered-dedup clarification of
      2026-08-14. It was auto-minted by dispatch-eval-finding, whose --list
      search is scoped to the tactic-eval-finding-* namespace, so the
      whole-graph half of the layered key never ran and
      tactic-outcome-envelope-node-lane-parity — which serves
      strategy-token-economy and sits outside that namespace — was structurally
      invisible at mint time. That is the exact blindness
      tactic-eval-finding-eval-finding-list-misses-nonledger recorded and
      tactic-finding-search-all-producers is drafted to close. The mint is
      judged correct on its merits regardless, because the fix surfaces are
      disjoint (see the boundary clarification of this same date), so this is
      recorded as a near-miss of the dedup mechanism rather than as a duplicate
      to merge.
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: true
rounds: null
attributes:
  ledger_entry: true
  first_seen: 2026-08-14
  measured_impact:
    - metric: phase_log_write_attempts
      value: 3
      unit: attempts
      window: review phase of tactic-attention-namespaced-rank,
        2026-08-13T22:44:24Z-23:01:54Z
      sensor: rsi
      measured: 2026-08-14
    - metric: phase_log_rework_wall_clock_s
      value: 70
      unit: seconds
      window: review phase of tactic-attention-namespaced-rank,
        2026-08-13T22:44:24Z-23:01:54Z
      sensor: rsi
      measured: 2026-08-14
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-14
---

## Observed

`tactic-attention-namespaced-rank`, phase `review`, 2026-08-13, worker session
`6b9f36ea-b44f-4076-b9ee-3da2ff0a62a6`.

Writing the phase-log entry took **70 seconds and three attempts**, 22:58:59Z →
23:00:09Z:

1. 22:59:36 — `Write` the entry body to
   `tmp/phase-log-entry-tactic-attention-namespaced-rank.md`.
2. 22:59:45 — "Inspect dispatch-write-phase-log script behavior".
3. 22:59:56 — "Write phase-log entry as attempt 2 to avoid clobbering attempt 1".
4. 23:00:02 — "Check remainder of script to see how N is used (issue vs PR)".
5. 23:00:07 — "Write phase-log entry using PR number as the issues-API target".

Step 4 is the tell. `dispatch-write-phase-log`'s header documents its positional
argument as an **issue** number, and it validates `^[1-9][0-9]*$` with the error
text `"an issue-num argument is required"`. A **node-lane** node has no issue —
this one carried `execution.pr: 3075` and nothing else. The correct value is the
PR number, which works only because GitHub's issues API addresses pull requests
too. Nothing in the script, its usage line, or its error message says so, so
every node-lane worker rediscovers it by reading the script body.

No residue was left: the worker's own step 3 shows it found a pre-existing
`phase-log:review:1` section (from the earlier review pass that halted at
21:51:58Z) and correctly wrote `attempt 2`. PR #3075's phase-log comment holds
`qa:0`, `qa:1`, `review:1`, `review:2` — all legitimate.

The cost is purely the discovery, and it is paid on every node-lane phase that
writes a phase log — implement, qa and review alike.

Evidence: worker transcript `6b9f36ea-b44f-4076-b9ee-3da2ff0a62a6.jsonl`,
tool_use entries 22:59:36.448Z through 23:00:07.453Z.

## Context

The defect is **live**, re-verified 2026-08-19 against `origin/main` 649a7cce by
reading the files. It is a naming-and-message defect, not a behavior defect: the
script works correctly when handed a PR number, and nothing in its own text tells
a caller that. The `<issue-num>` name is load-bearing in the wrong direction — it
reads as a *constraint the caller must satisfy*, so a careful worker stops and
reads 159 lines of shell rather than passing the only number it has.

**Intended outcome:** a node-lane worker reading the usage line, the header, or
the error message learns in one read that a PR number is a legitimate value and
why, so the ~70s / 3-attempt rediscovery cost stops being paid on every node-lane
phase-log write. No behavior changes; no caller changes.

### Greenfield design

The positional argument is not an issue number and never was — it is a **GitHub
comment-thread number**. The issues REST API serves the comment thread of both
issues and pull requests at the same path, so one integer addresses both lanes.
The ideal name is therefore lane-neutral (`<issue-or-pr-num>`), with the *reason*
stated once in the header so no reader has to derive it from the endpoint string
at line 111.

There is no migration path to author: the change is comment and stderr text with
no positional-argument semantics change, no new flag, no callsite change, and no
behavioral coupling other than the existing suite's `"positive integer"`
substring assertions, which the reworded message preserves verbatim.

The *family-level* greenfield — a lane-neutral dual `--issue` / `--node-id`
contract as `dispatch-emit-outcome` already carries
(`.claude/skills/dispatch-propagate/scripts/dispatch-emit-outcome:26-31`) — is
deliberately **not** this node's design. See "Out of scope (defect A)".

### Out of scope (defect A) — read before widening

Two distinct defects touch this script and must not be conflated:

- **(A) the CALLSITE defect** — four skill callsites pass `"$N"`, which on the
  node lane is bound to the non-numeric node id (`.claude/skills/qa-fix/SKILL.md:106`
  binds `N="$NODE_ID"`), so the numeric guard rejects it outright with exit 2.
  `tactic-outcome-envelope-node-lane-parity` (serves `strategy-token-economy`,
  `phase: main-qa`, `status: codified`) is the author-designated node of record
  for the "node-lane script hard-requires a numeric arg" family and its rationale
  explicitly folds `dispatch-write-phase-log` in. **Do not fix (A) here.**
- **(B) the DOCUMENTATION defect this node measured** — a caller that already
  passes a correct number still cannot tell from the usage line, header prose, or
  error text that a PR number is legitimate, so it stops and reads the script.
  Measured cost: 3 attempts / ~70s of pure discovery, not a failure.

This plan implements **(B) only**. Explicitly untouched: `dispatch-emit-outcome`,
`.claude/docs/outcome-envelope.md`, `aggregate-usage.sh` (all in flight under the
parity node at main-qa — an overlapping edit will conflict), and all four
callsites listed under "Reuse" below.

**Do not sweep the family.** Nineteen other scripts under
`.claude/skills/dispatch-propagate/scripts/` also say `issue-num`
(`dispatch-write-plan`, `dispatch-read-plan`, `dispatch-find-pr`,
`dispatch-sweep`, `dispatch-plan-finalize`, `lib.sh`, …). Only
`dispatch-write-phase-log` was measured; an unmeasured 20-file rename is scope
this node did not earn.

---

## Unit 1 — rename the positional argument lane-neutrally and state why a PR number works

**Recommended model:** sonnet

**Scope.** Exactly two files change.

**File 1 — `.claude/skills/dispatch-propagate/scripts/dispatch-write-phase-log`**
(159 lines at verification time; locate each site by its string, not by line
number, since the file may have shifted):

1. **Line 5**, the header usage line. Replace the placeholder:
   `# Usage: dispatch-write-phase-log <issue-num> --phase <p> [--attempt <n>] [--reentry <true|false>]`
   → `<issue-or-pr-num>` in place of `<issue-num>`.
2. **Immediately after the usage block (after line 6, `#        (free-text entry
   body on STDIN)`)**, insert a CLI-contract paragraph. Model its register on
   `dispatch-qa-fix-attempt:20-24` and `.claude/docs/outcome-envelope.md:46-47`
   (see Reuse). Required content, in the script's `#`-comment style:
   - the argument is a GitHub **comment-thread number**: the dispatch issue
     number on the issue lane, or the PR number (`execution.pr`) on the
     graph-native node lane;
   - a node-lane node has **no issue**, and the PR number is a legitimate value
     here because GitHub's REST issues API addresses pull requests by the same
     number — a PR *is* an issue that carries an extra `pull_request` field — so
     `repos/{owner}/{repo}/issues/<n>/comments` reaches a PR's own comment
     thread. This is verified, not asserted: the script hits that endpoint at
     line 111 (POST) and through `dispatch_marker_comment_id` at
     `.claude/skills/dispatch-propagate/scripts/lib.sh:316`
     (`gh_retry gh api --paginate "repos/{owner}/{repo}/issues/$n/comments"`).
   - the **node id itself is not accepted** — the value must be a positive
     integer.
3. **Line 27**, header prose inside the sentence spanning lines 26–28
   (`# so gh addresses the right repository from any caller cwd. A missing/non-numeric`
   / `# issue-num, a malformed --phase, …` / `# clear error, not a fallback (exit 2).`):
   replace the `issue-num` token with the literal text issue-or-pr-num. Do not reflow the other
   two lines beyond what the token swap requires.
4. **Line 34**, the required-arg error (guard block is lines 32–36):
   `an issue-num argument is required` → `an issue-or-PR number argument is required`.
5. **Lines 35 and 60**, the two `usage:` stderr strings: `<issue-num>` →
   `<issue-or-pr-num>`. (Line 60 sits in the unknown-argument branch of the
   option loop.)
6. **Line 39**, the numeric-validation error under the regex at line 38
   (`if [[ ! "$N" =~ ^[1-9][0-9]*$ ]]; then`):
   `issue-num must be a positive integer, got: $N` →
   `issue-or-pr-num must be a positive integer, got: $N`.
   **The substring `positive integer` MUST survive verbatim** — three existing
   test cases assert on it (see File 2).

No other line changes. Specifically: no change to the regex, the guard
conditions, the option loop, the `--reentry` short-circuit, the `gh` calls, or
the awk state machine. After the edit the token `issue-num` must not appear
anywhere in this file.

**File 2 — `.claude/skills/dispatch-propagate/scripts/test-write-phase-log.sh`**
(the suite is CI-wired at `.github/workflows/unit-tests.yml:317`, so new
assertions are enforced):

7. The three existing guard cases at lines 389–428 (`issue-num` `0`, `00`,
   `abc`) assert **only** `assert_contains ... "positive integer"`, never the
   token `issue-num` — so they pass unchanged given step 6. Update only their
   `# ===` banner comments and `echo` labels to read issue-or-pr-num for
   consistency; do not change their assertions.
8. **Add a missing-argument case** — none exists today, so the new
   required-arg wording would otherwise be unprotected. Insert it after the
   `issue-num abc` block (currently ending at line 428) and **before** the
   `AC3: valid invocation` block (currently starting line 430) — that region
   already runs with the clean PATH restored (`export PATH="$ORIG_SUITE_PATH"`
   at ~line 355) and before AC3 installs its own `trap cleanup EXIT`. Shape it
   on the adjacent cases:
   ```bash
   set +e
   NOARG_STDERR=$("$SUT" </dev/null 2>&1)
   NOARG_RC=$?
   set -e
   assert_eq "no positional arg: exit code is 2" "2" "$NOARG_RC"
   assert_contains "no positional arg: stderr names an issue-or-PR number" \
     "issue-or-PR number argument is required" "$NOARG_STDERR"
   assert_contains "no positional arg: usage line is lane-neutral" \
     "<issue-or-pr-num>" "$NOARG_STDERR"
   ```
   Use `</dev/null` rather than piping a body in — the guard fires before STDIN
   is read, and `</dev/null` avoids any SIGPIPE ambiguity in the exit status.
9. **Protect the reworded numeric error**: immediately after the existing
   `issue-num abc` assertions, add one line reusing the already-captured
   `$NN_STDERR`:
   ```bash
   assert_contains "issue-or-pr-num abc: stderr uses the lane-neutral param name" \
     "issue-or-pr-num" "$NN_STDERR"
   ```
10. Extend the file's own header comment block (lines 11–15, the `#2132`
    coverage list) with one line naming the new missing-argument and
    lane-neutral-wording cases.

**Out of scope for this unit** (restating, because the temptation is right
there): the four callsites — `.claude/skills/implement/SKILL.md:434-436` and
`:448-450`, `.claude/skills/qa-fix/SKILL.md:475-477`,
`.claude/skills/qa-fix/references/pr-comment-summary.md:121`,
`.claude/skills/review-fix/references/terminal-actions.md:127-129` and
`:140-142`; `.claude/skills/dispatch-propagate/scripts/test-phase-log-reentry.sh`
(asserts nothing on these strings, needs no edit); every other
`dispatch-*` script; `.claude/settings.json` (it mentions the script only in a
permission entry keyed on the path, which does not change).

## Reuse

- `.claude/skills/dispatch-propagate/scripts/dispatch-qa-fix-attempt:20-24` —
  the exact precedent for the wording this unit wants, in this same script
  family: a `# CLI contract:` block followed by
  `"<pr_num> is the PR number directly (NOT an issue number). The caller
  resolves the PR before invoking this script."` Model the new header paragraph
  on this shape rather than inventing one.
- `.claude/skills/dispatch-propagate/scripts/dispatch-emit-outcome:26-31` — the
  established lane-neutral doc idiom in the same family (`--issue` is the legacy
  gh-issue lane, a positive integer; `--node-id` is the graph-native lane's
  target). Reuse the sentence shape; do **not** edit this file.
- `.claude/docs/outcome-envelope.md:46-47` — canonical project phrasing for the
  lane split: "the dispatch issue number on the issue lane, or `null` on the
  node lane" / "the intention-graph node id on the node lane, or `null` on the
  issue lane". Reuse this register; do **not** edit this file.
- `.claude/skills/dispatch-propagate/scripts/lib.sh:294-326`
  (`dispatch_marker_comment_id`, endpoint at line 316) — the helper through
  which this script reaches `repos/{owner}/{repo}/issues/$n/comments`. Read it
  to confirm the endpoint before asserting it in the new comment; do not edit.
- `.claude/skills/dispatch-propagate/scripts/lib.sh:1251-1295`
  (`gh_issue_set_labels_rest`, called by `dispatch-complete-phase` whose own
  usage says `<pr-num>`) — independent confirmation that the issues endpoint
  accepting a PR number is already load-bearing elsewhere in this family, so
  documenting it here is consistent, not novel.
- `.claude/skills/dispatch-propagate/scripts/test-helpers.sh:41-53`
  (`assert_contains`, a bash glob match — no `grep`/SIGPIPE hazard) and
  `assert_eq` — reuse for the new cases; the suite already sources
  `test-helpers.sh` at line 19 and calls `report_results` at the end.

## Verification

Run the affected suite (it is the CI job at `.github/workflows/unit-tests.yml:317`):

```verify
.claude/skills/dispatch-propagate/scripts/test-write-phase-log.sh
```

Run the adjacent phase-log suite to prove no collateral damage:

```verify
.claude/skills/dispatch-propagate/scripts/test-phase-log-reentry.sh
```

Assert the old token is fully gone from the target script. This check is
non-vacuous today — `grep -q issue-num` on that file currently **succeeds** at
six sites, so this block fails before the change and passes after:

```verify
if grep -q 'issue-num' .claude/skills/dispatch-propagate/scripts/dispatch-write-phase-log; then
  echo "FAIL: the token issue-num still appears in dispatch-write-phase-log"
  grep -n 'issue-num' .claude/skills/dispatch-propagate/scripts/dispatch-write-phase-log
  exit 1
fi
echo "OK: no issue-num token remains in dispatch-write-phase-log"
```

Assert the new lane-neutral wording and the preserved `positive integer`
substring are both present:

```verify
grep -q '<issue-or-pr-num>' .claude/skills/dispatch-propagate/scripts/dispatch-write-phase-log || { echo "FAIL: lane-neutral usage placeholder missing"; exit 1; }
grep -q 'an issue-or-PR number argument is required' .claude/skills/dispatch-propagate/scripts/dispatch-write-phase-log || { echo "FAIL: reworded required-arg message missing"; exit 1; }
grep -q 'positive integer' .claude/skills/dispatch-propagate/scripts/dispatch-write-phase-log || { echo "FAIL: 'positive integer' substring lost — three existing test cases assert on it"; exit 1; }
echo "OK: lane-neutral wording present, positive-integer assertion substring preserved"
```

Assert the family and the in-flight parity-node files were not touched — the
diff must contain exactly the two files this plan names:

```verify
git diff --name-only origin/main -- .claude/ | sort
```

Expect exactly:
`.claude/skills/dispatch-propagate/scripts/dispatch-write-phase-log` and
`.claude/skills/dispatch-propagate/scripts/test-write-phase-log.sh`. Any
appearance of `dispatch-emit-outcome`, `.claude/docs/outcome-envelope.md`,
`aggregate-usage.sh`, or a skill `SKILL.md` means defect (A) leaked in and must
be reverted before the PR opens.

**Manual / judgment checks** (not auto-runnable):

- Read the reworded header cold, as a node-lane worker would. The pass bar is
  the measured defect's inverse: can a reader who has only the header — not the
  body, not `lib.sh` — answer "may I pass my PR number?" with yes, and say why?
  If the answer still requires scrolling to the `gh api` call at line 111, the
  wording has not fixed the measured problem.
- Confirm the reason clause is accurate before shipping it: the claim is that
  GitHub's REST **issues** API addresses pull requests by the same number. Verify
  against `lib.sh:316` and script line 111 rather than restating it from this
  plan.
- Observe in production: the next node-lane phase-log write (any of implement /
  qa / review) should complete in one attempt with no "inspect script behavior"
  tool call. That is the recurrence signal for this finding — if a worker still
  reads the script body to resolve issue-vs-PR, the wording did not land and the
  finding recurs rather than closes.
