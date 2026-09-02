/**
 * Filesystem side of the gap-note store: create-only append and read.
 *
 * Mirrors `operational-store.ts`'s split from `operational-records.ts` exactly
 * (pure shape/validation there, fs effects here), and reuses that module's
 * `createOnly` wx primitive directly rather than re-deriving the idiom: one
 * record is one file, created with `wx`, so a concurrent append is a disjoint
 * file creation and identical content re-appended is an idempotent no-op.
 *
 * NOT BARRELED, same reasoning as `operational-store.ts`: this module does
 * real fs work (`node:fs`), so it must never ride the browser-safe `graph.ts`
 * entry. It is not on the root `index.ts` barrel either, for the same reason
 * `operational-store.ts` and `check-registrations.ts` are not: those already
 * shell out or touch fs directly and stay off both barrels; import it
 * directly as `./gap-note-store.js`.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { IntentionSchemaError } from "./errors.js";
import { createOnly } from "./operational-store.js";
import {
  gapNoteFileContent,
  gapNotePath,
  gapNotesDir,
  validateGapNoteRecord,
  type GapNoteRecord,
} from "./gap-notes.js";

/**
 * Create one gap-note record, or accept an identical one already on disk.
 * Validated first, so the bytes on disk are the normalized canonical form and
 * the path is derived from that same form — appending an identical record
 * twice resolves to one path and is a no-op success, exactly as
 * `appendEvidence` behaves.
 *
 * @returns the path of the record file.
 */
export function createGapNote(dir: string, record: unknown): string {
  const validated = validateGapNoteRecord(record);
  return createOnly(gapNotePath(dir, validated), gapNoteFileContent(validated), "gap-note record");
}

/**
 * Every gap-note record in the store, sorted by file name (date, then content
 * hash). Absence of the directory is not an error — it is created lazily by
 * the first append, exactly as every other operational directory.
 */
export function readGapNotes(dir: string): GapNoteRecord[] {
  const notesDir = gapNotesDir(dir);
  if (!existsSync(notesDir)) return [];
  return readdirSync(notesDir)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => {
      const filePath = join(notesDir, name);
      const raw = readFileSync(filePath, "utf8");
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch (error) {
        throw new IntentionSchemaError(
          `Malformed JSON in gap-note record ${filePath}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
      return validateGapNoteRecord(parsed);
    });
}
