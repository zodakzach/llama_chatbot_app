import React, {
  useState,
  useRef,
  useEffect,
  KeyboardEvent,
  FormEvent,
} from "react";
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
import sendIcon from "../assets/images/arrow-up-circle.svg";
import profileIcon from "../assets/images/person-circle.svg";
import DropdownButton from "./DropdownButton";
import { logout } from '../api/auth'; // Import the logout function from the auth file

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

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        // Allow new line if Shift is pressed
        return;
      } else {
        // Prevent default form submission and submit manually if Enter is pressed
        e.preventDefault();
        if (!loading && input.trim() !== "") {
          handleSubmit(e as unknown as FormEvent);
        }
      }
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Full-Width Sticky Bar */}
      <div className="fixed top-0 z-10 flex w-[calc(100%-16rem)] items-center justify-between bg-gray-800 p-4">
        <h1 className="text-xl font-bold text-white">Llama 3.1</h1>
        <DropdownButton
          triggerContent={
            <img src={profileIcon} alt="Profile Icon" className="h-7 w-7 hover:bg-gray-500 rounded-full" />
          } // Custom trigger content
          items={[
            { label: "Settings", onClick: () => console.log("Action 2") },
            { isSeparator: true },
            { label: "Logout", onClick: () => logout(navigate) },
          ]}
        />
      </div>
      <div className="mx-auto mt-16 flex h-full w-3/5 flex-col overflow-hidden">
        <div className="w-full flex-1 overflow-auto p-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center">
              <img src={ollama_icon} className="h-20 w-20 rounded-full p-4" />
              <p className="text-gray-500">
                No messages yet. Start the conversation!
              </p>
            </div>
          ) : (
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
                        : "bg-gray-700 text-white"
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
                            <pre className="overflow-x-auto rounded bg-gray-900 p-3 text-white">
                              <code
                                className={`language-${language}`}
                                {...props}
                              >
                                {String(children).replace(/\n$/, "")}
                              </code>
                            </pre>
                          ) : (
                            <code
                              className={`rounded bg-gray-900 p-1`}
                              {...props}
                            >
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
          )}
        </div>
        <form onSubmit={handleSubmit} className="relative mb-5 p-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full resize-none overflow-auto rounded-lg bg-gray-700 p-3 pr-16 text-white focus:outline-none"
            placeholder="Message Llama"
            rows={1} // Start with a single line
            style={{ maxHeight: "10rem" }} // Restrict height to ~4 lines
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement; // Type casting
              target.style.height = "auto"; // Reset the height
              target.style.height = `${target.scrollHeight}px`; // Set height based on content
            }}
            onKeyDown={handleKeyDown}
          ></textarea>
          <button
            type="submit"
            className="absolute bottom-7 right-5 rounded-full bg-white hover:bg-gray-300 disabled:bg-gray-400"
            disabled={loading || input.trim() === ""} // Disable button when loading
          >
            <img src={sendIcon} alt="Send Icon" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
