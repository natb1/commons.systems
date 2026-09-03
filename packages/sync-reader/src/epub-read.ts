// Read an EPUB's structure with Node primitives.
//
// Ports the container.xml → OPF pattern from print/src/local-metadata.ts to a
// Node context: bytes come from `node:fs`, the zip is opened with `unzipit`
// (which cannot write — Unit 3 uses jszip for that), and the browser-only
// `DOMParser` is replaced by `@xmldom/xmldom`. Exposes the metadata, manifest,
// spine, and a flattened table of contents (EPUB3 nav doc, EPUB2 NCX fallback)
// that the citation mapper and excerpt builder consume.

import { readFileSync } from "node:fs";
import { posix } from "node:path";
import { DOMParser } from "@xmldom/xmldom";
import { unzip } from "unzipit";

const DC_NS = "http://purl.org/dc/elements/1.1/";

/** One manifest item, its href resolved to a zip-absolute path (no fragment). */
export interface ManifestItem {
  id: string;
  href: string;
  mediaType: string;
  properties: string;
}

/** One flattened TOC entry, resolved to a spine index (-1 when unresolvable). */
export interface TocEntry {
  label: string;
  href: string;
  fragment: string;
  spineIndex: number;
}

/** The bibliographic surface used for work→epub matching. */
export interface EpubMeta {
  title: string;
  creators: string[];
}

/** A parsed EPUB, read-only, with lazy entry access for excerpt building. */
export interface EpubSource extends EpubMeta {
  path: string;
  opfDir: string;
  manifest: Map<string, ManifestItem>;
  spineItems: ManifestItem[];
  toc: TocEntry[];
  entryNames: string[];
  readText(zipPath: string): Promise<string>;
  readBytes(zipPath: string): Promise<Uint8Array>;
}

function parseXml(xml: string): Document {
  // @xmldom/xmldom does not throw on malformed XML — a missing element simply
  // isn't found by the getters below (same tolerance as the browser DOMParser).
  return new DOMParser().parseFromString(xml, "text/xml") as unknown as Document; // type-safety-ok: @xmldom/xmldom's Document is structural; cast to the DOM Document the getElementsBy* helpers expect
}

/** Resolve an href against the OPF directory, splitting off any fragment. */
function resolveHref(
  opfDir: string,
  href: string,
): { path: string; fragment: string } {
  const hashIdx = href.indexOf("#");
  const fragment = hashIdx === -1 ? "" : href.slice(hashIdx + 1);
  const rawRel = hashIdx === -1 ? href : href.slice(0, hashIdx);
  let rel: string;
  try {
    rel = decodeURIComponent(rawRel);
  } catch {
    rel = rawRel;
  }
  const joined = opfDir === "" ? rel : posix.join(opfDir, rel);
  return { path: posix.normalize(joined), fragment };
}

function textOf(node: { textContent?: string | null } | undefined): string {
  return (node?.textContent ?? "").trim();
}

/** All dc:creator values (namespaced and unprefixed), trimmed and non-empty. */
function readCreators(opf: Document): string[] {
  const creators: string[] = [];
  const ns = opf.getElementsByTagNameNS(DC_NS, "creator");
  for (let i = 0; i < ns.length; i++) {
    const t = textOf(ns[i]);
    if (t.length > 0) creators.push(t);
  }
  if (creators.length === 0) {
    const plain = opf.getElementsByTagName("creator");
    for (let i = 0; i < plain.length; i++) {
      const t = textOf(plain[i]);
      if (t.length > 0) creators.push(t);
    }
  }
  return creators;
}

function readTitle(opf: Document): string {
  const ns = opf.getElementsByTagNameNS(DC_NS, "title")[0];
  const fromNs = textOf(ns);
  if (fromNs.length > 0) return fromNs;
  return textOf(opf.getElementsByTagName("title")[0]);
}

function readManifest(
  opf: Document,
  opfDir: string,
): Map<string, ManifestItem> {
  const manifest = new Map<string, ManifestItem>();
  const items = opf.getElementsByTagName("item");
  for (let i = 0; i < items.length; i++) {
    const el = items[i];
    const id = el.getAttribute("id");
    const href = el.getAttribute("href");
    if (!id || !href) continue;
    manifest.set(id, {
      id,
      href: resolveHref(opfDir, href).path,
      mediaType: el.getAttribute("media-type") ?? "",
      properties: el.getAttribute("properties") ?? "",
    });
  }
  return manifest;
}

function readSpine(
  opf: Document,
  manifest: Map<string, ManifestItem>,
): { spineItems: ManifestItem[]; tocNcxId: string | null } {
  const spineEl = opf.getElementsByTagName("spine")[0];
  const spineItems: ManifestItem[] = [];
  const tocNcxId = spineEl?.getAttribute("toc") ?? null;
  const itemrefs = opf.getElementsByTagName("itemref");
  for (let i = 0; i < itemrefs.length; i++) {
    const idref = itemrefs[i].getAttribute("idref");
    if (!idref) continue;
    const item = manifest.get(idref);
    if (item) spineItems.push(item);
  }
  return { spineItems, tocNcxId };
}

