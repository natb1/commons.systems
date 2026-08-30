---
id: tactic-park-node-clear-park-base-pin-dedup
kind: tactic
statement: park-node, clear-park and release-wait carry three code-identical
  --base pin-resolution blocks (manifest-file branch, <id>=<sha> pair branch,
  bare-sha branch, 40-hex validation, and the BASE_SUPPLIED empty-value guard)
  that have already drifted — the empty-value guard had to be hand-applied to
  two call sites in one PR, and release-wait landed afterward as a third copy
  the original finding never named — so extract one sourced bash helper
  (lib-base-pin.sh) all three call, behaviour-preserving, with a harness case
  that fails if a fourth inline copy is ever added
owner: ai
status: codified
parent: null
rationale: null
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
  branch: pr16-node-mutation-scripts
  pr: 3138
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-30T00:43:02Z
    mergeCommitSha: 96d22cb13f56d4240305033b9ad9af76009f9ceb
    graphCommitSha: null
  lane_pass: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# park-node, clear-park and release-wait carry three code-identical `--base` pin-resolution blocks (manifest-file branch, `<id>=<sha>` pair branch, bare-sha branch, 40-hex validation, `BASE_SUPPLIED` empty-value guard) that have already drifted — extract one sourced bash helper all three call

## Context

Three sibling scripts in `packages/intentionsutil/scripts/` implement the
diagnosis-time compare-and-swap contract documented in
`.claude/skills/ref-diagnosis-time-cas/SKILL.md`: `park-node`, `clear-park`
and `release-wait`. Each accepts `--base` in the same three forms (a bare
40-hex blob sha, an `<id>=<sha>` pair whose id must match the invocation's
node id, or a path to a `dump-node.ts` base-manifest file), resolves it to
`PINNED_BASE` before any network call, and later refuses with exit 3
(`stale-diagnosis`) when the pin no longer matches the freshly-read
`origin/main` blob.

Each of the three carries its own ~36-line copy of that resolver, and its own
4-line copy of the stale-diagnosis comparison.

**Why now.** The copies have already drifted, in both the way the finding
predicted and one it did not:

