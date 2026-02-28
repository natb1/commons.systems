import type { BlogRollEntry, BlogRollStrategy } from "./types.js";
import { StaticStrategy } from "./static-strategy.js";

export interface BlogRollConfig {
  entry: BlogRollEntry;
  strategy: BlogRollStrategy;
}

export const BLOG_ROLL_CONFIG: BlogRollConfig[] = [
  {
    entry: {
      id: "anthropic-engineering",
      name: "Anthropic Engineering",
      url: "https://www.anthropic.com/engineering",
    },
    strategy: new StaticStrategy({
      title: "Building a C compiler with a team of parallel Claudes",
      url: "https://www.anthropic.com/engineering/building-c-compiler",
      publishedAt: "2026-02-05",
    }),
  },
  {
    entry: {
      id: "claude-code-blog",
      name: "Claude Code Blog",
      url: "https://claude.com/blog/category/claude-code",
    },
    strategy: new StaticStrategy({
      title: "Bringing automated preview, review, and merge to Claude Code on desktop",
      url: "https://claude.com/blog/preview-review-and-merge-with-claude-code",
      publishedAt: "2026-02-20",
    }),
  },
];

export const BLOG_ROLL_ENTRIES = BLOG_ROLL_CONFIG.map((c) => c.entry);

export function createStrategies(): Map<string, BlogRollStrategy> {
  return new Map(BLOG_ROLL_CONFIG.map((c) => [c.entry.id, c.strategy]));
}
