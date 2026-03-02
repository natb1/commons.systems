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
  opts: { publicDomain: true; content?: Uint8Array } | { memberUids: string[]; content?: Uint8Array },
): StorageSeedFile {
  const metadata: Record<string, string> = "publicDomain" in opts
    ? { publicDomain: "true" }
    : Object.fromEntries(opts.memberUids.map((uid) => [uid, "member"]));
  return {
    path: `print/${mediaId}.${mediaType}`,
    contentType: CONTENT_TYPE[mediaType],
    metadata,
    ...(opts.content ? { content: opts.content } : {}),
  };
}

const storageSeed: StorageSeedSpec = {
  files: [
    // Public domain — actual files from fixtures
    file("confessions-of-st-augustine", "epub", { publicDomain: true, content: fixture("confessions-of-st-augustine.epub") }),
    file("phaedrus", "pdf", { publicDomain: true, content: fixture("phaedrus.pdf") }),
    file("republic", "pdf", { publicDomain: true, content: fixture("republic.pdf") }),
    // Private items for natb1
    file("conan-chronicles-vol01", "cbz", { memberUids: ["test-github-user"] }),
    file("confessions-augustine", "epub", { memberUids: ["test-github-user"] }),
    file("crown-and-skull-digital", "pdf", { memberUids: ["test-github-user"] }),
    file("crown-and-skull-hero-sheet", "pdf", { memberUids: ["test-github-user"] }),
    file("crown-and-skull-vol2", "pdf", { memberUids: ["test-github-user"] }),
    file("name-of-the-rose", "epub", { memberUids: ["test-github-user"] }),
    file("hex-crown-skull-zine", "pdf", { memberUids: ["test-github-user"] }),
    file("plato-complete-works", "epub", { memberUids: ["test-github-user"] }),
    file("scattered-minds", "epub", { memberUids: ["test-github-user"] }),
    file("shadowdark-rpg", "pdf", { memberUids: ["test-github-user"] }),
    file("delian-tomb", "pdf", { memberUids: ["test-github-user"] }),
    file("unmasking-autism", "epub", { memberUids: ["test-github-user"] }),
    file("test-comic", "cbz", { memberUids: ["test-github-user"] }),
  ],
};

export default storageSeed;