- *In spirit (recorded):* the `BASE_SUPPLIED` empty-value guard — which makes
  `--base ''` a usage error rather than a silent degradation to an unpinned
  write — had to be hand-applied to two call sites in one PR (#2988).
- *In fact (measured 2026-08-20, not in the original finding):* `release-wait`
  is a **third** copy, and it already differs from the pair in three ways: its
  id variable is `WAIT_ID` rather than `NODE_ID`, its `--base` case arms are
  compressed one-line `shift 2` arms rather than the pair's multi-line
  leading-flags-only arms, and its stale-diagnosis remediation sentence differs
  ("Re-enumerate the due waits…" vs "Re-read the node, re-decide the
  disposition…").

This also violates the norm the same change set states for `graph-commit`,
whose own comment (`packages/intentionsutil/scripts/graph-commit:665-669`)
explains that its blob-pair target array "is passed BY NAME and bound with a
bash nameref … so `--base` and `--expect` share one parser instead of
maintaining two copies that can drift."

**Intended outcome.** One sourced helper file,
`packages/intentionsutil/scripts/lib-base-pin.sh`, owning both halves of the
pin contract (resolution and the stale comparison), sourced by all three
scripts, with every observable CLI behaviour — accepted forms, exit codes,
and stderr text including the machine-greppable `stale-diagnosis` marker —
byte-preserved. Plus a harness case that fails if a fourth inline copy is ever
added.

**Design posture (greenfield = brownfield here).** The ideal design for three
scripts sharing one contract is one sourced bash library with a documented
function contract; there is no migration cost worth trading against, because
the three call sites are code-identical today and the change is behaviour-
preserving. No brownfield path is proposed — the greenfield shape ships
directly.

## Provenance

- **Source:** review-fix pass on PR #2988 (`tactic-clear-park-repo-targeting-guard`),
  finding `residue-1` (code-review lens, residue phase), source PR #2988.
- **Adversarial verdict:** not independently verified by an adversarial
  skeptic — a Lane A (`code-review`) residue finding dispositioned `Deferred`
  by the residue phase without a separate verify pass. Its factual core has
  since been re-verified directly against `origin/main` 8788fd64 (2026-08-20)
  and is confirmed, with the scope correction to three call sites recorded
  above.
- **Stale anchors:** the original finding cited `clear-park:104`. That anchor
  is wrong today. All anchors in this plan were re-measured at 8788fd64.
  Anchors still shift as units land — **locate by symbol, never by line.**

## Measured current state (origin/main 8788fd64, 2026-08-20)

Resolver blocks (leading comment through the closing `fi`):

| script | flag-parse `--base` arms | resolver block | stale-diagnosis check |
|---|---|---|---|
| `packages/intentionsutil/scripts/park-node` | 129-136 (decls), 155-166 (arms) | **202-239** | **360-363** |
| `packages/intentionsutil/scripts/clear-park` | 125-132 (decls), 155-166 (arms) | **235-272** | **340-343** |
| `packages/intentionsutil/scripts/release-wait` | 93-97 (decls), 101-102 (arms) | **141-179** | **266-269** |

Verified this round:

- `park-node:203-240` and `clear-park:236-273` are **byte-identical** after
  substituting the script name (`diff` of the two ranges with the name
  normalised: no differences).
- `release-wait:142-179` is **identical on every code line** after
  substituting the script name and `WAIT_ID`→`NODE_ID` (only two comment lines
  differ: a reflow plus an extra "Same three accepted forms park-node takes.").
- Repo-wide, `BASE_SUPPLIED` appears in exactly these three scripts (plus graph
  node prose). There is no fourth copy.
- `resolve-park` has **no** `--base` today. The original finding called it "the
  obvious next copy if it ever gains a `--base`"; that remains hypothetical.
  **Do not add `--base` to `resolve-park` in this tactic.**
- `demote-node-to-implement` *passes* `--base` to `graph-commit`
  (`demote-node-to-implement:254`) but does not *accept* one. Out of scope.
- `graph-commit` has its own `add_blob_pair`/`parse_blob_arg`
  (`graph-commit:670-696`) over associative arrays keyed on many ids, with no
  40-hex validation and no single-id match check. That is a **different
  contract**. **Do not merge the two; do not touch `graph-commit` or
  `test-graph-commit.sh`.** This is the near-miss file.

## Scope decision: three call sites, not two

The extraction covers **all three** scripts. Reasons, recorded explicitly
because the node's original Provenance named only two:

1. `release-wait`'s resolver is code-identical to the pair, so leaving it out
   would preserve exactly the duplication this tactic exists to remove, and
   would leave the divergence already present (comment wording) unreconciled.
2. Its two genuine differences — the id variable name and the remediation
   sentence — are precisely why the helper's signature takes the node id and
   the remediation sentence as parameters rather than hardcoding either. Doing
   the two-site extraction first and retrofitting `release-wait` later would
   force a second signature change.
3. Its flag-parse *arms* stay untouched (see below), so the shape difference
   there costs nothing.

**Out of scope in every unit:** the flag-parse `case` arms themselves. A bash
function cannot consume and `shift` its caller's positional parameters without
a worse contract (returning a consumed-count for the caller to `shift` by), and
the three scripts' surrounding option sets genuinely differ (`--pr` on
park-node, `-C`/`--repo` on clear-park, `--now` on release-wait). The arms are
four lines each, contain no logic beyond assignment, and are not where the
drift happened. They stay at the call sites.

---

## Unit 1 — Create `lib-base-pin.sh` and convert `park-node` + `clear-park`

**Recommended model:** opus

### Scope

**New file:** `packages/intentionsutil/scripts/lib-base-pin.sh`

- `#!/usr/bin/env bash` shebang, a one-line purpose comment, no `set` line
  (the file is sourced, never executed — mirror
  `.claude/skills/dispatch-propagate/scripts/lib.sh:1-14`).
- **Not executable.** Do not `chmod +x` it and do not add it to any harness's
  `chmod +x` list — same treatment as `lib-store-at-ref.ts`.
- Two functions, each with a `# Args: … / Output: … / Returns: …` doc-comment
  block above it (the shape used by `resolve_issue_number` in
  `.claude/skills/dispatch-propagate/scripts/lib.sh:15`):

```bash
resolve_base_pin() { # <script-name> <node-id> <base-supplied> <base-arg>
  # Output (stdout): the resolved 40-hex blob sha, or EMPTY when
  #   <base-supplied> is 0.
  # Returns: 0 on success; 2 on any usage error, having already printed a
  #   "<script-name>: …" diagnostic to stderr.
}

assert_base_fresh() { # <script-name> <node-id> <pinned-base> <fresh-blob> <remediation>
  # Returns: 0 when <pinned-base> is empty or equals <fresh-blob>;
  #   3 on mismatch, having printed the stale-diagnosis line to stderr.
}
```

- `resolve_base_pin` must reproduce, in order and unchanged: the
  `BASE_SUPPLIED=1 && -z BASE_ARG` empty-value guard; the manifest-file branch
  (`[[ -f "$BASE_ARG" ]]`, the `while IFS= read -r line || [[ -n "$line" ]]`
  scan with the blank-line skip, `id`/`sha` split on the first `=`, the
  `manifest '…' has no entry for node id '…'` error); the inline `<id>=<sha>`
  branch with the id-mismatch error; the bare-sha fallback; and the trailing
  `^[0-9a-f]{40}$` validation with the `--base resolved to '…', not a full
  40-hex blob sha` error. **All four stderr strings keep their exact current
  wording**, with the script name supplied by parameter 1.
- Declare the block's scratch variables (`line`, `line_id`, `line_sha`,
  `pair_id`, `pair_sha`) `local`. They are globals today; no caller reads them
  (verified) — this is an intended tightening, not a behaviour change.
