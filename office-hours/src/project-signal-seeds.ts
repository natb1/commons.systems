import type { GithubSignals, Ga4AppSignals, GscSignals, PsiUrlSignals } from "./project-signals.js";

export interface ProjectSignalSeed {
  /** Minutes before page-load "now" the snapshot was computed; the vite plugin embeds this as a literal and converts it to `computedAt` via `Date.now()` at module load time. */
  computedAtOffsetMin: number;
  groupId: string;
  memberEmails: string[];
  github?: GithubSignals;
  ga4?: Ga4AppSignals[];
  gsc?: GscSignals;
  psi?: PsiUrlSignals[];
}

export const projectSignalSeeds: ProjectSignalSeed = {
  computedAtOffsetMin: 20, // computed 20 minutes ago
  groupId: "demo-group",
  memberEmails: ["demo@example.com"],
  github: {
    repo: "natb1/commons.systems",
    stars: 42,
    forks: 7,
    watchers: 15,
    traffic: {
      clonesCount: 18,
      clonesUniques: 6,
      viewsCount: 312,
      viewsUniques: 48,
      topReferrers: [
        { referrer: "github.com", count: 120, uniques: 30 },
        { referrer: "google.com", count: 55, uniques: 22 },
        { referrer: "direct", count: 137, uniques: 41 },
      ],
    },
  },
  ga4: [
    {
      app: "landing",
      pageViews: 2840,
      sessions: 1620,
      bounceRate: 0.52,
      topReferralSources: [
        { source: "google", sessions: 740 },
        { source: "(direct)", sessions: 520 },
        { source: "github.com", sessions: 180 },
        { source: "twitter.com", sessions: 95 },
        { source: "hn.algolia.com", sessions: 85 },
      ],
      topLandingPages: [
        { page: "/", sessions: 820, views: 1240 },
        { page: "/blog", sessions: 310, views: 480 },
        { page: "/docs", sessions: 220, views: 390 },
      ],
      webVitals: [],
    },
    {
      app: "print",
      pageViews: 650,
      sessions: 410,
      bounceRate: 0.38,
      topReferralSources: [
        { source: "(direct)", sessions: 210 },
        { source: "google", sessions: 130 },
        { source: "commons.systems", sessions: 70 },
      ],
      topLandingPages: [
        { page: "/", sessions: 260, views: 380 },
        { page: "/editor", sessions: 150, views: 270 },
      ],
      webVitals: [],
    },
  ],
  gsc: {
    site: "sc-domain:commons.systems",
    topQueries: [
      { query: "commons systems", clicks: 88, impressions: 420, ctr: 0.21, position: 2.1 },
      { query: "dispatch queue metrics", clicks: 34, impressions: 280, ctr: 0.12, position: 4.5 },
      { query: "office hours dashboard", clicks: 22, impressions: 190, ctr: 0.12, position: 5.2 },
      { query: "github dispatch automation", clicks: 18, impressions: 160, ctr: 0.11, position: 6.1 },
    ],
    topPages: [
      { page: "https://commons.systems/", clicks: 140, impressions: 820, ctr: 0.17, position: 3.2 },
      { page: "https://commons.systems/blog", clicks: 52, impressions: 340, ctr: 0.15, position: 4.8 },
      { page: "https://commons.systems/docs", clicks: 38, impressions: 270, ctr: 0.14, position: 5.5 },
    ],
    devices: [
      { device: "DESKTOP", clicks: 180, impressions: 980, ctr: 0.18, position: 3.8 },
      { device: "MOBILE", clicks: 54, impressions: 420, ctr: 0.13, position: 5.1 },
      { device: "TABLET", clicks: 12, impressions: 90, ctr: 0.13, position: 5.9 },
    ],
  },
  psi: [
    {
      url: "https://commons.systems",
      strategy: "mobile",
      performance: 78,
      seo: 95,
      accessibility: 92,
      bestPractices: 96,
      lcp: "2.4 s",
      cls: "0.02",
      tbt: "120 ms",
      fcp: "1.8 s",
    },
    {
      url: "https://budget.commons.systems",
      strategy: "mobile",
      performance: 84,
      seo: 91,
      accessibility: 88,
      bestPractices: 96,
      lcp: "2.0 s",
      cls: "0.01",
      tbt: "85 ms",
      fcp: "1.5 s",
    },
    {
      url: "https://print.commons.systems",
      strategy: "mobile",
      performance: 71,
      seo: 89,
      accessibility: 94,
      bestPractices: 92,
      lcp: "3.1 s",
      cls: "0.04",
      tbt: "210 ms",
      fcp: "2.2 s",
    },
    {
      url: "https://audio.commons.systems",
      strategy: "mobile",
      performance: 88,
      seo: 93,
      accessibility: 96,
      bestPractices: 100,
      lcp: "1.6 s",
      cls: "0.00",
      tbt: "40 ms",
      fcp: "1.2 s",
    },
    {
      url: "https://fellspiral.commons.systems",
      strategy: "mobile",
      performance: 65,
      seo: 87,
      accessibility: 90,
      bestPractices: 88,
      lcp: "3.8 s",
      cls: "0.06",
      tbt: "340 ms",
      fcp: "2.6 s",
    },
  ],
};
