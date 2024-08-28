import React from 'react';
import ollama_icon from "../assets/images/ollama_icon.png";
import { useNavigate } from 'react-router-dom';

function LandingPage() {
    const navigate = useNavigate();

    const handleLoginClick = () => {
        navigate('/login');
    };
    const handleRegisterClick = () => {
        navigate('/register');
    };

  return (
    <div className='flex flex-col items-center justify-center h-screen'>
    <img src={ollama_icon} className='rounded-full'/>
    <h1 className='text-text text-7xl font-bold p-5'>Llama Chat</h1>
    <p className='text-text text-lg text-center w-1/2 md:w-1/2 '>
        Chat with Llama Bot, a conversational AI powered by the Meta LLaMA 3.1-8B model.
        Ask me anything, from general knowledge to fun conversations.
    </p>
    <div className='flex justify-center p-5 md:w-1/4 '>
        <button 
            className='text-text bg-secondary/20 rounded-full p-5 mr-5 font-semibold w-1/2'
            onClick={handleLoginClick}
        >
            Login
        </button>
        <button 
        className='text-text bg-blue-600 rounded-full p-5 font-bold w-1/2'
        onClick={handleRegisterClick}
        >
            Sign Up
        </button>
    </div>
    </div>
  );
}

export default LandingPage;