- Use `return`, never `exit`, inside both functions.
- `assert_base_fresh` prints exactly:
  `<script-name>: stale-diagnosis — intentions/<node-id>.md on origin/main is now <fresh-blob> but the pinned --base is <pinned-base>; the node changed between diagnosis and execution. <remediation> Nothing was written.`
  The `<remediation>` argument carries its own trailing period; the helper
  appends the literal ` Nothing was written.` The em dash and the
  `stale-diagnosis` token are load-bearing — the harnesses grep for
  `stale-diagnosis`, and `.claude/skills/ref-diagnosis-time-cas/SKILL.md`
  documents it as the stable machine-greppable marker.

**Edited:** `packages/intentionsutil/scripts/park-node`

- After the existing `SCRIPT_DIR` / `REPO_ROOT` / `STORE_MODULE` block
  (`park-node:117-120`), add a hard-failing source (clear error, no fallback —
  `.claude/rules/code-style.md`):

```bash
LIB_BASE_PIN="$SCRIPT_DIR/lib-base-pin.sh"
[[ -f "$LIB_BASE_PIN" ]] || { echo "park-node: missing required helper $LIB_BASE_PIN" >&2; exit 1; }
# shellcheck source=lib-base-pin.sh
source "$LIB_BASE_PIN"
```

  The same-directory `source=<filename>` directive form is correct here (as in
  `.claude/skills/dispatch-propagate/scripts/get-changed-apps.sh:9-14`), not
  `resolve-park`'s cross-directory `source=/dev/null` form.
- Replace the resolver block (`park-node:202-239`, comment through closing
  `fi`) with the leading comment retained plus:

```bash
PINNED_BASE="$(resolve_base_pin park-node "$NODE_ID" "$BASE_SUPPLIED" "$BASE_ARG")" || exit 2
```

