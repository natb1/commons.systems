import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";

describe("loadConfig", () => {
  let dir: string;
  let prev: string | undefined;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "sync-reader-cfg-"));
    prev = process.env.SYNC_READER_CONFIG_DIR;
    process.env.SYNC_READER_CONFIG_DIR = dir;
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.SYNC_READER_CONFIG_DIR;
    else process.env.SYNC_READER_CONFIG_DIR = prev;
    rmSync(dir, { recursive: true, force: true });
  });

  function writeConfig(contents: string): void {
    writeFileSync(join(dir, "sync-reader.json"), contents);
  }

  it("returns no-config when the file is absent", () => {
    expect(loadConfig()).toEqual({ kind: "no-config" });
  });

  it("returns normalized config when present and valid", () => {
    writeConfig(JSON.stringify({ reader_dir: "/media/x", share_dir: "/mnt/share" }));
    expect(loadConfig()).toEqual({
      kind: "config",
      reader_dir: "/media/x",
      share_dir: "/mnt/share",
    });
  });

  it("throws naming reader_dir when it is missing", () => {
    writeConfig(JSON.stringify({ share_dir: "/mnt/share" }));
    expect(() => loadConfig()).toThrow(/reader_dir/);
  });

  it("throws naming share_dir when it is empty", () => {
    writeConfig(JSON.stringify({ reader_dir: "/media/x", share_dir: "" }));
    expect(() => loadConfig()).toThrow(/share_dir/);
  });

  it("throws when a non-object is stored", () => {
    writeConfig(JSON.stringify(["not", "an", "object"]));
    expect(() => loadConfig()).toThrow(/expected a JSON object/);
  });

  it("throws on invalid JSON", () => {
    writeConfig("{ not valid json");
    expect(() => loadConfig()).toThrow(/invalid JSON/);
  });
});
