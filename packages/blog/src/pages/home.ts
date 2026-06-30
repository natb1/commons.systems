import type { PostContent } from "../marked-config.ts";

// This module now only re-exports the PostContent type for external
// `@commons-systems/blog/pages/home` importers (landing + fellspiral
// virtual-blog-post-content.d.ts). The former string/hydrate bridges
// (renderArticle / renderHomeHtml / hydrateHome) are gone — the home feed is
// React-owned by HomeRegion (src/pages/HomeRegion.tsx) + the presentational
// components in Home.tsx.
export type { PostContent };
