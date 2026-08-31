---
id: tactic-autonomous-body-write-wholesale-replace
kind: tactic
statement: Four autonomous surfaces replace a node's entire markdown body while
  keeping its frontmatter, on paths where the node already exists and its body
  may carry authored analysis — give them one shared primitive whose unattended
  edit appends, or replaces in place a region the writer owns, and whose
  wholesale replace is mechanically reserved for creates
owner: ai
status: codified
parent: null
rationale: "Minted 2026-08-15 on author ruling, from the per-site write-site
  sweep recorded on tactic-finding-search-all-producers; statement, rationale
  and body reconciled 2026-08-20 at the /align-tactics finalize round against a
  fresh measurement on origin/main 43e18881 (clarification 32's whole-node bar).
  The markdown body is half of tacticScopeFingerprint
  (packages/intentionsutil/src/router.ts:131-133), so an unattended body write
  is a scope-substance write made with no human ruling on it. Four surfaces
  perform one wholesale on a path where the node already exists:
  dispatch-eval-finding's splice_body on the recurrence path (--body-file is
  mandatory there, so a recurrence ALWAYS replaces the whole ledger-entry body)
  and on the resolved path; dispatch-fleet-alarm's splice_body on the open-case
  refresh; and dispatch-diagnose-main's prose-instructed open case, which is a
  documented idiom rather than code. splice_body itself is copy-pasted into
  three scripts and written out a fourth time as prose. TWO CLAIMS FROM THE
  2026-08-15 MINT ARE CORRECTED HERE rather than carried forward. (1) The count
  was recorded as two; measured, it is four — the original sweep enumerated
  frontmatter writers and never asked which callers write bodies, and the roster
  on tactic-finding-search-all-producers records dispatch-fleet-alarm's mint
  call only, omitting its refresh. (2) The claim that dispatch-graph-census
  'does the equivalent on every run after the first' is FALSE, and was already
  false at the mint: decideCensus gates birth on !idExists against the
  deterministic-per-day census id, its docstring reads 'never clobber an
  existing node', and that guard landed in c6fe3c8f on 2026-07-11. What survives
  at that site is a much narrower stale-local-read re-birth race, scoped as Unit
  4. The same refuted claim is still carried by strategy-graph-native-dispatch
  clarification 245 and needs an attended correction at the /align interview —
  an autonomous lane may not edit durable-layer substance. A THIRD FRAMING IS
  NARROWED. The mint called these writes 'the same class this round's four
  violators belong to'. Clarification 245's autonomous-substance invariant
  forbids an autonomous EDIT-SUBSTANCE only on a DURABLE-LAYER node; census,
  ledger, alarm and main-red nodes are all tactics, so these writes are legal
  under it — that clarification says so itself of dispatch-graph-census ('legal
  only because census nodes are tactics, which is luck rather than design').
  What is actually defective is body loss on an edit path and the
  scope-fingerprint churn it causes, and the fix stands on that harm alone.
  Neither script is malicious or wrong in its own lane; the defect is that none
  of them can tell an authored body from a generated one, and nothing detects it
  if one fires."
reading: null
serves:
  - strategy-graph-native-dispatch
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
office_hours:
  reason: "PR18 (merge 478cc324, #3134) shipped this node at ONE of its four
    surfaces, by a local contract rather than the shared primitive the node
    exists to introduce. Six of its seven units did not ship: Unit 1 (the shared
    node_body_write in lib.sh) is absent, so Unit 3 hardened
    dispatch-eval-finding's own splice_body in place instead of deleting it;
    Units 2, 5, 6 and 7 are untouched, and Unit 4 was routed to #3037 on
    2026-08-20. The copy-paste this node exists to eliminate still sits at three
    sites (dispatch-eval-finding, dispatch-fleet-alarm,
    dispatch-invalid-state-followup). The serialized plan lists this node under
    PR18's \"Nodes closed (5)\", but it annotates it \"a draft, not a plan ...
    no verification block\", which was true of the 2026-08-15 draft and is not
    true of this node — the 2026-08-20 /align-tactics round finalized it to
    phase implement with seven units and a Verification section. The plan
    therefore closed a node it described as something else, and no ruling
    narrows this node to the single site PR18 took. Grepped across the whole
    serialized plan: no PR section claims node_body_write,
    dispatch-diagnose-main, or dispatch-invalid-state-followup's copy, so
    closing this node done would drop that work out of the graph rather than
    hand it on. Parked by the PR18 closing batch rather than closed. Full
    unit-by-unit measurement against the merge commit is in the body section
    \"PR18 shipped Unit 3's site only\"."
  since: 2026-08-29
  recommendation: "Pick one of three, all of which the closing batch was not
    authorized to pick. (1) SPLIT — keep this node open for the remaining work
    and record that its Unit 3 is satisfied at dispatch-eval-finding by a local
    contract; the shared-primitive extraction (Units 1, 2, 5, 6, 7) stays here
    and gets a position in the serialized window. This is the recommended
    option: it loses nothing and matches what actually shipped. (2) NARROW AND
    CLOSE — rule that this node was only ever meant to cover the
    dispatch-eval-finding site, close it done, and mint a new tactic for the
    shared primitive and the two remaining copies so the work stays in the
    graph. Do NOT close it without minting that successor; the remaining units
    are assigned nowhere else. (3) CLOSE AS SUPERSEDED — if the shared-primitive
    design is no longer wanted and per-site contracts are the intended end
    state, close this node and record that ruling, so the three surviving
    splice_body copies are a deliberate choice rather than an unfinished
    migration. Note that PR18's own review raised the same shape one layer up:
    the durable-write fence on tactic-dispatch-conflict-substance-allowlist was
    argued to belong inside write-node.ts rather than in a skill step. If
    per-site contracts are being chosen deliberately here, that argument is
    worth ruling on at the same time. Whichever is picked, the four sibling
    nodes of PR18 are already closed (phase done, execution.completion citing
    478cc324) and none of them depends on this decision."
  session_type: other
pace_exempt: false
rounds: null
attributes: {}
---
# Four autonomous surfaces replace a node's entire markdown body while keeping its frontmatter, on paths where the node already exists and its body may carry authored analysis — give them one shared primitive whose unattended edit appends, or replaces in place a region the writer owns, and whose wholesale replace is mechanically reserved for creates

## Context

The markdown body is half of `tacticScopeFingerprint`
(`packages/intentionsutil/src/router.ts:131-133` — the pair `(statement, body)`).
A body write is therefore a **scope-substance write**. Four autonomous surfaces
perform one **wholesale**, on paths where the node already exists and its body
may carry hand-authored analysis from an earlier session or an office-hours
sitting. None of them can tell an authored body from a generated one.

These sites were missed by the 2026-08-14/15 doctrine round because that sweep
enumerated **frontmatter** writers and never asked which callers write **bodies**.

**Be precise about the doctrine, because the 2026-08-15 draft was not.** These are
*not* violations of clarification 245's autonomous-substance invariant. That
invariant forbids an autonomous lane from doing an EDIT-SUBSTANCE on a
**durable-layer** node (virtue, strategy, delegation, kind, tradition); census,
ledger, alarm and main-red nodes are all **tactics**, so these writes are legal
under it — clarification 245 says exactly that of `dispatch-graph-census`
("legal only because census nodes are tactics, which is luck rather than
design") and files it as *legal-but-unmonitored*. What is actually defective is
**body loss on an edit path**, plus the scope-fingerprint churn it causes. The
fix stands on that harm alone. Do not write a verification step that asserts
invariant enforcement — it would be asserting something the doctrine does not
say. The V1-V4 kinship is one of *shape* (a prompt where a gate belongs), not of
rule violated.

Neither script is malicious or wrong in its own lane; the defect is structural —
the capability exists, it runs with no human ruling on it, and nothing detects it
if it fires.

The intended outcome: **one shared, tested body-write primitive** with three
modes, where a wholesale replace is mechanically reserved for creates (and
mechanically refused over a non-placeholder body), and every unattended edit
either appends or replaces a region the writer explicitly owns — leaving
everything outside that region untouched.

### Two corrections this plan carries (do not restate the old claims)

1. **The "two sites" count was understated. There are four.** The measured sweep
   (`grep -rn 'c==2) exit' --exclude-dir=node_modules --exclude-dir=.git .`, each
   hit read in full and classified create-path vs edit-path) is in §Measured
   sites below.
2. **The `dispatch-graph-census` claim is refuted as written.** The earlier draft
   said census "does the equivalent on every run after the first." That is false,
   and was false when this node was minted on 2026-08-15. The same false claim
   appears in the serving strategy's clarification 245 ("ONE FURTHER MEASURED
   FINDING") and in this node's own `rationale` frontmatter, which needs
   correcting. Measured: `decideCensus`
   (`packages/intentionsutil/scripts/graph-census-debt.ts:317-338`) sets
   `shouldBirth = debt.total >= threshold && debt.openCensus.length === 0 && !idExists`,
   where `idExists` tests the deterministic-per-day id `tactic-graph-census-<YYYY-MM-DD>`;
   its docstring says "never clobber an existing node" and it landed in `c6fe3c8f`
   on 2026-07-11, a month before this node was minted. What survives is a much
   narrower **stale-read race**, described in Unit 4.

### Measured sites (verified on origin/main `43e18881`, 2026-08-20)

Locate by **symbol**, never by line — the earlier draft's anchors were all stale
by roughly +40 lines.

**Genuine unattended wholesale replace on a path where the node ALREADY EXISTS:**

1. `.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding` **recurrence**
   — `splice_body` call at `:1263`, inside the `open|retired)` case
   (`:1194-1287`). `--body-file` is **mandatory** on the record path (validated at
   `:655`), so a recurrence **always** replaces the whole ledger-entry body. The
   worst of the four. It does carry an in-flight guard (`:1207-1211`, refuses when
   `.execution != null`), which protects an in-flight session's scope stamp but
   **not** hand-authored analysis on a node with `execution: null` — i.e. every
   parked or draft ledger entry.
2. `dispatch-eval-finding` **resolved** — `splice_body` call at `:1068`, guarded by
   `{ [[ -n "$BODY_FILE" ]] && ! splice_body; }`. `--body-file` is optional here.
   The same `execution != null` guard sits at `:1046-1050`. Same partial mitigation,
   same gap.
3. `.claude/skills/dispatch-propagate/scripts/dispatch-fleet-alarm` **refresh** —
   `splice_body` call at `:790`, in the `open)` re-detection case (`:742-800`).
   Not named in the earlier draft at all. It has two brakes the eval-finding sites
   lack — a `cmp -s` no-op check against the on-disk body (`:751-760`) and a
   `MIN_REFRESH_INTERVAL` rate limit (`:762-781`) — plus `--base` CAS. But when the
   generated reading genuinely differs, the replace is wholesale, so any human
   annotation on an open alarm node is destroyed on the next refresh tick.
4. `.claude/skills/dispatch-diagnose-main/SKILL.md` case **"open"** (`:193-217`)
   — prose-instructed, model-executed in a spawned bg job, so unattended in the
   sense that matters. Same `cmp -s` no-op brake and `--base` CAS as fleet-alarm,
   same wholesale replace on a real diff. This one is **prose, not code** — the
   same "a prompt is not a gate" class clarification 245 condemns for V2/V4.

**`splice_body` is copy-pasted into three scripts** — `dispatch-eval-finding:751-769`,
`dispatch-fleet-alarm:411-436`, `dispatch-invalid-state-followup:323-327` — and
documented a fourth time as prose at `.claude/skills/dispatch-diagnose-main/SKILL.md:178-187`,
which all three cite in comments as the canonical home. It is a documented pattern,
not an importable function, and each copy re-implements it with independent
variations (some gate on awk's own exit status, some do not; some publish
atomically, some do not). Six copies of one instruction is the same defect class
clarification 235 named for the five private writers.

### The greenfield answer already exists in this repo

The earlier draft framed "marker comment pair vs first `##` heading" and
"one-time migration vs treat an unmarked body as wholly authored" as open for
decomposition. They are **not open** — three sibling writers already implement the
create-vs-edit split:

- `packages/intentionsutil/scripts/hold-node:252-272` — the canonical split.
  `DISPOSITION == NONE` (create) replaces wholesale, with a header comment
  explaining why a create *must* replace: `writeNode` gives a brand-new file the
  generated `# ${statement}` placeholder body
  (`packages/intentionsutil/src/store.ts:57`), so appending would yield a
  malformed two-H1 body. `EXISTING`/`REOPENED` (edit) does
  `jq -r '.node_body_append' <<<"$DECISION" >> "$HOLD_MD"` with the comment
  "APPEND the dated occurrence stanza — never replace."
- `packages/intentionsutil/scripts/arm-wait:375-394` — the same shape, same
  comments, for WAIT nodes, duplicated in full rather than shared.
- `.claude/skills/dispatch-propagate/scripts/dispatch-invalid-state-followup:399-462`
  — the richest, and the reference model. Reads the on-disk body
  (`awk 'p; /^---$/{c++; if(c==2) p=1}'`), greps an `OCCURRENCE_KEY` for
  idempotency and exits `unchanged` with no commit, ensures a `## Occurrences`
  heading exists, appends the dated stanza, `cmp -s` against the original,
  captures a `dump-node.ts` `--base` CAS manifest, and only then splices the
  **reconstructed** (prior + appended) body. Its header at `:399-417` argues the
  case explicitly: re-running the create path on an existing node "would clobber
  the recorded occurrence history with no `--base` to refuse against."

**Where this plan diverges from that precedent, and why.** The precedent's
delimiter is a named `##` heading with append-at-end semantics. That works for
short accumulating stanzas. It cannot bound a **replace-in-place** region whose
generated content itself contains `##` headings — which is exactly what the
fleet-alarm reading and the diagnose-main diagnosis are. The counter-argument the
draft flagged is real and is engaged here: fleet-alarm's refresh body and
diagnose-main's open-case body are **latest-reading** bodies, not accumulating
logs, so append-forever grows them without bound. So the shared helper carries a
**third mode** — an owned, delimited region the writer *replaces in place*,
leaving everything outside it untouched — alongside the append mode that fits the
occurrence-log sites. The delimiter for that third mode is an HTML comment pair
(invisible when rendered, unambiguous, nestable-content-safe); the append mode
keeps the precedent's heading convention unchanged. This is one implementation
with three modes, not a fourth spelling.

**Migration is self-executing, not a separate pass.** On an existing body with no
marker pair, region mode **appends** a fresh marked region at the end, preserving
the whole prior body verbatim. A node's body doubles exactly once, then is stable.
No migration script, no one-time sweep, and nothing is ever lost — which is
strictly safer than the draft's "refuse to touch an unmarked body" reading, since
that would leave every live alarm and ledger node permanently unwritable.

---

## Unit 1 — the shared body-write primitive, in `lib.sh`, with a CLI wrapper

**READ THIS FIRST — an in-flight sibling is building half of this unit.**
`tactic-scope-fingerprint-plan-substance` is at **phase qa on PR #2974** and its
Units 1-2 add two files that are **absent from `origin/main` today** and so do
not appear in any grep run while writing this plan:

- `packages/intentionsutil/src/body-substance.ts` — a leaf module that splits a
  node body into plan substance vs machinery-appended sections.
- `packages/intentionsutil/scripts/append-machinery-section.ts` — a CLI,
  `append-machinery-section.ts <id> [--dir <intentions-dir>] [--section-file <path>|-]`,
  which appends a machinery-owned `## ` section to a node body **without going
  through `writeNode`** (it reads the file raw, takes `extractBody` from
  `packages/intentionsutil/src/frontmatter.ts:31-38`, and rewrites
  `raw.slice(0, raw.length - body.length) + appendMachinerySection(body, section)`,
  so the frontmatter bytes are preserved exactly). Its tests assert the
  frontmatter is byte-identical across writes and that the sentinel appears
  exactly once after two appends.

That is this unit's **`append` mode**, already built, in TypeScript, in
`packages/intentionsutil/scripts/`. Building a second one in `lib.sh` would be
the exact reuse failure this plan's §Context condemns, and it would land days
apart from the first.

**So Unit 1 is scoped against #2974, not around it. Before writing any code:**

1. `git fetch origin main` and check whether `packages/intentionsutil/scripts/append-machinery-section.ts`
   and `packages/intentionsutil/src/body-substance.ts` exist yet.
2. **If they have landed** — do not implement an `append` mode at all. `lib.sh`'s
   `node_body_write … append` becomes a thin shell-out to
   `npx tsx packages/intentionsutil/scripts/append-machinery-section.ts`, and the
   `region` and `create` modes below are implemented **in TypeScript alongside
   them**, extending `body-substance.ts` and the same CLI (add a `--mode` flag)
   rather than starting a parallel bash implementation. The dispatch scripts
   already relative-path into `packages/intentionsutil/scripts/` for
   `write-node.ts`, `dump-node.ts` and `graph-commit`, so a fourth callout is the
   established direction — and it is the home §Future work below independently
   argues for.
3. **If they have not landed and #2974 is still open** — this unit is
   **blocked**, not free to proceed: land behind #2974 rather than racing it.
   Re-run step 1 before starting.
4. **If #2974 has been abandoned or its scope changed** — only then build the
   three modes standalone, and record in the PR why the shared home was not used.

Route (2) is the expected one and is what the rest of this unit should be read
as describing: the mode semantics, the refusal conditions, the marker convention
and the test cases below are all unchanged by *where* the code lives. Everything
below says `lib.sh`; substitute the TypeScript home under route (2).

**Scope.** Add to `.claude/skills/dispatch-propagate/scripts/lib.sh` (4241 lines
today; grep confirms it carries no `splice_body`, no `node_body`, and no `cmp -s`
— this is net-new **against `origin/main`, which is exactly the measurement the
#2974 note above corrects**):

- `node_body_read <node-file>` — prints everything after the closing frontmatter
  fence. Implementation: `awk 'p; /^---$/{c++; if(c==2) p=1}'`, gated on awk's own
  exit status.
- `node_body_region_read <node-file> <owner>` — prints the inner content of the
  region owned by `<owner>`, or nothing (exit 0) when no region is present.
- `node_body_write <node-file> <mode> <owner> <body-file>` — the single writer.
  `<owner>` is a lowercase-kebab token naming the writing surface (e.g.
  `dispatch-fleet-alarm`). Region markers are
  `<!-- generated:<owner> -->` and `<!-- /generated:<owner> -->`, each alone on
  its line.

Modes:

- `create` — everything after the fence is replaced by the marked region wrapping
  `<body-file>`. **Mechanically refuses (exit 3)** unless the existing body is
  empty/whitespace-only or is a single line beginning with `# ` — i.e. exactly
  `writeNode`'s `# ${statement}` placeholder (`store.ts:57`, and see
  `assertNoBodyLoss` at `store.ts:104-110`, which recognises the same shape). The
  diagnostic must name `region`/`append` as the correct modes for an existing
  body. This is what turns "a create is correct here" from a comment the caller is
  trusted to honour into a checked precondition — the clarification-245 move from
  prompt to gate.
- `region` — preserve everything outside the owned markers byte-for-byte; replace
  the inner content with `<body-file>`. When no marker pair is present, append a
  new marked region at the end of the existing body (the self-executing migration
  above). Refuse (exit 3) on an unbalanced marker pair rather than guessing.
- `append` — append `<body-file>` to the end of the existing body, unchanged
  otherwise. No heading-ensure and no idempotency logic in the helper (see below).

Shared guarantees in all three modes, taken from the **most robust** of the three
existing copies, `dispatch-fleet-alarm:411-436`: gate on awk's own exit status
separately from the pipeline's (its inline comment records the scar — the old
`{ awk ...; cat ...; } > tmp && mv` reported `cat`'s always-zero status and
swallowed a fatal awk); assert **both** `head -n1` and `tail -n1` of the extracted
frontmatter equal `---` (awk exits 0 on a file with no fences at all, and on a
0-byte file); publish via `"$node_file.tmp"` + `mv`.

**Deliberately NOT in the helper:** no `cmp -s` no-op decision, no idempotency-key
short-circuit, no rate limit. Those stay at the callers, which already own them
and already disagree about them by design — `dispatch-fleet-alarm` wants a no-op
brake, `dispatch-eval-finding` is forbidden one (its test-suite doctrine ratchet,
case 11 at `test-dispatch-eval-finding.sh:495-509`, asserts `cmp -s` and
`MIN_REFRESH_INTERVAL` never appear in that SUT's source, because either would
silently understate the recurrence count the ledger exists to carry). Keeping the
policy at the callers is also what keeps that ratchet green with a shared helper:
the ratchet greps the SUT file, not `lib.sh`.

Also add `.claude/skills/dispatch-propagate/scripts/node-body-write` — a small
executable wrapper exposing `--read-region <node-file> <owner>` and
`--write <node-file> <mode> <owner> <body-file>` by sourcing `lib.sh`. It exists
so a **prose** caller (Unit 5) invokes a script instead of hand-rolling awk.

Add `.claude/skills/dispatch-propagate/scripts/test-lib-node-body-write.sh`,
sourcing `dispatch-test-fixture.sh` for `assert_eq` / `report_results`. Cases to
cover: create over a placeholder body; create over an authored body refused with
exit 3 and the body untouched; region write on an unmarked body preserves the
prior body and appends a region; region write on a marked body replaces only the
region and leaves prose above and below byte-identical; region content containing
its own `##` headings round-trips; `node_body_region_read` returns empty on an
unmarked body; append leaves prior content intact; malformed frontmatter (no
fence, one fence, 0-byte file) refused with the file untouched; unbalanced markers
refused; a failure mid-write leaves no `.tmp` residue and no partial file.

**Out of scope for this unit:** any change to the four call sites; any change to
`packages/intentionsutil/scripts/hold-node` or `arm-wait` (their create-vs-edit
split is already correct — see §What NOT to touch); any change to
`write-node.ts`.

**Recommended model.** opus.

---

## Unit 2 — `dispatch-fleet-alarm` refresh writes a region, not the whole body

**Scope.** `.claude/skills/dispatch-propagate/scripts/dispatch-fleet-alarm`:

- Delete the local `splice_body` (`:406-436`) and its now-redundant header
  comment; call `node_body_write` instead. `lib.sh` is already sourced at
  `:175-178`, so no new plumbing.
- Mint path (`:710`) → `create` mode, owner `dispatch-fleet-alarm`. Behaviour is
  unchanged except that the body is now wrapped in the marker pair.
- Refresh path (`:790`) → `region` mode.
- **Adapt the `cmp -s` brake at `:751-760`.** It currently compares `$BODY_FILE`
  against the whole on-disk body via `awk 'p; ...'`. Under region writes the
  on-disk body is region + anything outside it, so an unchanged comparison would
  never match and the brake would die silently. Compare against
  `node_body_region_read "$NODE_FILE" dispatch-fleet-alarm` instead. Keep the
  brake's position in the flow (before `MIN_REFRESH_INTERVAL`, before
  `origin_main_ref_ok`, before `refresh_stamp_write`) exactly as it is.
