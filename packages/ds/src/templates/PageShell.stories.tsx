import type { Meta, StoryObj } from "@storybook/react";
import { PageShell } from "./PageShell";

const meta: Meta<typeof PageShell> = {
  title: "Templates/PageShell",
  component: PageShell,
  // A full-page template must render full-bleed; the preview default is
  // layout: "centered", which would frame the page in a centered box.
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof PageShell>;

export const Default: Story = {
  args: {
    wordmark: "your.brand",
    tagline: "A short tagline for the page",
    navLinks: [
      { href: "/", label: "Home" },
      { href: "/about", label: "About" },
      { href: "/sign-in", label: "Sign in", align: "end" },
    ],
    current: "/",
    children: (
      <main>
        <h2>Welcome</h2>
        <p>This is the main content area rendered inside the page shell.</p>
      </main>
    ),
  },
};
