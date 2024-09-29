from django.http import JsonResponse, StreamingHttpResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST, require_GET
from django.views.decorators.csrf import csrf_exempt
import json
from .models import ChatThread, ChatMessage
from django.shortcuts import get_object_or_404
from . import ollama_utils
import threading
from django_ratelimit.decorators import ratelimit
from django_ratelimit.exceptions import Ratelimited
import logging

logger = logging.getLogger("chat")


@login_required
@require_POST
@csrf_exempt
@ratelimit(key="user_or_ip", rate="10/m", method=["POST"])
def chat_with_model_stream(request, thread_id):
    try:
        if request.method == "POST":
            logger.debug(
                f"Chat request received for thread_id: {thread_id} by user: {request.user.username}"
            )

            cancellation_event = threading.Event()  # Per-request cancellation event

            try:
                # Parse the JSON body
                data = json.loads(request.body)
                user_message = data.get("message")

                if not user_message:
                    logger.warning("No message provided in the chat request")
                    return JsonResponse({"error": "No message provided"}, status=400)

                # Log the received message
                logger.debug(
                    f"User {request.user.username} sent a message: {user_message}"
                )

                # Truncate the context
                context_str = ollama_utils.truncate_context(user_message)

                # Retrieve the chat thread
                thread = ollama_utils.get_thread(thread_id, request.user)
                logger.debug(f"Thread retrieved for thread_id: {thread_id}")

                # Save the user message
                ollama_utils.save_user_message(thread, user_message)
                logger.info(
                    f"User message saved for thread_id: {thread_id} and user: {request.user.username}"
                )

                # Create a generator to stream the response
                response_generator = ollama_utils.stream_response(
                    request,
                    model_name="llama3.1",
                    context=context_str,
                    thread=thread,
                    cancellation_event=cancellation_event,
                )

                # Return a StreamingHttpResponse to stream data back to the client
                response = StreamingHttpResponse(
                    response_generator, content_type="text/plain"
                )
                response["Cache-Control"] = "no-cache"
                logger.info(f"Streaming response initiated for thread_id: {thread_id}")
                return response

            except json.JSONDecodeError:
                logger.error("JSON decoding error during chat request", exc_info=True)
                return JsonResponse({"error": "Invalid JSON"}, status=400)

            except (ConnectionError, BrokenPipeError) as e:
                logger.error(f"Connection error occurred: {e}", exc_info=True)
                return JsonResponse({"error": "Connection error occurred"}, status=500)

            except Exception as e:
                logger.error(f"An unexpected error occurred: {e}", exc_info=True)
                return JsonResponse(
                    {"error": "An unexpected error occurred"}, status=500
                )
        else:
            logger.warning(f"Invalid method used in chat request: {request.method}")
            return JsonResponse({"error": "Method not allowed"}, status=405)

    except Ratelimited:
        logger.warning(f"Rate limit exceeded for user: {request.user.username}")
        return JsonResponse({"error": "Rate limit exceeded"}, status=429)


@login_required
@require_POST
@csrf_exempt
@ratelimit(key="user_or_ip", rate="10/m", method=["POST"])
def chat_with_model(request, thread_id):
    try:
        if request.method == "POST":
            try:
                data = json.loads(request.body)
                user_message = data.get("message")

                if not user_message:
                    return JsonResponse({"error": "No message provided"}, status=400)

                context_str = ollama_utils.truncate_context(user_message)

                # Retrieve the chat thread
                thread = ollama_utils.get_thread(thread_id, request.user)

                # Save the user message
                ollama_utils.save_user_message(thread, user_message)

                try:
                    # Initialize the Client
                    client = ollama_utils.initialize_client()

                    try:
                        # Get the response from the model
                        response = client.chat(
                            model="llama3.1",
                            messages=[{"role": "user", "content": context_str}],
                        )

                        # Check if response is valid and extract the content
                        if isinstance(response, dict) and "message" in response:
                            message_content = response["message"].get("content", "")
                        else:
                            print("Unexpected response format:", response)
                            message_content = ""

                    except Exception as e:
                        print("Error during API request:", str(e))
                        message_content = ""

                except Exception as e:
                    print("Error initializing the Client:", str(e))
                    message_content = ""

                # Create and save the bot response
                ChatMessage.objects.create(
                    thread=thread, sender="bot", content=message_content
                )

                # Return the response as JSON
                return JsonResponse({"response": message_content})

            except json.JSONDecodeError:
                return JsonResponse({"error": "Invalid JSON"}, status=400)
        else:
            return JsonResponse({"error": "Method not allowed"}, status=405)
    except Ratelimited:
        return JsonResponse({"error": "Rate limit exceeded"}, status=429)


