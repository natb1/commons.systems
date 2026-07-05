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

export const WithMediaAndOverflow: Story = {
  args: {
    headline: "Build with the template. Ship faster.",
    subline: "Cards with optional media slots and an overflow disclosure.",
    ctas: [{ label: "Get started", href: "#" }],
    cards: [
      {
        name: "App one",
        problem: "Primary card with a media slot.",
        href: "#",
        media: (
          <img
            src="https://placehold.co/400x200/e8943a/fff?text=App+one"
            alt="App one screenshot"
          />
        ),
      },
      {
        name: "App two",
        problem: "Another primary card with a media slot.",
        href: "#",
        media: (
          <img
            src="https://placehold.co/400x200/333/fff?text=App+two"
            alt="App two screenshot"
          />
        ),
      },
      {
        name: "App three",
        problem: "Third primary card without media.",
        href: "#",
      },
    ],
    overflow: [
      {
        name: "App four",
        problem: "An overflow card with media.",
        href: "#",
        media: (
          <img
            src="https://placehold.co/400x200/555/fff?text=App+four"
            alt="App four screenshot"
          />
        ),
      },
      {
        name: "App five",
        problem: "Another overflow card without media.",
        href: "#",
      },
    ],
    overflowLabel: "show more…",
  },
};
