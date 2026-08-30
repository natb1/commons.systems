---
id: tactic-dispatch-code-review-reject-pattern-self-match
kind: tactic
statement: dispatch-code-review's rejection-signature check greps the whole
  captured review output for literal reject strings, so a successful review that
  quotes one of them hard-stops the pass at exit 3
owner: ai
status: codified
parent: null
rationale: "Surfaced by the /review-fix pass on PR #3007
  (tactic-review-code-review-invocation-contract) as prescanned finding review-3
  and classified Deferred rather than auto-fixed. Finalized 2026-08-19 by a
  per-node /align-tactics round that re-measured the premise against
  origin/main: the defect is live, but two of the draft's assumptions were
  corrected in the process. (1) Line-anchoring the patterns does not close the
  hazard — pattern 1 is ALREADY anchored ('^Unknown command: ') and still
  self-matches the fenced example reproduced at code-review-invocation.md:454,
  while pattern 2's measured literal legitimately matches mid-line and so cannot
  be anchored at all. (2) No fresh measurement campaign against the built-in's
  output shape is needed: code-review-invocation.md §8 already records the
  rejection contract verbatim (exit 0, a single-line notice with nothing else),
  and §1.3 records that a real review's shape is not stable across runs, which
  is precisely why a shape-recognition heuristic is the wrong fix. What ships
  instead is a two-factor test — signature match AND notice-shaped output —
  extending the substring-plus-structural-condition idiom already in
  dispatch-detect-transient-death. The greenfield target (read a typed
  unavailability field and delete the grep) is recorded but unshippable while
  the CLI signals rejection only as prose at exit 0."
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

# dispatch-code-review's rejection-signature check greps the whole captured review output for literal reject strings, so a successful review that quotes one of them hard-stops the pass at exit 3

## Context

`dispatch-code-review` invokes the built-in `/code-review` as a nested
`claude -p` session and captures combined stdout+stderr into an output file.
Because an unavailable or unknown slash command **exits 0** (measured — see
`.claude/skills/review-fix/references/code-review-invocation.md` §8, lines
441-479), exit status alone cannot detect a rejection. Step 5 of the script
therefore greps the captured text for three rejection signatures and exits 3
when one matches. That guard is load-bearing and must not be removed.

The defect is its **scope**. The grep is `grep -qE "$pattern" "$OUTPUT_FILE"` —
line-based, but unanchored to any structural notice region — so a *successful*
review whose free-form findings prose quotes or excerpts one of those literal
strings matches it and spuriously hard-stops the `/review-fix` pass at exit 3,
claiming the instrument is unavailable when it in fact ran and produced a real
review. This is not hypothetical: the reject strings are live in-repo text that
`/code-review` will read and can quote back, including in **this script's own
explanatory comment three lines above the array that lists them**.

Surfaced by the `/review-fix` pass on PR #3007
(`tactic-review-code-review-invocation-contract`) as prescanned finding
`review-3`, classified `Deferred` by the review Workflow's classify stage rather
than auto-fixed, because scoping the match correctly needed to be reasoned
against the built-in's actual — and explicitly not-stable-across-runs (§1.3) —
output shape before landing.

### Verified state as of 2026-08-19 (re-measured on a worktree cut from origin/main)

The historical body of this node carried a stale `:190-193` anchor. Current,
verified anchors and facts:

