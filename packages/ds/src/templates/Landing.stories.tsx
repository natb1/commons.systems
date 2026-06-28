import type { Meta, StoryObj } from "@storybook/react";
import { Landing } from "./Landing";

const meta: Meta<typeof Landing> = {
  title: "Templates/Landing",
  component: Landing,
  // A full-page template must render full-bleed; the preview default is
  // layout: "centered", which would frame the page in a centered box.
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Landing>;

export const Default: Story = {};
