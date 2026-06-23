// @vitest-environment happy-dom
//
// Tests for <ProjectSignalsPanel>: full seed data, single-source snapshots,
// and the null (empty) case.
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { ProjectSignalsPanel } from "../src/components/ProjectSignalsPanel.js";
import type { ProjectSignalsSnapshot, GithubSignals, Ga4AppSignals, GscSignals, PsiUrlSignals } from "../src/project-signals.js";

afterEach(() => cleanup());

// ---------------------------------------------------------------------------
// Fixtures — values are taken directly from project-signal-seeds.ts so that
// assertions match real seed data rather than invented numbers.
// ---------------------------------------------------------------------------

const githubFixture: GithubSignals = {
  repo: "natb1/commons.systems",
  stars: 42,
  forks: 7,
  watchers: 15,
  traffic: {
    clonesCount: 18,
    clonesUniques: 6,
    viewsCount: 312,
    viewsUniques: 48,
    topReferrers: [{ referrer: "github.com", count: 120, uniques: 30 }],
  },
};

const ga4Fixture: Ga4AppSignals[] = [
  {
    app: "landing",
    pageViews: 2840,
    sessions: 1620,
    bounceRate: 0.52,
    topReferralSources: [{ source: "google", sessions: 740 }],
    topLandingPages: [{ page: "/", sessions: 820, views: 1240 }],
    webVitals: [],
  },
  {
    app: "print",
    pageViews: 650,
    sessions: 410,
    bounceRate: 0.38,
    topReferralSources: [{ source: "(direct)", sessions: 210 }],
    topLandingPages: [{ page: "/", sessions: 260, views: 380 }],
    webVitals: [],
  },
];

const gscFixture: GscSignals = {
  site: "sc-domain:commons.systems",
  topQueries: [
    { query: "commons systems", clicks: 88, impressions: 420, ctr: 0.21, position: 2.1 },
    { query: "dispatch queue metrics", clicks: 34, impressions: 280, ctr: 0.12, position: 4.5 },
  ],
  topPages: [
    { page: "https://commons.systems/", clicks: 140, impressions: 820, ctr: 0.17, position: 3.2 },
    { page: "https://commons.systems/blog", clicks: 52, impressions: 340, ctr: 0.15, position: 4.8 },
  ],
  devices: [{ device: "DESKTOP", clicks: 180, impressions: 980, ctr: 0.18, position: 3.8 }],
};

const psiFixture: PsiUrlSignals[] = [
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
];

const fullSnapshot: ProjectSignalsSnapshot = {
  computedAt: new Date("2026-06-23T00:00:00Z"),
  groupId: "demo-group",
  memberEmails: [],
  github: githubFixture,
  ga4: ga4Fixture,
  gsc: gscFixture,
  psi: psiFixture,
};

// ---------------------------------------------------------------------------
// null snapshot
// ---------------------------------------------------------------------------

describe("ProjectSignalsPanel(null)", () => {
  it("renders the empty placeholder and no source sections", () => {
    const { container } = render(<ProjectSignalsPanel snapshot={null} />);
    const empty = container.querySelector(".empty");
    expect(empty).not.toBeNull();
    expect(empty!.textContent).toBe("No project signals yet.");
    expect(container.querySelectorAll(".project-signals-source")).toHaveLength(0);
  });

  it("renders the section heading", () => {
    const { container } = render(<ProjectSignalsPanel snapshot={null} />);
    const heading = container.querySelector(".project-signals-heading");
    expect(heading).not.toBeNull();
    expect(heading!.textContent).toBe("PROJECT SIGNALS");
  });
});

// ---------------------------------------------------------------------------
// Full seed data
// ---------------------------------------------------------------------------

