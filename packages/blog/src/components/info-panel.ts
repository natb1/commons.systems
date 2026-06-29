import type { PostMeta } from "../post-types.ts";
import type { BlogRollEntry, LatestPost } from "../blog-roll/types.ts";

// This module now only carries the LinkSection / InfoPanelData type contracts
// shared across the blog (prerender.ts, create-blog-app.ts, InfoPanelRegion.tsx)
// and the landing + fellspiral site-config.ts (which import LinkSection). The
// former string/hydrate bridges (renderInfoPanel / hydrateInfoPanel) are gone —
// the info panel is React-owned by InfoPanelRegion (src/components/InfoPanelRegion.tsx)
// over the presentational InfoPanel component in InfoPanel.tsx.

export interface LinkSection {
  heading?: string;
  links: { label: string; subtitle?: string; url: string }[];
}

export interface InfoPanelData {
  linkSections: LinkSection[];
  topPosts: PostMeta[];
  blogRoll: BlogRollEntry[];
  rssFeedUrl?: string;
  opmlUrl?: string;
  postLinkPrefix?: string;
  buildTimeFeeds?: Record<string, LatestPost | null>;
}
