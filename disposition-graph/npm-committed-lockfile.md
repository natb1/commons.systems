---
question: What does the npm standard say a workspace commits?
stage: periagogic
form: reading
authority:
  class: deferred
  by: claude
  date: 2026-09-03
under:
  - commons.systems/disposition-graph/materialization
source: npm CLI documentation, "package-lock.json" (npm 7 and later), the Description section; "npm ci", the Description section; and "workspaces". The lockfile was introduced in npm 5 (2017); the workspaces model this repository uses arrived in npm 7 (2020).
relation: adopted
---
## Answer

The committed surface of an npm workspace is the manifests and the lockfile: a root `package.json` declaring the workspaces, one `package.json` per package, and a single `package-lock.json` at the root covering every workspace. The answer above adopts the first two and is silent on the third, but the standard does not treat it as a separate choice — the lockfile is part of what the convention says a repository carries, and the standard directs that the generated lockfile be committed to source control.

The reason is the one this record cares about. A `package.json` declares ranges, so it describes a set of possible dependency trees rather than one tree; `package-lock.json` describes the single tree actually installed, exactly, transitively, with integrity hashes. Committing it is what makes an install reproducible across machines and across time, and what makes a change to the tree arrive as a reviewable diff rather than as a silent difference between two checkouts. Under workspaces this is more load-bearing, not less: one root lockfile is the only artifact that records how the whole hoisted tree resolved.

`npm ci` is the sharp end of it. The command exists to install strictly from the lockfile and refuses to run without one, so a repository that omits the lockfile has no reproducible install command at all, only `npm install`, whose result depends on when it is run.

## Rationale

Adopted, and narrowly: what the standard settles is that a lockfile which exists is committed rather than ignored, and that omitting it is not a neutral choice but the loss of reproducibility and of `npm ci`. It does not settle whether this repository wants one, which is the question the child asks.

This discharges part of the reading the answer above already says it owes. That rationale names Lerna (2015), Yarn workspaces (2017), npm workspaces (npm 7, 2020) and Potvin and Levenberg (2016) in prose, which readings forbids; this reading takes the npm strand of it. The strand is stronger than the layout convention it accompanies: the monorepo layout is one convention among several, while the committed lockfile is the ecosystem's documented default.

Weighed and not adopted: that a lockfile is generated output and so belongs with `dist/` and `tmp/` in the ignore list. It is generated but not derived — regenerating it can produce a different tree, which is the whole reason the standard says to commit it, and a generated artifact that cannot be reproduced from its inputs is a record, not output. Also weighed: that this repository's install is one direct dependency deep, so drift is unlikely to matter. True today, and an argument about the current cost of either choice rather than about the standard.

Where projects do depart, it is normally a published library, whose consumers resolve their own trees and for which the lockfile is not honoured downstream. That exception does not reach a private workspace root, which this is.

Validated by the AI on 2026-09-03 from its own knowledge of the npm documentation, not from a fetch of the source; deferred until the author reads it. A reading whose verdict changes on re-reading is a re-grasp trigger for the node it grounds.
