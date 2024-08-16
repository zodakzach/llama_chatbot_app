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
