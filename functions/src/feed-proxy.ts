import { onRequest } from "firebase-functions/v2/https";
import type { Request } from "firebase-functions/v2/https";
import type { Response } from "express";

export const ALLOWED_FEED_URLS = new Set([
  "https://www.bastionland.com/feeds/posts/default",
  "https://newschoolrevolution.com/feed/",
  "https://halfawormandabittenapple.blogspot.com/feeds/posts/default",
]);

export async function handleFeedProxy(req: Request, res: Response) {
  const url = req.query.url;
  if (typeof url !== "string" || !url) {
    res.status(400).send("Missing required query parameter: url");
    return;
  }

  if (!ALLOWED_FEED_URLS.has(url)) {
    res.status(403).send("URL not in allowlist");
    return;
  }

  const upstream = await fetch(url, {
    headers: { "User-Agent": "commons-systems-feed-proxy/1.0" },
  });

  if (!upstream.ok) {
    res.status(upstream.status).send(`Upstream returned ${upstream.status}`);
    return;
  }

  const body = await upstream.text();
  const contentType = upstream.headers.get("content-type") ?? "application/xml";
  res.set("Content-Type", contentType);
  res.set("Cache-Control", "public, max-age=3600");
  res.send(body);
}

export const feedProxy = onRequest({ cors: true }, handleFeedProxy);
