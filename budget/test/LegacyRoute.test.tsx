// @vitest-environment happy-dom
//
// Tests for <LegacyRoute> and its legacy-hydrate helpers.
//
// Coverage:
// 1. Async render + set-once: the render thunk resolves and its HTML appears
//    inside the <main id="app"> container.
// 2. Render-once invariant: re-rendering the parent with the same props does
//    NOT re-run the thunk or wipe the imperatively-attached DOM.
// 3. Hydrate-effect: runHydrationSpecs calls each hydrate fn with the matching
//    element; the error path (throwing hydrate) disables inputs and appends the
//    user-facing message.
//
// All page renderers and hydrateOnce are mocked — this suite tests wiring only.
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, waitFor, act } from "@testing-library/react";
import { useState } from "react";

// Stub hydrateOnce so it executes the hydrate fn and calls onError on throw —
// matching the real behaviour without requiring the router package's DOM env.
vi.mock("@commons-systems/router/hydrate", () => ({
  hydrateOnce(
    root: ParentNode,
    selector: string,
    hydrate: (el: HTMLElement) => void,
    onError?: (err: unknown, el: HTMLElement) => void,
  ) {
    const el = root.querySelector(selector) as HTMLElement | null;
    if (!el) return;
    try {
      hydrate(el);
    } catch (err) {
      if (onError) onError(err, el);
    }
  },
}));

// logError is a side-effect; stub it to keep test output clean.
vi.mock("@commons-systems/errorutil/log", () => ({
  logError: vi.fn(),
}));

// deferProgrammerError: for plain Error (kind "unknown") returns false so onError
// fires. Keep the real classify logic by checking manually here.
vi.mock("@commons-systems/errorutil/defer", () => ({
  deferProgrammerError: (err: unknown) => {
    // Mirrors classify: TypeError/ReferenceError → programmer → defer. Other
    // errors (including plain Error) → false.
    return err instanceof TypeError || err instanceof ReferenceError;
  },
}));

vi.mock("@commons-systems/errorutil/classify", () => ({
  classifyError: (err: unknown) => {
    if (err instanceof TypeError || err instanceof ReferenceError) return "programmer";
    if (err instanceof RangeError) return "range";
    if (err instanceof Error && err.name === "DataIntegrityError") return "data-integrity";
    return "unknown";
  },
}));

import { LegacyRoute } from "../src/LegacyRoute";

// ---------------------------------------------------------------------------
// 1. Async render + set-once
// ---------------------------------------------------------------------------

describe("LegacyRoute — async render", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the resolved HTML inside <main id='app'>", async () => {
    const renderFn = vi.fn().mockResolvedValue("<p>hello world</p>");
    const { container } = render(<LegacyRoute render={renderFn} specs={[]} />);

    const main = await waitFor(() => {
      const el = container.querySelector("main#app");
      if (!el || !el.innerHTML.includes("hello world")) throw new Error("not yet");
      return el;
    });

    expect(main).not.toBeNull();
    expect(main.innerHTML).toContain("hello world");
  });

  it("renders empty string when the thunk resolves null", async () => {
    const renderFn = vi.fn().mockResolvedValue(null);
    const { container } = render(<LegacyRoute render={renderFn} specs={[]} />);

    await waitFor(() => {
      // After resolution the main exists; null maps to ""
      const el = container.querySelector("main#app");
      if (!el) throw new Error("not yet");
    });

    const main = container.querySelector("main#app")!;
    expect(main.innerHTML).toBe("");
  });

  it("renders a formatted error message when the thunk throws", async () => {
    const renderFn = vi.fn().mockRejectedValue(new Error("network failure"));
    const { container } = render(<LegacyRoute render={renderFn} specs={[]} />);

    const main = await waitFor(() => {
      const el = container.querySelector("main#app");
      if (!el || !el.innerHTML.includes("<p>")) throw new Error("not yet");
      return el;
    });

    // A generic error → "Something went wrong" message
    expect(main.innerHTML).toContain("Something went wrong");
  });
});

// ---------------------------------------------------------------------------
// 2. Render-once invariant
// ---------------------------------------------------------------------------

