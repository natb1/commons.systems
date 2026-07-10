import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import JSZip from "jszip";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildExcerpt } from "../src/excerpt.js";
import { openEpub } from "../src/epub-read.js";
import { buildFixtureEpub, republicFixtureSpec } from "./fixture-epub.js";

describe("buildExcerpt", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "sync-reader-excerpt-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  async function openFixture(): ReturnType<typeof openEpub> {
    const bytes = await buildFixtureEpub(republicFixtureSpec());
    const path = join(dir, "republic.epub");
    writeFileSync(path, bytes);
    return openEpub(path);
  }

  it("produces a valid excerpt with mimetype first and stored", async () => {
    const source = await openFixture();
    const bytes = await buildExcerpt(source, [1, 2], { title: "Republic — Books VI-VII" });

    const zip = await JSZip.loadAsync(bytes);
    expect(Object.keys(zip.files)[0]).toBe("mimetype");
    // A stored (uncompressed) mimetype leaves its ASCII payload in the raw
    // bytes; a compressed one would not.
    expect(Buffer.from(bytes).toString("latin1")).toContain("application/epub+zip");
  });

  it("carries the given title and exactly the selected spine docs in order", async () => {
    const source = await openFixture();
    const bytes = await buildExcerpt(source, [1, 2], { title: "Republic — Books VI-VII" });

    const path = join(dir, "excerpt.epub");
    writeFileSync(path, bytes);
    const out = await openEpub(path);

    expect(out.title).toBe("Republic — Books VI-VII");
    expect(out.spineItems.map((s) => s.href)).toEqual([
      "OEBPS/book6.xhtml",
      "OEBPS/book7.xhtml",
    ]);
  });

  it("includes referenced CSS + image resources and omits unselected docs", async () => {
    const source = await openFixture();
    const bytes = await buildExcerpt(source, [1, 2], { title: "x" });

    const path = join(dir, "excerpt.epub");
    writeFileSync(path, bytes);
    const out = await openEpub(path);

    expect(out.entryNames).toContain("OEBPS/style.css");
    expect(out.entryNames).toContain("OEBPS/cover.png");
    expect(out.entryNames).not.toContain("OEBPS/front.xhtml");
    expect(out.entryNames).not.toContain("OEBPS/book8.xhtml");
  });

  it("produces byte-identical output for identical inputs", async () => {
    const source = await openFixture();
    const a = await buildExcerpt(source, [1, 2], { title: "x" });
    const b = await buildExcerpt(source, [1, 2], { title: "x" });
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(true);
  });

  it("fixes the date on every entry, including JSZip's auto-created directory entries", async () => {
    // JSZip synthesizes an implicit entry for every intermediate directory
    // (e.g. "OEBPS/") the first time a nested path is added, and that
    // synthesized entry defaults to the real wall clock unless corrected —
    // silently breaking the byte-identical-rebuild guarantee this fixes
    // (a `keep` becomes a spurious `write` on every run). A same-process
    // double-build (the test above) can pass by timing coincidence even when
    // this is broken, since both calls often land in the same whole-second
    // DOS-date bucket; asserting every entry's date directly is the
    // non-flaky check.
    const source = await openFixture();
    const bytes = await buildExcerpt(source, [1, 2], { title: "x" });
    const zip = await JSZip.loadAsync(bytes);
    const dirEntries = Object.values(zip.files).filter((f) => f.dir);
    expect(dirEntries.length).toBeGreaterThan(0);
    for (const entry of Object.values(zip.files)) {
      expect(entry.date.toISOString()).toBe("2020-01-01T00:00:00.000Z");
    }
  });
});
