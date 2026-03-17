import { zipSync, zlibSync } from "fflate";

export interface StorageSeedItem {
  path: string;
  content: string | Uint8Array;
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

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      crc = crc & 1 ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u32be(n: number): Uint8Array {
  return new Uint8Array([(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]);
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const enc = new TextEncoder();
  const typeBytes = enc.encode(type);
  const crcInput = new Uint8Array(typeBytes.length + data.length);
  crcInput.set(typeBytes);
  crcInput.set(data, typeBytes.length);
  const result = new Uint8Array(4 + 4 + data.length + 4);
  result.set(u32be(data.length));
  result.set(typeBytes, 4);
  result.set(data, 8);
  result.set(u32be(crc32(crcInput)), 8 + data.length);
  return result;
}

function makePng1x1(): Uint8Array {
  const sig = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = new Uint8Array([0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0]);
  const ihdr = pngChunk("IHDR", ihdrData);
  // Scanline: filter byte (0) + 3 RGB bytes
  const idat = pngChunk("IDAT", zlibSync(new Uint8Array([0, 255, 255, 255])));
  const iend = pngChunk("IEND", new Uint8Array(0));
  const result = new Uint8Array(sig.length + ihdr.length + idat.length + iend.length);
  let offset = 0;
  for (const chunk of [sig, ihdr, idat, iend]) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

function makeZip(): Uint8Array {
  const png = makePng1x1();
  return zipSync({ "image-001.png": png, "image-002.png": png });
}

const publicMeta = { publicDomain: "true" };
const testPrivateMeta = { publicDomain: "false", "test@example.com": "member" };

const storageSeed: StorageSeedItem[] = [
  {
    path: "print/prod/media/pg3296-images-3.epub",
    content: "dummy epub content for testing",
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
  {
    path: "print/prod/media/test-image-archive.cbz",
    content: makeZip(),
    metadata: publicMeta,
  },
];

export default storageSeed;
