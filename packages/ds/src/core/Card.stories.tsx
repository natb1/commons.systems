import type { AnchorHTMLAttributes } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "./Card";

const meta: Meta<typeof Card> = {
  title: "Core/Card",
  component: Card,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    children: "Card content goes here.",
  },
};

export const Interactive: Story = {
  args: {
    interactive: true,
    children: "Click me — I am interactive.",
  },
};

const anchorProps: AnchorHTMLAttributes<HTMLAnchorElement> = { href: "#" };

export const AsLink: Story = {
  render: () => (
    <Card as="a" interactive {...anchorProps}>
      Link card — rendered as an &lt;a&gt; element.
    </Card>
  ),
};
