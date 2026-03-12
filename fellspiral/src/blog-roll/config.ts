import {
  createStrategies as buildStrategies,
  type BlogRollConfig,
  type BlogRollStrategy,
} from "@commons-systems/blog/blog-roll/types";
import { AtomStrategy } from "@commons-systems/blog/blog-roll/atom-strategy";
import { FallbackStrategy } from "@commons-systems/blog/blog-roll/fallback-strategy";
import buildTimeFeeds from "virtual:blog-roll-feeds";

export const BLOG_ROLL_CONFIG: BlogRollConfig[] = [
  {
    entry: { id: "bastionland", name: "BASTIONLAND", url: "https://www.bastionland.com/" },
    strategy: new FallbackStrategy(
      new AtomStrategy("https://www.bastionland.com/feeds/posts/default"),
      buildTimeFeeds["bastionland"] ?? null,
    ),
  },
  {
    entry: { id: "new-school-revolution", name: "New School Revolution", url: "https://newschoolrevolution.com/" },
    strategy: new FallbackStrategy(
      new AtomStrategy("https://newschoolrevolution.com/feed/"),
      buildTimeFeeds["new-school-revolution"] ?? null,
    ),
  },
  {
    entry: { id: "half-a-worm", name: "Half a Worm and a Bitten Apple", url: "https://halfawormandabittenapple.blogspot.com/" },
    strategy: new FallbackStrategy(
      new AtomStrategy("https://halfawormandabittenapple.blogspot.com/feeds/posts/default"),
      buildTimeFeeds["half-a-worm"] ?? null,
    ),
  },
];

export const BLOG_ROLL_ENTRIES = BLOG_ROLL_CONFIG.map((c) => c.entry);

export function createStrategies(): Map<string, BlogRollStrategy> {
  return buildStrategies(BLOG_ROLL_CONFIG);
}
