---
id: tactic-sync-reader-skill
kind: tactic
statement: "Draft: /sync-reader skill — sync curriculum reading excerpts from
  the print share to the USB reader, priority-named, retiring resolved chunks"
owner: ai
status: codified
parent: null
rationale: "Retained from the 2026-07-06 /align-strategy interview
  (retain-not-refine): the author's requirement for reading-delivery tooling
  serving the tradition-reading recovery loop. The graph is the curriculum
  source (tactic-reading-chunk-* nodes), the print share is the text source, the
  chunk-node lifecycle is the retirement trigger. Full requirement and interview
  design decisions in the node body."
reading: null
serves:
  - strategy-philosophical-grounding
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boosts:
    "1": 0.01
  rationale: >-
    Author-directed 2026-07-08 (refined): curriculum-maintenance/execution
    tooling (this skill, sibling tactic-sync-reader-skill) ranks below tactics
    that directly edit the /align-strategy and /align-tactics SKILL.md files
    (authored 8) and above the rest of strategy-graph-native-dispatch's subtree
    (inherited 5, unboosted) — boost 7. Supersedes the prior boost-4 rationale
    (dated 2026-07-08), which only cleared strategy-attention-surface (boost 3)
    and did not yet clear the rest of strategy-graph-native-dispatch. Scoped to
    curriculum-execution tactics only, not the reading-chunk tactics under
    strategy-philosophical-grounding, which remain unboosted.


    NAMESPACING STOPGAP 2026-08-11: magnitude compressed from 7 to 0.01 so this
    boost can no longer lift the node out of its parent strategy's band. The
    bound - a tactic boost is namespaced to its strategy's rank and must never
    cause the tactic to outrank a tactic of a higher-ranked strategy - is
    recorded doctrine on strategy-recursive-self-improvement but is NOT yet
    enforced by the resolver; tactic-attention-namespaced-rank makes it
    structural. Until then the flat additive sum defeats it, so the magnitudes
    are compressed by hand onto a 0.01-per-level ladder that preserves the
    original ordering WITHIN the band. Original magnitude preserved at
    attributes.pre_namespacing_boost for restoration.
phase: implement
execution:
  branch: tactic-sync-reader-skill
  pr: 2798
  attempts: {}
  markers: []
  strategy_fingerprint:
    strategy-graph-native-dispatch:
      hash: 2f3c66bffbc596978c5fbf2816bd7a92461deb1386841a7ea4ea72de03c94557
      sha: 045087a0ed5d5362d714d2291aeee190e6a3af0e
  fix:
    since: 2026-07-22
    attempt: 1
    pushed_sha: null
  conflict: null
  completion: null
  lane_pass: null
validates: []
blocked_by: []
superseded_by: []
supersession_expiry: null
office_hours: null
pace_exempt: false
rounds: null
attributes:
  pre_namespacing_boost: 7
---
# /sync-reader skill — sync curriculum reading excerpts from the print share to the USB reader, priority-named, retiring resolved chunks

## Context

