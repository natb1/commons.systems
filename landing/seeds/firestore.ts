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
          id: "recovering-autonomy-with-coding-agents",
          data: {
            title: "Recovering Autonomy with Coding Agents",
            published: true,
            publishedAt: "2026-03-10T00:00:00Z",
            filename: "recovering-autonomy-with-coding-agents.md",
          } satisfies PostSeedData,
        },
        {
          id: "draft-ideas",
          data: {
            title: "Draft Ideas",
            published: false,
            publishedAt: null,
            filename: "draft-ideas.md",
          } satisfies PostSeedData,
        },
      ],
    },
  ],
};

export default appSeed;
