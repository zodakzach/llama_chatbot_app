import type { Meta, StoryObj } from '@storybook/react';

import ChatThreadList from './ChatThreadList';

const meta = {
  component: ChatThreadList,
} satisfies Meta<typeof ChatThreadList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};