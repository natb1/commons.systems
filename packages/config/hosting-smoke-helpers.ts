import type { APIRequestContext, APIResponse } from "@playwright/test";

/**
 * Discover the content-hashed entry asset from the deployed index HTML.
 *
 * The hashed asset filename is unknowable from the URL, so this performs the
 * one unavoidable small-body GET of `/`. The index response is returned so
 * callers can reuse it (e.g. to assert the index's own headers) without a
 * second fetch.
 */
export async function getEntryAsset(
  request: APIRequestContext,
): Promise<{ indexResponse: APIResponse; entryAssetUrl: string }> {
  const indexResponse = await request.get("/");
  if (indexResponse.status() !== 200) {
    throw new Error(
      `GET / returned status ${indexResponse.status()}, expected 200`,
    );
  }

  const html = await indexResponse.text();

  const scriptMatch = html.match(/src="(\/assets\/[^"]+\.js)"/);
  const styleMatch = html.match(/href="(\/assets\/[^"]+\.css)"/);
  const entryAssetUrl = scriptMatch?.[1] ?? styleMatch?.[1];

  if (!entryAssetUrl) {
    throw new Error(
      'No content-hashed entry asset found in index HTML: searched for a ' +
        'script src="/assets/*.js" then a stylesheet href="/assets/*.css"',
    );
  }

  return { indexResponse, entryAssetUrl };
}
