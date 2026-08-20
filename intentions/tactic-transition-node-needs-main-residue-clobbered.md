---
id: tactic-transition-node-needs-main-residue-clobbered
kind: tactic
statement: transition-node's unconditional origin/main refresh of
  intentions/<id>.md overwrites an uncommitted worktree body edit before it is
  ever read, so qa-fix's `## needs-main residue` append never reaches
  origin/main and the review -> main-qa routing it exists to drive never fires
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
phase: implement
execution: null
validates: []
blocked_by:
  - tactic-scope-fingerprint-plan-substance
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# transition-node's unconditional origin/main refresh of intentions/<id>.md overwrites an uncommitted worktree body edit before it is ever read, so qa-fix's `## needs-main residue` append never reaches origin/main and the review -> main-qa routing it exists to drive never fires

## Context

**The defect.** `.claude/skills/dispatch-propagate/scripts/transition-node` (259 lines) opens with a "Refresh the LOCAL node file from origin/main BEFORE any read" block at **lines 85–104**. Its third statement — the `git show "origin/main:intentions/$NODE_ID.md" > "$REPO_ROOT/intentions/$NODE_ID.md"` redirect at **line 102** — unconditionally overwrites the on-disk node file. It runs before `read_node_json` (line 157), before the freshness snapshot (line 182), before `apply-node-transition.ts` (line 216), before everything. Any uncommitted worktree edit to `intentions/<id>.md` is destroyed with **no diagnostic and no exit-code change**.

**What that breaks.** `/qa-fix` Step 3.6 (`.claude/skills/qa-fix/SKILL.md:367-379`) directs the node-target lane to append a `## needs-main residue` section to `intentions/<node-id>.md` in the worktree as an uncommitted edit, and asserts at **lines 375–377** that "That append rides in the Step-4 `transition-node` commit." It does not ride in. The append is clobbered at line 102; the transition lands phase-only; `hasNeedsMainResidue` (`packages/intentionsutil/src/transitions.ts:378`) reads false at the later `review` hop; the node routes `review → done` instead of `review → main-qa`; and the post-merge verification the residue exists to drive never happens. Silent loss of QA custody evidence.