The intention graph carries the personal reading curriculum as nine
`tactic-reading-chunk-*` nodes with
`attributes.curriculum = {priority, passages: [{work, range}]}` (recorded
2026-07-06; see `strategy-philosophical-grounding`'s clarifications and
`tactic-tradition-reading-program`'s index). The author owns DRM-free epubs
on a network "print share" and reads on a USB-mounted e-reader. This tactic
builds `/sync-reader`: a skill (SKILL.md + TypeScript scripts run via
`npx tsx`) that scans the graph for active chunks (node file exists,
`phase !== "done"`), matches each cited work against share epubs by OPF
metadata, extracts the cited range at TOC-section granularity into one
excerpt epub per chunk, and mirrors the active-chunk set into a managed
`<reader>/commons-curriculum/` subdirectory with zero-padded
priority-prefixed filenames — deleting retired chunks' files, never touching
anything outside the managed dir, and printing an author-facing report for
anything missing/ambiguous/unmappable instead of falling back to whole-book
copies (clear errors over defensive fallbacks). The outcome is a
re-runnable, idempotent sync with core logic in a new tested workspace
package `packages/sync-reader` and a thin CLI under
`.claude/skills/sync-reader/scripts/`.

Note for the implementing session: committing `.claude/skills/**` from an
auto-mode dispatch session can be denied by the permission classifier
(agent-behavior config); if the commit is blocked, surface it rather than
retrying — the human grants and the session retries.

## Units of work

### Unit 1 — Package scaffold, config loader, curriculum reader

**Scope.** Files created:

- `packages/sync-reader/package.json` — `{"name": "@commons-systems/sync-reader", "private": true, "type": "module"}`
  with exports mapping to `.ts` sources (copy the style of
  `packages/intentionsutil/package.json`, which exports `./src/index.ts`
  directly so `npx tsx` consumers need no build). Direct dependencies:
  `unzipit@^1.4.3` (already a direct dep of print at
  `print/package.json:36` — zero new lockfile versions; Node-compatible zip
  READER), `jszip@^3.10.1` (zip WRITER for excerpt epubs — already in the
  tree transitively via epubjs per `package-lock.json:9858`, so this
  promotes an existing package rather than adding a new one; needed because
  `unzipit` cannot write and no other writer exists in the tree),
  `@xmldom/xmldom@^0.8.13` (Node `DOMParser` substitute for the browser-only
  `DOMParser` the print epub pattern uses at
  `print/src/local-metadata.ts:25`; the root `package.json:36` already
  forces `@xmldom/xmldom@^0.8.13` tree-wide via `overrides`, so this adds no
  new version), plus `@commons-systems/intentionsutil` (`"*"`, workspace).
  `yaml` is NOT needed (intentionsutil wraps it).
- `packages/sync-reader/tsconfig.json` and
  `packages/sync-reader/vite.config.ts` — copy
  `packages/intentionsutil/vite.config.ts` verbatim
  (`import { createLibConfig } from "@commons-systems/config/vite"; export default createLibConfig();`).
- `packages/sync-reader/src/config.ts` — self-contained loader for
  `dispatch.config/sync-reader.json`. Protocol mirrors
  `.claude/skills/dispatch-propagate/scripts/dispatch-config-load` WITHOUT
  editing it: resolve the shared project root as
  `dirname($(git rev-parse --path-format=absolute --git-common-dir))` (same
  rule as `resolve_project_root` at
  `.claude/skills/dispatch-propagate/scripts/lib.sh:1707-1711`, correct
  across worktrees), honor a `SYNC_READER_CONFIG_DIR` env override for tests
  (analogous to `DISPATCH_CONFIG_DIR`), return a discriminated union:
  `{kind:"config", reader_dir, share_dir}` when the file parses and both
  fields are non-empty strings; `{kind:"no-config"}` when absent; throw a
  clear error (message names the file and the bad field) when
  present-but-invalid.
- `packages/sync-reader/src/curriculum.ts` —
  `readActiveChunks(intentionsDir): ActiveChunk[]`. Uses `listNodes` from
  `@commons-systems/intentionsutil` (`packages/intentionsutil/src/store.ts:88`);
  filters to `id.startsWith("tactic-reading-chunk-")` AND
  `attributes.curriculum` present AND `phase !== "done"` (a chunk whose node
  file no longer exists is naturally absent from `listNodes` output — that
  is the retirement signal). Validates the curriculum shape (`priority`
  finite number, `passages` non-empty array of `{work: string, range: string}`)
  and throws a clear per-node error on a malformed shape — no skipping.
- `packages/sync-reader/test/config.test.ts` and `test/curriculum.test.ts` —
  temp-dir fixtures (write node files with `writeNode` from intentionsutil,
  write config JSON under a `SYNC_READER_CONFIG_DIR` temp dir); cover:
  config absent → no-config, invalid → throw, valid → normalized; chunk
  filtering by prefix/phase/missing-attribute, malformed curriculum → throw.

Files changed: root `package.json` — one-line addition of
`"packages/sync-reader"` to the `workspaces` array. This is the vitest
hook: the root `vitest.config.ts:8-20` derives its test projects directly
from `pkg.workspaces` (there is no `vitest.workspace.*` file), so the
workspace entry automatically creates a vitest project named
`packages/sync-reader`. Run `npm install` afterward to link the workspace.

Out of scope: any epub reading/writing, CLI, SKILL.md.

**Recommended model**: sonnet

### Unit 2 — Epub reading, work→epub matching, citation→section mapping

**Scope.** Files created (all under `packages/sync-reader/`):

- `src/epub-read.ts` — `openEpub(path): Promise<EpubSource>`. Read the file
  with `node:fs` `readFileSync`, pass the bytes to `unzip()` from `unzipit`
  (Node needs bytes, not a URL). Port the container→OPF pattern from
  `print/src/local-metadata.ts:25-42,108-115` replacing browser `DOMParser`
  with `new DOMParser()` from `@xmldom/xmldom`. Expose: `dcTitle`,
  `dcCreators` (all `dc:creator` elements, namespaced and unprefixed), the
  manifest (id → href/media-type), the spine (ordered idrefs), and the TOC
  parsed from the EPUB3 nav doc (`properties="nav"` manifest item) with
  EPUB2 NCX fallback (`spine@toc` → `.ncx`), each TOC entry as
  `{label, href, spineIndex}` (href resolved against the OPF directory and
  matched to a spine item; fragment stripped for spine resolution but
  retained).
- `src/matching.ts` — `matchWork(work: string, candidates: EpubMeta[])` →
  `{kind:"match", index} | {kind:"missing"} | {kind:"ambiguous", indices}`.
  Normalization: lowercase, Unicode NFD + strip combining marks
  (diacritics), strip punctuation, collapse whitespace, tokenize. The `work`
  string is `"Author, Title"`-shaped (e.g.
  `"Kant, Groundwork of the Metaphysics of Morals"`): split on the first
  comma into author part and title part; a candidate matches when all
  author tokens appear in the normalized `dc:creator` set AND all
  significant title tokens (drop stopwords: the/of/a/an/and) appear in the
  normalized `dc:title`. Exactly one candidate → match; zero → missing;
  two-plus → ambiguous (never guess).
- `src/citation.ts` — `mapRangeToSections(range, toc, spineLength)` →
  `{kind:"sections", spineIndices: number[]} | {kind:"unmapped", reason: string}`.
  Section-granularity resolution: parse the range into structured tokens
  covering the citation families in the curriculum — Stephanus
  (`"VII 514a-521b"`: roman-numeral book + page-letter span),
  Bekker/Academy (`"4:429"`, `"6:434-437"`, `"II.5-6"`: volume:page or
  book.chapter spans), and plain chapter/book references (`"ch. 2"`,
  `"IV"`). Matching strategy: score TOC entries by normalized-label token
  overlap with the parsed book/part designator (roman or arabic, e.g.
  "Book VII" / "VII" / "7"); the selected sections are the matched entry
  through (exclusive) the next same-depth entry, mapped to a contiguous
  spine-index range; a page-level span within one book still selects the
  whole containing section(s) — never sub-section slicing. Any parse or
  match failure returns `unmapped` with a human-readable reason quoting the
  range and the nearest TOC labels considered (feeds the Unit 4 report; no
  fallback).
- `test/fixture-epub.ts` — helper that builds a small in-memory EPUB
  (jszip) with a known OPF (title/creator), 4-6 XHTML spine items, one CSS +
  one image resource, and both a nav doc and an NCX with labels like
  "Book VII", "Book VIII"; used by Units 2-3 tests so no binary fixture is
  committed. Provide two prebuilt variants ("Plato, Republic"-like and
  "Kant, Groundwork"-like with a `4:429`-mappable section).
- `test/epub-read.test.ts`, `test/matching.test.ts`,
  `test/citation.test.ts` — parse round-trip through `openEpub`; matching
  normalization (diacritics, punctuation, subtitle noise), missing and
  ambiguous outcomes; citation mapping happy paths (Stephanus book range →
  section span, `4:429` → containing section) and unmapped outcomes with
  reason text.

Out of scope: excerpt writing, mirroring, CLI.

**Recommended model**: opus

**Dependencies**: Unit 1

### Unit 3 — Excerpt epub builder

**Scope.** Files created (under `packages/sync-reader/`):

- `src/excerpt.ts` — `buildExcerpt(source, spineIndices, opts: {title})` →
  `Promise<Uint8Array>`. Produces a minimal valid EPUB via jszip: first
  entry `mimetype` with `compression: "STORE"` (insertion-order-first,
  uncompressed, per the EPUB OCF requirement), `META-INF/container.xml`, a
  freshly generated OPF (unique identifier derived deterministically from
  source identifier + chunk selection; `dc:title` = `opts.title`, i.e.
  `"<work> — <range> (chunk <priority>)"`; `dc:creator` copied from
  source), the selected content documents in spine order, plus transitively
  required resources: parse each selected XHTML with `@xmldom/xmldom` and
  collect `link[href]`, `img[src]`, `image[xlink:href]`, and CSS `url(...)`
  references, resolving relative to the doc, copying those manifest
  resources (and CSS-referenced fonts/images one level deep). Include both
  an EPUB3 nav doc and an EPUB2 NCX for device compatibility, listing the
  selected sections. Set fixed zip file dates (e.g. an epoch constant) so
  identical inputs produce byte-identical output — this is what makes
  Unit 4's changed-file detection and idempotent re-runs work by simple
  byte comparison.
- `test/excerpt.test.ts` — build an excerpt from the Unit 2 fixture epub
  selecting a 2-section span; re-open the bytes with `openEpub` and assert:
  `mimetype` first and stored, title set, spine contains exactly the
  selected docs in order, CSS + image resources present, unselected docs
  absent; build twice → identical bytes.

Out of scope: file naming, reader I/O, report.

**Recommended model**: opus

**Dependencies**: Unit 2

### Unit 4 — Mirror sync, report, CLI, skill files

**Scope.** Files created:

- `packages/sync-reader/src/mirror.ts` — pure planning + execution split.
  `planMirror(desired: Map<filename, Uint8Array>, managedDir)` →
  `{writes, deletes, keeps}`: desired filenames are
  `` `${String(priority).padStart(2, "0")}-${chunkId}.epub` `` with the
  `tactic-` prefix dropped from the id for brevity (e.g.
  `04-reading-chunk-3-kant-humanity-servility.epub`) — document the exact
  rule in SKILL.md and keep it consistent. A file is a `write` if absent or
  bytes differ, a `delete` if it is a `*.epub` directly inside the managed
  dir and not in the desired set, a `keep` otherwise. `applyMirror` creates
  `<reader_dir>/commons-curriculum/` if absent and executes the plan; it
  refuses (throws) to delete anything outside the managed dir or any
  non-`.epub` entry, and never touches `reader_dir` outside the managed
  subdir.
- `packages/sync-reader/src/report.ts` — assemble and render the
  author-facing report: per-chunk outcome lines grouped as SYNCED
  (written/kept filename), MISSING WORK (work string; author action:
  acquire a DRM-free epub), AMBIGUOUS (work string + the 2+ candidate
  titles/paths; author action: disambiguate share filenames/metadata),
  UNMAPPED RANGE (work + range + the reason from `citation.ts`), plus
  DELETED (retired files). Plain text to stdout.
- `packages/sync-reader/src/index.ts` — re-export the public surface for
  the CLI.
- `.claude/skills/sync-reader/scripts/sync-reader.ts` — thin CLI. Resolve
  repo root from the script file's own location, never cwd (idiom:
  `packages/intentionsutil/scripts/frontier-view.ts:25-27`), `intentions/`
  under it; main-guard per `frontier-view.ts:35`. Args: 0 positional →
  config via `src/config.ts` (on `no-config`, exit 1 with instructions
  naming `dispatch.config/sync-reader.json` and the example file); 2
  positional → use them; 1 or 3+ → usage error, exit 1. Mount checks before
  any work, in the spirit of
  `.claude/skills/budget/scripts/ingest-downloads.sh:22-26`: each of
  reader_dir/share_dir must exist, be a directory, and be readable, else
  exit 1 with a message telling the user to verify the mount. Flow: read
  active chunks → enumerate `*.epub` under share_dir (recursive) → read
  metadata for each → match/map/build per chunk → plan + apply mirror →
  print report. Exit 0 when the run completes (missing/ambiguous/unmapped
  items are report content, not process failure); exit 1 only for
  environment/config/graph-shape errors. Import core logic as
  `@commons-systems/sync-reader` (resolves through the root `node_modules`
  workspace symlink; tsx follows the `.ts` exports like the existing
  intentionsutil scripts do).
