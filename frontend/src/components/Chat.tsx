import React, { useState, useRef, useEffect } from 'react';
import ollama_icon from '../assets/images/ollama_icon.png';
import { useParams } from 'react-router-dom';
import { fetchMessages, sendMessage, createNewThread, Message } from '../api/chat';

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
    const loadMessages = async () => {
      if (chatId) { // Ensure chatId is defined and not undefined
        try {
          const { messages, isThreadCreated, currentThreadId } = await fetchMessages(chatId);
          setMessages(messages);
          setIsThreadCreated(isThreadCreated);
          setCurrentThreadId(currentThreadId);
        } catch (error) {
          console.error('Failed to load messages:', error);
        }
      }
    };
  
    loadMessages();
  }, [chatId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      setLoading(true);

      const userMsg = input;
      setMessages((prevMessages) => [...prevMessages, { content: userMsg, sender: 'user' }]);
      setInput('');

      if (!isThreadCreated) {
        try {
          const threadId = await createNewThread();
          setCurrentThreadId(threadId);
          setIsThreadCreated(true);
          const botMessage = await sendMessage(threadId, userMsg);
          setMessages((prevMessages) => [...prevMessages, botMessage]);
        } catch (error) {
          console.error('Failed to create chat thread:', error);
        }
      } else if (currentThreadId) {
        try {
          const botMessage = await sendMessage(currentThreadId, userMsg);
          setMessages((prevMessages) => [...prevMessages, botMessage]);
        } catch (error) {
          console.error('Failed to send message:', error);
        }
      }

      setLoading(false);
    }
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