- `.claude/skills/dispatch-propagate/scripts/dispatch-code-review` is **1411
  lines**. Locate by symbol, not by the old line numbers.
  - `# --- Step 5: verify at the source ---` header + doctrine comment: **:1295-1298**
    ("exit status alone is never sufficient … a rejection is detectable only by
    grepping the captured text"). This invariant must be preserved by any fix.
  - `OUTPUT_CONTENT` / `OUTPUT_STRIPPED`: **:1299-1300**. `OUTPUT_CONTENT` is the
    whole blob but is used **only** for echoing to stderr; the grep reads
    `$OUTPUT_FILE` directly.
  - Explanatory comment block for the patterns: **:1302-1312**.
  - `REJECT_PATTERNS=( … )`: **:1313-1317**.
  - Non-zero-exit branch **:1319-1323**, empty-output branch (exit 2)
    **:1325-1328**, the reject loop `for pattern in "${REJECT_PATTERNS[@]}"` →
    `grep -qE "$pattern" "$OUTPUT_FILE"` → exit 3: **:1330-1336**.
  - The script runs under `set -euo pipefail` (**:222**).
- **A partial fix already shipped** — pattern 1 is line-anchored as
  `'^Unknown command: '`. Patterns 2 and 3 remain unanchored substrings:
  `'cannot be used with Skill tool due to disable-model-invocation'` and
  `'use /review for a local review instead'`.
- **Line-anchoring alone does not close the hazard, for any of the three.**
  Verified today:
  - Pattern 1 is *still* self-matchable: `code-review-invocation.md:454` holds
    `Unknown command: /code-review-nope` at line start inside a fenced block. A
    review that reproduces that fence in its findings fires pattern 1.
  - Pattern 2 **cannot** be line-anchored without breaking the measured shape:
    the recorded literal is `Skill code-review cannot be used with Skill tool due
    to disable-model-invocation` — the pattern legitimately matches mid-line, and
    the existing regression test at `test-dispatch-code-review.sh:190-192` stubs
    exactly that shape and asserts exit 3.
  - Live in-repo strings that would self-match pattern 2 if quoted (measured
    today): `review-fix-instrument-probe.mjs:88`,
    `test-dispatch-code-review.sh:192`,
    `test-dispatch-verify-instrument-invocation.sh:94`,
    `code-review-invocation.md:466`, `review-fix/SKILL.md` (the
    `disable-model-invocation` discussion in §1b), and
    **`dispatch-code-review:1308` — the script's own comment**.
- **Re-measurement of the CLI is NOT needed and must not be planned.** §8 already
  records it: `claude -p '/code-review-nope max'` exits **0** in ~1s and emits
  exactly `Unknown command: /code-review-nope` as a single line with a trailing
  newline only (verified with `cat -A`). Pattern 2 is **not reproducible via this
  entry point** and is retained deliberately as a regression guard, exercised
  with a stub. Pattern 3 was **never observed at runtime**; it is kept only on the
  strength of being a literal in the 2.1.220 binary. §1.3 separately records that
  the built-in's output shape is not stable across runs. Reason from §8; do not
  open a fresh measurement campaign.

### Design: greenfield target, and what ships now

**Ideal greenfield.** Never grep free-form model-generated prose for a control
signal at all. Extract the verdict from a typed field the producer emits — the
in-repo precedent is `dispatch-terminal-gap-audit:349-361`, whose `digest()`
allowlist extracts only explicitly named typed fields and never raw prose. If the
CLI ever emits a typed unavailability signal (a non-zero exit, or an
`is_error`/`subtype` field), Step 5 should read *that* and delete the grep
entirely.

**Why that greenfield cannot ship today.** Measured: the rejection exits **0**
and the notice is delivered as ordinary output text. `--output-format json` was
considered and rejected: no script under `dispatch-propagate/scripts` passes
`--output-format` anywhere (so it is new capability, not reuse), the detached
launch / resume / `output.txt` artifact machinery at **:1035-1075** would all
have to change shape, and — decisively — the rejection text would land in the
JSON `result` string just the same, so it adds no discrimination between a
genuine notice and a quoted one. It buys nothing this defect needs.

**What ships (the brownfield step toward it).** Keep the grep, add the missing
structural factor, using the established in-repo idiom for exactly this problem
shape — `dispatch-detect-transient-death:36-66`, which never trusts a substring
alone but requires the substring **AND** a structural condition together. Here the
structural condition available today is **notice shape**: a genuine rejection *is*
the entire output (measured: one line, nothing else), whereas a review that merely
quotes the string surrounds it with a full findings body. So the reject test
becomes two-factor: *pattern matches* **AND** *the output is notice-shaped*
(non-blank line count at or below a small cap).

Residual, accepted and documented rather than hidden: a review that emits a very
short output *and* quotes a signature would still false-positive. The
non-text-based backstop for the substitution failure mode this guard was
originally built for is the transcript-based instrument verifier
(`dispatch-verify-instrument-invocation`, driven from `.claude/workflows/review-fix.js:1717-1745`),
which counts real `invocations`/`succeeded`/`rejections` from the session
transcript instead of reading prose. Whether that verifier covers the Step-1b
nested pre-stage session is a **separate** question owned by
`tactic-lane-instrument-substitution-guard` (phase `main-qa`) and is explicitly
out of scope here.

Also rejected: heuristics that try to recognize a *quotation* (backticks, fenced
blocks, list markers, indentation). They are brittle against free-form model prose
whose shape §1.3 records as unstable, and they would silently weaken the guard in
a way no test can pin.

### Constraints carried forward

- **Scope is agent-behavior config.** Every edit lands under `.claude/skills/**`,
  so strategy clarification 41's self-modification flow binds — an auto-mode
  worker cannot commit this.
- **Near-miss files to NOT touch.** `tactic-lane-instrument-substitution-guard`
  (phase `main-qa`) owns transcript-based instrument verification — a different
  mechanism; leave it alone.
  `tactic-review-code-review-invocation-contract-main-qa-regression` (phase
  `implement`) is open on the same file family.
  `tactic-dispatch-code-review-concurrent-write-attribution` is a sibling draft on
  this same script (concurrent-write locking, a different concern) — coordinate so
  edits to the shared script do not collide.

---

## Unit 1 — Make the reject-signature test two-factor: pattern match AND notice-shaped output

**Scope**

Edit exactly one code file plus one reference doc. No other file changes.

`.claude/skills/dispatch-propagate/scripts/dispatch-code-review`:

1. Between the `OUTPUT_STRIPPED` assignment (**:1300**) and the `REJECT_PATTERNS`
   comment block (**:1302**), add the notice-shape bound and its measurement:

   ```bash
   # A genuine rejection IS the whole output, not a phrase inside one. Measured:
   # `Unknown command: /code-review-nope` is a single line with a trailing
   # newline and nothing else (references/code-review-invocation.md §8). A
   # SUCCESSFUL review that merely QUOTES one of these signatures — reviewing
   # this very file, its fixture data, or the reference doc that records them —
   # wraps it in a full findings body. Bulk is therefore the discriminator, and
   # it is the second factor every signature match must clear: substring alone
   # is never sufficient (same idiom as dispatch-detect-transient-death:36-66).
   REJECT_NOTICE_MAX_LINES="${DISPATCH_CODE_REVIEW_REJECT_NOTICE_MAX_LINES:-3}"
   OUTPUT_NONBLANK_LINES="$(grep -c '[^[:space:]]' "$OUTPUT_FILE" 2>/dev/null || true)"
   OUTPUT_NONBLANK_LINES="${OUTPUT_NONBLANK_LINES:-0}"
   ```

   `|| true` is mandatory, not defensive noise: the script runs under
   `set -euo pipefail` (**:222**) and `grep -c` exits 1 on zero matches.

2. Keep the `REJECT_PATTERNS` array (**:1313-1317**) byte-identical — all three
   patterns stay, `'^Unknown command: '` keeps its anchor. Extend the comment
   block at **:1302-1312** with a fourth bullet recording that anchoring alone is
   insufficient (pattern 1 is reproduced at line start inside a fenced block at
   `code-review-invocation.md:454`; pattern 2 legitimately matches mid-line and
   so cannot be anchored at all) and that the notice-shape bound is what closes
   the gap.

3. Rewrite the loop at **:1330-1336** so a match hard-stops only inside a
   notice-shaped output, and a match in a bulky output is reported and continued
   rather than silently dropped:

   ```bash
   for pattern in "${REJECT_PATTERNS[@]}"; do
     grep -qE "$pattern" "$OUTPUT_FILE" || continue
     if (( OUTPUT_NONBLANK_LINES <= REJECT_NOTICE_MAX_LINES )); then
       echo "$PROG: output matches rejection/unavailability signature: $pattern" >&2
       echo "$OUTPUT_CONTENT" >&2
       exit 3
     fi
     # Matched inside a $OUTPUT_NONBLANK_LINES-line body: the review ran and
     # produced findings that QUOTE the signature. Never hard-stop on that — but
     # never swallow it either, so a genuine future rejection arriving in a new,
     # bulkier shape stays visible in the run's stderr instead of vanishing.
     echo "$PROG: rejection signature '$pattern' appears inside a ${OUTPUT_NONBLANK_LINES}-line review body (bound ${REJECT_NOTICE_MAX_LINES}) — treated as quoted text, not a rejection" >&2
   done
   ```

`.claude/skills/review-fix/references/code-review-invocation.md`: append a short
paragraph to §8 (after the corrected pattern list, around **:472**) recording the
scoping rule and its measured basis — that these signatures are matched only
within a notice-shaped output because the strings are live in-repo text a review
can quote, that anchoring alone does not close it, and the env override name.
Change no other section; §8's measured facts stay verbatim.

**Explicitly out of scope**: removing or adding reject patterns; changing exit
codes 1/2/3 or their meanings; `--output-format`; anything in the detached
launch / resume / cache machinery (**:459-499**, **:1035-1075**); the transcript
verifier; the sibling concurrent-write concern.

**Recommended model**: opus — the edit is small but sits inside a
safety-critical, heavily-commented guard under `set -euo pipefail`, where a
subtly wrong shell expression silently disables the guard rather than failing
loudly, and the comment prose has to carry the reasoning correctly for the next
reader.

## Unit 2 — Regression tests pinning both directions

**Scope**

Edit only
`.claude/skills/dispatch-propagate/scripts/test-dispatch-code-review.sh`.
Append new cases immediately **before** the `teardown` call at **:1394**
(`report_results` is at **:1396**), numbered after the current highest case
(Test 32, header at **:1346**). Add a comment on each new case cross-referencing
Tests 5 and 6 at **:188-217**.

Reuse the existing harness verbatim — no new stub machinery:
`write_fake_code_review_claude()` (**:52-92**, the nested `claude -p` stub, driven
through the `DISPATCH_CODE_REVIEW_CLAUDE_CMD` env override), `cr_reset_stubs()`
(**:93-98**), `$STUB_DIR/cr-fake-output` as the only thing that changes per case,
and `assert_eq` from `dispatch-test-fixture.sh:51`. Follow the exact invocation
shape of Test 5 (**:190-202**): `cr_reset_stubs`, write the stub output, then
`cd "$CR_REPO" && DISPATCH_CODE_REVIEW_CLAUDE_CMD=… "$SCRIPT_DIR/dispatch-code-review" --target HEAD~1..HEAD --out-dir "$OUT_DIR_<n>" 2>"$TMPDIR_TEST/cr-<n>.err"`.
**Each new case needs its own distinct `--out-dir`** — the resume cache is keyed
on a hash of `OUT_DIR` (**:476-484**), so reusing a prior case's out-dir would
serve a cached summary instead of running the stub.

Cases to add:

1. **Self-match false positive, pattern 2.** Stub a multi-line successful review
   body (well above the 3-line bound) whose prose quotes the
   `disable-model-invocation` literal as reviewed code — e.g. a findings header
   line, a `path:line` finding line quoting
   `test-dispatch-code-review.sh:192` with the literal inline, and a couple of
   trailing prose lines. Assert `exit 0` (**not** 3), and assert the run's
   `output.txt` still holds the findings body (mirroring Test 1's
   `output.txt holds the findings text` assertion at **:130**). Also assert the
   stderr file contains the `treated as quoted text` diagnostic, so the
   continue-with-warning path is pinned, not merely the exit code.
2. **Self-match false positive, pattern 1.** Same shape, with a body that
   reproduces `Unknown command: /code-review-nope` at line start (the
   `code-review-invocation.md:454` fenced example) inside an otherwise normal
   findings body. Assert `exit 0`.
3. **Positive detection preserved, both existing shapes.** Tests 5 and 6 at
   **:188-217** already cover single-line rejections and must keep passing
   unmodified — do not edit them. Add one case that a rejection notice padded to
   exactly the bound (a notice line plus one blank line, still within
   `REJECT_NOTICE_MAX_LINES`) still exits 3, so the bound is exercised at its
   edge rather than only at one line.

**Explicitly out of scope**: touching Tests 1-32; new CI wiring. Registration is
glob-based — `run-unit-tests.sh:190-201` discovers `test-*.sh` in this directory,
and `run-unit-tests.sh:87` already sets `RUN_PR_SCRIPTS=true` for any changed path
under `.claude/skills/dispatch-propagate/scripts/`. This suite is deliberately
**not** in the workflow's explicit hook-tests job list (that job is reserved for
SUTs living outside this directory); do not add a `.github/workflows/unit-tests.yml`
step.

