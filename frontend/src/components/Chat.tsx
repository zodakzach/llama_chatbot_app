import React, { useState, useRef, useEffect } from "react";
import ollama_icon from "../assets/images/ollama_icon.png";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  fetchMessages,
  sendMessage,
  createNewThread,
  Message,
} from "../api/chat";
import { useChatContext } from "../contexts/ChatContext";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"; // For GitHub Flavored Markdown (tables, strikethrough, etc.)

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
  const queryClient = useQueryClient();

  // Fetch messages
  const { isLoading, isError, data, error } = useQuery({
    queryKey: ["messages", chatId],
    queryFn: () => fetchMessages(chatId!),
    enabled: !!chatId && chatId !== "new", // Skip the query if chatId is 'new'
  });

  useEffect(() => {
    if (data) {
      setMessages(data.messages);
      setIsThreadCreated(data.isThreadCreated);
      setCurrentThreadId(data.currentThreadId);
    }
  }, [data]);

  useEffect(() => {
    if (location.pathname === "/chat/new") {
      setMessages([]);
      setCurrentThreadId(null);
      setIsThreadCreated(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Mutation for creating a new thread and sending a message
  const createThreadAndSendMessageMutation = useMutation({
    mutationFn: async (userMsg: string) => {
      // If no thread is created, create a new one and send a message
      if (!isThreadCreated) {
        const threadId = await createNewThread();
        const botMessage = await sendMessage(threadId, userMsg);
        return { threadId, botMessage };
      } else if (currentThreadId) {
        // If a thread is already created, just send the message
        const botMessage = await sendMessage(currentThreadId, userMsg);
        return { threadId: currentThreadId, botMessage };
      }
      throw new Error("No thread ID available");
    },
    onSuccess: ({ threadId, botMessage }) => {
      if (!isThreadCreated) {
        // Update state for new thread
        setCurrentThreadId(threadId);
        setIsThreadCreated(true);
        setChatThreads((prevThreads) => [
          ...prevThreads,
          { id: Number(threadId), title: "New Chat" },
        ]);
        navigate(`/chat/${threadId}`);
      }
      // Update messages
      setMessages((prevMessages) => [...prevMessages, botMessage]);
      setLoading(false);
    },
    onError: (error: Error) => {
      console.error("Failed to handle chat:", error);
    },
  });

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

      // Create a single string from the conversation history including the user's message
      const context = [
        ...messages,
        { content: userMsg, sender: "user" }, // Include the new user message
      ]
        .map((msg) => `${msg.sender}: ${msg.content}`)
        .join("\n");

      createThreadAndSendMessageMutation.mutate(context);
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
                  msg.sender === "bot"
                    ? "break-words text-white"
                    : "bg-gray-800 text-white"
                }`}
              >
                <ReactMarkdown
                  children={msg.content}
                  remarkPlugins={[remarkGfm]}
                  className="overflow-x-auto whitespace-pre-wrap break-words" // Ensures text wraps correctly
                  components={{
                    // Style for code blocks
                    code({ node, className, children, ...props }) {
                      const language =
                        className?.replace("language-", "") || "";
                      return className ? (
                        <pre className="overflow-x-auto rounded bg-gray-800 p-3 text-white">
                          <code className={`language-${language}`} {...props}>
                            {String(children).replace(/\n$/, "")}
                          </code>
                        </pre>
                      ) : (
                        <code className={`rounded bg-gray-200 p-1`} {...props}>
                          {String(children)}
                        </code>
                      );
                    },
                    // Style for paragraphs
                    p({ node, children, ...props }) {
                      return (
                        <p
                          className="whitespace-pre-wrap break-words"
                          {...props}
                        >
                          {children}
                        </p>
                      );
                    },
                  }}
                />
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
