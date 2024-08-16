import React, { useState, useEffect } from "react";
import sideBarCollapse from "../assets/images/sidebar-collapse-toggle.svg";
import sideBarExpand from "../assets/images/sidebar-expand-toggle.svg";
import { useChatContext } from "../contexts/ChatContext";
import { NavLink } from "react-router-dom";
import { fetchChatThreads } from "../api/chat";

const SideBar: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const { chatThreads, setChatThreads } = useChatContext();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const loadChatThreads = async () => {
      try {
        const data = await fetchChatThreads();
        setChatThreads(data.threads);
      } catch (error) {
        console.error("Failed to load chat threads:", error);
      }
    };

    loadChatThreads();
  }, []);

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
            <h2 className="text-xl font-bold">Chat Logs</h2>
            <ul>
              {chatThreads.map((thread) => (
                <li key={thread.id}>
                  <NavLink
                    to={`/chat/${thread.id}`}
                    className={({ isActive }) =>
                      `block rounded p-2 ${isActive ? "bg-gray-600" : "hover:bg-gray-700"}`
                    }
                  >
                    {thread.title}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default SideBar;
