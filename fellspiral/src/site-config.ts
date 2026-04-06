import type { LinkSection } from "@commons-systems/blog/components/info-panel";
import type { NavLink } from "@commons-systems/blog/prerender";
import type { SiteDefaults } from "@commons-systems/blog/og-meta";

export const NAV_LINKS: NavLink[] = [{ href: "/", label: "Home" }];

export const SITE_DEFAULTS: SiteDefaults = {
  title: "fellspiral",
  description: "A TTRPG game blog by Nate. Nate likes games about social role play.",
  image: "/tile10-armadillo-crag.webp",
};

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
