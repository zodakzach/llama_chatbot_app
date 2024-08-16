import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define the ChatThread interface
interface ChatThread {
  id: number; // Assuming ID is a number
  title: string;
  // Add other fields as necessary
}

// Create the context with the correct type
const ChatContext = createContext<{
  chatThreads: ChatThread[];
  setChatThreads: React.Dispatch<React.SetStateAction<ChatThread[]>>;
}>({
  chatThreads: [],
  setChatThreads: () => {},
});

// Custom hook to use the ChatContext
export const useChatContext = () => useContext(ChatContext);

// ChatProvider component
export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);

  return (
    <ChatContext.Provider value={{ chatThreads, setChatThreads }}>
      {children}
    </ChatContext.Provider>
  );
};
