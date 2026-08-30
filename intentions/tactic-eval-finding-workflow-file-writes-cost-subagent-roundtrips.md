---
id: tactic-eval-finding-workflow-file-writes-cost-subagent-roundtrips
kind: tactic
statement: "A /review-fix pass burns four subagents — 3.70 dollars and 9 turns
  of model inference — writing one result.json twice and stat-ing it: the
  Workflow tool’s no-filesystem contract sets a floor of one writer plus one
  independent verifier per dump attempt, and an inexact expected byte count (the
  runtime has no TextEncoder, so byteLen degrades to a character count) forces a
  deterministic SECOND attempt whose only job is to embed the
  coverage_incomplete note that same inexactness caused — while the size check
  every attempt pays for bails out before comparing anything, so the dump has
  never once been independently verified"
owner: ai
status: codified
parent: null
rationale: Auto-created by dispatch-eval-finding as an evaluation finding ledger
  entry. Similar findings MERGE into this node — a recurrence updates
  attributes.measured_impact, never mints a second node. See the body for the
  finding.
reading: null
serves:
  - strategy-recursive-self-improvement
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
pace_exempt: true
rounds: null
attributes:
  ledger_entry: true
  first_seen: 2026-08-14
  measured_impact:
    - metric: plumbing_subagents_launched
      value: 4
      unit: subagents
      window: review phase of tactic-attention-namespaced-rank,
        2026-08-13T22:44:24Z-23:01:54Z
      sensor: rsi
      measured: 2026-08-14
    - metric: plumbing_subagent_price_proxy_usd
      value: 3.7
      unit: usd
      window: review phase of tactic-attention-namespaced-rank,
        2026-08-13T22:44:24Z-23:01:54Z
      sensor: aggregate-usage.sh
      measured: 2026-08-14
    - metric: subagents_launched_total
      value: 12
      unit: subagents
      window: review phase of tactic-attention-namespaced-rank,
        2026-08-13T22:44:24Z-23:01:54Z
      sensor: review-fix result.json
      measured: 2026-08-14
    - metric: review_lens_subagents
      value: 5
      unit: subagents
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

# The /review-fix result dump pays for two attempts and a size check that never compares

## Observed

`tactic-attention-namespaced-rank`, phase `review`, 2026-08-13. Workflow run
`wf_ffefa101-347` under worker session `6b9f36ea-b44f-4076-b9ee-3da2ff0a62a6`.

`result.json` records `subagents_launched: 12`. Only **five** of them reviewed
anything — the opus lens agents that ran 22:53:07 → 22:54:51: `security-review`,
`input-validation`, a Firebase/Firestore + api-call-site pass, a multi-domain
`domain-sweep`, and `red-team`.

Four of the other seven exist only because a Workflow script has no filesystem
access:

| started | model | turns | price | job |
| --- | --- | --- | --- | --- |
| 22:55:47 | sonnet | 2 | $1.14 | "Write a JSON file to disk. This is a mechanical copy — do NOT reformat, summarize, pretty-print, validate, or otherwise alter the content" |
| 22:56:03 | sonnet | 2 | $0.97 | "Report file sizes … Run EXACTLY this command line, and nothing else: `wc -c < …`" |
| 22:56:11 | sonnet | 3 | $1.42 | second mechanical JSON copy |
| 22:56:28 | sonnet | 2 | $0.17 | second `wc -c` receipt |

**$3.70 and 9 turns of model inference to write two files and stat them.** The
remaining three (a `pwd` prober at 22:54:54, a text-structurer at 22:55:04, a
disposition classifier at 22:55:14) are $8.74 more and are at least doing
judgment work.

The workaround does not even close. `result.json` carries:

```
"coverage_incomplete": true,
"coverage_note": "The result dump at …/result.json was not independently
 size-verified (this runtime has no TextEncoder, so the expected byte count is
 not exact); its integrity rests on the dump agents' own receipts."
```