- Leave `restore_from_blob`, `origin_blob`, the rollback branches, the
  `--base` CAS and the exit-70 dirty-residue discipline untouched.

`.claude/skills/dispatch-propagate/scripts/test-dispatch-fleet-alarm.sh`:

- Case (2) `:308-312` asserts the minted body equals the reading exactly; rewrite
  the expected value to the marker-wrapped form. This is an assertion tracking a
  deliberate behaviour change, not a weakened test.
- Case (3) `:314-320` (identical body → **no** commit at all) must stay green
  unchanged in intent — it is the regression guard for the brake adaptation above.
- Case (4) `:322-331` asserts "refreshed body landed on disk" equals the new text
  wholesale; rewrite it to assert the **region** now holds the new reading.
- Add a new case: an open alarm node whose body carries a hand-authored paragraph
  **outside** the region; after a differing-reading refresh, assert that paragraph
  survives byte-identically and the region holds the new reading. This is the case
  the whole tactic exists for.
- Add a new case: an open alarm node with a legacy **unmarked** body; after a
  refresh, assert the legacy body survives verbatim and a region was appended.
- Extend the existing source ratchet (case 16, `:525-536`) with an assertion that
  the SUT source no longer defines `splice_body` and no longer contains
  `c==2) exit`.

**Dependencies.** Unit 1.

