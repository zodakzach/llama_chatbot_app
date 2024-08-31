import React from "react";
import ollama_icon from "../assets/images/ollama_icon.png";
import { useNavigate } from "react-router-dom";

function LandingPage() {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate("/login");
  };
  const handleRegisterClick = () => {
    navigate("/register");
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <img src={ollama_icon} className="rounded-full" />
      <h1 className="p-5 text-7xl font-bold text-text">Llama Chat</h1>
      <p className="w-1/2 text-center text-lg text-text md:w-1/2">
        Chat with Llama Bot, a conversational AI powered by the Meta LLaMA
        3.1-8B model. Ask me anything, from general knowledge to fun
        conversations.
      </p>
      <div className="flex justify-center p-5 md:w-1/4">
        <button
          className="mr-5 w-1/2 rounded-full bg-secondary/20 p-5 font-semibold text-text hover:bg-secondary/30"
          onClick={handleLoginClick}
        >
          Login
        </button>
        <button
          className="w-1/2 rounded-full bg-blue-600 p-5 font-bold text-text hover:bg-blue-500"
          onClick={handleRegisterClick}
        >
          Sign Up
        </button>
      </div>
    </div>
  );
}

export default LandingPage;
