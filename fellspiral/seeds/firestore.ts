import type { SeedSpec } from "@commons-systems/firestoreutil/seed";
import type { Group } from "@commons-systems/authutil/groups";
import type { PostMeta } from "@commons-systems/blog/post-types";

type GroupSeedData = Omit<Group, "id"> & { members: string[] };
type PostSeedData = Omit<PostMeta, "id">;

const appSeed: Omit<SeedSpec, "namespace"> = {
  collections: [
    {
      name: "groups",
      testOnly: true,
      documents: [
        {
          id: "admin",
          data: { name: "admin", members: ["test@example.com"] } satisfies GroupSeedData,
        },
      ],
    },
    {
      name: "posts",
      documents: [
        {
          id: "running-mythic-bastionland",
          data: {
            title: "Running Mythic Bastionland",
            published: true,
            publishedAt: "2026-03-05T00:00:00Z",
            filename: "running-mythic-bastionland.md",
          } satisfies PostSeedData,
        },
        {
          id: "what-cairn-taught-me-about-combat",
          data: {
            title: "What Cairn Taught Me About Combat",
            published: true,
            publishedAt: "2026-03-08T00:00:00Z",
            filename: "what-cairn-taught-me-about-combat.md",
          } satisfies PostSeedData,
        },
      ],
    },
  ],
};

export default appSeed;
