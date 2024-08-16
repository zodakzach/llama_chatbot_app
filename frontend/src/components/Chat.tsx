import React, { useState, useRef, useEffect } from 'react';
import ollama_icon from '../assets/images/ollama_icon.png';
import { useParams } from 'react-router-dom';

interface Message {
  content: string;
  sender: 'user' | 'bot';
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false); // State to track if bot is responding
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
  const { chatId } = useParams<{ chatId: string }>();
  const [isThreadCreated, setIsThreadCreated] = useState<boolean>(false);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);

  // Scroll to the bottom of the chat when new messages are added
  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    const fetchInitialMessages = async () => {
      if (chatId && chatId !== 'new') {
        try {
          const response = await fetch(`http://127.0.0.1:8000/chat/threads/${chatId}/messages/`, {
            method: 'GET',
            credentials: 'include', // Include credentials like cookies in the request
            headers: {
              'Content-Type': 'application/json',
            },
          });
          const data = await response.json();
          setMessages(data.messages);
          setIsThreadCreated(true)
          setCurrentThreadId(chatId);
        } catch (error) {
          console.error('Failed to fetch chat messages:', error);
        }
      } else if (chatId === 'new') {
        setMessages([]); // Start with an empty chat for a new thread
        setIsThreadCreated(false);
        setCurrentThreadId(null);
        setLoading(false);
      }
    };

    fetchInitialMessages();
  }, [chatId]);

  const sendMessage = async (threadId: string, message: string) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/chat/response/${threadId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
        credentials: 'include', // Include credentials like cookies in the request
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      const botResponse = data.response; // Access the bot's response

      // Update messages state with the bot's response
      setMessages((prevMessages) => [
        ...prevMessages,
        { content: botResponse, sender: 'bot' },
      ]);
      
      console.log('Message sent:', data);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      // Disable input while waiting for bot response
      setLoading(true);

      const userMsg = input

      // Add user message
      setMessages((prevMessages) => [
        ...prevMessages,
        { content: userMsg, sender: 'user' },
      ]);
      setInput('');

      if (!isThreadCreated) {
        try {
          const response = await fetch('http://127.0.0.1:8000/chat/threads/new/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Include credentials like cookies in the request
          });
      
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
      
          const { thread_id } = await response.json(); // Extract thread_id from the response
          setCurrentThreadId(thread_id);
          setIsThreadCreated(true);
          await sendMessage(thread_id, userMsg);
        } catch (error) {
          console.error('Failed to create chat thread:', error);
        }
    } else if (currentThreadId) {
      // If thread already created, send the message to the existing thread
      await sendMessage(currentThreadId, userMsg);
    }

    // Re-enable input after bot responds
    setLoading(false);
  };
};

  return (
    <div className="flex flex-col h-screen w-3/5 mx-auto overflow-hidden">
      <div className="flex-1 w-full p-4 overflow-auto">
        <div className="flex flex-col space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.sender === 'bot' ? 'justify-start' : 'justify-end'}`}
            >
            {msg.sender === 'bot' && (
              <div className="relative mr-3">
                <img
                  src={ollama_icon}
                  alt="Bot Avatar"
                  className="w-8 h-8 rounded-full"
                />
              </div>
            )}
              <div
                className={`p-3 rounded-lg max-w-xl ${
                  msg.sender === 'bot' ? ' text-white' : 'bg-gray-800 text-white'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={endOfMessagesRef} />
        </div>
      </div>
      <form onSubmit={handleSubmit} className="p-4 mb-5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full p-3 border border-slate-300 rounded-lg"
          placeholder="Message Llama"
          disabled={loading} // Disable input when loading
        />
      </form>
    </div>
  );
};

export default Chat;
