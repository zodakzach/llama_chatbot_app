from django.urls import path
from . import views

urlpatterns = [
    path(
        "streaming-response/<int:thread_id>/",
        views.chat_with_model_stream,
        name="chat_with_model_stream",
    ),
    path("response/<int:thread_id>/", views.chat_with_model, name="chat_with_model"),
    # Get all messages for a specific thread
    path(
        "threads/<int:thread_id>/messages/",
        views.get_thread_messages,
        name="get_thread_messages",
    ),
    # Start a new chat thread
    path("threads/new/", views.start_new_thread, name="start_new_thread"),
    # Get all threads for the logged-in user
    path("threads/", views.get_user_threads, name="get_user_threads"),
    # Update the title of a specific thread
    path(
        "threads/<int:thread_id>/update-title/",
        views.update_thread_title,
        name="update_thread_title",
    ),
    # Delete a specific thread
    path("threads/<int:thread_id>/delete/", views.delete_thread, name="delete_thread"),
]
