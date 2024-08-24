from django.http import JsonResponse, StreamingHttpResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST, require_GET
from django.views.decorators.csrf import csrf_exempt
import json
from .models import ChatThread, ChatMessage
from django.shortcuts import get_object_or_404
from ollama import Client
from . import ollama_utils
import threading


@login_required
@require_POST
@csrf_exempt
def chat_with_model_stream(request, thread_id):
    if request.method == "POST":
        cancellation_event = threading.Event()  # Per-request cancellation event

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

            # Create a generator to stream the response
            response_generator = ollama_utils.stream_response(request, model_name="llama3.1", message={"role": "user", "content": context_str}, thread=thread, cancellation_event=cancellation_event)

            # Return a StreamingHttpResponse to stream data back to the client
            response = StreamingHttpResponse(response_generator, content_type='text/plain')
            response['Cache-Control'] = 'no-cache'
            return response

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)
        except (ConnectionError, BrokenPipeError) as e:
            print(f"Connection error occurred: {e}")
            return JsonResponse({"error": "Connection error occurred"}, status=500)
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            return JsonResponse({"error": "An unexpected error occurred"}, status=500)

    return JsonResponse({"error": "Method not allowed"}, status=405)

@login_required
@require_POST
@csrf_exempt
def chat_with_model(request, thread_id):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user_message = data.get("message")

            if not user_message:
                return JsonResponse({"error": "No message provided"}, status=400)

            context_str = ollama_utils.truncate_context(user_message)

            # Retrieve the chat thread
            thread = get_object_or_404(ChatThread, id=int(thread_id), user=request.user)

            # Save the user message
            ollama_utils.save_user_message(thread, user_message)

            try:
                # Initialize the Client
                client = Client(host="http://localhost:11434")

                try:
                    # Get the response from the model
                    response = client.chat(
                        model="llama3.1", messages=[{"role": "user", "content": context_str}]
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

    return JsonResponse({"error": "Method not allowed"}, status=405)


@login_required
@csrf_exempt
def get_thread_messages(request, thread_id):
    if request.method == "GET":
        # Get the chat thread
        thread = get_object_or_404(ChatThread, id=int(thread_id), user=request.user)

        # Get all messages for this thread
        messages = thread.messages.all().order_by("created_at")
        messages_list = [
            {
                "sender": message.sender,
                "content": message.content,
                "created_at": message.created_at,
            }
            for message in messages
        ]

        return JsonResponse({"messages": messages_list}, status=200)


@login_required
@csrf_exempt
def start_new_thread(request):
    if request.method == "POST":
        # Create a new chat thread for the user
        thread = ChatThread.objects.create(user=request.user)
        return JsonResponse({"thread_id": thread.id}, status=201)


@login_required
@require_GET
@csrf_exempt
def get_user_threads(request):
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

    # Return the threads as JSON
    return JsonResponse({"threads": thread_data})


@login_required
@csrf_exempt
def update_thread_title(request, thread_id):
    if request.method == "PUT":
        try:
            data = json.loads(request.body)
            new_title = data.get("title")

            if not new_title:
                return JsonResponse({"error": "No title provided"}, status=400)

            # Get the chat thread
            thread = get_object_or_404(ChatThread, id=int(thread_id), user=request.user)

            # Update the thread's title
            thread.title = new_title
            thread.save()

            return JsonResponse({"status": "Title updated successfully"}, status=200)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

    return JsonResponse({"error": "Method not allowed"}, status=405)


@login_required
@csrf_exempt
def delete_thread(request, thread_id):
    if request.method == "DELETE":
        # Retrieve the chat thread
        thread = get_object_or_404(ChatThread, id=int(thread_id), user=request.user)

        # Delete the chat thread
        thread.delete()

        return JsonResponse({"status": "Thread deleted successfully"}, status=200)

    return JsonResponse({"error": "Method not allowed"}, status=405)


@login_required
@csrf_exempt
def delete_all_threads(request):
    if request.method == "DELETE":
        # Retrieve all chat threads for the current user
        threads = ChatThread.objects.filter(user=request.user)
        
        # Delete all retrieved chat threads
        thread_count = threads.count()
        threads.delete()

        return JsonResponse({"status": f"Successfully deleted {thread_count} threads"}, status=200)

    return JsonResponse({"error": "Method not allowed"}, status=405)