**Recommended model**: sonnet — test-writing with explicit, enumerated cases
against an existing harness template.

**Dependencies**: Unit 1 (cases 1, 2 and the bound-edge case fail until the
notice-shape gate exists — confirm they fail against pre-Unit-1 code before
accepting them as green).

---

## Reuse

- `.claude/skills/dispatch-propagate/scripts/dispatch-code-review:1295-1336` —
  the Step 5 block being narrowed; its **:1295-1298** doctrine comment states the
  invariant the fix must preserve (exit status alone is never sufficient).
- `.claude/skills/dispatch-propagate/scripts/dispatch-detect-transient-death:36-66`
  — the in-repo idiom being extended: never a bare substring; require the
  substring together with a structural condition.
- `.claude/skills/dispatch-propagate/scripts/lint-prose-rules.sh:14-18` — prior
  art for the same hazard class (a scanner whose own pattern text would self-match),
  solved there by splitting the regex across non-contiguous alternatives. Cited as
  precedent; the mechanism does not transfer, since the strings here live in files
  this script does not own.
- `.claude/skills/dispatch-propagate/scripts/dispatch-terminal-gap-audit:349-361`
  — `digest()`'s typed-field allowlist, the design precedent for the greenfield
  target (extract named fields, never grep free-form prose).
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-code-review.sh:52-92,
  93-98, 188-217` — `write_fake_code_review_claude()`, `cr_reset_stubs()`, and the
  Test 5 / Test 6 rejection-case templates the new cases mirror.
- `.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh:51,65,221,1420`
  — `assert_eq` / `report_results` / `setup` / `teardown`, already sourced by this
  suite.
- `.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh:87,190-201` —
  existing glob-based discovery and change-path auto-detect; no new wiring.
- `.claude/skills/review-fix/references/code-review-invocation.md:441-479` (§8) —
  the measured rejection contract the fix reasons from; §1.3 for output-shape
  instability.

## Verification

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-code-review.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-verify-instrument-invocation.sh
```

