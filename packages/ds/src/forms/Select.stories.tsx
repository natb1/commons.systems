import type { Meta, StoryObj } from "@storybook/react";
import { Select } from "./Select";

const meta: Meta<typeof Select> = {
  title: "Forms/Select",
  component: Select,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Select>;

export const WithLabel: Story = {
  args: {
    label: "Country",
    options: ["United States", "Canada", "United Kingdom"],
  },
};

export const WithObjectOptions: Story = {
  args: {
    label: "Priority",
    options: [
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" },
    ],
  },
};

export const WithError: Story = {
  args: {
    label: "Role",
    options: ["Viewer", "Editor", "Admin"],
    error: "You must select a role.",
  },
};

export const Disabled: Story = {
  args: {
    label: "Region",
    options: ["us-central1", "us-east1", "europe-west1"],
    disabled: true,
  },
};
