// src/components/ProtectedRoute.tsx
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { checkLoginStatus } from "../api/auth"; // Import the function

interface ProtectedRouteProps {
  element: JSX.Element;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const verifyLogin = async () => {
      const isLoggedIn = await checkLoginStatus();
      setIsAuthenticated(isLoggedIn);
      setIsLoading(false);
    };

    verifyLogin();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>; // Replace with a spinner or a more complex loading component if needed
  }

  return isAuthenticated ? element : <Navigate to="/" replace />;
};

export default ProtectedRoute;
