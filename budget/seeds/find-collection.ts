import appSeed from "./firestore.js";

export function findCollection(name: string): { id: string; data: Record<string, unknown> }[] {
  const col = appSeed.collections.find((c) => c.name === name);
  if (!col) throw new Error(`Seed collection "${name}" not found`);
  return col.documents as { id: string; data: Record<string, unknown> }[];
}
