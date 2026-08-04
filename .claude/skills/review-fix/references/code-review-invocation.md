# `claude -p '/code-review …'` — measured invocation contract

Unit 1 gate record for `tactic-review-code-review-invocation-contract`. Every
statement below is a measurement taken on **2026-07-31** in the dispatch worktree
`/home/n8/natb1/commons.systems/.claude/worktrees/tactic-review-code-review-invocation-contract`
(branch `tactic-review-code-review-invocation-contract`, HEAD `e8b5da60`, identical
to `origin/main` at the time). Anything not directly observed is marked **inferred**.

- CLI: `claude --version` → **`2.1.220`**
- Session doing the measuring: a headless dispatch background worker
  (`claude agents --json` → `kind: "background"`, `name:
  "tactic-review-code-review-invocation-contract"`), i.e. the same class of session
  the review phase runs in.

**Verdict: Unit 1 PASS — the entry point is reachable, runs, returns findings as
text, and `--fix` writes the working tree.** Four findings below change the Unit 2/3
design; read §7 and §1.3 before implementing them.

---

## 1. The entry point runs and returns findings as text

### 1.1 No-op case (empty diff), `max` effort

```
claude -p '/code-review max' --permission-mode acceptEdits
```

- exit **0**, wall clock **~115 s**
- Output was **not** a rejection. The built-in ran, established that
  `HEAD == origin/main` with an empty working tree, and declined to invent findings.
- Output shape: a fenced ` ```json ` block containing `[]`, followed by prose
  (`## Why the result is empty`, an evidence table of the git commands it ran).

Excerpt (verbatim, first lines of the findings section):

```
```json
[]
```

## Why the result is empty

The review scope is genuinely empty — there is no diff to review in this worktree.
```

This is the *empty-findings* shape. Note it is **not** the shape a non-empty review
returns — see §1.3.

### 1.2 Real-diff case, `max` effort — DID NOT COMPLETE

```
claude -p '/code-review max c06c7295~1..c06c7295' --permission-mode acceptEdits
```

- Ran **2363 s (39 m 23 s)** and had still not produced any output when it was
  terminated. `exit=143` (SIGTERM), `stdout+stderr` captured to a file was
  **0 bytes**.
- A rev-range target (`<sha>~1..<sha>`) is accepted — the run proceeded normally
  against it. **This says nothing about a bare SHA.** An earlier revision of this
  line generalized from it to "so `--target "$MERGE_BASE"` in Unit 2 is a valid
  target form"; that inference was wrong and shipped a live defect. Measured
  directly (2026-08-02, two runs): `claude -p '/code-review low <bare-sha>'`
  reviews **only the single commit at that SHA** — the run under test scoped
  itself to a 1-file/3-line graph phase-bump commit and returned no findings —
  while `claude -p '/code-review low <sha>..HEAD'` reviews the accumulated diff
  (9 non-test files, 3 findings). Only the **range** form is a valid target for
  the Step 1b pre-stage; `dispatch-code-review` now rejects a non-range
  `--target` with exit 2.
- Structure of the run, read off the transcripts
  (`~/.claude/projects/<slug>/<sid>/subagents/agent-*.meta.json`): the top-level
  `-p` session spawns one `general-purpose` root review subagent, which fans out
  **10 angle subagents** at `spawnDepth: 1` —

  | angle | angle |
  |---|---|
  | A: line-by-line diff scan | F: reuse |
  | B: removed-behavior auditor | G: simplification |
  | C: cross-file tracer | H: efficiency |
  | D: bash/jq pitfall specialist | I: altitude |
  | E: predicate/wrapper correctness | J: CLAUDE.md conventions |

  The 10 angles finished at ~24 min; the root agent was still in a
  synthesis/dedup stage at 39 min when it was killed.

**Consequences for Unit 2 / Unit 3 (this is the most important finding in this
document):**

1. A `max`-effort review of a real, non-trivial diff **exceeds the Bash tool's
   600 000 ms cap**, and exceeds the `DISPATCH_CODE_REVIEW_TIMEOUT:-540` the plan
   proposed. The plan's assumption that a `max` run fits in one Bash call is
   **falsified**.
2. `claude -p` **buffers all output until the run completes**. A killed or
   timed-out run yields **zero bytes** — the entire (very expensive, see §5) run
   is lost, not partially recoverable. So the `rc == 124 → exit 4` path is not a
   degraded result, it is a total loss.
