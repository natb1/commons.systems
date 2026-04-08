import { test, expect } from "@playwright/test";

const expectedHeaders: {
  header: string;
  assert: (value: string) => void;
}[] = [
  {
    header: "content-security-policy",
    assert: (v) => {
      expect(v).toContain("default-src");
      expect(v).toContain("script-src");
    },
  },
  {
    header: "cross-origin-opener-policy",
    assert: (v) => expect(v).toBe("same-origin"),
  },
  {
    header: "x-frame-options",
    assert: (v) => expect(v).toBe("DENY"),
  },
  {
    header: "strict-transport-security",
    assert: (v) => {
      expect(v).toContain("includeSubDomains");
      expect(v).toContain("preload");
    },
  },
  {
    header: "x-content-type-options",
    assert: (v) => expect(v).toBe("nosniff"),
  },
];

export function describeSecurityHeadersSmoke(appName: string): void {
  test.describe(`${appName} security headers smoke`, () => {
    for (const { header, assert } of expectedHeaders) {
      test(`page response includes ${header} @smoke`, async ({ page }) => {
        const response = await page.goto("/");
        expect(response).not.toBeNull();
        const value = response!.headers()[header];
        expect(value, `${header} header missing`).toBeDefined();
        assert(value);
      });
    }
  });
}
