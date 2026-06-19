/** Serializes IndexedDB stores back to the upload JSON format. Inverse of the upload pipeline (parseUploadedJson + toParsedData in upload.ts). */
import { getAll, getMeta } from "./idb.js";
import { collectionRegistry } from "./collection-registry.js";
import type { CollectionRawData, DataStoreName } from "./collection-registry.js";

export async function exportToJson(): Promise<string> {
  const storeNames = Object.keys(collectionRegistry) as DataStoreName[];

  // Fetch all stores in parallel alongside meta. Promise.all over an array
  // preserves input order regardless of resolution timing, so rawArrays[i]
  // corresponds to storeNames[i] — the registry-definition order.
  const [rawArrays, meta] = await Promise.all([
    Promise.all(storeNames.map((name) => getAll<unknown>(name))),
    getMeta(),
  ]);

  if (!meta) throw new Error("No local data to export. Upload a file first.");

  // Assemble synchronously in registry order so JSON key order is deterministic.
  const collections = {} as Record<DataStoreName, unknown[]>;
  storeNames.forEach((name, i) => {
    // toRawJson adaptors have heterogeneous signatures (several still return the
    // wide `object` type mid-migration), so the union-of-functions call cannot
    // be invoked directly. Localized cast, mirroring idb.ts storeParsedData.
    const toRawJson = collectionRegistry[name].toRawJson as (idb: unknown) => unknown;
    collections[name] = rawArrays[i].map(toRawJson);
  });

  // Envelope fields stay literal so the compile-time presence check on
  // {version, exportedAt, groupId, groupName} is preserved. Only the
  // registry-derived collections come from the spread.
  const output: CollectionRawData & {
    version: number;
    exportedAt: string;
    groupId: string;
    groupName: string;
  } = {
    version: meta.version,
    exportedAt: new Date().toISOString(),
    // groupId is not stored locally; empty string for format compatibility
    groupId: "",
    groupName: meta.groupName,
    ...(collections as CollectionRawData),
  };

  return JSON.stringify(output, null, 2) + "\n";
}
