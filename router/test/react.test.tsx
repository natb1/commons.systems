import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useLocation, navigate, Link } from "../src/react";

// React 18 requires this flag when driving createRoot + act manually (without
// @testing-library/react, which normally sets it). Without it React emits "The
// current testing environment is not configured to support act(...)".
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("react surface", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    history.pushState({}, "", "/");
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  describe("useLocation", () => {
    function LocationDisplay() {
      const { path } = useLocation();
      return <span data-testid="path">{path}</span>;
    }

    it("re-renders on navigate", () => {
      act(() => {
        root.render(<LocationDisplay />);
      });
      expect(container.textContent).toBe("/");

      act(() => {
        navigate("/about");
      });
      expect(container.textContent).toBe("/about");
    });

    it("re-renders on popstate", () => {
      act(() => {
        root.render(<LocationDisplay />);
      });
      expect(container.textContent).toBe("/");

      act(() => {
        history.pushState({}, "", "/x");
        window.dispatchEvent(new PopStateEvent("popstate"));
      });
      expect(container.textContent).toBe("/x");
    });
  });

  describe("Link", () => {
    it("renders the correct href and forwards className/children", () => {
      act(() => {
        root.render(
          <Link href="/about" className="nav-link">
            About
          </Link>,
        );
      });
      const a = container.querySelector("a");
      expect(a).not.toBeNull();
      expect(a!.getAttribute("href")).toBe("/about");
      expect(a!.className).toBe("nav-link");
      expect(a!.textContent).toBe("About");
    });

    it("intercepts a plain left-click and navigates client-side", () => {
      const pushStateSpy = vi.spyOn(history, "pushState");
      try {
        act(() => {
          root.render(
            <div>
              <Link href="/about">About</Link>
              <span data-testid="loc">
                <Location />
              </span>
            </div>,
          );
        });

        const a = container.querySelector("a")!;
        act(() => {
          a.click();
        });

        expect(pushStateSpy).toHaveBeenCalledWith({}, "", "/about");
        expect(location.pathname).toBe("/about");
        // A sibling useLocation consumer updated → client-side nav, no reload.
        expect(container.querySelector("[data-testid='loc']")!.textContent).toBe("/about");
      } finally {
        pushStateSpy.mockRestore();
      }
    });

    // Interception matrix mirrored from the vanilla router tests. Each case must
    // bail: no client navigation, history.pushState NOT called, default not
    // prevented (the browser keeps native behavior).
    it("does not intercept a modified (meta-key) click", () => {
      const pushStateSpy = vi.spyOn(history, "pushState");
      try {
        act(() => {
          root.render(<Link href="/about">About</Link>);
        });
        const a = container.querySelector("a")!;

        let notPrevented = false;
        act(() => {
          const evt = new MouseEvent("click", {
            button: 0,
            metaKey: true,
            bubbles: true,
            cancelable: true,
          });
          notPrevented = a.dispatchEvent(evt);
        });

        expect(notPrevented).toBe(true);
        expect(pushStateSpy).not.toHaveBeenCalled();
      } finally {
        pushStateSpy.mockRestore();
      }
    });

    it("does not intercept a middle-button click", () => {
      const pushStateSpy = vi.spyOn(history, "pushState");
      try {
        act(() => {
          root.render(<Link href="/about">About</Link>);
        });
        const a = container.querySelector("a")!;

        let notPrevented = false;
        act(() => {
          const evt = new MouseEvent("click", {
            button: 1,
            bubbles: true,
            cancelable: true,
          });
          notPrevented = a.dispatchEvent(evt);
        });

        expect(notPrevented).toBe(true);
        expect(pushStateSpy).not.toHaveBeenCalled();
      } finally {
        pushStateSpy.mockRestore();
      }
    });

    // For the "bails to native" cases below, `.click()` lets happy-dom follow
    // the anchor and mutate `location.pathname` natively — that mutation is
    // exactly the native behavior we are NOT preventing. So the discriminating
    // signal is that `<Link>` did not call `history.pushState` (no client-side
    // React navigation) and did not prevent the event default. We dispatch a
    // cancelable click and assert its return value (true = default not
    // prevented).
    const expectNativeClick = (a: HTMLAnchorElement): boolean => {
      let notPrevented = false;
      act(() => {
        const evt = new MouseEvent("click", {
          button: 0,
          bubbles: true,
          cancelable: true,
        });
        notPrevented = a.dispatchEvent(evt);
      });
      return notPrevented;
    };

    it("does not intercept a link with a download attribute", () => {
      const pushStateSpy = vi.spyOn(history, "pushState");
      try {
        act(() => {
          root.render(
            <Link href="/about" download="">
              About
            </Link>,
          );
        });
        const a = container.querySelector("a")!;
        const notPrevented = expectNativeClick(a);
        expect(notPrevented).toBe(true);
        expect(pushStateSpy).not.toHaveBeenCalled();
      } finally {
        pushStateSpy.mockRestore();
      }
    });

    it("does not intercept a link with a target attribute", () => {
      const pushStateSpy = vi.spyOn(history, "pushState");
      try {
        act(() => {
          root.render(
            <Link href="/about" target="_blank">
              About
            </Link>,
          );
        });
        const a = container.querySelector("a")!;
        const notPrevented = expectNativeClick(a);
        expect(notPrevented).toBe(true);
        expect(pushStateSpy).not.toHaveBeenCalled();
      } finally {
        pushStateSpy.mockRestore();
      }
    });

    it("does not intercept an external href", () => {
      const pushStateSpy = vi.spyOn(history, "pushState");
      try {
        act(() => {
          root.render(<Link href="https://external.com/page">Ext</Link>);
        });
        const a = container.querySelector("a")!;
        const notPrevented = expectNativeClick(a);
        expect(notPrevented).toBe(true);
        expect(pushStateSpy).not.toHaveBeenCalled();
      } finally {
        pushStateSpy.mockRestore();
      }
    });

    it("does not intercept a protocol-relative href", () => {
      const pushStateSpy = vi.spyOn(history, "pushState");
      try {
        act(() => {
          root.render(<Link href="//external.com/path">PR</Link>);
        });
        const a = container.querySelector("a")!;
        const notPrevented = expectNativeClick(a);
        expect(notPrevented).toBe(true);
        expect(pushStateSpy).not.toHaveBeenCalled();
      } finally {
        pushStateSpy.mockRestore();
      }
    });

    it("respects a consumer onClick that prevents default", () => {
      const pushStateSpy = vi.spyOn(history, "pushState");
      try {
        act(() => {
          root.render(
            <Link href="/about" onClick={(e) => e.preventDefault()}>
              About
            </Link>,
          );
        });
        const a = container.querySelector("a")!;
        act(() => {
          a.click();
        });
        expect(pushStateSpy).not.toHaveBeenCalled();
        expect(location.pathname).toBe("/");
      } finally {
        pushStateSpy.mockRestore();
      }
    });
  });
});

function Location() {
  const { path } = useLocation();
  return <>{path}</>;
}