**Dating the regression (do not confuse it with clarification 102's mechanism).** `git log -L 102,102:.claude/skills/dispatch-propagate/scripts/transition-node` returns exactly one commit: `c063f490`, **2026-07-26**, "Graph-write completion recipes: CAS-guard fix-checks and transition-node (#2939)". Strategy clarification 102 was recorded **2026-07-25 — one day earlier**. Clarification 102's measured mechanism ("qa-fix's own Step 3.6 `## needs-main residue` body append lands in the SAME graph-commit as the qa→review transition", causing a scope-drift demotion cascade) was true when recorded and was silently made obsolete the next day by #2939. Since 2026-07-26 the residue does not land in that commit at all — it lands **nowhere**. The demotion cascade and this routing loss are two different eras of the same seam. Do not plan against clarification 102's mechanism as if it were current.

**Measured field practice.** `git log -S '## needs-main residue' --since=2026-07-26 -- intentions/` shows that every residue that reached origin/main since the clobber did so via its **own dedicated `graph-commit`**, never riding a transition. Two of those commit subjects are explicitly recoveries of a dropped append ("recover dropped qa-fix append"; "qa-fix needs-main residue recovered before reap"). Workers are already hand-executing a workaround, off-skill and unreliably. Zero transition-node commits carry residue text.

**The two sources of truth contradict each other.** `transition-node:129-133` states the opposite contract from the producer skill: "an UNCOMMITTED worktree body edit is not a content source here and never was … A caller that wants a body edit to ride into this transition must land it on origin/main itself (via graph-commit) first." That comment was added by PR #2973 to describe the *current* behavior accurately — it is a description of the bug, not a ratified contract. One of the two must move.

### The greenfield design (adopted)

**transition-node never destroys caller content. The refresh becomes a body-preserving rebase onto origin/main, not an overwrite.**

Three properties, in priority order:

1. **Frontmatter is always origin/main's.** `phase`, `execution`, markers, `office_hours`, `attention` are advanced by other writers between this worktree's fork point and now. transition-node owns the frontmatter write and must never re-land a stale copy. This is what the refresh exists for and it is correct.
2. **A body delta the caller left uncommitted is REPLAYED onto origin/main's body**, three-way, with `git merge-file`: `base` = `HEAD:intentions/<id>.md`'s body (what the caller edited against), `ours` = `origin/main:intentions/<id>.md`'s body, `theirs` = the dirty worktree body. A residue append at end-of-body against a main-side edit elsewhere merges cleanly by construction.
3. **A delta that cannot be replayed is a LOUD REFUSAL** — non-zero exit naming the file and the remedy — never a silent discard (`.claude/rules/code-style.md`, "clear errors over defensive fallbacks").

Consequence: the residue rides the graph-commit **already at `transition-node:230`**. No second land, no second CI-polling cycle, no interruption window — phase and residue reach origin/main in **one commit**.

**Why this also dodges the demotion cascade, by construction.** The pre-transition scope gate does **not** read the worktree file: `transition-node:182` builds its snapshot with `git archive origin/main intentions | tar -x` and passes `--snapshot "$SNAP_DIR/intentions"` to `compute-freshness.ts` (lines 186–188). It compares **origin/main's** body against the stamp. At gate time the residue is still absent from origin/main, so `scopeStale` reads **false**, the demotion branch at lines 197–207 is not taken, the land ships phase+residue together, and `refresh_stamp` (defined 141–151, called at 242, `restamp-scope-fingerprint.ts --from-rev origin/main`) then stamps the landed, residue-bearing content. The next sweep reads clean. *(Re-derive this from the script before resting on it.)*

**Why graph-commit carries the dirty bytes.** `graph-commit`'s `snapshot()` (`packages/intentionsutil/scripts/graph-commit:954-968`) does `cp -- "$INTENTIONS_DIR/$id.md" "$SNAP_DIR/$id.md"` — the **on-disk** copy, dirty or not — and replays that snapshot onto fresh origin/main. And `assert_clean_outside_ids` (`graph-commit:3591-3645`) explicitly permits a dirty `intentions/<id>.md` for ids in the call's own set. So a body edit surviving to line 230 lands. No new land step is needed.

### The rejected alternative (recorded, with grounds)

**Option (b) — resequence `/qa-fix` Step 3.6 to land the residue via its own `graph-commit` plus a compensating `restamp-scope-fingerprint --from-rev origin/main`, before invoking transition-node.** Rejected as the primary design because:

- It is **two lands**, each paying `graph-commit`'s full CI-poll cycle, per QA pass.
- It **provokes** the demotion the greenfield avoids: the residue reaches origin/main first, so transition-node's very next gate reads `scopeStale=true` and demotes to `implement`, wiping `execution.markers` — unless the compensating restamp lands. The land→restamp pair is **not atomic**; a session death between them strands the node scope-stale and the next selection demotes it.
- It does **not** remove the silent-clobber hazard. Any caller leaving a dirty node edit for any other reason still loses it with no diagnostic. The loud guard is required either way — and once the guard exists, replaying the delta is a few more lines than refusing it.

It is nonetheless the *fallback path* this plan hands the caller in the refusal diagnostic, and the plan does not forbid it.

### Out of scope (named so a later round can pick them up)

- `packages/intentionsutil/scripts/park-node` (`TMPORIG` + `restore_node()` + `MUTATED` trap, ~lines 241–333), `packages/intentionsutil/scripts/clear-park` (~line 279) and `packages/intentionsutil/scripts/resolve-hold` (`clean_node_file()`, ~line 288) carry **three near-duplicate copies of the same fetch→overwrite→mutate→graph-commit idiom with the identical clobber-on-success gap**. Unit 1's primitive is deliberately shaped to be adoptable by all three, but rewiring them is a separate PR.
- Migrating `transition-node`'s bespoke inline EXIT trap (lines 167–181) onto the shared `.claude/skills/dispatch-propagate/scripts/lib-graph-rollback.sh:73-198` `graph_rollback_node_writes()` helper. Desirable per that file's own stated purpose, but a different change; this plan deepens the bespoke trap minimally rather than swapping it mid-fix.
- `tacticScopeFingerprint`'s scope (`packages/intentionsutil/src/router.ts:132`, today `sha256(JSON.stringify({statement, body}))` over the **whole** body). Rescoping it to plan substance is `tactic-scope-fingerprint-plan-substance` (phase `qa`, PR #2974) — see Sibling state below.

### Provenance and caveats (carried forward)

- **Source:** review-fix pass on PR **#2973** (`tactic-transition-node-stamp-landed-body`), finding `deferred-filing` (code-review lens, residue phase). **Source PR: #2973.**
- **Adversarial verdict:** *not* independently verified by an adversarial skeptic — a Lane A (`code-review`) residue finding, dispositioned `Deferred` without a separate verify pass. The defect itself has since been **re-measured directly on origin/main (2026-08-20, `c281e300`)** and every anchor in this plan re-grepped this round; the *unverified* label applies to the original filing, not to the anchors below.
- **DO NOT TOUCH (decoy):** `intentions/tactic-transition-node-stamp-landed-body.md` and its already-corrected comments. Strategy clarification 111 explicitly rules that node's stale plan text is left untouched **on purpose**, to avoid paying a `review→implement` custody demotion for a documentation-only defect. Nothing in this plan edits that node.

### Sibling state (verified 2026-08-20 in this worktree)

| Node | phase | Bearing on this plan |
|---|---|---|
| `tactic-transition-node-stamp-landed-body` | **done** | This node's source PR (#2973). Fixed `refresh_stamp`'s *content source*; deliberately did not touch the clobber. |
| `tactic-scope-fingerprint-plan-substance` | **qa** (PR #2974) | Adds `packages/intentionsutil/src/body-substance.ts` (`MACHINERY_SENTINEL`, `planSubstance`, `appendMachinerySection`) and a `packages/intentionsutil/scripts/append-machinery-section.ts` CLI; rescopes the fingerprint. **Neither file is on origin/main** (`git ls-tree origin/main` returns nothing for both). It does **not** fix this bug — its own diff still says the append "rides in the Step-4 transition-node commit", and `append-machinery-section.ts` still writes an *uncommitted worktree* file that line 102 destroys. **Complementary, not a substitute.** Its Step 3.6 rewrite collides textually with Unit 4 — see Unit 4's merge instruction. |
| `tactic-phase-evidence-fingerprint-bound` | qa | Chained per clarification 141; no overlap. |
| `tactic-demote-node-stale-local-read`, `tactic-scope-stamp-in-graph`, `tactic-transition-node-scope-stale-test-coverage` | null (drafts) | No overlap. `…scope-stale-test-coverage` covers the stamp's PATH resolution (`MAIN_ROOT` vs the invoking worktree), not its content source or the clobber. |

Strategy clarification 141 is the author-ratified sitting that ordered this seam's carriers; nothing here re-orders it. This tactic hangs off `tactic-transition-node-stamp-landed-body`, which is `done`.

## Units of work

### Unit 1 — `refreshNodePreservingBodyEdit`: an owned, offline-testable primitive that rebases a dirty node body onto a rev instead of overwriting it

**Recommended model:** opus

**Scope**

*New file* `packages/intentionsutil/src/node-refresh.ts` — the pure core, no git, no fs:

```ts
export interface BodyReplay {
  /** Full file text to write: `revRaw`'s frontmatter + the replayed body. */
  merged: string;
  /** "no-delta" | "replayed" | "conflict" */
  outcome: "no-delta" | "replayed" | "conflict";
  /** On "conflict": the conflicted merge text, for the diagnostic. Else null. */
  conflictText: string | null;
}

export function replayBodyOnto(args: {
  id: string;
  revRaw: string;      // git show <rev>:intentions/<id>.md
  baseRaw: string;     // git show <baseRev>:intentions/<id>.md
  localRaw: string;    // the on-disk (possibly dirty) file
  mergeBodies: (ours: string, base: string, theirs: string) =>
    { text: string; conflicted: boolean };
}): BodyReplay;
```

Rules, in this exact order:

1. Split each of the three inputs with `extractBody(raw, id)` (`packages/intentionsutil/src/frontmatter.ts:31`). The frontmatter prefix of `revRaw` is `revRaw.slice(0, revRaw.length - extractBody(revRaw, id).length)` — the **raw-splice** idiom, deliberately bypassing `writeNode`'s YAML round-trip (see Reuse; the round-trip is clobber-prone for bodies).
2. If `localBody === baseBody` → **`"no-delta"`**, `merged = revRaw` verbatim. *This is the frontmatter-only-dirt case* — e.g. leaked marker residue from an interrupted prior pass, which `graph-commit:3591-3645` calls out by name. The frontmatter delta is deliberately **discarded** (frontmatter is `rev`'s, always, per the design above); the caller emits a stderr note.
3. If `revBody === baseBody` → **`"replayed"`**, `merged = revFrontmatter + localBody` (fast path: main's body did not move, so the local body *is* the replay).
4. Otherwise call `mergeBodies(revBody, baseBody, localBody)`. Conflicted → **`"conflict"`**, `merged` unchanged from `revRaw`, `conflictText` set. Clean → **`"replayed"`** with `merged = revFrontmatter + mergedBody`.
5. Never mutate the frontmatter region. Assert this in tests byte-wise.

*New file* `packages/intentionsutil/scripts/refresh-node-preserving-body-edit.ts` — the CLI wrapper that supplies git:

```
npx tsx packages/intentionsutil/scripts/refresh-node-preserving-body-edit.ts <id> \
  --repo-root <abs> --rev origin/main --base-rev HEAD [--dir <abs intentions path>]
```

- `assertPathSafeId(id)` first (`packages/intentionsutil/src/store.ts:39`) — same posture as `restampScopeFromRev` (`packages/intentionsutil/scripts/restamp-scope-fingerprint.ts:148-181`), so the error names the real problem rather than surfacing as an opaque `git show` failure.
- Reads `revRaw` / `baseRaw` via `execFileSync("git", ["show", …], { cwd: repoRoot, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 })` — mirror `restamp-scope-fingerprint.ts:169-174` exactly, including `maxBuffer`.
- `mergeBodies` implementation: write the three bodies to temp files and run `git merge-file -p <ours> <base> <theirs>`; exit 0 = clean, exit > 0 and < 128 = that many conflicts, anything else = error (throw). `git merge-file`'s argument order is *current, base, other*, so `ours` is `rev`'s body and `theirs` is the local body.
- **`--base-rev` resolution failure is a hard error, not a fallback**: if `git rev-parse <baseRev>:<dir>/<id>.md` fails (the worktree HEAD predates the node's landing), exit **4** with `refresh-node-preserving-body-edit: cannot determine the edit base for <id> at <baseRev> — land the body edit yourself via graph-commit, then re-run`. Never guess a base.
- Writes `merged` to `<dir>/<id>.md` **only** on `no-delta` / `replayed`, via write-to-temp + `rename` (never a truncating in-place redirect).
- Prints exactly one machine-readable outcome line to **stdout**: `no-delta <id>` | `replayed <id>` | `conflict <id>`.
- **Exit codes:** `0` = `no-delta` or `replayed` (file written); `3` = `conflict` (file **left untouched**, conflict text on stderr under a `--- conflicted body merge ---` banner); `4` = base unresolvable; `2` = usage; `1` = git/fs error. Document this block in the file header.

*Edit* `packages/intentionsutil/src/index.ts` — export `replayBodyOnto` and the `BodyReplay` type alongside the existing barrel exports (the router block is at `index.ts:22-27`; append a matching block).

*New file* `packages/intentionsutil/test/node-refresh.test.ts` — vitest over the pure core (`replayBodyOnto`, injected `mergeBodies` stub) covering: no-delta returns `revRaw` byte-identically; residue-append-only replays onto a main body that also moved elsewhere; a main-side edit **inside** the appended region conflicts; frontmatter is byte-identical to `revRaw`'s in every non-conflict outcome; a `localRaw` whose frontmatter differs from `baseRaw` but whose body matches yields `no-delta` (frontmatter dirt discarded).

**Out of scope for this unit:** touching `transition-node` (Unit 2), the test harness (Unit 3), `/qa-fix` prose (Unit 4), and any rewiring of `park-node` / `clear-park` / `resolve-hold`.

---

### Unit 2 — Wire `transition-node` onto the primitive; make the refusal loud and the rollback honest

**Recommended model:** opus

**Dependencies:** Unit 1.

**Scope** — `.claude/skills/dispatch-propagate/scripts/transition-node` only.

1. **Capture the pre-refresh bytes.** Immediately after the `FRESH_BLOB` capture at **line 98** and *before* the refresh, record whether the node file differs from `HEAD` (`git -C "$REPO_ROOT" diff --quiet HEAD -- "intentions/$NODE_ID.md"`; this catches staged *and* unstaged dirt) into `NODE_DIRTY=0|1`, and when dirty copy the file to a tempfile `PRE_REFRESH` (`mktemp`, `rm -f` it in the EXIT trap). This is the `park-node:241-333` `TMPORIG` idiom; reuse its shape.

2. **Replace the clobbering redirect at line 102** with a call to Unit 1's CLI:
   ```bash
   node --import tsx/esm "$UTIL_SCRIPTS/refresh-node-preserving-body-edit.ts" "$NODE_ID" \
     --repo-root "$REPO_ROOT" --rev origin/main --base-rev HEAD --dir "$REPO_ROOT/intentions"
   ```
   Branch on its exit code:
   - `0` → continue. When the outcome line was `replayed`, echo one stderr line: `transition-node: replayed an uncommitted body edit for <id> onto origin/main; it will land with this transition`.
   - `0` with `no-delta` **while `NODE_DIRTY=1`** → echo `transition-node: discarded a frontmatter-only local edit to intentions/<id>.md (frontmatter always comes from origin/main)`. Continue.
   - `3` (conflict) → **fail loud, exit 1**, forwarding the primitive's conflict text and adding the remedy: `land the body edit on origin/main yourself (graph-commit, then restamp-scope-fingerprint.ts --from-rev origin/main), then re-run transition-node`. Restore `PRE_REFRESH` first so the caller's edit is still on disk to retry with.
   - `4` (base unresolvable) → same treatment as `3`.
   - anything else → exit 1 with the existing `could not refresh intentions/<id>.md from origin/main` diagnostic, restoring `PRE_REFRESH`.

   Do **not** swallow a non-zero exit. Do **not** fall back to the old overwrite.

3. **Rollback target.** Extend the EXIT trap at **lines 167–181**: when `MUTATED=1 && rc != 0`, restore `PRE_REFRESH` if `NODE_DIRTY=1`, else restore from `$FRESH_BLOB` exactly as today. Keep the existing write-to-`.rollback`-then-`mv` discipline (never truncate the node file to zero bytes) and the existing comment explaining why the restore uses the immutable blob SHA and not the moving ref. Add a matching restore for the pre-`MUTATED` failure paths introduced in step 2.

4. **Demote branch (lines 197–207).** `demote-node-to-implement` performs its own refresh and will discard the replayed body. Before delegating, when `NODE_DIRTY=1`: restore `PRE_REFRESH` to disk and echo `transition-node: NOT landing the uncommitted body edit for <id> — this node is scope-stale and is being demoted to implement; the edit is left on disk`. Do not change the demote outcome or exit code.

5. **Correct the two stale comments.**
   - **Lines 129–134** (inside `refresh_stamp`'s header) currently read "an UNCOMMITTED worktree body edit is not a content source here and never was … A caller that wants a body edit to ride into this transition must land it on origin/main itself (via graph-commit) first." Rewrite to state the new contract: an uncommitted **body** edit *is* replayed onto origin/main by the refresh above and lands with this transition's own `graph-commit`; an uncommitted **frontmatter** edit is discarded; a body delta that cannot be replayed is refused (exit 1), never dropped. Leave reasons **(1)** (graph-commit's `cleanup()` `git reset --hard "$ORIG_HEAD"` at `graph-commit:335-359`) and **(2)** (the PR-branch copy can be arbitrarily far behind) **intact** — they are still exactly why `refresh_stamp` must source from git and not from the worktree.
   - **Lines 85–104**'s block comment: replace "Refresh the LOCAL node file from origin/main BEFORE any read" with wording that says *rebase* the local node file onto origin/main — frontmatter from origin/main, an uncommitted body delta replayed on top — and keep the existing `FRESH_BLOB`-is-the-CAS-token sentence verbatim.

6. **Do not change**: the `--base "$NODE_ID=$FRESH_BLOB"` CAS at line 230, `mark_terminal advance` at line 240, `refresh_stamp` at line 242, the freshness-gate snapshot at lines 182–188, or any stdout outcome line. All new diagnostics go to **stderr**; stdout's four outcome lines are a parsed contract.

**Out of scope:** migrating the trap onto `lib-graph-rollback.sh` (named in Context as out of scope); any change to `demote-node-to-implement` itself.

---

### Unit 3 — Regression case in the write-rollback harness, and correct Case 5's now-false NOTE

**Recommended model:** sonnet

**Dependencies:** Units 1 and 2.

**Scope** — `.claude/skills/dispatch-propagate/scripts/test-graph-write-rollback.sh` (1668 lines) only.

1. **New Case 5b**, appended immediately after Case 5 (which ends at ~line 626, just before the `Cases 6-8` banner at ~line 628). It must reuse the existing harness helpers, not new stubs: `HARNESS_DIR` / `WORK` / `new_origin` (top of file, lines 1–93), `build_seed_repo` / `init_and_push` / `clone_with_node_modules` / `landing_graph_commit` (lines 122–260), and the `ok` / `no` assertion helpers (lines 88–92; the file's trailing `passed: $PASS  failed: $FAIL` summary already tallies them).

   Fixture, mirroring Case 5's shape at **lines 512–584** but with the residue seeded as a **genuine uncommitted worktree edit** rather than landed out-of-band:
   - Seed node `t-clobber` (`phase: qa`, `status: codified`, `owner: ai`, `serves: []`, `execution: null`), push to a fresh origin, clone, install `landing_graph_commit`.
   - `git checkout -qb t-clobber`; add an unpushed non-`intentions/` commit so the reset-dance is observable (Case 5 lines 534–538).
   - Land a **body edit on origin/main from the seed repo** that is *not* the residue — e.g. append a `## Verification` bullet — and `git fetch` it into the clone, so main's body has genuinely moved and the replay exercises the three-way merge rather than the `revBody === baseBody` fast path.
   - `cat >> "$C/intentions/t-clobber.md"` the `## needs-main residue` section in the **clone worktree**, leaving it **uncommitted**.
   - Seed `$C/.claude/worktrees/t-clobber.scope-fingerprint` with `<fingerprint-of-origin/main-copy> <origin/main sha>` using the same inline `node --import tsx/esm` computation as Case 5 lines 571–584 (so the *pre*-transition gate reads `scopeStale=false` and the transition proceeds).
   - **Setup guard** in the spirit of Case 5's at lines 559–566: assert the residue is present in the worktree file and **absent** from `origin/main:intentions/t-clobber.md`, and that main's own body edit is present on origin/main and absent from the branch tip. `exit 1` with `error: case 5b setup failed …` if not — otherwise every later assertion passes vacuously.

   Assert, all of:
   - `rc == 0` and stdout matches `^transitioned t-clobber qa -> review$`.
   - `git show origin/main:intentions/t-clobber.md` now contains **both** `needs-main` **and** main's own body edit — the replay merged, it did not overwrite.
   - The landed `phase:` is `review` — the frontmatter came from the transition, not from the stale branch copy.
   - The post-run freshness computation (`compute-freshness.ts` over a fresh `git archive origin/main intentions` snapshot, exactly as Case 5 lines 596–606) reports `scopeStale=false` and `stampMissing=false`, and the stamp's sha equals the new `origin/main` sha — i.e. `refresh_stamp` covered the residue-bearing landed body.

2. **New Case 5c — the refusal is loud.** Same fixture, but make the two bodies conflict: land a main-side edit that *rewrites the tail region* the worktree append also touches. Assert `rc != 0`, that stderr names `intentions/t-clobber.md` and the word `conflict`, that `origin/main:intentions/t-clobber.md` is **unchanged** (no partial land), and that the clone's worktree file **still contains** the residue text (the caller's edit survived for a retry). This is the teeth for Unit 2's fail-loud branch; without it the refusal path is untested.

3. **Correct Case 5's NOTE at lines 501–510.** It currently reads "/qa-fix Step 3.6: its `## needs-main residue` append does NOT ride into the land as an uncommitted worktree edit — transition-node's `git show origin/main:… > …` refresh clobbers any uncommitted body edit before anything reads it. Landing the residue out-of-band here is therefore the accurate reproduction, not a convenience." That is false after Unit 2. Rewrite it to say the out-of-band landing is now a deliberate *isolation* choice — Case 5 tests `refresh_stamp`'s content source and nothing else, and Case 5b covers the uncommitted-edit path — with a cross-reference to Case 5b. **Do not weaken, skip, or delete Case 5 or any of its six conjuncts** (`.claude/rules/test-integrity.md`); only its prose NOTE changes. Also add Cases 5b/5c to the numbered case list in the file's own header comment (lines 20–79).

**Out of scope:** any other case; the `run-unit-tests.sh` wiring (the harness is already auto-discovered — `run-unit-tests.sh:190` globs `"$SCRIPTS"/test-*.sh` with `SCRIPTS` = this script's own directory).

---

### Unit 4 — Reconcile `/qa-fix` Step 3.6 prose to the contract the code now actually keeps

**Recommended model:** sonnet

**Dependencies:** Unit 2.

**Scope** — `.claude/skills/qa-fix/SKILL.md` only.

The node-target-lane paragraph at **lines 367–379** now becomes *true* — but its pointer is wrong and its failure mode is undocumented. Edit surgically:

1. **Fix the false pointer at lines 375–377.** "That append rides in the Step-4 `transition-node` commit" names a step that does not exist. The `transition-node` invocation it refers to is in the **Step-2 node-target-lane Completion bullet**, whose fenced command is at **line 200** (`.claude/skills/dispatch-propagate/scripts/transition-node "$N" --set-pr "$PR_NUM"`), under the `### Node-target lane (TARGET_KIND=node)` heading at **line 181**. Rewrite to name that bullet by its real location.
2. **State the mechanism, not just the outcome.** The append is left **uncommitted** in the worktree; `transition-node` replays it onto `origin/main`'s body and lands it in the *same* state-only `graph-commit` as the `qa → review` transition. Keep the two existing true statements verbatim: the residue section does **not** divert the phase, and it is drained after review merges when `review → main-qa` fires.
3. **Add the refusal branch.** If `transition-node` exits non-zero reporting a conflicted body replay, the session must land the residue itself — `graph-commit` the node, then `node --import tsx/esm packages/intentionsutil/scripts/restamp-scope-fingerprint.ts --repo-root <root> --main-root <main> --from-rev origin/main <id>` so the scope-custody stamp follows — and then re-run `transition-node`. Without the restamp the next gate reads `scopeStale=true` and demotes the node to `implement`, wiping `execution.markers`.
4. **Do not** touch the legacy-lane paragraph (lines 380–392), the Step 2 Completion/Escalation/Merge bullets other than the pointer correction, or the `Verifiability:` rules.

**Merge instruction — read before editing.** `tactic-scope-fingerprint-plan-substance` (PR #2974, phase `qa`) rewrites this **same paragraph** to route the append through `packages/intentionsutil/scripts/append-machinery-section.ts`. Re-read lines 358–392 as they stand at implementation time. If #2974 has already merged, **keep** its `append-machinery-section.ts` invocation intact and change only the sentences this unit names — the two changes are complementary (that CLI still writes an *uncommitted worktree* file, which is exactly what Unit 2 now preserves). If it has not merged, make the edit anyway and expect a textual conflict there rather than a semantic one. Strategy clarification 111 records that two independent tactics writing opposite corrections to this same paragraph is what previously made a merge conflict semantic — do not reintroduce that by rewriting the whole paragraph.

**Out of scope:** `references/needs-main-followups.md`; any other skill doc.

## Reuse

- `.claude/skills/dispatch-propagate/scripts/transition-node:85-104` — the bug site (the `git show origin/main:… > …` redirect at **102**); `:98` `FRESH_BLOB` capture, reused as the `--base` CAS token; `:129-134` the stale contract comment; `:141-151` `refresh_stamp()`; `:167-181` the bespoke EXIT-trap rollback; `:182-188` the `git archive origin/main` freshness snapshot; `:197-207` the scope-stale demote branch; `:230` the `graph-commit --base` land; `:242` the `refresh_stamp` call.
- `packages/intentionsutil/src/frontmatter.ts:31` — `extractBody(raw, id)`. The frontmatter prefix is `raw.slice(0, raw.length - extractBody(raw, id).length)`; this raw-splice idiom deliberately avoids `writeNode`'s YAML round-trip, which is clobber-prone for bodies (`apply-node-transition.ts:150-201` routes frontmatter through it — a residue-append fix must **not**).
- `packages/intentionsutil/src/store.ts:39` — `assertPathSafeId(id)`, called before any id becomes a path component.
- `packages/intentionsutil/scripts/restamp-scope-fingerprint.ts:148-181` — `restampScopeFromRev` / the `--from-rev` CLI. The model for "read content from a git rev, not the worktree", including the `execFileSync` + `maxBuffer` shape; already the compensating primitive named in Unit 4's refusal branch.
- `packages/intentionsutil/scripts/graph-commit:954-968` — `snapshot()` copies the **on-disk** node file and replays it onto fresh origin/main: the reason a surviving dirty edit lands with no new land step.
- `packages/intentionsutil/scripts/graph-commit:3591-3645` — `assert_clean_outside_ids()` permits a dirty `intentions/<id>.md` for ids in the call's own set, and names the leaked marker-field residue case Unit 1 rule 2 handles.
- `packages/intentionsutil/scripts/graph-commit:335-359` — `cleanup()`'s `git reset --hard "$ORIG_HEAD"`; still the reason `refresh_stamp` must source from git.
- `packages/intentionsutil/scripts/park-node:241-333` — `TMPORIG` capture + `restore_node()` + `MUTATED` trap: the established idiom Unit 2 step 1 copies. Note it captures the pre-refresh copy **only** for the failure path and discards it on success — the same gap being fixed here.
- `packages/intentionsutil/scripts/demote-node-to-implement` — second working example of fetch → `FRESH_BLOB` → `graph-commit --base` → rollback-on-failure; also the delegate at `transition-node:198`.
- `.claude/skills/dispatch-propagate/scripts/lib-graph-rollback.sh:73-198` — `graph_rollback_node_writes()`, the canonical shared rollback helper. Named for the follow-on migration; **not** adopted in this PR.
- `.claude/skills/dispatch-propagate/scripts/test-graph-write-rollback.sh` — `:1-93` top-of-file setup (`HARNESS_DIR`, `WORK` + cleanup trap, `new_origin`), `:88-92` `ok`/`no`, `:122-260` `build_seed_repo` / `init_and_push` / `clone_with_node_modules` / `landing_graph_commit` / `fail_graph_commit`, `:480-626` Case 5 as the fixture template.
- `packages/intentionsutil/src/transitions.ts:378` — `hasNeedsMainResidue`, the single detector whose input the fix restores.
- `packages/intentionsutil/src/router.ts:132` — `tacticScopeFingerprint`; its doc comment at `:115-130` asserts "the transition writer refreshes the stamp after such an append", which becomes true only once this fix lands.
- `packages/intentionsutil/src/index.ts:22-27` — the barrel-export block to append to.
- `.claude/skills/qa-fix/SKILL.md:181`, `:200`, `:367-379` — the producer side.

## Verification

Run all three from the repo/worktree root.

```verify
bash .claude/skills/dispatch-propagate/scripts/test-graph-write-rollback.sh
```

```verify
npx vitest run --project packages/intentionsutil --root .
```

```verify
bash -n .claude/skills/dispatch-propagate/scripts/transition-node
```

Positive greps asserting the new contract is actually written down (each must print at least one line; a negated grep is deliberately avoided — it passes vacuously on a line-wrap):

```verify
grep -q 'refresh-node-preserving-body-edit' .claude/skills/dispatch-propagate/scripts/transition-node && echo OK-wired
```

```verify
grep -qi 'replay' .claude/skills/dispatch-propagate/scripts/transition-node && echo OK-contract-comment
```

```verify
grep -q 'restamp-scope-fingerprint' .claude/skills/qa-fix/SKILL.md && echo OK-qa-fix-refusal-branch
```

Lint (runs the type-safety-escape check; note `.claude/rules/type-safety-suppression-marker.md` if a marker is genuinely needed in the new TS):

```verify
bash .claude/skills/dispatch-propagate/scripts/run-lint.sh
```

**Teeth check (manual, required — do not skip).** Confirm Case 5b genuinely fails against the pre-fix code: `git stash` the Unit-2 change to `transition-node` (or point the harness's `cp` at `git show origin/main:.claude/skills/dispatch-propagate/scripts/transition-node`) and re-run the harness. Case 5b **must go red** and Case 5 must stay green. If 5b passes without the fix, its fixture has lost its teeth — most likely the setup guard is not actually diverging origin/main from the branch tip. This mirrors the discipline the harness header already records for Cases 6/7 (verified to go red when their fix is reverted) and for Case 11b.

**Observe in production (post-merge, `needs-main`).** After this merges, the next `/qa-fix` node-lane pass that produces `needs-main` residue must show, in one commit on origin/main: the `phase: review` transition **and** the `## needs-main residue` section, in the node's own `intentions/<id>.md`. Check with `git log -S '## needs-main residue' --since=<merge-date> -- intentions/` — the residue commit's subject should now be a `graph: transition <id> to review` message rather than a standalone `graph: append needs-main residue to <id>` one. Then confirm the node routes `review → main-qa` (not `review → done`) on its next hop, and that no `dispatch-graph-scope-sweep` demotion follows within the same tick. Two consecutive residue-producing QA passes with that shape closes the loop; a standalone residue commit reappearing means a worker is still hand-executing the old workaround and Unit 4's prose did not take.

**Judgment call for the implementer.** If, while reading `git merge-file`'s behavior on real fixtures, the three-way replay proves flakier than expected (e.g. it merges cleanly but in a semantically wrong place), do **not** silently narrow the primitive to "append-only detection". Park to office-hours with the evidence: narrowing it re-opens the silent-loss hazard for every non-append body edit, which is an author-visible design change, not an implementation detail.