3. Unit 2 must therefore either (a) run the invocation detached/backgrounded with
   a resume-poll, not synchronously inside one Bash call, or (b) drop the effort
   level for the dispatch lane. Design this deliberately; do not just raise the
   timeout constant.

### 1.3 Real-diff case, `low` effort — the shape a real review returns

Two `low`-effort runs against a deliberately-flawed staged file (SQL injection,
command injection, two hardcoded credentials). Full output of the first,
**verbatim and complete** (7 lines, this is the whole thing):

```
`tmp/code-review-unit1-scratch.js:9` — SQL injection: `userId` concatenated into the query string, so `getUser(conn, "1 OR 1=1")` dumps the whole users table.
`tmp/code-review-unit1-scratch.js:15` — Command injection: `cmd` concatenated into `execSync`, so `run("x; rm -rf /")` executes arbitrary shell.
`tmp/code-review-unit1-scratch.js:4` — Hardcoded production credentials (`DB_PASSWORD`, `API_TOKEN`) committed and re-exported via `module.exports`.

--fix: skipped all three. This file is an intentional vulnerability fixture […]

--comment: ignored. The branch has no commits ahead of `main` […] there is no PR
```

Second run (`--fix` only, after the fixture framing was removed from the file):

```
Reviewed diff: one new file, `/home/n8/…/tmp/code-review-unit1-scratch.js` (branch has no commits ahead of main; the change is uncommitted).

Findings (4) and fixes — all applied, none skipped:
1. SQL injection at line 9 — now a parameterized `conn.query('... id = ?', [userId])`.
2. Command injection at line 14 — `execSync` with string concatenation replaced by `execFileSync('ping', ['-c','1', host])` (no shell).
3. Hardcoded prod DB password at line 5 — now `process.env.DB_PASSWORD`.
4. Hardcoded live API token at line 6 — now `process.env.API_TOKEN`.

Also dropped `DB_PASSWORD`/`API_TOKEN` from the module exports, since re-exporting credentials widened their reach for no caller benefit.

Note: the two credential literals are in the git index […] should be rotated.
```

**The output shape is not stable.** Across the three completed runs the built-in
emitted three different formats: a fenced JSON array (§1.1), a flat list of
`` `path:line` — description `` lines, and a numbered prose list under a
`Findings (N) and fixes` heading. There is **no** stable heading set and **no**
guaranteed machine-readable envelope.

Unit 4's structuring prompt must therefore be written to parse *free-form review
prose*, not a fixed format. What is reliably present in every non-empty run:

- one entry per finding,
- a `path:line` (or `path` + `at line N`) locator,
- a one-sentence description of the defect,
- an explicit statement of `--fix` disposition (applied / skipped) when `--fix`
  was passed.

Everything else varies. Do not anchor on `## Findings`, on a JSON fence, or on the
`fixed`/`skipped`/`no_change_needed` vocabulary.