/** Map a resolved zip path to its spine index, else -1. */
function spineIndexOf(spineItems: ManifestItem[], path: string): number {
  return spineItems.findIndex((it) => it.href === path);
}

/** Parse the EPUB3 nav doc's toc <nav> into flattened entries. */
function parseNav(
  navXml: string,
  navDir: string,
  spineItems: ManifestItem[],
): TocEntry[] {
  const doc = parseXml(navXml);
  const navs = doc.getElementsByTagName("nav");
  let tocNav: Element | undefined;
  for (let i = 0; i < navs.length; i++) {
    const t = navs[i].getAttribute("epub:type") ?? navs[i].getAttribute("type") ?? "";
    if (t.split(/\s+/).includes("toc")) {
      tocNav = navs[i];
      break;
    }
  }
  const scope = tocNav ?? navs[0];
  if (!scope) return [];
  const entries: TocEntry[] = [];
  const anchors = scope.getElementsByTagName("a");
  for (let i = 0; i < anchors.length; i++) {
    const a = anchors[i];
    const href = a.getAttribute("href");
    const label = textOf(a);
    if (!href || label.length === 0) continue;
    const { path, fragment } = resolveHref(navDir, href);
    entries.push({ label, href: path, fragment, spineIndex: spineIndexOf(spineItems, path) });
  }
  return entries;
}

/** Parse an EPUB2 NCX navMap (recursively) into flattened entries. */
function parseNcx(
  ncxXml: string,
  ncxDir: string,
  spineItems: ManifestItem[],
): TocEntry[] {
  const doc = parseXml(ncxXml);
  const entries: TocEntry[] = [];
  const points = doc.getElementsByTagName("navPoint");
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const labelEl = p.getElementsByTagName("navLabel")[0];
    const textEl = labelEl?.getElementsByTagName("text")[0];
    const label = textOf(textEl);
    const content = p.getElementsByTagName("content")[0];
    const src = content?.getAttribute("src");
    if (!src || label.length === 0) continue;
    const { path, fragment } = resolveHref(ncxDir, src);
    entries.push({ label, href: path, fragment, spineIndex: spineIndexOf(spineItems, path) });
  }
  return entries;
}

/**
 * Open the EPUB at `path` and parse its structure. Reads container.xml → OPF,
 * then the manifest, spine, and TOC (EPUB3 nav preferred, EPUB2 NCX fallback).
 * Throws a clear error when the OCF structure is missing — a malformed share
 * epub is surfaced, never silently treated as empty.
 */
export async function openEpub(path: string): Promise<EpubSource> {
  const bytes = new Uint8Array(readFileSync(path));
  const { entries } = await unzip(bytes);

  const readText = (zipPath: string): Promise<string> => {
    const entry = entries[zipPath];
    if (!entry) throw new Error(`${path}: missing zip entry "${zipPath}"`);
    return entry.text();
  };
  const readBytes = async (zipPath: string): Promise<Uint8Array> => {
    const entry = entries[zipPath];
    if (!entry) throw new Error(`${path}: missing zip entry "${zipPath}"`);
    return new Uint8Array(await entry.arrayBuffer());
  };

  const containerEntry = entries["META-INF/container.xml"];
  if (!containerEntry) throw new Error(`${path}: not an EPUB (no META-INF/container.xml)`);
  const container = parseXml(await containerEntry.text());
  const opfPath = container.getElementsByTagName("rootfile")[0]?.getAttribute("full-path");
  if (!opfPath) throw new Error(`${path}: container.xml has no rootfile full-path`);

  const dir = posix.dirname(opfPath);
  const opfDir = dir === "." ? "" : dir;
  const opf = parseXml(await readText(opfPath));

  const manifest = readManifest(opf, opfDir);
  const { spineItems, tocNcxId } = readSpine(opf, manifest);

  let toc: TocEntry[] = [];
  const navItem = [...manifest.values()].find((it) =>
    it.properties.split(/\s+/).includes("nav"),
  );
  if (navItem) {
    const navDir = posix.dirname(navItem.href);
    toc = parseNav(await readText(navItem.href), navDir === "." ? "" : navDir, spineItems);
  } else if (tocNcxId) {
    const ncx = manifest.get(tocNcxId);
    if (ncx) {
      const ncxDir = posix.dirname(ncx.href);
      toc = parseNcx(await readText(ncx.href), ncxDir === "." ? "" : ncxDir, spineItems);
    }
  }

  return {
    path,
    title: readTitle(opf),
    creators: readCreators(opf),
    opfDir,
    manifest,
    spineItems,
    toc,
    entryNames: Object.keys(entries),
    readText,
    readBytes,
  };
}
