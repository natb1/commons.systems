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
- `.claude/rules/` — projected from the global-tier nodes by
  `project.mjs --rules`; never edited by hand (L30, liquidated 2026-09-03).
- `bootstrap/` — evidence gathered during bootstrap (surveys, the revision-2
  model page) and `bootstrap/review/`, the record of each sitting's review
  items and the builder of its review page; deleted with the ledger.
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

Every simple reconciliation, materialization, or implementation task, and
every investigation whose context is verbose, is delegated to a subagent
with the appropriate model and effort (`delegation`, author 2026-09-03):
debugging, driving a browser, reading logs, transcripts, or diagnostic
output, and surveys are never done on the main thread, which reads the
subagent's conclusion and the commands it ran, never the context.

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
- rules: `node packages/disposition/project.mjs disposition --rules .claude/rules`
  (regenerate after any change to a global-tier node)
- project: `node packages/disposition/project.mjs disposition --out dist/browser/index.html`,
  then publish `dist/browser/index.html` to the recorded address
  https://claude.ai/code/artifact/502111c1-a7fb-4108-a9cb-ebb7b2a44933
- ratify: recorded by the session after the author's ruling in the
  interview, in the author's name with the ruling quoted (L32); no command
- tests: `node --test packages/disposition/*.test.mjs`
- review page: `node bootstrap/review/build.mjs`, then publish the html it
  writes under `bootstrap/review/` with the `db` capability; the purpose
  sitting's page is https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678
  (republish by that URL); read the author's responses with the artifact
  tool's `read_db` action on the `responses` collection (L40)
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
- **Sitting on `purpose` (2026-09-02, maieutic stage).** The author
  answered probe one broadly, verbatim at
  `bootstrap/sitting-purpose-author-2026-09-02.md`: all feedback on the
  page is in scope; the author expects to be interviewed for
  clarifications, then a playback of author and AI dispositions with
  recommended encoding and authority. Counterpoint entered: the mechanism
  sentence converged with the author's rewrite; "explicit" struck; "in the
  variety of ways it occurs in daily life" restored; the hexis phrase put to
  the author; scope items deferred to the scope sitting; the steelman
  proposed as a rejected alternative; IEEE 830 states the intended audience
  inside the purpose subsection, which supports the author's prune of
  `audience`. Playback issued with seventeen encodings and nine questions
  with defaults; the author answers by number, "go", or prose. Encodings,
  to land after the ruling: (1) `growth`: both usages run both stages, the
  disposition usage's periagogic object being the nodes the disposition
  would amend and the implementation their criteria point to; (2)
  `authority`: no stamp is ratified today (checked by grep), the ledger's
  author rulings are evidence and never stamps, the first ratified stamps
  are this sitting's; (3) every answer carries a stamp (validator rule),
  proposal is content not a class, `purpose` stamped deferred now and
  ratified at the ruling; (4) `projection`: the browser states nothing of
  its own; how-to-read, the vocabulary page, and the bootstrap view are
  removed; (5) transient state is never a node: `bootstrap` pruned, "during
  bootstrap" prose stripped as nodes are ratified, the `ledger:` field
  removed from nodes, no body references to ledger entries, the author's
  words quoted in the node instead; (6) the purpose Answer redrafted in the
  author's words with the factory as reconciliation, plus a reading on
  control-loop reconciliation (Kubernetes controllers; Burgess 1998),
  adopted with the two-way divergence; (7) traditions define their own
  names so prose links through the existing term mechanism; a rationale
  never repeats the readings section; the "Traditions to record as
  readings" prose lists in `authority`, `node`, `instruments`,
  `namespaces`, `validation-order` become stub tradition nodes; (8) a
  harness tradition node from the README's sources (Böckeler 2026;
  Anthropic 2025 and 2026; OpenAI 2026), with a reading under purpose,
  adopted with divergence; (9) the rejected list kept, the issue-tracker
  reason in the author's words; (10) `audience` pruned, its five-audience
  proposal moved to `scope`, `projection` amended to purpose only; (11)
  `srs-introduction` re-oriented to purpose, scope, references, with
  definitions inline and overview deferred; (12) assumption is a criterion
  class, not a form (incumbent `kind-kind` ratification of 2026-09-01; Zave
  and Jackson 1997), so `knowledge-store` and `capture` become dispositions
  with unvalidated criteria; (13) forms become disposition (target and rule
  merged, achieve or maintain carried by the criterion; KAOS), archē,
  reading, tradition, each with a vocabulary node; (14) criteria projected
  on every page, "unguarded" when none, `instrument` becomes a `criteria`
  list of check, assessment, assumption; purpose's criteria proposed; (15)
  an authority section projects the stamp, the ruling, the rejected
  alternatives, and for deferred nodes the pending items the next sitting
  opens on; `## Proposal` and `### Rejected` liquidate into it; (16)
  traditions as a mounted `traditions` graph, one root node per tradition,
  references as readings under the citing node carrying a `tradition:` id,
  cited-by projected; (17) the onboarding walk purpose, scope, primitives
  (`model` rewritten), `/align` (`growth` boosted first under `model`),
  references; cites projected both ways. Recommended at the ruling:
  `purpose` ratified; the other encodings land as amendments with the
  author's words quoted, deferred until each node's own sitting.
  2026-09-03: before ruling, the author asked for three things: the
  disposition for recording transient disposition, recorded deferred as
  `transience` (L37, two surveys under `bootstrap/`); the presentation rule
  on `growth` and in the shim (L38: every recommendation presented before
  recording, with authority class, boldness, and persistence class:
  standing, shim, proposal, open question, evidence, not recorded); and the
  playback restated in that form. All three done the same day; the
  restated playback, seventeen encodings and nine questions with defaults,
  is the open turn. The author ruled on items 1 to 6 the same day (L39):
  1, 2, and 4 recorded; 5 recorded as shims and the field removal; 3 and 6
  not ruled for want of context. The review is paused pending the
  evaluation of a review page (L40). Every remaining item and question,
  with its context, is at `bootstrap/review/sitting-purpose-2026-09-03.yaml`,
  projected to the review page; the author's responses are read with
  `read_db`. Open on the page: the nodes purpose, growth, authority, node,
  instruments, readings, namespaces, projection, model, materialization,
  transience, session-context, scope, audience, knowledge-store, capture,
  srs-introduction, the new harness tradition, reconciliation reading,
  domain-assumptions reading, stub traditions, and form vocabulary; the
  questions q1 forms, q2 traditions home, q4 hexis, q6 second stop, q8
  purpose criteria, q10 author quotes, q11 ledger sunset, q12 review-item
  context, q13 the review page.
  Later the same day the author added four points (L41): q14 rationale
  and the under edge, q15 tier as scope, q16 rejected alternatives as
  structure, all on the page with the `under` node queued whole; and the
  browser's address, tested in the viewer, recorded on `projection` with
  the reading `web-routing` and a browser fix that keeps the reader's place.
  Then the delegation rule (L42) and the priority ruling (L43): priority is
  rank, recorded as boosts; the second priority after the alignment
  disposition is the materialization of harness rules, and the projector now
  writes `.claude/rules/` (`--rules`) and the ancestry projection
  (`--ancestry`).
