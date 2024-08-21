import React, { useEffect } from "react";
import { useChatContext } from "../contexts/ChatContext";
import { fetchChatThreads, updateThreadTitle, deleteThread } from "../api/chat";
import ChatThreadsList from "./ChatThreadList";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import newChatIcon from "../assets/images/new_chat_icon.svg";

const SideBar: React.FC = () => {
  const { chatThreads, setChatThreads } = useChatContext();
  const navigate = useNavigate();

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
    <div className="flex h-screen">
      <div
        className='w-64 bg-gray-900 text-white'
      >
        <div className="p-4">
          <div className="flex justify-between">
            <h2 className="p-2 text-xl font-bold">Chat Logs</h2>
            <button
                onClick={handleNewChat}
                className="rounded-lg p-2 hover:bg-gray-700"
              >
                <img src={newChatIcon} alt="New Chat Icon" />
            </button>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400 mt-4">Loading threads...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-red-500 mt-4">Error: {error.message}</p>
            </div>
          ) : (
            <ChatThreadsList
              chatThreads={chatThreads}
              onRename={handleRename}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SideBar;
