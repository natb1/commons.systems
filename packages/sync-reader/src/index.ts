// Public surface of @commons-systems/sync-reader, consumed by the CLI at
// .claude/skills/sync-reader/scripts/sync-reader.ts.

export { loadConfig } from "./config.js";
export type { SyncReaderConfig } from "./config.js";
export { readActiveChunks } from "./curriculum.js";
export type { ActiveChunk, Passage } from "./curriculum.js";
