// [build] library: 'shadcn'
import * as React from "react";
import { Loader2, Mail } from "lucide-react";

import { Button } from "../components/ui/button";

const meta = {
  title: "ui/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {},
};
export default meta;

export const Base = {
  render: (args: React.ComponentProps<typeof Button>) => <Button {...args}>Button</Button>,
  args: {},
};
export const Outline = {
  render: (args: React.ComponentProps<typeof Button>) => <Button {...args}>Button</Button>,
  args: {
    variant: "outline",
  },
};
export const Ghost = {
  render: (args: React.ComponentProps<typeof Button>) => <Button {...args}>Button</Button>,
  args: {
    variant: "ghost",
  },
};
export const Secondary = {
  render: (args: React.ComponentProps<typeof Button>) => <Button {...args}>Button</Button>,
  args: {
    variant: "secondary",
  },
};
export const Link = {
  render: (args: React.ComponentProps<typeof Button>) => <Button {...args}>Button</Button>,
  args: {
    variant: "link",
  },
};
export const Loading = {
  render: (args: React.ComponentProps<typeof Button>) => (
    <Button {...args}>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Button
    </Button>
  ),
  args: {
    variant: "outline",
  },
};
export const WithIcon = {
  render: (args: React.ComponentProps<typeof Button>) => (
    <Button {...args}>
      <Mail className="mr-2 h-4 w-4" /> Login with Email Button
    </Button>
  ),
  args: {
    variant: "secondary",
  },
};
