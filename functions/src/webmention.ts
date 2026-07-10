import { onRequest } from "firebase-functions/v2/https";
import type { Request, HttpsFunction } from "firebase-functions/v2/https";
import type { Response } from "express";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { createHash } from "node:crypto";

const adminApp = getApps().length > 0 ? getApps()[0] : initializeApp();

/** The two owned publication surfaces. A webmention `target` must live on one
 *  of these hosts; anything else is rejected. Hard-coded on purpose — the
 *  receiver only ever accepts mentions of pages this project publishes. */
export const OWNED_TARGET_HOSTS = ["commons.systems", "fellspiral.commons.systems"];

/** Caps the size of the fetched source body (~5 MB), mirroring feed-proxy's
 *  bound. Verification only needs to find the target URL in the markup; this
 *  prevents a hostile source from inflating memory/egress on this public,
 *  AppCheck-free endpoint. */
export const MAX_SOURCE_BYTES = 5 * 1024 * 1024;

function isHttpUrl(value: string): URL | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  return url;
}

/** Reads up to MAX_SOURCE_BYTES of the response body as UTF-8 text. Returns
 *  null on a null body or on a read that exceeds the cap (an over-cap source is
 *  treated as unverifiable, not truncated-and-trusted). */
async function readCappedText(res: globalThis.Response): Promise<string | null> {
  if (res.body === null) return null;
  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let total = 0;
  const parts: string[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_SOURCE_BYTES) {
      await reader.cancel();
      return null;
    }
    parts.push(decoder.decode(value, { stream: true }));
  }
  parts.push(decoder.decode());
  return parts.join("");
}

/** Deterministic doc id so an idempotent re-send of the same (source, target)
 *  overwrites rather than duplicating. */
export function mentionId(source: string, target: string): string {
  return createHash("sha256").update(`${source}|${target}`).digest("hex");
}

export async function handleWebmention(req: Request, res: Response) {
  // Method first: a webmention endpoint accepts POST only (W3C receiving rules).
  if (req.method !== "POST") {
    res.status(405).send("Method not allowed: webmention endpoint accepts POST only");
    return;
  }

  // Only application/x-www-form-urlencoded per the spec. `includes` (not `===`)
  // because senders append a charset, e.g. "...; charset=UTF-8".
  const contentType = req.header("content-type") ?? "";
  if (!contentType.includes("application/x-www-form-urlencoded")) {
    res
      .status(400)
      .send("Content-Type must be application/x-www-form-urlencoded");
    return;
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const source = body.source;
  const target = body.target;
  if (typeof source !== "string" || !source || typeof target !== "string" || !target) {
    res.status(400).send("Missing required form parameters: source and target");
    return;
  }

  const sourceUrl = isHttpUrl(source);
  if (sourceUrl === null) {
    res.status(400).send("source must be an http(s) URL");
    return;
  }
  const targetUrl = isHttpUrl(target);
  if (targetUrl === null) {
    res.status(400).send("target must be an http(s) URL");
    return;
  }
  if (source === target) {
    res.status(400).send("source and target must differ");
    return;
  }
  if (!OWNED_TARGET_HOSTS.includes(targetUrl.host)) {
    res
      .status(400)
      .send("target must be a page on commons.systems or fellspiral.commons.systems");
    return;
  }

  // Verify synchronously: fetch source and require it to actually reference
  // target. Follow redirects (default) — real senders' source URLs routinely
  // redirect (http->https, trailing slash), and the receiving rules say follow
  // them. Bound abuse with a UA, a 10s timeout, and the byte cap above.
  let upstream: globalThis.Response;
  try {
    upstream = await fetch(source, {
      headers: { "User-Agent": "commons-systems-webmention/1.0" },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Webmention: source fetch failed for ${source}: ${message}`);
    res.status(400).send("Could not fetch source to verify the mention");
    return;
  }

  if (!upstream.ok) {
    console.error(`Webmention: source returned ${upstream.status} for ${source}`);
    res.status(400).send("Source could not be fetched to verify the mention");
    return;
  }

  let sourceBody: string | null;
  try {
    sourceBody = await readCappedText(upstream);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Webmention: source body read failed for ${source}: ${message}`);
    res.status(400).send("Could not read source to verify the mention");
    return;
  }
  if (sourceBody === null || !sourceBody.includes(target)) {
    res.status(400).send("Source does not contain a link to target");
    return;
  }

  // Stored, not displayed: display needs a moderation story and is out of scope.
  try {
    const firestore = getFirestore(adminApp);
    await firestore
      .collection("webmentions/prod/mentions")
      .doc(mentionId(source, target))
      .set({ source, target, receivedAt: FieldValue.serverTimestamp() });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Webmention: firestore write failed for ${source} -> ${target}: ${message}`);
    res.status(500).send("Failed to store the webmention");
    return;
  }

  res.status(202).send("Webmention accepted");
}

// Public endpoint: external senders cannot carry an AppCheck token, so there is
// deliberately no AppCheck verification here (unlike feed-proxy). Abuse is
// bounded by the source-fetch byte cap + timeout above and by maxInstances.
export const webmention: HttpsFunction = onRequest(
  { maxInstances: 2 },
  handleWebmention,
);
