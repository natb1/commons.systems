import { onRequest } from "firebase-functions/v2/https";
import type { Request, HttpsFunction } from "firebase-functions/v2/https";
import type { Response } from "express";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAppCheck } from "firebase-admin/app-check";
import { ALLOWED_FEED_URLS } from "./allowed-feed-urls.generated.js";
export { ALLOWED_FEED_URLS };

const adminApp = getApps().length > 0 ? getApps()[0] : initializeApp();

/** Caps the size of the proxied upstream body (~5 MB). Feeds are small; this
 *  bound prevents a hostile upstream from inflating memory/egress. */
const MAX_FEED_BYTES = 5 * 1024 * 1024;

/** Verify the AppCheck token in the request. Always returns true in the emulator
 *  because the emulator does not issue or verify AppCheck tokens. */
async function verifyAppCheck(req: Request): Promise<boolean> {
  if (process.env.FUNCTIONS_EMULATOR === "true") return true;
  const token = req.header("X-Firebase-AppCheck");
  if (!token) return false;
  try {
    await getAppCheck(adminApp).verifyToken(token);
    return true;
  } catch (err) {
    if (err instanceof Error && "code" in err && String((err as Record<string, unknown>).code).startsWith("app-check/")) {
      console.error("AppCheck token invalid:", err);
      return false;
    }
    throw err;
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
      redirect: "manual",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Feed proxy: fetch failed for ${url}: ${message}`);
    res.status(502).send("Failed to fetch upstream feed");
    return;
  }

  // With redirect: "manual", undici returns an opaque-redirect filtered
  // response (type "opaqueredirect", status 0). Reject it before the !ok check
  // so a redirect off the allowlist (SSRF) cannot reach an arbitrary URL.
  if (upstream.type === "opaqueredirect") {
    console.error(`Feed proxy: upstream returned a redirect for ${url}`);
    res.status(502).send("Upstream returned a redirect, which is not allowed");
    return;
  }

  if (!upstream.ok) {
    console.error(`Feed proxy: upstream ${upstream.status} for ${url}`);
    res.status(upstream.status).send(`Upstream returned ${upstream.status}`);
    return;
  }

  // Boundary guard: per the fetch types, body can legitimately be null. Surface
  // a clear error rather than crashing — and never fall back to upstream.text(),
  // which would re-introduce the unbounded read this read replaces.
  if (upstream.body === null) {
    console.error(`Feed proxy: upstream returned a null body for ${url}`);
    res.status(502).send("Upstream returned an empty response body");
    return;
  }

  let body: string;
  try {
    const reader = upstream.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let total = 0;
    let acc = "";
    let overCap = false;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_FEED_BYTES) {
        await reader.cancel();
        overCap = true;
        break;
      }
      acc += decoder.decode(value, { stream: true });
    }
    if (overCap) {
      console.error(
        `Feed proxy: upstream feed exceeded ${MAX_FEED_BYTES} bytes for ${url}`,
      );
      res.status(502).send("Upstream feed exceeded maximum allowed size");
      return;
    }
    acc += decoder.decode();
    body = acc;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Feed proxy: body read failed for ${url}: ${message}`);
    res.status(502).send("Failed to read upstream response body");
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
