import type { SeedSpec } from "@commons-systems/firestoreutil/seed";

// Cloud Storage seeding is manual:
// 1. Download files from the sources listed in each item's sourceNotes
// 2. Upload to print/{env}/media/{filename} in Firebase Cloud Storage
// 3. Set custom metadata on each object:
//    - Public domain: publicDomain=true
//    - Private: publicDomain=false, {uid}=member (one key per member uid)
// Example: firebase storage:upload print/prod/media/notebooks-da-vinci.epub --metadata publicDomain=true

const appSeed: Omit<SeedSpec, "namespace"> = {
  collections: [
    {
      name: "media",
      documents: [
        {
          id: "gutenberg-3296",
          data: {
            title: "The Notebooks of Leonardo Da Vinci",
            mediaType: "epub",
            tags: { source: "Project Gutenberg", gutenbergId: "3296" },
            publicDomain: true,
            sourceNotes: "Project Gutenberg eBook #3296: https://www.gutenberg.org/ebooks/3296",
            storagePath: "media/notebooks-da-vinci.epub",
            groupId: null,
            memberUids: [],
            addedAt: "2026-01-15T00:00:00Z",
          },
        },
        {
          id: "plato-phaedrus",
          data: {
            title: "Phaedrus",
            mediaType: "pdf",
            tags: { author: "Plato", source: "Platonic Foundation" },
            publicDomain: true,
            sourceNotes: "Platonic Foundation: https://www.platonicfoundation.org/translation/phaedrus",
            storagePath: "media/phaedrus.pdf",
            groupId: null,
            memberUids: [],
            addedAt: "2026-01-16T00:00:00Z",
          },
        },
        {
          id: "plato-republic",
          data: {
            title: "Republic",
            mediaType: "pdf",
            tags: { author: "Plato", source: "Platonic Foundation" },
            publicDomain: true,
            sourceNotes: "Platonic Foundation: https://www.platonicfoundation.org/translation/republic/republic-all-books/",
            storagePath: "media/republic.pdf",
            groupId: null,
            memberUids: [],
            addedAt: "2026-01-17T00:00:00Z",
          },
        },
        {
          id: "private-collection-1",
          data: {
            title: "Private Collection Item",
            mediaType: "pdf",
            tags: { source: "rml-media/print" },
            publicDomain: false,
            sourceNotes: "Private GCS bucket rml-media/print — re-upload to Firebase Cloud Storage",
            storagePath: "media/private-collection-1.pdf",
            groupId: "natb1-library",
            memberUids: ["test-github-user"],
            addedAt: "2026-01-18T00:00:00Z",
          },
        },
      ],
    },
    {
      name: "groups",
      documents: [
        {
          id: "natb1-library",
          data: {
            name: "natb1-library",
            members: ["test-github-user"],
          },
        },
      ],
    },
  ],
};

export default appSeed;
