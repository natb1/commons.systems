import { onRequest } from "firebase-functions/v2/https";
import type { Request } from "firebase-functions/v2/https";
import type { Response } from "express";

// Must match FEED_REGISTRY in blog/src/blog-roll/feed-registry.ts.
// Kept as a separate constant because Cloud Functions cannot import from
// the blog package at runtime. See feed-proxy.test.ts for the sync check.
export const ALLOWED_FEED_URLS: ReadonlySet<string> = new Set([
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

  let upstream: globalThis.Response;
  try {
    upstream = await fetch(url, {
      headers: { "User-Agent": "commons-systems-feed-proxy/1.0" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Feed proxy: fetch failed for ${url}: ${message}`);
    res.status(502).send(`Failed to fetch upstream feed: ${message}`);
    return;
  }

  if (!upstream.ok) {
    console.error(`Feed proxy: upstream ${upstream.status} for ${url}`);
    res.status(upstream.status).send(`Upstream returned ${upstream.status}`);
    return;
  }

  let body: string;
  try {
    body = await upstream.text();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Feed proxy: body read failed for ${url}: ${message}`);
    res.status(502).send(`Failed to read upstream response body: ${message}`);
    return;
  }

  const contentType = upstream.headers.get("content-type") ?? "application/xml";
  res.set("Content-Type", contentType);
  res.set("Cache-Control", "public, max-age=3600");
  res.send(body);
}

export const feedProxy = onRequest({ cors: true }, handleFeedProxy);
