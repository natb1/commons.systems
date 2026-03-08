import type { SeedSpec } from "@commons-systems/firestoreutil/seed";

const appSeed: Omit<SeedSpec, "namespace"> = {
  collections: [
    {
      name: "groups",
      testOnly: true,
      documents: [
        {
          id: "admin",
          data: { name: "admin", members: ["test@example.com"] },
        },
      ],
    },
    {
      name: "posts",
      documents: [
        {
          id: "hello-fellspiral",
          data: {
            title: "Hello Fellspiral",
            published: true,
            publishedAt: "2026-03-01T00:00:00Z",
            filename: "hello-fellspiral.md",
          },
        },
      ],
    },
  ],
};

export default appSeed;
