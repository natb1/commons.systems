# Bootstrap operations

Rules for every session and subagent rooted in this worktree. Transient: this
file liquidates into the `disposition-graph/bootstrap` node and the `/align`
skill (LEDGER.md L15, L16, L23). It lives here rather than in session memory
because memory is private to one account and one project path, unversioned,
and invisible to subagents; memory holds only a pointer to this file.

## What this ref is

`disposition` is the greenfield disposition graph of commons.systems, kept on
its own ref in this repository (LEDGER.md L04). Its tree holds the graphs
(`disposition-graph/`, `public/`), the manifest `disposition.yaml`, small
tooling under `tools/`, the browser under `browser/`, and during bootstrap
this file, `LEDGER.md`, and `bootstrap/`. Implementation stays on `main`.
Nothing on `main` reads this ref yet; nothing here reads `intentions/` except
as cited evidence (L17).

Created 2026-09-02 under the bootstrap grant (L10) by the bootstrap session
"interview deferral options (2) ⑂ shim review", job 3dcce675. The earlier
orchestration session and its `tactic-bootstrap-operation` in the legacy graph
are abandoned, not restarted (author, 2026-09-02). The legacy graph at
`intentions/` on `main` is frozen evidence.

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
  design-heavy or judgment-heavy units, such as the browser's layout. `haiku`
  for lookups.
- **Effort.** Stated in the brief: moderate for tooling, high for design.
  Subagents never run state-changing git, never edit node files or the
  ledger, write only the files their brief names, and report the exact
  commands and outputs they ran.

These working definitions are owed as ratified doctrine before exit (L21).

## The loop, one round at a time

1. **Propose.** The main thread writes the next node in the onboarding walk
   (L12, L13) as an unstamped file, plus any stubs the round needs, stamped
   deferred with `by: claude`.
2. **Project.** Run `node tools/project.mjs` to regenerate `browser/index.html`
   and publish it with the Artifact tool, passing the browser's recorded URL
   so the address is stable. The page at the new node's id is what the author
   reads.
3. **Ratify or steer.** The author reads the page. Ratify: the author runs
   `node tools/ratify.mjs <id>` from this worktree, which stamps and commits;
   the AI never writes `class: ratified`. Steer: the main thread amends, the
   steer enters the node's rationale as a rejected alternative or an
   amendment, and the page is re-projected.
4. **Land.** `node tools/validate.mjs`, then `git commit` and `git push origin
   disposition` from this worktree. No pull request. The lander (L04)
   replaces this.
5. **Ledger.** Close the entries the round disposes of; add any doctrine the
   author states in the interview, quoting their words.

Rounds are one node until `/align` exists (L15); the author sets the size
after that. The author's choice of what comes next is a boost ratification
(L13).

## Round log

- **Round 0, in progress (2026-09-02).** `disposition-graph/purpose` written
  as a proposal in the author's words. Stubbed deferred: `public/agency` with
  two readings; `audience`, `knowledge-store`, `capture`, `capture-traditions`
  (open question), `spec-driven-development`, `software-factories`,
  `aristotle-hexis`, `srs-introduction`; `model` and twelve schema nodes;
  `bootstrap`. Tooling units delegated: reader, validator, ratify command
  (sonnet); projector and browser (opus); repository function survey for the
  scope node (sonnet). Waiting on the author: ratification of `purpose` by
  running the ratify command, and the round-one steer.

## Session mechanics

- **Worktree.** `/home/n8/natb1/commons.systems/.claude/worktrees/disposition`
  on branch `disposition`. Enter it with `EnterWorktree` by `path`. It is an
  orphan branch; `git worktree add --orphan -b disposition <path>` created it,
  run with the sandbox disabled because a worktree-isolated session's mounts
  do not cover `.claude/worktrees/`.
- **Writes.** Only inside this worktree. The shared checkout and sibling
  worktrees are read-only to a background session. Job scratch under
  `/home/n8/.claude/jobs/<job>/tmp` is deleted with the job; anything that
  must persist goes on this ref.
- **Bash in a worktree-isolated session** refuses `git -C`, loops,
  redirects, and command substitution. Pipes and heredocs work. Spell tsx as
  `node --import tsx/esm`, never `npx tsx`; the tooling here is plain `.mjs`
  and needs neither.
- **Dependencies.** None installed on this ref. `tools/*.mjs` import `yaml`
  from an ancestor `node_modules`, a shim noted in L04.
- **Reading legacy evidence.** Read files from
  `/home/n8/natb1/commons.systems/intentions/` directly. Never write there.
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
  producing it.

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
