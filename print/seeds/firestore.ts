import type { SeedSpec } from "@commons-systems/firestoreutil/seed";

const appSeed: Omit<SeedSpec, "namespace"> = {
  collections: [
    {
      name: "media",
      documents: [
        // Public domain items (3)
        {
          id: "confessions-of-st-augustine",
          data: {
            title: "Confessions of St. Augustine",
            mediaType: "epub",
            tags: { genre: "philosophy", author: "Augustine of Hippo", source: "Project Gutenberg #3296" },
            publicDomain: true,
            sizeBytes: 567_000,
            currentLocation: {},
          },
        },
        {
          id: "phaedrus",
          data: {
            title: "Phaedrus",
            mediaType: "pdf",
            tags: { genre: "philosophy", author: "Plato", source: "Platonic Foundation" },
            publicDomain: true,
            sizeBytes: 890_000,
            currentLocation: {},
          },
        },
        {
          id: "republic",
          data: {
            title: "Republic",
            mediaType: "pdf",
            tags: { genre: "philosophy", author: "Plato", source: "Platonic Foundation" },
            publicDomain: true,
            sizeBytes: 2_100_000,
            currentLocation: {},
          },
        },
        // Private items for natb1 (13)
        {
          id: "conan-chronicles-vol01",
          data: {
            title: "Conan Chronicles Vol. 1",
            mediaType: "cbz",
            tags: { genre: "comics", author: "Robert E. Howard" },
            publicDomain: false,
            sizeBytes: 765_000_000,
            currentLocation: {},
          },
        },
        {
          id: "confessions-augustine",
          data: {
            title: "Confessions (Augustine)",
            mediaType: "epub",
            tags: { genre: "philosophy", author: "Augustine of Hippo" },
            publicDomain: false,
            sizeBytes: 567_000,
            currentLocation: {},
          },
        },
        {
          id: "crown-and-skull-digital",
          data: {
            title: "Crown and Skull Digital",
            mediaType: "pdf",
            tags: { genre: "ttrpg", author: "Runehammer" },
            publicDomain: false,
            sizeBytes: 82_000_000,
            currentLocation: {},
          },
        },
        {
          id: "crown-and-skull-hero-sheet",
          data: {
            title: "Crown and Skull Hero Sheet",
            mediaType: "pdf",
            tags: { genre: "ttrpg", author: "Runehammer" },
            publicDomain: false,
            sizeBytes: 1_300_000,
            currentLocation: {},
          },
        },
        {
          id: "crown-and-skull-vol2",
          data: {
            title: "Crown and Skull Vol. 2",
            mediaType: "pdf",
            tags: { genre: "ttrpg", author: "Runehammer" },
            publicDomain: false,
            sizeBytes: 73_500_000,
            currentLocation: {},
          },
        },
        {
          id: "name-of-the-rose",
          data: {
            title: "The Name of the Rose",
            mediaType: "epub",
            tags: { genre: "fiction", author: "Umberto Eco" },
            publicDomain: false,
            sizeBytes: 1_200_000,
            currentLocation: {},
          },
        },
        {
          id: "hex-crown-skull-zine",
          data: {
            title: "Hex Crown Skull Zine",
            mediaType: "pdf",
            tags: { genre: "ttrpg", author: "Runehammer" },
            publicDomain: false,
            sizeBytes: 31_000_000,
            currentLocation: {},
          },
        },
        {
          id: "plato-complete-works",
          data: {
            title: "Plato: Complete Works",
            mediaType: "epub",
            tags: { genre: "philosophy", author: "Plato" },
            publicDomain: false,
            sizeBytes: 4_700_000,
            currentLocation: {},
          },
        },
        {
          id: "scattered-minds",
          data: {
            title: "Scattered Minds",
            mediaType: "epub",
            tags: { genre: "psychology", author: "Gabor Mate" },
            publicDomain: false,
            sizeBytes: 1_200_000,
            currentLocation: {},
          },
        },
        {
          id: "shadowdark-rpg",
          data: {
            title: "Shadowdark RPG",
            mediaType: "pdf",
            tags: { genre: "ttrpg", author: "Arcane Library" },
            publicDomain: false,
            sizeBytes: 72_000_000,
            currentLocation: {},
          },
        },
        {
          id: "delian-tomb",
          data: {
            title: "The Delian Tomb",
            mediaType: "pdf",
            tags: { genre: "ttrpg", author: "Matt Colville" },
            publicDomain: false,
            sizeBytes: 3_500_000,
            currentLocation: {},
          },
        },
        {
          id: "unmasking-autism",
          data: {
            title: "Unmasking Autism",
            mediaType: "epub",
            tags: { genre: "psychology", author: "Devon Price" },
            publicDomain: false,
            sizeBytes: 2_800_000,
            currentLocation: {},
          },
        },
        {
          id: "test-comic",
          data: {
            title: "Test Comic",
            mediaType: "cbz",
            tags: { genre: "comics" },
            publicDomain: false,
            sizeBytes: 2_100_000,
            currentLocation: {},
          },
        },
      ],
    },
  ],
};

export default appSeed;
