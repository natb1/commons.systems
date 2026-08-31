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
 * WHAT THIS DOES NOT ASSERT: the CONTENT of the baked snapshot. A store window
 * with no open tactics, or with no lineage in scope, is a legitimate state of
 * the graph — the queue being empty is a thing that happens, not a build
 * defect — and the page has explicit, designed empty states for both
 * (`No rows match the active filter.`, `No lineage in scope.`). Asserting a
 * positive row count made this smoke red on `main` for a store that rendered
 * exactly as designed. So each of the two regions is checked for reaching ONE
 * of its two legitimate rendered states, which still fails loudly when a region
 * renders NEITHER — the actual defect. Every other check here is about the
 * PAGE, not the store, and none of them is relaxed: the network check, the
 * pageerror check, the horizontal-overflow check, the resolved body background
 * and the DS font stack all hold whatever the store contains.
 *
 * TWO SNAPSHOTS, not one. Relaxing an assertion is only safe if the state it
 * used to reject is then genuinely exercised, so the smoke runs its whole loop
 * a second time over a copy of the built page whose baked `rows` array has been
 * emptied. That is the zero-row store, synthesized rather than waited for: it
 * cannot be produced on demand from the real graph, and until it was
 * synthesized here the empty states shipped completely unrendered. The copy is
 * derived from the REAL built payload with one field replaced, so it stays in
 * shape with `PageData` by construction — a drifted shape surfaces as a
 * pageerror on this pass rather than as a stale hand-written fixture that
 * quietly stops resembling the page.
 *
 * Environment: on this NixOS host the cached ms-playwright chromium CANNOT run
 * (it is a generic-linux dynamically linked executable). `DS_CHROMIUM_PATH`
 * pointing at the nix-patched chromium is REQUIRED, not a cache-miss fallback —
 * see `.design-sync/NOTES.md`. On CI's ubuntu runner the bundled browser works
 * and the variable is unset.
 *
 * Usage: render-smoke.mjs <file>
 */
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { chromium } from "playwright";

const file = process.argv[2];
if (file === undefined || !existsSync(file)) {
  console.error("usage: render-smoke.mjs <built artifact html>");
  process.exit(2);
}

const PAYLOAD_OPEN = '<script type="application/json" id="plan-view-payload">';

/**
 * Write a copy of the built page whose baked snapshot carries NO rows.
 *
 * Reads the real payload and replaces exactly one field, so the synthesized
 * page differs from the shipped one only in the way a genuinely empty store
 * window would. `rows: []` is enough to reach both empty states: `PlanTable`
 * renders its own note, and `hotLineage` derives its entries from those same
 * rows, so the panel renders its note too.
 *
 * The assembler escapes every `<` as its JSON unicode escape before embedding
 * (a literal `</script` would end the element whatever its type); JSON.parse
 * decodes that escape, and this re-applies it on the way back out.
 */
function writeEmptyStoreCopy(builtFile, intoDir) {
  const html = readFileSync(builtFile, "utf8");
  const start = html.indexOf(PAYLOAD_OPEN);
  if (start < 0) {
    throw new Error(`render-smoke: no ${PAYLOAD_OPEN} block in ${builtFile}`);
  }
  const from = start + PAYLOAD_OPEN.length;
  const end = html.indexOf("</script>", from);
  if (end < 0) {
    throw new Error(`render-smoke: the payload block in ${builtFile} is unterminated`);
  }
  const data = JSON.parse(html.slice(from, end));
  data.payload.rows = [];
  const serialized = JSON.stringify(data).replace(/</g, "\\u003c");
  const out = join(intoDir, "plan-view-empty-store.html");
  writeFileSync(out, html.slice(0, from) + serialized + html.slice(end));
  return out;
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

/** Run every check over one page file, across the three theme states. */
async function smoke(pageFile, snapshot) {
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
    await page.goto(`file://${resolve(pageFile)}`);
    if (theme !== null) {
      await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
    }
    // Readiness: the plan table has REACHED one of its two legitimate rendered
    // states — rows, or the designed empty note. Waiting on rows alone made a
    // zero-row store time out here and throw straight out of the loop, so the
    // page-level checks below never ran at all for any theme.
    //
    // Both selectors are `.pv-root >` children: `PlanTable` renders whichever
    // one it renders directly under the root, while the hot-lineage panel's own
    // table and its own `.pv-empty` sit inside `.pv-panel`. Unscoped, the
    // panel's empty note would satisfy this wait before the table had rendered
    // anything.
    await page.waitForSelector(".pv-root > .pv-table-scroll tbody tr, .pv-root > .pv-empty", {
      timeout: 15000,
    });

    const label = `${snapshot}/${theme ?? "system-default"}`;
    check(`network(${label})`, attempted.length === 0, `attempted ${attempted.join(", ")}`);
    check(`pageerror(${label})`, errors.length === 0, errors.join(" | "));

    // Exactly one of the two states, never neither and never both. A table that
    // renders no rows AND no empty note is a real defect (a crashed render, a
    // dropped mount) and still fails; a store that legitimately yields nothing
    // does not.
    const rows = await page.locator(".pv-root > .pv-table-scroll .pv-table tbody tr").count();
    const tableEmpty = await page.locator(".pv-root > .pv-empty").count();
    check(
      `plan-table(${label})`,
      (rows > 0) !== (tableEmpty > 0),
      `rows=${rows} empty-note=${tableEmpty}: the plan table rendered neither its rows nor its empty state (or both)`,
    );

    const stamp = await page.locator(".pv-stamp").first().textContent();
    check(`stamp(${label})`, (stamp ?? "").includes("snapshot of"), "no provenance stamp");

    // Same shape for the hot-lineage panel. "No lineage in scope" is what a
    // window whose rows carry no scoring ancestor legitimately renders.
    const heat = await page.locator(".pv-panel .pv-heat-row, .pv-panel table tbody tr").count();
    const heatEmpty = await page.locator(".pv-panel .pv-empty").count();
    check(
      `hot-lineage(${label})`,
      (heat > 0) !== (heatEmpty > 0),
      `heat-rows=${heat} empty-note=${heatEmpty}: the hot-lineage panel rendered neither its entries nor its empty state (or both)`,
    );

    // On the synthesized pass, pin the EXACT shape. The two checks above were
    // deliberately widened to tolerate an empty store, and a widened check is
    // only safe while something still proves the tolerated state renders the
    // way it is supposed to. Without this, deleting both empty-state elements
    // outright would go unnoticed on a page whose store happens to be full.
    if (snapshot === "empty-store") {
      check(
        `empty-state(${label})`,
        rows === 0 && tableEmpty === 1 && heat === 0 && heatEmpty === 1,
        `rows=${rows} table-empty-note=${tableEmpty} heat-rows=${heat} lineage-empty-note=${heatEmpty}` +
          " — a zero-row snapshot must render exactly one empty note in each region",
      );
    }

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

    console.error(
      `  ${label}: ${rows} rows${rows === 0 ? " (empty state)" : ""}, ` +
        `${heat} hot-lineage entries${heat === 0 ? " (empty state)" : ""}, bg ${background}`,
    );
    await context.close();
  }
}

const scratch = mkdtempSync(join(tmpdir(), "plan-view-smoke-"));
try {
  await smoke(file, "built");
  await smoke(writeEmptyStoreCopy(file, scratch), "empty-store");
} finally {
  await browser.close();
  rmSync(scratch, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error(`\nrender smoke: ${failures.length} failure(s)`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}
console.error("render smoke: ok");
