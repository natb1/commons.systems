import type { SeedDocument, SeedSpec } from "@commons-systems/firestoreutil/seed";
import type { Group } from "@commons-systems/authutil/groups";
import type { PostMeta } from "@commons-systems/blog/post-types";
import { TEST_USER } from "@commons-systems/authutil/seed";

type GroupSeedData = Omit<Group, "id"> & { members: string[] };
export type PostSeedData = Omit<PostMeta, "id">;

export const postDocuments: SeedDocument<PostSeedData>[] = [
  {
    id: "disciplinary-review-operations",
    data: {
      title: "Disciplinary Review Operations",
      published: true,
      publishedAt: "2026-03-14T00:00:00Z",
      filename: "disciplinary-review-operations.md",
      previewImage: "/alienurn.webp",
      previewDescription:
        "TRANSMISSION\nOuter Rim Command: Disciplinary Review Operations\nService Member: Sassy Diaz",
    },
  },
  {
    id: "scenes-from-a-hat",
    data: {
      title: "Scenes from a Hat",
      published: true,
      publishedAt: "2026-03-15T00:00:00Z",
      filename: "scenes-from-a-hat.md",
      previewImage: "/tile10-armadillo-crag.webp",
      previewDescription: "d10 Scenes from Armadillo Crag: On approaching any landmark near Armadillo crag, roll 2 scenes from this table.",
    },
  },
  {
    id: "the-surreal",
    data: {
      title: "The Surreal: Returning to the Darkness",
      published: true,
      publishedAt: "2026-04-02T00:00:00Z",
      filename: "the-surreal.md",
      previewImage: "/blog-map-color.webp",
      previewDescription:
        "By following this map, each level of the darkness can be escaped, but at a cost.",
    },
  },
];

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
      documents: postDocuments,
    },
  ],
};

export default appSeed;
