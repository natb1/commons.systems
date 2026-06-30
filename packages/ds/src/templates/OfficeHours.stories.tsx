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
