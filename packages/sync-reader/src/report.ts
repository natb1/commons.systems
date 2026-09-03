// Render the author-facing sync report.
//
// Groups per-chunk outcomes into SYNCED, MISSING WORK, AMBIGUOUS, UNMAPPED
// RANGE, plus a DELETED list of retired excerpt files. Plain text for stdout;
// each non-synced group states the author action needed.

export type ChunkOutcome =
  | { kind: "synced"; chunkId: string; work: string; filename: string; wrote: boolean }
  | { kind: "missing"; chunkId: string; work: string }
  | { kind: "ambiguous"; chunkId: string; work: string; candidates: string[] }
  | { kind: "unmapped"; chunkId: string; work: string; range: string; reason: string }
  | { kind: "incomplete"; chunkId: string }
  | { kind: "multi-work"; chunkId: string; works: string[] };

export interface ReportInput {
  outcomes: ChunkOutcome[];
  deleted: string[];
}

function section(title: string, lines: string[]): string[] {
  if (lines.length === 0) return [];
  return [title, ...lines.map((l) => `  ${l}`), ""];
}

export function renderReport(input: ReportInput): string {
  const synced = input.outcomes.filter((o) => o.kind === "synced");
  const missing = input.outcomes.filter((o) => o.kind === "missing");
  const ambiguous = input.outcomes.filter((o) => o.kind === "ambiguous");
  const unmapped = input.outcomes.filter((o) => o.kind === "unmapped");
  const incomplete = input.outcomes.filter((o) => o.kind === "incomplete");
  const multiWork = input.outcomes.filter((o) => o.kind === "multi-work");

  const out: string[] = [];
  out.push("sync-reader report", "");

  out.push(
    ...section(
      "SYNCED",
      synced.map((o) =>
        o.kind === "synced"
          ? `${o.filename}  (${o.work}) — ${o.wrote ? "written" : "unchanged"}`
          : "",
      ),
    ),
  );
  out.push(
    ...section(
      "MISSING WORK — acquire a DRM-free epub and re-run",
      missing.map((o) => (o.kind === "missing" ? `${o.chunkId}: ${o.work}` : "")),
    ),
  );
  out.push(
    ...section(
      "AMBIGUOUS — disambiguate the share filenames/metadata and re-run",
      ambiguous.map((o) =>
        o.kind === "ambiguous"
          ? `${o.chunkId}: ${o.work} → ${o.candidates.join(" | ")}`
          : "",
      ),
    ),
  );
  out.push(
    ...section(
      "UNMAPPED RANGE — check the citation against the epub's table of contents",
      unmapped.map((o) =>
        o.kind === "unmapped"
          ? `${o.chunkId}: ${o.work} [${o.range}] — ${o.reason}`
          : "",
      ),
    ),
  );
  out.push(
    ...section(
      "NO PASSAGES — add {work, range} passages to this chunk's curriculum",
      incomplete.map((o) => (o.kind === "incomplete" ? o.chunkId : "")),
    ),
  );
  out.push(
    ...section(
      "MULTI-WORK — unsupported: one excerpt file maps to one source epub. " +
        "Restructure into per-work chunks (or await multi-work excerpt support).",
      multiWork.map((o) =>
        o.kind === "multi-work" ? `${o.chunkId}: ${o.works.join(" | ")}` : "",
      ),
    ),
  );
  out.push(...section("DELETED (retired)", input.deleted));

  if (
    missing.length + ambiguous.length + unmapped.length + incomplete.length + multiWork.length === 0 &&
    synced.length > 0
  ) {
    out.push("All active chunks synced.", "");
  }

  return out.join("\n");
}
