/** CRC-32 (ISO 3309) — used by both ZIP and PNG. */
function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// ---------------------------------------------------------------------------
// PDF
// ---------------------------------------------------------------------------

export function minimalPdf(): Uint8Array {
  const header = "%PDF-1.0\n";
  const obj1 = "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n";
  const obj2 = "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n";
  const obj3 =
    "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\n";

  const off1 = header.length;
  const off2 = off1 + obj1.length;
  const off3 = off2 + obj2.length;
  const xrefOff = off3 + obj3.length;

  const pad = (n: number) => String(n).padStart(10, "0");
  const xref = [
    "xref",
    "0 4",
    `0000000000 65535 f \r`,
    `${pad(off1)} 00000 n \r`,
    `${pad(off2)} 00000 n \r`,
    `${pad(off3)} 00000 n \r`,
    "trailer<</Size 4/Root 1 0 R>>",
    "startxref",
    String(xrefOff),
    "%%EOF\n",
  ].join("\n");

  return Buffer.from(header + obj1 + obj2 + obj3 + xref);
}

// ---------------------------------------------------------------------------
// ZIP (stored / no compression)
// ---------------------------------------------------------------------------

export function minimalZip(
  entries: { name: string; data: Uint8Array }[],
): Uint8Array {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = Buffer.from(entry.name);
    const crc = crc32(entry.data);
    const len = entry.data.length;

    // Local file header
    const local = Buffer.alloc(30 + nameBytes.length + len);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0, 6); // flags
    local.writeUInt16LE(0, 8); // compression: stored
    local.writeUInt16LE(0, 10); // mod time
    local.writeUInt16LE(0, 12); // mod date
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(len, 18); // compressed size
    local.writeUInt32LE(len, 22); // uncompressed size
    local.writeUInt16LE(nameBytes.length, 26);
    local.writeUInt16LE(0, 28); // extra field length
    nameBytes.copy(local, 30);
    Buffer.from(entry.data).copy(local, 30 + nameBytes.length);
    locals.push(local);

    // Central directory header
    const central = Buffer.alloc(46 + nameBytes.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4); // version made by
    central.writeUInt16LE(20, 6); // version needed
    central.writeUInt16LE(0, 8); // flags
    central.writeUInt16LE(0, 10); // compression: stored
    central.writeUInt16LE(0, 12); // mod time
    central.writeUInt16LE(0, 14); // mod date
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(len, 20); // compressed size
    central.writeUInt32LE(len, 24); // uncompressed size
    central.writeUInt16LE(nameBytes.length, 28);
    central.writeUInt16LE(0, 30); // extra field length
    central.writeUInt16LE(0, 32); // comment length
    central.writeUInt16LE(0, 34); // disk number start
    central.writeUInt16LE(0, 36); // internal attributes
    central.writeUInt32LE(0, 38); // external attributes
    central.writeUInt32LE(offset, 42); // local header offset
    nameBytes.copy(central, 46);
    centrals.push(central);

    offset += local.length;
  }

  const centralDirSize = centrals.reduce((s, c) => s + c.length, 0);

  // End of central directory
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4); // disk number
  eocd.writeUInt16LE(0, 6); // disk with central dir
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralDirSize, 12);
  eocd.writeUInt32LE(offset, 16); // central dir offset
  eocd.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([...locals, ...centrals, eocd]);
}

// ---------------------------------------------------------------------------
// PNG (1×1 white pixel)
// ---------------------------------------------------------------------------

function pngChunk(type: string, data: Buffer): Buffer {
  const buf = Buffer.alloc(12 + data.length);
  buf.writeUInt32BE(data.length, 0);
  buf.write(type, 4, 4, "ascii");
  data.copy(buf, 8);
  const crcInput = Buffer.alloc(4 + data.length);
  crcInput.write(type, 0, 4, "ascii");
  data.copy(crcInput, 4);
  buf.writeUInt32BE(crc32(crcInput), 8 + data.length);
  return buf;
}

function zlibStored(data: Buffer): Buffer {
  // CMF=0x08 (deflate, window=256), FLG=0x1D (FCHECK so header % 31 == 0)
  const len = data.length;
  const nlen = (~len) & 0xffff;

  const block = Buffer.alloc(5 + len);
  block[0] = 0x01; // BFINAL=1, BTYPE=00 (stored)
  block.writeUInt16LE(len, 1);
  block.writeUInt16LE(nlen, 3);
  data.copy(block, 5);

  // Adler-32
  let a = 1,
    b = 0;
  for (const byte of data) {
    a = (a + byte) % 65521;
    b = (b + a) % 65521;
  }
  const adler = ((b << 16) | a) >>> 0;

  const result = Buffer.alloc(2 + block.length + 4);
  result[0] = 0x08;
  result[1] = 0x1d;
  block.copy(result, 2);
  result.writeUInt32BE(adler, 2 + block.length);
  return result;
}

function minimalPng(): Uint8Array {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR: 1×1, 8-bit RGB
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0); // width
  ihdr.writeUInt32BE(1, 4); // height
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB

  // IDAT: filter=None(0) + white pixel (255,255,255)
  const pixelData = Buffer.from([0, 255, 255, 255]);

  return Buffer.concat([
    signature,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlibStored(pixelData)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// EPUB
// ---------------------------------------------------------------------------

export function minimalEpub(): Uint8Array {
  const mimetype = Buffer.from("application/epub+zip");

  const container = Buffer.from(
    '<?xml version="1.0"?>' +
      '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">' +
      "<rootfiles>" +
      '<rootfile full-path="content.opf" media-type="application/oebps-package+xml"/>' +
      "</rootfiles>" +
      "</container>",
  );

  const opf = Buffer.from(
    '<?xml version="1.0"?>' +
      '<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">' +
      '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">' +
      '<dc:identifier id="uid">placeholder</dc:identifier>' +
      "<dc:title>Placeholder</dc:title>" +
      "<dc:language>en</dc:language>" +
      '<meta property="dcterms:modified">2025-01-01T00:00:00Z</meta>' +
      "</metadata>" +
      "<manifest>" +
      '<item id="ch1" href="chapter.xhtml" media-type="application/xhtml+xml"/>' +
      "</manifest>" +
      "<spine>" +
      '<itemref idref="ch1"/>' +
      "</spine>" +
      "</package>",
  );

  const chapter = Buffer.from(
    '<?xml version="1.0" encoding="UTF-8"?>' +
      "<!DOCTYPE html>" +
      '<html xmlns="http://www.w3.org/1999/xhtml">' +
      "<head><title>Placeholder</title></head>" +
      "<body><p>Placeholder content.</p></body>" +
      "</html>",
  );

  return minimalZip([
    { name: "mimetype", data: mimetype },
    { name: "META-INF/container.xml", data: container },
    { name: "content.opf", data: opf },
    { name: "chapter.xhtml", data: chapter },
  ]);
}

// ---------------------------------------------------------------------------
// CBZ
// ---------------------------------------------------------------------------

export function minimalCbz(): Uint8Array {
  return minimalZip([{ name: "page001.png", data: minimalPng() }]);
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

export function placeholderContent(contentType: string): Uint8Array {
  switch (contentType) {
    case "application/pdf":
      return minimalPdf();
    case "application/epub+zip":
      return minimalEpub();
    case "application/zip":
      return minimalCbz();
    default:
      throw new Error(`No placeholder generator for content type: ${contentType}`);
  }
}
