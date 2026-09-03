---
question: Is the dependency lockfile committed to the implementation ref?
stage: periagogic
under:
  - commons.systems/disposition-graph/materialization
---
## Disposition

The author, 2026-09-03:
> record unanswered disposition with reference to npm standard tradition to justify commit of package-lock.json - do not proceed to periagoge. Then you have bootstrap authority to commit the lock prior to confirmation for a clean git status

## Proposal

Materialization says materialized implementation is "organized by the JavaScript monorepo convention: one repository, a root manifest declaring workspaces, and one directory per package under `packages/`". It names the manifest and the package layout; it does not say which of the install artifacts the convention produces are part of the record. The lockfile is the one that matters, because it is the only one that is both generated and meant to be committed, and because nothing in the graph yet justifies its presence: on the reading of materialization's own answer it is unsupported implementation, on the frontier and liquidated through reconciliation. This node asks the question that would support it.

What this sitting would amend: `materialization`, by refining what its answer leaves open, not by contradicting it. The periagogic object is materialization's answer and its two shims, the reading under this node, and the implementation the criteria point to on the `greenfield` ref: `package.json`, `packages/disposition/package.json`, `package-lock.json`, and `.gitignore`.

The movement owed is periagogic and has not been run: the author directed that it not be, on 2026-09-03. Nothing here is an answer.

### Evidence, 2026-09-03

The author, 2026-09-03, in the same session and before the words above:
> yes, clear the husks and reinstall node_modules

Acted on that turn, at the author's direction:

- The root `node_modules` was an 888M tree left from the `main` checkout, carrying dependencies no manifest on `greenfield` declares. It was removed and `npm install` run at the workspace root, which produced a 1.4M tree holding exactly `yaml` and the `@commons.systems/disposition` workspace link.
- `npm install` generated `package-lock.json` at the root as a byproduct. It is untracked, and `.gitignore` does not exclude it, so it is the only entry in `git status` on `greenfield`.
- Before the reinstall, `npm ci` failed: "The `npm ci` command can only install with an existing package-lock.json or npm-shrinkwrap.json with lockfileVersion >= 1." That failure is the author's first encounter with this question and is what raised it.
- After the reinstall, `node packages/disposition/validate.mjs disposition` reports `ok: 62 nodes`, `node --test packages/disposition/*.test.mjs` passes 158 of 158, and `node --test .claude/skills/align-review/*.test.mjs` passes 28 of 28.

### Finding: a declared shim's liquidation condition is now met, 2026-09-03

Materialization's second shim is "`packages/disposition` resolving the `yaml` package it declares from an ancestor `node_modules`, the workspace not installing it", to be liquidated when "the workspace installs the package's declared dependencies". The reinstall above met that condition: the root `node_modules` is now the workspace's own install, produced from the workspace manifests, and `yaml` resolves from it rather than from the `main` tree that happened to contain it. Under transience, "a shim whose condition is met and which still exists is a frontier item", so the shim is now one.

It is recorded here and not applied to materialization, because materialization stands at `stage: review` with a forward verdict of 2026-09-03, and amending it would be a change of substance that sends it back through the review. Whether the shim is struck now or at the ruling is for the author; the frontier finding of 2026-09-03 already named this shim as misdescribing its own artifact, and this is the second half of the same item.

Also named: `commons.systems/disposition-graph/materialization`, `commons.systems/disposition-graph/transience`.

### The tradition, 2026-09-03

The npm standard is read as `npm-committed-lockfile`, which finds that the committed surface of an npm workspace is the manifests and the lockfile, and that the standard directs the generated lockfile be committed. The relation is adopted and the reading is stamped deferred: the author has not read the source, and the AI's judgment stands pending review.

The reading sits under `materialization` and not under this node, because an un-aligned disposition has no children, as `transience` states and the validator enforces; it can move under this question once this question is answered. The author contested that rule on 2026-09-03, and the question is now open as `un-aligned-children`. The placement is not a workaround. The reading discharges part of what materialization's own rationale says it owes, since that rationale names the npm workspaces tradition in prose, which readings forbids and the author ruled against on 2026-09-02. Adding a child does not edit materialization, so its forward review verdict of 2026-09-03 is untouched.

The tradition cannot yet be mounted as a tradition node: `traditions-home` is unanswered at the ruling stage, and the manifest carries only `disposition-graph` and `public`. When it is ruled, this reading joins the set `stub-traditions` enumerates.

Also named: `commons.systems/disposition-graph/readings`, `commons.systems/disposition-graph/stub-traditions`, `commons.systems/disposition-graph/traditions-home`.

### Facts

Authority none: this is an un-aligned disposition in the author's words, recorded at their direction and carrying no answer. Boldness low: the disposition, the evidence, and the failure that raised it are the author's own and this session's, and the tradition is held in a reading with its own stamp. Persistence open, until the author rules.

The recording and the landing of the lockfile were directed by the author, who granted bootstrap authority to commit it before confirmation. The commit is not an answer to this question and confers nothing on it; it is reported as what it is, and stays open to every exit.
