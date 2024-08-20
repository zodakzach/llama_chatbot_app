import type { Meta, StoryObj } from '@storybook/react';

import { ChatProvider } from './ChatContext';

const meta = {
  component: ChatProvider,
} satisfies Meta<typeof ChatProvider>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: {}
  }
};