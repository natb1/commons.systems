import type { PageData } from "../model.js";

/**
 * The baked snapshot, read from the JSON block the page assembler emits.
 *
 * Carried in a `<script type="application/json">` element rather than inlined
 * into the JS bundle: the data stays readable in the published file (a reviewer
 * can see exactly what was baked), and the assembler needs no esbuild plugin to
 * splice it in. `application/json` is not executable, so the CSP treats it as
 * data, not script.
 */
function readPageData(): PageData {
  const element = document.getElementById("plan-view-payload");
  if (element === null || element.textContent === null) {
    throw new Error("plan-view: #plan-view-payload missing — the page assembler did not emit it");
  }
  return JSON.parse(element.textContent) as PageData;
}

export const pageData: PageData = readPageData();
