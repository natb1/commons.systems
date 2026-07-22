// /sync-reader CLI — sync curriculum reading excerpts from the print share to
// the USB reader. Thin orchestration over @commons-systems/sync-reader.
//
//   npx tsx .claude/skills/sync-reader/scripts/sync-reader.ts [reader_dir share_dir]
//
// With no positional args, the reader/share mounts come from
// dispatch.config/sync-reader.json (via loadConfig). With two positional args,
// they are used directly. The intentions store is resolved from this file's own
// location, never cwd. Exit 0 when the run completes (missing/ambiguous/
// unmapped items are report content, not failure); exit 1 only for
// environment/config/graph-shape errors.

import { readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  applyMirror,
  buildExcerpt,
  chunkWorks,
  desiredFilename,
  loadConfig,
  managedDirFor,
  mapRangeToSections,
  matchWork,
  openEpub,
  planMirror,
  readActiveChunks,
  renderReport,
  type ChunkOutcome,
  type EpubSource,
} from "@commons-systems/sync-reader";

// The script lives at `.claude/skills/sync-reader/scripts/sync-reader.ts`, so
// the repo root is four directories up. Resolve from this file, never cwd.
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(dirname(scriptDir))));
const intentionsDir = join(repoRoot, "intentions");

function fail(message: string): never {
  process.stderr.write(`sync-reader: ${message}\n`);
  process.exit(1);
}

function resolveMounts(args: string[]): { reader: string; share: string } {
  if (args.length === 0) {
    const cfg = loadConfig();
    if (cfg.kind === "no-config") {
      fail(
        "no reader/share configured. Create dispatch.config/sync-reader.json " +
          "(copy .claude/skills/sync-reader/sync-reader.example.json and fill in " +
          "reader_dir and share_dir), or pass them: sync-reader <reader_dir> <share_dir>.",
      );
    }
    return { reader: cfg.reader_dir, share: cfg.share_dir };
  }
  if (args.length === 2) return { reader: args[0], share: args[1] };
  fail("usage: sync-reader [reader_dir share_dir]");
}

function assertMount(path: string, label: string): void {
  let st;
  try {
    st = statSync(path);
  } catch {
    fail(`${label} "${path}" is not accessible — verify the mount is present.`);
  }
  if (!st.isDirectory()) fail(`${label} "${path}" is not a directory.`);
}

function findEpubs(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findEpubs(p));
    else if (entry.name.toLowerCase().endsWith(".epub")) out.push(p);
  }
  return out.sort();
}

async function main(): Promise<void> {
  const { reader, share } = resolveMounts(process.argv.slice(2));
  assertMount(reader, "reader_dir");
  assertMount(share, "share_dir");

  const chunks = readActiveChunks(intentionsDir);

  // Open every share epub once for metadata + section extraction. A corrupt
  // share file surfaces as a clear error (naming the file) rather than being
  // silently skipped.
  const sources: EpubSource[] = [];
  for (const path of findEpubs(share)) {
    sources.push(await openEpub(path));
  }

  const desired = new Map<string, Uint8Array>();
  const pending: { chunkId: string; work: string; filename: string }[] = [];
  const outcomes: ChunkOutcome[] = [];

  for (const chunk of chunks) {
    // A chunk recorded before its passages are structured has nothing to
    // extract yet — surface it so the author fills it in, rather than skipping.
    if (chunk.passages.length === 0) {
      outcomes.push({ kind: "incomplete", chunkId: chunk.id });
      continue;
    }
    // A chunk citing passages from more than one work cannot be excerpted to a
    // single source epub: matching only the first passage's work would map the
    // rest against the wrong epub (a silent wrong excerpt). Report it as
    // unsupported instead — clear error over defensive fallback.
    const works = chunkWorks(chunk);
    if (works.length > 1) {
      outcomes.push({ kind: "multi-work", chunkId: chunk.id, works });
      continue;
    }
    const primary = chunk.passages[0];
    const match = matchWork(primary.work, sources);
    if (match.kind === "missing") {
      outcomes.push({ kind: "missing", chunkId: chunk.id, work: primary.work });
      continue;
    }
    if (match.kind === "ambiguous") {
      outcomes.push({
        kind: "ambiguous",
        chunkId: chunk.id,
        work: primary.work,
        candidates: match.indices.map((i) => sources[i].path),
      });
      continue;
    }

    const source = sources[match.index];
    const spineSet = new Set<number>();
    let unmapped: { range: string; reason: string } | null = null;
    for (const passage of chunk.passages) {
      const mapped = mapRangeToSections(passage.range, source.toc, source.spineItems.length);
      if (mapped.kind === "unmapped") {
        unmapped = { range: passage.range, reason: mapped.reason };
        break;
      }
      for (const idx of mapped.spineIndices) spineSet.add(idx);
    }
    if (unmapped) {
      outcomes.push({
        kind: "unmapped",
        chunkId: chunk.id,
        work: primary.work,
        range: unmapped.range,
        reason: unmapped.reason,
      });
      continue;
    }

    const spineIndices = [...spineSet].sort((a, b) => a - b);
    const ranges = chunk.passages.map((p) => p.range).join(", ");
    const title = `${primary.work} — ${ranges} (chunk ${chunk.priority})`;
    const bytes = await buildExcerpt(source, spineIndices, { title });
    const filename = desiredFilename(chunk.id, chunk.priority);
    desired.set(filename, bytes);
    pending.push({ chunkId: chunk.id, work: primary.work, filename });
  }

  const managed = managedDirFor(reader);
  const plan = planMirror(desired, managed);
  applyMirror(plan, managed);

  const written = new Set(plan.writes.map((w) => w.filename));
  for (const p of pending) {
    outcomes.push({ kind: "synced", ...p, wrote: written.has(p.filename) });
  }

  process.stdout.write(renderReport({ outcomes, deleted: plan.deletes }));
  process.stdout.write("\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err: unknown) => {
    fail(err instanceof Error ? err.message : String(err));
  });
}