Evidence: workflow journal and the 12 per-agent transcripts under
`~/.claude/projects/-home-n8-natb1-commons-systems--claude-worktrees-tactic-attention-namespaced-rank/6b9f36ea-b44f-4076-b9ee-3da2ff0a62a6/subagents/workflows/wf_ffefa101-347/`
(each `agent-*.meta.json` carries the model; each `agent-*.jsonl` opens with the
prompt quoted above), plus `result.json` / `result.part*.json` under that
worktree's `tmp/review-result-tactic-attention-namespaced-rank/` — worktree-local,
will not survive a sweep.

## Context

Re-measured on the caller thread 2026-08-19 against origin/main `38de61bc`.
`.claude/workflows/review-fix.js` is now 4385 lines; **locate every anchor below
by SYMBOL, never by line number** (the parenthesised line numbers are 2026-08-19
positions, given only as a starting point).

### What the four agents actually are — the finding's own diagnosis was one layer off

The dump stage launches, **per attempt**, one writer agent per payload chunk plus
exactly one independent verifier that runs `wc -c` (and, when chunked, the `cat`
assembly). The measured run's payload was small enough to be a single piece, so
one attempt = 1 writer + 1 verifier = 2 agents. **Four agents were observed
because the stage ran TWO attempts**, 24 seconds apart — and it ran two for a
reason that has nothing to do with the write being risky:

- `const resultBytesExact = typeof TextEncoder !== 'undefined'` (~3949) and
  `byteLen = (s) => (resultBytesExact ? new TextEncoder().encode(s).length : s.length)`
  (~3950).
- The Workflow runtime has no `TextEncoder` (this is not inference — the
  production `coverage_note` above says so), so `resultBytesExact` is **false in
  every run**.
- `attemptDump` therefore always reaches the `if (!resultBytesExact)` branch
  (~4216) and returns `{ ok: true, verified: false }`.
- The attempt loop's `res.ok && !res.verified` arm (~4295-4310) calls
  `noteDumpCoverage(...)`, latches `dumpNoteRecorded`, and **`continue`s — a
  full second attempt (N writers + 1 verifier) whose only purpose is to rewrite
  the file with the coverage note embedded in it.**

Two consequences follow, and the second is a defect the finding did not name:

1. **Every review phase pays 2×(chunks+1) dump agents where chunks+1 would do.**
   Measured payloads are 26k–63k chars against `DUMP_CHUNK_CHARS = 16000`
   (~3944), so the normal case is 2–4 writers: 6–10 agents where 3–5 suffice.
2. **The independent size check has never once compared bytes.** It bails at the
   `!resultBytesExact` branch before any comparison runs, so the whole
   per-piece / assembled-total comparison block (~4230-4262) is unreachable in
   production. The dump is, today, exactly as unverified as it would be with no
   verifier at all — and it pays for a verifier anyway, twice.

So the cheapest correct fix is **not** "delete the `wc -c` agents": it is to make
the expected byte count exact in a runtime with no `TextEncoder`, which deletes
the forced second attempt, removes the standing false `coverage_incomplete`, and
switches the check the run is already paying for from dead to live. This is the
whole of Unit 1.

### Reconciling the two fixes this node's original body proposed

**Fix (1) — "have the orchestrator write the dump, not a subagent" — is REFUSED,
and the refusal is recorded doctrine, not a preference.** A Workflow tool result
lands in the CALLING session's context by construction, so returning the result
object to the skill reintroduces precisely the payload the split exists to
remove. Two independent statements of that decision:

- `.claude/skills/review-fix/SKILL.md` (~945-953): "**Never read that file in
  this thread.** Steps 5 and 6 each fork a subagent that reads it itself; keeping
  it out of the parent's context is the whole point of the split (this thread's
  peak context is the phase's dominant cost)."
- `.claude/workflows/review-fix.js`, the throw closing the dump attempt loop
  (~4318): "fail loud per `.claude/rules/code-style.md` — never fall back to
  returning the arrays inline, which would silently restore the context payload
  this contract removes."

