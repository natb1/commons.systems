import "missing.css";
import "./style/theme.css";

import { createBlogApp } from "@commons-systems/blog/create-blog-app";
import { updateStaticPageMeta } from "@commons-systems/blog/og-meta";
import { updateCanonical } from "@commons-systems/blog/canonical";
import { ADMIN_GROUP_ID } from "@commons-systems/authutil/groups";

import buildTimeContent from "virtual:blog-post-content";
import buildTimeMetadata from "virtual:blog-post-metadata";

import { ABOUT_PAGE_META, INFO_PANEL_LINK_SECTIONS, NAV_LINKS, SITE_DEFAULTS, SITE_URL } from "./site-config.js";
import { mountHero } from "./showcase-render.js";
import { renderAboutHtml, mountAboutPanel } from "./pages/about.js";
import { BLOG_ROLL_ENTRIES, createStrategies } from "./blog-roll/config.js";
import { db, NAMESPACE, trackPageView, initAppCheck, signIn, signOut, onAuthStateChanged } from "./firebase.js";

// The .landing-hero section is part of the page shell, but prerendering strips
// it from post and /about pages (blog's stripHomeExtra). Recreate it when
// absent so the home route can mount the showcase band even after SPA
// navigation from a page whose prerendered HTML shipped without the section.
function ensureHero(): HTMLElement {
  const existing = document.querySelector<HTMLElement>(".landing-hero");
  if (existing) return existing;
  const contentGrid = document.querySelector(".content-grid");
  if (!contentGrid) throw new Error(".content-grid element not found");
  const section = document.createElement("section");
  section.className = "landing-hero";
  contentGrid.before(section);
  return section;
}

const infoPanel = document.getElementById("info-panel");
if (!infoPanel) throw new Error("#info-panel element not found");

const handle = createBlogApp({
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
  onNavigate: (path) => {
    document.body.dataset.route = path === "/" ? "home" : path === "/about" ? "about" : "other";
  },
  onHomeAfterRender: (slug) => { if (!slug) mountHero(ensureHero()); },
  extraRoutes: [
    {
      path: "/about",
      render: () => renderAboutHtml(),
      afterRender: () => {
        updateStaticPageMeta(SITE_URL, ABOUT_PAGE_META, "commons.systems");
        updateCanonical(SITE_URL, undefined, "/about");
        mountAboutPanel(infoPanel);
        handle.forceInfoPanelRefresh();
      },
    },
  ],
});
