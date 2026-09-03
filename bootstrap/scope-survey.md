# Scope survey: what commons.systems is recorded as doing

Read-only survey of the main checkout at `/home/n8/natb1/commons.systems`, done
to check a new draft statement of purpose against everything the repository
currently does. Everything cited below — the README, skills, rules, the
`intentions/` graph — is treated as evidence of past decisions, not authority.
Vocabulary from those sources (e.g. "tactic", "dispatch") is used only to name
files, not adopted as this survey's own framing.

The three candidate purposes, as given:

- **(a) primary** — spec-driven development to manage alignment of long-horizon
  AI agent workflows or software factories, for humans who may arrive via an
  AI tasked with that goal.
- **(b) hypothesis** — serving as a knowledge store, something like a
  projection of the author's hexis.
- **(c) hypothesis** — helping manage capture of author intention in the
  variety of ways it occurs in daily life via a variety of institutions, not
  just misaligned AI writing software.

## 1. Functions

**1. Intention-graph mechanism.** A versioned goal graph, one markdown file
per node, whose own field schema is defined by a handful of "kind" nodes, plus
a TypeScript library that reads/writes/validates it.
*Evidence:* README.md:6-21; `intentions/kind-kind.md:659`; `packages/intentionsutil/`.
Recorded scale: `grep -h '^kind:' intentions/*.md` counts 663 tactic, 58
strategy, 22 delegation, 13 tradition, 7 virtue files.
*Judgement:* **a** — this is the literal data structure the primary purpose
names ("spec-driven development").

**2. Root virtue layer.** Seven unconditional principle nodes (temperance,
right livelihood, philosophical mobility, progressive detachment, knowledge as
gift, alignment of attachments, respect for persons), several explicitly
cross-checked against named philosophical or religious traditions.
*Evidence:* `intentions/virtue-temperance.md:4-5`;
`intentions/virtue-right-livelihood.md:9-20` (cites Buddhist samma-ajiva,
Aristotle, Stoicism, Franciscan poverty, motivation psychology as support or
contradiction); `intentions/virtue-knowledge-as-gift.md:4-5`.
*Judgement:* **b** — these are not software specs; on their face they read as
a recorded personal ethical framework, independent of any AI-workflow use.

**3. Autonomous dispatch orchestration harness.** A headless scheduler (bash
plus systemd, no model in the loop deciding what to run) that spawns one
bounded agent session per unit of work into its own worktree and drives it
through phases — plan, implement, qa, review, merge.
*Evidence:* README.md:72-78; `.claude/skills/dispatch-ladder/SKILL.md`;
`.claude/skills/qa-fix/SKILL.md`, `review-fix/SKILL.md`; `nix/packages/dispatch.nix`.
*Judgement:* **a** — matches "long horizon AI agent workflows or software
factories" almost verbatim.

**4. Interview, audit, and self-improvement tooling.** `/align` records or
revises one graph node by interview; `/align-tactics` breaks a strategy into
planned, PR-sized units; `/align-audit` re-checks the whole graph for
consistency; `/rsi` and `/rsi-audit` measure the harness's own past sessions to
find ways to improve it.
*Evidence:* `.claude/skills/align/SKILL.md`; `align-audit/SKILL.md`;
`align-tactics/SKILL.md`; `rsi/SKILL.md`; `rsi-audit/SKILL.md`.
*Judgement:* **a** — tooling for managing the alignment process itself.

