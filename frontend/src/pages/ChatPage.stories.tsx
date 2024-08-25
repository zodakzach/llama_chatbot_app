import type { Meta, StoryObj } from "@storybook/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ChatPage from "./ChatPage";
import NotFoundPage from "./NotFoundPage";

const queryClient = new QueryClient();

const router = createMemoryRouter(
  [
    {
      path: "/chat/*",
      element: (
        <QueryClientProvider client={queryClient}>
          <ChatPage />
        </QueryClientProvider>
      ),
      errorElement: <NotFoundPage />,
    },
  ],
  {
    initialEntries: ["/chat/new"],
  },
);

const meta: Meta<typeof ChatPage> = {
  component: ChatPage,
  decorators: [(Story) => <RouterProvider router={router} />],
} satisfies Meta<typeof ChatPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
