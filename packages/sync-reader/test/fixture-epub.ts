// Build a small, valid in-memory EPUB with jszip so Units 2-3 tests need no
// committed binary fixture. Produces mimetype (stored, first), container.xml,
// an OPF (title/creators/manifest/spine), an EPUB3 nav doc, an EPUB2 NCX, one
// CSS + one image resource, and N XHTML spine documents.

import JSZip from "jszip";

export interface FixtureSection {
  id: string;
  label: string;
  file: string; // relative to OEBPS/, e.g. "ch1.xhtml"
  body?: string;
}

export interface FixtureSpec {
  title: string;
  creators: string[];
  identifier?: string;
  sections: FixtureSection[];
}

const OPF_DIR = "OEBPS";

function opf(spec: FixtureSpec): string {
  const id = spec.identifier ?? "urn:uuid:fixture-0001";
  const creators = spec.creators
    .map((c) => `    <dc:creator>${c}</dc:creator>`)
    .join("\n");
  const manifestItems = [
    `    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
    `    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>`,
    `    <item id="css" href="style.css" media-type="text/css"/>`,
    `    <item id="img" href="cover.png" media-type="image/png"/>`,
    ...spec.sections.map(
      (s) => `    <item id="${s.id}" href="${s.file}" media-type="application/xhtml+xml"/>`,
    ),
  ].join("\n");
  const spine = spec.sections.map((s) => `    <itemref idref="${s.id}"/>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${id}</dc:identifier>
    <dc:title>${spec.title}</dc:title>
${creators}
  </metadata>
  <manifest>
${manifestItems}
  </manifest>
  <spine toc="ncx">
${spine}
  </spine>
</package>`;
}

function navDoc(spec: FixtureSpec): string {
  const items = spec.sections
    .map((s) => `      <li><a href="${s.file}">${s.label}</a></li>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
  <head><title>Contents</title></head>
  <body>
    <nav epub:type="toc" id="toc">
      <h1>Contents</h1>
      <ol>
${items}
      </ol>
    </nav>
  </body>
</html>`;
}

function ncxDoc(spec: FixtureSpec): string {
  const points = spec.sections
    .map(
      (s, i) => `    <navPoint id="np-${s.id}" playOrder="${i + 1}">
      <navLabel><text>${s.label}</text></navLabel>
      <content src="${s.file}"/>
    </navPoint>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head/>
  <docTitle><text>${spec.title}</text></docTitle>
  <navMap>
${points}
  </navMap>
</ncx>`;
}

function sectionXhtml(s: FixtureSection): string {
  const body = s.body ?? `<p>${s.label} body text.</p>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <title>${s.label}</title>
    <link rel="stylesheet" type="text/css" href="style.css"/>
  </head>
  <body>
    <h2>${s.label}</h2>
    ${body}
    <img src="cover.png" alt="cover"/>
  </body>
</html>`;
}

// A 1x1 transparent PNG.
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

export async function buildFixtureEpub(spec: FixtureSpec): Promise<Uint8Array> {
  const zip = new JSZip();
  // mimetype MUST be first and stored (uncompressed) per the OCF spec.
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  zip.file(
    "META-INF/container.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="${OPF_DIR}/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
  );
  zip.file(`${OPF_DIR}/content.opf`, opf(spec));
  zip.file(`${OPF_DIR}/nav.xhtml`, navDoc(spec));
  zip.file(`${OPF_DIR}/toc.ncx`, ncxDoc(spec));
  zip.file(`${OPF_DIR}/style.css`, "body { font-family: serif; }");
  zip.file(`${OPF_DIR}/cover.png`, PNG_1PX);
  for (const s of spec.sections) {
    zip.file(`${OPF_DIR}/${s.file}`, sectionXhtml(s));
  }
  return zip.generateAsync({ type: "uint8array" });
}

/** "Plato, Republic"-like fixture: books VI-VIII as spine sections. */
export function republicFixtureSpec(): FixtureSpec {
  return {
    title: "The Republic",
    creators: ["Plato"],
    identifier: "urn:uuid:republic-0001",
    sections: [
      { id: "front", label: "Introduction", file: "front.xhtml" },
      { id: "b6", label: "Book VI", file: "book6.xhtml" },
      { id: "b7", label: "Book VII", file: "book7.xhtml" },
      { id: "b8", label: "Book VIII", file: "book8.xhtml" },
    ],
  };
}

/** "Kant, Groundwork"-like fixture with page-numbered sections (AA 4:*). */
export function kantFixtureSpec(): FixtureSpec {
  return {
    title: "Groundwork of the Metaphysics of Morals",
    creators: ["Immanuel Kant"],
    identifier: "urn:uuid:groundwork-0001",
    sections: [
      { id: "pref", label: "Preface 4:387", file: "preface.xhtml" },
      { id: "s1", label: "First Section 4:393", file: "s1.xhtml" },
      { id: "s2", label: "Second Section 4:406", file: "s2.xhtml" },
      { id: "s3", label: "Third Section 4:427", file: "s3.xhtml" },
    ],
  };
}
