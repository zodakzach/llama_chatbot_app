import React, { useState, useEffect } from "react";
import sideBarCollapse from "../assets/images/sidebar-collapse-toggle.svg";
import sideBarExpand from "../assets/images/sidebar-expand-toggle.svg";
import { useChatContext } from "../contexts/ChatContext";
import { fetchChatThreads, updateThreadTitle, deleteThread } from "../api/chat";
import ChatThreadsList from "./ChatThreadList";
import { useNavigate } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';

const SideBar: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const { chatThreads, setChatThreads } = useChatContext();
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Assuming fetchChatThreads is your API call function
  const { data, error, isLoading } = useQuery({
    queryKey: ['chatThreads'],
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
      // Optionally revert the UI update if the server update fails
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

  return (
    <div className="flex">
      {/* Sidebar */}
      <div
        className={`${
          isOpen ? "w-64" : "w-10"
        } transition-width h-screen overflow-hidden bg-gray-800 text-white duration-300`}
      >
        <button
          className={`bg-gray-800 p-2 text-white ${
            isOpen ? "ml-2" : "ml-2"
          } transform transition-transform duration-300`}
          onClick={toggleSidebar}
        >
          {isOpen ? (
            <img src={sideBarCollapse}></img>
          ) : (
            <img src={sideBarExpand}></img>
          )}
        </button>
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
