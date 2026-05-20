export interface StorageSeedItem {
  path: string;
  metadata: Record<string, string>;
  content?: Buffer | string;
  sourceUrl?: string;
  testOnly?: boolean;
}

export interface SeedStorageOptions {
  items: StorageSeedItem[];
  bucket: string;
  emulatorHost: string;
  includeTestOnly?: boolean;
}

const BOUNDARY = "----SeedBoundary";

async function objectExists(emulatorHost: string, bucket: string, path: string): Promise<boolean> {
  const url = `http://${emulatorHost}/storage/v1/b/${bucket}/o/${encodeURIComponent(path)}`;
  const res = await fetch(url, { method: "GET" });
  if (res.status === 200) return true;
  if (res.status === 404) return false;
  throw new Error(`Unexpected status ${res.status} checking existence of ${path}`);
}

async function fetchSourceUrl(url: string, path: string): Promise<Buffer> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`Failed to fetch sourceUrl for ${path}: ${res.status} ${res.statusText}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function uploadItem(
  emulatorHost: string,
  bucket: string,
  item: StorageSeedItem,
  bodyBytes: Buffer,
): Promise<void> {
  const metadataJson = JSON.stringify({ name: item.path, metadata: item.metadata });
  const contentType = item.metadata.contentType ?? "application/octet-stream";

  const body = Buffer.concat([
    Buffer.from(`--${BOUNDARY}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadataJson}\r\n`),
    Buffer.from(`--${BOUNDARY}\r\nContent-Type: ${contentType}\r\n\r\n`),
    bodyBytes,
    Buffer.from(`\r\n--${BOUNDARY}--\r\n`),
  ]);

  const url = `http://${emulatorHost}/upload/storage/v1/b/${bucket}/o?uploadType=multipart&name=${encodeURIComponent(item.path)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": `multipart/related; boundary=${BOUNDARY}` },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to upload ${item.path}: ${res.status} ${text}`);
  }
}

// Emulator-only: writes via the Firebase Storage emulator's unauthenticated
// REST surface. Not safe against a production bucket.
export async function seedStorage(opts: SeedStorageOptions): Promise<{ uploaded: number; skipped: number }> {
  if (!opts.bucket) {
    throw new Error("seedStorage: bucket is required");
  }
  if (!opts.emulatorHost) {
    throw new Error("seedStorage: emulatorHost is required");
  }
  if (!opts.items || opts.items.length === 0) {
    throw new Error("seedStorage: items must be a non-empty array");
  }

  const includeTestOnly = opts.includeTestOnly === true;
  const filtered = opts.items.filter((item) => includeTestOnly || !item.testOnly);

  let uploaded = 0;
  let skipped = 0;

  await Promise.all(
    filtered.map(async (item) => {
      if (item.content === undefined && !item.sourceUrl) {
        throw new Error(`Seed item ${item.path} has neither content nor sourceUrl`);
      }

      const exists = await objectExists(opts.emulatorHost, opts.bucket, item.path);
      if (exists) {
        skipped++;
        return;
      }

      // In test mode prefer the stub content; in prod prefer the real sourceUrl.
      // Fall back to whichever exists (the guard above ensures at least one does).
      const useContent = includeTestOnly ? item.content !== undefined : !item.sourceUrl;
      const bodyBytes = useContent
        ? Buffer.from(item.content!)
        : await fetchSourceUrl(item.sourceUrl!, item.path);

      await uploadItem(opts.emulatorHost, opts.bucket, item, bodyBytes);
      uploaded++;
    }),
  );

  return { uploaded, skipped };
}
