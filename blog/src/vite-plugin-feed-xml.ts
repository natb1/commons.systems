import type { Plugin } from "vite";

export function feedXmlPlugin(getXml: () => string): Plugin {
  return {
    name: "feed-xml",
    configureServer(server) {
      server.middlewares.use("/feed.xml", (_req, res) => {
        res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
        res.end(getXml());
      });
    },
  };
}
