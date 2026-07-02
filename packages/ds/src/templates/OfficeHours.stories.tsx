import type { Meta, StoryObj } from "@storybook/react";
import { OfficeHours } from "./OfficeHours";

const meta: Meta<typeof OfficeHours> = {
  title: "Templates/OfficeHours",
  component: OfficeHours,
  // A full-page template must render full-bleed; the preview default is
  // layout: "centered", which would frame the page in a centered box.
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof OfficeHours>;

// The two pages of the one office-hours template, selected by the `page` prop —
// the Status/Other split the app's nav header exposes.
export const Status: Story = { args: { page: "status" } };
export const Other: Story = { args: { page: "other" } };

// The Status page with a budget preselected, so the context panel renders the
// BudgetPaceChart without a click — the design-surface view of the pace chart.
export const StatusBudgetSelected: Story = {
  args: { page: "status", defaultSelectedBudget: "weekly-tokens" },
};
