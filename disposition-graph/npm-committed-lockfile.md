---
question: What does the npm standard say a workspace commits?
stage: periagogic
facts:
  - name: answer
    options:
      - name: standing
        source: ai
        ref: "2026-09-03"
      - name: reparent-under-lockfile
        source: ai
        ref: "2026-09-03"
    stands: standing
form: reading
under:
  - commons.systems/disposition-graph/materialization
source: npm CLI documentation, "package-lock.json" (npm 7 and later), the Description section; "npm ci", the Description section; and "workspaces". The lockfile was introduced in npm 5 (2017); the workspaces model this repository uses arrived in npm 7 (2020).
bears:
  - fact: answer
    option: standing
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

## Facts

### answer

#### reparent-under-lockfile

The npm reading moves from under materialization to under lockfile, the question it actually grounds. It was placed on the parent only because the struck no-children rule blocked its proper parent; un-aligned-children now answers that a disposition plus dialogue state may be refined by children exactly as an answered node may, naming this very reading as the misplacement the struck rule caused. The node's own account says the move is a graph edit that changes what the reading is a reading of, so it is put to the author rather than done silently. It still sits under materialization in the record. Raised on commons.systems/disposition-graph/un-aligned-children, commons.systems/disposition-graph/lockfile.

## Account

### Re-encoding, 2026-09-03

Re-encoded on 2026-09-03 under the author's bootstrap grant on the dialogue node, against graph commit 6d21d356: the account section, formerly named the proposal, and the recommended text, formerly the draft, were renamed, and the dialogue state was written as data.
Alternatives pending, with their sources: `move-under-lockfile` (ai, 2026-09-03, from commons.systems/disposition-graph/un-aligned-children); `reparent-under-lockfile` (ai, 2026-09-03, from commons.systems/disposition-graph/lockfile).
The census unit's note: A reading with an answer, no draft, no recommendation field and no Disposition section, standing at the periagogic stage under materialization; adopts is null because the node carries no recommendation. Nothing is pending: the two positions weighed and not adopted in the rationale, that a lockfile is generated output belonging with the ignored directories and that this repository's install is too shallow for drift to matter, are ruled there, and the note that the reading was validated from the AI's own knowledge rather than a fetch is a fact about its class, not a candidate answer. Its question does not duplicate lockfile's, which asks whether this repository commits one; this asks only what the npm standard says.

### Alternatives merged, 2026-09-03

The alternatives raised on this node by more than one census cohort were merged at the re-encoding, and any alternative the standing answer already carries was removed: `reparent-under-lockfile` absorbs `move-under-lockfile`. The merge unit's note: The node has no recommendation, so neither name is adopted; `reparent-under-lockfile` was kept as the clearer of the two.