Assert the two-factor gate is actually present in the shipped script (guards
against a fix that merely edits comments, and against the loop reverting to a
bare match-and-exit):

```verify
CR=.claude/skills/dispatch-propagate/scripts/dispatch-code-review
test -f "$CR" || { echo "FAIL: $CR missing"; exit 1; }
LC_ALL=C grep -aq 'REJECT_NOTICE_MAX_LINES' "$CR" || { echo "FAIL: REJECT_NOTICE_MAX_LINES bound absent from dispatch-code-review"; exit 1; }
LC_ALL=C grep -aq 'OUTPUT_NONBLANK_LINES' "$CR" || { echo "FAIL: OUTPUT_NONBLANK_LINES factor absent from dispatch-code-review"; exit 1; }
LC_ALL=C grep -aq 'treated as quoted text' "$CR" || { echo "FAIL: the quoted-text diagnostic is absent from dispatch-code-review"; exit 1; }
LC_ALL=C grep -aqF "'cannot be used with Skill tool due to disable-model-invocation'" "$CR" || { echo "FAIL: reject literal 1 absent from dispatch-code-review"; exit 1; }
LC_ALL=C grep -aqF "'use /review for a local review instead'" "$CR" || { echo "FAIL: reject literal 2 absent from dispatch-code-review"; exit 1; }
LC_ALL=C grep -aqF "'^Unknown command: '" "$CR" || { echo "FAIL: reject literal 3 absent from dispatch-code-review"; exit 1; }
bash -n "$CR" || { echo "FAIL: dispatch-code-review is not syntactically valid"; exit 1; }
echo OK
```

