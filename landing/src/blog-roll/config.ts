import type { BlogRollEntry, BlogRollStrategy } from "./types.js";
import { StaticStrategy } from "./static-strategy.js";

// Keep in sync with landing/public/blogroll.opml
export const BLOG_ROLL_ENTRIES: BlogRollEntry[] = [
  {
    id: "anthropic-engineering",
    name: "Anthropic Engineering",
    url: "https://www.anthropic.com/engineering",
  },
  {
    id: "claude-code-blog",
    name: "Claude Code Blog",
    url: "https://claude.com/blog/category/claude-code",
  },
];

export function createStrategies(): Map<string, BlogRollStrategy> {
  const strategies = new Map<string, BlogRollStrategy>();
  strategies.set(
    "anthropic-engineering",
    new StaticStrategy({
      title: "Building a C compiler with a team of parallel Claudes",
      url: "https://www.anthropic.com/engineering/building-a-c-compiler-with-parallel-claudes",
      publishedAt: "2026-02-05",
    }),
  );
  strategies.set(
    "claude-code-blog",
    new StaticStrategy({
      title: "Bringing automated preview, review, and merge to Claude Code on desktop",
      url: "https://claude.com/blog/preview-review-and-merge-with-claude-code",
      publishedAt: "2026-02-20",
    }),
  );
  return strategies;
}
