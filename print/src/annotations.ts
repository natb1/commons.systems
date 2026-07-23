// Reader annotations: text-selection highlights and notes, persisted in an open
// format in storage the reader owns (the `.commons-print` sidecar for local
// items, device-local localStorage otherwise). Deliberately never Firestore —
// reading notes must not accumulate in a vendor silo (strategy-recover-knowledge
// clarification recorded 2026-07-06).
//
// This module is renderer-agnostic: it owns the on-disk shape and its
// coercion, plus the AnnotationsStore interface the viewer wires. The PDF
// anchor fields (page/offset/length) and the persistence routing live in
// print/src/viewer/pdf.ts and print/src/pages/view.ts respectively.

import { isPlainObject } from "@commons-systems/sidecar";

/**
 * A single reader annotation, versioned by the enclosing store's `version` field.
 *
 * ON-DISK OPEN FORMAT (user-visible — keep stable and documented):
 * - `id`       — stable unique id (the writer mints a UUID).
 * - `position` — the renderer's serialized position used for navigation. For
 *                PDF this is the 1-based page-number string (same space as a
 *                reading position); for EPUB (a later tactic) it is a CFI.
 * - `quote`    — the highlighted text, captured at creation for display in the
 *                panel and as a human-readable anchor.
 * - `note`     — the reader's note; empty string for a bare highlight.
 * - `created`  — ISO-8601 creation timestamp.
 *
 * OPTIONAL PDF ANCHOR (`page`, `offset`, `length`): describe the highlighted
 * range within the page's text-layer text — the same offset space
 * `offsetToItemRanges` consumes (print/src/viewer/pdf.ts). They stay optional so
 * an EPUB (CFI-only) annotation fits the same shape without carrying PDF
 * coordinates. A PDF highlight cannot be painted without all three, so the
 * renderer treats an annotation as paintable only when every anchor field is
 * present.
 */
export interface Annotation {
  id: string;
  position: string;
  quote: string;
  note: string;
  created: string;
  /** PDF anchor: 1-based page number. Optional (absent for EPUB). */
  page?: number;
  /** PDF anchor: start offset into the page's reconstructed text. */
  offset?: number;
  /** PDF anchor: length of the highlighted range in the page text. */
  length?: number;
}

/**
 * A persistence backend for a single media item's annotations, mirroring
 * PositionStore / BookmarksStore. `load` returns the full list; `save` writes
 * the full list (the store owns no partial-update semantics — callers pass the
 * complete post-edit array).
 */
export interface AnnotationsStore {
  load(): Promise<Annotation[]>;
  save(annotations: Annotation[]): Promise<void>;
}

/**
 * Coerce a raw value into a typed Annotation list, dropping any entry that is
 * not a plain object with all five required string fields. Optional numeric
 * anchor fields are carried only when they are numbers. This is the system-edge
 * guard: a malformed on-disk entry can never surface as a non-string quote or a
 * non-number offset downstream. Mirrors `coerceMetadata` / `coercePositions`
 * in print/src/sidecar.ts, applied to an array rather than a keyed map.
 */
export function coerceAnnotationList(raw: unknown): Annotation[] {
  if (!Array.isArray(raw)) return [];
  const out: Annotation[] = [];
  for (const value of raw) {
    if (!isPlainObject(value)) continue;
    if (typeof value.id !== "string") continue;
    if (typeof value.position !== "string") continue;
    if (typeof value.quote !== "string") continue;
    if (typeof value.note !== "string") continue;
    if (typeof value.created !== "string") continue;
    const entry: Annotation = {
      id: value.id,
      position: value.position,
      quote: value.quote,
      note: value.note,
      created: value.created,
    };
    if (typeof value.page === "number") entry.page = value.page;
    if (typeof value.offset === "number") entry.offset = value.offset;
    if (typeof value.length === "number") entry.length = value.length;
    out.push(entry);
  }
  return out;
}

/**
 * Type guard: an annotation carries a complete PDF anchor (all three fields),
 * so the renderer can map it onto text-layer divs. EPUB annotations (position
 * only) return false and are skipped by the PDF highlight painter.
 */
export function hasPdfAnchor(
  a: Annotation,
): a is Annotation & { page: number; offset: number; length: number } {
  return (
    typeof a.page === "number" &&
    typeof a.offset === "number" &&
    typeof a.length === "number"
  );
}
