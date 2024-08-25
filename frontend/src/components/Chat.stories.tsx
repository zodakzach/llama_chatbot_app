import type { Meta, StoryObj } from "@storybook/react";
import Chat from "./Chat";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

const meta: Meta<typeof Chat> = {
  component: Chat,
  decorators: [
    (Story) => (
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <Story />
        </QueryClientProvider>
      </BrowserRouter>
    ),
  ],
} satisfies Meta<typeof Chat>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
