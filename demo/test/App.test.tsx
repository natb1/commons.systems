// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";

import { App } from "../src/App";

describe("App", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the demo heading and a plain-language description mentioning the notes board", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Demo" })).not.toBeNull();
    expect(
      screen.getByText(/demo firebase saas app used to exercise commons\.systems/i),
    ).not.toBeNull();
    expect(screen.getByText(/notes board/i)).not.toBeNull();
  });
});
