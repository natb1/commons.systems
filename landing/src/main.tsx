import "missing.css";
import "@commons-systems/ds/tokens/colors.css";
import "@commons-systems/ds/tokens/typography.css";
import "@commons-systems/ds/tokens/spacing.css";
import "@commons-systems/ds/tokens/effects.css";
import "./style/theme.css";

import { createBlogApp } from "@commons-systems/blog/create-blog-app";
import { updateStaticPageMeta } from "@commons-systems/blog/og-meta";
import { updateCanonical } from "@commons-systems/blog/canonical";
import { ADMIN_GROUP_ID } from "@commons-systems/authutil/groups";

import buildTimeContent from "virtual:blog-post-content";
import buildTimeMetadata from "virtual:blog-post-metadata";

import { createRoot, type Root } from "react-dom/client";
import { ABOUT_PAGE_META, APPS, INFO_PANEL_LINK_SECTIONS, NAV_LINKS, SITE_DEFAULTS, SITE_URL } from "./site-config.js";
import { ShowcaseContent } from "./components/Showcase.js";
import { About, AboutPanel } from "./pages/About.js";
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

// Cache the React root and the node it was created on. ensureHero may recreate
// the `.landing-hero` node (post pages strip it), so when a fresh node arrives
// we unmount the stale root and create a new one — never createRoot twice on
// the same node. mountHero renders the showcase content (band + grid) directly
// into the existing section and upgrades its attributes, mirroring the original
// vanilla mountHero (which replaced the section's children); it does NOT render
// the outer <section> wrapper, which would nest a second .landing-hero.
let heroRoot: Root | null = null;
let heroNode: HTMLElement | null = null;

function mountHero(hero: HTMLElement): void {
  if (heroNode !== hero) {
    heroRoot?.unmount();
    heroRoot = createRoot(hero);
    heroNode = hero;
  }
  hero.classList.add("app-showcase");
  hero.setAttribute("aria-label", "Featured apps");
  heroRoot!.render(<ShowcaseContent apps={APPS} />); // type-safety-ok: heroRoot is always set above — either by the if block or from a prior call
}

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
  onNavigate: (path) => {
    document.body.dataset.route = path === "/" ? "home" : path === "/about" ? "about" : "other";
  },
  onHomeAfterRender: (slug) => { if (!slug) mountHero(ensureHero()); },
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
