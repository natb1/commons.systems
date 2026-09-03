# Bootstrap operations

> **Shim notice (2026-09-02, ledger L31).** `CLAUDE.md` is a projection
> surface: in the target state it is the orientation page projected from
> `purpose` and `projection`, stating no rule of its own
> (`disposition-graph/session-context`). During bootstrap this file carries
> operating rules that have no node yet; each liquidates as stated in L31,
> and anything left that no node projects is a prune-by-default proposal.
> Where this file conflicts with the graph at `origin/disposition`, the
> graph wins.

Rules for every session and subagent rooted in this worktree. It lives here
rather than in session memory because memory is private to one account and
one project path, unversioned, and invisible to subagents; memory holds only
a pointer to this file.

## What this ref is

`greenfield` is the implementation ref of the greenfield disposition graph
during bootstrap (LEDGER.md L28): materialized implementation justified by
the graph, kept off `main` to avoid conflicts with incumbent code, and swapped
with `main` at bootstrap exit. Its tree:

- `packages/` — the materialized implementation, one package per directory
  (L27). `packages/disposition/` holds the graph reader, validator, ratify
  command, and browser projector (L26).
- `.claude/skills/align/SKILL.md` — the `/align` shim (L15).
- `.claude/rules/` — hand-materialized projections of global-tier nodes (L30).
- `bootstrap/` — evidence gathered during bootstrap (surveys, the revision-2
  model page); deleted with the ledger.
- `LEDGER.md`, this file.
- `disposition/` — the nested worktree of the `disposition` ref, gitignored
  here. That ref holds the graphs and only the graphs (L25): the manifest
  `disposition.yaml`, `disposition-graph/`, and `public/`.
- `dist/` — generated projections (the browser page); `tmp/` — review
  out-dirs. Both gitignored.

Nothing on `main` reads either ref yet; nothing here reads `intentions/`
except as cited evidence (L17). The legacy graph at `intentions/` on `main`
is frozen evidence.

Created 2026-09-02 under the bootstrap grant (L10) by the bootstrap session
"interview deferral options (2) ⑂ shim review", job 3dcce675. The earlier
orchestration session and its `tactic-bootstrap-operation` in the legacy graph
are abandoned, not restarted (author, 2026-09-02); that session was consulted
once, for its code-review rules (L29).

## Token efficiency

The main thread is an expensive model at maximum effort. It owns the graph and
the ledger: it interviews the author, writes and amends nodes, keeps
`LEDGER.md` current, reviews subagent output, and lands commits. It does not
write tooling, tests, surveys, or pages itself.

Every simple reconciliation, materialization, or implementation task is
delegated to a subagent with the appropriate model and effort:

- **Unit.** One deliverable with a written contract (inputs, outputs, file
  paths, error behaviour) and a test or a verifiable output. A unit that needs
  a second contract is two units.
- **Model.** `sonnet` for mechanical tooling, tests, format work, surveys, and
  anything whose contract fully determines the answer. `opus` for
  design-heavy or judgment-heavy units, such as the browser's layout or a
  survey that classifies what it reads. `haiku` for lookups.
- **Effort.** Stated in the brief: moderate for tooling, high for design.
  Subagents never run state-changing git, never edit node files or the
  ledger, write only the files their brief names, and report the exact
  commands and outputs they ran.

These working definitions are owed as ratified doctrine before exit (L21).

## The loop

The loop is the `/align` shim at `.claude/skills/align/SKILL.md`: currency
and claim, frame, interview, record, project, ratify or steer, land,
self-review and ledger. The bootstrap session follows it by reading the file;
a session rooted at this worktree invokes it. Rounds are one node; the author
sets the size after the skill is materialized. The author's choice of what
comes next is a boost ratification (L13).

Commands, from this worktree:

- validate: `node packages/disposition/validate.mjs disposition`
- project: `node packages/disposition/project.mjs disposition --out dist/browser/index.html`,
  then publish `dist/browser/index.html` to the recorded address
  https://claude.ai/code/artifact/502111c1-a7fb-4108-a9cb-ebb7b2a44933
- ratify: recorded by the session after the author's ruling in the
  interview, in the author's name with the ruling quoted (L32); no command
- tests: `node --test packages/disposition/*.test.mjs`
- land the graph: from `disposition/`, `git commit` and `git push origin
  disposition`; no pull request
- land implementation: on this ref, after code review (below), `git push
  origin greenfield`; no pull request

## Code review (L29)

