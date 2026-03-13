export interface StorageSeedItem {
  path: string;
  content: string;
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
];

export default storageSeed;
