declare module "virtual:blog-post-metadata" {
  import type { PublishedPost } from "@commons-systems/blog/post-types";
  const metadata: PublishedPost[];
  export default metadata;
}
