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

const DropdownButton: React.FC<DropdownButtonProps> = ({
  onRename,
  onDelete,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="p-2 text-gray-300 hover:text-white"
          style={{
            outline: "none", // Removes the default focus outline
          }}
          onMouseDown={(e) => e.preventDefault()} // Prevents focus on click
        >
          &#8230; {/* This is the Unicode for ellipsis */}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        sideOffset={5}
        className="w-40 rounded border border-gray-200 bg-white p-1 shadow-lg"
      >
        <DropdownMenuItem
          onSelect={onRename}
          className="cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          Rename
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-1 h-px bg-gray-200" />
        <DropdownMenuItem
          onSelect={onDelete}
          className="cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DropdownButton;
