from ollama import Client
from .models import ChatMessage, ChatThread
from django.shortcuts import get_object_or_404
from django.http import Http404
from pathlib import Path
from dotenv import load_dotenv
import os

# Load the .env file
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# Use the environment variable
OLLAMA_HOST = os.getenv("OLLAMA_HOST")


def truncate_context(context_str):
    """
    Truncate a given string to 5000 characters if it exceeds the limit.
    If the string is too long, split it by newline characters and remove
    older messages until the total length is within the limit.

    Args:
        context_str (str): The input string to be truncated.

    Returns:
        str: The truncated string within the 5000 character limit.
    """
    max_length = 5000

    # Check if the context exceeds the maximum length
    while len(context_str) > max_length:
        lines = context_str.split("\n")
        # Remove the first message (oldest)
        lines = lines[1:]
        # Rebuild the context
        context_str = "\n".join(lines)

    return context_str


def initialize_client():
    try:
        client = Client(host=OLLAMA_HOST)
        return client
    except Exception as e:
        print("Error initializing the Client:", str(e))
        return None


def stream_response(request, model_name, message, thread, cancellation_event):
    client = initialize_client()
    if client is None:
        return

    response = ""  # Store the partial response here

    def stream():
        nonlocal response
        try:
            for part in client.chat(model=model_name, messages=[message], stream=True):
                if cancellation_event.is_set():
                    print("Streaming cancelled.")
                    break
                response += part["message"]["content"]
                yield part["message"]["content"]
        except Exception as e:
            print(f"Streaming error: {e}")
            if response:
                ChatMessage.objects.create(
                    thread=thread, sender="bot", content=response
                )
            raise
        else:
            if response:
                ChatMessage.objects.create(
                    thread=thread, sender="bot", content=response
                )

    return stream()


def save_user_message(thread, user_message):
    """
    Saves the user message to the ChatMessage model.

    Parameters:
    thread (ChatThread): The chat thread where the messages should be saved.
    user_message (str): The user's input message containing both user and bot content.
    """

    # Safely handle user_message
    if isinstance(user_message, str):
        messages = user_message.split("\n")
    else:
        print("Error: user_message is not a string or is undefined")
        messages = []

    # Find the last user message
    last_user_message = ""
    for msg in reversed(messages):
        if msg.startswith("user:"):
            last_user_message = msg[len("user:") :].strip()
            break

    ChatMessage.objects.create(thread=thread, sender="user", content=last_user_message)


def get_thread(thread_id, user):
    try:
        return get_object_or_404(ChatThread, id=int(thread_id), user=user)
    except Http404:
        raise Http404("ChatThread does not exist.")
