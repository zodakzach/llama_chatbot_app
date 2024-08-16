// src/api/chat.ts

export interface Message {
  content: string;
  sender: "user" | "bot";
}

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
        `http://127.0.0.1:8000/chat/threads/${chatId}/messages/`,
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
      `http://127.0.0.1:8000/chat/response/${threadId}/`,
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
    const response = await fetch("http://127.0.0.1:8000/chat/threads/new/", {
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

export const fetchChatThreads = async (): Promise<{ threads: any[] }> => {
  try {
    const response = await fetch("http://127.0.0.1:8000/chat/threads/", {
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
