---
id: tactic-align-audit-retirement
kind: tactic
statement: "Retire the /align-audit skill — deprecate and REMOVE it and sweep
  live references; no charter fold-in (author: none expected); residue already
  re-homed (integrity sensor → graph-digest tables via tactic-rsi-graph-review)"
owner: ai
status: codified
parent: null
rationale: "Retained from the 2026-08-30 post-review fix (finding H7). The
  migration round's landed doctrine three times calls /align-audit 'deprecated'
  (the author's own word) and rules /exetasis's whole-graph coverage the sole
  re-entry path — no second mechanism. But .claude/skills/align-audit/SKILL.md
  remains live and unmarked, chartered as 'the recurring re-visiting mechanism
  that write-time gates never provide' — a second live whole-graph mechanism
  contradicting landed doctrine. The graph session could not mark it directly
  (.claude/skills is a read-only sandbox carve-out for graph sessions), so this
  tactic is the mechanical carrier the deprecation was missing. Stamped
  (decision: deferred, delegation-anthropic-claude, 2026-08-30) as to scope; the
  deprecation itself is the author's word, carried verbatim. DISPOSITIONED
  2026-08-30 resolution round: accepted as DELEGATED (decision: delegated,
  delegation-anthropic-claude, 2026-08-30) — author verbatim intent: 'don't
  care, just deprecate and remove', with no residue folded into /exetasis. The
  non-legacy residue was interviewed separately as directed:
  strategy-graph-integrity's sensor re-homed to the graph-digest check tables
  (RSI batch review, WIP, no office-hours interim) and the digest tooling's
  charter moved to tactic-rsi-graph-review. Removal therefore orphans nothing."
reading: null
serves:
  - strategy-graph-review-curriculum
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
# Retire the /align-audit skill — delete the skill file outright and sweep the two live code references, with NO charter fold-in (author-ruled) and no residue re-homing (already done elsewhere)

## Context

Landed doctrine (commit `8dd93caf`, 2026-08-30 migration round) three times calls
`/align-audit` **deprecated**, and rules that `/exetasis`'s whole-graph coverage over
cycles is the *sole* re-entry path for review-declined content — one mechanism, no
second path. But `.claude/skills/align-audit/SKILL.md` is still on disk, live and
unmarked, and its own header still charters it as *"the recurring re-visiting mechanism
that write-time gates never provide"* — a second live whole-graph mechanism that
contradicts the landed doctrine. The graph session that recorded the deprecation could
not fix this itself: `.claude/skills/` is a read-only `denyWithinAllow` carve-out for
graph sessions (`.claude/rules/sandbox.md`). This tactic is the mechanical carrier that
deprecation was missing.

**Author ruling, verbatim (2026-08-30 resolution round, accepted as DELEGATED —
`(decision: delegated, delegation-anthropic-claude, 2026-08-30)`):** *"don't care, just
deprecate and remove"*. No charter fold-in into `/exetasis`; no residue expected.

**The residue was already re-homed, so removal orphans nothing.** Verified on this
worktree at `origin/main` `f8a337cf`:

- `intentions/strategy-graph-integrity.md:157` — `success_signal.sensor` already reads
  *"the graph-digest check tables (deterministic, token-bounded), read by …"*, i.e. the
  sensor has already moved off the `/align-audit` report.
- `intentions/strategy-graph-integrity.md:134-140` — clarification *"Where did the sensor
  move when /align-audit was retired (2026-08-30)?"* records the re-homing and states the
  sensor did **not** move to `/exetasis`.
- The digest tooling's charter moved to `tactic-rsi-graph-review` (RSI batch review, WIP,
  author-accepted with **no office-hours interim** — the coverage signal may lapse or
  regress until that function is built).

**Do NOT add a `blocked_by` edge on `tactic-rsi-graph-review`** (a raw draft being
finalized concurrently). The author explicitly accepted the interim lapse; removal does
not wait for the replacement.

### Measured blast radius (measured 2026-08-30 on this worktree at `origin/main` `f8a337cf`)

