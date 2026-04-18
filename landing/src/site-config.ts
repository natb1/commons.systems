import type { LinkSection } from "@commons-systems/blog/components/info-panel";
import type { NavLink } from "@commons-systems/blog/prerender";
import type { SiteDefaults } from "@commons-systems/blog/og-meta";
import type { Organization, Author, SoftwareApplication } from "@commons-systems/blog/seo";

export const SITE_URL = "https://commons.systems";

export const NAV_LINKS: NavLink[] = [{ href: "/", label: "Home" }];

export const SITE_DEFAULTS: SiteDefaults = {
  title: "commons.systems",
  description: "Know the software that runs your business. Forkable, local-first apps built with commons.systems — and running without it.",
  image: "/og-card.png",
};

export const ORGANIZATION: Organization = {
  name: "commons.systems",
  url: SITE_URL,
  logo: `${SITE_URL}/icons/rss.svg`,
  sameAs: ["https://github.com/natb1"],
};

export const AUTHOR: Author = {
  name: "Nathan Buesgens",
  url: "https://github.com/natb1",
};

export const REL_ME: string[] = ["https://github.com/natb1"];

export const INFO_PANEL_LINK_SECTIONS: LinkSection[] = [
  {
    heading: "Links",
    links: [
      { label: "Source", url: "https://github.com/natb1/commons.systems" },
    ],
  },
];

export interface AppCard extends SoftwareApplication {
  description: string;
  screenshot: string;
  screenshotAlt: string;
  problem: string;
}

// App showcase source of truth. Screenshots are captured ad-hoc from production
// subdomains at a 1200×800 viewport; CSS crops to 3:2 at render time (see public/screenshots/README.md).
export const APPS: AppCard[] = [
  {
    name: "Budget",
    url: "https://budget.commons.systems",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    description: "Local-first personal budgeting that reads your bank exports without uploading them.",
    problem: "See where your money went without handing your statements to a SaaS.",
    screenshot: "/screenshots/budget.png",
    screenshotAlt: "Budget app showing a Sankey diagram of weekly spending by category.",
  },
  {
    name: "Audio",
    url: "https://audio.commons.systems",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    description: "Local-first audio player for long-form listening — podcasts, lectures, audiobooks.",
    problem: "Listen to long-form audio without a platform deciding what you hear next.",
    screenshot: "/screenshots/audio.png",
    screenshotAlt: "Audio app showing a library of classical music tracks with a player.",
  },
  {
    name: "Print",
    url: "https://print.commons.systems",
    applicationCategory: "BookApplication",
    operatingSystem: "Web",
    description: "Local-first reader and library for PDFs and EPUBs with imposition tools for booklets.",
    problem: "Read and bind your own books without a reader app that tracks your pages.",
    screenshot: "/screenshots/print.png",
    screenshotAlt: "Print app showing a library of public-domain books in PDF and EPUB.",
  },
];

export interface Dependency {
  name: string;
  solves: string;
  classification: string;
  exitPath: string;
  ratchetRisk: string;
}

// Dependency self-assessment source of truth — temporary home until a dedicated panel is added to the app showcase.
export const DEPENDENCIES: Dependency[] = [
  {
    name: "GitHub",
    solves: "Hosting, issues, collaboration, discoverability",
    classification: "Required; self-hosting loses discoverability",
    exitPath: "Gitea or similar; repo is standard git, issues/PRs are the lock-in surface",
    ratchetRisk: "Medium — terms could change",
  },
  {
    name: "Firebase",
    solves: "Hosting and deployment",
    classification: "Required, narrowly; data never depends on it",
    exitPath: "Cloudflare Pages, Netlify, self-hosted static hosting",
    ratchetRisk: "Low — deployment convenience, not data dependency",
  },
  {
    name: "Claude (Anthropic)",
    solves: "Agentic coding",
    classification: "Required as construction tool",
    exitPath: "Alternative LLMs; pattern is portable, skills are Claude-specific",
    ratchetRisk: "Medium-high — access loss slows iteration, breaks nothing built",
  },
  {
    name: "Open standards (HTML, JS, Go, git)",
    solves: "Core stack",
    classification: "Required; the substrate, not an institution",
    exitPath: "N/A",
    ratchetRisk: "Negligible",
  },
];
