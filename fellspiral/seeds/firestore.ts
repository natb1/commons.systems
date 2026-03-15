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
          id: "scenes-from-a-hat",
          data: {
            title: "Scenes from a Hat",
            published: true,
            publishedAt: "2026-03-11T00:00:00Z",
            filename: "scenes-from-a-hat.md",
            previewImage: "/tile10-armadillo-crag.png",
            previewDescription: "d10 Scenes from Armadillo Crag: On approaching any landmark near Armadillo crag, roll 2 scenes from this table.",
          } satisfies PostSeedData,
        },
      ],
    },
  ],
};

export default appSeed;
