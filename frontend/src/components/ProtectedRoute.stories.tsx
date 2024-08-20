import type { Meta, StoryObj } from '@storybook/react';

import ProtectedRoute from './ProtectedRoute';

const meta = {
  component: ProtectedRoute,
} satisfies Meta<typeof ProtectedRoute>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {}
};