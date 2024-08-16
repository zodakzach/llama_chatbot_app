from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from .models import ChatThread, ChatMessage
import json

User = get_user_model()


class ChatViewsTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username="testuser", email="testuser@example.com", password="testpassword"
        )
        self.client.login(username="testuser", password="testpassword")

        # Create a chat thread for the user
        self.thread = ChatThread.objects.create(user=self.user)
        self.thread_id = self.thread.id

    def test_start_new_thread(self):
        response = self.client.post(reverse("start_new_thread"))
        self.assertEqual(response.status_code, 201)
        self.assertIn("thread_id", json.loads(response.content))

    def test_get_user_threads(self):
        response = self.client.get(reverse("get_user_threads"))
        self.assertEqual(response.status_code, 200)
        threads = json.loads(response.content)["threads"]
        self.assertGreater(len(threads), 0)
        self.assertEqual(threads[0]["id"], self.thread_id)

    def test_get_thread_messages(self):
        ChatMessage.objects.create(thread=self.thread, sender="user", content="Hello")
        ChatMessage.objects.create(
            thread=self.thread, sender="bot", content="Hi there!"
        )

        response = self.client.get(
            reverse("get_thread_messages", args=[self.thread_id])
        )
        self.assertEqual(response.status_code, 200)
        messages = json.loads(response.content)["messages"]
        self.assertGreater(len(messages), 0)
        self.assertEqual(messages[0]["content"], "Hello")

    def test_chat_with_model(self):
        response = self.client.post(
            reverse("chat_with_model", args=[self.thread_id]),
            data=json.dumps({"message": "Hello"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("response", json.loads(response.content))

    # def test_chat_with_model_stream(self):
    #     response = self.client.post(reverse('chat_with_model_stream', args=[self.thread_id]), data=json.dumps({'message': 'Hello'}), content_type='application/json')
    #     self.assertEqual(response.status_code, 200)

    def test_update_thread_title(self):
        response = self.client.put(
            reverse("update_thread_title", args=[self.thread_id]),
            data=json.dumps({"title": "New Title"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.thread.refresh_from_db()
        self.assertEqual(self.thread.title, "New Title")

    def test_delete_thread(self):
        response = self.client.post(reverse("delete_thread", args=[self.thread_id]))
        self.assertEqual(response.status_code, 200)
        self.assertFalse(ChatThread.objects.filter(id=self.thread_id).exists())

    def test_invalid_message(self):
        response = self.client.post(
            reverse("chat_with_model", args=[self.thread_id]),
            data=json.dumps({"message": ""}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(json.loads(response.content)["error"], "No message provided")

    def test_invalid_json(self):
        response = self.client.post(
            reverse("chat_with_model", args=[self.thread_id]),
            data="invalid_json",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(json.loads(response.content)["error"], "Invalid JSON")
