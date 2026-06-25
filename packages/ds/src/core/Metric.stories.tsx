import type { Meta, StoryObj } from "@storybook/react";
import { Metric } from "./Metric";

const meta: Meta<typeof Metric> = {
  title: "Core/Metric",
  component: Metric,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Metric>;

export const Default: Story = {
  args: {
    label: "Issues Open",
    value: "42",
  },
};

export const WithFavorableDelta: Story = {
  args: {
    label: "PRs Merged",
    value: "128",
    delta: "+12 this week",
    deltaTone: "favorable",
  },
};

export const WithUnfavorableDelta: Story = {
  args: {
    label: "Backlog",
    value: "87",
    delta: "+5 since last week",
    deltaTone: "unfavorable",
  },
};
