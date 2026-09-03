// Read the active reading curriculum out of the intention graph.
//
// The curriculum is carried on `tactic-reading-chunk-*` nodes as
// `attributes.curriculum = {priority, passages: [{work, range}], ...}`. A chunk
// is ACTIVE when its node file still exists (a deleted/retired chunk is simply
// absent from `listNodes`) and its `phase` is not `"done"`. This module reads
// and validates those chunks; a malformed curriculum shape is a clear per-node
// error, never a silent skip.

import { listNodes } from "@commons-systems/intentionsutil";

/** One cited passage: a work reference and a citation range within it. */
export interface Passage {
  work: string;
  range: string;
}

/** An active curriculum chunk with its scheduling priority and passages. */
export interface ActiveChunk {
  id: string;
  priority: number;
  passages: Passage[];
}

const CHUNK_PREFIX = "tactic-reading-chunk-";

/**
 * Return every active curriculum chunk in the store, id-sorted (inherited from
 * `listNodes`). Filters to `tactic-reading-chunk-*` nodes carrying
 * `attributes.curriculum` whose `phase !== "done"` and whose curriculum is not
 * flagged `candidate: true`; validates each curriculum shape and throws on a
 * malformed one.
 */
export function readActiveChunks(intentionsDir: string): ActiveChunk[] {
  const chunks: ActiveChunk[] = [];
  for (const node of listNodes(intentionsDir)) {
    if (!node.id.startsWith(CHUNK_PREFIX)) continue;
    const curriculum = node.attributes.curriculum;
    if (curriculum === undefined) continue;
    if (node.phase === "done") continue;
    // A `candidate: true` chunk is a draft not yet through author review; it
    // must not reach the physical reader before promotion. Promotion clears the
    // flag (or resolves the node), after which it syncs like any other chunk.
    if (isCandidate(curriculum)) continue;
    chunks.push(parseCurriculum(node.id, curriculum));
  }
  return chunks;
}

/**
 * The distinct works cited across a chunk's passages, in first-seen order. A
 * chunk with more than one is a multi-work chunk: it cannot be excerpted to a
 * single source epub, so the CLI reports it as unsupported rather than matching
 * every passage against the first passage's work.
 */
export function chunkWorks(chunk: ActiveChunk): string[] {
  const seen: string[] = [];
  for (const p of chunk.passages) {
    if (!seen.includes(p.work)) seen.push(p.work);
  }
  return seen;
}

/** True when a raw curriculum object carries `candidate: true`. */
function isCandidate(raw: unknown): boolean {
  return (
    typeof raw === "object" &&
    raw !== null &&
    !Array.isArray(raw) &&
    (raw as Record<string, unknown>).candidate === true // type-safety-ok: reading one optional flag off attributes.curriculum before full parse
  );
}

function parseCurriculum(id: string, raw: unknown): ActiveChunk {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error(`${id}: attributes.curriculum must be an object`);
  }
  const c = raw as Record<string, unknown>; // type-safety-ok: narrowing attributes.curriculum after the object guard above

  const priority = c.priority;
  if (typeof priority !== "number" || !Number.isFinite(priority)) {
    throw new Error(
      `${id}: attributes.curriculum.priority must be a finite number`,
    );
  }

  // A chunk may be recorded before its passages are structured (the reading is
  // still only described in the node title) — that is an incomplete chunk, not
  // a corrupt one. Absent or empty `passages` yields an empty list (the CLI
  // reports it for the author to fill in); a present-but-non-array, or any
  // malformed passage element, is genuine corruption and throws — that guard is
  // what keeps a chunk with real reading data from being silently dropped.
  const passagesRaw = c.passages;
  if (passagesRaw === undefined) return { id, priority, passages: [] };
  if (!Array.isArray(passagesRaw)) {
    throw new Error(`${id}: attributes.curriculum.passages must be an array`);
  }
  const passages = passagesRaw.map((p, i) => parsePassage(id, i, p));

  return { id, priority, passages };
}

function parsePassage(id: string, index: number, raw: unknown): Passage {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error(`${id}: curriculum.passages[${index}] must be an object`);
  }
  const p = raw as Record<string, unknown>; // type-safety-ok: narrowing a passage entry after the object guard above
  if (typeof p.work !== "string" || p.work.length === 0) {
    throw new Error(
      `${id}: curriculum.passages[${index}].work must be a non-empty string`,
    );
  }
  if (typeof p.range !== "string" || p.range.length === 0) {
    throw new Error(
      `${id}: curriculum.passages[${index}].range must be a non-empty string`,
    );
  }
  return { work: p.work, range: p.range };
}
