import React, { useEffect } from "react";
import { useChatContext } from "../contexts/ChatContext";
import {
  fetchChatThreads,
  updateThreadTitle,
  deleteThread,
  deleteAllThreads,
} from "../api/chat";
import ChatThreadsList from "./ChatThreadList";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import newChatIcon from "../assets/images/new_chat_icon.svg";
import { ClearChatsDialog } from "./ClearChatsDialog";

const SideBar: React.FC = () => {
  const { chatThreads, setChatThreads } = useChatContext();
  const navigate = useNavigate();

  //Fetch chat threads
  const { data, error, isLoading } = useQuery({
    queryKey: ["chatThreads"],
    queryFn: fetchChatThreads,
    refetchOnWindowFocus: false, // Avoid refetching on window focus
    refetchOnReconnect: false, // Avoid refetching on reconnect
    refetchInterval: false, // Disable periodic refetching
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

  const handleDeleteAll = async () => {
    // Optionally clear the chat threads from the UI
    setChatThreads([]);

    try {
      // Call the function to delete all threads on the server
      await deleteAllThreads();
      navigate("/chat/new"); // Navigate to a different page or refresh the current page
    } catch (error) {
      // Handle errors and possibly revert the UI update if needed
      console.error("Error deleting all threads:", error);
    }
  };

  // Navigate to create a new chat
  const handleNewChat = () => {
    navigate("/chat/new");
  };

  return (
    <div className="flex h-screen">
      <div className="w-64 bg-gray-900 text-white">
        <div className="flex flex-grow flex-col p-4">
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
            <div className="flex max-h-[calc(100vh-120px)] min-h-[calc(100vh-120px)] items-center justify-center">
              <p className="mt-4 text-gray-400">Loading threads...</p>
            </div>
          ) : error ? (
            <div className="flex max-h-[calc(100vh-120px)] min-h-[calc(100vh-120px)] items-center justify-center">
              <p className="mt-4 text-red-500">Error: {error.message}</p>
            </div>
          ) : (
            <div className="max-h-[calc(100vh-120px)] min-h-[calc(100vh-120px)] flex-grow overflow-y-auto">
              <ChatThreadsList
                chatThreads={chatThreads}
                onRename={handleRename}
                onDelete={handleDelete}
              />
            </div>
          )}
          <ClearChatsDialog handleDeleteAll={handleDeleteAll} />
        </div>
      </div>
    </div>
  );
};

export default SideBar;
