import type { LinkSection } from "@commons-systems/blog/components/info-panel";
import type { NavLink } from "@commons-systems/blog/prerender";

export const NAV_LINKS: NavLink[] = [{ href: "/", label: "Home" }];

export const INFO_PANEL_LINK_SECTIONS: LinkSection[] = [
  {
    heading: "Links",
    links: [
      { label: "Source", url: "https://github.com/natb1/commons.systems" },
    ],
  },
];
