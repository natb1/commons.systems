import { describe, it, expect, vi, beforeEach } from "vitest";
import { createVerify, generateKeyPairSync } from "node:crypto";

import { buildAppJwt, mintInstallationToken } from "../src/github-app-auth";

const testKeyPair = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs1", format: "pem" },
});

function decodeJwtPart(part: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
}

describe("buildAppJwt", () => {
  it("produces an RS256 JWT signed by the App private key with the expected claims", () => {
    const nowMs = 1_700_000_000_000;
    const jwt = buildAppJwt("123456", testKeyPair.privateKey, nowMs);

    const [header, payload, signature] = jwt.split(".");
    expect(header).toBeTruthy();
    expect(payload).toBeTruthy();
    expect(signature).toBeTruthy();

    expect(decodeJwtPart(header)).toEqual({ alg: "RS256", typ: "JWT" });

    const claims = decodeJwtPart(payload) as {
      iat: number;
      exp: number;
      iss: string;
    };
    const expectedIat = Math.floor(nowMs / 1000) - 60;
    expect(claims.iss).toBe("123456");
    expect(claims.iat).toBe(expectedIat);
    expect(claims.exp).toBe(expectedIat + 9 * 60);

    const verified = createVerify("RSA-SHA256")
      .update(`${header}.${payload}`)
      .verify(testKeyPair.publicKey, Buffer.from(signature, "base64url"));
    expect(verified).toBe(true);
  });
});

describe("mintInstallationToken", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("exchanges an App JWT for an installation token", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: () => Promise.resolve(""),
      json: () => Promise.resolve({ token: "ghs_installationtoken" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const token = await mintInstallationToken({
      appId: "123456",
      installationId: "87654321",
      privateKey: testKeyPair.privateKey,
      nowMs: 1_700_000_000_000,
    });

    expect(token).toBe("ghs_installationtoken");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://api.github.com/app/installations/87654321/access_tokens",
    );
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toMatch(/^Bearer .+\..+\..+$/);
    expect(headers.Accept).toBe("application/vnd.github+json");
    expect(headers["User-Agent"]).toBe("office-hours-sync/1.0");
  });

  it("throws when the token exchange returns non-OK", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Bad credentials"),
        json: () => Promise.resolve({}),
      }),
    );

    await expect(
      mintInstallationToken({
        appId: "123456",
        installationId: "87654321",
        privateKey: testKeyPair.privateKey,
      }),
    ).rejects.toThrow(/401/);
  });

  it("throws when the token exchange response omits the token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        text: () => Promise.resolve(""),
        json: () => Promise.resolve({}),
      }),
    );

    await expect(
      mintInstallationToken({
        appId: "123456",
        installationId: "87654321",
        privateKey: testKeyPair.privateKey,
      }),
    ).rejects.toThrow(/missing token/);
  });
});
