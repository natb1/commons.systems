// Public surface of @commons-systems/sync-reader, consumed by the CLI at
// .claude/skills/sync-reader/scripts/sync-reader.ts.

export { loadConfig } from "./config.js";
export type { SyncReaderConfig } from "./config.js";
export { readActiveChunks, chunkWorks } from "./curriculum.js";
export type { ActiveChunk, Passage } from "./curriculum.js";
export { openEpub } from "./epub-read.js";
export type { EpubSource, EpubMeta, ManifestItem, TocEntry } from "./epub-read.js";
export { matchWork, tokenize } from "./matching.js";
export type { MatchResult } from "./matching.js";
export { mapRangeToSections } from "./citation.js";
export type { MapResult } from "./citation.js";
export { buildExcerpt } from "./excerpt.js";
export type { ExcerptOptions } from "./excerpt.js";
export {
  MANAGED_SUBDIR,
  managedDirFor,
  desiredFilename,
  planMirror,
  applyMirror,
} from "./mirror.js";
export type { MirrorPlan } from "./mirror.js";
export { renderReport } from "./report.js";
export type { ChunkOutcome, ReportInput } from "./report.js";
