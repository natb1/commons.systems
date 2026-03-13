declare module "virtual:blog-roll-feeds" {
  import type { LatestPost } from "@commons-systems/blog/blog-roll/types";
  const feeds: Record<string, LatestPost | null>;
  export default feeds;
}
