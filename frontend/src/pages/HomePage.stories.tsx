import type { Meta, StoryObj } from "@storybook/react";

import HomePage from "./LoginPage";

const meta = {
  component: HomePage,
} satisfies Meta<typeof HomePage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
