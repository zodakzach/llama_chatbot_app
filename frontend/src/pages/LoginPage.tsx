import React, { useState } from "react";
import { login } from "../api/auth"; // Import the login function
import { useNavigate } from "react-router-dom";

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login(username, password);

    if (result.success) {
      // Handle successful login (e.g., redirect to another page)
      navigate("/chat");
      // Redirect
    } else {
      setError(result.error ?? "An unexpected error occurred"); // Provide a fallback string
    }
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <form onSubmit={handleSubmit} className="space-y-4 bg-secondary/10 rounded-lg w-1/3 flex flex-col items-center">
        <h2 className="py-4 text-2xl text-text font-bold">Login</h2>
        {error && <div className="mb-4 text-red-500">{error}</div>}
        <div>
          <label htmlFor="username" className="mb-1 block text-text">
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="rounded border border-gray-300 p-2"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-text">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded border border-gray-300 p-2"
            required
          />
        </div>
        <button type="submit" className="rounded-lg bg-blue-600 p-2 text-text hover:bg-blue-500 font-semibold">
          Login
        </button>
        <div className="flex justify-between p-4">
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="rounded-lg bg-secondary/20 p-2 text-text mr-5 hover:bg-secondary/30"
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="rounded-lg bg-secondary/20 p-2 text-text hover:bg-secondary/30"
          >
            Back
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
