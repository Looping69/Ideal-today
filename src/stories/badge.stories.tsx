// [build] library: 'shadcn'
import * as React from "react";
import { Badge } from "../components/ui/badge";

const meta = {
  title: "ui/Badge",
  component: Badge,
  tags: ["autodocs"],
  argTypes: {},
};
export default meta;

export const Base = {
  render: (args: React.ComponentProps<typeof Badge>) => <Badge {...args}>Badge</Badge>,
  args: {},
};
export const Secondary = {
  render: (args: React.ComponentProps<typeof Badge>) => <Badge variant="secondary" {...args}>Secondary</Badge>,
  args: {
    variant: "secondary",
  },
};
export const Outline = {
  render: (args: React.ComponentProps<typeof Badge>) => <Badge variant="outline" {...args}>Outline</Badge>,
  args: {
    variant: "outline",
  },
};
export const Destructive = {
  render: (args: React.ComponentProps<typeof Badge>) => <Badge variant="destructive" {...args}>Destructive</Badge>,
  args: {
    variant: "destructive",
  },
};
