import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { decryptData } from "@commons-systems/crypto-core";
import {
  CURRENT_FILENAME,
  formatTimestamp,
  writeSnapshot,
} from "./persist.js";

const tmpDirs: string[] = [];

function mkTmpDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "oh-snapshot-"));
  tmpDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tmpDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

async function decrypt(filePath: string, password: string): Promise<string> {
  const bytes = fs.readFileSync(filePath);
  const ab = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  );
  return decryptData(crypto.webcrypto.subtle, ab, password);
}

describe("formatTimestamp", () => {
  it("formats as YYYY-MM-DDTHH-MM-SS with dashes for colons", () => { // type-safety-ok: false positive — 'as YYYY-MM-DDTHH-MM-SS' appears in a test description string, not in code
    // Construct via local-time fields so the assertion is TZ-independent.
    const d = new Date(2026, 5, 30, 9, 4, 7); // 2026-06-30 09:04:07 local
    expect(formatTimestamp(d)).toBe("2026-06-30T09-04-07");
  });
});

describe("writeSnapshot", () => {
  const password = "correct horse battery staple";

  it("round-trips encrypt -> decrypt for current and history", async () => {
    const dir = mkTmpDir();
    const snapshot = { hello: "world", n: 42, nested: { a: [1, 2, 3] } };

    const { historyPath, currentPath } = await writeSnapshot({
      snapshotDir: dir,
      json: snapshot,
      password,
      now: new Date(2026, 5, 30, 9, 4, 7),
    });

    expect(JSON.parse(await decrypt(currentPath, password))).toEqual(snapshot);
    expect(JSON.parse(await decrypt(historyPath, password))).toEqual(snapshot);
  });

  it("accepts a pre-serialized JSON string", async () => {
    const dir = mkTmpDir();
    const json = JSON.stringify({ already: "stringified" });

    const { currentPath } = await writeSnapshot({
      snapshotDir: dir,
      json,
      password,
      now: new Date(2026, 5, 30, 9, 4, 7),
    });

    expect(await decrypt(currentPath, password)).toBe(json);
  });

  it("leaves no leftover temp files after a successful write", async () => {
    const dir = mkTmpDir();
    await writeSnapshot({
      snapshotDir: dir,
      json: { ok: true },
      password,
      now: new Date(2026, 5, 30, 9, 4, 7),
    });

    const entries = fs.readdirSync(dir);
    expect(entries.some((e) => e.endsWith(".tmp"))).toBe(false);
    expect(entries).toContain(CURRENT_FILENAME);
    expect(entries).toContain("office-hours-2026-06-30T09-04-07.benc");
    expect(entries).toHaveLength(2);
  });

  it("throws a clear single-line error when the snapshot dir is missing", async () => {
    const missing = path.join(os.tmpdir(), `oh-snapshot-does-not-exist-${Date.now()}`);
    await expect(
      writeSnapshot({ snapshotDir: missing, json: {}, password }),
    ).rejects.toThrow(/snapshot dir missing/);
  });

  it("throws when the snapshot dir path is a file, not a directory", async () => {
    const dir = mkTmpDir();
    const filePath = path.join(dir, "not-a-dir");
    fs.writeFileSync(filePath, "x");
    await expect(
      writeSnapshot({ snapshotDir: filePath, json: {}, password }),
    ).rejects.toThrow(/not a directory/);
  });

  it("keeps history immutable and current equal to the latest history (real file, not symlink)", async () => {
    const dir = mkTmpDir();

    const first = await writeSnapshot({
      snapshotDir: dir,
      json: { version: 1 },
      password,
      now: new Date(2026, 5, 30, 9, 4, 7),
    });
    const second = await writeSnapshot({
      snapshotDir: dir,
      json: { version: 2 },
      password,
      now: new Date(2026, 5, 30, 10, 15, 30),
    });

    // Two distinct history files exist.
    expect(first.historyPath).not.toBe(second.historyPath);
    expect(fs.existsSync(first.historyPath)).toBe(true);
    expect(fs.existsSync(second.historyPath)).toBe(true);

    // The first history file is unchanged by the second write.
    expect(JSON.parse(await decrypt(first.historyPath, password))).toEqual({
      version: 1,
    });

    // current bytes equal the LATEST history file's bytes.
    const currentBytes = fs.readFileSync(second.currentPath);
    const latestBytes = fs.readFileSync(second.historyPath);
    expect(Buffer.compare(currentBytes, latestBytes)).toBe(0);

    // current is a regular file, not a symlink.
    expect(fs.lstatSync(second.currentPath).isSymbolicLink()).toBe(false);
  });
});