`.claude/skills/align-audit/` contains **exactly one file**, `SKILL.md` (20107 bytes,
`ls -la`). There is no `.upstream.json` (so it is repo-authored, not vendored — the
vendored-skills lint is unaffected), and no dedicated agent file:
`grep -rniI 'align.audit'` over `.github/`, `.githooks/`, `.claude/hooks/`,
`.claude/workflows/`, `.claude/settings.json`,
`.claude/skills/dispatch-propagate/scripts/jit.example.json`, every other
`.claude/skills/*/SKILL.md`, and every `*.test.ts` / `*.bats` / `test-*.sh` returns
**zero hits**. So `/align-audit` has **no CI, hook, workflow, settings, jit, agent, or
test wiring at all** — unlike `/align-init` (settings.json + jit.example.json + 9 agent
files) or `/file-issue` (4 live legacy-lane call sites). Deletion is mechanically inert.

The complete reference surface outside `intentions/`, `plans/`, and the skill's own
directory is five lines in three files:

| Path:line | Content | Disposition |
|---|---|---|
| `packages/intentionsutil/src/digest.ts:3` | `// The digest is the first-read surface for /align-audit and the align skills'` | **Unit 2 — rewrite** |
| `packages/intentionsutil/src/digest.ts:49` | `// arbitrary prose. The digest is the first-read surface fed to the /align-audit` | **Unit 2 — rewrite** |
| `packages/intentionsutil/scripts/review-coverage.ts:8` | `// signal; the graph digest and /align-audit report absorb its output when` | **Unit 2 — rewrite** |
| `.claude/rules/sandbox.md:107` | `error: unable to unlink old '.claude/skills/align-audit/SKILL.md': Read-only file system` | **KEEP unchanged** |
| `.claude/docs/delegability.md:11-13`, `.claude/docs/signal-identification.md:11-13` | *"…retained by the intention node `tactic-align-audit-legacy-review` …, which decides whether a future `/align-audit` re-consumes this contract."* | **OUT OF SCOPE** — owned by a sibling |

`.claude/rules/sandbox.md:107` is a **verbatim historical error transcript** inside a
"Measured 2026-08-30" block illustrating a sandbox failure mode. It is a measured-history
record, not a live reference. Once `SKILL.md` is deleted it describes a past measurement
against a file that existed then — exactly how this repo already treats other
historical-event citations (e.g. `align-init`'s commit-sha citation). **Leave it
byte-identical.**

`intentions/` prose names `align-audit` in ~20 nodes, but `validateGraphProseRefs` checks
**node ids**, not skill paths (`packages/intentionsutil/scripts/validate-graph.ts:4-12`),
so the deletion breaks nothing mechanically there. `intentions/tactic-align-audit-skill.md`
is `phase: done` — frozen history recording how the skill was built; **leave it untouched**,
per the `align-init` precedent (`c845d50f`) of leaving frozen historical sections alone.

### Two cross-node facts the implementer must carry, not rediscover

**(1) Sibling overlap — this deletion moots one of its planned line items.**
`intentions/tactic-retire-assessor-contract-docs.md` is at `phase: implement` (line 34),
ahead of this node in the queue. Its scope is: retire `.claude/docs/delegability.md`,
`.claude/docs/signal-identification.md` and their `ref-*` skills **wholesale**, *plus*
"fix `.claude/skills/align-audit/SKILL.md`'s out-of-scope list, which frames a decision
settled 2026-07-23 as pending and cites a node that no longer exists" (the
`tactic-align-audit-legacy-review` citation at `.claude/skills/align-audit/SKILL.md:334-335`).
Deleting the whole file **supersedes that one line item** — the file its edit targets will
not exist. The implementer must say so explicitly in the PR body (see Unit 1) so the
sibling's execution session drops that item instead of parking on a missing file.

**(2) Why the two `.claude/docs/*.md` lines are out of scope rather than swept.**
They are doubly stale already — `tactic-align-audit-legacy-review` was pruned from the
graph 2026-08-29, and the re-consumption question was decided *against* on 2026-07-23 —
but the sibling above **deletes both files outright**. A one-line edit here would
duplicate work the sibling owns and would turn its deletion into a git delete/modify
conflict. This tactic's own statement scopes it to the skill file plus the live-reference
sweep, with no fold-in. Leave both files alone; if a conflict does arise later, the
resolution is **take the deletion**.

## Units of work

### Unit 1 — Delete `.claude/skills/align-audit/` outright

