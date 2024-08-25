import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { sendMessageStream, SendMessageParams } from "../api/chat";

export const useSendMessage = (): UseMutationResult<
  void,
  Error,
  SendMessageParams
> => {
  return useMutation<void, Error, SendMessageParams>({
    mutationFn: async (params: SendMessageParams) => {
      await sendMessageStream(params);
    },
    onError: (error: Error) => {
      if (error.name === "AbortError") {
        console.log("Streaming cancelled.");
      } else {
        console.error("Failed to send message:", error.message);
      }
    },
  });
};
