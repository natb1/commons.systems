import "missing.css";
import "@commons-systems/ds/tokens/colors.css";
import "@commons-systems/ds/tokens/typography.css";
import "@commons-systems/ds/tokens/spacing.css";
import "@commons-systems/ds/tokens/effects.css";
import "@commons-systems/ds/hero-band.css";
import "@commons-systems/ds/context-panel.css";
import "./style/theme.css";

import { createBlogApp } from "@commons-systems/blog/create-blog-app";
import { updateStaticPageMeta } from "@commons-systems/blog/og-meta";
import { updateCanonical } from "@commons-systems/blog/canonical";
import { ADMIN_GROUP_ID } from "@commons-systems/authutil/groups";

import buildTimeContent from "virtual:blog-post-content";
import buildTimeMetadata from "virtual:blog-post-metadata";

import { ABOUT_PAGE_META, PROJECTS, INFO_PANEL_LINK_SECTIONS, NAV_LINKS, OVERFLOW_PROJECTS, SITE_DEFAULTS, SITE_URL } from "./site-config.js";
import { buildShowcaseHero } from "./hero-config.tsx";
import { About, AboutPanel } from "./pages/About.js";
import { BLOG_ROLL_ENTRIES, createStrategies } from "./blog-roll/config.js";
import { db, NAMESPACE, trackPageView, initAppCheck, signIn, signOut, onAuthStateChanged } from "./firebase.js";

createBlogApp({
  buildTimeContent,
  buildTimeMetadata,
  fetchPostSource: "landing/post",
  siteUrl: SITE_URL,
  ogTitle: "commons.systems",
  siteDefaults: SITE_DEFAULTS,
  navLinks: NAV_LINKS,
  showHomeLink: false,
  infoPanelLinkSections: INFO_PANEL_LINK_SECTIONS,
  blogRollEntries: BLOG_ROLL_ENTRIES,
  strategies: createStrategies(),
  firebase: { db, namespace: NAMESPACE, trackPageView, initAppCheck, signIn, signOut, onAuthStateChanged },
  adminGroupId: ADMIN_GROUP_ID,
  shell: {
    mount: "root",
    wordmark: "commons.systems",
    tagline: "Know the software that runs your business.",
    hero: buildShowcaseHero(PROJECTS, OVERFLOW_PROJECTS),
    panelAriaLabel: "Info",
  },
  onNavigate: (path) => {
    document.body.dataset.route = path === "/" ? "home" : path === "/about" ? "about" : "other";
  },
  // Route the /about info-panel content through React: when on /about,
  // InfoPanelRegion renders the profile card via aboutContent; any other path
  // yields the standard blogroll panel (and re-runs the blogroll fetch).
  infoPanelContentForPath: (path) => (path === "/about" ? <AboutPanel /> : undefined),
  extraRoutes: [
    {
      path: "/about",
      render: () => <About />,
      afterRender: () => {
        updateStaticPageMeta(SITE_URL, ABOUT_PAGE_META, "commons.systems");
        updateCanonical(SITE_URL, undefined, "/about");
      },
    },
  ],
});