Per `.claude/rules/design-proposals.md`, the greenfield design is stated on its
own terms: **the ideal is a Workflow-tool primitive that writes a
caller-designated path directly**, so a sandboxed script can persist its own
output without an LLM as the transport, without chunking, without a fidelity
check, and without a second agent to attest the first. That primitive is a
property of the Claude Code Workflow tool contract ("No filesystem or Node.js API
access", restated in this file's own header at ~16-17), **not of this repo**, so
there is no in-repo migration path to it and nothing here can build it. The
brownfield path — the only one available — is to make the existing
write-plus-verify protocol cost the minimum number of agents it can while keeping
every property the protocol was built for. That is Units 1–3. Do not re-open the
context split; if a future author wants it re-opened, that is an `/align` ruling,
not an implement-phase decision.

**Fix (2) — "drop the `wc -c` receipt agents outright" — is REFUSED as written,
on two independent grounds.**

- *It breaks the chunked path.* That one agent also runs the `cat` assembly that
  produces `result.json` at all (command construction just above the verify
  `agent()` call, ~4157-4162), and the `observedTotal < 0 && chunked` branch
  (~4196-4209) exists because a missing byte count there means `result.json` may
  never have been assembled. Payloads of 26k–63k chars against
  `DUMP_CHUNK_CHARS = 16000` make chunking the **normal** case. Deleting that
  agent unconditionally hands the Step-5/Step-6 subagents a path with no file
  behind it.
- *It is the wrong half.* Even on the unchunked path the verifier is 1 of the 4
  measured agents; the forced second attempt is 2 of them. And deleting the
  verifier would make "unverified" permanent — the `coverage_incomplete` this
  finding complains about would become structural rather than fixable. The
  independence property it buys is deliberate and documented at `DUMP_VERIFY_SCHEMA`
  (~382-388): the writer's own receipt merely echoes back the path and count the
  script handed it, so it cannot distinguish a faithful write from a truncated
  one.

The finding's complaint is answered instead by halving the agent count (Unit 1)
and cheapening the mechanical agents that remain (Unit 3), while making the check
they pay for actually work.

### Intended outcome

- Dump-stage agents per review phase: `2×(chunks+1)` → `chunks+1` (measured case:
  4 → 2; typical chunked case: 6–10 → 3–5).
- `coverage_incomplete` / `coverage_note` no longer set by the dump stage on the
  healthy path, so the flag goes back to meaning something.
- The independent size check compares real numbers for the first time.
- No change to what is reviewed, to the parent thread's context, or to the
  returned envelope's shape.

---

## Units of work

## Unit 1 — exact UTF-8 byte counting, removing the forced second dump attempt

### Scope

Single file: `.claude/workflows/review-fix.js`. Locate by symbol.

**1a. Replace `resultBytesExact` / `byteLen` with an exact pure-JS counter, wrapped
in slice sentinels.** Today (~3946-3950):

```js
// Byte lengths drive the size check, so a runtime without TextEncoder degrades the
// check to "unverifiable" (below) rather than false-failing on any multi-byte
// character.
const resultBytesExact = typeof TextEncoder !== 'undefined';
const byteLen = (s) => (resultBytesExact ? new TextEncoder().encode(s).length : s.length);
```

Replace the whole of that (comment included) with a comment explaining why the
count is computed by hand, and the counter between sentinels. The sentinel text
is load-bearing — the Unit 2 probe matches it verbatim, and each sentinel must
appear exactly once in the file:

```js
// Byte lengths drive the independent size check. This runtime has no TextEncoder
// (measured: the production coverage_note said so on every run), and a character
// count is not a byte count, so the check used to bail as "unverifiable" before
// comparing anything — paying for a verifier that never verified, and forcing a
// whole second dump attempt just to embed the note. The count is therefore
// computed directly, matching TextEncoder's encoding exactly: a lone surrogate
// encodes as U+FFFD (3 bytes), a valid pair as one 4-byte code point.
// >>> dump byte length: sliced + eval'd by review-fix-dump-bytes-probe.mjs >>>
function byteLen(s) {
  let n = 0;
  for (let i = 0; i < s.length; i += 1) {
    const c = s.charCodeAt(i);
    if (c < 0x80) {
      n += 1;
    } else if (c < 0x800) {
      n += 2;
    } else if (c >= 0xd800 && c <= 0xdbff && i + 1 < s.length) {
      const lo = s.charCodeAt(i + 1);
      if (lo >= 0xdc00 && lo <= 0xdfff) {
        n += 4;
        i += 1;
      } else {
        n += 3;
      }
    } else {
      n += 3;
    }
  }
  return n;
}
// <<< dump byte length <<<
```

The slice between the sentinels must stay **pure** — no reference to `_a`,
`agent`, `log`, or any other injected global — because the probe evals it in
isolation. Keep the `// >>>` / `// <<<` lines exactly as written; the probe fails
loudly if either appears zero or twice.

**1b. Delete the `!resultBytesExact` early return inside `attemptDump`** (~4216-4224,
the block whose `why` reads `'this runtime has no TextEncoder, so the expected
byte count is not exact'`, together with its three-line comment). Everything below
it — the per-piece tolerance loop, the assembled-total bound, the final
`{ ok: true, verified: true, ... }` — is unchanged and becomes reachable.

**1c. Comment sweep for the now-false TextEncoder claims.** In the attempt loop's
`res.ok` arm (~4297-4300), the line "(dead agent, or `wc` unavailable/denied), or
this runtime lacks TextEncoder." drops its trailing clause — that arm now fires
only when the verifier itself produced no number. Grep the file for `TextEncoder`
afterwards: zero matches must remain.

### Out of scope, explicitly

- `DUMP_CHUNK_CHARS = 16000` (~3944). Its size is a measured
  fidelity-versus-launch-count tradeoff documented in place; and with the check
  live for the first time, any re-sizing should be argued from real
  `dump: verified …` log lines, not from this plan. Leave it alone.
- The writer prompt, the fence-token derivation (`dumpFenceToken`), the
  reduced-record fallback (`dumpReduced` / `buildFullResult`), `DUMP_MAX_ATTEMPTS`,
  the `throw`, and `noteDumpCoverage` — all unchanged.
- The `coverage_incomplete = true` **site count must stay 8**;
  `.claude/skills/dispatch-propagate/scripts/test-review-fix-residue-death.sh`
  asserts it. Unit 1 removes no such assignment (the dump's only one lives inside
  `noteDumpCoverage`), so no edit to that test should be needed. If the count
  changes, the change is wrong — do not update the assertion to match.
- `.claude/skills/review-fix/SKILL.md`. Its `coverage_incomplete` prose still says
  "three causes" where the script now lists eight; that drift predates this work
  and is not this unit's to fix.
- `intentions/tactic-review-skill-body-decomposition.md` quotes the dump-agent
  contract in its own prose (~326, ~356). **Do not edit it.** It is a graph node
  record of a decision, not the implementation.

### Recommended model

`opus` — the diff is small but it switches a dormant integrity check on for the
first time on the phase's terminal path, and the comment sweep is judgment work.

## Unit 2 — CI-visible unit test for the byte counter

### Scope

`.claude/workflows/*` has **no** vitest mapping, and `run-unit-tests.sh`'s
`test-*.sh` glob only fires for changed paths under
`.claude/skills/dispatch-propagate/scripts/` (`run-unit-tests.sh:88`), so a PR
touching only `review-fix.js` runs nothing. The only unconditional vector is the
`hook-tests` job. Also, `review-fix.js` cannot be imported or executed by node
(top-level await plus injected Workflow globals), so the only test vector is the
established sentinel-slice probe.

Three new/edited files:

1. **New probe** `.claude/skills/dispatch-propagate/scripts/review-fix-dump-bytes-probe.mjs`.
   Copy `review-fix-residue-death-probe.mjs` (same directory) and adapt:
   - resolve the target via
     `fileURLToPath(new URL('../../../workflows/review-fix.js', import.meta.url))`;
   - `START = "// >>> dump byte length: sliced + eval'd by review-fix-dump-bytes-probe.mjs >>>"`,
     `END = '// <<< dump byte length <<<'`;
   - keep the `countOccurrences` exactly-once guard that `process.exit(1)`s;
   - `source.slice(startIdx, endIdx).trim()` (the `.trim()` is load-bearing for
     ASI), fail loudly on an empty slice;
   - eval the slice inside an IIFE returning `byteLen`, carrying the
     `// eslint-disable-next-line no-eval -- <reason> // type-safety-ok: <reason>`
     annotation the sibling probe carries (`.claude/rules/type-safety-suppression-marker.md`);
   - fixture table, each entry emitting **both** the sliced counter's answer and
     `Buffer.byteLength(s, 'utf8')` as the oracle:
     `''`, `'abc'`, `'é'` (U+00E9), `'€'` (U+20AC), `'😀'` (U+1F600),
     `'\uD83D'` (lone high surrogate), `'\uDE00'` (lone low surrogate),
     `'a\uD83D'` (high surrogate at end of string), and a mixed line such as
     `'{"a":"é😀€","b":1}'`;
   - sole output contract: `process.stdout.write(JSON.stringify(results) + '\n')`.

2. **New driver** `.claude/skills/dispatch-propagate/scripts/test-review-fix-dump-bytes.sh`.
   Copy `test-review-fix-residue-death.sh`: `set -euo pipefail`;
   `FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"`;
   `# shellcheck source=dispatch-test-fixture.sh` then
   `source "$FIXTURE_DIR/dispatch-test-fixture.sh"`;
   `out=$(node "$SCRIPT_DIR/review-fix-dump-bytes-probe.mjs")`; assert with
   `assert_eq` over `printf '%s' "$out" | jq -r …` — **never `echo` into `jq`**
   (`.claude/rules/shell-json.md`, mechanically linted); `report_results` last.
   Assertions:
   - per fixture, `actual == expected` (the `Buffer.byteLength` oracle) — plus one
     aggregate `all(.actual == .expected)` assertion so a fixture added later is
     covered by default;
   - the explicit constants for the interesting cases: `'😀'` → `4`,
     `'\uD83D'` → `3`, `'a\uD83D'` → `4`, `'€'` → `3`, `'é'` → `2`;
   - **call-site / anti-regression teeth** (the block every sibling driver ends
     with), grepping `$REPO_ROOT/.claude/workflows/review-fix.js`:
     `grep -c 'const expected = parts.map(byteLen);'` is `1` (the counter is still
     wired into the check), `grep -c 'resultBytesExact'` is `0`, and
     `grep -c 'TextEncoder'` is `0` — so a future edit that reintroduces the
     inexact path fails here rather than silently restoring a permanently
     unverified dump.

3. **CI wiring** — `.github/workflows/unit-tests.yml`, `hook-tests` job. Add,
   beside the existing `review-fix` steps (~248-263, under the comment block at
   ~236-243 that explains why SUTs outside the scripts dir are wired here
   unconditionally):

```yaml
      - name: Run review-fix dump byte-length tests
        run: .claude/skills/dispatch-propagate/scripts/test-review-fix-dump-bytes.sh
```

Omitting this step leaves the suite dead in CI. Nothing else in that workflow
changes.

### Out of scope

No other test file is edited. In particular do not touch
`test-review-fix-residue-death.sh`'s `coverage_incomplete = true` count assertion.

### Recommended model

`sonnet` — rote wiring against four near-identical in-repo precedents, with
explicit fixture cases given.

### Dependencies

Unit 1 (the sentinels and the counter must exist to be sliced).

## Unit 3 — cheapen the two mechanical dump agents with `effort: 'low'` (CONDITIONAL)

### Scope

`.claude/workflows/review-fix.js` only. The writer `agent()` call (options object
carrying `label: \`dump:${attemptLabel}:${i + 1}/${parts.length}\``, ~4126-4133) and
the verifier `agent()` call (`label: \`dump-verify:${attemptLabel}\``, ~4181-4188)
carry **no** `effort:` option, so both inherit the session default. The `review`
phase is unmapped in
`.claude/skills/dispatch-propagate/scripts/dispatch-phase-effort` (its `case`
maps only `implement` → `medium` and `plan` → `high`; everything else emits empty
= inherit), so a verbatim file copy and a `wc -c` are currently reasoning at
whatever the phase session runs at. Add `effort: 'low'` to both options objects
and nothing else. Model tier stays `sonnet` on both.

**Precondition gate — this unit is DROPPABLE and must be dropped rather than
guessed at.** `effort` is a supported `agent()` option and is already used inside
this same file (`effort: 'high'` at ~2601 and ~3022), but `'high'` is the **only**
value used anywhere in `.claude/workflows/`, so the runtime's acceptance of
`'low'` is unverified. (`'low'` is a legal level for `dispatch-code-review` —
`REVIEW_PLAN_BAND = ['low','medium','high','xhigh','max']`, ~680 — but that is a
`claude -p --effort` consumer, not this `agent()` option.) Before landing:
confirm from the Workflow tool's own runtime contract, as presented to the
implementing session, that `'low'` is an accepted `effort` value. If that cannot
be confirmed **do not land this unit** — say so in the PR body and stop. A
rejected option value on the dump path would take the terminal review phase down,
which costs far more than the unit saves.

Do **not** propose a cheaper *model* tier here: only `'opus'` and `'sonnet'`
appear as `model:` values anywhere in `review-fix.js`, so runtime acceptance of
any other tier is likewise unverified.

### Out of scope

Every other `agent()` call in the file. The finder, fix, classify, verify and
residue agents are judgment work and their effort is set (or deliberately
defaulted) elsewhere.

### Recommended model

`sonnet` — a two-line option addition with an explicit precondition.

### Dependencies

None on Units 1–2 (independent), but land it last so a dropped Unit 3 does not
strand the units that carry the actual win.

---

## Reuse

- `.claude/skills/dispatch-propagate/scripts/review-fix-residue-death-probe.mjs`
  (~1-85) — the canonical sentinel-slice-and-eval probe skeleton: path resolution
  from `import.meta.url`, the exactly-once sentinel guard, the `.trim()`ed slice,
  the IIFE `eval` with its suppression annotation, the single-line JSON stdout
  contract. Copy it; do not re-derive.
- `.claude/skills/dispatch-propagate/scripts/test-review-fix-residue-death.sh`
  (~1-114) — the driver skeleton, including the closing "call-site / doctrine
  coverage (anti-regression teeth)" grep block.
- `.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh` — provides
  `SCRIPT_DIR` (:26), `assert_eq` (:51), `report_results` (:65) and `REPO_ROOT`
  (:1987). Source it; never reimplement the assertions.
- `.github/workflows/unit-tests.yml`, `hook-tests` job (~219-263) — five existing
  steps already wire `review-fix.js` suites (`test-review-fix-instrument.sh`,
  `-residue-death`, `-xlane-dedup`, `-domain-sweep`, `-diff-context`,
  `-skeptic-batch`). Copy the step shape.
- `.claude/workflows/review-fix.js`'s existing dump machinery — `splitDumpPayload`,
  `dumpAgentCount`, `serializeForDump`, `attemptDump`, `noteDumpCoverage`, the
  attempt loop, `DUMP_SCHEMA`/`DUMP_VERIFY_SCHEMA`. All reused as-is; this plan
  changes one helper and deletes one branch.
- `.claude/workflows/review-fix.js` `agent(prompt, { model, effort, agentType,
  schema, label, phase })` (~2599-2606, ~3020-3027) — the in-file precedent for
  passing `effort` alongside `model`, for Unit 3's shape.

## Verification

Auto-runnable. Each fence must be run from the repo/worktree root. The first
three FAIL today (the suite and the CI step do not exist; `resultBytesExact` is
still present) and must pass after the plan lands.

```verify
.claude/skills/dispatch-propagate/scripts/test-review-fix-dump-bytes.sh
```

```verify
grep -q 'test-review-fix-dump-bytes.sh' .github/workflows/unit-tests.yml
```

```verify
if grep -q 'resultBytesExact\|TextEncoder' .claude/workflows/review-fix.js; then echo "FAIL: the forbidden pattern is still present in .claude/workflows/review-fix.js"; exit 1; fi
```

Regression fences — these PASS today and must keep passing (the second is the
guard that Unit 1 changed no `coverage_incomplete` site):

```verify
node --check .claude/workflows/review-fix.js
```

```verify
.claude/skills/dispatch-propagate/scripts/test-review-fix-residue-death.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/test-review-fix-instrument.sh
```

Note on `node --check`: `review-fix.js` uses top-level `await` and injected
globals, so it cannot be imported or executed — but `node --check` parses it
without running it and **exits 0 on today's file** (measured 2026-08-19 on
origin/main `38de61bc`). The fence is therefore written bare, with no `|| true`:
a trailing `|| true` would make it pass unconditionally, including after the
syntax error it exists to catch. If a future change makes `node --check` complain
about module mode rather than about syntax, fix the fence to discriminate the two
— do not neuter it.

