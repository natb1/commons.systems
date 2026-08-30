---
id: tactic-graph-commit-invocation-classifier-bypass
kind: tactic
statement: Add the two main-landing graph-write scripts (graph-commit,
  land-align-round) to static permissions.allow in one canonical repo-relative
  -C spelling, normalize the single non-canonical call site onto it, and pin
  both with a CI regression test, so the auto-mode classifier never false-denies
  a graph write.
owner: ai
status: codified
parent: null
rationale: "Surfaced live in a 2026-07-21 office-hours drain: invoking
  graph-commit from a worktree, a `cd <wt> && ./...graph-commit` one-line
  compound was firmly denied by the auto-mode classifier ('Blocked by
  classifier'), and even the bare invocation drew transient 'Stage 2 classifier
  error' denials that cleared only on retry. Friction on the only path that
  lands graph edits on main, directly against strategy-owned-orchestration's
  wrapper-to-matcher doctrine. The author-recorded design had two halves; half
  (a), the `-C <path>` / `--repo <path>` flag, LANDED with the blocked_by
  dependency tactic-graph-commit-cwd-repo-resolution (phase done, PR #2938,
  merged 2026-07-25), so this node's remaining scope is the allowlist half (b)
  plus the call-site normalization and doctrine note that make the static entry
  actually match: no graph-commit code change."
reading: null
serves:
  - strategy-owned-orchestration
recovers: []
clarifications:
  - question: How much of the recorded two-part classifier-bypass design is still
      open, and does any graph-commit code change remain in scope?
    answer: "(Recorded 2026-08-20 /align-tactics per-node finalize.) Part (a), the
      `-C <path>` / `--repo <path>` flag on graph-commit, has LANDED -
      tactic-graph-commit-cwd-repo-resolution is status codified / phase done
      (PR #2938, merged 2026-07-25), and the flag is implemented and documented
      at packages/intentionsutil/scripts/graph-commit:32-40 and
      :3655,:3676-3678, resolving the repo root via `git rev-parse
      --show-toplevel` from `-C`/`--repo` (else cwd), never from the script's
      own location. Part (b), the static permissions.allow entry, is still open:
      a grep of .claude/settings.json and .claude/settings.local.json returns
      zero matches for `graph-commit` or `land-align-round`. The remaining scope
      of this tactic is therefore allowlist-only - confirm the sanctioned
      invocation forms and add the settings entries; no graph-commit code change
      is required."
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: pr15-graph-commit-simplification
  pr: 3136
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-29T23:45:52Z
    mergeCommitSha: a4a964b8e80bcac307d089b001a5419b1ed46fd8
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by:
  - tactic-graph-commit-cwd-repo-resolution
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# graph-commit invocation: matcher-shaped and classifier-exempt

## Context

Two distinct approval gates sit in front of every Bash command, and the recorded
wrapper-to-matcher doctrine (`strategy-owned-orchestration`, clarification "Why do
wrapper scripts exist where a plain command would do?") only addresses the first:

1. **The static `allowedTools` prefix matcher** — pattern-matches from the start of
   the literal command string. `cd <path> && <cmd>` breaks its prefix match;
   `git -C` and `--prefix`/`--root` flags preserve it. Existing doctrine, recorded at
   `.claude/rules/sandbox.md` ("Command pattern matching" → "Avoid `cd && command`
   for write/execute commands").
2. **The auto-mode permission classifier** — a separate, probabilistic gate that
   fires when no static `permissions.allow` rule matches. It produced the live
   failures observed in a 2026-07-21 office-hours drain: a
   `cd <wt> && ./…graph-commit` compound was firmly denied ("Blocked by
   classifier"), and even the bare invocation drew transient "Stage 2 classifier
   error" denials that cleared only on retry.

`graph-commit` (`packages/intentionsutil/scripts/graph-commit`) is the sole path
that lands graph edits on `origin/main`, and `land-align-round`
(`packages/intentionsutil/scripts/land-align-round`) is its sanctioned wrapper for
`/align-tactics` rounds. Having either blocked or round-tripped by a probabilistic
gate is friction on the most load-bearing tool in the dispatch loop.

### What already landed, and what is actually left

The original draft framed this as a two-part design: (a) give `graph-commit` a
`-C <path>` / `--repo <path>` flag so directory context is never a `cd &&`
compound, and (b) add `graph-commit` to static `permissions.allow`.

**Half (a) is done.** The `blocked_by` dependency
`tactic-graph-commit-cwd-repo-resolution` (status `codified`, phase `done`) landed
the flag: `packages/intentionsutil/scripts/graph-commit:3655` parses
`-C|--repo) REPO_ARG="$2"; shift 2`, and `:3676-3678` resolves
`RESOLVE_FROM="${REPO_ARG:-$(pwd)}"` then
`git -C "$RESOLVE_FROM" rev-parse --show-toplevel` — never the script's own
location. The usage block documents it at `:32-40`
(`graph-commit -C /path/to/worktree -m 'graph: land edit' tactic-foo`), and
`.claude/rules/sandbox.md:174-181` already records `-C` as the canonical spelling
and *requires* it. **No graph-commit code change is in scope.**

**Half (b) is not done.** `grep` for `graph-commit` and `land-align-round` across
`.claude/settings.json` returns zero hits — no static allow entry exists in any
form. Every agent-typed graph write is still resolved by the classifier.

### The design constraint that decides the spelling

The `.claude/hooks/approve-workflow-commands.sh` PreToolUse hook *does* already
approve some commands, and `is_allowed_cmd()` (`:118-131`) matches either
`SCRIPT_RE` (`.claude/skills/*/scripts/*` only — `graph-commit` lives under
`packages/`, so it never matches) or `basename(token)`/exact-token equality against
`ALLOWED_CMDS` harvested from single-word `Bash(<cmd>:*)` settings entries
(`:49-62`). That basename fallback makes a bare `Bash(graph-commit:*)` entry
tempting, because it would approve the script under any path prefix.

**A hook `allow` is not the lever here.** Per the recorded finding
`auto-mode-classifier-permissions-allow`: in `auto` permission mode the decision
order resolves a matching **static `permissions.allow` rule at step 1, never
reaching the classifier**, while a PreToolUse hook `allow` apparently does *not*
register as a step-1 settings allow — `approve-workflow-commands.sh` already
approves `.claude/skills/*/scripts/*` and the classifier stop persisted anyway.

So the entry must be spelled as a **prefix of the literal command string as the
agent types it**, not as a basename the hook would resolve. That forces one
canonical agent-typed spelling per script, and every agent-typed call site must be
normalized onto it. Today the corpus is nearly there already: 19 of 20 documented
call sites use the repo-relative form (e.g. `.claude/skills/align/SKILL.md:584`,
`.claude/skills/align-tactics/references/write-path.md:205,213`,
`.claude/skills/fix-checks/SKILL.md:174,201,715,742,798`,
`.claude/skills/dispatch-conflict/SKILL.md:640,724`), and **zero** agent-facing docs
instruct a `cd && graph-commit` compound (the two cd-compound sites,
`graph-select-target:524,656` and `dispatch-invalid-state-followup:390,459`, are
*inside* scripts and never reach the permission gate). One site is the exception:
`.claude/skills/dispatch-conflict/SKILL.md:1395` tells the agent to type
`"$PROJECT_ROOT/packages/intentionsutil/scripts/graph-commit" -C "$PROJECT_ROOT" …`,
whose literal string starts with `"$PROJECT_ROOT/` and can never be prefix-matched
by a path-form rule.

### Intended outcome

One canonical, matcher-shaped agent-typed spelling for each of the two
main-landing scripts — the repo-relative path with an explicit `-C <path>` — backed
by static `permissions.allow` entries so no real call falls through to the
classifier, a doctrine note so the reasoning survives, and a CI-enforced regression
test so the entries cannot silently disappear.

### Tradeoff (author-accepted 2026-07-21)

Static-allowing `graph-commit` removes per-call classifier gating on the only
main-landing path. Accepted deliberately: the sanctioned write path should not
depend on a probabilistic gate's judgment. Its safety comes from `graph-commit`'s
own machinery — compare-and-swap (`--base`), bounded rebase-retry, the landing lock
— not from per-call approval. This is recorded as a clarification on
`strategy-owned-orchestration` (clarification 5), not left implicit here.

### Execution caveats (carry into every unit)

- **`.claude/settings.json` is itself a protected path.** `permissions.allow` does
  not pre-approve protected-path writes, so the Unit 1 edit still routes through
  the classifier, and per `dispatch-hooks-edit-blocked-automode` a *subagent* edit
  to agent-loaded config is blocked outright while the same edit from the
  orchestrator thread goes through. **Apply Unit 1's edit in the orchestrator
  thread — do not delegate it to an implementation subagent.** If a main-thread
  edit is also blocked, that is a hard stop: park to office-hours rather than
  hunting for a third route.
- Static rules pinned to a specific script path survive entry into `auto` mode;
  only blanket rules (`Bash(*)`, wildcarded interpreters, package-manager run
  commands) are dropped. Both new entries are path-pinned, so no wildcard-prefixed
  spelling (e.g. `Bash(*/packages/.../graph-commit:*)`) is used or needed.
- Repo convention for a script allow entry is colon-star `Bash(<path>:*)`, not
  space-star: the hook's own parser skips any entry containing a space
  (`approve-workflow-commands.sh:59`).
- The static matcher does naive quote-tracking across newlines
  (`.claude/rules/sandbox.md`, "Avoid double quotes spanning newlines"). Keep any
  `-m "graph: …"` message on one physical line in the invocations these units
  touch.

## Unit 1 — Add the static `permissions.allow` entries

**Scope.** Edit `.claude/settings.json` only. Insert two entries into the
`permissions.allow` array, in the existing script-path block (after
`"Bash(.github/scripts/check-type-safety-escapes.sh:*)"` at `:56`, before
`"Bash(gh search:*)"` at `:57`), matching the surrounding
`Bash(<relative-script-path>:*)` idiom used by
`"Bash(.claude/skills/dispatch-propagate/scripts/dispatch-mark-complete:*)"`
(`:42`):

```
"Bash(packages/intentionsutil/scripts/graph-commit:*)",
"Bash(packages/intentionsutil/scripts/land-align-round:*)",
```

Exact spelling matters: no leading `./`, no trailing slash, colon-star suffix, no
spaces inside the parentheses. The file must remain valid JSON with the repo's
existing 2-space indentation and trailing-comma-free array style.

Apply this edit in the orchestrator thread (see "Execution caveats"), then commit
through the normal path.

**Out of scope.** No bare-basename entry (`Bash(graph-commit:*)`) — it would only
satisfy the hook's `basename()` fallback, which does not bypass the classifier, and
it would loosen hook approval to any file named `graph-commit` at any path. No
entries for the sibling graph primitives `park-node`, `clear-park`,
`mark-node-terminal`, `write-node.ts`, or `dump-node.ts` — they carry the same
exposure and the same idiom applies, but each is a separate deliberate permission
grant and belongs to its own tactic. No `.claude/settings.local.json` change (it is
a `/dev/null` overlay under the sandbox and is skipped by the hook's `[ -f ]`
test).

**Recommended model.** sonnet.

## Unit 2 — Normalize the one non-canonical agent-typed call site

**Scope.** Edit `.claude/skills/dispatch-conflict/SKILL.md:1395-1396` only. Replace

```bash
"$PROJECT_ROOT/packages/intentionsutil/scripts/graph-commit" -C "$PROJECT_ROOT" \
  -m "<message>" "$SOURCE_ID"
```

with the canonical relative-prefix form, which is what the Unit 1 rule
prefix-matches:

```bash
packages/intentionsutil/scripts/graph-commit -C "$PROJECT_ROOT" \
  -m "<message>" "$SOURCE_ID"
```

Semantics are unchanged in the way that matters: `graph-commit` resolves the target
repo from `-C`/`--repo` and never from its own on-disk location
(`packages/intentionsutil/scripts/graph-commit:3676-3678`), so the Lane 3 write
still lands in `$PROJECT_ROOT`'s checkout. The only difference is *which copy of
the script binary* runs — the session's own worktree copy rather than
`$PROJECT_ROOT`'s. Add a one-sentence note immediately under the code block
recording that, so a future reader does not "restore" the absolute form:

> The relative prefix (not `"$PROJECT_ROOT/…"`) is deliberate — it is the spelling
> `.claude/settings.json`'s `permissions.allow` entry prefix-matches, which is what
> keeps this call off the auto-mode classifier. `-C "$PROJECT_ROOT"` still points
> the write at the main checkout; `graph-commit` never infers the repo from its own
> location.

Then re-grep the skills tree to confirm no other agent-typed invocation carries a
variable or absolute prefix — the ## Verification fence below does this
mechanically.

**Out of scope.** The internal, script-to-script `cd`-compound calls in
`.claude/skills/dispatch-propagate/scripts/graph-select-target:524,656` and
`.claude/skills/dispatch-propagate/scripts/dispatch-invalid-state-followup:390,459`
— those run inside already-approved scripts and never reach the permission gate;
rewriting them is churn with no gate benefit. The sibling-relative `-C` calls
inside `park-node:424`, `clear-park:422`, and
`.claude/skills/dispatch-propagate/scripts/transition-node:230` — same reason.
Adding a `-C`/`--repo` pass-through to `land-align-round` — its parser
(`land-align-round:141-159`) rejects any unrecognized `-`-prefixed flag at `:154`
and assembles `GC_ARGS` from only `--base`, `-m`, and the trailing ids
(`:196-199`), so no pass-through exists today; every current caller runs from
inside the target checkout, so none is needed. If a future caller needs it, that is
new scope.

**Recommended model.** sonnet.

**Dependencies.** Unit 1 (the doc note asserts the allow entry exists).

## Unit 3 — Record the two-gate doctrine in the sandbox rule

**Scope.** Edit `.claude/rules/sandbox.md` only, in the "Command pattern matching"
section, extending the existing `graph-commit` paragraph at `:174-181` (which today
covers only the `git -C` refusal and the `-C` requirement). Add, in that section:

- The two gates are distinct: the static `allowedTools` prefix matcher, and the
  auto-mode permission classifier that fires when no static rule matches. Shaping a
  command to the matcher (`-C` over `cd &&`, no inline `VAR=` prefixes) is
  necessary but not sufficient; only a static `permissions.allow` rule resolves at
  step 1 and skips the classifier. A PreToolUse hook `allow` — including
  `approve-workflow-commands.sh`'s own approvals — does not.
- Consequence: an allow rule must be a prefix of the **literal command string as
  typed**, so each sanctioned script has exactly one canonical agent-typed
  spelling. For the graph write path that spelling is
  `packages/intentionsutil/scripts/graph-commit -C <path> …` and
  `packages/intentionsutil/scripts/land-align-round --terminal <id> …` — repo-
  relative, never `"$VAR/…"`, never an absolute path, never a `cd &&` compound.
  Both are in `permissions.allow`; changing the spelling at a call site silently
  re-exposes it to the classifier.
- The 2026-07-21 evidence, one line: a `cd <wt> && ./…graph-commit` compound was
  firmly denied ("Blocked by classifier") and bare invocations drew transient
  "Stage 2 classifier error" denials.
- The accepted tradeoff, one line: the static allow removes per-call classifier
  gating on the sole main-landing path; safety comes from `graph-commit`'s own
  `--base` compare-and-swap, bounded rebase-retry, and landing lock.

Keep it terse and in the file's existing voice. Do not restate the `-C` contract
already at `:174-181`; extend it.

**Out of scope.** `.claude/rules/planning.md`, `.claude/skills/*/SKILL.md` prose
other than Unit 2's note, and any change to the `git -C` refusal text.

**Recommended model.** sonnet.

**Dependencies.** Unit 1.

## Unit 4 — CI regression test pinning the entries and the spelling

**Scope.** Add cases to `.claude/hooks/test-approve-workflow-commands.sh` (an
existing bash suite, already wired into CI at
`.github/workflows/unit-tests.yml:232`). Use the file's existing helpers
`assert_approves` / `assert_passthrough` (`:14-41`); add the cases in the
"Approval cases" region alongside the other allowlist assertions, under a comment
header naming this tactic.

Why this is a real ratchet and not a proxy: `graph-commit` is **not** under
`.claude/skills/*/scripts/`, so `SCRIPT_RE` (`approve-workflow-commands.sh:26`)
never matches it. The hook can only approve it via `ALLOWED_CMDS`, which is
harvested from `.claude/settings.json`'s `Bash(<cmd>:*)` entries at `:49-62`. So an
`assert_approves` on the canonical string passes **only while Unit 1's entry exists
and is spelled without spaces**. Deleting or re-spelling the entry turns the suite
red.

Cases to add:

1. `assert_approves` — "graph-commit canonical relative form (settings entry
   present)", command
   `packages/intentionsutil/scripts/graph-commit -C /tmp/x -m 'graph: land edit' tactic-foo`
2. `assert_approves` — "land-align-round canonical relative form", command
   `packages/intentionsutil/scripts/land-align-round --terminal tactic-foo -m 'graph: land round' tactic-foo`
3. `assert_passthrough` — "cd-compound graph-commit is not approved (2026-07-21
   classifier denial)", command
   `cd /tmp/x && packages/intentionsutil/scripts/graph-commit -m 'graph: x' tactic-foo`
   — deterministic: `cd` is not in `ALLOWED_CMDS`, so `validate_segments`
   (`:208-224`) rejects the first segment.
4. `assert_passthrough` — "absolute-path graph-commit is deliberately not the
   sanctioned spelling", command
   `/repo/packages/intentionsutil/scripts/graph-commit -C /repo -m 'graph: x' tactic-foo`
   — also deterministic: `is_allowed_cmd` compares `basename` (`graph-commit`) and
   the exact token against the path-form entry, and neither equals it. This case is
   the executable record of the Unit 1 "no bare-basename entry" decision; if a
   future change adds `Bash(graph-commit:*)`, this test goes red and forces the
   decision to be re-made deliberately.

Each case needs a one-line comment stating *why* it is asserted, in the style of
the existing "Command-separator bypass regressions" block (`:349-352`).

**Out of scope.** Any change to `approve-workflow-commands.sh` itself — the fix is
a settings entry, not hook code (`is_allowed_cmd` at `:118-131` already does
everything needed, and `is_allowed_git_c` at `:87-99` hard-requires
`argv[0] == "git"`, so it can never be the mechanism for `graph-commit`; do not
extend it). No new test file and no new CI job — reuse the wired suite.

**Recommended model.** sonnet.

**Dependencies.** Unit 1 (cases 1–2 fail without it).

## Reuse

- `packages/intentionsutil/scripts/graph-commit:32-40` (usage block) and `:3649-3681`
  (`-C|--repo` parse, `RESOLVE_FROM`/`REPO_ROOT` resolution) — the `-C` flag this
  tactic's design called for, already implemented. Consume it; change no code here.
- `.claude/settings.json:37-56` — the existing `Bash(<relative-script-path>:*)`
  entries (e.g. `dispatch-mark-complete` at `:42`,
  `.github/scripts/check-type-safety-escapes.sh` at `:56`, the only current
  precedent for a script outside `.claude/skills/*/scripts/`). Reuse the exact
  idiom; do not invent a new pattern shape.
- `.claude/hooks/approve-workflow-commands.sh:26` (`SCRIPT_RE`), `:49-62`
  (`ALLOWED_CMDS` harvest), `:118-131` (`is_allowed_cmd`), `:208-224`
  (`validate_segments`) — the mechanics the Unit 4 assertions depend on. Read, do
  not modify.
- `.claude/hooks/test-approve-workflow-commands.sh:14-41` (`assert_approves`,
  `assert_passthrough`, `assert_passthrough_raw`) and its
  "Command-separator bypass regressions" block at `:349-352` — helpers and comment
  style for Unit 4.
- `.claude/rules/sandbox.md:174-181` — the existing canonical `graph-commit -C`
  paragraph Unit 3 extends rather than duplicates.
- `.claude/skills/align/SKILL.md:584`,
  `.claude/skills/align-tactics/references/write-path.md:65,205,213` — the
  already-canonical agent-typed forms; they need no edit and are the reference for
  the spelling Unit 1's rule must match.

## Verification

Run all fences from the repo/worktree root.

The static `permissions.allow` entries exist, are exactly spelled, and the file is
still valid JSON:

```verify
jq -e '.permissions.allow | (index("Bash(packages/intentionsutil/scripts/graph-commit:*)") != null) and (index("Bash(packages/intentionsutil/scripts/land-align-round:*)") != null)' .claude/settings.json
```

The hook suite — which is red unless the entries above exist and are space-free,
and which pins the cd-compound and absolute-path spellings as unapproved:

```verify
.claude/hooks/test-approve-workflow-commands.sh
```

No agent-typed invocation carries a variable or absolute prefix any more (positive
assertion first so a line-wrap cannot make this fence vacuous):

```verify
test -f .claude/skills/dispatch-conflict/SKILL.md || { echo "FAIL: dispatch-conflict/SKILL.md missing"; exit 1; }
canon=$(LC_ALL=C git grep -an 'packages/intentionsutil/scripts/graph-commit -C "\$PROJECT_ROOT"' -- .claude/skills/dispatch-conflict/SKILL.md); rc=$?
[ "$rc" -le 1 ] || { echo "FAIL: git grep errored (rc=$rc)"; exit 1; }
[ -n "$canon" ] || { echo "FAIL: canonical relative graph-commit form missing from dispatch-conflict Lane 3"; exit 1; }
printf '%s\n' "$canon"
bad=$(LC_ALL=C git grep -an 'PROJECT_ROOT/packages/intentionsutil/scripts/graph-commit' -- .claude/skills); rc=$?
[ "$rc" -le 1 ] || { echo "FAIL: git grep errored (rc=$rc)"; exit 1; }
[ -z "$bad" ] || { printf '%s\n' "$bad"; echo "FAIL: variable-prefixed graph-commit invocation still present"; exit 1; }
echo OK
```

No agent-facing doc instructs a `cd`-compound graph write:

```verify
bad=$(LC_ALL=C git grep -anE 'cd [^&|;]*&&[^&|;]*(graph-commit|land-align-round)' -- '.claude/skills/*.md' '.claude/rules/*.md'); rc=$?
[ "$rc" -le 1 ] || { echo "FAIL: git grep errored (rc=$rc)"; exit 1; }
[ -z "$bad" ] || { printf '%s\n' "$bad"; echo "FAIL: cd-compound graph write in agent-facing prose"; exit 1; }
echo OK
```

Prose-rule lint over the net-new shell lines added in Unit 4:

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

**Manual / observe-in-production.** The static matcher and the auto-mode classifier
are harness-internal and have no programmatic probe; the fences above prove the
entry exists and is matcher-shaped, not that the harness honored it. Confirm the
end-to-end effect by observation, in an `auto`-mode session:

1. From a worktree, run a real graph write in the canonical form —
   `packages/intentionsutil/scripts/graph-commit -C <abs repo root> -m 'graph: …' <id>`
   — and confirm it runs with **no** permission prompt, no "Blocked by classifier",
   and no "Stage 2 classifier error" retry. A single clean run is the signal; a
   transient Stage-2 error means the rule did not resolve at step 1 and the
   spelling needs re-checking against the literal typed string.
2. Do the same for a `/align-tactics` round's terminal call through
   `packages/intentionsutil/scripts/land-align-round --terminal <id> …`.
3. Judgment call for the implementer: if the settings edit itself is blocked from
   the orchestrator thread (not just from a subagent), stop and park to
   office-hours per the "Execution caveats" note — do not route around it.

## What shipped — 2026-08-29, all four units

Landed in #3136 (merge commit `a4a964b8`), Position 2 of the dispatch/RSI
serialized window.

- **U1 — static allow entries.** `.claude/settings.json` carries
  `"Bash(packages/intentionsutil/scripts/graph-commit:*)"` and
  `"Bash(packages/intentionsutil/scripts/land-align-round:*)"`. No
  bare-basename entry was added, and `.claude/settings.local.json` is
  untouched — both out-of-scope constraints honored.
- **U2 — call-site normalization.** `.claude/skills/dispatch-conflict/SKILL.md`
  now uses the canonical repo-relative form with `-C "$PROJECT_ROOT"`, and
  carries the "the relative prefix is deliberate" note directly beneath the
  block. A repo-wide grep for the old `"$PROJECT_ROOT/packages/…"` spelling
  returns no matches.
- **U3 — two-gate doctrine.** `.claude/rules/sandbox.md` records all four
  required points: the two distinct approval gates, that a PreToolUse hook
  `allow` does *not* resolve at step 1, the literal-prefix consequence with both
  canonical spellings, and the 2026-07-21 evidence plus the accepted tradeoff.
  It extends the existing `-C` contract rather than duplicating it.
- **U4 — regression cases.** Four cases added to
  `.claude/hooks/test-approve-workflow-commands.sh` (two `assert_approves`, two
  `assert_passthrough`), each with a why-comment.
  `approve-workflow-commands.sh` itself is unchanged.

### Corrections to this node's own text

- The frontmatter clarification calls the remaining scope "allowlist-only".
  That understates it: the body scoped four units and all four shipped,
  including two documentation surfaces.
- The body says "19 of 20 documented call sites use the repo-relative form."
  After U2 it is **20 of 20**.
- Every line anchor in this node has drifted (`.claude/settings.json:56/:57`,
  `.claude/rules/sandbox.md:174-181`). Locate by symbol or heading, not ordinal.
- The "Execution caveats" hard-stop — park if the orchestrator-thread settings
  edit is blocked — never fired; the edit landed normally.

**Verification:** `test-approve-workflow-commands.sh` 71/71; `run-lint.sh` all
checks pass. Note that this node's own closing write is the first `graph-commit`
invocation to run under the new static allow entry, so that run is itself the
first live exercise of the bypass this tactic existed to remove.
