import React, { useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Chat from "../components/Chat";
import SideBar from "../components/SideBar";
import { ChatProvider, useChatContext } from "../contexts/ChatContext";

// Component to handle default chat creation
const DefaultChatHandler: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { chatThreads } = useChatContext();

  useEffect(() => {
    // If the path is just '/chat' and no threads exist, redirect to 'new'
    if (location.pathname === "/chat" && chatThreads.length === 0) {
      navigate("/chat/new");
    }
  }, [chatThreads.length, location.pathname, navigate]);

  return null;
};

function ChatPage() {
  return (
    <ChatProvider>
      <div className="max-w-screen flex h-screen">
        <SideBar />
        <div className="flex-1">
          <DefaultChatHandler />
          <Routes>
            <Route path=":chatId" element={<Chat />} />
            <Route path="new" element={<Chat />} />
            {/* Redirect from root to 'new' if no chatId is present */}
            <Route path="/" element={<Chat />} />
          </Routes>
        </div>
      </div>
    </ChatProvider>
  );
}

export default ChatPage;
