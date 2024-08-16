// ChatThreadsList.tsx
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChatThread } from '../api/chat';
import DropdownButton from './DropdownButton';

interface ChatThreadsListProps {
  chatThreads: ChatThread[];
  onRename: (threadId: number, newTitle: string) => void;
  onDelete: (threadId: number) => void;
}

const ChatThreadsList: React.FC<ChatThreadsListProps> = ({ chatThreads, onRename, onDelete }) => {
  const [editingThreadId, setEditingThreadId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState<string>('');

  const handleRename = (threadId: number) => {
    if (editingThreadId === threadId) {
      onRename(threadId, newTitle);
      setEditingThreadId(null);
      setNewTitle('');
    } else {
      setEditingThreadId(threadId);
      const thread = chatThreads.find(t => t.id === threadId);
      if (thread) setNewTitle(thread.title);
    }
  };

  return (
    <ul>
      {chatThreads.map((thread) => (
        <li key={thread.id} className="flex items-center justify-between p-2">
          <NavLink
            to={`/chat/${thread.id}`}
            className={({ isActive }) =>
              `flex items-center justify-between w-full rounded p-2 ${
                isActive ? "bg-gray-600" : "hover:bg-gray-700 group"
              }`
            }
          >
            {editingThreadId === thread.id ? (
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onBlur={() => handleRename(thread.id)}
                className="border border-gray-300 rounded p-1 flex-1 bg-transparent focus:outline-none focus:border-blue-500"
                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                autoFocus
                />
            ) : (
                <span 
                style={{ 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  whiteSpace: 'nowrap', 
                  display: 'inline-block', 
                  width: '100%',
                  pointerEvents: 'none', // Prevents interaction that causes focus
                }}
              >
                {thread.title}
              </span>            )}
            <DropdownButton
              onRename={() => handleRename(thread.id)}
              onDelete={() => onDelete(thread.id)}
            />
          </NavLink>
        </li>
      ))}
    </ul>
  );
};

export default ChatThreadsList;
