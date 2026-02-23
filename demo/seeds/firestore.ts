import type { SeedSpec } from "@commons-systems/firestoreutil/seed";

const appSeed: SeedSpec = {
  namespace: "",
  collections: [
    {
      name: "messages",
      documents: [
        {
          id: "greeting-1",
          data: {
            text: "Welcome to demo",
            author: "system",
            createdAt: "2026-01-01T00:00:00Z",
          },
        },
        {
          id: "greeting-2",
          data: {
            text: "Hello from Demo",
            author: "system",
            createdAt: "2026-01-01T00:01:00Z",
          },
        },
      ],
    },
    {
      name: "notes",
      documents: [
        {
          id: "note-1",
          data: {
            text: "This note is only visible when signed in.",
            createdAt: "2026-01-01T00:00:00Z",
          },
        },
        {
          id: "note-2",
          data: {
            text: "Auth-gated content works.",
            createdAt: "2026-01-01T00:01:00Z",
          },
        },
      ],
    },
  ],
};

export default appSeed;