**5. Office hours (the human half of the queue).** A second queue for
whatever the autonomous side can't resolve on its own, with its own hosted
web app and a local-first snapshot of its data.
*Evidence:* README.md:26-30; `office-hours/`;
`office-hours-snapshot/README.md:3-14`; `nix/nixos/office-hours.nix`;
`landing/src/site-config.ts:69-77` ("A live view of the just-in-time reminder
queue — what's due, how soon, and whether you're keeping pace").
*Judgement:* **a** — the README names this as one of the harness's two queues.

**6. Distribution and forkability of the harness.** A Claude Code plugin
marketplace listing, an identity-free nix configuration framework plus a
copy-paste fork template, and a written audit of what breaks when the graph
tooling is used outside this repo.
*Evidence:* `.claude-plugin/marketplace.json`;
`examples/office-hours-nate/README.md:1-17`;
`packages/intentionsutil/SEPARABILITY.md:1-16`; README.md:35-50.
*Judgement:* **a** — matches "for humans who may arrive via an AI tasked with
that goal."

**7. Personal daily-practice dispositions.** Strategy nodes about sleep,
food, exercise, household consent, and how the author exercises "voice"
toward people or things he's delegated to. No software deliverable.
*Evidence:* `intentions/strategy-sleep-regularity.md:4`;
`strategy-nourishment.md:4`; `strategy-physical-training.md:4`;
`strategy-household-shared-attachments.md:4`; `strategy-exercise-voice.md:4`.
*Judgement:* **c** — plainly capturing intention about daily life, with no
connection to software or AI.

**8. Personal-autonomy recovery apps (budget, print, audio).** Three
local-first web apps that replace institutional software (a bank's site, an
ebook or audio platform) in the author's own daily use, each also listed
publicly as a forkable product.
*Evidence:* `landing/src/site-config.ts:79-110`;
`intentions/strategy-recover-author-autonomy.md:8-14`;
`strategy-domain-selection.md:9-25`; `budget/`, `print/`, `audio/`;
`projects/budget-etl/`.
*Judgement:* **outside** — see section 2.

**9. Landing (public site and blog).** The commons.systems marketing site:
an About page pitching the author's independent consulting work, a project
showcase, and a blog.
*Evidence:* `landing/src/site-config.ts:13-17,29-31`; `landing/post/`.
*Judgement:* **outside** — see section 2.

**10. Fellspiral (personal tabletop-gaming blog).** A blog about tabletop
role-playing games, recorded as a deliberately indirect way of promoting one
of the virtues to other people.
*Evidence:* `fellspiral/src/site-config.ts:12` ("A TTRPG game blog by Nate.
Nate likes games about social role play."); `intentions/strategy-tabletop-storytelling.md:4-22`.
*Judgement:* **outside** — see section 2.

**11. Club (café/community-space business venture).** A from-scratch business
plan, financial model, and interview-style decision log for a physical
café/event-space business, drafted with AI help. It is not linked into the
`intentions/` graph by any `serves` edge.
*Evidence:* `projects/club/business-plan.md:1-16`; `projects/club/model/`;
`projects/club/strategy/adversarial-review.md`.
*Judgement:* **c** — an ordinary daily-life institution (a small business)
whose plans are captured and revised through the same interview/decision-log
pattern used elsewhere in the graph, even though the plan itself lives outside
`intentions/`.

**12. Shared engineering and host infrastructure.** About twenty shared code
libraries, a Firebase backend, a Firestore security-rules test suite, plus the
author's own NixOS/macOS machine configuration (shell, editor, SSH, Tailscale)
and backup/monitoring scripts.
*Evidence:* `packages/` (ds, style, router, crypto, local-first, sidecar,
blog, rules-test, and others); `functions/src/`; `nix/home/`, `nix/nixos/`,
`nix/darwin/`; `ops/durability/RESTORE.md`; `ops/monitoring/budget-alert.json`.
*Judgement:* **outside** — see section 2.

## 2. Outside the stated purpose

**8. Personal-autonomy recovery apps.** The strategy recorded behind these
apps ("recover the author's own autonomy, domain by domain",
`strategy-recover-author-autonomy.md:8-14`) is close to hypothesis (c) —
capturing intention about a daily-life institution (a bank, a reading
platform). But building and indefinitely maintaining three full consumer
web apps, their shared libraries, and their Firebase backend is a much larger
and different kind of ongoing work than capturing that intention. Question:
does the new purpose cover maintaining consumer software the author happens
to use personally, or only the intention behind building it?

**9. Landing.** The site's About page pitches the author's independent
consulting business, and its showcase promotes the other apps. This is
audience-building and marketing copy, not the alignment tool itself or a
captured intention. Question: is public marketing/portfolio content part of
what the repository is for, or a separate function the purpose statement
should either name or explicitly exclude?

**10. Fellspiral.** This blog exists, by the graph's own account, to promote
a virtue *indirectly* — "the philosophy stays invisible in the content: the
blog is a game blog and the table is a game table"
(`intentions/strategy-tabletop-storytelling.md:18-21`). Question: is
deliberately covert promotion of the author's values through unrelated
content (a hobby blog) something the new purpose is meant to cover, or is
this simply a hobby that a graph entry happens to rationalize?

**12. Shared engineering and host infrastructure.** The author's own laptop
and server configuration (shell, editor, SSH keys, Tailscale, backups,
billing alerts) sits in the same repository as the intention graph, alongside
generic libraries used by several apps. Question: is the author's own
computing environment one more "institution" of daily life the purpose
statement should mention, or is it infrastructure the statement can simply
leave unaddressed because it has no independent purpose of its own?

## 3. Audience evidence

Every place the evidence names or implies who the repository is for:

- "Install the skills as a plugin. Add this repo as a Claude Code plugin in
  your own project" — README.md:35-37. Audience: a practitioner adopting the
  tooling in their own repository.
- "/mount... it creates your own `intentions/` graph... and mounts this
  repo's graph as a **delegatee**" — README.md:38-47. Same audience, mid-setup.
- Plugin marketplace description: "Agentic coding workflow patterns and
  skills for managing GitHub issues, worktrees, and iterative development
  loops" — `.claude-plugin/marketplace.json`. Audience: anyone browsing
  Claude Code plugins.
- Budget plugin listing: "Sync your QFX/OFX/CSV bank statements into an
  encrypted budget snapshot on your machine — no signup, no data sharing" —
  `.claude-plugin/marketplace.json`. Audience: the general public looking for
  a personal-finance tool.
- About-page copy: "Nathan Buesgens — independent contractor focused on
  training the AI skills that decouple a business from professional services
  and platform vendors." — `landing/src/site-config.ts:16`. Audience:
  prospective consulting clients.
- Site tagline: "Know the software that runs your business. Forkable,
  local-first apps built with commons.systems — and running without it." —
  `landing/src/site-config.ts:30-31`. Audience: business owners considering
  the apps, or forking them.
- Fellspiral tagline: "A TTRPG game blog by Nate. Nate likes games about
  social role play." — `fellspiral/src/site-config.ts:12`. Audience: tabletop
  hobbyists; informal, first-name voice.
- Morning-brief skill: "This page is my 30-second morning glance... so I
  start oriented instead of overwhelmed." — `.claude/skills/morning/SKILL.md:8`.
  Audience: the author alone.
- Brand voice guide: "Someone leaving notes for the next person. The writing
  assumes the reader might continue this work, fork it, or take it in a
  completely different direction." — `.claude/skills/brand/SKILL.md:11`.
  Audience: a future collaborator or forker.
- Separability audit: the graph is meant to be something "a reader can adopt
  with their own project management and agentic workflows." —
  `packages/intentionsutil/SEPARABILITY.md:3-4`. Audience: an external
  adopter, independent of this repo's own harness.
- Fork template: "a copy-paste template for your private `office-hours-nate`
  instance flake." — `examples/office-hours-nate/README.md:3-6`. Audience: a
  forker standing up their own machine.

Taken together, the evidence names at least five distinct audiences: (i)
practitioners forking the harness into their own repo, (ii) the author
himself, (iii) prospective consulting clients, (iv) the general public
downloading a stand-alone plugin, and (v) an unspecified future
reader/collaborator.

## 4. Counts

| Item | Count |
|---|---|
| npm workspaces (`package.json:5-35`) | 31 |
| Top-level directories (non-hidden) | 20 |
| Virtue files (`intentions/virtue-*.md`) | 7 |
| Strategy files (`intentions/strategy-*.md`) | 58 |
| Skill directories (`.claude/skills/*/`) | 40 |

(Top-level count excludes dotfile directories such as `.claude`, `.github`,
`.git`; including those adds roughly seven more.)
