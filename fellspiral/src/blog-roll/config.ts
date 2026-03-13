import {
  createStrategies as buildStrategies,
  type BlogRollConfig,
  type BlogRollStrategy,
} from "@commons-systems/blog/blog-roll/types";
import { AtomStrategy } from "@commons-systems/blog/blog-roll/atom-strategy";
import { FallbackStrategy } from "@commons-systems/blog/blog-roll/fallback-strategy";
import { FEED_REGISTRY } from "@commons-systems/blog/blog-roll/feed-registry";
import buildTimeFeeds from "virtual:blog-roll-feeds";

export const BLOG_ROLL_CONFIG: BlogRollConfig[] = FEED_REGISTRY.map((feed) => ({
  entry: { id: feed.id, name: feed.name, url: feed.homeUrl },
  strategy: new FallbackStrategy(
    new AtomStrategy(feed.feedUrl),
    buildTimeFeeds[feed.id] ?? null,
  ),
}));

export const BLOG_ROLL_ENTRIES = BLOG_ROLL_CONFIG.map((c) => c.entry);

export function createStrategies(): Map<string, BlogRollStrategy> {
  return buildStrategies(BLOG_ROLL_CONFIG);
}
