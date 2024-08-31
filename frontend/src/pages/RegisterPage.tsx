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
      <form
        className="flex w-1/3 flex-col items-center space-y-4 rounded-lg bg-secondary/10 shadow-lg"
        onSubmit={handleSubmit}
      >
        <h2 className="py-4 text-2xl font-bold text-text">Register</h2>
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
        <button
          type="submit"
          className="rounded-lg bg-blue-600 p-2 font-semibold text-text hover:bg-blue-500"
        >
          Register
        </button>
        <div className="flex justify-between p-4">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="mr-5 rounded-lg bg-secondary/20 p-2 text-text hover:bg-secondary/30"
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="rounded-lg bg-secondary/20 p-2 text-text hover:bg-secondary/30"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterPage;
