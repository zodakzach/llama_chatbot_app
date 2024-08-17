import React, { useState } from "react";
import { login } from "../api/auth"; // Import the login function
import { useNavigate } from "react-router-dom";

const HomePage: React.FC = () => {
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="mb-4 text-2xl">Login</h2>
        {error && <div className="mb-4 text-red-500">{error}</div>}
        <div>
          <label htmlFor="username" className="mb-1 block">
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
          <label htmlFor="password" className="mb-1 block">
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
        <button type="submit" className="rounded bg-blue-500 p-2 text-white">
          Login
        </button>
      </form>
    </div>
  );
};

export default HomePage;
