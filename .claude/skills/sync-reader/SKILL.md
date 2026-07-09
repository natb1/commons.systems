---
name: sync-reader
description: Sync the personal reading curriculum from the print share to the USB e-reader — extracts the cited range of each active reading-chunk into a per-chunk excerpt epub, priority-named, and retires resolved chunks. Trigger on `/sync-reader [reader_dir share_dir]` or "sync my reader".
---

# sync-reader

Mirrors the active reading curriculum onto the USB e-reader. The intention graph
carries the curriculum as `tactic-reading-chunk-*` nodes
(`attributes.curriculum = {priority, passages: [{work, range}]}`); the author's
DRM-free epubs live on a network "print share". This skill matches each cited
work against a share epub, extracts the cited range at table-of-contents section
granularity into one excerpt epub per chunk, and syncs the active set into a
managed `<reader_dir>/commons-curriculum/` directory with priority-prefixed
filenames — deleting excerpts for retired chunks and never touching anything
outside that managed subdirectory.

## Run it

All logic lives in the package `@commons-systems/sync-reader` and the thin CLI
below. The reader and share are outside the sandbox filesystem allowlist (USB
and network mounts), and writing the config file is too, so run with
`dangerouslyDisableSandbox`:

```
npx tsx .claude/skills/sync-reader/scripts/sync-reader.ts [reader_dir share_dir]
```

- With no arguments, the mounts come from
  `<project-root>/dispatch.config/sync-reader.json`.
- With two arguments, they are used directly (`reader_dir` then `share_dir`).

Relay the printed report to the user **verbatim** — it is the author-facing
result. Its groups are:

- **SYNCED** — excerpt written or unchanged (with the filename).
- **MISSING WORK** — no share epub matched; the author acquires a DRM-free epub.
- **AMBIGUOUS** — two-plus epubs matched; the author disambiguates share
  filenames/metadata.
- **UNMAPPED RANGE** — the citation could not be resolved to a section; the
  author checks it against the epub's table of contents.
- **DELETED (retired)** — excerpts removed because their chunk is gone or done.

Missing/ambiguous/unmapped items are report content, not failures — the command
still exits 0. A non-zero exit means an environment/config/graph-shape error
(the message names the cause).

## First-time setup

If the run reports no config, copy the template and fill in the two paths:

```
cp .claude/skills/sync-reader/sync-reader.example.json \
   <project-root>/dispatch.config/sync-reader.json
```

- `reader_dir` — the USB e-reader mount (e.g. `/media/<user>/<device>`).
- `share_dir` — the print-share mount holding the epubs (e.g.
  `/mnt/print-share`).

The excerpt filename for a chunk is
`<zero-padded-priority>-<chunk-id-without-tactic-prefix>.epub` (e.g.
`04-reading-chunk-3-kant-humanity-servility.epub`).
