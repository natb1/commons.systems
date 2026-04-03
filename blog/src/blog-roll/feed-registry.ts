export interface FeedRegistryEntry {
  readonly id: string;
  readonly name: string;
  readonly homeUrl: string;
  readonly feedUrl: string;
}

export const FEED_REGISTRY: readonly FeedRegistryEntry[] = [
  {
    id: "bastionland",
    name: "BASTIONLAND",
    homeUrl: "https://www.bastionland.com/",
    feedUrl: "https://www.bastionland.com/feeds/posts/default",
  },
  {
    id: "new-school-revolution",
    name: "New School Revolution",
    homeUrl: "https://newschoolrevolution.com/",
    feedUrl: "https://newschoolrevolution.com/feed/",
  },
  {
    id: "prismatic-wasteland",
    name: "Prismatic Wasteland",
    homeUrl: "https://www.prismaticwasteland.com/",
    feedUrl: "https://www.prismaticwasteland.com/?format=rss",
  },
];
