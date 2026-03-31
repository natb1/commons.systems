import storageSeed from "./storage.js";

const host = process.env.STORAGE_EMULATOR_HOST;
if (!host) {
  console.error("STORAGE_EMULATOR_HOST required");
  process.exit(1);
}

const bucket = process.env.STORAGE_BUCKET ?? "commons-systems.firebasestorage.app";

for (const item of storageSeed) {
  const boundary = "----SeedBoundary";
  const metadataJson = JSON.stringify({ name: item.path, metadata: item.metadata });

  const metadataPart =
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${metadataJson}\r\n`;

  const contentHeader =
    `--${boundary}\r\n` +
    `Content-Type: application/octet-stream\r\n\r\n`;

  const trailer = `\r\n--${boundary}--\r\n`;

  const body = Buffer.concat([
    Buffer.from(metadataPart),
    Buffer.from(contentHeader),
    item.content,
    Buffer.from(trailer),
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

console.log(`Seeded ${storageSeed.length} storage objects.`);