- **Landed 2026-09-03, afternoon.** Both units reported. Boosts set
  (`model` 8, `growth` 4, `projection` 3, `session-context` 2) and landed
  with the liquidation of the `evaluation` rule shim (disposition
  `9bab2d46`); the projector writes `.claude/rules/` (`--rules`) and the
  ancestry projection (`--ancestry`, exercised in tests only); 75 tests
  pass; browser republished. The review page is built by
  `bootstrap/review/build.mjs` (7 recorded, 25 items, 12 questions; the
  html is generated and gitignored), read for fidelity by a unit (clean),
  and published with the `db` capability at
  https://claude.ai/code/artifact/6b0ef96d-c597-4b3c-9928-be8a4a679678, recorded on
  `growth`'s second shim and in the commands above. Owed to the author: the report the previous entry
  listed (rulings with their three facts, q10 to q16, routing, delegation,
  the boosts, the page link).
- **Queue (2026-09-03; the bootstrap shim of the un-aligned queue, L45,
  until the author rules on its mechanism).** Dispositions the author has
  stated that have not survived a sitting, in the author's order:
  1. The purpose sitting's rulings on the review page (L39 to L41): open.
  2. L44, frontier metrics on the browser's graph headings: sitting open,
     probe one pending.
  3. L45, the queue of un-aligned dispositions: recommendation presented,
     ruling pending.
  Each entry's words are in the ledger section named; a ruling moves the
  entry to a node and strikes it here.
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
