import "missing.css";
import "./style/theme.css";

import { createBlogApp } from "@commons-systems/blog/pages/app";

import buildTimeContent from "virtual:blog-post-content";
import buildTimeMetadata from "virtual:blog-post-metadata";
import { BLOG_ROLL_ENTRIES, createStrategies } from "./blog-roll/config.js";
import { INFO_PANEL_LINK_SECTIONS, SITE_DEFAULTS, SITE_URL } from "./site-config.js";
import { signIn, signOut, onAuthStateChanged } from "./auth.js";
import { db, NAMESPACE, trackPageView, initAppCheck } from "./firebase.js";

createBlogApp({
  siteUrl: SITE_URL,
  ogTitle: "commons.systems",
  siteDefaults: SITE_DEFAULTS,

  buildTimeContent,
  buildTimeMetadata,
  postFetchPathPrefix: "landing/post",

  infoPanelLinkSections: INFO_PANEL_LINK_SECTIONS,
  blogRollEntries: BLOG_ROLL_ENTRIES,
  createStrategies,

  db,
  namespace: NAMESPACE,
  trackPageView,
  initAppCheck,

  signIn,
  signOut,
  onAuthStateChanged,
});
