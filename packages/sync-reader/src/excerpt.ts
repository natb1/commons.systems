// Build a minimal, valid excerpt EPUB from a selected span of a source epub.
//
// Produces a fresh OCF package containing only the selected spine documents and
// the resources they transitively require (stylesheets, images, and one level
// of CSS-referenced fonts/images), plus a freshly generated OPF, EPUB3 nav doc,
// and EPUB2 NCX. All zip entries carry a fixed date so identical inputs produce
// byte-identical output — that determinism is what makes the Unit 4 mirror's
// changed-file detection and idempotent re-runs work by simple byte comparison.

import { posix } from "node:path";
import { DOMParser } from "@xmldom/xmldom";
import JSZip from "jszip";
import type { EpubSource, ManifestItem } from "./epub-read.js";

/** Fixed timestamp for every zip entry — the determinism anchor. */
const FIXED_DATE = new Date(Date.UTC(2020, 0, 1, 0, 0, 0));

const OPF_DIR = "OEBPS";
const OPF_PATH = `${OPF_DIR}/content.opf`;
const NAV_PATH = `${OPF_DIR}/excerpt-nav.xhtml`;
const NCX_PATH = `${OPF_DIR}/excerpt-toc.ncx`;

export interface ExcerptOptions {
  title: string;
}

const MEDIA_BY_EXT: Record<string, string> = {
  ".xhtml": "application/xhtml+xml",
  ".html": "application/xhtml+xml",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function mediaTypeFor(source: EpubSource, path: string): string {
  for (const item of source.manifest.values()) {
    if (item.href === path) return item.mediaType;
  }
  return MEDIA_BY_EXT[posix.extname(path).toLowerCase()] ?? "application/octet-stream";
}

function isExternal(ref: string): boolean {
  return /^[a-z]+:/i.test(ref) || ref.startsWith("//") || ref.startsWith("#") || ref.length === 0;
}

/** Resolve a relative ref against a base zip path, stripping fragment/query. */
function resolveRef(basePath: string, ref: string): string | null {
  if (isExternal(ref)) return null;
  const clean = ref.split("#")[0].split("?")[0];
  if (clean.length === 0) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(clean);
  } catch {
    decoded = clean;
  }
  return posix.normalize(posix.join(posix.dirname(basePath), decoded));
}

function refsFromXhtml(xml: string, docPath: string): string[] {
  const doc = new DOMParser().parseFromString(xml, "text/xml") as unknown as Document; // type-safety-ok: @xmldom/xmldom's Document is structural; cast to the DOM Document the getElementsBy* helpers expect
  const out: string[] = [];
  const push = (ref: string | null): void => {
    if (ref !== null) out.push(ref);
  };
  const links = doc.getElementsByTagName("link");
  for (let i = 0; i < links.length; i++) push(resolveRef(docPath, links[i].getAttribute("href") ?? ""));
  const imgs = doc.getElementsByTagName("img");
  for (let i = 0; i < imgs.length; i++) push(resolveRef(docPath, imgs[i].getAttribute("src") ?? ""));
  const images = doc.getElementsByTagName("image");
  for (let i = 0; i < images.length; i++) {
    push(resolveRef(docPath, images[i].getAttribute("xlink:href") ?? images[i].getAttribute("href") ?? ""));
  }
  return out;
}

function refsFromCss(css: string, cssPath: string): string[] {
  const out: string[] = [];
  const re = /url\(\s*['"]?([^'")]+)['"]?\s*\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css)) !== null) {
    const ref = resolveRef(cssPath, m[1]);
    if (ref !== null) out.push(ref);
  }
  return out;
}

