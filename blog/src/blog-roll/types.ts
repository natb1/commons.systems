export interface LatestPost {
  title: string;
  url: string;
  publishedAt?: string;
}

export interface BlogRollEntry {
  id: string;
  name: string;
  url: string;
}

export interface BlogRollStrategy {
  fetchLatestPost(): Promise<LatestPost | null>;
}

export interface BlogRollConfig {
  entry: BlogRollEntry;
  strategy: BlogRollStrategy;
}