Every landing of materialized implementation on this ref is reviewed by the
incumbent detached instrument on `main` as a declared shim: during
bootstrap, once the disposition it materializes is ratified (until then
tests and use suffice), and everything before exit. Rules: settle on blocking severity, never on zero findings (blocking =
changes behaviour, breaks an anchor, or would lead an executor to a wrong
action); everything else is recorded as a proposal on the node the unit
instruments, or on the ledger, and dropped; at most two rounds per landing,
no design-surface exemption, a blocking finding raised by round two fixed
before landing and one still open at the cap parked for the author; scope
frozen at round one (nothing added to a file under review; follow-ups
instead); a defect class repaired twice is cut, with a fail-before,
pass-after test; functional findings before non-functional; effort high for
code, one medium round for a diff of documents, plans, or tests only. The
fix loop is a subagent unit; the main thread reads the verdict and lands.

Recipe. From this worktree, with `dangerouslyDisableSandbox: true` and a
600000 ms tool timeout on every call:

```
/home/n8/natb1/commons.systems/.claude/skills/dispatch-propagate/scripts/dispatch-code-review \
  --target <base-sha>..HEAD --out-dir tmp/code-review-<tag> --effort high
```

The target is a range of resolved shas (a bare sha reviews one commit and
reports a vacuous green). Exit 5 means still running: repeat the identical
call; two calls covered every measured high round (790 to 880 s wall clock;
medium 436 s). Exit 4 is the 5400 s deadline, a total loss; exit 6 means
another run holds this worktree's lock. Grade on `<out-dir>/output.txt`;
`summary.txt` carries `target_base_sha`, `target_head_sha`, `wall_clock_s`.
A fresh out-dir tag every round. Never commit on this ref while a run is in
flight: the run is keyed to HEAD and a commit discards it. Before grading,
grep `output.txt` for a usage-limit notice (a short wall clock is the
tell). `--fix` is inert under `.claude/`; hand-apply those findings. The
review session cannot run `node`, so its fixes are unverified until the
tests run here. Round
one of this ref reviews `<root>..HEAD` from the empty root commit; later
rounds review the delta from the last reviewed commit.

## Round log

- **Round 0 (2026-09-02).** `disposition-graph/purpose` written as a
  proposal in the author's words. Stubbed deferred: `public/agency` with two
  readings; `audience`, `knowledge-store`, `capture`, `capture-traditions`
  (open question), `scope` (open question from the coverage survey),
  `spec-driven-development`, `software-factories`, `aristotle-hexis`,
  `srs-introduction`; `model` and fourteen schema nodes including `review`
  and `evaluation`; `bootstrap`. Units delivered: reader, validator, ratify
  command, derivations, tests (sonnet); projector and browser (opus); scope
  survey (sonnet); survey of the incumbent `/align` record (opus). Browser
  published. The `/align` shim written. Implementation restructured onto
  this ref (L25 to L28). Code review of round zero's landing: pending, see
  below. Waiting on the author: the sitting on `purpose`, below, and
  the round-one steer.
- **Sitting on `purpose` (2026-09-02, in progress).** Reading movement
  issued; periagogic probe one posed on the Answer alone (for what; held
  only as hypotheses; for whom; a sentence the author would not have
  written). The author answers after a compaction. Probes still to come:
  each of the four readings (relation, locus); the rationale and the
  rejected list. Held-back counterpoint, to enter only after the author
  commits, cited by locus: (1) the sentence "It records the person's
  dispositions as a graph, and the work is derived from that record rather
  than from prompts or chat" is the AI's, not in the author's L12 words,
  and answers how, not why; (2) the capture hypothesis dropped the author's
  "in the variety of ways it occurs in daily life"; (3) "explicit intent"
  is legacy vocabulary the AI imported; (4) scope: four recorded functions
  fall outside as worded (apps, site and blog, gaming blog, shared
  infrastructure) and audience records five audiences against one; (5)
  traditions: spec-driven development adopted with a divergence
  (per-feature documents against a standing personal record with authority
  stamps), software factories diverged (Cusumano 1991; Greenfield and
  Short 2004), hexis in Nicomachean Ethics II.5 1105b19 to 1106a13 is a
  settled disposition and not knowledge, so "projection of the author's
  hexis" is the stronger phrase and "knowledge store" its gloss; (6) the
  steelman, inverting primary and hypotheses so the repository is the
  author's disposition and the tooling its instrument, resolved diverged
  because the personal graph moves to natb1.com (L03); (7) the three
  AI-drafted rejected alternatives are to be confirmed or struck.
  Recommendation to put at the maieutic stage: ratify with amendments,
  strike the mechanism sentence and "explicit intent", restore "in daily
  life", hexis phrase first, the steelman as a rejected alternative; class
  ratified; boldness low on the Answer, moderate on the readings, high on
  the hexis point; alternatives: ratify as written, defer until scope and
  audience are ruled, or restate in the author's words.
