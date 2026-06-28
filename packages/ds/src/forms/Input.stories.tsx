import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./Input";

const meta: Meta<typeof Input> = {
  title: "Forms/Input",
  component: Input,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Input>;

export const Bare: Story = {
  args: {
    placeholder: "Enter text…",
  },
};

export const WithLabel: Story = {
  args: {
    label: "Email",
    placeholder: "you@example.com",
    type: "email",
  },
};

export const WithHelper: Story = {
  args: {
    label: "Username",
    helper: "Letters and numbers only, 3–20 characters.",
    placeholder: "your_handle",
  },
};

export const WithError: Story = {
  args: {
    label: "Password",
    error: "Must be at least 8 characters.",
    placeholder: "••••••••",
    type: "password",
  },
};

export const Disabled: Story = {
  args: {
    label: "Account ID",
    value: "acct_1234",
    disabled: true,
  },
};

export const Search: Story = {
  args: {
    type: "search",
    placeholder: "Search…",
  },
};
