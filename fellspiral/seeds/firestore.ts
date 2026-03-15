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
          id: "disciplinary-review-operations",
          data: {
            title: "Disciplinary Review Operations",
            published: true,
            publishedAt: "2026-03-14T00:00:00Z",
            filename: "disciplinary-review-operations.md",
            previewImage: "/alienurn.jpg",
            previewDescription:
              "TRANSMISSION\nOuter Rim Command: Disciplinary Review Operations\nService Member: Sassy Diaz",
          } satisfies PostSeedData,
        },
        {
          id: "scenes-from-a-hat",
          data: {
            title: "Scenes from a Hat",
            published: true,
            publishedAt: "2026-03-15T00:00:00Z",
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
