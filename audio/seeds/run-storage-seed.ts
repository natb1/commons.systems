import type { StorageSeedItem } from "./storage.js";
import storageSeed from "./storage.js";

const host = process.env.STORAGE_EMULATOR_HOST;
if (!host) {
  console.error("STORAGE_EMULATOR_HOST required");
  process.exit(1);
}

const bucket = process.env.STORAGE_BUCKET ?? "commons-systems.firebasestorage.app";
const includeTestOnly = process.env.SEED_TEST_ONLY === "true";
const boundary = "----SeedBoundary";

async function objectExists(path: string): Promise<boolean> {
  const encodedPath = encodeURIComponent(path);
  const url = `http://${host}/storage/v1/b/${bucket}/o/${encodedPath}`;
  const res = await fetch(url, { method: "GET" });
  return res.ok;
}

async function fetchSource(url: string, label: string): Promise<Buffer> {
  console.log(`  Fetching ${label} from ${url}`);
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${label}: ${res.status} ${res.statusText}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function uploadItem(path: string, content: Buffer, metadata: Record<string, string>): Promise<void> {
  const metadataJson = JSON.stringify({ name: path, metadata });

  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json\r\n\r\n${metadataJson}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Type: application/octet-stream\r\n\r\n`),
    content,
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
    throw new Error(`Failed to upload ${path}: ${res.status} ${text}`);
  }
}

async function seedItem(item: StorageSeedItem): Promise<string> {
  if (await objectExists(item.path)) {
    return `  Skipped ${item.path} (already exists)`;
  }

  let content: Buffer;
  if (includeTestOnly && item.content) {
    content = item.content;
  } else if (item.sourceUrl) {
    content = await fetchSource(item.sourceUrl, item.path);
  } else if (item.content) {
    content = item.content;
  } else {
    throw new Error(`Seed item ${item.path} has neither content nor sourceUrl`);
  }

  await uploadItem(item.path, content, item.metadata);
  return `  Uploaded ${item.path} (${(content.length / 1024).toFixed(0)} KB)`;
}

const items = storageSeed.filter((item) => includeTestOnly || !item.testOnly);
const results = await Promise.all(items.map(seedItem));
for (const msg of results) console.log(msg);
console.log(`Seeded ${items.length} storage objects.`);
