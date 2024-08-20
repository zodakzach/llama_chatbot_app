import type { Meta, StoryObj } from '@storybook/react';

import { useChatContext } from './ChatContext';

const meta = {
  component: useChatContext,
} satisfies Meta<typeof useChatContext>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {}
};