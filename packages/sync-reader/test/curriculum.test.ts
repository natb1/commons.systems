import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { writeNode } from "@commons-systems/intentionsutil";
import type { IntentionNodeInput } from "@commons-systems/intentionsutil/schema";
import { chunkWorks, readActiveChunks } from "../src/curriculum.js";

describe("readActiveChunks", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "sync-reader-cur-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  function write(node: Partial<IntentionNodeInput> & { id: string }): void {
    writeNode(dir, {
      kind: "tactic",
      statement: "test chunk",
      owner: "human",
      status: "codified",
      ...node,
    });
  }

  it("returns active chunks with normalized priority and passages", () => {
    write({
      id: "tactic-reading-chunk-1-plato-cave",
      attributes: {
        curriculum: {
          priority: 1,
          passages: [{ work: "Plato, Republic", range: "VII 514a-521b" }],
        },
      },
    });
    expect(readActiveChunks(dir)).toEqual([
      {
        id: "tactic-reading-chunk-1-plato-cave",
        priority: 1,
        passages: [{ work: "Plato, Republic", range: "VII 514a-521b" }],
      },
    ]);
  });

  it("excludes nodes without the chunk prefix", () => {
    write({
      id: "tactic-something-else",
      attributes: {
        curriculum: { priority: 1, passages: [{ work: "W", range: "R" }] },
      },
    });
    expect(readActiveChunks(dir)).toEqual([]);
  });

  it("excludes chunks without an attributes.curriculum", () => {
    write({ id: "tactic-reading-chunk-9-mill-justice" });
    expect(readActiveChunks(dir)).toEqual([]);
  });

  it("excludes chunks whose phase is done", () => {
    write({
      id: "tactic-reading-chunk-2-aristotle-hexis",
      phase: "done",
      attributes: {
        curriculum: { priority: 2, passages: [{ work: "W", range: "R" }] },
      },
    });
    expect(readActiveChunks(dir)).toEqual([]);
  });

  it("throws on a malformed curriculum priority", () => {
    write({
      id: "tactic-reading-chunk-3-kant-humanity-servility",
      attributes: {
        curriculum: { priority: "high", passages: [{ work: "W", range: "R" }] },
      },
    });
    expect(() => readActiveChunks(dir)).toThrow(/priority/);
  });

  it("treats an empty passages array as an incomplete chunk (no throw)", () => {
    write({
      id: "tactic-reading-chunk-4-sophrosyne-ordered-soul",
      attributes: { curriculum: { priority: 4, passages: [] } },
    });
    expect(readActiveChunks(dir)).toEqual([
      { id: "tactic-reading-chunk-4-sophrosyne-ordered-soul", priority: 4, passages: [] },
    ]);
  });

  it("treats absent passages as an incomplete chunk (no throw)", () => {
    write({
      id: "tactic-reading-chunk-24-phaedrus-writing",
      attributes: { curriculum: { priority: 16 } },
    });
    expect(readActiveChunks(dir)).toEqual([
      { id: "tactic-reading-chunk-24-phaedrus-writing", priority: 16, passages: [] },
    ]);
  });

  it("throws when passages is present but not an array", () => {
    write({
      id: "tactic-reading-chunk-6-precision-externals",
      attributes: { curriculum: { priority: 6, passages: "chs. 1-2" } },
    });
    expect(() => readActiveChunks(dir)).toThrow(/passages/);
  });

  it("throws when a present passage is missing work", () => {
    write({
      id: "tactic-reading-chunk-5-aristotle-phronesis",
      attributes: {
        curriculum: { priority: 5, passages: [{ range: "R" }] },
      },
    });
    expect(() => readActiveChunks(dir)).toThrow(/work/);
  });

  it("excludes candidate:true chunks (draft, not yet author-promoted)", () => {
    write({
      id: "tactic-reading-chunk-10-hirschman-exit-voice",
      attributes: {
        curriculum: {
          priority: 18,
          candidate: true,
          passages: [{ work: "Hirschman, Exit, Voice, and Loyalty", range: "chs. 1-3, 7" }],
        },
      },
    });
    expect(readActiveChunks(dir)).toEqual([]);
  });
});

describe("chunkWorks", () => {
  it("returns the single work for a single-work chunk", () => {
    expect(
      chunkWorks({
        id: "tactic-reading-chunk-1-plato-cave",
        priority: 1,
        passages: [
          { work: "Plato, Republic", range: "VII 514a-521b" },
          { work: "Plato, Republic", range: "VI 507b-509c" },
        ],
      }),
    ).toEqual(["Plato, Republic"]);
  });

  it("returns each distinct work in first-seen order for a multi-work chunk", () => {
    expect(
      chunkWorks({
        id: "tactic-reading-chunk-7-liberality-schole",
        priority: 7,
        passages: [
          { work: "Aristotle, Nicomachean Ethics", range: "IV.1" },
          { work: "Aristotle, Politics", range: "I.2" },
          { work: "Aristotle, Nicomachean Ethics", range: "X.7" },
        ],
      }),
    ).toEqual(["Aristotle, Nicomachean Ethics", "Aristotle, Politics"]);
  });
});
