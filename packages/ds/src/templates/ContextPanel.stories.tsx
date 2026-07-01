import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ContextPanel, ContextPanelToggle } from "./ContextPanel";

const meta: Meta<typeof ContextPanel> = {
  title: "Templates/ContextPanel",
  component: ContextPanel,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof ContextPanel>;

const PANEL_CONTENT = (
  <section>
    <h3>Resources</h3>
    <ul>
      <li><a href="#">Getting started</a></li>
      <li><a href="#">Guides</a></li>
      <li><a href="#">API reference</a></li>
    </ul>
  </section>
);

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div className="page">
        <header>
          <h1>your.brand</h1>
          <ContextPanelToggle
            open={open}
            onToggle={() => setOpen((o) => !o)}
            controls="story-context-panel"
          />
        </header>
        <div className="content-grid">
          <main>
            <h2>Main content</h2>
            <p>
              The context panel sits in the right grid column — sticky on the wide
              layout, a toggle-collapsible overlay on the narrow layout.
            </p>
          </main>
          <ContextPanel open={open} id="story-context-panel" aria-label="Context">
            {PANEL_CONTENT}
          </ContextPanel>
        </div>
      </div>
    );
  },
};
