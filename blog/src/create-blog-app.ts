// Shared single-page-app bootstrap for the landing and fellspiral blogs. Both
// apps ship a near-identical shell — DOM lookups, the header ResizeObserver,
// nav wiring, the info-panel toggle, the click-to-top handler, the history
// router, and an auth-driven refresh. createBlogApp owns that shell; each app
// supplies its differences (build-time content, site config, firebase context)
// via CreateBlogAppConfig and never imports a `virtual:*` module here — that
// data arrives only through config.
import type { User } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

import type { Namespace } from "@commons-systems/firestoreutil/namespace";
import type { GroupId } from "@commons-systems/authutil/groups";
import type { NavLink } from "@commons-systems/components/nav";
import type { Route } from "@commons-systems/router";

import { initPanelToggle } from "@commons-systems/components/panel-toggle";
// blog/ owns the AppNavElement custom-element registration: importing the
// module for its side effect defines <app-nav>, and the type import gives the
// #nav cast its element type.
import "@commons-systems/components/nav";
import type { AppNavElement } from "@commons-systems/components/nav";

import type { SiteDefaults } from "./og-meta.ts";
import type { PostMeta } from "./firestore.ts";
import type { LinkSection } from "./components/info-panel.ts";
import type { BlogRollEntry, BlogRollStrategy, LatestPost } from "./blog-roll/types.ts";

export interface CreateBlogAppConfig {
  // build-time data (passed in; NEVER imported in blog/)
  buildTimeContent: Record<string, string>;
  buildTimeMetadata: PostMeta[];
  buildTimeFeeds?: Record<string, LatestPost | null>;
  // per-app data
  fetchPostSource: string;
  siteUrl: string;
  rssTitle: string;
  ogTitle: string;
  siteDefaults: SiteDefaults;
  navLinks: NavLink[];
  showHomeLink: boolean;
  infoPanelLinkSections: LinkSection[];
  blogRollEntries: BlogRollEntry[];
  strategies: Map<string, BlogRollStrategy>;
  // firebase app context (per-app instances)
  firebase: {
    db: Firestore;
    namespace: Namespace;
    trackPageView: (path: string) => void;
    initAppCheck: () => Promise<unknown>;
    signIn: () => Promise<unknown> | void;
    signOut: () => Promise<unknown> | void;
    onAuthStateChanged: (cb: (user: User | null) => void) => PromiseLike<unknown>;
  };
  adminGroupId: GroupId;
  // optional hooks (consumed in units 2/3)
  extraRoutes?: Route[];
  onHomeAfterRender?: (slug: string | undefined) => void;
  onNavigate?: (path: string) => void;
  useScrollIndicator?: boolean;
  rehydrateOnAppCheck?: boolean;
}

export interface BlogAppHandle {
  destroy(): void;
}

export function createBlogApp(config: CreateBlogAppConfig): BlogAppHandle {
  const navEl = document.getElementById("nav") as AppNavElement;
  if (!navEl) throw new Error("#nav element not found");
  const app = document.getElementById("app");
  if (!app) throw new Error("#app element not found");
  const infoPanel = document.getElementById("info-panel");
  if (!infoPanel) throw new Error("#info-panel element not found");

  const header = document.querySelector(".page > header");
  if (!header) throw new Error(".page > header element not found");
  // Drift fix: always target document.documentElement (landing's behavior).
  // fellspiral set --header-height on .content-grid; the shared shell unifies
  // on the root element.
  const headerObserver = new ResizeObserver(([entry]) => {
    document.documentElement.style.setProperty(
      "--header-height",
      `${entry.borderBoxSize[0].blockSize}px`,
    );
  });
  headerObserver.observe(header);

  navEl.links = config.navLinks;
  navEl.showHomeLink = config.showHomeLink;
  navEl.addEventListener("sign-in", () => config.firebase.signIn());
  navEl.addEventListener("sign-out", () => void config.firebase.signOut());

  const toggle = document.getElementById("panel-toggle");
  if (!toggle) throw new Error("#panel-toggle element not found");
  initPanelToggle(infoPanel, toggle);

  // TODO(unit-2): updateInfoPanel, loadPosts, updateNav, and the
  // createHistoryRouter wiring (routes, onNavigate, extraRoutes) land here.

  // TODO(unit-3): extraRoutes + onHomeAfterRender hook wiring lands here.

  // Teardown list: Unit 2 appends the router teardown and the
  // onAuthStateChanged unsubscribe so destroy() unwinds everything in one place.
  const teardowns: Array<() => void> = [];

  // Click-to-top: a named handler so destroy() can remove it.
  const onDocumentClick = (e: MouseEvent): void => {
    const target = e.target as HTMLElement;
    if (target.closest('a[href="/"]')) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  document.addEventListener("click", onDocumentClick);

  // TODO(unit-2): router teardown + onAuthStateChanged teardown push onto teardowns
  return {
    destroy(): void {
      headerObserver.disconnect();
      document.removeEventListener("click", onDocumentClick);
      for (const teardown of teardowns) teardown();
    },
  };
}