**Recommended model.** opus.

---

## Unit 3 — `dispatch-eval-finding` recurrence and resolved paths write a region

**Scope.** `.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding`
(1287 lines; `lib.sh` sourced at `:253-256`):

- Delete the local `splice_body` (`:751-769`) and the comment block at `:730-734`
  that credits it to fleet-alarm; call `node_body_write` instead, owner
  `dispatch-eval-finding`.
- Mint (`:1168`) → `create` mode.
- Resolved (`:1068`) → `region` mode, keeping the `[[ -n "$BODY_FILE" ]]` guard
  and the surrounding `||` chain shape intact so the existing rollback branch
  still fires on failure.
- Recurrence (`:1263`) → `region` mode.
- **Do not introduce `cmp -s` or `MIN_REFRESH_INTERVAL` into this file.** Test
  case (11) at `test-dispatch-eval-finding.sh:495-509` is a doctrine ratchet that
  greps the SUT source for both and fails on either, because a body-identity gate
  here would swallow exactly the write that carries the recurrence count. Case (4)
  (`:348-375`) pins the consequence: a byte-identical body recurrence must still
  exit 0, print `landed`, commit with `--base`, and move the count to 2.
- Rewrite the header prose at `:1-11`, which currently documents the defect as the
  contract ("its body **refreshed** and its summary metrics updated on every
  recurrence"). It becomes: the entry's generated region is refreshed on every
  recurrence; anything a human added outside that region is preserved.

`.claude/skills/dispatch-propagate/scripts/test-dispatch-eval-finding.sh`:

- Case (3) `:344-346` asserts the minted body equals the finding prose exactly;
  rewrite to the marker-wrapped form.
- Cases (4), (5), (16) assert counts, tokens and CAS — those must stay green
  unchanged, and are the guard that the region change did not perturb the ledger
  semantics.
- Add a case: an open ledger entry carrying a hand-authored `## Analysis`
  paragraph outside the region; after a recurrence, assert the paragraph survives
  byte-identically, the region holds the new prose, `recurrence_count` still
  moved, and stdout is still `landed`.
- Add the same authored-content-survives case for the `--resolved-by --body-file`
  path.
- Extend ratchet case (11) with: SUT source defines no `splice_body` and contains
  no `c==2) exit`.

**Dependencies.** Unit 1.

**Sequencing note.** `tactic-eval-finding-ledger` is **phase implement, in flight**
and is editing this same file (retiring `attributes.ledger_entry`, re-keying the
prune exemption to `attributes.measured_impact`, widening the mint-or-reuse
search). It does **not** touch `splice_body` or any of the three call sites'
splice lines, so the edits are disjoint — but merge `origin/main` immediately
before starting this unit and re-locate every symbol by name rather than by the
line numbers above.

**Recommended model.** opus.

---

## Unit 4 — close `dispatch-graph-census`'s stale-read re-birth race

**Scope.** `.claude/skills/dispatch-propagate/scripts/dispatch-graph-census`.

The refuted "every run after the first" claim is **not** the defect. The real,
narrow one: `idExists` and `openCensus` are computed by `graph-census-debt.ts`
from `listNodes()` over the **local checkout** (`graph-census-debt.ts:325-331`),
while the shell separately probes `origin/main:intentions/$NODE_ID.md` and stores
it as `PRIOR_BLOB` (`:98-102`). A checkout stale enough to be missing today's
already-landed census node therefore passes `shouldBirth`, `write-node.ts` creates
a fresh placeholder file, and the body write at `:146-150` lands over the landed
body. `PRIOR_BLOB` is already computed and sitting right there as the exact
disposition signal, but today it only selects the EXIT-trap rollback flavour
(`:113-118`), never gates whether the birth proceeds.

Changes:

- After `PRIOR_BLOB` is computed (`:98-102`) and **before** `MUTATED=1`: if
  `PRIOR_BLOB` is non-empty, print `latched $NODE_ID (debt $TOTAL, already landed
  on origin/main)` and `exit 0`. The local read said "not present", origin/main
  says otherwise, and origin/main wins. Nothing is mutated, so no rollback is
  needed on this path.
- Replace the hand-rolled frontmatter capture and body overwrite (`:146-150`) with
  `node_body_write ... create dispatch-graph-census ...`. `lib.sh` is already
  sourced at `:43`. The helper's create-mode refusal is a second, independent
  backstop on the same race.
- Correct the comment at `:141-145`, which currently only explains why a create
  must replace, to also state that this path is a **create only** — an existing
  landed node is refused above.

Add `.claude/skills/dispatch-propagate/scripts/test-dispatch-graph-census.sh`.
Be honest about what it is: this script derives `REPO_ROOT` from its own
`SCRIPT_DIR` (`:44`) and has no command-override seams, so a full behavioural
fixture is disproportionate to a four-line guard. The new file is a **source
ratchet**, the technique the sibling suites already use
(`test-dispatch-fleet-alarm.sh:525-536`, `test-dispatch-eval-finding.sh:495-509`):
assert the SUT contains the `PRIOR_BLOB` non-empty birth refusal, that the refusal
appears **before** `MUTATED=1`, and that the SUT no longer contains `c==2) exit`.
The behavioural coverage of create-mode's refusal lives in Unit 1's helper tests.
Say all of this in the file's header so a later reader does not mistake it for a
behavioural suite.

**Do NOT** restate the refuted "every run after the first" claim anywhere. The
node's own `rationale` frontmatter still carries it and needs correcting in the
same round that lands this plan.

**Dependencies.** Unit 1.

**Recommended model.** sonnet.

---

## Unit 5 — `dispatch-diagnose-main` calls the primitive instead of inlining awk

**Scope.** `.claude/skills/dispatch-diagnose-main/SKILL.md`.

This is the "a prompt is not a gate" site. Both bash blocks are prose the model
retypes each run.

- Create block (`:178-187`): replace the inline
  `{ awk '{print} /^---$/{c++; if(c==2) exit}' "$node_file"; cat "$body_file"; } > "$node_file.tmp"` + `mv`
  with a single
  `.claude/skills/dispatch-propagate/scripts/node-body-write --write "$node_file" create dispatch-diagnose-main "$body_file"`.
- Open/re-detection block (`:193-217`): read the current region with
  `node-body-write --read-region "$node_file" dispatch-diagnose-main > "$ondisk_region"`,
  `cmp -s "$body_file" "$ondisk_region"` for the existing no-op brake, and on a
  diff call `node-body-write --write "$node_file" region dispatch-diagnose-main "$body_file"`.
  Keep the `dump-node.ts` + `graph-commit --base` CAS exactly as written.
- Update the surrounding prose: the create path is a one-time placeholder splice
  that the primitive now refuses to perform over an authored body; the
  re-detection path replaces only this skill's own region and preserves anything
  a human added.
- Because `dispatch-diagnose-main/SKILL.md:178-187` is cited by name in three
  scripts' comments as the canonical home of the two-fence idiom, replace that
  documentation with a pointer to `lib.sh`'s `node_body_write` — the idiom now has
  a real home, not a documented one. Units 2-4 remove those citing comments in
  their own files; this unit removes the referent.

**Out of scope:** any other section of this SKILL.md, and the `What NOT to do`
list (`:219+`), which stays as-is.

**Dependencies.** Unit 1.

**Recommended model.** sonnet.

---

## Unit 6 — retire the third `splice_body` copy in `dispatch-invalid-state-followup`

**Scope.** `.claude/skills/dispatch-propagate/scripts/dispatch-invalid-state-followup`.

Its **behaviour is already correct** — the open|closed path at `:399-462` is this
plan's reference model and must not change semantically. What is wrong is that it
carries the **weakest** of the three `splice_body` copies (`:320-327`: no atomic
tmp+mv, no awk-status gate, no frontmatter shape assertion), and it does not
source `lib.sh` at all.

- Source `lib.sh` (same idiom as `dispatch-eval-finding:253-256`: source, and on
  failure log and `exit 69`).
- Delete the local `splice_body` (`:320-327`).
- Replace the on-disk body read at `:428` with `node_body_read`.
- Replace the `splice_body "$NODE_FILE" "$WORK_DIR/body.md"` call at `:447` with
  `node_body_write ... append ...` — noting that this caller assembles the full new
  body itself (prior + `## Occurrences` heading + stanza), so append mode receives
  only the **stanza** and the caller's heading-ensure at `:438-440` stays where it
  is. Keep the `OCCURRENCE_KEY` idempotency grep (`:430-435`), the `cmp -s`
  check (`:443-446`), the `dump-node.ts --base` capture and the `unchanged`/
  `updated`/`recurred` stdout tokens byte-identical.
- Leave `quarantine_fence` (`:329+`) alone — different concern.

`test-dispatch-invalid-state-followup.sh` (590 lines) must pass **unchanged**;
that is the whole safety argument for this refactor. Add one ratchet assertion:
the SUT source defines no `splice_body` and contains no `c==2) exit`.

**Dependencies.** Unit 1.

**Recommended model.** sonnet.

---

## Unit 7 — a repo-wide ratchet so a fifth copy cannot appear

**Scope.** Add a case to `.claude/skills/dispatch-propagate/scripts/test-lib-node-body-write.sh`
(from Unit 1) that greps the whole repo — excluding `node_modules/`, `.git/`, and
`intentions/` (node bodies quote the idiom as evidence and must not be swept; see
`.claude/rules/` memory on prose-ref sweeps) — for `c==2) exit` and asserts the
only hits are the sanctioned homes:

- `.claude/skills/dispatch-propagate/scripts/lib.sh` (the implementation)
- `.claude/skills/dispatch-propagate/scripts/node-body-write` (the CLI wrapper, if
  it re-states the idiom rather than delegating)
- `packages/intentionsutil/scripts/hold-node` and
  `packages/intentionsutil/scripts/arm-wait` — correct create paths in a package
  that cannot reach `lib.sh` without cross-package plumbing (see §Future work)

Any other hit fails the test with a message naming `node_body_write` as the
correct call. Run the grep from the repo root resolved via `git rev-parse
--show-toplevel`, not from a relative path, so the check cannot pass vacuously
from a foreign cwd.

This unit lands **after** Units 2-6, because the allowlist is only true once all
four sites are converted.

**Dependencies.** Units 1, 2, 3, 4, 5, 6.

**Recommended model.** sonnet.

---

## Reuse

- **`packages/intentionsutil/scripts/append-machinery-section.ts` and
  `packages/intentionsutil/src/body-substance.ts`** — in flight on PR #2974
  (`tactic-scope-fingerprint-plan-substance`, phase qa), absent from
  `origin/main` at the time this plan was written. These are the `append` mode
  and its substance/machinery body split, already implemented. **Check for them
  first and extend them rather than re-implementing** — see the blocking note at
  the head of Unit 1 for the four-way routing. This is the single most important
  reuse entry in this list.
- `.claude/skills/dispatch-propagate/scripts/dispatch-fleet-alarm:411-436` —
  `splice_body`, the most robust of the three copies (awk-status gate, positive
  `---`/`---` fence assertion, tmp+mv publish). **The base to promote into
  `lib.sh`**, not a fresh implementation.
- `.claude/skills/dispatch-propagate/scripts/dispatch-invalid-state-followup:399-462`
  — the reference model for an edit-path write: read on-disk body, construct the
  result, CAS-capture, then splice. Its header comment at `:399-417` is the
  argument this whole tactic rests on.
- `packages/intentionsutil/scripts/hold-node:252-272` and
  `packages/intentionsutil/scripts/arm-wait:375-394` — the canonical create-vs-edit
  split and the comments explaining why a create must replace (the two-H1 hazard).
  Carry that reasoning into `node_body_write`'s create-mode refusal message.
- `.claude/skills/dispatch-propagate/scripts/lib.sh` — already sourced by
  `dispatch-eval-finding:253`, `dispatch-fleet-alarm:175`, `dispatch-graph-census:43`.
  Three of the four sites need zero new sourcing plumbing; only
  `dispatch-invalid-state-followup` gains a source line.
- `.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh` — the
  sourced (never executed) harness every `test-*.sh` uses: `assert_eq`,
  `assert_contains`, `assert_not_contains`, `report_results`, `SCRIPT_DIR` /
  `UTIL_SCRIPT_DIR`. Source it; do not reinvent harness plumbing.
- `.claude/skills/dispatch-propagate/scripts/test-dispatch-fleet-alarm.sh:250-420`
  — the `run_alarm` harness and its command-override env vars, with a fixture repo
  root whose local git remote stands in for origin/main. Reuse this fixture shape
  for any behavioural assertion added in Unit 2.
- Source-ratchet technique: `test-dispatch-fleet-alarm.sh:525-536` (case 16) and
  `test-dispatch-eval-finding.sh:495-509` (case 11) — grep the SUT for a forbidden
  reintroduced idiom and fail if it reappears.
- `packages/intentionsutil/src/store.ts:57` (`readExistingBody` fallback to
  `# ${statement}`) and `:104-110` (`assertNoBodyLoss`) — the placeholder shape
  `node_body_write --create` keys its precondition on, and the existing durable-body
  contract whose vocabulary the new refusal message should match.
- `.claude/skills/dispatch-propagate/scripts/assert-node-fresh` — the per-node
  pre-write freshness primitive shipped by `tactic-node-body-stale-in-worker-worktree`
  (phase done). Different defect (stale base vs wholesale write); reuse it if a
  freshness assertion is wanted at a call site, and do **not** re-solve staleness
  here.
- `.claude/skills/dispatch-propagate/scripts/run-unit-tests.sh:88,187-200` — the
  `RUN_PR_SCRIPTS` gate and its `for test_script in "$SCRIPTS"/test-*.sh` loop.
  Every SUT and test file in this plan already lives under
  `.claude/skills/dispatch-propagate/scripts/`, so any diff here flips the gate on
  and new `test-*.sh` files are picked up automatically. **No new
  `.github/workflows/unit-tests.yml` entry is needed.**

## Verification

```verify
bash .claude/skills/dispatch-propagate/scripts/test-lib-node-body-write.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-fleet-alarm.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-eval-finding.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-invalid-state-followup.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/test-dispatch-graph-census.sh
```

```verify
bash .claude/skills/dispatch-propagate/scripts/run-lint.sh
```

```verify
node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts intentions
```

Manual and judgment checks, in order:

0. **Before anything else, resolve the #2974 fork.** `git fetch origin main`,
   then check whether `packages/intentionsutil/scripts/append-machinery-section.ts`
   and `packages/intentionsutil/src/body-substance.ts` exist. Take route (1),
   (2), (3) or (4) from the head of Unit 1 and **say in the PR body which route
   was taken and why**. A PR that adds a bash `append` mode without addressing
   this is not done, however green its suites are.

1. **The load-bearing behavioural proof, on a scratch node.** In a scratch
   fixture repo (never the real `intentions/`), mint an alarm node, hand-add a
   paragraph *outside* the generated region, run a differing-reading refresh, and
   diff the file. The paragraph must be byte-identical and the region must hold
   the new reading. Repeat for a ledger recurrence. If this cannot be shown, the
   unit is not done regardless of what the suites say.
2. **The legacy-adoption path.** Same fixture, but start from a node whose body
   has **no** markers (every node in the field today). Confirm the prior body
   survives verbatim and a region is appended, and that a second refresh then
   replaces only the region — the body must not grow a second time.
3. **`dispatch-diagnose-main` is prose, so its verification is a read, not a run.**
   Confirm the SKILL.md blocks now invoke `node-body-write` and contain no `awk`
   fence idiom, and that the no-op `cmp -s` brake compares against the region
   rather than the whole body. Its real behaviour is only observable the next time
   `origin/main` goes red; note that in the PR rather than claiming it verified.
4. **Merge `origin/main` before Unit 3 and re-locate symbols by name.**
   `tactic-eval-finding-ledger` is in flight on the same file; every line number
   in this plan is dated 2026-08-20 at `43e18881` and the earlier draft's anchors
   were already stale by ~40 lines once.
5. **Scope-fingerprint side effect.** Adding markers changes each node's body and
   therefore its `tacticScopeFingerprint` (`router.ts:131-133`). The in-flight
   guards at `dispatch-eval-finding:1046-1050` and `:1207-1211` already refuse a
   body write while `execution != null`, so no in-flight session's stamp is
   staled by the rollout. Confirm that reasoning still holds against the file as
   merged before landing Unit 3.

## What NOT to touch

- **Create paths are correct and each carries a comment saying why.**
  `dispatch-eval-finding:1168` (mint), `dispatch-fleet-alarm:710` (mint),
  `hold-node`'s `NONE` arm, `arm-wait`'s `NONE` arm, and
  `dispatch-graph-census:146-150` (birth). They change only in *which function*
  performs the replace, never in the fact that a create replaces. A fix that made
  creates append would produce exactly the malformed two-H1 body those comments
  warn about.
- **`write-node.ts` is already body-preserving on edit** (`readExistingBody` /
  `assertNoBodyLoss`, `packages/intentionsutil/src/store.ts:57,104-110`). The
  clobber is always the explicit splice that *follows* it. Do not "fix"
  `write-node.ts`.
- **`hold-node` and `arm-wait` behaviour.** Their create-vs-edit split is already
  the right answer; they are cited here as precedent, not as targets. They cannot
  reach `.claude/skills/dispatch-propagate/scripts/lib.sh` without cross-package
  plumbing, and `lib.sh` is dispatch-scoped (graph-write mutex, dispatch env vars)
  — pulling it into `intentionsutil` is not a natural fit. See §Future work.
- **`dispatch-invalid-state-followup`'s append semantics**, its `OCCURRENCE_KEY`
  idempotency short-circuit, its stdout tokens, and `quarantine_fence`.
- **`packages/intentionsutil/src/node-merge.ts`** — graph-commit's layer-2
  auto-merge is recorded as a known structural exception (clarification 245, V3)
  and is not assigned a fix here.

## Sibling-node coordination (do not re-derive, do not duplicate)

- `tactic-node-body-stale-in-worker-worktree` (**phase done**) shipped
  `assert-node-fresh` plus the doctrine ratchet
  `.claude/skills/dispatch-propagate/scripts/test-align-tactics-write-path-freshness.sh`.
  Its subject is a **stale-base** write by `/align-tactics`; ours is a
  **wholesale-vs-append** write by autonomous scripts. Different defect, adjacent
  machinery. Reuse the primitive and the ratchet-test pattern; do not re-solve
  staleness.
- `tactic-eval-finding-ledger` (**phase implement, in flight**) edits
  `dispatch-eval-finding` concurrently — see the sequencing note on Unit 3.
- `tactic-finding-search-all-producers` (**draft**) owns the machine-readable
  write-site roster and the one-shared-write-surface work this node was carved out
  of. **Do not absorb that roster here.** This node holds one defect class; that
  node holds the census.
- `tactic-dispatch-conflict-substance-allowlist` and
  `tactic-review-fix-porcelain-guard-script` (both draft) are the V2 and V4
  violator fixes from the same ladder. Separate scope; this plan's Unit 1
  create-mode refusal is the same prompt-to-gate move applied to a different
  surface, and the two should not be merged.

## Future work (explicitly out of scope, recorded so it is not re-derived)

`hold-node` and `arm-wait` duplicate the create-vs-edit block byte-for-byte
between them, and their upstream `hold-node-decide.ts` / `wait-node-decide.ts`
duplicate the `{ disposition, node?, node_body?, node_body_append? }` decision
contract in the same way. The natural home for a helper **both** sides need is a
small bash lib inside `packages/intentionsutil/scripts/` (the naming convention
`lib-*` is already established there), which `lib.sh` would then source through —
the existing dependency direction already runs that way, since dispatch scripts
relative-path into `packages/intentionsutil/scripts/` for `write-node.ts`,
`dump-node.ts` and `graph-commit`. That relocation is not this tactic's defect:
those two sites already append on edit and lose nothing.

**Note how PR #2974 changes this paragraph's advice.** The sentence this
paragraph originally ended with — "land the primitive in `lib.sh` first, then
relocate if and when an `intentionsutil` consumer needs it" — assumed no
`intentionsutil` consumer existed. One does: `append-machinery-section.ts` is
already that home, already in `packages/intentionsutil/scripts/`, already
TypeScript. So under Unit 1's expected route (2) the "future" relocation is not
future at all; it is where the primitive lands the first time, and `lib.sh`
carries only the thin shell-out. `hold-node` and `arm-wait` then become a
genuinely cheap follow-up rather than a cross-package plumbing exercise — but
they are still **not** this tactic's scope, and folding them in would widen a
defect fix into a refactor.

## Provenance

Found by the per-site write-site classification recorded on
`tactic-finding-search-all-producers`, which measured 47 write calls across 27
callers; that node holds the full roster, this one holds the defect. The
four-site count, the refutation of the `dispatch-graph-census` claim, and every
anchor above were re-measured on origin/main `43e18881` on 2026-08-20, replacing
the 2026-08-15 draft's two-site count and its stale line numbers.

Finalized to `phase: implement` by the 2026-08-20 `/align-tactics` tactic-mode
round, which also reconciled this node's `statement` and `rationale` against the
plan (clarification 32's whole-node bar — the draft's statement still said "two
autonomous scripts" and its rationale still carried the refuted census claim and
the overstated invariant-violation framing). That round's five immaterial Side-B
drift observations are carried by the born-parked
`tactic-autonomous-body-write-drift-observations`; two of them name record errors
this round was not authorized to correct — an undercount in
`tactic-finding-search-all-producers`' Layer-3 roster (a draft), and the same
refuted census claim in `strategy-graph-native-dispatch` clarification 245 (a
durable-layer node, attended-only).

## PR18 shipped Unit 3's site only — parked rather than closed, 2026-08-29

`plans/dispatch-rsi-serialized-pr-plan.md` § PR18 lists this node under "Nodes
closed (5)" and its Unit 1 scoped the work to **one live site**,
`dispatch-eval-finding`. That shipped, merged as `478cc324` (#3134). This node is
**parked instead of closed**, because closing it would record six of its seven
units as complete when they are not, and the closing session had no ruling that
narrowed this node to that one site.

**What shipped.** `dispatch-eval-finding`'s `splice_body()` gained an owned-region
contract with two modes. `create` replaces the whole body but **refuses** unless
the file is empty or holds the `# ${statement}` placeholder — a checked
precondition rather than a comment the caller is trusted to honour. `region`
replaces only what lies between `<!-- generated:dispatch-eval-finding -->` and
its closing marker, keeping everything outside verbatim; an unmarked body
self-migrates by appending a region, and an unbalanced **or inverted** pair is
refused rather than guessed at. Call sites: `:1168` mint → `create`; `:1068`
resolved and `:1263` recurrence → `region`. All failure paths `return 1` rather
than `exit`, so the existing `restore_from_blob` rollback still fires.

> The call-site classification above **contradicts the ordering in Unit 3's text**
> (which reads mint `:1168`, resolved `:1068`, recurrence `:1263` against older
> anchors). Re-verified against the merged file: the verdicts per path are the
> ones Unit 3 intended — only the mint may author wholesale.

**Why this is not Unit 3 as planned.** Unit 3 says to *delete* the local
`splice_body` and call the shared `node_body_write` instead, and depends on Unit
1 for that primitive. Unit 1 did not ship, so PR18 hardened the local copy in
place. The defect is closed at this one site by a **local contract**, not by the
shared primitive this node exists to introduce.

**Measured on the merge commit `478cc324`:**

| Node unit | State |
|---|---|
| 1 — shared `node_body_write` in `lib.sh` + CLI wrapper | **not shipped** — `lib.sh` defines no such primitive |
| 2 — `dispatch-fleet-alarm` refresh writes a region | **not shipped** — still carries its own `splice_body` |
| 3 — `dispatch-eval-finding` region write | shipped **locally**, not via the shared primitive |
| 4 — `dispatch-graph-census` stale-read re-birth race | **not shipped** — dropped from PR18 scope on 2026-08-20, routed to #3037 |
| 5 — `dispatch-diagnose-main` calls the primitive | **not shipped** |
| 6 — retire the third `splice_body` in `dispatch-invalid-state-followup` | **not shipped** — the copy is still there |
| 7 — repo-wide ratchet against a fifth copy | **not shipped** |

So this node's statement — four surfaces, *one shared primitive*, wholesale
replace mechanically reserved for creates — is satisfied at one surface. The
copy-paste the node exists to eliminate now sits at **three** sites
(`dispatch-eval-finding`, `dispatch-fleet-alarm`,
`dispatch-invalid-state-followup`), and Unit 3's own ratchet extension ("SUT
source defines no `splice_body`") could not be applied.

**Why the plan's premise does not settle it.** The plan annotates this node
"*a draft, not a plan: it carries the measurement and the shape of the fix but no
verification block. Decompose before building.*" That was true of the
2026-08-15 draft. It is **not** true of this node: the 2026-08-20 `/align-tactics`
round finalized it to `phase: implement` with seven units and a Verification
section (see Provenance above). The plan and the node were both revised on
2026-08-20 and the plan's characterization did not catch up.

**The remaining units are assigned nowhere.** Grepped across the whole serialized
plan: no PR section claims `node_body_write`, `dispatch-diagnose-main`, or
`dispatch-invalid-state-followup`'s copy. Closing this node `done` would drop
them out of the graph rather than hand them on.

**What the author needs to decide** is in `office_hours.recommendation`.
