import type { SeedSpec } from "@commons-systems/firestoreutil/seed";
import type { MediaItem } from "../src/types.js";

type MediaSeedData = Omit<MediaItem, "id">;

// Production media upload is handled by print/scripts/upload-media.sh.
// Emulator seeding is automated via seeds/run-storage-seed.ts.
//
// Usage: print/scripts/upload-media.sh <file> <title> <mediaType> [--public | <email> ...]
// See the script for details on GCS metadata and Firestore document creation.
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
            testOnly: false,
            addedAt: "2026-01-15T00:00:00Z",
          } satisfies MediaSeedData,
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
            testOnly: false,
            addedAt: "2026-01-16T00:00:00Z",
          } satisfies MediaSeedData,
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
            testOnly: false,
            addedAt: "2026-01-17T00:00:00Z",
          } satisfies MediaSeedData,
        },
      ],
    },
    {
      name: "media",
      testOnly: true,
      documents: [
        {
          id: "test-image-archive",
          data: {
            title: "Little Nemo in Slumberland (pages 1-5)",
            mediaType: "image-archive",
            tags: { source: "Internet Archive", creator: "Winsor McCay" },
            publicDomain: true,
            sourceNotes: "Public domain comic strip by Winsor McCay (1905-1914), sourced from Internet Archive",
            storagePath: "media/test-image-archive.cbz",
            groupId: null,
            memberEmails: [],
            testOnly: true,
            addedAt: "2026-01-19T00:00:00Z",
          } satisfies MediaSeedData,
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
            testOnly: true,
            addedAt: "2026-01-18T00:00:00Z",
          } satisfies MediaSeedData,
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
