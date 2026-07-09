import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  applyMirror,
  desiredFilename,
  managedDirFor,
  planMirror,
} from "../src/mirror.js";

function bytes(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

describe("desiredFilename", () => {
  it("zero-pads priority and drops the tactic- prefix", () => {
    expect(desiredFilename("tactic-reading-chunk-3-kant-humanity-servility", 4)).toBe(
      "04-reading-chunk-3-kant-humanity-servility.epub",
    );
  });
});

describe("mirror", () => {
  let reader: string;
  let managed: string;

  beforeEach(() => {
    reader = mkdtempSync(join(tmpdir(), "sync-reader-mirror-"));
    managed = managedDirFor(reader);
  });

  afterEach(() => {
    rmSync(reader, { recursive: true, force: true });
  });

  function sync(desired: Map<string, Uint8Array>): ReturnType<typeof planMirror> {
    const plan = planMirror(desired, managed);
    applyMirror(plan, managed);
    return plan;
  }

  it("creates the managed dir and writes desired excerpts on a fresh sync", () => {
    const plan = sync(new Map([["01-a.epub", bytes("A")], ["02-b.epub", bytes("B")]]));
    expect(plan.writes.map((w) => w.filename).sort()).toEqual(["01-a.epub", "02-b.epub"]);
    expect(existsSync(join(managed, "01-a.epub"))).toBe(true);
    expect(readFileSync(join(managed, "02-b.epub")).toString()).toBe("B");
  });

  it("re-running with identical bytes is all keeps, no writes", () => {
    const desired = new Map([["01-a.epub", bytes("A")]]);
    sync(desired);
    const plan = planMirror(desired, managed);
    expect(plan.writes).toEqual([]);
    expect(plan.keeps).toEqual(["01-a.epub"]);
  });

  it("rewrites a file whose bytes changed", () => {
    sync(new Map([["01-a.epub", bytes("A")]]));
    const plan = sync(new Map([["01-a.epub", bytes("A2")]]));
    expect(plan.writes.map((w) => w.filename)).toEqual(["01-a.epub"]);
    expect(readFileSync(join(managed, "01-a.epub")).toString()).toBe("A2");
  });

  it("deletes a retired chunk's excerpt", () => {
    sync(new Map([["01-a.epub", bytes("A")], ["02-b.epub", bytes("B")]]));
    const plan = sync(new Map([["01-a.epub", bytes("A")]]));
    expect(plan.deletes).toEqual(["02-b.epub"]);
    expect(existsSync(join(managed, "02-b.epub"))).toBe(false);
  });

  it("leaves a stray non-epub file in the managed dir untouched", () => {
    sync(new Map([["01-a.epub", bytes("A")]]));
    writeFileSync(join(managed, "notes.txt"), "keep me");
    const plan = sync(new Map([["01-a.epub", bytes("A")]]));
    expect(plan.deletes).toEqual([]);
    expect(existsSync(join(managed, "notes.txt"))).toBe(true);
  });

  it("never touches files outside the managed subdir", () => {
    const decoy = join(reader, "keep-me.epub");
    writeFileSync(decoy, "reader-root file");
    sync(new Map([["01-a.epub", bytes("A")]]));
    expect(readFileSync(decoy).toString()).toBe("reader-root file");
    expect(readdirSync(managed).sort()).toEqual(["01-a.epub"]);
  });

  it("refuses to apply against a wrongly-named directory", () => {
    const wrong = join(reader, "not-managed");
    expect(() => applyMirror({ writes: [], deletes: [], keeps: [] }, wrong)).toThrow(
      /commons-curriculum/,
    );
  });

  it("refuses a delete filename that escapes the managed dir", () => {
    expect(() =>
      applyMirror({ writes: [], deletes: ["../escape.epub"], keeps: [] }, managed),
    ).toThrow(/unsafe/);
  });
});