/** OPF-relative href for a zip-absolute path. */
function opfHref(path: string): string {
  return posix.relative(OPF_DIR, path);
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** A stable identifier for the excerpt, derived from the source + selection. */
function excerptIdentifier(source: EpubSource, spineIndices: number[]): string {
  const basis = `${source.title}|${source.creators.join(",")}|${spineIndices.join("-")}`;
  return `urn:sync-reader:${Buffer.from(basis).toString("base64url")}`;
}

interface SelectedSection {
  item: ManifestItem;
  label: string;
  href: string; // OPF-relative
}

/**
 * Build an excerpt EPUB containing the spine documents at `spineIndices` (in the
 * given order) and their transitively required resources. `opts.title` becomes
 * the excerpt's `dc:title`; creators are copied from the source.
 */
export async function buildExcerpt(
  source: EpubSource,
  spineIndices: number[],
  opts: ExcerptOptions,
): Promise<Uint8Array> {
  if (spineIndices.length === 0) {
    throw new Error("buildExcerpt: spineIndices must be non-empty");
  }

  const labelFor = (idx: number): string =>
    source.toc.find((t) => t.spineIndex === idx)?.label ?? `Section ${idx + 1}`;

  // Selected content documents, in the requested order.
  const sections: SelectedSection[] = [];
  const resourcePaths = new Set<string>();
  for (const idx of spineIndices) {
    const item = source.spineItems[idx];
    if (!item) throw new Error(`buildExcerpt: spine index ${idx} out of range`);
    sections.push({ item, label: labelFor(idx), href: opfHref(item.href) });

    const xml = await source.readText(item.href);
    for (const ref of refsFromXhtml(xml, item.href)) {
      if (source.entryNames.includes(ref)) resourcePaths.add(ref);
    }
  }

  // One level deep: resources referenced from the collected CSS files.
  for (const path of [...resourcePaths]) {
    if (posix.extname(path).toLowerCase() !== ".css") continue;
    const css = await source.readText(path);
    for (const ref of refsFromCss(css, path)) {
      if (source.entryNames.includes(ref)) resourcePaths.add(ref);
    }
  }

  const resources = [...resourcePaths].sort();

  // --- Assemble the OPF ---
  const creators = source.creators
    .map((c) => `    <dc:creator>${xmlEscape(c)}</dc:creator>`)
    .join("\n");
  const manifestLines: string[] = [
    `    <item id="nav" href="${opfHref(NAV_PATH)}" media-type="application/xhtml+xml" properties="nav"/>`,
    `    <item id="ncx" href="${opfHref(NCX_PATH)}" media-type="application/x-dtbncx+xml"/>`,
  ];
  sections.forEach((s, i) => {
    manifestLines.push(
      `    <item id="sec${i}" href="${xmlEscape(s.href)}" media-type="application/xhtml+xml"/>`,
    );
  });
  resources.forEach((path, i) => {
    manifestLines.push(
      `    <item id="res${i}" href="${xmlEscape(opfHref(path))}" media-type="${mediaTypeFor(source, path)}"/>`,
    );
  });
  const spineLines = sections.map((_, i) => `    <itemref idref="sec${i}"/>`);
  const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${excerptIdentifier(source, spineIndices)}</dc:identifier>
    <dc:title>${xmlEscape(opts.title)}</dc:title>
    <dc:language>en</dc:language>
${creators}
  </metadata>
  <manifest>
${manifestLines.join("\n")}
  </manifest>
  <spine toc="ncx">
${spineLines.join("\n")}
  </spine>
</package>`;

  // --- Nav doc + NCX ---
  const navItems = sections
    .map((s) => `      <li><a href="${xmlEscape(s.href)}">${xmlEscape(s.label)}</a></li>`)
    .join("\n");
  const navDoc = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
  <head><title>${xmlEscape(opts.title)}</title></head>
  <body>
    <nav epub:type="toc" id="toc">
      <h1>Contents</h1>
      <ol>
${navItems}
      </ol>
    </nav>
  </body>
</html>`;
  const ncxPoints = sections
    .map(
      (s, i) => `    <navPoint id="np${i}" playOrder="${i + 1}">
      <navLabel><text>${xmlEscape(s.label)}</text></navLabel>
      <content src="${xmlEscape(s.href)}"/>
    </navPoint>`,
    )
    .join("\n");
  const ncx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${excerptIdentifier(source, spineIndices)}"/>
  </head>
  <docTitle><text>${xmlEscape(opts.title)}</text></docTitle>
  <navMap>
${ncxPoints}
  </navMap>
</ncx>`;

  // --- Zip assembly (mimetype first + stored; every entry fixed-dated) ---
  const zip = new JSZip();
  zip.file("mimetype", "application/epub+zip", { compression: "STORE", date: FIXED_DATE });
  zip.file(
    "META-INF/container.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="${OPF_PATH}" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
    { date: FIXED_DATE },
  );
  zip.file(OPF_PATH, opf, { date: FIXED_DATE });
  zip.file(NAV_PATH, navDoc, { date: FIXED_DATE });
  zip.file(NCX_PATH, ncx, { date: FIXED_DATE });
  for (const s of sections) {
    zip.file(s.item.href, await source.readText(s.item.href), { date: FIXED_DATE });
  }
  for (const path of resources) {
    zip.file(path, await source.readBytes(path), { date: FIXED_DATE });
  }

  // JSZip auto-creates an implicit entry for every intermediate directory
  // (e.g. "OEBPS/Fonts/") the first time a nested path is added, and that
  // auto-created entry defaults to `new Date()` — real wall-clock time —
  // because `{ date: FIXED_DATE }` above only applies to the file entries
  // themselves, not the parent folders JSZip synthesizes on their behalf.
  // Left alone, that makes every rebuild with any subdirectory resource
  // byte-different, defeating the mirror's changed-file detection (a
  // formerly-`keep`ing file spuriously becomes a `write` on every run).
  // Force every directory entry back to the fixed date after all files are
  // added, once JSZip has finished synthesizing them.
  for (const entry of Object.values(zip.files)) {
    if (entry.dir) entry.date = FIXED_DATE;
  }

  return zip.generateAsync({ type: "uint8array" });
}