- `.claude/skills/sync-reader/SKILL.md` — short, logic-in-scripts:
  frontmatter description with trigger `/sync-reader [reader_dir share_dir]`;
  body says to run
  `npx tsx .claude/skills/sync-reader/scripts/sync-reader.ts [args]` with
  `dangerouslyDisableSandbox` (USB/share mounts are outside the sandbox
  allowlist), relay the printed report to the user verbatim, and — for
  first-time setup — copy `sync-reader.example.json` to
  `<project-root>/dispatch.config/sync-reader.json` and fill in the two
  paths. Invocation style precedent: `.claude/skills/align-init/SKILL.md:141`.
- `.claude/skills/sync-reader/sync-reader.example.json` — committed
  template: `{"reader_dir": "/media/<user>/<device>", "share_dir": "/mnt/print-share"}`
  (precedent: `.claude/skills/dispatch-propagate/scripts/auto-merge.example.json`).
- `packages/sync-reader/test/mirror.test.ts` — temp-dir reader: fresh sync
  creates managed dir + files; re-run is a no-op (byte-identical excerpts →
  all keeps); retired chunk's file deleted; changed bytes rewritten; a
  stray non-epub file inside the managed dir and any file outside
  `commons-curriculum/` are untouched; delete-outside attempt throws.
