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
      convergent: true,
      documents: [
        {
          id: "hello-fellspiral",
          data: {
            title: "Hello Fellspiral",
            published: true,
            publishedAt: "2026-03-01T00:00:00Z",
            filename: "hello-fellspiral.md",
          } satisfies PostSeedData,
        },
      ],
    },
  ],
};

export default appSeed;
