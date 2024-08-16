"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@radix-ui/react-dropdown-menu";

interface DropdownButtonProps {
  onRename: () => void;
  onDelete: () => void;
}

const DropdownButton: React.FC<DropdownButtonProps> = ({ onRename, onDelete }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-2 text-gray-300 hover:text-white"
            style={{
                outline: 'none', // Removes the default focus outline
              }}
              onMouseDown={(e) => e.preventDefault()} // Prevents focus on click
        >
            &#8230; {/* This is the Unicode for ellipsis */}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        sideOffset={5}
        className="w-40 bg-white border border-gray-200 rounded shadow-lg p-1"
      >
        <DropdownMenuItem
          onSelect={onRename}
          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
        >
          Rename
        </DropdownMenuItem>
        <DropdownMenuSeparator className="h-px bg-gray-200 my-1" />
        <DropdownMenuItem
          onSelect={onDelete}
          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DropdownButton;

