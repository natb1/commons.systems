import "missing.css";
import "./style/theme.css";

import { createBlogApp } from "@commons-systems/blog/create-blog-app";
import { ADMIN_GROUP_ID } from "@commons-systems/authutil/groups";

import buildTimeContent from "virtual:blog-post-content";
import buildTimeMetadata from "virtual:blog-post-metadata";
import buildTimeFeeds from "virtual:blog-roll-feeds";

import { INFO_PANEL_LINK_SECTIONS, SITE_DEFAULTS, SITE_URL } from "./site-config.js";
import { BLOG_ROLL_ENTRIES, createStrategies } from "./blog-roll/config.js";
import { db, NAMESPACE, trackPageView, initAppCheck, signIn, signOut, onAuthStateChanged } from "./firebase.js";

createBlogApp({
  buildTimeContent,
  buildTimeMetadata,
  buildTimeFeeds,
  fetchPostSource: "fellspiral/post",
  siteUrl: SITE_URL,
  ogTitle: "Fellspiral",
  siteDefaults: SITE_DEFAULTS,
  navLinks: [{ href: "/", label: "Home" }],
  showHomeLink: true,
  infoPanelLinkSections: INFO_PANEL_LINK_SECTIONS,
  blogRollEntries: BLOG_ROLL_ENTRIES,
  strategies: createStrategies(),
  firebase: { db, namespace: NAMESPACE, trackPageView, initAppCheck, signIn, signOut, onAuthStateChanged },
  adminGroupId: ADMIN_GROUP_ID,
  useScrollIndicator: true,
  rehydrateOnAppCheck: true,
});
