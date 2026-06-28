import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox } from "./Checkbox";

const meta: Meta<typeof Checkbox> = {
  title: "Forms/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  args: {
    label: "Accept terms and conditions",
  },
};

export const Checked: Story = {
  args: {
    label: "Remember me",
    checked: true,
    readOnly: true,
  },
};

export const Radio: Story = {
  args: {
    type: "radio",
    label: "Option A",
  },
};

export const Disabled: Story = {
  args: {
    label: "Notifications (unavailable)",
    disabled: true,
  },
};
