import { useNavigate } from "react-router-dom"; // Import the navigate hook

const API_URL = import.meta.env.VITE_BACKEND_API_URL;

export const checkLoginStatus = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/auth/status/`, {
      method: "GET",
      credentials: "include", // Ensures cookies are sent with the request
    });

    if (response.ok) {
      const data = await response.json();
      return data.message === "User is logged in";
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error checking login status:", error);
    return false;
  }
};

interface LoginResponse {
  success: boolean;
  error?: string;
}

export const login = async (
  username: string,
  password: string,
): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_URL}/auth/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Make sure to include credentials
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      return { success: true }; // Login was successful
    } else {
      const data = await response.json();
      return { success: false, error: data.error || "Login failed" };
    }
  } catch (error) {
    return {
      success: false,
      error: "An error occurred while trying to log in",
    };
  }
};

export const logout = async (
  navigate: ReturnType<typeof useNavigate>,
): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/auth/logout/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Includes cookies (e.g., session ID)
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log(data.message); // Handle the successful logout message

    // Navigate to the homepage if logout is successful
    navigate("/");
  } catch (error) {
    console.error("Failed to log out:", error);
  }
};

interface RegisterResponse {
  success: boolean;
  message?: string;
  username?: string;
  email?: string;
  error?: string;
}

export const register = async (
  username: string,
  email: string,
  password: string,
): Promise<RegisterResponse> => {
  try {
    const response = await fetch(`${API_URL}/auth/register/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Make sure to include credentials
      body: JSON.stringify({ username, email, password }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: data.message,
        username: data.username,
        email: data.email,
      };
    } else if (response.status === 400) {
      const data = await response.json();
      return { success: false, error: data.error };
    } else if (response.status === 405) {
      return { success: false, error: "Method not allowed" };
    } else if (response.status === 429) {
      return { success: false, error: "Rate limit exceeded" };
    } else {
      return { success: false, error: "An unexpected error occurred" };
    }
  } catch (error) {
    return {
      success: false,
      error: "An error occurred while trying to register",
    };
  }
};
