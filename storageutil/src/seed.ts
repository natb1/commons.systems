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

    const body = [
      `--${boundary}`,
      "Content-Type: application/json",
      "",
      metadata,
      `--${boundary}`,
      `Content-Type: ${file.contentType}`,
      "",
      "placeholder",
      `--${boundary}--`,
    ].join("\r\n");

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
