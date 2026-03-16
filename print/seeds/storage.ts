import { deflateRawSync } from "node:zlib";

export interface StorageSeedItem {
  path: string;
  content: string | Buffer;
  metadata: Record<string, string>;
}

function makePdf(pageCount: number): string {
  let body = "%PDF-1.0\n";
  const offsets: number[] = [];

  offsets.push(body.length);
  body += "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n";

  const kids = Array.from({ length: pageCount }, (_, i) => `${i + 3} 0 R`).join(" ");
  offsets.push(body.length);
  body += `2 0 obj<</Type/Pages/Kids[${kids}]/Count ${pageCount}>>endobj\n`;

  for (let i = 0; i < pageCount; i++) {
    offsets.push(body.length);
    body += `${i + 3} 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\n`;
  }

  const xrefOffset = body.length;
  const objCount = 1 + offsets.length; // free entry + objects
  body += "xref\n";
  body += `0 ${objCount}\n`;
  body += "0000000000 65535 f \n";
  for (const offset of offsets) {
    body += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  body += `trailer<</Size ${objCount}/Root 1 0 R>>\n`;
  body += "startxref\n";
  body += `${xrefOffset}\n`;
  body += "%%EOF";

  return body;
}

// Builds a minimal valid EPUB (ZIP archive) with the given number of chapters.
function makeEpub(chapterCount: number): Buffer {
  const files: { name: string; data: Buffer; store?: boolean }[] = [];

  // mimetype must be first entry, stored uncompressed
  files.push({
    name: "mimetype",
    data: Buffer.from("application/epub+zip"),
    store: true,
  });

  // container.xml
  files.push({
    name: "META-INF/container.xml",
    data: Buffer.from(
      `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`),
  });

  // Build manifest and spine entries
  const manifestItems: string[] = [];
  const spineItems: string[] = [];
  for (let i = 1; i <= chapterCount; i++) {
    manifestItems.push(
      `    <item id="ch${i}" href="chapter${i}.xhtml" media-type="application/xhtml+xml"/>`,
    );
    spineItems.push(`    <itemref idref="ch${i}"/>`);
  }

  // content.opf
  files.push({
    name: "OEBPS/content.opf",
    data: Buffer.from(
      `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="uid">urn:uuid:00000000-0000-0000-0000-000000000001</dc:identifier>
    <dc:title>Test EPUB</dc:title>
    <dc:language>en</dc:language>
    <meta property="dcterms:modified">2026-01-01T00:00:00Z</meta>
  </metadata>
  <manifest>
${manifestItems.join("\n")}
  </manifest>
  <spine>
${spineItems.join("\n")}
  </spine>
</package>`),
  });

  // Chapter XHTML files
  for (let i = 1; i <= chapterCount; i++) {
    files.push({
      name: `OEBPS/chapter${i}.xhtml`,
      data: Buffer.from(
        `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>Chapter ${i}</title></head>
<body><h1>Chapter ${i}</h1><p>Content of chapter ${i}.</p></body>
</html>`),
    });
  }

  return buildZip(files);
}

// Minimal ZIP archive builder (PKZIP APPNOTE 6.3.3 compatible).
function buildZip(
  entries: { name: string; data: Buffer; store?: boolean }[],
): Buffer {
  const localHeaders: Buffer[] = [];
  const centralHeaders: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = Buffer.from(entry.name, "utf-8");
    const uncompressedSize = entry.data.length;
    const crc = crc32(entry.data);
    const useStore = entry.store === true;
    const compressedData = useStore ? entry.data : deflateRawSync(entry.data);
    const compressedSize = compressedData.length;
    const method = useStore ? 0 : 8;

    // Local file header (30 bytes + name + data)
    const local = Buffer.alloc(30 + nameBytes.length + compressedSize);
    local.writeUInt32LE(0x04034b50, 0); // signature
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0, 6); // flags
    local.writeUInt16LE(method, 8); // compression
    local.writeUInt16LE(0, 10); // mod time
    local.writeUInt16LE(0, 12); // mod date
    local.writeUInt32LE(crc, 14); // crc32
    local.writeUInt32LE(compressedSize, 18);
    local.writeUInt32LE(uncompressedSize, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    local.writeUInt16LE(0, 28); // extra field length
    nameBytes.copy(local, 30);
    compressedData.copy(local, 30 + nameBytes.length);
    localHeaders.push(local);

    // Central directory header (46 bytes + name)
    const central = Buffer.alloc(46 + nameBytes.length);
    central.writeUInt32LE(0x02014b50, 0); // signature
    central.writeUInt16LE(20, 4); // version made by
    central.writeUInt16LE(20, 6); // version needed
    central.writeUInt16LE(0, 8); // flags
    central.writeUInt16LE(method, 10); // compression
    central.writeUInt16LE(0, 12); // mod time
    central.writeUInt16LE(0, 14); // mod date
    central.writeUInt32LE(crc, 16); // crc32
    central.writeUInt32LE(compressedSize, 20);
    central.writeUInt32LE(uncompressedSize, 24);
    central.writeUInt16LE(nameBytes.length, 28);
    central.writeUInt16LE(0, 30); // extra field length
    central.writeUInt16LE(0, 32); // comment length
    central.writeUInt16LE(0, 34); // disk number
    central.writeUInt16LE(0, 36); // internal attrs
    central.writeUInt32LE(0, 38); // external attrs
    central.writeUInt32LE(offset, 42); // local header offset
    nameBytes.copy(central, 46);
    centralHeaders.push(central);

    offset += local.length;
  }

  const centralDirOffset = offset;
  const centralDirSize = centralHeaders.reduce((s, b) => s + b.length, 0);

  // End of central directory record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // signature
  eocd.writeUInt16LE(0, 4); // disk number
  eocd.writeUInt16LE(0, 6); // central dir disk
  eocd.writeUInt16LE(entries.length, 8); // entries on this disk
  eocd.writeUInt16LE(entries.length, 10); // total entries
  eocd.writeUInt32LE(centralDirSize, 12);
  eocd.writeUInt32LE(centralDirOffset, 16);
  eocd.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([...localHeaders, ...centralHeaders, eocd]);
}

// CRC-32 (ISO 3309 polynomial, same as used by ZIP).
function crc32(data: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const publicMeta = { publicDomain: "true" };
const testPrivateMeta = { publicDomain: "false", "test@example.com": "member" };

const storageSeed: StorageSeedItem[] = [
  {
    path: "print/prod/media/pg3296-images-3.epub",
    content: makeEpub(3),
    metadata: publicMeta,
  },
  {
    path: "print/prod/media/phaedrus-david-horan-translation-7-nov-25.pdf",
    content: makePdf(1),
    metadata: publicMeta,
  },
  {
    path: "print/prod/media/republic-i-to-x-david-horan-translation-22-nov-25.pdf",
    content: makePdf(3),
    metadata: publicMeta,
  },
  {
    path: "print/prod/media/test-private-item.pdf",
    content: makePdf(1),
    metadata: testPrivateMeta,
  },
];

export default storageSeed;