- `packages/sync-reader/test/report.test.ts` — report rendering covers all
  five groups.

Out of scope: any change to dispatch-propagate scripts; device-specific
formatting beyond valid EPUB.

**Recommended model**: sonnet

**Dependencies**: Units 1, 2, 3

## Reuse

- `listNodes(dir)` / `readNode(dir, id)` — validated frontmatter-only graph
  reads: `packages/intentionsutil/src/store.ts:88` / `:74`.
- Script-file-relative repo-root resolution + main-guard idiom:
  `packages/intentionsutil/scripts/frontier-view.ts:25-32,35`.
- Epub open pattern (container.xml → OPF rootfile, dc:title extraction) to
  port from browser `DOMParser` to `@xmldom/xmldom`:
  `print/src/local-metadata.ts:25-42,108-115`.
- `unzipit` zip reading (already a direct dep at `print/package.json:36`).
- Config loader protocol (normalized JSON / `no-config` / env-var test
  override) and project-root rule `dirname(git --git-common-dir)`:
  `.claude/skills/dispatch-propagate/scripts/dispatch-config-load` and
  `lib.sh:1707-1711` (protocol copied, files untouched).
- Mount-validation + usage-error precedent:
  `.claude/skills/budget/scripts/ingest-downloads.sh:4,9-26`.
