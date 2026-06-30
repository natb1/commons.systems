/** Serializes IndexedDB stores back to the upload JSON format. Inverse of the upload pipeline (parseUploadedJson + toParsedData in upload.ts). */
import { getAll, getMeta } from "./idb.js";
import { collectionRegistry } from "./collection-registry.js";
import type { CollectionRawData, IdbOf, RawOf, DataStoreName } from "./collection-registry.js";

async function rawCollection<K extends DataStoreName>(name: K): Promise<RawOf<K>[]> {
  const records = await getAll<IdbOf<K>>(name);
  const toRawJson = collectionRegistry[name].toRawJson as unknown as (idb: IdbOf<K>) => RawOf<K>;
  return records.map(toRawJson);
}

export async function exportToJson(): Promise<string> {
  const meta = await getMeta();
  if (!meta) throw new Error("No local data to export. Upload a file first.");

  const names = Object.keys(collectionRegistry) as DataStoreName[];
  const pairs = await Promise.all(
    names.map(async (name) => [name, await rawCollection(name)] as const),
  );
  const collections = Object.fromEntries(pairs) as CollectionRawData;

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
    ...collections,
  };

  return JSON.stringify(output, null, 2) + "\n";
}
