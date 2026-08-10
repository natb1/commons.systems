---
id: tactic-fleet-alarm-mint-rollback-corruption
kind: tactic
statement: dispatch-fleet-alarm's mint-failure rollback can leave a corrupted
  0-byte node file that breaks listNodes() fleet-wide, stalling all dispatch for
  hours
owner: ai
status: codified
parent: null
rationale: >-
  Discovered 2026-08-01 while investigating why the fleet showed 0 busy workers
  for 6+ hours. Root cause: two untracked, 0-byte files —
  intentions/tactic-fleet-alarm-busy-stall.md and
  intentions/tactic-fleet-alarm-watch-unknown.md — existed on disk in the main
  checkout (/home/n8/natb1/commons.systems) but were absent from git entirely
  (git ls-files empty, git status showed `??`).
  packages/intentionsutil/src/store.ts's listNodes() throws IntentionSchemaError
  ("missing an opening \"---\" frontmatter fence") on ANY malformed file in
  intentions/, uncaught, which crashes every caller that enumerates the whole
  directory — confirmed crashing dispatch-graph-main-red-sync (reported UNKNOWN
  instead of a real red-sync read) and strongly suspected of crashing
  dispatch-select-tick's node enumeration (routing-decisions.jsonl showed
  target:none / at-cap-no-priority with target_n:0, effective_live:0 for hours —
  consistent with, though not yet proven to be caused by, every
  candidate-selection pass failing before it could select anything). journald
  showed dispatch-fleet-watch (the new systemd-based watchdog shipped by
  tactic-fleet-watchdogs-session-scoped / PR #3008, whose broken systemd install
  this same investigation session had just repaired) calling
  dispatch-fleet-alarm to mint an alarm node for a detected busy-stall
  condition, and dispatch-fleet-alarm's own log recorded "minting
  tactic-fleet-alarm-watch-unknown failed; the write was rolled back" — i.e. the
  script's OWN rollback path (dispatch-fleet-alarm lines 568-579: on failure,
  restore_from_blob if a PRE_BLOB existed, else `rm -f "$NODE_FILE"
  "$NODE_FILE.tmp"`) ran and still left a 0-byte file behind. Not yet pinned to
  one exact line: write-node.ts's own writeNode() (store.ts:44-55) writes via a
  single atomic writeFileSync of fully-assembled content, which should not
  itself produce a 0-byte file, so the corruption's precise origin (a step
  before writeNode failing to have created anything yet contradicts the observed
  0-byte file existing at all; or the splice_body shell function at
  dispatch-fleet-alarm:341-344, whose `{ awk ...; cat "$BODY_FILE"; } >
  "$NODE_FILE.tmp" && mv "$NODE_FILE.tmp" "$NODE_FILE"` idiom creates/truncates
  NODE_FILE.tmp via shell redirection regardless of whether the awk/cat pipeline
  inside actually produced content, is the strongest remaining suspect) needs a
  session with time to trace it with captured stderr from a live failure, not
  reconstructed after the fact. Removing both stray files (git status confirmed
  untracked, so deletion was purely a local filesystem cleanup, no git history
  at risk) immediately fixed listNodes() (verified: 468 nodes enumerate cleanly
  again) and is presumed but not yet confirmed to have unstuck the fleet — the
  next tick's outcome is the actual confirmation.


  Still unconfirmed as of this record: (1) the exact code path that leaves the
  0-byte file despite the rollback branch executing (splice_body's
  redirection-before-pipeline-check idiom is the leading suspect but unverified
  against a live repro); (2) whether this was the ROOT cause of the 6h
  busy-stall or a compounding secondary failure that started ~2h16m after the
  stall began (busy-stall counter read 22515s since epoch 1785555951 =
  2026-08-01T03:45:51Z; the corrupted files' mtime was 2026-08-01T06:01:08Z) --
  the earlier gap (03:45Z-06:01Z) has a separate, still-unexplained cause; (3)
  whether the fleet actually resumed dispatching after this session removed the
  corrupted files, or whether some other blocker remains -- check the next
  tick's routing-decisions.jsonl entries and BUSY count once enough time has
  passed.
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal:
  observable: dispatch-fleet-alarm's mint-failure path never leaves a malformed
    file in intentions/ on disk, verified by a fault-injection test (force
    write-node.ts or splice_body to fail mid-mint) that asserts the target file
    is either fully absent or fully valid frontmatter afterward
  sensor: test-dispatch-fleet-alarm.sh
  threshold: new fault-injection test case passes; existing suite unaffected;
    additionally, listNodes() gains a defensive per-file try/catch so ONE
    malformed node file degrades to a per-file skip+warning rather than crashing
    every caller that enumerates the whole directory (a much larger,
    separately-scoped hardening — record here as a candidate, decide scope in
    /align-tactics)
  is_proxy: false
attention: null
phase: done
execution:
  branch: tactic-fleet-alarm-mint-rollback-corruption
  pr: 3014
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix:
    since: 2026-08-01
    attempt: 2
    pushed_sha: 0f907409486ebab29008069e86a63aeecc799bfc
  conflict: null
  completion:
    mergedAt: 2026-08-03T02:45:58Z
    mergeCommitSha: 6fcfd6931c2143334598a0fbdcd1d9025cdd8645
    graphCommitSha: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: true
rounds: null
attributes: {}
---
# dispatch-fleet-alarm's mint-failure rollback can leave a corrupted 0-byte node file that breaks listNodes() fleet-wide, stalling all dispatch for hours

Finalized via /align-tactics tactic-fleet-alarm-mint-rollback-corruption (2026-08-01). One PR, three units. See rationale/gap in frontmatter for the original incident investigation.

## Context

On 2026-08-01 the fleet showed 0 busy workers for 6+ hours. Two untracked,
exactly-0-byte files sat in the main checkout's `intentions/` —
`tactic-fleet-alarm-busy-stall.md` and `tactic-fleet-alarm-watch-unknown.md` —
neither in git (`git ls-files` empty, `git status` showed `??`). Because
`listNodes()` has no per-file error isolation, a single malformed file threw
`IntentionSchemaError: ... is missing an opening "---" frontmatter fence`
uncaught out of the whole directory scan, crashing every caller that enumerates
the store. `dispatch-graph-main-red-sync` was confirmed crashing (reported
`UNKNOWN`); the router's own selection path is the strongly-suspected second
victim. `dispatch-fleet-alarm`'s own log recorded
`minting tactic-fleet-alarm-watch-unknown failed; the write was rolled back` —
its rollback ran and a 0-byte file survived anyway. Deleting the two files
restored `listNodes()` immediately (468 nodes enumerated cleanly).

The exact instruction pointer at the moment of the live corruption was never
captured and cannot be recovered after the fact. This tactic therefore does not
try to pin the incident. It closes **every mechanically reachable producer of a
partial/0-byte `intentions/*.md`** that inspection can find, and bounds the blast
radius of any future one. Three producers were found and two were reproduced
directly during planning:

1. **`splice_body`'s swallowed exit status** (`dispatch-fleet-alarm:341-344`).
   `{ awk ...; cat "$BODY_FILE"; } > "$NODE_FILE.tmp" && mv ...` — a bash
   compound *group*'s exit status is its **last** command's (`cat`), so a
   fatally failing `awk` is discarded and the malformed `.tmp` is still `mv`'d
   over the real node file. Reproduced during planning:

   ```
   $ { awk '{print} /^---$/{c++; if(c==2) exit}' nofile.md; cat empty.txt; } > out.tmp; echo $?
   awk: fatal: cannot open file `nofile.md' for reading: No such file or directory
   0            <-- group reports success
   $ wc -c < out.tmp
   0            <-- and publishes a 0-byte node file
   ```

   The outer `if ! ... || ! splice_body || ...` at line 571 therefore never sees
   the failure, so **no rollback fires at all** for this class. Separately, `awk`
   exits **0** on a file with no `---` fences whatsoever, so exit status alone is
   still not sufficient — a positive frontmatter-shape assertion is also needed.

2. **`restore_from_blob`'s truncate-before-write** (`dispatch-fleet-alarm:332-334`).
   `git -C "$REPO_ROOT" show "$1" > "$NODE_FILE"` — the shell truncates
   `$NODE_FILE` to 0 bytes *before* `git show` runs. A failing `git show` leaves
   a 0-byte node file, and no call site (lines 509, 573, 632) checks the status.
   The rollback path can itself manufacture the exact corruption it exists to
   prevent.

3. **`writeNode()`'s non-atomic write** (`packages/intentionsutil/src/store.ts:54`).
   A single `writeFileSync(filePath, content)` — open+truncate, then write. A
   writer killed (SIGKILL, OOM, ENOSPC) between those two steps leaves a partial
   or 0-byte `intentions/<id>.md` for **every** graph-write caller, not just
   `dispatch-fleet-alarm`. This is the outlier: the same repo already uses
   temp-file-then-rename in bash at `dispatch-fleet-alarm:341-344` (`splice_body`),
   `dispatch-fleet-alarm:367-369` (`refresh_stamp_write`),
   `dispatch-mark-node-park:133-143`, `mark-node-terminal:103-104`, and in
   TypeScript at `office-hours-snapshot/src/persist.ts:58-93`.

### The design this plan lands (greenfield)

One invariant, enforced on both sides:

> **No file matching `intentions/*.md` is ever observable in a partial state, and
> no single unreadable file may cost more than one node.**

- **Write side (producer)** — every writer assembles content at a temp path that
  is *not* enumerable as a node (any `.tmp` suffix suffices: `listNodes`'
  filter is `endsWith(".md")`) and publishes it with one atomic `rename(2)`.
  A crash at any instant then leaves either the old file or the new file, never
  a partial one, with no dependency on a rollback branch running at all.
- **Read side (consumer)** — whole-directory enumeration isolates per-file read
  failures (skip + warn to stderr), **except** at the integrity gate
  (`validate-graph.ts`), which must still refuse loudly. Making enumeration
  tolerant *without* that carve-out would silently downgrade the required CI
  check on every `intentions/`-only push
  (`.github/workflows/graph-fast-path.yml`) into a pass on a corrupted store.

No brownfield migration path is needed: all three changes are
backwards-compatible at their call sites (`listNodes`' signature is unchanged and
its ~25 existing callers get the hardening for free), and the whole set fits one
PR. The only deliberate behavior change at a call site is `validate-graph.ts`
opting into the strict variant — one line.

### Deliberately out of scope

- Pinning which of the three producers caused the 2026-08-01 incident. The
  evidence to decide that no longer exists.
- The node's `gap` items (2) "was this the root cause of the 6h stall" (the
  stall began 03:45:51Z; the corrupt files' mtime was 06:01:08Z — a >2h unexplained
  gap remains) and (3) "did the fleet actually resume". Both are
  observe-in-production questions, not code changes. Do not chase them.
- The dirty `execution.fix` markers with high `attempt` counters observed on
  other nodes during the incident — a correlated hypothesis, not this tactic's
  subject.
- Changing the exit codes or control flow of `dispatch-fleet-alarm`'s three
  rollback branches (lines 572-576, 631-634, 508-511). Once `splice_body` and
  `restore_from_blob` report failure honestly, the existing rollback logic is
  correct as written.
- `.gitignore`: **no change needed**. A stray untracked `intentions/<id>.md.tmp`
  left by a SIGKILLed writer is invisible to `listNodes` (not `.md`) and to
  `graph-commit`'s clean-tree guard, which skips `??` lines
  (`packages/intentionsutil/scripts/graph-commit`, `assert_clean_outside_ids`,
  the `[[ "$line" == '??'* ]] && continue` line ~1690).

---

## Unit 1 — `store.ts`: atomic `writeNode`, fault-isolated `listNodes`, strict `validate-graph`

### Scope

**`packages/intentionsutil/src/store.ts`**

1. Line 1 — extend the `node:fs` import with `renameSync` and `rmSync`
   (currently `existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync`).

2. `writeNode(dir, node)` (lines 44-55) — replace the terminal
   `writeFileSync(filePath, content)` at line 54 with a temp-file-then-rename
   publish. Everything above it (validate → `assertPathSafeId` →
   `mkdirSync(dir, {recursive:true})` at line 47 → `readExistingBody` →
   `assertNoBodyLoss`) is unchanged; `mkdirSync` already guarantees the temp file
   can sit in the same directory as `filePath`, which `rename(2)` requires.
   Add a small module-private helper next to `writeNode` (this file has no
   atomic-write helper yet; nothing to extract from):

   ```ts
   /**
    * Publish `content` at `finalPath` atomically: write a collision-safe temp
    * file in the SAME directory (rename(2) cannot cross filesystems), then
    * rename it over the final path. An interrupted write (SIGKILL, OOM, ENOSPC)
    * can then only ever leave the temp file behind — never a partial or 0-byte
    * `<id>.md` that `listNodes` would choke on. Mirrors the established
    * `> "$f.tmp" && mv "$f.tmp" "$f"` convention already used in bash at
    * dispatch-fleet-alarm's splice_body/refresh_stamp_write and in TypeScript at
    * office-hours-snapshot/src/persist.ts.
    */
   function writeFileAtomic(finalPath: string, content: string): void {
     const dir = dirname(finalPath);
     const tmp = join(
       dir,
       `.${basename(finalPath)}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`,
     );
     try {
       writeFileSync(tmp, content);
       renameSync(tmp, finalPath);
     } catch (err) {
       try { rmSync(tmp, { force: true }); } catch { /* best-effort; rethrow the original */ }
       throw err;
     }
   }
   ```

   Add `basename`/`dirname` to the existing `node:path` import at line 2.
   The temp name is PID+random qualified so two concurrent writers of the same
   id cannot collide on one fixed `.tmp` (the
   `lib-reservation-ledger.sh:327` convention, and `tmpPathIn` in
   `office-hours-snapshot/src/persist.ts:58-66`). It ends in `.tmp`, never
   `.md`, so `listNodes` cannot see it even if a crash strands one.
   Do **not** wrap the fs error in `IntentionSchemaError` — `store.ts` lets raw
   fs errors propagate everywhere else (e.g. `readNode`'s `readFileSync`).

3. `listNodes(dir)` (lines 143-149) — split into three exported functions built
   on one primitive. Keep `listNodes`' existing signature and semantics for its
   ~25 callers; the only change they see is that a corrupt file costs one node
   instead of the whole call.

   ```ts
   export interface NodeReadFailure { id: string; error: unknown }

   /**
    * Enumerate every node, isolating per-file read failures. One malformed file
    * (a 0-byte or partially-written `<id>.md`) costs exactly one node, never the
    * whole directory — the fleet-wide blast radius observed on 2026-08-01.
    */
   export function listNodesResilient(dir: string): { nodes: IntentionNode[]; failures: NodeReadFailure[] }

   /** Tolerant enumeration: skip unreadable files with a stderr warning. The default. */
   export function listNodes(dir: string): IntentionNode[]

   /**
    * Strict enumeration: throw IntentionSchemaError naming EVERY unreadable file.
    * For integrity gates (validate-graph) where silently skipping a corrupt
    * tracked node would turn a required CI check into a false pass.
    */
   export function listNodesStrict(dir: string): IntentionNode[]
   ```

   - `listNodesResilient` keeps the existing
     `readdirSync(dir).filter((name) => name.endsWith(".md") && name !== "README.md").map(...).sort()`
     chain verbatim (lines 144-147) and wraps only the final
     `.map((id) => readNode(dir, id))` at line 148 in a per-id `try/catch`.
     This is the same instinct as the existing `README.md` special-case one line
     above — tolerate a non-node file in this directory — extended to a
     *malformed* node file.
   - `listNodes` warns once per failure via
     `process.stderr.write("warning: skipping unreadable node file <id>.md: <message>\n")`.
     `store.ts` has no existing stderr convention (there is none anywhere in
     `packages/intentionsutil/src/*.ts`), so this is new; use
     `process.stderr.write`, not `console.warn`, to match the capture helper the
     tests reuse.
   - `listNodesStrict` throws `IntentionSchemaError` (already imported at line 5)
     listing every failing id and its message, so one run reports all corruption
     rather than the first file only.
   - Update the JSDoc above `listNodes` (lines 135-142) to state the isolation
     contract and point at `listNodesStrict` for gates.

4. **`packages/intentionsutil/src/index.ts:50`** — extend the existing
   `export { writeNode, readNode, readNodeBody, listNodes } from "./store.js";`
   with `listNodesStrict` and `listNodesResilient`.

**`packages/intentionsutil/scripts/validate-graph.ts`**

5. Line 34 — import `listNodesStrict` instead of `listNodes`; line 66 — call it.
   Nothing else changes. `main()` has no try/catch and no `process.exit`; an
   uncaught throw is how this script already fails, so the strict variant's throw
   produces the correct non-zero CI exit.

**`packages/intentionsutil/test/store.test.ts`** — extend in place; do not add a
new test file. Reuse `tempDir()` at lines 8-10 verbatim. Copy the
`captureStderr<T>(fn)` helper from
`packages/intentionsutil/test/dump-node.test.ts:47-64` (the `vi.spyOn(process.stderr,
"write")` + `mockRestore()` in `finally` shape) into `store.test.ts` — do not
write a fresh spy, and do not factor a shared test-util for one consumer.

- New `describe("writeNode atomicity")`:
  - *publishes by rename, not in-place truncate* — `writeNode` a node, record
    `statSync(filePath).ino`, `writeNode` again with a changed `statement`,
    assert the inode **differs**. A `rename(2)`-published write always swaps in a
    fresh inode; today's `writeFileSync` reuses the same one, so this test fails
    before the fix and passes after. This is the deterministic proxy for
    "a killed writer cannot be observed mid-write" — do not attempt to actually
    kill a process.
  - *leaves no temp residue on success* — after `writeNode`, assert
    `readdirSync(dir)` equals exactly `["<id>.md"]`.
  - *leaves no residue and no partial file when the publish fails* — `writeNode`
    a node, then `chmodSync(dir, 0o555)`, then expect a second `writeNode` to
    throw; assert `readdirSync(dir)` is still exactly `["<id>.md"]` and
    `readNode(dir, id)` still returns the ORIGINAL content. `chmodSync(dir,
    0o755)` in a `finally`. Guard the whole case with
    `it.skipIf(process.getuid?.() === 0)` — root ignores directory permissions.
- New cases inside the existing `describe("listNodes")` block (lines 425-459),
  as siblings of the "skips the non-node README.md companion doc" test at
  lines 443-458 — copy that test's shape (good `writeNode` calls plus a
  hand-written bad file, then assert on the ids returned):
  - *skips a 0-byte node file and warns* — `writeFileSync(join(dir, "corrupt.md"), "")`
    alongside two good nodes; assert via `captureStderr` that
    `listNodes` returns only the two good ids and that the warning names
    `corrupt`.
  - *skips a truncated node file* — build the corrupt file with the
    hand-corruption idiom already used at `store.test.ts:218-224` etc. (read the
    raw file, `raw.indexOf("\n---\n")`, slice, `writeFileSync` the truncated
    remainder) so the file has an opening fence but no closing one.
  - *`listNodesResilient` reports the failures* — same fixture; assert
    `failures.map(f => f.id)` equals the corrupt ids and `nodes` the good ones.
  - *`listNodesStrict` throws and names every unreadable file* — same fixture
    with **two** corrupt files; assert the thrown message contains both ids.

Out of scope for this unit: touching any of the other ~24 `listNodes` call sites
(`read-sensors.ts`, `select-targets.ts`, `office-hours-select.ts`,
`reconcile-graph.ts`, `dispatch-graph-main-red-sync`, …) — they all keep calling
`listNodes` and inherit the tolerant behavior with no edit. Also out of scope:
any `.gitignore` change, and `merge-node.ts:90` /
`restamp-scope-fingerprint.ts:96` / `dump-node.ts:161,166`, which have the same
non-atomic `writeFileSync` shape but do not write `intentions/<id>.md` through
this seam.

### Recommended model

opus — the API split, the tolerant-vs-strict carve-out, and the judgment that
`validate-graph` must not be silently downgraded are design decisions with
fleet-wide consequences, and the change is spread across four files.

---

## Unit 2 — `dispatch-fleet-alarm`: make `splice_body` and `restore_from_blob` unable to publish a malformed file

### Scope

Single file: `.claude/skills/dispatch-propagate/scripts/dispatch-fleet-alarm`.
The script runs under `set -uo pipefail` (line 155) — **not** `set -e` — so a
non-zero status inside a function does not abort the script; every gate below
must be explicit.

1. **`splice_body()` (lines 336-344)** — rewrite. Two independent defects: the
   compound group discards `awk`'s status, and `awk` exits 0 on a file with no
   fences at all. Fix both:

   ```bash
   splice_body() {
     local tmp="$NODE_FILE.tmp"
     # Step 1 — frontmatter through the closing fence. awk's OWN status must gate
     # everything downstream: the previous `{ awk ...; cat ...; } > tmp && mv`
     # reported the GROUP's status, which is `cat`'s (always 0), so a fatal awk
     # was swallowed and a malformed tmp was still published.
     if ! awk '{print} /^---$/{c++; if(c==2) exit}' "$NODE_FILE" > "$tmp"; then
       rm -f "$tmp"
       log "could not read the frontmatter of $NODE_FILE — the body splice was abandoned"
       return 1
     fi
     # Step 2 — positive shape assertion. awk exits 0 on a file with NO fences at
     # all (and on a 0-byte file), so status alone is not enough. The extract ends
     # exactly at the second fence, so first and last lines must both be `---`.
     if [[ "$(head -n 1 "$tmp")" != "---" || "$(tail -n 1 "$tmp")" != "---" ]]; then
       rm -f "$tmp"
       log "$NODE_FILE has no complete YAML frontmatter — refusing to splice a malformed node file"
       return 1
     fi
     # Step 3 — append the reading, then publish atomically.
     if ! cat "$BODY_FILE" >> "$tmp"; then
       rm -f "$tmp"
       log "could not read the reading from $BODY_FILE — the body splice was abandoned"
       return 1
     fi
     mv "$tmp" "$NODE_FILE"
   }
   ```

   Keep the existing comment block at lines 336-340 (what the splice is for and
   the two-fence awk idiom's provenance) and add the "why the group's status was
   wrong" note above Step 1. Every failure path removes `$tmp` itself, so the
   function never strands residue regardless of which rollback branch the caller
   takes.

2. **`restore_from_blob()` (lines 329-334)** — rewrite to the same shape:

   ```bash
   restore_from_blob() {
     local tmp="$NODE_FILE.tmp"
     # `git show <sha> > "$NODE_FILE"` truncated the node file BEFORE git ran, so
     # a failing `git show` left a 0-byte node file — the rollback path
     # manufacturing exactly the corruption it exists to prevent. Stage to a tmp
     # and publish by rename instead: a failure now leaves the file untouched.
     if ! git -C "$REPO_ROOT" show "$1" > "$tmp"; then
       rm -f "$tmp"
       log "could not restore $NODE_REL from blob $1 — the node file was left as-is"
       return 1
     fi
     mv "$tmp" "$NODE_FILE"
   }
   ```

3. Leave the three rollback branches **unchanged**: the mint branch at
   lines 572-576 (`restore_from_blob "$PRE_BLOB"` / `rm -f "$NODE_FILE"
   "$NODE_FILE.tmp"`), the refresh branch at 631-634, and the resolve branch at
   508-511. Once `splice_body` reports failure honestly, the mint branch's
   existing `rm -f` finally starts firing for the swallowed-awk class, which is
   the whole point — verify that with Unit 3 rather than adding new rollback
   code. The refresh branch's `PRE_BLOB`-empty case (which intentionally does not
   `rm` a local-only node) also needs no change now that `splice_body` cleans up
   its own `.tmp`.

Out of scope: `run_graph_commit`, `verify_landed`, `refresh_stamp_write`
(already correct at lines 367-369), the rate-limit brakes, the graph-write mutex,
and the node JSON shape asserted by existing test case (2).

### Recommended model

sonnet — two localized bash rewrites fully specified above, in one file, with no
design latitude.

---

## Unit 3 — fault-injection cases in `test-dispatch-fleet-alarm.sh`

### Scope

Single file: `.claude/skills/dispatch-propagate/scripts/test-dispatch-fleet-alarm.sh`
(403 lines; baseline before this unit: **52 passed, 0 failed** — verified during
planning). Extend the existing DI harness; do not build a new one.

CI wiring: none needed. `run-unit-tests.sh` sets `RUN_PR_SCRIPTS=true` for any
changed path under `.claude/skills/dispatch-propagate/scripts/` and then globs
`test-*.sh` in that directory (lines 88, 190). Unit 2 changes the SUT in that
directory, so this suite runs. It must **not** be added to
`.github/workflows/unit-tests.yml` — that list is explicitly reserved (per its
comment at lines 198-205) for suites whose SUT lives *outside* that directory.

1. **Add a shared assertion helper** beside the existing primitives at lines
   43-53 (`ok`/`no`/`assert_eq`/`assert_contains`/`assert_not_contains` — reuse
   these directly, no others are needed):

   ```bash
   # assert_absent_or_valid <label> <node-file> — the tactic's success invariant:
   # after a failed mint the node file is EITHER fully absent OR fully valid
   # double-fenced frontmatter. Never partial, never 0-byte.
   assert_absent_or_valid() {
     local label="$1" f="$2"
     if [[ ! -e "$f" ]]; then ok "$label (absent)"; return; fi
     if [[ ! -s "$f" ]]; then no "$label (file exists but is 0 bytes)"; return; fi
     if [[ "$(head -n 1 "$f")" == "---" ]] \
        && awk '/^---$/{c++} END{exit (c>=2)?0:1}' "$f"; then
       ok "$label (valid frontmatter)"
     else
       no "$label (file exists with malformed frontmatter)"
     fi
   }
   ```

2. **Add fault knobs to `stub-write-node`** (heredoc at lines 94-118), read at
   call time, exactly mirroring `stub-graph-commit`'s `STUB_GC_EXIT`/`STUB_GC_LAND`
   idiom (lines 135-156). Keep the default path byte-identical so cases (2)-(11)
   are unaffected. Add a single `STUB_WN_SHAPE` switch consulted before the
   normal write:
   - `none` — write **nothing** at all and `exit 0`. Models a writer that
     reported success without creating the file; drives `splice_body`'s `awk`
     into a fatal "cannot open file" — the exact swallowed-status defect.
   - `zero` — `: > "$STUB_INTENTIONS/$id.md"` then `exit 1`. Models a writer
     killed mid-write (the 0-byte-file idiom already used at
     `test-dispatch-self-close.sh:404-412`).
   - `no-fence` — write a fence-less file (`printf 'garbage\n'`) and `exit 0`.
     Models a file that exists but has no frontmatter.

3. **New cases**, appended after case (11) (line 389) and before the results
   block (line 398). Each uses a kind no earlier case has touched (e.g.
   `tick-stale` is taken; use `busy-stall`-style fresh kinds and check the kind
   is accepted by the SUT's kind whitelist — reuse `daemon-degraded`/`watch-unknown`
   only if not already left in a landed state by an earlier case; prefer a fresh
   kind, and reset the fixture with `git -C "$FR" checkout -- intentions` +
   `git -C "$FR" update-ref refs/remotes/origin/main HEAD` first, the pattern
   cases (8) and (9) already use). `STUB_STATE=absent` for all three so the mint
   path with `PRE_BLOB` empty is exercised.

   - **(12) writer reports success but wrote nothing** —
     `STUB_WN_SHAPE=none`, `--body-file "$BODY"`.
     Assert: `RC` is `1`; `$OUT` contains `the write was rolled back`;
     `assert_absent_or_valid` on `$FR/intentions/<id>.md`; no `<id>.md.tmp`
     residue; `git -C "$FR" status --porcelain` is empty.
     **Fails before Unit 2** (awk's fatal is swallowed, `cat` succeeds, a
     body-only file is published, the SUT proceeds).
   - **(13) the 0-byte reproduction** — same as (12) but with a **0-byte** body
     file (`: > "$WORK/body-empty.md"`; the SUT only requires `-f`, see its
     `--body-file` check at line 248). This reproduces the live incident's exact
     artifact: awk fails, `cat` of an empty file succeeds, and a 0-byte
     `intentions/<id>.md` is published. Same assertions.
   - **(14) node file exists but has no frontmatter** — `STUB_WN_SHAPE=no-fence`,
     `STUB_GC_LAND=1`. Here `awk` exits **0**, so only the positive shape
     assertion catches it. Assert: `RC` is `1`; `$OUT` contains
     `the write was rolled back`; `assert_absent_or_valid`; tree clean.
     **Fails before Unit 2.**
   - **(15) writer killed mid-write** — `STUB_WN_SHAPE=zero`. Assert `RC` is `1`,
     `assert_absent_or_valid`, tree clean, and that `graph-commit` was
     **never** invoked (`assert_eq "" "$(log_lines graph-commit.log)"`). This one
     **passes before Unit 2** (the non-zero write-node exit short-circuits the
     `||` chain into the existing `rm -f`); it is a regression pin for the path
     that already works, and it is the case that would have caught a killed
     writer leaking past the rollback.
   - **(16) doctrine ratchet on the two rewritten functions** — assert the SUT
     source no longer contains the swallowed-status idiom or the
     truncate-before-write idiom, so a later edit cannot silently reintroduce
     either. Grep `$SUT` for the literal `; cat "$BODY_FILE"; } >` and for
     `show "$1" > "$NODE_FILE"` and assert **zero** matches, with a diagnostic
     naming this tactic. (Same shape as the existing
     `test-fix-checks-cas-guard.sh` / `test-dispatch-chain-worktree-ratchet.sh`
     ratchets.)

4. Update the suite's header `Coverage:` list (lines 15-23) with the new cases.

Out of scope: `test-graph-write-rollback.sh` (its Units 1-5 cover
`transition-node`, `dispatch-graph-census`, and `dispatch-graph-main-red-sync`;
`dispatch-fleet-alarm` is deliberately covered by its own suite, which is this
tactic's named `success_signal.sensor`), and any change to cases (1)-(11).

### Recommended model

sonnet — new cases in an existing harness whose stub/env-knob/assertion patterns
are all named above with line anchors.

### Dependencies

Unit 2 (cases 12, 13, 14 assert the fixed behavior and fail before it).

---

## Reuse

- `office-hours-snapshot/src/persist.ts:58-93` — `tmpPathIn(dir)` /
  `atomicCommit(finalPath, produce)` / `atomicWrite`: the temp-path +
  `renameSync` + `rmSync`-on-error pattern to port into `writeNode`. Same
  directory, PID/time/random-qualified temp name, best-effort cleanup, rethrow
  the original error.
- `.claude/skills/dispatch-propagate/scripts/dispatch-fleet-alarm:367-369`
  (`refresh_stamp_write`) — the in-file `> "$f.tmp" && mv -f "$f.tmp" "$f"`
  precedent the rewritten `splice_body`/`restore_from_blob` must match.
  Corroborating sites: `dispatch-mark-node-park:133-143` (three instances),
  `packages/intentionsutil/scripts/mark-node-terminal:103-104`,
  `.claude/skills/dispatch-propagate/scripts/lib-reservation-ledger.sh:327`
  (PID-qualified temp naming for concurrent writers).
- `packages/intentionsutil/src/store.ts:144-147` — the existing
  `readdirSync().filter().map().sort()` chain and the `README.md` skip: keep
  verbatim, wrap only the final `readNode` map.
- `packages/intentionsutil/src/errors.ts:1-6` — `IntentionSchemaError`, already
  imported by `store.ts`; use it for `listNodesStrict`'s throw. Do **not** wrap
  raw fs errors from the atomic write — `store.ts` propagates those unwrapped.
- `packages/intentionsutil/test/store.test.ts:8-10` — `tempDir()`; reuse verbatim.
- `packages/intentionsutil/test/store.test.ts:443-458` — the "skips the non-node
  README.md companion doc" test; copy its shape for the corrupt-file cases.
- `packages/intentionsutil/test/store.test.ts:218-224` (and 257-263, 290-295) —
  the `raw.indexOf("\n---\n")` + slice + `writeFileSync` hand-corruption idiom
  for building a truncated node file.
- `packages/intentionsutil/test/dump-node.test.ts:47-64` — `captureStderr<T>(fn)`;
  copy into `store.test.ts` for the skip-warning assertions.
- `packages/intentionsutil/test/write-node.test.ts:43-56` — the "throws and does
  NOT write a file" assertion shape for the failed-publish case.
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-fleet-alarm.sh:43-53`
  (`ok`/`no`/`assert_eq`/`assert_contains`/`assert_not_contains`), `:94-158`
  (the three stubs), `:135-156` (`STUB_GC_EXIT`/`STUB_GC_LAND`, the fault-knob
  idiom), `:163-189` (`run_alarm` and every injected env seam), `:244-247` (the
  two-fence `awk 'p; /^---$/{c++; if(c==2) p=1}'` body-extraction idiom),
  `:300-311` (case 7 — the closest "writer claims success but corrupts state"
  assertion shape).
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-self-close.sh:404-412`
  — the `: > "$file"` 0-byte fault-injection idiom for `STUB_WN_SHAPE=zero`.

---

## Verification

Run from the worktree root. All three blocks must be green before the PR opens;
the vitest and bash suites are the tactic's `success_signal` sensors.

```verify
npx tsc --noEmit -p packages/intentionsutil
```

```verify
npx vitest run --project packages/intentionsutil --root .
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-fleet-alarm.sh
```

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts intentions
```

The last block is the load-bearing check that Unit 1's strict carve-out did not
break the real store: `validate-graph.ts` is the required CI check on every
`intentions/`-only push (`.github/workflows/graph-fast-path.yml`), and it now
throws on **any** unreadable file in `intentions/`, including an untracked stray
in the local working tree. If it fails on a file you did not author, that is the
gate doing its job — remove the stray file, do not soften the gate.

Baselines to compare against (measured during planning, on this worktree at
`ac8cc210`): `test-dispatch-fleet-alarm.sh` → `Results: 52 passed, 0 failed`;
`store.test.ts` → 18 tests passing; `tsc --noEmit -p packages/intentionsutil` →
clean. Every existing case must still pass — cases (1)-(11) of the bash suite and
every existing `store.test.ts` block are regression guards for behavior this
tactic does not intend to change.

**Red-before-green check (do this manually, it is the point of the tactic).**
Before applying Unit 2, run the Unit 3 suite and confirm cases (12), (13) and
(14) **fail**, and that case (13)'s failure names a 0-byte file. Then apply Unit 2
and confirm they pass. A green run of the new cases against the unfixed SUT means
the fault injection is not reaching `splice_body` and the test is worthless —
fix the injection, never relax the assertion. Likewise for Unit 1: confirm the
inode-swap test in `describe("writeNode atomicity")` fails against the unmodified
`writeNode` before the fix lands.

**Manual sanity check on the tolerant read path.** In a scratch directory, plant
a 0-byte `<id>.md` next to a valid node and run any whole-store enumerator (e.g.
`npx tsx packages/intentionsutil/scripts/graph-digest.ts` against that directory,
or a one-line `node --import tsx/esm -e` calling `listNodes`). It must print the
warning to stderr, return the valid node, and exit 0 — the behavior that would
have kept `dispatch-graph-main-red-sync` and the router alive on 2026-08-01.

**Observe in production after merge (`needs-main` residue, not verifiable
pre-merge).** On the dispatch host, over the days following the merge:

- `find <repo>/intentions -name '*.md' -size 0` returns nothing, and
  `find <repo>/intentions -name '*.md.tmp' -o -name '.*.tmp'` returns nothing
  persistent (a transient one during a write is expected and harmless).
- `journalctl --user -t dispatch-fleet-watch` shows `dispatch-fleet-alarm` minting
  and landing alarm nodes normally, with no recurrence of
  `minting <id> failed; the write was rolled back` followed by a surviving file.
- If a mint does fail, the accompanying stderr now names *which* step refused
  (`could not read the frontmatter of ...`, `has no complete YAML frontmatter`,
  `could not read the reading from ...`, or `could not restore ... from blob`) —
  that diagnostic is the trace the original incident lacked, and it is what would
  finally pin the live root cause if it recurs.

Explicitly **not** verified by this tactic, and not to be chased by the
implementer: whether the corrupted files were the root cause of the full 6h
busy-stall (the node's `gap` item 2 — a >2h window before the files appeared
remains unexplained), and whether the fleet resumed because of this session's
manual cleanup (`gap` item 3). Both are historical questions about a specific
incident, not properties of the code this plan changes.