describe("LegacyRoute — render-once invariant", () => {
  afterEach(() => {
    cleanup();
  });

  it("calls the render thunk exactly once even after a parent re-render", async () => {
    const renderFn = vi.fn().mockResolvedValue("<span id='hydrated-content'>content</span>");

    // A stateful parent that re-renders on demand.
    function Parent() {
      const [, setCount] = useState(0);
      return (
        <div>
          <button onClick={() => setCount((n) => n + 1)}>re-render</button>
          <LegacyRoute render={renderFn} specs={[]} />
        </div>
      );
    }

    const { container, getByRole } = render(<Parent />);

    // Wait for the async render to complete.
    await waitFor(() => {
      const main = container.querySelector("main#app");
      if (!main || !main.innerHTML.includes("hydrated-content")) throw new Error("not yet");
    });

    // Force the parent to re-render.
    await act(async () => {
      getByRole("button").click();
    });

    expect(renderFn).toHaveBeenCalledTimes(1);
  });

  it("imperatively-attached nodes survive a parent re-render", async () => {
    const renderFn = vi.fn().mockResolvedValue("<div id='container'>initial</div>");

    function Parent() {
      const [, setCount] = useState(0);
      return (
        <div>
          <button onClick={() => setCount((n) => n + 1)}>re-render</button>
          <LegacyRoute render={renderFn} specs={[]} />
        </div>
      );
    }

    const { container, getByRole } = render(<Parent />);

    // Wait for the HTML to be injected.
    await waitFor(() => {
      const main = container.querySelector("main#app");
      if (!main || !main.innerHTML.includes("container")) throw new Error("not yet");
    });

    // Imperatively attach a marker node into the hydrated subtree.
    const main = container.querySelector("main#app")!;
    const marker = document.createElement("span");
    marker.id = "imperative-marker";
    main.appendChild(marker);
    expect(main.querySelector("#imperative-marker")).not.toBeNull();

    // Trigger a parent re-render — React must NOT reconcile the
    // dangerouslySetInnerHTML subtree (it is set once and left alone).
    await act(async () => {
      getByRole("button").click();
    });

    // The imperatively-attached marker must still be in the DOM.
    expect(container.querySelector("#imperative-marker")).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 3. Hydrate-effect — happy path
// ---------------------------------------------------------------------------

describe("LegacyRoute — hydrate specs", () => {
  afterEach(() => {
    cleanup();
  });

  it("calls each hydrate fn once with the matching element after HTML mounts", async () => {
    const hydrate1 = vi.fn();
    const hydrate2 = vi.fn();

    const specs = [
      { selector: "#widget-a", hydrate: hydrate1 },
      { selector: "#widget-b", hydrate: hydrate2 },
    ];

    const renderFn = vi.fn().mockResolvedValue(
      '<div id="widget-a"></div><div id="widget-b"></div>',
    );

    render(<LegacyRoute render={renderFn} specs={specs} />);

    await waitFor(() => {
      if (hydrate1.mock.calls.length === 0) throw new Error("not yet");
    });

    expect(hydrate1).toHaveBeenCalledTimes(1);
    expect((hydrate1.mock.calls[0][0] as HTMLElement).id).toBe("widget-a");
    expect(hydrate2).toHaveBeenCalledTimes(1);
    expect((hydrate2.mock.calls[0][0] as HTMLElement).id).toBe("widget-b");
  });

  it("does not call hydrate fns before the HTML resolves", async () => {
    const hydrate1 = vi.fn();
    let resolve!: (html: string) => void;
    const renderFn = vi.fn().mockReturnValue(
      new Promise<string>((r) => { resolve = r; }),
    );

    render(<LegacyRoute render={renderFn} specs={[{ selector: "#x", hydrate: hydrate1 }]} />);

    // Hydrate must not fire while the promise is pending.
    expect(hydrate1).not.toHaveBeenCalled();

    await act(async () => { resolve('<div id="x"></div>'); });
    await waitFor(() => { if (!hydrate1.mock.calls.length) throw new Error("not yet"); });
    expect(hydrate1).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// 3b. Hydrate error path (legacy-hydrate.ts error UI)
// ---------------------------------------------------------------------------

describe("LegacyRoute — hydrate error path", () => {
  afterEach(() => {
    cleanup();
  });

  it("disables inputs and appends the errorLabel message when hydrate throws", async () => {
    const erroringHydrate = vi.fn().mockImplementation(() => {
      throw new Error("hydration failed"); // plain Error → kind "unknown"
    });

    const specs = [
      {
        selector: "#table",
        hydrate: erroringHydrate,
        errorLabel: "Budget table",
      },
    ];

    const renderFn = vi.fn().mockResolvedValue(
      '<div id="table"><input type="text"><select></select></div>',
    );

    const { container } = render(<LegacyRoute render={renderFn} specs={specs} />);

    // Wait for hydration to fire (and fail).
    await waitFor(() => {
      const el = container.querySelector("#table");
      if (!el || !el.querySelector("p")) throw new Error("error UI not yet appended");
    });

    const table = container.querySelector("#table")!;

    // Inputs and selects in the container must be disabled.
    const inputs = table.querySelectorAll("input, select");
    expect(inputs.length).toBeGreaterThan(0);
    for (const input of inputs) {
      expect((input as HTMLInputElement | HTMLSelectElement).disabled).toBe(true);
    }

    // The error message paragraph must be present and contain the errorLabel text.
    const msg = table.querySelector("p");
    expect(msg).not.toBeNull();
    expect(msg!.textContent).toContain("Budget table");
    expect(msg!.textContent).toContain("temporarily unavailable");
  });

  it("appends the generic message when hydrate throws without an errorLabel", async () => {
    const erroringHydrate = vi.fn().mockImplementation(() => {
      throw new Error("boom");
    });

    const specs = [{ selector: "#widget", hydrate: erroringHydrate }];
    const renderFn = vi.fn().mockResolvedValue('<div id="widget"><input></div>');
    const { container } = render(<LegacyRoute render={renderFn} specs={specs} />);

    await waitFor(() => {
      const el = container.querySelector("#widget");
      if (!el || !el.querySelector("p")) throw new Error("not yet");
    });

    const msg = container.querySelector("#widget p");
    expect(msg!.textContent).toContain("Editing is temporarily unavailable");
  });
});
