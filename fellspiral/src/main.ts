import "missing.css";
import "./style/theme.css";

import { createBlogApp } from "@commons-systems/blog/pages/app";

import buildTimeContent from "virtual:blog-post-content";
import buildTimeMetadata from "virtual:blog-post-metadata";
import buildTimeFeeds from "virtual:blog-roll-feeds";
import { BLOG_ROLL_ENTRIES, createStrategies } from "./blog-roll/config.js";
import { INFO_PANEL_LINK_SECTIONS, SITE_DEFAULTS, SITE_URL } from "./site-config.js";
import { signIn, signOut, onAuthStateChanged } from "./auth.js";
import { db, NAMESPACE, trackPageView, initAppCheck } from "./firebase.js";

const headerHeightTarget = document.querySelector(".content-grid") as HTMLElement | null;
if (!headerHeightTarget) throw new Error(".content-grid element not found");

createBlogApp({
  siteUrl: SITE_URL,
  ogTitle: "Fellspiral",
  siteDefaults: SITE_DEFAULTS,

  buildTimeContent,
  buildTimeMetadata,
  postFetchPathPrefix: "fellspiral/post",

  infoPanelLinkSections: INFO_PANEL_LINK_SECTIONS,
  blogRollEntries: BLOG_ROLL_ENTRIES,
  createStrategies,
  buildTimeFeeds,

  enableInfoPanelScrollIndicator: true,
  headerHeightTarget,

  db,
  namespace: NAMESPACE,
  trackPageView,
  initAppCheck,

  signIn,
  signOut,
  onAuthStateChanged,
});
