import type { Meta, StoryObj } from '@storybook/react';

import ChatPage from './ChatPage';

const meta = {
  component: ChatPage,
} satisfies Meta<typeof ChatPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {}
};