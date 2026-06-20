// Imperative hero island. Mounts the hero ONCE via mountHero (mirrors the legacy
// module-top-level `mountHero(heroContainer, renderHero)` at main.ts:49). The
// wrapper keeps id="hero-container" and the content-grid class so existing CSS /
// markup expectations hold; visibility is toggled by App via the `hidden` prop
// (mirrors main.ts:151 `heroContainer.hidden = next.source === "local"`). The
// element is mounted unconditionally and only hidden, exactly as the legacy code
// did, so the hero never re-mounts on state changes.
import { useEffect, useRef } from "react";
import { mountHero } from "@commons-systems/components/hero";
import { renderHero } from "./pages/hero.js";

export function Hero({ hidden }: { hidden: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    if (ref.current) mountHero(ref.current, renderHero);
  }, []);

  return <div id="hero-container" className="content-grid" ref={ref} hidden={hidden} />;
}
