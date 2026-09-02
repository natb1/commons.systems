# Bootstrap operations

Notes that must survive context compaction. Transient: this file liquidates
into the bootstrap-operation node and the `/align` skill (LEDGER.md L15, L16).

## What this ref is

`disposition` is the greenfield disposition graph of commons.systems, kept on
its own ref in this repo (LEDGER.md L04). Its tree holds the graph, its small
tooling, its own `.claude`, and during bootstrap this file, `LEDGER.md`, and
`bootstrap/`. Implementation stays on `main`. Nothing on `main` reads this ref
yet; nothing here reads `intentions/` except as cited evidence (L17).

Created 2026-09-02 under the bootstrap grant (L10) by the bootstrap session
"interview deferral options (2) ⑂ shim review", job 3dcce675. The earlier
orchestration session "interview deferral options (2)" and its
`tactic-bootstrap-operation` in the legacy graph are abandoned, not restarted
(author, 2026-09-02). The legacy graph at `intentions/` is frozen evidence.

## The loop, one round at a time

1. **Propose.** The AI writes the next node in the onboarding walk (L12, L13)
   as an unstamped file, plus any stubs the round needs, stamped deferred.
2. **Project.** The AI renders the browser at this commit so the new node's
   page is what the author reads. Until the projector exists, the page is
   hand-authored; that shim is L14's projection node.
3. **Ratify or steer.** The author reads the page. Ratify: the author stamps
   the node (by hand or by the ratify command once it exists) and the round
   lands. Steer: the AI amends, and the steer enters the node's rationale as
   a rejected alternative or an amendment, then re-projects.
4. **Land.** During bootstrap: `git commit` and `git push origin disposition`
   from the worktree below. No PR. The lander (L04) replaces this.
5. **Ledger.** Each round closes the ledger entries it disposes of and adds
   any new doctrine the author states in the interview.

Rounds are one node until `/align` exists (L15); the author sets the size
after that. The author's choice of what comes next is a boost ratification
(L13).

## Round log

- **Round 0, pending.** `commons.systems/purpose`, question "What is this
  repository for?", answered in the author's words. Parent stubbed:
  `<personal>/agency` (L02). Open inputs from the author: the answer itself;
  the personal import path (L03, recommended `natb1.com`); the root id
  (`agency` or `authorship`).

## Session mechanics

- **Worktree.** `/home/n8/natb1/commons.systems/.claude/worktrees/disposition`
  on branch `disposition`. Enter it with `EnterWorktree` by `path`. It is an
  orphan branch: `git worktree add --orphan -b disposition <path>` created it,
  run with the sandbox disabled because a worktree-isolated session's mounts
  do not cover `.claude/worktrees/`.
- **Writes.** Only inside that worktree. The shared checkout and sibling
  worktrees are read-only to a background session. Job scratch lives at
  `/home/n8/.claude/jobs/<job>/tmp` and is deleted with the job; anything that
  must persist goes on this ref.
- **Bash in a worktree-isolated session** refuses `git -C`, loops,
  redirects, and command substitution. Pipes and heredocs work. Spell tsx as
  `node --import tsx/esm`, never `npx tsx`.
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
- Type b before type a: ground a question in the record and the traditions
  before proposing. Cite primary sources by locus (book, chapter, Bekker or
  section number) so the reading can be queued (L09).
- Incumbent text, including `README.md`, the legacy graph, skills, and rules,
  is context, never doctrine (author, 2026-09-02).
- Every recorded output is adversarially reviewed by the AI as part of
  producing it.

## Decisions taken so far, in the author's words where possible

- Node = one question and its standing answer; history in git; no history in
  the node (author, 2026-09-02).
- Out-of-scope AI answers are inert proposals, never deferred (author).
- Ratified stamps are the author's alone (author-endorsed persistence, L04).
- The word archē replaces "care" (author).
- Two graphs, personal and project, mounted; shim now (author).
- No PR for graph landings (author).
- No tactics; not bound by incumbent design or legacy ids (author).
- This is the bootstrap session; the parent session is not restarted (author).
- The bootstrap grant (author, L10).
- Reconciliation in both directions (author, L11).
- Bootstrap as onboarding; purpose first; README as projection (author, L12,
  L18).
- Rank serves onboarding (author, L13).
- Cadence review of archai rejected (author, L07).
- Tradition readings carry authority classes; deferred reading recurses
  (author, L09).
- The ledger is disposed of before exit; its disposal is the critical path to
  `/align` (author, L15).