Also note the built-in **decides for itself whether to apply a fix** and will
refuse when it judges the code to be a deliberate fixture (first `low` run above,
where it read the file's own comment and declined). Its self-report of what it
fixed is therefore not a reliable yield signal — which is exactly why Unit 2
derives `touched_files` from a before/after `git diff` instead.

---

## 2. Permission mode — **no flag is required**

Three variants, all sandbox-off, all exit **0**:

| command | writes applied? |
|---|---|
| `claude -p '/code-review max' --permission-mode acceptEdits` | n/a (no diff) |
| `claude -p '/code-review low --fix' --permission-mode acceptEdits` | **yes** |
| `claude -p '/code-review low --fix'` *(no permission flag)* | **yes** |

The third run is the decisive one: with **no `--permission-mode` at all**, the
nested run applied all four fixes to the working tree. Mechanically verified,
not self-reported — a `git stash create` before-image was taken, and afterwards:

```
$ git diff --name-only c6688e9b029f0a96579db1ebf4d2ca642859645c
tmp/code-review-unit1-scratch.js
```

The applied patch from the `acceptEdits` run (representative):

```diff
-const { execSync } = require('child_process');
+const { execFileSync } = require('child_process');
-const DB_PASSWORD = 'hunter2-prod-master-key';
-const API_TOKEN = 'sk-live-…';
+const DB_PASSWORD = process.env.DB_PASSWORD;
+const API_TOKEN = process.env.API_TOKEN;
 function getUser(conn, userId) {
-  const sql = 'SELECT * FROM users WHERE id = ' + userId;
-  return conn.query(sql);
+  return conn.query('SELECT * FROM users WHERE id = ?', [userId]);
 }
```

**Recommendation for Unit 2:** pass `--permission-mode acceptEdits` anyway. It is
not required here but it is the narrowest mode that provably works, it is explicit
about intent, and it does not depend on whatever the ambient default is in the
spawning context. Do **not** copy `dispatch-spawn-job`'s `--permission-mode auto`
(`.claude/skills/dispatch-propagate/scripts/dispatch-spawn-job:294`) — `auto`
routes through the classifier, which is unnecessary latitude for a stage whose only
job is to edit files in its own worktree.

### 2.1 `stdin` must be redirected

The no-flag run emitted, on stderr:

```
Warning: no stdin data received in 3s, proceeding without it. If piping from a slow command, redirect stdin explicitly: < /dev/null to skip, or wait longer.
```

Two consequences for Unit 2:

- add `< /dev/null` to the invocation — it removes a fixed 3 s stall;
- more importantly, because Unit 2 captures `2>&1` into `output.txt`, **this
  warning alone makes the output non-empty**. The planned "output empty after
  whitespace strip → exit 2" check would be defeated by it. Redirect stdin, and/or
  strip known-benign stderr banners before the emptiness test.

---

## 3. Sandbox

### 3.1 What actually needs the sandbox off

Measured on this host (Linux/WSL2 — note `.claude/rules/sandbox.md`'s `## gh CLI`
section describes a **macOS** TLS failure that does not reproduce here):

| sandboxed call | result |
|---|---|
| `claude -p 'Reply with exactly the word OK…'` | exit 0, `OK`, 3 s — **works** |
| `gh pr list --limit 1` | exit 0, real rows — **works** |
| `touch .claude/skills/review-fix/references/.probe` | `Read-only file system` — **fails** |

So the sandbox does **not** block the nested CLI or `gh` on this host. What it does
block is writes into the `denyWithinAllow` carve-outs — `.claude/skills/`,
`.claude/hooks/`, and the other `.claude/` config paths.

**That is decisive for `--fix`.** A nested `claude -p '… --fix'` runs inside the
outer Bash sandbox and inherits its write allowlist, so a fix landing in
`.claude/skills/**` (a very common review surface in this repo — the dispatch
skills are where most of the diff lives) would fail read-only, non-transactionally,
mid-edit. **Run the invocation with `dangerouslyDisableSandbox: true`.**

### 3.2 Does the auto-mode classifier permit it from a headless worker?

**Yes.** Roughly twenty `dangerouslyDisableSandbox: true` Bash calls were issued
during this investigation from a headless background worker session — including
every `claude -p` invocation and every `claude agents --json` call — and all but
one were permitted.

The one denial: a repeat of an already-permitted `cat` on a `/tmp` file, denied
immediately after an unrelated `Write` to a path **outside** the worktree was
denied. Re-issuing the same read without the sandbox override succeeded. Read that
as classifier context-sensitivity, not as a rule against sandbox overrides.

Practical guidance, consistent with the known hazard: frame the call as what it is
— *"invoke the dispatch-code-review script"* — and never as *"bypass the
sandbox"*. Every call framed that way in this session was permitted.

---

## 4. `--fix` and `--comment` together

```
claude -p '/code-review low --fix --comment' --permission-mode acceptEdits
```

- exit **0**, **14 s**. Both flags parsed and honoured in one invocation; no
  argument error, no "unknown flag".
- **`--comment` resolves the PR from the branch with no explicit PR argument** and
  **no-ops cleanly when there is none.** Its self-report:

  ```
  --comment: ignored. The branch has no commits ahead of `main` (`git diff main...HEAD` is empty)
  and there is no PR; the only change is uncommitted working-tree content, so there is nothing to
  comment on.
  ```

  Confirmed independently: `gh pr list --head tactic-review-code-review-invocation-contract
  --state all --json number,state` → `[]`.

**Limitation, recorded rather than fabricated:** this branch has no PR (the
implementation has not started), so PR-comment *posting* could not be exercised.
What is established is that (a) the flag combination is accepted, (b) `--comment`
derives its target from the branch without an argument, and (c) the absence of a PR
is a graceful no-op, not an error or a non-zero exit. **The actual inline-comment
posting must be verified on the first real dispatch pass** against a live PR —
including the plan's open question of whether those inline comments read as
redundant next to the skill's own Step 6 PR comment.

---

## 5. Cost and attribution

### 5.1 Where the usage lives

Directly observed. A `-p '/code-review …'` run writes **two kinds** of transcript
under `~/.claude/projects/<worktree-slug>/`:

- `<sid>.jsonl` — the top-level `-p` session. In the `max` no-op run this held
  **zero assistant messages and zero usage** (only `queue-operation` / `user` /
  `system` / `last-prompt` records). All the model work is elsewhere.
- `<sid>/subagents/agent-*.jsonl` — the review subagent(s), `agentType:
  "general-purpose"`. **This is where 100 % of the tokens are.**

`aggregate-usage.sh` recurses (`find {} -name '*.jsonl'`, line ~1022) under project
dirs matching `*worktrees*`, so both are scanned. Nothing is missed.

### 5.2 It does **not** land in the `"<none>"` bucket

**Directly observed.** Every assistant message in every review subagent transcript
carries:

```
attributionSkill: "code-review"
```

(32/32 messages in the `max` no-op run; 1091/1091 in the killed real-diff run;
all messages in each `low` run.) So at `aggregate-usage.sh:298`
(`skill: ((.attributionSkill // "<none>") …)`) the rows key on `code-review`,
never `<none>`.

**Inferred** (read off the code at `:613-626`, not run end-to-end): `by_phase` is
seeded with seven named phases and then `reduce`d over `by_skill`, so `code-review`
is added as an **eighth, new** key — distinct from the existing `code-review-fix`
seed and distinct from `<none>`. Expect the token-audit report to grow a
`code-review` phase line that did not exist before. That is the opposite of
clarification 23's concern: the nested run is *better* attributed than the review
worker's own turns, not worse.

### 5.3 Node attribution also works

**Directly observed.** The nested session gets its own
`<sid>.dispatch-stamp.json` sidecar, carrying the node id:

```json
{"schema":1,"session_id":"67bd706c-…","repo":"natb1/commons.systems","issue":null,
 "pr":null,"branch":"tactic-review-code-review-invocation-contract",
 "base_sha":"e8b5da60…","node_id":"tactic-review-code-review-invocation-contract",
 "stamped_at":"2026-07-31T21:33:03Z"}
```

so `by_node` (`aggregate-usage.sh` `$rows[] | select(.artifact.node_id != null)`)
folds it onto the right node. No attribution gap.

### 5.4 What it costs

`price_proxy_usd` computed with `price-model.json`
(input 15 / cacheCreation 18.75 / cacheRead 1.5 / output 75 per Mtok — the uniform
Opus-list ranking proxy, **not** the bill). All runs used `claude-opus-5`.

| run | turns | cache_read | output | **price proxy** |
|---|---:|---:|---:|---:|
| `max`, empty diff | 32 | 1.36 M | 8 057 | **$6.59** |
| `max`, real diff, **killed at 39 m** | 1 091 | 117.2 M | 585 961 | **$371.54** |
| `low`, real diff (×3) | 4–8 | — | — | **$1.40 – $1.77 each** |

The `max` real-diff figure is the headline number: **~$372 of Opus-list-proxy
spend, producing zero bytes of output**, because the run was still going when it
hit the wall. Even a completed `max` run of that shape would be a ~$370 line item
per review pass — roughly 200× a `low` run and far above anything else in the
dispatch budget.

`strategy-token-economy` reading: the attributability problem (condition 2) is
**solved** by this entry point — skill and node attribution both work. The
*magnitude* problem is created by it. Do not adopt `max` for the dispatch lane on
the strength of this record; treat effort level as an open cost decision, and
re-measure with `/dispatch-token-audit` after the first real passes.

---

## 6. Session-registry interference — none

Checked with `dangerouslyDisableSandbox: true` throughout (a sandboxed
`claude agents --json` silently returns `[]`).

**While a nested `-p` run was live**, `claude agents --json` showed a new row:

```json
{ "pid": 2318150,
  "cwd": "/home/n8/…/worktrees/tactic-review-code-review-invocation-contract",
  "kind": "interactive",
  "sessionId": "379ed29f-…",
  "name": "tactic-review-code-review-invocation-con-0f" }
```

Confirmed to be the nested process:
`ps -p 2318150` → `claude -p /code-review max c06c7295~1..c06c7295 --permission-mode acceptEdits`.

Two different helpers in
`.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh` see it differently:

- **`worktree_has_live_session` — does NOT see it.** It matches the session
  **name** *exactly* against the worktree basename. The nested run is auto-named
  `tactic-review-code-review-invocation-con-0f` (basename truncated to 40 chars +
  a hash suffix), which never equals
  `tactic-review-code-review-invocation-contract`. **No false occupancy claim.**
  (The predicate did return OCCUPIED during the run — but on the *real* worker
  session's own row, which is correct and would be true regardless.)
- **`claude_sessions_under` (cwd-keyed) — DOES see it**, and so does
  `dispatch-sweep`'s `node_cwd_has_live_session` (`dispatch-sweep:312-318`), which
  treats any session resident in the worktree as occupancy. This is harmless: it
  only ever makes the sweep *more* conservative, and the worktree is already
  occupied by the review worker itself for the whole duration.

**After the runs exited**, both views are clean — no residue, no leaked claim:

```
--- ACTIVE sessions under this worktree (claude_sessions_under) ---
(empty)
--- REGISTERED rows (claude agents --json --all) matching this node ---
49fdd91e-…  busy  tactic-review-code-review-invocation-contract  working   ← the real worker only
```

The nested session does **not** persist in the registered view, so it cannot block
a later worker spawn into the worktree.

---

## 7. Duration

| run | effort | diff | wall clock | outcome |
|---|---|---|---|---|
| `/code-review max` | max | empty | **115 s** | exit 0 |
| `/code-review max <sha>~1..<sha>` | max | real (one commit) | **>2363 s (>39 m)** | killed, **0 bytes output** |
| `/code-review low --fix --comment` | low | real (1 file, 3 defects) | **14 s** | exit 0 |
| `/code-review low --fix` | low | real (1 file, 4 defects) | **27 s** | exit 0 |
| `/code-review low --fix` (no perm flag) | low | real (1 file, 4 defects) | **30 s** | exit 0 |

The `max` real-diff number is a **lower bound** — the run had not finished.

Implication restated because it invalidates a planned constant: a synchronous
`max` invocation **cannot** be wrapped in a single Bash tool call
(600 000 ms cap), and `DISPATCH_CODE_REVIEW_TIMEOUT:-540` is not a workable
default for `max`. `low` fits comfortably; the untested middle (`medium`, `high`,
`xhigh`) is where the usable operating point probably sits and should be measured
before Unit 2 hardcodes anything.

---

## 8. Verbatim unavailability strings

Only one was inducible without breaking the CLI. Recorded exactly.

```
$ claude -p '/code-review-nope max'
```

- exit **0** (note: **zero**, not non-zero), wall clock **1 s**
- stdout, complete and verbatim (verified with `cat -A`, single line, trailing
  newline only):

```
Unknown command: /code-review-nope
```

**This differs from what the plan predicted.** The plan's Unit 2 reject-pattern
list says `Unknown slash command`; the CLI actually emits `Unknown command: ` and
**echoes the command name back**. A literal-string match on the plan's text would
never fire.

Reject patterns for Unit 2, corrected:

- `^Unknown command: ` — prefix match only; the rest of the line is the
  caller-supplied command name, so never match the whole line.
- `cannot be used with Skill tool due to disable-model-invocation` — the four-day
  silent-substitution signature. **Not reproducible via this entry point** (that is
  the whole point of the change), but it must stay in the pattern list as a
  regression guard, and Unit 2's test suite must exercise it with a stub.
- `use /review for a local review instead` — present as a literal in the 2.1.220
  binary (per the node's Context section); **not observed at runtime here**, kept
  on the strength of that.

Also note, for the exit-code design: a rejected/unknown command exits **0**. Exit
status alone is never sufficient to detect unavailability — Unit 2's step-5
"exit status *plus* output signature" verification is load-bearing, not belt-and-braces.

---

## Verdict

**Unit 1: PASS — entry point verified.**

`claude -p '/code-review <effort> [--fix] [--comment] [<target>]'` is a working,
reachable entry point for the built-in code-review skill from a headless dispatch
worker. It runs, it is never rejected with `disable-model-invocation`, it returns
real findings as text, `--fix` mechanically writes the working tree, and
`--comment` resolves the PR from the branch. Session-registry interference: none.
Attribution: `code-review` skill bucket plus correct `node_id`, not `<none>`.

Four things Units 2-4 must absorb before they are implemented:

1. **`max` does not fit a synchronous call** (§1.2, §7). Redesign the invocation as
   detached-with-resume, or pick a lower effort level. `>39 min` and `540 s` are
   irreconcilable.
2. **A killed run returns zero bytes** (§1.2). Timeout is total loss of a
   very expensive run, not a degraded result.
3. **Output shape is not stable across runs** (§1.3). Unit 4's structuring prompt
   must parse free-form prose keyed on `path:line`, not a fixed format.
4. **`max` costs ~$372 of price proxy per real-diff pass** (§5.4). Attribution is
   fixed by this change; magnitude is created by it. Effort level is an open cost
   decision, not a settled one.
