// src/api/chat.ts

export interface Message {
  content: string;
  sender: "user" | "bot";
}

export interface ChatThread {
  id: number;
  title: string;
}

const API_URL = import.meta.env.VITE_BACKEND_API_URL;

export const fetchMessages = async (
  chatId: string,
): Promise<{
  messages: Message[];
  isThreadCreated: boolean;
  currentThreadId: string | null;
}> => {
  if (chatId && chatId !== "new") {
    try {
      const response = await fetch(
        `${API_URL}/chat/threads/${chatId}/messages/`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();
      return {
        messages: data.messages,
        isThreadCreated: true,
        currentThreadId: chatId,
      };
    } catch (error) {
      console.error("Failed to fetch chat messages:", error);
      throw error;
    }
  } else if (chatId === "new") {
    return {
      messages: [],
      isThreadCreated: false,
      currentThreadId: null,
    };
  }
  throw new Error("Invalid chat ID");
};

export const sendMessage = async (
  threadId: string,
  message: string,
): Promise<Message> => {
  try {
    const response = await fetch(
      `${API_URL}/chat/response/${threadId}/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    return {
      content: data.response,
      sender: "bot",
    };
  } catch (error) {
    console.error("Failed to send message:", error);
    throw error;
  }
};

export const createNewThread = async (): Promise<string> => {
  try {
    const response = await fetch(`${API_URL}/chat/threads/new/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const { thread_id } = await response.json();
    return thread_id;
  } catch (error) {
    console.error("Failed to create chat thread:", error);
    throw error;
  }
};

export const fetchChatThreads = async (): Promise<{ threads: ChatThread[] }> => {
  try {
    const response = await fetch(`${API_URL}/chat/threads/`, {
      method: "GET",
      credentials: "include", // Include credentials with the request
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch chat threads:", error);
    throw error; // Re-throw the error to be handled by the caller
  }
};

export async function updateThreadTitle(threadId: number, newTitle: string): Promise<void> {
  const url = `${API_URL}/chat/threads/${threadId}/update-title/`;
  
  try {
      const response = await fetch(url, {
          method: 'PUT',
          headers: {
              'Content-Type': 'application/json',
              // Add any other headers required by your backend, such as authentication tokens
          },
          credentials: "include", // Include credentials with the request
          body: JSON.stringify({ title: newTitle }),
      });

      if (!response.ok) {
          throw new Error(`Failed to update thread title: ${response.statusText}`);
      }

      // Optionally handle the response here (e.g., confirm update, log success)
      console.log('Thread title updated successfully.');
  } catch (error) {
      // Handle errors here (e.g., show a user-friendly message)
      console.error('Error updating thread title:', error);
  }
}

export async function deleteThread(threadId: number): Promise<void> {
  const url = `${API_URL}/chat/threads/${threadId}/delete/`;
  
  try {
      const response = await fetch(url, {
          method: 'DELETE',
          headers: {
              'Content-Type': 'application/json',
              // Add any other headers required by your backend, such as authentication tokens
          },
          credentials: "include", // Include credentials with the request
      });

      if (!response.ok) {
          throw new Error(`Failed to delete thread: ${response.statusText}`);
      }

      // Optionally handle the response here (e.g., confirm deletion, log success)
      console.log('Thread deleted successfully.');
  } catch (error) {
      // Handle errors here (e.g., show a user-friendly message)
      console.error('Error deleting thread:', error);
  }
}