Also run `.claude/skills/dispatch-propagate/scripts/run-lint.sh` on the branch
before pushing (it runs the prose-rule linter that mechanically rejects
`echo "$JSON" | jq` in committed `.sh` files, and the type-safety escape-hatch
check that the probe's `eval` suppression must satisfy). It diffs against
`origin/main`, so run it from the PR branch, not from a detached checkout.

Manual / observe-in-production:

1. On the next real `review` phase, open the Workflow journal for the run and
   count `phase: 'dump'` agents. Expect `chunks + 1` (labels
   `dump:a1:1/N` … `dump:a1:N/N` and one `dump-verify:a1`) and **no `a2` labels**.
   Before this change every run showed both an `a1` and an `a2` generation.
2. In the same journal, confirm the line
   `dump: verified <N> bytes on disk at <…>/result.json (<P> piece(s), attempt 1)`.
   That line has never been emitted in production before — its appearance is the
   proof the independent check went from dead to live.
3. Open that run's `result.json` and confirm `coverage_incomplete` is `false`
   (unless one of the seven non-dump causes genuinely fired, in which case
   `coverage_note` names it and does not mention the size check).
4. Watch the following two or three review phases for a `dump: attempt N did not
   land — …piece … bytes on disk but … bytes were handed to its dump agent`
   line. The size comparison is newly live, so a real writer-fidelity drift that
   was previously invisible now surfaces as a retry. One retry is the protocol
   working. Repeated mismatches on the same shape of payload mean
   `DUMP_CHUNK_CHARS` is too large for reliable transcription and should be
   re-measured — record that as a follow-up finding rather than raising the
   tolerance, which would re-blind the check.
5. Unit 3 only: confirm from the run's `agent-*.meta.json` that the dump agents
   report the reduced effort. If the option was silently ignored the unit is
   inert and should be reverted rather than left as decoration.

## Caveats carried forward

- **No sibling overlap on the dump stage.** As of 2026-08-19 a grep of
  `intentions/` for `dump agent`, `dump-verify`, `DUMP_CHUNK`, `result.part` and
  `TextEncoder` returns only this node and the decision record in
  `intentions/tactic-review-skill-body-decomposition.md` (which must not be
  edited).
- **`tactic-eval-finding-review-orchestration-outspends-review-lenses` measures
  the same 2026-08-13 window** at whole-phase granularity ($37.47 of $76.09),
  where this node measures the plumbing subagents ($3.70 of that). The two stay
  distinct: this plan touches only the dump stage and claims only the dump
  stage's savings. Do not restate the phase-level figure as this plan's effect.
- **`attributes.measured_impact` on this node is the recurrence carrier.** A
  later recurrence of the same measured pattern merges here and updates those
  summary metrics; it does not mint a second node.