@login_required
@csrf_exempt
@require_GET
@ratelimit(key="user_or_ip", rate="30/m", method=["GET"])
def get_thread_messages(request, thread_id):
    try:
        if request.method == "GET":
            # Log the request for fetching thread messages
            logger.info(
                f"Fetching messages for thread {thread_id} by user {request.user.username}"
            )

            # Get the chat thread
            thread = get_object_or_404(ChatThread, id=int(thread_id), user=request.user)

            # Get all messages for this thread
            messages = thread.messages.all().order_by("created_at")
            messages_list = [
                {
                    "sender": message.sender.username,
                    "content": message.content,
                    "created_at": message.created_at,
                }
                for message in messages
            ]

            # Log successful message retrieval
            logger.info(
                f"Successfully retrieved {len(messages_list)} messages for thread {thread_id} by user {request.user.username}"
            )

            return JsonResponse({"messages": messages_list}, status=200)
        else:
            # Log an invalid request method
            logger.warning(
                f"Invalid method {request.method} for fetching messages in thread {thread_id} by user {request.user.username}"
            )
            return JsonResponse({"error": "Method not allowed"}, status=405)

    except Ratelimited:
        # Log rate limit exceeded
        logger.warning(
            f"Rate limit exceeded for user {request.user.username} while fetching messages for thread {thread_id}"
        )
        return JsonResponse({"error": "Rate limit exceeded"}, status=429)

    except ChatThread.DoesNotExist:
        # Log when the chat thread is not found
        logger.warning(
            f"Chat thread {thread_id} not found for user {request.user.username}"
        )
        return JsonResponse({"error": "Thread not found"}, status=404)

    except Exception as e:
        # Log any unexpected errors
        logger.error(
            f"Unexpected error while fetching messages for thread {thread_id} by user {request.user.username}: {e}",
            exc_info=True,
        )
        return JsonResponse({"error": str(e)}, status=500)


@login_required
@csrf_exempt
@require_POST
@ratelimit(key="user_or_ip", rate="50/h", method=["POST"])
def start_new_thread(request):
    try:
        if request.method == "POST":
            # Log the thread creation attempt
            logger.info(
                f"User {request.user.username} is attempting to start a new thread."
            )

            # Create a new chat thread for the user
            thread = ChatThread.objects.create(user=request.user)

            # Log successful thread creation
            logger.info(
                f"New thread {thread.id} created successfully for user {request.user.username}."
            )

            return JsonResponse({"thread_id": thread.id}, status=201)

        else:
            # Log an invalid request method
            logger.warning(
                f"Invalid method {request.method} used to start a new thread by user {request.user.username}."
            )
            return JsonResponse({"error": "Method not allowed"}, status=405)

    except Ratelimited:
        # Log rate limit exceeded
        logger.warning(
            f"Rate limit exceeded for user {request.user.username} while attempting to start a new thread."
        )
        return JsonResponse({"error": "Rate limit exceeded"}, status=429)

    except Exception as e:
        # Log any unexpected errors
        logger.error(
            f"Unexpected error while starting a new thread for user {request.user.username}: {e}",
            exc_info=True,
        )
        return JsonResponse({"error": str(e)}, status=500)


@login_required
@require_GET
@csrf_exempt
@ratelimit(key="user_or_ip", rate="50/h", method=["GET"])
def get_user_threads(request):
    try:
        # Log the attempt to retrieve threads
        logger.info(f"User {request.user.username} is retrieving their chat threads.")

        # Retrieve all chat threads for the logged-in user
        threads = ChatThread.objects.filter(user=request.user)

        # Serialize the threads
        thread_data = [
            {
                "id": thread.id,
                "title": thread.title,
                "created_at": thread.created_at,
                "updated_at": thread.updated_at,
            }
            for thread in threads
        ]

        # Log successful retrieval of threads
        logger.info(
            f"User {request.user.username} successfully retrieved {len(thread_data)} threads."
        )

        # Return the threads as JSON
        return JsonResponse({"threads": thread_data})

    except Ratelimited:
        # Log rate limit exceeded
        logger.warning(
            f"Rate limit exceeded for user {request.user.username} while retrieving threads."
        )
        return JsonResponse({"error": "Rate limit exceeded"}, status=429)

    except Exception as e:
        # Log any unexpected errors
        logger.error(
            f"Unexpected error while retrieving threads for user {request.user.username}: {e}",
            exc_info=True,
        )
        return JsonResponse({"error": str(e)}, status=500)


