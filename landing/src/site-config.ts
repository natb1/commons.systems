import type { LinkSection } from "@commons-systems/blog/components/info-panel";
import type { NavLink } from "@commons-systems/blog/prerender";
import type { SiteDefaults } from "@commons-systems/blog/og-meta";

export const NAV_LINKS: NavLink[] = [{ href: "/", label: "Home" }];

export const SITE_DEFAULTS: SiteDefaults = {
  title: "commons.systems",
  description: "Nate's agentic coding workflow. A monorepo for proof-of-concept apps built with Claude Code — personal finance, print media, game blogs. Fork it, argue with it, discard the parts that don't serve you.",
  image: "/icons/rss.svg",
};

export const INFO_PANEL_LINK_SECTIONS: LinkSection[] = [
  {
    heading: "Links",
    links: [
      { label: "Source", url: "https://github.com/natb1/commons.systems" },
    ],
  },
];
