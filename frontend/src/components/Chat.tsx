import React, { useState, useRef, useEffect } from "react";
import ollama_icon from "../assets/images/ollama_icon.png";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  fetchMessages,
  sendMessage,
  createNewThread,
  Message,
  ChatThread,
} from "../api/chat";
import { useChatContext } from "../contexts/ChatContext";

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false); // State to track if bot is responding
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
  const { chatId } = useParams<{ chatId: string }>();
  const [isThreadCreated, setIsThreadCreated] = useState<boolean>(false);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { chatThreads, setChatThreads } = useChatContext();
  const location = useLocation();

  // Scroll to the bottom of the chat when new messages are added
  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    // Clear messages when navigating to /chat/new
    if (location.pathname === "/chat/new") {
      setMessages([]); // Clear messages
      setCurrentThreadId(null);
      setIsThreadCreated(false);
    }
  }, [location.pathname, setMessages]);

  useEffect(() => {
    const loadMessages = async () => {
      if (chatId) {
        // Ensure chatId is defined and not undefined
        try {
          const { messages, isThreadCreated, currentThreadId } =
            await fetchMessages(chatId);
          setMessages(messages);
          setIsThreadCreated(isThreadCreated);
          setCurrentThreadId(currentThreadId);
        } catch (error) {
          console.error("Failed to load messages:", error);
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
      setMessages((prevMessages) => [
        ...prevMessages,
        { content: userMsg, sender: "user" },
      ]);
      setInput("");

      if (!isThreadCreated) {
        try {
          const threadId = await createNewThread();

          const newThread: ChatThread = {
            id: Number(threadId),
            title: "New Chat",
          };   
          setCurrentThreadId(threadId);
          setIsThreadCreated(true);
          // Navigate to the newly created thread's route
          const botMessage = await sendMessage(threadId, userMsg);
          setMessages((prevMessages) => [...prevMessages, botMessage]);
          setChatThreads((prevThreads) => [...prevThreads, newThread]);
          navigate(`/chat/${threadId}`);
        } catch (error) {
          console.error("Failed to create chat thread:", error);
        }
      } else if (currentThreadId) {
        try {
          const botMessage = await sendMessage(currentThreadId, userMsg);
          setMessages((prevMessages) => [...prevMessages, botMessage]);
        } catch (error) {
          console.error("Failed to send message:", error);
        }
      }
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex h-screen w-3/5 flex-col overflow-hidden">
      <div className="w-full flex-1 overflow-auto p-4">
        <div className="flex flex-col space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.sender === "bot" ? "justify-start" : "justify-end"}`}
            >
              {msg.sender === "bot" && (
                <div className="relative mr-3">
                  <img
                    src={ollama_icon}
                    alt="Bot Avatar"
                    className="h-8 w-8 rounded-full"
                  />
                </div>
              )}
              <div
                className={`max-w-xl rounded-lg p-3 ${
                  msg.sender === "bot" ? "text-white" : "bg-gray-800 text-white"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={endOfMessagesRef} />
        </div>
      </div>
      <form onSubmit={handleSubmit} className="mb-5 p-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full rounded-lg border border-slate-300 p-3"
          placeholder="Message Llama"
          disabled={loading} // Disable input when loading
        />
      </form>
    </div>
  );
};

export default Chat;