- **Review log.** Each landing on this ref: commit range, out-dir tag,
  rounds, verdict.
  - Tooling, `684ac70f..6912c361`, tag `r0-tooling`, round one at high:
    426 s wall clock, 8 findings, 6 fixed in-tree by the reviewer
    (unverified there: the nested review session's sandbox denies `node`,
    so the tests run here before landing), 2 ruled by the graph owner as
    validator rules (duplicate `under`, unresolved `after`). Fix unit with
    regression tests; round two owed after ratification of the nodes the
    tooling instruments (author, 2026-09-02).

## Session mechanics

- **Worktrees.** This worktree is
  `/home/n8/natb1/commons.systems/.claude/worktrees/greenfield` on branch
  `greenfield`; enter it with `EnterWorktree` by `path`. The graph's worktree
  is nested at `disposition/` on branch `disposition`, so one session can
  write both. Both are orphan branches; `git worktree add --orphan` and
  `git worktree move` were run with the sandbox disabled, because a
  worktree-isolated session's mounts do not cover `.claude/worktrees/`.
- **Skill discovery.** A session started in this worktree sees this ref's
  `.claude/skills/align` as `/align`; a session started in the main checkout
  sees the legacy `/align` instead, even after entering this worktree. Start
  alignment sessions here.
- **Writes.** Only inside this worktree, including `disposition/`. The
  shared checkout and sibling worktrees are read-only to a background
  session. Job scratch under `/home/n8/.claude/jobs/<job>/tmp` is deleted
  with the job; anything that must persist goes on a ref.
- **Bash in a worktree-isolated session** refuses `git -C`, loops,
  redirects, command substitution, and long compound commands. Pipes and
  heredocs work; `tee` stands in for redirection; `python3 -` heredocs do
  multi-line edits. `cd` within this worktree persists between calls. Spell
  tsx as `node --import tsx/esm`, never `npx tsx`; the tooling here is plain
  `.mjs` and needs neither.
- **Dependencies.** None installed on this ref. `packages/disposition`
  imports `yaml` from an ancestor `node_modules`, a shim noted in L04.
- **Reading legacy evidence.** Read files from
  `/home/n8/natb1/commons.systems/intentions/` and `.claude/` on `main`
  directly. Never write there.
- **Memory.** The bootstrap session's memory directory is keyed on the
  original project path and is full of legacy lore
  (`~/.claude/projects/-home-n8-natb1-commons-systems/memory/`, pointer file
  `greenfield-disposition-graph-review-doc.md`). A session started in this
  worktree gets its own memory directory; seed it with a pointer to this file.

## Interview conventions

- The author prefers prose turns for open matters and rejected an
  `AskUserQuestion` once; bounded choices may be offered as numbered options
  with a recommended default, answered by number or "go".
- Ground a question in the record and the traditions before proposing. Cite
  primary sources by locus (book, chapter, Bekker or section number) so the
  reading can be queued (L09).
- Incumbent text, including `README.md`, the legacy graph, skills, and rules,
  is context, never doctrine (author, 2026-09-02).
- Every recorded output is adversarially reviewed by the AI as part of
  producing it (`evaluation`).

## Decisions taken so far, in the author's words where possible

- Node = one question and its standing answer; history in git (author).
- Out-of-scope AI answers are inert proposals, never deferred (author).
- Ratified stamps are the author's alone (L04).
- The word archē replaces "care" (author).
- Two graphs, `disposition-graph` and `public`, the latter moving to
  `natb1.com/public`; ids are import paths (author, L03).
- No PR for graph landings (author).
- No tactics; not bound by incumbent design or legacy ids (author).
- This is the bootstrap session; the parent session is not restarted (author).
- The bootstrap grant (author, L10).
- Reconciliation in both directions (author, L11).
- Bootstrap as onboarding; purpose first; README, description, and tags as
  projections (author, L12, L18).
- Rank serves onboarding (author, L13).
- Cadence review of archai rejected; a contradicting proposal opens review of
  the delegated disposition it came from (author, L07).
- Tradition readings carry authority classes; deferred reading recurses
  (author, L09).
- The ledger is disposed of before exit; its disposal is the critical path to
  `/align` (author, L15).
- Root id `agency`, with authorship referenced in the body (author, L02).
- Delegate implementation to subagents by unit, model, and effort (author,
  L21, L23).
- The disposition ref holds only the graphs; tooling is justified by
  disposition; `packages/` monorepo; the `greenfield` third ref swapped with
  `main` at exit (author, L25 to L28).
- Every bootstrap landing of implementation gets shimmed code review, under
  the legacy attempt's rules; review doctrine before exit; every materialized
  implementation reviewed before exit (author, L29).
- The `/align` shim adopts the incumbent's principles, not its mechanics;
  shims apply by default (author, L15, L30).
