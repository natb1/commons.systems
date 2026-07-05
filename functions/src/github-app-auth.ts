// GitHub App authentication helpers shared by scheduled Functions.
//
// Authentication — GitHub App, not a personal access token:
//   - The App private key is a Functions secret, set once per project:
//         firebase functions:secrets:set OFFICE_HOURS_GITHUB_APP_PRIVATE_KEY
//   - On each run a caller signs a short-lived JWT with the private key and
//     exchanges it for a ~1-hour installation access token, used to call the
//     GitHub API. The installation token self-expires; nothing long-lived is
//     stored.
//
// These helpers are pure: every input (app id, installation id, private key)
// is passed as an argument. The `defineString`/`defineSecret` param
// definitions that supply those values live with each consumer (e.g.
// project-signals.ts), keyed by name so firebase-functions dedupes them.
import { createSign } from "node:crypto";
import { truncateForLog } from "./log-utils.js";

// Builds a GitHub App JWT (RS256) signed with the App's private key. GitHub
// caps the lifetime at 10 minutes; we use 9 and backdate `iat` by 60s to
// tolerate clock skew between this runtime and GitHub.
export function buildAppJwt(
  appId: string,
  privateKey: string,
  nowMs: number = Date.now(),
): string {
  const iat = Math.floor(nowMs / 1000) - 60;
  const exp = iat + 9 * 60;
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ iat, exp, iss: appId }),
  ).toString("base64url");
  const signingInput = `${header}.${payload}`;
  const signature = createSign("RSA-SHA256")
    .update(signingInput)
    .sign(privateKey)
    .toString("base64url");
  return `${signingInput}.${signature}`;
}

// Exchanges an App JWT for a short-lived (~1h) installation access token, which
// is what the GraphQL queries authenticate with. Minted fresh every run.
export async function mintInstallationToken(opts: {
  appId: string;
  installationId: string;
  privateKey: string;
  nowMs?: number;
}): Promise<string> {
  const jwt = buildAppJwt(opts.appId, opts.privateKey, opts.nowMs);
  const res = await fetch(
    `https://api.github.com/app/installations/${opts.installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "github-app-auth/1.0",
      },
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `GitHub App installation-token exchange failed: ${res.status} ${truncateForLog(text)}`,
    );
  }

  const json = (await res.json()) as { token?: string };
  if (!json.token) {
    throw new Error("GitHub App installation-token response missing token");
  }
  return json.token;
}
