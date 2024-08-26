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
  createNewThread,
  Message,
  SendMessageParams,
} from "../api/chat";
import { useChatContext } from "../contexts/ChatContext";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"; // For GitHub Flavored Markdown (tables, strikethrough, etc.)
import sendIcon from "../assets/images/arrow-up-circle.svg";
import profileIcon from "../assets/images/person-circle.svg";
import DropdownButton from "./DropdownButton";
import { logout } from "../api/auth"; // Import the logout function from the auth file
import { useSendMessage } from "../hooks/useSendMessage";
import stopIcon from "../assets/images/stop-fill.svg";

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
  const [abortController, setAbortController] =
    useState<AbortController | null>(null); // State to manage abort controller
  const { mutate: sendMessage, isPending: sendMessageLoading } =
    useSendMessage();
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Fetch messages
  const { isLoading, isError, data, error } = useQuery({
    queryKey: ["messages", chatId],
    queryFn: () => fetchMessages(chatId!),
    enabled: !!chatId && chatId !== "new", // Skip the query if chatId is 'new'
    refetchOnWindowFocus: false, // Avoid refetching on window focus
    refetchOnReconnect: false, // Avoid refetching on reconnect
    refetchInterval: false, // Disable periodic refetching
  });

  useEffect(() => {
    if (data) {
      if (data.messages.length >0){
        setMessages(data.messages);
      }
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
    setErrorMessage(null); // Clear any previous errors
  }, [location.pathname]);

  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    // Abort ongoing request when location changes
    return () => {
      if (abortController) {
        abortController.abort();
        console.log("Cancelled request");
        setLoading(false);
      }
    };
  }, [location.pathname, abortController]);

  const createThreadMutation = useMutation({
    mutationFn: async () => {
      // Create a new thread and return the thread ID
      const threadId = await createNewThread();
      return { threadId }; // Return both threadId and userMsg
    },
    onSuccess: ({ threadId }) => {
      // Update state for new thread
      setChatThreads((prevThreads) => [
        ...prevThreads,
        { id: Number(threadId), title: "New Chat" },
      ]);
      navigate(`/chat/${threadId}`);
    },
    onError: (error: Error) => {
      console.error("Failed to create thread:", error);
      setIsThreadCreated(false);
    },
  });

  const handleCreateThreadAndSendMessage = async (
    userMsg: string,
    context: string,
  ) => {
    try {
      let threadId = currentThreadId;
      if (!isThreadCreated) {
        // Create a new thread
        const { threadId: newThreadId } =
          await createThreadMutation.mutateAsync();
        threadId = newThreadId; // Update threadId with the newly created thread's ID
        setIsThreadCreated(true);
        setCurrentThreadId(threadId);
      }
      if (threadId) {
        // Add the new user message to the local state
        const msg: Message = { content: userMsg, sender: "user" };
        setMessages((prevMessages) => [...prevMessages, msg]);

        // Create an abort controller for this request
        const controller = new AbortController();
        setAbortController(controller);

        const params: SendMessageParams = {
          threadId: threadId,
          message: context,
          signal: controller.signal,
          onMessageUpdate: (newContent: string) => {
            setMessages((prevMessages) => {
              // Find the last message
              const updatedMessages = [...prevMessages];
              const lastMessage = updatedMessages[updatedMessages.length - 1];

              if (lastMessage && lastMessage.sender === "bot") {
                // Update the content of the last message
                lastMessage.content = newContent;
                updatedMessages[updatedMessages.length - 1] = lastMessage;
              } else {
                // Add a new bot message if needed
                updatedMessages.push({ content: newContent, sender: "bot" });
              }

              // Once the first token is streamed in, stop showing the loading ellipsis
              if (newContent) {
                setLoadingMessage(false);
              }

              return updatedMessages;
            });
          },
        };

        setLoadingMessage(true);
        setErrorMessage(null); // Clear any previous errors

        // Start the mutation and handle success directly
        sendMessage(params, {
          onSuccess: () => {
            // Actions to perform on success
            console.log("Message sent successfully.");
            setAbortController(null);
            setLoading(false);
            setErrorMessage(null); // Clear any previous errors
          },
          onError: (error) => {
            // Actions to perform on error
            setAbortController(null);
            setLoadingMessage(false); // Stop showing the loading ellipsis
            setLoading(false);

            // Check if the error is not an abort
            if (error.name != "AbortError") {
              setErrorMessage("An error occurred. Please try again."); // Display the error message
            }
          },
        });
      }
    } catch (error) {
      console.error("Failed to handle chat:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      setLoading(true);

      const userMsg = input;
      setInput("");

      // Create a single string from the conversation history including the user's message
      const context = [
        ...messages,
        { content: userMsg, sender: "user" }, // Include the new user message
      ]
        .map((msg) => `${msg.sender}: ${msg.content}`)
        .join("\n");

      handleCreateThreadAndSendMessage(userMsg, context);
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

  const handleStop = (): void => {
    if (abortController) {
      abortController.abort();
      console.log("Cancelled request");
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col">
      {/* Full-Width Sticky Bar */}
      <div className="fixed top-0 z-10 flex w-full max-w-[calc(100%-16rem)] items-center justify-between bg-gray-800 p-4">
        <h1 className="text-xl font-bold text-white">Llama 3.1</h1>
        <DropdownButton
          triggerContent={
            <img
              src={profileIcon}
              alt="Profile Icon"
              className="h-7 w-7 rounded-full hover:bg-gray-500"
            />
          } // Custom trigger content
          items={[
            { label: "Settings", onClick: () => console.log("Action 2") },
            { isSeparator: true },
            { label: "Logout", onClick: () => logout(navigate) },
          ]}
        />
      </div>
      <div className="mx-auto mt-16 flex h-full w-full flex-col overflow-hidden">
        <div className="flex h-full justify-center overflow-auto p-4">
          <div className="h-full w-3/5">
            {isLoading ? (
              <div className="flex h-full flex-col items-center justify-center">
                <div role="status">
                  <svg
                    aria-hidden="true"
                    className="inline h-8 w-8 animate-spin fill-gray-600 text-gray-200 dark:fill-gray-300 dark:text-gray-600"
                    viewBox="0 0 100 101"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                      fill="currentColor"
                    />
                    <path
                      d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                      fill="currentFill"
                    />
                  </svg>
                </div>
                <p className="text-gray-500">Loading messages...</p>
              </div>
            ) : isError ? (
              <div className="flex h-full flex-col items-center justify-center">
                <p className="text-red-500">
                  Error loading messages: {error.message}
                </p>
              </div>
            ) : messages.length === 0 ? (
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
                {/* Conditionally render the loading ellipsis or error message */}
                {loadingMessage && (
                  <div className="flex justify-start">
                    <div className="relative mr-3">
                      <img
                        src={ollama_icon} // You can use the bot's icon again for consistency
                        alt="Bot Avatar"
                        className="h-8 w-8 rounded-full"
                      />
                    </div>
                    <div className="max-w-xl rounded-lg p-3 break-words text-white">
                      <p>...</p> {/* Loading ellipsis */}
                    </div>
                  </div>
                )}

                {errorMessage && (
                  <div className="flex justify-start">
                    <div className="relative mr-3">
                      <img
                        src={ollama_icon} // Same bot icon for consistency
                        alt="Bot Avatar"
                        className="h-8 w-8 rounded-full"
                      />
                    </div>
                    <div className="max-w-xl rounded-lg p-3 break-words text-red-500">
                      <p>{errorMessage}</p> {/* Error message */}
                    </div>
                  </div>
                )}
                <div ref={endOfMessagesRef} />
              </div>
            )}
          </div>
        </div>
        <div className="flex w-full justify-center">
          <form onSubmit={handleSubmit} className="relative mb-5 w-3/5 p-4">
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
            {loading ? (
              <button
                type="button" // Use button type instead of submit to prevent form submission
                className="absolute bottom-7 right-5 rounded-full bg-white hover:bg-gray-300"
                onClick={handleStop} // Replace with your stop action handler
              >
                <img src={stopIcon} alt="Stop Icon" className="h-8 w-8 p-1" />
              </button>
            ) : (
              <button
                type="submit"
                className="absolute bottom-7 right-5 rounded-full bg-white hover:bg-gray-300 disabled:bg-gray-400"
                disabled={input.trim() === ""} // Disable button only based on input
              >
                <img src={sendIcon} alt="Send Icon" className="h-8 w-8" />
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
