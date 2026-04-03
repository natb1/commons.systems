import type { SeedSpec } from "@commons-systems/firestoreutil/seed";
import type { AudioItem } from "../src/types.js";
import { TEST_USER } from "@commons-systems/authutil/seed";

type AudioSeedData = Omit<AudioItem, "id">;

// The media collection is intentionally non-convergent: prod seed deploys
// upsert these documents but will not delete items added via manual Firestore
// writes.
//
// Emulator storage objects are seeded separately via seeds/run-storage-seed.ts.

const appSeed: Omit<SeedSpec, "namespace"> = {
  collections: [
    {
      name: "media",
      documents: [
        {
          id: "musopen-beethoven-moonlight",
          data: {
            title: "Piano Sonata No. 14 (Moonlight Sonata)",
            artist: "Ludwig van Beethoven",
            album: "Beethoven: Piano Sonatas",
            trackNumber: 14,
            genre: "Classical",
            year: 1801,
            duration: 360,
            format: "mp3",
            publicDomain: true,
            sourceNotes: "Internet Archive: https://archive.org/details/geniesduclassique_vol2no05 (public domain mark 1.0)",
            storagePath: "media/musopen-beethoven-moonlight.mp3",
            groupId: null,
            memberEmails: [],

            addedAt: "2026-03-01T00:00:00Z",
          } satisfies AudioSeedData,
        },
        {
          id: "musopen-bach-cello-suite-1",
          data: {
            title: "Cello Suite No. 1 in G Major, Prelude",
            artist: "Johann Sebastian Bach",
            album: "Bach: Cello Suites",
            trackNumber: 1,
            genre: "Classical",
            year: 1720,
            duration: 160,
            format: "mp3",
            publicDomain: true,
            sourceNotes: "Internet Archive: https://archive.org/details/01No.1InGBwv10071.PreludeModerato (Pablo Casals, 1936, public domain)",
            storagePath: "media/musopen-bach-cello-suite-1.mp3",
            groupId: null,
            memberEmails: [],

            addedAt: "2026-03-02T00:00:00Z",
          } satisfies AudioSeedData,
        },
        {
          id: "musopen-chopin-nocturne-op9-2",
          data: {
            title: "Nocturne in E-flat Major, Op. 9 No. 2",
            artist: "Frédéric Chopin",
            album: "Chopin: Nocturnes",
            trackNumber: 2,
            genre: "Classical",
            year: 1832,
            duration: 270,
            format: "mp3",
            publicDomain: true,
            sourceNotes: "Musopen via Internet Archive: https://archive.org/details/musopen-chopin (CC0, performed by Aaron Dunn)",
            storagePath: "media/musopen-chopin-nocturne-op9-2.mp3",
            groupId: null,
            memberEmails: [],

            addedAt: "2026-03-03T00:00:00Z",
          } satisfies AudioSeedData,
        },
      ],
    },
    {
      name: "media",
      testOnly: true,
      documents: [
        {
          id: "test-audio-public",
          data: {
            title: "Test Public Audio",
            artist: "Test Artist",
            album: "Test Album",
            trackNumber: 1,
            genre: "Test",
            year: 2026,
            duration: 30,
            format: "wav",
            publicDomain: true,
            sourceNotes: "Synthetic test audio for emulator testing",
            storagePath: "media/test-audio-public.wav",
            groupId: null,
            memberEmails: [],

            addedAt: "2026-03-10T00:00:00Z",
          } satisfies AudioSeedData,
        },
        {
          id: "test-audio-private",
          data: {
            title: "Test Private Audio",
            artist: "Test Artist",
            album: "Private Album",
            trackNumber: null,
            genre: "Test",
            year: null,
            duration: 15,
            format: "wav",
            publicDomain: false,
            sourceNotes: "Test-only private item for emulator testing",
            storagePath: "media/test-audio-private.wav",
            groupId: "test-group",
            memberEmails: [TEST_USER.email],

            addedAt: "2026-03-11T00:00:00Z",
          } satisfies AudioSeedData,
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
            members: [TEST_USER.email],
          },
        },
      ],
    },
  ],
};

export default appSeed;
