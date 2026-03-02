import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import type { StorageSeedFile, StorageSeedSpec } from "@commons-systems/storageutil/seed";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) =>
  new Uint8Array(readFileSync(resolve(__dirname, "../fixtures", name)));

const CONTENT_TYPE: Record<string, string> = {
  epub: "application/epub+zip",
  pdf: "application/pdf",
  cbz: "application/zip",
};

function file(
  mediaId: string,
  mediaType: string,
  publicDomain: boolean,
  content?: Uint8Array,
): StorageSeedFile {
  return {
    path: `print/${mediaId}.${mediaType}`,
    contentType: CONTENT_TYPE[mediaType],
    ...(publicDomain ? { metadata: { publicDomain: "true" } } : {}),
    ...(content ? { content } : {}),
  };
}

const storageSeed: StorageSeedSpec = {
  files: [
    // Public domain (3) — actual files from fixtures
    file("confessions-of-st-augustine", "epub", true, fixture("confessions-of-st-augustine.epub")),
    file("phaedrus", "pdf", true, fixture("phaedrus.pdf")),
    file("republic", "pdf", true, fixture("republic.pdf")),
    // Private (13)
    file("conan-chronicles-vol01", "cbz", false),
    file("confessions-augustine", "epub", false),
    file("crown-and-skull-digital", "pdf", false),
    file("crown-and-skull-hero-sheet", "pdf", false),
    file("crown-and-skull-vol2", "pdf", false),
    file("name-of-the-rose", "epub", false),
    file("hex-crown-skull-zine", "pdf", false),
    file("plato-complete-works", "epub", false),
    file("scattered-minds", "epub", false),
    file("shadowdark-rpg", "pdf", false),
    file("delian-tomb", "pdf", false),
    file("unmasking-autism", "epub", false),
    file("test-comic", "cbz", false),
  ],
};

export default storageSeed;
