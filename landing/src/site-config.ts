import type { LinkSection } from "@commons-systems/blog/components/info-panel";
import type { NavLink } from "@commons-systems/blog/prerender";
import type { SiteDefaults } from "@commons-systems/blog/og-meta";

export const NAV_LINKS: NavLink[] = [{ href: "/", label: "Home" }];

export const SITE_DEFAULTS: SiteDefaults = {
  title: "commons.systems",
  description: "Open-source, local-first apps for budgeting, reading, and publishing — built with AI, designed to fork and own. No accounts, no lock-in.",
  image: "/og-card.png",
};

export const INFO_PANEL_LINK_SECTIONS: LinkSection[] = [
  {
    heading: "Links",
    links: [
      { label: "Source", url: "https://github.com/natb1/commons.systems" },
    ],
  },
];
