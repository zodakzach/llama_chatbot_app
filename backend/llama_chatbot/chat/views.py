from django.http import JsonResponse, StreamingHttpResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST, require_GET
import ollama
from django.views.decorators.csrf import csrf_exempt
import json
from .models import ChatThread, ChatMessage
from django.shortcuts import get_object_or_404
from ollama import Client
from .utils import truncate_context

@login_required
@require_POST
@csrf_exempt
def chat_with_model_stream(request, thread_id):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user_message = data.get("message")

            if not user_message:
                return JsonResponse({"error": "No message provided"}, status=400)

            # Retrieve the chat thread
            thread = get_object_or_404(ChatThread, id=thread_id, user=request.user)

            # Create and save the user message
            ChatMessage.objects.create(
                thread=thread, sender="user", content=user_message
            )

            # Define the generator to stream the response
            def stream_response():
                stream = ollama.chat(
                    model="llama3.1",
                    messages=[{"role": "user", "content": user_message}],
                    stream=True,
                )
                for chunk in stream:
                    message_content = chunk["message"]["content"]
                    # Save the bot's response as it arrives
                    ChatMessage.objects.create(
                        thread=thread, sender="bot", content=message_content
                    )
                    yield message_content

            # Create and return the streaming response
            return StreamingHttpResponse(stream_response(), content_type="text/plain")

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

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
            
            context_str = truncate_context(user_message)

            # Retrieve the chat thread
            thread = get_object_or_404(ChatThread, id=int(thread_id), user=request.user)

            client = Client(host="http://localhost:11434")

            # Get the response from the model
            response = client.chat(
                model="llama3.1", messages=[{"role": "user", "content": context_str}]
            )

            # Extract the content from the response
            message_content = response.get("message", {}).get("content", "")

            messages = user_message.split('\n')

            # Find the last user message
            last_user_message = ''
            for msg in reversed(messages):
                if msg.startswith('user:'):
                    last_user_message = msg[len('user:'):].strip()
                    break

            # Create and save the user message
            ChatMessage.objects.create(
                thread=thread, sender="user", content=last_user_message
            )

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