@login_required
@csrf_exempt
@ratelimit(key="user_or_ip", rate="50/h", method=["PUT"])
def update_thread_title(request, thread_id):
    try:
        if request.method == "PUT":
            try:
                data = json.loads(request.body)
                new_title = data.get("title")

                if not new_title:
                    # Log missing title data
                    logger.warning(
                        f"User {request.user.username} attempted to update thread {thread_id} without providing a title."
                    )
                    return JsonResponse({"error": "No title provided"}, status=400)

                # Get the chat thread
                thread = get_object_or_404(
                    ChatThread, id=int(thread_id), user=request.user
                )

                # Log the attempt to update the thread title
                logger.info(
                    f"User {request.user.username} is updating thread {thread_id}'s title to '{new_title}'."
                )

                # Update the thread's title
                thread.title = new_title
                thread.save()

                # Log successful title update
                logger.info(
                    f"User {request.user.username} successfully updated thread {thread_id}'s title."
                )

                return JsonResponse(
                    {"status": "Title updated successfully"}, status=200
                )

            except json.JSONDecodeError:
                # Log invalid JSON data
                logger.error(
                    f"User {request.user.username} sent invalid JSON while updating thread {thread_id}."
                )
                return JsonResponse({"error": "Invalid JSON"}, status=400)
        else:
            # Log invalid request method
            logger.warning(
                f"Invalid method {request.method} used by user {request.user.username} to update thread {thread_id}."
            )
            return JsonResponse({"error": "Method not allowed"}, status=405)

    except Ratelimited:
        # Log rate limit exceeded
        logger.warning(
            f"Rate limit exceeded for user {request.user.username} while attempting to update thread {thread_id}."
        )
        return JsonResponse({"error": "Rate limit exceeded"}, status=429)

    except Exception as e:
        # Log any unexpected errors
        logger.error(
            f"Unexpected error while updating thread {thread_id} for user {request.user.username}: {e}",
            exc_info=True,
        )
        return JsonResponse({"error": str(e)}, status=500)


@login_required
@csrf_exempt
@ratelimit(key="user_or_ip", rate="50/h", method=["DELETE"])
def delete_thread(request, thread_id):
    try:
        if request.method == "DELETE":
            # Log the attempt to delete the thread
            logger.info(
                f"User {request.user.username} is attempting to delete thread {thread_id}."
            )

            # Retrieve the chat thread
            thread = get_object_or_404(ChatThread, id=int(thread_id), user=request.user)

            # Delete the chat thread
            thread.delete()

            # Log successful deletion
            logger.info(
                f"User {request.user.username} successfully deleted thread {thread_id}."
            )

            return JsonResponse({"status": "Thread deleted successfully"}, status=200)
        else:
            # Log invalid request method
            logger.warning(
                f"Invalid method {request.method} used by user {request.user.username} to delete thread {thread_id}."
            )
            return JsonResponse({"error": "Method not allowed"}, status=405)

    except Ratelimited:
        # Log rate limit exceeded
        logger.warning(
            f"Rate limit exceeded for user {request.user.username} while attempting to delete thread {thread_id}."
        )
        return JsonResponse({"error": "Rate limit exceeded"}, status=429)

    except Exception as e:
        # Log any unexpected errors
        logger.error(
            f"Unexpected error while deleting thread {thread_id} for user {request.user.username}: {e}",
            exc_info=True,
        )
        return JsonResponse({"error": str(e)}, status=500)


@login_required
@csrf_exempt
@ratelimit(key="user_or_ip", rate="50/h", method=["DELETE"])
def delete_all_threads(request):
    try:
        if request.method == "DELETE":
            # Log the attempt to delete all threads
            logger.info(
                f"User {request.user.username} is attempting to delete all threads."
            )

            # Retrieve all chat threads for the current user
            threads = ChatThread.objects.filter(user=request.user)

            # Count the number of threads to be deleted
            thread_count = threads.count()

            # Delete all retrieved chat threads
            threads.delete()

            # Log the number of deleted threads
            logger.info(
                f"User {request.user.username} successfully deleted {thread_count} threads."
            )

            return JsonResponse(
                {"status": f"Successfully deleted {thread_count} threads"}, status=200
            )
        else:
            # Log invalid request method
            logger.warning(
                f"Invalid method {request.method} used by user {request.user.username} to delete all threads."
            )
            return JsonResponse({"error": "Method not allowed"}, status=405)

    except Ratelimited:
        # Log rate limit exceeded
        logger.warning(
            f"Rate limit exceeded for user {request.user.username} while attempting to delete all threads."
        )
        return JsonResponse({"error": "Rate limit exceeded"}, status=429)

    except Exception as e:
        # Log any unexpected errors
        logger.error(
            f"Unexpected error while deleting all threads for user {request.user.username}: {e}",
            exc_info=True,
        )
        return JsonResponse({"error": str(e)}, status=500)
