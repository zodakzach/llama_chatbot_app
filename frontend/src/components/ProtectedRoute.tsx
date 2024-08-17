// src/components/ProtectedRoute.tsx
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { checkLoginStatus } from "../api/auth"; // Import the function
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface ProtectedRouteProps {
  element: JSX.Element;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const queryClient = useQueryClient();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // Local state for checking authentication

  const {
    data: isLoggedIn,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["checkLoginStatus"],
    queryFn: checkLoginStatus,
    // Optional: Control when to refetch (e.g., only on window focus or component mount)
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!isLoading) {
      if (isLoggedIn !== undefined) {
        console.log("Updating authentication status:", isLoggedIn);
        setIsAuthenticated(isLoggedIn);
      } else {
        setIsAuthenticated(false); // Default to false if undefined
      }
      setIsCheckingAuth(false); // Authentication check is complete
    }
  }, [isLoggedIn, isLoading]);

  if (isLoading || isCheckingAuth) {
    return <div>Loading...</div>; // Replace with a spinner or a more complex loading component if needed
  }

  if (error) {
    return <div>Error verifying login status</div>;
  }

  return isAuthenticated ? element : <Navigate to="/" replace />;
};

export default ProtectedRoute;
