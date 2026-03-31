import type { SeedSpec } from "@commons-systems/firestoreutil/seed";

const appSeed: Omit<SeedSpec, "namespace"> = {
  collections: [
    {
      name: "groups",
      testOnly: true,
      documents: [
        {
          id: "editors",
          data: {
            name: "editors",
            members: ["test@example.com"],
          },
        },
      ],
    },
  ],
};

export default appSeed;
