import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import JSZip from "jszip";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openEpub } from "../src/epub-read.js";
import { mapRangeToSections } from "../src/citation.js";
import { buildFixtureEpub, kantFixtureSpec, republicFixtureSpec } from "./fixture-epub.js";

describe("openEpub", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "sync-reader-epub-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  async function writeFixture(): Promise<string> {
    const bytes = await buildFixtureEpub(republicFixtureSpec());
    const path = join(dir, "republic.epub");
    writeFileSync(path, bytes);
    return path;
  }

  it("reads title and creators from the OPF", async () => {
    const src = await openEpub(await writeFixture());
    expect(src.title).toBe("The Republic");
    expect(src.creators).toEqual(["Plato"]);
  });

  it("reads the spine in order", async () => {
    const src = await openEpub(await writeFixture());
    expect(src.spineItems.map((s) => s.id)).toEqual(["front", "b6", "b7", "b8"]);
  });

  it("flattens the EPUB3 nav TOC with resolved spine indices", async () => {
    const src = await openEpub(await writeFixture());
    expect(src.toc.map((t) => [t.label, t.spineIndex])).toEqual([
      ["Introduction", 0],
      ["Book VI", 1],
      ["Book VII", 2],
      ["Book VIII", 3],
    ]);
  });

  it("resolves manifest resources against the OPF directory", async () => {
    const src = await openEpub(await writeFixture());
    expect(src.manifest.get("css")?.href).toBe("OEBPS/style.css");
    expect(src.manifest.get("img")?.mediaType).toBe("image/png");
  });

  it("maps a volume:page citation against a real parsed nav TOC", async () => {
    const bytes = await buildFixtureEpub(kantFixtureSpec());
    const path = join(dir, "kant.epub");
    writeFileSync(path, bytes);
    const src = await openEpub(path);
    expect(src.toc.map((t) => t.label)).toEqual([
      "Preface 4:387",
      "First Section 4:393",
      "Second Section 4:406",
      "Third Section 4:427",
    ]);
    // Akademie 4:429 falls in the Third Section (start page 4:427).
    expect(mapRangeToSections("4:429", src.toc, src.spineItems.length)).toEqual({
      kind: "sections",
      spineIndices: [3],
    });
  });

  it("throws on bytes that are not an EPUB", async () => {
    const path = join(dir, "not.epub");
    // A minimal empty zip so unzip() succeeds but container.xml is absent.
    writeFileSync(path, await new JSZip().generateAsync({ type: "uint8array" }));
    await expect(openEpub(path)).rejects.toThrow(/container\.xml/);
  });
});
