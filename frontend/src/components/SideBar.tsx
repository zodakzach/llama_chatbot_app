import React, { useState, useEffect } from "react";
import sideBarCollapse from "../assets/images/sidebar-collapse-toggle.svg";
import sideBarExpand from "../assets/images/sidebar-expand-toggle.svg";
import { useChatContext } from "../contexts/ChatContext";
import { fetchChatThreads, updateThreadTitle, deleteThread } from "../api/chat";
import ChatThreadsList from "./ChatThreadList";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import newChatIcon from "../assets/images/new_chat_icon.svg";

const SideBar: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const { chatThreads, setChatThreads } = useChatContext();
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  //Fetch chat threads
  const { data, error, isLoading } = useQuery({
    queryKey: ["chatThreads"],
    queryFn: fetchChatThreads,
  });

  // Effect to handle side effects and update chat threads state
  useEffect(() => {
    if (data?.threads) {
      setChatThreads(data.threads);
    }
  }, [data]); // Depend on data to update when it changes

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading chat threads: {error.message}</div>;
  }

  const handleRename = async (threadId: number, newTitle: string) => {
    setChatThreads((prevThreads) =>
      prevThreads.map((thread) =>
        thread.id === threadId ? { ...thread, title: newTitle } : thread,
      ),
    );

    try {
      // Call the function to update the title on the server
      await updateThreadTitle(threadId, newTitle);
    } catch (error) {
      // Handle errors and possibly revert the UI update if needed
      console.error("Error updating thread title:", error);
      setChatThreads((prevThreads) =>
        prevThreads.map((thread) =>
          thread.id === threadId ? { ...thread, title: thread.title } : thread,
        ),
      );
    }
  };

  const handleDelete = async (threadId: number) => {
    setChatThreads((prevThreads) =>
      prevThreads.filter((thread) => thread.id !== threadId),
    );

    try {
      // Call the function to delete the thread on the server
      await deleteThread(threadId);
      navigate("/chat/new");
    } catch (error) {
      // Handle errors and possibly revert the UI update if needed
      console.error("Error deleting thread:", error);

      // Optionally revert the UI update if the server deletion fails
      setChatThreads((prevThreads) => [
        ...prevThreads,
        { id: threadId, title: "Deleted Thread" /* other properties */ },
      ]);
    }
  };

  // Navigate to create a new chat
  const handleNewChat = () => {
    navigate("/chat/new");
  };

  return (
    <div className="flex">
      <div
        className={`transition-all duration-300 ${isOpen ? "w-64" : "w-10"} h-screen bg-gray-900 text-white`}
      >
        <div className="flex justify-between">
          <button
            className="ml-2 mt-1 rounded-lg bg-gray-900 p-1 text-white hover:bg-gray-700"
            onClick={toggleSidebar}
          >
            {isOpen ? (
              <img src={sideBarCollapse} alt="Collapse Sidebar" />
            ) : (
              <img src={sideBarExpand} alt="Expand Sidebar" />
            )}
          </button>
          {isOpen && (
            <button
              onClick={handleNewChat}
              className="mr-2 mt-1 rounded-lg p-1 hover:bg-gray-700"
            >
              <img src={newChatIcon} alt="New Chat Icon" />
            </button>
          )}
        </div>

        {isOpen && (
          <div className="p-4">
            <h2 className="p-2 text-xl font-bold">Chat Logs</h2>
            <ChatThreadsList
              chatThreads={chatThreads}
              onRename={handleRename}
              onDelete={handleDelete}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SideBar;