describe("ProjectSignalsPanel — full snapshot", () => {
  it("renders headline GitHub values: stars, forks, watchers", () => {
    const { container } = render(<ProjectSignalsPanel snapshot={fullSnapshot} />);
    const texts = container.textContent ?? "";
    expect(texts).toContain("42"); // stars
    expect(texts).toContain("7");  // forks
    expect(texts).toContain("15"); // watchers
  });

  it("renders GitHub traffic clones and views when present", () => {
    const { container } = render(<ProjectSignalsPanel snapshot={fullSnapshot} />);
    const texts = container.textContent ?? "";
    expect(texts).toContain("18"); // clonesCount
    expect(texts).toContain("312"); // viewsCount
  });

  it("renders each GA4 app name with its page views and sessions", () => {
    const { container } = render(<ProjectSignalsPanel snapshot={fullSnapshot} />);
    const texts = container.textContent ?? "";
    expect(texts).toContain("landing");
    expect(texts).toContain("2840"); // landing pageViews
    expect(texts).toContain("1620"); // landing sessions
    expect(texts).toContain("print");
    expect(texts).toContain("650");  // print pageViews
    expect(texts).toContain("410");  // print sessions
  });

  it("renders the top GSC query and its clicks and impressions", () => {
    const { container } = render(<ProjectSignalsPanel snapshot={fullSnapshot} />);
    const texts = container.textContent ?? "";
    expect(texts).toContain("commons systems"); // top query
    expect(texts).toContain("88");              // top query clicks
    expect(texts).toContain("420");             // top query impressions
  });

  it("renders PSI scores for each URL", () => {
    const { container } = render(<ProjectSignalsPanel snapshot={fullSnapshot} />);
    const texts = container.textContent ?? "";
    expect(texts).toContain("https://commons.systems");
    expect(texts).toContain("78");  // commons.systems performance
    expect(texts).toContain("95");  // commons.systems seo
    expect(texts).toContain("https://audio.commons.systems");
    expect(texts).toContain("88");  // audio performance
    expect(texts).toContain("100"); // audio bestPractices
  });

  it("does not render the null/empty placeholder when full data is present", () => {
    const { container } = render(<ProjectSignalsPanel snapshot={fullSnapshot} />);
    const emptyEls = container.querySelectorAll(".empty");
    expect(emptyEls).toHaveLength(0);
  });

  it("includes the panel-grid-full class for full-width layout", () => {
    const { container } = render(<ProjectSignalsPanel snapshot={fullSnapshot} />);
    expect(container.querySelector(".panel-grid-full")).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Single-source snapshots — assert present source renders, absent ones show
// their per-source empty state.
// ---------------------------------------------------------------------------

describe("ProjectSignalsPanel — GitHub only", () => {
  const snapshot: ProjectSignalsSnapshot = {
    computedAt: new Date("2026-06-23T00:00:00Z"),
    groupId: "demo-group",
    memberEmails: [],
    github: githubFixture,
  };

  it("renders GitHub stars", () => {
    const { container } = render(<ProjectSignalsPanel snapshot={snapshot} />);
    expect(container.textContent).toContain("42");
  });

  it("shows empty state for GA4, GSC, and PSI", () => {
    const { container } = render(<ProjectSignalsPanel snapshot={snapshot} />);
    const empties = Array.from(container.querySelectorAll(".empty")).map((e) => e.textContent);
    expect(empties).toContain("No GA4 data.");
    expect(empties).toContain("No Search Console data.");
    expect(empties).toContain("No PSI data.");
  });
});

describe("ProjectSignalsPanel — GA4 only", () => {
  const snapshot: ProjectSignalsSnapshot = {
    computedAt: new Date("2026-06-23T00:00:00Z"),
    groupId: "demo-group",
    memberEmails: [],
    ga4: ga4Fixture,
  };

  it("renders landing and print apps", () => {
    const { container } = render(<ProjectSignalsPanel snapshot={snapshot} />);
    expect(container.textContent).toContain("landing");
    expect(container.textContent).toContain("print");
  });

  it("shows empty state for GitHub, GSC, and PSI", () => {
    const { container } = render(<ProjectSignalsPanel snapshot={snapshot} />);
    const empties = Array.from(container.querySelectorAll(".empty")).map((e) => e.textContent);
    expect(empties).toContain("No GitHub data.");
    expect(empties).toContain("No Search Console data.");
    expect(empties).toContain("No PSI data.");
  });
});

describe("ProjectSignalsPanel — GSC only", () => {
  const snapshot: ProjectSignalsSnapshot = {
    computedAt: new Date("2026-06-23T00:00:00Z"),
    groupId: "demo-group",
    memberEmails: [],
    gsc: gscFixture,
  };

  it("renders the top query", () => {
    const { container } = render(<ProjectSignalsPanel snapshot={snapshot} />);
    expect(container.textContent).toContain("commons systems");
  });

  it("shows empty state for GitHub, GA4, and PSI", () => {
    const { container } = render(<ProjectSignalsPanel snapshot={snapshot} />);
    const empties = Array.from(container.querySelectorAll(".empty")).map((e) => e.textContent);
    expect(empties).toContain("No GitHub data.");
    expect(empties).toContain("No GA4 data.");
    expect(empties).toContain("No PSI data.");
  });
});

describe("ProjectSignalsPanel — PSI only", () => {
  const snapshot: ProjectSignalsSnapshot = {
    computedAt: new Date("2026-06-23T00:00:00Z"),
    groupId: "demo-group",
    memberEmails: [],
    psi: psiFixture,
  };

  it("renders PSI scores", () => {
    const { container } = render(<ProjectSignalsPanel snapshot={snapshot} />);
    expect(container.textContent).toContain("78"); // commons.systems performance
  });

  it("shows empty state for GitHub, GA4, and GSC", () => {
    const { container } = render(<ProjectSignalsPanel snapshot={snapshot} />);
    const empties = Array.from(container.querySelectorAll(".empty")).map((e) => e.textContent);
    expect(empties).toContain("No GitHub data.");
    expect(empties).toContain("No GA4 data.");
    expect(empties).toContain("No Search Console data.");
  });
});

// ---------------------------------------------------------------------------
// PSI null scores — show "n/a"
// ---------------------------------------------------------------------------

describe("ProjectSignalsPanel — PSI with null scores", () => {
  const psiWithNulls: PsiUrlSignals[] = [
    {
      url: "https://example.commons.systems",
      strategy: "mobile",
      performance: null,
      seo: null,
      accessibility: null,
      bestPractices: null,
      lcp: "n/a",
      cls: "n/a",
      tbt: "n/a",
      fcp: "n/a",
    },
  ];

  const snapshot: ProjectSignalsSnapshot = {
    computedAt: new Date("2026-06-23T00:00:00Z"),
    groupId: "demo-group",
    memberEmails: [],
    psi: psiWithNulls,
  };

  it("renders 'n/a' for each null score", () => {
    const { container } = render(<ProjectSignalsPanel snapshot={snapshot} />);
    const texts = container.textContent ?? "";
    // All four scores are null — each renders as "n/a"
    const naMatches = (texts.match(/n\/a/g) ?? []).length;
    expect(naMatches).toBeGreaterThanOrEqual(4);
  });
});

// ---------------------------------------------------------------------------
// GitHub without traffic
// ---------------------------------------------------------------------------

describe("ProjectSignalsPanel — GitHub without traffic", () => {
  const snapshotNoTraffic: ProjectSignalsSnapshot = {
    computedAt: new Date("2026-06-23T00:00:00Z"),
    groupId: "demo-group",
    memberEmails: [],
    github: {
      repo: "natb1/commons.systems",
      stars: 10,
      forks: 2,
      watchers: 5,
      // no traffic
    },
  };

  it("renders stars/forks/watchers and no traffic metrics", () => {
    const { container } = render(<ProjectSignalsPanel snapshot={snapshotNoTraffic} />);
    const texts = container.textContent ?? "";
    expect(texts).toContain("10"); // stars
    expect(texts).toContain("2");  // forks
    expect(texts).not.toContain("clones"); // no traffic labels
    expect(texts).not.toContain("views (14d)");
  });
});