- Replace the stale-diagnosis `if` (`park-node:360-363`) with a call, keeping
  the five-line explanatory comment above it verbatim (it describes
  park-node's own `MUTATED`/EXIT-trap ordering and does not belong in the lib):

```bash
assert_base_fresh park-node "$NODE_ID" "$PINNED_BASE" "$FRESH_BLOB" \
  "Re-read the node, re-decide the disposition, and retry with a freshly captured base." || exit 3
```

**Edited:** `packages/intentionsutil/scripts/clear-park` — identical treatment.
Source point goes after `STORE_MODULE` (`clear-park:117`); resolver block
`clear-park:235-272`; stale-diagnosis `clear-park:340-343`; same remediation
sentence as park-node.

**Edited:** `packages/intentionsutil/scripts/test-park-node.sh` — seed the new
lib into the scratch tree, copying the `lib-store-at-ref.ts` precedent exactly:

- a `LIB_BASE_PIN_SH="$HARNESS_DIR/lib-base-pin.sh"` declaration beside the
  other `*_SCRIPT` vars (near `:188`);
- an `[[ -f "$LIB_BASE_PIN_SH" ]] || { echo "error: …" >&2; exit 1; }` guard
  beside the others (near `:195`);
- a `cp "$LIB_BASE_PIN_SH" "$SEED/packages/intentionsutil/scripts/lib-base-pin.sh"`
  next to the `lib-store-at-ref.ts` cp (`:231`), with a one-line comment saying
  the sourced dependency travels with its consumers;
- **no** entry in the `chmod +x` list (`:232-238`).

`git -C "$SEED" add -A` at `:303` picks the new file up automatically, and
`make_clone` (`:308`) clones the scratch origin, so the lib reaches every clone
with no further change.

### Why the source resolution works in the harness

`run_pn`/`run_cp` invoke the scripts as `bash
packages/intentionsutil/scripts/park-node` from inside a clone
(`test-park-node.sh:612-651`), so `${BASH_SOURCE[0]}` is that relative path and
`SCRIPT_DIR` resolves inside the clone. `$SCRIPT_DIR/lib-base-pin.sh`
therefore finds the copy the seed committed. Case 20 deliberately drives
`clear-park`'s script location and its `-C` target apart; the lib is resolved
from the *script's* directory, which is the correct half of that split.

### Explicitly out of scope

`graph-commit`, `test-graph-commit.sh`, `resolve-park`,
`demote-node-to-implement`, `hold-node`, `resolve-hold`, `arm-wait`, the three
scripts' `--base` flag-parse `case` arms, and any change to the `--base` CLI
surface (accepted forms, exit codes, stderr wording).

---

## Unit 2 — Convert `release-wait` to the shared helper

**Dependencies:** Unit 1.

**Recommended model:** sonnet

### Scope

**Edited:** `packages/intentionsutil/scripts/release-wait`

- Add the same guarded `source` after the existing path block
  (`release-wait:81-88`, i.e. after `GRAPH_COMMIT=`), with `release-wait:` as
  the error prefix.
- Replace the resolver block (`release-wait:141-179`) with
  `PINNED_BASE="$(resolve_base_pin release-wait "$WAIT_ID" "$BASE_SUPPLIED" "$BASE_ARG")" || exit 2`,
  keeping the leading comment (including its "Same three accepted forms
  park-node takes." line, reworded to point at `lib-base-pin.sh`).
- Replace the stale-diagnosis `if` (`release-wait:266-269`) with
  `assert_base_fresh release-wait "$WAIT_ID" "$PINNED_BASE" "$FRESH_BLOB" "Re-enumerate the due waits and retry with a freshly captured base." || exit 3`.
  **Keep release-wait's own remediation sentence** — it is deliberately
  different (this script is driven by the tick's due-wait sweep, not by a human
  drain), and unifying it would be a behaviour regression, not a cleanup.
- Do **not** touch its one-line `--base` / `--now` `case` arms
  (`release-wait:101-104`).

**Edited:** `packages/intentionsutil/scripts/test-release-wait.sh` — this
harness seeds via two `for f in …` lists rather than individual `cp` lines. Add
`lib-base-pin.sh` to **both**: the existence-check loop (`:53`) and the copy
loop (`:85-87`). Leave the `chmod +x` line (`:88`, `release-wait` only)
unchanged.

### Explicitly out of scope

Everything in Unit 1's out-of-scope list, plus this harness's `graph-commit`
stub (`test-release-wait.sh:95-107`), which is unrelated to the pin contract.

---

## Unit 3 — Harness case: no fourth inline copy

**Dependencies:** Units 1 and 2.

**Recommended model:** sonnet

### Scope

**Edited:** `packages/intentionsutil/scripts/test-park-node.sh` — add one new
numbered case at the end of the case list (and a matching bullet in the
header's numbered case summary, which currently runs through case 20).

The case is a repo-structure assertion, not a behaviour test, so it reads the
**real** checkout via the harness's existing `REAL_REPO_ROOT` variable
(`test-park-node.sh:180`) rather than a scratch clone. It is placed in this
harness — rather than split across two — because it asserts a cross-script
property; the comment must say so, since two of its three subjects belong to
other harnesses.

Assert, using positive counts (never a bare negated grep — a mistyped pattern
must fail, not vacuously pass):

1. `lib-base-pin.sh` exists and contains exactly one definition each of
   `resolve_base_pin()` and `assert_base_fresh()`.
2. The marker string `not a full 40-hex blob sha` occurs exactly **once**
   across `packages/intentionsutil/scripts/` — inside `lib-base-pin.sh`.
   Implement as a count over the directory and compare to 1, and additionally
   assert the single hit's file is `lib-base-pin.sh`, so both a resurrected
   inline copy and a moved definition fail.
3. The marker string `stale-diagnosis —` likewise occurs exactly once in a
   `.sh`/script *definition* position — assert its count across the scripts
   directory is 1 and that the hit is in `lib-base-pin.sh`. (Comment/doc
   mentions of the token in script headers are fine; scope the count to the
   full sentence fragment `stale-diagnosis — intentions/` so header prose does
   not match.)
4. Each of `park-node`, `clear-park`, `release-wait` contains exactly one
   `source "$LIB_BASE_PIN"` line and one `resolve_base_pin ` call.

Report the case with the harness's existing `ok`/`no` helpers
(`test-park-node.sh:203-205`) so it participates in the PASS/FAIL tally.

### Explicitly out of scope

Any new behavioural `--base` case. Coverage already exists and must keep
passing unchanged: `test-park-node.sh` cases 12 (matching pin transparent),
13 (stale pin, exit 3, zero side effects), 14 (manifest form + manifest missing
this node's entry), 15 (missing `--base` value / unknown flag / non-hex value
all exit 2 before any network call), 19 (`clear-park` pin, mirroring 12-13);
`test-release-wait.sh` cases 3 (stale pin, exit 3 pre-mutation) and 4
(`<id>=<sha>` form transparent).

---

## Unit 4 — Record `release-wait` in the CAS reference skill

**Dependencies:** Unit 2.

**Recommended model:** sonnet

### Scope

**Edited:** `.claude/skills/ref-diagnosis-time-cas/SKILL.md`

Today the skill enumerates only `park-node` and `clear-park`: the **Execute**
step's command block (around `:75-77`), the "`clear-park` mirrors park-node's
`--base …` shape exactly" line (around `:84-85`), and the exit-code table's
"applies identically to clear-park" preamble (around `:92`).

Add, without restructuring the document:

1. One sentence after the `clear-park` mirror line noting that
   `release-wait` implements the same three `--base` forms and the same exit-3
   `stale-diagnosis` refusal on the tick's due-wait sweep lane, and that all
   three now share one implementation in
   `packages/intentionsutil/scripts/lib-base-pin.sh`.
2. A parenthetical on the exit-code table's preamble extending "applies
   identically to clear-park" to include `release-wait`.

Do **not** add `release-wait` to the **Execute** step's command block: that
block documents the human batched-drain flow, which `release-wait` is not part
of. Keeping it out of that block is the point of writing this as prose beside
the block rather than a third line inside it.

### Implementation note

Writes under `.claude/skills/` may be refused read-only by the sandbox. If the
edit fails with `Read-only file system` or `Operation not permitted`, retry
that single call with `dangerouslyDisableSandbox: true` — do not pre-emptively
disable the sandbox (`.claude/rules/sandbox.md`).

### Explicitly out of scope

Any other content of that skill, and any other skill or rule file.

---

## Reuse

- **`packages/intentionsutil/scripts/park-node:202-239`** and
  **`clear-park:235-272`** — the two byte-identical resolver blocks. Move this
  code verbatim into the helper; do not rewrite it.
- **`packages/intentionsutil/scripts/release-wait:141-179`** — the third copy,
  code-identical modulo `WAIT_ID`. Same treatment.
- **`packages/intentionsutil/scripts/graph-commit:665-696`** —
  `add_blob_pair`/`parse_blob_arg` and the nameref comment that states the
  no-two-copies norm. **Cite as precedent; do not call.** Its contract
  (multi-id associative map, no 40-hex validation, no single-id match check)
  is deliberately different.
- **`.claude/skills/dispatch-propagate/scripts/lib.sh:1-30`** — the sourced
  shared-helper file convention: bare `#!/usr/bin/env bash`, one-line purpose
  comment, no `set` line, top-level functions each preceded by an
  `# Args: / Output: / Returns:` doc-comment (`resolve_issue_number` at `:15`).
- **`.claude/skills/dispatch-propagate/scripts/get-changed-apps.sh:9-14`** —
  the same-directory sourcing idiom: `SCRIPT_DIR`, then
  `# shellcheck source=<filename>` immediately above `source "$SCRIPT_DIR/<file>"`.
- **`.claude/skills/dispatch-propagate/scripts/lib-*.sh`** (18 files, e.g.
  `lib-repo-roots.sh`, `lib-frozen-session-park.sh`) — the `lib-<topic>.sh`
  naming convention for a narrow single-purpose sourced helper, and the
  matching `# shellcheck source=lib-<topic>.sh` directive form.
- **`packages/intentionsutil/scripts/park-node:117-120`**,
  **`clear-park:113-117`**, **`release-wait:81-88`** — each script already
  computes `SCRIPT_DIR` and already resolves siblings from it
  (`STORE_MODULE`, `GRAPH_COMMIT`, `DUMP_NODE_TS`). Reuse that variable; do not
  introduce a new path-resolution idiom.
- **`packages/intentionsutil/scripts/verify-landed:68-84`** — the consumer-side
  precedent (`LIB_STORE_AT_REF="$SCRIPT_DIR/lib-store-at-ref.ts"`) for
  resolving a sibling dependency from the script's own directory so it works
  both in the real tree and inside a copied scratch tree.
- **`packages/intentionsutil/scripts/resolve-park:37,122-127`** — the
  existence-guard-then-source idiom. Note it uses
  `# shellcheck source=/dev/null` because its target lives in another
  directory; the new helper is a same-directory sibling, so use the
  filename form instead.
- **`packages/intentionsutil/scripts/test-park-node.sh:188,195,231,232-238,303,308`** —
  the `lib-store-at-ref.ts` seeding precedent to copy verbatim: var declaration,
  existence guard, `cp` into `$SEED`, deliberately absent from the `chmod +x`
  list, picked up by `git add -A`, delivered to every clone by `make_clone`.
- **`packages/intentionsutil/scripts/test-release-wait.sh:53,85-87`** — the
  two `for f in …` lists that are that harness's equivalent of the `cp` lines.

## Verification

Auto-runnable. All three harnesses are already registered in CI
(`.github/workflows/unit-tests.yml:293`, `:303`, `:305`) and take no arguments;
run them from the repo root.

Unit 1 must leave `test-park-node.sh` fully green (cases 12-15 and 19 are the
direct `--base` regression net):

```verify
packages/intentionsutil/scripts/test-park-node.sh
```

Unit 2 must leave `test-release-wait.sh` fully green (cases 3 and 4 are its
`--base` net):

```verify
packages/intentionsutil/scripts/test-release-wait.sh
```

`test-graph-commit.sh` is the near-miss guard: `graph-commit` is untouched, so
this must stay green with no harness change at all. Run it to prove that:

```verify
packages/intentionsutil/scripts/test-graph-commit.sh
```

Syntax gate on the new sourced file and its three consumers:

```verify
bash -n packages/intentionsutil/scripts/lib-base-pin.sh || exit 1
bash -n packages/intentionsutil/scripts/park-node || exit 1
bash -n packages/intentionsutil/scripts/clear-park || exit 1
bash -n packages/intentionsutil/scripts/release-wait
```

Repo lint (the prose-rule linter scopes to shell scripts by shebang, so the new
`.sh` file is in its scan set; it contains no `gh` porcelain and no
`echo "$VAR" | jq`, so it should pass unchanged):

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh --prose
```

**Manual / judgment checks** (not auto-runnable):

- **Stderr text is byte-identical.** Diff the four resolver error strings and
  the stale-diagnosis sentence against `git show origin/main:<script>` for each
  of the three scripts. The `stale-diagnosis` token and the em dash after it
  are the machine-greppable marker documented in
  `.claude/skills/ref-diagnosis-time-cas/SKILL.md`; a whitespace or wording
  change there breaks callers that grep for it, and the harnesses' own greps
  would still pass on a looser match.
- **Empty-vs-omitted is still distinguished.** By hand, confirm `--base ''`
  and `--base=` exit 2 while omitting `--base` entirely exits normally, for all
  three scripts. This is the specific guard that had to be hand-applied twice
  and the whole reason the helper takes `<base-supplied>` as a separate
  parameter from `<base-arg>`.
- **The `$( )` return-code contract.** Confirm that a usage error inside
  `resolve_base_pin` actually propagates: the call site is
  `PINNED_BASE="$(resolve_base_pin …)" || exit 2` under `set -uo pipefail`
  (no `-e`), so the helper must `return`, and the caller must check. A helper
  that `exit`s inside command substitution only ends the subshell — it would
  still set `$?`, but it is the wrong contract and would break if the call site
  is ever moved out of `$( )`.
- **No shellcheck in CI.** Verified: nothing in `.github/workflows/` or
  `run-lint.sh` runs shellcheck over these scripts. The
  `# shellcheck source=lib-base-pin.sh` directive is documentation for local
  runs only — do not rely on it to catch a bad source path. The `bash -n`
  fence and the harnesses are the real gate.
- **Sibling prose reference.** `intentions/tactic-terminal-disposition-sweep-park-without-cas.md`
  (phase `main-qa`) cites `park-node:118-193` and `:194-221` in its Reuse
  section and states "the callee contract is complete — do not modify it."
  This extraction preserves that CLI contract exactly but moves those lines.
  Confirm nothing in this change alters park-node's accepted `--base` forms or
  its exit-3-before-any-mutation ordering; the stale line anchors in that
  sibling's body are prose decay, not a blocker, and are not repaired here.

## What shipped — 2026-08-30

Landed in #3138 (merge commit `96d22cb1`), Position 2 of the dispatch/RSI
serialized window, as PR16 Unit 2.

The byte-identical `--base` pin-resolution blocks in `park-node` and
`clear-park` are extracted to one sourced helper, `lib-base-pin.sh`, living
beside them in `packages/intentionsutil/scripts/`. It covers the manifest-file
branch, the `<id>=<sha>` pair branch, the bare-sha branch, 40-hex validation and
the `BASE_SUPPLIED` empty-value guard — the guard whose hand-application to both
call sites was the drift this node was filed on.

**Not in `lib.sh`, deliberately.** That file must stay copyable standalone: 36
test fixtures `cp` it without a `lib-*.sh` glob, so adding a `source` there goes
red in CI while staying green locally. Measured — the count is 36, where this
node's text said "~17". `park-node` and `clear-park` do not source `lib.sh` at
all, so a sibling file in their own directory needed no new plumbing.

**The per-script error prefix is preserved.** Four messages differ only by
saying `park-node:` versus `clear-park:`; the helper takes the program name and
substitutes it, so both scripts' operator-visible output is byte-unchanged.
Verified by running both against a bad `--base` and comparing output, not by
inspection.

**Fixture wiring was mandatory.** `test-park-node.sh` is the only harness that
physically copies these two scripts into its clones, so the new sourced file had
to join that copy block — without it every park case would fail on a missing
source.

### Scope note

Only the resolution block was extracted. The `--base` / `--base=` case arms in
each script's flag-parsing loop remain duplicated, because the surrounding
`while` loops genuinely differ — `clear-park` also parses `-C`/`--repo` — and
folding them together is a larger restructuring this node did not ask for. The
drift risk this node names lived entirely in the block that was extracted.

**Verification:** `test-park-node.sh` 25/0; `test-graph-commit.sh` 124/0;
`test-verify-landed.sh` 28/0; `run-lint.sh` clean.
