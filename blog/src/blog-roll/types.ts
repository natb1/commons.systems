export interface LatestPost {
  readonly title: string;
  readonly url: string;
  readonly publishedAt?: string;
}

export interface BlogRollEntry {
  id: string;
  name: string;
  url: string;
}

export interface BlogRollStrategy {
  /** Returns the latest post, or null if the feed is unavailable or empty.
   *  Implementations should catch recoverable errors and return null. */
  fetchLatestPost(): Promise<LatestPost | null>;
}

export interface BlogRollConfig {
  entry: BlogRollEntry;
  strategy: BlogRollStrategy;
}

export function createStrategies(
  configs: BlogRollConfig[],
): Map<string, BlogRollStrategy> {
  const map = new Map<string, BlogRollStrategy>();
  for (const c of configs) {
    if (map.has(c.entry.id)) {
      throw new Error(`Duplicate blog roll entry id: "${c.entry.id}"`);
    }
    map.set(c.entry.id, c.strategy);
  }
  return map;
}
