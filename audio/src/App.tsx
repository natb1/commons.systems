import { createRoot } from "react-dom/client";

export function App() {
  return <div id="react-smoke">audio</div>;
}

export function mountSmoke(el: HTMLElement) {
  createRoot(el).render(<App />);
}
