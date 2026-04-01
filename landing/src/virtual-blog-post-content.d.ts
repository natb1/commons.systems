declare module "virtual:blog-post-content" {
  import type { PostContent } from "@commons-systems/blog/pages/home";
  const content: Record<string, PostContent>;
  export default content;
}
