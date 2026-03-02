import type { StorageSeedSpec } from "@commons-systems/storageutil/seed";

const CONTENT_TYPE: Record<string, string> = {
  epub: "application/epub+zip",
  pdf: "application/pdf",
  cbz: "application/zip",
};

function file(
  mediaId: string,
  mediaType: string,
  publicDomain: boolean,
): { path: string; contentType: string; metadata?: Record<string, string> } {
  return {
    path: `print/${mediaId}.${mediaType}`,
    contentType: CONTENT_TYPE[mediaType],
    ...(publicDomain ? { metadata: { publicDomain: "true" } } : {}),
  };
}

const storageSeed: StorageSeedSpec = {
  files: [
    // Public domain (3)
    file("confessions-of-st-augustine", "epub", true),
    file("phaedrus", "pdf", true),
    file("republic", "pdf", true),
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
