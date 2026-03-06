import type { SeedSpec } from "@commons-systems/firestoreutil/seed";

const appSeed: Omit<SeedSpec, "namespace"> = {
  collections: [
    {
      name: "groups",
      documents: [
        {
          id: "admin",
          data: { name: "admin", members: ["test-github-user"] },
        },
      ],
    },
    {
      name: "posts",
      documents: [
        {
          id: "hello-world",
          data: {
            title: "Hello World",
            published: true,
            publishedAt: "2026-01-15T00:00:00Z",
            filename: "hello-world.md",
          },
        },
        {
          id: "agentic-coding-workflow",
          data: {
            title: "Agentic Coding Workflow",
            published: true,
            publishedAt: "2026-02-15T00:00:00Z",
            filename: "agentic-coding-workflow.md",
          },
        },
        {
          id: "draft-ideas",
          data: {
            title: "Draft Ideas",
            published: false,
            publishedAt: null,
            filename: "draft-ideas.md",
          },
        },
      ],
    },
  ],
};

export default appSeed;
