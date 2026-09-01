/**
 * Filesystem side of the operational layer: create-only append and read.
 *
 * The whole concurrency story is the file layout. One record is one file, so a
 * concurrent append is a disjoint file creation — git merges those in any
 * order without a conflict, which is what makes appends **commutative and
 * mergeable** (author directive, 2026-09-01). There is no shared hot file, no
 * merge driver, and no ordering dependency.
 *
 * There is deliberately **no update and no delete primitive**. A correction is
 * a new entry that supersedes; folding many entries into one is
 * `tactic-consolidation-operation`'s surface and is not built here.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { IntentionSchemaError } from "./errors.js";
import {
  claimPath,
  claimsDir,
  evidenceDir,
  evidencePath,
  operationalDir,
  recordFileContent,
  validateClaimRecord,
  validateEvidenceEntry,
  type ClaimRecord,
  type EvidenceEntry,
} from "./operational-records.js";

/**
 * Create `filePath` holding `content`, or accept an existing identical file.
 *
 * The write uses the `wx` flag, so creation is atomic against a concurrent
 * writer rather than last-writer-wins: whoever loses the race gets `EEXIST` and
 * falls through to the content comparison, which is exactly the idempotent case.
 *
 * Identical content is a no-op success — the same observed fact appended twice
 * is one fact. DIFFERENT content at the same path is refused: for a
 * content-addressed evidence path that means a hash collision, and for a claim
 * path it means a rewrite of a record that is created once and never edited.
 * Both are errors, and a clear error beats a silent fallback
 * (`.claude/rules/code-style.md`).
 *
 * @returns the path written or already holding this content.
 */
function createOnly(filePath: string, content: string, what: string): string {
  mkdirSync(dirname(filePath), { recursive: true });
  try {
    writeFileSync(filePath, content, { flag: "wx" });
    return filePath;
  } catch (error) {
    if (!isEEXIST(error)) throw error;
  }
  const existing = readFileSync(filePath, "utf8");
  if (existing === content) return filePath;
  throw new IntentionSchemaError(
    `Refusing to overwrite ${what} at ${filePath}: a file already exists there with ` +
      `different content. Operational records are created once and never edited — ` +
      `correct by appending a superseding record, never by rewriting this one.`,
  );
}

function isEEXIST(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "EEXIST";
}

/**
 * Append one evidence entry to `<dir>/operational/evidence/<strategy>/`.
 *
 * The entry is validated first, so the bytes on disk are the normalized,
 * canonical form and the path is derived from that same form. Appending an
 * identical entry twice therefore resolves to one path and is a no-op success.
 *
 * @returns the path of the entry file.
 */
export function appendEvidence(dir: string, entry: unknown): string {
  const validated = validateEvidenceEntry(entry);
  return createOnly(
    evidencePath(dir, validated),
    recordFileContent(validated),
    "evidence entry",
  );
}

/**
 * Mint one claim record at `<dir>/operational/claims/<claim-id>.json`.
 *
 * One file per claim — no shared hot file. Minting a claim id that already
 * exists with different content is refused; a claim is not a mutable lock row.
 *
 * @returns the path of the claim file.
 */
export function mintClaim(dir: string, claim: unknown): string {
  const validated = validateClaimRecord(claim);
  return createOnly(
    claimPath(dir, validated.claim_id),
    recordFileContent(validated),
    "claim record",
  );
}

function readRecordFile<T>(filePath: string, validate: (value: unknown) => T): T {
  const raw = readFileSync(filePath, "utf8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new IntentionSchemaError(
      `Malformed JSON in operational record ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  return validate(parsed);
}

/**
 * `*.json` files directly inside `dir`, sorted by name, or `[]` when `dir` does
 * not exist. Absence is not an error: the operational directories are created
 * lazily by the first append, so "no directory" and "no records" are the same
 * state.
 */
function recordFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => join(dir, name));
}

/** Every evidence entry recorded against `strategy`, sorted by file name (date, then hash). */
export function readEvidence(dir: string, strategy: string): EvidenceEntry[] {
  return recordFiles(evidenceDir(dir, strategy)).map((filePath) =>
    readRecordFile(filePath, (value) => validateEvidenceEntry(value)),
  );
}

/** The strategy ids that have at least one evidence directory, sorted. */
export function evidenceStrategies(dir: string): string[] {
  const root = join(operationalDir(dir), "evidence");
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

/** Every evidence entry in the store, grouped strategy by strategy in sorted order. */
export function listEvidence(dir: string): EvidenceEntry[] {
  return evidenceStrategies(dir).flatMap((strategy) => readEvidence(dir, strategy));
}

/** One claim record by id. Throws if the file is absent — a named claim that is not on disk is a caller bug. */
export function readClaim(dir: string, claimId: string): ClaimRecord {
  return readRecordFile(claimPath(dir, claimId), (value) => validateClaimRecord(value));
}

/** Every claim record in the store, sorted by claim id. */
export function listClaims(dir: string): ClaimRecord[] {
  return recordFiles(claimsDir(dir)).map((filePath) =>
    readRecordFile(filePath, (value) => validateClaimRecord(value)),
  );
}
