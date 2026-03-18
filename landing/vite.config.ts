import { createAppConfig } from "@commons-systems/config/vite";
import { feedXmlPlugin } from "@commons-systems/blog/vite-plugin-feed-xml";
import { buildFeedXml } from "@commons-systems/blog/feed";
import appSeed from "./seeds/firestore.js";

export default createAppConfig({
  plugins: [
    feedXmlPlugin(() =>
      buildFeedXml({
        title: "commons.systems",
        siteUrl: "https://commons.systems",
        seed: appSeed,
      }),
    ),
  ],
});
