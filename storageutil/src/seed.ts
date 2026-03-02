import { placeholderContent } from "./placeholder.js";

export interface StorageSeedFile {
  path: string;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface StorageSeedSpec {
  files: StorageSeedFile[];
}

export async function seedStorage(
  emulatorHost: string,
  bucket: string,
  spec: StorageSeedSpec,
): Promise<void> {
  const baseUrl = `http://${emulatorHost}/upload/storage/v1/b/${bucket}/o?uploadType=multipart`;
  const boundary = "storage-seed-boundary";

  for (const file of spec.files) {
    const metadata = JSON.stringify({
      name: file.path,
      contentType: file.contentType,
      metadata: file.metadata ?? {},
    });

    const content = placeholderContent(file.contentType);
    const body = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Type: application/json\r\n\r\n${metadata}\r\n` +
          `--${boundary}\r\nContent-Type: ${file.contentType}\r\n\r\n`,
      ),
      content,
      Buffer.from(`\r\n--${boundary}--`),
    ]);

    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": `multipart/related; boundary=${boundary}`,
        Authorization: "Bearer owner",
      },
      body,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Failed to seed storage file "${file.path}": ${res.status} ${text}`,
      );
    }
  }
}
