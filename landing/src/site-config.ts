import type { LinkSection } from "@commons-systems/blog/components/info-panel";
import type { NavLink } from "@commons-systems/blog/prerender";
import type { SiteDefaults } from "@commons-systems/blog/og-meta";
import type { Organization, Author } from "@commons-systems/blog/seo";

export const SITE_URL = "https://commons.systems";

export const NAV_LINKS: NavLink[] = [{ href: "/", label: "Home" }];

export const SITE_DEFAULTS: SiteDefaults = {
  title: "commons.systems",
  description: "Nate's agentic coding workflow. A monorepo for proof-of-concept apps built with Claude Code — personal finance, print media, game blogs. Fork it, argue with it, discard the parts that don't serve you.",
  image: "/icons/rss.svg",
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
