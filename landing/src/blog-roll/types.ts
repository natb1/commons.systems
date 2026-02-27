export interface LatestPost {
  title: string;
  url: string;
}

export interface BlogRollEntry {
  id: string;
  name: string;
  url: string;
}

export interface BlogRollStrategy {
  fetchLatestPost(): Promise<LatestPost | null>;
}
