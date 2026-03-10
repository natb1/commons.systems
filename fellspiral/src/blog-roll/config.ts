import type { BlogRollEntry, BlogRollStrategy } from "@commons-systems/blog/blog-roll/types";
import { AtomStrategy } from "@commons-systems/blog/blog-roll/atom-strategy";

interface BlogRollConfig {
  entry: BlogRollEntry;
  strategy: BlogRollStrategy;
}

export const BLOG_ROLL_CONFIG: BlogRollConfig[] = [
  {
    entry: { id: "bastionland", name: "BASTIONLAND", url: "https://www.bastionland.com/" },
    strategy: new AtomStrategy("https://www.bastionland.com/feeds/posts/default"),
  },
  {
    entry: { id: "new-school-revolution", name: "New School Revolution", url: "https://newschoolrevolution.com/" },
    strategy: new AtomStrategy("https://newschoolrevolution.com/feed/"),
  },
  {
    entry: { id: "half-a-worm", name: "Half a Worm and a Bitten Apple", url: "https://halfawormandabittenapple.blogspot.com/" },
    strategy: new AtomStrategy("https://halfawormandabittenapple.blogspot.com/feeds/posts/default"),
  },
];

export const BLOG_ROLL_ENTRIES = BLOG_ROLL_CONFIG.map((c) => c.entry);

export function createStrategies(): Map<string, BlogRollStrategy> {
  return new Map(BLOG_ROLL_CONFIG.map((c) => [c.entry.id, c.strategy]));
}