**Scope.** Remove the directory `.claude/skills/align-audit/` and its single file
`SKILL.md` (20107 bytes; the only file in the directory — confirm with `ls -la` first).
Use `git rm -r .claude/skills/align-audit`.

**This unit MUST run with `dangerouslyDisableSandbox: true` on the FIRST attempt.**
`.claude/skills/` is a read-only `denyWithinAllow` carve-out
(`.claude/rules/sandbox.md`, "Tree-updating git ops touching read-only paths"). `git rm`
writes the working tree there, so a sandboxed attempt fails
`Read-only file system`; tree-updating git ops against that carve-out abort
non-transactionally and must set the override up front, not on retry.

**Out of scope for this unit:** every file listed in the blast-radius table above; the
`.claude/settings.json` allowlist (verified zero `align-audit` entries — the only hit is
the unrelated `land-align-round` at line 59, so the `align-init` precedent's
"remove dead allowlist entries" unit is a **no-op** here);
`.claude/skills/dispatch-propagate/scripts/jit.example.json` (zero hits — also a no-op);
`.claude/agents/` (no `align-audit*.md` exists).

**PR-body requirement (do not skip).** The PR body must carry a short "Supersedes"
paragraph stating: *this PR deletes `.claude/skills/align-audit/SKILL.md`, which moots
`tactic-retire-assessor-contract-docs`'s planned edit to that file's out-of-scope list
(its other scope — retiring `.claude/docs/delegability.md`,
`.claude/docs/signal-identification.md` and the `ref-delegability` /
`ref-signal-identification` skills — is untouched here and remains that tactic's own
work).* Write it as bare `#N`-free prose; use no GitHub closing keyword anywhere near a
`#N` other than this PR's own deliberate `Closes` lines
(`.claude/rules/issue-references.md`).

**Recommended model:** `sonnet`.

### Unit 2 — Sweep the three code comments naming `/align-audit` as a consumer

**Scope.** Exactly two files, three comment sites. These are **prose-only comments with
no code coupling** — no identifier, import, or string literal in either file depends on
`align-audit`. Do not change any executable line.

1. `packages/intentionsutil/src/digest.ts:3` — currently
   `// The digest is the first-read surface for /align-audit and the align skills'`
   (continuing `// corpus sweeps: a compact per-node summary (Section 1) plus derived check`
   `// tables (Section 2) …`). Rewrite so the named first-read consumer is **the align
   skills' corpus sweeps and the RSI batch graph review (`tactic-rsi-graph-review`)**,
   with `/align-audit` gone. Keep the rest of the sentence — the Section 1 / Section 2
   description and the "without re-reading every node body as text" clause — intact.

2. `packages/intentionsutil/src/digest.ts:49` — currently
   `// arbitrary prose. The digest is the first-read surface fed to the /align-audit`
   `// LLM auditor; an un-sanitized id could inject forged check-table lines or direct`
   `// instructions into that context …`. **This comment carries a live security
   rationale** (ids are only path-safety validated by `store.ts` `assertPathSafeId`, so an
   id may legally carry newlines/CR/tabs/brackets, and the escaping at every render
   boundary exists to stop injection into an LLM's context). That rationale **survives the
   skill's removal** — the digest is still fed to LLM readers. Rewrite **only the consumer
   name**: replace "the `/align-audit` LLM auditor" with a consumer-agnostic phrasing such
   as "the LLM readers of the digest (the align skills' corpus sweeps and the RSI batch
   graph review)". Do **not** delete, shorten, or weaken the injection rationale or the
   determinism/byte-identity claims that follow it.

3. `packages/intentionsutil/scripts/review-coverage.ts:8` — currently
   `// signal; the graph digest and /align-audit report absorb its output when`
   `// those host tactics land.` Drop the `/align-audit report` half of the sentence,
   keeping only the graph-digest absorption path, and point the absorption at
   `tactic-rsi-graph-review` rather than an unnamed "host tactics". The decomposition
   target's own rationale rules the absorption target is now the graph-digest check
   tables read by the future RSI batch function — **not** an `/align-audit` report, which
   is being deleted.

