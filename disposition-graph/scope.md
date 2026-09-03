---
question: What does this repository contain, and what does it leave out?
under:
  - commons.systems/disposition-graph/purpose
---
## Proposal

Unanswered; for the author to rule on in round one. A survey of what the repository is recorded as doing (evidence: the README, the root manifest's workspaces, the top-level directories, the statements of the seven legacy root nodes and fifty-eight legacy strategy nodes, forty skill files, and the nix outputs; kept at `bootstrap/scope-survey.md` on the `greenfield` ref) finds twelve recorded functions. Against the purpose above, five fall under the primary function, one under the knowledge-store hypothesis, two under the capture hypothesis, and four outside all three as currently worded.

Under the primary function (a):

1. The intention-graph mechanism: a versioned goal graph, one file per node, with a library that reads, writes, and validates it.
2. The autonomous dispatch harness: a headless scheduler that runs one bounded agent session per unit of work through plan, implement, qa, review, and merge.
3. Interview, audit, and self-improvement tooling: the align skills, the graph audit, and the harness's measurement of its own sessions.
4. Office hours: the human half of the queue, with its own hosted app and local-first snapshot.
5. Distribution and forkability: a plugin marketplace listing, an identity-free nix configuration with a fork template, and a separability audit of the graph tooling.

Under the knowledge-store hypothesis (b):

6. The root layer of principles, several cross-checked against named philosophical and religious traditions: a recorded personal ethical framework independent of any AI use.

Under the capture hypothesis (c):

7. Personal daily-practice dispositions: sleep, food, exercise, household consent, and how the author exercises voice toward delegatees; no software deliverable.
8. A café and community-space business venture: plan, financial model, and decision log, drafted with AI help and not linked into the legacy graph.

Outside the purpose as worded, each with the question that would bring it in or leave it out:

9. Personal-autonomy recovery apps (budget, print, audio): local-first web apps that replace institutional software in the author's daily use, also offered publicly. The intention behind them is close to (c); building and indefinitely maintaining three consumer apps, their shared libraries, and a Firebase backend is a different kind of work. Does the purpose cover maintaining software the author uses personally, or only the intention behind building it?
10. The public site and blog: an About page pitching independent consulting, a project showcase, and posts. Is marketing and portfolio content part of what the repository is for, or a separate function to name or exclude?
11. A tabletop-gaming blog, recorded as a deliberately indirect way of promoting one of the principles. Is covert promotion of the author's values through unrelated content within the purpose, or a hobby that a legacy node happened to rationalize?
12. Shared engineering and host infrastructure: about twenty libraries, the Firebase backend and its rules tests, and the author's own machine configuration, backups, and monitoring. Is the author's computing environment one more institution of daily life the purpose should name, or infrastructure with no purpose of its own?

Two further findings bear on the audience node. The evidence names at least five audiences: practitioners forking the harness, the author alone, prospective consulting clients, the general public downloading a stand-alone plugin, and an unspecified future collaborator. And the third-ref shim makes this question load-bearing: whatever on `main` has no supporting disposition by bootstrap exit is pruned by the swap, so functions 9 to 12 need an answer before then.
