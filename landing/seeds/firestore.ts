import type { SeedSpec } from "@commons-systems/firestoreutil/seed";
import type { Group } from "@commons-systems/authutil/groups";
import type { PostMeta } from "@commons-systems/blog/post-types";
import { TEST_USER } from "@commons-systems/authutil/seed";

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
          data: { name: "admin", members: [TEST_USER.email] } satisfies GroupSeedData,
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
            previewDescription: "Recovering autonomy means applying expertise with enough velocity that the logistics don't become the core business.",
          } satisfies PostSeedData,
        },
        {
          id: "maintaining-alignment-long-horizon-agents",
          data: {
            title: "Harness Engineering: Maintaining Alignment for Long-Horizon Agentic Workflows",
            published: true,
            publishedAt: "2026-06-22T00:00:00Z",
            filename: "maintaining-alignment-long-horizon-agents.md",
            previewDescription: "Once frontier models are capable enough to delegate long-horizon work to, maintaining alignment is the bottleneck. A field report on a self-hosted agent harness — two queues and the /align skill — that keeps an autonomous coding workflow pointed at your intent.",
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