```verify
bash .claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Manual / judgment steps:

- **Confirm the new tests fail before Unit 1.** Stash Unit 1's script edit (or run
  the new cases against `git show origin/main:.claude/skills/dispatch-propagate/scripts/dispatch-code-review`)
  and confirm cases 1 and 2 exit 3. A new test that passes against unfixed code
  pins nothing.
- **Self-review smoke.** After both units land, run `/review-fix` (or a direct
  `dispatch-code-review --target <base>..HEAD`) on this very PR's branch. The diff
  contains every reject literal as fixture and comment text, so this is the exact
  scenario the tactic names: the pass must complete normally rather than
  hard-stopping at exit 3. If a `treated as quoted text` diagnostic appears in the
  run's stderr, that is the fix working as designed and is the expected outcome,
  not a failure.
- **Bound sanity, author judgment.** `REJECT_NOTICE_MAX_LINES` defaults to 3
  against a measured one-line rejection. If a real rejection is ever observed in a
  bulkier shape, raise the bound via
  `DISPATCH_CODE_REVIEW_REJECT_NOTICE_MAX_LINES` and record the new measurement in
  §8 — do not widen the match back to whole-output scope.
- **Commit path.** Scope is entirely under `.claude/skills/**` (agent-behavior
  config), so clarification 41's self-modification flow binds: an auto-mode worker
  cannot commit this, and it needs an attended commit path.
