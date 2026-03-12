import type { SeedSpec } from "@commons-systems/firestoreutil/seed";

// Production Cloud Storage seeding is manual (emulator seeding is automated via seeds/run-storage-seed.ts):
// 1. Download files from the sources listed in each item's sourceNotes
// 2. Upload to print/{env}/media/{filename} in Firebase Cloud Storage:
//      gsutil cp <file> gs://commons-systems.firebasestorage.app/print/prod/media/
// 3. Set custom metadata on each object:
//    - Public domain: gsutil setmeta -h "x-goog-meta-publicDomain:true" gs://.../<file>
//    - Private: gsutil setmeta -h "x-goog-meta-publicDomain:false" -h "x-goog-meta-{email}:member" gs://.../<file>
// Note: Firestore uses memberEmails array for access control; Storage uses per-email custom metadata keys.
// Both must be kept in sync when granting access to private items (see firestore.rules, storage.rules).
//
// Private media documents and groups are managed manually (not in this seed).
// The media collection is non-convergent so prod deploys won't delete private items.

const appSeed: Omit<SeedSpec, "namespace"> = {
  collections: [
    {
      name: "media",
      documents: [
        {
          id: "gutenberg-3296",
          data: {
            title: "The Confessions of St. Augustine",
            mediaType: "epub",
            tags: { source: "Project Gutenberg", gutenbergId: "3296" },
            publicDomain: true,
            sourceNotes: "Project Gutenberg eBook #3296: https://www.gutenberg.org/ebooks/3296",
            storagePath: "media/pg3296-images-3.epub",
            groupId: null,
            memberEmails: [],
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
            storagePath: "media/phaedrus-david-horan-translation-7-nov-25.pdf",
            groupId: null,
            memberEmails: [],
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
            storagePath: "media/republic-i-to-x-david-horan-translation-22-nov-25.pdf",
            groupId: null,
            memberEmails: [],
            addedAt: "2026-01-17T00:00:00Z",
          },
        },
        {
          id: "test-private-item",
          data: {
            title: "Test Private Item",
            mediaType: "pdf",
            tags: { source: "test" },
            publicDomain: false,
            sourceNotes: "Test-only private item for emulator testing",
            storagePath: "media/test-private-item.pdf",
            groupId: "test-group",
            memberEmails: ["test@example.com"],
            addedAt: "2026-01-18T00:00:00Z",
          },
        },
      ],
    },
    {
      name: "groups",
      testOnly: true,
      documents: [
        {
          id: "test-group",
          data: {
            name: "test-group",
            members: ["test@example.com"],
          },
        },
      ],
    },
  ],
};

export default appSeed;
