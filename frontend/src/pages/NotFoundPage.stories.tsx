import { Meta, StoryObj } from "@storybook/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import NotFoundPage from "./NotFoundPage";

// Create a memory router for Storybook
const router = createMemoryRouter(
  [
    {
      path: "*",
      element: <NotFoundPage />,
    },
  ],
  {
    initialEntries: ["/some-non-existent-page"], // Adjust the path as needed
  },
);

const meta: Meta<typeof NotFoundPage> = {
  component: NotFoundPage,
  decorators: [(Story) => <RouterProvider router={router} />],
  title: "Pages/NotFoundPage",
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
