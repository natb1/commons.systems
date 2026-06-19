// Imperative chart island for the category Sankey. Renders the #sankey-controls
// fieldset/labels and the #category-sankey placeholder in JSX (same ids/classes
// as the legacy renderCategorySankey markup, minus the <script> JSON blob), then
// builds the SVG imperatively in an effect via buildCategorySankey.
//
// The serialized chart data flows in as a PROP (not a DOM blob): the effect calls
// the arg-based chart core, which wires the controls, the scroll-append listener,
// and a ResizeObserver, and returns a teardown. Returning that teardown from the
// effect is the #1267 stale-listener fix — React runs it before re-running the
// effect or on unmount, so listeners never accumulate.
import { useEffect, useRef } from "react";
import { buildCategorySankey, type SerializedChartTransaction } from "./home-chart.js";

export interface CategorySankeyProps {
  chartData: SerializedChartTransaction[];
  categoryOptions: string[];
  budgetOptions: string[];
}

export function CategorySankey({ chartData, categoryOptions, budgetOptions }: CategorySankeyProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // buildCategorySankey reads the control elements (#sankey-controls and its
    // inputs) via document.getElementById; they are rendered as siblings above,
    // so they exist by the time this effect runs.
    return buildCategorySankey(container, chartData, categoryOptions, budgetOptions);
    // chartData/options are captured at mount; the page is re-keyed per navEpoch,
    // so a data transition re-mounts this island with fresh props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div id="sankey-controls">
        <fieldset id="sankey-mode">
          <label><input type="radio" name="sankey-mode" value="spending" defaultChecked /> Spending</label>
          <label><input type="radio" name="sankey-mode" value="credits" /> Credits</label>
        </fieldset>
        <label id="unbudgeted-toggle"><input type="checkbox" id="sankey-unbudgeted" /> Unbudgeted only</label>
        <label id="card-payment-toggle"><input type="checkbox" id="sankey-card-payment" /> Show card payments</label>
        <label id="category-filter-label">Category: <input type="text" id="sankey-category-filter" data-autocomplete="" /></label>
        <label id="budget-filter-label">Budget: <input type="text" id="sankey-budget-filter" data-autocomplete="" /></label>
        <label>Weeks: <input type="number" id="sankey-weeks" defaultValue="12" min="1" max="104" /></label>
        <label>Ending week: <input type="range" id="sankey-end-week" /> <span id="sankey-end-label"></span></label>
      </div>
      <div id="category-sankey" ref={containerRef}></div>
    </>
  );
}
