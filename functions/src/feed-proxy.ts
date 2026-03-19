import { onRequest } from "firebase-functions/v2/https";
import type { Request, HttpsFunction } from "firebase-functions/v2/https";
import type { Response } from "express";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAppCheck } from "firebase-admin/app-check";
import { ALLOWED_FEED_URLS } from "./allowed-feed-urls.generated.js";
export { ALLOWED_FEED_URLS };

function getAdminApp() {
  const apps = getApps();
  return apps.length > 0 ? apps[0] : initializeApp();
}

async function verifyAppCheck(req: Request): Promise<boolean> {
  if (process.env.FUNCTIONS_EMULATOR === "true") return true;
  const token = req.header("X-Firebase-AppCheck");
  if (!token) return false;
  try {
    await getAppCheck(getAdminApp()).verifyToken(token);
    return true;
  } catch {
    return false;
  }
}

export async function handleFeedProxy(req: Request, res: Response) {
  if (!(await verifyAppCheck(req))) {
    res.status(401).send("Unauthorized: invalid or missing AppCheck token");
    return;
  }

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

export const feedProxy: HttpsFunction = onRequest(
  { cors: true },
  handleFeedProxy,
);