- Vitest project auto-registration from root workspaces:
  `vitest.config.ts:8-20`; lib test config factory `createLibConfig()` from
  `@commons-systems/config/vite` as used by
  `packages/intentionsutil/vite.config.ts`.
- Committed example-config precedent:
  `.claude/skills/dispatch-propagate/scripts/auto-merge.example.json`.

## Verification

```verify
npx vitest run --project packages/sync-reader --root .
```

```verify
npx tsc --noEmit -p packages/sync-reader/tsconfig.json
```

The no-config CLI path (exit 1 + setup instructions naming
`dispatch.config/sync-reader.json`) is covered by `test/config.test.ts`
rather than a shell check — a piped exit-code probe tests the wrong process.

Manual checks (prose): create a scratch pair
`mkdir -p $TMPDIR/reader $TMPDIR/share`, drop one known DRM-free epub cited
by an active chunk into `$TMPDIR/share`, run
`npx tsx .claude/skills/sync-reader/scripts/sync-reader.ts $TMPDIR/reader $TMPDIR/share`,
and confirm: `commons-curriculum/` appears with priority-prefixed excerpt
epubs for mappable chunks, the report lists every other chunk under
MISSING/AMBIGUOUS/UNMAPPED, a second run reports all keeps (no writes),
deleting a chunk node file (in a scratch worktree, not committed) and
re-running removes exactly that excerpt, and a decoy file placed at
`$TMPDIR/reader/keep-me.epub` survives every run. Open one generated
excerpt in an epub reader (e.g. the print app or Calibre) to confirm
device-grade validity. Note for Claude sessions: runs against the real USB
reader and network share, and writing `dispatch.config/sync-reader.json`,
need `dangerouslyDisableSandbox` (paths are outside the sandbox allowlist);
plain `npx vitest run` does not.

## QA items skipped by author (2026-07-22)

QA (PR #2798) escalated two manual-verification acceptance items to
office-hours; the author reviewed and explicitly waived both rather than
running the manual checks — clearing the park:

- Golden-path sync against real content (extraction correctness, priority
  naming, mirroring, retirement, report clarity, idempotency) — skipped.
- Device-grade epub validity on a real e-reader — skipped.

All script-verifiable acceptance items (test suite 54/54, typecheck, CLI
arg/config error paths, delete-outside-managed-dir safety guard) already
passed autonomously.