**Out of scope for this unit:** the behavior of `computeReviewCoverage` /
`lastReviewedOf` / `modeOf` / `frontierEntryFor` in `packages/intentionsutil/src/coverage.ts`
and the rest of `review-coverage.ts`. That code still implements the **pre-2026-08-30**
mode-A/mode-B frontier-entry design which the fully-virtual `/exetasis` architecture
supersedes, but replacing or deleting it is `tactic-node-review-skill`'s and
`tactic-rsi-graph-review`'s work, not this tactic's. Touch comments only.

**Recommended model:** `sonnet`.

**Dependencies:** none (independent of Unit 1; may run before or after it).

## Explicit out-of-scope callouts (flagged, deliberately not fixed here)

These are real, anchored contradictions this tactic leaves standing on purpose. Each is
recorded so a later reader does not mistake the omission for an oversight.

- **`intentions/strategy-graph-integrity.md:22`** — the strategy's own top-level
  `rationale` still reads *"Enforcement is the recurring /align-audit evaluation
  (tactic-align-audit-skill) reading the graph digest-first (tactic-graph-digest-tooling)…"*.
  Stale the moment the skill is deleted, and it contradicts the **newer** clarification on
  the same node at `:134-140` (which already records the sensor re-homing) and the already
  re-homed `success_signal.sensor` at `:157`.
- **`intentions/strategy-graph-integrity.md:151-152`** — a `tooling_goals` entry whose
  `statement` still reads *"/align-audit — recurring whole-graph evaluation with
  disposition discipline, one graph-commit per run (tactic-align-audit-skill)"*.

  Both are **strategy-kind substance** on a live node. Editing a strategy's `rationale`
  or `tooling_goals` is an author-owned edit path in this repo, so an autonomous tactic
  round must **not** hand-edit them. Route to the author/strategy track (an `/align` round
  or an `/exetasis` sitting on `strategy-graph-integrity`).
- **`.claude/docs/delegability.md:11-13` and `.claude/docs/signal-identification.md:11-13`**
  — owned by `tactic-retire-assessor-contract-docs` (`phase: implement`), which deletes
  both files wholesale. See "Two cross-node facts" above.
- **`.claude/rules/sandbox.md:107`** — measured-history transcript. Keep byte-identical.
- **`intentions/tactic-align-audit-skill.md`** (`phase: done`) — frozen build history.
  Leave untouched.
- **`plans/dispatch-rsi-sequence.md` and `plans/dispatch-rsi-serialized-pr-plan.md`**
  (5 and 6 `align-audit` hits respectively) — historical planning documents, not live
  references. Leave untouched.

## Reuse

- **`git commit c845d50f` ("Consolidate /align-strategy + /align-init into /align")** —
  the canonical in-repo precedent for deleting a whole `.claude/skills/<name>/` directory
  (`align-init` is the one prior full-deletion case). Its shape is the one Unit 1 follows:
  delete the skill dir + any agent files it alone owns, remove dead `settings.json` and
  `jit.example.json` entries, sweep forward-pointing references, and leave frozen
  historical records alone. Read it with `git show --stat c845d50f`. Three of its units
  are verified **no-ops** here (no agent files, no settings entries, no jit entry).
- **`.claude/skills/plan-issue/SKILL.md:1-33` and `.claude/skills/file-issue/SKILL.md:1-60`**
  — the repo's *retirement-stub* pattern (frontmatter description rewritten to
  `RETIRED — do not invoke. Superseded by X`, body explaining why it is unreachable,
  explicit statement of what was left untouched). **Deliberately NOT followed.** This
  tactic's statement and the author's verbatim ruling are *remove*, not stub. Cited only
  so a reviewer sees the alternative was considered and rejected.
- **`.claude/rules/sandbox.md`, "Tree-updating git ops touching read-only paths"** — the
  first-attempt `dangerouslyDisableSandbox: true` requirement Unit 1 obeys, and the
  `node --import tsx/esm` (never `npx tsx`) spelling the verification fences below use.
- **`.claude/skills/dispatch-propagate/scripts/run-typecheck.sh`,
  `.claude/skills/dispatch-propagate/scripts/run-lint.sh`** — the existing repo-root
  verification entry points; do not hand-roll `tsc`/`eslint` invocations.
- **`packages/intentionsutil/scripts/validate-graph.ts`** — the graph validator. Its own
  `Usage:` header (`:39-40`) is already spelled correctly as
  `node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts <intentionsDir> [--strict-sensors]`,
  and it takes the store as a **positional argument** (it does not infer the tree from its
  own location).

