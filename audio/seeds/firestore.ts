import type { SeedSpec } from "@commons-systems/firestoreutil/seed";
import { TEST_USER } from "@commons-systems/authutil/seed";

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
            members: [TEST_USER.email],
          },
        },
      ],
    },
  ],
};

export default appSeed;
