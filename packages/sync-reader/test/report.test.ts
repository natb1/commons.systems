import { describe, expect, it } from "vitest";
import { renderReport, type ChunkOutcome } from "../src/report.js";

describe("renderReport", () => {
  const outcomes: ChunkOutcome[] = [
    { kind: "synced", chunkId: "tactic-reading-chunk-1-plato-cave", work: "Plato, Republic", filename: "01-reading-chunk-1-plato-cave.epub", wrote: true },
    { kind: "missing", chunkId: "tactic-reading-chunk-9-mill-justice", work: "Mill, Utilitarianism" },
    { kind: "ambiguous", chunkId: "tactic-reading-chunk-2-aristotle-hexis", work: "Aristotle, Ethics", candidates: ["ne-ross.epub", "ne-irwin.epub"] },
    { kind: "unmapped", chunkId: "tactic-reading-chunk-3-kant-humanity-servility", work: "Kant, Groundwork", range: "chs. 1-3, 7", reason: 'range "chs. 1-3, 7": no recognizable book/chapter/page designator' },
    { kind: "incomplete", chunkId: "tactic-reading-chunk-24-phaedrus-writing" },
    { kind: "multi-work", chunkId: "tactic-reading-chunk-7-liberality-schole", works: ["Aristotle, Nicomachean Ethics", "Aristotle, Politics"] },
  ];

  it("renders every group with its author action", () => {
    const text = renderReport({ outcomes, deleted: ["04-reading-chunk-old.epub"] });
    expect(text).toContain("SYNCED");
    expect(text).toContain("01-reading-chunk-1-plato-cave.epub");
    expect(text).toContain("MISSING WORK");
    expect(text).toContain("Mill, Utilitarianism");
    expect(text).toContain("AMBIGUOUS");
    expect(text).toContain("ne-ross.epub | ne-irwin.epub");
    expect(text).toContain("UNMAPPED RANGE");
    expect(text).toContain("chs. 1-3, 7");
    expect(text).toContain("DELETED (retired)");
    expect(text).toContain("04-reading-chunk-old.epub");
    expect(text).toContain("NO PASSAGES");
    expect(text).toContain("tactic-reading-chunk-24-phaedrus-writing");
    expect(text).toContain("MULTI-WORK");
    expect(text).toContain(
      "tactic-reading-chunk-7-liberality-schole: Aristotle, Nicomachean Ethics | Aristotle, Politics",
    );
  });

  it("reports an all-clear when every chunk synced", () => {
    const text = renderReport({
      outcomes: [outcomes[0]],
      deleted: [],
    });
    expect(text).toContain("All active chunks synced.");
    expect(text).not.toContain("MISSING WORK");
  });

  it("does not report all-clear when a multi-work chunk is unsynced", () => {
    const text = renderReport({
      outcomes: [
        outcomes[0],
        { kind: "multi-work", chunkId: "tactic-reading-chunk-7-liberality-schole", works: ["A", "B"] },
      ],
      deleted: [],
    });
    expect(text).not.toContain("All active chunks synced.");
    expect(text).toContain("MULTI-WORK");
  });
});
