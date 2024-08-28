import React, { useState } from "react";
import { register } from "../api/auth"; // Import the register function
import { useNavigate } from "react-router-dom";

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await register(username, email, password);

    if (result.success) {
      // Handle successful registration (e.g., redirect to login page)
      navigate("/login");
    } else {
      setError(result.error ?? "An unexpected error occurred"); // Provide a fallback string
    }
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <form className="space-y-4"
      onSubmit={handleSubmit}>
        <h2 className="mb-4 text-2xl text-text">Register</h2>
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
          <label htmlFor="email" className="mb-1 block text-text">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
        <button type="submit" className="rounded bg-blue-500 p-2 text-text">
          Register
        </button>
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="rounded bg-secondary/20 p-2 text-text"
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="rounded bg-secondary/20 p-2 text-text"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterPage;