import type { Meta, StoryObj } from '@storybook/react';

import DropdownButton from './DropdownButton';

const meta = {
  component: DropdownButton,
} satisfies Meta<typeof DropdownButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [],
    triggerContent: {}
  }
};