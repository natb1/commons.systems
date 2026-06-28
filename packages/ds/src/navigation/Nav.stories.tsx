import type { Meta, StoryObj } from "@storybook/react";
import { Nav } from "./Nav";

const meta: Meta<typeof Nav> = {
  title: "Navigation/Nav",
  component: Nav,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Nav>;

export const WithLinks: Story = {
  args: {
    links: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/issues", label: "Issues" },
      { href: "/settings", label: "Settings" },
    ],
  },
};

export const WithCurrent: Story = {
  args: {
    links: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/issues", label: "Issues" },
      { href: "/settings", label: "Settings" },
    ],
    current: "/issues",
  },
};

export const EndOnly: Story = {
  render: () => (
    <Nav links={[]} end={<span>Sign in</span>} />
  ),
};
