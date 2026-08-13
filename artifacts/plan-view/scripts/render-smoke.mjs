#!/usr/bin/env node
/**
 * From-disk render smoke.
 *
 * Because a correctly built artifact is self-contained, it opens from `file://`
 * with the network disabled — so it can be genuinely acceptance tested, not
 * merely linted. Every request the page attempts is ABORTED here: if anything
 * still renders, nothing external was needed. That is the same property the
 * viewer's CSP enforces, checked before publishing rather than after.
 *
 * Asserts the three theme states too, since a colour whose only definition sits
 * inside a media query renders wrong in exactly one of them and is invisible to
 * a source-level check.
 *
 * Environment: on this NixOS host the cached ms-playwright chromium CANNOT run
 * (it is a generic-linux dynamically linked executable). `DS_CHROMIUM_PATH`
 * pointing at the nix-patched chromium is REQUIRED, not a cache-miss fallback —
 * see `.design-sync/NOTES.md`. On CI's ubuntu runner the bundled browser works
 * and the variable is unset.
 *
 * Usage: render-smoke.mjs <file>
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";

const file = process.argv[2];
if (file === undefined || !existsSync(file)) {
  console.error("usage: render-smoke.mjs <built artifact html>");
  process.exit(2);
}

const executablePath = process.env.DS_CHROMIUM_PATH;
const browser = await chromium.launch(
  executablePath === undefined || executablePath === "" ? {} : { executablePath },
);

const failures = [];
function check(name, ok, detail) {
  if (ok) return;
  failures.push(`${name}: ${detail}`);
}

try {
  for (const theme of [null, "dark", "light"]) {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Network disabled. Any attempt is a defect, not a slow path.
    const attempted = [];
    await page.route("**/*", (route) => {
      const url = route.request().url();
      if (url.startsWith("file://") || url.startsWith("data:")) {
        route.continue();
        return;
      }
      attempted.push(url);
      route.abort();
    });

    const errors = [];
    page.on("pageerror", (error) => errors.push(String(error)));

    // The publish step wraps the file in its own skeleton; reproduce that here
    // so the smoke exercises what actually ships rather than a bare fragment.
    await page.goto(`file://${resolve(file)}`);
    if (theme !== null) {
      await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
    }
    await page.waitForSelector(".pv-table tbody tr", { timeout: 15000 });

    const label = theme ?? "system-default";
    check(`network(${label})`, attempted.length === 0, `attempted ${attempted.join(", ")}`);
    check(`pageerror(${label})`, errors.length === 0, errors.join(" | "));

    const rows = await page.locator(".pv-table tbody tr").count();
    check(`rows(${label})`, rows > 0, "no rows rendered");

    const stamp = await page.locator(".pv-stamp").first().textContent();
    check(`stamp(${label})`, (stamp ?? "").includes("snapshot of"), "no provenance stamp");

    const heat = await page.locator(".pv-heat-row, .pv-panel table tbody tr").count();
    check(`hot-lineage(${label})`, heat > 0, "hot-lineage panel rendered nothing");

    // The page body must never scroll horizontally; wide content scrolls inside
    // its own container. Measured, not inferred.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    check(`no-h-scroll(${label})`, overflow <= 1, `body overflows by ${overflow}px`);

    // A transparent body borrows the host's theme. Resolved, not asserted from
    // source: `light-dark()` only resolves once `color-scheme` is applied.
    const background = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    );
    check(
      `body-background(${label})`,
      background !== "" && background !== "rgba(0, 0, 0, 0)" && background !== "transparent",
      `body background resolved to ${background}`,
    );

    const font = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    check(`ds-font(${label})`, /IBM Plex/i.test(font), `font stack is ${font}`);

    console.error(`  ${label}: ${rows} rows, bg ${background}`);
    await context.close();
  }
} finally {
  await browser.close();
}

if (failures.length > 0) {
  console.error(`\nrender smoke: ${failures.length} failure(s)`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}
console.error("render smoke: ok");