## Verification

Run every block from the **repo/worktree root**. Rooting elsewhere makes
`run-typecheck.sh` / `run-lint.sh` pass vacuously.

The skill directory is deliberately referenced through `$PWD` below rather than as a bare
literal path. `.claude/skills/dispatch-propagate/scripts/lint-verify-fence-paths.sh` runs
unconditionally in `run-lint.sh` and fails the commit that orphans any bare path token
named inside a non-`done` node's ` ```verify ` block; a token containing `$` is excluded
from its candidate set by its own documented TOKEN RULE. Since this node's whole purpose
is to delete that path while the node is still non-`done`, the `$PWD` spelling is required,
not stylistic. Each block is also a **single `&&`-chained statement**: the fence runner
executes blocks as plain `bash <tmpfile>` with no `set -e`, so in a multi-statement block
only the last statement decides pass/fail.

**1. The skill is gone, both on disk and in the index.**

```verify
test ! -e "$PWD/.claude/skills/align-audit" && test -z "$(git ls-files -- "$PWD/.claude/skills/align-audit")"
```

**2. No `align-audit` reference survives anywhere under `packages/`.**

```verify
test "$(grep -rIl align-audit packages/ | wc -l)" -eq 0
```

**3. The `.claude` surface retains exactly the three deliberately-kept references** — the
historical sandbox transcript plus the two sibling-owned docs — and nothing else. This is
a positive equality assertion, not a negated grep, so a mistyped pattern fails loudly
instead of passing vacuously.

```verify
test "$(grep -rIl align-audit .claude/ | sort | tr '\n' ' ')" = ".claude/docs/delegability.md .claude/docs/signal-identification.md .claude/rules/sandbox.md "
```

If `tactic-retire-assessor-contract-docs` lands **before** this PR, the two
`.claude/docs/*.md` entries disappear and this block goes red on a benign cause. That is
the one expected false-fail: re-run it with the expected string reduced to
`".claude/rules/sandbox.md "`. Do not "fix" it by editing or deleting those docs here.

**4. The historical sandbox transcript is byte-identical.**

```verify
test "$(git diff origin/main --numstat -- .claude/rules/sandbox.md | wc -l)" -eq 0
```

**5. Typecheck, lint (which includes `lint-verify-fence-paths.sh`,
`lint-vendored-skills.sh` and `lint-prose-rules.sh`), and unit tests.**

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh && .claude/skills/dispatch-propagate/scripts/run-lint.sh && .claude/skills/dispatch-propagate/scripts/run-unit-tests.sh
```

**6. Graph validation is unaffected by the deletion** (prose-ref integrity keys on node
ids, not skill paths, so the ~20 `intentions/` nodes naming `align-audit` in prose must
stay green).

```verify
node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts intentions
```

### Manual / judgment checks

- **Read the diff of `packages/intentionsutil/src/digest.ts` around line 49 by eye.** The
  automated checks confirm the string `align-audit` is gone; only a human read confirms
  the *security rationale* survived. The paragraph must still explain that ids are only
  path-safety validated, that an un-sanitized id could inject forged check-table lines or
  direct instructions into an LLM's context, and that escaping happens at **every** render
  boundary and is deterministic. If the rewrite shortened any of that, it is wrong.
- **Confirm the PR body carries the "Supersedes" paragraph** required by Unit 1, naming
  `tactic-retire-assessor-contract-docs` and stating precisely which of its line items is
  mooted (the `SKILL.md` out-of-scope-list edit) and which is not (the wholesale doc and
  `ref-*` skill retirement).
- **Observe in production, next graph session:** invoking `/align-audit` must no longer
  resolve as a skill. Discovery under `.claude/skills/` is one level deep and the directory
  name *is* the command name (`.claude/rules/vendored-skills.md`), so removing the
  directory removes the command. Verify in a fresh session's skill listing, not by grep.
- **Accepted regression, do not treat as a defect:** the `strategy-graph-integrity`
  coverage signal has no live reader between this deletion and
  `tactic-rsi-graph-review` landing. The author accepted that interim lapse explicitly and
  declined an office-hours interim. Do **not** add a `blocked_by` edge, a stub reader, or a
  park to cover the gap.
