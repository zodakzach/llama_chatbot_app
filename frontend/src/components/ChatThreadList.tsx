// ChatThreadsList.tsx
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { ChatThread } from "../api/chat";
import DropdownButton from "./DropdownButton";

interface ChatThreadsListProps {
  chatThreads: ChatThread[];
  onRename: (threadId: number, newTitle: string) => void;
  onDelete: (threadId: number) => void;
}

const ChatThreadsList: React.FC<ChatThreadsListProps> = ({
  chatThreads,
  onRename,
  onDelete,
}) => {
  const [editingThreadId, setEditingThreadId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState<string>("");

  const handleRename = (threadId: number) => {
    if (editingThreadId === threadId) {
      onRename(threadId, newTitle);
      setEditingThreadId(null);
      setNewTitle("");
    } else {
      setEditingThreadId(threadId);
      const thread = chatThreads.find((t) => t.id === threadId);
      if (thread) setNewTitle(thread.title);
    }
  };

  return (
    <ul className="h-full overflow-auto">
      {chatThreads.map((thread) => (
        <li key={thread.id} className="flex items-center justify-between p-1">
          <NavLink
            to={`/chat/${thread.id}`}
            className={({ isActive }) =>
              `flex w-full items-center justify-between rounded-lg p-1 ${
                isActive ? "bg-secondary/10" : "group hover:bg-secondary/10"
              }`
            }
          >
            {editingThreadId === thread.id ? (
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onBlur={() => handleRename(thread.id)}
                className="flex-1 rounded-lg border border-secondary/10 bg-transparent p-1 focus:border-blue-500 focus:outline-none"
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                autoFocus
              />
            ) : (
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  display: "inline-block",
                  width: "100%",
                  pointerEvents: "none", // Prevents interaction that causes focus
                }}
              >
                {thread.title}
              </span>
            )}
            <DropdownButton
              triggerContent={<span>&#8230;</span>} // Custom trigger content
              items={[
                { label: "Rename", onClick: () => handleRename(thread.id) },
                { isSeparator: true }, // Adds a separator
                { label: "Delete", onClick: () => onDelete(thread.id) },
              ]}
            />
          </NavLink>
        </li>
      ))}
    </ul>
  );
};

export default ChatThreadsList;
