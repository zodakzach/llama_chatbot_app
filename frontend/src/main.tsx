import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ChatPage from "./pages/ChatPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
    errorElement: <NotFoundPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
    errorElement: <NotFoundPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
    errorElement: <NotFoundPage />,
  },
  {
    path: "/chat/*",
    element: (
      <QueryClientProvider client={queryClient}>
        <ProtectedRoute element={<ChatPage />} />
      </QueryClientProvider>
    ),
    errorElement: <NotFoundPage />,
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
