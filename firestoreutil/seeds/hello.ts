import type { SeedSpec } from "../src/seed.js";

export const helloSeed: SeedSpec = {
  namespace: "", // Set by CLI runner from env var
  collections: [
    {
      name: "messages",
      documents: [
        {
          id: "greeting-1",
          data: {
            text: "Welcome to commons.systems",
            author: "system",
            createdAt: "2026-01-01T00:00:00Z",
          },
        },
        {
          id: "greeting-2",
          data: {
            text: "Hello from the prototype",
            author: "system",
            createdAt: "2026-01-01T00:01:00Z",
          },
        },
      ],
    },
  ],
};
