// React port of the pace-position panel (pace-position-panel.ts). The core
// renderPacePositionPanel is an imperative Observable Plot core that builds a
// detached section.capacity-pace element (the PACE heading, the W(x) backdrop +
// per-week trails + "now" dot chart, the ahead/behind delta text, and the
// legend) from a UsageSample array. The core stays untouched — this component
// wraps it as a chart island: an effect appends the core's element into a ref'd
// <div> and returns a teardown that empties it, so React removes the prior
// render before re-running on a data change or on unmount. Empty-state is
// delegated to the core (it renders its own heading + .empty paragraph).
import { useEffect, useRef } from "react";
import { type UsageSample } from "../usage-samples.js";
import { renderPacePositionPanel } from "../pace-position-panel.js";

export interface PacePanelProps {
  samples: UsageSample[];
}

export function PacePanel({ samples }: PacePanelProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    host.appendChild(renderPacePositionPanel(samples));
    return () => {
      host.replaceChildren();
    };
  }, [samples]);

  return <div ref={ref} />;
}
