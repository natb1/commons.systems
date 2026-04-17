import type { LinkSection } from "@commons-systems/blog/components/info-panel";
import type { NavLink } from "@commons-systems/blog/prerender";
import type { SiteDefaults } from "@commons-systems/blog/og-meta";
import type { Organization, Author } from "@commons-systems/blog/seo";

export const SITE_URL = "https://fellspiral.commons.systems";

export const NAV_LINKS: NavLink[] = [{ href: "/", label: "Home" }];

export const SITE_DEFAULTS: SiteDefaults = {
  title: "fellspiral",
  description: "A TTRPG game blog by Nate. Nate likes games about social role play.",
  image: "/tile10-armadillo-crag.webp",
};

export const ORGANIZATION: Organization = {
  name: "fellspiral",
  url: SITE_URL,
  logo: `${SITE_URL}/tile10-armadillo-crag.webp`,
  sameAs: ["https://github.com/natb1"],
};

export const AUTHOR: Author = {
  name: "Nathan Buesgens",
  url: "https://github.com/natb1",
};

export const REL_ME: string[] = ["https://github.com/natb1"];

export const INFO_PANEL_LINK_SECTIONS: LinkSection[] = [
  {
    links: [
      { label: "itch.io", url: "https://natethenoob.itch.io" },
      { label: "No Land Beyond", subtitle: "Find a Local Game in Baltimore", url: "https://discord.gg/sFHXtyF" },
    ],
  },
  {
    heading: "Games I'm Playing",
    links: [
      { label: "Mythic Bastionland", url: "https://chrismcdee.itch.io/mythic-bastionland" },
      { label: "ALIEN", url: "https://freeleaguepublishing.com/games/alien/" },
      { label: "Cairn", url: "https://cairnrpg.com/" },
      { label: "Triangle Agency", url: "https://shop.hauntedtable.games/" },
    ],
  },
];
