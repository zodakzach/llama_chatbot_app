import React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@radix-ui/react-dropdown-menu";

interface DropdownButtonProps {
  items: {
    label?: string;
    onClick?: () => void;
    isSeparator?: boolean;
  }[];
  triggerContent: React.ReactNode;
}

const DropdownButton: React.FC<DropdownButtonProps> = ({
  items,
  triggerContent,
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
          {triggerContent}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        sideOffset={5}
        className="w-40 rounded border border-gray-200 bg-white p-1 shadow-lg"
      >
        {items.map((item, index) =>
          item.isSeparator ? (
            <DropdownMenuSeparator
              key={index}
              className="my-1 h-px bg-gray-200"
            />
          ) : (
            <DropdownMenuItem
              key={index}
              onSelect={item.onClick}
              className="cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              {item.label}
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DropdownButton;
