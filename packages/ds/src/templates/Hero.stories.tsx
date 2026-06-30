import type { Meta, StoryObj } from "@storybook/react";
import { Hero } from "./Hero";

const meta: Meta<typeof Hero> = {
  title: "Templates/Hero",
  component: Hero,
  // The hero band renders full-bleed as an in-page section.
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof Hero>;

export const Default: Story = {
  args: {
    headline: "Build with the template. Ship faster.",
    subline: "A one-line promise that expands on the headline.",
    ctas: [
      { label: "Get started", href: "#" },
      { label: "Learn more", href: "#" },
    ],
    cards: [
      { name: "App one", problem: "A one-line description of the problem this app solves.", href: "#" },
      { name: "App two", problem: "Another short line describing what this card is for.", href: "#" },
      { name: "App three", problem: "Boilerplate copy that keeps the third card balanced.", href: "#" },
    ],
  },
};
