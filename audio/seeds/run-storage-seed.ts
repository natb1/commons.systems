import type { StorageSeedItem } from "./storage.js";
import storageSeed from "./storage.js";

const host = process.env.STORAGE_EMULATOR_HOST;
if (!host) {
  console.error("STORAGE_EMULATOR_HOST required");
  process.exit(1);
}

const bucket = process.env.STORAGE_BUCKET;
if (!bucket) {
  console.error("STORAGE_BUCKET required");
  process.exit(1);
}
const boundary = "----SeedBoundary";

async function uploadItem(item: StorageSeedItem): Promise<void> {
  const metadataJson = JSON.stringify({ name: item.path, metadata: item.metadata });

  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json\r\n\r\n${metadataJson}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Type: application/octet-stream\r\n\r\n`),
    item.content,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  const url = `http://${host}/upload/storage/v1/b/${bucket}/o?uploadType=multipart`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to upload ${item.path}: ${res.status} ${text}`);
  }
}

await Promise.all(storageSeed.map(uploadItem));

console.log(`Seeded ${storageSeed.length} storage objects.`);
